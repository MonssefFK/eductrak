"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Check,
  X,
  Trash2,
  Calendar as CalendarIcon,
} from "lucide-react";
import { AssignmentType } from "@prisma/client";

interface AgendaAssignment {
  id: string;
  title: string;
  type: AssignmentType | string;
  dueDate: string;
  isCompleted: boolean;
  subject: { id: string; name: string; color: string };
}

interface SubjectOption {
  id: string;
  name: string;
  color: string;
}

const ASSIGNMENT_TYPES: { value: string; label: string }[] = [
  { value: "DEVOIR", label: "Devoir" },
  { value: "DS", label: "DS" },
  { value: "DM", label: "DM" },
  { value: "TP", label: "TP" },
  { value: "PROJET", label: "Projet" },
  { value: "KHOLLE", label: "Khôlle" },
  { value: "REVISION", label: "Révision" },
];

const MONTH_DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function formatTypeLabel(type: string): string {
  const found = ASSIGNMENT_TYPES.find((t) => t.value === type);
  if (found) return found.label;
  if (type === "Devoir") return "Devoir";
  return type;
}

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMondayOfDate(date: Date): Date {
  const startWeekday = (date.getDay() + 6) % 7;
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - startWeekday
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
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
  const [subjectFilter, setSubjectFilter] = useState<string>("ALL");

  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState<Date>(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const calendarPopoverRef = useRef<HTMLDivElement | null>(null);

  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(
    null
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [newSubjectId, setNewSubjectId] = useState(subjects[0]?.id || "");
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<string>("DEVOIR");
  const [newDate, setNewDate] = useState(() => toDateInputValue(new Date()));
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const typeMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        typeMenuRef.current &&
        !typeMenuRef.current.contains(event.target as Node)
      ) {
        setTypeMenuOpen(false);
      }
      if (
        calendarPopoverRef.current &&
        !calendarPopoverRef.current.contains(event.target as Node)
      ) {
        setCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredAssignments = useMemo(() => {
    if (subjectFilter === "ALL") return assignments;
    return assignments.filter((a) => a.subject.id === subjectFilter);
  }, [assignments, subjectFilter]);

  const weekDays = useMemo(() => {
    const monday = getMondayOfDate(selectedDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  const weekOffsetFromNow = useMemo(() => {
    const currentMonday = getMondayOfDate(new Date());
    const displayedMonday = weekDays[0];
    const diffMs = displayedMonday.getTime() - currentMonday.getTime();
    return Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
  }, [weekDays]);

  const weekRangeLabel = useMemo(() => {
    const first = weekDays[0];
    const last = weekDays[6];
    const fStr = first.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
    const lStr = last.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `${fStr} – ${lStr}`;
  }, [weekDays]);

  const selectedDayLabel = useMemo(() => {
    return selectedDate.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }, [selectedDate]);

  const selectedDayAssignments = useMemo(() => {
    return filteredAssignments
      .filter((a) => isSameDay(new Date(a.dueDate), selectedDate))
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );
  }, [filteredAssignments, selectedDate]);

  const activeAssignment = useMemo(
    () => assignments.find((a) => a.id === activeAssignmentId) || null,
    [assignments, activeAssignmentId]
  );

  const monthCells = useMemo(() => {
    const year = pickerMonth.getFullYear();
    const month = pickerMonth.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = (firstOfMonth.getDay() + 6) % 7;
    const gridStart = new Date(year, month, 1 - startOffset);

    return Array.from({ length: 42 }, (_, idx) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + idx);
      return {
        date,
        inCurrentMonth: date.getMonth() === month,
      };
    });
  }, [pickerMonth]);

  const pickerMonthLabel = useMemo(() => {
    return pickerMonth.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
  }, [pickerMonth]);

  function openCalendarPopover() {
    setPickerMonth(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    );
    setCalendarOpen((prev) => !prev);
  }

  function handleSelectCalendarDate(date: Date) {
    setSelectedDate(
      new Date(date.getFullYear(), date.getMonth(), date.getDate())
    );
    setCalendarOpen(false);
  }

  function handleJumpToToday() {
    const today = new Date();
    setSelectedDate(today);
    setPickerMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setCalendarOpen(false);
  }

  function openModalForDate(date: Date) {
    if (!newSubjectId && subjects[0]?.id) {
      setNewSubjectId(subjects[0].id);
    }
    setNewDate(toDateInputValue(date));
    setModalOpen(true);
  }

  function shiftDay(deltaDays: number) {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + deltaDays);
      return next;
    });
  }

  function shiftWeek(deltaWeeks: number) {
    shiftDay(deltaWeeks * 7);
  }

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

  async function handleDeleteAssignment(id: string) {
    const prevList = assignments;
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    setActiveAssignmentId(null);

    const res = await fetch(`/api/assignments/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setAssignments(prevList);
      return;
    }
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
        title: newTitle.trim(),
        type: newType,
        dueDate: newDate,
      }),
    });

    if (res.ok) {
      const created = await res.json();
      const matchedSubject = subjects.find((s) => s.id === newSubjectId) || {
        id: newSubjectId,
        name: "Matière",
        color: "#6366f1",
      };
      const normalized: AgendaAssignment = {
        ...created,
        subject: created.subject || matchedSubject,
      };

      setAssignments((prev) =>
        [...prev, normalized].sort(
          (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        )
      );

      const [yy, mm, dd] = newDate.split("-").map(Number);
      if (yy && mm && dd) {
        setSelectedDate(new Date(yy, mm - 1, dd));
      }

      setNewTitle("");
      setTypeMenuOpen(false);
      setModalOpen(false);
      router.refresh();
    }
  }

  const selectedTypeLabel = formatTypeLabel(newType);

  function renderCalendarPicker() {
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-72 bg-[#161B22] border border-[#2C3446] rounded-xl p-3.5 shadow-2xl space-y-3"
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() =>
              setPickerMonth(
                (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
              )
            }
            aria-label="Mois précédent"
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#222836] rounded-lg cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-medium text-white capitalize">
            {pickerMonthLabel}
          </span>

          <button
            type="button"
            onClick={() =>
              setPickerMonth(
                (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
              )
            }
            aria-label="Mois suivant"
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#222836] rounded-lg cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {MONTH_DAYS_FR.map((label) => (
            <span
              key={label}
              className="text-[10px] text-zinc-500 py-1 select-none"
            >
              {label}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {monthCells.map(({ date, inCurrentMonth }, idx) => {
            const isSelected = isSameDay(date, selectedDate);
            const isTodayCell = isSameDay(date, new Date());
            const hasEvents = filteredAssignments.some((a) =>
              isSameDay(new Date(a.dueDate), date)
            );

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectCalendarDate(date)}
                className={`h-8 rounded-lg text-xs tabular-nums flex flex-col items-center justify-center relative transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white"
                    : isTodayCell
                    ? "bg-[#1E2536] text-indigo-300 border border-indigo-500/40"
                    : inCurrentMonth
                    ? "text-zinc-200 hover:bg-[#222836]"
                    : "text-zinc-600 hover:bg-[#1C2230]"
                }`}
              >
                <span>{date.getDate()}</span>
                {hasEvents && (
                  <span
                    className={`w-1 h-1 rounded-full mt-0.5 ${
                      isSelected ? "bg-white" : "bg-indigo-400"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="pt-2 border-t border-[#222836] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleJumpToToday}
            className="px-2.5 py-1 text-[11px] bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg cursor-pointer"
          >
            Aller à aujourd&apos;hui
          </button>

          <button
            type="button"
            onClick={() => setCalendarOpen(false)}
            className="px-2.5 py-1 text-[11px] text-zinc-400 hover:text-white rounded-lg cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  function renderAssignmentCard(item: AgendaAssignment, compact = false) {
    const color = item.subject?.color || "#6366f1";
    const typeLabel = formatTypeLabel(item.type);

    return (
      <div
        key={item.id}
        onClick={() => setActiveAssignmentId(item.id)}
        style={{
          backgroundColor: `${color}1C`,
          borderColor: `${color}66`,
        }}
        className={`group rounded-xl border transition-all cursor-pointer select-none ${
          compact ? "p-3" : "p-4"
        } ${item.isCompleted ? "opacity-55" : "hover:brightness-110"}`}
      >
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <span
              style={{ backgroundColor: color }}
              className="w-1.5 self-stretch rounded-full shrink-0 mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <div
                className={`text-white leading-snug break-words ${
                  compact ? "text-xs" : "text-sm"
                } ${item.isCompleted ? "line-through text-zinc-300" : ""}`}
              >
                {typeLabel} : {item.title}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px]">
                <span
                  style={{
                    backgroundColor: `${color}2E`,
                    color: "#F4F4F5",
                  }}
                  className="px-2 py-0.5 rounded-md truncate max-w-[140px]"
                >
                  {item.subject?.name}
                </span>

                <span
                  className={`px-2 py-0.5 rounded-md ${
                    item.isCompleted
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-amber-500/20 text-amber-300"
                  }`}
                >
                  {item.isCompleted ? "Terminé" : "À faire"}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            aria-label={
              item.isCompleted ? "Marquer comme à faire" : "Marquer comme terminé"
            }
            onClick={(e) => {
              e.stopPropagation();
              toggleCompleted(item.id, item.isCompleted);
            }}
            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
              item.isCompleted
                ? "bg-indigo-600 border-indigo-400 text-white"
                : "bg-[#0F1117]/80 border-white/25 hover:border-white/60 text-transparent"
            }`}
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl text-white tracking-tight">
            Agenda & Devoirs
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-zinc-400 capitalize hidden md:block">
              Semaine du {weekRangeLabel}
            </p>
            {weekOffsetFromNow !== 0 && (
              <span className="px-2 py-0.5 rounded-md text-[11px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                {weekOffsetFromNow > 0
                  ? `+${weekOffsetFromNow} sem`
                  : `${weekOffsetFromNow} sem`}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Navigation semaine + Aujourd'hui (calendrier) */}
          <div
            ref={calendarPopoverRef}
            className="hidden md:flex items-center gap-1 bg-[#161B22] border border-[#262C3A] rounded-lg p-1 relative"
          >
            <button
              type="button"
              onClick={() => shiftWeek(-1)}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#222836] rounded-md cursor-pointer"
              aria-label="Semaine précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={openCalendarPopover}
              className="px-2.5 py-1 text-xs text-zinc-200 hover:text-white hover:bg-[#222836] rounded-md flex items-center gap-1.5 cursor-pointer"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Aujourd&apos;hui</span>
            </button>
            <button
              type="button"
              onClick={() => shiftWeek(1)}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#222836] rounded-md cursor-pointer"
              aria-label="Semaine suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {calendarOpen && (
              <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-full mt-2 z-40">
                {renderCalendarPicker()}
              </div>
            )}
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
            type="button"
            onClick={() => openModalForDate(selectedDate)}
            className="px-3.5 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter une échéance</span>
          </button>
        </div>
      </div>

      {/* VUE MOBILE (< md) : 1 JOUR À LA FOIS */}
      <div className="md:hidden space-y-4">
        <div className="bg-[#161B22] border border-[#262C3A] rounded-xl p-3 space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftWeek(-1)}
              className="p-2 text-zinc-300 hover:text-white bg-[#0F1117] border border-[#262C3A] rounded-lg cursor-pointer"
              aria-label="Semaine précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center">
              <div className="text-sm text-white capitalize">
                {selectedDayLabel}
              </div>
              <button
                type="button"
                onClick={openCalendarPopover}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 mt-0.5 inline-flex items-center gap-1 cursor-pointer"
              >
                <CalendarIcon className="w-3 h-3" />
                <span>Aujourd&apos;hui / Calendrier</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => shiftWeek(1)}
              className="p-2 text-zinc-300 hover:text-white bg-[#0F1117] border border-[#262C3A] rounded-lg cursor-pointer"
              aria-label="Semaine suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {calendarOpen && (
            <div className="md:hidden flex justify-center pt-1">
              {renderCalendarPicker()}
            </div>
          )}

          {/* Bandeau des 7 jours de la semaine */}
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day, idx) => {
              const active = isSameDay(day, selectedDate);
              const today = isSameDay(day, new Date());
              const dayCount = filteredAssignments.filter((a) =>
                isSameDay(new Date(a.dueDate), day)
              ).length;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedDate(new Date(day))}
                  className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 border transition-colors cursor-pointer ${
                    active
                      ? "bg-indigo-600 border-indigo-400 text-white"
                      : today
                      ? "bg-[#1E2536] border-indigo-500/40 text-zinc-100"
                      : "bg-[#0F1117] border-[#222836] text-zinc-400"
                  }`}
                >
                  <span className="text-[10px] uppercase">
                    {day.toLocaleDateString("fr-FR", { weekday: "short" })}
                  </span>
                  <span className="text-xs tabular-nums">{day.getDate()}</span>
                  <span className="h-1.5 flex items-center gap-0.5">
                    {dayCount > 0 && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          active ? "bg-white" : "bg-indigo-400"
                        }`}
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Liste des blocs du jour sélectionné */}
        {selectedDayAssignments.length === 0 ? (
          <div className="bg-[#161B22] border border-[#262C3A] rounded-xl p-6 text-center space-y-3">
            <p className="text-xs text-zinc-400">
              Aucune échéance prévue ce jour.
            </p>
            <button
              type="button"
              onClick={() => openModalForDate(selectedDate)}
              className="px-3.5 py-2 text-xs bg-[#1E2434] hover:bg-[#273046] text-indigo-300 border border-indigo-500/30 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter sur cette date</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDayAssignments.map((item) =>
              renderAssignmentCard(item, false)
            )}
          </div>
        )}
      </div>

      {/* VUE PC (>= md) : SEMAINE COMPLÈTE EN COLONNES AÉRÉES */}
      <div className="hidden md:grid md:grid-cols-7 gap-3">
        {weekDays.map((day, idx) => {
          const today = isSameDay(day, new Date());
          const dayItems = filteredAssignments
            .filter((a) => isSameDay(new Date(a.dueDate), day))
            .sort(
              (a, b) =>
                new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
            );

          return (
            <div
              key={idx}
              className={`bg-[#161B22] border rounded-xl p-2.5 min-h-[380px] flex flex-col gap-2.5 ${
                today ? "border-indigo-500/60" : "border-[#262C3A]"
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#222836]">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-zinc-400 capitalize">
                    {day.toLocaleDateString("fr-FR", { weekday: "short" })}
                  </span>
                  <span
                    className={`text-xs tabular-nums px-2 py-0.5 rounded-md ${
                      today
                        ? "bg-indigo-600 text-white"
                        : "bg-[#0F1117] text-zinc-200"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => openModalForDate(day)}
                  title="Ajouter une échéance ce jour"
                  className="p-1 text-zinc-500 hover:text-white hover:bg-[#222836] rounded cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {dayItems.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-[11px] text-zinc-600 text-center px-2">
                  Rien de prévu
                </div>
              ) : (
                <div className="space-y-2.5 flex-1">
                  {dayItems.map((item) => renderAssignmentCard(item, true))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* PANNEAU DE DÉTAIL AU CLIC SUR UN BLOC */}
      {activeAssignment && (
        <div
          onClick={() => setActiveAssignmentId(null)}
          className="fixed inset-0 z-50 bg-black/75 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              borderColor: `${activeAssignment.subject?.color || "#6366f1"}88`,
            }}
            className="w-full sm:max-w-md bg-[#161B22] border-t sm:border rounded-t-2xl sm:rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  style={{
                    backgroundColor: activeAssignment.subject?.color || "#6366f1",
                  }}
                  className="w-3 h-3 rounded-full shrink-0"
                />
                <span className="text-xs text-zinc-300">
                  {formatTypeLabel(activeAssignment.type)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveAssignmentId(null)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-base text-white leading-snug">
              {activeAssignment.title}
            </h2>

            <div className="bg-[#0F1117] border border-[#262C3A] rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Matière</span>
                <span className="text-zinc-100">
                  {activeAssignment.subject?.name}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Date</span>
                <span className="text-zinc-100 flex items-center gap-1.5 capitalize">
                  <CalendarIcon className="w-3.5 h-3.5 text-zinc-400" />
                  {new Date(activeAssignment.dueDate).toLocaleDateString(
                    "fr-FR",
                    {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Statut</span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[11px] ${
                    activeAssignment.isCompleted
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-amber-500/20 text-amber-300"
                  }`}
                >
                  {activeAssignment.isCompleted ? "Terminé" : "À faire"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleDeleteAssignment(activeAssignment.id)}
                className="px-3 py-2 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/25 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  toggleCompleted(
                    activeAssignment.id,
                    activeAssignment.isCompleted
                  )
                }
                className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {activeAssignment.isCompleted
                    ? "Remettre à faire"
                    : "Marquer terminé"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE CRÉATION D'ÉCHÉANCE */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 overflow-y-auto py-8 px-4 flex items-center justify-center">
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
                className="w-full bg-[#0F1117] border border-[#262C3A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
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
                placeholder="ex. Exercices séries numériques"
                className="w-full bg-[#0F1117] border border-[#262C3A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div ref={typeMenuRef} className="relative">
                <label className="block text-xs text-zinc-400 mb-1">Type</label>
                <button
                  type="button"
                  onClick={() => setTypeMenuOpen((prev) => !prev)}
                  className="w-full bg-[#0F1117] border border-[#262C3A] hover:border-[#374151] rounded-lg px-2.5 py-2 text-xs text-white flex items-center justify-between focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <span>{selectedTypeLabel}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                </button>

                {typeMenuOpen && (
                  <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-[#12161F] border border-[#262C3A] rounded-lg shadow-xl z-20 py-1">
                    {ASSIGNMENT_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => {
                          setNewType(t.value);
                          setTypeMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                          newType === t.value
                            ? "bg-indigo-600/25 text-indigo-300"
                            : "text-zinc-200 hover:bg-[#1C2230]"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-[#0F1117] border border-[#262C3A] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTypeMenuOpen(false);
                  setModalOpen(false);
                }}
                className="px-3 py-1.5 text-xs text-zinc-400 border border-[#262C3A] rounded-lg cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer"
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