# Page — `page-404`

**Statut : ⬜ À faire.** Phase 1 — Présence digitale.

## Objet

Page d'erreur 404 de tout le site public — pas une page consommant une API, un point de
rebond soigné qui garde l'identité éditoriale ANGALY même dans un moment utilitaire
(spec §94).

## Route(s)

`apps/web/src/app/not-found.tsx` — convention Next.js App Router (déclenchée pour toute
route non résolue). Placé à la racine de `app/`, il capte donc aussi les segments sous
`(public)`/`(auth)`/`(client)`/`(admin)` qui n'ont pas de route dédiée ; aucune route
propre à créer sous `(public)`. Server Component pur — aucune donnée dynamique, aucun état
interactif hormis la navigation des boutons/liens.

## Référence maquette

- Prompt Stitch : `stitch-prompts/30-page-404-et-composants-mobiles.md` (Écran A — 404 Page)
- Écran Stitch : **ANGALY — Page non trouvée (404)**
- Section spécification : §94 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/app/not-found.tsx     → page racine Next.js, importe uniquement <Page404 />
apps/web/src/features/page-404/
  ui/
    Page404.tsx                    → orchestre illustration + titre + sous-texte + boutons + liens rapides
    NotFoundIllustration.tsx        → illustration/photo floutée dans la palette (pas de graphisme d'erreur cartoonesque)
    QuickLinksRow.tsx                 → « Vous cherchiez peut-être : » (Nos Créations, Sur Mesure, Contact)
  __tests__/
    Page404.test.tsx
  index.ts
```

Page entièrement statique : pas de `hooks/`/`api/`/`schemas/` (dossiers vides à ne pas
committer « pour la forme », voir Points d'attention) — seuls `ui/`, `__tests__/` et
`index.ts` sont nécessaires ici.

## Endpoints API consommés

Aucun.

## Modèles Prisma touchés

Aucun.

## Points d'attention

- Contenu entièrement statique : ne pas créer de dossiers `hooks/`/`api/`/`schemas/` vides
  « pour la forme » — `apps/web/src/features/README.md` décrit la structure complète mais
  un dossier sans contenu ne doit pas être committé.
- Le lien « Sur Mesure » de la ligne « Vous cherchiez peut-être » cible une page de Phase 2
  (`sur-mesure-process`, voir `docs/phases/phase-2-conversion.md`) — câbler le lien dès
  Phase 1 (même logique que le CTA « Prendre rendez-vous » de `docs/pages/home.md`) sans
  laisser de route morte, quitte à rediriger temporairement vers `/creations` si la route
  Phase 2 n'est pas encore livrée.
- Respecter le message exact de la spec §94 : *« Cette création semble avoir disparu de
  l'atelier... »* — ne pas le remplacer par un message 404 générique.
- Illustration : image statique optimisée (`next/image`), pas de dépendance à une
  librairie d'illustration lourde pour un composant aussi simple.
- Vérifier que Next.js renvoie bien un statut HTTP 404 réel (pas seulement un rendu visuel
  de type « not found ») pour préserver le SEO (spec §70).

## Checklist d'acceptation

- [ ] Message et CTA conformes à `stitch-prompts/30-page-404-et-composants-mobiles.md` (Écran A) et à la spec §94
- [ ] Boutons « Retour aux créations » (primaire) et « Retour à l'accueil » (secondaire) fonctionnels
- [ ] Rangée « Vous cherchiez peut-être : » avec 3 liens rapides fonctionnels
- [ ] `apps/web/src/app/not-found.tsx` déclenché correctement pour toute route inconnue (vérification manuelle ou e2e)
- [ ] Statut HTTP 404 réel renvoyé, `<title>`/meta cohérents (spec §70)
- [ ] Tests : `Page404.test.tsx` (rendu + a11y de base)
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
