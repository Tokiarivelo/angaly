# 34 — ANGALY Pattern Studio — Catalogue des patrons

- Projet Stitch : `3703874896720765754` — design system « Angaly Couture » (`assets/13682057441638558326`), DESKTOP.
- Page : `docs/pages/pattern-studio-catalogue.md` — route `/pattern-studio/catalogue`.
- Écran Stitch : **pas encore généré** (2026-10-23 : MCP `generate_screen_from_text` en délai dépassé ×2, modèle par
  défaut puis Flash-Lite ; 2026-10-21 : ×3 + `agy --print`). Noter ici l'identifiant une fois l'écran créé.
- Référence de coque : « ANGALY — Mes projets de patron » (`screens/485fb27c9f56458391fc72bf382e88c8`).

## Prompt

```text
Screen title: "ANGALY Pattern Studio — Catalogue des patrons". Client area, same shell as the existing screen
"ANGALY — Mes projets de patron": navy left sidebar (#061938) with the ANGALY logo and client navigation, ivory top
bar (#F6F2E9). All copy in French.

Main content (max width ~1150px):
- Serif title "Catalogue des patrons", below it an italic slate subtitle: "36 robes que notre moteur de patronage sait
  réaliser, chacune d'après son modèle d'origine. Le patron est généré à vos mesures."
- One row: on the left, pill filter chips "Tous (36)" (selected: navy fill, white text), "Modernes (14)",
  "Historiques (18)", "Mariée (4)" (white, thin border, small uppercase); on the right a search field with a
  magnifier icon, placeholder "Rechercher un modèle".
- A 3-column grid of white cards with thin #D9D4CA border, a thin champagne (#C5B190) top bar, small radius. Each
  card: a 4:5 museum photo of a historical or modern dress; then the period in small gold uppercase letters (e.g.
  "1750 · XVIIIe siècle"); the dress name in serif (e.g. "Robe à la française"); a two-line slate description; a meta
  row with icons "14 pièces · 4,20 m"; a tiny credit line "Photo : The Met, 1750 — Domaine public"; then, separated
  by a thin line, a small text link "Voir les pièces" on the left and a gold button (#936C3E, white uppercase text,
  arrow) "Créer ce patron" on the right.
  Show 6 cards: Robe à la française (1750), Robe polonaise (1780), Robe à tournure (1885), Robe de style (1924),
  Robe fourreau (1960), Robe de mariée sirène (Mariée).
- Footer note, centered small italic: "Photos de musées et d'archives sous licence libre (domaine public, CC0, CC BY,
  CC BY-SA) — crédit sous chaque modèle."
```
