"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Globe,
  BookOpen,
  AlertTriangle,
  Check,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { MASTERY_META } from "@/lib/progress";
import { MasteryLevel } from "@prisma/client";

interface SubjectCardItem {
  id: string;
  name: string;
  color: string;
  progress: number;
  nextDeadline: { title: string; dueDate: string } | null;
}

interface AssignmentItem {
  id: string;
  title: string;
  type: string;
  dueDate: string;
  isCompleted: boolean;
  subject: { id: string; name: string; color: string };
}

interface PriorityChapterItem {
  id: string;
  number: number;
  title: string;
  masteryLevel: MasteryLevel;
  isPriority: boolean;
  subject: { id: string; name: string; color: string };
}

export function OverviewClient({
  globalPercentage,
  masteredChapters,
  totalChapters,
  upcoming7DaysCount,
  subjects,
  initialAssignments,
  priorityChapters,
}: {
  globalPercentage: number;
  masteredChapters: number;
  totalChapters: number;
  upcoming7DaysCount: number;
  subjects: SubjectCardItem[];
  initialAssignments: AssignmentItem[];
  priorityChapters: PriorityChapterItem[];
}) {
  const router = useRouter();
  const [assignments, setAssignments] = useState(initialAssignments);

  async function toggleAssignment(id: string, current: boolean) {
    setAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isCompleted: !current } : a))
    );
    await fetch(`/api/assignments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: !current }),
    });
    router.refresh();
  }

  function formatShortDate(iso: string) {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl text-white tracking-tight">
          Vue d&apos;ensemble — Semestre STPI2
        </h1>
      </div>

      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Avancement global */}
        <div className="bg-[#161B22] border border-[#262C3A] rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
              <Globe className="w-4 h-4 text-zinc-400"/>
              <span>Avancement global</span>
            </div>
            <div className="text-3xl text-white tabular-nums">
              {globalPercentage}%
            </div>
          </div>
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-[#262C3A]"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-indigo-400 transition-all duration-500"
                strokeDasharray={`${globalPercentage}, 100`}
                strokeWidth="3"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[11px] text-zinc-300 tabular-nums">
              {globalPercentage}%
            </span>
          </div>
        </div>

        {/* Chapitres maîtrisés */}
        <div className="bg-[#161B22] border border-[#262C3A] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
            <BookOpen className="w-4 h-4 text-zinc-400"/>
            <span>Chapitres maîtrisés</span>
          </div>
          <div>
            <div className="text-3xl text-white tabular-nums mb-2">
              {masteredChapters}
              <span className="text-zinc-500 text-xl">/{totalChapters}</span>
            </div>
            <div className="w-full h-1.5 bg-[#232938] rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all"
                style={{
                  width: `${
                    totalChapters === 0
                      ? 0
                      : Math.round((masteredChapters / totalChapters) * 100)
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Échéances (7j) */}
        <div className="bg-[#161B22] border border-[#262C3A] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400"/>
              <span>Échéances (7j)</span>
            </div>
            <span className="w-5 h-5 rounded-full bg-rose-500/15 text-rose-400 flex items-center justify-center text-[11px]">
              !
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl text-white tabular-nums">
              {upcoming7DaysCount}
            </span>
            <Link className="text-xs text-zinc-400 hover:text-white flex items-center gap-1" href="/agenda">
              <span>Voir l&apos;agenda</span>
              <ArrowUpRight className="w-3.5 h-3.5"/>
            </Link>
          </div>
        </div>
      </div>

      {/* Grille des matières */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {subjects.map((subject) => (
          <Link className="bg-[#161B22] hover:bg-[#1B212B] border border-[#262C3A] hover:border-[#374151] rounded-xl p-3.5 transition-colors group" href="{`/subjects/${subject.id}`}" key="{subject.id}">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: subject.color }}
                />
                <span className="text-xs text-zinc-100 truncate group-hover:text-white">
                  {subject.name}
                </span>
              </div>
              <span className="text-xs text-zinc-400 tabular-nums shrink-0">
                ~{subject.progress}%
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-2">
              <span>{subject.progress}% complété</span>
              {subject.nextDeadline ? (
                <span className="flex items-center gap-1 text-zinc-400 truncate max-w-[125px]">
                  <Clock className="w-3 h-3 shrink-0"/>
                  {formatShortDate(subject.nextDeadline.dueDate)}
                </span>
              ) : (
                <span>Aucune échéance</span>
              )}
            </div>

            <div className="w-full h-1.5 bg-[#232938] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${subject.progress}%`,
                  backgroundColor: subject.color,
                }}
              />
            </div>
          </Link>
        ))}
      </div>

      {/* Deux blocs bas côte à côte */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Prochains devoirs & DS */}
        <div className="bg-[#161B22] border border-[#262C3A] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm text-white">Prochains devoirs & DS</h2>
            <Link className="text-xs text-zinc-400 hover:text-white" href="/agenda">
              Tout voir
            </Link>
          </div>

          {assignments.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center">
              Aucune échéance à venir.
            </p>
          ) : (
            <div className="divide-y divide-[#222836]">
              {assignments.map((item) => (
                <div
                  key={item.id}
                  className="py-2.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.subject.color }}
                    />
                    <span className="text-xs text-zinc-400 tabular-nums shrink-0">
                      {formatShortDate(item.dueDate)}
                    </span>
                    <span className="text-zinc-600">-</span>
                    <span
                      className={`text-xs truncate ${
                        item.isCompleted
                          ? "line-through text-zinc-500"
                          : "text-zinc-200"
                      }`}
                    >
                      {item.title}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleAssignment(item.id, item.isCompleted)}
                    className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                      item.isCompleted
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "border-[#343C4E] hover:border-indigo-400 bg-[#0F1117]"
                    }`}
                    title="Marquer comme terminé"
                  >
                    {item.isCompleted && <Check className="w-3.5 h-3.5"/>}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chapitres à revoir en priorité */}
        <div className="bg-[#161B22] border border-[#262C3A] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm text-white">
              Chapitres à revoir en priorité
            </h2>
            <span className="text-xs text-zinc-500">
              {priorityChapters.length} ciblé(s)
            </span>
          </div>

          {priorityChapters.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center">
              Tous les chapitres prioritaires sont maîtrisés.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#222836] text-[11px] text-zinc-500">
                    <th className="pb-2 font-normal">Chapitre</th>
                    <th className="pb-2 font-normal">Matière</th>
                    <th className="pb-2 font-normal">Statut</th>
                    <th className="pb-2 font-normal text-right">Urgence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222836] text-xs">
                  {priorityChapters.map((ch) => {
                    const meta = MASTERY_META[ch.masteryLevel];
                    return (
                      <tr
                        key={ch.id}
                        onClick={() =>
                          router.push(
                            `/subjects/${ch.subject.id}?chapter=${ch.id}`
                          )
                        }
                        className="hover:bg-[#1C222D] cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 pr-2 text-zinc-200 max-w-[180px] truncate">
                          Ch. {ch.number} — {ch.title}
                        </td>
                        <td className="py-2.5 pr-2">
                          <span className="inline-flex items-center gap-1.5 text-zinc-400">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: ch.subject.color }}
                            />
                            <span className="truncate max-w-[110px]">
                              {ch.subject.name}
                            </span>
                          </span>
                        </td>
                        <td className="py-2.5 pr-2">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[11px] border ${meta.badgeBg} ${meta.badgeText} ${meta.borderColor}`}
                          >
                            {meta.label}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          {ch.isPriority ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/15 text-rose-400 text-[11px]">
                              !
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/15 text-amber-400 text-[11px]">
                              •
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}