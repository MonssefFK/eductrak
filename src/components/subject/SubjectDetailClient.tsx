"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  ExternalLink,
  Check,
  Trash2,
  FolderOpen,
  FileText,
  AlertCircle,
} from "lucide-react";
import { MasteryLevel, AssignmentType } from "@prisma/client";
import { computeSubjectProgress, MASTERY_META } from "@/lib/progress";
import { ChapterSlideOver, ChapterData } from "./ChapterSlideOver";

interface AssignmentRow {
  id: string;
  title: string;
  type: AssignmentType | string;
  dueDate: string;
  isCompleted: boolean;
}

interface ResourceRow {
  id: string;
  label: string;
  url: string;
  category: string;
}

const ASSIGNMENT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "DEVOIR", label: "Devoir" },
  { value: "DS", label: "DS" },
  { value: "TP", label: "TP" },
  { value: "DM", label: "DM" },
  { value: "PROJET", label: "Projet" },
  { value: "KHOLLE", label: "Khôlle" },
  { value: "REVISION", label: "Révision" },
];

export function SubjectDetailClient({
  subject,
  initialChapters,
  initialAssignments,
  initialResources,
  initialSelectedChapterId,
}: {
  subject: {
    id: string;
    name: string;
    color: string;
    driveUrl: string | null;
    notes: string | null;
  };
  initialChapters: ChapterData[];
  initialAssignments: AssignmentRow[];
  initialResources: ResourceRow[];
  initialSelectedChapterId?: string;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "chapters" | "assignments" | "resources"
  >("chapters");

  const [chapters, setChapters] = useState<ChapterData[]>(initialChapters);
  const [assignments, setAssignments] =
    useState<AssignmentRow[]>(initialAssignments);
  const [resources, setResources] = useState<ResourceRow[]>(initialResources);
  const [notes, setNotes] = useState(subject.notes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [deletingSubject, setDeletingSubject] = useState(false);
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<string | null>(
    null
  );

  const [selectedChapter, setSelectedChapter] = useState<ChapterData | null>(
    initialSelectedChapterId
      ? initialChapters.find((c) => c.id === initialSelectedChapterId) || null
      : null
  );

  const [newChapterOpen, setNewChapterOpen] = useState(false);
  const [newChTitle, setNewChTitle] = useState("");
  const [newChNumber, setNewChNumber] = useState(initialChapters.length + 1);

  const [newAssignOpen, setNewAssignOpen] = useState(false);
  const [newAssignTitle, setNewAssignTitle] = useState("");
  const [newAssignType, setNewAssignType] = useState<string>("DEVOIR");
  const [newAssignDate, setNewAssignDate] = useState("");

  const [resLabel, setResLabel] = useState("");
  const [resUrl, setResUrl] = useState("");
  const [resCategory, setResCategory] = useState("Drive");

  const progress = computeSubjectProgress(chapters);

  async function handleQuickMasteryChange(
    e: React.ChangeEvent<HTMLSelectElement>,
    chapterId: string
  ) {
    e.stopPropagation();
    const masteryLevel = e.target.value as MasteryLevel;
    setChapters((prev) =>
      prev.map((c) => (c.id === chapterId ? { ...c, masteryLevel } : c))
    );
    await fetch(`/api/chapters/${chapterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ masteryLevel }),
    });
    router.refresh();
  }

  async function handleCreateChapter(e: React.FormEvent) {
    e.preventDefault();
    if (!newChTitle.trim()) return;
    const res = await fetch("/api/chapters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId: subject.id,
        number: newChNumber,
        title: newChTitle,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setChapters((prev) =>
        [...prev, created].sort((a, b) => a.number - b.number)
      );
      setNewChTitle("");
      setNewChNumber(chapters.length + 2);
      setNewChapterOpen(false);
      router.refresh();
    }
  }

  async function handleCreateAssignment(e: React.FormEvent) {
    e.preventDefault();
    if (!newAssignTitle.trim() || !newAssignDate) return;
    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId: subject.id,
        title: newAssignTitle,
        type: newAssignType,
        dueDate: newAssignDate,
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
      setNewAssignTitle("");
      setNewAssignDate("");
      setNewAssignOpen(false);
      router.refresh();
    }
  }

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

  async function handleDeleteAssignment(assignment: AssignmentRow) {
    if (deletingAssignmentId === assignment.id) return;
    const confirmed = window.confirm(
      `Supprimer l'échéance "${assignment.title}" ?`
    );
    if (!confirmed) return;

    const prevList = assignments;
    setDeletingAssignmentId(assignment.id);
    setAssignments((prev) => prev.filter((a) => a.id !== assignment.id));

    try {
      const res = await fetch(`/api/assignments/${assignment.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setAssignments(prevList);
        return;
      }
      router.refresh();
    } catch {
      setAssignments(prevList);
    } finally {
      setDeletingAssignmentId(null);
    }
  }

  async function handleAddResource(e: React.FormEvent) {
    e.preventDefault();
    if (!resLabel.trim() || !resUrl.trim()) return;
    const res = await fetch(`/api/subjects/${subject.id}/resources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: resLabel,
        url: resUrl,
        category: resCategory,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setResources((prev) => [...prev, created]);
      setResLabel("");
      setResUrl("");
    }
  }

  async function handleDeleteResource(resourceId: string) {
    setResources((prev) => prev.filter((r) => r.id !== resourceId));
    await fetch(
      `/api/subjects/${subject.id}/resources?resourceId=${resourceId}`,
      { method: "DELETE" }
    );
  }

  async function handleSaveSubjectNotes() {
    setSavingNotes(true);
    try {
      await fetch(`/api/subjects/${subject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleDeleteSubject() {
    if (deletingSubject) return;
    const confirmed = window.confirm(
      `Supprimer définitivement la matière "${subject.name}" ?`
    );
    if (!confirmed) return;

    setDeletingSubject(true);
    try {
      const res = await fetch(`/api/subjects/${subject.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setDeletingSubject(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setDeletingSubject(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#161B22] border border-[#262C3A] rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0"
              style={{ backgroundColor: subject.color }}
            />
            <h1 className="text-xl sm:text-2xl text-white tracking-tight">
              {subject.name}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {subject.driveUrl && (
              <a
                href={subject.driveUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 text-xs bg-[#0F1117] hover:bg-[#1D2330] text-zinc-300 border border-[#262C3A] rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Drive matière</span>
                <ExternalLink className="w-3 h-3 text-zinc-500" />
              </a>
            )}

            {activeTab === "chapters" && (
              <button
                type="button"
                onClick={() => {
                  setNewChNumber(chapters.length + 1);
                  setNewChapterOpen(true);
                }}
                className="px-3.5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un chapitre</span>
              </button>
            )}

            {activeTab === "assignments" && (
              <button
                type="button"
                onClick={() => setNewAssignOpen(true)}
                className="px-3.5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une échéance</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDeleteSubject}
              disabled={deletingSubject}
              className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 rounded-lg flex items-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deletingSubject ? "Suppression..." : "Supprimer"}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-2 bg-[#0F1117] rounded-full overflow-hidden border border-[#262C3A]">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                backgroundColor: subject.color,
              }}
            />
          </div>
          <span className="text-sm text-indigo-400 tabular-nums shrink-0">
            {progress}%
          </span>
        </div>

        <div className="flex items-center gap-6 border-t border-[#222836] mt-5 pt-3 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("chapters")}
            className={`pb-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === "chapters"
                ? "border-indigo-500 text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Chapitres ({chapters.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("assignments")}
            className={`pb-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === "assignments"
                ? "border-indigo-500 text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Devoirs & Examens ({assignments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("resources")}
            className={`pb-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === "resources"
                ? "border-indigo-500 text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Ressources & Notes
          </button>
        </div>
      </div>

      {activeTab === "chapters" && (
        <div className="space-y-2.5">
          {chapters.length === 0 ? (
            <div className="bg-[#161B22] border border-[#262C3A] rounded-xl p-8 text-center text-xs text-zinc-500">
              Aucun chapitre enregistré pour cette matière.
            </div>
          ) : (
            chapters.map((ch) => {
              const meta = MASTERY_META[ch.masteryLevel] || {
                label: ch.masteryLevel,
                badgeBg: "bg-sky-500/15",
                badgeText: "text-sky-400",
                borderColor: "border-sky-500/30",
              };
              return (
                <div
                  key={ch.id}
                  onClick={() => setSelectedChapter(ch)}
                  className="bg-[#161B22] hover:bg-[#1B212C] border border-[#262C3A] hover:border-[#384154] rounded-xl px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm text-zinc-200 truncate">
                      Ch. {ch.number} - {ch.title}
                    </span>

                    {ch.isPriority && (
                      <span
                        title="Chapitre prioritaire"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-rose-500/15 text-rose-400 border border-rose-500/30 shrink-0"
                      >
                        <AlertCircle className="w-3 h-3" />
                        Priorité
                      </span>
                    )}
                  </div>

                  <div
                    className="flex items-center gap-2.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <select
                      value={ch.masteryLevel}
                      onChange={(e) => handleQuickMasteryChange(e, ch.id)}
                      className={`px-2.5 py-1 rounded-full text-xs border cursor-pointer focus:outline-none ${meta.badgeBg} ${meta.badgeText} ${meta.borderColor}`}
                    >
                      {(Object.keys(MASTERY_META) as MasteryLevel[]).map(
                        (lvl) => (
                          <option
                            key={lvl}
                            value={lvl}
                            className="bg-[#161B22] text-zinc-200"
                          >
                            {MASTERY_META[lvl].label}
                          </option>
                        )
                      )}
                    </select>

                    {ch.obsidianUrl ? (
                      <a
                        href={ch.obsidianUrl}
                        title="Ouvrir dans Obsidian"
                        className="w-8 h-8 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                      </a>
                    ) : (
                      <span
                        title="Aucun lien Obsidian"
                        className="w-8 h-8 rounded-lg bg-[#0F1117] border border-[#222836] flex items-center justify-center text-zinc-700"
                      >
                        <FileText className="w-4 h-4" />
                      </span>
                    )}

                    {ch.driveUrl ? (
                      <a
                        href={ch.driveUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Ouvrir sur Google Drive"
                        className="w-8 h-8 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 transition-colors"
                      >
                        <FolderOpen className="w-4 h-4" />
                      </a>
                    ) : (
                      <span
                        title="Aucun lien Drive"
                        className="w-8 h-8 rounded-lg bg-[#0F1117] border border-[#222836] flex items-center justify-center text-zinc-700"
                      >
                        <FolderOpen className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === "assignments" && (
        <div className="bg-[#161B22] border border-[#262C3A] rounded-xl divide-y divide-[#222836]">
          {assignments.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              Aucun devoir ou examen programmé pour {subject.name}.
            </div>
          ) : (
            assignments.map((a) => (
              <div
                key={a.id}
                className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleAssignment(a.id, a.isCompleted)}
                    className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 cursor-pointer ${
                      a.isCompleted
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "border-[#343C4E] bg-[#0F1117]"
                    }`}
                  >
                    {a.isCompleted && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <span className="px-2 py-0.5 rounded text-[11px] bg-[#0F1117] border border-[#262C3A] text-zinc-300 shrink-0">
                    {a.type}
                  </span>

                  <span
                    className={`text-xs truncate ${
                      a.isCompleted
                        ? "line-through text-zinc-500"
                        : "text-zinc-200"
                    }`}
                  >
                    {a.title}
                  </span>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 text-xs">
                  <span className="text-zinc-400 tabular-nums">
                    {new Date(a.dueDate).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] ${
                      a.isCompleted
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-amber-500/15 text-amber-400"
                    }`}
                  >
                    {a.isCompleted ? "Terminé" : "À faire"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteAssignment(a)}
                    disabled={deletingAssignmentId === a.id}
                    title="Supprimer l'échéance"
                    aria-label="Supprimer l'échéance"
                    className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "resources" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#161B22] border border-[#262C3A] rounded-xl p-4 space-y-4">
            <h2 className="text-sm text-white">Ressources & Liens clés</h2>

            <form onSubmit={handleAddResource} className="space-y-2.5">
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  value={resLabel}
                  onChange={(e) => setResLabel(e.target.value)}
                  placeholder="Titre (ex. Formulaire)"
                  className="col-span-2 bg-[#0F1117] border border-[#262C3A] rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
                <input
                  type="text"
                  value={resCategory}
                  onChange={(e) => setResCategory(e.target.value)}
                  placeholder="Catégorie"
                  className="bg-[#0F1117] border border-[#262C3A] rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  required
                  value={resUrl}
                  onChange={(e) => setResUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 bg-[#0F1117] border border-[#262C3A] rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg cursor-pointer"
                >
                  Ajouter
                </button>
              </div>
            </form>

            <div className="divide-y divide-[#222836]">
              {resources.map((r) => (
                <div
                  key={r.id}
                  className="py-2.5 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-2 py-0.5 rounded bg-[#0F1117] border border-[#262C3A] text-zinc-400 text-[11px]">
                      {r.category}
                    </span>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-zinc-200 hover:text-indigo-400 truncate flex items-center gap-1"
                    >
                      <span>{r.label}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteResource(r.id)}
                    className="text-zinc-500 hover:text-red-400 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#161B22] border border-[#262C3A] rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <h2 className="text-sm text-white mb-2">
                Bloc-notes général — {subject.name}
              </h2>
              <textarea
                rows={9}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Objectifs du semestre, modalités de contrôle continu, points de méthode..."
                className="w-full bg-[#0F1117] border border-[#262C3A] rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveSubjectNotes}
                disabled={savingNotes}
                className="px-3.5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer"
              >
                {savingNotes ? "Sauvegarde..." : "Enregistrer les notes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ChapterSlideOver
        chapter={selectedChapter}
        onClose={() => setSelectedChapter(null)}
        onSave={(updated) => {
          setChapters((prev) =>
            prev
              .map((c) => (c.id === updated.id ? updated : c))
              .sort((a, b) => a.number - b.number)
          );
          setSelectedChapter(null);
          router.refresh();
        }}
        onDelete={(deletedId) => {
          setChapters((prev) => prev.filter((c) => c.id !== deletedId));
          setSelectedChapter(null);
          router.refresh();
        }}
      />

      {newChapterOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateChapter}
            className="w-full max-w-md bg-[#161B22] border border-[#262C3A] rounded-xl p-5 space-y-4"
          >
            <h3 className="text-sm text-white">Nouveau chapitre</h3>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">N°</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={newChNumber}
                  onChange={(e) => setNewChNumber(Number(e.target.value))}
                  className="w-full bg-[#0F1117] border border-[#262C3A] rounded-lg px-2.5 py-2 text-xs text-white"
                />
              </div>
              <div className="col-span-3">
                <label className="block text-xs text-zinc-400 mb-1">Titre</label>
                <input
                  type="text"
                  required
                  value={newChTitle}
                  onChange={(e) => setNewChTitle(e.target.value)}
                  placeholder="ex. Théorème de Stokes"
                  className="w-full bg-[#0F1117] border border-[#262C3A] rounded-lg px-2.5 py-2 text-xs text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNewChapterOpen(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 border border-[#262C3A] rounded-lg cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs bg-indigo-600 text-white rounded-lg cursor-pointer"
              >
                Ajouter
              </button>
            </div>
          </form>
        </div>
      )}

      {newAssignOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateAssignment}
            className="w-full max-w-md bg-[#161B22] border border-[#262C3A] rounded-xl p-5 space-y-4"
          >
            <h3 className="text-sm text-white">
              Nouvelle échéance — {subject.name}
            </h3>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Titre</label>
              <input
                type="text"
                required
                value={newAssignTitle}
                onChange={(e) => setNewAssignTitle(e.target.value)}
                placeholder="ex. DS n°2"
                className="w-full bg-[#0F1117] border border-[#262C3A] rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Type</label>
                <select
                  value={newAssignType}
                  onChange={(e) => setNewAssignType(e.target.value)}
                  className="w-full bg-[#0F1117] border border-[#262C3A] rounded-lg px-2.5 py-2 text-xs text-white"
                >
                  {ASSIGNMENT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={newAssignDate}
                  onChange={(e) => setNewAssignDate(e.target.value)}
                  className="w-full bg-[#0F1117] border border-[#262C3A] rounded-lg px-2.5 py-2 text-xs text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNewAssignOpen(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 border border-[#262C3A] rounded-lg cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs bg-indigo-600 text-white rounded-lg cursor-pointer"
              >
                Créer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}