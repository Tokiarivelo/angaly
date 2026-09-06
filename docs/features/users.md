# Feature — `users`

**Statut : ⬜ À faire.** Phase 6 — Admin (back-office).

## Objet

Gestion des comptes internes (staff) — `COUTURIERE`/`MANAGER`/`ADMIN` (spec §68) : liste,
invitation, changement de rôle, désactivation. Les comptes `CLIENT` restent en libre-service
via `auth`/`customers` (Phase 2) — ce module ne les gère jamais. Porte également le
`RolesGuard`/`@Roles()` **partagé** avec les autres modules à routes admin-only
(`content`, `media` — voir leurs fiches respectives, qui référencent ce guard).

## Emplacement Clean Architecture

`apps/api/src/users/`

```
domain/
  entities/staff-user.entity.ts           → invariants métier (role ∈ {COUTURIERE, MANAGER, ADMIN}, jamais CLIENT)
  repositories/staff-user.repository.ts   → interface IStaffUserRepository (zéro import Prisma) — périmètre staff uniquement, distinct de IUserRepository (`auth`)
application/
  use-cases/
    list-staff-users.use-case.ts          → filtre role/isActive, pagination
    invite-staff-user.use-case.ts         → crée le User (role choisi, isActive=false) + déclenche la définition de mot de passe
    change-staff-role.use-case.ts         → transition de rôle, refuse qu'un ADMIN se rétrograde lui-même
    deactivate-staff-user.use-case.ts     → isActive → false, révoque implicitement les sessions actives
    reactivate-staff-user.use-case.ts     → isActive → true
  dtos/
    staff-user-response.dto.ts
    invite-staff-user.dto.ts
infrastructure/
  repositories/prisma-staff-user.repository.ts → implémente IStaffUserRepository via PrismaService (filtre role != CLIENT)
  mappers/staff-user.mapper.ts
presentation/
  controllers/staff-users.controller.ts
__tests__/
  unit/invite-staff-user.use-case.spec.ts
  unit/change-staff-role.use-case.spec.ts
  integration/staff-users.controller.spec.ts
  integration/roles.guard.spec.ts          → couvre le guard partagé (403 CLIENT/COUTURIERE, 200 MANAGER/ADMIN selon la route)
```

Le `RolesGuard`/`@Roles()` réutilisé par `content`/`media` vit dans
`apps/api/src/shared/` (pas dans ce module) pour éviter une dépendance directe d'un module
métier vers `users` :

```
apps/api/src/shared/
  decorators/roles.decorator.ts  → @Roles('MANAGER', 'ADMIN')
  guards/roles.guard.ts          → lit req.user.role (injecté par JwtAuthGuard de `auth`) contre les métadonnées @Roles()
```

`content`'s `presentation/guards/roles.guard.ts` (voir `docs/features/content.md`) est un
ré-export local de ce guard partagé pour l'ergonomie d'import du module, pas une seconde
implémentation.

## Modèles Prisma

`User` (`email`, `passwordHash`, `role` — enum `Role` : `CLIENT`/`COUTURIERE`/`MANAGER`/
`ADMIN`, `isActive`, `lastLoginAt`). Ce module ne lit/écrit que les lignes où
`role != CLIENT`.

## Cas d'usage clés

- Lister les comptes staff, filtrables par `role`/`isActive`, pagination
- Inviter un compte staff : crée le `User` avec le rôle choisi et `isActive = false`,
  déclenche l'envoi d'un lien de définition de mot de passe (réutilise le mécanisme de
  jeton de `auth`.`request-password-reset` plutôt que d'en réimplémenter un second — seule
  dépendance de ce module vers `auth`, documentée explicitement) ; `isActive` passe à `true`
  une fois le mot de passe défini
- Changer le rôle d'un compte staff (`COUTURIERE`/`MANAGER`/`ADMIN`) — un `ADMIN` ne peut
  jamais changer son propre rôle via cet endpoint (évite un verrouillage accidentel de tous
  les accès admin)
- Désactiver/réactiver un compte staff (`isActive`) — un compte désactivé perd
  immédiatement l'accès aux routes protégées par `JwtAuthGuard` (vérification `isActive` à
  chaque requête, pas seulement à la connexion)

## Endpoints exposés

| Méthode | Route | Use-case | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/admin/users?role=&isActive=&page=` | `list-staff-users` | `MANAGER`,`ADMIN` |
| `POST` | `/api/admin/users/invite` | `invite-staff-user` | `ADMIN` |
| `PATCH` | `/api/admin/users/:id/role` | `change-staff-role` | `ADMIN` |
| `PATCH` | `/api/admin/users/:id/deactivate` | `deactivate-staff-user` | `ADMIN` |
| `PATCH` | `/api/admin/users/:id/reactivate` | `reactivate-staff-user` | `ADMIN` |

## Points d'intégration

- **`auth`** : réutilise le mécanisme de jeton de `request-password-reset` pour la
  définition du mot de passe à l'invitation ; `JwtAuthGuard` (`auth`) reste le seul point de
  vérification de signature du token — ce module ne réémet jamais de JWT lui-même.
- **`content`**, **`media`** : consomment le `RolesGuard`/`@Roles()` défini dans
  `apps/api/src/shared/` (voir Emplacement Clean Architecture ci-dessus) pour protéger leurs
  routes d'écriture `MANAGER`/`ADMIN` — ce module est le propriétaire fonctionnel du concept
  de rôle, `shared/` en porte l'implémentation technique réutilisable.
- **`notifications`** (Phase 3) : `invite-staff-user`/`deactivate-staff-user` déclenchent
  chacun un email une fois le module livré ; TODO explicite en attendant.
- **Pages consommatrices** : `admin-gestion-contenu`, `admin-mediatheque` (protection
  d'accès uniquement — la gestion des comptes staff elle-même n'a pas encore de page dédiée
  dans le périmètre Stitch actuel, voir la note de scope Phase 7 dans
  `docs/checklist-implementation.md`).

## Points d'attention

- Ce module et `auth` gèrent tous deux des lignes de la table `User`, mais avec des
  périmètres strictement disjoints (`role = CLIENT` pour `auth`, `role != CLIENT` pour
  `users`) et des interfaces de repository distinctes (`IUserRepository` vs.
  `IStaffUserRepository`) : ne jamais fusionner les deux repositories, même si la table
  Prisma sous-jacente est identique — la séparation reflète des invariants métier différents
  (un `Customer` n'existe que pour `role = CLIENT`, voir `docs/features/customers.md`).
- `change-staff-role`/`deactivate-staff-user` doivent recharger `req.user` à chaque requête
  (pas de cache de rôle en session) : un `ADMIN` désactivé ou rétrogradé doit perdre l'accès
  immédiatement, pas seulement à sa prochaine connexion.

## Vérification

- [ ] `invite-staff-user` testé (rôle staff uniquement, `isActive = false` à la création)
- [ ] `change-staff-role` testé (refus de l'auto-rétrogradation d'un `ADMIN`)
- [ ] `roles.guard.spec.ts` : 403 pour `CLIENT`/`COUTURIERE`, 200 pour `MANAGER`/`ADMIN`
      selon la route (aligné avec le test équivalent de `content`)
- [ ] `staff-users.controller.spec.ts` couvre les codes 200/403/404
- [ ] `docs/checklist-implementation.md` : `users` passé à ✅
