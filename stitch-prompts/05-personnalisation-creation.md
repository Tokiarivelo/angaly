# Page — Personnalisation d'une Création

Purpose: lets a visitor configure a personalized version of an existing creation (cut, sleeves, fabric, embroidery, etc.) and package it into a design brief before booking an appointment.

```text
Design the ANGALY creation personalization page — the "Créer une version personnalisée" configurator for ANGALY, a high-end couture fashion house based in Madagascar.

BRAND CONTEXT & PALETTE (reuse exactly):
Primary Deep Navy #061938 (dominant), Primary Dark #041329, Navy Blue #0C2650, Royal Navy #18375D, Soft Navy #1E4574, Ivory background #F6F2E9, Warm Ivory #D8D3C8, Champagne #C5B190 (subtle accents), Antique Gold #936C3E (very sparing), Slate #5C697A, Warm Gray #8A877F, Border #D9D4CA, White #FFFFFF (limited). Headings: elegant serif (Cormorant Garamond or Playfair Display). UI/body: clean sans-serif (Inter or Manrope). Primary button navy/white. Secondary button outlined navy on ivory.

TOP NAVIGATION:
Standard ANGALY sticky nav bar. Breadcrumb: Accueil / Nos Créations / Robe Éternelle / Personnaliser.

PAGE HEADER:
Ivory background, small reference thumbnail of the base creation next to serif headline "Personnalisez votre Robe Éternelle", sans-serif subtext: "Ajustez les détails selon vos envies. Notre équipe affinera chaque choix avec vous lors de votre rendez-vous."

LAYOUT — two columns on desktop:

LEFT COLUMN — LIVE REFERENCE PREVIEW (sticky):
A large reference photo of the base creation with small annotated hotspots/labels (e.g. pointing to "Manches", "Décolleté", "Dos", "Traîne") that highlight as the user changes the matching option on the right. Beneath the image, a short helper note in slate italic: "Aperçu indicatif — les rendus définitifs seront validés avec votre couturière."

RIGHT COLUMN — CUSTOMIZATION FORM (scrollable, grouped into clean accordion or stepped sections, each with a serif section title and sans-serif option labels):
1. "Coupe" — selectable option chips: Droite, Évasée, Sirène, Princesse, Ajustée, Oversize
2. "Longueur" — chips: Courte, Mi-longue, Longue, Sur-mesure
3. "Manches" — chips with small icons: Sans manches, Courtes, Longues, Bouffantes, Dentelle
4. "Décolleté" — chips: Bateau, Cœur, Bustier, Col haut, Dos nu
5. "Dos" — chips: Fermé, Dos nu, Dentelle, Boutonné
6. "Couleur" — a row of circular color swatches (ivory, champagne, navy, blush, black, custom)
7. "Tissu" — a row of fabric swatch thumbnails with labels: Satin duchesse, Dentelle Calais, Mousseline, Tulle, Velours
8. "Broderies" — chips: Perles, Fil doré, Dentelle brodée, Sans broderie
9. "Boutons", "Ceinture", "Traîne" — simple chip groups
10. "Détails décoratifs" — a free-text area labeled "Précisez vos envies (optionnel)"

Each option group uses small outlined chip buttons; selected state fills with deep navy #061938 background and white text; unselected chips have a thin #D9D4CA border with navy text on ivory.

INSPIRATION UPLOAD BLOCK:
A dashed-border upload dropzone (champagne-tinted border on hover) labeled "Ajouter une photo d'inspiration (optionnel)" with a small icon and helper text "Formats acceptés : JPG, PNG — 10 Mo max". Show 1–2 uploaded thumbnail previews with a remove (x) icon.

NOTES FIELD:
A labeled textarea "Notes pour votre couturière (optionnel)".

SUMMARY / STICKY FOOTER BAR:
A sticky bottom bar (or right-side summary card) recapping the selections as small tags, plus two buttons: Secondary "Enregistrer comme brouillon" and Primary "Continuer vers la prise de rendez-vous".

CONFIRMATION STATE (to include as a secondary screen section):
After submitting, show a centered confirmation card on ivory background: a champagne check icon, serif headline "Votre dossier de conception a été créé", summary of the reference model, selected options as tags, uploaded inspiration thumbnail, and two buttons — Primary "Prendre rendez-vous" and Secondary "Retour à mes créations".

FOOTER:
Standard ANGALY footer.

MOBILE BEHAVIOR:
Single column; reference image becomes a collapsible preview at the top that can be expanded; customization sections become vertically stacked accordions; sticky bottom bar keeps the "Continuer" primary button always visible.

AVOID:
overwhelming the user with all options visible at once without grouping, generic SaaS toggle switches, neon color swatches, heavy shadows, overly playful icons.

The configurator should feel like a guided consultation with a couturière, not a mass-market product customizer.
```
