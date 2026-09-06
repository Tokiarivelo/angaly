# Page — Connexion / Inscription (Login / Sign up)

Purpose: authentication screens — login, sign up, and password recovery — kept minimal and elegant.

```text
Design the ANGALY authentication screens — "Connexion" (login), "Inscription" (sign up), and "Mot de passe oublié" (password recovery) — for ANGALY, a high-end couture fashion house based in Madagascar.

BRAND CONTEXT & PALETTE (reuse exactly):
Primary Deep Navy #061938 (dominant), Primary Dark #041329, Navy Blue #0C2650, Royal Navy #18375D, Soft Navy #1E4574, Ivory background #F6F2E9, Warm Ivory #D8D3C8, Champagne #C5B190 (subtle accents), Antique Gold #936C3E (very sparing), Slate #5C697A, Warm Gray #8A877F, Border #D9D4CA, White #FFFFFF (limited). Headings: elegant serif (Cormorant Garamond or Playfair Display). UI/body: clean sans-serif (Inter or Manrope). Primary button navy/white.

GLOBAL LAYOUT:
A split-screen layout on desktop: left half (or ~55%) a full-height elegant couture photograph (wedding dress or tailored suit, editorial lighting) with a deep navy gradient overlay at the bottom holding the ANGALY logo and the italic tagline "L'élégance, créée pour vous."; right half (~45%) a centered ivory panel containing the active form, max-width ~400px.

SCREEN A — CONNEXION:
Serif headline "Bon retour parmi nous", sans-serif subtext "Connectez-vous à votre espace Angaly." Fields: Email, Mot de passe (with a show/hide eye icon). A small "Mot de passe oublié ?" text link aligned right beneath the password field. Primary button, full width: "Se connecter". A divider with "ou" and an optional secondary OAuth button style (e.g. "Continuer avec Google") outlined in navy. Bottom text: "Pas encore de compte ? Créer un compte" as a champagne-colored text link.

SCREEN B — INSCRIPTION:
Serif headline "Rejoignez l'univers Angaly", subtext "Créez votre compte pour suivre vos projets et rendez-vous." Fields: Prénom, Nom, Email, Téléphone, Mot de passe, Confirmer le mot de passe, a checkbox "J'accepte les conditions générales et la politique de confidentialité". Primary button "Créer mon compte". Bottom text: "Déjà un compte ? Se connecter".

SCREEN C — MOT DE PASSE OUBLIÉ:
Serif headline "Mot de passe oublié ?", subtext "Indiquez votre email, nous vous enverrons un lien de réinitialisation." Field: Email. Primary button "Envoyer le lien". Bottom text link: "Retour à la connexion".

CONFIRMATION STATE (for password recovery):
Centered ivory panel, champagne check icon, serif text "Email envoyé", subtext "Vérifiez votre boîte de réception pour réinitialiser votre mot de passe."

FORM STYLING DETAILS:
Input fields with labels above them in small slate uppercase-letter-spaced text, thin #D9D4CA borders, generous padding, navy focus ring/border on focus, clear inline error state in Error tone (#A64A43) with a small message beneath the field (e.g. "Adresse email invalide").

MOBILE BEHAVIOR:
The photographic panel is removed or reduced to a slim top banner; the form panel becomes full width with generous top/bottom padding; all interactions remain the same.

AVOID:
generic gray SaaS login forms, harsh red error states, cluttered social-login button rows, excessive gold, heavy shadows.

The authentication experience should already feel like stepping into a couture house, not a generic web app login.
```
