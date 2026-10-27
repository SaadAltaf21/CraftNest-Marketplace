import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, money } from '../api.js';
import { useAuth } from '../App.jsx';
export default function Checkout() {
  const { user } = useAuth(); const nav = useNavigate();
  const [form, setForm] = useState({ line1: '', city: '', postal: '', phone: '', couponCode: '' });
  const [method, setMethod] = useState('test'); const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const set = k => e => setForm({ ...form, [k]: e.target.value });
  const place = async () => {
    setErr(''); try {
      const o = await api('/orders', { method: 'POST', body: { paymentMethod: method, couponCode: form.couponCode || undefined, shippingAddress: { line1: form.line1, city: form.city, postal: form.postal, phone: form.phone } } });
      setMsg(`Test order placed! Order ID: ${o._id} — Total ${money(o.total)}. No real money was charged.`); setTimeout(() => nav('/account'), 1500);
    } catch (e) { setErr(e.message); }
  };
  if (!user) return <div className="wrap"><h1>Checkout</h1><p>Please <Link to="/login">login</Link> first.</p></div>;
  return <div className="wrap"><h1>Checkout — test checkout</h1><div className="box" style={{ marginBottom: 16 }}><b>⚠️ This is a clearly labelled test checkout.</b> No card details are collected or stored, and no real money moves. A real test order is saved to MongoDB. Cash on delivery is also available as a separate method.</div>
    <div className="form"><label>Address line</label><input value={form.line1} onChange={set('line1')} /><label>City</label><input value={form.city} onChange={set('city')} /><label>Postal code</label><input value={form.postal} onChange={set('postal')} /><label>Phone</label><input value={form.phone} onChange={set('phone')} /><label>Coupon code (try WELCOME10)</label><input value={form.couponCode} onChange={set('couponCode')} /><label>Payment method</label><select value={method} onChange={e => setMethod(e.target.value)}><option value="test">Test checkout (no real payment)</option><option value="cod">Cash on delivery</option></select><br /><br /><button className="btn" onClick={place}>Place test order</button>{msg && <div className="toast">{msg}</div>}{err && <div className="err">{err}</div>}</div>
  </div>;
}
