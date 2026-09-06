Lance le lint et le formatage sur le projet ANGALY.

Si l'argument est "fix" : corrige automatiquement les erreurs.
Sinon : lint en mode vérification seulement.

**Vérification (Node)** :

```bash
pnpm lint
pnpm format:check
pnpm typecheck
```

**Vérification (apps/ai-service, Python)** :

```bash
cd apps/ai-service && .venv/bin/ruff check . && .venv/bin/mypy app
```

**Correction automatique** :

```bash
pnpm lint:fix
pnpm format
cd apps/ai-service && .venv/bin/ruff check --fix .
```

Après le lint :

- Affiche le nombre d'erreurs et avertissements par app/package
- Pour chaque erreur TypeScript, montre le fichier et la ligne
- Propose des corrections pour les erreurs courantes
