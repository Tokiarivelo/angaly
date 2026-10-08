# Collecte de données d'entraînement (modèle local)

Quel que soit le fournisseur externe choisi (Claude, Gemini, OpenAI…), chaque **nouvelle** analyse de photo
d'inspiration est conservée pour entraîner à terme le modèle local ANGALY.

- **Entrée** : référence de la photo (`imageUrl` vers notre MinIO + hash SHA-256) — l'image n'est jamais copiée.
- **Sortie** : `profile` + `features` renvoyés par le modèle externe (étiquette faible), avec `providerId`,
  `modelVersion`, `confidence`.
- **Étiquette validée** : à la génération du patron, les choix finaux du client (type, occasion, style,
  coupe, détails) sont rattachés à l'échantillon de sa photo → `status = HUMAN_CONFIRMED`.
- Table `ai_training_samples` (unique par `task` + `inputHash`) ; réponses de repli, confiance 0 et réponses
  sans profil ne sont jamais stockées. Best-effort : un échec n'interrompt jamais l'analyse.
- Interrupteur : `AI_TRAINING_COLLECTION_ENABLED=false`.
- Export : `pnpm --filter @angaly/database db:export:ai-training out.jsonl [--confirmed-only]`.

**RGPD** : les photos clients sont des données personnelles. L'information du client (page « Pages légales »)
doit mentionner cet usage avant mise en production ; prévoir l'exclusion (`status = EXCLUDED`) à la
suppression de compte.

**Limite actuelle** : seule la collecte et l'export existent ; aucun script n'entraîne encore un modèle de vision.
