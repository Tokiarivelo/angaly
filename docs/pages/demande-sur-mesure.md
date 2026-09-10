# Page — `demande-sur-mesure`

**Statut : ✅ Fait.** Phase 2 — Conversion. Vérifiée de bout en bout contre l'API/Postgres/
MinIO réels (pas seulement MSW) — voir "Points d'attention" pour les déviations et deux bugs
trouvés/corrigés en cours de route (un dans cette page, un dans l'infra partagée `apiClient`).

## Objet

Formulaire d'intake d'une demande de création sur mesure (spec §16), volontairement conçu
comme un mini-wizard à 3 étapes (Votre projet / Vos coordonnées / Inspiration & message) plus
un écran de confirmation, pour rester fidèle au principe "le moins de friction possible"
(spec §98, `docs/phases/phase-2-conversion.md`). Traité avec le même style de documentation
qu'un flux à étapes (voir `docs/pages/pattern-studio-wizard.md`), bien que le wizard ici soit
volontairement plus léger (3 étapes contre 7).

## Route(s)

`apps/web/src/app/(client)/sur-mesure/demande/page.tsx` → `/sur-mesure/demande`

Client Component dès la racine (état de wizard multi-étapes, pas de bénéfice SSR) — voir
`docs/pages/pattern-studio-wizard.md` pour la justification identique.

## Référence maquette

- Prompt Stitch : `stitch-prompts/12-demande-sur-mesure-formulaire.md`
- Écrans Stitch : **ANGALY — Demande sur Mesure (Étape 1/2/3) + Demande Envoyée**
- Section spécification : §16 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/demande-sur-mesure/
  ui/
    DemandeSurMesureWizard.tsx  → shell : header minimal, barre de progression, switch d'étape
    WizardProgressBar.tsx       → 3 segments navy/warm-ivory + libellés "01 Projet/02 Coordonnées/03 Détails"
    ChipOption.tsx              → bouton chip réutilisé (garmentType/occasion/fabric)
    steps/
      ProjetStep.tsx            → étape 1 : type de vêtement, événement, date, budget, détails
      CoordonneesStep.tsx       → étape 2 : lecture seule (voir "Points d'attention")
      InspirationMessageStep.tsx→ étape 3 : tissu souhaité, dropzone photos (5 max), message
    WizardFooterNav.tsx         → boutons Retour/Continuer/Envoyer, réutilisé à chaque étape
    ConfirmationCard.tsx        → écran "Votre demande a bien été envoyée" (rendu en place, pas de route dédiée)
  hooks/
    useDemandeSurMesureWizard.ts→ étape courante, react-hook-form (schéma unique), upload, session/profil, soumission
    useSubmitQuoteRequest.ts    → mappe les valeurs du formulaire vers `SurMesureRequestDto`
    useInspirationUpload.ts     → presigned-upload → PUT direct MinIO → confirm, jusqu'à 5 photos
  api/
    quote-requests.api.ts       → useCustomerProfileQuery, useCreatePresignedUploadMutation,
                                    useConfirmUploadMutation, useSubmitQuoteRequestMutation
  schemas/
    wizard-step.schema.ts       → schéma Zod unique (voir "Points d'attention"), pas un par étape
  consts/
    garment-types.const.ts, events.const.ts, budget-ranges.const.ts, fabrics.const.ts
  types/
    wizard-state.types.ts
  __tests__/
    useDemandeSurMesureWizard.test.ts, useSubmitQuoteRequest.test.ts,
    useInspirationUpload.test.ts, DemandeSurMesureWizard.test.tsx
  index.ts
```

`DemandeSurMesureWizard.tsx` et chaque `steps/*Step.tsx` ne contiennent que du JSX + hooks —
toute la machine à états (étape courante, validation, upload, payload cumulé) vit dans
`useDemandeSurMesureWizard.ts`.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/customers/me` | `customers` | Profil (prénom/nom/téléphone) affiché en lecture seule à l'étape 2 |
| `POST /api/media/presigned-upload` | `media` | URL pré-signée MinIO pour les photos d'inspiration (étape 3), `entityType: QUOTE_DOCUMENT` (bucket `quotes`) |
| `POST /api/media/confirm` | `media` | Enregistre la ligne `Media` une fois le PUT direct vers MinIO réussi |
| `POST /api/quotes/requests` | `quotes` | Soumission de la demande complète (les 3 étapes) → crée un `Quote` au statut `DRAFT` |

> Contrairement à `pattern-studio-wizard`, il n'y a pas de sauvegarde incrémentale par étape
> côté serveur : les 3 étapes sont courtes, l'état est gardé en mémoire côté client
> (`useDemandeSurMesureWizard`) et un seul appel `POST` est fait à la fin de l'étape 3.
>
> Les 4 endpoints ci-dessus ont été vérifiés de bout en bout contre l'API/Postgres/MinIO réels
> (pas seulement MSW) : inscription d'un compte `CLIENT` de test, connexion via `/connexion`,
> parcours complet des 3 étapes avec upload d'une vraie image, soumission, et lecture du
> `Quote` créé (`quoteNumber` réel, ex. `ANG-DEV-2026-GaVi5Srz`).

## Modèles Prisma touchés

`Quote` (création au statut `DRAFT` : `description`, `lineItemsJson` initial vide/indicatif),
`Media` (photos d'inspiration, `entityType: QUOTE_DOCUMENT`), `Customer` (résolu depuis le
compte connecté — voir "Décidé" ci-dessous, pas de rattachement optionnel).

## Points d'attention

- **Décidé (backend, `docs/features/quotes.md`)** : `Quote.customerId` est une FK obligatoire
  — `create-quote-from-sur-mesure-request` exige un compte `CLIENT` avant soumission. La page
  reste donc routée dans `(client)` **sans déviation** (contrairement à `sur-mesure-process`/
  `prendre-rendez-vous`) : `(client)/layout.tsx` redirige tout visiteur non connecté vers
  `/connexion` avant même d'afficher le wizard — conforme à la décision backend.
- **Déviation vérifiée à l'implémentation — étape 2 "Coordonnées" en lecture seule, pas un
  formulaire éditable** : `SurMesureRequestDto` (`apps/api/src/quotes/application/dtos/
  sur-mesure-request.dto.ts`) n'a **aucun** champ `firstName`/`lastName`/`phone`/`email` — le
  contact est résolu côté serveur depuis le `Customer` du compte connecté, jamais depuis le
  body. L'écran Stitch réel (`ANGALY — Demande sur Mesure (Étape 2)`) montre pourtant 4 champs
  éditables avec astérisque `*` obligatoire. Les afficher comme des champs de formulaire
  actifs aurait été trompeur (l'utilisateur croirait pouvoir corriger son téléphone ici, alors
  que toute saisie serait silencieusement ignorée) : `CoordonneesStep.tsx` affiche donc
  `GET /api/customers/me` (prénom/nom/téléphone) + l'email de la session en lecture seule,
  sans validation ni soumission — "Continuer" y est toujours actif.
- Le formulaire est **volontairement multi-étapes** (spec §98) : ne jamais revenir à un
  formulaire long en une page, même en cas de refactoring futur.
- **Schéma Zod unique** (`wizard-step.schema.ts`), pas un schéma par étape composé : seul
  `garmentType` est obligatoire côté backend (tout le reste de `SurMesureRequestDto` est
  `@IsOptional()`), donc l'étape 1 est la seule transition réellement gatée — un schéma unique
  + `trigger(STEP_1_FIELDS)` couvre ce besoin sans dupliquer 3 schémas pour 1 seul champ requis.
- **Bug trouvé et corrigé en session (race de soumission prématurée)** : le bouton principal
  du wizard changeait de `type="button"` (Continuer) à `type="submit"` (Envoyer ma demande) en
  fonction de l'étape — la même étape que son propre clic modifie. Reproduit en direct : cliquer
  "Continuer" à l'étape 2 déclenchait déjà `POST /quotes/requests` avant même d'atteindre
  l'étape 3. `WizardFooterNav` est désormais toujours `type="button"` avec un `onClick`
  explicite ; le `<form onSubmit>` (touche Entrée) fait le même dispatch explicite par étape.
  Voir le commentaire dans `WizardFooterNav.tsx`.
- **Bug trouvé et corrigé dans l'infra partagée `apiClient`** (`apps/web/src/lib/api-client.ts`,
  hors périmètre de cette seule page — bénéficie à `favorites`/toutes les features
  authentifiées) : `credentials: 'include'` seul n'authentifiait jamais rien côté API NestJS
  cross-origin (le cookie de session NextAuth vit sur le domaine du site web, pas sur celui de
  l'API) — chaque appel authentifié échouait en `401` en conditions réelles (masqué jusqu'ici
  par les tests MSW, qui ne vérifient pas les headers). `apiClient` attache maintenant
  `Authorization: Bearer <session.accessToken>` via `getSession()` de `next-auth/react`.
- L'écran de confirmation propose "Prendre rendez-vous dès maintenant" → `prendre-rendez-vous`
  (pas de pré-remplissage du contexte pour l'instant — amélioration future possible).
- Jusqu'à 5 photos d'inspiration, jamais bloquant si aucune n'est fournie.
- Pas de champ obligatoire marqué en rouge agressif — respecter le ton "conversation calme et
  guidée" du prompt Stitch (AVOID: harsh red required-field markers).

## Checklist d'acceptation

- [x] Les 3 étapes + l'écran de confirmation reproduisent fidèlement l'écran Stitch réel (étape 2 en lecture seule, voir déviation ci-dessus)
- [x] Barre de progression à jour à chaque transition (3 segments + libellés Projet/Coordonnées/Détails)
- [x] Navigation Retour/Continuer fonctionnelle, "Continuer" désactivé à l'étape 1 tant qu'aucun type de vêtement n'est choisi
- [x] Upload de photos d'inspiration (jusqu'à 5) fonctionnel vers MinIO réel, suppression possible avant envoi
- [x] Soumission finale crée bien un `Quote` en statut `DRAFT` et affiche l'écran de confirmation — vérifié contre l'API/Postgres réels
- [x] "Prendre rendez-vous dès maintenant" sur l'écran de confirmation renvoie vers `prendre-rendez-vous`
- [x] Tests : `useDemandeSurMesureWizard.test.ts`, `useSubmitQuoteRequest.test.ts`, `useInspirationUpload.test.ts`, `DemandeSurMesureWizard.test.tsx` (16 tests, tous verts) + suite complète `apps/web` (402 tests) sans régression
- [x] Vérifié en navigateur réel contre l'API/Postgres/MinIO (pas seulement MSW) : compte de test créé, connexion, 3 étapes, upload d'une vraie image, soumission, `Quote` réel créé
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
