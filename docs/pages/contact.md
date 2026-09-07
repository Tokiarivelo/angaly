# Page — `contact`

**Statut : ✅ Fait.** Phase 1 — Présence digitale.

## Objet

Page de contact générale : canaux directs (téléphone, WhatsApp, email, réseaux), adresses
des ateliers, et un formulaire de message simple (spec §92).

## Route(s)

`apps/web/src/app/(public)/contact/page.tsx` → `/contact`

**`'use client'`** — comme toutes les pages Phase 1 à données dynamiques livrées cette
session, `ContactPage` appelle `useAteliersForMap()` (react-query sur `GET /api/ateliers`
pour la mini-liste), donc pas de Server Component pur pour le corps de la page.

## Référence maquette

- Prompt Stitch : `stitch-prompts/24-contact.md`
- Écran Stitch : **ANGALY — Contactez-nous**
- Section spécification : §92 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants (livrée)

```
apps/web/src/features/contact/
  ui/
    ContactPage.tsx                → orchestre header + colonne canaux + formulaire + carte
    ContactHeader.tsx               → header centré
    ContactChannelsColumn.tsx        → « Nous joindre » (téléphone/WhatsApp/email), « Réseaux », « Nos horaires »
    ContactAteliersMiniList.tsx       → adresses réelles (GET /api/ateliers) + « Voir tous nos ateliers »
    ContactForm.tsx                    → 'use client' (état vient de useContactForm())
    ContactMap.tsx                      → panneau carte statique stylé CSS + carte info centrée (pas de vraie carte, voir Points d'attention)
  hooks/
    useContactChannels.ts                → coordonnées de contact (téléphone/WhatsApp/email/réseaux/horaires) — valeurs par défaut en dur en attendant `content`
    useContactForm.ts                     → react-hook-form + Zod + mutation d'envoi
    useAteliersForMap.ts                   → react-query sur GET /api/ateliers pour la mini-liste
  api/
    contact.api.ts                          → useAteliersForMapQuery, useSendContactMessageMutation
  schemas/
    contact-form.schema.ts                   → Zod (prénom, nom, email, téléphone optionnel, sujet, message)
  consts/
    contact-subjects.const.ts                 → 6 options du select Sujet
    queryKeys.ts
  __tests__/
    useContactForm.test.ts, ContactForm.test.tsx, ContactChannelsColumn.test.tsx,
    ContactAteliersMiniList.test.tsx, ContactMap.test.tsx, ContactPage.test.tsx
  index.ts
```

**Pas de `FloatingWhatsAppButton.tsx`** — voir Points d'attention. Toute logique (fetch des
ateliers, validation et soumission du formulaire) vit dans `hooks/` — `ContactPage.tsx` et
les sections ne contiennent que du JSX + appels de hooks.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/ateliers` | `ateliers` | Adresses réelles pour la mini-liste |
| `POST /api/ateliers/contact-messages` | `ateliers` (décision d'architecture, voir Points d'attention) | Envoi du message du formulaire — **mocké via MSW**, pas encore implémenté côté `apps/api` |

## Modèles Prisma touchés

`Atelier` (`address`, `city` — pour la mini-liste). Aucun modèle Prisma ne persiste le
message de contact lui-même (voir Points d'attention).

## Points d'attention

- **Fidélité vérifiée via `agy`/StitchMCP `get_screen`** (écran réel
  `791ccd6fdab34fb69483571eab501f9c`), pas seulement `stitch-prompts/24-contact.md`.
- **Pas de bouton WhatsApp flottant** : l'écran réel n'a aucun FAB — WhatsApp y est un simple
  lien/bouton inline dans la section « Nous joindre », au même niveau que téléphone et email.
  Le plan initial de cette fiche supposait un `FloatingWhatsAppButton.tsx` partagé (déjà
  « spécifié » par `docs/pages/navigation-mobile.md`, non livrée) — omis ici plutôt
  qu'inventé sans référence visuelle sur cet écran ; à construire lors de la page
  `navigation-mobile` dédiée si un FAB global est confirmé nécessaire ailleurs.
- **Carte** : même constat que `nos-ateliers-liste`/`atelier-detail` — l'écran réel ne
  montre même pas de pins, juste une image de fond stylée avec une seule carte d'info
  statique centrée (« Ateliers ANGALY »). Reproduit en CSS pur, aucune dépendance carte.
- **`POST /api/ateliers/contact-messages` n'existe pas encore dans `apps/api`** (aucun
  modèle `ContactMessage`) — mocké via MSW (`apps/web/src/lib/msw/handlers/contact.handlers.ts`),
  même traitement que les mocks `testimonials`/`newsletter` de `home.handlers.ts`. Contre
  l'API réelle en dev, le formulaire affiche donc son état d'erreur (404) — comportement
  attendu et vérifié, pas un bug. Un vrai module `ateliers`/contact-messages` ou un module
  `notifications` dédié reste à construire hors du périmètre frontend de cette session.
- Coordonnées de contact (téléphone, réseaux, horaires) : valeurs par défaut codées en dur
  dans `useContactChannels.ts`, même sort que `docs/pages/home.md`/`docs/pages/a-propos.md`
  en attendant `content` (Phase 6). Réseaux (Facebook/Instagram) restent des liens `#`
  décoratifs, cohérent avec le reste du site (aucune vraie URL sociale définie nulle part).
- Mini-liste d'ateliers 100 % réelle (`GET /api/ateliers`) — s'affiche avec le nombre réel
  d'ateliers en base (1 actuellement), pas les 2 exemples de la maquette.
- Formulaire : validation Zod complète côté client, état de succès/erreur explicite (statut
  `role="status"`/`role="alert"`), pas de rechargement de page, bouton désactivé + libellé
  « Envoi… » pendant la mutation.

## Checklist d'acceptation

- [x] Colonnes canaux + formulaire + carte fidèles à l'écran réel
- [x] Formulaire : validation Zod, état de succès/erreur, pas de rechargement de page
- [x] Sélecteur « Sujet » avec les 6 options de la spec (Question générale, Rendez-vous, Devis, Sur mesure, Presse, Autre)
- [x] Pas de bouton WhatsApp flottant inventé — lien inline fidèle à l'écran réel (voir Points d'attention)
- [x] `<title>`/meta description définis (spec §70)
- [x] Tests : 6 fichiers, 15 tests (100 % de couverture sur la feature)
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
