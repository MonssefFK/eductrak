"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  Calendar as CalendarIcon,
} from "lucide-react";
import { AssignmentType } from "@prisma/client";

interface AgendaAssignment {
  id: string;
  title: string;
  type: AssignmentType;
  dueDate: string;
  isCompleted: boolean;
  subject: { id: string; name: string; color: string };
}

interface SubjectOption {
  id: string;
  name: string;
  color: string;
}

export function AgendaClient({
  initialAssignments,
  subjects,
}: {
  initialAssignments: AgendaAssignment[];
  subjects: SubjectOption[];
}) {
  const router = useRouter();
  const [assignments, setAssignments] =
    useState<AgendaAssignment[]>(initialAssignments);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [subjectFilter, setSubjectFilter] = useState<string>("ALL");

  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Modale ajout échéance
  const [modalOpen, setModalOpen] = useState(false);
  const [newSubjectId, setNewSubjectId] = useState(subjects[0]?.id || "");
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<AssignmentType>("DS");
  const [newDate, setNewDate] = useState("");

  const filteredAssignments = useMemo(() => {
    if (subjectFilter === "ALL") return assignments;
    return assignments.filter((a) => a.subject.id === subjectFilter);
  }, [assignments, subjectFilter]);

  async function toggleCompleted(id: string, current: boolean) {
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

  async function handleCreateAssignment(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubjectId || !newTitle.trim() || !newDate) return;

    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId: newSubjectId,
        title: newTitle,
        type: newType,
        dueDate: newDate,
      }),
    });

    if (res.ok) {
      const created = await res.json();
      setAssignments((prev) =>
        [...prev, created].sort(
          (a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        )
      );
      setNewTitle("");
      setNewDate("");
      setModalOpen(false);
      router.refresh();
    }
  }

  // Construction grille calendrier (Lundi -> Dimanche)
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const startWeekday = (firstDayOfMonth.getDay() + 6) % 7; // 0 = Lundi
    const startDate = new Date(year, month, 1 - startWeekday);

    const days: Date[] = [];
    for (let i = 0; i < 35; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      days.push(d);
    }
    return days;
  }, [year, month]);

  const monthLabel = currentDate.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  const upcomingList = filteredAssignments.filter((a) => !a.isCompleted);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl text-white tracking-tight">
          Agenda & Devoirs
        </h1>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sélecteur Calendrier / Liste */}
          <div className="bg-[#161B22] border border-[#262C3A] rounded-lg p-0.5 flex text-xs">
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "calendar"
                  ? "bg-[#252C3B] text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Calendrier
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-[#252C3B] text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Liste chronologique
            </button>
          </div>

          {/* Filtre par matière */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="bg-[#161B22] border border-[#262C3A] rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">Toutes les matières</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setModalOpen(true)}
            className="px-3.5 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5"/>
            <span>Ajouter une échéance</span>
          </button>
        </div>
      </div>

      {/* VUE CALENDRIER */}
      {viewMode === "calendar" ? (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          <div className="xl:col-span-3 bg-[#161B22] border border-[#262C3A] rounded-xl overflow-hidden">
            {/* Barre navigation mois */}
            <div className="px-4 py-3 border-b border-[#262C3A] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-white capitalize">
                  {monthLabel}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                    className="p-1 text-zinc-400 hover:text-white hover:bg-[#222836] rounded cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4"/>
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                    className="p-1 text-zinc-400 hover:text-white hover:bg-[#222836] rounded cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4"/>
                  </button>
                </div>
              </div>

              <button
                onClick={() => setCurrentDate(new Date())}
                className="text-xs text-zinc-400 hover:text-white px-2.5 py-1 rounded border border-[#262C3A]"
              >
                Aujourd&apos;hui
              </button>
            </div>

            {/* En-tête jours semaine */}
            <div className="grid grid-cols-7 border-b border-[#262C3A] text-center text-[11px] text-zinc-400 py-2 bg-[#131720]">
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Cellules calendrier */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                const isCurrentMonth = day.getMonth() === month;
                const isToday =
                  day.toDateString() === new Date().toDateString();

                const dayEvents = filteredAssignments.filter((a) => {
                  const ad = new Date(a.dueDate);
                  return (
                    ad.getFullYear() === day.getFullYear() &&
                    ad.getMonth() === day.getMonth() &&
                    ad.getDate() === day.getDate()
                  );
                });

                return (
                  <div
                    key={idx}
                    className={`min-h-[96px] p-1.5 border-b border-r border-[#222836] ${
                      isToday
                        ? "bg-[#1E2434]"
                        : isCurrentMonth
                        ? "bg-[#161B22]"
                        : "bg-[#11151C]"
                    }`}
                  >
                    <div className="flex justify-end mb-1">
                      <span
                        className={`text-[11px] tabular-nums px-1.5 py-0.5 rounded ${
                          isToday
                            ? "bg-indigo-600 text-white"
                            : isCurrentMonth
                            ? "text-zinc-300"
                            : "text-zinc-600"
                        }`}
                      >
                        {day.getDate()}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {dayEvents.map((ev) => (
                        <div
                          key={ev.id}
                          onClick={() =>
                            toggleCompleted(ev.id, ev.isCompleted)
                          }
                          style={{
                            backgroundColor: `${ev.subject.color}28`,
                            borderColor: `${ev.subject.color}66`,
                          }}
                          className={`px-1.5 py-1 rounded border text-[11px] leading-tight cursor-pointer truncate ${
                            ev.isCompleted ? "opacity-45 line-through" : ""
                          }`}
                          title={`${ev.subject.name} — ${ev.title}`}
                        >
                          <div className="text-zinc-100 truncate">
                            {ev.title}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Panneau latéral droit : Échéances à venir */}
          <div className="bg-[#161B22] border border-[#262C3A] rounded-xl p-4 h-fit">
            <h2 className="text-sm text-white mb-3">Échéances à venir</h2>
            {upcomingList.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4">
                Aucune échéance en attente.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingList.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-2.5 pb-3 border-b border-[#222836] last:border-none last:pb-0"
                  >
                    <button
                      onClick={() =>
                        toggleCompleted(item.id, item.isCompleted)
                      }
                      className="mt-0.5 w-4 h-4 rounded border border-[#343C4E] hover:border-indigo-400 bg-[#0F1117] flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      {item.isCompleted && <Check className="w-3 h-3"/>}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-zinc-200 leading-snug">
                        {item.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-zinc-400">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3"/>
                          {new Date(item.dueDate).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                        <span
                          className="px-1.5 py-0.2 rounded text-[10px]"
                          style={{
                            backgroundColor: `${item.subject.color}25`,
                            color: item.subject.color,
                          }}
                        >
                          {item.type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* VUE LISTE CHRONOLOGIQUE */
        <div className="bg-[#161B22] border border-[#262C3A] rounded-xl divide-y divide-[#222836]">
          {filteredAssignments.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              Aucune échéance trouvée pour ce filtre.
            </div>
          ) : (
            filteredAssignments.map((item) => (
              <div
                key={item.id}
                className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => toggleCompleted(item.id, item.isCompleted)}
                    className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 cursor-pointer ${
                      item.isCompleted
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "border-[#343C4E] bg-[#0F1117]"
                    }`}
                  >
                    {item.isCompleted && <Check className="w-3.5 h-3.5"/>}
                  </button>

                  <span
                    className="px-2 py-0.5 rounded-full text-[11px] shrink-0"
                    style={{
                      backgroundColor: `${item.subject.color}22`,
                      color: item.subject.color,
                    }}
                  >
                    {item.subject.name}
                  </span>

                  <span className="px-2 py-0.5 rounded text-[11px] bg-[#0F1117] border border-[#262C3A] text-zinc-300 shrink-0">
                    {item.type}
                  </span>

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

                <div className="flex items-center gap-3 text-xs shrink-0">
                  <span className="text-zinc-400 tabular-nums">
                    {new Date(item.dueDate).toLocaleDateString("fr-FR", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] ${
                      item.isCompleted
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-amber-500/15 text-amber-400"
                    }`}
                  >
                    {item.isCompleted ? "Terminé" : "À faire"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODALE CRÉATION D'ÉCHÉANCE */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateAssignment}
            className="w-full max-w-md bg-[#161B22] border border-[#262C3A] rounded-xl p-5 space-y-4"
          >
            <h3 className="text-sm text-white">Ajouter une échéance</h3>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Matière
              </label>
              <select
                value={newSubjectId}
                onChange={(e) => setNewSubjectId(e.target.value)}
                className="w-full bg-[#0F1117] border border-[#262C3A] rounded-lg px-3 py-2 text-xs text-white"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Titre</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="ex. Khôlle Analyse — Séries"
                className="w-full bg-[#0F1117] border border-[#262C3A] rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Type</label>
                <select
                  value={newType}
                  onChange={(e) =>
                    setNewType(e.target.value as AssignmentType)
                  }
                  className="w-full bg-[#0F1117] border border-[#262C3A] rounded-lg px-2.5 py-2 text-xs text-white"
                >
                  <option value="DS">DS</option>
                  <option value="TP">TP</option>
                  <option value="DM">DM</option>
                  <option value="PROJET">Projet</option>
                  <option value="KHOLLE">Khôlle</option>
                  <option value="REVISION">Révision</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-[#0F1117] border border-[#262C3A] rounded-lg px-2.5 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 border border-[#262C3A] rounded-lg"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
              >
                Ajouter à l&apos;agenda
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}