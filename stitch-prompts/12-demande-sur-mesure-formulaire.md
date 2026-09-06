# Page — Demande de Création Sur Mesure (Form)

Purpose: the intake form for a bespoke creation request, designed with low friction (progressive disclosure) per the UX philosophy in the spec.

```text
Design the ANGALY custom creation request form — "Demande de création sur mesure" — for ANGALY, a high-end couture fashion house based in Madagascar.

BRAND CONTEXT & PALETTE (reuse exactly):
Primary Deep Navy #061938 (dominant), Primary Dark #041329, Navy Blue #0C2650, Royal Navy #18375D, Soft Navy #1E4574, Ivory background #F6F2E9, Warm Ivory #D8D3C8, Champagne #C5B190 (subtle accents), Antique Gold #936C3E (very sparing), Slate #5C697A, Warm Gray #8A877F, Border #D9D4CA, White #FFFFFF (limited). Headings: elegant serif (Cormorant Garamond or Playfair Display). UI/body: clean sans-serif (Inter or Manrope). Primary button navy/white. Secondary button outlined navy on ivory.

DESIGN PRINCIPLE — LOW FRICTION:
Present the form as a short multi-step wizard (progress indicator at top: Étape 1 sur 3) rather than one long form, so the user is never overwhelmed. Steps: 1) Votre projet, 2) Vos coordonnées, 3) Inspiration & message.

TOP AREA:
Minimal header (logo + a small "Retour" link), centered narrow content column (max ~640px) on ivory background for a focused, calm feel. Serif headline "Demande de création sur mesure", subtext "Racontez-nous votre projet, nous vous recontactons rapidement."

STEP 1 — VOTRE PROJET:
- "Type de vêtement" — chip selector: Robe de mariée, Costume, Robe de soirée, Tenue traditionnelle, Autre
- "Événement" — chip selector: Mariage, Soirée, Cérémonie, Professionnel, Quotidien, Autre
- "Date de l'événement" — date picker field
- "Budget indicatif" — a segmented range selector (chips: < 500 000 Ar, 500 000–1 000 000 Ar, 1 000 000–2 000 000 Ar, Sur devis)
- Primary button "Continuer"

STEP 2 — VOS COORDONNÉES:
- Prénom, Nom (two fields side by side on desktop, stacked on mobile)
- Téléphone, Email
- Primary button "Continuer", Secondary text link "Retour"

STEP 3 — INSPIRATION & MESSAGE:
- "Tissu souhaité" — text input with autocomplete suggestion chips (Satin, Dentelle, Mousseline, Velours...)
- "Photos d'inspiration" — dashed dropzone upload area, multiple thumbnail previews with remove icons, helper text "Formats acceptés : JPG, PNG — jusqu'à 5 photos"
- "Message" — textarea "Décrivez votre projet, vos envies, vos contraintes"
- Primary button, full width "Envoyer ma demande", Secondary text link "Retour"

CONFIRMATION SCREEN:
Centered card, champagne check icon, serif headline "Votre demande a bien été envoyée", sans-serif text "Notre équipe vous recontactera sous 48h pour organiser une consultation.", summary of key info submitted, two buttons: Primary "Prendre rendez-vous dès maintenant" and Secondary "Retour à l'accueil".

PROGRESS INDICATOR STYLE:
A slim horizontal progress bar or 3 connected dots at the top, filled segments in deep navy #061938, unfilled in warm ivory #D8D3C8, with small step labels beneath in slate gray.

MOBILE BEHAVIOR:
Full-width single column, generous touch target sizes, sticky "Continuer"/"Envoyer" button pinned to the bottom of the viewport at each step.

AVOID:
long single-page forms with all fields visible at once, harsh red required-field markers, generic gray form styling, heavy shadows, excessive gold.

The form should feel like a calm, guided conversation with a couturière, reflecting the "least friction possible" UX principle central to Angaly.
```
