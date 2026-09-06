# Déploiement Production — ANGALY

> **Règle** : toute décision ou changement touchant le déploiement, Docker, une variable
> d'environnement, un port, ou la procédure de lancement doit être répercuté ici (ou dans
> `docs/development.md`) dans le même changement — voir `.cursor/rules/006-phase-workflow.mdc`.

## Architecture de déploiement

```
Internet
   │
   ▼
[Nginx :80/:443]            ← TLS termination, gzip (docker/nginx/)
   │      │        │
   ▼      ▼        ▼
[Web:3000] [API:3001] [MinIO console/API — réseau interne uniquement, jamais public]
              │
      ┌───────┴────────┐
      ▼                ▼
[PostgreSQL:5432]  [ai-service:8000]   ← Réseau interne Docker uniquement
```

- `apps/ai-service` n'est **jamais** exposé publiquement — seul `apps/api` lui parle,
  sur le réseau Docker interne (voir `docker-compose.prod.yml`).
- MinIO : le **port S3** reste interne ; les URLs d'images publiques passent soit par un
  sous-domaine MinIO dédié derrière Nginx (à configurer selon l'hébergement), soit par un
  CDN devant MinIO. Ne jamais exposer la console d'administration MinIO (`:9001`) publiquement.

## Prérequis serveur

- Ubuntu 22.04+ ou Debian 12+
- Docker ≥ 26 + Docker Compose v2
- 2 vCPU / 4 GB RAM minimum (l'ai-service, même en mode placeholder, bénéficie de plus de RAM une fois un modèle chargé)
- Ports 80/443 ouverts en entrée
- Nom de domaine DNS pointant vers l'IP du serveur

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
docker --version
docker compose version
```

## Premier déploiement

### 1. Cloner le dépôt

```bash
git clone <repo-url> /opt/angaly
cd /opt/angaly
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env.prod
nano .env.prod
```

### 3. Générer les secrets

```bash
# Clés JWT RS256
openssl genrsa -out /tmp/angaly_private.pem 2048
openssl rsa -in /tmp/angaly_private.pem -pubout -out /tmp/angaly_public.pem
echo "JWT_PRIVATE_KEY_BASE64=$(base64 -w0 /tmp/angaly_private.pem)"
echo "JWT_PUBLIC_KEY_BASE64=$(base64 -w0 /tmp/angaly_public.pem)"
rm -f /tmp/angaly_private.pem /tmp/angaly_public.pem

# NEXTAUTH_SECRET
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"

# MinIO root credentials — generate strong values, never reuse the dev defaults
echo "MINIO_ROOT_PASSWORD=$(openssl rand -hex 32)"
```

### 4. Certificats SSL

```bash
make ssl.obtain DOMAIN=angaly.mg EMAIL=admin@angaly.mg   # Let's Encrypt (domaine public requis)
# ou, pour un environnement de test :
make ssl.self-signed DOMAIN=angaly.mg
```

Place les certificats dans `docker/ssl/` — référencés par `docker/nginx/conf.d/angaly.conf`
(`ssl_certificate`/`ssl_certificate_key`, à ajuster si un chemin différent est utilisé).

### 5. Build et déploiement

```bash
make prod.deploy
# = prod.build (images web/api/ai-service) + db.migrate.prod + prod.start
```

### 6. Vérification

```bash
make prod.health
curl https://angaly.mg/api/health
curl https://angaly.mg  # ou depuis le réseau interne : curl http://ai-service:8000/health
```

## Variables d'environnement requises en production

Voir `.env.example` pour la liste complète et les commentaires. Au minimum, valider avant
`prod.deploy` :

```
DATABASE_URL, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
JWT_PRIVATE_KEY_BASE64, JWT_PUBLIC_KEY_BASE64
NEXTAUTH_URL, NEXTAUTH_SECRET
NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WS_URL, API_CORS_ORIGINS
MINIO_ROOT_USER, MINIO_ROOT_PASSWORD, MINIO_PUBLIC_URL
AI_SERVICE_URL (interne, ex. http://ai-service:8000)
```

## Sauvegardes

```bash
make prod.backup                              # PostgreSQL → backups/angaly_<timestamp>.sql.gz
make prod.restore FILE=backups/angaly_xxx.sql.gz
```

**MinIO** : sauvegarder le volume `minio_data` séparément (ex. `mc mirror` vers un bucket
distant, ou snapshot du volume Docker) — non couvert par `make prod.backup`, qui ne
sauvegarde que PostgreSQL. À documenter précisément dès que la stratégie de sauvegarde
médias est choisie (dépend de l'hébergeur final).

## Mise à jour

```bash
make prod.build
make db.migrate.prod
docker compose -f docker-compose.prod.yml up -d --no-deps api web ai-service
```

## Statut Phase 0

- [x] Topologie définie (Nginx + web + api + ai-service + postgres + minio)
- [x] `docker-compose.prod.yml` et Dockerfiles multi-stage pour les 3 apps
- [ ] Certificats SSL réels — à obtenir au premier déploiement (`make ssl.obtain`)
- [ ] Stratégie de sauvegarde MinIO — à définir selon l'hébergeur choisi
- [ ] Monitoring/alerting — hors périmètre Phase 0, à ajouter avec `docs/phases/`
      pertinente une fois le besoin confirmé
