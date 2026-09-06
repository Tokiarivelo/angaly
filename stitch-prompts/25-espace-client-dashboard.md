# Page — Espace Client: Tableau de Bord (Customer Dashboard)

Purpose: the authenticated customer's home screen — a welcoming summary with quick access to every client-space section.

```text
Design the ANGALY customer dashboard — the authenticated "Espace client" home screen for ANGALY, a high-end couture fashion house based in Madagascar. This must feel like a personal concierge space, not a generic SaaS admin dashboard.

BRAND CONTEXT & PALETTE (reuse exactly):
Primary Deep Navy #061938 (dominant), Primary Dark #041329, Navy Blue #0C2650, Royal Navy #18375D, Soft Navy #1E4574, Ivory background #F6F2E9, Warm Ivory #D8D3C8, Champagne #C5B190 (subtle accents), Antique Gold #936C3E (very sparing, for Premium-related items only), Slate #5C697A, Warm Gray #8A877F, Border #D9D4CA, White #FFFFFF (limited). Headings: elegant serif (Cormorant Garamond or Playfair Display). UI/body: clean sans-serif (Inter or Manrope). Primary button navy/white. Secondary button outlined navy on ivory. Premium accents (#936C3E) only on Pattern Studio-related cards.

LAYOUT:
A left vertical sidebar navigation (ivory or deep navy background — choose deep navy #061938 with white/ivory text and a champagne active-state indicator) listing: Tableau de bord, Mes rendez-vous, Mes commandes, Mes créations, Mes projets de patron, Mes mesures, Mes favoris, Mes messages, Mes factures, Notifications, Paramètres du compte, Déconnexion. "Tableau de bord" shown active. Top of sidebar: small ANGALY logo; bottom of sidebar: user avatar + name.

MAIN CONTENT (ivory background, right of sidebar):
Personalized greeting header: serif text "Bonjour, Marie" with a small subtext of the current date, and a "Prendre rendez-vous" Primary button top-right.

SUMMARY WIDGET ROW (4 cards):
1. "Prochain rendez-vous" card: date/time, type, atelier, small "Voir le détail" link.
2. "Commande en cours" card: thumbnail, product/creation name, current status badge, progress hint.
3. "Projet Premium en cours" card (styled with a subtle champagne top border to denote Premium): project name/ID, current pattern status badge, "Continuer" link.
4. "Notifications" card: small list of the 2–3 most recent notifications with unread dot indicators.
Each card on a white or ivory surface with a thin #D9D4CA border, minimal rounding, no heavy shadow.

QUICK ACCESS TILES:
Below the summary row, a grid of quick-access tiles linking to: Mes créations, Mes mesures, Mes favoris, Mes factures — each with a small line-icon and label.

RECENT ACTIVITY TIMELINE:
A serif subheading "Activité récente" followed by a slim vertical timeline of recent events (rendez-vous confirmé, patron généré, commande expédiée, etc.), each row with a small icon, description, and timestamp in slate gray.

FOOTER (within the client space):
A minimal footer bar: help/support link, contact link, legal links, copyright.

MOBILE BEHAVIOR:
Sidebar collapses into a bottom tab bar (Accueil, Rendez-vous, Commandes, Compte) plus a hamburger for the remaining sections; summary cards stack in a single column; greeting header remains at top.

AVOID:
generic admin/SaaS dashboard aesthetics, dense data tables, neon status chips, excessive gold, heavy shadows, cluttered widget grids.

The dashboard should feel like a warm, personal welcome back into a couture house relationship, not a corporate control panel.
```
