# Page — Réservation d'essayage, Panier & Checkout

Purpose: covers three connected transactional states for ready-to-wear items — reserving a fitting slot, the shopping cart, and the checkout flow (address, delivery, payment, confirmation). Design as a multi-state single flow so Stitch produces a coherent set of screens.

```text
Design the ANGALY fitting reservation, cart and checkout flow — a set of connected screens for ready-to-wear purchases, for ANGALY, a high-end couture fashion house based in Madagascar.

BRAND CONTEXT & PALETTE (reuse exactly):
Primary Deep Navy #061938 (dominant), Primary Dark #041329, Navy Blue #0C2650, Royal Navy #18375D, Soft Navy #1E4574, Ivory background #F6F2E9, Warm Ivory #D8D3C8, Champagne #C5B190 (subtle accents), Antique Gold #936C3E (very sparing), Slate #5C697A, Warm Gray #8A877F, Border #D9D4CA, White #FFFFFF (limited), functional colors Success #46745A, Warning #A47735, Error #A64A43, Info #3E6D91. Headings: elegant serif (Cormorant Garamond or Playfair Display). UI/body: clean sans-serif (Inter or Manrope). Primary button navy/white. Secondary button outlined navy on ivory. Keep the checkout minimal and elegant — never look like a generic e-commerce cart.

SCREEN A — RÉSERVATION POUR ESSAYAGE:
A focused modal or dedicated page on ivory background. Serif headline "Réserver un essayage" with the product thumbnail, name and reference shown at the top in a compact summary row. A short simple form, one field per row, generous spacing: Taille (chip selector), Atelier (dropdown with location icon), Date (calendar date picker styled minimally in navy/ivory), Heure (time slot chips, e.g. "10:00", "11:30", "14:00", disabled slots shown grayed out). Below, a Primary button full width "Confirmer la réservation" and a Secondary text link "Annuler".

SCREEN B — CONFIRMATION D'ESSAYAGE:
Centered confirmation card: champagne check icon, serif headline "Essayage confirmé", recap block (product, taille, atelier, date, heure), three action rows: "Ajouter au calendrier", "Modifier", "Annuler", and a note that a confirmation will also be sent by email/WhatsApp.

SCREEN C — PANIER (Cart):
Two-column layout. Left column: list of cart line items, each row with product thumbnail, name, size/color chosen, quantity stepper, unit price, line total, and a remove (trash) icon; include one item shown with a low-stock warning ("Dernière pièce — stock limité" in warning tone #A47735). Right column: an order summary card on a very light navy-tinted surface (#0C2650 at low opacity or a bordered ivory card) showing Sous-total, Livraison estimée, Total in bold serif or medium-weight sans-serif, a promo code input row, and a Primary button full width "Passer la commande". Below the cart list, a Secondary button "Continuer mes achats".

SCREEN D — CHECKOUT (multi-step, shown as a horizontal stepper at the top: Adresse → Livraison → Paiement → Confirmation):
Step "Adresse": clean form fields (Prénom, Nom, Téléphone, Email, Adresse, Ville, Région) with labels above inputs, thin #D9D4CA borders, navy focus ring.
Step "Livraison": radio-style option cards for delivery method (Retrait en atelier / Livraison à domicile) each showing estimated delay and cost.
Step "Paiement": payment method option cards with icons (Mobile Money, Carte bancaire, Virement, Paiement à la livraison — flexible enough for Madagascar), a summary sidebar recapping the order total, and a Primary button "Confirmer et payer".
Step "Confirmation": centered success state, champagne check icon, serif headline "Merci pour votre commande", order number, summary card, and buttons "Voir ma commande" (Primary) and "Retour à l'accueil" (Secondary).

GLOBAL:
Reuse the standard ANGALY sticky top navigation (with cart icon showing item count) and standard footer on the cart page; checkout can use a simplified minimal header (logo only + secure-checkout lock icon + step indicator) without full navigation to reduce distraction.

MOBILE BEHAVIOR:
Each screen stacks to single column; checkout stepper becomes a compact progress bar with the current step label; sticky bottom bar shows the running total and the primary action button at all times.

AVOID:
aggressive discount banners, neon "hurry up" urgency messaging, cluttered multi-column checkout forms, generic e-commerce iconography, heavy shadows, excessive gold.

The entire flow should feel calm, trustworthy and premium — like completing a considered purchase at a couture boutique, not rushing through a mass-market checkout.
```
