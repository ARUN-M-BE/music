"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { AdminDashboard } from "@/components/Music/Admin/AdminDashboard";
import { ShieldAlert, LogIn } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const { user, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-[#b3b3b3]">
        <p className="text-sm">Authenticating admin privileges...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto space-y-4">
        <div className="size-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
          <ShieldAlert className="size-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Administrator Access Required</h2>
        <p className="text-xs text-[#b3b3b3] leading-relaxed">
          You must be logged in as an authorized system administrator to manage tracks, audio assets, and user permissions.
        </p>
        <Link
          href="/login"
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:scale-105 transition-transform"
        >
          <LogIn className="size-4" />
          <span>Sign In as Admin</span>
        </Link>
      </div>
    );
  }

  return <AdminDashboard />;
}

