import { useState, useEffect, useCallback, useRef, type JSX } from 'react';
import supabase from '../../utils/supabase';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js'; // Removed User import

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
  const initialAuthEventProcessed = useRef<boolean>(false);

  // Handle logout
  const handleLogout: () => Promise<void> =
    useCallback(async (): Promise<void> => {
      try {
        await supabase.auth.signOut();
        localStorage.removeItem('supabase.auth.token');
        setIsAuthenticated(false);
        setUserId(null);
      } catch (error) {
        console.error('Error during logout:', error);
        // If supabase.auth.signOut() throws an error, ensure client state reflects logout.
        setIsAuthenticated(false);
        setUserId(null);
        localStorage.removeItem('supabase.auth.token');
      }
    }, []);

  // Listen for auth state changes (e.g., login, logout, token refresh)
  useEffect(() => {
    const handleAuthChange = async (
      event: AuthChangeEvent,
      session: Session | null,
    ): Promise<void> => {
      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session) {
        // Verify the session with getUser, as the session from onAuthStateChange
        // (especially from INITIAL_SESSION which might load a stale token) might not be valid.
        const {
          data: { user: validatedUser },
          error: getUserError,
        } = await supabase.auth.getUser();

        if (validatedUser && !getUserError) {
          setIsAuthenticated(true);
          setUserId(validatedUser.id);
          // Use the session object from onAuthStateChange for storage,
          // as it contains tokens. getUser only returns User object.
          localStorage.setItem('supabase.auth.token', JSON.stringify(session));
        } else {
          // If getUser fails or returns no user, treat as signed out.
          setIsAuthenticated(false);
          setUserId(null);
          localStorage.removeItem('supabase.auth.token');
          // If there was an error (e.g. invalid token), explicitly sign out
          // to ensure Supabase backend also clears the session.
          if (getUserError) {
            console.warn(
              'getUser failed during auth state change, signing out:',
              getUserError.message,
            );
            await supabase.auth.signOut(); // This might trigger another 'SIGNED_OUT' event.
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUserId(null);
        localStorage.removeItem('supabase.auth.token');
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // When token is refreshed, a new session object is available.
        // Validate the user with the new session.
        const {
          data: { user: validatedUser },
          error: getUserError,
        } = await supabase.auth.getUser();
        if (validatedUser && !getUserError) {
          setIsAuthenticated(true); // Reaffirm
          setUserId(validatedUser.id); // Reaffirm
          localStorage.setItem('supabase.auth.token', JSON.stringify(session));
        } else {
          // If token refresh somehow leads to invalid user
          setIsAuthenticated(false);
          setUserId(null);
          localStorage.removeItem('supabase.auth.token');
          if (getUserError) {
            console.warn(
              'getUser failed after token refresh, signing out:',
              getUserError.message,
            );
            await supabase.auth.signOut();
          }
        }
      }

      if (!initialAuthEventProcessed.current) {
        setIsInitialized(true);
        initialAuthEventProcessed.current = true;
      }
    };

    const { data: authListener } =
      supabase.auth.onAuthStateChange(handleAuthChange);

    return (): void => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
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
