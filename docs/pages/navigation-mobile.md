# Page — `navigation-mobile`

**Statut : ⬜ À faire.** Phase 1 — Présence digitale.

## Objet

Composants globaux, transverses et mobile-first utilisés par toutes les pages publiques :
tiroir de navigation mobile, barre d'actions basse sticky, bouton flottant WhatsApp, et
overlay de recherche. Ne constituent pas une page mais l'ossature de navigation mobile du
site (spec §4, §73).

## Route(s)

Ce n'est pas une route : ce sont des composants globaux montés depuis le layout racine (ou
le layout `(public)`), pas depuis un `page.tsx` dédié.

`apps/web/src/app/layout.tsx` (ou `apps/web/src/app/(public)/layout.tsx` si limité aux
pages publiques) monte `<MobileNavigationShell />`, qui orchestre le tiroir, la barre
basse, le bouton WhatsApp flottant et l'overlay de recherche. Les composants
présentationnels vivent sous `apps/web/src/components/navigation/` (hors `features/<page>/`,
car partagés par toutes les pages) ; toute la logique d'état (ouverture/fermeture,
requête de recherche, langue active) vit dans
`apps/web/src/features/navigation/hooks/`, consommée depuis le layout racine plutôt que
depuis une page spécifique.

## Référence maquette

- Prompt Stitch : `stitch-prompts/30-page-404-et-composants-mobiles.md` (Écrans B à E)
- Écran Stitch : **ANGALY — Menu Mobile / Navigation Mobile & FAB / Recherche (Overlay)**
- Section spécification : §4, §73 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/components/navigation/
  MobileNavigationShell.tsx     → monte drawer + bottom bar + FAB + overlay, JSX + hooks uniquement
  MobileDrawer.tsx                → 'use client' tiroir plein écran fond navy (liens + actions rapides + CTA rendez-vous)
  MobileBottomBar.tsx               → 'use client' barre basse sticky (accueil, recherche, rendez-vous, favoris, compte)
  WhatsAppFab.tsx                     → 'use client' bouton flottant (pulse discret)
  MobileSearchOverlay.tsx               → 'use client' overlay plein écran (input + chips + résultats groupés)
apps/web/src/features/navigation/
  hooks/
    useMobileDrawer.ts                  → état ouvert/fermé du tiroir
    useMobileSearchOverlay.ts             → état ouvert/fermé + requête de recherche (debounce)
    useGlobalSearch.ts                     → react-query sur GET /api/search, résultats groupés (Créations, Produits, Articles)
    useLanguageSwitcher.ts                  → langue active (FR/MG) + persistance, voir Points d'attention
  api/
    navigation.api.ts                        → useGlobalSearchQuery
  consts/
    nav-links.const.ts                        → liens du tiroir (Accueil, La Une, Nos Créations, Prêt-à-porter, Sur Mesure, Patron Premium, À propos, Ateliers, Journal, Contact)
    search-suggestion-chips.const.ts           → (Robes de mariée, Costumes, Collections, Journal)
    queryKeys.ts
  types/
    global-search-result.types.ts
  __tests__/
    useMobileDrawer.test.ts
    useGlobalSearch.test.ts
    MobileNavigationShell.test.tsx
  index.ts
```

Toute logique (ouverture/fermeture, recherche, langue) vit dans `hooks/` —
`MobileNavigationShell.tsx` et les composants de `components/navigation/` ne contiennent
que du JSX + appels de hooks.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/search?q=&types=creations,products,articles` | `search` | Résultats groupés de l'overlay de recherche mobile (spec §46/§85) |

## Modèles Prisma touchés

Aucun modèle dédié : `search` agrège en lecture `Creation`, `Product`, `Collection`,
`BlogPost` (voir modules respectifs) sans modèle Prisma propre.

## Points d'attention

- Le module `search` (spec §46/§85) n'a pas encore de fiche `docs/features/search.md` ni de
  modèle Prisma dédié (pas de table d'index) : une implémentation raisonnable en Phase 1 est
  une recherche `ILIKE`/full-text Postgres simple sur `Creation.name`, `Product.name`,
  `BlogPost.title`, agrégée par un seul endpoint `GET /api/search` — à réévaluer vers un
  vrai moteur (ex. Meilisearch, `tsvector` Postgres) si le volume le justifie ; décision à
  documenter dans `docs/features/search.md` lors de son scaffolding.
- Sélecteur de langue FR/MG (`i18n`, spec §69) : aucun modèle Prisma ni endpoint dédié
  n'est nécessaire en Phase 1 — la locale active est un état de routing/UI (préfixe de
  route ou cookie) persisté en `localStorage`/cookie, pas un appel réseau. Seuls les
  endpoints déjà exposés par d'autres modules qui portent un paramètre `locale` (ex.
  `PageSection.locale`, enum `Locale` du schéma Prisma) en tiennent compte une fois
  `content` livré (Phase 6) — ne pas inventer de `GET /api/i18n/...` pour un simple
  changement d'état côté client.
- Ces composants sont partagés par toutes les pages : les placer dans
  `apps/web/src/components/navigation/` (hors arborescence `features/<page>/`) pour éviter
  qu'une page « possède » un composant utilisé par les 13 autres — seule la logique d'état
  transverse vit dans `apps/web/src/features/navigation/hooks/`, conformément à
  `.cursor/rules/002-nextjs-features.mdc`.
- Bouton WhatsApp flottant : lien `https://wa.me/<numéro>` construit à partir d'une
  variable d'environnement (`NEXT_PUBLIC_WHATSAPP_NUMBER`), jamais un numéro codé en dur
  (règle absolue #3) ; positionné pour ne jamais chevaucher la barre basse sticky (Écran D).
- Barre basse sticky mobile : le bouton central « Prendre rendez-vous » doit rester le plus
  proéminent, cohérent avec le CTA primaire du header desktop (`docs/pages/home.md`) —
  même lien cible.
- Overlay de recherche : debouncer la saisie avant tout appel `GET /api/search` (pas un
  fetch à chaque frappe), résultats groupés par type (Créations, Produits, Articles)
  fidèles à la maquette.
- Construits tôt (dès le début de Phase 1, voir `docs/phases/phase-1-digital-presence.md`
  « Ordre suggéré ») mais finalisés en dernier, une fois toutes les routes de navigation
  connues.

## Checklist d'acceptation

- [ ] Tiroir mobile (liens, actions rapides, CTA rendez-vous, réseaux) fidèle à `stitch-prompts/30-page-404-et-composants-mobiles.md` (Écran B)
- [ ] Barre basse sticky (accueil, recherche, rendez-vous proéminent, favoris, compte) fidèle à l'Écran C
- [ ] Bouton flottant WhatsApp positionné sans chevaucher la barre basse, animation de pulse discrète (Écran D)
- [ ] Overlay de recherche plein écran avec chips de suggestion + résultats groupés en direct (Écran E)
- [ ] Sélecteur de langue FR/MG fonctionnel et persistant entre les pages
- [ ] Navigation clavier complète du tiroir et de l'overlay (piège de focus, fermeture Échap) — spec §74 accessibilité
- [ ] Tests : `useMobileDrawer.test.ts`, `useGlobalSearch.test.ts`, `MobileNavigationShell.test.tsx`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
