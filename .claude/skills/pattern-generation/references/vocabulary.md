# Vocabulaire des détails — ce que l'œil voit, ce que le moteur fait

Source de vérité des identifiants : `packages/types/src/pattern-detail-options.ts` (`PATTERN_DETAIL_OPTIONS`).
Descriptions données à l'IA : `apps/ai-service/app/garment_knowledge.py` (`DETAIL_OPTIONS`). Libellés du wizard :
`apps/web/src/features/pattern-studio-wizard/consts/details.const.ts`. Les trois sont vérifiés par des tests de synchronisation.
Valeurs en mm pour la mensuration de référence (poitrine 92, taille 74, bassin 98, dos 42, cou 36). Vérifié le 2026-10-14 :
si un chiffre ci-dessous diffère du code, **le code fait foi** — corriger ce fichier.

## Coupe (`cutType`) — `shared/cut-profile.ts` `CUT_PROFILES`

| Id | Œil | Moteur (Δ corsage / taille / hanches, évasement d'ourlet) |
|---|---|---|
| `DROITE` | tombe droit | profil de base |
| `AJUSTEE` | épouse le corps, pinces | −10 / −10 / −10, −20 |
| `EVASEE` | A, s'ouvre doucement | +5 / 0 / +10, +250 |
| `PRINCESSE` | buste ajusté, taille marquée, jupe ample | −5 / −15 / +10, +450 |
| `SIRENE` | moulant jusqu'au genou puis corolle | −10 / −10 / −5, +300, `fishtail` |
| `OVERSIZE` | ample partout | +50 / +60 / +60, +120 |

Avec `fullness.skirt` > 1, l'ourlet ne dépend plus de l'évasement de la coupe : quart d'ourlet = `fullness × tour de taille / 4`
(`hemFor`, `robe.rule.ts`). `SIRENE` est souvent trop marqué pour les « corolles » édouardiennes : préférer `EVASEE` + traîne
si la jupe s'évase dès la mi-cuisse.

## Manches (`manches`) — `resolveSleeve` (`cut-profile.ts`), dessin `sleevePiece` (`shapes.ts`), 3D `drapeSleeve`

| Id | Œil | Moteur |
|---|---|---|
| `SANS_MANCHES` | épaules nues ou bretelles | pas de pièce |
| `CAP` | minuscule manche qui couvre juste l'épaule | 70 mm, tête courbe |
| `COURTES` | au-dessus du coude ; **petite manche bouffante = COURTES + `fullness.sleeve`** | 200 mm, poignet 0,9 |
| `TROIS_QUARTS` | entre coude et poignet | 430 mm, poignet 0,8 |
| `LONGUES` | jusqu'au poignet | `LONGUEUR_BRAS` ou 590, poignet 0,65 |
| `BALLON` | **gigot long** : bouffant épaule → coude, ajusté à l'avant-bras | 480 mm, haut ×1,35, ventre à 28 %, arrondi à 37 %, coude = 60 % du haut **plafonné à 1,15 × la manche standard** (une manche très ample se referme quand même au coude) ; jusqu'au poignet (≥ 85 % du bras) : pièce « Poignet » ×2 (35 mm fini), manche raccourcie d'autant |
| `PAPILLON` | évasée, flottante | 420 mm, ourlet ×1,7 |
| `EVEQUE` | ample dès l'emmanchure, froncée dans un poignet serré | bras entier, haut ×1,15, resserrée à 80 % ; « Poignet » ×2 comme `BALLON` |
| `CLOCHE` | ajustée jusqu'au coude puis évasée (trompette) | 500 mm, ourlet ×2,1 ; `fullness.sleeve` ouvre l'**ourlet** |
| `LANTERNE` | froncée en haut **et** au poignet, gonflée au milieu | 430 mm, ventre ×1,9 à 45 % |
| `RAGLAN` | couture diagonale du col au dessous de bras | tête en biais + 70 mm vers le col |
| `KIMONO` | coupée d'une pièce avec le corps | pente d'épaule 60 mm, haut ×1,3 |

`fullness.sleeve` (1–2,5) multiplie la largeur du haut (sauf `CLOCHE` : l'ourlet). Une manche ≥ 1,2× la normale et ≥ 300 mm prend
la coupe gigot. `lengths.sleevePct` = % du **bras entier** (0 = pas de manche). En 3D, une manche > 1,3× sa tête est un ballon :
anneaux ronds, plis (`PUFF_FOLDS`), affaissement (`PUFF_SAG_M`), tête répartie sous l'épaule (`PUFF_BLOOM_*`).

## Col (`col`) et encolure (`decollete`) — `resolveNecklineChoice`, pièce `collarPiece`, 3D `collar-model.ts`

| Id | Œil | Encolure (½ largeur × profondeur) | Pièce col (robe) | 3D |
|---|---|---|---|---|
| `SANS_COL` | encolure simple | défaut 80 × 0 | — | — |
| `ROND` | ras du cou | 75 × 75 | — | — |
| `EN_V` | V | 90 × 170 | — | — |
| `BATEAU` | large d'une épaule à l'autre | 140 × 20 | — | — |
| `OFFICIER` | col droit montant (Mao) | 60 × 0 | « Col officier » 45 mm | bande autour du cou |
| `CHEMISIER` | col rabattu (pointes) | 75 × 30 | « Col chemise & pied de col » 70 mm | pied + col rabattu à pointes, couleur de contraste |
| `LAVALLIERE` | col à nouer | 70 × 20 | « Col lavallière » 1400 × 120 | deux pans qui tombent |
| `CHALE` | grands revers en V sur la poitrine | défaut | « Col châle » (nuque → poitrine) ; veste et costume aussi (au lieu du « Col Tailleur ») | pied dans le dos + revers en V (miroir) |

`decollete` (`SAGE` 75×75, `MOYEN` 90×80, `PLONGEANT` 100×220, `COEUR` 110×140 en cœur (lobes sur la poitrine, pointe au milieu, bord de bretelle), `CARRE` 110×120, `EN_U` 95×160 rond, `HORS_EPAULES` bardot : bord unique du milieu devant (13 cm sous la ligne d'épaule)
à l'emmanchure 5 cm sous le point d'épaule, plus de couture d'épaule, tête de manche coupée d'autant, pas de pièce col ; pièces
suffixées « (hors épaules) », la 3D ne les pose pas sur les épaules) **l'emporte** sur `col` pour
l'encolure (et `HORS_EPAULES` retire un `col` en forme à la lecture IA : « bord sous les épaules » ≠ `BATEAU`). `dos` est aujourd'hui informatif pour la robe (pas de géométrie).

## Corps de la robe

| Groupe | Id | Moteur |
|---|---|---|
| `corsage` | `LISSE` | devant d'un tenant |
| | `FRONCES_SOUS_POITRINE` | devant coupé sous la poitrine + « Empiècement Devant » (bande 60–110 mm) |
| | `CROISE_FRONCE` | deux devants croisés (cache-cœur) sur l'empiècement |
| `taille` | `NATURELLE` / `BASSE` (basque sur les hanches) / `HAUTE` (empire, jupe sous la poitrine) | |
| `devant` | `FERME` | devant sur la pliure |
| | `MANTEAU_OUVERT` | robe-manteau : devants hors pliure (×2) écartés de 45 → 25 → 150 mm (col → taille → ourlet) + « Plastron (sous-robe) » + parementures 60 mm (« Parementure Devant » ×2, « Parementure Jupe Devant » ×2, « Parementure Dos ») ; 3D : plastron dans l'ouverture, couleur `fit.contrastColor` ; parementures listées comme pièces intérieures |
| | `MANTEAU_REVERS` | comme `MANTEAU_OUVERT` + « Revers » ×2 (12 → 50 mm, le long de l'ouverture du corsage) ; 3D : bande rabattue sur le devant |
| | `GILET` | corsage (cuirasse) ouvert sur un gilet, jupe fermée : devants du corsage hors pliure (×2) écartés de 45 → 75 → 40 → 60 mm (col → buste → taille → bas de la basque) + « Plastron (gilet) » de la longueur du corsage (×2 avec croisure de 15 mm s'il est boutonné) + « Revers » + parementures ; 3D : gilet dans l'ouverture du corsage seulement |
| `basque` | `AUCUNE` / `POINTES` / `PANS_CROISES` | gilet (`devant GILET`) terminé en pointes sous le corsage ; `PANS_CROISES` : + « Pan croisé » ×2 en V sur la jupe devant (zones de détail en tissu contrastant) |
| `jupe` | `DEUX_PANS` / `EN_LES` | `EN_LES` : chaque demi-jupe coupée en panneau + « Jupe Côté Devant/Dos » ×2 (`goreSplit`) ; 3D : recollées (`joinRows`). `ROBE_MARIEE` + `EN_LES` (sans bloc) : 8 lés froncés + 2 panneaux de traîne (`goredBallSkirt`, robe de bal 1850) |
| `fermeture` | `ZIP_INVISIBLE`, `BOUTONS`, `CEINTURE_INTEGREE`, `AUCUNE`, `ZIP_DEVANT`, `BOUTONS_TAILLE` (jusqu'à la taille) | `BOUTONS` / `BOUTONS_TAILLE` : ligne de boutons Ø 12 mm tous les 35 mm au milieu devant du corsage (`internalLinesMm[].buttons`) ; 3D : boutons bronze sur le gilet ou le corsage. Autres : informatif |
| | `CEINTURE_NOUEE` | (robe) « Ceinture » (taille + 60 mm, 45 mm finie), « Nœud (boucles) », « Nœud (milieu) », « Pans du nœud » ×2 ; 3D : ceinture autour de la taille + nœud devant (`drapeBelt`) |
| | `CORDELIERE` | pièce « Cordelière » ; 3D : nœud et deux pans à la taille |
| `longueur` | `MINI` 450, `GENOU` 600, `MIDI` 700 (mi-mollet), `MAXI` 950, `SOL` 1050, `ASYMETRIQUE` 800 (taille → ourlet, × `STATURE`/168 si connue) | `lengths.skirtPct` en % de cette valeur |

## Blocs de drapé (`parametersExtJson.drape.blocks`) — `blocks/`, bornes `pattern-fit.ts`

`GATHERED_SKIRT {fullness}`, `PLEATED_SKIRT {pleats, depthMm, type KNIFE|BOX}`, `CIRCLE_SKIRT {fraction}`, `WRAP_FRONT`,
`COWL_NECK`, `TRAIN {lengthMm}`, `OVERSKIRT`, `DRAPED_BODICE`, `ASYMMETRIC_HEM`. Un seul bloc de jupe ; un bloc de jupe remplace
« Jupe Devant/Dos » (donc pas d'ouverture de robe-manteau sur la jupe dans ce cas). Une jupe froncée en tissu `FLUIDE` à
`fullness` > 2 fait « ballon » en 3D : rester vers 1,6–1,8.

## Tissu (informatif, 3D seulement) — `GarmentFit`

`fabricBehavior` `FLUIDE|STRUCTURE|RIGIDE|STRETCH` (tenue des fronces et plis), `fabricPrint` `UNI|POIS|RAYURES|CARREAUX|FLEURI|BROCART|ARABESQUE|AUTRE`,
`fabricColor`, `motifColor`, `contrastColor` (plastron, col contrasté) en `#rrggbb` ; `fabricFinish` `MAT|VELOURS|SATIN`
(VELOURS/SATIN ⇒ rendu « photo » : fond studio, pose Présentation) ; `contrastPrint` + `contrastMotifColor` (plastron) ;
`accentPrint` (motif `motifColor` sur le seul ballon des manches et les bordures du plastron) ; `contrastGores: true` (jupe `EN_LES` : lés de côté dans le tissu contrastant, panneau du milieu dans le principal) ; `contrastTrims: true` (col et poignets dans le tissu du gilet). `corsage PRINCESSE` : découpes de l'emmanchure à la taille (« Corsage Côté Devant/Dos »). `manches TAILLEUR` : deux pièces + poignet rapporté et sa parementure. Gigot long : manche en deux
pièces (« Manche extérieure / intérieure »). Jupe évasée : en A dès la taille (`skirtOutline`).

## Ce qui n'est pas (encore) modélisé

Volants étagés, jabots, bandes appliquées, revers rapportés sur un col montant, basque à pointes contrastée, col / poignets dans le tissu du gilet, broderies, drapés libres en écharpe (`constructionMethod: DRAPING`),
berthe (volant de dentelle le long d'un bord hors-épaules), énormes nœuds de manche, poignets contrastés. Les signaler comme « non rendu », ne pas les simuler en
déformant une autre option.

## Bas du corps — pantalon, jupe, pantalon du costume (`shared/bottoms.ts`, 2026-10-20)

| Groupe | Ce que l'œil voit | Moteur |
|---|---|---|
| `taille` | bord haut à la taille / 4 cm au-dessus (taille haute) / sur les hanches (basse) | ±40 mm, ligne `WAIST` |
| `ceinture` | bande droite 3-4 cm / large galbée / froncée élastique / cordon noué / bord net sans bande | pièce « Ceinture » ou « Parementure de taille » |
| `fermeture` | braguette surpiquée en J (zip) ou boutonnée / glissière de côté / à enfiler | braguette : parementure + sous-patte |
| `plis` | devant plat / pinces / un ou deux plis couchés sous la ceinture | +35 mm par pli |
| `poches`, `poches_dos` | en biais (italiennes), dans la couture, plaquées ; dos passepoilé ou plaqué | pièces intérieures |
| `bas` | ourlet / revers retroussé | « Bande de revers de bas » |
| `fente` | fente milieu dos ou côté (jupe droite) | rabat 40 mm × 18 cm |

Réglages continus du pantalon : `fullness.leg` (ourlet ÷ celui de la coupe : 1,3 = pattes d'éléphant très marquées) et
`lengths.legPct` (% de la jambe jusqu'à la cheville : 45 short, 60 bermuda, 75 pantacourt, 90 7/8, 100 cheville, 104 sol).
Jambe : comparer la largeur au **genou** et à l'**ourlet** sur la photo — genou ≈ ourlet = droit ou palazzo (selon la largeur),
ourlet ≫ genou = bootcut puis pattes d'éléphant, genou ≫ ourlet = baggy / sarouel.

## Pièces de construction (`parametersExtJson.construction.items`, 2026-10-21) — `shared/construction.ts`

| `kind` | Œil / atelier | Moteur |
|---|---|---|
| `LINING {parts?}` | robe doublée | « Doublure — <pièce> » (jupe −25 mm, manche −15 mm) ; pas sous un jupon |
| `INTERFACING` | col, poignets, parementures tenus | « Entoilage — <pièce> », sans couture |
| `HEM_FLOUNCE {tiers, depthMm, style FRONCE\|CIRCULAIRE}` | volant d'ourlet, volants étagés | bandes × 1,8 ou secteurs d'anneau ; lignes de placement |
| `GODETS {count, heightMm, widthMm}` | triangles évasés dans les coutures | secteur ; fentes marquées |
| `PEPLUM {style CIRCULAIRE\|POINTES\|FRONCEE, depthMm}` | basque cousue à la taille | sautée si une pièce « basque » existe (option `basque`) |
| `JABOT`, `CAPELET` (pèlerine), `BOW {place}` (chou), `SASH` (écharpe), `APRON` (tablier) | garnitures visibles | drapés en 3D (`construction-model.ts`) ; l'écharpe via sa zone de détail |
| `HEM_BANDS {rows, widthMm, gapMm}` | bandes contrastées au bas | suivent l'ourlet de chaque pièce |
| `ENGAGEANTES`, `BALAYEUSE`, `BUSTLE {COUSSIN\|POUF\|PANIERS}`, `WATTEAU_PLEAT` | historique (1750–1905) | dérivés de la manche, de l'ourlet, du dos |

`BUSTLE` en 3D (2026-10-23, `utils/garment3d/understructure.ts`) : les paniers (« Panier (poche de hanche) ») et le
coussin (« Coussin de tournure », aussi coupé avec `POUF`) ne sont pas drapés mais soutiennent la jupe — paniers =
ellipse large aux hanches, plate devant / derrière (60 à 100 % de la profondeur de la poche selon l'ampleur de la
jupe, comptée sur le corps à la couture de la jupe : taille, ou hanches sous une taille basse) ; coussin = bosse au dos
sous la taille. **Une jupe sur paniers doit avoir l'ampleur pour passer dessus** (~1,8 m au creux) : sinon la 3D la
montre retomber plaquée sur les jambes — corriger le patron (jupe froncée ou plissée ≥ × 2,5), pas la 3D.
| `SEAM_POCKETS`, `BIAS_BINDING`, `UNDERARM_GUSSET`, `PUFF_SUPPORT` | finitions | pièces intérieures |
| `EMBROIDERY {place, widthMm, color}` | zone brodée (encolure, plastron, manches, ourlet) | gabarit + zone de détail (`motif: 'BRODERIE'` : rinceaux et fleurs dans la couleur du fil en 3D ; à l'ourlet, au-dessus des volants) + fil |
| `SMOCKING {place, rows, ratio}` | nids d'abeille | panneau `ratio` × largeur finie + zone (`motif: 'SMOCKS'` : nid d'abeille en relief en 3D) + fil élastique |
| `CONTRAST_CUFFS {heightMm, color}` | poignets d'une autre couleur | « Poignet (contraste) » ou poignet existant recoupé |

Broderie : choisir une couleur de fil **qui tranche** sur le tissu (un fil rouge sur un corsage rouge ne se voit pas en 3D,
ni sur la robe).

Ne jamais simuler une de ces pièces en déformant une option existante. La lecture photo les propose (`construction`,
`app/construction_knowledge.py`) et l'assistant les édite (`ConstructionEditor`). Banc et planches : `docs/reviews/dress-pattern-catalog.md`.
