"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

// 1. Le cœur du réacteur : On déplace toute la logique ici
function ResetPasswordForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Le jeton de récupération est manquant ou invalide.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setMessage("Les mots de passe ne correspondent pas.");
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setStatus("success");
        setTimeout(() => router.push("/auth/login"), 3000);
      } else {
        const data = await res.json();
        throw new Error(data.error || "Une erreur est survenue.");
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message);
    }
  };

  if (status === "success") {
    return (
      <div className="nexus-card max-w-md mx-auto mt-20 text-center">
        <h2 className="text-2xl font-bold text-emerald-500 mb-4">Clé forgée avec succès !</h2>
        <p className="text-slate-400">Redirection vers le login dans quelques secondes... (:</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="nexus-card w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Nouvelle Clé</h1>
          <p className="text-slate-400 text-sm mt-2">Forge ton nouveau mot de passe pour l'Îlot.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Nouveau mot de passe</label>
            <input
              type="password"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-emerald-500 outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Confirmer la clé</label>
            <input
              type="password"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-emerald-500 outline-none transition-all"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {message && (
            <p className={`text-xs p-3 rounded border ${status === "error" ? "bg-red-500/10 border-red-500/50 text-red-400" : "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "loading" || !token}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50"
          >
            {status === "loading" ? "Forgeage en cours..." : "Valider la nouvelle clé"}
          </button>
        </form>
      </div>
    </div>
  );
}

// 2. L'export par défaut : Il ne sert qu'à emballer le formulaire dans un Suspense
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[80vh] text-slate-500 italic">
        Initialisation de la forge...
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}