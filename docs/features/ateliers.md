# Feature — `ateliers`

**Statut : ⬜ À faire.** Phase 1 — Présence digitale.

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

## Vérification

- [ ] `get-atelier-by-slug` testé (cas trouvé/non trouvé, horaires parsés correctement)
- [ ] `ateliers.controller.spec.ts` couvre les codes 200/404
- [ ] `docs/checklist-implementation.md` : `ateliers` passé à ✅
