# État d'avancement — session du 2026-09-30

Checklist de ce qui a été implémenté et de ce qui reste à faire. À cocher au fil des sessions
(la fiche `docs/checklist-implementation.md` reste la source de vérité page par page ;
ce fichier trace le lot de cette session).

## Fait

### Authentification / navigation
- [x] Modale de connexion : `apps/web/src/app/@modal/[...catchAll]` referme la modale interceptée ;
      redirection post-connexion par `window.location.assign` (corrige la boucle infinie
      `/connexion?redirectTo=…` due à un redirect préchargé périmé) — `useAuthRedirect.ts`.
- [x] Espace client ↔ site ↔ back-office : « Retour au site », « Back-office » (rôles staff
      uniquement, `useIsStaff`), et côté admin « Retour au site » + « Espace client ».
      `ROUTES.compte = /espace-client`, `ROUTES.backOffice = /dashboard`.
- [x] Couleurs du dashboard client : classes Tailwind inexistantes (`primary-deep-navy`,
      `ivory-warm`, `text-slate`) remplacées par les tokens `angaly-*`.
- [x] Sidebar admin filtrée par rôle (COUTURIERE : tableau de bord ; MANAGER : + contenu/médiathèque ;
      ADMIN : + paramètres IA).

### Mes créations (spec §53) — backend seulement
- [x] Modèle Prisma `CreationProject` + enum `CreationProjectStage`, migration
      `20260930120000_add_creation_projects`.
- [x] `GET /api/creation-projects` et `/:id` (lecture seule, limité au client connecté),
      types `CreationProjectDto` dans `@angaly/types`, tests — voir `docs/features/creation-projects.md`.

### CMS `/gestion-contenu` — voir `docs/pages/admin-gestion-contenu.md`
- [x] Sauvegarde sans perte : champ absent = valeur conservée, `null` = effacé (`dataJson`/`mediaId`).
- [x] L'API renvoie `media { id, url, altText }` (admin et public).
- [x] Éditeur : image (choisir/remplacer/retirer via la médiathèque), champs structurés et listes
      pilotés par `consts/section-catalog.const.ts`, sections jamais créées listées (« Non créée »),
      aperçu en direct (ordinateur/mobile), repli JSON pour les sections inconnues.
- [x] Accueil : les 4 sections `univers-*` fusionnées en une liste `univers` (migration
      `20260930130000_merge_accueil_univers_sections`) ; étapes sur-mesure éditables.
- [x] Langues : le site public demande `?locale=` ; l'API superpose la traduction MG au français
      (champ vide ⇒ FR ; images/`imageUrl`/`mediaId` toujours FR) ; l'éditeur verrouille images,
      structure des listes et champs de choix en mode traduction.
- [x] Couche commune `apps/web/src/lib/cms/` (`useCmsPage`, `cmsText`, `cmsList`…).
- [x] Contenus branchés au CMS : pied de page, menus (header / mobile / secondaires), titres
      d'accueil restants, page sur-mesure, landing Pattern Studio, coordonnées/réseaux/horaires du contact.
- [x] Valeurs par défaut en base : `packages/database/prisma/cms-defaults.ts` +
      `pnpm --filter @angaly/database db:seed:cms` (création seule, n'écrase rien). FR publié ;
      **MG en brouillon**.

## À faire

### Bloquants / prioritaires
- [ ] **Accès Stitch** : redémarrer Claude Code pour charger `STITCH_API_KEY`
      (`.claude/settings.local.json`), puis vérifier les écrans (règle CLAUDE.md n°9) : ajouts de
      navigation (espace client/admin), éditeur CMS. **Rotation de la clé** (elle a été collée dans un chat).
- [x] **Page « Mes créations »** (`/mes-creations`) — faite, écran Stitch généré, voir `docs/pages/mes-creations.md`. (ancien énoncé : : fiche `docs/pages/mes-creations.md`, ligne
      `mockup-reference.md`, feature slice `apps/web/src/features/mes-creations/` + tests, lien de la
      sidebar et de la tuile du dashboard `/creations` → `/mes-creations`. Bloqué par l'accès Stitch.)
- [x] **Écran back-office** pour changer l'étape d'un projet (`/projets-creation`, écran Stitch « ANGALY Back-office — Projets de création » `fadeaeb5cacf4d0088c20bde4d9c0f29`, feature `admin-projets-creation`, tests unitaires et intégration).

### Base de données / déploiement
- [x] `prisma migrate deploy` échoue sur une ancienne migration (« enum label QUOTE_DOCUMENT already
      exists » : base dev construite avec `db push`). Les deux nouvelles migrations ont été appliquées
      à la main via psql — décider : baseline ou reset de la base dev.
      Fait le 2026-10-01 : enum `PATTERN_INSPIRATION` rattrapée, 6 migrations marquées appliquées (`migrate resolve --applied`), `migrate status` à jour, aucun écart de schéma.
- [x] Documenter `db:seed:cms` dans `docs/development.md` (fait, avec `db:backfill:creation-projects`).

### Contenu
- [ ] **Relecture des traductions malgaches** par un locuteur natif, puis publication depuis
      `/gestion-contenu` (brouillons : pied de page, menus, titres d'accueil, sur-mesure,
      Pattern Studio, contact). Les paragraphes longs ne sont pas traduits (repli français).
- [ ] Textes encore en dur : libellés de formulaires, panier/checkout, espace client.
- [ ] Pages légales inexistantes vers lesquelles pointe le pied de page : `/mentions-legales`,
      `/confidentialite`, `/livraison-retours`, `/presse`, `/carrieres`.

### Qualité
- [ ] Balayer les autres pages client pour des classes de couleur inexistantes (ex. `angaly-primary`
      dans `mes-mesures`) — texte invisible.
- [ ] Vérifier dans un navigateur la modale d'inscription (seule la connexion a été testée).
- [x] Erreurs `tsc` préexistantes dans `pret-a-porter-catalogue` (`ProductGrid` `onQuickView`, test `isPrimary`) — résolues le 2026-10-01.
- [ ] Mettre à jour `docs/checklist-implementation.md` et `docs/mockup-reference.md`
      (creation-projects, couverture CMS).
- [ ] Commits (Conventional Commits, scopes de `commitlint.config.ts`), découpage suggéré :
      correctif modale d'auth · liens de navigation · creation-projects · éditeur/API CMS ·
      langues CMS + couche `lib/cms`.
