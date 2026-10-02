import { Heart, Minus, Plus, ShieldAlert, ShoppingCart, Star, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Loading, { ErrorBox } from '../components/Loading';
import ProductCard from '../components/ProductCard';
import ProductImage from '../components/ProductImage';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { api, errMsg, money } from '../services/api';
import NotFound from './NotFound';

export default function ProductDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart, toggleWish, wishIds } = useShop();
  const notify = useToast();
  const nav = useNavigate();
  const loc = useLocation();
  const [p, setP] = useState(null);
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    setState('loading'); setQty(1); window.scrollTo(0, 0);
    api.get(`/products/${id}/`).then((r) => {
      setP(r.data); setState('ok');
      api.get('/products/', { params: { category: r.data.category, limit: 5 } })
        .then((x) => setRelated(x.data.filter((i) => i.id !== r.data.id).slice(0, 4))).catch(() => {});
    }).catch((e) => { if (e.response?.status === 404) setState('404'); else { setError(errMsg(e)); setState('error'); } });
  }, [id]);

  if (state === 'loading') return <Loading full />;
  if (state === '404') return <NotFound title="Product not found" text="This product may have been removed." />;
  if (state === 'error') return <div className="container page"><ErrorBox message={error} /></div>;

  const guard = async (fn, ok) => {
    if (!user) return nav('/login', { state: { from: loc.pathname } });
    try { await fn(); if (ok) notify(ok); return true; } catch (e) { notify(errMsg(e), 'error'); return false; }
  };
  const wished = wishIds.includes(p.id);

  return (
    <div className="container page">
      <div className="detail">
        <div className="detail-img"><ProductImage product={p} />{p.discount_percent > 0 && <span className="badge off-badge">{p.discount_percent}% OFF</span>}</div>
        <div className="detail-info">
          <span className="cat">{p.category_name}</span>
          <h1>{p.name}</h1>
          <div className="rating"><Star size={16} fill="currentColor" /> {Number(p.rating).toFixed(1)} <span className="muted">({p.rating_count} ratings)</span></div>
          <div className="price big">
            <b>{money(p.final_price)}</b>
            {p.discount_percent > 0 && <><s>{money(p.price)}</s><em>{p.discount_percent}% off</em></>}
          </div>
          <p className={`stock ${p.in_stock ? (p.stock <= 10 ? 'low' : 'in') : 'out'}`}>
            {p.in_stock ? `${p.stock} available` : 'Out of stock'}</p>
          <p>{p.description}</p>
          <div className="buy-row">
            <div className="qty">
              <button onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={14} /></button>
              <span>{qty}</span>
              <button onClick={() => setQty(Math.min(p.stock, qty + 1))}><Plus size={14} /></button>
            </div>
            <button className="btn btn-primary" disabled={!p.in_stock} onClick={() => guard(() => addToCart(p.id, qty), 'Added to cart')}><ShoppingCart size={18} /> Add to Cart</button>
            <button className="btn btn-gold" disabled={!p.in_stock} onClick={async () => { if (await guard(() => addToCart(p.id, qty))) nav('/checkout'); }}><Zap size={18} /> Buy Now</button>
            <button className={`btn btn-outline ${wished ? 'on' : ''}`} onClick={() => guard(() => toggleWish(p.id))}><Heart size={18} fill={wished ? 'currentColor' : 'none'} /> Wishlist</button>
          </div>
        </div>
      </div>

      <div className="info-grid">
        <div className="card">
          <h3>Product Specifications</h3>
          {p.spec_list.length ? <table className="specs"><tbody>{p.spec_list.map((s) => <tr key={s.label}><th>{s.label}</th><td>{s.value}</td></tr>)}</tbody></table> : <p className="muted">No specifications listed.</p>}
        </div>
        <div className="card safety">
          <h3><ShieldAlert size={20} /> Safety Information</h3>
          <p>{p.safety_info}</p>
        </div>
      </div>

      {!!related.length && (
        <section className="section"><div className="section-head"><h2>Related Products</h2></div>
          <div className="grid-products">{related.map((r) => <ProductCard key={r.id} product={r} />)}</div></section>
      )}
    </div>
  );
}
