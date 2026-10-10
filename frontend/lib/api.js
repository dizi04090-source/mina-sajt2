const BASE = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
export const hasApi = !!BASE;
export async function api(path, { method = 'GET', body, token, timeoutMs = 12000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(BASE + path, { method, signal: controller.signal, headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) }, body: body && JSON.stringify(body) });
    const d = await r.json().catch(error => {
      if (controller.signal.aborted) throw error;
      return {};
    });
    if (!r.ok) throw new Error(d.error || (r.status === 401 ? 'Sesija je istekla. Odjavite se i prijavite ponovo.' : 'Zahtev nije uspeo. Pokušajte ponovo.'));
    return d;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Veza sa salonom je istekla. Pokušajte ponovo.');
    if (error instanceof TypeError) throw new Error('Povezivanje sa salonom trenutno nije dostupno. Pokušajte ponovo kasnije.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
