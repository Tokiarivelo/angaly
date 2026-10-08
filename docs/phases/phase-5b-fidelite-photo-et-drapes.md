# Phase 5b — Fidélité photo, aisance paramétrique, blocs de drapé & modèle local

**Statut : 🚧 S1 à S5 livrées, S6 livrée côté outillage (2026-10-08) ; photos réelles, S7 et S8 à faire.** Dépend de : Phase 4 (pattern-engine, wizard) et
Phase 5 (ai-inference, analyse de photo). Prolonge `docs/features/ai-inference.md`,
`docs/features/pattern-engine.md`, `docs/features/patterns.md` et
`docs/features/ai-training-data.md`.

> **Règle projet** : une phase par session. Ce document découpe le travail en **sessions
> S1 → S8** ; chacune est livrable, testée et mergeable seule. Ne jamais en mélanger deux.

---

## 1. Objectif

Générer, à partir d'une photo d'inspiration, le patron **le plus fidèle possible** au vêtement
photographié, en gardant la garantie de sécurité du projet : **la géométrie ne vient que de
`packages/pattern-engine`** (déterministe, ADR-005, règles absolues 18 et 19). L'IA choisit
des *paramètres validés* ; le moteur calcule les *contours*.

Trois limites à lever (issues de la livraison « Observations persistées + construction ») :

| # | Limite actuelle | Réponse du plan |
|---|-----------------|-----------------|
| L1 | Le moteur ne produit que des pièces **à plat** ; un drapé n'est pas représentable | **Blocs de drapé déterministes** (jupe froncée, plissée, cercle, portefeuille, col bénitier…) + conseil mannequin pour le drapé libre |
| L2 | Les **observations** (tissu, silhouette, aisance) n'influencent pas la géométrie | **Paramètres moteur étendus** (`ease`, `fullness`, `lengths`, `drape`) remplis par l'analyse photo, validés |
| L3 | Listes d'options dupliquées (web / API / ai-service) | ✅ **Fait** : source unique `packages/types/src/pattern-detail-options.ts` + tests anti-dérive |

Objectifs transverses : mesurer la fidélité (jeu de référence + métriques), alimenter et
entraîner le modèle local avec les données collectées, visualiser le résultat (2D + mannequin 3D).

## 2. État des lieux (acquis, ne pas refaire)

- Étape **Inspiration en 1er** ; `?step=` dans l'URL ; pré-remplissage de Vêtement/Occasion/Style/Coupe/Détails.
- ai-service : `garment_knowledge.py` (taxonomie fermée, procédure, few-shot, `normalize_profile`) ;
  profil = type, occasion, style, coupe, détails, `constructionMethod` (FLAT_PATTERN | DRAPING | MIXED),
  `presentation` (WORN | MANNEQUIN | FLAT | SKETCH), `constructionNotes`.
- API : analyse (`/ai-inference/inspiration-analysis`) avec choix du modèle ; cache par hash **et** par modèle ;
  `pattern_projects.inspirationAnalysisJson` ; fusion `InspirationParametersService` (client > photo > IA) ;
  avertissement drapé/mixte ; traçabilité dans `parametersJson.inspiration`.
- Collecte d'entraînement : table `ai_training_samples`, étiquette humaine à la génération, export JSONL.
- Logs de bout en bout (API + ai-service) ; boutons Réessayer/Régénérer ; sélecteur de modèle (Inspiration, Coupe, Mesures).

## 3. Principes directeurs (non négociables)

1. **Géométrie = pattern-engine uniquement.** Un modèle génératif n'est branché qu'une fois validé
   (règle 18) ; ici l'IA ne produit que des **identifiants et des nombres bornés**.
2. **Aucune valeur IA ne touche le moteur sans validation** : liste fermée ou intervalle borné,
   sinon rejet + repli sur la valeur par défaut historique (rétro-compatibilité des tests existants).
3. **Le client prime** : choix confirmés > photo > suggestion IA > défaut moteur. Toujours tracé.
4. **Rétro-compatibilité** : tout nouveau paramètre est optionnel ; absent = géométrie actuelle à l'identique.
5. **Mesurer avant d'optimiser** : chaque amélioration de fidélité doit bouger une métrique du jeu de référence.
6. **Honnêteté produit** : ce que le moteur ne sait pas faire (drapé libre) est dit au client, jamais masqué.
7. **Données clients = données personnelles** : consentement, exclusion à la suppression de compte.

## 4. Vue d'ensemble des sessions

| Session | Titre | Dépend de | Livrable principal |
|---------|-------|-----------|--------------------|
| **S1** | Contrat de paramètres étendus (`ease`, `fullness`, `lengths`) | — | Types + validation + stockage, sans effet géométrique |
| **S2** | Aisance & proportions dans les règles du moteur | S1 | Règles robe/jupe/veste/chemise/pantalon pilotées par `ease`/`lengths` |
| **S3** | L'analyse photo remplit les paramètres étendus | S1, S2 | Prompt + normalisation + fusion API ; UI de revue/ajustement |
| **S4** | Blocs de drapé déterministes (lot 1) | S1, S2 | Jupe froncée/plissée/cercle, portefeuille, col bénitier |
| **S5** | Drapé avancé & mannequin (lot 2) + sélection de bloc par l'IA | S3, S4 | Traîne, surjupe, manches ballon/papillon, bustier drapé ; conseil mannequin enrichi |
| **S6** | Jeu de référence & métriques de fidélité | S3 | Golden set, scores, rapport CI |
| **S7** | Entraînement du modèle local (vision → profil) | S6 + données collectées | Classifieur local évalué, branché en repli/pré-filtre |
| **S8** | Visualisation 2D/3D, droit à l'oubli, durcissement | S4–S7 | Aperçu mannequin, RGPD, perfs, docs finales |

S1 → S3 forment le **chemin critique** pour lever L2. S4 → S5 lèvent L1. S6 → S7 industrialisent la qualité.

---

## 5. Détail des sessions

### S1 — Contrat de paramètres étendus  ✅ livrée 2026-10-08

> **Livré** : types/bornes/validation (`packages/types/src/pattern-fit.ts`), colonne
> `parametersExtJson` + PATCH validé + régénération revalidée, types moteur optionnels (géométrie
> inchangée, test `ease-contract.test.ts`). **En plus du plan** : catalogue de mesures
> (indispensables / recommandées par vêtement, bornes de plausibilité, cohérence), validation 400
> des profils et des mesures de génération, étape Mesures du wizard adaptée au vêtement, curseurs
> aisance/ampleur/longueurs. Reste pour S2 : faire consommer ces mesures et paramètres par les
> règles. Reste pour S3 : pré-remplissage par la photo et revue « Ajustements déduits de la photo ».

**But** : définir et stocker les nouveaux paramètres sans changer la moindre géométrie.

**Spécification `PatternParameters` (extension optionnelle)** — `packages/pattern-engine/src/types.ts`
et `packages/types` :

```ts
interface PatternParameters {
  garmentType; cutType; style; details;            // existant
  ease?: 'AJUSTE' | 'CONFORT' | 'AMPLE';            // aisance globale
  fullness?: {                                      // ampleur (ratio de tissu / largeur finie)
    skirt?: number;                                 // 1.0 = non froncé … 3.0 = très froncé  (borné 1–4)
    sleeve?: number;                                // 1.0 … 2.5
  };
  lengths?: {                                       // longueurs en % de la mesure de référence
    skirtPct?: number;                              // 40–130
    sleevePct?: number;                             // 0–100 (0 = sans manches)
    bodicePct?: number;                             // 80–120
  };
  drape?: DrapeSpec;                                // voir S4 (absent = aucun bloc)
}
```

**Tâches**
- Types partagés + schémas de validation (Zod côté web, class-validator côté API) avec bornes ci-dessus.
- Constantes `EASE_PROFILES` : `AJUSTE` / `CONFORT` / `AMPLE` → deltas en mm (par quart de corps) pour
  poitrine, taille, bassin ; **`CONFORT` doit reproduire exactement la géométrie actuelle** (+2 cm corsage, etc.).
- Colonne `pattern_projects.parametersExtJson` (Json?) — migration additive ; DTO de mise à jour + entité + mapper.
- `parametersJson` d'une version enregistre les paramètres étendus effectivement appliqués.
- Documentation `docs/features/pattern-engine.md` : tableau des paramètres, bornes, défauts.

**Tests** : validation (bornes, types, rejet), non-régression (`CONFORT` = snapshot existant de toutes les règles),
API (PATCH/GET), migration.
**Critères d'acceptation** : aucun test moteur existant ne change ; un paramètre hors bornes est rejeté (400) ;
un projet sans paramètres étendus se génère identique à avant.

### S2 — Aisance & proportions dans les règles du moteur  ✅ livrée 2026-10-08

> **Livré** : `shared/fit.ts` (`resolveEaseProfile`, `resolveLengthMm`, composition coupe × aisance,
> ampleur de jupe/manche, longueur de manche/corsage), branché dans les 8 règles ; mesures
> `LONGUEUR_JUPE`, `HAUTEUR_TAILLE_SOL`, `LONGUEUR_DEVANT`, `HAUTEUR_BASSIN`, `HAUTEUR_FOURCHE`
> consommées ; `warnings[]` géométriques (`geometry-checks.ts`) ; 36 tests (131 au total dans le
> moteur). Écarts avec le plan : fichiers `ease-profile.ts`/`proportions.ts` fusionnés en `fit.ts` ;
> l'avertissement « AUTRE » est émis par la règle (`IPatternRule.warnings?`) ; toutes les mesures
> du catalogue sont consommées (tableau dans `docs/features/pattern-engine.md`, test anti-mesure inutile).

**But** : que `ease`, `fullness`, `lengths` modifient réellement les contours.

**Tâches**
- `shared/ease-profile.ts` : `resolveEaseProfile(ease)` → `{ bustDeltaMm, waistDeltaMm, hipDeltaMm, armholeDeltaMm }`.
  Se **compose** avec `resolveCutProfile` (la coupe donne la silhouette, l'aisance donne le confort) : pas de double comptage
  (documenter la formule `delta_final = cut.delta + ease.delta`, borne min pour garder les pièces valides).
- `shared/proportions.ts` : `resolveLengthMm(base, pct, [min,max])`.
- Brancher dans `robe`, `jupe`, `veste`, `chemise`, `pantalon`, `costume`, `robe-mariee` (une règle à la fois, via le skill
  `pattern-engine-rule`), en gardant `appliesTo()` inchangé.
- Garde-fous géométriques : polygones fermés, pas d'auto-intersection, largeurs ≥ 0, aire minimale ; `warnings[]`
  (le contrat actuel renvoie toujours `[]` — l'étendre pour que les règles puissent avertir, ce qui supprime le contournement
  dans `generate-pattern-version.use-case.ts` pour `AUTRE`).

**Tests** (un fichier par règle + `ease-profile.test.ts`) : monotonie (AMPLE ≥ CONFORT ≥ AJUSTE en largeur), invariants
(contour fermé, sans point NaN), bornes, composition coupe × aisance, snapshots.
**Acceptation** : couverture ≥ 80 % ; tous les snapshots `CONFORT` identiques à l'existant.

### S3 — L'analyse photo remplit les paramètres étendus  ✅ livrée 2026-10-08

> **Livré** : `GarmentProfile.fit` (ai-service `normalize_fit` + prompt + 3 nouveaux few-shot + bornes
> miroir testées contre `pattern-fit.ts`) ; fusion API **client > photo** clé par clé
> (`mergePatternExtParameters`, traçabilité `parametersJson.inspiration.extKeysFromPhoto`) ; fiche
> « Ajustements déduits de la photo » (étape Inspiration, lecture seule) et curseurs « Suggéré par l'IA —
> modifiable » + *Réinitialiser* (étape Mesures). Test de comportement : une photo ample donne un patron
> plus large qu'une photo ajustée. **Écarts avec le plan** : (1) l'appel IA « texte seul » ne demande pas
> encore les paramètres étendus ; (2) le e2e Playwright n'est pas écrit ; (3) **maquette Stitch non
> consultée** pour ces blocs (styles repris de l'existant) ; (4) `CONFORT` choisi par le client est stocké
> explicitement (pour primer sur une suggestion `AMPLE`).

**But** : les observations influencent enfin la géométrie, de façon validée.

**Contrat ai-service (`GarmentProfile` étendu)** : `ease`, `fullness.skirt`, `fullness.sleeve`, `lengths.*Pct`,
`fabricBehavior` (`FLUIDE | STRUCTURE | RIGIDE | STRETCH`, informatif), chacun accompagné d'un **niveau de certitude**.
- `garment_knowledge.py` : vocabulaires + **repères visuels** (ex. « jupe qui retombe en plis réguliers ⇒ fullness ≈ 2 »),
  exemples few-shot supplémentaires (jupe froncée, robe oversize, tailleur ajusté), règle « si doute ⇒ omettre ».
- `normalize_profile` : bornage (clamp) des nombres, rejet des types invalides, arrondi (pas de 0,25 pour `fullness`).
- Si le modèle renvoie des nombres hors intervalle ⇒ **rejet du champ** (pas de clamp silencieux pour les valeurs aberrantes
  > 2× la borne) + log.

**API**
- `InspirationParametersService.merge` : étendre à `ease/fullness/lengths` (client > photo > IA > défaut) ; enregistrer
  `extKeysFromPhoto` / `extKeysFromAi` dans `parametersJson.inspiration`.
- Appel IA « texte seul » existant : lui demander aussi les paramètres étendus manquants, **avec la même validation**.

**Web**
- Écran de revue **« Ajustements déduits de la photo »** (sous la fiche vêtement) : aisance, ampleur, longueurs avec
  curseurs/boutons, indication « suggéré par l'IA — modifiable », bouton *Réinitialiser*. *(Vérifier l'écran Stitch réel
  via `agy` avant tout JSX ; ajouter la ligne à `docs/mockup-reference.md`.)*
- Les choix du client sont envoyés à l'autosave et **priment**.

**Tests** : pytest (normalisation, bornes, few-shot valides), Jest (fusion, priorité client, rejet hors bornes),
Vitest (composant, autosave), e2e Playwright : photo → fiche → ajustement → génération.
**Acceptation** : une photo de robe ample produit un `ease = AMPLE` validé et un patron plus large qu'une photo de robe ajustée
(test de comportement avec modèle mocké).

### S4 — Blocs de drapé déterministes (lot 1)  ✅ livrée 2026-10-08

> **Livré** : 5 blocs (`blocks/*.ts`), intégrés à jupe / robe / mariée, `DrapeSpec` validé (types partagés,
> PATCH 400, revalidation à la génération), métrage indicatif `metadata.yardage`, avertissements de laize,
> 25 tests de blocs + 6 de validation (catalogue et formules : `docs/features/pattern-engine.md`).
> **Écarts** : pas d'UI de choix ni de sélection IA (S5) ; l'export PDF/SVG de l'API est encore un gabarit,
> donc « les pièces s'exportent sans erreur » n'est vérifié qu'au niveau géométrie ; pas de snapshots SVG
> « golden » (les invariants numériques — aire, fermeture, symétrie, points — les remplacent).

**But** : lever L1 pour les drapés **constructibles à plat**.

**Spécification `DrapeSpec`**

```ts
type DrapeBlock =
  | { kind: 'GATHERED_SKIRT'; fullness: number }          // jupe froncée (rectangle + fronces)
  | { kind: 'PLEATED_SKIRT'; pleats: number; depthMm: number; type: 'KNIFE' | 'BOX' }
  | { kind: 'CIRCLE_SKIRT'; fraction: 0.25 | 0.5 | 1 }    // quart / demi / cercle complet
  | { kind: 'WRAP_FRONT'; overlapMm: number; side: 'LEFT' | 'RIGHT' }
  | { kind: 'COWL_NECK'; depthMm: number }                // col bénitier (biais)
interface DrapeSpec { blocks: DrapeBlock[] }
```

**Formules (exemples à valider par tests numériques)**
- *Jupe froncée* : largeur de coupe = `tourTaille × (fullness)` ; hauteur = longueur ; pièce rectangulaire + repères de fronces.
- *Jupe cercle* : rayon intérieur `r = tourTaille / (2π × fraction)` ; pièce = secteur annulaire (arc échantillonné ≥ 64 points).
- *Plis* : `largeur = tourTaille + Σ(profondeurs de plis)`, marques de plis comme `notches`.
- *Portefeuille* : devant croisé = devant + `overlapMm`, repères de fermeture.
- *Col bénitier* : pièce **taillée dans le biais** (`grainline` à 45°), profondeur paramétrée.

**Tâches**
- `packages/pattern-engine/src/blocks/*.ts` : fonctions pures `computeGatheredSkirt()`, `computeCircleSkirt()`, … renvoyant
  `PatternPieceGeometry[]` ; intégration dans les règles `jupe`, `robe`, `robe-mariee` via `parameters.drape`.
- Remplacement du bloc par défaut uniquement si `drape.blocks` est présent (rétro-compat).
- `warnings[]` : ex. « tissu > 150 cm de large requis pour ce cercle ».
- Calcul de **métrage** indicatif (largeur de tissu 140 cm) exposé dans `metadata`.
- Docs : catalogue des blocs avec schémas dans `docs/features/pattern-engine.md`.

**Tests** : un test par bloc (aire attendue, périmètre, symétrie, fermeture, nombre de points), propriété :
`fullness` ↑ ⇒ largeur ↑ ; non-régression ; snapshot visuel SVG (golden files).
**Acceptation** : pour chaque bloc, les pièces s'exportent (PDF/SVG) sans erreur ; couverture ≥ 80 %.

### S5 — Drapé avancé, mannequin & sélection de bloc par l'IA  ✅ livrée 2026-10-08

> **Livré** : `TRAIN`, `OVERSKIRT`, `DRAPED_BODICE`, `ASYMMETRIC_HEM` (manches ballon/papillon = détails + `fullness.sleeve`) ;
> sélection de blocs par l'IA validée (`drapeBlocks`, ai-service + API, anti-dérive) ; arbre de décision (table de vérité
> testée) ; fiche de moulage (5 sections, bornée) ; UI « Drapé et volumes » ; panneau « À savoir » sur l'aperçu (les
> avertissements moteur n'étaient affichés nulle part jusqu'ici). Critères d'acceptation vérifiés par test : robe de mariée à
> traîne → base + bloc `TRAIN` + fiche ; sari → `MANNEQUIN_ONLY`, aucun bloc, avertissement « moulage requis ».
> **Écarts** : fiche déterministe plutôt que générée par IA ; pas d'ajout de la fiche au PDF (l'export API est un gabarit) ;
> maquette Stitch non consultée pour les nouveaux blocs UI ; `OVERSKIRT`/`TRAIN` sur robe non ajustés à la largeur réelle du
> bloc de jupe (approximation sur l'ourlet dos).

**But** : couvrir les drapés usuels de la mode de cérémonie et décider **quand** renvoyer au mannequin.

**Lot 2 de blocs** : `TRAIN` (traîne : demi-ellipse/ longueur paramétrée), `OVERSKIRT` (surjupe asymétrique), `BALLOON_SLEEVE` /
`BUTTERFLY_SLEEVE` (ampleur de manche via `fullness.sleeve`), `DRAPED_BODICE` (bustier à plis : pièces de base + repères de plis),
`ASYMMETRIC_HEM`.

**Sélection par l'IA (validée)** : le profil photo propose `drapeBlocks: [{kind, params}]`. `normalize_profile` +
`InspirationParametersService` n'acceptent que des `kind` connus avec paramètres **dans les bornes** ; sinon le bloc est écarté
et le drapé retombe en `constructionNotes` (conseil mannequin).

**Stratégie « meilleure approche » (arbre de décision, à documenter et tester)** :

| Situation détectée | Approche retenue |
|--------------------|------------------|
| Vêtement structuré, pas de drapé | Patron à plat complet |
| Drapé **régulier** (fronces, plis, cercle, portefeuille) | Patron à plat **avec bloc de drapé** |
| Base ajustée + drapé libre (traîne, cascade) | Base à plat + **fiche de moulage mannequin** pour la partie libre |
| Drapé libre intégral (sari, lamba, grec) | **Moulage mannequin** ; patron plat limité à la doublure/base ; avertissement explicite |

**Fiche de moulage** (livrable utilisateur) : texte structuré (zones drapées, sens du fil, quantité de tissu estimée, étapes
d'épinglage) généré par l'IA à partir de `constructionNotes` **et validé** (sections obligatoires, longueur bornée) ; affichée
dans l'aperçu/export et ajoutée au PDF.

**Tests** : un par bloc, arbre de décision (table de vérité), rejet de blocs hors bornes, génération de la fiche (modèle mocké).
**Acceptation** : une photo de robe de mariée à traîne produit base + bloc `TRAIN` + fiche mannequin ; une photo de sari produit
l'avertissement « moulage requis » sans pièces trompeuses.

### S6 — Jeu de référence & métriques de fidélité  🟡 outillage livré 2026-10-08

> **Livré** : `apps/ai-service/app/evaluation/` (manifeste validé par `normalize_profile`, provenance + licence
> obligatoires ; métriques `isGarment`, exactitude par champ, F1 par classe, MAE `fit.*`, F1 blocs de drapé,
> taux de rejet par la validation, latence, par catégorie ; seuils `thresholds.json` ; détection de régression
> contre une baseline ; rapport `report.md` + `report.json` ; CLI `python -m app.evaluation`, `make eval.photo`).
> Métriques de patron : `packages/pattern-engine/src/eval/fidelity.ts` (IoU rastérisé + Hausdorff normalisé par
> pièce, taux d'échec moteur, temps ; `make eval.patterns CASES=…`). Doc : `apps/ai-service/ml/data/eval/README.md`.
> **Reste** : les 100–200 photos étiquetées (question ouverte §11 : source/licence), la baseline chiffrée par
> fournisseur (puis relever les seuils), le job CI (le dépôt n'a aucune CI aujourd'hui), le tableau de bord admin.

**But** : savoir si on s'améliore.

- **Golden set** : 100–200 photos libres de droits / fournies par l'atelier (robes, jupes, vestes, pantalons, costumes, mariées,
  drapés, non-vêtements), étiquetées à la main (profil complet + paramètres étendus + construction), stockées hors dépôt
  (MinIO `ml-eval`), manifeste versionné dans `apps/ai-service/ml/data/eval/manifest.jsonl`.
- **Métriques d'analyse** : exactitude par champ (type, coupe, détails…), F1 par classe, taux de rejet `isGarment`
  (faux positifs/négatifs), MAE sur `ease/fullness/lengths`, taux de valeurs rejetées par validation.
- **Métriques de patron** : distance entre le patron généré avec le profil prédit vs. avec le profil étiqueté
  (Hausdorff normalisée / IoU des contours, par pièce), temps de génération, taux d'échec moteur.
- Script `make eval.photo` (rapport Markdown + JSON, seuils) ; **job CI** non bloquant au début puis bloquant sur régression > X %.
- Tableau de bord admin simple (`/admin/ai-settings`) : exactitude par modèle/fournisseur → aide au choix du modèle par défaut.

**Acceptation** : un rapport reproductible ; baseline chiffrée par fournisseur ; seuils documentés.

### S7 — Entraînement du modèle local (vision → profil)

**But** : réduire la dépendance et le coût des modèles externes, en réutilisant les données collectées (`ai_training_samples`).

**Données**
- Export JSONL `db:export:ai-training --confirmed-only` (étiquettes **validées** par les choix finaux du client) + étiquettes
  faibles du modèle externe (pondération plus faible).
- Pipeline de curation : dédoublonnage par hash, filtrage `confidence`, exclusion des `EXCLUDED`, équilibrage des classes,
  split train/val/test **par client** (pas de fuite), jeu S6 **jamais** utilisé à l'entraînement.
- Récupération des images depuis MinIO au moment de l'entraînement (jamais copiées dans le dépôt).

**Modèle (progressif)**
1. *Baseline* : embeddings d'images pré-entraînés (CLIP/SigLIP/DINOv2 en local) + têtes de classification
   (régression logistique / MLP scikit-learn) pour `isGarment`, `garmentType`, `cutType`, `occasion`, `style`, `details.*`,
   `constructionMethod`, `presentation`. Léger, entraînable sans GPU.
2. *Ensuite* (si les métriques S6 le justifient) : fine-tuning léger d'un petit modèle vision (adapter/LoRA).
3. Régression (têtes séparées) pour `ease/fullness/lengths`.

**Intégration (jamais en remplacement aveugle)**
- Nouveau fournisseur `LOCAL_VISION` (catalogue + `ai-service`), chargé comme `measurement_imputer_*.joblib` ; indisponible ⇒ grisé.
- Modes : **pré-filtre** (rejeter les non-vêtements localement, gratuit), **repli** (modèle externe indisponible),
  **principal** seulement si l'exactitude S6 ≥ seuil documenté.
- Rapport d'incertitude : sous seuil de confiance ⇒ appel externe.
- Versionnage des artefacts (`modelVersion`), reproductibilité (graines, `requirements` figés), carte du modèle
  (`docs/features/ai-model-settings.md`).

**Boucle d'amélioration** : ré-entraînement planifié (CRON) quand ≥ N nouveaux échantillons confirmés ; comparaison automatique
à la version courante sur S6 ; promotion manuelle par l'admin.

**Acceptation** : le modèle local atteint ≥ X % d'exactitude sur `isGarment` et `garmentType` sur S6 ; le pré-filtre réduit les
appels externes sur les non-vêtements ; aucune régression des tests.

### S8 — Visualisation 2D/3D, droit à l'oubli, durcissement

- **Aperçu** : superposition photo ↔ patron (2D) ; aperçu mannequin 3D (existant) avec **drapé simulé** léger (déformation par
  fronces/plis des blocs) — purement visuel, étiqueté « indicatif ».
- **RGPD** : mention dans les pages légales ; exclusion automatique des échantillons (`status = EXCLUDED`) et suppression
  des médias à la suppression de compte ; registre de traitement ; durée de conservation ; export des données du client.
- **Performance** : cache d'analyse par (hash, modèle) déjà en place ; mise en file des analyses lourdes ; limites de débit par
  utilisateur ; coûts (compteur de jetons image par fournisseur).
- **Sécurité** : validation stricte de tout JSON d'IA (déjà), SSRF sur les URLs d'image (déjà), taille/format d'image, rate limiting.
- **Observabilité** : métriques (latence, taux de repli, taux de rejet de validation, coût) ; alertes sur taux de fallback.
- **Docs finales** : `patterns.md`, `pattern-engine.md`, `ai-inference.md`, `ai-training-data.md`, `deployment.md`,
  `environment-variables.md`, `handoff.md`, `checklist-implementation.md`, `mockup-reference.md`.

---

## 6. Modèle de données (récapitulatif)

| Table / colonne | Statut | Rôle |
|-----------------|--------|------|
| `inspiration_analyses.profile` | ✅ livré | Cache d'analyse par hash (profil) |
| `ai_training_samples` | ✅ livré | Paires entrée/sortie des modèles externes + étiquette humaine |
| `pattern_projects.inspirationAnalysisJson` | ✅ livré | Observations + profil du projet |
| `pattern_projects.parametersExtJson` | S1 | `ease`, `fullness`, `lengths`, `drape` choisis/validés |
| `ai_model_evaluations` (nouvelle) | S6 | Résultats d'évaluation par modèle/version/jeu |
| `ai_model_artifacts` (nouvelle, optionnelle) | S7 | Versions de modèles locaux, métriques, statut (candidat/actif) |

Toutes les migrations sont **additives** (colonnes nullables / nouvelles tables).

## 7. Contrats à synchroniser (source unique)

- `packages/types` : `PATTERN_DETAIL_OPTIONS` ✅ ; à ajouter : `EASE_LEVELS`, bornes `fullness`/`lengths`, `DRAPE_BLOCK_KINDS`.
- `apps/ai-service/app/garment_knowledge.py` : doit refléter ces constantes (**test anti-dérive** à étendre à chaque ajout).
- `apps/web` : libellés FR dans `consts/` ; test de synchronisation sur les identifiants.
- `packages/pattern-engine` : consomme les types ; aucune dépendance vers `apps/*`.

## 8. Stratégie de tests (transverse)

| Niveau | Outil | Contenu clé |
|--------|-------|-------------|
| Moteur | Vitest | Un test par règle/bloc, invariants géométriques, monotonie, snapshots SVG, rétro-compat |
| API | Jest + Supertest | Fusion client > photo > IA, rejets hors bornes, endpoints, migrations |
| ai-service | pytest | Normalisation, prompts, few-shot valides, anti-dérive des listes, fournisseurs mockés |
| Web | Vitest + Testing Library | Fiche, curseurs d'ajustement, autosave, `?step=`, erreurs/réessai |
| E2E | Playwright | Photo → fiche → ajustements → génération → aperçu → export |
| Qualité IA | `make eval.photo` (S6) | Exactitude par champ, distance de patron, seuils CI |

Seuil de couverture : ≥ 80 % sur les paquets touchés (`pnpm --filter … test:coverage`, `make test.ai`).

## 9. Risques & parades

| Risque | Parade |
|--------|--------|
| Hallucination de nombres par le LLM | Bornes strictes, rejet hors intervalle, valeurs par défaut, priorité client |
| Régression de géométrie existante | `CONFORT` = identique ; snapshots ; paramètres optionnels |
| Pièces de drapé invalides (auto-intersection) | Invariants testés, garde-fous + `warnings[]`, refus de générer plutôt que fausse pièce |
| Fidélité surestimée | Golden set (S6), métriques publiées, libellé « indicatif » |
| Données personnelles (photos) | Consentement, exclusion/suppression, pas de copie d'image, accès restreint |
| Coût des appels vision | Cache hash+modèle, pré-filtre local (S7), réduction à ≈1 000 px, quotas |
| Modèle local biaisé / sur-ajusté | Split par client, jeu S6 isolé, promotion manuelle, repli externe |
| Dérive des listes entre apps | Source unique + tests de synchronisation |
| Dette Stitch (UI non vérifiée) | `agy` obligatoire avant JSX (S3, S5, S8) ; mettre à jour `mockup-reference.md` |

## 10. Définition de « terminé » (chaque session)

1. Maquette Stitch réelle consultée (si UI) ; ligne ajoutée à `docs/mockup-reference.md`.
2. Fiche `docs/features/*.md` / `docs/pages/*.md` mise à jour ; `docs/deployment.md` et
   `docs/environment-variables.md` si variable/infra/migration.
3. Tests écrits dans le même commit ; `pnpm typecheck`, `pnpm lint`, tests et couverture ≥ 80 % verts.
4. Migrations appliquées et documentées ; client Prisma régénéré.
5. `docs/checklist-implementation.md` mis à jour (items terminés → `checklist-archive.md`).
6. **`docs/handoff.md` mis à jour avant de clore** (résumé, diff, tests, prochaines actions).
7. Commit Conventional (`feat(pattern-engine): …`, `feat(ai-service): …`, `feat(web): …`).

## 11. Questions ouvertes (à trancher avant S3/S5)

1. Quelles **catégories de drapés** priorisent l'atelier (robes de cérémonie, traditionnel malgache — lamba…) ? Détermine l'ordre des blocs S4/S5.
2. **Largeur de tissu standard** et chutes à prendre en compte pour le métrage ?
3. Source et licence des **photos du jeu de référence** (S6) ; l'atelier peut-il fournir des pièces étiquetées ?
4. **Consentement** : case à cocher explicite à l'upload, ou mention dans les CGU ? (impact juridique, S8)
5. Seuils d'**exactitude** exigés avant que le modèle local devienne principal (S7).
6. Faut-il une **validation couturière** obligatoire avant export quand `constructionMethod ≠ FLAT_PATTERN` ?

## 12. Ordre recommandé et premier pas

`S1 → S2 → S3` (lever L2), puis `S4 → S5` (lever L1), puis `S6 → S7 → S8`.
**Prochaine action** : démarrer S1 (« Lis docs/phases/phase-5b-fidelite-photo-et-drapes.md et exécute la session S1 »).
