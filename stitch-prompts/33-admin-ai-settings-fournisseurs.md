# Page — Back-office : Paramètres IA — Fournisseurs de modèles

Purpose: refonte de l'écran `/admin/ai-settings` ("Paramètres IA — Pattern Studio", ADMIN-only). Aujourd'hui l'écran n'offre que 2 cartes (Gemini / modèle statistique local) et **aucune maquette Stitch n'existe** (voir `docs/pages/admin-ai-settings.md`) : ce prompt **crée** l'écran. Si un écran « Paramètres IA » apparaît un jour dans le projet Stitch, utiliser `edit_screens` dessus plutôt que d'en générer un second. Plan d'implémentation : `docs/features/ai-providers.md`.

Après génération, vérifier l'écran réel via `agy` / MCP Stitch (`get_screen`) avant tout JSX, et mettre à jour la ligne dans `docs/mockup-reference.md`.

```text
Design the ANGALY back-office screen "Paramètres IA — Fournisseurs" (desktop, 1280px) for ANGALY, a high-end couture fashion house based in Madagascar. It is where the ADMIN connects AI providers (Claude, Gemini, OpenAI, Meta Muse Spark, and others) and chooses which one powers the measurement estimation of Angaly Pattern Studio. Reuse exactly the layout language of the existing ANGALY back-office screens: fixed left admin sidebar (deep navy #061938, "Paramètres IA" item active with a champagne marker), top bar with search and staff avatar, ivory content area.

BRAND CONTEXT & PALETTE (reuse exactly):
Primary Deep Navy #061938, Primary Dark #041329, Navy Blue #0C2650, Royal Navy #18375D, Soft Navy #1E4574, Ivory background #F6F2E9, Warm Ivory #D8D3C8, Champagne #C5B190 (subtle accents), Antique Gold #936C3E (very sparing: only the "active provider" marker), Slate #5C697A, Warm Gray #8A877F, Border #D9D4CA, White #FFFFFF (card surfaces). Success #46745A, Error #A64A43. Headings: elegant serif (Playfair Display). UI/body/forms: Inter. Small 4px corner radius, thin #D9D4CA borders, no heavy shadows.

HEADER:
Breadcrumb "Tableau de bord / Paramètres IA". Serif page title "Paramètres IA — Pattern Studio", subtitle in slate "Connectez vos fournisseurs d'IA et choisissez celui qui estime les mesures manquantes. La géométrie du patron reste toujours calculée par le moteur ANGALY." Top right: primary navy button "Ajouter un fournisseur".

LAYOUT:
Two columns. Left (≈ 8/12): sections of provider cards. Right (≈ 4/12): sticky "Modèle actif" summary card.

LEFT — SECTION 1 "Modèle actif par usage":
White card with two rows, each a label + select + status pill:
- "Estimation des mesures manquantes" — select showing "Claude · claude-sonnet-5-5" with small provider logo-initial badge.
- "Suggestion de coupe et détails" — select showing "Gemini · gemini-2.5-flash".
Each row has a muted "Repli automatique : Modèle statistique local" helper line in slate.

LEFT — SECTION 2 "Fournisseurs connectés":
A vertical list of provider cards (white, 1px #D9D4CA border). Each card: circular initial badge (no real brand logos, monogram only: C, G, O, M…), provider name (Inter semibold), subtitle with the chosen model, a status pill (Connecté in success #46745A / Clé invalide in error #A64A43 / Non testé in warm gray), a masked key "sk-ant-••••••••3f9a", a tag "Gratuit" or "Payant" or "Auto-hébergé", and actions on the right: "Tester la connexion" (outlined), "Modifier", overflow menu (Retirer). The active one carries a thin antique-gold left marker and a "Actif" label. Show 4 realistic cards: Claude (Anthropic) — Connecté, Actif · Gemini (Google) — Connecté · OpenAI — Clé invalide · Modèle statistique local (ANSUR II) — Auto-hébergé, Disponible, no key field.

LEFT — SECTION 3 "Catalogue de fournisseurs":
Title "Ajouter depuis le catalogue" with a segmented filter (Tous / Gratuit / Payant / Auto-hébergé). Responsive grid of compact catalog cards (3 per row), each: monogram badge, name, one-line description, price tag, button "Connecter". Entries:
- Claude (Anthropic) — Payant
- Gemini (Google) — Gratuit avec quota · Payant
- OpenAI — Payant
- Meta Muse Spark — Aperçu public · crédits offerts
- Mistral — Gratuit avec quota
- Groq — Gratuit avec quota
- OpenRouter — Modèles gratuits disponibles
- DeepSeek — Payant
- Together AI — Crédits d'essai
- Cerebras — Gratuit avec quota
- Ollama / compatible OpenAI — Auto-hébergé, URL personnalisée
Already-connected providers show "Connecté" instead of the button.

RIGHT — STICKY CARD "Modèle actif":
White card summarising the active provider (monogram, name, model, last updated "Dernière modification : 02/10/2026 à 14:32 par Admin"). Below: three small facts — "Latence moyenne 1,2 s", "Requêtes ce mois 148", "Confiance affichée : indicative". At the bottom a slate note: "Une estimation reste toujours indicative et soumise à confirmation de la cliente."

MODAL / DRAWER STATE to show (second frame or overlay on the same screen): drawer from the right "Connecter Claude (Anthropic)" with fields: "Clé API" (password field with show/hide eye), "Modèle" (select with a short list + "Saisir un identifiant personnalisé"), optional "URL de base" (only for OpenAI-compatible providers, hidden otherwise), "Utiliser pour" (checkboxes: Estimation des mesures, Suggestion de coupe). Helper text under the key: "Chiffrée avant enregistrement — jamais réaffichée en clair." Buttons: "Tester la connexion" (outlined, with inline success "Connexion réussie · 0,9 s"), "Enregistrer" (navy), "Annuler" (text).

STATES TO SHOW:
Default populated state as described; one card with calm inline error in muted #A64A43 ("Clé refusée par le fournisseur — vérifiez-la ou générez-en une nouvelle"). Also an empty state hint for a fresh install: only the local statistical model connected, with "Ajoutez votre premier fournisseur d'IA".

COPY: all on-screen text in French exactly as written above.

AVOID: real brand logos or trademarked artwork (use monograms), SaaS-style bubbly cards, heavy shadows, excessive gold, neon or bright colors, generic admin-template look, showing a full API key anywhere.

The screen should feel like a calm, precise atelier tool consistent with the rest of the ANGALY back-office.
```
