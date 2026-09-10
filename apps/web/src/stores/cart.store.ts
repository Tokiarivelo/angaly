import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Session-only cart (localStorage-persisted) — `POST /api/cart/items` and
 * server-side sync are explicitly out of scope for `products` (deferred to
 * `orders`, Phase 3 — see docs/features/products.md "Points d'attention").
 * A signed-in visitor's cart still only lives here for now; nothing is sent
 * to apps/api until that module exists (docs/pages/fiche-produit.md:
 * "le panier en session/localStorage via Zustand, la synchronisation
 * serveur n'intervenant qu'à la connexion/au checkout").
 */
export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  sku: string;
  size: string;
  color: string;
  imageUrl: string | null;
  priceAmount: string;
  currency: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((line) => line.variantId === item.variantId);
          if (existing) {
            return {
              items: state.items.map((line) =>
                line.variantId === item.variantId ? { ...line, quantity: line.quantity + item.quantity } : line,
              ),
            };
          }
          return { items: [...state.items, item] };
        }),
      removeItem: (variantId) => set((state) => ({ items: state.items.filter((line) => line.variantId !== variantId) })),
      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          items: state.items.map((line) => (line.variantId === variantId ? { ...line, quantity } : line)),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: 'angaly-cart' },
  ),
);
