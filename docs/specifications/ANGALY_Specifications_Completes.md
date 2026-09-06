# ANGALY — Spécification complète du site web

**Version : 1.0**  
**Produit :** Angaly — Maison de couture & Atelier numérique  
**Type :** Site vitrine premium + boutique + sur-mesure + espace client + générateur de patron premium  
**Langues prévues :** Français, Malagasy, extensible à l’anglais

---

## 1. Vision générale

Angaly ne doit pas être un simple site vitrine de couturière. Le site doit être conçu comme une **maison de couture numérique haut de gamme**, combinant :

- présentation de la marque ;
- galerie de réalisations ;
- section éditoriale **La Une** ;
- collections ;
- prêt-à-porter ;
- création sur mesure ;
- prise de rendez-vous ;
- devis et suivi de confection ;
- espace client ;
- assistant IA ;
- fonctionnalité Premium de génération de patron sur mesure ;
- back-office complet.

### Proposition de valeur

> **Chez Angaly, votre vêtement est créé pour vous.**

Le parcours principal doit être :

```text
Découvrir
→ Être inspiré
→ Choisir une création
→ Personnaliser
→ Prendre rendez-vous
→ Prendre les mesures
→ Concevoir
→ Confectionner
→ Essayer
→ Livrer
```

Pour le service Premium :

```text
Mesures
→ Style
→ Personnalisation
→ Génération du patron
→ Vérification
→ Validation
→ Export
→ Confection éventuelle
```

---

# 2. Objectifs du site

## 2.1 Objectifs commerciaux

- Augmenter la visibilité d'Angaly.
- Présenter les meilleures créations.
- Transformer les visiteurs en prospects.
- Faciliter les demandes de rendez-vous.
- Faciliter les réservations de vêtements.
- Développer les ventes de prêt-à-porter.
- Générer des demandes de créations sur mesure.
- Développer une offre Premium autour du patronage numérique.
- Fidéliser les clients grâce à un espace personnel.

## 2.2 Objectifs marketing

- Construire une image haut de gamme.
- Montrer le savoir-faire artisanal.
- Mettre régulièrement les meilleures créations à l'honneur.
- Développer le référencement local.
- Utiliser les témoignages et avis pour renforcer la confiance.
- Créer une présence éditoriale grâce au Journal.

## 2.3 Objectifs technologiques

- Architecture moderne et maintenable.
- Mobile First.
- Multilingue.
- API REST documentée.
- Architecture modulaire.
- Préparation à l'IA.
- Préparation à une future application mobile.
- Gestion sécurisée des données clients et des patrons.

---

# 3. Positionnement visuel

## 3.1 Style

Le site doit évoquer :

- élégance ;
- luxe ;
- exclusivité ;
- artisanat ;
- précision ;
- féminité et raffinement ;
- modernité technologique.

Éviter :

- interfaces trop chargées ;
- couleurs trop nombreuses ;
- animations excessives ;
- aspect marketplace générique.

## 3.2 Direction artistique

Utiliser :

- grandes photographies ;
- beaucoup d'espace ;
- transitions douces ;
- typographies élégantes ;
- animations discrètes ;
- compositions éditoriales ;
- mise en avant du travail manuel.

## 3.3 Palette indicative

- Noir profond ;
- Blanc ivoire ;
- Beige/champagne ;
- Doré discret ;
- Gris chaud.

Le doré doit rester subtil.

## 3.4 Typographie indicative

Titres :

- Cormorant Garamond ;
- Playfair Display.

Interface et textes :

- Inter ;
- Manrope.

---

# 4. Navigation principale

Navigation Desktop :

1. Accueil
2. La Une
3. Nos Créations
4. Prêt-à-porter
5. Sur Mesure
6. Patron Premium
7. À propos
8. Ateliers
9. Journal
10. Contact

Actions globales :

- Recherche ;
- Favoris ;
- Mon compte ;
- Prendre rendez-vous.

Sur mobile :

- menu hamburger ;
- accès rapide au compte ;
- favoris ;
- bouton rendez-vous ;
- bouton WhatsApp flottant.

---

# 5. Page d'accueil

La page d'accueil est la vitrine principale d'Angaly.

## 5.1 Hero

Grand visuel plein écran :

- photographie d'une création exceptionnelle ;
- possibilité de vidéo courte ;
- logo Angaly ;
- slogan ;
- appels à l'action.

Exemple :

> **ANGALY**  
> *L'élégance, créée pour vous.*

Boutons :

- Découvrir nos créations
- Prendre rendez-vous

## 5.2 La Une

Section dédiée aux plus belles réalisations.

Contenu :

- 3 à 8 créations ;
- grandes photographies ;
- titre ;
- catégorie ;
- description courte ;
- bouton Découvrir.

Exemple :

> **Collection Éclat**  
> Robe de mariée sur mesure.

### Administration

Une réalisation peut être :

- mise à la Une ;
- retirée de la Une ;
- ordonnée ;
- planifiée pour une période ;
- associée à une photo principale.

La Une doit être facilement renouvelable depuis le back-office.

## 5.3 Présentation de la maison

Courte présentation :

- histoire ;
- savoir-faire ;
- philosophie ;
- spécialités.

CTA :

> Découvrir Angaly

## 5.4 Catégories principales

Cartes visuelles :

- Robes de mariée ;
- Costumes ;
- Robes de soirée ;
- Créations sur mesure ;
- Prêt-à-porter.

## 5.5 Section Sur Mesure

Présentation du processus :

```text
Votre idée
→ Consultation
→ Mesures
→ Patron
→ Confection
→ Essayage
→ Livraison
```

CTA :

> Créer ma tenue sur mesure

## 5.6 Section Patron Premium

Présenter la fonctionnalité comme un atelier numérique :

> **Angaly Pattern Studio**  
> Votre patron, créé selon vos mesures.

CTA :

> Découvrir Patron Premium

## 5.7 Témoignages

Afficher :

- photo client ;
- prénom ;
- création ;
- témoignage ;
- badge Avis vérifié si applicable.

## 5.8 Ateliers

Résumé :

- localisation ;
- horaires ;
- photos ;
- bouton Itinéraire.

## 5.9 Journal

Afficher 3 à 4 articles récents.

## 5.10 Footer

Contenu :

- navigation ;
- services ;
- contact ;
- réseaux sociaux ;
- ateliers ;
- newsletter ;
- mentions légales ;
- confidentialité ;
- cookies.

---

# 6. Page La Une

La Une doit être une véritable vitrine éditoriale.

## 6.1 Objectif

Présenter :

- les créations exceptionnelles ;
- les nouveautés ;
- les collections importantes ;
- les réalisations de prestige ;
- les créations que la maison souhaite mettre en avant.

## 6.2 Contenu

Chaque élément peut contenir :

- grande photo ;
- nom ;
- catégorie ;
- histoire ;
- date ;
- collection ;
- bouton Voir la création.

## 6.3 Types de contenu

- Création du mois ;
- Collection du moment ;
- Coup de cœur ;
- Mariage ;
- Costume ;
- Événement ;
- Coulisses.

---

# 7. Page Nos Réalisations

Galerie complète des créations.

## 7.1 Catégories

1. Robes de mariée
2. Costumes homme
3. Costards sur mesure
4. Robes de soirée
5. Robes événementielles
6. Tenues traditionnelles revisitées
7. Créations spéciales
8. Accessoires
9. Collections

## 7.2 Filtres

- Femme ;
- Homme ;
- Mariage ;
- Soirée ;
- Costume ;
- Sur mesure ;
- Collection ;
- couleur ;
- style ;
- événement.

## 7.3 Affichage

- grille ;
- masonry ;
- grand visuel ;
- aperçu rapide ;
- pagination ou chargement progressif.

---

# 8. Page détail d'une réalisation

Chaque création possède une page dédiée.

## 8.1 Galerie

- photo principale ;
- vue de face ;
- vue arrière ;
- détails ;
- matière ;
- broderie ;
- finition ;
- photo portée ;
- coulisses éventuelles.

## 8.2 Informations

- nom ;
- catégorie ;
- collection ;
- type ;
- description ;
- matière ;
- techniques ;
- disponibilité ;
- possibilité de reproduction ou personnalisation.

## 8.3 Actions

- Prendre rendez-vous ;
- Demander une création similaire ;
- Créer une version personnalisée ;
- Ajouter aux favoris ;
- Partager.

---

# 9. Personnalisation d'une création

Depuis une réalisation, l'utilisateur peut sélectionner :

> Créer une version personnalisée

## 9.1 Paramètres possibles

- coupe ;
- longueur ;
- manches ;
- décolleté ;
- dos ;
- couleur ;
- tissu ;
- broderies ;
- boutons ;
- ceinture ;
- traîne ;
- détails décoratifs.

## 9.2 Résultat

Créer un dossier de conception avec :

- modèle de référence ;
- options choisies ;
- notes ;
- photos d'inspiration ;
- mesures éventuelles ;
- demande de rendez-vous.

---

# 10. Page Collections

Les créations peuvent être regroupées en collections.

Exemple :

> Collection Éternelle — 2026

Chaque collection possède :

- couverture ;
- titre ;
- description ;
- histoire ;
- galerie ;
- vidéo ;
- créations associées ;
- bouton rendez-vous.

---

# 11. Page Prêt-à-porter

Catalogue des vêtements disponibles immédiatement.

## 11.1 Informations produit

- nom ;
- référence ;
- photos ;
- description ;
- prix ;
- tailles ;
- couleurs ;
- matière ;
- disponibilité ;
- atelier ;
- conditions de réservation.

## 11.2 Statuts

- Disponible ;
- Dernière pièce ;
- Épuisé ;
- Sur commande ;
- Réservé.

---

# 12. Fiche produit

Contenu :

- galerie ;
- prix ;
- tailles ;
- couleur ;
- matière ;
- description ;
- disponibilité ;
- produits similaires.

Actions :

- Ajouter au panier ;
- Réserver pour essayage ;
- Prendre rendez-vous ;
- Ajouter aux favoris ;
- Contacter Angaly.

---

# 13. Réservation pour essayage

Alternative à l'achat immédiat.

L'utilisateur sélectionne :

- produit ;
- taille ;
- atelier ;
- date ;
- heure.

Confirmation :

- écran ;
- email ;
- notification ;
- éventuellement WhatsApp.

---

# 14. Achat en ligne

Prévoir éventuellement :

- panier ;
- checkout ;
- adresse ;
- livraison ;
- paiement ;
- confirmation ;
- facture ;
- suivi.

Le système doit être suffisamment flexible pour intégrer les moyens de paiement pertinents pour Madagascar.

---

# 15. Page Sur Mesure

Page destinée aux créations personnalisées.

## 15.1 Processus

### Étape 1 — Votre idée

Le client explique son projet.

### Étape 2 — Consultation

Rendez-vous avec Angaly.

### Étape 3 — Mesures

Prise professionnelle des mesures.

### Étape 4 — Conception

Choix du modèle et des détails.

### Étape 5 — Patron

Création du patron.

### Étape 6 — Confection

Découpe et assemblage.

### Étape 7 — Essayage

Ajustements.

### Étape 8 — Livraison

Remise de la création finale.

---

# 16. Demande de création sur mesure

Formulaire :

- prénom ;
- nom ;
- téléphone ;
- email ;
- type de vêtement ;
- événement ;
- date de l'événement ;
- budget indicatif ;
- inspiration ;
- tissu souhaité ;
- message ;
- photos d'inspiration.

Possibilité de joindre des images.

---

# 17. Demande de devis

Créer une demande de devis :

```text
Demande de devis
→ Analyse
→ Proposition
→ Acceptation
→ Acompte
→ Production
```

Le devis doit pouvoir contenir :

- description ;
- matières ;
- options ;
- quantité ;
- prix ;
- acompte ;
- solde ;
- délai estimé ;
- validité.

---

# 18. Fonctionnalité Premium — Angaly Pattern Studio

Fonctionnalité différenciante du site.

Nom recommandé :

> **Angaly Pattern Studio**

Sous-titre :

> Créez un patron personnalisé à partir de vos mesures et de votre style.

Cette fonctionnalité ne doit pas être présentée comme une simple IA qui « dessine » un patron.

Elle doit être conçue comme un **moteur de patronage paramétrique assisté par IA**.

---

# 19. Création d'un projet Premium

L'utilisateur clique :

> Nouveau projet

Puis choisit :

- robe ;
- jupe ;
- pantalon ;
- veste ;
- costume ;
- chemise ;
- robe de mariée ;
- autre.

Création d'un identifiant de projet :

```text
ANG-PAT-2026-00001
```

---

# 20. Assistant de conception

Questions progressives :

### Type

Quel vêtement souhaitez-vous créer ?

### Occasion

- mariage ;
- soirée ;
- quotidien ;
- cérémonie ;
- professionnel ;
- autre.

### Style

- classique ;
- moderne ;
- élégant ;
- minimaliste ;
- traditionnel ;
- glamour ;
- etc.

### Coupe

- droite ;
- évasée ;
- sirène ;
- princesse ;
- ajustée ;
- oversize ;
- etc.

### Détails

- manches ;
- col ;
- décolleté ;
- dos ;
- longueur ;
- poches ;
- boutons ;
- fermeture ;
- ceinture ;
- traîne ;
- etc.

---

# 21. Inspiration par photo

L'utilisateur peut ajouter une photo d'inspiration.

Le système peut analyser des caractéristiques générales :

- coupe ;
- type de manche ;
- longueur ;
- décolleté ;
- silhouette ;
- éléments visuels.

L'objectif est de transformer l'inspiration en paramètres de conception.

Le système ne doit pas promettre une reproduction parfaite d'une photo complexe.

---

# 22. Profil de mesures

L'utilisateur peut enregistrer ses mesures.

Exemples :

- tour de poitrine ;
- tour de taille ;
- tour de hanches ;
- largeur épaules ;
- hauteur poitrine ;
- longueur dos ;
- longueur bras ;
- longueur vêtement ;
- entrejambe ;
- autres mesures nécessaires selon le vêtement.

---

# 23. Assistant de prise de mesures

Pour chaque mesure :

- nom ;
- définition ;
- illustration ;
- instructions ;
- unité ;
- valeur ;
- validation.

Unités :

- cm ;
- éventuellement inch.

Possibilité d'enregistrer plusieurs profils :

```text
Mes mesures 2026
Mesures costume
Mesures mariage
```

---

# 24. Génération du patron

Pipeline :

```text
Utilisateur
↓
Choix du vêtement
↓
Style
↓
Paramètres
↓
Mesures
↓
IA
↓
Moteur de règles
↓
Génération géométrique
↓
Validation
↓
Prévisualisation
↓
Export
```

Le moteur doit gérer :

- dimensions ;
- aisance ;
- lignes de couture ;
- marges ;
- droit-fil ;
- crans ;
- repères ;
- pièces ;
- nomenclature.

---

# 25. Architecture du moteur de patron

Séparer :

### IA

Utilisée pour :

- interprétation du langage naturel ;
- compréhension de l'inspiration ;
- aide à la conception ;
- recommandations ;
- génération de paramètres.

### Pattern Engine

Utilisé pour :

- géométrie ;
- calculs ;
- règles de construction ;
- cohérence dimensionnelle ;
- génération des pièces.

Le moteur géométrique doit rester déterministe autant que possible.

---

# 26. Prévisualisation du patron

Afficher les pièces :

- devant ;
- dos ;
- manche ;
- col ;
- jupe ;
- ceinture ;
- autres pièces.

Chaque pièce peut être sélectionnée.

Informations :

- nom ;
- dimensions ;
- tissu ;
- quantité ;
- droit-fil ;
- marge ;
- repères.

---

# 27. Validation professionnelle

Option Premium :

> Faire vérifier mon patron par Angaly

La couturière peut :

- consulter le projet ;
- vérifier les mesures ;
- corriger ;
- modifier les paramètres ;
- ajouter des commentaires ;
- valider.

Statuts :

```text
Brouillon
→ Génération
→ À vérifier
→ Correction demandée
→ Validé
→ Exporté
```

---

# 28. Export Premium

Formats possibles :

- PDF A4 ;
- PDF A3 ;
- PDF A0 ;
- SVG ;
- DXF pour une utilisation professionnelle future.

Le document peut contenir :

- logo Angaly ;
- nom du projet ;
- numéro ;
- date ;
- mesures ;
- taille ;
- version ;
- pièces ;
- instructions ;
- avertissement technique.

---

# 29. Historique des versions

Chaque modification crée une version :

```text
Version 1.0
Création initiale

Version 1.1
Correction taille

Version 1.2
Modification manches

Version 2.0
Modification coupe
```

Possibilité de restaurer une version.

---

# 30. Offre commerciale Premium

Exemples de niveaux :

### Patron numérique

- génération ;
- prévisualisation ;
- export.

### Patron + vérification Angaly

- génération ;
- contrôle professionnel ;
- corrections ;
- validation ;
- export.

### Patron + confection

- conception ;
- patron ;
- mesures ;
- vérification ;
- confection ;
- essayage ;
- livraison.

Les prix seront configurables depuis le back-office.

---

# 31. Assistant IA Angaly

Chatbot permettant de répondre aux questions :

- tarifs ;
- rendez-vous ;
- ateliers ;
- produits ;
- sur mesure ;
- entretien ;
- choix d'une robe ;
- choix d'un costume.

Exemples :

> Quel type de robe me conseillez-vous pour un mariage ?

> Comment prendre mes mesures ?

> Où se trouve votre atelier ?

Le chatbot doit pouvoir orienter vers :

- produit ;
- création ;
- rendez-vous ;
- service Premium.

---

# 32. Recommandations personnalisées

Selon :

- type d'événement ;
- style ;
- budget ;
- couleur ;
- type de vêtement ;
- préférences.

Le site affiche :

> Nos créations recommandées pour vous

---

# 33. Page Prendre Rendez-vous

Formulaire simple :

- prénom ;
- nom ;
- téléphone ;
- email ;
- type de création ;
- atelier ;
- date ;
- heure ;
- message.

Types :

- Robe de mariée ;
- Costume ;
- Robe de soirée ;
- Retouche ;
- Patron ;
- Consultation ;
- Essayage.

---

# 34. Calendrier de disponibilité

Afficher :

- dates disponibles ;
- dates complètes ;
- jours fermés ;
- créneaux disponibles.

Si plusieurs ateliers ou employés :

- disponibilité par atelier ;
- disponibilité par couturière ;
- type de rendez-vous ;
- durée.

---

# 35. Confirmation du rendez-vous

Après validation :

- récapitulatif ;
- date ;
- heure ;
- atelier ;
- service ;
- numéro de réservation.

Actions :

- Ajouter au calendrier ;
- Modifier ;
- Annuler ;
- Contacter Angaly.

---

# 36. Notifications rendez-vous

Notifications possibles :

- confirmation ;
- rappel ;
- modification ;
- annulation ;
- demande de confirmation.

Canaux :

- email ;
- notification web ;
- WhatsApp selon intégration disponible.

---

# 37. Page Nos Ateliers

Chaque atelier possède une fiche.

Informations :

- nom ;
- adresse ;
- photos ;
- téléphone ;
- horaires ;
- services ;
- itinéraire ;
- disponibilité éventuelle.

---

# 38. Carte interactive

Utiliser une solution cartographique adaptée.

Afficher :

- ateliers ;
- points de retrait ;
- autres points utiles.

Actions :

> Voir l'itinéraire

---

# 39. Page À propos

Sections :

1. Notre histoire
2. La fondatrice
3. Notre savoir-faire
4. Notre philosophie
5. Notre atelier
6. Nos valeurs
7. Notre vision

Utiliser :

- photos ;
- vidéos ;
- citations ;
- chronologie éventuelle.

---

# 40. Présentation de la fondatrice

Créer une section humaine :

> Qui est Angaly ?

Contenu :

- parcours ;
- passion ;
- expérience ;
- spécialités ;
- philosophie ;
- vision de la mode.

---

# 41. Témoignages clients

Section :

> Elles nous ont fait confiance

Contenu :

- photo ;
- prénom ;
- création ;
- témoignage ;
- date éventuelle ;
- badge vérifié.

---

# 42. Avis clients

Possibilité d'intégrer :

- avis internes ;
- avis Google ;
- avis Facebook.

Le site doit distinguer clairement les avis vérifiés des témoignages éditoriaux.

---

# 43. Page Journal

Blog de la maison Angaly.

Catégories :

- Mariage à Madagascar ;
- Conseils mode ;
- Conseils costume ;
- Tendances ;
- Coulisses de l'atelier ;
- Entretien des vêtements ;
- Conseils robe de mariée ;
- Conseils costume.

---

# 44. Articles

Chaque article possède :

- titre ;
- couverture ;
- auteur ;
- date ;
- catégorie ;
- contenu ;
- images ;
- SEO ;
- articles similaires ;
- CTA rendez-vous.

---

# 45. Newsletter

Formulaire :

- email ;
- consentement.

Contenus :

- collections ;
- nouveautés ;
- événements ;
- conseils ;
- actualités Angaly.

---

# 46. Recherche globale

Recherche dans :

- créations ;
- produits ;
- collections ;
- articles ;
- catégories.

Résultats regroupés.

---

# 47. Favoris

L'utilisateur peut sauvegarder :

- créations ;
- produits ;
- collections.

Dans :

> Mes favoris

Les favoris peuvent aider à préparer un rendez-vous.

---

# 48. Comparaison de créations

Possibilité future de comparer quelques modèles :

| Attribut | Modèle A | Modèle B |
|---|---|---|
| Style | Sirène | Princesse |
| Matière | Satin | Dentelle |
| Longueur | Longue | Longue |
| Sur mesure | Oui | Oui |

---

# 49. Galerie Avant / Après

Très utile pour :

- retouches ;
- transformations ;
- restaurations ;
- ajustements.

Affichage :

```text
AVANT
↓
APRÈS
```

---

# 50. Galerie Coulisses

Présenter :

- prise de mesures ;
- dessin ;
- patronage ;
- découpe ;
- couture ;
- broderie ;
- essayage ;
- repassage ;
- finition.

Objectif :

> montrer la valeur du travail artisanal.

---

# 51. Espace client

Après connexion :

```text
Bonjour, Marie

Mes rendez-vous
Mes commandes
Mes créations
Mes projets de patron
Mes mesures
Mes favoris
Mes messages
Mes factures
Mes notifications
```

---

# 52. Dashboard client

Résumé :

- prochain rendez-vous ;
- commande en cours ;
- projet Premium en cours ;
- dernière création ;
- notifications.

---

# 53. Mes créations

Historique :

```text
Robe mariage 2026
```

Statut :

```text
Consultation
→ Conception
→ Patron
→ Confection
→ Essayage
→ Terminée
```

---

# 54. Suivi d'une commande ou création

Timeline :

```text
Commande confirmée
↓
Mesures prises
↓
Patron créé
↓
Confection
↓
Contrôle qualité
↓
Essayage
↓
Terminée
↓
Livrée
```

---

# 55. Suivi d'une demande sur mesure

Statuts :

```text
DEMANDE
↓
CONSULTATION
↓
DEVIS
↓
ACOMPTE
↓
MESURES
↓
CONCEPTION
↓
PATRON
↓
COUPE
↓
CONFECTION
↓
ESSAYAGE
↓
AJUSTEMENT
↓
CONTRÔLE QUALITÉ
↓
TERMINÉ
↓
LIVRÉ
```

---

# 56. Gestion des mesures

Les mesures sont des données sensibles du projet et doivent être protégées.

Fonctions :

- créer un profil ;
- modifier ;
- supprimer ;
- dupliquer ;
- utiliser pour un projet ;
- historiser.

---

# 57. Devis

Un devis peut être associé à :

- client ;
- création ;
- projet ;
- produits ;
- matières ;
- options ;
- prix ;
- acompte ;
- solde ;
- date d'expiration ;
- délai.

Actions :

- envoyer ;
- accepter ;
- refuser ;
- modifier.

---

# 58. Commandes

Une commande possède :

- numéro ;
- client ;
- produits ;
- services ;
- prix ;
- taxes si applicables ;
- paiement ;
- statut ;
- livraison ;
- historique.

---

# 59. Paiements

Prévoir une couche abstraite permettant d'intégrer différents prestataires de paiement.

Statuts :

- en attente ;
- autorisé ;
- payé ;
- partiellement payé ;
- échoué ;
- remboursé.

---

# 60. Administration — Dashboard

Le back-office affiche :

- chiffre d'affaires ;
- commandes ;
- rendez-vous ;
- demandes de devis ;
- nouveaux clients ;
- créations ;
- produits ;
- patrons ;
- notifications.

---

# 61. Administration — Réalisations

Actions :

- créer ;
- modifier ;
- supprimer ;
- publier ;
- dépublier ;
- mettre à la Une ;
- réordonner ;
- ajouter photos ;
- catégoriser ;
- associer collection.

---

# 62. Administration — Produits

Champs :

- nom ;
- référence ;
- prix ;
- tailles ;
- couleurs ;
- matière ;
- stock ;
- photos ;
- description ;
- statut ;
- atelier.

---

# 63. Administration — Collections

Actions :

- créer ;
- modifier ;
- publier ;
- masquer ;
- ordonner les créations ;
- modifier couverture ;
- définir période.

---

# 64. Administration — Rendez-vous

Vue :

- jour ;
- semaine ;
- mois.

Filtres :

- atelier ;
- couturière ;
- type ;
- statut.

Actions :

- confirmer ;
- déplacer ;
- annuler ;
- ajouter une note ;
- associer un client.

---

# 65. Administration — Clients

Fiche client :

- informations ;
- historique ;
- mesures ;
- rendez-vous ;
- commandes ;
- devis ;
- créations ;
- patrons ;
- messages.

---

# 66. Administration — Patron Premium

La couturière peut consulter :

```text
Projet #ANG-PAT-2026-00001
```

Informations :

- client ;
- vêtement ;
- style ;
- paramètres ;
- mesures ;
- fichiers ;
- versions ;
- commentaires ;
- statut.

Actions :

- vérifier ;
- demander correction ;
- modifier ;
- valider ;
- exporter.

---

# 67. Administration — Contenu

Gestion :

- pages ;
- La Une ;
- réalisations ;
- collections ;
- blog ;
- témoignages ;
- FAQ ;
- SEO ;
- médias.

---

# 68. Administration — Utilisateurs et rôles

Rôles :

### Visiteur

Consultation publique.

### Client

Commandes, rendez-vous, projets.

### Couturière

Production, clients, rendez-vous, patrons.

### Manager

Gestion commerciale et contenu.

### Administrateur

Accès complet.

---

# 69. Internationalisation

Langues initiales :

- Français ;
- Malagasy.

Architecture prête pour :

- Anglais.

Les traductions doivent être séparées du code.

---

# 70. SEO

## 70.1 SEO général

Optimiser :

- titres ;
- descriptions ;
- URLs ;
- données structurées ;
- sitemap ;
- robots.txt ;
- Open Graph ;
- Twitter/X cards.

## 70.2 SEO local

Cibler notamment :

- robe de mariée Madagascar ;
- robe de mariée Antananarivo ;
- couturière Antananarivo ;
- robe sur mesure Madagascar ;
- costume homme Antananarivo ;
- costard sur mesure Madagascar.

## 70.3 Pages locales

Chaque atelier peut avoir une page SEO dédiée.

---

# 71. SEO des réalisations

Chaque création doit avoir une URL propre.

Exemple :

```text
/creations/robes-de-mariee/robe-eternelle
```

Éviter :

```text
/product?id=123
```

Chaque page doit posséder :

- title ;
- meta description ;
- image principale ;
- alt text ;
- données structurées si pertinentes.

---

# 72. Performance

Le site étant très visuel :

- WebP ;
- AVIF ;
- lazy loading ;
- responsive images ;
- CDN ;
- cache ;
- compression ;
- optimisation vidéo ;
- préchargement intelligent des ressources critiques.

Objectif :

> excellente expérience même avec une connexion mobile limitée.

---

# 73. Mobile First

Le mobile doit être une priorité.

Principes :

- gros visuels ;
- navigation simple ;
- CTA visibles ;
- réservation rapide ;
- WhatsApp accessible ;
- formulaires courts ;
- galeries tactiles ;
- checkout simplifié.

---

# 74. Accessibilité

Prévoir :

- contraste suffisant ;
- navigation clavier ;
- labels de formulaire ;
- textes alternatifs ;
- focus visible ;
- taille de texte adaptée ;
- messages d'erreur compréhensibles.

---

# 75. Sécurité

Protection de :

- comptes ;
- données personnelles ;
- mesures ;
- commandes ;
- projets de patrons ;
- fichiers PDF ;
- photos privées.

Mesures :

- authentification sécurisée ;
- autorisations RBAC ;
- validation des entrées ;
- rate limiting ;
- protection CSRF si nécessaire ;
- protection XSS ;
- validation uploads ;
- logs ;
- sauvegardes ;
- chiffrement des secrets ;
- contrôle d'accès aux fichiers.

---

# 76. Stockage des médias

Les images et fichiers ne doivent pas être stockés directement en base de données.

Utiliser un stockage objet compatible S3.

Organisation indicative :

```text
creations/
products/
collections/
ateliers/
customers/
patterns/
blog/
avatars/
```

---

# 77. Architecture technique recommandée

## Frontend Web

- Next.js ;
- TypeScript ;
- Tailwind CSS ;
- shadcn/ui ;
- React Query ;
- Zustand ;
- Framer Motion ;
- GSAP si nécessaire.

## Backend

- NestJS ;
- REST API ;
- OpenAPI / Swagger.

## Base de données

- PostgreSQL ;
- Prisma ORM.

## Cache / traitements

- Redis ;
- jobs asynchrones ;
- queues.

## Stockage

- S3 compatible.

## IA

- moteur LLM compatible Ollama ou autre fournisseur selon les besoins ;
- services IA isolés du domaine métier.

---

# 78. Architecture modulaire backend

Modules principaux :

```text
Auth
Users
Customers
Appointments
Ateliers
Creations
Collections
Products
Orders
Payments
Quotes
Measurements
Patterns
PatternEngine
AI
Reviews
Blog
Notifications
Media
Search
```

---

# 79. Architecture frontend

Le frontend doit être organisé par fonctionnalités.

Exemple :

```text
app/
features/
  home/
  la-une/
  creations/
  products/
  sur-mesure/
  appointments/
  ateliers/
  premium-pattern/
  customer/
  blog/
  auth/
  checkout/
components/
hooks/
stores/
lib/
```

Éviter de mettre toute la logique métier directement dans les pages.

Les pages doivent principalement composer les fonctionnalités.

---

# 80. Architecture générale du projet

Structure indicative :

```text
apps/
  web/
  api/
  admin/

packages/
  ui/
  types/
  config/
  database/
  auth/
  storage/
  ai/
  pattern-engine/
  eslint-config/
  tsconfig/
```

Gestionnaire de monorepo possible :

- Turborepo ;
- pnpm.

---

# 81. API REST

L'API doit être documentée avec OpenAPI.

Exemples :

```text
GET    /api/creations
GET    /api/creations/:slug
POST   /api/appointments
GET    /api/appointments/availability
POST   /api/quotes
GET    /api/customer/orders
POST   /api/pattern-projects
POST   /api/pattern-projects/:id/generate
POST   /api/pattern-projects/:id/validate
GET    /api/pattern-projects/:id/export
```

---

# 82. Authentification

Fonctions :

- inscription ;
- connexion ;
- déconnexion ;
- récupération de mot de passe ;
- vérification email ;
- éventuellement connexion téléphone ;
- éventuellement OAuth.

---

# 83. Autorisation

Utiliser un contrôle d'accès basé sur les rôles.

Exemple :

```text
CLIENT
COUTURIERE
MANAGER
ADMIN
```

Les projets de patrons privés ne doivent être accessibles qu'aux utilisateurs autorisés.

---

# 84. Notifications

Événements :

- rendez-vous confirmé ;
- rappel ;
- commande créée ;
- paiement ;
- devis ;
- patron généré ;
- patron validé ;
- essayage ;
- création terminée.

Canaux :

- email ;
- notification web ;
- WhatsApp si intégré.

---

# 85. Recherche

Recherche globale pouvant évoluer vers un moteur dédié.

Index possibles :

- créations ;
- produits ;
- collections ;
- articles ;
- ateliers.

---

# 86. Analytics

Mesurer :

- visiteurs ;
- pages vues ;
- créations populaires ;
- produits populaires ;
- favoris ;
- rendez-vous ;
- demandes de devis ;
- conversion ;
- recherches ;
- articles populaires ;
- projets Premium créés ;
- exports de patrons.

---

# 87. Parcours client — Mariage

```text
Google
↓
Page Robes de mariée
↓
La Une
↓
Galerie
↓
Création
↓
Personnalisation
↓
Sur mesure
↓
Rendez-vous
↓
Confirmation
↓
Mesures
↓
Conception
↓
Patron
↓
Confection
↓
Essayage
↓
Livraison
```

---

# 88. Parcours client — Costume

```text
Accueil
↓
Costumes
↓
Modèle
↓
Personnalisation
↓
Mesures
↓
Rendez-vous
↓
Devis
↓
Acompte
↓
Confection
↓
Essayage
↓
Livraison
```

---

# 89. Parcours utilisateur Premium

```text
Patron Premium
↓
Nouveau projet
↓
Type de vêtement
↓
Style
↓
Personnalisation
↓
Photo d'inspiration
↓
Mesures
↓
Génération
↓
Prévisualisation
↓
Correction
↓
Vérification Angaly
↓
Validation
↓
Export PDF
```

---

# 90. Parcours de production

```text
Demande
↓
Consultation
↓
Devis
↓
Acompte
↓
Mesures
↓
Conception
↓
Patron
↓
Coupe
↓
Confection
↓
Contrôle
↓
Essayage
↓
Ajustement
↓
Contrôle final
↓
Livraison
```

---

# 91. Fonctionnalités avancées futures

## 91.1 Scan corporel assisté par smartphone

À terme :

- photos guidées ;
- estimation des mesures ;
- profil corporel ;
- contrôle manuel obligatoire.

Cette fonctionnalité doit être développée après le moteur de patronage de base.

## 91.2 Visualisation 3D

Permettre éventuellement de visualiser une création sur un mannequin virtuel.

## 91.3 Essayage virtuel

Fonctionnalité future basée sur IA.

## 91.4 Application mobile

Une application React Native peut être développée lorsque le site et l'API sont stabilisés.

---

# 92. Page Contact

Contenu :

- téléphone ;
- WhatsApp ;
- email ;
- Facebook ;
- Instagram ;
- ateliers ;
- formulaire ;
- horaires.

---

# 93. Footer

### Angaly

- Nos créations
- Collections
- Sur mesure
- Patron Premium
- Prendre rendez-vous
- Ateliers
- Journal
- Contact

### Informations

- Mentions légales ;
- CGV ;
- Confidentialité ;
- Cookies.

### Réseaux

- Facebook ;
- Instagram ;
- TikTok si utilisé.

---

# 94. Page 404

Message possible :

> **Cette création semble avoir disparu de l'atelier...**

CTA :

> Retour aux créations

---

# 95. PWA

Possibilité future de rendre le site installable :

> Ajouter Angaly à l'écran d'accueil

Cela permet une expérience proche d'une application sans développer immédiatement une application native.

---

# 96. Modèle de données principal

Entités principales :

```text
User
Customer
Role
Atelier
Appointment
Creation
Collection
Product
ProductVariant
Inventory
Order
OrderItem
Payment
Quote
MeasurementProfile
Measurement
PatternProject
PatternVersion
PatternPiece
PatternExport
AIConversation
Review
Testimonial
BlogPost
Category
Media
Notification
Favorite
```

Relations principales :

```text
Customer
 ├── Appointments
 ├── Orders
 ├── Quotes
 ├── MeasurementProfiles
 ├── PatternProjects
 ├── Favorites
 └── Reviews

Creation
 ├── Collection
 ├── Category
 ├── Media
 └── Favorites

PatternProject
 ├── Customer
 ├── MeasurementProfile
 ├── PatternVersions
 ├── PatternPieces
 └── PatternExports
```

---

# 97. Statuts principaux

## Rendez-vous

```text
PENDING
CONFIRMED
COMPLETED
CANCELLED
NO_SHOW
```

## Commande

```text
PENDING
CONFIRMED
PAID
IN_PRODUCTION
READY
DELIVERED
CANCELLED
REFUNDED
```

## Devis

```text
DRAFT
SENT
VIEWED
ACCEPTED
REJECTED
EXPIRED
```

## Patron

```text
DRAFT
GENERATING
GENERATED
REVIEW_REQUIRED
CORRECTION_REQUIRED
VALIDATED
EXPORTED
ARCHIVED
```

---

# 98. Expérience utilisateur

Le principe général :

> **Le moins de friction possible.**

Exemples :

Au lieu de :

```text
10 champs avant de prendre rendez-vous
```

préférer :

```text
Type de création
→ Date
→ Coordonnées
→ Confirmation
```

Puis demander les informations complémentaires plus tard si nécessaire.

---

# 99. CTA principaux

Le site doit toujours orienter vers quelques actions principales :

### CTA primaire

**Prendre rendez-vous**

### CTA secondaire

**Découvrir nos créations**

### CTA Premium

**Créer mon patron**

### CTA commercial

**Réserver pour essayage**

---

# 100. Philosophie UX

L'utilisateur doit toujours savoir :

1. Où il se trouve.
2. Ce qu'il peut faire.
3. Quelle est l'étape suivante.
4. Comment revenir en arrière.
5. Comment contacter Angaly.

Les formulaires doivent être courts et progressifs.

---

# 101. MVP recommandé

Le MVP ne doit pas essayer de tout développer immédiatement.

## Phase 1 — Présence digitale

- Accueil ;
- La Une ;
- Réalisations ;
- Collections ;
- À propos ;
- Ateliers ;
- Contact ;
- SEO ;
- Multilingue ;
- WhatsApp.

## Phase 2 — Conversion

- compte client ;
- rendez-vous ;
- catalogue ;
- réservation ;
- favoris ;
- témoignages ;
- devis.

## Phase 3 — Production

- commandes ;
- paiements ;
- suivi de confection ;
- espace client ;
- notifications ;
- back-office complet.

## Phase 4 — Premium

- profil mesures ;
- Pattern Studio ;
- moteur de patron ;
- génération ;
- export ;
- validation Angaly.

## Phase 5 — IA avancée

- assistant IA ;
- recommandations ;
- inspiration par photo ;
- scan corporel ;
- visualisation 3D ;
- essayage virtuel.

---

# 102. Priorités fonctionnelles

| Fonctionnalité | Priorité |
|---|---|
| Accueil premium | Essentiel |
| La Une | Essentiel |
| Réalisations | Essentiel |
| Collections | Important |
| Prêt-à-porter | Essentiel |
| Sur mesure | Essentiel |
| Rendez-vous | Essentiel |
| Ateliers | Essentiel |
| Espace client | Important |
| Commandes | Important |
| Devis | Important |
| Patron Premium | Différenciateur |
| Assistant IA | Différenciateur |
| Journal | SEO |
| Avis | Important |
| Back-office | Essentiel |

---

# 103. Les trois piliers d'Angaly

## Pilier 1 — La Maison de Couture

```text
La Une
Collections
Réalisations
Histoire
Savoir-faire
```

Objectif :

> construire la marque.

## Pilier 2 — L'Atelier

```text
Rendez-vous
Mesures
Devis
Confection
Essayage
Suivi
Livraison
```

Objectif :

> transformer les visiteurs en clients.

## Pilier 3 — Angaly Pattern Studio

```text
Conception
Mesures
IA
Pattern Engine
Validation
Export
```

Objectif :

> créer un avantage technologique et commercial différenciant.

---

# 104. Vision finale du produit

```text
                         ANGALY
                           │
          ┌────────────────┼────────────────┐
          │                │                │
       Vitrine          Boutique        Premium
          │                │                │
     Réalisations       Produits       Pattern Studio
     La Une             Panier         Mesures
     Collections        Commandes      Design
     Journal            Livraison      Génération
          │                │            Validation
          └────────────────┼────────────────┘
                           │
                     Espace Client
                           │
             ┌─────────────┼─────────────┐
             │             │             │
        Rendez-vous     Commandes      Créations
             │             │             │
             └─────────────┼─────────────┘
                           │
                      Back-office
                           │
          ┌────────────────┼────────────────┐
          │                │                │
       Clients         Production       Contenu
          │                │                │
       Mesures          Patrons         Réalisations
       RDV              Confection      Collections
       Historique       Essayages       Blog
```

---

# 105. Recommandation finale

Angaly doit être pensé comme une **plateforme de maison de couture**, et non comme un simple site catalogue.

La différenciation doit reposer sur :

1. **Une image de marque premium.**
2. **La Une**, qui met constamment les plus belles créations en avant.
3. **Une galerie exceptionnelle**, qui raconte le savoir-faire.
4. **Un parcours sur mesure complet**, de l'idée à la livraison.
5. **Un espace client**, permettant de suivre les projets.
6. **Angaly Pattern Studio**, avec génération de patron paramétrique assistée par IA.
7. **Une validation professionnelle par Angaly**, afin de transformer la technologie en véritable service de couture.
8. **Un back-office complet**, permettant à la maison de couture de gérer son activité.
9. **Une architecture technique évolutive**, capable d'accueillir plus tard une application mobile, du scan corporel et de la visualisation 3D.

Le point le plus important techniquement est de ne pas faire dépendre la précision du patron uniquement d'un LLM. Le système Premium doit combiner :

```text
IA
+
Règles de patronage
+
Moteur géométrique paramétrique
+
Mesures client
+
Validation professionnelle
```

Cela donne à Angaly une fonctionnalité beaucoup plus sérieuse, exploitable commercialement et extensible dans le futur.
