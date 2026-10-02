import { Mail, MapPin, Phone, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="safety-notice">
          <ShieldAlert size={22} />
          <p><b>Safety &amp; Legal Notice:</b> Fireworks must be bought, stored and used in accordance with applicable local laws and age
            restrictions. Always follow the manufacturer's safety instructions printed on each pack, use outdoors under adult supervision,
            keep a safe distance, store in a cool dry place and keep away from children.</p>
        </div>
        <div className="footer-grid">
          <div>
            <h3 className="logo">🎆 Sriram Crackers</h3>
            <p>Premium crackers at affordable prices, delivered for every celebration.</p>
          </div>
          <div>
            <h4>Shop</h4>
            <Link to="/products">All Products</Link>
            <Link to="/products?offers=1">Offers</Link>
            <Link to="/#categories">Categories</Link>
            <Link to="/wishlist">Wishlist</Link>
          </div>
          <div>
            <h4>Account</h4>
            <Link to="/profile">My Profile</Link>
            <Link to="/orders">My Orders</Link>
            <Link to="/cart">Cart</Link>
            <Link to="/login">Login</Link>
          </div>
          <div id="footer-contact">
            <h4>Contact</h4>
            <span><Phone size={14} /> +91 9842228430  </span>
            <span><Mail size={14} /> sreram150@gmail.com</span>
            <span><MapPin size={14} /> Sivakasi, Tamil Nadu</span>
          </div>
        </div>
        <p className="copy">© {new Date().getFullYear()} Sriram Crackers. All rights reserved.</p>
      </div>
    </footer>
  );
}
