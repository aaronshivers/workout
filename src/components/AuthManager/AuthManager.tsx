import React, { useEffect, useState, memo } from "react";
import supabase from "../../utils/supabase";
import { useNavigate } from "react-router-dom";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

type AuthManagerProps = {
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean | null>>;
  children: (props: {
    handleLogout: () => Promise<void>;
    userId: string;
    isInitialized: boolean;
  }) => React.ReactNode;
};

const AuthManager: React.FC<AuthManagerProps> = ({
  setIsAuthenticated,
  children,
}) => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);

  console.log("AuthManager: Component mounted");

  useEffect(() => {
    console.log("AuthManager: useEffect triggered");
    const checkAuth = async () => {
      try {
        console.log("AuthManager: Checking session...");
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        console.log("AuthManager: getSession result:", {
          session,
          sessionError,
        });

        if (sessionError || !session) {
          console.log("AuthManager: No session found, redirecting to login");
          setIsAuthenticated(false);
          navigate("/login", { replace: true });
          return;
        }

        console.log("AuthManager: Checking user...");
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        console.log("AuthManager: getUser result:", { user, authError });

        if (authError || !user || !user.email) {
          console.log(
            "AuthManager: No user or email found, redirecting to login",
          );
          alert(
            "User or email is missing. Please ensure your account has an email.",
          );
          setIsAuthenticated(false);
          navigate("/login", { replace: true });
          return;
        }

        setUserId(user.id);
        setIsAuthenticated(true);
        console.log("AuthManager: User authenticated with ID:", user.id);

        // Check users table
        console.log("AuthManager: Checking users table...");
        const { data, error } = await supabase
          .from("users")
          .select("id")
          .eq("id", user.id)
          .single();
        console.log("AuthManager: Users table response:", { data, error });

        if (error && error.code !== "PGRST116") {
          // PGRST116 is "no rows", expected if new
          console.error("AuthManager: Error checking users table:", error);
          if (error.code === "42501") {
            alert("RLS policy prevents access. Check Supabase policies.");
          } else {
            alert("Failed to verify user. Check table schema or RLS.");
          }
          setIsAuthenticated(false);
          navigate("/login", { replace: true });
          return;
        }

        if (!data) {
          console.log("AuthManager: Inserting new user...");
          const { error: insertError } = await supabase
            .from("users")
            .insert([{ id: user.id, email: user.email }]);
          if (insertError) {
            console.error("AuthManager: Error inserting user:", insertError);
            if (insertError.code !== "23505") {
              // Ignore duplicate key error
              alert(
                "Failed to initialize user. Check Supabase RLS policies or schema.",
              );
              setIsAuthenticated(false);
              navigate("/login", { replace: true });
              return;
            }
            console.log(
              "AuthManager: User may already exist (duplicate key ignored)",
            );
          } else {
            console.log("AuthManager: User inserted successfully");
          }
        } else {
          console.log("AuthManager: User already exists in table");
        }

        console.log("AuthManager: User initialization complete");
        setIsInitialized(true);
      } catch (error) {
        console.error("AuthManager: Error during auth check:", error);
        setIsAuthenticated(false);
        navigate("/login", { replace: true });
      }
    };

    checkAuth();

    console.log("AuthManager: Setting up auth state listener...");
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        console.log("AuthManager: Auth state change:", { event, session });
        if (event === "SIGNED_IN" && session) {
          setIsAuthenticated(true);
          setUserId(session.user.id);
          console.log("AuthManager: Signed in with ID:", session.user.id);
          navigate("/", { replace: true });
        } else if (event === "SIGNED_OUT") {
          setIsAuthenticated(false);
          setUserId("");
          console.log("AuthManager: Signed out");
          navigate("/login", { replace: true });
        }
      },
    );

    return () => {
      console.log("AuthManager: Cleaning up listener...");
      subscription.unsubscribe();
    };
  }, [navigate, setIsAuthenticated]);

  const handleLogout = async () => {
    try {
      console.log("AuthManager: Logging out...");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUserId("");
      setIsAuthenticated(false);
      navigate("/login", { replace: true });
      console.log("AuthManager: Logout successful");
    } catch (error) {
      console.error("AuthManager: Logout error:", error);
      alert("Failed to log out.");
    }
  };

  if (!isInitialized && !userId) {
    return <div>Authenticating...</div>;
  }

  return children({ handleLogout, userId, isInitialized });
};

export default memo(AuthManager);
