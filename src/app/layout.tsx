import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/shared/providers/LanguageContext";
import { AuthProvider, PendingApprovalGate } from "@/features/auth";
import { MusicPlayer, MusicPlayerProvider } from "@/features/player";
import { ThemeProvider } from "@/shared/providers/theme-provider";
import { MusicHeader, MusicSidebar } from "@/features/shell";
import { MotionProvider, PageTransition } from "@/shared/motion";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { Toaster } from "@/shared/ui/sonner";

/*
 * Type pairing (both Google Fonts):
 *   Sora            - geometric display face for headlines and numerals.
 *   Plus Jakarta Sans - humanist body face with tall x-height, legible at 12px
 *                       in dense track rows.
 * Fonts are self-hosted by next/font, so there is no render-blocking request to
 * fonts.googleapis.com and no layout shift (size-adjust fallback is automatic).
 */
const display = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display-face",
  display: "swap",
});

const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Good Music - Hi-Fi Streaming Studio",
    template: "%s · Good Music",
  },
  description:
    "High-fidelity music streaming for your personal library - built with Next.js, MongoDB and Cloudflare Workers.",
  applicationName: "Good Music",
  icons: { icon: "/logo.png", apple: "/logo.png" },
  openGraph: {
    title: "Good Music - Hi-Fi Streaming Studio",
    description: "Your library, your sound. Lossless streaming at the edge.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0c" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <MotionProvider>
            <TooltipProvider delayDuration={200}>
              <LanguageProvider>
                <AuthProvider>
                  <PendingApprovalGate>
                    <MusicPlayerProvider>
                      <div className="flex h-dvh w-full overflow-hidden bg-background">
                        {/* Desktop navigation rail */}
                        <MusicSidebar />

                        {/* Main content pane */}
                        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                          <MusicHeader />
                          <main
                            id="main-content"
                            className="flex-1 overflow-y-auto px-4 pb-28 pt-4 sm:px-6 sm:pt-6 lg:px-8"
                          >
                            <PageTransition>{children}</PageTransition>
                          </main>
                        </div>
                      </div>

                      {/* Persistent bottom audio bar */}
                      <MusicPlayer />
                    </MusicPlayerProvider>
                  </PendingApprovalGate>
                </AuthProvider>
              </LanguageProvider>
              <Toaster position="top-center" richColors closeButton />
            </TooltipProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
