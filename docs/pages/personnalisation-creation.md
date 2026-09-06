# Page — `personnalisation-creation`

**Statut : ⬜ À faire.** Phase 2 — Conversion.

## Objet

Configurateur permettant à un visiteur de personnaliser une création existante (coupe,
longueur, manches, décolleté, dos, couleur, tissu, broderies, boutons, ceinture, traîne,
détails décoratifs) et de constituer un dossier de conception, point de départ d'une demande
de devis (spec §9). Accessible depuis une fiche `creation-detail` via l'action
"Créer une version personnalisée".

## Route(s)

`apps/web/src/app/(client)/creations/[slug]/personnaliser/page.tsx` →
`/creations/:slug/personnaliser`

Nécessite un compte (dossier de conception rattaché à un `Customer`) — route dans le groupe
`(client)`, redirection vers `authentification` si non connecté.

## Référence maquette

- Prompt Stitch : `stitch-prompts/05-personnalisation-creation.md`
- Écran Stitch : **ANGALY — Personnaliser votre Robe Éternelle**
- Section spécification : §9 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/personnalisation-creation/
  ui/
    PersonnalisationCreationPage.tsx → layout deux colonnes (aperçu + formulaire)
    ReferencePreview.tsx              → photo de référence sticky + hotspots annotés
    OptionGroup.tsx                   → groupe de chips réutilisable (coupe, longueur, manches...)
    ColorSwatchPicker.tsx             → sélecteur de couleurs (pastilles circulaires)
    FabricSwatchPicker.tsx            → sélecteur de tissu (vignettes matière)
    InspirationUploadDropzone.tsx     → dropzone photo d'inspiration (multi-fichiers)
    NotesField.tsx                    → textarea "Notes pour votre couturière"
    SelectionSummaryBar.tsx           → barre sticky récap des choix + CTA
    ConfirmationCard.tsx              → écran de confirmation du dossier de conception
  hooks/
    useCreationReference.ts           → charge la création de base (slug) pour la preview
    useCustomizationForm.ts           → état des options sélectionnées, validation, brouillon
    useInspirationUpload.ts           → upload vers MinIO (bucket `creations/`)
    useSubmitDesignBrief.ts           → mutation de création du dossier de conception
  api/
    design-briefs.api.ts              → useSaveDraftMutation, useSubmitDesignBriefMutation
  schemas/
    customization-options.schema.ts   → Zod (toutes les options + notes, tout optionnel sauf coupe)
  consts/
    option-choices.const.ts           → listes de chips (coupes, longueurs, manches, décolletés...)
  types/
    design-brief.types.ts
  __tests__/
    useCustomizationForm.test.ts
    useSubmitDesignBrief.test.ts
    PersonnalisationCreationPage.test.tsx
  index.ts
```

`PersonnalisationCreationPage.tsx` et les composants `ui/` restent purement présentationnels ;
toute la logique de sélection d'options, d'upload et de soumission vit dans `hooks/`.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/creations/:slug` | `creations` | Modèle de référence pour la preview et le récapitulatif |
| `POST /api/media/presigned-upload` | `media` | URL pré-signée MinIO pour les photos d'inspiration |
| `POST /api/quotes/design-briefs` | `quotes` | Création du dossier de conception (options + notes + médias) |
| `PATCH /api/quotes/design-briefs/:id` | `quotes` | Sauvegarde incrémentale ("Enregistrer comme brouillon") |

## Modèles Prisma touchés

`Creation` (référence, lecture seule), `Media` (photos d'inspiration, `entityType =
CREATION`), `Quote` (le dossier de conception alimente `Quote.description` et
`Quote.lineItemsJson` à la création de la demande de devis — voir `docs/features/quotes.md`
à traiter), `Customer` (propriétaire du dossier).

## Points d'attention

- Le dossier de conception n'est **pas** un `Quote` finalisé : c'est la matière première
  d'une future demande de devis. Le stocker comme un `Quote` au statut `DRAFT` (ou une
  structure dédiée côté module `quotes`, à trancher à l'implémentation du module) évite de
  dupliquer un modèle.
- Le CTA final "Continuer vers la prise de rendez-vous" doit chaîner vers
  `prendre-rendez-vous` avec le dossier de conception pré-rattaché (query param ou état
  serveur), pour ne pas faire ressaisir le contexte au client.
- Toutes les options (coupe, longueur, manches, décolleté, dos, couleur, tissu, broderies,
  boutons, ceinture, traîne, détails décoratifs) sont volontairement non bloquantes : un
  client doit pouvoir enregistrer un brouillon partiel et reprendre plus tard.
- La note "Aperçu indicatif — les rendus définitifs seront validés avec votre couturière"
  doit rester visible en permanence : ce configurateur ne génère aucun rendu réel, seulement
  un dossier texte/tags pour la couturière (à ne pas confondre avec Angaly Pattern Studio).
- Mobile : la preview devient un panneau rétractable en haut de page, la barre de résumé
  reste sticky en bas avec le CTA principal toujours visible.

## Checklist d'acceptation

- [ ] Toutes les sections de `stitch-prompts/05-personnalisation-creation.md` sont présentes et fidèles à la palette ANGALY
- [ ] Chaque groupe d'options (coupe → détails décoratifs) fonctionne en sélection simple ou multiple selon sa nature, état sélectionné visuellement distinct
- [ ] Upload de photo(s) d'inspiration fonctionnel vers MinIO avec suppression possible avant envoi
- [ ] "Enregistrer comme brouillon" persiste l'état sans validation complète
- [ ] "Continuer vers la prise de rendez-vous" bloqué tant qu'au moins la coupe n'est pas choisie
- [ ] Écran de confirmation reproduit fidèlement le récapitulatif (modèle, options en tags, photo, deux CTA)
- [ ] Tests : `useCustomizationForm.test.ts`, `useSubmitDesignBrief.test.ts`, `PersonnalisationCreationPage.test.tsx`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
