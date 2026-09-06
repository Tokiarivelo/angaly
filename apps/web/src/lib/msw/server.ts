import { setupServer } from 'msw/node';

import { homeHandlers } from './handlers/home.handlers';

/** Registered here per feature as each one starts calling a real/mocked API — see docs/testing.md. */
export const server = setupServer(...homeHandlers);
