import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

/* ── Storage helpers ──────────────────────────────────────────
   Guest  → localStorage key: bananthi_cart_guest
   User   → localStorage key: bananthi_cart_<userId>
   ──────────────────────────────────────────────────────────── */
function storageKey(userId) {
  return userId ? `bananthi_cart_${userId}` : 'bananthi_cart_guest';
}

function loadCart(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw) return JSON.parse(raw);
  } catch { /* corrupt data — start fresh */ }
  return {};
}

function saveCart(userId, cart) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(cart));
  } catch { /* quota exceeded — silent */ }
}

/*
  Cart shape:
  {
    [cartKey]: {
      productId, variantId, name, unitLabel, price, quantity, image
    }
  }

  cartKey = `${productId}_${variantId}` when variant exists,
            or `${productId}_base` when no variants.
*/
function cartKey(productId, variantId) {
  return `${productId}_${variantId || 'base'}`;
}

export function CartProvider({ children }) {
  const { userInfo } = useAuth();
  const userId = userInfo?._id || userInfo?.id || null;
  const prevUserRef = useRef(userId);

  const [cart, setCart] = useState(() => loadCart(userId));
  const [isOpen, setIsOpen] = useState(false);

  /* When auth state changes (login / logout / switch user),
     reload that identity's cart from localStorage */
  useEffect(() => {
    if (prevUserRef.current !== userId) {
      prevUserRef.current = userId;
      setCart(loadCart(userId));
    }
  }, [userId]);

  /* Persist cart to localStorage whenever it changes */
  useEffect(() => {
    saveCart(userId, cart);
  }, [cart, userId]);

  const addToCart = useCallback((item) => {
    const key = cartKey(item.productId, item.variantId);
    setCart(prev => ({
      ...prev,
      [key]: {
        productId: item.productId,
        variantId: item.variantId || null,
        name: item.name,
        unitLabel: item.unitLabel || null,
        price: item.price,
        image: item.image || null,
        quantity: (prev[key]?.quantity ?? 0) + 1,
      },
    }));
  }, []);

  const removeOne = useCallback((key) => {
    setCart(prev => {
      const entry = prev[key];
      if (!entry) return prev;
      if (entry.quantity <= 1) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: { ...entry, quantity: entry.quantity - 1 } };
    });
  }, []);

  const removeAll = useCallback((key) => {
    setCart(prev => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart({});
  }, []);

  const totalItems = Object.values(cart).reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = Object.values(cart).reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeOne, removeAll, clearCart,
      totalItems, totalPrice,
      isOpen, setIsOpen,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
