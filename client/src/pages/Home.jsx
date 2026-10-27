import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, img, money } from '../api.js';
export default function Home() {
  const [cats, setCats] = useState([]); const [trend, setTrend] = useState([]); const [rec, setRec] = useState([]); const [shops, setShops] = useState([]); const [deals, setDeals] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(() => { Promise.all([api('/categories'), api('/products?sort=popular&limit=8'), api('/products?sort=newest&limit=8'), api('/shops'), api('/products?sort=price_asc&limit=8')]).then(([c, t, r, s, d]) => { setCats(c); setTrend(t.items); setRec(r.items); setShops(s); setDeals(d.items.filter(x => x.compareAtPrice)); setLoading(false); }).catch(() => setLoading(false)); }, []);
  const Card = ({ p }) => <Link className="card" to={`/product/${p._id}`}><img src={img(p)} alt={p.title} /><b>{p.title}</b><div className="muted" style={{ padding: '0 12px' }}>{p.shop?.name} · ⭐ {p.ratingAvg || 'New'}</div><div className="price">{money(p.price)}{p.compareAtPrice && <span className="old">{money(p.compareAtPrice)}</span>}</div></Link>;
  if (loading) return <div className="wrap"><div className="skeleton" /></div>;
  return <div className="wrap">
    <div className="hero"><div>✦ Handmade • Vintage • Personalised</div><h1>Find something made<br />just for you.</h1><p>Shop independent sellers, support small makers, and discover gifts you will not find on the high street.</p><br /><Link className="btn" to="/shop">Browse the marketplace →</Link></div>
    <h2>Featured categories</h2><div className="catgrid">{cats.map(c => <Link key={c._id} className="cat" to={`/shop?category=${c.slug}`}><img src={c.image} alt={c.name} /><b>{c.name}</b></Link>)}</div>
    <h2>Trending now</h2><div className="grid">{trend.map(p => <Card key={p._id} p={p} />)}</div>
    <h2>Recommended for you</h2><div className="grid">{rec.map(p => <Card key={p._id} p={p} />)}</div>
    <h2>Popular shops</h2><div className="grid">{shops.map(s => <Link key={s._id} className="card" to={`/shop/${s.slug}`}><div style={{ padding: 16 }}><b>{s.name}</b><div className="muted">{s.description}</div><div style={{ marginTop: 10 }} className="btn2">Visit shop →</div></div></Link>)}</div>
    <h2>Deals & offers</h2><div className="grid">{deals.slice(0, 4).map(p => <Card key={p._id} p={p} />)}</div>
    <div className="box" style={{ marginTop: 24 }}><b>Seasonal & gift collections:</b><p className="muted">Handmade gifts, vintage finds, personalised gifts and digital downloads — filter by type on the Shop page. Digital products are for demo download links only in this build.</p></div>
  </div>;
}
