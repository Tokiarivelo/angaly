# Page — `devis`

**Statut : ⬜ À faire.** Phase 2 — Conversion.

## Objet

Consultation d'un devis formel envoyé au client pour un projet sur mesure (spec §17, §57) :
récapitulatif du projet, lignes de prestation, totaux (acompte/solde), et actions
accepter/demander une modification/refuser, avec une frise de statut du cycle de vie du devis
(`Demande de devis → Analyse → Proposition → Acceptation → Acompte → Production`).

## Route(s)

`apps/web/src/app/(client)/devis/[quoteNumber]/page.tsx` → `/devis/:quoteNumber`

Server Component pour le chargement initial (document consultable, SEO non pertinent car
authentifié) ; les actions (accepter, refuser, demander une modification) sont des Client
Components isolés.

## Référence maquette

- Prompt Stitch : `stitch-prompts/13-devis.md`
- Écran Stitch : **ANGALY — Devis #ANG-DEV-2026-014**
- Section spécification : §17, §57 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/devis/
  ui/
    DevisPage.tsx              → orchestre le document + les actions
    DocumentHeaderCard.tsx     → logo, numéro, date, badge de statut, validité
    ClientProjectInfoRow.tsx   → colonnes Client / Projet
    LineItemsTable.tsx         → table des prestations (desktop) / liste empilée (mobile)
    TotalsBlock.tsx            → sous-total, acompte requis, solde, total, délai estimé
    QuoteActionsBar.tsx        → Accepter / Demander une modification / Refuser / Télécharger PDF
    QuoteStatusTimeline.tsx    → frise horizontale du cycle de vie du devis
    RequestChangeModal.tsx     → 'use client' (message vers Angaly, état vient de useRequestQuoteChange())
  hooks/
    useQuote.ts                → charge le devis par `quoteNumber` via react-query
    useAcceptQuote.ts          → mutation d'acceptation
    useRejectQuote.ts          → mutation de refus
    useRequestQuoteChange.ts   → mutation d'envoi d'un message de modification
    useDownloadQuotePdf.ts     → déclenche le téléchargement du PDF généré
  api/
    quotes.api.ts              → useQuoteQuery, useAcceptQuoteMutation, useRejectQuoteMutation,
                                    useRequestQuoteChangeMutation
  consts/
    quote-status-labels.const.ts → libellés + tons (Info/Success/Error/Slate) par `QuoteStatus`
  __tests__/
    useQuote.test.ts
    useAcceptQuote.test.ts
    DevisPage.test.tsx
  index.ts
```

`DevisPage.tsx` et les composants `ui/` restent purement présentationnels ; le chargement du
devis et les mutations d'action vivent dans `hooks/`.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/quotes/:quoteNumber` | `quotes` | Détail complet du devis (client, projet, lignes, totaux, statut) |
| `POST /api/quotes/:quoteNumber/accept` | `quotes` | Acceptation (transition `SENT`/`VIEWED` → `ACCEPTED`) |
| `POST /api/quotes/:quoteNumber/reject` | `quotes` | Refus (transition → `REJECTED`) |
| `POST /api/quotes/:quoteNumber/request-change` | `quotes` | Envoi d'une demande de modification (message libre) |
| `GET /api/quotes/:quoteNumber/pdf` | `quotes` | Téléchargement du devis au format PDF |

## Modèles Prisma touchés

`Quote` (`quoteNumber`, `status` — enum `QuoteStatus`, `lineItemsJson`, `subtotal`,
`depositAmount`, `balanceAmount`, `total`, `validUntil`, `estimatedDelayDays`), `Customer`
(colonne Client), `Creation` (colonne Projet, relation optionnelle).

## Points d'attention

- Le badge de statut doit respecter le mapping de tons du prompt Stitch : Info (`SENT`,
  `VIEWED`), Success (`ACCEPTED`), Error (`REJECTED`, `EXPIRED`), Slate (`DRAFT`) — factoriser
  ce mapping dans `quote-status-labels.const.ts` pour rester cohérent avec la frise de statut.
- "Consulter" un devis (passage `SENT` → `VIEWED`) doit être déclenché côté serveur au premier
  chargement authentifié de la page, pas par une action utilisateur explicite.
- Une fois `status = ACCEPTED`, remplacer le bouton "Accepter le devis" par un bandeau de
  confirmation en ton Success — ne jamais laisser les deux actions "Accepter"/"Refuser"
  visibles après une décision déjà prise.
- Le lien "Refuser le devis" reste en style texte bas-contraste (ton Error) — ne pas en faire
  un bouton de même poids visuel que "Accepter le devis", conformément au prompt Stitch.
- La frise de statut (`QuoteStatusTimeline`) est purement informative : elle ne reflète pas
  un-à-un l'enum `QuoteStatus` (qui n'a pas d'état "Analyse"/"Proposition"/"Acompte"
  explicite) — la mapper à l'implémentation sur les transitions réelles disponibles côté
  `quotes` (voir le futur `docs/features/quotes.md`).
- Cette page est aussi potentiellement accessible en contexte espace client (breadcrumb "Mon
  compte / Mes devis / Devis #...") — vérifier la cohérence avec la fiche `mes-favoris` et le
  futur dashboard client pour le style d'en-tête à réutiliser.

## Checklist d'acceptation

- [ ] Reproduit fidèlement `stitch-prompts/13-devis.md` (carte document, table de lignes, totaux, actions, frise de statut)
- [ ] Badge de statut affiche le bon ton pour chacun des 6 statuts `QuoteStatus`
- [ ] Table de lignes devient une liste empilée lisible sur mobile (label au-dessus de la valeur)
- [ ] Actions Accepter/Refuser/Demander une modification appellent bien les mutations correspondantes et mettent à jour l'UI sans rechargement
- [ ] Téléchargement PDF fonctionnel
- [ ] Accès refusé pour un client qui n'est pas propriétaire du devis (403/redirection)
- [ ] Tests : `useQuote.test.ts`, `useAcceptQuote.test.ts`, `DevisPage.test.tsx`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
