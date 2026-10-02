import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Loading, { ErrorBox } from '../components/Loading';
import ProductImage from '../components/ProductImage';
import { useToast } from '../context/ToastContext';
import { api, errMsg, fieldErrors, money } from '../services/api';

const BLANK = { name: '', description: '', category: '', price: '', discount_price: '', stock: '0', rating: '4.0',
  is_featured: false, specifications: '', image: null };

function ProductForm({ product, cats, onClose, onSaved }) {
  const notify = useToast();
  const [f, setF] = useState(product ? { ...BLANK, ...product, discount_price: product.discount_price ?? '', image: null } : { ...BLANK, category: cats[0]?.id || '' });
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setErrs({}); setBusy(true);
    const fd = new FormData();
    ['name', 'description', 'category', 'price', 'discount_price', 'stock', 'rating', 'specifications'].forEach((k) => fd.append(k, f[k] ?? ''));
    fd.append('is_featured', f.is_featured ? 'true' : 'false');
    if (f.image) fd.append('image', f.image);
    try {
      if (product) await api.put(`/products/${product.id}/`, fd); else await api.post('/products/', fd);
      notify(product ? 'Product updated' : 'Product created'); onSaved();
    } catch (err) { setErrs(fieldErrors(err)); notify(errMsg(err), 'error'); } finally { setBusy(false); }
  };
  const field = (k, label, props = {}) => (
    <label className={`field ${errs[k] ? 'has-error' : ''}`}>{label}<input value={f[k]} onChange={set(k)} {...props} />{errs[k] && <small className="err">{errs[k]}</small>}</label>
  );

  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit}>
        <div className="row-between"><h3>{product ? 'Edit Product' : 'Add Product'}</h3><button type="button" className="icon-btn" onClick={onClose}><X /></button></div>
        <div className="form-grid">
          <div className="span2">{field('name', 'Product name', { required: true })}</div>
          <label className="field">Category
            <select value={f.category} onChange={set('category')} required>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            {errs.category && <small className="err">{errs.category}</small>}</label>
          {field('stock', 'Stock', { type: 'number', min: 0, required: true })}
          {field('price', 'Price (₹)', { type: 'number', step: '0.01', min: 0, required: true })}
          {field('discount_price', 'Discount price (₹)', { type: 'number', step: '0.01', min: 0 })}
          {field('rating', 'Rating (0-5)', { type: 'number', step: '0.1', min: 0, max: 5 })}
          <label className="field">Product image<input type="file" accept="image/*" onChange={(e) => setF({ ...f, image: e.target.files[0] })} />{errs.image && <small className="err">{errs.image}</small>}</label>
          <label className="field span2">Description<textarea rows="3" value={f.description} onChange={set('description')} /></label>
          <label className="field span2">Specifications (one per line, "Label: value")<textarea rows="3" value={f.specifications} onChange={set('specifications')} /></label>
          <label className="check"><input type="checkbox" checked={f.is_featured} onChange={set('is_featured')} /> Featured product</label>
        </div>
        <div className="row-gap"><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button></div>
      </form>
    </div>
  );
}

function CategoriesTab({ cats, reload }) {
  const notify = useToast();
  const [f, setF] = useState({ name: '', icon: '🎆', description: '' });
  const [editId, setEditId] = useState(null);
  const save = async (e) => {
    e.preventDefault();
    try { editId ? await api.put(`/categories/${editId}/`, f) : await api.post('/categories/', f);
      notify('Category saved'); setF({ name: '', icon: '🎆', description: '' }); setEditId(null); reload(); }
    catch (err) { notify(errMsg(err), 'error'); }
  };
  const del = async (c) => {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    try { await api.delete(`/categories/${c.id}/`); notify('Category deleted'); reload(); } catch (err) { notify(errMsg(err), 'error'); }
  };
  return (
    <>
      <form className="card inline-form" onSubmit={save}>
        <input required placeholder="Category name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className="narrow" placeholder="Icon" value={f.icon} onChange={(e) => setF({ ...f, icon: e.target.value })} />
        <input placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <button className="btn btn-primary btn-sm">{editId ? 'Update' : 'Add'} Category</button>
        {editId && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditId(null); setF({ name: '', icon: '🎆', description: '' }); }}>Cancel</button>}
      </form>
      <div className="card table-wrap"><table><thead><tr><th>Icon</th><th>Name</th><th>Description</th><th>Products</th><th /></tr></thead>
        <tbody>{cats.map((c) => <tr key={c.id}><td>{c.icon}</td><td>{c.name}</td><td>{c.description}</td><td>{c.product_count}</td>
          <td className="actions"><button className="icon-btn" onClick={() => { setEditId(c.id); setF({ name: c.name, icon: c.icon, description: c.description }); }}><Pencil size={16} /></button>
            <button className="icon-btn danger" onClick={() => del(c)}><Trash2 size={16} /></button></td></tr>)}</tbody></table></div>
    </>
  );
}

function InventoryTab({ products, reload }) {
  const notify = useToast();
  const [vals, setVals] = useState({});
  const save = async (p) => {
    try { await api.patch(`/products/${p.id}/`, { stock: vals[p.id] }); notify(`Stock updated for ${p.name}`); setVals({ ...vals, [p.id]: undefined }); reload(); }
    catch (err) { notify(errMsg(err), 'error'); }
  };
  return (
    <div className="card table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Stock</th><th>Update stock</th></tr></thead>
      <tbody>{[...products].sort((a, b) => a.stock - b.stock).map((p) => (
        <tr key={p.id}><td>{p.name}</td><td>{p.category_name}</td>
          <td><b className={p.stock === 0 ? 'text-red' : p.stock <= 10 ? 'text-orange' : ''}>{p.stock}</b></td>
          <td className="actions"><input className="narrow" type="number" min="0" value={vals[p.id] ?? p.stock} onChange={(e) => setVals({ ...vals, [p.id]: e.target.value })} />
            <button className="btn btn-outline btn-sm" disabled={vals[p.id] === undefined || vals[p.id] === ''} onClick={() => save(p)}>Save</button></td></tr>
      ))}</tbody></table></div>
  );
}

export default function AdminProducts({ view }) {
  const notify = useToast();
  const [products, setProducts] = useState(null);
  const [cats, setCats] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null); // null | {} (new) | product (edit)

  const load = () => {
    setError('');
    Promise.all([api.get('/admin/products/'), api.get('/categories/')])
      .then(([p, c]) => { setProducts(p.data); setCats(c.data); }).catch((e) => setError(errMsg(e)));
  };
  useEffect(load, []);

  const del = async (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    try { await api.delete(`/products/${p.id}/`); notify('Product deleted'); load(); } catch (e) { notify(errMsg(e), 'error'); }
  };

  const title = { products: 'Products', categories: 'Categories', inventory: 'Inventory' }[view];
  return (
    <>
      <div className="section-head"><h1>{title}</h1>
        {view === 'products' && <button className="btn btn-primary btn-sm" disabled={!cats.length} onClick={() => setForm({})}><Plus size={16} /> Add Product</button>}</div>
      <div className="tabs">{[['products', 'Products'], ['categories', 'Categories'], ['inventory', 'Inventory']].map(([v, l]) =>
        <Link key={v} to={`/admin/${v}`} className={view === v ? 'on' : ''}>{l}</Link>)}</div>
      <ErrorBox message={error} onRetry={load} />
      {!products && !error ? <Loading /> : view === 'categories' ? <CategoriesTab cats={cats} reload={load} />
        : view === 'inventory' ? <InventoryTab products={products || []} reload={load} /> : (
        <div className="card table-wrap"><table>
          <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Rating</th><th /></tr></thead>
          <tbody>{products?.map((p) => (
            <tr key={p.id}><td className="thumb"><ProductImage product={p} /></td><td>{p.name}</td><td>{p.category_name}</td>
              <td>{money(p.final_price)}{p.discount_percent > 0 && <small className="muted"> <s>{money(p.price)}</s></small>}</td>
              <td>{p.stock}</td><td>{Number(p.rating).toFixed(1)}</td>
              <td className="actions"><button className="icon-btn" aria-label="Edit" onClick={() => setForm(p)}><Pencil size={16} /></button>
                <button className="icon-btn danger" aria-label="Delete" onClick={() => del(p)}><Trash2 size={16} /></button></td></tr>))}
            {products?.length === 0 && <tr><td colSpan="7" className="center muted">No products yet.</td></tr>}</tbody></table></div>
      )}
      {form && <ProductForm product={form.id ? form : null} cats={cats} onClose={() => setForm(null)} onSaved={() => { setForm(null); load(); }} />}
    </>
  );
}
