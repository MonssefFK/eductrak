import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { MasteryLevel } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.chapter.findFirst({
      where: { id, userId: user.userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Chapitre introuvable" }, { status: 404 });
    }

    const updated = await prisma.chapter.update({
      where: { id },
      data: {
        ...(body.number !== undefined ? { number: Number(body.number) } : {}),
        ...(body.title !== undefined ? { title: String(body.title).trim() } : {}),
        ...(body.masteryLevel !== undefined
          ? { masteryLevel: body.masteryLevel as MasteryLevel }
          : {}),
        ...(body.isPriority !== undefined
          ? { isPriority: Boolean(body.isPriority) }
          : {}),
        ...(body.courseReviewed !== undefined
          ? { courseReviewed: Boolean(body.courseReviewed) }
          : {}),
        ...(body.summaryDone !== undefined
          ? { summaryDone: Boolean(body.summaryDone) }
          : {}),
        ...(body.exercisesDone !== undefined
          ? { exercisesDone: Boolean(body.exercisesDone) }
          : {}),
        ...(body.pastExamsDone !== undefined
          ? { pastExamsDone: Boolean(body.pastExamsDone) }
          : {}),
        ...(body.obsidianUrl !== undefined
          ? { obsidianUrl: body.obsidianUrl ? String(body.obsidianUrl).trim() : null }
          : {}),
        ...(body.driveUrl !== undefined
          ? { driveUrl: body.driveUrl ? String(body.driveUrl).trim() : null }
          : {}),
        ...(body.extraUrl !== undefined
          ? { extraUrl: body.extraUrl ? String(body.extraUrl).trim() : null }
          : {}),
        ...(body.quickNotes !== undefined
          ? { quickNotes: body.quickNotes ? String(body.quickNotes) : null }
          : {}),
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Erreur mise à jour chapitre" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    await prisma.chapter.deleteMany({
      where: { id, userId: user.userId },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur suppression chapitre" }, { status: 500 });
  }
}