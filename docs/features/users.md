# Feature — `users`

**Statut : ✅ Fait** (session 2026-09-16). Phase 6 — Admin (back-office).

## Objet

Gestion des comptes internes (staff) — `COUTURIERE`/`MANAGER`/`ADMIN` (spec §68) : liste,
création, changement de rôle, désactivation/réactivation. Les comptes `CLIENT` restent en
libre-service via `auth`/`customers` (Phase 2) — ce module ne les gère jamais.

## Écart assumé par rapport au plan initial de cette fiche

La première version de cette fiche (rédigée avant implémentation) prévoyait un flux
d'**invitation par email** (`invite-staff-user`, réutilisant le mécanisme de jeton de
`request-password-reset`) et un `RolesGuard`/`@Roles()` déplacé dans un nouveau
`apps/api/src/shared/`. La session d'implémentation (2026-09-16) a délibérément simplifié
les deux points :

- **Création directe avec mot de passe initial** plutôt qu'invitation par email :
  `POST /api/admin/users` prend `email` + `role` + `password` (choisi par l'ADMIN qui crée le
  compte), hashé via le port `IPasswordHasher` **réutilisé depuis `auth`**
  (`PASSWORD_HASHER`, désormais exporté par `AuthModule`) plutôt que dupliquer une logique de
  hachage. Un flux d'invitation par email pourra remplacer ceci dans une session ultérieure
  une fois `notifications` réellement câblé à ce module — non nécessaire pour rendre l'API
  utilisable/testable dans cette passe.
- **Pas de nouveau `apps/api/src/shared/`** : `JwtAuthGuard`/`RolesGuard`/`@Roles()` restent
  dans `auth/presentation/...` et sont importés directement par `users` (et par `content`,
  voir `docs/features/content.md`) — exactement comme le fait déjà
  `admin-ai-settings/presentation/controllers/ai-model-settings.controller.ts`. Créer une
  nouvelle indirection dans `shared/` aurait signifié modifier des imports dans du code
  Phase 1-5 existant sans bénéfice fonctionnel.
- **Toutes les routes sont `ADMIN`-only** (pas `MANAGER`+`ADMIN` en lecture) : la consigne de
  session pour ce module demandait explicitement de suivre à l'identique la convention
  `admin-ai-settings` (guard ADMIN-only sur tout le contrôleur). `content`/`media` restent
  `MANAGER`+`ADMIN` comme prévu, ce module (gestion des comptes/rôles eux-mêmes) est plus
  sensible et reste `ADMIN`-only.

**Pas de page frontend dédiée dans cette passe** : il n'existe aucune maquette Stitch pour un
écran de gestion des comptes staff dans le périmètre des 2 pages Phase 6
(`stitch-prompts/31-admin-gestion-contenu-mediatheque.md` ne couvre que
`admin-gestion-contenu`/`admin-mediatheque`) — construire un écran sans référence visuelle
validerait rule 9 (vérification Stitch obligatoire) dans le mauvais sens. Ce module ship donc
**backend uniquement** (API + tests), consommé pour l'instant via Swagger/HTTP direct ou un
futur écran Phase 7 dès qu'une maquette existera.

## Emplacement Clean Architecture

`apps/api/src/users/`

```
domain/
  entities/staff-user.entity.ts           → invariants (role ∈ STAFF_ROLES = COUTURIERE|MANAGER|ADMIN, jamais CLIENT)
  repositories/staff-user.repository.ts   → IStaffUserRepository (zéro import Prisma) — périmètre staff uniquement, distinct de IUserRepository (`auth`)
application/
  dtos/
    list-staff-users-query.dto.ts, create-staff-user.dto.ts, update-staff-role.dto.ts,
    update-staff-status.dto.ts, staff-user-response.dto.ts
  use-cases/
    list-staff-users.use-case.ts          → filtre role/isActive, pagination
    create-staff-user.use-case.ts         → hash via IPasswordHasher (auth), 409 si email déjà pris
    change-staff-role.use-case.ts         → 400 si un admin change son propre rôle, 404 si cible absente
    set-staff-user-status.use-case.ts     → 400 si un admin se désactive lui-même, 404 si cible absente
infrastructure/
  repositories/prisma-staff-user.repository.ts → implémente IStaffUserRepository via PrismaService (filtre role != CLIENT)
  mappers/staff-user.mapper.ts
presentation/
  controllers/staff-users.controller.ts   → @Controller('admin/users'), JwtAuthGuard+RolesGuard+@Roles(ADMIN)
users.module.ts                            → importe AuthModule (guards + PASSWORD_HASHER), PrismaModule
__tests__/
  unit/staff-user.entity.spec.ts, staff-user.mapper.spec.ts, list-staff-users.use-case.spec.ts,
       create-staff-user.use-case.spec.ts, change-staff-role.use-case.spec.ts,
       set-staff-user-status.use-case.spec.ts, prisma-staff-user.repository.spec.ts
  integration/staff-users.controller.spec.ts  → 200/401/403/201/400 + auto-rétrogradation/désactivation
```

## Modèles Prisma

`User` (`email`, `passwordHash`, `role` — enum `Role` : `CLIENT`/`COUTURIERE`/`MANAGER`/
`ADMIN`, `isActive`, `lastLoginAt`). Ce module ne lit/écrit que les lignes où
`role != CLIENT` (toutes les requêtes du repository sont scopées ainsi, y compris
`findById`/`findByEmail`, pour ne jamais exposer accidentellement un `Customer`).

## Cas d'usage clés

- Lister les comptes staff, filtrables par `role`/`isActive`, pagination
- Créer un compte staff avec un mot de passe initial choisi par l'ADMIN (email + rôle +
  mot de passe ≥ 8 caractères), refusé (409) si l'email est déjà utilisé par un compte staff
- Changer le rôle d'un compte staff (`COUTURIERE`/`MANAGER`/`ADMIN`) — un `ADMIN` ne peut
  jamais changer son propre rôle via cet endpoint (évite un verrouillage accidentel)
- Désactiver/réactiver un compte staff (`isActive`) — un `ADMIN` ne peut jamais se désactiver
  lui-même (mais peut se réactiver s'il était déjà inactif, cas d'un autre admin l'ayant
  réactivé entre-temps)

## Endpoints exposés

| Méthode | Route | Use-case | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/admin/users?role=&isActive=&page=&limit=` | `list-staff-users` | `ADMIN` |
| `POST` | `/api/admin/users` | `create-staff-user` | `ADMIN` |
| `PATCH` | `/api/admin/users/:id/role` | `change-staff-role` | `ADMIN` |
| `PATCH` | `/api/admin/users/:id/status` | `set-staff-user-status` | `ADMIN` |

## Points d'intégration

- **`auth`** : `AuthModule` exporte désormais aussi `PASSWORD_HASHER` (en plus de
  `JwtAuthGuard`/`RolesGuard`/`ACCESS_TOKEN_SERVICE` déjà exportés) — seul changement apporté
  à `auth` par cette session, additif et rétrocompatible. `users` importe `AuthModule` pour
  ses guards et ce port ; `JwtAuthGuard` reste le seul point de vérification de signature JWT.
- **`content`**, **`media`** : réutilisent directement `JwtAuthGuard`/`RolesGuard`/`@Roles()`
  depuis `auth/presentation/...` pour protéger leurs routes d'écriture `MANAGER`/`ADMIN` — pas
  de dépendance vers ce module.
- **Pages consommatrices** : aucune dans cette passe (voir note de scope ci-dessus).

## Points d'attention

- Ce module et `auth` gèrent tous deux des lignes de la table `User`, mais avec des
  périmètres strictement disjoints (`role = CLIENT` pour `auth`, `role != CLIENT` pour
  `users`) et des interfaces de repository distinctes (`IUserRepository` vs.
  `IStaffUserRepository`) : ne jamais fusionner les deux repositories, même si la table
  Prisma sous-jacente est identique.
- `change-staff-role`/`set-staff-user-status` comparent `actorUserId` (extrait du JWT courant
  via `@CurrentUser()`) à `targetUserId` — l'auto-verrouillage est bloqué en Application, pas
  seulement en UI.
- Aucune révocation de session immédiate n'est implémentée : un compte désactivé garde un
  access token valide jusqu'à son expiration naturelle (15 min par défaut, `auth`) — à
  améliorer si le produit exige une révocation immédiate (vérifier `isActive` dans
  `JwtAuthGuard` à chaque requête, actuellement hors périmètre de cette session pour éviter de
  modifier `auth` au-delà de l'export `PASSWORD_HASHER`).

## Vérification

- [x] `create-staff-user` testé (hash via le port partagé, 409 si email déjà pris)
- [x] `change-staff-role` testé (refus de l'auto-rétrogradation d'un `ADMIN`, 404 si absent)
- [x] `set-staff-user-status` testé (refus de l'auto-désactivation, 404 si absent)
- [x] `staff-users.controller.spec.ts` couvre 200/401/403/201/400
- [x] `pnpm --filter @angaly/api test` et `typecheck` verts pour ce module
- [x] `docs/checklist-implementation.md` : `users` passé à ✅
