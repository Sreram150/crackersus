import { ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import CartItem from '../components/CartItem';
import Loading from '../components/Loading';
import { useShop } from '../context/CartContext';
import { money } from '../services/api';

export function Summary({ cart }) {
  return (
    <div className="summary">
      <h3>Order Summary</h3>
      <div className="srow"><span>Subtotal</span><span>{money(cart.subtotal)}</span></div>
      <div className="srow green"><span>Discount</span><span>- {money(cart.discount)}</span></div>
      <div className="srow"><span>Delivery charge</span><span>{cart.delivery_charge ? money(cart.delivery_charge) : 'FREE'}</span></div>
      <div className="srow total"><span>Total</span><span>{money(cart.total)}</span></div>
      <small className="muted">Free delivery on orders of ₹999 and above.</small>
    </div>
  );
}

export default function Cart() {
  const { cart, cartLoading } = useShop();
  const nav = useNavigate();
  if (cartLoading && !cart.items.length) return <Loading full />;
  if (!cart.items.length) {
    return (
      <div className="container empty"><div className="big">🛒</div><h2>Your cart is empty</h2>
        <p>Add some crackers to get the celebration started.</p><Link to="/products" className="btn btn-primary">Start Shopping</Link></div>
    );
  }
  return (
    <div className="container page">
      <h1><ShoppingBag /> Shopping Cart ({cart.item_count})</h1>
      <div className="cart-layout">
        <div className="cart-list">{cart.items.map((i) => <CartItem key={i.id} item={i} />)}</div>
        <div>
          <Summary cart={cart} />
          <button className="btn btn-primary btn-block" onClick={() => nav('/checkout')}>Proceed to Checkout</button>
        </div>
      </div>
    </div>
  );
}
