import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      navigation: [
        { name: "Discover", href: "/" },
        { name: "Library", href: "/library" },
        { name: "Favorites", href: "/favorites" },
        { name: "System Status", href: "/api-monitor" },
      ],
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
      },
    }
  );
}
