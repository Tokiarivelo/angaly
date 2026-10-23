# Lire une photo d'inspiration → GarmentProfile

Format : celui que renvoie `apps/ai-service` (`normalize_profile`, `garment_knowledge.py`) :

```json
{
  "isGarment": true, "garmentType": "ROBE", "cutType": "PRINCESSE",
  "details": {"manches": "BALLON", "col": "CHALE", "longueur": "SOL", "taille": "NATURELLE", "devant": "MANTEAU_OUVERT", "fermeture": "CORDELIERE"},
  "fit": {"ease": "AJUSTE", "fullness": {"skirt": 2.1, "sleeve": 2.5}, "lengths": {"skirtPct": 100, "sleevePct": 100},
          "fabricBehavior": "STRUCTURE", "fabricColor": "#1a2448", "contrastColor": "#e6dcc2"},
  "drapeBlocks": []
}
```

Exemples réels annotés (31 robes, verdicts) : `apps/ai-service/ml/data/dress_benchmark_opus_analysis.json`,
`ml/data/dress_benchmark_notes.json`, `docs/reviews/dress-benchmark.md`.

## Ordre de lecture (du plus structurant au moins structurant)

1. **Vêtement et construction** : robe ? une ou deux pièces ? drapé libre (`constructionMethod: DRAPING` → aucun bloc) ?
2. **Silhouette** → `cutType` et `fullness.skirt` (mesurés, voir plus bas).
3. **Longueur** → `longueur` (+ `lengths.skirtPct` si entre deux valeurs).
4. **Taille** : couture à la taille, sous la poitrine (`HAUTE`) ou sur les hanches (`BASSE`, basque).
5. **Devant** : d'un tenant, froncé sous la poitrine, croisé, **ouvert sur un plastron** (`MANTEAU_OUVERT`).
6. **Manches** : famille (tableau ci-dessous), puis `fullness.sleeve`, puis `lengths.sleevePct`.
7. **Col / encolure** : `col` si une pièce est visible (montant, rabattu, revers, nœud) ; `decollete` pour la profondeur.
8. **Fermeture / liens** : boutons visibles, ceinture, cordelière.
9. **Tissu et couleurs** : tenue (`FLUIDE` tombe, `STRUCTURE` garde le volume), imprimé, couleurs hex (fond, motif, contraste).

## Manches — arbre de décision

```
la manche dépasse-t-elle le coude ?
├─ non : couvre seulement l'épaule → CAP
│        sinon COURTES ; bouffante ? → fullness.sleeve 1,5 (léger) … 2,5 (énorme), sleevePct ≈ 20–25
└─ oui : volume en haut, avant-bras ajusté → BALLON (gigot), fullness.sleeve 1,5–2,5
         ample sur tout le bras, froncée dans un poignet → EVEQUE
         froncée en haut ET au poignet, gonflée au milieu → LANTERNE
         ajustée puis évasée à partir du coude → CLOCHE
         évasée et flottante dès l'épaule → PAPILLON
         couture diagonale du col sous le bras → RAGLAN ; taillée avec le corps (chauve-souris) → KIMONO
         sinon TROIS_QUARTS (s'arrête avant le poignet) ou LONGUES
```

Erreur historique n° 1 : lire `BALLON` pour une petite manche bouffante → le moteur trace un gigot jusqu'au poignet.
Les plis visibles d'un ballon ne changent pas la famille : ils s'expriment par `fullness.sleeve`.

## Ampleur de la jupe — mesurer, ne pas deviner

`fullness.skirt` = largeur d'ourlet ÷ largeur de taille, **vues de face** (1 = droite, 2 = trapèze net, 3 = très ample, 4 = cercle).

```bash
python3 apps/ai-service/ml/scripts/silhouette_ratio.py photo.jpg   # → {'waist', 'hem', 'ratio', 'waistAt'}
```

- Fiable : photo de face, fond uni (musée, studio), robe entière.
- Corriger × 0,85 pour une taille corsetée (robes avant 1920) : le mannequin 3D a une taille moderne.
- Non fiable (corriger à la main) : traîne étalée au sol (rapport gonflé), vue de trois-quarts ou de profil, photo portée avec
  fond chargé, robe sombre sur fond sombre, manches qui tombent à hauteur d'ourlet.
- Plafond pratique 3,6 ; une jupe froncée en tissu fluide reste ≤ 1,8 (au-delà la 3D fait ballon).

## Couleurs

`fabricColor` = fond dominant du tissu (pas l'ombre, pas le reflet) ; `motifColor` = pois, fleurs, rayures ; `contrastColor` =
plastron, sous-robe ou col contrastant. En 3D, le col prend `contrastColor` sauf s'il y a un plastron (les revers sont alors
dans le tissu de la robe).

## Certitude et honnêteté

- Omettre plutôt qu'inventer (un groupe absent est rempli ensuite par la suggestion IA ou l'atelier).
- `certainty` HIGH/MEDIUM pour chaque champ numérique (sinon l'ai-service l'ignore).
- Une lecture faite par un agent (et non par le fournisseur de vision configuré) se signale à l'utilisateur et se garde hors
  entraînement (`docs/features/ai-model-settings.md`).
