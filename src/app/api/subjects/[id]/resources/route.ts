import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: subjectId } = await params;
    const body = await request.json();

    const label = String(body.label || "").trim();
    const url = String(body.url || "").trim();
    const category = String(body.category || "Général").trim();

    if (!label || !url) {
      return NextResponse.json(
        { error: "Libellé et URL requis." },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, userId: user.userId },
    });
    if (!subject) {
      return NextResponse.json({ error: "Matière introuvable" }, { status: 404 });
    }

    const resource = await prisma.subjectResource.create({
      data: {
        userId: user.userId,
        subjectId,
        label,
        url,
        category,
      },
    });

    return NextResponse.json(resource, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur ajout ressource" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get("resourceId");

    if (!resourceId) {
      return NextResponse.json({ error: "resourceId requis" }, { status: 400 });
    }

    await prisma.subjectResource.deleteMany({
      where: { id: resourceId, userId: user.userId },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}