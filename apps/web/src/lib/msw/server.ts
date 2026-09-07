import { setupServer } from 'msw/node';

import { collectionDetailHandlers } from './handlers/collection-detail.handlers';
import { creationDetailHandlers } from './handlers/creation-detail.handlers';
import { homeHandlers } from './handlers/home.handlers';
import { laUneHandlers } from './handlers/la-une.handlers';

/** Registered here per feature as each one starts calling a real/mocked API — see docs/testing.md. */
export const server = setupServer(
  ...homeHandlers,
  ...laUneHandlers,
  ...creationDetailHandlers,
  ...collectionDetailHandlers,
);
