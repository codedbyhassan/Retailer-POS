const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const token = localStorage.getItem('retailer_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const authApi = {
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
};

export const productsApi = {
  getAll: () => request('/api/products'),
  create: (data) => request('/api/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const salesApi = {
  getAll: () => request('/api/sales'),
  create: (data) => request('/api/sales', { method: 'POST', body: JSON.stringify(data) }),
};

export const reportsApi = {
  daily: (date) => request(`/api/reports/daily?date=${date}`),
  products: () => request('/api/reports/products'),
  inventory: () => request('/api/reports/inventory'),
};
