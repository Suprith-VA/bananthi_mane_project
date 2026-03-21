import { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState({});   // { [name]: { price, quantity } }

  const addToCart = useCallback((name, price) => {
    setCart(prev => ({
      ...prev,
      [name]: {
        price,
        quantity: (prev[name]?.quantity ?? 0) + 1,
      },
    }));
  }, []);

  const removeOne = useCallback((name) => {
    setCart(prev => {
      const entry = prev[name];
      if (!entry) return prev;
      if (entry.quantity <= 1) {
        const { [name]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [name]: { ...entry, quantity: entry.quantity - 1 } };
    });
  }, []);

  const removeAll = useCallback((name) => {
    setCart(prev => {
      const { [name]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const totalItems = Object.values(cart).reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = Object.values(cart).reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeOne, removeAll, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
