import React, { useEffect } from 'react';
import { useAuthStore, User } from '@/store/authStore';

// We export the type to preserve backward compatibility for imports from this file
export type { User };

// This maintains compatibility with components expecting to use the context
export const useUser = () => {
  // We use the entire store to act exactly like the previous context object this replaces
  return useAuthStore();
};

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const initializeAuth = useAuthStore(state => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // The provider no longer needs to pass value props down, as useUser hooks into Zustand globally!
  return <>{children}</>;
};
