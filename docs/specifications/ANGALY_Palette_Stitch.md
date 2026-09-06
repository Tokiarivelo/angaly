# ANGALY — Palette UI & Prompt Google Stitch

## 1. Analyse de l'image de référence

L'image est construite autour d'une esthétique **bleu nuit profond + ivoire + bois/champagne + touches dorées**.

Les caractéristiques visuelles importantes sont :

- bleu marine très sombre comme couleur dominante ;
- plusieurs niveaux de bleu froid et profond ;
- ivoire/crème pour apporter de la lumière ;
- beige/champagne chaud ;
- accents dorés/bronzés inspirés du bois et des détails décoratifs ;
- gris bleuté discret pour les éléments secondaires ;
- contraste élevé entre les surfaces sombres et les éléments clairs ;
- ambiance premium, élégante, sophistiquée et contemporaine.

Pour Angaly, le bleu le plus sombre est utilisé comme **couleur primaire de marque**. Les tons ivoire et champagne servent à créer une sensation de luxe et à rendre l'interface plus chaleureuse qu'un simple thème bleu.

---

# 2. Palette principale Angaly

## Primary — Angaly Deep Navy

**HEX : `#061938`**

Utilisation :

- couleur primaire ;
- header sombre ;
- hero ;
- boutons principaux ;
- footer ;
- éléments de navigation ;
- surfaces premium ;
- sections importantes.

C'est la couleur la plus importante de l'identité visuelle.

---

## Primary Dark

**HEX : `#041329`**

Utilisation :

- hover très sombre ;
- footer ;
- overlays ;
- navigation mobile ;
- arrière-plans très premium.

---

## Primary Blue

**HEX : `#0C2650`**

Utilisation :

- cartes ;
- sections secondaires ;
- boutons secondaires foncés ;
- backgrounds alternatifs ;
- éléments actifs.

---

## Royal Navy

**HEX : `#18375D`**

Utilisation :

- surfaces secondaires ;
- illustrations ;
- bordures ;
- badges ;
- éléments interactifs.

---

## Soft Navy Blue

**HEX : `#1E4574`**

Utilisation :

- liens ;
- états actifs ;
- icônes ;
- accents UI ;
- éléments décoratifs.

---

# 3. Palette claire

## Ivory

**HEX : `#F6F2E9`**

Couleur principale des interfaces claires.

Utilisation :

- background principal ;
- sections ;
- cartes ;
- pages de contenu.

Elle doit remplacer le blanc pur dans la majorité des interfaces afin de conserver l'aspect couture/luxe.

---

## Warm Ivory

**HEX : `#D8D3C8`**

Utilisation :

- textes sur fonds sombres ;
- bordures ;
- surfaces secondaires ;
- séparateurs ;
- arrière-plans doux.

---

## Champagne

**HEX : `#C5B190`**

Utilisation :

- accents ;
- détails premium ;
- badges ;
- bordures décoratives ;
- petites touches de luxe.

Ne pas utiliser le champagne comme couleur dominante.

---

# 4. Palette dorée / artisanale

## Antique Gold

**HEX : `#936C3E`**

Utilisation :

- icônes premium ;
- détails ;
- lignes décoratives ;
- éléments de collection ;
- petites touches luxueuses.

---

## Soft Gold

**HEX : `#B59A70`**

Utilisation :

- hover des accents dorés ;
- petits labels ;
- séparateurs ;
- détails décoratifs.

Le doré doit rester subtil. Angaly doit évoquer une **maison de couture haut de gamme**, pas une boutique de luxe ostentatoire.

---

# 5. Palette neutre

## Slate

**HEX : `#5C697A`**

Utilisation :

- texte secondaire ;
- descriptions ;
- metadata ;
- icônes secondaires.

---

## Warm Gray

**HEX : `#8A877F`**

Utilisation :

- texte discret ;
- placeholders ;
- informations secondaires.

---

## Border

**HEX : `#D9D4CA`**

Utilisation :

- bordures ;
- séparateurs ;
- champs de formulaire ;
- cartes.

---

## White

**HEX : `#FFFFFF`**

Utilisation limitée :

- texte très contrasté ;
- surfaces spécifiques ;
- boutons sur fond bleu.

Le blanc pur ne doit pas être la couleur de fond principale.

---

# 6. Couleurs fonctionnelles

Ces couleurs doivent rester discrètes et ne doivent pas casser l'identité premium.

### Success

**HEX : `#46745A`**

### Warning

**HEX : `#A47735`**

### Error

**HEX : `#A64A43`**

### Info

**HEX : `#3E6D91`**

---

# 7. Design tokens recommandés

```text
Primary:
  #061938

Primary Dark:
  #041329

Primary Blue:
  #0C2650

Primary Light:
  #18375D

Accent Blue:
  #1E4574

Background:
  #F6F2E9

Surface:
  #FFFFFF

Surface Dark:
  #0C2650

Ivory:
  #D8D3C8

Champagne:
  #C5B190

Gold:
  #936C3E

Gold Light:
  #B59A70

Text:
  #061938

Text On Dark:
  #FFFFFF

Text Secondary:
  #5C697A

Muted:
  #8A877F

Border:
  #D9D4CA

Success:
  #46745A

Warning:
  #A47735

Error:
  #A64A43

Info:
  #3E6D91
```

---

# 8. Règle de proportion des couleurs

Pour éviter une interface trop sombre ou trop dorée :

```text
60% — Ivory / surfaces claires
25% — Deep Navy / bleus
10% — neutres et gris
5%  — Champagne / Gold
```

Le **Deep Navy `#061938`** doit être la couleur primaire de marque, mais cela ne signifie pas que 50% de toute l'interface doit être bleu.

Le contraste entre **navy + ivory** doit être le principe visuel dominant.

---

# 9. Boutons

## Primary Button

Background :

`#061938`

Texte :

`#FFFFFF`

Hover :

`#0C2650`

---

## Secondary Button

Background :

`transparent`

Border :

`#061938`

Texte :

`#061938`

Hover :

Background `#061938`

Texte `#FFFFFF`

---

## Premium Button

Background :

`#936C3E`

Texte :

`#FFFFFF`

Hover :

`#B59A70`

À utiliser uniquement pour les fonctionnalités Premium, notamment **Angaly Pattern Studio**.

---

# 10. Cards

Les cartes doivent être très sobres.

### Carte claire

```text
Background: #FFFFFF
Border: #D9D4CA
Text: #061938
Secondary text: #5C697A
```

### Carte premium sombre

```text
Background: #0C2650
Text: #FFFFFF
Accent: #C5B190
```

---

# 11. Hero

Le Hero doit privilégier :

```text
Image de création couture
+
overlay Deep Navy
+
texte Ivory/White
+
CTA Primary
```

L'overlay bleu ne doit pas masquer la photographie.

Le Hero doit donner immédiatement une impression de :

- maison de couture ;
- élégance ;
- exclusivité ;
- savoir-faire ;
- modernité.

---

# 12. La Une

La section **La Une** doit être visuellement très importante.

Style recommandé :

- grandes photos ;
- grille éditoriale ;
- beaucoup d'espace ;
- titres élégants ;
- petites métadonnées ;
- accents champagne très subtils.

Exemple :

```text
LA UNE
──────────────
Les créations qui incarnent
l'univers Angaly.

[Grande photographie]
Collection Éclat
Robe de mariée — Sur mesure
```

---

# 13. Pattern Studio Premium

Le module Premium doit avoir une identité légèrement différente tout en restant cohérent avec Angaly.

Palette :

```text
Background: #041329
Primary: #061938
Surface: #0C2650
Accent: #C5B190
Premium Gold: #936C3E
Text: #FFFFFF
Secondary text: #D8D3C8
```

Le résultat doit évoquer :

> **un atelier de patronage numérique haut de gamme**

et non une application SaaS froide.

---

# 14. Typographie recommandée

## Titres

Priorité :

1. Cormorant Garamond
2. Playfair Display

Style :

- élégant ;
- léger ;
- éditorial ;
- grandes tailles ;
- parfois italique.

## Interface

Priorité :

1. Inter
2. Manrope

Les textes d'interface doivent rester très lisibles.

---

# 15. Prompt Google Stitch — Version complète

Copier-coller le prompt suivant dans Google Stitch :

```text
Design a premium, elegant and editorial website for ANGALY, a high-end couture fashion house based in Madagascar.

The visual identity must be inspired by a sophisticated interior palette dominated by very deep midnight navy blue, ivory, warm cream, champagne beige, natural wood and subtle antique gold.

PRIMARY BRAND COLOR:
Use #061938 as the main Angaly brand color. This is the deepest navy and must be the primary visual identity color.

COLOR PALETTE:
- Primary Deep Navy: #061938
- Primary Dark: #041329
- Navy Blue: #0C2650
- Royal Navy: #18375D
- Soft Navy: #1E4574
- Ivory Background: #F6F2E9
- Warm Ivory: #D8D3C8
- Champagne: #C5B190
- Antique Gold: #936C3E
- Soft Gold: #B59A70
- Slate: #5C697A
- Warm Gray: #8A877F
- Border: #D9D4CA
- White: #FFFFFF

COLOR BALANCE:
Approximately 60% ivory/light surfaces, 25% deep navy and blue surfaces, 10% neutral colors, and 5% champagne/gold accents.

DESIGN DIRECTION:
Create a luxury couture aesthetic, not a generic fashion e-commerce template.

The website should feel:
- sophisticated
- timeless
- refined
- luxurious
- artisanal
- feminine but not overly decorative
- modern
- editorial
- exclusive
- warm
- trustworthy

Use large high-quality fashion photography, generous whitespace, elegant typography, subtle borders, refined spacing and restrained animations.

Avoid:
- excessive gradients
- excessive gold
- flashy effects
- neon colors
- overly rounded SaaS-style cards
- generic marketplace layouts
- excessive shadows
- overly colorful UI

TYPOGRAPHY:
Use an elegant serif typeface similar to Cormorant Garamond or Playfair Display for large headings and editorial titles.
Use a clean modern sans-serif similar to Inter or Manrope for body text, navigation, forms and UI.

HOME PAGE:
Create a cinematic full-screen hero featuring an elegant couture wedding dress or tailored suit.

Hero content:
ANGALY
"L'élégance, créée pour vous."

Primary CTA:
"Prendre rendez-vous"

Secondary CTA:
"Découvrir nos créations"

Below the hero, create a prominent editorial section called:
"LA UNE"

This section must showcase the most beautiful and important Angaly creations, using large editorial photography, asymmetrical layouts and sophisticated typography.

Include sections for:
- La Une
- Nos Réalisations
- Robes de mariée
- Costumes sur mesure
- Collections
- Prêt-à-porter
- Sur Mesure
- Angaly Pattern Studio
- Témoignages clients
- Nos Ateliers
- À propos
- Journal
- Newsletter

NAVIGATION:
Create a clean premium navigation with:
Accueil
La Une
Nos Créations
Prêt-à-porter
Sur Mesure
Patron Premium
À propos
Ateliers
Journal
Contact

Right-side actions:
Search
Favorites
Mon compte
Prendre rendez-vous

PRIMARY BUTTONS:
Use #061938 with white text.

SECONDARY BUTTONS:
Transparent or ivory background with #061938 borders and text.

PREMIUM BUTTONS:
Use #936C3E sparingly for Premium features.

CREATIONS PAGE:
Create a visual gallery for:
- Robes de mariée
- Costumes homme
- Costards sur mesure
- Robes de soirée
- Créations spéciales
- Tenues traditionnelles revisitées
- Accessoires
- Collections

Use large photography and editorial masonry/grid layouts.

CREATION DETAIL:
Show:
- large image gallery
- title
- category
- collection
- description
- materials
- craftsmanship details
- customization options

Actions:
"Prendre rendez-vous"
"Créer une version personnalisée"
"Ajouter aux favoris"

READY-TO-WEAR:
Create a refined product catalogue with:
- photos
- price
- available sizes
- colors
- materials
- availability
- "Réserver pour essayage"
- "Acheter"

SUR-MESURE:
Present the couture process visually:
Votre idée → Consultation → Mesures → Conception → Patron → Confection → Essayage → Livraison

APPOINTMENTS:
Create a very simple appointment booking experience.
Fields:
name
phone
email
creation type
atelier
date
time
message

Include a clean availability calendar.

PATTERN PREMIUM:
Create a premium digital atelier called:
"Angaly Pattern Studio"

Subtitle:
"Votre patron, créé selon vos mesures."

The experience should feel like a sophisticated digital fashion atelier.

The user should be able to:
1. Create a project
2. Select garment type
3. Select style
4. Customize details
5. Upload an inspiration image
6. Enter measurements
7. Generate a pattern
8. Preview pattern pieces
9. Request professional verification by Angaly
10. Validate the pattern
11. Export PDF

Pattern Studio UI should use:
#041329
#061938
#0C2650
#C5B190
#936C3E
#FFFFFF
#D8D3C8

The AI feature should be presented as an assistant to professional pattern-making, not as a magical replacement for a professional tailor.

CUSTOMER DASHBOARD:
Create:
- Mes rendez-vous
- Mes commandes
- Mes créations
- Mes projets de patron
- Mes mesures
- Mes favoris
- Mes messages
- Mes factures
- Notifications

ORDER TRACKING:
Use a refined timeline:
Commande confirmée
→ Mesures
→ Patron
→ Confection
→ Contrôle qualité
→ Essayage
→ Terminée
→ Livrée

ABOUT PAGE:
Tell the story of Angaly as a couture house.
Include:
- founder
- story
- craftsmanship
- philosophy
- workshop
- values
- vision

ATELIERS:
Show workshop locations with:
- photos
- addresses
- opening hours
- services
- map
- directions

JOURNAL:
Create an editorial fashion/marriage journal covering:
- mariage à Madagascar
- conseils mode
- robes de mariée
- costumes
- tendances
- coulisses de l'atelier
- entretien des vêtements

MOBILE:
Design mobile-first.
The mobile experience must preserve the luxury editorial feeling.
Use:
- large images
- simple navigation
- sticky appointment CTA
- WhatsApp access
- touch-friendly galleries
- short forms

IMPORTANT VISUAL RULE:
The deepest navy #061938 must remain the primary Angaly brand color throughout the entire interface. Ivory #F6F2E9 should provide the main light background. Champagne and antique gold should only be subtle accents.

The overall result should look like a combination of:
high-end couture house + luxury editorial magazine + modern digital atelier.

Do not make it look like a generic online store.
```

---

# 16. Prompt court pour itérations Stitch

Pour modifier une maquette existante dans Stitch :

```text
Refine the current Angaly design using the established brand palette.

Keep #061938 as the primary brand color.

Use #F6F2E9 as the main light background, #0C2650 and #18375D for secondary navy surfaces, #D8D3C8 for warm ivory, #C5B190 for champagne accents and #936C3E for very subtle premium gold details.

Preserve a luxury couture, editorial and sophisticated aesthetic.

Increase whitespace, improve visual hierarchy and make the photography more prominent.

Avoid excessive gold, gradients, shadows, rounded SaaS cards and generic e-commerce styling.

The result should feel like a prestigious couture house with a modern digital atelier.
```

---

# 17. Prompt pour la page d'accueil uniquement

```text
Design the Angaly couture house homepage.

Use #061938 as the primary brand color and #F6F2E9 as the primary light background.

Create a cinematic full-screen hero with an elegant couture wedding dress or tailored suit.

Use refined serif typography similar to Cormorant Garamond for headings and Inter or Manrope for UI.

Hero:
ANGALY
"L'élégance, créée pour vous."

CTA:
"Prendre rendez-vous"
"Découvrir nos créations"

Immediately after the hero, create a highly visual editorial section called "LA UNE" showcasing the most beautiful Angaly creations.

Use large photography, asymmetric editorial layouts, subtle champagne accents (#C5B190) and restrained antique gold (#936C3E).

Continue with:
- Réalisations
- Collections
- Sur Mesure
- Patron Premium
- Témoignages
- Ateliers
- À propos
- Journal

The website must look like a luxury couture house, not a generic fashion store.
```

---

# 18. Prompt pour Pattern Studio

```text
Design a premium digital pattern-making interface for Angaly called "Angaly Pattern Studio".

This is a high-end digital couture atelier, not a generic SaaS dashboard.

Primary colors:
#061938
#041329
#0C2650

Accent colors:
#C5B190
#936C3E

Text:
#FFFFFF
#D8D3C8

Create a sophisticated workflow:

1. Nouveau projet
2. Type de vêtement
3. Style
4. Personnalisation
5. Inspiration
6. Mesures
7. Génération
8. Prévisualisation
9. Vérification Angaly
10. Validation
11. Export PDF

Show technical pattern pieces in a beautiful but professional way.

Use elegant serif headings and clean sans-serif UI text.

The interface should feel like:
luxury fashion atelier + precision pattern engineering + modern technology.

Avoid the typical appearance of an AI SaaS product.
```

---

# 19. Résumé de l'identité visuelle

### Couleur principale

**#061938 — Angaly Deep Navy**

### Couleur de fond

**#F6F2E9 — Ivory**

### Bleu secondaire

**#0C2650**

### Bleu clair

**#18375D / #1E4574**

### Accent chaud

**#C5B190 — Champagne**

### Accent Premium

**#936C3E — Antique Gold**

### Texte secondaire

**#5C697A**

### Bordures

**#D9D4CA**

---

# 20. Règle fondamentale

L'identité Angaly doit être immédiatement reconnaissable grâce à cette combinaison :

```text
DEEP NAVY
     +
IVORY
     +
CHAMPAGNE
     +
SUBTLE GOLD
     +
LARGE COUTURE PHOTOGRAPHY
     +
EDITORIAL TYPOGRAPHY
```

Le résultat recherché :

> **Une maison de couture malgache contemporaine, élégante et premium, avec une identité digitale suffisamment forte pour devenir une véritable marque.**
