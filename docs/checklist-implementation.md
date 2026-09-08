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

## 🏛️ PHASE 1 — Présence digitale (14 pages, 7 modules)

### Pages
- [x] ✅ **home** — Page d'accueil (`docs/pages/home.md`) — sections statiques + créations
      vedettes/ateliers/journal en direct, témoignages/newsletter mockés MSW (Phase 2)
- [x] ✅ **la-une** — Vitrine éditoriale
- [ ] 🟡 **nos-creations-galerie** — Galerie complète des créations
- [ ] 🟡 **creation-detail** — Fiche détail d'une création
- [x] ✅ **collections-liste** — Index des collections
- [x] ✅ **collection-detail** — Fiche détail d'une collection
- [x] ✅ **a-propos** — Histoire de la maison
- [x] ✅ **nos-ateliers-liste** — Liste des ateliers + carte
- [x] ✅ **atelier-detail** — Fiche détail d'un atelier
- [x] ✅ **contact** — Page de contact
- [x] ✅ **journal-liste** — Blog/Journal, liste
- [x] ✅ **journal-article** — Article de blog
- [x] ✅ **page-404** — Page 404
- [ ] ⬜ **navigation-mobile** — Drawer, bottom bar, recherche, WhatsApp FAB

### Modules backend
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
- [ ] ⬜ **personnalisation-creation** — Configurateur de personnalisation
- [ ] ⬜ **sur-mesure-process** — Page process Sur Mesure
- [ ] ⬜ **demande-sur-mesure** — Formulaire de demande (3 étapes)
- [ ] ⬜ **devis** — Consultation d'un devis
- [ ] ⬜ **prendre-rendez-vous** — Prise de rendez-vous + calendrier
- [ ] ⬜ **confirmation-rendez-vous** — Confirmation
- [ ] ⬜ **pret-a-porter-catalogue** — Catalogue boutique
- [ ] ⬜ **fiche-produit** — Fiche produit prêt-à-porter
- [ ] ⬜ **reservation-essayage** — Réservation d'essayage
- [ ] ⬜ **authentification** — Connexion / Inscription / Mot de passe oublié
- [ ] ⬜ **mes-favoris** — Favoris client

### Modules backend
- [ ] ⬜ **auth** · **customers** · **appointments** · **products** · **quotes** · **reviews**

---

## 📦 PHASE 3 — Production (6 pages, 3 modules)

### Pages
- [ ] ⬜ **panier** — Panier d'achat
- [ ] ⬜ **checkout** — Adresse / Livraison / Paiement / Confirmation
- [ ] ⬜ **espace-client-dashboard** — Tableau de bord client
- [ ] ⬜ **mes-rendez-vous** — Liste des rendez-vous client
- [ ] ⬜ **suivi-commande** — Timeline de suivi commande/création
- [ ] ⬜ **messages-factures-notifications** — Messagerie, factures, notifications

### Modules backend
- [ ] ⬜ **orders** · **payments** · **notifications**

---

## 🧵 PHASE 4 — Premium — Angaly Pattern Studio (5 pages, 3 modules)

### Pages
- [ ] ⬜ **pattern-studio-landing** — Landing Pattern Studio
- [ ] ⬜ **pattern-studio-wizard** — Assistant de création (7 étapes)
- [ ] ⬜ **pattern-studio-preview-validation-export** — Prévisualisation, validation, export
- [ ] ⬜ **mes-projets-patron** — Liste des projets de patron
- [ ] ⬜ **mes-mesures** — Profils de mesures

### Modules backend
- [ ] ⬜ **measurements** · **patterns** · **pattern-engine** (le moteur géométrique
      lui-même a déjà une orchestration testée en Phase 0 — reste à écrire les règles par
      type de vêtement, voir le skill `pattern-engine-rule`)

---

## 🤖 PHASE 5 — IA avancée (0 nouvelle page, 1 module)

- [ ] ⬜ **ai-inference** — Vrai modèle de suggestion (remplace le placeholder), analyse
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
