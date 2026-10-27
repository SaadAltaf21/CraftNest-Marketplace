import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
export default function Admin() {
  const { user } = useAuth();
  const [ov, setOv] = useState(null); const [users, setUsers] = useState([]); const [shops, setShops] = useState([]); const [logs, setLogs] = useState([]); const [support, setSupport] = useState([]);
  useEffect(() => { if (user?.role === 'admin') { api('/admin/overview').then(setOv); api('/admin/users').then(setUsers); api('/admin/shops').then(setShops); api('/admin/audit-logs').then(setLogs); api('/support').then(setSupport); } }, [user]);
  if (!user) return <div className="wrap"><h1>Admin</h1><p>Please login as an admin (created with the server script).</p></div>;
  if (user.role !== 'admin') return <div className="wrap"><h1>Admin</h1><p>Access denied — admin role required.</p></div>;
  return <div className="wrap"><h1>Admin Dashboard</h1>{ov && <div className="grid">{Object.entries(ov).map(([k, v]) => <div key={k} className="box"><div className="muted">{k}</div><b style={{ fontSize: 22 }}>{v}</b></div>)}</div>}
    <h2>Seller approval</h2>{shops.map(s => <div key={s._id} className="box flex" style={{ marginBottom: 8 }}><b style={{ flex: 1 }}>{s.name} — {s.status}</b><button className="btn2" onClick={async () => { await api(`/admin/shops/${s._id}/status`, { method: 'PATCH', body: { status: 'approved' } }); api('/admin/shops').then(setShops); }}>Approve</button><button className="btn2" onClick={async () => { await api(`/admin/shops/${s._id}/status`, { method: 'PATCH', body: { status: 'rejected' } }); api('/admin/shops').then(setShops); }}>Reject</button></div>)}
    <h2>Users</h2><table><tbody>{users.map(u => <tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td></tr>)}</tbody></table>
    <h2>Support requests</h2>{support.map(s => <div key={s._id} className="box" style={{ marginBottom: 8 }}><b>{s.subject}</b><p>{s.message} — {s.status}</p></div>)}
    <h2>Audit log</h2>{logs.map(l => <div key={l._id} className="box" style={{ marginBottom: 8 }}>{l.action} — {l.details} <span className="muted">{new Date(l.createdAt).toLocaleString()}</span></div>)}
  </div>;
}
