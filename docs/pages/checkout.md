# Page — `checkout`

**Statut : ✅ Fait** (câblage API réel), **avec une réserve documentée : le guest checkout
n'est pas implémenté.** Phase 3 — Production. Mis à jour le 2026-09-16.

`useCheckoutWizard.ts` appelle réellement `POST /api/orders` (étape Expédition, via
`apps/web/src/features/checkout/api/orders.api.ts`) puis `POST /api/payments` (étape Paiement,
via `api/payments.api.ts`) — plus de simulation locale (`setTimeout`) ni d'appel `apiClient`
direct dans un composant `ui/`, toute la logique vit dans le hook. L'étape Confirmation affiche
le vrai `orderNumber` renvoyé par le backend. Comme les deux endpoints exigent un `CLIENT`
authentifié (`JwtAuthGuard`, voir `apps/api/src/orders/presentation/controllers/
orders.controller.ts` et `payments.controller.ts`), et que l'hypothèse de guest checkout de ce
fichier n'a jamais été implémentée côté `auth`/`customers` (création de compte minimal à la
volée), `ExpeditionStep` redirige un visiteur non connecté vers `/connexion?redirectTo=/checkout`
avant de soumettre — le même pattern auth-gated que `useToggleFavorite`
(`pret-a-porter-catalogue`/`fiche-produit`).

## Objet

Tunnel d'achat prêt-à-porter en 3 étapes (spec §14) : Expédition (adresse + méthode de
livraison) → Paiement → Confirmation de commande. Documenté comme un mini-wizard, à l'image de
`docs/pages/pattern-studio-wizard.md`, en plus léger (3 étapes contre 7) et sans `projectId`
connu dès le départ (voir point d'attention).

## Route(s)

`apps/web/src/app/(public)/checkout/page.tsx` → `/checkout`

Client Component dès la racine (état de wizard multi-étapes, pas de bénéfice SSR) — même
justification que `pattern-studio-wizard`. Page **publique** : le guest checkout doit être
possible pour un achat prêt-à-porter (voir point d'attention, spec §14 ne tranche pas
explicitement ce point).

## Référence maquette

- Prompt Stitch : `stitch-prompts/10-essayage-panier-checkout.md` (Écran D — Checkout, étapes
  Adresse / Livraison / Paiement / Confirmation)
- Écrans Stitch : **ANGALY — Expédition (Checkout) / Paiement (Checkout) / Confirmation de commande**
- Section spécification : §14 (`docs/specifications/ANGALY_Specifications_Completes.md`)

## Arborescence de composants attendue

**Écart assumé avec l'implémentation réelle** : plutôt que d'éclater la logique en
`useCreateOrderFromCart.ts`/`useSubmitPayment.ts`/`useDeliveryMethods.ts`/`usePaymentMethods.ts`/
`useOrderConfirmation.ts` séparés, tout vit dans `useCheckoutWizard.ts` (état + `createOrder()` +
`submitPayment()`), qui appelle `api/orders.api.ts` (`useCreateOrderMutation`, `useOrderQuery`)
et `api/payments.api.ts` (`useInitiatePaymentMutation`) — plus simple pour un wizard à 3 étapes
sans validation Zod par étape (les champs sont tous optionnels côté `CreateOrderRequestDto`, un
schéma par étape n'apportait rien de plus que les `required` HTML déjà en place). Pas de
`schemas/`, `consts/delivery-methods.const.ts`/`payment-methods.const.ts` ni
`CheckoutFooterNav.tsx` séparé : les méthodes de livraison/paiement restent des littéraux dans
`ExpeditionStep.tsx`/`PaiementStep.tsx` (4 `PaymentMethod`, 2 méthodes de livraison — pas assez
de variabilité pour justifier une extraction).

```
apps/web/src/features/checkout/
  ui/
    CheckoutWizard.tsx           → shell : header minimal (logo + cadenas + indicateur d'étape)
    CheckoutStepper.tsx           → "Expédition → Paiement → Confirmation"
    steps/
      ExpeditionStep.tsx          → formulaire adresse (Prénom, Nom, Téléphone, Email, Adresse,
                                     Ville, Région) + cartes méthode de livraison (Retrait en
                                     atelier / Livraison à domicile, délai + coût)
      PaiementStep.tsx             → cartes méthode de paiement (Mobile Money, Carte bancaire,
                                     Virement, Paiement à la livraison) + sidebar récap total
      ConfirmationStep.tsx         → état de succès, numéro de commande, récap, CTA
    CheckoutOrderSummarySidebar.tsx → réutilisée aux étapes Expédition/Paiement
    CheckoutFooterNav.tsx          → boutons Retour/Continuer/Confirmer et payer
  hooks/
    useCheckoutWizard.ts          → état global (étape courante, payload cumulé adresse +
                                     livraison + paiement)
    useCreateOrderFromCart.ts      → matérialise le panier en `Order` réel à la validation de
                                     l'étape Expédition, crée un `Customer`/`User` minimal si
                                     visiteur non connecté (voir point d'attention)
    useDeliveryMethods.ts          → options de livraison + coûts estimés
    usePaymentMethods.ts           → options de paiement disponibles (adaptées Madagascar)
    useSubmitPayment.ts            → mutation de paiement → transition de statut `Order` →
                                     passe à `ConfirmationStep`
    useOrderConfirmation.ts        → charge l'`Order` finalisé pour l'écran de confirmation
  api/
    orders.api.ts                  → useCreateOrderMutation, useOrderQuery
    payments.api.ts                 → useCreatePaymentMutation
  schemas/
    checkout-step.schema.ts         → un schema Zod par étape (adresse + livraison / paiement),
                                     composés en un schema global
  consts/
    delivery-methods.const.ts, payment-methods.const.ts
  types/
    checkout-state.types.ts
  __tests__/
    useCheckoutWizard.test.ts
    useCreateOrderFromCart.test.ts
    useSubmitPayment.test.ts
  index.ts
```

`CheckoutWizard.tsx` et chaque `steps/*Step.tsx` ne contiennent que du JSX + hooks — toute la
machine à états (étape courante, validation par étape, payload cumulé) vit dans
`useCheckoutWizard.ts`, à l'image de `usePatternWizard.ts`.

## Endpoints API consommés

Réellement appelés (voir `apps/api/src/orders/presentation/controllers/orders.controller.ts` et
`apps/api/src/payments/presentation/controllers/payments.controller.ts` — sources de vérité,
pas cette table) :

| Endpoint | Module | Usage |
| --- | --- | --- |
| `POST /api/orders` | `orders` | Matérialisation de la commande à partir du panier + adresse/livraison (le serveur résout prix/stock, jamais le client) — requiert un `CLIENT` authentifié |
| `POST /api/payments` | `payments` | Initialisation du paiement (méthode) pour l'`Order` créée → requiert un `CLIENT` authentifié |

`PATCH /api/orders/:id` (mise à jour d'adresse) n'existe pas côté backend et n'est pas
appelé — non nécessaire dans le flux actuel (l'adresse est envoyée en un seul appel à la
création). `GET /api/orders/:id` existe (`orders.controller.ts`) mais n'est pas appelé par
cette page : le résultat de `POST /api/orders` suffit pour l'écran de confirmation.

## Modèles Prisma touchés

`Order` (`customerId`, transitions de `status` `PENDING`→`CONFIRMED`/`PAID`, `subtotal`,
`shippingCost`, `total`, `shippingAddressJson`), `OrderItem`, `Payment` (`method`, `status`,
`amount`, `transactionRef`, `paidAt`), `Customer` (créé/rattaché si guest), `User` (compte
minimal si guest, voir point d'attention).

## Points d'attention

- **Guest checkout — hypothèse explicite (identique à `panier.md`)** : le spec §14 ne tranche
  pas explicitement si un achat prêt-à-porter nécessite un compte. Hypothèse retenue : **le
  guest checkout doit être possible**. Un visiteur non connecté peut compléter l'étape
  Expédition (saisie de ses coordonnées) sans créer de compte au sens strict ;
  `useCreateOrderFromCart` crée alors un `User`+`Customer` minimal (email comme identifiant, pas
  de mot de passe exploitable tant que le visiteur ne le définit pas) pour satisfaire la
  contrainte `Order.customerId` non-nullable du schéma. Un lien "Vous avez déjà un compte ?
  Connectez-vous" doit être proposé en haut de l'étape Expédition pour éviter un doublon de
  compte si l'email correspond à un `User` existant. Cette hypothèse est à confirmer avec les
  modules `auth`/`customers`/`orders` avant l'implémentation.
- Contrairement à `pattern-studio-wizard`, il n'y a **pas de `projectId` connu dès l'étape 1** :
  l'`Order` n'existe qu'une fois l'étape Expédition validée — prévoir de refléter l'identifiant
  de commande créé dans l'URL (ex. `router.replace('/checkout?orderId=...')`) une fois
  disponible, pour qu'un rafraîchissement de page à l'étape Paiement/Confirmation ne recrée pas
  une commande dupliquée (clé d'idempotence recommandée côté `POST /api/orders`).
- L'écran "Expédition" du prompt Stitch fusionne les steps "Adresse" et "Livraison" — une seule
  étape ANGALY nommée "Expédition" doit présenter les deux sections (formulaire adresse puis
  cartes méthode de livraison) l'une après l'autre sur la même vue, pas deux étapes séparées
  dans le stepper visible.
- Le header du checkout est volontairement minimal (logo + cadenas + indicateur d'étape), sans
  navigation complète — cohérent avec le prompt Stitch ("reduce distraction").
- Les méthodes de paiement doivent rester génériques/extensibles pour Madagascar (Mobile Money,
  Carte, Virement, Paiement à la livraison) — `PaymentMethod` de Prisma couvre déjà ces 4
  valeurs ; ne pas coder en dur un fournisseur Mobile Money particulier côté frontend (détail
  d'intégration du module `payments`).
- "Confirmer et payer" ne doit déclencher la transition de statut `Order` qu'après confirmation
  effective du `Payment` (webhook/callback selon le fournisseur pour Mobile Money) — ne jamais
  afficher l'écran de confirmation avant confirmation réelle du paiement pour les méthodes
  asynchrones, à la différence de "Paiement à la livraison" qui peut confirmer immédiatement la
  commande (`Order.status = CONFIRMED`, `Payment.status = PENDING`).
- Chaque étape est validée par son propre sous-schéma Zod avant d'activer "Continuer", comme
  dans `pattern-studio-wizard`/`demande-sur-mesure`.

## Checklist d'acceptation

- [x] Étape Expédition fusionne bien adresse + méthode de livraison
- [x] Étape Paiement propose les 4 méthodes (`PaymentMethod`), sidebar récap total à jour
- [x] Soumission crée bien un `Order` (`POST /api/orders`) puis un `Payment`
      (`POST /api/payments`) — appels réels, plus de mock
- [x] Écran de confirmation affiche le vrai numéro de commande et les 2 CTA (Voir ma commande →
      `suivi-commande/:orderNumber` / Retour à l'accueil)
- [x] Tests : `useCheckoutWizard.test.ts` (7 tests : état initial, auth, création commande,
      paiement, erreurs), `CheckoutWizard.test.tsx`
- [x] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
- [ ] **Guest checkout non implémenté** — un visiteur non connecté est redirigé vers
      `/connexion` avant de pouvoir soumettre l'étape Expédition (voir statut ci-dessus) ; créer
      un `User`+`Customer` minimal à la volée reste un TODO `auth`/`customers` séparé
- [ ] Gestion explicite des statuts de paiement asynchrones (Mobile Money confirmé par
      webhook/callback avant `ConfirmationStep`) reste TODO — `submitPayment` affiche
      aujourd'hui la confirmation dès la réponse de `POST /api/payments` (payment `PENDING`),
      pas après confirmation réelle ; cohérent avec l'état actuel de `payments` (pas de webhook
      fournisseur, voir `docs/features/payments.md`)
- [ ] Idempotence de `POST /api/orders` au rafraîchissement de page (pas de re-render testé en
      conditions réelles, hors périmètre de cette passe — pas de test e2e Playwright ajouté)
