import { mergeConfig } from 'vitest/config';

import { baseVitestConfig } from '@angaly/vitest-config';

export default mergeConfig(baseVitestConfig, {
  test: {
    environment: 'node',
  },
});
