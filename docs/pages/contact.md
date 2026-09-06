# Page — `contact`

**Statut : ⬜ À faire.** Phase 1 — Présence digitale.

## Objet

Page de contact générale : canaux directs (téléphone, WhatsApp, email, réseaux), adresses
des ateliers, et un formulaire de message simple (spec §92).

## Route(s)

`apps/web/src/app/(public)/contact/page.tsx` → `/contact`

Server Component par défaut pour la mise en page (canaux, mini-liste d'ateliers) ; le
formulaire, la carte multi-pins et le bouton WhatsApp flottant sont des Client Components
isolés.

## Référence maquette

- Prompt Stitch : `stitch-prompts/24-contact.md`
- Écran Stitch : **ANGALY — Contactez-nous**
- Section spécification : §92 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/contact/
  ui/
    ContactPage.tsx                → orchestre colonnes canaux + formulaire + carte
    ContactChannelsColumn.tsx       → téléphone, WhatsApp, email, Facebook, Instagram, horaires
    ContactAteliersMiniList.tsx      → liste compacte d'adresses + lien « Voir tous nos ateliers »
    ContactForm.tsx                   → 'use client' (état vient de useContactForm())
    ContactMap.tsx                     → 'use client' carte multi-pins (tous les ateliers)
    FloatingWhatsAppButton.tsx          → 'use client' (composant partagé, voir `navigation-mobile`)
  hooks/
    useContactChannels.ts               → coordonnées de contact (téléphone, réseaux, horaires) — valeurs par défaut en dur en attendant `content`
    useContactForm.ts                    → react-hook-form + Zod + mutation d'envoi
    useAteliersForMap.ts                  → react-query sur GET /api/ateliers pour la carte + mini-liste
  api/
    contact.api.ts                         → useAteliersForMapQuery, useSendContactMessageMutation
  schemas/
    contact-form.schema.ts                  → Zod (prénom, nom, email, téléphone, sujet, message)
  consts/
    contact-subjects.const.ts                → options du select Sujet (Question générale, Rendez-vous, Devis, Sur mesure, Presse, Autre)
    queryKeys.ts
  __tests__/
    useContactForm.test.ts
    ContactPage.test.tsx
  index.ts
```

Toute logique (fetch des ateliers, validation et soumission du formulaire) vit dans
`hooks/` — `ContactPage.tsx` et les sections ne contiennent que du JSX + appels de hooks.

## Endpoints API consommés

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/ateliers` | `ateliers` | Adresses/coordonnées pour la mini-liste et la carte multi-pins |
| `POST /api/ateliers/contact-messages` | `ateliers` (décision d'architecture, voir Points d'attention) | Envoi du message du formulaire de contact |

## Modèles Prisma touchés

`Atelier` (`address`, `city`, `phone`, `latitude`, `longitude` — pour la carte et la
mini-liste). Aucun modèle Prisma ne persiste le message de contact lui-même (voir Points
d'attention).

## Points d'attention

- **Décision d'architecture — endpoint du formulaire** : le schéma Prisma ne définit aucun
  modèle `ContactMessage`/équivalent (contrairement à `Appointment` pour les rendez-vous).
  Pour rester dans le périmètre « Phase 1, lecture seule + un formulaire » sans ouvrir un
  nouveau module dédié, la mutation d'envoi est rattachée au module `ateliers`
  (`POST /api/ateliers/contact-messages`) plutôt qu'à `notifications` (modèle
  `Notification` conçu pour des notifications à un `User` authentifié, pas pour de la
  capture de formulaire anonyme). Le use-case peut se contenter d'envoyer un e-mail/une
  alerte interne sans écriture en base en Phase 1 ; si un suivi/historique des messages
  côté back-office est nécessaire, prévoir une vraie migration (`ContactMessage`) et un
  module dédié en Phase 6 — documenter alors le changement dans `docs/features/ateliers.md`.
- Coordonnées de contact statiques (téléphone, réseaux, horaires généraux) suivent le même
  sort que `docs/pages/home.md`/`docs/pages/a-propos.md` : valeurs par défaut codées en dur
  dans `useContactChannels.ts` en attendant `content` (Phase 6).
- Bouton WhatsApp : garder le style sobre défini par le prompt Stitch (navy avec glyphe
  blanc plutôt que le vert WhatsApp par défaut) pour rester cohérent avec la charte ANGALY.
- Formulaire court (règle mobile-first, spec §73) : validation Zod complète côté client
  avant tout appel réseau, état de succès/erreur explicite, pas de rechargement de page.
- Le bouton WhatsApp flottant (`FloatingWhatsAppButton`) est un composant global déjà
  spécifié dans `docs/pages/navigation-mobile.md` — ne pas le dupliquer ici, l'importer
  depuis `apps/web/src/components/navigation/`.

## Checklist d'acceptation

- [ ] Colonnes canaux + formulaire + carte multi-pins fidèles à `stitch-prompts/24-contact.md`
- [ ] Formulaire : validation Zod, état de succès/erreur, pas de rechargement de page
- [ ] Sélecteur « Sujet » avec les 6 options de la spec (Question générale, Rendez-vous, Devis, Sur mesure, Presse, Autre)
- [ ] Bouton WhatsApp flottant visible et accessible sur mobile pendant tout le scroll
- [ ] `<title>`/meta description définis (spec §70)
- [ ] Tests : `useContactForm.test.ts`, `ContactPage.test.tsx`
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
