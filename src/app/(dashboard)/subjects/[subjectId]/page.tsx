export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubjectDetailClient } from "@/components/subject/SubjectDetailClient";

export default async function SubjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectId: string }>;
  searchParams: Promise<{ chapter?: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const { subjectId } = await params;
  const { chapter } = await searchParams;

  const subject = await prisma.subject.findFirst({
    where: { id: subjectId, userId: session.userId },
    include: {
      chapters: { orderBy: { number: "asc" } },
      assignments: { orderBy: { dueDate: "asc" } },
      resources: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!subject) notFound();

  return (
    <SubjectDetailClient
      subject={{
        id: subject.id,
        name: subject.name,
        color: subject.color,
        driveUrl: subject.driveUrl,
        notes: subject.notes,
      }}
      initialChapters={subject.chapters}
      initialAssignments={subject.assignments.map((a) => ({
        id: a.id,
        title: a.title,
        type: a.type,
        dueDate: a.dueDate.toISOString(),
        isCompleted: a.isCompleted,
      }))}
      initialResources={subject.resources}
      initialSelectedChapterId={chapter}
    />
  );
}