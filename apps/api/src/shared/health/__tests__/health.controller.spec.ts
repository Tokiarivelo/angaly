import { HealthController } from '../health.controller';

describe('HealthController', () => {
  it('returns status ok with a timestamp and the current environment', () => {
    const controller = new HealthController();

    const result = controller.check();

    expect(result.status).toBe('ok');
    expect(new Date(result.timestamp).toString()).not.toBe('Invalid Date');
    expect(result.environment).toBe(process.env['NODE_ENV'] ?? 'development');
  });

  it('falls back to "development" when NODE_ENV is unset', () => {
    const originalNodeEnv = process.env['NODE_ENV'];
    delete process.env['NODE_ENV'];

    try {
      const controller = new HealthController();
      expect(controller.check().environment).toBe('development');
    } finally {
      if (originalNodeEnv !== undefined) {
        process.env['NODE_ENV'] = originalNodeEnv;
      }
    }
  });
});
