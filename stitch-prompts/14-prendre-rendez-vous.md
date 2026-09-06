# Page — Prendre Rendez-vous (Book an Appointment)

Purpose: the core conversion page of the site — a simple, fast appointment booking experience with an availability calendar.

```text
Design the ANGALY appointment booking page — "Prendre rendez-vous" — for ANGALY, a high-end couture fashion house based in Madagascar. This is the site's single most important conversion page and must feel effortless.

BRAND CONTEXT & PALETTE (reuse exactly):
Primary Deep Navy #061938 (dominant), Primary Dark #041329, Navy Blue #0C2650, Royal Navy #18375D, Soft Navy #1E4574, Ivory background #F6F2E9, Warm Ivory #D8D3C8, Champagne #C5B190 (subtle accents), Antique Gold #936C3E (very sparing), Slate #5C697A, Warm Gray #8A877F, Border #D9D4CA, White #FFFFFF (limited). Headings: elegant serif (Cormorant Garamond or Playfair Display). UI/body: clean sans-serif (Inter or Manrope). Primary button navy/white. Secondary button outlined navy on ivory.

TOP AREA:
Standard ANGALY sticky nav bar with "Prendre rendez-vous" shown as the active highlighted button.

PAGE HEADER:
Ivory background, centered, serif headline "Prendre rendez-vous", sans-serif subtext: "Réservez un moment avec Angaly pour donner vie à votre projet."

LAYOUT — two columns on desktop (single column, stacked, on mobile):

LEFT COLUMN — FORM (short and progressive, minimal friction):
1. "Type de création" — chip selector: Robe de mariée, Costume, Robe de soirée, Retouche, Patron, Consultation, Essayage
2. "Atelier" — dropdown with a small location pin icon, showing atelier name + city
3. "Date" — inline calendar date picker (see calendar spec below), or a compact date field that opens the calendar
4. "Heure" — a row of time-slot chips generated dynamically from the calendar's availability for the selected date, unavailable slots shown grayed out and disabled
5. Divider, then contact fields: Prénom, Nom, Téléphone, Email
6. "Message (optionnel)" — small textarea
Primary button, full width: "Confirmer le rendez-vous"

RIGHT COLUMN — AVAILABILITY CALENDAR (sticky on desktop):
A clean monthly calendar grid on an ivory card with a thin border (#D9D4CA). Days styled as: available days in normal navy text with a small champagne dot beneath, fully booked days shown grayed out/struck with reduced opacity, closed days (e.g. Sundays) shown with a subtle diagonal pattern or muted gray, and the currently selected day highlighted with a filled navy circle and white text. A small legend below the calendar: "● Disponible", "Complet", "Fermé". If multiple ateliers/couturières exist, include a small secondary filter above the calendar: "Voir la disponibilité de : [Atelier / Couturière]" and a "Durée" indicator (e.g. "45 min").

CONFIRMATION STATE (below or as a follow-up screen):
Centered card, champagne check icon, serif headline "Rendez-vous confirmé", recap block with Type, Atelier, Date, Heure, and a reservation number (e.g. "RDV-2026-00456"), three action rows: "Ajouter au calendrier", "Modifier", "Annuler", plus a note: "Vous recevrez une confirmation par email et WhatsApp."

FOOTER:
Standard ANGALY footer.

MOBILE BEHAVIOR:
Single column; calendar becomes a compact expandable widget above the time-slot chips; sticky bottom bar keeps "Confirmer le rendez-vous" always visible once the required fields are filled.

AVOID:
long multi-field forms shown all at once, generic gray calendar widgets, neon availability indicators, heavy shadows, cluttered layouts.

The page must embody "the least friction possible" — the user should be able to book in under a minute.
```
