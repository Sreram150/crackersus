import { useEffect, useState } from 'react';
import Loading, { ErrorBox } from '../components/Loading';
import { api, dateFmt, errMsg, money } from '../services/api';

export default function AdminCustomers() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const load = () => { setError(''); api.get('/admin/customers/').then((r) => setRows(r.data)).catch((e) => setError(errMsg(e))); };
  useEffect(load, []);
  return (
    <>
      <h1>Customers</h1>
      <ErrorBox message={error} onRetry={load} />
      {!rows && !error ? <Loading /> : (
        <div className="card table-wrap"><table>
          <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Phone</th><th>Joined</th><th>Orders</th><th>Spent</th></tr></thead>
          <tbody>{rows?.map((c) => <tr key={c.id}><td>{c.full_name}</td><td>{c.username}</td><td>{c.email}</td><td>{c.phone}</td>
            <td>{dateFmt(c.date_joined)}</td><td>{c.order_count}</td><td>{money(c.total_spent)}</td></tr>)}
            {rows?.length === 0 && <tr><td colSpan="7" className="center muted">No customers yet.</td></tr>}</tbody></table></div>
      )}
    </>
  );
}
