# Page — Espace Client: Mes Projets de Patron & Mes Mesures

Purpose: two connected client-space screens — the list of the client's Pattern Studio projects, and the management of saved measurement profiles.

```text
Design two connected screens for the ANGALY authenticated client space: "Mes projets de patron" and "Mes mesures", for ANGALY, a high-end couture fashion house based in Madagascar.

BRAND CONTEXT & PALETTE (reuse exactly):
Primary Deep Navy #061938 (dominant), Primary Dark #041329, Navy Blue #0C2650, Royal Navy #18375D, Soft Navy #1E4574, Ivory background #F6F2E9, Warm Ivory #D8D3C8, Champagne #C5B190 (subtle accents), Antique Gold #936C3E (used only for Premium/Pattern Studio badges and buttons), Slate #5C697A, Warm Gray #8A877F, Border #D9D4CA, White #FFFFFF (limited). Headings: elegant serif (Cormorant Garamond or Playfair Display). UI/body: clean sans-serif (Inter or Manrope). Primary button navy/white. Premium button #936C3E/white, hover #B59A70.

LAYOUT (both screens):
Reuse the ANGALY client-space left sidebar (deep navy #061938) with "Mes projets de patron" or "Mes mesures" active. Main content on ivory background.

SCREEN A — MES PROJETS DE PATRON:
Serif page title "Mes projets de patron", Premium button top-right "Nouveau projet" (links to Pattern Studio wizard). A row of project cards (grid or list), each styled with a subtle champagne top border to signal Premium: project thumbnail (a small stylized pattern-piece icon or garment sketch), project reference (e.g. "ANG-PAT-2026-00001"), garment type, status badge using the pattern statuses (Brouillon — slate, Génération — Info tone, À vérifier — Warning tone, Correction demandée — Warning/Error tone, Validé — Success tone, Exporté — navy/champagne tone, Archivé — muted gray), last modified date, and actions: "Ouvrir le projet", "Voir l'historique des versions". Empty state: centered icon, serif message "Vous n'avez pas encore de projet de patron", Premium button "Créer mon premier patron".

SCREEN B — MES MESURES:
Serif page title "Mes mesures", Primary button top-right "Ajouter un profil de mesures". A list of measurement profile cards, each named (e.g. "Mesures 2026", "Mesures costume", "Mesures mariage"), showing the creation date, a small preview of key measurements (2–3 values shown, e.g. "Tour de poitrine : 92 cm"), and actions: "Modifier", "Dupliquer", "Supprimer" (with a confirmation dialog styled minimally on ivory with Error-toned confirm button), "Utiliser pour un nouveau projet".
A detail/edit view (secondary state) shows the full list of measurement fields relevant to garments, each row with label, small "?" info icon revealing an instructional illustration and definition, input field with a cm/inch unit toggle, and a subtle green check once validated. Save button: Primary "Enregistrer ce profil".

PRIVACY NOTE:
On both screens, include a small reassuring note in slate italic near sensitive data: "Vos mesures sont des données personnelles protégées et ne sont utilisées que pour vos projets Angaly."

MOBILE BEHAVIOR:
Sidebar collapses to a bottom tab bar; project/measurement cards stack full width; measurement edit view becomes a full-screen form with a sticky "Enregistrer" button.

AVOID:
cold clinical/medical form aesthetics for measurements, generic SaaS project-card grids, harsh delete-confirmation dialogs, excessive gold outside Premium contexts, heavy shadows.

Both screens should feel precise and secure while remaining warm and true to the couture house identity.
```
