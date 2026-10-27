import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, img, money } from '../api.js';
export default function ShopBrowse() {
  const [sp, setSp] = useSearchParams();
  const [items, setItems] = useState([]); const [cats, setCats] = useState([]); const [page, setPage] = useState(1); const [pages, setPages] = useState(1);
  const q = sp.get('q') || ''; const category = sp.get('category') || ''; const [type, setType] = useState(''); const [minPrice, setMinPrice] = useState(''); const [maxPrice, setMaxPrice] = useState(''); const [sort, setSort] = useState('newest');
  useEffect(() => { api('/categories').then(setCats).catch(() => {}); }, []);
  useEffect(() => { const qs = new URLSearchParams({ q, category, type, minPrice, maxPrice, sort, page }); api(`/products?${qs}`).then(d => { setItems(d.items); setPages(d.pages); }).catch(() => {}); }, [q, category, type, minPrice, maxPrice, sort, page]);
  return <div className="wrap"><h1>Shop</h1>
    <div className="flex">
      <select value={category} onChange={e => setSp({ q, category: e.target.value })}><option value="">All categories</option>{cats.map(c => <option key={c._id} value={c.slug}>{c.name}</option>)}</select>
      <select value={type} onChange={e => setType(e.target.value)}><option value="">All types</option><option value="handmade">Handmade</option><option value="vintage">Vintage</option><option value="personalized">Personalized</option><option value="digital">Digital</option></select>
      <input placeholder="Min price" value={minPrice} onChange={e => setMinPrice(e.target.value)} style={{ maxWidth: 140 }} />
      <input placeholder="Max price" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} style={{ maxWidth: 140 }} />
      <select value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="popular">Most popular</option><option value="rating">Top rated</option></select>
    </div>
    {items.length === 0 ? <div className="box" style={{ marginTop: 16 }}>No products match those filters yet. Try clearing the filters or run the seed script.</div> : <div className="grid" style={{ marginTop: 16 }}>{items.map(p => <Link key={p._id} className="card" to={`/product/${p._id}`}><img src={img(p)} alt={p.title} /><b>{p.title}</b><div className="muted" style={{ padding: '0 12px' }}>{p.shop?.name}</div><div className="price">{money(p.price)}</div></Link>)}</div>}
    <div className="flex" style={{ marginTop: 16 }}><button className="btn2" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Previous</button><span>Page {page} of {pages}</span><button className="btn2" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next →</button></div>
  </div>;
}
