# Feature — `quotes`

**Statut : ⬜ À faire.** Phase 2 — Conversion.

## Objet

Devis (spec §57), avec deux canaux d'entrée qui convergent tous deux vers l'entité `Quote` :
une demande sur-mesure classique (spec §16, page `demande-sur-mesure`) et un dossier de
conception issu du configurateur de personnalisation (spec §9, page
`personnalisation-creation`). Cycle de vie complet (spec §17) :
`Demande → Analyse → Proposition → Acceptation → Acompte → Production`. La tarification
("Proposition", passage `DRAFT` → `SENT`) reste une action interne staff sans maquette
Stitch dédiée à ce jour, même limitation que `creations`/`appointments`.

## Emplacement Clean Architecture

`apps/api/src/quotes/`

```
domain/
  entities/quote.entity.ts                → invariants métier (subtotal = Σ lineItemsJson, deposit+balance = total)
  repositories/quote.repository.ts        → interface IQuoteRepository (zéro import Prisma)
  value-objects/quote-number.vo.ts        → génère/valide la référence unique (ex. ANG-DEV-2026-00001)
  value-objects/quote-status-transition.vo.ts → matrice de transitions valides (DRAFT→SENT→VIEWED→ACCEPTED/REJECTED, →EXPIRED)
application/
  use-cases/
    create-quote-from-sur-mesure-request.use-case.ts → intake `demande-sur-mesure` (3 étapes), statut initial DRAFT
    create-quote-from-design-brief.use-case.ts        → intake `personnalisation-creation` (options + notes + médias), statut DRAFT
    update-quote-draft.use-case.ts                    → sauvegarde incrémentale d'un dossier de conception (brouillon uniquement)
    send-quote.use-case.ts                            → staff : tarifie (lineItemsJson, subtotal, deposit/balance, total, validUntil) et passe DRAFT → SENT
    get-quote-by-number.use-case.ts                   → transition SENT → VIEWED à la première consultation client
    accept-quote.use-case.ts                          → transition SENT/VIEWED → ACCEPTED
    reject-quote.use-case.ts                          → transition SENT/VIEWED → REJECTED
    request-quote-change.use-case.ts                  → message libre transmis au staff, ne change pas le statut persisté
    export-quote-pdf.use-case.ts                      → génère le PDF, upload via `media`
  dtos/
    quote-response.dto.ts
    sur-mesure-request.dto.ts
    design-brief.dto.ts
infrastructure/
  repositories/prisma-quote.repository.ts → implémente IQuoteRepository via PrismaService
  services/quote-pdf.service.ts           → rendu PDF (le fichier généré est uploadé via `media`, jamais stocké en base)
  mappers/quote.mapper.ts
presentation/
  controllers/quotes.controller.ts
__tests__/
  unit/create-quote-from-sur-mesure-request.use-case.spec.ts
  unit/accept-quote.use-case.spec.ts
  unit/quote-status-transition.vo.spec.ts
  integration/quotes.controller.spec.ts
```

## Modèles Prisma

`Quote` (`quoteNumber` unique, `customerId`, `creationId?`, `description`, `lineItemsJson`,
`subtotal`, `depositAmount`, `balanceAmount`, `total` — tous `Decimal(12,2)`, `status` —
enum `QuoteStatus`, `validUntil?`, `estimatedDelayDays?`). Relations : `Customer`,
`Creation?` (référence optionnelle au modèle de base personnalisé, `null` pour une demande
sur-mesure sans réalisation existante comme point de départ).

## Cas d'usage clés

- Créer un devis brouillon depuis une demande sur-mesure complète (les 3 étapes du
  formulaire soumises en un seul appel, `creationId = null`)
- Créer un devis brouillon depuis un dossier de conception de personnalisation
  (`creationId` renseigné, options/notes/médias dans `description`/`lineItemsJson`), avec
  sauvegarde incrémentale possible tant que `status = DRAFT`
- Tarifier et envoyer un devis (staff) : renseigne `lineItemsJson`/`subtotal`/
  `depositAmount`/`balanceAmount`/`total`/`validUntil`/`estimatedDelayDays`, transition
  `DRAFT` → `SENT`
- Consulter un devis par `quoteNumber` (transition automatique `SENT` → `VIEWED` à la
  première consultation client, jamais si déjà `VIEWED`/`ACCEPTED`/`REJECTED`)
- Accepter/refuser un devis (transitions vers `ACCEPTED`/`REJECTED`)
- Demander une modification (message libre transmis au staff — n'existe pas comme statut
  dédié dans `QuoteStatus`, voir Points d'attention)
- Exporter le devis en PDF

## Endpoints exposés

| Méthode | Route | Use-case | Auth |
| --- | --- | --- | --- |
| `POST` | `/api/quotes/requests` | `create-quote-from-sur-mesure-request` | Public (enrichi si `CLIENT` connecté) |
| `POST` | `/api/quotes/design-briefs` | `create-quote-from-design-brief` | `CLIENT` |
| `PATCH` | `/api/quotes/design-briefs/:id` | `update-quote-draft` | `CLIENT` (propriétaire) |
| `POST` | `/api/quotes/:quoteNumber/send` | `send-quote` | `MANAGER`,`ADMIN` |
| `GET` | `/api/quotes/:quoteNumber` | `get-quote-by-number` | `CLIENT` (propriétaire) |
| `POST` | `/api/quotes/:quoteNumber/accept` | `accept-quote` | `CLIENT` (propriétaire) |
| `POST` | `/api/quotes/:quoteNumber/reject` | `reject-quote` | `CLIENT` (propriétaire) |
| `POST` | `/api/quotes/:quoteNumber/request-change` | `request-quote-change` | `CLIENT` (propriétaire) |
| `GET` | `/api/quotes/:quoteNumber/pdf` | `export-quote-pdf` | `CLIENT` (propriétaire) |

## Points d'intégration

- **`creations`** : `Quote.creationId` référence en lecture seule le modèle de base d'une
  personnalisation ; ce module n'écrit jamais dans `Creation`.
- **`customers`** : `Quote.customerId` obligatoire — un visiteur non connecté soumettant une
  demande sur-mesure (spec §16, formulaire public) doit d'abord créer/lier un compte, ou le
  devis reste orphelin jusqu'à association manuelle par le staff (à trancher explicitement à
  l'implémentation, ce module ne suppose pas d'auto-création de `Customer`).
- **`media`** : photos d'inspiration du dossier de conception et PDF généré passent par le
  module `media`/`packages/storage`, jamais un accès direct.
- **`notifications`** (Phase 3) : `send-quote`/`accept-quote`/`reject-quote`/
  `request-quote-change` déclenchent chacun une notification (spec §84) une fois le module
  livré ; TODO explicite en attendant.
- **Pages consommatrices** : `demande-sur-mesure`, `personnalisation-creation`, `devis`,
  `sur-mesure-process` (contenu éditorial uniquement, pas d'écriture).

## Points d'attention

- `QuoteStatus` ne contient pas d'état "modification demandée" (spec §57 liste pourtant
  "modifier" comme action) : `request-quote-change` ne fait donc pas transitionner
  `Quote.status`, elle se contente de transmettre le message au staff (canal
  `notifications`) — le devis reste `SENT`/`VIEWED` jusqu'à ce que le staff renvoie une
  nouvelle version via `send-quote`. Ne pas inventer un statut hors schéma pour ce cas.
- `Quote.customerId` est une FK obligatoire (non nullable) alors que le formulaire
  `demande-sur-mesure` est accessible publiquement sans compte (spec §16) : la résolution de
  ce point (compte requis avant soumission, ou création d'un compte `CLIENT` minimal à la
  volée via `auth`) doit être tranchée avant d'implémenter `create-quote-from-sur-mesure-request`
  — actuellement non spécifiée ailleurs dans la documentation.

## Vérification

- [ ] `quote-status-transition.vo` testé pour toutes les transitions valides/invalides
- [ ] `create-quote-from-sur-mesure-request`/`create-quote-from-design-brief` testés
      (statut initial `DRAFT`, `creationId` correct selon l'origine)
- [ ] `accept-quote`/`reject-quote` testés (refus si statut déjà terminal)
- [ ] `quotes.controller.spec.ts` couvre les codes 200/201/403/404/409 (transition invalide)
- [ ] `docs/checklist-implementation.md` : `quotes` passé à ✅
