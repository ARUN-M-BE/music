import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      data: [
        {
          id: "music-app",
          title: "Good Music",
          description: "High-performance streaming music platform powered by Next.js & Cloudflare Workers",
          url: "https://music.arun-m.in",
          status: "active",
        },
      ],
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
