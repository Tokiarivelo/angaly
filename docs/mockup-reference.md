# ANGALY — Référence croisée Page ↔ Maquette Stitch ↔ Spécification ↔ Phase

> **Fichier pivot obligatoire.** Avant toute implémentation, et à chaque mise à jour de
> statut, cet index est la source unique pour retrouver la maquette **Google Stitch**
> correspondant à une page, le prompt qui l'a générée, la section de spécification à
> respecter, et la phase à laquelle elle appartient. Référencé depuis `CLAUDE.md`,
> `AGENTS.md`, et les skills `new-feature`/`new-page-from-stitch`.
>
> Projet Stitch : https://stitch.withgoogle.com/projects/3703874896720765754
> Spécification : `docs/specifications/ANGALY_Specifications_Completes.md`
>
> **Légende Statut** : ✅ Fait · 🟡 Partiel · ⬜ À faire · 🔍 À vérifier

---

## PHASE 1 — Présence digitale

| Page (slug)                | Fiche                                 | Prompt Stitch                                    | Écran Stitch (titre)                        | Section spéc | Statut |
| ---------------------------- | -------------------------------------- | -------------------------------------------------- | --------------------------------------------- | ------------- | ------ |
| home                          | `docs/pages/home.md`                   | `stitch-prompts/01-home.md`                        | ANGALY — Maison de Couture Homepage           | §5            | ✅     |
| la-une                        | `docs/pages/la-une.md`                 | `stitch-prompts/02-la-une.md`                      | ANGALY — La Une (Editorial Showcase)          | §6            | ✅     |
| nos-creations-galerie         | `docs/pages/nos-creations-galerie.md`  | `stitch-prompts/03-nos-creations-galerie.md`       | ANGALY — Nos Créations (Gallery Portfolio)    | §7            | ✅     |
| creation-detail                | `docs/pages/creation-detail.md`        | `stitch-prompts/04-creation-detail.md`             | ANGALY — Robe Éternelle (Detail Page)         | §8            | ✅     |
| collections-liste              | `docs/pages/collections-liste.md`      | `stitch-prompts/06-collections-liste.md`           | ANGALY — Nos Collections (Index Editorial)    | §10           | ✅     |
| collection-detail               | `docs/pages/collection-detail.md`      | `stitch-prompts/07-collection-detail.md`           | ANGALY — Collection Éternelle (Detail Page)   | §10           | ✅     |
| a-propos                        | `docs/pages/a-propos.md`               | `stitch-prompts/21-a-propos.md`                    | ANGALY — Notre Histoire (À propos)            | §39-40        | ✅     |
| nos-ateliers-liste               | `docs/pages/nos-ateliers-liste.md`     | `stitch-prompts/19-nos-ateliers-liste.md`          | ANGALY — Nos Ateliers (Workshops & Locations) | §37-38        | ✅     |
| atelier-detail                    | `docs/pages/atelier-detail.md`         | `stitch-prompts/20-atelier-detail.md`              | ANGALY — Atelier Antananarivo Centre (Detail) | §37           | ✅     |
| contact                            | `docs/pages/contact.md`                | `stitch-prompts/24-contact.md`                     | ANGALY — Contactez-nous                       | §92           | ✅     |
| journal-liste                       | `docs/pages/journal-liste.md`          | `stitch-prompts/22-journal-liste.md`               | ANGALY — Le Journal (Editorial Listing)       | §43           | ✅     |
| journal-article                      | `docs/pages/journal-article.md`        | `stitch-prompts/23-journal-article.md`             | ANGALY — Article : Choisir sa robe de mariée  | §44           | ✅     |
| page-404                              | `docs/pages/page-404.md`               | `stitch-prompts/30-page-404-et-composants-mobiles.md` | ANGALY — Page non trouvée (404)            | §94           | ✅     |
| navigation-mobile                      | `docs/pages/navigation-mobile.md`      | `stitch-prompts/30-page-404-et-composants-mobiles.md` | ANGALY — Menu Mobile / Navigation Mobile & FAB / Recherche (Overlay) | §4, §73 | ✅ |

## PHASE 2 — Conversion

| Page (slug)                | Fiche                                    | Prompt Stitch                                          | Écran Stitch (titre)                          | Section spéc | Statut |
| ---------------------------- | ------------------------------------------ | --------------------------------------------------------- | ------------------------------------------------ | ------------- | ------ |
| personnalisation-creation      | `docs/pages/personnalisation-creation.md`  | `stitch-prompts/05-personnalisation-creation.md`           | ANGALY — Personnaliser votre Robe Éternelle       | §9            | ✅     |
| sur-mesure-process               | `docs/pages/sur-mesure-process.md`         | `stitch-prompts/11-sur-mesure-process.md`                   | ANGALY — L'Art du Sur Mesure                       | §15           | ✅     |
| demande-sur-mesure                | `docs/pages/demande-sur-mesure.md`         | `stitch-prompts/12-demande-sur-mesure-formulaire.md`        | ANGALY — Demande sur Mesure (Étape 1/2/3) + Demande Envoyée | §16 | ✅     |
| devis                               | `docs/pages/devis.md`                      | `stitch-prompts/13-devis.md`                                | ANGALY — Devis #ANG-DEV-2026-014                   | §17, §57      | ✅     |
| prendre-rendez-vous                  | `docs/pages/prendre-rendez-vous.md`        | `stitch-prompts/14-prendre-rendez-vous.md`                  | ANGALY — Prendre rendez-vous (Booking)             | §33-34        | ✅     |
| confirmation-rendez-vous               | `docs/pages/confirmation-rendez-vous.md`   | `stitch-prompts/15-confirmation-rendez-vous.md`             | ANGALY — Confirmation de rendez-vous               | §35-36        | ✅     |
| pret-a-porter-catalogue                  | `docs/pages/pret-a-porter-catalogue.md`    | `stitch-prompts/08-pret-a-porter-catalogue.md`              | ANGALY — Prêt-à-porter Catalogue                    | §11           | ✅     |
| fiche-produit                              | `docs/pages/fiche-produit.md`               | `stitch-prompts/09-fiche-produit.md`                         | ANGALY — Robe Solène (Product Page)                 | §12           | ✅     |
| reservation-essayage                         | `docs/pages/reservation-essayage.md`        | `stitch-prompts/10-essayage-panier-checkout.md`              | ANGALY — Réserver un essayage                        | §13           | ✅     |
| authentification                              | `docs/pages/authentification.md`            | `stitch-prompts/29-connexion-inscription.md`                  | ANGALY — Connexion / Inscription / Mot de passe oublié | §82         | ✅     |
| mes-favoris                                    | `docs/pages/mes-favoris.md`                 | `stitch-prompts/28-espace-client-favoris-messages.md`         | ANGALY — Mes favoris                                   | §47           | ✅     |

## PHASE 3 — Production

| Page (slug)                     | Fiche                                       | Prompt Stitch                                             | Écran Stitch (titre)                              | Section spéc | Statut |
| ---------------------------------- | --------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------- | ------------- | ------ |
| panier                                | `docs/pages/panier.md`                        | `stitch-prompts/10-essayage-panier-checkout.md`                 | ANGALY — Votre Panier                                 | §14           | ✅     |
| checkout                                | `docs/pages/checkout.md`                      | `stitch-prompts/10-essayage-panier-checkout.md`                 | ANGALY — Expédition (Checkout) / Paiement (Checkout) / Confirmation de commande | §14 | ✅ |
| espace-client-dashboard                   | `docs/pages/espace-client-dashboard.md`       | `stitch-prompts/25-espace-client-dashboard.md`                   | ANGALY — Espace Client (Tableau de bord)               | §51-52        | ✅     |
| mes-rendez-vous                             | `docs/pages/mes-rendez-vous.md`               | `stitch-prompts/26-espace-client-rendezvous-suivi.md`             | ANGALY — Mes rendez-vous                                | §51           | ✅     |
| suivi-commande                               | `docs/pages/suivi-commande.md`                | `stitch-prompts/26-espace-client-rendezvous-suivi.md`             | ANGALY — Suivi de commande                              | §54-55        | ✅     |
| messages-factures-notifications                | `docs/pages/messages-factures-notifications.md` | `stitch-prompts/28-espace-client-favoris-messages.md`            | ANGALY — Messages, Factures & Notifications             | §51           | ✅     |

## PHASE 4 — Premium (Angaly Pattern Studio)

| Page (slug)                              | Fiche                                            | Prompt Stitch                                                          | Écran Stitch (titre)                              | Section spéc | Statut |
| ------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------- | ------------- | ------ |
| pattern-studio-landing                        | `docs/pages/pattern-studio-landing.md`              | `stitch-prompts/16-pattern-studio-landing.md`                                  | ANGALY — Pattern Studio Landing Page                  | §18           | ✅     |
| pattern-studio-wizard                          | `docs/pages/pattern-studio-wizard.md`               | `stitch-prompts/17-pattern-studio-wizard-creation.md`                          | ANGALY Pattern Studio — Étape 1 / Étape 7 / Génération en cours | §19-24 | ✅ |
| pattern-studio-preview-validation-export        | `docs/pages/pattern-studio-preview-validation-export.md` | `stitch-prompts/18-pattern-studio-preview-validation-export.md`              | ANGALY — Validation de Patron (Studio)                 | §26-29        | ✅     |
| mes-projets-patron                               | `docs/pages/mes-projets-patron.md`                  | `stitch-prompts/27-espace-client-patron-mesures.md`                            | ANGALY — Mes projets de patron                          | §53, §66      | ✅     |
| mes-mesures                                        | `docs/pages/mes-mesures.md`                         | `stitch-prompts/27-espace-client-patron-mesures.md`                            | ANGALY — Mes mesures                                     | §22-23, §56   | ✅     |

## PHASE 5 — IA avancée

Aucune nouvelle page/route — enrichit `pattern-studio-wizard` (analyse réelle de la photo
d'inspiration, spec §21) et ajoute un widget d'assistant IA global (spec §31-32), pas une
page dédiée. Voir `docs/features/ai-inference.md` et `docs/phases/phase-5-ai-avancee.md`.

**État réel (2026-09-14)** : le pipeline `ai-inference` → `apps/ai-service` est branché de bout
en bout (analyse d'inspiration, assistant, estimation de mesures manquantes), mais reste un
wrapper prompt-engineered sur Gemini — pas de modèle fine-tuné/entraîné (aucune infrastructure
ML dans ce repo). `pattern-studio-wizard` a aussi reçu un sélecteur de taille standard
(XS/S/M/L/XL…) à l'étape 7, non prévu dans la spec initiale mais ajouté sur demande explicite.

## PHASE 6 — Admin (back-office)

| Page (slug)                | Fiche                                     | Prompt Stitch                                          | Écran Stitch (titre)                    | Section spéc | Statut |
| ---------------------------- | -------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------ | ------------- | ------ |
| admin-gestion-contenu           | `docs/pages/admin-gestion-contenu.md`        | `stitch-prompts/31-admin-gestion-contenu-mediatheque.md`      | ANGALY Back-office — Gestion de contenu     | §67           | ⬜     |
| admin-mediatheque                 | `docs/pages/admin-mediatheque.md`            | `stitch-prompts/31-admin-gestion-contenu-mediatheque.md`      | ANGALY Back-office — Médiathèque             | §67, §76      | ⬜     |

---

## Modules backend sans page dédiée (mapping vers `docs/features/`)

Certains modules n'ont pas de page 1-pour-1 (ils servent plusieurs pages, ou sont purement
internes). Voir `docs/features/<slug>.md` pour chacun — statut détaillé dans
`docs/checklist-implementation.md`.

| Feature (slug) | Phase | Sert principalement |
| --- | --- | --- |
| categories, creations, collections, ateliers, blog, media, i18n, search | 1 | Toutes les pages Phase 1 |
| auth, customers, appointments, products, quotes, reviews | 2 | Toutes les pages Phase 2 |
| orders, payments, notifications | 3 | Toutes les pages Phase 3 |
| measurements, patterns, pattern-engine | 4 | Toutes les pages Phase 4 |
| ai-inference | 5 | pattern-studio-wizard (analyse réelle) |
| users, content | 6 | admin-gestion-contenu, admin-mediatheque |
