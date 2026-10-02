import { CheckCircle, Clock, IndianRupee, Package, ShoppingBag, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Loading, { ErrorBox } from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import { api, dateFmt, errMsg, money } from '../services/api';
import { Status } from './Orders';

function useDashboard() {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const load = () => { setError(''); api.get('/admin/dashboard/').then((r) => setD(r.data)).catch((e) => setError(errMsg(e))); };
  useEffect(load, []);
  return { d, error, load };
}

function Bars({ days }) {
  const max = Math.max(1, ...days.map((x) => x.sales));
  return (
    <div className="bars">
      {days.map((x) => (
        <div key={x.date} className="bar-col" title={`${x.orders} orders`}>
          <small>{x.sales ? money(x.sales) : ''}</small>
          <div className="bar" style={{ height: `${(x.sales / max) * 100}%` }} />
          <span>{new Date(x.date).toLocaleDateString('en-IN', { weekday: 'short' })}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const { d, error, load } = useDashboard();
  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!d) return <Loading />;
  const cards = [[Package, 'Total Products', d.total_products], [Users, 'Total Customers', d.total_customers],
    [ShoppingBag, 'Total Orders', d.total_orders], [Clock, 'Pending Orders', d.pending_orders],
    [CheckCircle, 'Completed Orders', d.completed_orders], [IndianRupee, 'Total Sales', money(d.total_sales)]];
  return (
    <>
      <h1>Dashboard</h1>
      <div className="stats">{cards.map(([Icon, l, v]) => <div key={l} className="stat"><Icon size={22} /><small>{l}</small><b>{v}</b></div>)}</div>
      <div className="admin-grid">
        <div className="card"><h3>Sales Overview (last 7 days)</h3><Bars days={d.sales_overview} /></div>
        <div className="card"><h3>Low-Stock Products</h3>
          {d.low_stock.length ? d.low_stock.map((p) => <div key={p.id} className="srow"><span>{p.name}</span><b className={p.stock === 0 ? 'text-red' : 'text-orange'}>{p.stock} left</b></div>) : <p className="muted">All products are well stocked.</p>}
          <Link to="/admin/inventory">Manage inventory →</Link></div>
      </div>
      <div className="admin-grid">
        <div className="card"><h3>Recent Orders</h3>
          <div className="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Total</th></tr></thead>
            <tbody>{d.recent_orders.map((o) => <tr key={o.id}><td>{o.order_number}</td><td>{o.full_name}</td><td><Status s={o.status} /></td><td>{money(o.total)}</td></tr>)}</tbody></table></div></div>
        <div className="card"><h3>Recent Customers</h3>
          {d.recent_customers.map((c) => <div key={c.id} className="srow"><span>{c.full_name || c.username}<br /><small className="muted">{c.email}</small></span><small>{dateFmt(c.date_joined)}</small></div>)}
          {!d.recent_customers.length && <p className="muted">No customers yet.</p>}</div>
      </div>
    </>
  );
}

export function AdminReports() {
  const { d, error, load } = useDashboard();
  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!d) return <Loading />;
  return (
    <>
      <h1>Sales Reports</h1>
      <div className="admin-grid">
        <div className="card"><h3>Daily Sales (last 7 days)</h3>
          <div className="table-wrap"><table><thead><tr><th>Date</th><th>Orders</th><th>Sales</th></tr></thead>
            <tbody>{d.sales_overview.map((x) => <tr key={x.date}><td>{x.date}</td><td>{x.orders}</td><td>{money(x.sales)}</td></tr>)}</tbody></table></div></div>
        <div className="card"><h3>Orders by Status</h3>
          {Object.entries(d.orders_by_status).map(([s, c]) => <div key={s} className="srow"><Status s={s} /><b>{c}</b></div>)}
          <div className="srow total"><span>Total sales (excl. cancelled)</span><span>{money(d.total_sales)}</span></div></div>
      </div>
    </>
  );
}

export function AdminSettings() {
  const { user } = useAuth();
  return (
    <>
      <h1>Settings</h1>
      <div className="card">
        <h3>Admin account</h3>
        <dl className="dl"><dt>Name</dt><dd>{user.full_name}</dd><dt>Username</dt><dd>{user.username}</dd><dt>Email</dt><dd>{user.email}</dd></dl>
        <p className="muted">Change your password from <Link to="/profile">your profile</Link>. Delivery charge (₹60, free from ₹999) and the low-stock
          limit (10) are set in <code>backend/cart/utils.py</code> and <code>backend/api/views.py</code>. Advanced management: <a href="http://127.0.0.1:8000/admin/" target="_blank" rel="noreferrer">Django admin</a>.</p>
      </div>
    </>
  );
}
