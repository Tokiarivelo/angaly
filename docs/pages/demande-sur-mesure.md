# Page — `demande-sur-mesure`

**Statut : ⬜ À faire.** Phase 2 — Conversion.

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
    WizardProgressBar.tsx       → "Étape 1 sur 3" + barre/points remplis navy sur ivoire
    steps/
      ProjetStep.tsx            → étape 1 : type de vêtement, événement, date, budget indicatif
      CoordonneesStep.tsx       → étape 2 : prénom, nom, téléphone, email
      InspirationMessageStep.tsx→ étape 3 : tissu souhaité, dropzone photos, message
    WizardFooterNav.tsx         → boutons Retour/Continuer/Envoyer, réutilisé à chaque étape
    ConfirmationCard.tsx        → écran "Votre demande a bien été envoyée"
  hooks/
    useDemandeSurMesureWizard.ts→ état global du wizard (étape courante, payload cumulé),
                                    validation par étape
    useSubmitQuoteRequest.ts    → mutation finale de soumission (étape 3 → confirmation)
    useInspirationUpload.ts     → upload vers MinIO (bucket `creations/` ou `customers/`, à
                                    trancher selon rattachement), jusqu'à 5 photos
  api/
    quote-requests.api.ts       → useSubmitQuoteRequestMutation
  schemas/
    wizard-step.schema.ts       → un schema Zod par étape (projet/coordonnées/inspiration),
                                    composés en un schema global
  consts/
    garment-types.const.ts, events.const.ts, budget-ranges.const.ts, fabrics.const.ts
  types/
    wizard-state.types.ts
  __tests__/
    useDemandeSurMesureWizard.test.ts
    useSubmitQuoteRequest.test.ts
  index.ts
```

`DemandeSurMesureWizard.tsx` et chaque `steps/*Step.tsx` ne contiennent que du JSX + hooks —
toute la machine à états (étape courante, validation par étape, payload cumulé) vit dans
`useDemandeSurMesureWizard.ts`, à l'image de `usePatternWizard.ts` dans
`docs/pages/pattern-studio-wizard.md`.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `POST /api/media/presigned-upload` | `media` | URL pré-signée MinIO pour les photos d'inspiration (étape 3) |
| `POST /api/quotes/requests` | `quotes` | Soumission de la demande complète (les 3 étapes) → crée un `Quote` au statut `DRAFT` |

> Contrairement à `pattern-studio-wizard`, il n'y a pas de sauvegarde incrémentale par étape
> côté serveur : les 3 étapes sont courtes, l'état est gardé en mémoire côté client
> (`useDemandeSurMesureWizard`) et un seul appel `POST` est fait à la fin de l'étape 3.

## Modèles Prisma touchés

`Quote` (création au statut `DRAFT` : `description`, `lineItemsJson` initial vide/indicatif),
`Media` (photos d'inspiration), `Customer` (rattachement si connecté ; si le formulaire est
accessible sans compte, voir point d'attention ci-dessous).

## Points d'attention

- Le formulaire est **volontairement multi-étapes** (spec §98, point d'attention explicite de
  `docs/phases/phase-2-conversion.md`) : ne jamais revenir à un formulaire long en une page,
  même en cas de refactoring futur.
- La page est routée dans `(client)` mais le formulaire capture prénom/nom/téléphone/email à
  l'étape 2 — si un visiteur non connecté doit pouvoir l'utiliser (cas fréquent pour un
  premier contact commercial), prévoir un mode "invité" qui crée un `Customer`/`User` minimal
  à la soumission plutôt que de bloquer l'accès à la page ; trancher ce point avec le module
  `auth`/`customers` avant l'implémentation.
- Chaque étape valide son propre sous-schéma Zod avant d'activer "Continuer" — pas de
  validation globale en fin de parcours qui forcerait à revenir en arrière.
- L'écran de confirmation propose "Prendre rendez-vous dès maintenant" : ce CTA doit chaîner
  vers `prendre-rendez-vous` avec le contexte de la demande (type de vêtement, date
  événement) pré-rempli si possible.
- Jusqu'à 5 photos d'inspiration, jamais bloquant si aucune n'est fournie.
- Pas de champ obligatoire marqué en rouge agressif — respecter le ton "conversation calme et
  guidée" du prompt Stitch (AVOID: harsh red required-field markers).

## Checklist d'acceptation

- [ ] Les 3 étapes + l'écran de confirmation reproduisent fidèlement `stitch-prompts/12-*.md`
- [ ] Barre de progression "Étape X sur 3" à jour à chaque transition
- [ ] Navigation Retour/Continuer fonctionnelle, bouton désactivé tant que l'étape n'est pas valide
- [ ] Upload de photos d'inspiration (jusqu'à 5) fonctionnel vers MinIO, suppression possible avant envoi
- [ ] Soumission finale crée bien un `Quote` en statut `DRAFT` et affiche l'écran de confirmation
- [ ] "Prendre rendez-vous dès maintenant" sur l'écran de confirmation renvoie vers `prendre-rendez-vous`
- [ ] Tests : `useDemandeSurMesureWizard.test.ts` (transitions d'étapes + validation), `useSubmitQuoteRequest.test.ts`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
