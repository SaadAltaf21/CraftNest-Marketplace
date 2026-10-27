import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, img, money } from '../api.js';
export default function ShopPage() {
  const { slug } = useParams(); const [s, setS] = useState(null);
  useEffect(() => { api(`/shops/${slug}`).then(setS).catch(() => {}); }, [slug]);
  if (!s) return <div className="wrap">Loading shop…</div>;
  return <div className="wrap"><div className="hero"><h1>{s.name}</h1><p>{s.description}</p><p className="muted" style={{ color: '#d9e8de' }}>Status: {s.status} · {s.shippingOrigin || ''}</p></div>
    {s.announcement && <div className="box" style={{ marginTop: 16 }}>{s.announcement}</div>}
    {s.policies && <div className="box" style={{ marginTop: 16 }}><b>Shop policies:</b><p>{s.policies}</p></div>}
    <h2>Products from this shop</h2><div className="grid">{(s.products || []).map(p => <Link key={p._id} className="card" to={`/product/${p._id}`}><img src={img(p)} alt={p.title} /><b>{p.title}</b><div className="price">{money(p.price)}</div></Link>)}</div>
  </div>;
}
