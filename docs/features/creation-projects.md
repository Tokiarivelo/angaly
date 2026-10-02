# creation-projects (Mes créations — spec §53)

Pipeline d'une création sur mesure : Consultation → Conception → Patron → Confection →
Essayage → Terminée. Consommé par la page `mes-creations` (`/mes-creations`).

## Modèle

`CreationProject` (`packages/database`, migration `20260930120000_add_creation_projects`) :
`reference` unique, `customerId`, `title`, `description?`, `stage` (`CreationProjectStage`),
`quoteId?`, `creationId?`, `completedAt?`. Types partagés : `CreationProjectStage`,
`CREATION_PROJECT_STAGES_ORDER`, `CreationProjectDto` dans `@angaly/types`.

## Endpoints (`JwtAuthGuard`, périmètre = client connecté)

- `GET /api/creation-projects` — liste, plus récent d'abord.
- `GET /api/creation-projects/:id` — 404 si inconnu, 403 si propriétaire différent.

## Alimentation

- **Création** : `AcceptQuoteUseCase` appelle `CreateCreationProjectFromQuoteUseCase` après le passage
  du devis à `ACCEPTED` (idempotent : un seul projet par `quoteId`). Titre = description du devis
  (120 car. max), référence `CRP-<année>-<suffixe aléatoire>`, étape initiale `CONSULTATION`.
- **Avancement** : back-office (`COUTURIERE`/`MANAGER`/`ADMIN`).
  - `GET /api/admin/creation-projects?stage=` — tous les projets.
  - `PATCH /api/admin/creation-projects/:id/stage` `{ stage }` — change l'étape ; `completedAt`
    est renseigné en passant à `TERMINEE`, remis à `null` sinon.
- `CreationProjectDto.quoteNumber` : numéro public du devis lié (lien « Voir le devis »).

## Assignation & historique (migration `20261001120000_add_creation_project_assignee_and_history`)

- `CreationProject.assignedToId` → `User` (SetNull) : un membre du staff actif (`COUTURIERE`/`MANAGER`/`ADMIN`) en charge du projet.
- `CreationProjectStageEvent` : une ligne par changement d'étape (`fromStage`, `toStage`, `changedById`), écrite dans la même transaction que `updateStage`.
- `GET /api/admin/creation-projects/:id` (détail + `stageHistory`), `GET …/assignees` (déclaré avant `:id`), `PATCH …/:id/assignee` `{ userId | null }` (400 si l'utilisateur n'est pas du staff actif, 404 si projet inconnu).
- Pas encore : notification à la couturière assignée, filtre « mes projets » — voir handoff.

## Points d'attention

- **Écran back-office** : `/projets-creation` (fiche `docs/pages/admin-projets-creation.md`, écran Stitch `ANGALY Back-office — Projets de création`). Permet de filtrer et faire avancer l'étape de chaque projet sur mesure.
- Devis acceptés **avant** cette livraison : `pnpm --filter @angaly/database db:backfill:creation-projects` crée les projets manquants (idempotent).
- Migration écrite à la main, appliquée et baselinée sur la base dev le 2026-10-01 (`migrate status` à jour, aucun écart avec le schéma).
