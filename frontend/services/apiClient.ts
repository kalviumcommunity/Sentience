const API_URL = import.meta.env.VITE_API_URL || 'https://sentience.onrender.com/api';

export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    const { csrfProtection } = await import('@/utils/csrf');
    const headers = await csrfProtection.addTokenToHeaders({});
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'API request failed' }));
      throw new Error(error.message || 'Request failed');
    }
    
    return response.json();
  },

  async post<T>(endpoint: string, body?: any): Promise<T> {
    const { csrfProtection } = await import('@/utils/csrf');
    const headers = await csrfProtection.addTokenToHeaders({});
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'API request failed' }));
      throw new Error(error.message || 'Request failed');
    }
    
    return response.json();
  },

  async put<T>(endpoint: string, body?: any): Promise<T> {
    const { csrfProtection } = await import('@/utils/csrf');
    const headers = await csrfProtection.addTokenToHeaders({});
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'API request failed' }));
      throw new Error(error.message || 'Request failed');
    }
    
    return response.json();
  }
};
