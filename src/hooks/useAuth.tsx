import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import type { User } from '@supabase/supabase-js';
import { SupabaseAuthService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  login: (data: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

interface AuthProviderProps {
  children: React.ReactNode;
  userData?: User | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children, userData }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(userData || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!userData);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = SupabaseAuthService.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session?.user);
        if (event === 'SIGNED_IN') {
          navigate('/dashboard');
        } else if (event === 'SIGNED_OUT') {
          navigate('/', { replace: true });
        }
      },
    );

    const checkSession = async () => {
      const user = await SupabaseAuthService.checkSession();
      setUser(user);
      setIsAuthenticated(!!user);
    };
    checkSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const login = async (data: { email: string; password: string }) => {
    await SupabaseAuthService.login(data);
  };

  const logout = async () => {
    await SupabaseAuthService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
