'use client';

import { useState } from "react";
import { useRouter, Link } from "../../navigation"; // Import depuis ton fichier navigation i18n
import { auth } from "../../lib/apiClient"; 

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    try {
      await auth.register(data);
      // Redirection vers le login avec un signal de succès
      router.push('/auth/login?registered=true');
    } catch (err: any) {
      setError(err.message || "L'envol a échoué.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-slate-900/50 border border-emerald-500/30 rounded-2xl backdrop-blur-xl shadow-2xl">
      <h2 className="text-3xl font-bold text-white mb-6 text-center">Rejoindre la Volée</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Champs avec le style émeraude... */}
        <div>
          <label className="block text-sm font-medium text-emerald-400 mb-1">Nom d'oiseau (Pseudo)</label>
          <input name="username" type="text" required className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-lg text-white focus:border-emerald-500 outline-none transition-all" placeholder="Zoizo_Bleu" />
        </div>
        {/* ... autres champs ... */}
        
        {error && <p className="text-red-400 text-sm bg-red-400/10 p-2 rounded border border-red-400/20 text-center">{error}</p>}

        <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-emerald-900/40">
          {loading ? "Création du profil..." : "Prendre son envol"}
        </button>
      </form>

      <div className="mt-6 text-center text-slate-400 text-sm">
        Déjà un compte ? <Link href="/auth/login" className="text-emerald-400 hover:underline">Se connecter</Link>
      </div>
    </div>
  );
}