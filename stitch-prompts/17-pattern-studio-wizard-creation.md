# Page — Pattern Studio: Project Creation Wizard

Purpose: the guided step-by-step wizard where a user creates a new pattern project — garment type, occasion, style, cut, details, inspiration photo upload, and measurements entry.

```text
Design the "Angaly Pattern Studio" project creation wizard — the multi-step flow where a client configures a new parametric pattern project, for ANGALY's premium digital atelier.

PATTERN STUDIO PALETTE (use exactly):
Background #041329, Primary #061938, Surface (cards/panels) #0C2650, Accent Champagne #C5B190, Premium Gold #936C3E (sparing, for primary actions), Text #FFFFFF, Secondary text #D8D3C8 (warm ivory). Headings: elegant serif (Cormorant Garamond or Playfair Display). UI/body: clean sans-serif (Inter or Manrope). Premium button: background #936C3E, text white, hover #B59A70. Secondary button on dark: transparent, champagne border and text.

GLOBAL WIZARD LAYOUT:
Dark header (#041329) with ANGALY + "Pattern Studio" branding, a project identifier shown once created (e.g. "Projet ANG-PAT-2026-00001"), and a persistent step progress bar across the top: a slim horizontal bar with 7 labeled segments (Vêtement, Occasion, Style, Coupe, Détails, Inspiration, Mesures), completed segments filled champagne, current segment outlined white, upcoming segments muted #0C2650. Each step screen is centered, max-width ~720px, on the dark background with content grouped in a surface card (#0C2650) with soft rounded corners and no heavy shadow.

STEP 1 — TYPE DE VÊTEMENT:
Serif question "Quel vêtement souhaitez-vous créer ?" A grid of large selectable illustrated icon cards: Robe, Jupe, Pantalon, Veste, Costume, Chemise, Robe de mariée, Autre. Selected card gets a champagne border glow and a small check icon. Premium button "Continuer" bottom right, disabled/muted until a selection is made.

STEP 2 — OCCASION:
Serif question "Pour quelle occasion ?" Chip selector: Mariage, Soirée, Quotidien, Cérémonie, Professionnel, Autre. Same continue/back button pattern (Secondary "Retour" bottom-left, Premium "Continuer" bottom-right) — reuse this footer pattern on every step.

STEP 3 — STYLE:
Serif question "Quel style vous correspond ?" A row of style mood cards with small representative imagery/texture swatches and labels: Classique, Moderne, Élégant, Minimaliste, Traditionnel, Glamour.

STEP 4 — COUPE:
Serif question "Quelle coupe préférez-vous ?" Chip/illustration selector: Droite, Évasée, Sirène, Princesse, Ajustée, Oversize, each with a small silhouette line-icon in champagne.

STEP 5 — DÉTAILS:
Serif question "Personnalisez les détails", grouped into compact accordions on the dark surface: Manches, Col, Décolleté, Dos, Longueur, Poches, Boutons, Fermeture, Ceinture, Traîne — each a small chip group, consistent with earlier steps.

STEP 6 — PHOTO D'INSPIRATION:
Serif heading "Ajoutez une photo d'inspiration (optionnel)". A dashed champagne-bordered dropzone on the dark surface, with helper text "Notre système identifie des caractéristiques générales (coupe, manches, longueur, silhouette) pour orienter la conception — il ne reproduit pas une photo à l'identique." Show an uploaded thumbnail with a small "Analyse en cours..." or "Caractéristiques détectées : coupe sirène, manches longues" result chip list once analyzed.

STEP 7 — MESURES:
Serif heading "Vos mesures". Option to select an existing saved profile ("Mes mesures 2026", "Mesures mariage") from a dropdown, or enter new measurements. For manual entry, show a clean list of measurement fields relevant to the garment (Tour de poitrine, Tour de taille, Tour de hanches, Largeur épaules, Hauteur poitrine, Longueur dos, Longueur bras, Longueur vêtement, Entrejambe if applicable), each row with: label, a small illustrative diagram icon button ("?" info icon opens an instructional illustration + definition), an input field with unit toggle (cm / inch), and a subtle validation checkmark once filled. End with a Premium button, full width: "Générer mon patron".

GENERATION LOADING STATE:
A centered state on the dark background: an elegant animated line-drawing motif of a garment silhouette forming, serif text "Génération de votre patron en cours...", small reassuring subtext "Notre moteur de patronage calcule vos pièces avec précision."

MOBILE BEHAVIOR:
Each step becomes a full-screen single-focus card; progress bar becomes a compact "Étape 3/7" label with a thin line; sticky bottom bar keeps Retour/Continuer buttons always visible.

AVOID:
overwhelming multi-field single screens, generic form-builder aesthetics, neon progress bars, cold clinical measurement UI, overuse of gold (champagne is the primary accent, gold only for premium button/badges).

Each step should feel like a calm, guided conversation with a digital atelier assistant — precise, reassuring, and premium.
```
