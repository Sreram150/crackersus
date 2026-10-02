import { Link } from 'react-router-dom';

export default function CategoryCard({ category: c }) {
  return (
    <Link to={`/products?category=${c.slug}`} className="cat-card">
      <span className="cat-icon">{c.icon || '🎆'}</span>
      <b>{c.name}</b>
      <small>{c.product_count} products</small>
    </Link>
  );
}
