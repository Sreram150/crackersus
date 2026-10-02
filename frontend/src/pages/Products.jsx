import { SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Loading, { ErrorBox } from '../components/Loading';
import ProductCard from '../components/ProductCard';
import { api, errMsg } from '../services/api';

export default function Products() {
  const [sp, setSp] = useSearchParams();
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const q = sp.get('q') || '', category = sp.get('category') || '', min = sp.get('min') || '', max = sp.get('max') || '';
  const ordering = sp.get('ordering') || 'popularity', offers = sp.get('offers') || '';
  const [search, setSearch] = useState(q);
  const [price, setPrice] = useState({ min, max });

  useEffect(() => { setSearch(q); setPrice({ min, max }); }, [q, min, max]);
  useEffect(() => { api.get('/categories/').then((r) => setCats(r.data)).catch(() => {}); }, []);

  const load = () => {
    setLoading(true); setError('');
    api.get('/products/', { params: { q: q || undefined, category: category || undefined, min_price: min || undefined,
      max_price: max || undefined, ordering, offers: offers || undefined } })
      .then((r) => setItems(r.data)).catch((e) => setError(errMsg(e))).finally(() => setLoading(false));
  };
  useEffect(load, [q, category, min, max, ordering, offers]);

  const set = (patch) => {
    const n = new URLSearchParams(sp);
    Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
    setSp(n);
  };

  return (
    <div className="container page">
      <div className="section-head">
        <h1>{offers ? 'Special Offers' : 'All Products'} <small className="muted">({items.length})</small></h1>
        <button className="btn btn-outline btn-sm filter-toggle" onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal size={16} /> Filters</button>
      </div>
      <div className="shop-layout">
        <aside className={`filters ${showFilters ? 'open' : ''}`}>
          <form onSubmit={(e) => { e.preventDefault(); set({ q: search.trim() }); }}>
            <label className="field">Search<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or category" /></label>
          </form>
          <label className="field">Category
            <select value={category} onChange={(e) => set({ category: e.target.value })}>
              <option value="">All categories</option>
              {cats.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
            </select>
          </label>
          <form onSubmit={(e) => { e.preventDefault(); set({ min: price.min, max: price.max }); }}>
            <label className="field">Price range (₹)
              <div className="price-inputs">
                <input type="number" min="0" placeholder="Min" value={price.min} onChange={(e) => setPrice({ ...price, min: e.target.value })} />
                <input type="number" min="0" placeholder="Max" value={price.max} onChange={(e) => setPrice({ ...price, max: e.target.value })} />
              </div>
            </label>
            <button className="btn btn-outline btn-sm btn-block">Apply price</button>
          </form>
          <label className="field">Sort by
            <select value={ordering} onChange={(e) => set({ ordering: e.target.value })}>
              <option value="popularity">Popularity</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest first</option>
            </select>
          </label>
          <label className="check"><input type="checkbox" checked={!!offers} onChange={(e) => set({ offers: e.target.checked ? '1' : '' })} /> Offers only</label>
          <button className="btn btn-ghost btn-sm" onClick={() => setSp({})}>Clear all filters</button>
        </aside>

        <div>
          <ErrorBox message={error} onRetry={load} />
          {loading ? <Loading /> : items.length === 0 && !error ? (
            <div className="empty"><div className="big">🔍</div><h3>No products found</h3><p>Try changing your search or filters.</p></div>
          ) : (
            <div className="grid-products">{items.map((p) => <ProductCard key={p.id} product={p} />)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
