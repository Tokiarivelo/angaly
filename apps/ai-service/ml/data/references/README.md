# Références photo → patron → ajustement 3D

Une fiche JSON par photo étudiée à la main : l'étiquette (`profile`, forme `GarmentProfile`), les paramètres du moteur
qui reproduisent la photo, et les mesures d'ajustement 3D obtenues sur le corps humain du visualiseur.

**À quoi ça sert**
- **S7 (vision → profil)** : étiquettes de départ, au format de `db:export:ai-training` (`label` = `profile`). Une fiche
  n'entre dans l'entraînement qu'une fois l'image envoyée sur MinIO (`imageUrl`), les droits confirmés et l'étiquette
  validée par une couturière (statut `HUMAN_CONFIRMED`). **Jamais** dans le jeu S6 (`data/eval/`).
- **Non-régression** : `tests/test_reference_profiles.py` vérifie que chaque `profile` passe `normalize_profile` sans perte ;
  le visualiseur rejoue l'ajustement de la fiche (`apps/web/.../__tests__/referenceDressFit.test.ts`, patron figé dans
  `__tests__/fixtures/`).

**Champs** : `image` (nom, `sha256`, source, licence — l'image elle-même reste hors dépôt), `observations` (ce qui a été lu
sur la photo), `profile`, `engine` (paramètres, modèle de corps, pièces), `fit3d` (méthode, cibles, valeurs obtenues),
`limits` (ce que le moteur ou la 3D ne rend pas).

| Fiche | Vêtement | Statut |
| --- | --- | --- |
| `robe-pois-maxi.json` | Robe longue à pois, encolure ronde, manches courtes, jupe évasée | Étiquette IA, à valider ; image à droits inconnus |
