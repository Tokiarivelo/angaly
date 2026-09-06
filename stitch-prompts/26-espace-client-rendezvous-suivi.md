# Page — Espace Client: Mes Rendez-vous & Suivi de Commande/Création

Purpose: two connected client-space screens — the appointments list/management screen, and the order/creation tracking timeline screen.

```text
Design two connected screens for the ANGALY authenticated client space: "Mes rendez-vous" and "Suivi de commande/création", for ANGALY, a high-end couture fashion house based in Madagascar.

BRAND CONTEXT & PALETTE (reuse exactly):
Primary Deep Navy #061938 (dominant), Primary Dark #041329, Navy Blue #0C2650, Royal Navy #18375D, Soft Navy #1E4574, Ivory background #F6F2E9, Warm Ivory #D8D3C8, Champagne #C5B190 (subtle accents), Antique Gold #936C3E (very sparing), Slate #5C697A, Warm Gray #8A877F, Border #D9D4CA, White #FFFFFF (limited), functional colors Success #46745A, Warning #A47735, Error #A64A43, Info #3E6D91. Headings: elegant serif (Cormorant Garamond or Playfair Display). UI/body: clean sans-serif (Inter or Manrope). Primary button navy/white. Secondary button outlined navy on ivory.

LAYOUT (both screens):
Reuse the ANGALY client-space left sidebar (deep navy #061938, white/champagne active state) with items: Tableau de bord, Mes rendez-vous, Mes commandes, Mes créations, Mes projets de patron, Mes mesures, Mes favoris, Mes messages, Mes factures, Notifications, Paramètres. Main content on ivory background.

SCREEN A — MES RENDEZ-VOUS:
Serif page title "Mes rendez-vous", a Primary button top-right "Prendre un nouveau rendez-vous". A filter/tab row: À venir, Passés, Annulés.
List of appointment cards, each showing: date/time in a bold navy block on the left (day number large, month small, like a ticket stub), type of appointment, atelier name, status badge (Confirmé — Info/Success tone, En attente — Warning tone, Annulé — Error tone, Terminé — Slate), and action icons: "Modifier", "Annuler", "Ajouter au calendrier". Empty state (if no upcoming appointments): centered champagne-toned icon, serif message "Aucun rendez-vous à venir", Primary button "Prendre rendez-vous".

SCREEN B — SUIVI DE COMMANDE / CRÉATION:
Serif page title "Suivi de ma commande" with the order/creation reference and thumbnail shown at the top (product photo or creation photo, name, order number).
A vertical (or horizontal on wide desktop) refined timeline component with connected nodes, each node a small circle: completed steps filled navy with a white check, current step outlined with a pulsing champagne ring, upcoming steps outlined muted gray. Steps for a product order: Commande confirmée → Mesures → Patron → Confection → Contrôle qualité → Essayage → Terminée → Livrée. Steps for a bespoke request (mention this variant should also be designable): Demande → Consultation → Devis → Acompte → Mesures → Conception → Patron → Coupe → Confection → Essayage → Ajustement → Contrôle qualité → Terminé → Livré.
Next to each completed/current node, show a small timestamp and optional note (e.g. "Essayage prévu le 12/10/2026"). Below the timeline, a summary card with order details (produits/services, prix, atelier, contact couturière) and a Secondary button "Contacter Angaly à propos de cette commande".

MOBILE BEHAVIOR:
Sidebar collapses to a bottom tab bar; appointment cards stack full width with the date block remaining prominent; the tracking timeline switches to a vertical layout with a left connecting line, each step full width.

AVOID:
dense data-table layouts, generic project-management Gantt-chart aesthetics, neon status colors, heavy shadows, excessive gold.

Both screens should make the client feel informed, reassured, and personally taken care of at every step of their journey with the house.
```
