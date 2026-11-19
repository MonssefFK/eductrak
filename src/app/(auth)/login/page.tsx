"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, GraduationCap } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Connexion impossible");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Erreur réseau lors de la connexion.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0F1117] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#161B22] border border-[#262C3A] rounded-xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <GraduationCap className="w-5 h-5"/>
          </div>
          <div>
            <h1 className="text-base text-white tracking-tight">EducTrack</h1>
            <p className="text-xs text-zinc-400">Espace privé — Semestre STPI2</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2"/>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="monssef@studentos.fr"
                className="w-full bg-[#0F1117] border border-[#262C3A] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Mot de passe</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2"/>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0F1117] border border-[#262C3A] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>{loading ? "Connexion..." : "Accéder au cockpit"}</span>
            <ArrowRight className="w-4 h-4"/>
          </button>
        </form>
      </div>
    </div>
  );
}