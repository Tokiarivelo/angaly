export const CHECKOUT_QUERY_KEYS = {
  order: (orderId: string | null) => ['checkout', 'order', orderId] as const,
};
