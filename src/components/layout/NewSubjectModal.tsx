"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

const PRESET_COLORS = [
  "#3B82F6",
  "#8B5CF6",
  "#10B981",
  "#EAB308",
  "#EF4444",
  "#F97316",
  "#06B6D4",
  "#EC4899",
  "#6366F1",
];

export function NewSubjectModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [driveUrl, setDriveUrl] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color, driveUrl }),
      });
      if (res.ok) {
        const created = await res.json();
        setName("");
        setDriveUrl("");
        onClose();
        router.push(`/subjects/${created.id}`);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#161B22] border border-[#262C3A] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm text-white">Nouvelle matière</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-md"
          >
            <X className="w-4 h-4"/>
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">
              Nom de la matière
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex. Mécanique du point"
              className="w-full bg-[#0F1117] border border-[#262C3A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">
              Couleur d&apos;accentuation
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? "ring-2 ring-white scale-110" : "opacity-75 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">
              Lien dossier Google Drive (optionnel)
            </label>
            <input
              type="url"
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              className="w-full bg-[#0F1117] border border-[#262C3A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white rounded-lg border border-[#262C3A]"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? "Création..." : "Créer la matière"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}