Lance l'environnement de développement complet du projet ANGALY.

Étapes :

1. Vérifie que Docker tourne (`docker info`). Si non, demande à l'utilisateur de démarrer Docker.
2. Lance l'infra : `docker compose up -d` (PostgreSQL + MinIO + Adminer). Attends que postgres et minio soient healthy.
3. Vérifie que les dépendances Node sont installées (`pnpm install` si `node_modules` absent).
4. Lance `pnpm dev` en arrière-plan (turbo lance web sur :3000 et api sur :3003).
5. Si `apps/ai-service/.venv` existe, propose de lancer `make dev.ai` en arrière-plan aussi (port :8000) — sinon signale qu'il est absent (`make install.ai` pour le créer) et que Pattern Studio ne pourra pas générer de suggestions IA sans lui.
6. Affiche un résumé : URLs, statut des services, commandes utiles.

URLs :

- Frontend : http://localhost:3000
- API : http://localhost:3003/api
- Swagger : http://localhost:3003/docs
- AI Service : http://localhost:8000/health
- Adminer (DB UI) : http://localhost:8080
- MinIO Console : http://localhost:9001
