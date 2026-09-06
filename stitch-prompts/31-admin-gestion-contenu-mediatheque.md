# Admin — Gestion de Contenu & Médiathèque (Content & Media Management)

Purpose: the back-office module that lets ANGALY staff (Manager/Admin roles) edit every piece of text and manage every image across the public site without a developer — pages copy, La Une entries, realisations, collections, journal articles, testimonials, FAQ, navigation labels, and the full media library (per spec §67 "Administration — Contenu" and §76 media storage folders: creations/products/collections/ateliers/customers/patterns/blog/avatars).

```text
Design the ANGALY back-office "Gestion de contenu" (Content Management) and "Médiathèque" (Media Library) screens — the admin module where ANGALY staff manage every text and image on the public website, for ANGALY, a high-end couture fashion house based in Madagascar.

BRAND CONTEXT & PALETTE (reuse exactly, but in a clean functional back-office register — less editorial, more utilitarian, while still clearly ANGALY-branded):
Primary Deep Navy #061938 (dominant), Primary Dark #041329, Navy Blue #0C2650, Ivory background #F6F2E9, Warm Ivory #D8D3C8, Champagne #C5B190 (subtle accents only), Slate #5C697A, Warm Gray #8A877F, Border #D9D4CA, White #FFFFFF, functional colors Success #46745A, Warning #A47735, Error #A64A43, Info #3E6D91. Headings: elegant serif (Cormorant Garamond or Playfair Display) for page titles only. UI/body/forms/tables: clean sans-serif (Inter or Manrope), smaller and denser than the customer-facing site since this is a working tool for staff. Primary button navy/white, hover #0C2650. Secondary button outlined navy on ivory. Minimal rounding, thin borders, no heavy shadows.

GLOBAL ADMIN LAYOUT (reuse across both screens):
Left sidebar, deep navy (#061938) background, white/ivory text, ANGALY logo at top. Navigation groups: "Tableau de bord", "Réalisations", "Produits", "Collections", "Rendez-vous", "Clients", "Patron Premium", then a highlighted group "Contenu" (expanded, active) containing: Pages, La Une, Blog / Journal, Témoignages, FAQ, Médiathèque, Traductions (FR / MG), then "Utilisateurs & rôles", "Paramètres". Active item "Contenu > Pages" or "Contenu > Médiathèque" highlighted with a thin champagne left border. Top bar above the main content: breadcrumb, global search field, current admin user avatar + role badge (Manager / Admin), a "Voir le site" external-link button.

SCREEN A — GESTION DE CONTENU (Pages & Sections Editor):
Serif page title "Gestion de contenu", sans-serif subtitle "Modifiez les textes et images affichés sur le site public."

LEFT PANEL — LIST OF EDITABLE PAGES & SECTIONS (narrow column): a vertical list of site pages/sections, each row with a small page-type icon, the page name, its last-modified date, and a status pill (Publié — Success tone, Brouillon — Slate, Modifications non publiées — Warning tone): Accueil (Hero, La Une teaser, Présentation maison, Catégories, Sur Mesure, Patron Premium teaser, Témoignages, Ateliers, Journal, Newsletter — each listed as a sub-row/section under "Accueil"), À propos, Sur Mesure, Ateliers (par atelier), FAQ, Mentions légales / CGV / Confidentialité, Footer & navigation labels. Selecting a row loads it in the right panel.

RIGHT PANEL — SECTION EDITOR (main working area, selected: "Accueil > Hero"): a form-based editor, NOT raw code, with labeled fields matching real content of that section: "Eyebrow" text input, "Titre" text input (serif preview shown live next to the field), "Sous-titre" text input, "Texte du bouton principal" and "Texte du bouton secondaire" inputs, an image field for the hero background showing the current image thumbnail with a "Changer l'image" button opening the média picker, and a small "Aperçu" toggle showing a live miniature preview of how the section will render on the public site. Below the fields: a language tab switcher "Français / Malagasy" so each field can be translated per spec's bilingual requirement. Bottom action bar: Secondary button "Enregistrer comme brouillon", Primary button "Publier les modifications", and a small "Voir l'historique des versions" text link.

VERSION HISTORY DRAWER (secondary state): a right-side drawer listing previous saved versions of this section with timestamp, editor name, and a "Restaurer" action per entry.

SCREEN B — MÉDIATHÈQUE (Media Library):
Serif page title "Médiathèque", sans-serif subtitle "Gérez toutes les images et vidéos utilisées sur le site."

TOP TOOLBAR: a prominent upload dropzone/button "Importer des fichiers" (dashed border, champagne on hover), a search field, and folder filter chips matching the storage structure: Toutes, Créations, Produits, Collections, Ateliers, Blog, Patrons, Avatars. A sort control (Récents, Nom, Taille) and a grid/list view toggle.

MEDIA GRID: a responsive grid of image thumbnail cards. Each card shows: the image (or a video-play icon overlay for videos), a small file-type/size badge, and on hover a set of quick actions (Aperçu, Remplacer, Supprimer). Selecting a thumbnail opens a right-side detail panel.

MEDIA DETAIL PANEL (right side, shown when an image is selected): large preview of the selected image, filename, dimensions, file size, upload date, folder/category, an editable "Texte alternatif (alt)" field with a helper note about accessibility and SEO, a "Utilisée dans" list showing which pages/sections currently reference this image (e.g. "Accueil — Hero", "Robes de mariée — Robe Éternelle"), and action buttons: Primary "Remplacer l'image" (opens upload), Secondary "Télécharger", and a low-emphasis "Supprimer" text link in error tone (disabled with a tooltip if the image is currently in use).

BULK ACTIONS BAR (appears when multiple thumbnails are checked): a slim bar showing "3 fichiers sélectionnés" with buttons "Déplacer vers un dossier", "Télécharger", "Supprimer".

EMPTY / UPLOAD STATE: when a folder has no files, show a centered large dropzone illustration in champagne tones with the text "Glissez vos fichiers ici ou cliquez pour importer" and supported formats note (JPG, PNG, WebP, MP4 — 20 Mo max).

AVOID:
raw HTML/code editors, developer-facing jargon, cluttered dense spreadsheet-like tables, neon status colors, generic open-source CMS look (WordPress admin clichés), heavy drop shadows, excessive gold.

The result should feel like a precise, trustworthy internal tool built specifically for a couture house's content team — clear, fast to use, and still recognizably ANGALY through its navy/ivory/champagne palette and typography, without needing any coding knowledge to update a headline or swap a photo.
```
