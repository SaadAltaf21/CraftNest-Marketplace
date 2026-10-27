import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, img, money } from '../api.js';
import { useAuth } from '../App.jsx';
export default function Account() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]); const [wish, setWish] = useState([]); const [addrs, setAddrs] = useState([]); const [form, setForm] = useState({ line1: '', city: '', postal: '', phone: '' });
  useEffect(() => { if (user) { api('/orders').then(d => setOrders(d.items)); api('/wishlist').then(setWish); api('/addresses').then(setAddrs); } }, [user]);
  if (!user) return <div className="wrap"><h1>Account</h1><p>Please <Link to="/login">login</Link>.</p></div>;
  return <div className="wrap"><h1>Hi, {user.name}</h1><p className="muted">{user.email} · Role: {user.role}</p>
    <h2>Order history</h2>{orders.length === 0 ? <p className="muted">No orders yet.</p> : orders.map(o => <div key={o._id} className="box" style={{ marginBottom: 10 }}><b>Order {o._id}</b> — {o.status} · {o.paymentMethod} · Total {money(o.total)}<div className="muted">{o.items.map(i => `${i.title} × ${i.qty}`).join(', ')}</div></div>)}
    <h2>Wishlist</h2><div className="grid">{wish.map(p => <Link key={p._id} className="card" to={`/product/${p._id}`}><img src={img(p)} alt={p.title} /><b>{p.title}</b><div className="price">{money(p.price)}</div></Link>)}</div>
    <h2>Saved addresses</h2>{addrs.map(a => <div key={a._id} className="box" style={{ marginBottom: 8 }}>{a.line1}, {a.city} {a.postal} · {a.phone}</div>)}
    <div className="form" style={{ marginTop: 12 }}><label>Address line</label><input value={form.line1} onChange={e => setForm({ ...form, line1: e.target.value })} /><label>City</label><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /><label>Postal</label><input value={form.postal} onChange={e => setForm({ ...form, postal: e.target.value })} /><label>Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /><br /><button className="btn" onClick={async () => { await api('/addresses', { method: 'POST', body: form }); api('/addresses').then(setAddrs); }}>Save address</button></div>
  </div>;
}
