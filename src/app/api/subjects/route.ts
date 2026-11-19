import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { computeSubjectProgress } from "@/lib/progress";

export async function GET() {
  try {
    const user = await requireUser();
    const subjects = await prisma.subject.findMany({
      where: { userId: user.userId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { chapters: true },
    });

    const payload = subjects.map((s) => ({
      ...s,
      progress: computeSubjectProgress(s.chapters),
    }));

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const name = String(body.name || "").trim();
    const color = String(body.color || "#3B82F6").trim();
    const driveUrl = body.driveUrl ? String(body.driveUrl).trim() : null;

    if (!name) {
      return NextResponse.json(
        { error: "Le nom de la matière est obligatoire." },
        { status: 400 }
      );
    }

    const count = await prisma.subject.count({
      where: { userId: user.userId },
    });

    const subject = await prisma.subject.create({
      data: {
        userId: user.userId,
        name,
        color,
        driveUrl,
        sortOrder: count,
      },
    });

    return NextResponse.json(subject, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur création matière" }, { status: 500 });
  }
}