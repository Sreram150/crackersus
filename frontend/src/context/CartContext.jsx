import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const EMPTY = { items: [], item_count: 0, subtotal: 0, discount: 0, delivery_charge: 0, total: 0 };
const CartCtx = createContext(null);
export const useShop = () => useContext(CartCtx);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(EMPTY);
  const [wishItems, setWishItems] = useState([]);
  const [wishIds, setWishIds] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);

  const setWish = (d) => { setWishItems(d.items); setWishIds(d.product_ids); };

  const refresh = useCallback(async () => {
    if (!user) { setCart(EMPTY); setWish({ items: [], product_ids: [] }); return; }
    setCartLoading(true);
    try {
      const [c, w] = await Promise.all([api.get('/cart/'), api.get('/wishlist/')]);
      setCart(c.data); setWish(w.data);
    } catch { /* surfaced by pages that need it */ } finally { setCartLoading(false); }
  }, [user?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const addToCart = async (productId, quantity = 1) => setCart((await api.post('/cart/', { product_id: productId, quantity })).data);
  const updateQty = async (itemId, quantity) => setCart((await api.put(`/cart/${itemId}/`, { quantity })).data);
  const removeItem = async (itemId) => setCart((await api.delete(`/cart/${itemId}/`)).data);
  const toggleWish = async (productId) => {
    const r = wishIds.includes(productId) ? await api.delete(`/wishlist/${productId}/`) : await api.post('/wishlist/', { product_id: productId });
    setWish(r.data);
    return !wishIds.includes(productId);
  };

  return (
    <CartCtx.Provider value={{ cart, cartCount: cart.item_count, wishItems, wishIds, wishCount: wishIds.length,
      cartLoading, refresh, addToCart, updateQty, removeItem, toggleWish }}>
      {children}
    </CartCtx.Provider>
  );
}
