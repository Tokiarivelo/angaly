# Page — `mes-mesures`

**Statut : ⬜ À faire.** Phase 4 — Premium (Angaly Pattern Studio).

## Objet

Espace client de gestion des profils de mesures (`MeasurementProfile`/`Measurement`) : créer,
modifier, dupliquer, supprimer un profil, et le réutiliser pour un nouveau projet Pattern
Studio — données personnelles sensibles à protéger (spec §56).

## Route(s)

`apps/web/src/app/(client)/mes-mesures/page.tsx` → `/mes-mesures`

Server Component pour la liste initiale des profils ; le formulaire de création/édition (état
de saisie par mesure, toggle d'unité) est un Client Component isolé.

## Référence maquette

- Prompt Stitch : `stitch-prompts/27-espace-client-patron-mesures.md` (SCREEN B)
- Écran Stitch : **ANGALY — Mes mesures**
- Section spécification : §22-23, §56 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/mes-mesures/
  ui/
    MesMesuresPage.tsx                → orchestre liste + drawer de formulaire, importe uniquement des hooks + ui
    MeasurementProfileCard.tsx         → nom, date de création, 2-3 mesures clés, actions (Modifier/Dupliquer/Supprimer/Utiliser)
    MeasurementProfileFormDrawer.tsx   → formulaire de création/édition, liste des champs de mesure
    MeasurementFieldRow.tsx            → label + icône "?" (illustration/définition) + input + toggle unité cm/inch + coche de validation
    DeleteProfileConfirmDialog.tsx
    EmptyMeasurementProfilesState.tsx
  hooks/
    useMeasurementProfiles.ts          → liste des profils du client connecté (react-query)
    useMeasurementProfileForm.ts       → react-hook-form + Zod, création/édition
    useDuplicateMeasurementProfile.ts  → mutation de duplication
    useDeleteMeasurementProfile.ts     → mutation de suppression + état de confirmation
  api/
    measurement-profiles.api.ts         → useMeasurementProfilesQuery, useCreate/Update/Duplicate/DeleteMeasurementProfileMutation
  schemas/
    measurement-profile.schema.ts       → Zod, une entrée par clé de mesure (spec §22), bornes plausibles par clé
  consts/
    measurement-fields.const.ts         → définition/illustration/instructions par clé de mesure (TOUR_POITRINE, TOUR_TAILLE, TOUR_HANCHES, LARGEUR_EPAULES, HAUTEUR_POITRINE, LONGUEUR_DOS, LONGUEUR_BRAS, LONGUEUR_VETEMENT, ENTREJAMBE, …)
  __tests__/
    useMeasurementProfiles.test.ts
    useMeasurementProfileForm.test.ts
    useDeleteMeasurementProfile.test.ts
  index.ts
```

Toute logique (chargement des profils, validation Zod, mutations) vit dans `hooks/` —
`MesMesuresPage.tsx` et ses cartes ne contiennent que du JSX + appels de hooks.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/measurement-profiles` | `measurements` | Liste des profils du client |
| `POST /api/measurement-profiles` | `measurements` | Création d'un profil |
| `PATCH /api/measurement-profiles/:id` | `measurements` | Édition (label, unité, valeurs) |
| `POST /api/measurement-profiles/:id/duplicate` | `measurements` | Duplication (spec §56) |
| `DELETE /api/measurement-profiles/:id` | `measurements` | Suppression (avec confirmation) |

## Modèles Prisma touchés

`MeasurementProfile` (`label`, `unit`), `Measurement` (`key`, `valueCm`, un par mesure et par
profil), `Customer`.

## Points d'attention

- Données personnelles sensibles (spec §56) : n'afficher/manipuler que les profils du
  `customerId` du client connecté — le guard "propriétaire" doit être vérifié côté backend
  (module `measurements`), pas seulement masqué côté UI ; ne jamais journaliser les valeurs de
  mesure en clair dans les logs applicatifs.
- L'icône "?" par mesure référence une illustration statique embarquée au frontend (asset,
  pas un `Media` MinIO — il ne s'agit pas de contenu utilisateur) + une définition FR courte,
  voir `measurement-fields.const.ts`.
- "Utiliser pour un nouveau projet" crée un `PatternProject` avec `measurementProfileId`
  pré-rempli puis redirige vers `pattern-studio-landing`/le wizard, l'étape 7 (mesures) étant
  déjà considérée comme validée pour ce profil.
- Toutes les valeurs sont stockées en centimètres dans `Measurement.valueCm` (voir le schéma
  Prisma) même si l'utilisateur saisit en pouces — la conversion cm/inch est un détail
  d'affichage porté par le toggle d'unité, jamais persisté en double.
- Afficher la note de confidentialité ("Vos mesures sont des données personnelles protégées…")
  sur cette page comme sur l'étape 7 du wizard (voir `docs/pages/pattern-studio-wizard.md`).

## Checklist d'acceptation

- [ ] Reproduit `stitch-prompts/27-*.md` (SCREEN B) : liste de profils, vue détail/édition avec toggle cm/inch, note de confidentialité
- [ ] Création, édition, duplication, suppression (avec confirmation) fonctionnelles et scoping par client vérifié côté backend
- [ ] Chaque champ de mesure affiche définition + illustration au clic sur l'icône "?"
- [ ] "Utiliser pour un nouveau projet" enchaîne correctement vers le Pattern Studio
- [ ] Tests : `useMeasurementProfiles.test.ts`, `useMeasurementProfileForm.test.ts`, `useDeleteMeasurementProfile.test.ts`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
