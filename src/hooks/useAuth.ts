import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

type RoleUsers = "admin_dinkes" | "admin_puskesmas" | "user_du" | "user_poli";

export type AuthProfile = {
  id: string;
  email_users: string;
  fullname_users: string;
  username: string;
  telepon: string | null;
  role_users: RoleUsers;
  id_puskesmas: string | null;
  id_poli: string | null;
  is_active: boolean;
};

type AuthState = {
  session: Session | null;
  profile: AuthProfile | null;
  loading: boolean;
};

async function fetchProfileDirect(userId: string, token: string): Promise<AuthProfile | null> {
  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=id,email_users,fullname_users,username,telepon,role_users,id_puskesmas,id_poli,is_active&limit=1`;
    const res = await fetch(url, {
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return rows?.[0] ?? null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    profile: null,
    loading: true,
  });

  useEffect(() => {
    // onAuthStateChange handle SEMUA kondisi:
    // - INITIAL_SESSION: restore session dari localStorage saat refresh
    // - SIGNED_IN: setelah login
    // - SIGNED_OUT: setelah logout
    // - TOKEN_REFRESHED: auto refresh token
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          const profile = await fetchProfileDirect(session.user.id, session.access_token);
          setState({ session, profile, loading: false });
        } else {
          setState({ session: null, profile: null, loading: false });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Auto logout 10 menit idle
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) return;
        timer = setTimeout(() => supabase.auth.signOut(), 10 * 60 * 1000);
      });
    };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, []);

  const login = async (emailOrUsername: string, password: string) => {
    const trimmed = emailOrUsername.trim();
    if (!trimmed || !password)
      throw new Error("Email/username dan password wajib diisi");

    let email = trimmed;
    if (!trimmed.includes("@")) {
      const { data: userRow } = await (supabase as any)
        .from("users")
        .select("email_users")
        .eq("username", trimmed)
        .maybeSingle();
      if (!userRow?.email_users) throw new Error("Username tidak ditemukan");
      email = userRow.email_users;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes("Invalid login credentials"))
        throw new Error("Username/email atau password salah");
      throw new Error(error.message);
    }

    // onAuthStateChange akan otomatis fire SIGNED_IN dan set state
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange akan otomatis fire SIGNED_OUT dan clear state
  };

  return {
    user: state.profile,
    session: state.session,
    role: state.profile?.role_users ?? null,
    loading: state.loading,
    isAuthenticated: Boolean(state.session),
    login,
    logout,
    signIn: login,
    signOut: logout,
    signUp: async () => { throw new Error("Register tidak tersedia lewat UI"); },
  };
}