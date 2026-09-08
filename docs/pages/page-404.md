# Page — `page-404`

**Statut : ✅ Fait.** Phase 1 — Présence digitale.

## Objet

Page d'erreur 404 de tout le site public — pas une page consommant une API, un point de
rebond soigné qui garde l'identité éditoriale ANGALY même dans un moment utilitaire
(spec §94).

## Route(s)

`apps/web/src/app/not-found.tsx` — convention Next.js App Router (déclenchée pour toute
route non résolue). Server Component pur — aucune donnée dynamique, aucun état interactif
hormis la navigation des boutons/liens.

## Référence maquette

- Prompt Stitch : `stitch-prompts/30-page-404-et-composants-mobiles.md` (Écran A — 404 Page)
- Écran Stitch : **ANGALY — Page non trouvée (404)**
- Section spécification : §94 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants (livrée)

```
apps/web/src/app/not-found.tsx     → page racine Next.js, importe uniquement <Page404 />
apps/web/src/features/page-404/
  ui/
    Page404.tsx                    → orchestre header minimal + illustration + titre + sous-texte + boutons + liens rapides
    NotFoundIllustration.tsx        → icône décorative (voir Points d'attention), pas un graphisme d'erreur cartoonesque
    QuickLinksRow.tsx                 → « Vous cherchiez peut-être : » (Nos Créations, Le Journal, Prendre rendez-vous)
  __tests__/
    Page404.test.tsx, NotFoundIllustration.test.tsx, QuickLinksRow.test.tsx
  index.ts
```

Pas de `hooks/`/`api/`/`schemas/` : page entièrement statique, aucun dossier vide committé
« pour la forme ».

## Endpoints API consommés

Aucun.

## Modèles Prisma touchés

Aucun.

## Points d'attention

- **Fidélité vérifiée via `agy`/StitchMCP `get_screen`** (écran réel
  `ac341165bad04bb69186cad7bdc0b814`), pas seulement `stitch-prompts/30-*.md`.
- **Les 3 liens rapides réels diffèrent du plan initial** : l'écran réel montre « Nos
  Créations », « Le Journal », « Prendre rendez-vous » — pas « Nos Créations, Sur Mesure,
  Contact » comme le plan de cette fiche le supposait avant vérification de l'écran réel.
  `Le Journal`/`Nos Créations` pointent vers des routes Phase 1 déjà livrées ; `Prendre
  rendez-vous` cible une route Phase 2 non encore livrée — câblée dès Phase 1 quand même,
  même convention que les autres pages (jamais de lien mort caché).
- **Illustration** : l'écran réel décrit une « silhouette de robe en fil d'or champagne,
  délicate » — un asset décoratif sur-mesure, pas une photo. Plutôt que de fabriquer ou
  détourner une illustration externe pour cette seule page utilitaire, une icône `Shirt`
  (lucide-react) large et translucide en champagne reproduit la même intention visuelle sans
  nouvelle dépendance d'assets — conforme à la note de la fiche initiale (« pas de
  dépendance à une librairie d'illustration lourde »).
- **Statut HTTP 404 réel confirmé** : `curl`/Playwright contre une route inexistante en dev
  renvoient bien `404` (comportement Next.js natif pour `not-found.tsx`, aucun code
  supplémentaire requis).
- **Bug sitewide découvert et corrigé pendant la vérification de cette page** : le layout
  racine (`apps/web/src/app/layout.tsx`) définit `title.template = '%s | ANGALY'`, mais
  **chaque page livrée cette session** (home comprise) définissait son propre `metadata.title`
  en incluant déjà `| ANGALY` (ou une variante) — provoquant un titre d'onglet dupliqué
  partout (« Contactez-nous | ANGALY | ANGALY », « Page introuvable | ANGALY | ANGALY », etc.,
  confirmé via `curl`/Playwright). Corrigé sur les 12 fichiers concernés (chaque
  `metadata.title`/`generateMetadata` ne porte plus que le nom de page brut ; la page
  d'accueil n'exporte plus de `title` du tout et hérite du `default` du layout racine) —
  revérifié en direct sur plusieurs pages après correction.

## Checklist d'acceptation

- [x] Message et CTA conformes à l'écran réel et à la spec §94 (texte exact « Cette création
      semble avoir disparu de l'atelier... »)
- [x] Boutons « Retour aux créations » (primaire) et « Retour à l'accueil » (secondaire) fonctionnels
- [x] Rangée « Vous cherchiez peut-être : » avec les 3 vrais liens rapides (voir Points d'attention)
- [x] `apps/web/src/app/not-found.tsx` déclenché correctement pour toute route inconnue (vérifié en direct)
- [x] Statut HTTP 404 réel renvoyé, `<title>`/meta cohérents — a révélé et corrigé un bug de titre dupliqué sur tout le site (voir Points d'attention)
- [x] Tests : `Page404.test.tsx`, `NotFoundIllustration.test.tsx`, `QuickLinksRow.test.tsx` — 6 tests, 100 % de couverture
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
