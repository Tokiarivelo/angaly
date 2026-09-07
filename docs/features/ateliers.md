# Feature — `ateliers`

**Statut : ✅ Fait.** Phase 1 — Présence digitale.

## Objet

Fiches des ateliers physiques de la maison (adresse, horaires, services, géolocalisation
pour la carte interactive — spec §37-38). Lecture seule côté public en Phase 1 ; sert aussi
de source à `contact` (sélecteur d'atelier) et, en Phase 2, à `appointments` (calcul des
créneaux disponibles).

## Emplacement Clean Architecture

`apps/api/src/ateliers/`

```
domain/
  entities/atelier.entity.ts             → invariants métier (slug non vide, coordonnées cohérentes)
  repositories/atelier.repository.ts     → interface IAtelierRepository (zéro import Prisma)
  value-objects/opening-hours.vo.ts      → parse/valide la forme de openingHoursJson
application/
  use-cases/
    list-ateliers.use-case.ts            → tri ville/nom, pas de pagination (volume attendu faible)
    get-atelier-by-slug.use-case.ts       → avec médias ordonnés et horaires typés
  dtos/atelier-response.dto.ts
infrastructure/
  repositories/prisma-atelier.repository.ts → implémente IAtelierRepository via PrismaService
  mappers/atelier.mapper.ts                 → Prisma model → domain entity → DTO
presentation/
  controllers/ateliers.controller.ts
__tests__/
  unit/get-atelier-by-slug.use-case.spec.ts
  integration/ateliers.controller.spec.ts
```

## Modèles Prisma

`Atelier` (relations : `Media[]` via `AtelierMedia`, `Product[]` — Phase 2, `Appointment[]`
— Phase 2).

## Cas d'usage clés

- Lister tous les ateliers avec adresse, ville, coordonnées (`latitude`/`longitude`) pour
  la carte interactive (spec §38)
- Récupérer un atelier par `slug` avec ses médias et ses horaires d'ouverture
  (`openingHoursJson`) et services (`servicesJson`) typés côté DTO
- (Hors Phase 1) Exposer les produits disponibles en retrait dans cet atelier une fois
  `products` livré

## Endpoints exposés

| Méthode | Route | Use-case | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/ateliers` | `list-ateliers` | Public |
| `GET` | `/api/ateliers/:slug` | `get-atelier-by-slug` | Public |

## Points d'intégration

- **`media`** : photos d'atelier via `packages/storage`'s `buildPublicUrl()`.
- **`appointments`** (Phase 2) : lecture de `openingHoursJson` pour calculer les créneaux
  disponibles par atelier (spec §34) ; `assignedAppointments`/`Appointment.atelierId`
  dépendent de ce module sans jamais y écrire.
- **`products`** (Phase 2) : `Product.atelierId` optionnel référence l'atelier de retrait.
- **Pages consommatrices** : `nos-ateliers-liste`, `atelier-detail`, `contact` (sélecteur
  d'atelier + carte).

## Points d'attention

`openingHoursJson`/`servicesJson` sont des colonnes `Json` non typées côté Prisma : leur
forme exacte (créneaux par jour, liste de services) doit être définie une fois dans
`@angaly/types` (ex. `AtelierOpeningHours`) et réutilisée par `value-objects/opening-hours.vo.ts`
et par le futur calcul de disponibilité de `appointments` — jamais un `Record<string, unknown>`
laissé libre côté DTO (règle absolue #2).

`POST /api/ateliers/contact-messages` (décision d'architecture de `docs/pages/contact.md`
pour la soumission du formulaire de contact) **n'est pas implémenté** — aucun modèle
`ContactMessage`, aucun use-case, aucun controller. Le frontend (`contact`) le mocke
entièrement via MSW en attendant. À construire ici (use-case simple, envoi d'e-mail/alerte
interne sans forcément écrire en base) ou dans un futur module dédié si un historique
côté back-office est requis — documenter alors ce choix ici.

## Vérification

- [x] `get-atelier-by-slug` testé (cas trouvé/non trouvé, horaires parsés correctement)
- [x] `ateliers.controller.spec.ts` couvre les codes 200/404
- [x] Testé manuellement de bout en bout contre Postgres réel — a révélé que le seed Phase 0
      (`packages/database/prisma/seed.ts`) utilisait une forme libre en français
      (`{lundi_vendredi: '9h-18h', ...}`) incompatible avec le nouveau contrat typé ; corrigé
      dans le même changement (voir Points d'attention)
- [x] `docs/checklist-implementation.md` : `ateliers` passé à ✅

## Points d'attention (implémentation)

- `AtelierOpeningHours`/`AtelierServices` sont maintenant définis dans `@angaly/types`
  (§ "Ateliers" du fichier), avec un miroir local dans
  `domain/value-objects/opening-hours.vo.ts` (le Domain ne dépend pas de `@angaly/types`,
  voir `.cursor/rules/003-nestjs-clean-arch.mdc`). `parseOpeningHours()` valide strictement
  la forme (`{ isOpen, slots: [{ open: "HH:mm", close: "HH:mm" }] }` pour les 7 jours) et
  lève une erreur explicite si `openingHoursJson` ne correspond pas — `parseServices()` est
  volontairement plus permissif (filtre les entrées invalides plutôt que d'échouer), cohérent
  avec le fait que `servicesJson` est nullable côté Prisma.
- `packages/database/prisma/seed.ts` a été mis à jour pour respecter cette forme (et rendu
  réellement idempotent : l'`upsert` applique désormais les mêmes données en `update` qu'en
  `create`, ce qui a révélé le bug — l'ancien `update: {}` ne corrigeait jamais une ligne
  déjà seedée avec l'ancienne forme).
- **Écart d'environnement repéré, non corrigé ici** : la racine `.env` pointe vers des
  identifiants Postgres (`docassist`/...) qui ne correspondent plus au conteneur réellement
  démarré par `docker-compose.yml` (`angaly_user`/`angaly_dev`) ; `apps/api/.env` a les bons
  identifiants et c'est pour ça que l'API démarre correctement malgré tout, mais
  `pnpm --filter @angaly/database db:seed` (qui charge `../../.env` explicitement) échoue
  tant que la racine `.env` n'est pas alignée. À signaler/corriger séparément — pas un
  problème introduit par ce module.
