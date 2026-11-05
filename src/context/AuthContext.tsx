"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { MusicUser } from "@/types/music";

interface AuthContextType {
  user: MusicUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (userData: Partial<MusicUser>) => Promise<MusicUser>;
  loginWithGoogle: (googleUser: {
    name: string;
    email: string;
    imageURL?: string;
    user_id?: string;
    email_verified?: boolean;
  }) => Promise<MusicUser>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = "arunm102301@gmail.com";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MusicUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session from localStorage or cookie
  useEffect(() => {
    try {
      const stored = localStorage.getItem("music_user");
      if (stored) {
        const parsed: MusicUser = JSON.parse(stored);
        // Ensure role is admin if matches admin email
        if (parsed.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          parsed.role = "admin";
        }
        setUser(parsed);
      }
    } catch (e) {
      console.warn("Failed to read stored user session:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync user with backend database
  const syncWithBackend = async (userData: Partial<MusicUser>): Promise<MusicUser> => {
    const email = userData.email || "listener@goodmusic.io";
    const userId = userData.user_id || `uid_${Date.now()}`;
    const isAdminUser = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userData.name || "User",
          email,
          imageURL: userData.imageURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
          user_id: userId,
          email_verified: userData.email_verified ?? true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const syncedUser: MusicUser = {
            ...data.user,
            role: isAdminUser ? "admin" : data.user.role || "member",
          };
          return syncedUser;
        }
      }
    } catch (err) {
      console.warn("Could not sync user with backend, using client session:", err);
    }

    // Client fallback if network offline
    return {
      _id: userData._id || `user_${Date.now()}`,
      name: userData.name || "User",
      email,
      imageURL: userData.imageURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
      user_id: userId,
      email_verified: userData.email_verified ?? true,
      role: isAdminUser ? "admin" : userData.role || "member",
      auth_time: new Date().toISOString(),
    };
  };

  const saveSession = (completeUser: MusicUser) => {
    setUser(completeUser);
    localStorage.setItem("music_user", JSON.stringify(completeUser));
    document.cookie = `music_auth_session=${encodeURIComponent(
      JSON.stringify(completeUser)
    )}; path=/; max-age=2592000; SameSite=Lax`;
  };

  const login = useCallback(async (userData: Partial<MusicUser>): Promise<MusicUser> => {
    setIsLoading(true);
    const completeUser = await syncWithBackend(userData);
    saveSession(completeUser);
    setIsLoading(false);
    return completeUser;
  }, []);

  const loginWithGoogle = useCallback(
    async (googleUser: {
      name: string;
      email: string;
      imageURL?: string;
      user_id?: string;
      email_verified?: boolean;
    }): Promise<MusicUser> => {
      setIsLoading(true);
      const completeUser = await syncWithBackend({
        name: googleUser.name,
        email: googleUser.email,
        imageURL: googleUser.imageURL,
        user_id: googleUser.user_id || `google_${Date.now()}`,
        email_verified: googleUser.email_verified ?? true,
        role: googleUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? "admin" : "member",
      });
      saveSession(completeUser);
      setIsLoading(false);
      return completeUser;
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("music_user");
    document.cookie = "music_auth_session=; path=/; max-age=0";
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        const found = (data.users || data.data || []).find(
          (u: MusicUser) => u.user_id === user.user_id || u.email === user.email
        );
        if (found) {
          saveSession(found);
        }
      }
    } catch {
      // Ignore background refresh failure
    }
  }, [user]);

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin,
        login,
        loginWithGoogle,
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
