"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth";
import { signInWithGoogle } from "@/lib/firebase";
import { errorField, errorMessage } from "@/lib/errors";
import { ConfirmationModal } from "@/shared/components/ConfirmationModal";
import { Reveal } from "@/shared/motion";
import {
  Headphones,
  Shield,
  ArrowRight,
  Loader2,
  LogOut,
  CheckCircle2,
  Music2,
  Play,
  Sparkles,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";

const FEATURES = [
  { icon: Music2, title: "Lossless catalog", copy: "Your library streamed at studio fidelity." },
  { icon: Sparkles, title: "Smart discovery", copy: "Charts, moods and genres curated daily." },
  { icon: Shield, title: "Private by default", copy: "Sessions verified server-side, never shared." },
];

function GoogleMark() {
  return (
    <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
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
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loginWithGoogle, loginAsGuest, logout, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: "danger" | "warning" | "info" | "success";
  } | null>(null);

  const handleFirebaseGoogleLogin = async () => {
    setLoading(true);
    try {
      // The ID token is verified server-side before a session is issued.
      const idToken = await signInWithGoogle();
      const loggedUser = await loginWithGoogle(idToken);

      if (loggedUser.role === "admin" || loggedUser.role === "superadmin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err) {
      console.error("Firebase Google Auth error:", err);
      if (errorField(err, "code") !== "auth/popup-closed-by-user") {
        setAlertInfo({
          isOpen: true,
          title: "Google Sign-In Error",
          message: errorMessage(err, "Failed to sign in with Google OAuth."),
          type: "danger",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoListenerAccess = async () => {
    setLoading(true);
    try {
      // Server-issued, non-privileged demo session (no client supplied identity).
      await loginAsGuest();
      router.push("/");
    } catch (err) {
      setAlertInfo({
        isOpen: true,
        title: "Guest Access Error",
        message: errorMessage(err, "Could not launch demo listener session."),
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-9rem)] w-full max-w-5xl items-center justify-center py-6">
      <div className="grid w-full overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-scrim/5 lg:grid-cols-[1.05fr_1fr]">
        {/* Editorial panel */}
        <div className="relative hidden flex-col justify-between p-10 lg:flex">
          <div className="brand-glow absolute inset-0" aria-hidden />
          <div className="relative space-y-6">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-primary/60 text-primary-foreground shadow-xl shadow-primary/25">
              <Headphones className="size-7" />
            </div>

            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                Studio Hi-Fi
              </p>
              <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight">
                Your library,
                <br />
                your sound.
              </h1>
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                A private streaming studio for the music you actually love - synced favorites,
                gapless playback and a catalog that follows you.
              </p>
            </div>
          </div>

          <Reveal delay={0.1}>
            <ul className="relative mt-10 space-y-4">
              {FEATURES.map((feature) => (
                <li key={feature.title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                    <feature.icon className="size-4" />
                  </span>
                  <span className="space-y-0.5">
                    <span className="block text-sm font-semibold">{feature.title}</span>
                    <span className="block text-xs text-muted-foreground">{feature.copy}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* Auth panel */}
        <Reveal
          delay={0.05}
          className="flex flex-col justify-center gap-6 border-t border-border p-6 sm:p-10 lg:border-l lg:border-t-0"
        >
          <div className="space-y-1.5 text-center lg:text-left">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-primary/60 text-primary-foreground shadow-lg shadow-primary/20 lg:hidden">
              <Headphones className="size-6" />
            </div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              {user ? "You're signed in" : "Welcome back"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {user
                ? "Your session is active on this device."
                : "Sign in with Google, or listen instantly as a guest."}
            </p>
          </div>

          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/60 p-4">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                  <Image
                    src={user.imageURL || "/default-avatar.png"}
                    alt={user.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold">{user.name}</span>
                    <CheckCircle2 className="size-4 shrink-0 text-primary" />
                  </div>
                  <span className="block truncate font-mono text-xs text-muted-foreground">
                    {user.email}
                  </span>
                  <Badge
                    variant={isAdmin ? "destructive" : "secondary"}
                    className="mt-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  >
                    {user.role}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={() => router.push("/")}
                  className="h-11 w-full gap-2 rounded-full font-bold"
                >
                  Continue to music
                  <ArrowRight className="size-4" />
                </Button>

                {isAdmin && (
                  <Button
                    onClick={() => router.push("/admin")}
                    variant="destructive"
                    className="h-11 w-full gap-2 rounded-full font-bold"
                  >
                    <Shield className="size-4" />
                    Open admin studio
                  </Button>
                )}

                <Button
                  onClick={logout}
                  variant="ghost"
                  className="h-10 w-full gap-2 rounded-full text-xs text-muted-foreground"
                >
                  <LogOut className="size-4" />
                  Sign out / switch account
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                onClick={handleFirebaseGoogleLogin}
                disabled={loading}
                size="lg"
                className="h-12 w-full gap-3 rounded-full bg-foreground text-sm font-bold text-background hover:bg-foreground/90"
              >
                {loading ? <Loader2 className="size-5 animate-spin" /> : <GoogleMark />}
                <span>Continue with Google</span>
              </Button>

              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  or stream now
                </span>
              </div>

              <Button
                onClick={handleDemoListenerAccess}
                disabled={loading}
                variant="outline"
                size="lg"
                className="h-11 w-full gap-2 rounded-full text-xs font-bold"
              >
                <Play className="size-3.5 fill-primary text-primary" />
                Listen as guest
              </Button>

              <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
                Firebase Google OAuth with server-side RBAC. Guest sessions are read-only and expire
                automatically.
              </p>
            </div>
          )}
        </Reveal>
      </div>

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
