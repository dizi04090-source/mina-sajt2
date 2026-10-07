const BASE = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
export const hasApi = !!BASE;
export async function api(path, { method = 'GET', body, token } = {}) {
  let r;
  try {
    r = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) }, body: body && JSON.stringify(body) });
  } catch {
    throw new Error(`Ne mogu da se povežem sa backendom (${BASE || 'API nije podešen'}). Proveri NEXT_PUBLIC_API_URL na mina-web i CORS_ORIGIN na mina-api.`);
  }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `API greška (${r.status}). Proveri NEXT_PUBLIC_API_URL i backend deploy.`);
  return d;
}
