# Page — `mes-projets-patron`

**Statut : ✅ Fait.** Phase 4 — Premium (Angaly Pattern Studio).

## Objet

Espace client listant tous les projets de patron du client connecté (`PatternProject`), avec
leur statut (`PatternStatus`), et permettant d'en ouvrir un, d'en créer un nouveau, ou de
consulter son historique de versions — équivalent côté client de la vue couturière décrite en
spec §66.

## Route(s)

`apps/web/src/app/(client)/mes-projets-patron/page.tsx` → `/mes-projets-patron`

Server Component pour la liste initiale (SSR de la première page de projets), interactions
(ouverture, navigation) hydratées côté client.

## Référence maquette

- Prompt Stitch : `stitch-prompts/27-espace-client-patron-mesures.md` (SCREEN A)
- Écran Stitch : **ANGALY — Mes projets de patron**
- Section spécification : §53, §66 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/mes-projets-patron/
  ui/
    MesProjetsPatronPage.tsx      → orchestre grille de cartes + état vide, importe uniquement des hooks + ui
    PatternProjectCard.tsx         → thumbnail, référence (projectRef), type de vêtement, badge de statut, dernière modification, actions
    PatternProjectStatusBadge.tsx  → mapping PatternStatus → libellé FR + couleur fonctionnelle (Slate/Info/Warning/Success/Navy-champagne/Gris)
    EmptyPatternProjectsState.tsx  → état vide + CTA "Créer mon premier patron"
  hooks/
    usePatternProjects.ts          → liste des projets du client connecté (react-query)
    useOpenPatternProject.ts       → résout la route de destination selon l'avancement du projet
  api/
    pattern-projects.api.ts         → usePatternProjectsQuery
  consts/
    pattern-status-labels.const.ts  → libellés/couleurs par PatternStatus
  __tests__/
    usePatternProjects.test.ts
    useOpenPatternProject.test.ts
  index.ts
```

Toute logique (chargement de la liste, résolution de la route d'ouverture selon le statut) vit
dans `hooks/` — `MesProjetsPatronPage.tsx` et `PatternProjectCard.tsx` ne contiennent que du
JSX + appels de hooks.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/pattern-projects?mine=true` | `patterns` | Liste des projets du client connecté |
| `GET /api/pattern-projects/:id/versions` | `patterns` | Nombre de versions affiché sur "Voir l'historique des versions" |
| `POST /api/pattern-projects` | `patterns` | Bouton "Nouveau projet" |

## Modèles Prisma touchés

`PatternProject` (`projectRef`, `garmentType`, `status`, `updatedAt`), `PatternVersion`
(comptage pour l'historique), `Customer`.

## Points d'attention

- "Ouvrir le projet" doit rediriger vers `/pattern-studio/wizard/:projectId` si le projet est
  encore `DRAFT` sans version générée, ou vers `/pattern-studio/projects/:projectId` (page
  `pattern-studio-preview-validation-export`) dès qu'une génération existe — logique centralisée
  dans `useOpenPatternProject.ts`, jamais dupliquée dans le JSX.
- "Nouveau projet" (bouton haut de page) suit exactement le même flux que le CTA de
  `pattern-studio-landing`.
- Cette page appartient à l'espace client général et garde la palette ANGALY standard (avec
  liseré champagne signalant le Premium sur les cartes) — seule la sous-arborescence
  `(client)/pattern-studio/*` porte l'identité visuelle sombre dédiée (voir
  `stitch-prompts/16-*.md`).
- L'endpoint `GET /api/pattern-projects?mine=true` (liste filtrée par client) n'est pas encore
  listé dans `docs/features/patterns.md` (qui documente aujourd'hui create/update/generate/
  request-review/export) — à ajouter lors de la prochaine session sur ce module.

## Checklist d'acceptation

- [ ] Reproduit `stitch-prompts/27-*.md` (SCREEN A) : grille de cartes projet, badges de statut par couleur fonctionnelle, état vide
- [ ] "Nouveau projet" crée un `PatternProject` et redirige vers le wizard
- [ ] "Ouvrir le projet" redirige vers la bonne route selon l'état d'avancement (wizard vs preview/validation)
- [ ] "Voir l'historique des versions" renvoie vers `pattern-studio-preview-validation-export` avec le tiroir d'historique ouvert
- [ ] État vide conforme à la maquette (message + CTA "Créer mon premier patron")
- [ ] Tests : `usePatternProjects.test.ts`, `useOpenPatternProject.test.ts`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
