# Feature — `auth`

**Statut : ⬜ À faire.** Phase 2 — Conversion.

## Objet

Authentification des comptes `User` (spec §82) : inscription, connexion, déconnexion,
rafraîchissement de session, récupération de mot de passe. Implémente l'ADR-001
(`docs/architecture.md`) : JWT **RS256** (paire de clés asymétrique), access token courte
durée renvoyé au client, refresh token porté par un cookie **httpOnly** (jamais accessible
en JavaScript). Côté web, **NextAuth** (`apps/web`) orchestre la session (stratégie JWT,
provider Credentials) en appelant les endpoints de ce module — NextAuth ne réimplémente
aucune logique de hachage/signature, il délègue entièrement à `apps/api`.

## Emplacement Clean Architecture

`apps/api/src/auth/`

```
domain/
  entities/user.entity.ts               → invariants métier (email valide, rôle par défaut CLIENT)
  repositories/user.repository.ts       → interface IUserRepository (zéro import Prisma)
  value-objects/email.vo.ts
  value-objects/password.vo.ts          → règles de robustesse (longueur min, etc.), jamais le hash lui-même
application/
  use-cases/
    register-user.use-case.ts           → crée le User (rôle CLIENT) + délègue la création du Customer associé
    login-user.use-case.ts              → vérifie les identifiants, émet access+refresh token
    refresh-access-token.use-case.ts    → valide le refresh token (cookie), émet un nouvel access token (rotation)
    logout-user.use-case.ts             → révoque/efface le refresh token
    request-password-reset.use-case.ts  → génère un jeton de réinitialisation à durée limitée, déclenche l'email (via `notifications`)
    reset-password.use-case.ts          → consomme le jeton, met à jour passwordHash
  dtos/
    register.dto.ts
    login.dto.ts
    auth-tokens-response.dto.ts
infrastructure/
  repositories/prisma-user.repository.ts  → implémente IUserRepository via PrismaService
  services/
    jwt-token.service.ts                  → signe/vérifie les JWT RS256 (clé privée/publique via process.env)
    password-hasher.service.ts            → bcrypt/argon2, jamais de mot de passe en clair loggé
  mappers/user.mapper.ts
presentation/
  controllers/auth.controller.ts
  guards/jwt-auth.guard.ts                → vérifie l'access token RS256 (Authorization: Bearer)
  decorators/current-user.decorator.ts    → @CurrentUser() extrait req.user injecté par JwtAuthGuard
__tests__/
  unit/register-user.use-case.spec.ts
  unit/login-user.use-case.spec.ts
  unit/refresh-access-token.use-case.spec.ts
  integration/auth.controller.spec.ts
```

## Modèles Prisma

`User` (`email`, `passwordHash`, `role` — enum `Role`, `isActive`, `lastLoginAt`). Relation
`Customer?` créée à l'inscription (voir `customers`).

## Cas d'usage clés

- Inscription (`register-user`) : crée un `User` (`role = CLIENT` uniquement — les rôles
  internes COUTURIERE/MANAGER/ADMIN ne sont jamais créés via cet endpoint public, voir
  `users`), puis délègue au module `customers` la création du profil `Customer` associé
  (1:1) dans la même transaction
- Connexion (`login-user`) : vérifie `email`/`password` contre `passwordHash`, met à jour
  `lastLoginAt`, renvoie un access token (payload minimal : `sub`, `role`) et pose le
  refresh token en cookie httpOnly (`Secure`, `SameSite=Lax`, chemin restreint à
  `/api/auth/refresh`)
- Rafraîchissement (`refresh-access-token`) : lit le cookie refresh token, vérifie sa
  signature/expiration, émet un nouvel access token et fait tourner le refresh token
  (rotation, ancien jeton invalidé)
- Déconnexion (`logout-user`) : efface le cookie refresh token côté serveur
- Mot de passe oublié (`request-password-reset`/`reset-password`) : jeton à usage unique et
  durée limitée, jamais l'email en clair dans les logs

## Endpoints exposés

| Méthode | Route | Use-case | Auth |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | `register-user` | Public |
| `POST` | `/api/auth/login` | `login-user` | Public |
| `POST` | `/api/auth/refresh` | `refresh-access-token` | Public (cookie httpOnly requis) |
| `POST` | `/api/auth/logout` | `logout-user` | `CLIENT`+ (utilisateur connecté) |
| `POST` | `/api/auth/forgot-password` | `request-password-reset` | Public |
| `POST` | `/api/auth/reset-password` | `reset-password` | Public (jeton dans le corps de la requête) |

## Points d'intégration

- **`customers`** : `register-user` dépend de `ICustomerRepository` (interface du domaine
  `customers`) pour créer le `Customer` 1:1 dans la même transaction Prisma que la création
  du `User` — seule dépendance inter-modules tolérée de ce module, documentée explicitement
  (voir Points d'attention) plutôt que dupliquée.
- **`users`** (Phase 6) : partage l'entité `User`/l'enum `Role`, mais gère exclusivement les
  comptes internes (COUTURIERE/MANAGER/ADMIN) — jamais l'inscription publique.
- **`notifications`** (Phase 3) : `request-password-reset` déclenche l'envoi d'email via ce
  module une fois livré ; en attendant, un TODO explicite dans l'implémentation (log
  uniquement, pas d'envoi réel avant Phase 3).
- **`apps/web`** : NextAuth (stratégie JWT, provider Credentials) appelle
  `/api/auth/login`/`/api/auth/refresh`/`/api/auth/logout` ; le cookie refresh token est posé
  par `apps/api` directement (domaine partagé derrière le reverse proxy, voir
  `docs/architecture.md`), NextAuth ne le manipule pas lui-même.
- **Toutes les routes protégées de tous les modules** : `JwtAuthGuard` de ce module est le
  guard d'authentification de référence, appliqué au niveau contrôleur (règle absolue #16).

## Points d'attention

- ADR-001 impose RS256 : la clé privée signe (uniquement côté `apps/api`), la clé publique
  peut être partagée avec de futurs services vérificateurs (ex. `apps/ai-service`) sans
  exposer le secret — clés fournies via `process.env` (`JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY`),
  jamais commitées.
- Le refresh token ne doit **jamais** être lisible en JavaScript côté navigateur (`httpOnly`
  strict) — seul l'access token (courte durée) est manipulé côté client, et uniquement en
  mémoire (jamais `localStorage`).
- `register-user` orchestrant deux domaines (`auth` + `customers`) est une exception
  volontaire et limitée à ce seul cas d'usage transactionnel ; ne pas généraliser ce pattern
  à d'autres écritures inter-modules sans le documenter de la même façon.

## Vérification

- [ ] `register-user`, `login-user`, `refresh-access-token`, `reset-password` testés
      unitairement (cas nominal + erreurs : email déjà pris, identifiants invalides, jeton
      expiré/déjà consommé)
- [ ] `auth.controller.spec.ts` couvre les codes 200/400/401
- [ ] Le cookie refresh token est bien posé en `httpOnly`/`Secure`/`SameSite` dans le test
      d'intégration de connexion
- [ ] `docs/checklist-implementation.md` : `auth` passé à ✅
