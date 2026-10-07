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

## Nouveau projet sur mesure (session 2026-10-02, ajout)

Route `apps/web/src/app/(admin)/projets-creation/nouveau/page.tsx` → `/projets-creation/nouveau` (`ROUTES.adminNewCreationProject`).
Déclenché par le bouton « Nouveau Projet Sur Mesure » dans `AdminCreationProjectsPage`.

- **Spécification & Maquette** : Spécifié dans `stitch-prompts/32-admin-nouveau-projet-sur-mesure.md`. Vérification StitchMCP : écran non présent dans le projet `3703874896720765754`, tentative de génération en timeout (>180s). Implémenté selon les spécifications strictes du prompt et du skill Haute Couture (`.agents/skills/angaly-design-system/`).
- **Structure de page 2 colonnes (8/12 + 4/12)** :
  - **En-tête** : Fil d'Ariane (`Projets de création / Nouveau projet`), titre `font-heading text-3xl font-serif text-angaly-navy`, sous-titre gris ardoise, bouton secondaire « Annuler ».
  - **Colonne principale (8 cols)** :
    - *Carte 1 — Cliente* : Sélecteur de cliente existante avec recherche/email, bascule inline « + Nouvelle cliente » (prénom, nom, email, téléphone).
    - *Carte 2 — Création* : Titre de la pièce (validation obligatoire avec alerte rouge brique `#A64A43`), pastilles sélectionnables de type de vêtement, occasion, date souhaitée, notes d'atelier & souhaits spécifiques.
    - *Carte 3 — Budget & devis* : Segments de budget (`< 500 000 Ar`, `500 000–1 000 000 Ar`, `1 000 000–2 000 000 Ar`, `Sur devis`), sélecteur de devis lié (optionnel).
    - *Carte 4 — Atelier* : Assignation couturière (liste staff), étape initiale du pipeline (défaut `CONSULTATION`), zone de glisser-déposer de photos d'inspiration avec miniatures et suppression.
  - **Colonne latérale (4 cols sticky)** :
    - *Carte Récapitulatif* : Synthèse en direct (cliente, type de vêtement, budget, date, atelier), mini-stepper horizontal des 6 étapes avec étape active mise en valeur or antique `#936C3E`, bouton primaire plein cadre « Créer le projet » (`#061938`), lien « Enregistrer comme brouillon », note de référence générée automatiquement.
- **Arborescence & tests** :
  - Composant : `AdminNewCreationProjectPage.tsx`
  - Hook : `useAdminNewCreationProject.ts` (gestion des formulaires, photos d'inspiration, mutations react-query)
  - Tests : `AdminNewCreationProjectPage.test.tsx` (7 tests), `useAdminNewCreationProject.test.ts` (7 tests).

## Espace Atelier par étape, notes, médias & passage à l'étape suivante (session 2026-10-02, ajout)

Pour chacune des 6 étapes du pipeline (`CONSULTATION`, `CONCEPTION`, `PATRON`, `CONFECTION`, `ESSAYAGE`, `TERMINEE`), le détail du projet (`/projets-creation/:id`) intègre un espace de travail atelier Haute Couture :
- **Navigation par onglets d'étape** (`CreationProjectStageWorkspace`) :
  - 6 onglets avec pastille d'étape en cours et badge de comptage dynamique des notes et documents.
  - Possibilité de consulter et documenter n'importe quelle étape du projet en toute indépendance de l'étape courante du cycle de vie.
  - En-tête contextuel avec titre de l'étape en typographie serif, pastille « Étape active » ou « Consultation d'étape », et description des opérations d'atelier attendues.
- **Bouton d'avancement rapide à l'étape suivante** :
  - Intégré dans l'en-tête du stepper (`CreationProjectStepper`) sous forme de barre d'avancement rapide « Passer à l'étape suivante : [Étape] → ».
  - Intégré également dans l'espace atelier (`CreationProjectStageWorkspace`) dès lors que l'étape consultée est l'étape active.
  - Gestion des états de chargement (`isUpdatingStage`), transition automatique sur l'ordre officiel `CREATION_PROJECT_STAGES_ORDER` et invalidation du cache react-query.
- **Notes d'atelier d'étape** :
  - Formulaire de saisie multilignes dédié avec libellé contextualisé à l'étape.
  - Horodatage et traçabilité de l'auteur (`authorEmail`).
  - Suppression unitaire d'une note avec retour visuel immédiat.
- **Médias & Documents d'étape** :
  - Zone de glisser-déposer de fichiers (JPG, PNG, PDF).
  - Téléversement direct sécurisé vers MinIO via URL présignée (`POST /media/presigned-upload` + `POST /media/confirm`) avec fallback gracieux local.
  - Grille de cartes avec aperçu visuel (image ou icône document), métadonnées (nom du fichier, taille formatée), lien d'ouverture plein écran (`ExternalLink`) et bouton de suppression (`Trash2`).
- **Mise en valeur dans la barre latérale (`AdminSidebar`)** :
  - Prise en charge des routes imbriquées (`pathname.startsWith(`${item.href}/`)`) afin que « Projets de création » reste illuminé en or antique (`#936C3E`) avec `aria-current="page"` lors de la navigation dans `/projets-creation/:id` ou `/projets-creation/nouveau`.

## Conservation de l'étape par paramètre d'URL & Patronage IA (session 2026-10-02, ajout)

- **Paramètre d'URL `?step=` (et `?stage=`)** :
  - L'étape consultée dans l'espace atelier est automatiquement synchronisée avec l'URL (`?step=consultation`, `?step=conception`, `?step=patron`, etc.) via `window.history.replaceState`.
  - Lors d'un rafraîchissement (`F5`) ou d'un partage de lien direct, l'étape exacte est restaurée sans rechargement de page complet.
  - La route Next.js `apps/web/src/app/(admin)/projets-creation/[id]/page.tsx` est encapsulée dans un `<Suspense>` avec skeleton d'attente pour compatibilité App Router Next.js 15.
- **Génération de patron par IA & Studio de Patronage (`CreationProjectAiPatternModal`)** :
  - Disponible à l'étape `PATRON` depuis l'en-tête et le bandeau contextuel d'atelier.
  - Ouvre une modale Haute Couture dédiée avec sélecteur de type de vêtement (`ROBE`, `JUPE`, `PANTALON`, `VESTE`, `CHEMISE`, `COSTUME`, `ROBE_MARIEE`, `AUTRE`), type de coupe, précisions stylistiques et tableau de mensurations modifiables (avec raccourcis de tailles standard françaises T34 à T48).
  - Appelle `POST /api/admin/creation-projects/:id/generate-pattern` qui sollicite les suggestions de coupe et d'aisance IA (`apps/ai-service`) puis calcule la géométrie déterministe certifiée via `@angaly/pattern-engine`.
  - Attache automatiquement le tracé SVG haute précision aux médias de l'étape `PATRON` et consigne une note technique d'atelier avec le récapitulatif des pièces.
  - Restitue dans la modale : indice de confiance IA, nomenclature des pièces (nom, valeurs de couture, dimensions mm), surface d'étoffe estimée, canevas vectoriel interactif zoomable et bouton de téléchargement direct du fichier `.svg`.

## Endpoints consommés

- `GET /api/admin/creation-projects?stage=` — voir `docs/features/creation-projects.md`.
- `POST /api/admin/creation-projects` — création d'un nouveau projet sur mesure (avec client existant ou inline).
- `GET /api/admin/creation-projects/customers` — recherche/liste des clientes pour assignation de projet.
- `GET /api/admin/creation-projects/quotes` — liste des devis pour association optionnelle.
- `PATCH /api/admin/creation-projects/:id/stage` `{ stage }` — mise à jour de l'étape.
- `GET /api/admin/creation-projects/:id` — détail, historique des étapes, notes d'atelier et médias rattachés.
- `GET /api/admin/creation-projects/assignees` — staff actif assignable.
- `PATCH /api/admin/creation-projects/:id/assignee` `{ userId | null }` — assigner / désassigner.
- `POST /api/admin/creation-projects/:id/notes` `{ stage, content }` — ajouter une note d'atelier pour une étape.
- `DELETE /api/admin/creation-projects/:id/notes/:noteId` — supprimer une note d'atelier.
- `POST /api/admin/creation-projects/:id/media` `{ stage, url, title, fileName, mimeType, sizeBytes }` — ajouter un média à une étape.
- `DELETE /api/admin/creation-projects/:id/media/:mediaId` — supprimer un média d'étape.
- `POST /api/admin/creation-projects/:id/generate-pattern` `{ garmentType, cutType, style, measurements, requestAiSuggestion, saveMedia, addNote }` — générer un patronage géométrique assisté par IA.



