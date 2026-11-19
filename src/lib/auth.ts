import { prisma } from "@/lib/prisma";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
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