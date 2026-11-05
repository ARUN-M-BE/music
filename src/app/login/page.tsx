"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ConfirmationModal } from "@/components/Common/ConfirmationModal";
import {
  Headphones,
  Shield,
  User,
  ArrowRight,
  Loader2,
  LogOut,
  Mail,
  CheckCircle2,
  Sparkles,
  Music2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { user, loginWithGoogle, login, logout, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [alertInfo, setAlertInfo] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: "danger" | "warning" | "info" | "success";
  } | null>(null);

  // 1. Admin Sign In (Arun M)
  const handleAdminSignIn = async () => {
    setLoading(true);
    try {
      const loggedUser = await loginWithGoogle({
        name: "Arun M",
        email: "arunm102301@gmail.com",
        imageURL: "https://lh3.googleusercontent.com/a/ACg8ocKLgmsZvTYOj-KFc7ku16Wc0IKZGEH5l3q3xchI0aj2IgqRl_l7=s96-c",
        user_id: "pyNATnPutkWrHUDq0xVJuKXa5Sz1",
        email_verified: true,
      });

      router.push("/admin");
    } catch (err: any) {
      setAlertInfo({
        isOpen: true,
        title: "Login Error",
        message: err.message || "Failed to sign in as Administrator",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  // 2. Demo Listener Member Sign In (Different distinct credential!)
  const handleMemberSignIn = async () => {
    setLoading(true);
    try {
      await login({
        name: "Demo Listener",
        email: "demouser.listener@gmail.com",
        imageURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
        user_id: "demo_listener_2026",
        email_verified: true,
        role: "member",
      });

      router.push("/");
    } catch (err: any) {
      setAlertInfo({
        isOpen: true,
        title: "Login Error",
        message: err.message || "Failed to sign in as Demo Listener",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  // 3. Custom Google Account Submission (No browser prompt/alert)
  const handleCustomGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;

    setLoading(true);
    const cleanEmail = customEmail.trim().toLowerCase();
    const cleanName = customName.trim() || cleanEmail.split("@")[0].replace(/[._]/g, " ");

    try {
      const loggedUser = await loginWithGoogle({
        name: cleanName,
        email: cleanEmail,
        imageURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`,
        user_id: `g_${Date.now()}`,
        email_verified: true,
      });

      setShowCustomModal(false);
      setCustomEmail("");
      setCustomName("");

      if (loggedUser.role === "admin" || loggedUser.role === "superadmin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setAlertInfo({
        isOpen: true,
        title: "Authentication Error",
        message: err.message || "Could not complete sign in",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-[#181818] border border-white/10 shadow-2xl space-y-6 text-center">
        {/* Brand Icon */}
        <div className="size-16 rounded-full bg-gradient-to-tr from-[#1db954] to-emerald-400 mx-auto flex items-center justify-center text-black shadow-xl shadow-[#1db954]/20">
          <Headphones className="size-8" />
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Good Music Platform
          </h1>
          <p className="text-xs sm:text-sm text-[#b3b3b3] mt-1.5">
            Spotify-Style High Fidelity Streaming & Admin Studio
          </p>
        </div>

        {/* ACTIVE SESSION MANAGER */}
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
                  {isAdmin ? "ADMINISTRATOR" : "MEMBER LISTENER"}
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
                  <span>Open Admin Studio (Manage 70+ Tracks)</span>
                </button>
              )}

              <button
                onClick={logout}
                className="w-full h-10 rounded-full bg-[#333333] hover:bg-[#444444] text-[#b3b3b3] hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="size-4" />
                <span>Switch / Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {/* ADMIN ACCESS CARD */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/40 to-[#221010] border border-red-500/20 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20">
                  ADMINISTRATOR CREDENTIALS
                </span>
                <Sparkles className="size-3.5 text-red-400" />
              </div>
              <div>
                <p className="text-xs text-white font-bold">Arun M (Platform Administrator)</p>
                <p className="text-[11px] text-[#b3b3b3] font-mono mt-0.5">arunm102301@gmail.com</p>
              </div>
              <button
                onClick={handleAdminSignIn}
                disabled={loading}
                className="w-full h-11 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-red-600/25"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin text-white" />
                ) : (
                  <>
                    <Shield className="size-4 fill-white" />
                    <span>Sign In as Admin (Arun M)</span>
                  </>
                )}
              </button>
            </div>

            {/* DEMO LISTENER CARD (Completely different credential) */}
            <div className="p-4 rounded-2xl bg-[#202020] border border-white/5 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1db954] bg-[#1db954]/10 px-2.5 py-0.5 rounded-full border border-[#1db954]/20">
                  DEMO LISTENER CREDENTIALS
                </span>
                <Music2 className="size-3.5 text-[#1db954]" />
              </div>
              <div>
                <p className="text-xs text-white font-bold">Demo Listener (Standard Member)</p>
                <p className="text-[11px] text-[#b3b3b3] font-mono mt-0.5">demouser.listener@gmail.com</p>
              </div>
              <button
                onClick={handleMemberSignIn}
                disabled={loading}
                className="w-full h-11 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-[#1db954]/20"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin text-black" />
                ) : (
                  <>
                    <User className="size-4" />
                    <span>Sign In as Demo Listener</span>
                  </>
                )}
              </button>
            </div>

            {/* Custom Google Account Modal Trigger */}
            <button
              type="button"
              onClick={() => setShowCustomModal(true)}
              className="w-full h-11 rounded-full bg-white hover:bg-gray-100 text-black font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md"
            >
              <svg className="size-4" viewBox="0 0 24 24">
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
              <span>Sign In with Another Google Account</span>
            </button>
          </div>
        )}

        {/* Security & RBAC Disclaimer */}
        <p className="text-[11px] text-[#727272] pt-2">
          Protected with Server-Side RBAC & MongoDB Atlas Live Catalog.
        </p>
      </div>

      {/* CUSTOM GOOGLE ACCOUNT MODAL (No window.prompt!) */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowCustomModal(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md p-6 rounded-2xl bg-[#181818] border border-white/10 shadow-2xl space-y-4 text-left z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Google Account Sign-In</h3>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-[#b3b3b3] hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-[#b3b3b3]">
              Enter your Google email address to sign in or create your listener profile:
            </p>

            <form onSubmit={handleCustomGoogleSubmit} className="space-y-3 pt-1">
              <div>
                <label className="text-[11px] text-[#b3b3b3] block mb-1">Google Email Address *</label>
                <input
                  type="email"
                  required
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full h-10 px-3 rounded-lg bg-[#242424] border border-[#383838] focus:border-[#1db954] text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#b3b3b3] block mb-1">Display Name (Optional)</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Maya Lin"
                  className="w-full h-10 px-3 rounded-lg bg-[#242424] border border-[#383838] focus:border-[#1db954] text-xs text-white outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 rounded-full bg-[#242424] text-xs text-[#b3b3b3] hover:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !customEmail}
                  className="px-5 py-2 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-bold text-xs flex items-center gap-2"
                >
                  {loading && <Loader2 className="size-3.5 animate-spin" />}
                  <span>Sign In</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ALERT MODAL (Replaces window.alert!) */}
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
