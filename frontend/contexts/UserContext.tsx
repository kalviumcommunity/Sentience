
import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { getAvatarUrl } from '@/utils/avatar';
import { performanceMonitor } from '@/utils/performance';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  gender?: string;
  university?: string;
  major?: string;
  year?: string;
  bio?: string;
}

interface UserContextType {
  currentUser: User | null;
  isLoading: boolean;
  setCurrentUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  register: (name: string, email: string, password: string, university?: string, major?: string, year?: string, gender?: string, avatar?: string) => Promise<void>;
  refreshSession: () => Promise<void>;
}

// API URL - in production, this would be an environment variable
const API_URL = import.meta.env.VITE_API_URL || 'https://sentience.onrender.com/api';

// Mock user data for demo when API is not available
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Alex Johnson',
    email: 'alex@university.edu',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    university: 'Tech University',
    major: 'Computer Science',
    year: '3rd',
    bio: 'CS student passionate about AI and web development.'
  },
  {
    id: '2',
    name: 'Sam Taylor',
    email: 'sam@university.edu',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam',
    university: 'Tech University',
    major: 'Biology',
    year: '2nd',
    bio: 'Biology student interested in genetics and biodiversity.'
  },
  {
    id: '3',
    name: 'Jamie Smith',
    email: 'jamie@university.edu',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jamie',
    university: 'Central College',
    major: 'Psychology',
    year: '4th',
    bio: 'Psychology major researching cognitive development in children.'
  },
  {
    id: '4',
    name: 'Test User',
    email: 'test@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Test',
    university: 'Test University',
    major: 'Test Major',
    year: '1st',
    bio: 'Test user for development purposes.'
  }
];

const UserContext = createContext<UserContextType>({
  currentUser: null,
  isLoading: true,
  setCurrentUser: () => {},
  login: async () => {},
  logout: () => {},
  updateProfile: async () => {},
  register: async () => {},
  refreshSession: async () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiAvailable, setApiAvailable] = useState(false);

  // Check if API is available and validate existing session
  useEffect(() => {
    const initializeAuth = async () => {
      performanceMonitor.startTimer('auth-initialization');
      try {
        // Check API availability with better error handling
        const response = await fetch(`${API_URL}/health`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          mode: 'cors'
        });
        
        console.log('API Health Check Response:', response.status, response.ok);
        setApiAvailable(response.ok);
        
        if (response.ok) {
          // Validate existing token
          const token = localStorage.getItem('authToken');
          if (token) {
            await validateToken(token);
          } else {
            // Check for saved user data
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
              setCurrentUser(JSON.parse(savedUser));
            }
          }
        } else {
          console.log('API health check failed, but continuing with real API');
          setApiAvailable(true); // Force API to be available
        }
      } catch (error) {
        console.log('API health check error:', error);
        console.log('Continuing with real API despite health check failure');
        setApiAvailable(true); // Force API to be available
        
        // Load saved user data
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          setCurrentUser(JSON.parse(savedUser));
        }
      } finally {
        setIsLoading(false);
        performanceMonitor.endTimer('auth-initialization');
      }
    };

    initializeAuth();
  }, []);

  // Validate token with backend
  const validateToken = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/users/validate`, {
        method: 'GET',
        headers: {
          'x-auth-token': token
        },
        credentials: 'include'
      });

      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
      } else {
        // Token is invalid, clear storage
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      // Clear invalid data
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      setCurrentUser(null);
    }
  };

  // Refresh session periodically
  useEffect(() => {
    if (currentUser && apiAvailable) {
      const interval = setInterval(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
          validateToken(token);
        }
      }, 5 * 60 * 1000); // Check every 5 minutes

      return () => clearInterval(interval);
    }
  }, [currentUser, apiAvailable]);

  const refreshSession = async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      await validateToken(token);
    }
  };

  // Update register signature
  const register = async (
    name: string,
    email: string,
    password: string,
    university?: string,
    major?: string,
    year?: string,
    gender?: string,
    avatar?: string
  ) => {
    setIsLoading(true);
    try {
      if (apiAvailable) {
        const response = await fetch(`${API_URL}/users/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name,
            email,
            password,
            university,
            major,
            year,
            gender,
            avatar
          })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Registration failed');
        }
        
        const data = await response.json();
        setCurrentUser(data.user);
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        // Calculate token expiration (7 days from now)
        const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000);
        localStorage.setItem('tokenExpiresAt', expiresAt.toString());
        
        toast({
          title: "Welcome to Sentience!",
          description: "Account created successfully",
        });
      } else {
        // Force API usage even if health check failed
        console.log('Health check failed, but attempting real API registration');
        
        const response = await fetch(`${API_URL}/users/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name,
            email,
            password,
            university,
            major,
            year,
            gender,
            avatar
          })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Registration failed');
        }
        
        const data = await response.json();
        setCurrentUser(data.user);
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        // Calculate token expiration (7 days from now)
        const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000);
        localStorage.setItem('tokenExpiresAt', expiresAt.toString());
        
        toast({
          title: "Welcome to Sentience!",
          description: "Account created successfully",
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      if (apiAvailable) {
        const response = await fetch(`${API_URL}/users/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Login failed');
        }
        
        const data = await response.json();
        setCurrentUser(data.user);
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        // Calculate token expiration (7 days from now)
        const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000);
        localStorage.setItem('tokenExpiresAt', expiresAt.toString());
        
        toast({
          title: "Welcome back!",
          description: "Logged in successfully",
        });
      } else {
        // Force API usage even if health check failed
        console.log('Health check failed, but attempting real API login');
        
        const response = await fetch(`${API_URL}/users/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Login failed');
        }
        
        const data = await response.json();
        setCurrentUser(data.user);
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        // Calculate token expiration (7 days from now)
        const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000);
        localStorage.setItem('tokenExpiresAt', expiresAt.toString());
        
        toast({
          title: "Welcome back!",
          description: "Logged in successfully",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : 'Invalid credentials',
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('tokenExpiresAt');
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!currentUser) return;

    try {
      if (apiAvailable) {
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('Not authorized');
        }
        
        const response = await fetch(`${API_URL}/users/profile`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'x-auth-token': token
          },
          credentials: 'include',
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Profile update failed');
        }
        
        const updatedUser = await response.json();
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      } else {
        // Mock profile update
        const updatedUser = { ...currentUser, ...data };
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: "destructive"
      });
      throw error;
    }
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        isLoading,
        setCurrentUser,
        login,
        logout,
        updateProfile,
        register,
        refreshSession
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
