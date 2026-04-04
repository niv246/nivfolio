const BASE = '';

export async function api(path, options = {}) {
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  };
  if (options.body) {
    config.body = JSON.stringify(options.body);
  }
  const res = await fetch(`${BASE}${path}`, config);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}
