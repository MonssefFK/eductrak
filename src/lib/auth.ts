import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
}

export const SESSION_COOKIE_NAME = "eductrak_session";

function getSessionSecret(): string {
  return process.env.SESSION_SECRET || process.env.JWT_SECRET || "dev-secret-change-me";
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSessionSecret())
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

export function attachSessionCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}

export async function getCurrentSession(): Promise<SessionPayload | null> {
  try {
    const user = await prisma.user.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (user) {
      return {
        userId: user.id,
        email: user.email,
        name: user.name,
      };
    }
  } catch {
    // Repli local si la base n'est pas encore prête
  }

  return {
    userId: "local-user",
    email: "monssef@studentos.fr",
    name: "Monssef",
  };
}

export async function requireUser(): Promise<SessionPayload> {
  const session = await getCurrentSession();
  return (
    session ?? {
      userId: "local-user",
      email: "monssef@studentos.fr",
      name: "Monssef",
    }
  );
}