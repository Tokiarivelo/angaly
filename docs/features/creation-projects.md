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

## Points d'attention

- **Lecture seule côté client.** Rien n'écrit encore dans `CreationProject` : ni création
  (ex. à l'acceptation d'un `Quote`), ni changement d'étape (back-office). À trancher avant de
  livrer la page, sinon elle sera toujours vide.
- Migration écrite à la main (pas de base disponible) — à rejouer avec `pnpm db:migrate`.
