import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
export default function AuthPage({ mode }) {
  const { login } = useAuth(); const nav = useNavigate();
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [err, setErr] = useState('');
  const submit = async e => { e.preventDefault(); setErr(''); try { const d = mode === 'login' ? await api('/auth/login', { method: 'POST', body: { email, password } }) : await api('/auth/register', { method: 'POST', body: { name, email, password } }); login(d); nav('/account'); } catch (ex) { setErr(ex.message); } };
  return <div className="wrap"><h1>{mode === 'login' ? 'Login' : 'Create your CraftNest account'}</h1>
    <form className="form" onSubmit={submit}>{mode === 'register' && <><label>Full name</label><input value={name} onChange={e => setName(e.target.value)} required /></>}<label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required /><label>Password (min 6 characters)</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required /><br /><br /><button className="btn">{mode === 'login' ? 'Login' : 'Register'}</button>{err && <div className="err">{err}</div>}<p className="muted">Admin accounts are never created from this form. The first admin is created only with the server script (see README).</p></form>
  </div>;
}
