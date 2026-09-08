# Feature — `search`

**Statut : ✅ Fait.** Phase 1 — Présence digitale.

## Objet

Recherche globale cross-entités (spec §46/§85) : `Creation`, `Product`, `Collection`,
`BlogPost`, `Atelier`. **Aucun modèle Prisma dédié** — choix de simplicité délibéré : la
recherche s'appuie sur le full-text search natif de PostgreSQL (`to_tsvector`/`to_tsquery`
via une requête Prisma `$queryRaw` typée) plutôt que sur une dépendance externe (Elasticsearch,
Meilisearch, Algolia). Spec §85 anticipe explicitement cette évolution possible ("recherche
globale pouvant évoluer vers un moteur dédié") mais ne l'exige pas dès Phase 1 : ce module
reste remplaçable par un moteur dédié plus tard sans changer son contrat HTTP (le DTO de
résultat groupé ne change pas, seule l'implémentation du repository change).

## Emplacement Clean Architecture

`apps/api/src/search/`

```
domain/
  entities/search-result.entity.ts        → item de résultat normalisé (type, id, slug, title, excerpt, imageUrl)
  repositories/search.repository.ts       → interface ISearchRepository (zéro import Prisma)
  value-objects/search-query.vo.ts        → normalise/valide la chaîne de recherche (longueur min, trim)
application/
  use-cases/
    global-search.use-case.ts             → interroge les 5 entités en parallèle, regroupe par type, limite par type
  dtos/
    search-results-response.dto.ts
infrastructure/
  repositories/prisma-search.repository.ts → $queryRaw Prisma (to_tsvector/plainto_tsquery) par entité
  mappers/search-result.mapper.ts          → ligne brute Prisma → SearchResult
presentation/
  controllers/search.controller.ts
__tests__/
  unit/global-search.use-case.spec.ts
  integration/search.controller.spec.ts
```

## Modèles Prisma

Aucun modèle propre à ce module. Requêtes en lecture seule (raw SQL full-text) sur les
champs texte de `Creation` (`name`, `description`), `Product` (`name`, `description`),
`Collection` (`name`, `description`, `story`), `BlogPost` (`title`, `excerpt`, `content`),
`Atelier` (`name`, `city`, `address`).

## Cas d'usage clés

- Recherche globale : une chaîne de requête interroge les cinq entités en parallèle
  (`Promise.all`), résultats regroupés par type (spec §46 "résultats regroupés"), chaque
  groupe limité (ex. 5 résultats les plus pertinents) avec un lien "voir tous les résultats"
  côté frontend si le nombre réel dépasse la limite
- Exclusion des entités non publiques des résultats (ex. `BlogPost.publishedAt` non nul et
  passé, `Collection.publishedAt` idem) — jamais un contenu brouillon dans les résultats
  publics

## Endpoints exposés

| Méthode | Route | Use-case | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/search?q=` | `global-search` | Public |

## Points d'intégration

- **`creations`/`products`/`collections`/`blog`/`ateliers`** : ce module lit directement
  leurs tables Prisma en lecture seule via raw SQL ; il ne duplique aucune logique métier de
  filtrage/disponibilité déjà portée par ces modules (une création non disponible reste
  cependant indexable — seule la visibilité éditoriale, ex. `publishedAt`, est filtrée ici).
- **`media`** : les `imageUrl` de chaque résultat regroupé proviennent de la première
  relation `Media` déjà chargée par l'entité source, jamais d'un nouvel appel réseau.
- **Pages consommatrices** : `navigation-mobile` (barre de recherche globale), et le futur
  champ de recherche du header desktop.

## Points d'attention

`$queryRaw` doit rester strictement paramétré (Prisma `Prisma.sql`/tagged template, jamais
de concaténation de chaîne) pour éviter toute injection SQL — voir spec §75 (validation des
entrées). Si le volume de contenu croît significativement (au-delà de quelques milliers de
lignes par table), réévaluer le choix full-text Postgres au profit d'un moteur dédié
(Meilisearch) : ce module est conçu pour être remplacé sans impact sur son contrat HTTP.

`SearchResultDto`/`SearchResultsResponseDto` n'existaient jusqu'ici que côté NestJS
(`apps/api/src/search/application/dtos/`) — jamais partagés via `@angaly/types` (règle
absolue #2). Ajoutés à `packages/types/src/index.ts` par `docs/pages/navigation-mobile.md`,
le premier consommateur frontend réel de ce module.

## Vérification

- [x] `global-search` testé (résultats groupés par type, exclusion du contenu non publié,
      chaîne vide/trop courte rejetée)
- [x] `search.controller.spec.ts` couvre les codes 200/400 (`q` manquant, requête trop courte)
- [x] Toutes les requêtes `$queryRaw` sont paramétrées via `Prisma.sql` (interpolation
      `${...}`, jamais de concaténation) — vérifié par relecture des 5 requêtes ET par un
      test dédié qui envoie une chaîne porteuse d'une tentative d'injection
      (`"robe'; DROP TABLE creations; --"`) et vérifie qu'elle n'apparaît jamais dans le
      texte SQL envoyé (seulement dans les `values` paramétrées)
- [x] Testé manuellement de bout en bout contre Postgres réel : recherche cross-entités
      (`creations`/`blog_posts`/`ateliers`) avec classement par pertinence, exclusion d'un
      article de blog non publié confirmée
- [x] `docs/checklist-implementation.md` : `search` passé à ✅

## Bug trouvé et corrigé pendant la vérification manuelle

`LEFT(text, ${EXCERPT_MAX_LENGTH})` échouait en base réelle
(`function left(text, bigint) does not exist`) alors que les tests unitaires (mock
`$queryRaw`) ne pouvaient pas le détecter : Postgres n'a pas de surcharge
`LEFT(text, bigint)`, et Prisma envoie les paramètres numériques interpolés comme `bigint`
par défaut. Corrigé en castant explicitement chaque longueur/limite interpolée
(`${EXCERPT_MAX_LENGTH}::integer`, `${limit}::integer}`) dans les 5 requêtes — un bon
rappel que `$queryRaw` mérite toujours un test contre une vraie base, pas seulement des
mocks, avant d'être considéré vérifié.
