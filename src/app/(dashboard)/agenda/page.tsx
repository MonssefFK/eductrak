import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AgendaClient } from "@/components/agenda/AgendaClient";

export default async function AgendaPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const [assignments, subjects] = await Promise.all([
    prisma.assignment.findMany({
      where: { userId: session.userId },
      orderBy: { dueDate: "asc" },
      include: {
        subject: { select: { id: true, name: true, color: true } },
      },
    }),
    prisma.subject.findMany({
      where: { userId: session.userId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true, color: true },
    }),
  ]);

  return (
    <AgendaClient
      initialAssignments={assignments.map((a) => ({
        id: a.id,
        title: a.title,
        type: a.type,
        dueDate: a.dueDate.toISOString(),
        isCompleted: a.isCompleted,
        subject: a.subject,
      }))}
      subjects={subjects}
    />
  );
}