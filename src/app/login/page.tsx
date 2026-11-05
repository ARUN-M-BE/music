"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { firebaseAuth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { ConfirmationModal } from "@/components/Common/ConfirmationModal";
import {
  Headphones,
  Shield,
  User,
  ArrowRight,
  Loader2,
  LogOut,
  CheckCircle2,
  Music2,
  Play,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { user, loginWithGoogle, login, logout, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: "danger" | "warning" | "info" | "success";
  } | null>(null);

  // 1. Direct Firebase Google OAuth Login
  const handleFirebaseGoogleLogin = async () => {
    setLoading(true);
    try {
      const userCred = await signInWithPopup(firebaseAuth, googleProvider);
      if (userCred && userCred.user) {
        const fbUser = userCred.user;
        const loggedUser = await loginWithGoogle({
          name: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
          email: fbUser.email || "",
          imageURL: fbUser.photoURL || undefined,
          user_id: fbUser.uid,
          email_verified: fbUser.emailVerified,
        });

        if (loggedUser.role === "admin" || loggedUser.role === "superadmin") {
          router.push("/admin");
        } else {
          router.push("/");
        }
      }
    } catch (err: any) {
      console.error("Firebase Google Auth error:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        setAlertInfo({
          isOpen: true,
          title: "Google Sign-In Error",
          message: err.message || "Failed to sign in with Google OAuth.",
          type: "danger",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Single Demo Option: Immediate access to listen to songs
  const handleDemoListenerAccess = async () => {
    setLoading(true);
    try {
      await login({
        name: "Demo Listener",
        email: "demouser.listener@gmail.com",
        imageURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
        user_id: "demo_guest_listener",
        email_verified: true,
        role: "member",
      });

      router.push("/");
    } catch (err: any) {
      setAlertInfo({
        isOpen: true,
        title: "Guest Access Error",
        message: err.message || "Could not launch demo listener session.",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-[#181818] border border-white/10 shadow-2xl space-y-6 text-center">
        {/* Brand Header */}
        <div className="size-16 rounded-full bg-gradient-to-tr from-[#1db954] to-emerald-400 mx-auto flex items-center justify-center text-black shadow-xl shadow-[#1db954]/20">
          <Headphones className="size-8" />
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Good Music Platform
          </h1>
          <p className="text-xs sm:text-sm text-[#b3b3b3] mt-1.5">
            Spotify-Style High Fidelity Streaming & Catalog
          </p>
        </div>

        {/* ACTIVE SESSION STATE */}
        {user ? (
          <div className="p-5 rounded-2xl bg-[#242424] border border-white/10 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="relative size-14 rounded-full overflow-hidden bg-[#333333] shrink-0 border border-white/10">
                <Image
                  src={user.imageURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                  alt={user.name}
                  fill
                  sizes="56px"
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm sm:text-base font-bold text-white truncate">{user.name}</span>
                  <CheckCircle2 className="size-4 text-[#1db954]" />
                </div>
                <span className="text-xs text-[#b3b3b3] truncate block font-mono">
                  {user.email}
                </span>
                <span
                  className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isAdmin
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-[#1db954]/20 text-[#1db954] border border-[#1db954]/30"
                  }`}
                >
                  {user.role}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-[#333333]">
              <button
                onClick={() => router.push("/")}
                className="w-full h-11 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-extrabold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-[#1db954]/20"
              >
                <span>Continue to Music Home</span>
                <ArrowRight className="size-4" />
              </button>

              {isAdmin && (
                <button
                  onClick={() => router.push("/admin")}
                  className="w-full h-11 rounded-full bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-red-600/20"
                >
                  <Shield className="size-4 fill-white" />
                  <span>Open Admin Studio (Superadmin)</span>
                </button>
              )}

              <button
                onClick={logout}
                className="w-full h-10 rounded-full bg-[#333333] hover:bg-[#444444] text-[#b3b3b3] hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="size-4" />
                <span>Sign Out / Switch</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Direct Google OAuth Login Button */}
            <button
              onClick={handleFirebaseGoogleLogin}
              disabled={loading}
              className="w-full h-12 rounded-full bg-white hover:bg-gray-100 text-black font-extrabold text-sm flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-xl"
            >
              {loading ? (
                <Loader2 className="size-5 animate-spin text-black" />
              ) : (
                <>
                  <svg className="size-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Subtle Divider */}
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#282828]" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-semibold">
                <span className="bg-[#181818] px-3 text-[#727272]">Or Stream Immediately</span>
              </div>
            </div>

            {/* ONLY ONE DEMO BUTTON TO HEAR SONGS */}
            <button
              onClick={handleDemoListenerAccess}
              disabled={loading}
              className="w-full h-11 rounded-full bg-[#242424] hover:bg-[#2e2e2e] text-white font-bold text-xs flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.98] border border-white/10 shadow-md"
            >
              <Play className="size-3.5 fill-[#1db954] text-[#1db954]" />
              <span>Listen as Guest (Hear 75+ Songs)</span>
            </button>
          </div>
        )}

        {/* Security & RBAC Disclaimer */}
        <p className="text-[11px] text-[#727272] pt-2">
          Firebase Google OAuth & Server-Side RBAC.
        </p>
      </div>

      {/* ALERT MODAL */}
      {alertInfo && (
        <ConfirmationModal
          isOpen={alertInfo.isOpen}
          title={alertInfo.title}
          message={alertInfo.message}
          type={alertInfo.type || "danger"}
          confirmText="OK"
          isAlertOnly={true}
          onConfirm={() => setAlertInfo(null)}
          onClose={() => setAlertInfo(null)}
        />
      )}
    </div>
  );
}
