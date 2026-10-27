const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
export async function api(path, { method = 'GET', body, token } = {}) {
  const t = token || localStorage.getItem('craftnest_token');
  const res = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
export const img = (p) => p?.images?.[0] || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80';
export const money = (n) => `Rs ${Number(n || 0).toLocaleString()}`;
