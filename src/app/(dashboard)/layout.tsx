export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeSubjectProgress } from "@/lib/progress";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  let sidebarSubjects: {
    id: string;
    name: string;
    color: string;
    progress: number;
  }[] = [];

  try {
    const subjects = await prisma.subject.findMany({
      where: { userId: session.userId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        chapters: {
          select: {
            masteryLevel: true,
            courseReviewed: true,
            summaryDone: true,
            exercisesDone: true,
            pastExamsDone: true,
          },
        },
      },
    });

    sidebarSubjects = subjects.map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color,
      progress: computeSubjectProgress(s.chapters),
    }));
  } catch {
    sidebarSubjects = [];
  }

  return (
    <div className="min-h-screen bg-[#0F1117] text-zinc-100">
      <Sidebar subjects={sidebarSubjects} userName={session.name} />
      <main className="lg:pl-[260px] min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}