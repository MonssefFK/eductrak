import { NextRequest, NextResponse } from "next/server";
import { AssignmentType } from "@prisma/client";
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
    const rawType = String(body.type || "DS").trim();
    const dueDateStr = String(body.dueDate || "").trim();

    if (!subjectId || !title || !dueDateStr) {
      return NextResponse.json(
        { error: "Champs manquants" },
        { status: 400 }
      );
    }

    const parsedDate = new Date(`${dueDateStr}T12:00:00`);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Date invalide" }, { status: 400 });
    }

    const validTypes = Object.values(AssignmentType) as string[];
    const type: AssignmentType = validTypes.includes(rawType)
      ? (rawType as AssignmentType)
      : (validTypes.includes("DEVOIR")
          ? "DEVOIR"
          : validTypes[0]) as AssignmentType;

    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, userId: session.userId },
      select: { id: true, name: true, color: true },
    });

    if (!subject) {
      return NextResponse.json(
        { error: "Matière introuvable" },
        { status: 404 }
      );
    }

    const created = await prisma.assignment.create({
      data: {
        title,
        type,
        dueDate: parsedDate,
        subjectId: subject.id,
        userId: session.userId,
      },
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/assignments error:", err);
    return NextResponse.json(
      { error: "Erreur création échéance" },
      { status: 500 }
    );
  }
}