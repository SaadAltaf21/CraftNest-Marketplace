import React, { createContext, useContext, useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { api } from './api.js';
import Home from './pages/Home.jsx';
import ShopBrowse from './pages/ShopBrowse.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import CartPage from './pages/CartPage.jsx';
import Checkout from './pages/Checkout.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Account from './pages/Account.jsx';
import Seller from './pages/Seller.jsx';
import ShopPage from './pages/ShopPage.jsx';
import Admin from './pages/Admin.jsx';
import Messages from './pages/Messages.jsx';

export const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

function Header() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [count, setCount] = useState(0);
  useEffect(() => { if (user) api('/cart').then(c => setCount(c.items?.reduce((s, i) => s + i.qty, 0) || 0)).catch(() => {}); }, [user]);
  return <header><div className="top">CraftNest — handmade, vintage & personalised finds from independent sellers</div>
    <div className="nav">
      <Link className="logo" to="/">Craft<span>Nest</span></Link>
      <form className="search" onSubmit={e => { e.preventDefault(); nav(`/shop?q=${encodeURIComponent(q)}`); }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search handmade jewellery, décor, gifts…" />
        <button>Search</button>
      </form>
      <Link className="pill" to="/shop">Shop</Link>
      <Link className="pill" to="/account">♥ Wishlist</Link>
      <Link className="pill" to="/cart">🛒 Cart ({count})</Link>
      {user ? <><Link className="pill" to="/account">{user.name}</Link><Link className="pill" to="/messages">Messages</Link>{user.role === 'seller' && <Link className="pill" to="/seller">Seller Dashboard</Link>}{user.role === 'admin' && <Link className="pill" to="/admin">Admin</Link>}<button className="pill" onClick={logout}>Logout</button></> : <><Link className="pill" to="/login">Login</Link><Link className="pill" to="/register">Register</Link></>}
      <Link className="pill" to="/seller">Sell on CraftNest</Link>
    </div></header>;
}
export default function App() {
  const [user, setUser] = useState(null);
  useEffect(() => { const t = localStorage.getItem('craftnest_token'); if (t) api('/auth/me').then(setUser).catch(() => localStorage.removeItem('craftnest_token')); }, []);
  const login = async (data) => { localStorage.setItem('craftnest_token', data.token); setUser(data.user); };
  const logout = () => { localStorage.removeItem('craftnest_token'); setUser(null); };
  return <AuthCtx.Provider value={{ user, setUser, login, logout }}>
    <Header />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/shop" element={<ShopBrowse />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/shop/:slug" element={<ShopPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/account" element={<Account />} />
      <Route path="/seller" element={<Seller />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="*" element={<div className="wrap"><h2>Page not found</h2><Link className="btn" to="/">Back home</Link></div>} />
    </Routes>
    <footer><div className="wrap"><b>CraftNest</b> — an original, Etsy-inspired marketplace demo. No real payments are taken: checkout is a labelled test checkout (or cash on delivery) and test orders are saved to MongoDB. <br />Demo sellers are fictional. Demo reviews are flagged as demo and are not verified purchases.</div></footer>
  </AuthCtx.Provider>;
}
