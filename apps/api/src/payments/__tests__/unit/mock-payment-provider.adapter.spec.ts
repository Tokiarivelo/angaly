import { MockPaymentProviderAdapter } from '../../infrastructure/services/mock-payment-provider.adapter';

describe('MockPaymentProviderAdapter', () => {
  it('initiatePayment() returns a generated transactionRef that never requires manual confirmation', async () => {
    const adapter = new MockPaymentProviderAdapter();

    const result = await adapter.initiatePayment('order-1', 1000);

    expect(result.transactionRef).toMatch(/^mock-txn-/);
    expect(result.requiresManualConfirmation).toBe(false);
  });

  it('confirmPayment() always succeeds', async () => {
    const adapter = new MockPaymentProviderAdapter();
    await expect(adapter.confirmPayment('txn-1')).resolves.toBe(true);
  });

  it('refund() always succeeds', async () => {
    const adapter = new MockPaymentProviderAdapter();
    await expect(adapter.refund('txn-1', 1000)).resolves.toBe(true);
  });
});
