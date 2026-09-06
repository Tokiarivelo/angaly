# Page — Confirmation de Rendez-vous

Purpose: standalone confirmation/receipt page shown or emailed/linked after a successful booking, with management actions.

```text
Design the ANGALY appointment confirmation page for ANGALY, a high-end couture fashion house based in Madagascar.

BRAND CONTEXT & PALETTE (reuse exactly):
Primary Deep Navy #061938 (dominant), Primary Dark #041329, Navy Blue #0C2650, Royal Navy #18375D, Soft Navy #1E4574, Ivory background #F6F2E9, Warm Ivory #D8D3C8, Champagne #C5B190 (subtle accents), Antique Gold #936C3E (very sparing), Slate #5C697A, Warm Gray #8A877F, Border #D9D4CA, White #FFFFFF (limited), Success #46745A. Headings: elegant serif (Cormorant Garamond or Playfair Display). UI/body: clean sans-serif (Inter or Manrope). Primary button navy/white. Secondary button outlined navy on ivory.

TOP AREA:
Minimal header: ANGALY logo centered, no full navigation, to keep focus on the confirmation.

MAIN CARD (centered, max-width ~560px, on ivory background):
- A circular icon badge with a checkmark, subtle champagne ring around a success-toned (#46745A) check icon
- Serif headline: "Votre rendez-vous est confirmé"
- Sans-serif subtext: "Nous avons hâte de vous accueillir."
- A bordered recap card (#D9D4CA border, ivory fill) listing, label (slate) / value (navy) pairs: Numéro de réservation ("RDV-2026-00456"), Type de création, Atelier (with small address line), Date, Heure, Couturière assignée (if applicable)
- A small map/location snippet or an atelier thumbnail photo with address and a "Voir l'itinéraire" text link
- Divider
- Three secondary action rows with icons: "Ajouter à mon calendrier" (calendar icon), "Modifier le rendez-vous" (edit icon), "Annuler le rendez-vous" (x icon, shown in a more muted/error-adjacent tone)
- A reassurance note in small slate italic: "Une confirmation a été envoyée par email et WhatsApp."
- Primary button, full width: "Retour à l'accueil"
- Secondary text link: "Voir mes rendez-vous" (leads to the client space)

SIDE CONTENT (optional, desktop only, right of the card or below on mobile):
A small "En attendant votre rendez-vous" panel suggesting: "Découvrez nos créations", "Lisez notre Journal", each as a compact link card with a thumbnail.

FOOTER:
A minimal footer with just copyright, social icons, and contact info (no full navigation) to keep the page focused.

MOBILE BEHAVIOR:
Single centered column, full-width card, generous padding, all action rows remain easily tappable, sticky "Retour à l'accueil" button pinned at the bottom.

AVOID:
overly celebratory confetti/animation clichés, neon success colors, cluttered layouts, generic SaaS "booking confirmed" templates.

The page should feel like a warm, reassuring personal note from the atelier confirming the appointment.
```
