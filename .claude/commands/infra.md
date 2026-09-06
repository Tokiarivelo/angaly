Gère l'infrastructure Docker du projet ANGALY.

Sous-commandes selon l'argument :

**up** — Démarre l'infra de développement (postgres + minio + minio-init + adminer) :

```bash
docker compose up -d
docker compose ps
```

**down** — Arrête et supprime les conteneurs (données conservées dans les volumes) :

```bash
docker compose down
```

**reset** — ⚠️ DESTRUCTIF — Supprime conteneurs ET volumes (perte des données Postgres et MinIO) :

```bash
docker compose down -v
```

Demande confirmation explicite avant d'exécuter.

**logs** — Affiche les logs en temps réel. Si argument supplémentaire, filtre par service :

```bash
docker compose logs -f [service]   # services : postgres, minio, minio-init, adminer
```

**status** — Affiche l'état de tous les conteneurs et leur santé :

```bash
docker compose ps
docker stats --no-stream
```

**shell** — Ouvre un shell dans un conteneur. Demande lequel si non précisé :

```bash
docker compose exec <service> sh
```

Si aucun argument : affiche la liste des sous-commandes et l'état actuel des conteneurs.
