const BASE = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
export const hasApi = !!BASE;
export async function api(path, { method = 'GET', body, token } = {}) {
  let r;
  try {
    r = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) }, body: body && JSON.stringify(body) });
  } catch {
    throw new Error('Povezivanje sa salonom trenutno nije dostupno. Pokušajte ponovo kasnije.');
  }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || (r.status === 401 ? 'Sesija je istekla. Odjavite se i prijavite ponovo.' : 'Zahtev nije uspeo. Pokušajte ponovo.'));
  return d;
}
