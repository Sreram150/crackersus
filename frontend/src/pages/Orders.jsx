import { CheckCircle2, Circle, PackageCheck, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Loading, { ErrorBox } from '../components/Loading';
import { useToast } from '../context/ToastContext';
import { api, dateFmt, errMsg, money } from '../services/api';
import NotFound from './NotFound';

const STEPS = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];
export const Status = ({ s }) => <span className={`status ${s.toLowerCase()}`}>{s}</span>;

function Detail({ id }) {
  const { state } = useLocation();
  const notify = useToast();
  const [o, setO] = useState(null);
  const [st, setSt] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/orders/${id}/`).then((r) => { setO(r.data); setSt('ok'); })
      .catch((e) => (e.response?.status === 404 ? setSt('404') : (setError(errMsg(e)), setSt('error'))));
  }, [id]);

  const cancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    try { setO((await api.put(`/orders/${id}/`, { status: 'Cancelled' })).data); notify('Order cancelled'); }
    catch (e) { notify(errMsg(e), 'error'); }
  };

  if (st === 'loading') return <Loading full />;
  if (st === '404') return <NotFound title="Order not found" text="We couldn't find that order." />;
  if (st === 'error') return <div className="container page"><ErrorBox message={error} /></div>;

  const idx = STEPS.indexOf(o.status);
  const when = (s) => o.events.find((e) => e.status === s)?.created_at;
  return (
    <div className="container page">
      {state?.placed && <div className="alert success"><PackageCheck size={18} /> Thank you! Your order has been placed.</div>}
      <div className="section-head"><h1>Order {o.order_number}</h1><Status s={o.status} /></div>
      <p className="muted">Placed on {dateFmt(o.created_at)} · {o.payment_method === 'COD' ? 'Cash on Delivery' : 'Online payment (placeholder)'}</p>

      <div className="card">
        <h3>Track Order</h3>
        {o.status === 'Cancelled' ? <div className="alert error"><XCircle size={18} /> This order was cancelled{when('Cancelled') ? ` on ${dateFmt(when('Cancelled'))}` : ''}.</div> : (
          <div className="track">
            {STEPS.map((s, i) => (
              <div key={s} className={`step ${i <= idx ? 'done' : ''}`}>
                {i <= idx ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                <b>{s}</b><small>{when(s) ? dateFmt(when(s)) : ''}</small>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="cart-layout">
        <div className="card">
          <h3>Items</h3>
          {o.items.map((i) => (
            <div key={i.id} className="srow"><span>{i.product_name} × {i.quantity}</span><span>{money(i.line_total)}</span></div>
          ))}
          <h3>Delivery Address</h3>
          <p>{o.full_name}<br />{o.address}, {o.city}, {o.state} - {o.pincode}<br />📞 {o.phone} · ✉️ {o.email}</p>
        </div>
        <div>
          <div className="summary">
            <div className="srow"><span>Subtotal</span><span>{money(o.subtotal)}</span></div>
            <div className="srow green"><span>Discount</span><span>- {money(o.discount)}</span></div>
            <div className="srow"><span>Delivery</span><span>{Number(o.delivery_charge) ? money(o.delivery_charge) : 'FREE'}</span></div>
            <div className="srow total"><span>Total</span><span>{money(o.total)}</span></div>
          </div>
          {o.can_cancel && <button className="btn btn-danger btn-block" onClick={cancel}>Cancel Order</button>}
          <Link to="/orders" className="btn btn-outline btn-block">All Orders</Link>
        </div>
      </div>
    </div>
  );
}

export default function Orders() {
  const { id } = useParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(!id);
  const [error, setError] = useState('');

  const load = () => { setLoading(true); setError('');
    api.get('/orders/').then((r) => setOrders(r.data)).catch((e) => setError(errMsg(e))).finally(() => setLoading(false)); };
  useEffect(() => { if (!id) load(); }, [id]);

  if (id) return <Detail id={id} />;
  if (loading) return <Loading full />;
  return (
    <div className="container page">
      <h1>My Orders</h1>
      <ErrorBox message={error} onRetry={load} />
      {!orders.length && !error ? (
        <div className="empty"><div className="big">📦</div><h3>No orders yet</h3><Link to="/products" className="btn btn-primary">Shop Now</Link></div>
      ) : orders.map((o) => (
        <Link key={o.id} to={`/orders/${o.id}`} className="order-row">
          <div><b>{o.order_number}</b><small>{dateFmt(o.created_at)} · {o.items.length} item(s)</small></div>
          <Status s={o.status} /><b>{money(o.total)}</b>
        </Link>
      ))}
    </div>
  );
}
