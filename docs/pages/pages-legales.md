# Pages légales et institutionnelles

Routes (groupe `(public)`) : `/mentions-legales`, `/confidentialite`, `/livraison-retours`,
`/conditions-generales`, `/presse`, `/carrieres`. Liées depuis le footer
(`components/layout/Footer.tsx`) et, pour les conditions générales, depuis
`reservation-essayage`.

## Maquette

**Aucun écran Stitch n'existe pour ces pages.** Mise en page volontairement sobre (titre serif,
sections, mise à jour), avec les tokens Angaly (`angaly-navy`, `angaly-champagne`, `angaly-slate`).
Si une maquette est produite plus tard, la comparer à `ui/LegalPage.tsx`.

## Implémentation

- Feature `apps/web/src/features/pages-legales/` : `consts/legal-pages.const.ts` (contenu par slug),
  `ui/LegalPage.tsx` (présentationnel). Les `page.tsx` n'ont pas de logique.
- Tests : `__tests__/LegalPage.test.tsx` (rendu des 6 pages, cohérence des slugs).

## Points ouverts

- **Textes à valider par la maison** : rédaction générique, non juridique. Données d'immatriculation
  (NIF, STAT, RCS), hébergeur et adresse postale absentes volontairement — à fournir.
- Contenu codé en dur (non éditable depuis `/gestion-contenu`) ; à migrer vers le CMS si besoin.
- Pas de traduction malgache.
- Les pages ne figurent pas dans le sitemap.
