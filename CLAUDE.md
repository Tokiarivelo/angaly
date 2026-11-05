# ANGALY — Claude Code

Les règles du dépôt sont dans `AGENTS.md` (source unique, partagée avec les autres agents) :

@AGENTS.md

## Propre à Claude Code

- Skills : `.claude/skills/` (`start` — à lancer en début de session avec `/start` —, `new-feature`, `new-page-from-stitch`, `pattern-engine-rule`, `pattern-generation`) ;
  slash commands du projet : `.claude/commands/`.
- Stitch : `agy --print "<consigne>"` fonctionne en lecture ; `agy -p --dangerously-skip-permissions` est refusé en
  mode auto. Repli : MCP `stitch` (activé dans `.claude/settings.local.json`).
- Contexte : un lot par session puis `/clear` ; le handoff court (`docs/handoff.md`) fait le pont.
