# Page — Pattern Studio: Preview, Professional Validation & Export

Purpose: shows the generated pattern pieces, lets the user request professional verification by an Angaly couturière, tracks status, and exports the final files.

```text
Design the "Angaly Pattern Studio" pattern preview, validation and export screens for ANGALY's premium digital atelier.

PATTERN STUDIO PALETTE (use exactly):
Background #041329, Primary #061938, Surface (cards/panels) #0C2650, Accent Champagne #C5B190, Premium Gold #936C3E (sparing), Text #FFFFFF, Secondary text #D8D3C8. Functional status colors: Success #46745A, Warning #A47735, Error #A64A43, Info #3E6D91 (used at reduced saturation to fit the dark premium theme, e.g. as text/badge colors on dark surfaces rather than bright fills). Headings: elegant serif (Cormorant Garamond or Playfair Display). UI/body: clean sans-serif (Inter or Manrope). Premium button: #936C3E background, white text, hover #B59A70.

SCREEN A — PATTERN PREVIEW:
Dark header with project identifier "Projet ANG-PAT-2026-00001" and current status badge (Brouillon / Génération / À vérifier / Correction demandée / Validé / Exporté), each badge using a small dot + label in the matching functional color on a dark pill background.
Main layout: left sidebar (dark surface #0C2650) listing all pattern pieces with small thumbnail icons — Devant, Dos, Manche, Col, Jupe, Ceinture — each row selectable, selected row highlighted with a champagne left border.
Main canvas (center, largest area): a large, elegant technical rendering of the selected pattern piece on a dark background, drawn with clean white/champagne outlines, showing droit-fil arrow, marges de couture, crans/repères, and a dimension callout. Include zoom controls (+/-) and a toggle "Vue technique / Vue simplifiée" bottom-right of the canvas.
Right panel: piece details card — Nom, Dimensions, Tissu recommandé, Quantité, Droit-fil, Marge de couture, Repères — label/value pairs in #D8D3C8/#FFFFFF.
Bottom action bar: Secondary (outlined champagne) button "Modifier les paramètres" and Premium button "Faire vérifier mon patron par Angaly".

SCREEN B — VERIFICATION REQUEST STATE:
A status card explaining the request was sent: serif headline "Vérification en cours", subtext "Une couturière Angaly examine votre projet. Vous serez notifié·e dès que l'analyse sera terminée." A small illustrative timeline of the review status: Brouillon → Génération → À vérifier (current, highlighted) → Correction demandée → Validé → Exporté, rendered as a slim horizontal stepper with champagne fill for completed steps.

SCREEN C — CORRECTION REQUESTED STATE:
A warning-toned banner (#A47735 text on a subtly tinted dark surface) "Une correction a été demandée par votre couturière", followed by a comment thread/card showing the couturière's note (avatar, name, timestamp, comment text in #D8D3C8), and a Premium button "Modifier mon projet".

SCREEN D — VALIDATED STATE:
A success-toned banner (#46745A accent) "Votre patron a été validé par Angaly", confirmation details, and unlocked export actions.

SCREEN E — EXPORT:
Serif heading "Exporter votre patron", a set of format option cards: PDF A4, PDF A3, PDF A0, SVG, DXF (labeled "usage professionnel"), each as a selectable card with a small format icon and short helper text. Below, a preview of what the exported document includes (small checklist: logo Angaly, nom du projet, numéro, date, mesures, taille, version, pièces, instructions, avertissement technique). Premium button "Télécharger l'export".

SCREEN F — VERSION HISTORY:
A right-side drawer or dedicated tab "Historique des versions": a vertical list of version entries, each showing version number (e.g. "Version 1.2"), short change label ("Modification manches"), date, and a Secondary text action "Restaurer cette version". Current version highlighted with a champagne left border.

MOBILE BEHAVIOR:
Sidebar (pieces list) collapses into a horizontal scrollable chip row above the canvas; right details panel becomes a bottom sheet that expands on tap; action buttons stack full-width and stay sticky at the bottom.

AVOID:
cluttered CAD-software aesthetics, neon technical overlays, cold engineering-tool look, overuse of gold, harsh bright status colors that clash with the dark premium palette.

The screens should feel like reviewing precise couture technical drawings inside a warm, high-end digital atelier — never like a generic CAD or SaaS admin tool.
```
