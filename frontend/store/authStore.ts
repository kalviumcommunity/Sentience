import { create } from 'zustand';
import { StorageService } from '@/services/StorageService';
import { apiClient } from '@/services/apiClient';
import { toast } from '@/hooks/use-toast';

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

interface AuthState {
  currentUser: User | null;
  isLoading: boolean;
  apiAvailable: boolean;
  setCurrentUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  register: (name: string, email: string, password: string, university?: string, major?: string, year?: string, gender?: string, avatar?: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  validateSession: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  isLoading: true,
  apiAvailable: true,

  setCurrentUser: (user: User | null) => {
    set({ currentUser: user });
    if (user) {
      StorageService.setItem('currentUser', user);
    } else {
      StorageService.removeItem('currentUser');
    }
  },

  validateSession: async () => {
    try {
      const userData = await apiClient.get<User>('/users/validate');
      set({ currentUser: userData });
      StorageService.setItem('currentUser', userData);
    } catch (error) {
      console.error('Session validation failed:', error);
      StorageService.removeItem('currentUser');
      set({ currentUser: null });
    }
  },

  initializeAuth: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://sentience-xq1s.onrender.com/api'}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        mode: 'cors'
      });
      const ok = response.ok;
      set({ apiAvailable: ok });
      
      if (ok) {
        await get().validateSession();
      } else {
        // Fallback for offline mode
        const savedUser = StorageService.getItem<User>('currentUser');
        if (savedUser) set({ currentUser: savedUser, apiAvailable: true });
      }
    } catch (error) {
      console.log('API health check error:', error);
      set({ apiAvailable: true }); // force
      const savedUser = StorageService.getItem<User>('currentUser');
      if (savedUser) set({ currentUser: savedUser });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const data = await apiClient.post<{ user: User, token: string }>('/users/login', { email, password });
      set({ currentUser: data.user });
      StorageService.setItem('currentUser', data.user);
      toast({ title: "Welcome back!", description: "Logged in successfully" });
    } catch (error) {
      toast({ title: "Login failed", description: error instanceof Error ? error.message : "Invalid credentials", variant: "destructive" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (name, email, password, university, major, year, gender, avatar) => {
    set({ isLoading: true });
    try {
      const data = await apiClient.post<{ user: User, token: string }>('/users/register', {
        name, email, password, university, major, year, gender, avatar
      });
      set({ currentUser: data.user });
      StorageService.setItem('currentUser', data.user);
      toast({ title: "Welcome to Sentience!", description: "Account created successfully" });
    } catch (error) {
      toast({ title: "Registration failed", description: error instanceof Error ? error.message : "An unknown error occurred", variant: "destructive" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/users/logout');
    } catch (e) {
      console.error('Logout error:', e);
    }
    set({ currentUser: null });
    StorageService.removeItem('currentUser');
    toast({ title: "Logged out", description: "You have been logged out successfully" });
  },

  updateProfile: async (data: Partial<User>) => {
    try {
      if (get().apiAvailable) {
        const updatedUser = await apiClient.put<User>('/users/profile', data);
        set({ currentUser: updatedUser });
        StorageService.setItem('currentUser', updatedUser);
      } else {
        const current = get().currentUser;
        if (current) {
          const updatedUser = { ...current, ...data };
          set({ currentUser: updatedUser });
          StorageService.setItem('currentUser', updatedUser);
        }
      }
      toast({ title: "Profile updated", description: "Your profile has been updated successfully" });
    } catch (error) {
      toast({ title: "Update failed", description: error instanceof Error ? error.message : "An error occurred", variant: "destructive" });
      throw error;
    }
  },

  refreshSession: async () => {
    await get().validateSession();
  }
}));
