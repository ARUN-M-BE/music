"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useAuth } from "../context/AuthContext";
import { Clock, RefreshCw, LogOut } from "lucide-react";

export function PendingApprovalGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading, refreshUser, logout, isSuperAdmin } = useAuth();
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // If loading session, superadmin, or not pending, allow access
  if (isLoading) {
    return <>{children}</>;
  }

  // If user is logged in and their account status is explicitly "pending"
  if (user && user.status === "pending" && !isSuperAdmin) {
    const handleCheckStatus = async () => {
      setChecking(true);
      setStatusMessage(null);
      try {
        await refreshUser();
        setStatusMessage("Checked status. If an admin just approved you, reload the page.");
      } catch {
        setStatusMessage("Could not check status right now. Please try again.");
      } finally {
        setChecking(false);
      }
    };

    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background select-none">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-card border border-warning/20 shadow-2xl text-center space-y-6">
          {/* Brand & Pending Icon */}
          <div className="relative size-20 rounded-full bg-warning/10 border border-warning/30 flex items-center justify-center mx-auto text-warning shadow-xl shadow-warning/10">
            <Clock className="size-10 animate-pulse" />
          </div>

          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground tracking-tight">
              Account Pending Approval
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
              Your account has been registered via Google, but access to Good Music is restricted until an administrator approves your account.
            </p>
          </div>

          {/* User Profile Card */}
          <div className="p-4 rounded-2xl bg-muted border border-border flex items-center gap-3 text-left">
            <div className="relative size-12 rounded-full overflow-hidden bg-muted shrink-0 border border-border">
              <Image
                src={user.imageURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                alt={user.name}
                fill
                sizes="48px"
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate font-mono">{user.email}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-warning/15 text-warning border border-warning/30">
                  Status: Pending
                </span>
              </div>
            </div>
          </div>

          {statusMessage && (
            <p className="text-xs text-warning font-medium bg-warning/10 p-2.5 rounded-xl border border-warning/20">
              {statusMessage}
            </p>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleCheckStatus}
              disabled={checking}
              className="w-full h-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-primary/20"
            >
              <RefreshCw className={`size-4 ${checking ? "animate-spin" : ""}`} />
              <span>{checking ? "Checking Status..." : "Check Approval Status"}</span>
            </button>

            <button
              onClick={logout}
              className="w-full h-10 rounded-full bg-muted hover:bg-accent text-muted-foreground hover:text-foreground font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="size-4" />
              <span>Sign Out / Switch Account</span>
            </button>
          </div>

          {/* Footer Notice */}
          <p className="text-[11px] text-muted-foreground/70">
            Platform Administrator: <strong className="text-foreground">Arun M</strong>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

