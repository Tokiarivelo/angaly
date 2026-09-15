# Guide des Variables d'Environnement — ANGALY

Ce document détaille l'ensemble des variables d'environnement du projet ANGALY, la procédure
d'obtention des clés tierces (notamment **Google Maps Platform**), ainsi que les bonnes pratiques
de configuration pour le développement local et la production.

---

## 1. Vue d'ensemble des fichiers `.env`

Le monorepo ANGALY utilise plusieurs fichiers de configuration selon le contexte d'exécution :

| Fichier | Portée | Description |
| --- | --- | --- |
| `.env` (racine) | Monorepo / Docker Compose | Variables partagées (PostgreSQL, MinIO, Redis, ports des services). |
| `apps/web/.env.local` | Frontend (Next.js 15) | Clés publiques (`NEXT_PUBLIC_*`), NextAuth, URLs de l'API. |
| `apps/api/.env` | Backend (NestJS 11) | Clés privées JWT RS256, accès MinIO, secrets applicatifs. |
| `apps/ai-service/.env` | IA (FastAPI / Python) | Configuration d'inférence de patronage (optionnel). |

> ⚠️ **Règle absolue de sécurité** : Ne jamais committer de fichier `.env`, `.env.local` ou `.env.prod`.
> Seuls les fichiers modèles `.env.example` et `.env.local.example` sont suivis dans Git.

---

## 2. Google Maps Platform (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)

La clé API Google Maps est utilisée par l'application web frontend (`apps/web`) pour afficher la
carte interactive de nos ateliers physiques à Madagascar sur la page `/ateliers` ([`AteliersMapPanel.tsx`](file:///home/tokiarivelo/Documents/Projects/angaly/apps/web/src/features/nos-ateliers-liste/ui/AteliersMapPanel.tsx)).

L'intégration utilise la bibliothèque officielle `@vis.gl/react-google-maps` avec des composants
modernes (`AdvancedMarkerElement`, `Pin`, `InfoWindow`) respectant le mandat Zero-Legacy.

Deux méthodes permettent d'obtenir une clé :

### Option A : Clé de Démonstration (Maps Demo Key) — Prototypage rapide sans CB

Pour tester rapidement en local sans configurer de projet Google Cloud ni renseigner de carte bancaire :

1. Rendez-vous sur la page officielle : **[Google Maps Demo Key](https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_git_agentskills_v1)**.
2. Connectez-vous avec n'importe quel compte Google personnel.
3. Acceptez les conditions d'utilisation du projet de démonstration (*Maps Demo Project Terms*).
4. Cliquez sur le bouton pour générer et révéler votre clé de démonstration (commençant par `AIzaSy...`).
5. Copiez la clé et collez-la dans votre fichier `apps/web/.env.local` :
   ```bash
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSyVotreCleDemo..."
   ```

> ℹ️ **Limites de la clé démo** : Quota journalier réinitialisé quotidiennement, réservée au
> développement et au prototypage. Ne pas utiliser pour la production.

---

### Option B : Clé de Production Google Cloud Platform (GCP)

Pour un déploiement en préproduction ou en production :

#### Étape 1 : Créer ou sélectionner un projet GCP
1. Accédez à la [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/overview?utm_campaign=gmp_git_agentskills_v1).
2. Créez un nouveau projet (ex: `angaly-couture`) ou sélectionnez un projet existant.
3. Assurez-vous qu'un compte de facturation est associé au projet.

#### Étape 2 : Activer l'API Maps JavaScript
1. Dans le menu de navigation de gauche, allez dans **API et services** > **Bibliothèque**.
2. Recherchez **Maps JavaScript API**.
3. Cliquez sur **Activer**.

#### Étape 3 : Créer la clé API
1. Allez dans **API et services** > **Identifiants** ([Credentials](https://console.cloud.google.com/google/maps-apis/credentials?utm_campaign=gmp_git_agentskills_v1)).
2. Cliquez sur **+ Créer des identifiants** > **Clé API**.
3. Copiez la clé API générée.

#### Étape 4 : Restreindre la clé API (Impératif de sécurité)
Pour éviter tout vol de quota ou surfacturation, appliquez immédiatement les restrictions suivantes :

1. Cliquez sur le nom de votre clé pour modifier ses paramètres.
2. Sous **Restrictions relatives aux applications** :
   - Sélectionnez **Référents HTTP (sites Web)**.
   - Ajoutez vos domaines autorisés :
     - Pour le développement local : `http://localhost:3000/*`
     - Pour la production : `https://angaly.mg/*` et `https://*.angaly.mg/*`
3. Sous **Restrictions relatives aux API** :
   - Sélectionnez **Restreindre la clé**.
   - Cochez **uniquement** :
     - `Maps JavaScript API`
4. Cliquez sur **Enregistrer**.

Plus de détails sur les restrictions : [Documentation Google Cloud sur les restrictions de clés](https://docs.cloud.google.com/api-keys/docs/add-restrictions-api-keys).

#### Étape 5 : Configuration dans le projet
Dans `apps/web/.env.local` (ou vos variables de build production) :
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSyVotreCleSecreteProduction..."
```

---

### Comportement de l'application selon la présence de la clé

L'application a été conçue pour fonctionner avec ou sans clé API sans provoquer d'erreur :

- **Clé API présente** :
  - La carte Google Maps interactive se charge avec centrage automatique sur Madagascar, pins personnalisés aux couleurs de la Maison (Bleu Nuit `#1e3a5f` et Champagne `#c5a880`) et infobulles complètes.
  - Un sélecteur en haut à droite permet à l'utilisateur de basculer à tout moment entre **Google Maps** et le **Plan Éditorial**.
- **Clé API absente (ou chaîne vide)** :
  - L'application bascule automatiquement sur le **Plan Éditorial Maison** en CSS pur avec dégradé ivoire et coordonnées illustrées des 4 ateliers.
  - Aucun avertissement d'erreur dans la console, compatibilité totale avec les suites de tests unitaires et environnements CI/CD headless.

---

## 3. Clés d'Authentification et JWT

### NextAuth v5 (Frontend)

- `NEXTAUTH_SECRET` : Secret aléatoire de chiffrement des sessions et tokens de session Auth.js.
  - Génération rapide :
    ```bash
    openssl rand -base64 32
    # ou via la commande make :
    make env.generate-secret
    ```
- `NEXTAUTH_URL` : URL publique du frontend.
  - Local : `http://localhost:3000`
  - Production : `https://angaly.mg`

### Paires de Clés JWT RS256 (Backend API)

L'API utilise une cryptographie asymétrique RS256 pour signer et vérifier les jetons d'accès.

- `JWT_PRIVATE_KEY_BASE64` : Clé privée RSA 2048 bits encodée en base64 (utilisée par `apps/api` pour signer les tokens).
- `JWT_PUBLIC_KEY_BASE64` : Clé publique RSA correspondante encodée en base64 (utilisée pour valider les tokens).

**Procédure de génération automatique :**
```bash
make env.generate-keys
```

**Procédure manuelle via OpenSSL :**
```bash
# 1. Générer la clé privée RSA
openssl genrsa -out /tmp/angaly_private.pem 2048

# 2. Extraire la clé publique
openssl rsa -in /tmp/angaly_private.pem -pubout -out /tmp/angaly_public.pem

# 3. Obtenir les versions encodées en base64 sur une seule ligne
base64 -w0 /tmp/angaly_private.pem
base64 -w0 /tmp/angaly_public.pem

# 4. Supprimer les fichiers temporaires
rm -f /tmp/angaly_private.pem /tmp/angaly_public.pem
```

Collez ensuite les chaînes obtenues dans `.env` et `apps/api/.env`.

---

## 4. Stockage d'Objets MinIO (Médias & Photos)

Toutes les photographies (créations, ateliers, collections, blog) sont stockées dans MinIO via le paquet `@angaly/storage`.

| Variable | Exemple local | Usage |
| --- | --- | --- |
| `MINIO_ENDPOINT` | `localhost` | Hôte du service S3 |
| `MINIO_PORT` | `9000` | Port API S3 |
| `MINIO_CONSOLE_PORT` | `9001` | Console d'administration web |
| `MINIO_USE_SSL` | `false` | `true` en production derrière reverse-proxy HTTPS |
| `MINIO_ACCESS_KEY` | `angaly_minio` | Identifiant d'accès au stockage |
| `MINIO_SECRET_KEY` | `changeme-minio-root-password` | Mot de passe de stockage |
| `MINIO_PUBLIC_URL` | `http://localhost:9000` | URL publique résolue par le navigateur pour charger les images |

> En production, `MINIO_PUBLIC_URL` pointe vers le sous-domaine public dédié aux médias (ex: `https://media.angaly.mg`).

---

## 5. Base de Données PostgreSQL & Prisma

| Variable | Exemple local | Usage |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://angaly_user:angaly_pass@localhost:5432/angaly_dev` | Chaîne de connexion Prisma principale |
| `DATABASE_SHADOW_URL` | `postgresql://angaly_user:angaly_pass@localhost:5432/angaly_shadow` | Base shadow pour les migrations Prisma |
| `POSTGRES_USER` | `angaly_user` | Utilisateur conteneur Docker PostgreSQL |
| `POSTGRES_PASSWORD` | `angaly_pass` | Mot de passe conteneur Docker PostgreSQL |
| `POSTGRES_DB` | `angaly_dev` | Nom de la base de données principale |

---

## 6. Communication WhatsApp & Contact Client

| Variable | Exemple | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `261202212345` | Numéro international sans `+` ni espaces, utilisé pour le bouton flottant (FAB) WhatsApp mobile. |

---

## 7. Notifications — canal email (`SMTP_*`)

Utilisé par `apps/api/src/notifications/infrastructure/services/email-channel.adapter.ts`
(module `notifications`, Phase 3) pour l'envoi d'emails transactionnels (rendez-vous confirmé,
statut de commande changé…). Volontairement agnostique du prestataire (spec §84 n'en impose
aucun) — n'importe quel service compatible SMTP fonctionne : SendGrid, Mailgun, AWS SES, un
relai interne, etc.

| Variable | Exemple | Description |
| --- | --- | --- |
| `SMTP_HOST` | `smtp.sendgrid.net` | Hôte SMTP. **Vide = canal email désactivé** (la notification in-app reste créée, aucun email n'est tenté) — pratique en dev local sans relai mail configuré. |
| `SMTP_PORT` | `587` | Port SMTP. |
| `SMTP_SECURE` | `false` | `true` pour une connexion TLS implicite (port 465), `false` pour STARTTLS (port 587). |
| `SMTP_USER` | `apikey` | Identifiant SMTP. Omis si le relai n'exige pas d'authentification. |
| `SMTP_PASSWORD` | `...` | Mot de passe/clé API SMTP. |
| `SMTP_FROM` | `ANGALY <no-reply@angaly.mg>` | Adresse d'expéditeur affichée. |

> Le canal WhatsApp (`whatsapp-channel.adapter.ts`) n'est pas branché — aucun prestataire
> (Twilio, WhatsApp Business API, Meta Cloud API…) n'est confirmé à ce jour, voir
> `docs/features/notifications.md`.

---

## 8. Initialisation pas-à-pas en développement local

Pour configurer l'ensemble de votre environnement local en une seule fois :

```bash
# 1. Copier tous les fichiers .env.example vers leurs cibles locales
make env.init

# 2. Générer les secrets cryptographiques
make env.generate-keys    # Clés JWT RS256
make env.generate-secret  # NEXTAUTH_SECRET

# 3. (Optionnel) Ajouter votre clé Google Maps dans apps/web/.env.local
echo 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSyVotreCleDemo"' >> apps/web/.env.local

# 4. Démarrer l'infrastructure Docker et initialiser la base
make infra.start
make db.migrate
make db.seed

# 5. Démarrer le serveur de développement
make dev
```
