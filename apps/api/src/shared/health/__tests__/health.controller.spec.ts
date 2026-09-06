import { HealthController } from '../health.controller';

describe('HealthController', () => {
  it('returns status ok with a timestamp and the current environment', () => {
    const controller = new HealthController();

    const result = controller.check();

    expect(result.status).toBe('ok');
    expect(new Date(result.timestamp).toString()).not.toBe('Invalid Date');
    expect(result.environment).toBe(process.env['NODE_ENV'] ?? 'development');
  });
});
