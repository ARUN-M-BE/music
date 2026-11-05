import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { MusicPlayerProvider } from "@/context/MusicPlayerContext";
import { MusicSidebar } from "@/components/Music/MusicSidebar/MusicSidebar";
import { MusicHeader } from "@/components/Music/MusicHeader/MusicHeader";
import { MusicPlayer } from "@/components/Music/MusicPlayer/MusicPlayer";

export const metadata: Metadata = {
  title: "Good Music - Spotify-Style Streaming Platform",
  description: "Next.js High Fidelity Spotify-Style Music Streaming Platform by Arun M",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" className="dark">
      <body className="bg-[#121212] text-white min-h-screen flex flex-col antialiased">
        <LanguageProvider>
          <AuthProvider>
            <MusicPlayerProvider>
              <div className="flex h-screen w-full overflow-hidden">
                {/* Spotify-style Left Sidebar */}
                <MusicSidebar />

                {/* Main Content Pane */}
                <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                  <MusicHeader />
                  <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 pb-28">
                    {children}
                  </main>
                </div>
              </div>

              {/* Persistent Bottom Audio Streaming Bar */}
              <MusicPlayer />
            </MusicPlayerProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

