import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, img, money } from '../api.js';
export default function CartPage() {
  const [cart, setCart] = useState({ items: [], subtotal: 0 });
  const load = () => api('/cart').then(setCart).catch(() => {});
  useEffect(load, []);
  return <div className="wrap"><h1>Your cart</h1>
    {cart.items.length === 0 ? <div className="box">Your cart is empty. <Link to="/shop">Browse products →</Link></div> : <>
      {cart.items.map(i => <div key={i.product._id} className="box flex" style={{ marginBottom: 10, alignItems: 'center' }}><img src={img(i.product)} alt="" style={{ width: 90, borderRadius: 10 }} /><div style={{ flex: 1 }}><b>{i.product.title}</b><div className="muted">{i.variationLabel} · {money(i.unitPrice)} each</div></div><input type="number" min="1" value={i.qty} onChange={async e => { await api(`/cart/${i.product._id}`, { method: 'PUT', body: { qty: Number(e.target.value) } }); load(); }} style={{ maxWidth: 90 }} /><button className="btn2" onClick={async () => { await api(`/cart/${i.product._id}`, { method: 'DELETE' }); load(); }}>Remove</button></div>)}
      <div className="box"><b>Subtotal: {money(cart.subtotal)}</b><p className="muted">Shipping and any coupon discount are calculated at checkout, on the server.</p><Link className="btn" to="/checkout">Proceed to checkout →</Link></div>
    </>}
  </div>;
}
