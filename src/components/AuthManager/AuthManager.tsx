import { useState, useEffect, useCallback, type JSX } from 'react';
import supabase from '../../utils/supabase';

interface AuthManagerProps {
  children: (props: {
    isAuthenticated: boolean;
    userId: string | null;
    isInitialized: boolean;
    handleLogout: () => Promise<void>;
  }) => JSX.Element | null;
}

export const AuthManager: React.FC<AuthManagerProps> = ({
  children,
}): JSX.Element | null => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Handle logout
  const handleLogout: () => Promise<void> =
    useCallback(async (): Promise<void> => {
      try {
        await supabase.auth.signOut();
        // The onAuthStateChange listener will handle updating state and localStorage
        // upon SIGNED_OUT event.
      } catch (error) {
        console.error('Error during logout:', error);
        // Ensure client state reflects logout even if signOut API fails
        setIsAuthenticated(false);
        setUserId(null);
        localStorage.removeItem('supabase.auth.token'); // Ensure this matches the key used for storage
      }
    }, []);

  // Listen for auth state changes (e.g., login, logout, token refresh)
  useEffect(() => {
    // This function will perform the initial session check
    const getInitialSession = async (): Promise<void> => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        console.error('Error fetching initial session:', error.message);
        setIsAuthenticated(false);
        setUserId(null);
        localStorage.removeItem('supabase.auth.token');
      } else if (session) {
        // If a session is found, validate the user
        const {
          data: { user: validatedUser },
          error: getUserError,
        } = await supabase.auth.getUser();
        if (validatedUser && !getUserError) {
          setIsAuthenticated(true);
          setUserId(validatedUser.id);
          localStorage.setItem('supabase.auth.token', JSON.stringify(session));
        } else {
          // If session exists but user validation fails, treat as signed out
          console.warn(
            'Initial session found but user validation failed, signing out:',
            getUserError?.message,
          );
          setIsAuthenticated(false);
          setUserId(null);
          localStorage.removeItem('supabase.auth.token');
          await supabase.auth.signOut(); // Ensure backend also clears it
        }
      } else {
        // No session found
        setIsAuthenticated(false);
        setUserId(null);
        localStorage.removeItem('supabase.auth.token'); // Ensure no stale token
      }
      // Mark as initialized ONLY after the initial session check is complete
      setIsInitialized(true);
    };

    // Run the initial session check immediately on mount
    getInitialSession();

    // Set up real-time listener for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // This listener will handle subsequent changes (login, logout, token refresh)
        // after the initial load.
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
          setIsAuthenticated(true);
          setUserId(session.user.id);
          localStorage.setItem('supabase.auth.token', JSON.stringify(session));
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setUserId(null);
          localStorage.removeItem('supabase.auth.token');
        }
        // isInitialized remains true after the first getInitialSession call
      },
    );

    // Cleanup the listener on component unmount
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
