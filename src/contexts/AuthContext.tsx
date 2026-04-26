import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";

export type UserRole = "admin" | "staff";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchProfile(supabaseUser: SupabaseUser): Promise<AppUser> {
  const { data, error } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", supabaseUser.id)
    .single();

  if (error || !data) {
    // Fallback: derive from auth metadata
    return {
      id: supabaseUser.id,
      email: supabaseUser.email ?? "",
      name: supabaseUser.user_metadata?.name ?? supabaseUser.email?.split("@")[0] ?? "User",
      role: (supabaseUser.user_metadata?.role as UserRole) ?? "staff",
    };
  }

  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? "",
    name: data.name,
    role: data.role as UserRole,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    // Failsafe: if Supabase takes longer than 5 seconds to respond, force loading to false
    const fallbackTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn("Auth initialization timed out after 5s. Forcing UI to load.");
        setLoading(false);
      }
    }, 5000);

    const initializeAuth = async () => {
      try {
        // 1. Get initial session
        console.log("Fetching initial session...");
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        console.log("getSession resolved", session ? "with session" : "no session");
        if (isMounted) setSession(session);
        if (session?.user) {
          console.log("Fetching profile...");
          const profile = await fetchProfile(session.user);
          console.log("Profile fetched", profile);
          if (isMounted) setUser(profile);
        }
      } catch (e) {
        console.error("Failed to initialize session", e);
      } finally {
        if (isMounted) {
          setLoading(false);
          clearTimeout(fallbackTimeout);
        }
      }

      // 2. ONLY subscribe after initial session is resolved to prevent lock contention
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          console.log("Auth state changed:", _event);
          // Skip INITIAL_SESSION since we just handled it manually
          if (_event === "INITIAL_SESSION") return;

          if (isMounted) setSession(session);
          if (session?.user) {
            try {
              const profile = await fetchProfile(session.user);
              if (isMounted) setUser(profile);
            } catch (e) {
              console.error("Failed to fetch profile on auth change", e);
            }
          } else {
            if (isMounted) setUser(null);
          }
          if (isMounted) {
            setLoading(false);
            clearTimeout(fallbackTimeout);
          }
        }
      );

      authSubscription = subscription;
    };

    initializeAuth();

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimeout);
      authSubscription?.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string, role: UserRole) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
        emailRedirectTo: "https://donnect.vercel.app/login"
      },
    });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      login,
      signup,
      logout,
      isAdmin: user?.role === "admin",
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
