# =============================================================================
# ANGALY — Makefile
# =============================================================================
# Usage: make <target>
# Run `make help` to see all available targets.
#
# Requirements:
#   - make, Node.js >= 20, pnpm >= 9 (npm install -g pnpm@9)
#   - Docker >= 26 + Docker Compose v2
#   - Python >= 3.12 (apps/ai-service)
#   - openssl (for key generation)
# =============================================================================

SHELL := /bin/bash
.DEFAULT_GOAL := help

RESET   := \033[0m
BOLD    := \033[1m
GREEN   := \033[0;32m
YELLOW  := \033[0;33m
CYAN    := \033[0;36m
RED     := \033[0;31m

PNPM                := pnpm
DOCKER_COMPOSE      := docker compose
DOCKER_COMPOSE_PROD := docker compose -f docker-compose.prod.yml
DOCKER_COMPOSE_CADDY:= docker compose -f docker-compose.yml -f docker-compose.caddy.yml
ENV_FILE            := .env
ENV_EXAMPLE         := .env.example
WEB_ENV_FILE        := apps/web/.env.local
API_ENV_FILE        := apps/api/.env

# =============================================================================
# ── HELP ─────────────────────────────────────────────────────────────────────
# =============================================================================

.PHONY: help
help: ## Show this help message
	@echo ""
	@echo "$(BOLD)$(CYAN)ANGALY — Available commands$(RESET)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z0-9_\-\.]+:.*?##/ { printf "  $(GREEN)%-28s$(RESET) %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""
	@echo "  $(YELLOW)Tip:$(RESET) Start a fresh local dev environment with: $(BOLD)make setup$(RESET)"
	@echo ""

# =============================================================================
# ── SETUP & INSTALLATION ─────────────────────────────────────────────────────
# =============================================================================

.PHONY: setup
setup: ## 🚀 Complete first-time setup (install + env + infra + db)
	@echo "$(BOLD)$(CYAN)🚀 Setting up ANGALY...$(RESET)"
	@$(MAKE) install
	@$(MAKE) build.types
	@$(MAKE) env.init
	@$(MAKE) infra.start
	@echo "$(YELLOW)⏳ Waiting for PostgreSQL to be ready...$(RESET)"
	@sleep 5
	@$(MAKE) db.migrate
	@$(MAKE) db.seed
	@echo ""
	@echo "$(GREEN)✅ Setup complete!$(RESET)"
	@echo "  Configure secrets first: make env.generate-keys && make env.generate-secret"
	@echo "  Then start the app with: $(BOLD)make dev$(RESET)"
	@echo "  Web:         http://localhost:3000"
	@echo "  API:         http://localhost:3003/docs"
	@echo "  AI Service:  http://localhost:8000/health"
	@echo "  MinIO:       http://localhost:9001"

.PHONY: install
install: ## 📦 Install all Node dependencies (pnpm install --frozen-lockfile)
	@echo "$(CYAN)📦 Installing dependencies...$(RESET)"
	$(PNPM) install --frozen-lockfile

.PHONY: install.ai
install.ai: ## 🐍 Create the ai-service virtualenv and install its dependencies
	@echo "$(CYAN)🐍 Installing apps/ai-service dependencies...$(RESET)"
	cd apps/ai-service && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
	@echo "$(GREEN)✅ ai-service ready — activate with: source apps/ai-service/.venv/bin/activate$(RESET)"

.PHONY: env.init
env.init: ## 📋 Create .env files from .env.example (root + apps)
	@if [ -f "$(ENV_FILE)" ]; then echo "$(YELLOW)⚠️  .env already exists, skipping.$(RESET)"; \
	else cp $(ENV_EXAMPLE) $(ENV_FILE); echo "$(GREEN)✅ .env created$(RESET)"; fi
	@if [ -f "$(WEB_ENV_FILE)" ]; then echo "$(YELLOW)⚠️  $(WEB_ENV_FILE) already exists, skipping.$(RESET)"; \
	else cp apps/web/.env.local.example $(WEB_ENV_FILE); echo "$(GREEN)✅ $(WEB_ENV_FILE) created$(RESET)"; fi
	@if [ -f "$(API_ENV_FILE)" ]; then echo "$(YELLOW)⚠️  $(API_ENV_FILE) already exists, skipping.$(RESET)"; \
	else cp apps/api/.env.example $(API_ENV_FILE); echo "$(GREEN)✅ $(API_ENV_FILE) created$(RESET)"; fi
	@echo "$(YELLOW)⚠️  Fill in the values, then run:$(RESET)"
	@echo "  make env.generate-keys    # JWT RS256 keys → .env + apps/api/.env"
	@echo "  make env.generate-secret  # NEXTAUTH_SECRET → apps/web/.env.local"

.PHONY: env.generate-keys
env.generate-keys: ## 🔑 Generate JWT RS256 keys and write them to .env + apps/api/.env
	@echo "$(CYAN)🔑 Generating JWT RS256 key pair...$(RESET)"
	@openssl genrsa -out /tmp/angaly_private.pem 2048 2>/dev/null
	@openssl rsa -in /tmp/angaly_private.pem -pubout -out /tmp/angaly_public.pem 2>/dev/null
	@PRIVATE_B64=$$(base64 -w0 /tmp/angaly_private.pem); \
	 PUBLIC_B64=$$(base64 -w0 /tmp/angaly_public.pem); \
	 for f in $(ENV_FILE) $(API_ENV_FILE); do \
	   sed -i "s|JWT_PRIVATE_KEY_BASE64=\"...\"|JWT_PRIVATE_KEY_BASE64=\"$$PRIVATE_B64\"|" $$f; \
	   sed -i "s|JWT_PUBLIC_KEY_BASE64=\"...\"|JWT_PUBLIC_KEY_BASE64=\"$$PUBLIC_B64\"|" $$f; \
	 done
	@rm -f /tmp/angaly_private.pem /tmp/angaly_public.pem
	@echo "$(GREEN)✅ JWT RS256 keys generated$(RESET)"

.PHONY: env.generate-secret
env.generate-secret: ## 🔑 Generate NEXTAUTH_SECRET for apps/web/.env.local
	@echo "$(CYAN)🔑 Generating NEXTAUTH_SECRET...$(RESET)"
	@SECRET=$$(openssl rand -base64 32); \
	 sed -i "s|NEXTAUTH_SECRET=\"changeme-generate-with-openssl-rand-base64-32\"|NEXTAUTH_SECRET=\"$$SECRET\"|" $(WEB_ENV_FILE)
	@echo "$(GREEN)✅ NEXTAUTH_SECRET generated and saved to $(WEB_ENV_FILE)$(RESET)"

# =============================================================================
# ── DEVELOPMENT ──────────────────────────────────────────────────────────────
# =============================================================================

.PHONY: dev
dev: ## 🔥 Start web + api in development mode
	@echo "$(CYAN)🔥 Starting development servers...$(RESET)"
	@echo "  Web:  http://localhost:3000"
	@echo "  API:  http://localhost:3003/docs"
	$(PNPM) dev

.PHONY: dev.web
dev.web: ## 🌐 Start only the Next.js frontend (port 3000)
	$(PNPM) --filter @angaly/web dev

.PHONY: dev.api
dev.api: ## ⚙️  Start only the NestJS backend (port 3003)
	$(PNPM) --filter @angaly/api dev

.PHONY: dev.ai
dev.ai: ## 🤖 Start only the AI service (port 8000) — requires make install.ai first
	cd apps/ai-service && .venv/bin/uvicorn app.main:app --reload --port 8000

# =============================================================================
# ── BUILD ────────────────────────────────────────────────────────────────────
# =============================================================================

.PHONY: build.types
build.types: ## ⚙️  Build @angaly/types to CommonJS (run once after install, before dev)
	$(PNPM) --filter @angaly/types build
	@echo "$(GREEN)✅ @angaly/types built$(RESET)"

.PHONY: build
build: ## 🏗️  Build all apps and packages (uses Turborepo cache)
	$(PNPM) turbo run build

.PHONY: clean
clean: ## 🧹 Clean all build artifacts and caches
	$(PNPM) turbo run clean
	rm -rf node_modules apps/web/.next apps/web/node_modules apps/web/coverage
	rm -rf apps/api/dist apps/api/node_modules apps/api/coverage
	rm -rf packages/*/node_modules packages/*/dist .turbo
	rm -rf apps/ai-service/.venv apps/ai-service/.pytest_cache apps/ai-service/htmlcov
	@echo "$(GREEN)✅ Cleaned successfully$(RESET)"

# =============================================================================
# ── INFRASTRUCTURE (DOCKER) ──────────────────────────────────────────────────
# =============================================================================

.PHONY: infra.start
infra.start: ## 🐳 Start infrastructure services (PostgreSQL + MinIO + Adminer)
	$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)✅ Infrastructure running:$(RESET)"
	@echo "  PostgreSQL: localhost:5432"
	@echo "  MinIO:      http://localhost:9001 (console) / :9000 (S3 API)"
	@echo "  Adminer:    http://localhost:8080"

.PHONY: infra.stop
infra.stop: ## 🛑 Stop infrastructure services
	$(DOCKER_COMPOSE) stop

.PHONY: infra.down
infra.down: ## 🗑️  Stop and remove infrastructure containers (data preserved)
	$(DOCKER_COMPOSE) down

.PHONY: infra.down.volumes
infra.down.volumes: ## ⚠️  Stop and remove containers + ALL DATA (irreversible!)
	@echo "$(RED)⚠️  This will DELETE all local database + MinIO data!$(RESET)"
	@read -p "Are you sure? (yes/no): " confirm && [ "$$confirm" = "yes" ]
	$(DOCKER_COMPOSE) down -v

.PHONY: infra.logs
infra.logs: ## 📋 Follow infrastructure service logs
	$(DOCKER_COMPOSE) logs -f

.PHONY: infra.ps
infra.ps: ## 📊 Show infrastructure service status
	$(DOCKER_COMPOSE) ps

# =============================================================================
# ── DATABASE ─────────────────────────────────────────────────────────────────
# =============================================================================

.PHONY: db.migrate
db.migrate: ## 🗄️  Run pending database migrations (development)
	$(PNPM) --filter @angaly/database db:migrate

.PHONY: db.migrate.prod
db.migrate.prod: ## 🗄️  Deploy migrations to production (no prompts)
	$(PNPM) --filter @angaly/database db:migrate:prod

.PHONY: db.seed
db.seed: ## 🌱 Seed the database with foundation data
	$(PNPM) --filter @angaly/database db:seed

.PHONY: db.reset
db.reset: ## ⚠️  Reset database: drop all tables, re-migrate and re-seed
	@echo "$(RED)⚠️  This will RESET the database!$(RESET)"
	@read -p "Are you sure? (yes/no): " confirm && [ "$$confirm" = "yes" ]
	$(PNPM) --filter @angaly/database db:reset
	@$(MAKE) db.seed

.PHONY: db.studio
db.studio: ## 🎨 Open Prisma Studio (visual database editor)
	$(PNPM) --filter @angaly/database db:studio

.PHONY: db.generate
db.generate: ## ⚙️  Regenerate Prisma Client (after schema changes)
	$(PNPM) --filter @angaly/database db:generate

# =============================================================================
# ── TESTING ──────────────────────────────────────────────────────────────────
# =============================================================================

.PHONY: test
test: ## 🧪 Run all Node tests (web + api + packages)
	$(PNPM) turbo run test

.PHONY: test.coverage
test.coverage: ## 📊 Run all Node tests with coverage (80% minimum)
	$(PNPM) turbo run test:coverage

.PHONY: test.web
test.web: ## 🌐 Run frontend tests (Vitest)
	$(PNPM) --filter @angaly/web test

.PHONY: test.api
test.api: ## ⚙️  Run backend tests (Jest)
	$(PNPM) --filter @angaly/api test

.PHONY: test.ai
test.ai: ## 🤖 Run ai-service tests (pytest) — requires make install.ai first
	cd apps/ai-service && .venv/bin/pytest

.PHONY: test.e2e
test.e2e: ## 🎭 Run frontend E2E tests (Playwright) — requires api + db running
	$(PNPM) --filter @angaly/web test:e2e

.PHONY: test.e2e.install
test.e2e.install: ## 📦 Download the Playwright Chromium browser (run once)
	$(PNPM) --filter @angaly/web exec playwright install chromium

# =============================================================================
# ── CODE QUALITY ─────────────────────────────────────────────────────────────
# =============================================================================

.PHONY: lint
lint: ## 🔍 Run ESLint on all Node packages (no auto-fix)
	$(PNPM) turbo run lint

.PHONY: lint.fix
lint.fix: ## 🔧 Run ESLint with auto-fix on all Node packages
	$(PNPM) turbo run lint:fix

.PHONY: format
format: ## 💄 Format all files with Prettier
	$(PNPM) format

.PHONY: typecheck
typecheck: ## 🔠 Run TypeScript type-check on all packages
	$(PNPM) turbo run typecheck

.PHONY: check
check: ## ✅ Run all checks: lint + typecheck + format check + tests
	@$(MAKE) lint
	@$(MAKE) typecheck
	@$(PNPM) format:check
	@$(MAKE) test
	@echo "$(GREEN)✅ All checks passed!$(RESET)"

# =============================================================================
# ── LOCAL HTTPS (CADDY, optional) ────────────────────────────────────────────
# =============================================================================

LOCAL_DOMAIN ?= angaly.local

.PHONY: caddy.hosts
caddy.hosts: ## 📝 Add angaly.local to /etc/hosts (requires sudo)
	@if grep -q "$(LOCAL_DOMAIN)" /etc/hosts 2>/dev/null; then \
	    echo "$(YELLOW)$(LOCAL_DOMAIN) already in /etc/hosts$(RESET)"; \
	else echo "127.0.0.1  $(LOCAL_DOMAIN)" | sudo tee -a /etc/hosts > /dev/null; fi

.PHONY: caddy.start
caddy.start: ## 🟢 Start the local HTTPS proxy (Caddy)
	$(DOCKER_COMPOSE_CADDY) up -d
	@echo "$(GREEN)✅ Caddy listening on https://$(LOCAL_DOMAIN)$(RESET)"

.PHONY: caddy.stop
caddy.stop: ## 🔴 Stop the local HTTPS proxy
	$(DOCKER_COMPOSE_CADDY) down

# =============================================================================
# ── PRODUCTION DEPLOYMENT ────────────────────────────────────────────────────
# =============================================================================

.PHONY: prod.build
prod.build: ## 🏗️  Build production Docker images (web, api, ai-service)
	$(DOCKER_COMPOSE_PROD) build --no-cache

.PHONY: prod.start
prod.start: ## 🚀 Start all production services (requires .env.prod)
	$(DOCKER_COMPOSE_PROD) --env-file .env.prod up -d

.PHONY: prod.stop
prod.stop: ## 🛑 Stop production services
	$(DOCKER_COMPOSE_PROD) stop

.PHONY: prod.deploy
prod.deploy: ## 🚢 Full production deployment (build + migrate + start)
	@$(MAKE) prod.build
	@$(MAKE) db.migrate.prod
	@$(MAKE) prod.start
	@echo "$(GREEN)✅ Deployment complete!$(RESET)"

.PHONY: prod.logs
prod.logs: ## 📋 Follow production service logs
	$(DOCKER_COMPOSE_PROD) logs -f

.PHONY: prod.ps
prod.ps: ## 📊 Show production service status
	$(DOCKER_COMPOSE_PROD) ps

.PHONY: prod.health
prod.health: ## 🏥 Check health status of all production services
	$(DOCKER_COMPOSE_PROD) ps
	@docker exec angaly_api wget -qO- http://localhost:3003/api/health 2>/dev/null || echo "$(RED)API not responding$(RESET)"

.PHONY: prod.backup
prod.backup: ## 💾 Backup PostgreSQL to backups/angaly_<timestamp>.sql.gz
	@mkdir -p backups
	@TIMESTAMP=$$(date +%Y%m%d_%H%M%S); \
	 FILE="backups/angaly_$${TIMESTAMP}.sql.gz"; \
	 docker exec angaly_postgres pg_dump -U "$${POSTGRES_USER:-angaly_user}" "$${POSTGRES_DB:-angaly_dev}" | gzip > "$$FILE"; \
	 echo "$(GREEN)✅ Backup saved: $$FILE$(RESET)"

.PHONY: prod.restore
prod.restore: ## 📤 Restore PostgreSQL: make prod.restore FILE=backups/angaly_xxx.sql.gz
	@if [ -z "$(FILE)" ]; then echo "$(RED)Error: specify FILE=backups/angaly_xxx.sql.gz$(RESET)"; exit 1; fi
	@echo "$(RED)⚠️  This will REPLACE the production database!$(RESET)"
	@read -p "Are you sure? (yes/no): " confirm && [ "$$confirm" = "yes" ]
	@gunzip -c $(FILE) | docker exec -i angaly_postgres psql -U "$${POSTGRES_USER:-angaly_user}" "$${POSTGRES_DB:-angaly_dev}"

# =============================================================================
# ── SSL / TLS ─────────────────────────────────────────────────────────────────
# =============================================================================

DOMAIN ?= angaly.mg
EMAIL  ?= admin@angaly.mg

.PHONY: ssl.obtain
ssl.obtain: ## 🔒 Obtain Let's Encrypt SSL certificate (requires public domain + port 80 open)
	@mkdir -p docker/ssl
	docker run --rm -v $(PWD)/docker/ssl:/etc/letsencrypt/live/$(DOMAIN) -p 80:80 \
	  certbot/certbot certonly --standalone -d $(DOMAIN) --email $(EMAIL) --agree-tos --non-interactive
	@echo "$(GREEN)✅ Certificates saved to docker/ssl/$(RESET)"

.PHONY: ssl.self-signed
ssl.self-signed: ## 🔒 Generate a self-signed certificate for staging/testing
	@mkdir -p docker/ssl
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
	    -keyout docker/ssl/privkey.pem -out docker/ssl/fullchain.pem \
	    -subj "/CN=$(DOMAIN)/O=ANGALY/C=MG" 2>/dev/null
	@echo "$(GREEN)✅ Self-signed cert saved to docker/ssl/$(RESET)"

# =============================================================================
# ── UTILITIES ────────────────────────────────────────────────────────────────
# =============================================================================

.PHONY: docs
docs: ## 📖 Open Swagger API documentation (requires dev server running)
	@xdg-open http://localhost:3003/docs 2>/dev/null || open http://localhost:3003/docs 2>/dev/null || \
	  echo "$(YELLOW)Please open manually: http://localhost:3003/docs$(RESET)"

.PHONY: studio
studio: db.studio ## 🎨 Alias for db.studio

.PHONY: git.hooks
git.hooks: ## 🪝 Install Husky git hooks (pre-commit, commit-msg, pre-push)
	$(PNPM) prepare

.PHONY: info
info: ## ℹ️  Show environment information
	@echo "  Node.js: $$(node --version 2>/dev/null || echo 'not found')"
	@echo "  pnpm:    $$(pnpm --version 2>/dev/null || echo 'not found')"
	@echo "  Python:  $$(python3 --version 2>/dev/null || echo 'not found')"
	@echo "  Docker:  $$(docker --version 2>/dev/null || echo 'not found')"
	@echo "  .env:    $$([ -f .env ] && echo 'exists ✅' || echo 'missing ⚠️')"

.PRECIOUS: .env
