import { NextRequest } from "next/server";
import { withDb, UserModel } from "./mongodb";

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

const SUPERADMIN_EMAILS = [
  "arunm102301@gmail.com",
  "arun102301@gmail.com",
  (process.env.ADMIN_EMAIL || "arunm102301@gmail.com").toLowerCase(),
];

export async function getUserFromRequest(req: NextRequest): Promise<AuthSession | null> {
  const authHeader = req.headers.get("authorization");
  const xUserEmail = req.headers.get("x-user-email")?.trim().toLowerCase();

  let token = "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1]?.trim() || "";
  } else if (xUserEmail) {
    token = xUserEmail;
  }

  // 1. Check Bearer / Header token
  if (token) {
    const isSuperByEmail = SUPERADMIN_EMAILS.includes(token.toLowerCase());

    try {
      const user = await withDb(() =>
        UserModel.findOne({
          $or: [
            { user_id: token },
            { email: token.toLowerCase() },
            { email: new RegExp(`^${token}$`, "i") },
          ],
        }).lean()
      );

      if (user) {
        const isSuper =
          isSuperByEmail ||
          user.role === "superadmin" ||
          SUPERADMIN_EMAILS.includes(user.email.toLowerCase());

        return {
          user: {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: isSuper ? "superadmin" : (user.role || "member"),
            imageURL: user.imageURL,
            email_verified: user.email_verified,
          },
        };
      } else if (isSuperByEmail) {
        return {
          user: {
            id: "root-superadmin",
            email: token.toLowerCase(),
            name: "Arun M (Superadmin)",
            role: "superadmin",
            email_verified: true,
          },
        };
      }
    } catch (err) {
      console.error("Auth header parse error:", err);
    }
  }

  // 2. Check Cookie Session fallback
  const sessionCookie = req.cookies.get("music_auth_session")?.value;
  if (sessionCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(sessionCookie));
      if (parsed && parsed.email) {
        const emailLower = parsed.email.toLowerCase();
        const isSuper =
          SUPERADMIN_EMAILS.includes(emailLower) ||
          parsed.role === "superadmin";

        return {
          user: {
            id: parsed.id || parsed._id || "session-user",
            email: parsed.email,
            name: parsed.name || "User",
            role: isSuper ? "superadmin" : (parsed.role || "member"),
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
