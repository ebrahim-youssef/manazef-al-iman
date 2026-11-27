import { useEffect, useMemo, useReducer } from 'react';
import { CartContext } from './cart-context';
import { MAX_CART_ITEMS, MAX_ITEM_QUANTITY } from '../checkout/cartLimits';
const STORAGE_KEY = 'iman-cart';

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.id === 'string' && item.id.length > 0
      && Number.isInteger(item.quantity) && item.quantity > 0)
      .slice(0, MAX_CART_ITEMS).map(({ id, quantity }) => ({ id, quantity: Math.min(quantity, MAX_ITEM_QUANTITY) }));
  } catch {
    return [];
  }
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'LOAD':
      return { items: action.payload, hasLoaded: true };
    case 'ADD': {
      const { product, quantity = 1 } = action.payload;
      const existing = state.items.find((i) => i.id === product.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === product.id ? { ...i, quantity: Math.min(MAX_ITEM_QUANTITY, i.quantity + quantity) } : i,
          ),
        };
      }
      if (state.items.length >= MAX_CART_ITEMS) return state;
      return {
        ...state,
        items: [
          ...state.items,
          { id: product.id, quantity: Math.min(MAX_ITEM_QUANTITY, Math.max(1, quantity)) },
        ],
      };
    }
    case 'REMOVE':
      return { ...state, items: state.items.filter((i) => i.id !== action.payload.id) };
    case 'UPDATE_QTY': {
      const { id, quantity } = action.payload;
      if (quantity <= 0) return { ...state, items: state.items.filter((i) => i.id !== id) };
      return { ...state, items: state.items.map((i) => (i.id === id ? { ...i, quantity: Math.min(MAX_ITEM_QUANTITY, quantity) } : i)) };
    }
    case 'CLEAR':
      return { ...state, items: [] };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [{ items, hasLoaded }, dispatch] = useReducer(cartReducer, { items: [], hasLoaded: false });

  useEffect(() => {
    dispatch({ type: 'LOAD', payload: loadCart() });
  }, []);

  useEffect(() => {
    if (hasLoaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [hasLoaded, items]);

  const value = useMemo(() => {
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    return {
      items,
      hasLoaded,
      itemCount,
      addItem: (product, quantity = 1) => dispatch({ type: 'ADD', payload: { product, quantity } }),
      removeItem: (id) => dispatch({ type: 'REMOVE', payload: { id } }),
      updateQty: (id, quantity) => dispatch({ type: 'UPDATE_QTY', payload: { id, quantity } }),
      clearCart: () => {
        localStorage.setItem(STORAGE_KEY, '[]');
        dispatch({ type: 'CLEAR' });
      },
    };
  }, [hasLoaded, items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
