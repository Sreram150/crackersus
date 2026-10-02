import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, errMsg } from '../services/api';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setError(''); setMsg(null); setBusy(true);
    try { setMsg((await api.post('/password-reset/', { email })).data); } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <h1>Forgot password?</h1>
        <p className="muted">Enter your email and we'll send you a reset link.</p>
        {error && <div className="alert error">{error}</div>}
        {msg && <div className="alert success">{msg.detail}
          {msg.dev_reset_link && <><br /><small>Dev mode link: <a href={msg.dev_reset_link}>open reset page</a> (also printed in the Django terminal)</small></>}</div>}
        <label className="field">Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Sending...' : 'Send reset link'}</button>
        <p className="center"><Link to="/login">Back to login</Link></p>
      </form>
    </div>
  );
}

export function ResetPassword() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const [f, setF] = useState({ new_password: '', confirm_password: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const uid = sp.get('uid'), token = sp.get('token');

  const submit = async (e) => {
    e.preventDefault(); setError('');
    try { await api.post('/password-reset/confirm/', { uid, token, ...f }); setDone(true); setTimeout(() => nav('/login'), 1800); }
    catch (err) { setError(errMsg(err)); }
  };

  if (!uid || !token) return <div className="auth-wrap"><div className="auth-card"><div className="alert error">Invalid reset link.</div><Link to="/forgot-password">Request a new one</Link></div></div>;
  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <h1>Reset password</h1>
        {error && <div className="alert error">{error}</div>}
        {done && <div className="alert success">Password updated! Redirecting to login...</div>}
        <label className="field">New password<input type="password" required value={f.new_password} onChange={(e) => setF({ ...f, new_password: e.target.value })} /></label>
        <label className="field">Confirm password<input type="password" required value={f.confirm_password} onChange={(e) => setF({ ...f, confirm_password: e.target.value })} /></label>
        <button className="btn btn-primary btn-block" disabled={done}>Reset Password</button>
      </form>
    </div>
  );
}
