# Paramètres de patron — ce qui manque par vêtement (revue 2026-10-20)

Comparaison entre ce que lit `packages/pattern-engine` aujourd'hui et ce que demandent les générateurs de patrons
sur mesure de référence. Sert de feuille de route : chaque option à ajouter suit `.claude/skills/pattern-generation/references/adding-an-option.md`
(moteur → types → assistant → 3D → tests), chaque mesure doit aussi être proposée dans « Mes mesures ».

Sources consultées :
- FreeSewing (open source) : [Titan, bloc pantalon](https://freesewing.eu/docs/designs/titan/options) et [ses mesures](https://freesewing.eu/docs/designs/titan),
  [Charlie, chino](https://freesewing.eu/docs/designs/charlie/options), [Bella, bloc corsage](https://freesewing.eu/docs/designs/bella),
  [Penelope, jupe crayon](https://freesewing.eu/docs/designs/penelope), [Simon, chemise](https://freesewing.eu/docs/designs/simon/options),
  [Jaeger, veste](https://freesewing.eu/docs/designs/jaeger/options) ;
- Smart Pattern : [pantalon sur mesure configurable](https://smartpattern.de/en/product/business-trousers-individual/) ;
- Minerva Patterns : [modèles sur mesure (braguette zippée, poches)](https://minervapatterns.com/model/5073?t=15) ;
- moulage / à plat : [module moulage CAP](https://www.youschool.fr/cap-metiers-mode/modules/moulage-couture/).

Légende : ✅ lu par le moteur · ⚠️ existe dans `@angaly/types` / l'assistant mais pas (ou mal) lu · ❌ absent.

> **Mise à jour 2026-10-20 (soir)** : la priorité 1 (pantalon) et la jupe sont faites — hauteur de taille, ceinture, fermeture
> (braguette, zip côté, élastique), plis / pinces, poches devant et dos, revers, fente de jupe, `LONGUEUR_ENFOURCHURE`,
> `HAUTEUR_BASSIN` pour le pantalon, réglages continus `fullness.leg` / `lengths.legPct`. Détail : `pattern-engine.md`,
> section « Bas du corps ». Le groupe « Dos » de la robe et la pente d'épaule sont faits aussi. Restent : robe (retouches de morphologie, poches, doublure),
> chemise, veste, robe de mariée, la longueur partagée du costume.

## 1. Pantalon (priorité 1)

**Aujourd'hui :**
- **Mesures :** ✅ tour de taille, tour de bassin, montant (`HAUTEUR_FOURCHE`), entrejambe, longueur de jambe, hauteur taille-genou ; ✅ tour de cuisse, de genou et de cheville comme largeurs minimales.
- **Choix :** ✅ coupe (6 formes de jambe, recalibrées le 2026-10-20), ✅ longueur (5), ✅ aisance.
- **Pièces :** devant, dos, ceinture droite, fond de poche (taille fixe, sans ouverture de poche dessinée).

| Manque | Pourquoi | Référence |
|---|---|---|
| ❌ **Longueur d'enfourchure** devant et dos (milieu devant taille → entrejambe → milieu dos taille) | C'est la mesure qui fait un fond de pantalon juste. Le moteur la déduit du bassin (`tb/4 + 20`) | Titan « cross seam », « cross seam front » |
| ⚠️ **Hauteur taille-bassin** (`HAUTEUR_BASSIN`, existe, lue seulement par la jupe) et hauteur taille-hanche haute | Place la ligne de bassin, aujourd'hui fixée à 180 mm sous la taille | Titan « waist to seat », « waist to hips » |
| ❌ Répartition dos/devant de la taille et du bassin (largeur dos) | Une cambrure ou un fessier marqué demande plus de tissu au dos | Titan « waist back », « seat back » |
| ⚠️ Hauteur taille-sol (`HAUTEUR_TAILLE_SOL`, existe) | La longueur « sol » devrait se caler dessus plutôt que sur un facteur de 1,04 | Titan « waist to floor » |
| ❌ **Hauteur de taille** : haute, normale, basse | Change le montant, la ceinture et la fermeture | Titan « waist height », Smart Pattern |
| ❌ **Fermeture** : braguette zippée devant (parementure et sous-patte), braguette à boutons, zip invisible côté, zip dos, taille élastiquée sans fermeture | Le patron n'a aujourd'hui aucune fermeture, donc il ne se monte pas | Charlie « fly », Minerva |
| ❌ **Ceinture** : droite ou en forme, largeur 3-4 ou 6 cm, élastiquée, coulissée, nombre de passants | Une seule ceinture droite de 7 cm aujourd'hui | Smart Pattern 40/60 mm, Charlie « belt loops » |
| ❌ **Pinces et plis devant** : aucun, 1 ou 2 plis ; pinces dos | Font l'ampleur au bassin (pantalon tailleur, pantalon à pinces) | Smart Pattern « one or two pleats » |
| ❌ **Poches devant** : italiennes (obliques), dans la couture, plaquées, aucune. **Poches dos** : passepoil simple ou double, plaquées, aucune | Le fond de poche existe déjà, mais sans ouverture ni garniture | Charlie « front/back pocket », Smart Pattern |
| ❌ **Bas** : ourlet simple, revers, fente | Un revers ajoute de la longueur à la pièce | Smart Pattern « turn-up » |
| ❌ Fourche descendue (sarouel, baggy) et angle de ceinture (dos rehaussé) | Réglages de confort et de style | Titan « crotch drop », « waistband angle » |
| ❌ Pli repassé, doublure devant ou genou | Finitions de pantalon de costume | Smart Pattern |

**Ordre proposé :**
1. la longueur d'enfourchure et la hauteur taille-bassin (justesse du fond de pantalon) ;
2. la fermeture et la ceinture, pour que le patron se monte ;
3. les poches et les pinces ;
4. la hauteur de taille, le bas, la fourche descendue.

## 2. Robe — patron à plat ou moulage

**Aujourd'hui :**
- **Mesures :** ✅ la plus riche (`fit.ts`) : poitrine, haut et dessous de poitrine, écart des pointes, carrure devant et dos, épaule, emmanchure, bras, poignet, cou, bassin, longueurs.
- **Choix :** manches, col, décolleté, longueur, fermeture, corsage, taille, devant, jupe, ampleur et longueurs mesurées.
- **Drapé :** blocs de drapé (`GATHERED_SKIRT`, `PLEATED_SKIRT`, `CIRCLE_SKIRT`, `WRAP_FRONT`, `COWL_NECK`, `TRAIN`, `OVERSKIRT`, `DRAPED_BODICE`, `ASYMMETRIC_HEM`).
- **Construction :** un arbre de décision choisit entre patron à plat, à plat avec blocs, base à plat + moulage, ou moulage seul (`construction-approach.ts`), avec une fiche de moulage.

| Manque | Pourquoi |
|---|---|
| ⚠️ **Groupe « Dos »** proposé par l'assistant mais lu nulle part | Le choix de la cliente est ignoré. À brancher (dos nu, dos en V, dos boutonné) ou à retirer |
| ❌ **Pente d'épaule** et hauteur épaule-poitrine (HPS → poitrine) | Bella les demande. Ce sont les deux mesures qui font tomber juste un corsage |
| ❌ **Retouches de morphologie** : poitrine forte ou menue, dos rond, cambrure, épaules tombantes ou carrées, ventre | Ce sont ces retouches qui distinguent un vrai sur-mesure d'une simple gradation |
| ❌ Type de découpe : pinces (taille, poitrine, côté) ou découpe princesse (depuis l'épaule ou l'emmanchure) | Un seul tracé aujourd'hui |
| ❌ **Poches dans les coutures de côté** | Très demandées sur les robes de jour |
| ❌ Doublure (complète, corsage seul) et finition d'encolure (parementure ou biais) | Ajoute les pièces de doublure et de parementure |
| ❌ Fente (dos, côté) et taille montée ou coupée | Utiles surtout pour les jupes droites et sirène |
| ❌ **Moulage :** choix de la taille du buste de couture, report des lignes (carrure, poitrine, taille, bassin) sur la fiche de moulage, et étape d'essayage de la toile avec retouches notées | Le moulage existe comme décision, mais la fiche ne guide ni le buste ni l'essayage |

## 3. Hauts : chemise et veste

**Aujourd'hui :** manches, col, décolleté, longueur, coupe. Le moteur lit le tour de poitrine, de taille, la longueur de dos et de bras, plus les mesures communes de `fit.ts`.

**Chemise (référence : Simon) :**
- ❌ patte de boutonnage : classique, cachée, sans ; nombre de boutons ;
- ❌ empiècement dos (simple ou en deux) et pli dos (creux, plat, aucun) ; pinces dos ;
- ❌ forme d'ourlet : droit ou arrondi ;
- ❌ poignet : simple, mousquetaire, arrondi ; longueur de la fente de manche ;
- ❌ poche poitrine.

**Veste (référence : Jaeger) :**
- ❌ revers : cranté, pointu, châle (le châle existe déjà) ;
- ❌ droit ou croisé, nombre de boutons ;
- ❌ poches : passepoil, à rabat, plaquées, poche poitrine, poche intérieure ;
- ❌ fentes dos : aucune, une, deux ; fente de manche ;
- ❌ doublure, épaulettes, entoilage.

**Mesures :**
- ⚠️ tour de cou et tour de poignet : à vérifier qu'ils règlent bien le col et le poignet de la chemise ;
- ❌ pente d'épaule et dos rond, comme pour la robe.

## 4. Jupe

**Aujourd'hui :** longueur, coupe et blocs de drapé (froncée, plissée, cercle, portefeuille, traîne, surjupe, ourlet asymétrique). Le moteur lit la hauteur taille-bassin, la longueur de jupe, la stature et le tour de taille.

| Manque | Pourquoi |
|---|---|
| ❌ Ceinture : montée, parementure (sans ceinture), élastiquée, taille haute | Penelope : ceinture facultative |
| ❌ Fermeture : zip invisible côté ou dos, boutons devant, portefeuille | Penelope : zip déplaçable au dos |
| ❌ Fente : dos, côté, devant | Indispensable pour une jupe droite ou crayon longue (Penelope « vent ») |
| ❌ Doublure, poches dans les coutures, nombre de pinces | Penelope : doublure |
| ⚠️ Hauteur taille-genou (existe) et largeur dos du bassin | Penelope demande « waist to knee » et « seat back » |

## 5. Costume, robe de mariée, autre

- **Costume :**
  - tout ce qui manque à la veste et au pantalon ;
  - et la longueur, aujourd'hui partagée entre veste et pantalon (`handoff`, 2026-10-20) : à séparer.
- **Robe de mariée** (a déjà : baleines, traîne mesurée) :
  - ❌ laçage dos ;
  - ❌ boutons recouverts avec boucles ;
  - ❌ relevé de traîne (pour danser) ;
  - ❌ nombre de jupons ou de couches de tulle ;
  - ❌ doublure et bonnets intégrés.
- **Autre vêtement :** enveloppe générique, rien à ajouter tant qu'il n'a pas de règle propre.

## 6. Mesures transversales à ajouter dans « Mes mesures »

| Mesure | Utilisée par |
|---|---|
| Longueur d'enfourchure totale et devant | pantalon, costume, combinaison future |
| Pente d'épaule (en degrés ou en cm sous l'horizontale) | robe, haut, veste |
| Hauteur épaule (HPS) → pointe de poitrine, et HPS → taille devant | robe, haut (existent en partie : `HAUTEUR_POITRINE`, `LONGUEUR_DEVANT`) |
| Largeur dos à la taille et au bassin | pantalon, jupe, robe |
| Hauteur taille → hanche haute | pantalon, jupe |
| Longueur bras jusqu'au coude | manches ajustées, gigot |
