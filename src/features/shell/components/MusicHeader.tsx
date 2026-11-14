"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/shared/providers/LanguageContext";
import { useAuth } from "@/features/auth";
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  User,
  LogOut,
  ShieldCheck,
  Menu,
  Library,
  Home,
  ShieldAlert,
  Heart,
  Disc3,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/shared/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { ThemeToggle } from "@/shared/components/ThemeToggle";

export function MusicHeader() {
  const router = useRouter();
  const { language, toggleLanguage, t } = useLanguage();
  const { user, isAdmin, logout } = useAuth();

  const navLinks = [
    { label: t("nav.home"), href: "/", icon: Home },
    { label: t("nav.library"), href: "/library", icon: Library },
    { label: t("nav.favorites"), href: "/favorites", icon: Heart },
  ];

  const initials = (user?.name ?? "G")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-2 px-3 sm:px-6">
        {/* Left: mobile menu + history */}
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full md:hidden"
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
              <SheetTitle className="px-6 pb-2 pt-6 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                {t("nav.home")}
              </SheetTitle>
              <div className="flex flex-col gap-1 px-3">
                {navLinks.map((link) => (
                  <Button
                    key={link.href}
                    asChild
                    variant="ghost"
                    className="justify-start gap-3 rounded-xl px-3 py-6 text-sm font-medium"
                  >
                    <Link href={link.href}>
                      <link.icon className="size-5 text-primary" />
                      {link.label}
                    </Link>
                  </Button>
                ))}
                {isAdmin && (
                  <Button
                    asChild
                    variant="ghost"
                    className="justify-start gap-3 rounded-xl px-3 py-6 text-sm font-medium text-destructive hover:text-destructive"
                  >
                    <Link href="/admin">
                      <ShieldAlert className="size-5" />
                      {t("nav.admin")}
                    </Link>
                  </Button>
                )}
              </div>
              <Separator className="my-3" />
              <div className="px-6 pb-6 text-xs text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Disc3 className="size-3.5 text-primary" />
                  Good Music · Hi-Fi Studio
                </p>
              </div>
            </SheetContent>
          </Sheet>

          <div className="hidden items-center gap-1.5 sm:flex">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => router.back()}
                  className="rounded-full border-border bg-card"
                  aria-label="Back"
                >
                  <ChevronLeft className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Back</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => router.forward()}
                  className="rounded-full border-border bg-card"
                  aria-label="Forward"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Forward</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Right: language, theme, account */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="gap-2 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground"
            title="Toggle language"
          >
            <Globe className="size-4 text-primary" />
            <span className="hidden sm:inline">{language === "en" ? "العربية" : "English"}</span>
          </Button>

          <ThemeToggle className="rounded-full text-muted-foreground hover:text-foreground" />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 gap-2 rounded-full border-border bg-card pl-1 pr-3 hover:bg-accent"
                >
                  <Avatar className="size-7">
                    <AvatarImage src={user.imageURL || "/default-avatar.png"} alt={user.name} />
                    <AvatarFallback className="bg-primary/15 text-[10px] font-bold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-[110px] truncate text-xs font-semibold">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="space-y-1 pb-2">
                  <p className="truncate text-sm font-semibold">{user.name}</p>
                  <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
                  {(user.role === "admin" || user.role === "superadmin") && (
                    <Badge className="gap-1 bg-primary/15 text-[10px] font-bold uppercase text-primary hover:bg-primary/15">
                      <ShieldCheck className="size-3" />
                      {user.role}
                    </Badge>
                  )}
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href="/favorites" className="gap-2.5">
                    <Heart className="size-4 text-destructive" />
                    <span>{t("nav.favorites")}</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/profile" className="gap-2.5">
                    <User className="size-4 text-muted-foreground" />
                    <span>{t("nav.profile")}</span>
                  </Link>
                </DropdownMenuItem>

                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="gap-2.5 text-destructive focus:text-destructive">
                      <ShieldAlert className="size-4" />
                      <span>{t("nav.admin")}</span>
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onSelect={() => {
                    logout();
                    router.push("/login");
                  }}
                  className="gap-2.5 text-destructive focus:text-destructive"
                >
                  <LogOut className="size-4" />
                  <span>{t("nav.logout")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild className="rounded-full px-5 font-bold">
              <Link href="/login">{t("nav.login")}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
