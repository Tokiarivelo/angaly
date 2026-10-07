# Page — Back-office : Nouveau Projet Sur Mesure

Purpose: staff-side form (COUTURIERE / MANAGER / ADMIN) to open a new bespoke creation project, reached from the "Nouveau Projet Sur Mesure" button of `ANGALY Back-office — Projets de création` (screen `fadeaeb5…`). Same visual language as that list screen and the project detail screen.

```text
Design the ANGALY back-office screen "Nouveau Projet Sur Mesure" (desktop, 1280px) for ANGALY, a high-end couture fashion house based in Madagascar. It is the form staff use to open a new bespoke creation project for a client. Reuse exactly the layout language of the existing "ANGALY Back-office — Projets de création" screen: fixed left admin sidebar (deep navy #061938, "Projets de création" item active with a champagne marker), top bar with search and staff avatar, ivory content area.

BRAND CONTEXT & PALETTE (reuse exactly):
Primary Deep Navy #061938, Primary Dark #041329, Navy Blue #0C2650, Royal Navy #18375D, Soft Navy #1E4574, Ivory background #F6F2E9, Warm Ivory #D8D3C8, Champagne #C5B190 (subtle accents), Antique Gold #936C3E (very sparing, current-step marker only), Slate #5C697A, Warm Gray #8A877F, Border #D9D4CA, White #FFFFFF (card surfaces). Success #46745A, Error #A64A43. Headings: elegant serif (Playfair Display). UI/body/forms: Inter. Small 4px corner radius, thin #D9D4CA borders, no heavy shadows.

HEADER:
Breadcrumb "Projets de création / Nouveau projet". Serif page title "Nouveau Projet Sur Mesure", subtitle in slate "Ouvrez un dossier de création pour une cliente et lancez le suivi de l'atelier." Top right: secondary outlined button "Annuler".

LAYOUT:
Two columns. Left (≈ 8/12): stacked white form cards. Right (≈ 4/12): sticky summary column.

LEFT — FORM CARDS:
1. Card "Cliente" — a searchable select "Rechercher une cliente existante" (shows avatar initials, full name, email) and beneath it a text link "+ Créer une nouvelle cliente" that reveals inline fields: Prénom, Nom, Email, Téléphone (two columns).
2. Card "Création" — fields: "Titre du projet" (e.g. "Robe de mariée — Mme Rakoto"), "Type de vêtement" chip selector (Robe de mariée, Costume, Robe de soirée, Tenue traditionnelle, Autre), "Événement" select (Mariage, Soirée, Cérémonie, Professionnel, Quotidien, Autre), "Date de l'événement" date field, "Description / notes de consultation" textarea.
3. Card "Budget & devis" — "Budget indicatif" segmented chips (< 500 000 Ar, 500 000–1 000 000 Ar, 1 000 000–2 000 000 Ar, Sur devis), optional "Devis associé" select (quote number like DEV-2026-0042) with helper text "Facultatif — peut être rattaché plus tard."
4. Card "Atelier" — "Couturière assignée" select of active staff with a "Non assignée" option, "Étape initiale" select defaulting to "Consultation" (pipeline: Consultation, Conception, Patron, Confection, Essayage, Terminée), and "Photos d'inspiration" dashed dropzone with thumbnail previews and remove icons, helper text "JPG, PNG — jusqu'à 5 photos".

RIGHT — SUMMARY COLUMN (sticky):
White card "Récapitulatif" showing the live values filled in (cliente, type de vêtement, événement date, budget, couturière) with muted "—" placeholders. Below it, a mini 6-step pipeline preview (Consultation highlighted in antique gold, others in warm ivory) titled "Parcours du projet". At the bottom: full-width primary button "Créer le projet" (navy #061938, white text), under it a text link "Enregistrer comme brouillon". Small slate note: "La référence CRP-… sera générée à la création."

STATES TO SHOW:
Default filled-in realistic example (cliente "Hanitra Rakoto", Robe de mariée, event date 14/12/2026, budget 1 000 000–2 000 000 Ar, assigned to a couturière), with one field showing a calm inline validation message in muted error #A64A43 ("Le titre du projet est requis") — no harsh red blocks.

COPY: all on-screen text in French exactly as written above.

AVOID: public-site hero imagery, SaaS-style bubbly cards, heavy shadows, excessive gold, long single unstructured form, neon or bright colors, generic admin-template look.

The screen should feel like a calm, precise atelier tool consistent with the rest of the ANGALY back-office.
```
