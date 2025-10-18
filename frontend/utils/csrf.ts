// CSRF Protection Utility

// Fallback for crypto.getRandomValues in Node.js environment
const getRandomValues = (array: Uint8Array): Uint8Array => {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return crypto.getRandomValues(array);
  }
  // Fallback for Node.js environment
  for (let i = 0; i < array.length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return array;
};

class CSRFProtection {
  private readonly TOKEN_KEY = 'csrf_token';
  private readonly API_BASE_URL = import.meta.env.VITE_API_URL || 'https://sentience.onrender.com/api';

  // Fetch CSRF token from backend
  async fetchToken(): Promise<string> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/csrf-token`);
      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
      }
      const { csrfToken } = await response.json();
      return csrfToken;
    } catch (error) {
      console.warn('Failed to fetch CSRF token from backend:', error);
      // Fallback to generating a token locally
      return this.generateFallbackToken();
    }
  }

  // Generate a fallback token if backend is unavailable
  private generateFallbackToken(): string {
    const array = new Uint8Array(32);
    getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Get or create CSRF token
  async getToken(): Promise<string> {
    let token = sessionStorage.getItem(this.TOKEN_KEY);
    
    if (!token) {
      token = await this.fetchToken();
      sessionStorage.setItem(this.TOKEN_KEY, token);
    }
    
    return token;
  }

  // Validate CSRF token
  validateToken(token: string): boolean {
    const storedToken = sessionStorage.getItem(this.TOKEN_KEY);
    return storedToken === token;
  }

  // Clear CSRF token
  clearToken(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
  }

  // Add CSRF token to request headers
  async addTokenToHeaders(headers: Record<string, string> = {}): Promise<Record<string, string>> {
    const token = await this.getToken();
    return {
      ...headers,
      'x-csrf-token': token,
    };
  }

  // Refresh CSRF token
  async refreshToken(): Promise<string> {
    const token = await this.fetchToken();
    sessionStorage.setItem(this.TOKEN_KEY, token);
    return token;
  }
}

export const csrfProtection = new CSRFProtection(); 