import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useShop } from '../context/CartContext';

export default function Wishlist() {
  const { wishItems } = useShop();
  if (!wishItems.length) {
    return <div className="container empty"><div className="big">💝</div><h2>Your wishlist is empty</h2><p>Tap the heart on any product to save it here.</p><Link to="/products" className="btn btn-primary">Explore Products</Link></div>;
  }
  return (
    <div className="container page">
      <h1>My Wishlist ({wishItems.length})</h1>
      <div className="grid-products">{wishItems.map((w) => <ProductCard key={w.id} product={w.product} />)}</div>
    </div>
  );
}
