Gère la base de données PostgreSQL du projet ANGALY.

Sous-commandes disponibles selon l'argument fourni :

**migrate** — Crée et applique les migrations Prisma :

```bash
pnpm --filter @angaly/database exec prisma migrate dev --name <nom-migration>
```

Demande le nom de la migration si non fourni.

**migrate:prod** — Applique les migrations en production (sans en créer) :

```bash
pnpm --filter @angaly/database db:migrate:prod
```

**seed** — Remplit la base avec les données de départ (admin, atelier principal, catégories) :

```bash
pnpm --filter @angaly/database db:seed
```

**reset** — ⚠️ DESTRUCTIF — Recrée la base et rejoue les migrations + seed :

```bash
pnpm --filter @angaly/database db:reset
```

Demande confirmation explicite avant d'exécuter.

**studio** — Ouvre Prisma Studio (GUI base de données) sur http://localhost:5555 :

```bash
pnpm --filter @angaly/database db:studio
```

**generate** — Régénère le client Prisma après modification de `schema.prisma` :

```bash
pnpm --filter @angaly/database db:generate
```

Rappelle de répliquer tout enum modifié dans `packages/types/src/index.ts`
(voir `.cursor/rules/005-types-shared.mdc`).

**status** — Affiche l'état des migrations :

```bash
pnpm --filter @angaly/database exec prisma migrate status
```

Si aucun argument : liste ces sous-commandes disponibles.
