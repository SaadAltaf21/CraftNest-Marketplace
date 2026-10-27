import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
export default function Messages() {
  const { user } = useAuth();
  const [convs, setConvs] = useState([]); const [sel, setSel] = useState(null); const [msgs, setMsgs] = useState([]); const [text, setText] = useState('');
  useEffect(() => { if (user) api('/conversations').then(setConvs); }, [user]);
  useEffect(() => { if (!sel) return; const load = () => api(`/conversations/${sel}/messages`).then(setMsgs).catch(() => {}); load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [sel]);
  if (!user) return <div className="wrap"><h1>Messages</h1><p>Please login.</p></div>;
  return <div className="wrap"><h1>Messages (polling every 5s — no WebSocket)</h1>
    <div className="flex"><div style={{ minWidth: 240 }}>{convs.map(c => <button key={c._id} className="btn2" style={{ display: 'block', marginBottom: 8, width: '100%' }} onClick={() => setSel(c._id)}>{c.shop?.name || 'Conversation'} — {c.participants.map(p => p.name).join(', ')}</button>)}{convs.length === 0 && <p className="muted">No conversations yet. Start one from a shop page in a future step, or via the API.</p>}</div>
    <div style={{ flex: 1 }}>{sel && <><div className="box">{msgs.map(m => <p key={m._id}><b>{m.sender?.name}:</b> {m.text}</p>)}</div><div className="flex" style={{ marginTop: 10 }}><input value={text} onChange={e => setText(e.target.value)} placeholder="Write a message…" /><button className="btn" onClick={async () => { await api(`/conversations/${sel}/messages`, { method: 'POST', body: { text } }); setText(''); api(`/conversations/${sel}/messages`).then(setMsgs); }}>Send</button></div></>}</div></div>
  </div>;
}
