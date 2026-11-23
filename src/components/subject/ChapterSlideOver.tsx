"use client";

import { useState, useEffect } from "react";
import { X, Check, Trash2, ExternalLink } from "lucide-react";
import { MasteryLevel } from "@prisma/client";
import { MASTERY_META } from "@/lib/progress";

export interface ChapterData {
  id: string;
  number: number;
  title: string;
  masteryLevel: MasteryLevel;
  isPriority: boolean;
  courseReviewed: boolean;
  summaryDone: boolean;
  exercisesDone: boolean;
  pastExamsDone: boolean;
  obsidianUrl: string | null;
  driveUrl: string | null;
  extraUrl: string | null;
  quickNotes: string | null;
}

export function ChapterSlideOver({
  chapter,
  onClose,
  onSave,
  onDelete,
}: {
  chapter: ChapterData | null;
  onClose: () => void;
  onSave: (updated: ChapterData) => void;
  onDelete: (id: string) => void;
}) {
  const [form, setForm] = useState<ChapterData | null>(chapter);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(chapter);
  }, [chapter]);

  if (!chapter || !form) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/chapters/${form.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const updated = await res.json();
        onSave(updated);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!form) return;
    const res = await fetch(`/api/chapters/${form.id}`, { method: "DELETE" });
    if (res.ok) {
      onDelete(form.id);
    }
  }

  const checklistItems: {
    key: keyof Pick<
      ChapterData,
      "courseReviewed" | "summaryDone" | "exercisesDone" | "pastExamsDone"
    >;
    label: string;
  }[] = [
    { key: "courseReviewed", label: "Cours relu" },
    { key: "summaryDone", label: "Fiche faite" },
    { key: "exercisesDone", label: "TD refaits" },
    { key: "pastExamsDone", label: "Annales faites" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#161B22] border-l border-[#262C3A] h-full flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#262C3A] flex items-center justify-between">
          <div className="text-xs text-zinc-400">
            Édition du chapitre {form.number}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDelete}
              title="Supprimer le chapitre"
              className="p-1.5 text-zinc-400 hover:text-red-400 rounded-md"
            >
              <Trash2 className="w-4 h-4"/>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-md"
            >
              <X className="w-4 h-4"/>
            </button>
          </div>
        </div>

        {/* Formulaire */}
        <form
          onSubmit={handleSave}
          className="flex-1 overflow-y-auto p-5 space-y-5"
        >
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">N°</label>
              <input
                type="number"
                min={0}
                value={form.number}
                onChange={(e) =>
                  setForm({ ...form, number: Number(e.target.value) })
                }
                className="w-full bg-[#0F1117] border border-[#262C3A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="col-span-3">
              <label className="block text-xs text-zinc-400 mb-1">
                Titre du chapitre
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-[#0F1117] border border-[#262C3A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Niveau d'apprentissage & Priorité */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Niveau d&apos;apprentissage
              </label>
              <select
                value={form.masteryLevel}
                onChange={(e) =>
                  setForm({
                    ...form,
                    masteryLevel: e.target.value as MasteryLevel,
                  })
                }
                className="w-full bg-[#0F1117] border border-[#262C3A] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {(Object.keys(MASTERY_META) as MasteryLevel[]).map((level) => (
                  <option key={level} value={level}>
                    {MASTERY_META[level].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() =>
                  setForm({ ...form, isPriority: !form.isPriority })
                }
                className={`w-full py-2 px-3 rounded-lg border text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  form.isPriority
                    ? "bg-rose-500/15 border-rose-500/40 text-rose-300"
                    : "bg-[#0F1117] border-[#262C3A] text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <span>
                  {form.isPriority ? "Prioritaire (Urgent)" : "Marquer prioritaire"}
                </span>
              </button>
            </div>
          </div>

          {/* To-Do Checklist */}
          <div className="bg-[#0F1117] border border-[#262C3A] rounded-xl p-3.5 space-y-2.5">
            <div className="text-xs text-zinc-400 mb-1">To-Do de validation</div>
            {checklistItems.map((item) => {
              const checked = form[item.key];
              return (
                <label
                  key={item.key}
                  onClick={() => setForm({ ...form, [item.key]: !checked })}
                  className="flex items-center gap-2.5 text-xs text-zinc-200 cursor-pointer py-1"
                >
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                      checked
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "border-[#343C4E] bg-[#161B22]"
                    }`}
                  >
                    {checked && <Check className="w-3 h-3"/>}
                  </span>
                  <span>{item.label}</span>
                </label>
              );
            })}
          </div>

          {/* Liens */}
          <div className="space-y-3">
            <div className="bg-[#0F1117] border border-[#262C3A] rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-zinc-400">Lien Google Drive</label>
                {form.driveUrl && (
                  <a
                    href={form.driveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    Ouvrir <ExternalLink className="w-3 h-3"/>
                  </a>
                )}
              </div>
              <input
                type="url"
                value={form.driveUrl || ""}
                onChange={(e) => setForm({ ...form, driveUrl: e.target.value })}
                placeholder="https://drive.google.com/..."
                className="w-full bg-[#161B22] border border-[#262C3A] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="bg-[#0F1117] border border-[#262C3A] rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-zinc-400">Note Obsidian</label>
                {form.obsidianUrl && (
                  <a
                    href={form.obsidianUrl}
                    className="text-[11px] text-purple-400 hover:underline flex items-center gap-1"
                  >
                    Lancer <ExternalLink className="w-3 h-3"/>
                  </a>
                )}
              </div>
              <input
                type="text"
                value={form.obsidianUrl || ""}
                onChange={(e) =>
                  setForm({ ...form, obsidianUrl: e.target.value })
                }
                placeholder="obsidian://open?vault=..."
                className="w-full bg-[#161B22] border border-[#262C3A] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="bg-[#0F1117] border border-[#262C3A] rounded-xl p-3">
              <label className="block text-xs text-zinc-400 mb-1.5">
                Lien complémentaire (correction, vidéo, sujet)
              </label>
              <input
                type="url"
                value={form.extraUrl || ""}
                onChange={(e) => setForm({ ...form, extraUrl: e.target.value })}
                placeholder="https://..."
                className="w-full bg-[#161B22] border border-[#262C3A] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Notes rapides */}
          <div className="bg-[#0F1117] border border-[#262C3A] rounded-xl p-3">
            <label className="block text-xs text-zinc-400 mb-1.5">
              Notes rapides
            </label>
            <textarea
              rows={4}
              value={form.quickNotes || ""}
              onChange={(e) => setForm({ ...form, quickNotes: e.target.value })}
              placeholder="Points bloquants, formules à vérifier, remarques..."
              className="w-full bg-[#161B22] border border-[#262C3A] rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs text-zinc-400 hover:text-white border border-[#262C3A] rounded-lg"
            >
              Fermer
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}