# Page — `authentification`

**Statut : ✅ Fait.** Phase 2 — Conversion.

## Objet

Regroupe les trois écrans d'authentification (spec §82) : Connexion, Inscription, Mot de passe
oublié. Traités comme trois **vues d'une même feature-slice** partageant layout, palette et
conventions de validation, plutôt que comme un wizard cumulatif : contrairement à
`pattern-studio-wizard`/`demande-sur-mesure`, ce ne sont pas des étapes séquentielles d'un même
parcours mais trois pages indépendantes, navigables librement (lien direct, retour navigateur,
partage d'URL) sans perte de contexte.

## Route(s)

- `apps/web/src/app/(auth)/connexion/page.tsx` → `/connexion`
- `apps/web/src/app/(auth)/inscription/page.tsx` → `/inscription`
- `apps/web/src/app/(auth)/mot-de-passe-oublie/page.tsx` → `/mot-de-passe-oublie`

Les trois `page.tsx` importent chacun un composant différent exporté par l'unique
`index.ts` de la feature `authentification` (`LoginPage`, `SignupPage`,
`ForgotPasswordPage`) — cohérent avec la règle "un `index.ts` = seule surface publique d'une
feature", même lorsque plusieurs routes en consomment des exports distincts.

Client Component dès la racine pour les trois routes (formulaires interactifs, pas de
bénéfice SSR déterminant).

## Référence maquette

- Prompt Stitch : `stitch-prompts/29-connexion-inscription.md`
- Écran Stitch : **ANGALY — Connexion / Inscription / Mot de passe oublié**
- Section spécification : §82 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/authentification/
  ui/
    AuthSplitLayout.tsx           → layout partagé : panneau photo (55%) + panneau ivoire (45%)
    LoginPage.tsx                 → écran Connexion (dans AuthSplitLayout)
    SignupPage.tsx                → écran Inscription
    ForgotPasswordPage.tsx        → écran Mot de passe oublié + état "Email envoyé"
    LoginForm.tsx
    SignupForm.tsx
    ForgotPasswordForm.tsx
    PasswordResetSentCard.tsx     → confirmation "Email envoyé"
    AuthFormFooterLink.tsx        → lien bas de formulaire (bascule connexion ↔ inscription)
  hooks/
    useLoginForm.ts               → état + validation Zod + mutation de connexion
    useSignupForm.ts               → état + validation Zod + mutation d'inscription
    useForgotPasswordForm.ts       → état + validation Zod + mutation de demande de réinitialisation
    useAuthRedirect.ts             → détermine la redirection post-connexion (`redirectTo` ou espace client)
  api/
    auth.api.ts                   → useLoginMutation, useSignupMutation, useRequestPasswordResetMutation
  schemas/
    login.schema.ts, signup.schema.ts, forgot-password.schema.ts
  consts/
    queryKeys.ts
  types/
    auth-form.types.ts
  __tests__/
    useLoginForm.test.ts
    useSignupForm.test.ts
    useForgotPasswordForm.test.ts
  index.ts
```

`AuthSplitLayout.tsx` et les composants `ui/*Form.tsx` restent purement présentationnels ;
toute la logique (validation, soumission, redirection) vit dans `hooks/`.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `POST /api/auth/login` | `auth` | Connexion (email + mot de passe) |
| `POST /api/auth/register` | `auth` | Inscription — crée `User` (`role = CLIENT`) + `Customer` associé |
| `POST /api/auth/forgot-password` | `auth` | Demande de réinitialisation de mot de passe |

## Modèles Prisma touchés

`User` (`email`, `passwordHash`, `role` par défaut `CLIENT`, `isActive`, `lastLoginAt`),
`Customer` (`firstName`, `lastName`, `phone`, créé à l'inscription, `userId` unique).

## Points d'attention

- **OAuth optionnel** (spec §82 "éventuellement OAuth") : le bouton "Continuer avec Google" du
  prompt Stitch reste un état visuel préparé mais désactivé/masqué tant qu'aucun fournisseur
  OAuth n'est configuré côté module `auth` — ne jamais l'afficher fonctionnel sans intégration
  réelle.
- **Vérification email non modélisée** (spec §82 "vérification email") : le modèle `User` n'a
  pas de champ `emailVerifiedAt`/`isEmailVerified` dans le schéma actuel — décider avec le
  module `auth`, avant l'implémentation, si l'on ajoute ce champ (migration) ou si l'on s'appuie
  provisoirement sur `isActive` ; ne pas improviser cette logique côté frontend.
- L'inscription doit créer **simultanément** un `User` (`role = CLIENT`) et un `Customer`
  associé (relation 1:1, `Customer.userId` unique) dans une même transaction côté `auth` —
  jamais l'un sans l'autre.
- Redirection post-connexion : si l'utilisateur venait d'une page nécessitant une
  authentification (`personnalisation-creation`, `prendre-rendez-vous`, etc.), revenir vers
  cette page via un paramètre `redirectTo` plutôt que de toujours rediriger vers
  `espace-client-dashboard`.
- Le prompt Stitch et cette fiche ne couvrent que la **demande** de réinitialisation (état
  "Email envoyé") — l'écran de saisie du nouveau mot de passe avec token
  (`reinitialiser-mot-de-passe/:token`) n'est référencé nulle part dans
  `docs/mockup-reference.md` : à spécifier avant de considérer le parcours de récupération
  complet.
- Erreurs de formulaire toujours en ton `Error` sobre (#A64A43), jamais un rouge agressif —
  cohérent avec l'AVOID du prompt Stitch.
- **Mobile : le panneau photo est entièrement masqué (`hidden md:flex`), pas réduit à une
  bannière** — corrigé après extraction du HTML/CSS réel généré par Stitch (`read_url` sur
  l'export, voir ci-dessous) : le prompt memo dit "réduit à une bannière fine", mais les 3
  écrans réels masquent totalement l'image sur mobile et affichent un bloc texte de marque
  (titre + baseline) séparé au-dessus du formulaire. `AuthSplitLayout.tsx` reproduit
  exactement cette structure (implémentation initiale corrigée).
- **Le champ Téléphone (Inscription) est optionnel, pas requis** — corrigé après vérification
  du HTML réel : c'est le seul champ du formulaire sans attribut `required` (prénom, nom,
  email, mot de passe, confirmation, CGU en ont tous un), cohérent avec `RegisterDto.phone?`
  côté backend. `signup.schema.ts` traitait ce champ à tort comme requis dans la première
  passe (supposition basée sur l'absence de mention "optionnel" dans le prompt memo, jamais
  vérifiée contre l'écran réel).
- **Export HTML/CSS complet obtenu via `agy` + `read_url`** (élargi temporairement à
  `read_url(*)` dans `~/.gemini/antigravity-cli/settings.json`, puis renarrowé à
  `read_url(https://stitch.withgoogle.com/*)` immédiatement après usage) : les captures
  précédentes de cette session (analyse structurée via `get_screen` seul) ne suffisaient pas
  à extraire l'attribut `required` par champ ni le comportement exact `hidden md:flex` —
  seul le HTML/CSS littéral l'a révélé. Les 2 corrections ci-dessus, ainsi que la flèche
  d'animation au survol du CTA Connexion et le vrai logo Google 4 couleurs (`LoginForm.tsx`),
  en découlent directement.
- **Les 3 écrans Stitch ont été vérifiés en direct** cette session via `agy`/StitchMCP
  (`get_screen`) — pas seulement via le prompt memo. IDs : Connexion
  `be20b2efece647cd8195d3370c7b65f0`, Inscription `4984441100ad488880636f83fd1c4747`, Mot de
  passe oublié `02af0794373f4547ad0568e86fee6c30`. Écarts constatés entre le prompt memo et
  l'écran réel, tranchés en faveur de l'écran réel : sous-titre Inscription réel = "Créez
  votre compte pour une expérience sur mesure." (memo disait "...pour suivre vos projets et
  rendez-vous.") ; le style des champs **diffère par écran** — Connexion = bordure pleine
  fine + focus navy, Inscription/Mot de passe oublié = style "Atelier" bordure inférieure
  seule ; baseline de la bannière gauche différente par écran (Connexion/Inscription :
  "L'élégance, créée pour vous.", Mot de passe oublié : "L'excellence de la haute couture,
  façonnée à Madagascar.").
- **Aucun écran Stitch "Email envoyé" n'existe** — vérifié explicitement (le screen Mot de
  passe oublié ne contient aucun second état/frame, et aucun autre écran du projet ne
  correspond). La copie de `PasswordResetSentCard` vient donc uniquement du bloc CONFIRMATION
  STATE de `stitch-prompts/29-connexion-inscription.md`, seule source tranchée pour cet état.
- **Panneau photo éditorial non implémenté avec une vraie image** : `AuthSplitLayout` utilise
  un dégradé navy à la place de la photographie couture des maquettes — aucun asset n'a été
  uploadé via MinIO pour cette page (règle absolue #21 interdit une URL d'image
  externe/hardcodée). À faire dans une session ultérieure une fois une photo éditoriale
  disponible dans la médiathèque.
- **Case CGU/politique de confidentialité rendue en texte brut, pas en lien** : aucune page
  CGU/politique de confidentialité n'est encore planifiée dans `docs/pages/` (contrairement
  au précédent de `routes.ts` qui ne lie que vers des pages déjà documentées à venir) — à
  transformer en lien une fois ces pages spécifiées.
- **Protection RBAC des groupes `(client)`/`(admin)` implémentée via un `layout.tsx` par
  groupe**, pas dans `middleware.ts` comme le commentaire original du stub le suggérait : les
  pages `(client)` n'ont aucun préfixe d'URL commun (`/mes-favoris`, `/pattern-studio`,
  `/espace-client`, `/creations/[slug]/personnaliser`, ...) — un groupe de routes Next.js
  n'ajoute aucun segment d'URL, donc `middleware.ts` ne peut pas fiablement détecter
  l'appartenance à un groupe depuis le pathname seul, alors qu'un `layout.tsx` de groupe
  protège automatiquement toute nouvelle page qui y est ajoutée. `middleware.ts` se limite
  désormais à injecter un header `x-pathname` que ces layouts lisent pour construire un
  `redirectTo` précis.
- **NextAuth v5 (beta)** utilisé plutôt que la v4 stable : seule version avec support natif de
  l'App Router (`auth()`, middleware, route handlers) au moment de l'implémentation — v4
  n'est pas listé comme alternative retenue. À surveiller lors du passage en v5 stable.
- **`docker/nginx/conf.d/angaly.conf` et `docker/caddy/Caddyfile` mis à jour** : ajout d'un
  routage exact (prioritaire sur le préfixe générique `/api/auth/*` → `apps/web`) pour
  `/api/auth/forgot-password` et `/api/auth/reset-password`, qui restent de vrais endpoints
  `apps/api` appelés directement par le navigateur (voir `docs/deployment.md` "NextAuth et le
  reverse proxy").

## Checklist d'acceptation

- [x] Les 3 écrans reproduisent fidèlement l'écran Stitch réel (layout split-screen desktop, bannière réduite mobile) — vérifié en direct, pas seulement via `stitch-prompts/29-*.md`
- [x] Connexion fonctionnelle (via NextAuth Credentials + `apps/api`), erreurs inline sans rouge agressif
- [x] Inscription crée bien un `User` (`role CLIENT`) + `Customer` associé (délégué à `apps/api`, déjà testé côté `auth`), validation Zod stricte (mots de passe correspondants, conditions générales obligatoires)
- [x] Mot de passe oublié envoie la demande et affiche l'état "Email envoyé"
- [x] Navigation libre entre les 3 pages (liens bas de formulaire) sans perte de contexte
- [x] Redirection post-connexion respecte `redirectTo` si présent (garde anti-open-redirect : uniquement un chemin relatif)
- [x] Tests : `useLoginForm.test.ts`, `useSignupForm.test.ts`, `useForgotPasswordForm.test.ts` (+ `signup.schema.test.ts`, smoke tests des 3 Page)
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
