# Page — `navigation-mobile`

**Statut : ✅ Fait.** Phase 1 — Présence digitale.

## Objet

Composants globaux, transverses et mobile-first utilisés par toutes les pages publiques :
tiroir de navigation mobile, barre d'actions basse sticky, bouton flottant WhatsApp, et
overlay de recherche. Ne constituent pas une page mais l'ossature de navigation mobile du
site (spec §4, §73).

## Route(s)

Ce n'est pas une route : composants globaux montés depuis `apps/web/src/app/(public)/layout.tsx`,
alongside `Header`/`Footer`, pas depuis un `page.tsx` dédié.

## Référence maquette

- Prompt Stitch : `stitch-prompts/30-page-404-et-composants-mobiles.md` (Écrans B à D)
- Écrans Stitch réels : **ANGALY — Menu Mobile**, **ANGALY — Navigation Mobile & FAB**,
  **ANGALY — Recherche (Overlay)**
- Section spécification : §4, §73 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants (livrée)

```
apps/web/src/components/navigation/
  MobileNavigationShell.tsx     → monte drawer + overlay + bottom bar + FAB, pure composition
  MobileDrawer.tsx                → 'use client', Radix Dialog (focus-trap + Échap gratuits)
  MobileBottomBar.tsx               → 'use client', barre basse sticky (lg:hidden)
  WhatsAppFab.tsx                     → Server Component (pas de state), lit NEXT_PUBLIC_WHATSAPP_NUMBER
  MobileSearchOverlay.tsx               → 'use client', Radix Dialog, résultats groupés en direct
apps/web/src/features/navigation/
  hooks/
    useMobileDrawer.ts                  → lit/écrit apps/web/src/stores/mobile-navigation.store.ts
    useMobileSearchOverlay.ts             → idem + requête brute/debouncée (300ms, useEffect+setTimeout, pas de nouvelle dépendance)
    useGlobalSearch.ts                     → react-query sur GET /api/search, dérive hasResults
  api/
    navigation.api.ts                        → useGlobalSearchQuery (enabled dès MIN_SEARCH_QUERY_LENGTH)
  consts/
    nav-links.const.ts                        → liens réels du tiroir (voir Points d'attention)
    search-suggestion-chips.const.ts           → 4 chips réels (voir Points d'attention)
    search.const.ts                             → MIN_SEARCH_QUERY_LENGTH (miroir du backend)
    queryKeys.ts
  __tests__/
    useMobileDrawer.test.ts, useMobileSearchOverlay.test.ts, useGlobalSearch.test.ts
apps/web/src/stores/mobile-navigation.store.ts  → Zustand (non persisté) partagé Header ↔ Shell
apps/web/src/components/navigation/__tests__/
  MobileDrawer.test.tsx, MobileBottomBar.test.tsx, WhatsAppFab.test.tsx,
  MobileSearchOverlay.test.tsx, MobileNavigationShell.test.tsx
apps/web/src/components/layout/__tests__/Header.test.tsx  → nouveaux boutons menu/recherche uniquement
```

Pas de `types/global-search-result.types.ts` local : `SearchResultDto`/`SearchResultsResponseDto`
ont été ajoutés à `@angaly/types` (règle absolue #2 — voir Points d'attention). Pas de
`useLanguageSwitcher.ts` : le sélecteur de langue FR/MG existe déjà
(`apps/web/src/stores/locale.store.ts` + `apps/web/src/components/layout/LanguageSwitcher.tsx`,
livré lors d'une session antérieure) — réutilisé tel quel dans le tiroir plutôt que
redéveloppé.

Toute logique (ouverture/fermeture, recherche, debounce) vit dans `hooks/` — les composants
de `components/navigation/` ne contiennent que du JSX + appels de hooks.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/search?q=&limitPerType=5` | `search` | Résultats groupés de l'overlay de recherche mobile (spec §46/§85) — déjà ✅ livré en amont |

## Modèles Prisma touchés

Aucun modèle dédié : `search` agrège en lecture `Creation`, `Product`, `Collection`,
`BlogPost`, `Atelier` (voir `docs/features/search.md`).

## Points d'attention

- **Fidélité vérifiée via `agy`/StitchMCP `get_screen`** sur 3 écrans réels distincts (pas
  1 seul écran compound comme le titre de la fiche le laissait penser) :
  `47ac100c5e74439e885615a160cd03ec` (Menu Mobile), `d8798d71cecb42749e0d988cd027b8b4`
  (Navigation Mobile & FAB), `0ee4d5ebf30e46e88d8f343c6e09dae0` (Recherche). `list_screens`
  MCP était bloqué en mode headless (permission "command" refusée) — screens trouvés un par
  un via `get_screen` par titre exact, pas seulement les prompts texte.
- **Liens réels du tiroir** : `Accueil, La Une, Nos Créations, Prêt-à-porter, Sur Mesure,
  Patron Premium (badge "Premium"), À propos, Ateliers, Journal, Contact` + section
  secondaire `Rechercher, Mes favoris, Mon compte` — confirmés sur l'écran réel, pas
  seulement déduits du prompt.
- **Chips de suggestion réels** : `Robes, Costumes, Accessoires, Atelier` — pas « Robes de
  mariée, Costumes, Collections, Journal » comme le plan initial (issu du seul prompt texte)
  le supposait. Ce sont de simples chaînes qui préremplissent l'input, pas des slugs de
  catégorie réels.
- **`SearchResultDto`/`SearchResultsResponseDto` ajoutés à `@angaly/types`** : le module
  `search` (déjà ✅ livré) n'avait qu'un DTO NestJS interne
  (`apps/api/src/search/application/dtos/search-results-response.dto.ts`), jamais exposé
  côté partagé — corrigé ici pour respecter la règle absolue #2 (`packages/types` doit être
  rebuild via `pnpm --filter @angaly/types build` après tout ajout, sinon `tsc` échoue côté
  web avec des types introuvables).
- **Header desktop devient responsive plutôt qu'un nouveau composant "barre mobile"
  séparé** : le plan initial listait seulement `MobileDrawer`/`MobileBottomBar`/`WhatsAppFab`/
  `MobileSearchOverlay`, sans nommer explicitement la barre du haut mobile (menu + logo +
  recherche) vue sur l'écran réel "Navigation Mobile & FAB". Plutôt que de monter un
  second élément `fixed top-0` en concurrence avec le `Header` sticky existant,
  `apps/web/src/components/layout/Header.tsx` a été rendu responsive : la même balise
  `<header>` affiche la ligne desktop (`lg:` et plus) ou la barre mobile réelle (en dessous
  de `lg:`) — résout directement le commentaire "dégrade en barre minimale en attendant" que
  ce composant portait depuis le début de session.
- **Breakpoint `lg:` partout, pas le `md:` brut de la maquette** : cohérence avec le seul
  breakpoint desktop/mobile déjà choisi par `Header.tsx` avant cette fiche, plutôt que
  d'introduire un second seuil (`md:`) juste pour coller littéralement au HTML Stitch brut.
- **FAB WhatsApp visible à toutes les tailles d'écran** (pas seulement mobile) : l'écran réel
  ne le restreint pas au mobile (contrairement à la barre basse, explicitement `md:hidden`
  dans le HTML réel) — `bottom-28` sur mobile (dégage la barre basse) → `lg:bottom-6` sur
  desktop (aucune barre à dégager). Numéro exclusivement via `NEXT_PUBLIC_WHATSAPP_NUMBER`
  (règle absolue #3, jamais codé en dur) ; ajouté à `apps/web/.env.local` (fichier local
  gitignored) avec le même numéro fictif déjà utilisé pour l'atelier/contact seedés cette
  session — **pas ajouté à `.env.example`/`apps/web/.env.local.example`** car ces fichiers
  faisaient partie d'une migration de ports en cours de l'utilisateur au moment de cette
  session, non committée : à ajouter par l'utilisateur une fois cette migration mergée.
- **État partagé via Zustand (`stores/mobile-navigation.store.ts`), pas React Context** :
  `Header` (déclencheurs) et `MobileNavigationShell` (tiroir/overlay rendus) sont des
  cousins sous `(public)/layout.tsx`, pas parent/enfant — Zustand évite un Context Provider
  supplémentaire à ce niveau, cohérent avec `useLocaleStore` déjà utilisé ainsi dans ce
  projet (règle absolue #11).
- **Focus-trap + Échap via Radix Dialog (`@radix-ui/react-dialog`, déjà une dépendance)**,
  pas de logique de piège de focus écrite à la main — respecte spec §74 sans nouvel ajout de
  dépendance.
- **« Voir tout » de chaque groupe de résultats pointe vers la liste de base** (`/creations`,
  `/journal`, etc.), sans préremplir un filtre de recherche — aucune des pages liste livrées
  cette session ne supporte encore un paramètre `?q=` côté client ; lien fonctionnel, pas de
  filtrage pré-appliqué. À revoir si une vraie recherche in-page est demandée.
- Recherche activée dès `MIN_SEARCH_QUERY_LENGTH` (2, miroir exact du minimum backend) ;
  debounce 300 ms sur un `useEffect`/`setTimeout` local plutôt qu'une nouvelle dépendance
  (`use-debounce` etc.) pour un besoin aussi simple.
- Sélecteur de langue FR/MG : déjà fonctionnel et persistant (`useLocaleStore`, Zustand +
  `persist`), simplement réutilisé dans le pied du tiroir — ne traduit pas encore le contenu
  (Phase 6, `content`), comportement déjà documenté ailleurs.

## Checklist d'acceptation

- [x] Tiroir mobile (liens, actions rapides, CTA rendez-vous, réseaux) fidèle à l'écran réel
- [x] Barre basse sticky (accueil, recherche, rendez-vous proéminent, favoris, compte) fidèle à l'écran réel
- [x] Bouton flottant WhatsApp positionné sans chevaucher la barre basse, animation de pulse discrète
- [x] Overlay de recherche plein écran avec chips de suggestion + résultats groupés en direct
- [x] Sélecteur de langue FR/MG fonctionnel et persistant entre les pages (réutilisé, déjà livré)
- [x] Navigation clavier complète du tiroir et de l'overlay (piège de focus, fermeture Échap) — via Radix Dialog, vérifié en direct
- [x] Tests : `useMobileDrawer.test.ts`, `useMobileSearchOverlay.test.ts`, `useGlobalSearch.test.ts`, 5 fichiers de tests composants, `Header.test.tsx` — 22 tests, 100 % de couverture sur `features/navigation` (composants sous `components/**` hors périmètre de la barre de couverture, voir `vitest.config.ts`)
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
