import { setupServer } from 'msw/node';

import { aProposHandlers } from './handlers/a-propos.handlers';
import { atelierDetailHandlers } from './handlers/atelier-detail.handlers';
import { authentificationHandlers } from './handlers/authentification.handlers';
import { categoriesHandlers } from './handlers/categories.handlers';
import { collectionDetailHandlers } from './handlers/collection-detail.handlers';
import { collectionsListeHandlers } from './handlers/collections-liste.handlers';
import { confirmationRendezVousHandlers } from './handlers/confirmation-rendez-vous.handlers';
import { contactHandlers } from './handlers/contact.handlers';
import { creationDetailHandlers } from './handlers/creation-detail.handlers';
import { demandeSurMesureHandlers } from './handlers/demande-sur-mesure.handlers';
import { ficheProduitHandlers } from './handlers/fiche-produit.handlers';
import { homeHandlers } from './handlers/home.handlers';
import { journalArticleHandlers } from './handlers/journal-article.handlers';
import { journalListeHandlers } from './handlers/journal-liste.handlers';
import { laUneHandlers } from './handlers/la-une.handlers';
import { nosAteliersListeHandlers } from './handlers/nos-ateliers-liste.handlers';
import { nosCreationsGalerieHandlers } from './handlers/nos-creations-galerie.handlers';
import { page404Handlers } from './handlers/page-404.handlers';
import { prendreRendezVousHandlers } from './handlers/prendre-rendez-vous.handlers';
import { reservationEssayageHandlers } from './handlers/reservation-essayage.handlers';
import { pretAPorterCatalogueHandlers } from './handlers/pret-a-porter-catalogue.handlers';

/** Registered here per feature as each one starts calling a real/mocked API — see docs/testing.md. */
export const server = setupServer(
  ...homeHandlers,
  ...aProposHandlers,
  ...laUneHandlers,
  ...nosCreationsGalerieHandlers,
  ...nosAteliersListeHandlers,
  ...atelierDetailHandlers,
  ...journalListeHandlers,
  ...journalArticleHandlers,
  ...page404Handlers,
  ...creationDetailHandlers,
  ...collectionDetailHandlers,
  ...collectionsListeHandlers,
  ...contactHandlers,
  ...categoriesHandlers,
  ...authentificationHandlers,
  ...pretAPorterCatalogueHandlers,
  ...ficheProduitHandlers,
  ...prendreRendezVousHandlers,
  ...confirmationRendezVousHandlers,
  ...reservationEssayageHandlers,
  ...demandeSurMesureHandlers,
);
