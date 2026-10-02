import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg, fieldErrors } from '../services/api';

const FIELDS = [
  ['full_name', 'Full Name', 'text', 'name'], ['username', 'Username', 'text', 'username'],
  ['email', 'Email', 'email', 'email'], ['phone', 'Phone Number', 'tel', 'tel'],
  ['password', 'Password', 'password', 'new-password'], ['confirm_password', 'Confirm Password', 'password', 'new-password'],
];

export default function Register() {
  const { user, register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ full_name: '', username: '', email: '', phone: '', password: '', confirm_password: '' });
  const [errs, setErrs] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setErrs({});
    const local = {};
    FIELDS.forEach(([k, label]) => { if (!f[k].trim()) local[k] = `${label} is required.`; });
    if (f.password && f.password !== f.confirm_password) local.confirm_password = 'Passwords do not match.';
    if (Object.keys(local).length) return setErrs(local);
    setBusy(true);
    try { await register(f); nav('/', { replace: true }); } catch (err) {
      const fe = fieldErrors(err);
      Object.keys(fe).length ? setErrs(fe) : setError(errMsg(err));
      if (fe.non_field_errors) setError(fe.non_field_errors);
    } finally { setBusy(false); }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card wide" onSubmit={submit} noValidate>
        <h1>Create your account</h1>
        <p className="muted">Join CrackersHub for easy ordering and order tracking.</p>
        {error && <div className="alert error">{error}</div>}
        <div className="form-grid">
          {FIELDS.map(([k, label, type, ac]) => (
            <label key={k} className={`field ${errs[k] ? 'has-error' : ''}`}>{label}
              <input type={type} autoComplete={ac} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
              {errs[k] && <small className="err">{errs[k]}</small>}
            </label>
          ))}
        </div>
        <button className="btn btn-primary btn-block" disabled={busy}><UserPlus size={18} /> {busy ? 'Creating account...' : 'Sign Up'}</button>
        <p className="center muted">Already registered? <Link to="/login">Login</Link></p>
      </form>
    </div>
  );
}
