# Page — `checkout`

**Statut : ⬜ À faire.** Phase 3 — Production.

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

| Endpoint | Module | Usage |
| --- | --- | --- |
| `POST /api/orders` | `orders` | Matérialisation de la commande à partir du panier + adresse + livraison (crée ou rattache un `Customer` si besoin) |
| `PATCH /api/orders/:id` | `orders` | Mise à jour (adresse/livraison si modifiée avant paiement) |
| `POST /api/payments` | `payments` | Initialisation du paiement (méthode, montant) → transition de statut `Order` |
| `GET /api/orders/:id` | `orders` | Récapitulatif pour l'écran de confirmation |

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

- [ ] Les 3 étapes (Expédition, Paiement, Confirmation) reproduisent fidèlement `stitch-prompts/10-*.md` Écran D
- [ ] Étape Expédition fusionne bien adresse + méthode de livraison, fonctionnelle pour visiteur connecté et non connecté (guest checkout)
- [ ] Étape Paiement propose les 4 méthodes (`PaymentMethod`), sidebar récap total à jour
- [ ] Soumission crée bien un `Order` (statut approprié) et un `Payment`, gère les statuts asynchrones (Mobile Money) sans confirmation prématurée
- [ ] Écran de confirmation affiche le numéro de commande et les 2 CTA (Voir ma commande / Retour à l'accueil)
- [ ] Rafraîchissement de page à l'étape Paiement ne recrée pas de commande dupliquée
- [ ] Tests : `useCheckoutWizard.test.ts`, `useCreateOrderFromCart.test.ts`, `useSubmitPayment.test.ts`, au moins un test e2e du parcours complet
- [ ] `docs/checklist-implementation.md` et `docs/mockup-reference.md` mis à jour à ✅
