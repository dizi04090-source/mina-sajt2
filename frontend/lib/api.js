const BASE = process.env.NEXT_PUBLIC_API_URL || '';
export const hasApi = !!BASE;
export async function api(path, { method = 'GET', body, token } = {}) {
  const r = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) }, body: body && JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Došlo je do greške. Pokušajte ponovo.');
  return d;
}
