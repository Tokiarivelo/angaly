# Page — Devis (Quote)

Purpose: shows a formal quote sent to a client for a bespoke project, with clear accept/reject/negotiate actions.

```text
Design the ANGALY quote (devis) page — where a client reviews a formal quote for a bespoke creation, for ANGALY, a high-end couture fashion house based in Madagascar.

BRAND CONTEXT & PALETTE (reuse exactly):
Primary Deep Navy #061938 (dominant), Primary Dark #041329, Navy Blue #0C2650, Royal Navy #18375D, Soft Navy #1E4574, Ivory background #F6F2E9, Warm Ivory #D8D3C8, Champagne #C5B190 (subtle accents), Antique Gold #936C3E (very sparing), Slate #5C697A, Warm Gray #8A877F, Border #D9D4CA, White #FFFFFF (limited), functional colors Success #46745A, Warning #A47735, Error #A64A43, Info #3E6D91. Headings: elegant serif (Cormorant Garamond or Playfair Display). UI/body: clean sans-serif (Inter or Manrope). Primary button navy/white. Secondary button outlined navy on ivory.

TOP AREA:
Standard ANGALY sticky nav bar (or, if inside the client space, the client-space header — show the standard site header for this standalone version). Breadcrumb: Mon compte / Mes devis / Devis #ANG-DEV-2026-014.

DOCUMENT HEADER CARD:
A refined "document-like" card on ivory background with a thin border (#D9D4CA) and subtle presentation similar to an elegant invoice: ANGALY logo top-left, devis number and date top-right, status badge (Brouillon / Envoyé / Consulté / Accepté / Refusé / Expiré) in the corresponding tone (Info #3E6D91 for Envoyé/Consulté, Success #46745A for Accepté, Error #A64A43 for Refusé/Expiré, Slate for Brouillon), and a validity note "Valable jusqu'au 30/10/2026".

CLIENT & PROJECT INFO ROW:
Two columns: "Client" (name, contact) and "Projet" (creation reference/photo thumbnail, type of garment, related appointment or request).

LINE ITEMS TABLE:
A clean, minimal table (no heavy grid lines, thin row separators #D9D4CA) with columns: Description (e.g. "Robe de mariée sur mesure — Collection Éternelle, tissu satin duchesse, broderie main"), Quantité, Prix unitaire, Total. Include 2–4 rows (garment + options like broderie, accessoires).

TOTALS BLOCK:
Right-aligned summary: Sous-total, Acompte requis (e.g. "30% — 270 000 Ar"), Solde à la livraison, Total in bold serif or medium sans-serif, and estimated délai ("Délai estimé : 6 semaines").

ACTIONS:
Two prominent buttons side by side: Primary "Accepter le devis" (or if already accepted, show a Success-toned confirmation banner instead) and Secondary "Demander une modification" (opens a small message box). A tertiary text link "Télécharger en PDF" with a small download icon, and "Refuser le devis" as a low-emphasis text link in error tone.

STATUS TIMELINE (small, below actions):
A slim horizontal progress indicator: Demande de devis → Analyse → Proposition → Acceptation → Acompte → Production, with the current stage highlighted in navy and completed stages in champagne-outlined checks.

FOOTER:
Standard ANGALY footer (or a minimal client-space footer if this is shown inside the authenticated dashboard).

MOBILE BEHAVIOR:
Document card becomes a stacked single column; line items table becomes a list of stacked rows (label above value); action buttons stack full-width with Primary on top.

AVOID:
looking like a plain accounting invoice, harsh grid tables, neon status colors, generic SaaS billing UI, heavy shadows.

The devis should feel like an elegant, trustworthy proposal from a couture house — precise but warm.
```
