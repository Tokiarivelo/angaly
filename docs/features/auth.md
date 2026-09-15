# Feature — `auth`

**Statut : ✅ Fait** (backend + frontend). Phase 2 — Conversion. La page `authentification`
(frontend, `docs/pages/authentification.md`) est câblée sur les 6 endpoints de ce module via
NextAuth (Credentials provider, `apps/web/src/lib/auth/`) pour login/register, et directement
pour forgot-password/reset-password.

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
  entities/user.entity.ts                  → invariants métier (email valide, rôle connu) — UserRole miroir local de Role
  repositories/
    user.repository.ts                     → IUserRepository, dont createWithCustomer() (voir Points d'attention)
    refresh-token.repository.ts             → IRefreshTokenRepository
    password-reset-token.repository.ts      → IPasswordResetTokenRepository
  services/
    password-hasher.ts                      → IPasswordHasher (port, zéro dépendance bcrypt ici)
    access-token.service.ts                 → IAccessTokenService + AccessTokenPayload ({sub, role})
    token-expiry-policy.ts                  → ITokenExpiryPolicy (délègue la lecture de config à l'infra)
  value-objects/
    email.vo.ts                             → validation + normalisation (trim + lowercase)
    password.vo.ts                          → MIN_PASSWORD_LENGTH = 8 (aucune règle de complexité imposée par la maquette)
    opaque-token.vo.ts                      → génère/hash les refresh & reset tokens (node:crypto, pas un JWT — voir Points d'attention)
application/
  use-cases/
    register-user.use-case.ts               → createWithCustomer + émet une session immédiatement (pas de 2ᵉ vérif de mot de passe)
    login-user.use-case.ts
    refresh-access-token.use-case.ts        → rotation : l'ancien token est TOUJOURS révoqué, même si le nouveau échoue
    logout-user.use-case.ts                 → idempotent (token absent/déjà révoqué = no-op silencieux)
    request-password-reset.use-case.ts      → toujours 200, ne révèle jamais si l'email existe
    reset-password.use-case.ts              → jeton à usage unique, met à jour passwordHash
  dtos/
    register.dto.ts, login.dto.ts, forgot-password.dto.ts, reset-password.dto.ts
    auth-tokens-response.dto.ts             → implémente AuthUserDto/AuthTokensDto (@angaly/types)
infrastructure/
  repositories/
    prisma-user.repository.ts               → createWithCustomer() = un seul $transaction Prisma (User + Customer)
    prisma-refresh-token.repository.ts
    prisma-password-reset-token.repository.ts
  services/
    jwt-access-token.service.ts             → @nestjs/jwt (RS256), verify() ne lève jamais, retourne null
    bcrypt-password-hasher.service.ts       → bcrypt, coût 12
    env-token-expiry-policy.service.ts      → lit JWT_REFRESH_TOKEN_EXPIRES_IN, parse "7d"/"15m" → Date
  mappers/user.mapper.ts
presentation/
  controllers/auth.controller.ts            → pose/lit/efface le cookie refresh_token (httpOnly, path /api/auth)
  guards/jwt-auth.guard.ts                  → vérifie l'access token RS256 (Authorization: Bearer) — guard de référence pour toute l'API
  decorators/current-user.decorator.ts      → @CurrentUser() extrait req.user injecté par JwtAuthGuard
__tests__/
  unit/ (17 fichiers — entité, VOs, chaque use-case, chaque repository Prisma, chaque service infra, le guard, le décorateur)
  integration/auth.controller.spec.ts        → 6 endpoints, assertions sur les cookies Set-Cookie
```

## Modèles Prisma

`User` (`email`, `passwordHash`, `role` — enum `Role`, `isActive`, `lastLoginAt`). Relation
`Customer?` créée à l'inscription (voir `customers` — mais voir aussi "Points d'attention"
sur qui crée réellement cette ligne pour l'instant).

Deux modèles ajoutés par ce module (migration `20260908120222_add_auth_tokens`, aucun des
deux n'existait avant) :
- `RefreshToken` (`userId`, `tokenHash` unique, `expiresAt`, `revokedAt?`) — une ligne par
  jeton émis, jamais mise à jour en place sauf pour la révoquer (rotation = révoquer
  l'ancienne ligne + en créer une nouvelle, jamais un `update` du même token).
- `PasswordResetToken` (`userId`, `tokenHash` unique, `expiresAt`, `usedAt?`) — usage unique,
  `usedAt` posé à la consommation.

Aucun des deux ne stocke le jeton en clair, seulement son hash SHA-256
(`domain/value-objects/opaque-token.vo.ts`).

## Cas d'usage clés

- Inscription (`register-user`) : crée un `User` (`role = CLIENT` uniquement — les rôles
  internes COUTURIERE/MANAGER/ADMIN ne sont jamais créés via cet endpoint public, voir
  `users`) et son profil `Customer` associé (1:1) dans la même transaction Prisma
  (`IUserRepository.createWithCustomer()` — voir Points d'attention pour pourquoi ce n'est
  pas une dépendance vers un module `customers` séparé)
- Connexion (`login-user`) : vérifie `email`/`password` contre `passwordHash`, met à jour
  `lastLoginAt`, renvoie un access token (payload minimal : `sub`, `role`) et pose le
  refresh token en cookie httpOnly (`Secure` en production uniquement, `SameSite=Lax`,
  chemin `/api/auth` — voir Points d'attention pour l'écart avec `/api/auth/refresh`)
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

- **`customers`** : ce module existe maintenant (`docs/features/customers.md`, ✅ — profil +
  favoris) mais `auth` continue de créer directement la ligne `Customer` (via
  `IUserRepository.createWithCustomer()`, Prisma `$transaction`) plutôt que de dépendre d'une
  interface `customers` pour cette seule écriture — option explicitement retenue par
  `customers` lui-même (voir sa fiche "Cas d'usage clés"). Voir Points d'attention pour le
  raisonnement complet
  et ce que devra faire une future session `customers`.
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
  exposer le secret. Les clés étaient déjà provisionnées (Phase 0) dans `apps/api/.env`
  (`JWT_PRIVATE_KEY_BASE64`/`JWT_PUBLIC_KEY_BASE64`, PEM encodé en base64) — décodées au
  chargement de `AuthModule` (`JwtModule.registerAsync`), jamais commitées en clair.
- **`@nestjs/jwt` fixé à `11.0.2`, pas la dernière version (`12.0.1`)** : `12.x` est publié en
  ESM pur (`"type": "module"`, aucune condition `require`), incompatible avec la chaîne
  Jest/ts-jest en CommonJS de ce projet (`SyntaxError: Cannot use import statement outside a
  module` sur `@nestjs/jwt/dist/index.js`). `11.0.2` reste CJS et correspond à la même ligne
  majeure que `@nestjs/common@^11` déjà utilisée partout ailleurs dans `apps/api`.
- **Refresh token et jeton de réinitialisation : chaînes aléatoires opaques, pas des JWT**
  (`domain/value-objects/opaque-token.vo.ts`, `node:crypto.randomBytes`/`createHash`). Seul
  leur hash SHA-256 est stocké (`RefreshToken`/`PasswordResetToken`) — la ligne DB est la
  seule source de vérité pour la validité/révocation/usage unique, ce qu'un JWT sans état ne
  permet pas (on ne peut jamais vraiment "désémettre" un JWT auto-suffisant). Seul l'access
  token est un vrai JWT (RS256, sans état, vérifié sans aller en base à chaque requête).
- Le refresh token ne doit **jamais** être lisible en JavaScript côté navigateur (`httpOnly`
  strict, `Secure` uniquement si `NODE_ENV=production` pour rester utilisable en `http://`
  local) — seul l'access token (courte durée) est manipulé côté client, et uniquement en
  mémoire (jamais `localStorage`).
- **Cookie `refresh_token` sur le chemin `/api/auth`, pas `/api/auth/refresh`** comme le
  texte original de cette fiche le suggérait : un cookie scopé exactement à
  `/api/auth/refresh` n'est jamais envoyé par le navigateur sur `/api/auth/logout` (chemin
  frère, pas un sous-chemin) — `logout-user` ne pourrait alors jamais lire/révoquer le jeton
  présenté. Élargi à `/api/auth` : couvre `refresh` et `logout`, reste exclu de toutes les
  autres routes de l'API — l'objectif de sécurité initial (limiter la portée du cookie) est
  préservé, juste avec un préfixe plus large que la formulation d'origine.
- **`register-user` orchestrant deux domaines (`auth` + `customers`) — exception documentée,
  implémentée différemment de ce que cette fiche prévoyait initialement.** Le plan d'origine
  imaginait `RegisterUserUseCase` dépendant d'une interface `customers`. En pratique, une
  vraie atomicité entre deux repositories séparés exigerait de faire circuler un client de
  transaction Prisma à travers une frontière de module — une abstraction que ce projet n'a
  pas encore et qui n'était pas justifiée pour ce seul cas. À la place :
  `IUserRepository.createWithCustomer()` (une seule méthode) encapsule tout le
  `prisma.$transaction()` (création de `User` + `Customer`) dans
  `infrastructure/repositories/prisma-user.repository.ts`, côté `auth`. Le module `customers`
  (profil, favoris — `docs/features/customers.md`) est construit depuis et a choisi de
  **continuer à laisser `auth` créer la ligne `Customer` initiale** (déjà correct et testé) —
  `ICustomerRepository` n'expose donc pas de méthode `create`, `createWithCustomer()` garde
  exactement le même contrat public.
- **Vérification email non modélisée — décision prise : `isActive` fait foi pour l'instant**,
  la seconde option que cette fiche laissait ouverte (pas de champ `emailVerifiedAt`
  ajouté). Aucun flux de vérification par email n'existe (pas de `notifications` avant
  Phase 3) ; à revisiter alors si le produit l'exige.
- Pas de règle de complexité de mot de passe au-delà d'une longueur minimale
  (`MIN_PASSWORD_LENGTH = 8`) — ni `stitch-prompts/29-connexion-inscription.md` ni la spec
  §82 n'en imposent une plus stricte.
- `bcrypt` (natif, coût 12) plutôt que `argon2` — le `Dockerfile` d'`apps/api` anticipait déjà
  explicitement `bcrypt` depuis le scaffold Phase 0 (commentaire "fallback toolchain for
  native addons (bcrypt, etc.)").
- **Correction 2026-09-15 — déconnexions intempestives côté frontend ("token invalid")** :
  bug dans `apps/web/src/lib/auth/auth.ts` (NextAuth, hors périmètre Clean Architecture de
  cette fiche mais partage le même cycle de vie de rafraîchissement). Le callback `jwt()`
  traitait **toute** erreur de `refreshWithBackend()` de la même façon — y compris une simple
  panne réseau ou un redémarrage momentané d'`apps/api` — en effaçant intégralement la
  session (`accessToken`/`refreshToken`/`userId` supprimés, `session.error =
  'RefreshAccessTokenError'`). Une fois effacé, plus aucun refresh token n'existait côté
  client pour retenter : l'utilisateur restait déconnecté même si son refresh token était
  encore parfaitement valide en base. Corrigé en distinguant deux cas dans
  `backend-auth-client.ts` : un vrai rejet 401 du endpoint `/api/auth/refresh` (jeton
  effectivement invalide/expiré/révoqué — `InvalidRefreshTokenError`, seul cas qui efface la
  session) vs toute autre erreur (réseau, 5xx, réponse tronquée — transitoire, la session
  existante est conservée telle quelle pour permettre une nouvelle tentative à la requête
  suivante). Logique extraite et testée dans
  `apps/web/src/lib/auth/refresh-jwt.ts`/`__tests__/refresh-jwt.test.ts` (même pattern
  d'extraction que `current-user.decorator.ts` pour rendre un callback de framework
  testable). Voir aussi `packages/database`/`RefreshAccessTokenUseCase` ci-dessus pour la
  fenêtre de grâce de 30s côté rotation, qui reste le filet de sécurité pour les requêtes
  concurrentes légitimes (plusieurs onglets, rendus parallèles) — ce correctif ne la modifie
  pas, il évite seulement qu'un problème *transitoire* soit interprété comme un jeton mort.

## Vérification

- [x] Les 6 use-cases testés unitairement (cas nominal + erreurs : email déjà pris,
      identifiants invalides, compte désactivé, jeton de refresh expiré/révoqué/inconnu,
      jeton de reset expiré/déjà consommé/inconnu, logout idempotent) — 82 tests au total sur
      `auth/` (entité, 3 value-objects, 3 ports de service, 3 repositories Prisma, 2 services
      infra, le guard, le décorateur, les 6 use-cases, le controller), 100 % de couverture
      instructions sur la quasi-totalité des fichiers (branches 66–100 % selon le fichier,
      cohérent avec le reste du projet)
- [x] `auth.controller.spec.ts` couvre les 6 endpoints (200/201/204/400/401/409) avec
      assertions directes sur les en-têtes `Set-Cookie` (présence, `HttpOnly`, `Path`)
- [x] Le cookie refresh token est bien posé en `httpOnly`/`SameSite=Lax`/`Path=/api/auth`
      dans le test d'intégration de connexion et d'inscription (`Secure` non assertable en
      test — dépend de `NODE_ENV=production`, vérifié par lecture de code)
- [x] **Testé manuellement de bout en bout contre Postgres réel** (13 requêtes curl
      successives contre l'API réelle) :
      inscription (crée `User`+`Customer` en une transaction, vérifié par requête SQL directe) →
      double inscription rejetée 409 → connexion mauvais mot de passe 401 → connexion réussie →
      rafraîchissement (rotation : nouveau cookie différent de l'ancien) → réutilisation de
      l'ancien refresh token rejetée 401 (rotation bien invalidante) → déconnexion sans bearer
      token rejetée 401 par `JwtAuthGuard` → déconnexion authentifiée 204 + cookie effacé →
      mot de passe oublié email connu/inconnu : réponse strictement identique (anti-énumération) →
      réinitialisation avec un jeton connu (inséré directement en base, hashé de la même façon
      que le code applicatif, pour tester sans exposer le jeton brut en clair dans les logs
      applicatifs) → réutilisation du même jeton rejetée 400 (usage unique) → connexion avec
      l'ancien mot de passe rejetée 401, connexion avec le nouveau réussie (le mot de passe a
      réellement changé) → suppression du `User` de test confirmée en cascade sur `Customer`/
      `RefreshToken`/`PasswordResetToken` (contraintes `onDelete: Cascade` vérifiées)
- [x] `docs/checklist-implementation.md` : `auth` passé à ✅ (`customers` reste ⬜, voir
      "Points d'attention") — `authentification` (page) passée à ✅, frontend câblé via
      NextAuth (voir `docs/pages/authentification.md`)
