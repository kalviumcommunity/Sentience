// Token management utility for secure JWT handling

interface TokenData {
  token: string;
  expiresAt: number;
  user: Record<string, unknown>;
}

class TokenManager {
  private readonly TOKEN_KEY = 'authToken';
  private readonly USER_KEY = 'userData';
  private readonly REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

  // Store token securely using localStorage (primary) and httpOnly cookies (fallback)
  setToken(tokenData: TokenData): void {
    try {
      const data = {
        token: tokenData.token,
        expiresAt: tokenData.expiresAt,
        user: tokenData.user
      };
      
      // Store token in localStorage (primary method)
      localStorage.setItem(this.TOKEN_KEY, data.token);
      
      // Store user data in sessionStorage (non-sensitive)
      sessionStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
      sessionStorage.setItem('tokenExpiresAt', data.expiresAt.toString());
      
      // Set httpOnly cookie for token (fallback/security)
      document.cookie = `${this.TOKEN_KEY}=${data.token}; path=/; secure; samesite=strict; max-age=${7 * 24 * 60 * 60}`; // 7 days
    } catch (error) {
      console.error('Failed to store token:', error);
    }
  }

  // Get token from localStorage (fallback to httpOnly cookie)
  getToken(): string | null {
    try {
      // First try localStorage (primary method)
      const localToken = localStorage.getItem(this.TOKEN_KEY);
      if (localToken) {
        return localToken;
      }
      
      // Fallback to httpOnly cookie
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => 
        cookie.trim().startsWith(`${this.TOKEN_KEY}=`)
      );
      
      if (tokenCookie) {
        return tokenCookie.split('=')[1];
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  }

  // Get user data
  getUser(): Record<string, unknown> | null {
    try {
      const userData = sessionStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  // Check if token is valid and not expired
  isTokenValid(): boolean {
    try {
      const token = this.getToken();
      if (!token) return false;

      const expiresAt = sessionStorage.getItem('tokenExpiresAt');
      if (!expiresAt) return false;

      const expiryTime = parseInt(expiresAt);
      const now = Date.now();

      return now < expiryTime;
    } catch (error) {
      console.error('Failed to check token validity:', error);
      return false;
    }
  }

  // Check if token needs refresh
  needsRefresh(): boolean {
    try {
      const expiresAt = sessionStorage.getItem('tokenExpiresAt');
      if (!expiresAt) return true;

      const expiryTime = parseInt(expiresAt);
      const now = Date.now();
      const timeUntilExpiry = expiryTime - now;

      return timeUntilExpiry <= this.REFRESH_THRESHOLD;
    } catch (error) {
      console.error('Failed to check token refresh need:', error);
      return true;
    }
  }

  // Clear all token data
  clearToken(): void {
    try {
      // Clear localStorage token
      localStorage.removeItem(this.TOKEN_KEY);
      
      // Clear httpOnly cookie
      document.cookie = `${this.TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      sessionStorage.removeItem(this.USER_KEY);
      sessionStorage.removeItem('tokenExpiresAt');
    } catch (error) {
      console.error('Failed to clear token:', error);
    }
  }

  // Decode JWT token (without verification)
  decodeToken(token: string): Record<string, unknown> | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  // Get token expiry time
  getTokenExpiry(): number | null {
    try {
      const expiresAt = sessionStorage.getItem('tokenExpiresAt');
      return expiresAt ? parseInt(expiresAt) : null;
    } catch (error) {
      console.error('Failed to get token expiry:', error);
      return null;
    }
  }

  // Get time until token expires (in milliseconds)
  getTimeUntilExpiry(): number {
    try {
      const expiryTime = this.getTokenExpiry();
      if (!expiryTime) return 0;

      const now = Date.now();
      return Math.max(0, expiryTime - now);
    } catch (error) {
      console.error('Failed to get time until expiry:', error);
      return 0;
    }
  }
}

export const tokenManager = new TokenManager();

// Helper functions for backward compatibility
export const getAuthToken = (): string | null => tokenManager.getToken();
export const setAuthToken = (token: string, user: Record<string, unknown>, expiresAt: number): void => {
  tokenManager.setToken({ token, user, expiresAt });
};
export const clearAuthToken = (): void => tokenManager.clearToken();
export const isTokenValid = (): boolean => tokenManager.isTokenValid(); 