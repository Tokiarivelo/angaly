# ANGALY — Google Stitch Prompt Library

This folder contains one **ready-to-paste Google Stitch prompt per screen/page** of the ANGALY website (couture house + boutique + sur-mesure + client space + Angaly Pattern Studio Premium + back-office essentials).

All prompts are written **in English** (Stitch generates more reliably in English) but the **on-screen copy/content stays in French** (the site's primary language), exactly as specified in `ANGALY_Specifications_Completes.md`. Every prompt embeds the full brand color palette and typography rules from `ANGALY_Palette_Stitch.md` so each file is **self-contained** — you can paste any single file into a new Stitch screen without needing the others for context.

## How to use these files

1. Open Google Stitch and create (or open) your ANGALY project.
2. Open a file below, copy everything inside the ```text fenced block``` (that is the actual prompt — the surrounding headings are just documentation for you).
3. Paste it into Stitch as the prompt for a **new screen**.
4. Generate, review, then use the short **refinement prompt** pattern from `ANGALY_Palette_Stitch.md` section 16 to iterate:
   > "Refine the current Angaly design using the established brand palette. Keep #061938 as the primary brand color..."
5. Repeat for every file to build the full screen set inside the same Stitch project, so Stitch keeps a consistent design system across screens.

## Recommended generation order

Generate in this order so Stitch's internal design system (colors, type, components, buttons, cards) locks in early and stays consistent for the more complex screens later.

### A — Core brand & discovery
- `01-home.md` — Homepage
- `02-la-une.md` — La Une (editorial showcase)
- `03-nos-creations-galerie.md` — Nos Créations (gallery)
- `04-creation-detail.md` — Creation detail page
- `05-personnalisation-creation.md` — Personalize a creation

### B — Collections & boutique
- `06-collections-liste.md` — Collections list
- `07-collection-detail.md` — Collection detail
- `08-pret-a-porter-catalogue.md` — Ready-to-wear catalogue
- `09-fiche-produit.md` — Product detail sheet
- `10-essayage-panier-checkout.md` — Fitting reservation, cart & checkout

### C — Sur-mesure & appointments
- `11-sur-mesure-process.md` — Sur Mesure process page
- `12-demande-sur-mesure-formulaire.md` — Custom request form
- `13-devis.md` — Quote (devis) page
- `14-prendre-rendez-vous.md` — Book an appointment
- `15-confirmation-rendez-vous.md` — Appointment confirmation

### D — Angaly Pattern Studio (Premium)
- `16-pattern-studio-landing.md` — Pattern Studio landing/overview
- `17-pattern-studio-wizard-creation.md` — Project creation wizard
- `18-pattern-studio-preview-validation-export.md` — Pattern preview, validation & export

### E — Institutional & content
- `19-nos-ateliers-liste.md` — Workshops (Ateliers) list + map
- `20-atelier-detail.md` — Atelier detail page
- `21-a-propos.md` — About page
- `22-journal-liste.md` — Journal (blog) list
- `23-journal-article.md` — Journal article detail
- `24-contact.md` — Contact page

### F — Client space (authenticated)
- `25-espace-client-dashboard.md` — Customer dashboard
- `26-espace-client-rendezvous-suivi.md` — My appointments + order/creation tracking
- `27-espace-client-patron-mesures.md` — My pattern projects + my measurements
- `28-espace-client-favoris-messages.md` — My favorites + messages/invoices/notifications

### G — Auth & system
- `29-connexion-inscription.md` — Login / Sign up
- `30-page-404-et-composants-mobiles.md` — 404 page + global mobile components (nav, footer, WhatsApp)

### H — Back-office (content owners)
- `31-admin-gestion-contenu-mediatheque.md` — Content management (page/section text editor) + media library, so ANGALY staff can edit every text and image on the public site without a developer

## Brand fundamentals reused in every prompt

```text
Primary Deep Navy:  #061938 (dominant brand color)
Primary Dark:       #041329
Navy Blue:           #0C2650
Royal Navy:          #18375D
Soft Navy:           #1E4574
Ivory (background):  #F6F2E9
Warm Ivory:          #D8D3C8
Champagne:           #C5B190
Antique Gold:        #936C3E (premium accents only)
Soft Gold:           #B59A70
Slate (text 2):      #5C697A
Warm Gray:           #8A877F
Border:              #D9D4CA
White:               #FFFFFF (limited use)
Success #46745A / Warning #A47735 / Error #A64A43 / Info #3E6D91

Color balance: 60% ivory/light, 25% navy/blue, 10% neutrals, 5% champagne/gold.

Headings: Cormorant Garamond (priority) or Playfair Display — elegant serif, editorial.
UI/body: Inter (priority) or Manrope — clean, legible sans-serif.
```

Do not remove or dilute these values when iterating — they are what keeps every screen recognizably ANGALY.
