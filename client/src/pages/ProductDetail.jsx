import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, img, money } from '../api.js';
import { useAuth } from '../App.jsx';
export default function ProductDetail() {
  const { id } = useParams(); const { user } = useAuth();
  const [p, setP] = useState(null); const [reviews, setReviews] = useState([]); const [qty, setQty] = useState(1); const [variation, setVariation] = useState(''); const [msg, setMsg] = useState(''); const [rating, setRating] = useState(5); const [comment, setComment] = useState('');
  useEffect(() => { api(`/products/${id}`).then(setP).catch(() => {}); api(`/products/${id}/reviews`).then(setReviews).catch(() => {}); }, [id]);
  if (!p) return <div className="wrap">Loading…</div>;
  const addCart = async () => { if (!user) { setMsg('Please login first.'); return; } try { await api('/cart', { method: 'POST', body: { productId: p._id, variationLabel: variation || undefined, qty } }); setMsg('Added to cart ✓'); } catch (e) { setMsg(e.message); } };
  const fav = async () => { if (!user) return setMsg('Please login first.'); await api('/wishlist', { method: 'POST', body: { productId: p._id } }); setMsg('Saved to wishlist ♥'); };
  const review = async () => { try { await api(`/products/${id}/reviews`, { method: 'POST', body: { rating, comment } }); setMsg('Review posted.'); api(`/products/${id}/reviews`).then(setReviews); } catch (e) { setMsg(e.message); } };
  return <div className="wrap"><div className="flex"><div style={{ flex: 1, minWidth: 280 }}><img src={img(p)} alt={p.title} style={{ width: '100%', borderRadius: 16 }} />{(p.images || []).slice(1).map((im, i) => <img key={i} src={im} alt="" style={{ width: 120, borderRadius: 10, margin: 6 }} />)}</div>
    <div style={{ flex: 1, minWidth: 280 }}><h1>{p.title}</h1><div className="muted">by <Link to={`/shop/${p.shop?.slug}`}><b>{p.shop?.name}</b></Link> · {p.type} · Stock: {p.stock}</div><h2>{money(p.price)}{p.compareAtPrice && <span className="old">{money(p.compareAtPrice)}</span>}</h2><p>{p.description}</p>
      {p.variations?.length > 0 && <><label>Variation</label><select value={variation} onChange={e => setVariation(e.target.value)}><option value="">Standard</option>{p.variations.map(v => <option key={v.label} value={v.label}>{v.label} {v.priceDelta ? `(+${money(v.priceDelta)})` : ''}</option>)}</select></>}
      <label>Quantity</label><input type="number" min="1" max={p.stock} value={qty} onChange={e => setQty(Number(e.target.value))} />
      <div className="flex" style={{ marginTop: 14 }}><button className="btn" onClick={addCart}>Add to cart</button><button className="btn2" onClick={fav}>♥ Favourite</button><Link className="btn2" to="/cart">Buy now →</Link></div>
      {msg && <div className="toast">{msg}</div>}
      <div className="box" style={{ marginTop: 16 }}><b>Shipping:</b> Ships from the seller's shop. Delivery in 3–7 working days in this demo. Digital products: download link is provided by the seller after a test order.</div>
    </div></div>
    <h2>Reviews</h2>{reviews.length === 0 ? <p className="muted">No reviews yet.</p> : reviews.map(r => <div key={r._id} className="box" style={{ marginBottom: 10 }}>⭐ {r.rating} — {r.user?.name} {r.isDemo && <span>(demo review, not a verified purchase)</span>}<p>{r.comment}</p>{r.sellerResponse && <p><b>Seller reply:</b> {r.sellerResponse}</p>}</div>)}
    {user && <div className="form"><label>Your rating</label><select value={rating} onChange={e => setRating(Number(e.target.value))}>{[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} stars</option>)}</select><label>Comment</label><textarea value={comment} onChange={e => setComment(e.target.value)} /><button className="btn" style={{ marginTop: 10 }} onClick={review}>Post review</button></div>}
    <h2>Related products</h2><div className="grid">{(p.related || []).map(r => <Link key={r._id} className="card" to={`/product/${r._id}`}><img src={img(r)} alt={r.title} /><b>{r.title}</b><div className="price">{money(r.price)}</div></Link>)}</div>
  </div>;
}
