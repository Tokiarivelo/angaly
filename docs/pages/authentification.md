# Page — `authentification`

**Statut : ⬜ À faire.** Phase 2 — Conversion.

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
- Mobile : le panneau photo est retiré/réduit à une bannière fine, le panneau formulaire passe
  en pleine largeur.

## Checklist d'acceptation

- [ ] Les 3 écrans reproduisent fidèlement `stitch-prompts/29-*.md` (layout split-screen desktop, bannière réduite mobile)
- [ ] Connexion fonctionnelle, erreurs inline sans rouge agressif
- [ ] Inscription crée bien un `User` (`role CLIENT`) + `Customer` associé, validation Zod stricte (mots de passe correspondants, conditions générales obligatoires)
- [ ] Mot de passe oublié envoie la demande et affiche l'état "Email envoyé"
- [ ] Navigation libre entre les 3 pages (liens bas de formulaire) sans perte de contexte
- [ ] Redirection post-connexion respecte `redirectTo` si présent
- [ ] Tests : `useLoginForm.test.ts`, `useSignupForm.test.ts`, `useForgotPasswordForm.test.ts`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
