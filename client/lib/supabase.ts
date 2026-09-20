export type AppUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "manager" | "viewer";
};

const url = String(import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const anonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "");

export const isSupabaseConfigured = Boolean(url && anonKey);

const storageKey = "stc-cow-energy-session";

export function getStoredUser(): AppUser | null {
  try {
    const value = sessionStorage.getItem(storageKey);
    return value ? (JSON.parse(value) as AppUser) : null;
  } catch {
    return null;
  }
}

export async function signIn(email: string, password: string): Promise<AppUser> {
  if (!isSupabaseConfigured) {
    if (!email.trim() || !password.trim()) throw new Error("Enter your email and password.");
    const demo: AppUser = {
      id: "demo-user",
      email: email.trim(),
      name: email.split("@")[0].replace(/[._-]+/g, " "),
      role: "admin",
    };
    sessionStorage.setItem(storageKey, JSON.stringify(demo));
    return demo;
  }

  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error_description || data?.msg || "Sign in failed.");
  const metadata = data.user?.user_metadata || {};
  const user: AppUser = {
    id: data.user.id,
    email: data.user.email,
    name: metadata.full_name || data.user.email.split("@")[0],
    role: metadata.role || "viewer",
  };
  sessionStorage.setItem(storageKey, JSON.stringify(user));
  sessionStorage.setItem(`${storageKey}-token`, data.access_token);
  return user;
}

export function signOut() {
  sessionStorage.removeItem(storageKey);
  sessionStorage.removeItem(`${storageKey}-token`);
}

export async function selectRows<T>(table: string, query = "select=*"): Promise<T[]> {
  if (!isSupabaseConfigured) return [];
  const token = sessionStorage.getItem(`${storageKey}-token`) || anonKey;
  const response = await fetch(`${url}/rest/v1/${table}?${query}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Unable to load ${table}`);
  return response.json();
}
