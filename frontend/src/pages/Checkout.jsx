import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { api, errMsg, fieldErrors, money } from '../services/api';
import { Summary } from './Cart';

const FIELDS = [['full_name', 'Full Name'], ['phone', 'Phone Number'], ['email', 'Email'], ['address', 'Address'],
  ['city', 'City'], ['state', 'State'], ['pincode', 'Pincode']];

export default function Checkout() {
  const { user } = useAuth();
  const { cart, refresh } = useShop();
  const notify = useToast();
  const nav = useNavigate();
  const a = user.address || {};
  const [f, setF] = useState({ full_name: user.full_name || '', phone: user.phone || '', email: user.email || '',
    address: a.line1 || '', city: a.city || '', state: a.state || '', pincode: a.pincode || '',
    payment_method: 'COD', age_confirmed: false });
  const [errs, setErrs] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { refresh(); }, []);

  if (!cart.items.length && !busy) {
    return <div className="container empty"><div className="big">🛒</div><h2>Your cart is empty</h2><Link to="/products" className="btn btn-primary">Browse Products</Link></div>;
  }

  const submit = async (e) => {
    e.preventDefault(); setError(''); setErrs({});
    const local = {};
    FIELDS.forEach(([k, l]) => { if (!String(f[k]).trim()) local[k] = `${l} is required.`; });
    if (Object.keys(local).length) return setErrs(local);
    setBusy(true);
    try {
      const { data } = await api.post('/orders/', f);
      await refresh();
      notify(`Order ${data.order_number} placed!`);
      nav(`/orders/${data.id}`, { replace: true, state: { placed: true } });
    } catch (err) {
      const fe = fieldErrors(err);
      if (Object.keys(fe).length) setErrs(fe);
      setError(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <div className="container page">
      <h1>Checkout</h1>
      <form className="cart-layout" onSubmit={submit} noValidate>
        <div className="card">
          <h3>Delivery Details</h3>
          {error && <div className="alert error">{error}</div>}
          <div className="form-grid">
            {FIELDS.map(([k, l]) => (
              <label key={k} className={`field ${k === 'address' ? 'span2' : ''} ${errs[k] ? 'has-error' : ''}`}>{l}
                <input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
                {errs[k] && <small className="err">{errs[k]}</small>}
              </label>
            ))}
          </div>
          <h3>Payment</h3>
          <label className="radio"><input type="radio" name="pay" checked={f.payment_method === 'COD'} onChange={() => setF({ ...f, payment_method: 'COD' })} /> Cash on Delivery</label>
          <label className="radio"><input type="radio" name="pay" checked={f.payment_method === 'ONLINE'} onChange={() => setF({ ...f, payment_method: 'ONLINE' })} /> Online Payment <small className="muted">(placeholder - no payment is taken yet)</small></label>
          <label className={`check legal ${errs.age_confirmed ? 'has-error' : ''}`}>
            <input type="checkbox" checked={f.age_confirmed} onChange={(e) => setF({ ...f, age_confirmed: e.target.checked })} />
            I confirm I meet the legal age requirement, that fireworks are permitted where I live, and that I will follow local laws and the manufacturer's safety instructions.
          </label>
          {errs.age_confirmed && <small className="err">{errs.age_confirmed}</small>}
        </div>
        <div>
          <div className="summary">
            <h3>Your Items</h3>
            {cart.items.map((i) => <div key={i.id} className="srow"><span>{i.product.name} × {i.quantity}</span><span>{money(i.line_total)}</span></div>)}
          </div>
          <Summary cart={cart} />
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Placing order...' : `Place Order · ${money(cart.total)}`}</button>
        </div>
      </form>
    </div>
  );
}
