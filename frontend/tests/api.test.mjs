import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = await readFile(new URL('../lib/api.js', import.meta.url), 'utf8');
const { api } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const originalFetch = globalThis.fetch;
const waitForAbort = signal => new Promise((resolve, reject) => {
  signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
});

test('requests finish even when connection or response body stalls', async () => {
  try {
    globalThis.fetch = (url, { signal }) => waitForAbort(signal);
    await assert.rejects(api('/api/users/profile', { timeoutMs: 20 }), /Veza sa salonom je istekla/);
    globalThis.fetch = async (url, { signal }) => ({ ok: true, json: () => waitForAbort(signal) });
    await assert.rejects(api('/api/users/profile', { timeoutMs: 20 }), /Veza sa salonom je istekla/);
  } finally { globalThis.fetch = originalFetch; }
});

test('server validation messages and successful data survive the timeout wrapper', async () => {
  try {
    globalThis.fetch = async () => ({ ok: false, status: 403, json: async () => ({ error: 'Nemate pristup admin panelu' }) });
    await assert.rejects(api('/api/admin/overview'), /Nemate pristup admin panelu/);
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ id: 1, role: 'USER' }) });
    assert.deepEqual(await api('/api/users/profile'), { id: 1, role: 'USER' });
  } finally { globalThis.fetch = originalFetch; }
});
