"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutGrid,
  CalendarDays,
  Plus,
  Menu,
  X,
} from "lucide-react";
import { NewSubjectModal } from "./NewSubjectModal";

export interface SidebarSubject {
  id: string;
  name: string;
  color: string;
  progress: number;
}

export function Sidebar({
  userName,
  subjects,
}: {
  userName: string;
  subjects: SidebarSubject[];
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const navContent = (
    <div className="flex flex-col h-full bg-[#13161F] border-r border-[#222734] select-none">
      {/* En-tête profil */}
      <div className="px-4 py-3.5 border-b border-[#222734] flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs text-white shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="truncate">
            <div className="text-sm text-zinc-100 truncate">{userName}</div>
            <div className="text-[11px] text-zinc-500">Semestre STPI2</div>
          </div>
        </div>
      </div>

      {/* Navigation principale */}
      <div className="p-3 space-y-1">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
            pathname === "/"
              ? "bg-[#1E2433] text-white border border-[#2D3548]"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-[#191E2A]"
          }`}
        >
          <LayoutGrid className="w-4 h-4 text-indigo-400" />
          <span>Vue d&apos;ensemble</span>
        </Link>

        <Link
          href="/agenda"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
            pathname === "/agenda"
              ? "bg-[#1E2433] text-white border border-[#2D3548]"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-[#191E2A]"
          }`}
        >
          <CalendarDays className="w-4 h-4 text-sky-400" />
          <span>Agenda & Devoirs</span>
        </Link>
      </div>

      {/* Section Mes Matières */}
      <div className="px-4 pt-3 pb-1.5 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-zinc-500">
          Mes Matières
        </span>
        <span className="text-[11px] text-zinc-600">{subjects.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-3">
        {subjects.map((subject) => {
          const isActive = pathname === `/subjects/${subject.id}`;
          return (
            <Link
              href={`/subjects/${subject.id}`}
              key={subject.id}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-[#1E2433] border border-[#2D3548]"
                  : "hover:bg-[#191E2A] border border-transparent"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: subject.color }}
                  />
                  <span
                    className={`text-xs truncate ${
                      isActive ? "text-white" : "text-zinc-300"
                    }`}
                  >
                    {subject.name}
                  </span>
                </div>
                <span className="text-[11px] text-zinc-500 tabular-nums shrink-0">
                  ~{subject.progress}%
                </span>
              </div>
              <div className="w-full h-1 bg-[#222736] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${subject.progress}%`,
                    backgroundColor: subject.color,
                  }}
                />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Bouton + Nouvelle matière */}
      <div className="p-3 border-t border-[#222734]">
        <button
          onClick={() => setModalOpen(true)}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-zinc-400 hover:text-white bg-[#161B22] hover:bg-[#1E2433] border border-[#262C3A] rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nouvelle matière</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Barre mobile */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#13161F] border-b border-[#222734]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 text-zinc-300 hover:bg-[#1E2433] rounded-md"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="text-sm text-white">EducTrack — STPI2</span>
        </div>
      </div>

      {/* Tiroir mobile */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="w-[260px] h-full">{navContent}</div>
          <div
            className="flex-1 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      {/* Sidebar fixe desktop */}
      <aside className="hidden lg:block w-[260px] shrink-0 fixed inset-y-0 left-0 z-20">
        {navContent}
      </aside>

      <NewSubjectModal onClose={() => setModalOpen(false)} open={modalOpen} />
    </>
  );
}