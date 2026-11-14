"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth";
import { SecretBox } from "@/features/admin";
import { ArrowLeft, LogIn, ShieldAlert } from "lucide-react";

/**
 * Operator tool for encrypting configuration values. The page is gated like
 * `/admin` (rendering only - the cryptography runs in the tab, so there is no
 * endpoint to protect), and a guest is told to sign in instead.
 */
export default function SecretBoxPage() {
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <p className="text-sm">Checking administrator privileges...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto space-y-4">
        <div className="size-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
          <ShieldAlert className="size-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Administrator Access Required</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Encrypting and decrypting configuration values is limited to system administrators.
        </p>
        <Link
          href="/login"
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-bold text-xs hover:scale-105 transition-transform"
        >
          <LogIn className="size-4" />
          <span>Sign In as Admin</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        <span>Back to Admin Studio</span>
      </Link>

      <SecretBox />
    </div>
  );
}
