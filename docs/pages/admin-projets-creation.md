# Page — `admin-projets-creation`

**Statut : ✅ Fait.** Spec §53, §67. Phase 6 — Admin (back-office).

## Objet

Écran back-office pour le suivi et l'avancement des créations sur mesure des clientes (pipeline Consultation → Conception → Patron → Confection → Essayage → Terminée). Accessible aux rôles atelier et encadrement (`COUTURIERE`, `MANAGER`, `ADMIN`).

## Route(s)

`apps/web/src/app/(admin)/projets-creation/page.tsx` → `/projets-creation` (`ROUTES.adminCreationProjects`).
Lien direct depuis la barre latérale d'administration (`AdminSidebar`, visible pour tout le staff).

## Référence maquette

- **Écran Stitch** : `ANGALY Back-office — Projets de création` (screen ID `fadeaeb5cacf4d0088c20bde4d9c0f29`, projet Stitch `3703874896720765754`).
- **Conformité visuelle** :
  - En-tête : titre de page avec police serif, sous-titre explicatif, bouton d'action « Nouveau Projet Sur Mesure » vers `/sur-mesure/demande`.
  - Onglets filtres horizontaux : « Tous » + chaque étape du pipeline avec badges de comptage dynamiques.
  - Tableau de données :
    - Référence (`CRP-...`)
    - Création : vignette atelier, titre en gras, nom de la cliente (`Client : ...` résolu via la relation Customer)
    - Devis : numéro public avec lien cliquable vers `/devis/:quoteNumber`
    - Date d'ouverture (« Ouvert le ») formatée en français
    - Pastille d'étape aux couleurs exactes de la maquette Stitch
    - Action : sélecteur de nouvelle étape + bouton « Enregistrer » avec retour visuel d'enregistrement et gestion des erreurs
  - État vide conforme à la maquette lorsque aucun projet ne correspond au filtre actif.
  - Barre de pied de tableau avec pagination et compteur « Affichage de X à Y sur Z projets ».

## Arborescence de composants

```
apps/web/src/features/admin-projets-creation/
  ui/
    AdminCreationProjectsPage.tsx       → page principale (en-tête, filtres, tableau, états de chargement / erreur)
    CreationProjectsFilterChips.tsx     → onglets avec comptages par étape
    CreationProjectsTable.tsx           → conteneur de tableau et pagination
    CreationProjectRow.tsx              → ligne de tableau avec sélecteur d'étape et mutation
    EmptyCreationProjectsState.tsx      → état vide fidèle à la maquette
  hooks/
    useAdminCreationProjects.ts         → requêtes react-query et mutation PATCH
    useAdminCreationProjectsFilter.ts   → filtrage par étape, comptages et pagination
  api/
    admin-creation-projects.api.ts      → appels apiClient GET & PATCH /admin/creation-projects
  consts/
    stage-config.const.ts               → libellés et classes Tailwind des pastilles Stitch
    queryKeys.ts                        → clés react-query
  __tests__/
    useAdminCreationProjects.test.ts
    useAdminCreationProjectsFilter.test.ts
    AdminCreationProjectsPage.test.tsx
  index.ts
```

## Détail projet & assignation (session 2026-10-01, ajout)

Route `apps/web/src/app/(admin)/projets-creation/[id]/page.tsx` → `/projets-creation/:id` (`ROUTES.adminCreationProject(id)`), accessible en cliquant le titre d'une ligne du tableau.

- Fil d'Ariane, en-tête (référence, titre, pastille d'étape, lien « Voir le devis »).
- `CreationProjectStepper` : 6 étapes, terminées cochées, courante en or.
- Carte « Informations » (cliente, ouvert/terminé le, description) et « Historique des étapes » (`CreationProjectHistory`, plus récent d'abord, avec l'email de l'auteur).
- Colonne droite : `CreationProjectAssigneeCard` (« Couturière assignée », select du staff actif + « Assigner », option « Non assignée » pour désassigner) et `CreationProjectStageCard` (« Changer l'étape »).
- Le tableau liste aussi la colonne « Couturière ».
- ⚠️ **Maquette Stitch** : la génération d'un écran « Détail projet » dans Stitch a expiré (timeout) lors de la session ; l'écran a été construit à partir du langage visuel de l'écran liste `fadeaeb5…`. À vérifier/générer dans Stitch puis ajuster (copy, structure) — voir `docs/handoff.md`.

Hooks : `useAdminCreationProject(id)` (détail, assignables, mutations étape + assignation). Tests : `useAdminCreationProject.test.ts`, `AdminCreationProjectDetailPage.test.tsx`.

## Endpoints consommés

- `GET /api/admin/creation-projects?stage=` — voir `docs/features/creation-projects.md`.
- `PATCH /api/admin/creation-projects/:id/stage` `{ stage }` — mise à jour de l'étape.
- `GET /api/admin/creation-projects/:id` — détail + historique des étapes.
- `GET /api/admin/creation-projects/assignees` — staff actif assignable.
- `PATCH /api/admin/creation-projects/:id/assignee` `{ userId | null }` — assigner / désassigner.
