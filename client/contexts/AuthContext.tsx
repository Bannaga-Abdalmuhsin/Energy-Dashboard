import { createContext, useContext, useMemo, useState } from "react";
import { AppUser, getStoredUser, signIn as signInRequest, signOut as signOutRequest } from "@/lib/supabase";

type AuthValue = {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState(false);
  const value = useMemo<AuthValue>(() => ({
    user,
    loading,
    login: async (email, password) => {
      setLoading(true);
      try { setUser(await signInRequest(email, password)); }
      finally { setLoading(false); }
    },
    logout: () => { signOutRequest(); setUser(null); },
  }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
