const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: any;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.loadTokens();
  }

  private loadTokens() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  private saveTokens(tokens: AuthTokens) {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.accessToken;
        localStorage.setItem('accessToken', data.accessToken);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    try {
      let response = await fetch(url, { ...options, headers });

      // If 401, try to refresh token and retry
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          headers.Authorization = `Bearer ${this.accessToken}`;
          response = await fetch(url, { ...options, headers });
        }
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return {
          error: error.error || `HTTP ${response.status}`,
          details: error.details,
        };
      }

      const data = await response.json();
      return { data };
    } catch (error: any) {
      return { error: error.message || 'Network error' };
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data) {
      this.saveTokens(response.data);
    }
    return response;
  }

  async logout() {
    this.clearTokens();
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Products endpoints
  async getProducts(limit = 100, offset = 0) {
    return this.request(`/products?limit=${limit}&offset=${offset}`);
  }

  async createProduct(product: any) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id: string, product: any) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  }

  // Sales endpoints
  async createSale(sale: any) {
    return this.request('/sales', {
      method: 'POST',
      body: JSON.stringify(sale),
    });
  }

  async getSales(limit = 50, offset = 0) {
    return this.request(`/sales?limit=${limit}&offset=${offset}`);
  }

  // Inventory endpoints
  async getInventory(limit = 100, offset = 0) {
    return this.request(`/inventory?limit=${limit}&offset=${offset}`);
  }

  async adjustInventory(productId: string, quantity: number, reason: string) {
    return this.request('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity, reason }),
    });
  }

  // Reports endpoints
  async getSalesReport(startDate: string, endDate: string) {
    return this.request(`/reports/sales?startDate=${startDate}&endDate=${endDate}`);
  }

  async getInventoryReport() {
    return this.request('/reports/inventory');
  }

  // Sync endpoints
  async syncData(queue: any[]) {
    return this.request('/sync', {
      method: 'POST',
      body: JSON.stringify({ queue }),
    });
  }

  // User management (admin only)
  async getUsers() {
    return this.request('/users');
  }

  async createUser(user: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async updateUser(id: string, user: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  setAccessToken(token: string) {
    this.accessToken = token;
    localStorage.setItem('accessToken', token);
  }
}

export const apiClient = new ApiClient();
