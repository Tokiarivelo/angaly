# ANGALY — Checklist d'implémentation

> **Pour le détail par page/module** (fiche Stitch, spéc, phase), voir
> [`docs/mockup-reference.md`](./mockup-reference.md) — à consulter avant toute
> implémentation et à mettre à jour en fin d'implémentation.
>
> **Légende des statuts**
>
> - ✅ **Fait** — implémenté et confirmé (code + tests trouvés)
> - 🟡 **Partiel** — squelette/UI présent mais logique métier ou branchement API incomplet
> - ⬜ **À faire** — non démarré
> - 🔍 **À vérifier** — élément probablement présent mais non confirmé par un audit fin

---

## 🏗️ PHASE 0 — Fondation (Infrastructure & Scaffold)

- [x] ✅ **SETUP-01** — Monorepo Turborepo + pnpm (`apps/web`, `apps/api`, `apps/ai-service`,
      `packages/{database,types,config,storage,pattern-engine}`)
- [x] ✅ **SETUP-02** — Schéma Prisma initial (spec §96/§97) + migration + seed minimal
- [x] ✅ **SETUP-03** — Infra Docker (PostgreSQL, MinIO + bootstrap des buckets, Adminer,
      Nginx/Caddy configs) — `docker-compose.yml` (dev) + `docker-compose.prod.yml`
- [x] ✅ **SETUP-04** — Bootstrap NestJS (health check, Prisma module, filtres/intercepteurs
      globaux, Swagger) — 21 modules de domaine scaffoldés en squelette (README seulement)
- [x] ✅ **SETUP-05** — Bootstrap Next.js (route groups (public)/(auth)/(client)/(admin),
      providers, palette ANGALY dans `globals.css`, placeholder de démarrage)
- [x] ✅ **SETUP-06** — Bootstrap FastAPI `ai-service` (health check, endpoint suggestion
      placeholder, contrat `PatternAiSuggestionRequest/Response`)
- [x] ✅ **SETUP-07** — Règles (`.cursor/rules/*.mdc` ×9), skills (`.claude/skills/*` ×3),
      commandes (`.claude/commands/*` ×8), `CLAUDE.md`/`AGENTS.md`
- [x] ✅ **SETUP-08** — Documentation complète : architecture, conventions, development,
      deployment, testing, mockup-reference, checklist, phases, pages (38), features (22)

**Phase 0 : complète.** Aucune logique métier — chaque page/module reste ⬜ tant que sa
phase n'a pas été traitée en session dédiée (voir `.cursor/rules/006-phase-workflow.mdc`).

---

## 🏛️ PHASE 1 — Présence digitale (14 pages, 8 modules) — ✅ complète

### Pages
- [x] ✅ **home** — Page d'accueil (`docs/pages/home.md`) — sections statiques + créations
      vedettes/ateliers/journal en direct, témoignages/newsletter mockés MSW (Phase 2)
- [x] ✅ **la-une** — Vitrine éditoriale
- [x] ✅ **nos-creations-galerie** — Galerie complète des créations
- [x] ✅ **creation-detail** — Fiche détail d'une création
- [x] ✅ **collections-liste** — Index des collections
- [x] ✅ **collection-detail** — Fiche détail d'une collection
- [x] ✅ **a-propos** — Histoire de la maison
- [x] ✅ **nos-ateliers-liste** — Liste des ateliers + carte
- [x] ✅ **atelier-detail** — Fiche détail d'un atelier
- [x] ✅ **contact** — Page de contact
- [x] ✅ **journal-liste** — Blog/Journal, liste
- [x] ✅ **journal-article** — Article de blog
- [x] ✅ **page-404** — Page 404
- [x] ✅ **navigation-mobile** — Drawer, bottom bar, recherche, WhatsApp FAB

### Modules backend
- [x] ✅ **categories** — taxonomie partagée `Creation`/`Product`/`BlogPost` (`GET /api/categories?kind=`),
      sert le filtre Catégorie de `nos-creations-galerie`, testé de bout en bout contre
      Postgres réel (`docs/features/categories.md`)
- [x] ✅ **search** — recherche full-text PostgreSQL cross-entités (`$queryRaw` paramétré),
      résultats groupés par type, testé de bout en bout contre Postgres réel
      (`docs/features/search.md`)
- [x] ✅ **media** — upload présigné + confirm + upload buffer serveur + list + delete,
      Clean Architecture complète, testé de bout en bout contre MinIO/Postgres réels
      (`docs/features/media.md`)
- [x] ✅ **i18n** — résolution de locale (query > cookie > Accept-Language > fallback FR),
      middleware global + `@CurrentLocale()`, `GET /api/i18n/locales`
      (`docs/features/i18n.md`)
- [x] ✅ **creations** — liste filtrée/paginée (catégorie/collection/vedette/tri) + détail
      par slug avec médias ordonnés, testé de bout en bout contre Postgres réel
      (`docs/features/creations.md`)
- [x] ✅ **collections** — liste publiée uniquement (`creationsCount`) + détail par slug
      (créations + médias), testé de bout en bout contre Postgres réel
      (`docs/features/collections.md`)
- [x] ✅ **ateliers** — liste (tri ville/nom, sans pagination) + détail par slug avec
      horaires/services typés (`@angaly/types`), testé de bout en bout contre Postgres réel
      (a corrigé le seed Phase 0 au passage — voir `docs/features/ateliers.md`)
- [x] ✅ **blog** — liste (sans corps) + détail par slug (corps complet) + articles
      similaires, publication dérivée de `publishedAt`, testé de bout en bout contre
      Postgres réel (`docs/features/blog.md`)

---

## 💳 PHASE 2 — Conversion (11 pages, 6 modules)

### Pages
- [x] ✅ **personnalisation-creation** — Configurateur de personnalisation
- [x] ✅ **sur-mesure-process** — Page process Sur Mesure (7 sections), vérifiée contre
      l'écran Stitch réel via `agy` — plusieurs écarts avec `stitch-prompts/
      11-sur-mesure-process.md` corrigés (timeline sans description, grille mobile 2×4,
      galerie à 4 pièces exactes, pas de bandeau CTA sticky mobile) — voir
      `docs/pages/sur-mesure-process.md` "Points d'attention"
- [x] ✅ **demande-sur-mesure** — Formulaire de demande (3 étapes)
- [x] ✅ **devis** — Consultation d'un devis
- [x] ✅ **prendre-rendez-vous** — Prise de rendez-vous + calendrier (routée `(public)`,
      pas `(client)` — voir `docs/pages/prendre-rendez-vous.md`)
- [x] ✅ **confirmation-rendez-vous** — Confirmation (routée `(auth)` — voir
      `docs/pages/confirmation-rendez-vous.md`)
- [x] ✅ **pret-a-porter-catalogue** — Catalogue boutique (filtres sidebar synchronisés URL,
      favoris réels auth-gated — voir `docs/pages/pret-a-porter-catalogue.md`)
- [x] ✅ **fiche-produit** — Fiche produit prêt-à-porter (galerie+lightbox, variantes,
      panier local Zustand, favoris réels — voir `docs/pages/fiche-produit.md`)
- [x] ✅ **reservation-essayage** — Réservation d'essayage (routée `(public)` ; résumé
      produit mocké MSW, `GET /api/products/:id` reste un TODO backend — voir
      `docs/pages/reservation-essayage.md`)
- [x] ✅ **authentification** — Connexion / Inscription / Mot de passe oublié (NextAuth v5 beta
      + middleware/layouts (client)/(admin) — voir `docs/pages/authentification.md`)
- [x] ✅ **mes-favoris** — Favoris client

### Modules backend
- [x] ✅ **auth** — register/login/refresh (rotation)/logout/forgot-password/reset-password,
      RS256 JWT + httpOnly refresh cookie, testé de bout en bout contre Postgres réel
      (`docs/features/auth.md`) — frontend câblé via `authentification` (page), ✅
- [x] ✅ **customers** — profil (GET/PATCH `/api/customers/me`) + favoris (GET/POST
      `/api/favorites`, DELETE `/api/favorites/:id`, tous hydratés via `creations`/
      `collections`/`products`) — création `User`+`Customer` reste dans `auth`
      (`docs/features/customers.md`)
- [x] ✅ **products** — catalogue (GET `/api/products` filtré/trié/paginé + mode "produits
      similaires`), fiche produit (GET `/api/products/:slug`, variantes + inventaire),
      disponibilité de variante (usage interne, `orders` Phase 3) — `docs/features/products.md`
- [x] ✅ **appointments** — disponibilité (mois/jour), création (visiteur ou `Customer`
      connecté), consultation/annulation par référence, confirmation+assignation staff
      (RBAC `COUTURIERE`/`MANAGER`/`ADMIN`) — `docs/features/appointments.md`
- [x] ✅ **quotes** — devis (demande sur-mesure + dossier de conception), cycle de vie
      complet DRAFT→SENT→VIEWED→ACCEPTED/REJECTED/EXPIRED, export PDF via `media`
      (nouveau `MediaEntityType.QUOTE_DOCUMENT`/bucket `quotes`) — `docs/features/quotes.md`
- [x] ✅ **reviews**

---

## 📦 PHASE 3 — Production (6 pages, 3 modules)

### Pages
- [ ] 🟡 **panier** — Panier d'achat (UI + local store créés)
- [ ] 🟡 **checkout** — Adresse / Livraison / Paiement / Confirmation (Interface UI créée)
- [ ] 🟡 **espace-client-dashboard** — Tableau de bord client (Frontend UI créé)
- [ ] 🟡 **mes-rendez-vous** — Liste des rendez-vous client (Frontend UI créé)
- [ ] 🟡 **suivi-commande** — Timeline de suivi commande/création (Frontend UI créé)
- [ ] 🟡 **messages-factures-notifications** — Messagerie, factures, notifications (Frontend UI créé)

### Modules backend
- [ ] 🟡 **orders** · ✅ **payments** · ⬜ **notifications**

---

## 🧵 PHASE 4 — Premium — Angaly Pattern Studio (5 pages, 3 modules)

### Pages
- [x] ✅ **pattern-studio-landing** — Landing Pattern Studio
- [x] ✅ **pattern-studio-wizard** — Assistant de création (7 étapes)
- [x] ✅ **pattern-studio-preview-validation-export** — Prévisualisation, validation, export
- [x] ✅ **mes-projets-patron** — Liste des projets de patron
- [x] ✅ **mes-mesures** — Profils de mesures

### Modules backend
- [x] ✅ **measurements**
- [x] ✅ **patterns** · **pattern-engine** (le moteur géométrique
      lui-même a déjà une orchestration testée en Phase 0 — reste à écrire les règles par
      type de vêtement, voir le skill `pattern-engine-rule`)

---

## 🤖 PHASE 5 — IA avancée (0 nouvelle page, 1 module)

- [x] ✅ **ai-inference** — Vrai modèle de suggestion (remplace le placeholder), analyse
      réelle de photo d'inspiration, widget assistant IA global (spec §31-32)

`apps/ai-service` reste en mode placeholder (`modelVersion: "placeholder-0.0.0"`) tant que
cette phase n'est pas traitée — voir `apps/ai-service/README.md`.

---

## 🗂️ PHASE 6 — Admin (back-office) (2 pages, 2 modules)

### Pages
- [ ] ⬜ **admin-gestion-contenu** — Éditeur de contenu par page/section
- [ ] ⬜ **admin-mediatheque** — Médiathèque (MinIO)

### Modules backend
- [ ] ⬜ **users** — Gestion des comptes staff (Couturière/Manager/Admin), RBAC (spec §68/§83)
- [ ] ⬜ **content** — `PageSection`/`PageSectionVersion`, sert `admin-gestion-contenu`

> Périmètre volontairement limité aux 2 pages couvertes par une maquette Stitch
> (`stitch-prompts/31-*.md`). Le reste du back-office listé au spec §60-66
> (Réalisations/Produits/Collections/Rendez-vous/Clients/Patron Premium admin) n'a pas de
> maquette dédiée à ce jour — à ajouter comme une Phase 7 si le besoin est confirmé.
