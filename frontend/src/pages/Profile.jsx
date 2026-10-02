import { Camera, Heart, KeyRound, LogOut, Package } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, errMsg, fieldErrors } from '../services/api';

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const notify = useToast();
  const nav = useNavigate();
  const a = user.address || {};
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({ full_name: user.full_name, username: user.username, email: user.email, phone: user.phone || '',
    line1: a.line1 || '', city: a.city || '', state: a.state || '', pincode: a.pincode || '' });
  const [pw, setPw] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [errs, setErrs] = useState({});
  const [pwErr, setPwErr] = useState('');

  const save = async (e) => {
    e.preventDefault(); setErrs({});
    try { updateUser((await api.put('/profile/', f)).data); setEdit(false); notify('Profile updated'); }
    catch (err) { setErrs(fieldErrors(err)); notify(errMsg(err), 'error'); }
  };
  const avatar = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append('avatar', file);
    try { updateUser((await api.put('/profile/', fd)).data); notify('Photo updated'); } catch (err) { notify(errMsg(err), 'error'); }
  };
  const changePw = async (e) => {
    e.preventDefault(); setPwErr('');
    try { await api.post('/change-password/', pw); setPw({ old_password: '', new_password: '', confirm_password: '' }); notify('Password changed'); }
    catch (err) { setPwErr(errMsg(err)); }
  };
  const inp = (k, label, type = 'text') => (
    <label className={`field ${errs[k] ? 'has-error' : ''}`}>{label}
      <input type={type} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />{errs[k] && <small className="err">{errs[k]}</small>}
    </label>
  );

  return (
    <div className="container page">
      <div className="profile-head card">
        <div className="avatar">
          {user.avatar ? <img src={user.avatar} alt="" /> : <span>{(user.full_name || user.username)[0].toUpperCase()}</span>}
          <label className="avatar-edit" title="Change photo"><Camera size={14} /><input type="file" accept="image/*" hidden onChange={avatar} /></label>
        </div>
        <div><h2>{user.full_name}</h2><p className="muted">@{user.username}{user.is_admin ? ' · Admin' : ''}</p></div>
        <div className="profile-links">
          <Link to="/orders" className="btn btn-outline btn-sm"><Package size={16} /> My Orders</Link>
          <Link to="/wishlist" className="btn btn-outline btn-sm"><Heart size={16} /> Wishlist</Link>
          <button className="btn btn-ghost btn-sm" onClick={async () => { await logout(); nav('/'); }}><LogOut size={16} /> Logout</button>
        </div>
      </div>

      <div className="info-grid">
        <div className="card">
          <div className="row-between"><h3>Personal Details</h3>{!edit && <button className="btn btn-outline btn-sm" onClick={() => setEdit(true)}>Edit Profile</button>}</div>
          {edit ? (
            <form onSubmit={save}>
              <div className="form-grid">{inp('full_name', 'Full Name')}{inp('username', 'Username')}{inp('email', 'Email', 'email')}{inp('phone', 'Phone')}
                <div className="span2">{inp('line1', 'Address')}</div>{inp('city', 'City')}{inp('state', 'State')}{inp('pincode', 'Pincode')}</div>
              <div className="row-gap"><button className="btn btn-primary">Save</button><button type="button" className="btn btn-ghost" onClick={() => setEdit(false)}>Cancel</button></div>
            </form>
          ) : (
            <dl className="dl">
              <dt>Full Name</dt><dd>{user.full_name}</dd><dt>Username</dt><dd>{user.username}</dd>
              <dt>Email</dt><dd>{user.email}</dd><dt>Phone</dt><dd>{user.phone || '-'}</dd>
              <dt>Address</dt><dd>{a.line1 ? `${a.line1}, ${a.city}, ${a.state} - ${a.pincode}` : 'No address saved yet'}</dd>
            </dl>
          )}
        </div>
        <form className="card" onSubmit={changePw}>
          <h3><KeyRound size={18} /> Change Password</h3>
          {pwErr && <div className="alert error">{pwErr}</div>}
          {['old_password', 'new_password', 'confirm_password'].map((k) => (
            <label key={k} className="field">{k === 'old_password' ? 'Current password' : k === 'new_password' ? 'New password' : 'Confirm new password'}
              <input type="password" required value={pw[k]} onChange={(e) => setPw({ ...pw, [k]: e.target.value })} /></label>
          ))}
          <button className="btn btn-primary">Update Password</button>
        </form>
      </div>
    </div>
  );
}
