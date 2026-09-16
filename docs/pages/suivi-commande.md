# Page — `suivi-commande`

**Statut : ✅ Fait** (câblage API réel, avec une limitation de granularité assumée et
documentée). Phase 3 — Production. Mis à jour le 2026-09-16.

`useOrderTracking.ts` appelle le vrai backend. **Aucun `GET /api/orders/:orderNumber` n'existe**
(seul `GET /api/orders/:id` et `GET /api/orders` — liste par client — existent, voir
`apps/api/src/orders/presentation/controllers/orders.controller.ts`) : la page récupère la
liste des commandes du client connecté et résout l'`orderNumber` de l'URL côté client (même
hypothèse "faible volume" que `confirmation-rendez-vous`'s `useAteliersQuery`). La page gère
maintenant un état de chargement, un état d'erreur, et un état "Commande introuvable" — ces
états n'existaient pas dans la version mock.

## Objet

Timeline de suivi d'une commande prêt-à-porter (spec §54) — de la confirmation à la livraison.
**Le suivi d'une demande de création sur mesure suit un pipeline distinct** (spec §55) et n'est
**pas** couvert par cette page (voir point d'attention) : à clarifier avant tout code si les
deux parcours doivent, à terme, partager un composant de timeline.

## Route(s)

`apps/web/src/app/(client)/suivi-commande/[orderNumber]/page.tsx` →
`/suivi-commande/:orderNumber`

Server Component pour le rendu initial (référence + timeline + récapitulatif) ; les actions
(contacter Angaly) sont des Client Components isolés.

## Référence maquette

- Prompt Stitch : `stitch-prompts/26-espace-client-rendezvous-suivi.md` (Écran B — Suivi de
  commande/création, variante "Steps for a product order")
- Écran Stitch : **ANGALY — Suivi de commande**
- Section spécification : §54-55 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

```
apps/web/src/features/suivi-commande/
  ui/
    SuiviCommandePage.tsx      → en-tête (référence + vignette) + timeline + récap
    OrderReferenceHeader.tsx
    OrderTrackingTimeline.tsx   → nœuds connectés (complété/actuel/à venir), horizontal desktop
                                  / vertical mobile
    TrackingStepNode.tsx        → cercle (rempli navy+check / anneau champagne pulsant / gris
                                  muté) + timestamp + note optionnelle
    OrderSummaryCard.tsx        → produits/services, prix, atelier, contact couturière
    ContactAngalySupportButton.tsx → "Contacter Angaly à propos de cette commande"
  hooks/
    useOrderTracking.ts         → charge la commande par `orderNumber` + dérive les étapes
                                  franchies/à venir depuis `OrderStatus` (voir point d'attention)
    useContactSupport.ts        → prépare un message vers `messages-factures-notifications`
                                  avec le contexte de la commande pré-rempli
  api/
    orders.api.ts               → useOrderTrackingQuery
  consts/
    order-tracking-steps.const.ts → mapping `OrderStatus` ↔ étapes UI (voir point d'attention)
  types/
    order-tracking.types.ts
  __tests__/
    useOrderTracking.test.ts
    SuiviCommandePage.test.tsx
  index.ts
```

Toute logique (chargement, dérivation des étapes, préparation du contact) vit dans `hooks/` ;
`SuiviCommandePage.tsx` et les composants `ui/` ne contiennent que du JSX + appels de hooks.

## Endpoints API consommés

Réellement appelé (voir `apps/api/src/orders/presentation/controllers/orders.controller.ts`
— source de vérité, pas cette table) :

| Endpoint | Module | Usage |
| --- | --- | --- |
| `GET /api/orders` | `orders` | Liste des commandes du client connecté ; l'`Order` correspondant à `orderNumber` (param d'URL) est résolu côté frontend, faute d'endpoint dédié |

`GET /api/orders/:orderNumber/tracking` et `GET /api/orders/:orderNumber` documentés
initialement **n'existent pas** — aucune table d'historique de statuts horodatés n'existe côté
Prisma (`Order` n'a que `createdAt`/`updatedAt`, voir "Points d'attention" ci-dessous) et la
route prend un `id`, jamais un `orderNumber`.

## Modèles Prisma touchés

`Order` (`status` — enum `OrderStatus`, `orderNumber`, `subtotal`, `shippingCost`, `total`,
`shippingAddressJson`), `OrderItem`, `ProductVariant`/`Product` (résumé des articles).

## Points d'attention

- **Pipeline distinct du sur-mesure (instruction explicite à respecter)** : le suivi d'une
  **création sur mesure** (spec §55, statuts `DEMANDE → CONSULTATION → DEVIS → ACOMPTE →
  MESURES → CONCEPTION → PATRON → COUPE → CONFECTION → ESSAYAGE → AJUSTEMENT → CONTRÔLE
  QUALITÉ → TERMINÉ → LIVRÉ`) suit un **pipeline différent** de celui d'une commande
  prêt-à-porter classique (spec §54, documenté ici). Cette page (`suivi-commande`) ne couvre
  **que** le pipeline `Order`/§54 ; le pipeline sur-mesure §55 touche potentiellement `Quote`,
  `PatternProject`/`PatternStatus` et `Appointment` (mesures, essayages) simultanément et
  mérite sa propre fiche/traitement (non commandée dans ce lot). **Ne pas réutiliser telle
  quelle `OrderTrackingTimeline` pour le parcours sur-mesure** sans revalidation complète du
  mapping des étapes — à clarifier avec les modules `orders`/`quotes`/`patterns` avant toute
  implémentation.
- **Écart schéma ↔ maquette sur le pipeline commande** : `OrderStatus`
  (`PENDING, CONFIRMED, PAID, IN_PRODUCTION, READY, DELIVERED, CANCELLED, REFUNDED`) ne compte
  que 8 valeurs larges, qui ne correspondent pas terme à terme aux 8 étapes détaillées de la
  maquette (`Commande confirmée → Mesures prises → Patron créé → Confection → Contrôle qualité
  → Essayage → Terminée → Livrée`). En l'état du schéma, `IN_PRODUCTION` doit couvrir à la fois
  "Mesures prises", "Patron créé" et une partie de "Confection" sans distinction persistée —
  soit `order-tracking-steps.const.ts` regroupe plusieurs étapes UI sous un même statut
  technique (perte de granularité visuelle, une seule étape "active" à la fois le temps
  qu'`IN_PRODUCTION` dure), soit une évolution de schéma (sous-statuts ou table d'étapes
  horodatées dédiée) est nécessaire — décision à trancher avec le module `orders` avant
  l'implémentation, ne jamais inventer de valeurs d'enum côté frontend.
- Le "contact couturière" du récapitulatif suppose une résolution vers un `User` assigné —
  `Order` n'a pourtant **aucun champ `assignedToId`** dans le schéma (contrairement à
  `Appointment`) ; si un contact dédié est requis, le déterminer via l'atelier ou via
  l'`Appointment`/`PatternProject` lié plutôt que d'ajouter un champ non prévu au schéma sans
  validation préalable.
- Les étapes "à venir" (grises) ne doivent jamais afficher de date ; seules les étapes
  franchies/actuelle affichent un timestamp — cohérent avec le prompt Stitch.
- "Contacter Angaly à propos de cette commande" doit pré-remplir le contexte (numéro de
  commande) du fil de discussion ouvert sur `messages-factures-notifications`, pas ouvrir un
  formulaire de contact générique séparé.
- Mobile : timeline verticale avec ligne de connexion à gauche, chaque étape pleine largeur —
  conforme au prompt Stitch.

## Checklist d'acceptation

- [x] Timeline reflète le statut réel de l'`Order` malgré l'écart de granularité : un rang
      (`STATUS_RANK`) dérive l'état complété/actuel/à venir de chaque étape UI depuis
      `OrderStatus` — mapping documenté et assumé, aucun statut inventé
- [x] Étapes franchies/actuelle affichent un timestamp (`createdAt`/`updatedAt` de l'`Order` —
      seules les deux dates réellement disponibles), étapes à venir n'en affichent aucun
- [x] Récapitulatif (prix, sous-total, total) exact — les noms d'articles sont dérivés de
      `productVariantId` (tronqué) faute d'endpoint `GET /api/products/variants/:id` pour
      résoudre le nom réel du produit ; voir "Points d'attention"
- [x] "Contacter Angaly à propos de cette commande" renvoie vers `/mes-messages` (corrigé — la
      route réelle n'est pas `/messages`)
- [x] Le pipeline sur-mesure (§55) n'est PAS traité par cette page (vérifié explicitement)
- [x] États de chargement, d'erreur et "Commande introuvable" ajoutés
- [x] Tests : `useOrderTracking.test.ts` (4 tests), `SuiviCommandePage.test.tsx` (2 tests)
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
- [ ] Nom réel de l'article dans le récapitulatif — bloqué sur l'absence d'un endpoint de
      résolution `productVariantId → Product`, hors périmètre de cette passe
