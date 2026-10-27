import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
export default function AuthPage({ mode }) {
  const { login } = useAuth(); const nav = useNavigate();
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [err, setErr] = useState(''); const [asAdmin, setAsAdmin] = useState(false); const [adminCode, setAdminCode] = useState('');
  const submit = async e => { e.preventDefault(); setErr(''); try { const d = mode === 'login' ? await api('/auth/login', { method: 'POST', body: { email, password } }) : asAdmin ? await api('/auth/register-admin', { method: 'POST', body: { name, email, password, adminCode } }) : await api('/auth/register', { method: 'POST', body: { name, email, password } }); login(d); nav(d.user.role === 'admin' ? '/admin' : '/account'); } catch (ex) { setErr(ex.message); } };
  return <div className="wrap"><h1>{mode === 'login' ? 'Login' : 'Create your CraftNest account'}</h1>
    <form className="form" onSubmit={submit}>{mode === 'register' && <><label>Full name</label><input value={name} onChange={e => setName(e.target.value)} required /></>}<label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required /><label>Password (min 6 characters)</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required />{mode === 'register' && <><label><input type="checkbox" checked={asAdmin} onChange={e => setAsAdmin(e.target.checked)} /> Register as admin</label>{asAdmin && <><label>Admin registration code</label><input value={adminCode} onChange={e => setAdminCode(e.target.value)} required placeholder="Enter the admin code" /></>}</>}<br /><br /><button className="btn">{mode === 'login' ? 'Login' : asAdmin ? 'Register as Admin' : 'Register'}</button>{err && <div className="err">{err}</div>}<p className="muted">Normal registration creates a customer account. Admin registration only works with the correct admin code — if the code is wrong, you will see “Admin code registration is not match” and no admin account will be created.</p></form>
  </div>;
}
