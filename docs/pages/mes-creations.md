# Page — `mes-creations`

**Statut : ✅ Fait (lecture client).** Spec §53.

## Objet

Espace client : suivi des pièces sur-mesure du client connecté, de la consultation à l'essayage
(pipeline Consultation → Conception → Patron → Confection → Essayage → Terminée).

## Route(s)

`apps/web/src/app/(client)/mes-creations/page.tsx` → `/mes-creations` (`ROUTES.mesCreations`).
Lien depuis la sidebar et la tuile « Mes créations » du dashboard client.

## Référence maquette

- Écran Stitch : **ANGALY — Mes créations** (généré le 2026-09-30, pas de prompt dans `stitch-prompts/`).
- Écart assumé : la maquette montre une vignette image par carte, la barre de recherche du
  header et les libellés de sous-étape propres à chaque projet ; non repris (le DTO n'expose
  pas d'image, le shell client existant reste celui de l'app, sous-étapes génériques
  Validée / En cours / En attente).

## Composants

```
features/mes-creations/
  ui/ MesCreationsPage, CreationProjectCard, CreationProjectStepper, EmptyCreationProjectsState
  hooks/ useCreationProjects (+ getCreationStepStates), useCreationProjectsFilter
  api/ creation-projects.api.ts
  consts/ creation-project-stage-labels.const.ts
  __tests__/ useCreationProjects.test.ts, MesCreationsPage.test.tsx
```

## Endpoint consommé

`GET /api/creation-projects` — voir `docs/features/creation-projects.md`.

## Comportements

- Filtres Toutes / En cours / Livrées avec compteurs ; états chargement, erreur, vide
  (« Demander un sur-mesure »).
- « Voir le devis » (si `quoteNumber`), « Nous écrire » (`/mes-messages`),
  « Planifier l'essayage » à l'étape `ESSAYAGE`.
