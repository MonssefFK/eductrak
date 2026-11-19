import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { MasteryLevel } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const subjectId = String(body.subjectId || "");
    const title = String(body.title || "").trim();
    const number = Number(body.number || 1);

    if (!subjectId || !title) {
      return NextResponse.json(
        { error: "Matière et titre requis." },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, userId: user.userId },
    });
    if (!subject) {
      return NextResponse.json({ error: "Matière introuvable" }, { status: 404 });
    }

    const chapter = await prisma.chapter.create({
      data: {
        userId: user.userId,
        subjectId,
        number,
        title,
        masteryLevel: (body.masteryLevel as MasteryLevel) || "NOT_STARTED",
        isPriority: Boolean(body.isPriority),
        driveUrl: body.driveUrl ? String(body.driveUrl).trim() : null,
        obsidianUrl: body.obsidianUrl ? String(body.obsidianUrl).trim() : null,
        extraUrl: body.extraUrl ? String(body.extraUrl).trim() : null,
      },
    });

    return NextResponse.json(chapter, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur création chapitre" }, { status: 500 });
  }
}