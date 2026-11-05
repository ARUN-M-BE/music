import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cleanDistDir: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "cdn-icons-png.flaticon.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  serverExternalPackages: ["mongoose"],
  typescript: {
    ignoreBuildErrors: false,
  },
  async rewrites() {
    return [
      // Legacy MERN API backward-compatibility routes
      { source: "/api/songs/getAll", destination: "/api/songs" },
      { source: "/api/songs/save", destination: "/api/songs" },
      { source: "/api/songs/getOne/:id", destination: "/api/songs/:id" },
      { source: "/api/songs/update/:id", destination: "/api/songs/:id" },
      { source: "/api/songs/delete/:id", destination: "/api/songs/:id" },
      { source: "/api/albums/getAll", destination: "/api/albums" },
      { source: "/api/albums/save", destination: "/api/albums" },
      { source: "/api/albums/delete/:id", destination: "/api/albums/:id" },
      { source: "/api/artists/getAll", destination: "/api/artists" },
      { source: "/api/artists/save", destination: "/api/artists" },
      { source: "/api/artists/delete/:id", destination: "/api/artists/:id" },
      { source: "/api/users/getAll", destination: "/api/users" },
      { source: "/api/users/login", destination: "/api/users" },
      { source: "/api/users/updateRole/:id", destination: "/api/users/:id/role" },
      { source: "/api/users/delete/:id", destination: "/api/users/:id" },
      { source: "/auth", destination: "/api/auth/imagekit" },
    ];
  },
};

export default nextConfig;
