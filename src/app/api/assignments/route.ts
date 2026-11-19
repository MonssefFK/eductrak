import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { AssignmentType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");

    const assignments = await prisma.assignment.findMany({
      where: {
        userId: user.userId,
        ...(subjectId && subjectId !== "ALL" ? { subjectId } : {}),
      },
      orderBy: { dueDate: "asc" },
      include: {
        subject: { select: { id: true, name: true, color: true } },
      },
    });

    return NextResponse.json(assignments);
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const subjectId = String(body.subjectId || "");
    const title = String(body.title || "").trim();
    const type = (body.type as AssignmentType) || "DS";
    const dueDate = new Date(body.dueDate);

    if (!subjectId || !title || isNaN(dueDate.getTime())) {
      return NextResponse.json(
        { error: "Matière, titre et date valide requis." },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, userId: user.userId },
    });
    if (!subject) {
      return NextResponse.json({ error: "Matière introuvable" }, { status: 404 });
    }

    const assignment = await prisma.assignment.create({
      data: {
        userId: user.userId,
        subjectId,
        title,
        type,
        dueDate,
        isCompleted: false,
      },
      include: {
        subject: { select: { id: true, name: true, color: true } },
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur création échéance" }, { status: 500 });
  }
}