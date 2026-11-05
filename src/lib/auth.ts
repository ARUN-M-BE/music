import { NextRequest } from "next/server";
import { connectToDatabase, UserModel } from "./mongodb";

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: "admin" | "member" | "superadmin";
    imageURL?: string;
    email_verified?: boolean;
  };
}

export async function getUserFromRequest(req: NextRequest): Promise<AuthSession | null> {
  const authHeader = req.headers.get("authorization");

  // Check header Authorization: Bearer <token>
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    if (token) {
      try {
        await connectToDatabase();
        // If token matches user_id or email
        const user = await UserModel.findOne({
          $or: [{ user_id: token }, { email: token }],
        }).lean();

        if (user) {
          return {
            user: {
              id: user._id.toString(),
              email: user.email,
              name: user.name,
              role: user.role || "member",
              imageURL: user.imageURL,
              email_verified: user.email_verified,
            },
          };
        }
      } catch (err) {
        console.error("Auth header parse error:", err);
      }
    }
  }

  // Check Admin Fallback / Cookie Session
  const adminEmail = process.env.ADMIN_EMAIL || "arunm102301@gmail.com";
  const sessionCookie = req.cookies.get("music_auth_session")?.value;
  if (sessionCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(sessionCookie));
      if (parsed && parsed.email) {
        return {
          user: {
            id: parsed.id || parsed._id || "session-user",
            email: parsed.email,
            name: parsed.name || "User",
            role:
              parsed.role ||
              (parsed.email.toLowerCase() === adminEmail.toLowerCase() ? "admin" : "member"),
            imageURL: parsed.imageURL,
            email_verified: parsed.email_verified ?? true,
          },
        };
      }
    } catch {
      // Ignore cookie parse error
    }
  }

  return null;
}

export async function requireAdmin(req: NextRequest): Promise<AuthSession> {
  const session = await getUserFromRequest(req);
  if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
    throw new Error("Unauthorized: Admin privileges required");
  }
  return session;
}

