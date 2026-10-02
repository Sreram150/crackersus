import { LogIn } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../services/api';

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [f, setF] = useState({ identifier: '', password: '', remember: true });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.is_admin ? '/admin' : '/'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!f.identifier.trim() || !f.password) return setError('Please enter your email/username and password.');
    setBusy(true);
    try {
      const u = await login(f.identifier.trim(), f.password, f.remember);
      nav(u.is_admin ? '/admin' : loc.state?.from || '/', { replace: true });
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit} noValidate>
        <h1>Welcome back 🎆</h1>
        <p className="muted">Login to continue shopping. Admins are redirected to the dashboard.</p>
        {error && <div className="alert error">{error}</div>}
        <label className="field">Email or Username
          <input value={f.identifier} onChange={(e) => setF({ ...f, identifier: e.target.value })} autoComplete="username" autoFocus />
        </label>
        <label className="field">Password
          <input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="current-password" />
        </label>
        <div className="row-between">
          <label className="check"><input type="checkbox" checked={f.remember} onChange={(e) => setF({ ...f, remember: e.target.checked })} /> Remember me</label>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
        <button className="btn btn-primary btn-block" disabled={busy}><LogIn size={18} /> {busy ? 'Logging in...' : 'Login'}</button>
        <p className="center muted">New to CrackersHub? <Link to="/register">Create an account</Link></p>
      </form>
    </div>
  );
}
