import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { errMsg, money } from '../services/api';
import ProductImage from './ProductImage';

export default function ProductCard({ product: p }) {
  const { user } = useAuth();
  const { addToCart, toggleWish, wishIds } = useShop();
  const notify = useToast();
  const nav = useNavigate();
  const loc = useLocation();
  const wished = wishIds.includes(p.id);

  const guard = async (fn, ok) => {
    if (!user) return nav('/login', { state: { from: loc.pathname + loc.search } });
    try { const r = await fn(); notify(typeof ok === 'function' ? ok(r) : ok); } catch (e) { notify(errMsg(e), 'error'); }
  };

  return (
    <div className="pcard">
      <div className="pimg">
        <Link to={`/products/${p.id}`}><ProductImage product={p} /></Link>
        {p.discount_percent > 0 && <span className="badge off-badge">{p.discount_percent}% OFF</span>}
        <button className={`wish ${wished ? 'on' : ''}`} aria-label="Wishlist"
          onClick={() => guard(() => toggleWish(p.id), (added) => (added ? 'Added to wishlist' : 'Removed from wishlist'))}>
          <Heart size={18} fill={wished ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="pbody">
        <span className="cat">{p.category_name}</span>
        <Link to={`/products/${p.id}`} className="pname">{p.name}</Link>
        <div className="rating"><Star size={14} fill="currentColor" /> {Number(p.rating).toFixed(1)}
          <span className={`stock ${p.in_stock ? (p.stock <= 10 ? 'low' : 'in') : 'out'}`}>
            {p.in_stock ? (p.stock <= 10 ? `Only ${p.stock} left` : 'In stock') : 'Out of stock'}
          </span>
        </div>
        <div className="price">
          <b>{money(p.final_price)}</b>
          {p.discount_percent > 0 && <><s>{money(p.price)}</s><em>{p.discount_percent}% off</em></>}
        </div>
        <div className="pactions">
          <button className="btn btn-primary btn-sm" disabled={!p.in_stock}
            onClick={() => guard(() => addToCart(p.id, 1), 'Added to cart')}>
            <ShoppingCart size={16} /> Add to Cart
          </button>
          <Link className="btn btn-outline btn-sm" to={`/products/${p.id}`}>View Details</Link>
        </div>
      </div>
    </div>
  );
}
