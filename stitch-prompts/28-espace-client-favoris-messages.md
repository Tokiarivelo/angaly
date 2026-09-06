# Page — Espace Client: Mes Favoris & Messages/Factures/Notifications

Purpose: two connected client-space screens — saved favorites (creations/products/collections), and a combined view for messages, invoices and notifications.

```text
Design two connected screens for the ANGALY authenticated client space: "Mes favoris" and "Mes messages / Mes factures / Notifications", for ANGALY, a high-end couture fashion house based in Madagascar.

BRAND CONTEXT & PALETTE (reuse exactly):
Primary Deep Navy #061938 (dominant), Primary Dark #041329, Navy Blue #0C2650, Royal Navy #18375D, Soft Navy #1E4574, Ivory background #F6F2E9, Warm Ivory #D8D3C8, Champagne #C5B190 (subtle accents), Antique Gold #936C3E (very sparing), Slate #5C697A, Warm Gray #8A877F, Border #D9D4CA, White #FFFFFF (limited), functional colors Success #46745A, Warning #A47735, Error #A64A43, Info #3E6D91. Headings: elegant serif (Cormorant Garamond or Playfair Display). UI/body: clean sans-serif (Inter or Manrope). Primary button navy/white. Secondary button outlined navy on ivory.

LAYOUT (both screens):
Reuse the ANGALY client-space left sidebar (deep navy #061938) with the relevant item active. Main content on ivory background.

SCREEN A — MES FAVORIS:
Serif page title "Mes favoris", a filter tab row: Toutes, Créations, Produits, Collections. A grid of favorite item cards (reusing the creation/product card styles from the gallery and catalogue pages) with a filled champagne/navy heart icon top-right (to unfavorite) and a small type tag (Création / Produit / Collection). Below the grid, a Primary button "Préparer un rendez-vous avec mes favoris" — highlighting that favorites can feed into an appointment request. Empty state: centered icon, serif message "Vous n'avez pas encore de favoris", Secondary button "Découvrir nos créations".

SCREEN B — MESSAGES / FACTURES / NOTIFICATIONS (as three tabs within one screen):
A top tab bar: Messages, Factures, Notifications.
- "Messages" tab: a simple two-pane messaging layout — left a list of conversation threads (with Angaly team, e.g. "Atelier Antananarivo", last message preview, timestamp, unread dot), right the selected conversation thread with message bubbles (client messages in a navy-filled bubble with white text aligned right, Angaly messages in an ivory/white bubble with navy text and a small Angaly avatar aligned left) and a message input bar at the bottom.
- "Factures" tab: a clean list of invoice rows, each with invoice number, related order/project, date, amount, payment status badge (Payée — Success, En attente — Warning, Partiellement payée — Info, Remboursée — Slate), and a "Télécharger le PDF" icon action.
- "Notifications" tab: a vertical list of notification items, each with a small category icon (rendez-vous, commande, patron, paiement), short message text, timestamp, and an unread indicator (thin champagne left border on unread items); a "Tout marquer comme lu" text link at the top.

MOBILE BEHAVIOR:
Sidebar collapses to a bottom tab bar; favorites grid becomes 2-column; the messaging two-pane layout becomes a single pane with a back arrow to return to the thread list; invoices and notifications remain single-column stacked lists.

AVOID:
generic inbox/SaaS messaging templates, harsh unread badges, cluttered invoice tables, excessive gold, heavy shadows.

Every screen should stay visually calm and consistent with the couture house identity, even where the content is transactional.
```
