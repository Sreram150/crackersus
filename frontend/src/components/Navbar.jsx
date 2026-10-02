import { Heart, LogOut, Menu, Search, ShoppingCart, User, X, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/CartContext';

const LINKS = [['/', 'Home'], ['/products', 'Products'], ['/#categories', 'Categories'],
  ['/products?offers=1', 'Offers'], ['/#about', 'About'], ['/#contact', 'Contact']];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount, wishCount } = useShop();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const search = (e) => { e.preventDefault(); nav(`/products?q=${encodeURIComponent(q.trim())}`); setOpen(false); };
  const close = () => setOpen(false);

  return (
    <header className="nav">
      <div className="container nav-inner">
        <button className="icon-btn menu-toggle" aria-label="Menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
        <Link to="/" className="logo" onClick={close}>🎆 Sriram<span>Crackers</span></Link>

        <nav className={`nav-links ${open ? 'open' : ''}`}>
          <form className="nav-search" onSubmit={search}>
            <Search size={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search crackers..." aria-label="Search" />
          </form>
          {LINKS.map(([to, label]) => (
            <NavLink key={label} to={to} end={to === '/'} onClick={close} className={({ isActive }) => (isActive && !to.includes('#') && !to.includes('?') ? 'active' : '')}>{label}</NavLink>
          ))}
          {user?.is_admin && <Link to="/admin" onClick={close} className="admin-link"><LayoutDashboard size={15} /> Admin</Link>}
        </nav>

        <div className="nav-actions">
          <Link to="/wishlist" className="icon-btn" aria-label="Wishlist"><Heart size={20} />{wishCount > 0 && <i className="count">{wishCount}</i>}</Link>
          <Link to="/cart" className="icon-btn" aria-label="Cart"><ShoppingCart size={20} />{cartCount > 0 && <i className="count">{cartCount}</i>}</Link>
          {user ? (
            <>
              <Link to="/profile" className="btn btn-outline btn-sm profile-btn"><User size={16} /> <span>{user.full_name?.split(' ')[0] || user.username}</span></Link>
              <button className="icon-btn" aria-label="Logout" title="Logout" onClick={async () => { await logout(); nav('/'); }}><LogOut size={19} /></button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
}
