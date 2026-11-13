"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { MusicUser } from "@/types/music";

interface AuthContextType {
  user: MusicUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  /** Exchanges a Firebase ID token for an HttpOnly session cookie. */
  loginWithGoogle: (idToken: string) => Promise<MusicUser>;
  /** Read-only demo session issued by the server. */
  loginAsGuest: () => Promise<MusicUser>;
  /** @deprecated Alias of loginAsGuest, kept for backwards compatibility. */
  login: (userData?: Partial<MusicUser>) => Promise<MusicUser>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MusicUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * The session lives in an HttpOnly cookie and is verified by the server.
   * Nothing security relevant is read from localStorage any more.
   */
  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!response.ok) {
          if (!cancelled) setUser(null);
          return;
        }
        const data = await response.json();
        if (!cancelled && data?.user) {
          setUser(data.user as MusicUser);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string): Promise<MusicUser> => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/session", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.user) {
        throw new Error(data?.message || "Sign-in failed");
      }

      const authenticated = data.user as MusicUser;
      setUser(authenticated);
      return authenticated;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginAsGuest = useCallback(async (): Promise<MusicUser> => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/guest", {
        method: "POST",
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.user) {
        throw new Error(data?.message || "Guest access is unavailable");
      }
      const guest = data.user as MusicUser;
      setUser(guest);
      return guest;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (_userData?: Partial<MusicUser>): Promise<MusicUser> => loginAsGuest(),
    [loginAsGuest]
  );

  const logout = useCallback(() => {
    setUser(null);
    void fetch("/api/auth/session", {
      method: "DELETE",
      credentials: "same-origin",
      keepalive: true,
    }).catch(() => undefined);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (response.status === 401) {
        setUser(null);
        return;
      }
      if (!response.ok) return;
      const data = await response.json();
      if (data?.user) setUser(data.user as MusicUser);
    } catch {
      // Network hiccup: keep the current state.
    }
  }, []);

  const isSuperAdmin = user?.role === "superadmin";
  const isAdmin = isSuperAdmin || user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin,
        isSuperAdmin,
        loginWithGoogle,
        loginAsGuest,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export { DEFAULT_AVATAR };
