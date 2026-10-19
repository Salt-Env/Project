import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount, UserRole } from '../types/hris';
import { PREDEFINED_USERS } from '../data/initialData';

interface AuthContextType {
  currentUser: UserAccount;
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole) => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  availableUsers: UserAccount[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'hris_active_user_v2';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const match = PREDEFINED_USERS.find((u) => u.id === parsed.id);
        if (match) return match;
      }
    } catch {
      // ignore
    }
    // Default to HR to view all administrative capacities on first launch, or Karyawan
    return PREDEFINED_USERS[1]; // Siti Rahmawati (HR)
  });

  useEffect(() => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
  }, [currentUser]);

  const switchUser = (userId: string) => {
    const user = PREDEFINED_USERS.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  };

  const switchRole = (role: UserRole) => {
    const user = PREDEFINED_USERS.find((u) => u.role === role);
    if (user) {
      setCurrentUser(user);
    }
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (Array.isArray(roles)) {
      return roles.includes(currentUser.role);
    }
    return currentUser.role === roles;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        switchUser,
        switchRole,
        hasRole,
        availableUsers: PREDEFINED_USERS,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
