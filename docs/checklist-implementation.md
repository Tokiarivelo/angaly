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
      vedettes/ateliers/journal en direct, témoignages/newsletter mockés MSW (Phase 2). Texte
      des sections lu depuis `PageSection` (`content`, Phase 6) depuis la session 2026-09-16
      (suite), avec repli sur les littéraux codés en dur — voir `docs/features/content.md`
- [x] ✅ **la-une** — Vitrine éditoriale. Texte de l'en-tête lu depuis `PageSection`
      (`content`, Phase 6) depuis la session 2026-09-16 (suite), avec repli sur les littéraux
      codés en dur — voir `docs/features/content.md`
- [x] ✅ **nos-creations-galerie** — Galerie complète des créations. Texte de l'en-tête
      (titre/intro) lu depuis `PageSection` (`content`, Phase 6) depuis la session 2026-09-16
      (suite), avec repli sur les littéraux codés en dur — voir `docs/features/content.md`
- [x] ✅ **creation-detail** — Fiche détail d'une création. Texte du bandeau savoir-faire lu
      depuis `PageSection` (`content`, Phase 6) depuis la session 2026-09-16 (suite), avec
      repli sur le littéral codé en dur — voir `docs/features/content.md`
- [x] ✅ **collections-liste** — Index des collections. Texte du header (titre/sous-titre) lu
      depuis `PageSection` (`content`, Phase 6) depuis la session 2026-09-16 (suite), avec
      repli sur les littéraux codés en dur — voir `docs/features/content.md`
- [x] ✅ **collection-detail** — Fiche détail d'une collection. Headline + libellés des 2 CTA
      de la bande de fermeture lus depuis `PageSection` (`content`, Phase 6) depuis la
      session 2026-09-16 (suite), avec repli sur les littéraux codés en dur — voir
      `docs/features/content.md`
- [x] ✅ **a-propos** — Histoire de la maison. Texte des sections lu depuis `PageSection`
      (`content`, Phase 6) depuis la session 2026-09-16 (suite), avec repli sur les
      littéraux codés en dur — voir `docs/features/content.md`
- [x] ✅ **nos-ateliers-liste** — Liste des ateliers + carte
- [x] ✅ **atelier-detail** — Fiche détail d'un atelier
- [x] ✅ **contact** — Page de contact. Texte du header (titre/sous-titre) lu depuis
      `PageSection` (`content`, Phase 6) depuis la session 2026-09-16 (suite), avec repli sur
      les littéraux codés en dur — voir `docs/features/content.md`
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

## 📦 PHASE 3 — Production (6 pages, 4 modules) — ✅ 6/6 pages câblées

### Pages
- [x] ✅ **panier** — Panier d'achat (store Zustand réel, cohérent avec le payload attendu par
      `checkout` — voir `docs/pages/panier.md`)
- [x] ✅ **checkout** — Adresse / Livraison / Paiement / Confirmation câblés pour de vrai
      (`POST /api/orders` puis `POST /api/payments`, guard d'authentification côté frontend
      avant soumission) — guest checkout non implémenté (compte requis), voir
      `docs/pages/checkout.md` "Points d'attention"
- [x] ✅ **espace-client-dashboard** — Agrégation réelle (rendez-vous/commandes/pattern-projects/
      notifications) via plusieurs requêtes react-query, pas d'endpoint agrégé dédié — voir
      `docs/pages/espace-client-dashboard.md`
- [x] ✅ **mes-rendez-vous** — Câblé sur `GET /api/appointments` (nouvel endpoint "mes
      rendez-vous", voir module `appointments` ci-dessous) + annulation réelle — voir
      `docs/pages/mes-rendez-vous.md`
- [x] ✅ **suivi-commande** — Résolution de la commande par `orderNumber` depuis
      `GET /api/orders` (pas d'endpoint dédié par numéro), timeline dérivée de `OrderStatus`
      — voir `docs/pages/suivi-commande.md` "Points d'attention" (écart de granularité assumé)
- [x] ✅ **messages-factures-notifications** — Trois onglets câblés pour de vrai : Factures
      (`GET /api/payments`, voir module `payments` ci-dessous), Notifications, et désormais
      Messages (nouveau module `messages` — `Conversation`/`Message`, voir ci-dessous et
      `docs/features/messages.md`) — voir `docs/pages/messages-factures-notifications.md`

### Modules backend
- [x] ✅ **orders** (câblé pour de vrai dans `checkout`/`suivi-commande`/
      `espace-client-dashboard` ; voir `docs/features/orders.md`) ·
      ✅ **payments** (guards d'authentification, transitions via `orders`, + nouvel endpoint
      `GET /api/payments` (liste par client, `ListCustomerPaymentsUseCase`) câblé dans
      `messages-factures-notifications` — voir `docs/features/payments.md`) ·
      ✅ **appointments** (+ nouvel endpoint `GET /api/appointments` (liste par client,
      `ListMyAppointmentsUseCase`, mirroir du pattern `orders`) câblé dans `mes-rendez-vous`/
      `espace-client-dashboard` — voir `docs/features/appointments.md`) ·
      ✅ **notifications** (session 2026-09-15 : email SMTP générique + in-app, câblé dans
      `orders`/`payments` (`ORDER_STATUS_CHANGED`) et `appointments` (`APPOINTMENT_CONFIRMED`,
      visiteurs anonymes exclus) — `quotes`/`patterns`/`create-appointment`/`cancel-appointment`/
      `refund-payment` restent à câbler ; WhatsApp non branché (aucun prestataire confirmé) ;
      frontend câblé pour de vrai dans `messages-factures-notifications` (liste, lu individuel,
      tout marquer lu) — voir `docs/features/notifications.md`) ·
      ✅ **messages** (nouveau module — `Conversation`/`Message`, find-or-create staff-only pour
      démarrer un fil, `MESSAGE_RECEIVED` câblé vers `notifications` côté staff — pas de boîte
      de réception staff dans cette phase — voir `docs/features/messages.md`)

---

## 🧵 PHASE 4 — Premium — Angaly Pattern Studio (5 pages, 3 modules)

### Pages
- [x] ✅ **pattern-studio-landing** — Landing Pattern Studio
- [x] ✅ **pattern-studio-wizard** — Assistant de création (7 étapes)
- [x] ✅ **pattern-studio-preview-validation-export** — Prévisualisation, validation, export
- [x] ✅ **mes-projets-patron** — Liste des projets de patron
- [x] ✅ **mes-mesures** — Profils de mesures

### Modules backend
- [x] ✅ **measurements** (+ tailles standard XS/S/M/L/XL…, session 2026-09-14)
- [x] ✅ **patterns** · **pattern-engine** (le moteur géométrique
      lui-même a déjà une orchestration testée en Phase 0 — reste à écrire les règles par
      type de vêtement, voir le skill `pattern-engine-rule`). Session 2026-09-14 : corrigé le
      bug de nommage de mesures qui faisait retomber toute génération sur un corps par défaut
      codé en dur — voir `docs/features/patterns.md`.

---

## 🤖 PHASE 5 — IA avancée (0 nouvelle page, 1 module)

- [x] ✅ **ai-inference** — Pipeline réellement branché (suggestion de coupe/détails, analyse
      de photo d'inspiration, estimation IA des mesures manquantes, assistant IA global) sur
      `apps/ai-service` (session 2026-09-14 — auparavant du code mort non appelé). Session
      2026-09-15 : ajout d'un **vrai modèle entraîné** (`sklearn.impute.IterativeImputer`,
      données réelles ANSUR II) pour l'estimation de mesures, sélectionnable par un admin —
      voir `docs/features/ai-model-settings.md`. La suggestion de coupe/détails reste Gemini
      uniquement (aucune donnée publique disponible pour entraîner ce cas précis).

`apps/ai-service` n'utilise plus de placeholder statique pour `suggest-parameters`/
`estimate-measurements`/`chat/assistant` — voir `apps/ai-service/README.md`,
`docs/features/ai-inference.md` et `docs/features/ai-model-settings.md`.

---

## 🗂️ PHASE 6 — Admin (back-office) (2 pages, 2 modules) — ✅ 2/2 pages, 2/2 modules

### Pages
- [x] ✅ **admin-gestion-contenu** — Éditeur de contenu par page/section (session 2026-09-16)
- [x] ✅ **admin-mediatheque** — Médiathèque (MinIO) (session 2026-09-16)

### Modules backend
- [x] ✅ **users** — Gestion des comptes staff (Couturière/Manager/Admin), RBAC (spec §68/§83)
      (session 2026-09-16) — **backend uniquement**, pas de page dédiée (aucune maquette
      Stitch ne couvre un écran de gestion des comptes dans le périmètre actuel), voir
      `docs/features/users.md`
- [x] ✅ **content** — `PageSection`/`PageSectionVersion`, sert `admin-gestion-contenu`
      (session 2026-09-16). Endpoint public `GET /content/public/:page` (`PUBLISHED`-only,
      sans auth) ajouté en session 2026-09-16 (suite), consommé par
      `home`/`a-propos`/`la-une`/`nos-creations-galerie`/`creation-detail`/`contact`/
      `collections-liste`/`collection-detail` (8/14 pages Phase 1) — voir
      `docs/features/content.md`

> Périmètre volontairement limité aux 2 pages couvertes par une maquette Stitch
> (`stitch-prompts/31-*.md`). Le reste du back-office listé au spec §60-66
> (Réalisations/Produits/Collections/Rendez-vous/Clients/Patron Premium admin) n'a pas de
> maquette dédiée à ce jour — à ajouter comme une Phase 7 si le besoin est confirmé, de même
> qu'un futur écran de gestion des comptes staff pour `users`.
>
> **Réserves de la session 2026-09-16** (voir `docs/features/*.md`/`docs/pages/*.md` pour le
> détail) : vérification Stitch impossible dans cet environnement (`mcp__stitch__*` en échec
> d'auth, `agy` absent) — structure/copy des 2 pages reconstruites depuis le texte de
> `stitch-prompts/31-*.md` uniquement, à revalider contre l'écran réel dès que possible ;
> l'étape 4 de `docs/phases/phase-6-admin-cms.md` (migrer les pages publiques vers
> `PageSection`) a démarré en session 2026-09-16 (suite) —
> `home`/`a-propos`/`la-une`/`nos-creations-galerie`/`creation-detail`/`contact`/
> `collections-liste`/`collection-detail` migrées (8 des 14 pages Phase 1), les 6 autres
> restent **non traitées** ; le panneau "Utilisée dans" de
> `admin-mediatheque` est limité par un bug pré-existant non corrigé (relations `Media`
> jamais connectées par `confirm-upload`, voir `docs/features/media.md`).

### Hors périmètre spec — ajouté le 2026-09-15
- [x] ✅ **admin-ai-settings** — `/admin/dashboard` + `/admin/ai-settings`, choix du modèle
      IA pour l'estimation de mesures (voir `docs/features/ai-model-settings.md`,
      `docs/pages/admin-ai-settings.md`). Module backend `admin-ai-settings` distinct des
      2 modules ci-dessus (`users`, `content`, toujours ⬜) — ce n'est **pas** une avancée
      de la Phase 6 spec, seulement un shell admin minimal pour cette seule fonctionnalité.
