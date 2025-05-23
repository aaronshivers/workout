import { useState, useEffect, useCallback, type JSX } from 'react';
import supabase from '../../utils/supabase';
import type { Session } from '@supabase/supabase-js';

interface AuthManagerProps {
  children: (props: {
    isAuthenticated: boolean;
    userId: string | null;
    isInitialized: boolean;
    handleLogout: () => Promise<void>;
  }) => JSX.Element;
}

export const AuthManager: React.FC<AuthManagerProps> = ({
  children,
}): JSX.Element => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Handle logout
  const handleLogout: () => Promise<void> =
    useCallback(async (): Promise<void> => {
      // This is line 22 in this 66-line file.
      try {
        await supabase.auth.signOut();
        localStorage.removeItem('supabase.auth.token');
        setIsAuthenticated(false);
        setUserId(null);
      } catch (error) {
        console.error('Error during logout:', error);
      }
    }, []);

  // Listen for auth state changes (e.g., login, logout, token refresh)
  useEffect(() => {
    // Rely solely on onAuthStateChange for initial state and subsequent changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: string, session: Session | null) => {
        if (event === 'SIGNED_IN' && session && session.user) {
          setIsAuthenticated(true);
          setUserId(session.user.id);
          localStorage.setItem('supabase.auth.token', JSON.stringify(session));
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setUserId(null);
          localStorage.removeItem('supabase.auth.token');
        }
        // Set isInitialized to true after the initial state is determined by the listener
        setIsInitialized(true);
      },
    );

    return (): void => {
      authListener.subscription.unsubscribe();
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount

  // Render children with auth props
  return children({
    isAuthenticated,
    userId,
    isInitialized,
    handleLogout,
  });
};

export default AuthManager;
