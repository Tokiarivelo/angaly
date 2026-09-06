# Page — `pattern-studio-landing`

**Statut : ⬜ À faire.** Phase 4 — Premium (Angaly Pattern Studio).

## Objet

Page de présentation d'**Angaly Pattern Studio** : installe le positionnement premium du
moteur de patronage paramétrique assisté par IA (spec §18), explique le fonctionnement en 11
étapes, rassure sur la vérification humaine et l'export professionnel, présente les offres, et
lance soit un nouveau projet, soit la reprise d'un projet en cours.

## Route(s)

`apps/web/src/app/(client)/pattern-studio/page.tsx` → `/pattern-studio`

Server Component pour l'essentiel (contenu marketing majoritairement statique) ; le bandeau
"Reprendre mon projet" est un Client Component isolé (dépend de l'état d'authentification et
d'un appel `patterns`).

## Référence maquette

- Prompt Stitch : `stitch-prompts/16-pattern-studio-landing.md`
- Écran Stitch : **ANGALY — Pattern Studio Landing Page**
- Section spécification : §18 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/pattern-studio-landing/
  ui/
    PatternStudioLandingPage.tsx      → orchestre les sections, palette Pattern Studio dédiée
    PatternStudioHero.tsx
    HowItWorksSteps.tsx                → les 11 étapes (stepper horizontal desktop / vertical mobile)
    TrustPositioningBlock.tsx          → manifeste + 3 points de confiance
    SamplePatternPreviewCard.tsx       → aperçu stylisé de pièces techniques (statique)
    PricingTiersSection.tsx            → 3 offres (spec §30), carte du milieu mise en avant
    ResumeProjectBanner.tsx            → 'use client' — affiché seulement si un projet en cours existe
    ClosingCtaSection.tsx
  hooks/
    useInProgressProject.ts            → react-query, dernier `PatternProject` non terminé du client connecté (silencieux si non connecté)
    usePatternStudioLandingContent.ts  → contenu marketing statique (TODO migration `content` en Phase 6, comme `home`)
    useCreatePatternProject.ts         → mutation de création rapide depuis les CTA "Nouveau projet"
  api/
    pattern-projects.api.ts             → useInProgressProjectQuery, useCreatePatternProjectMutation
  consts/
    how-it-works-steps.const.ts, pricing-tiers.const.ts
  __tests__/
    useInProgressProject.test.ts
    PatternStudioLandingPage.test.tsx
  index.ts
```

Toute logique (détection de projet en cours, création de projet) vit dans `hooks/` —
`PatternStudioLandingPage.tsx` et ses sections ne contiennent que du JSX + appels de hooks.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/pattern-projects?mine=true&status=DRAFT,GENERATING,GENERATED,REVIEW_REQUIRED,CORRECTION_REQUIRED&limit=1` | `patterns` | Détecte un projet en cours pour proposer "Reprendre mon projet" |
| `POST /api/pattern-projects` | `patterns` | CTA "Nouveau projet" (hero + section de fermeture) |

## Modèles Prisma touchés

`PatternProject` (lecture pour la détection de reprise, création pour les CTA), `Customer`.

## Points d'attention

- Palette dédiée Pattern Studio (fond `#041329`, surfaces `#0C2650`, accent champagne
  `#C5B190`, or premium `#936C3E` en usage sparse) — distincte du reste du site (spec §13) et
  scopée à ce feature (ex. classe racine ou variables CSS locales) pour ne pas fuiter sur les
  autres pages.
- Les CTA "Nouveau projet" créent directement un `PatternProject` (`POST /api/pattern-projects`,
  cf. `pattern-studio-wizard.md`) puis redirigent vers `/pattern-studio/wizard/:projectId` —
  pas de formulaire intermédiaire.
- Si `useInProgressProject` renvoie un projet, remplacer "Nouveau projet" par "Reprendre mon
  projet" (ou ajouter `ResumeProjectBanner` au-dessus du hero) pour éviter de créer des projets
  en double.
- Les 3 offres de la section Pricing (spec §30 — Offre commerciale Premium) sont illustratives
  à ce stade : aucun module `orders`/`payments` dédié au Pattern Studio n'existe encore ; les
  boutons "Choisir cette offre" doivent rediriger vers le wizard, la facturation réelle
  intervenant après validation professionnelle (hors périmètre Phase 4).
- Cette page vit sous `(client)/pattern-studio/` mais doit rester accessible aux visiteurs non
  connectés (lien direct depuis `home`'s `PatternStudioTeaser`, voir `docs/pages/home.md`) — le
  layout `(client)/pattern-studio/layout.tsx` ne doit imposer l'authentification que sur
  `wizard/*` et `projects/*`, jamais sur la landing elle-même.
- L'endpoint de liste (`GET /api/pattern-projects?mine=true...`) n'est pas encore listé dans
  `docs/features/patterns.md` (qui documente aujourd'hui create/update/generate/request-review/
  export) — à ajouter lors de la prochaine session sur ce module, sans changer le principe :
  la logique reste dans `patterns`, jamais côté frontend.

## Checklist d'acceptation

- [ ] Les 6 sections de `stitch-prompts/16-*.md` sont fidèlement reproduites (palette Pattern Studio exacte, distincte du reste du site)
- [ ] "Nouveau projet" crée un `PatternProject` et redirige vers le wizard
- [ ] Bandeau "Reprendre mon projet" affiché uniquement si un projet en cours existe pour le client connecté
- [ ] Page accessible sans authentification (lien depuis `home`)
- [ ] Stepper "Comment ça fonctionne" (11 étapes) navigable au clavier, version verticale mobile fonctionnelle
- [ ] Tests : `useInProgressProject.test.ts`, `PatternStudioLandingPage.test.tsx`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
