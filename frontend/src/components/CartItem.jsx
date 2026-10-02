import { Minus, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useShop } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { errMsg, money } from '../services/api';
import ProductImage from './ProductImage';

export default function CartItem({ item }) {
  const { updateQty, removeItem } = useShop();
  const notify = useToast();
  const p = item.product;
  const run = async (fn) => { try { await fn(); } catch (e) { notify(errMsg(e), 'error'); } };

  return (
    <div className="cart-item">
      <Link to={`/products/${p.id}`} className="ci-img"><ProductImage product={p} /></Link>
      <div className="ci-info">
        <Link to={`/products/${p.id}`}><b>{p.name}</b></Link>
        <small>{p.category_name}</small>
        <div className="price"><b>{money(p.final_price)}</b>{p.discount_percent > 0 && <s>{money(p.price)}</s>}</div>
      </div>
      <div className="qty">
        <button aria-label="Decrease" disabled={item.quantity <= 1} onClick={() => run(() => updateQty(item.id, item.quantity - 1))}><Minus size={14} /></button>
        <span>{item.quantity}</span>
        <button aria-label="Increase" disabled={item.quantity >= p.stock} onClick={() => run(() => updateQty(item.id, item.quantity + 1))}><Plus size={14} /></button>
      </div>
      <b className="ci-total">{money(item.line_total)}</b>
      <button className="icon-btn danger" aria-label="Remove" onClick={() => run(() => removeItem(item.id))}><Trash2 size={18} /></button>
    </div>
  );
}
