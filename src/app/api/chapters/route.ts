import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const subjectId = String(body.subjectId || "").trim();
    const title = String(body.title || "").trim();
    const rawNumber = Number(body.number);
    const number =
      Number.isFinite(rawNumber) && rawNumber >= 0 ? Math.trunc(rawNumber) : 0;

    if (!subjectId || !title) {
      return NextResponse.json(
        { error: "Champs manquants" },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, userId: session.userId },
      select: { id: true },
    });

    if (!subject) {
      return NextResponse.json(
        { error: "Matière introuvable" },
        { status: 404 }
      );
    }

    const created = await prisma.chapter.create({
      data: {
        userId: session.userId,
        subjectId: subject.id,
        number,
        title,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/chapters error:", err);
    return NextResponse.json(
      { error: "Erreur création chapitre" },
      { status: 500 }
    );
  }
}