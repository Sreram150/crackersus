import { BarChart3, Boxes, FolderTree, LayoutDashboard, LogOut, Menu, Package, Settings, ShoppingBag, Store, Users, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ITEMS = [['/admin', 'Dashboard', LayoutDashboard], ['/admin/products', 'Products', Package],
  ['/admin/categories', 'Categories', FolderTree], ['/admin/orders', 'Orders', ShoppingBag],
  ['/admin/customers', 'Customers', Users], ['/admin/inventory', 'Inventory', Boxes],
  ['/admin/reports', 'Reports', BarChart3], ['/admin/settings', 'Settings', Settings]];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  return (
    <div className="admin">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="side-logo">🎆 Sriram<span>Crackers</span><small>Admin</small></div>
        {ITEMS.map(([to, label, Icon]) => (
          <NavLink key={to} to={to} end={to === '/admin'} onClick={() => setOpen(false)}><Icon size={18} /> {label}</NavLink>
        ))}
        <Link to="/" onClick={() => setOpen(false)}><Store size={18} /> View Store</Link>
        <button onClick={async () => { await logout(); nav('/login'); }}><LogOut size={18} /> Logout</button>
      </aside>
      <div className="admin-main">
        <div className="admin-top">
          <button className="icon-btn side-toggle" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
          <span>Signed in as <b>{user.full_name || user.username}</b></span>
        </div>
        <div className="admin-content"><Outlet /></div>
      </div>
    </div>
  );
}
