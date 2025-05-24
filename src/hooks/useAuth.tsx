import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "../utils/supabase";

interface AuthContextType {
  user: any;
  login: (data: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
};

interface AuthProviderProps {
  children: React.ReactNode;
  userData?: any;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children, userData }: AuthProviderProps) => {
    const [user, setUser] = useState<any>(userData);
    const [isAuthenticated, setIsAuthenticated] = useState(!!userData);
    const navigate = useNavigate();

  useEffect(() => {
    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
      if (event === "SIGNED_IN") {
        navigate("/dashboard");
      } else if (event === "SIGNED_OUT") {
        navigate("/", { replace: true });
      }
    });

    // Check initial session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
    };
    checkSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

    const login = async (data: {email: string; password: string}) => {
        const { error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        });
        if (error) throw error;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setIsAuthenticated(false);
        navigate("/", { replace: true });
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
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
