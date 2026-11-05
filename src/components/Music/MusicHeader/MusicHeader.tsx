"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  User,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Library,
  Home,
  ShieldAlert,
  Heart,
} from "lucide-react";

export function MusicHeader() {
  const router = useRouter();
  const { language, toggleLanguage, t } = useLanguage();
  const { user, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 h-16 w-full bg-[#121212]/90 backdrop-blur-md border-b border-[#282828] px-4 sm:px-6 flex items-center justify-between">
        {/* Left: History Navigation + Mobile Hamburger */}
        <div className="flex items-center gap-2">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="md:hidden p-2 rounded-full text-[#b3b3b3] hover:text-white"
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>

          {/* History back/forward buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="size-8 rounded-full bg-black/60 flex items-center justify-center text-[#b3b3b3] hover:text-white transition-colors"
              aria-label="Back"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={() => router.forward()}
              className="size-8 rounded-full bg-black/60 flex items-center justify-center text-[#b3b3b3] hover:text-white transition-colors"
              aria-label="Forward"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>

        {/* Right: Language Switch + User Profile */}
        <div className="flex items-center gap-3">
          {/* Language Toggle Button */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#242424] hover:bg-[#2e2e2e] text-xs font-semibold text-white transition-colors border border-white/5"
            title="Toggle Language"
          >
            <Globe className="size-3.5 text-[#1db954]" />
            <span>{language === "en" ? "العربية" : "English"}</span>
          </button>

          {/* User Menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-full bg-black/70 hover:bg-[#282828] text-white transition-colors border border-white/10"
              >
                <div className="relative size-7 rounded-full overflow-hidden bg-[#333333]">
                  <Image
                    src={user.imageURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                    alt={user.name}
                    fill
                    sizes="28px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <span className="text-xs font-medium max-w-[100px] truncate">{user.name}</span>
              </button>

              {/* Dropdown Menu */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#282828] border border-white/10 shadow-2xl py-1 text-xs text-white z-50">
                  <div className="px-3 py-2 border-b border-[#383838]">
                    <p className="font-semibold truncate">{user.name}</p>
                    <p className="text-[11px] text-[#b3b3b3] truncate">{user.email}</p>
                    {(user.role === "admin" || user.role === "superadmin") && (
                      <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#1db954]/20 text-[#1db954] uppercase">
                        <ShieldCheck className="size-3" />
                        {user.role}
                      </span>
                    )}
                  </div>

                  <Link
                    href="/favorites"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 transition-colors text-purple-300"
                  >
                    <Heart className="size-4 fill-purple-400 text-purple-400" />
                    <span>{t("nav.favorites")}</span>
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 transition-colors"
                  >
                    <User className="size-4 text-[#b3b3b3]" />
                    <span>{t("nav.profile")}</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 hover:bg-white/10 transition-colors text-red-400"
                    >
                      <ShieldAlert className="size-4" />
                      <span>{t("nav.admin")}</span>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                      router.push("/login");
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-white/10 text-red-400 transition-colors border-t border-[#383838]"
                  >
                    <LogOut className="size-4" />
                    <span>{t("nav.logout")}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="px-5 py-2 rounded-full bg-white text-black font-bold text-xs hover:scale-105 active:scale-95 transition-transform"
            >
              {t("nav.login")}
            </Link>
          )}
        </div>
      </header>

      {/* Mobile Nav Drawer */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 z-40 bg-black/95 backdrop-blur-xl border-b border-[#282828] p-4 flex flex-col gap-2">
          <Link
            href="/"
            onClick={() => setMobileNavOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg text-sm text-white font-medium hover:bg-white/10"
          >
            <Home className="size-5 text-[#1db954]" />
            <span>{t("nav.home")}</span>
          </Link>
          <Link
            href="/library"
            onClick={() => setMobileNavOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg text-sm text-white font-medium hover:bg-white/10"
          >
            <Library className="size-5 text-[#1db954]" />
            <span>{t("nav.library")}</span>
          </Link>
          <Link
            href="/favorites"
            onClick={() => setMobileNavOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg text-sm text-purple-300 font-medium hover:bg-white/10"
          >
            <Heart className="size-5 fill-purple-400 text-purple-400" />
            <span>{t("nav.favorites")}</span>
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMobileNavOpen(false)}
              className="flex items-center gap-3 p-3 rounded-lg text-sm text-red-400 font-medium hover:bg-white/10"
            >
              <ShieldAlert className="size-5" />
              <span>{t("nav.admin")}</span>
            </Link>
          )}
        </div>
      )}
    </>
  );
}

