import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('mock_user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      setUser(u);
      setProfile({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        role: 'owner', // Default role for demo
        createdAt: Date.now()
      });
    }
    setLoading(false);
  }, []);

  const signIn = async () => {
    const mockUser = {
      uid: 'mock-uid-123',
      email: 'admin@example.com',
      displayName: 'Admin User',
    };
    localStorage.setItem('mock_user', JSON.stringify(mockUser));
    setUser(mockUser);
    setProfile({
      uid: mockUser.uid,
      email: mockUser.email,
      displayName: mockUser.displayName,
      role: 'owner',
      createdAt: Date.now()
    });
  };

  const logout = async () => {
    localStorage.removeItem('mock_user');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

