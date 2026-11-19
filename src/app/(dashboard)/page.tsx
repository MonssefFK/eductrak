export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeGlobalStats, computeSubjectProgress } from "@/lib/progress";
import { OverviewClient } from "@/components/dashboard/OverviewClient";

export default async function OverviewPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const now = new Date();
  const in7Days = new Date(now);
  in7Days.setDate(in7Days.getDate() + 7);

  const [subjects, assignments, chaptersToReview, upcoming7DaysCount] =
    await Promise.all([
      prisma.subject.findMany({
        where: { userId: session.userId },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
          chapters: true,
          assignments: {
            where: { isCompleted: false, dueDate: { gte: now } },
            orderBy: { dueDate: "asc" },
            take: 1,
          },
        },
      }),
      prisma.assignment.findMany({
        where: { userId: session.userId, isCompleted: false },
        orderBy: { dueDate: "asc" },
        take: 8,
        include: {
          subject: { select: { id: true, name: true, color: true } },
        },
      }),
      prisma.chapter.findMany({
        where: {
          userId: session.userId,
          masteryLevel: { not: "MASTERED" },
        },
        orderBy: [{ isPriority: "desc" }, { number: "asc" }],
        take: 8,
        include: {
          subject: { select: { id: true, name: true, color: true } },
        },
      }),
      prisma.assignment.count({
        where: {
          userId: session.userId,
          isCompleted: false,
          dueDate: { gte: now, lte: in7Days },
        },
      }),
    ]);

  const stats = computeGlobalStats(subjects);

  const subjectCards = subjects.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
    progress: computeSubjectProgress(s.chapters),
    nextDeadline: s.assignments[0]
      ? {
          title: s.assignments[0].title,
          dueDate: s.assignments[0].dueDate.toISOString(),
        }
      : null,
  }));

  return (
    <OverviewClient
      globalPercentage={stats.globalPercentage}
      masteredChapters={stats.masteredChapters}
      totalChapters={stats.totalChapters}
      upcoming7DaysCount={upcoming7DaysCount}
      subjects={subjectCards}
      initialAssignments={assignments.map((a) => ({
        id: a.id,
        title: a.title,
        type: a.type,
        dueDate: a.dueDate.toISOString(),
        isCompleted: a.isCompleted,
        subject: a.subject,
      }))}
      priorityChapters={chaptersToReview.map((c) => ({
        id: c.id,
        number: c.number,
        title: c.title,
        masteryLevel: c.masteryLevel,
        isPriority: c.isPriority,
        subject: c.subject,
      }))}
    />
  );
}