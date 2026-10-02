import { Fragment, useEffect, useState } from 'react';
import Loading, { ErrorBox } from '../components/Loading';
import { useToast } from '../context/ToastContext';
import { api, dateFmt, errMsg, money } from '../services/api';
import { Status } from './Orders';

const STATUSES = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];

export default function AdminOrders() {
  const notify = useToast();
  const [orders, setOrders] = useState(null);
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(null);
  const [error, setError] = useState('');

  const load = () => { setError(''); api.get('/admin/orders/', { params: { status: filter || undefined } })
    .then((r) => setOrders(r.data)).catch((e) => setError(errMsg(e))); };
  useEffect(load, [filter]);

  const setStatus = async (o, status) => {
    try { const r = await api.put(`/orders/${o.id}/`, { status }); setOrders(orders.map((x) => (x.id === o.id ? r.data : x))); notify(`${o.order_number} → ${status}`); }
    catch (e) { notify(errMsg(e), 'error'); }
  };

  return (
    <>
      <div className="section-head"><h1>Orders</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
      <ErrorBox message={error} onRetry={load} />
      {!orders && !error ? <Loading /> : (
        <div className="card table-wrap"><table>
          <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th><th>Update</th></tr></thead>
          <tbody>
            {orders?.map((o) => (
              <Fragment key={o.id}>
                <tr>
                  <td><button className="link" onClick={() => setOpen(open === o.id ? null : o.id)}>{o.order_number}</button></td>
                  <td>{o.full_name}<br /><small className="muted">{o.phone}</small></td><td>{dateFmt(o.created_at)}</td><td>{money(o.total)}</td>
                  <td>{o.payment_method} · {o.payment_status}</td><td><Status s={o.status} /></td>
                  <td><select value={o.status} disabled={o.status === 'Cancelled'} onChange={(e) => setStatus(o, e.target.value)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></td>
                </tr>
                {open === o.id && <tr className="detail-row"><td colSpan="7">
                  {o.items.map((i) => <div key={i.id}>{i.product_name} × {i.quantity} - {money(i.line_total)}</div>)}
                  <small className="muted">{o.address}, {o.city}, {o.state} - {o.pincode} · {o.email}</small></td></tr>}
              </Fragment>
            ))}
            {orders?.length === 0 && <tr><td colSpan="7" className="center muted">No orders found.</td></tr>}
          </tbody></table></div>
      )}
    </>
  );
}
