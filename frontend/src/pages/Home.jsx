import { BadgePercent, Headphones, ShieldCheck, Sparkles, Star, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import CategoryCard from '../components/CategoryCard';
import { ErrorBox } from '../components/Loading';
import ProductCard from '../components/ProductCard';
import { api, errMsg } from '../services/api';

const WHY = [
  [Truck, 'Fast Delivery', 'Careful packing and quick dispatch across India.'],
  [BadgePercent, 'Factory-Direct Prices', 'Premium crackers at honest, affordable prices.'],
  [ShieldCheck, 'Quality Checked', 'Every product is checked before it ships.'],
  [Headphones, 'Friendly Support', 'Call or message us for help choosing the right pack.'],
];
// Sample testimonials for the template - replace with real customer reviews before launch.
const REVIEWS = [
  ['Ramesh K.', 'Great variety and the family combo was excellent value. Delivery was on time.'],
  ['Priya S.', 'Easy to order and the packing was neat. Kids really enjoyed the kids collection.'],
  ['Arun M.', 'Prices are reasonable and the gift box made a lovely present for relatives.'],
];

function Section({ id, title, link, children }) {
  return (
    <section className="section" id={id}>
      <div className="container">
        <div className="section-head"><h2>{title}</h2>{link && <Link to={link}>View all →</Link>}</div>
        {children}
      </div>
    </section>
  );
}

export default function Home() {
  const [d, setD] = useState({ featured: [], best: [], fresh: [], offers: [], cats: [] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { hash } = useLocation();

  const load = () => {
    setLoading(true); setError('');
    Promise.all([
      api.get('/products/', { params: { featured: 1, limit: 4 } }),
      api.get('/products/', { params: { ordering: 'popularity', limit: 4 } }),
      api.get('/products/', { params: { ordering: 'newest', limit: 4 } }),
      api.get('/products/', { params: { offers: 1, ordering: 'price_asc', limit: 4 } }),
      api.get('/categories/'),
    ]).then(([a, b, c, o, k]) => setD({ featured: a.data, best: b.data, fresh: c.data, offers: o.data, cats: k.data }))
      .catch((e) => setError(errMsg(e))).finally(() => setLoading(false));
  };
  useEffect(load, []);

  useEffect(() => {
    if (hash) setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 120);
  }, [hash, loading]);

  const grid = (items) => <div className="grid-products">{items.map((p) => <ProductCard key={p.id} product={p} />)}</div>;

  return (
    <>
      <section className="hero">
        {['✨', '🎇', '⭐', '🎆', '✨', '🎇'].map((s, i) => <span key={i} className={`spark s${i}`}>{s}</span>)}
        <div className="container hero-content">
          <span className="pill"><Sparkles size={14} /> Festival Season Special</span>
          <h1>Celebrate Every Moment With Crackers</h1>
          <p>Shop premium crackers at affordable prices.</p>
          <div className="hero-btns">
            <Link to="/products" className="btn btn-gold">Shop Now</Link>
            <Link to="/products?offers=1" className="btn btn-ghost-light">View Offers</Link>
          </div>
        </div>
      </section>

      <div className="container">{error && <ErrorBox message={error} onRetry={load} />}</div>

      <Section id="categories" title="Shop by Category">
        <div className="cat-grid">{d.cats.map((c) => <CategoryCard key={c.id} category={c} />)}</div>
      </Section>
      {!!d.featured.length && <Section title="Featured Products" link="/products">{grid(d.featured)}</Section>}
      {!!d.best.length && <Section title="Best Sellers" link="/products?ordering=popularity">{grid(d.best)}</Section>}
      {!!d.fresh.length && <Section title="New Arrivals" link="/products?ordering=newest">{grid(d.fresh)}</Section>}
      {!!d.offers.length && <Section title="Special Offers" link="/products?offers=1">{grid(d.offers)}</Section>}

      <section className="section alt" id="about">
        <div className="container">
          <div className="section-head"><h2>Why Choose Us</h2></div>
          <div className="why-grid">
            {WHY.map(([Icon, t, s]) => <div key={t} className="why"><Icon size={28} /><b>{t}</b><p>{s}</p></div>)}
          </div>
        </div>
      </section>

      <Section title="Customer Reviews">
        <div className="why-grid">
          {REVIEWS.map(([n, t]) => (
            <div key={n} className="review">
              <div className="stars">{[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}</div>
              <p>"{t}"</p><b>- {n}</b>
            </div>
          ))}
        </div>
      </Section>

      <section className="section contact" id="contact">
        <div className="container">
          <div className="section-head"><h2>Contact Us</h2></div>
          <p>Need help choosing a pack or tracking an order? Reach out any time.</p>
          <div className="contact-row">
            <a href="tel:+919876543210" className="btn btn-outline">📞 +91 98765 43210</a>
            <a href="mailto:support@crackershub.com" className="btn btn-outline">✉️ support@crackershub.com</a>
          </div>
        </div>
      </section>
    </>
  );
}
