import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'iman-cart';

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && item.id && item.quantity > 0);
  } catch {
    return [];
  }
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const { product, quantity = 1 } = action.payload;
      const existing = state.find((i) => i.id === product.id);
      if (existing) {
        return state.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i,
        );
      }
      return [
        ...state,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          unit: product.unit,
          unitType: product.unitType,
          image: product.image,
          cartonSize: product.cartonSize,
          quantity: Math.max(1, quantity),
        },
      ];
    }
    case 'REMOVE':
      return state.filter((i) => i.id !== action.payload.id);
    case 'UPDATE_QTY': {
      const { id, quantity } = action.payload;
      if (quantity <= 0) return state.filter((i) => i.id !== id);
      return state.map((i) => (i.id === id ? { ...i, quantity } : i));
    }
    case 'CLEAR':
      return [];
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, undefined, loadCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo(() => {
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    return {
      items,
      itemCount,
      total,
      addItem: (product, quantity = 1) => dispatch({ type: 'ADD', payload: { product, quantity } }),
      removeItem: (id) => dispatch({ type: 'REMOVE', payload: { id } }),
      updateQty: (id, quantity) => dispatch({ type: 'UPDATE_QTY', payload: { id, quantity } }),
      clearCart: () => dispatch({ type: 'CLEAR' }),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
