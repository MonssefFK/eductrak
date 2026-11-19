import { MasteryLevel } from "@prisma/client";

export const MASTERY_WEIGHTS: Record<MasteryLevel, number> = {
  NOT_STARTED: 0,
  COURSE_SEEN: 0.35,
  TD_IN_PROGRESS: 0.7,
  MASTERED: 1,
};

export const MASTERY_META: Record<
  MasteryLevel,
  { label: string; badgeBg: string; badgeText: string; borderColor: string }
> = {
  NOT_STARTED: {
    label: "Non commencé",
    badgeBg: "bg-zinc-800/90",
    badgeText: "text-zinc-300",
    borderColor: "border-zinc-700",
  },
  COURSE_SEEN: {
    label: "Cours vu",
    badgeBg: "bg-sky-500/15",
    badgeText: "text-sky-400",
    borderColor: "border-sky-500/30",
  },
  TD_IN_PROGRESS: {
    label: "TD en cours",
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-400",
    borderColor: "border-amber-500/30",
  },
  MASTERED: {
    label: "Maîtrisé",
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-400",
    borderColor: "border-emerald-500/30",
  },
};

export interface ChapterProgressInput {
  masteryLevel: MasteryLevel;
  courseReviewed?: boolean;
  summaryDone?: boolean;
  exercisesDone?: boolean;
  pastExamsDone?: boolean;
}

export function computeChapterScore(chapter: ChapterProgressInput): number {
  const base = MASTERY_WEIGHTS[chapter.masteryLevel] ?? 0;
  if (chapter.masteryLevel === "MASTERED") return 1;

  const checks = [
    chapter.courseReviewed,
    chapter.summaryDone,
    chapter.exercisesDone,
    chapter.pastExamsDone,
  ].filter(Boolean).length;

  const checklistScore = checks / 4;
  return Math.max(base, checklistScore * 0.9);
}

export function computeSubjectProgress(chapters: ChapterProgressInput[]): number {
  if (!chapters || chapters.length === 0) return 0;
  const total = chapters.reduce((acc, ch) => acc + computeChapterScore(ch), 0);
  return Math.round((total / chapters.length) * 100);
}

export function computeGlobalStats(
  subjects: { chapters: ChapterProgressInput[] }[]
) {
  const allChapters = subjects.flatMap((s) => s.chapters);
  const totalChapters = allChapters.length;
  const masteredChapters = allChapters.filter(
    (c) => c.masteryLevel === "MASTERED"
  ).length;

  const globalPercentage =
    totalChapters === 0
      ? 0
      : Math.round(
          (allChapters.reduce((sum, ch) => sum + computeChapterScore(ch), 0) /
            totalChapters) *
            100
        );

  return {
    globalPercentage,
    masteredChapters,
    totalChapters,
  };
}