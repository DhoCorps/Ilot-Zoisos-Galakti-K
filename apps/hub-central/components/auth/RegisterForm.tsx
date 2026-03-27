'use client';

import { useState } from "react";
import { useRouter, Link } from "../../navigation"; 
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
      router.push('/auth/login?registered=true');
    } catch (err: any) {
      setError(err.message || "L'envol a échoué.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-slate-900/50 border border-emerald-500/30 rounded-2xl backdrop-blur-xl shadow-2xl nexus-card">
      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 mb-6 text-center uppercase tracking-wider">
        Rejoindre la Volée
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-emerald-400 mb-1">Nom d'oiseau (Pseudo)</label>
          <input 
            name="username" 
            type="text" 
            required 
            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all shadow-inner" 
            placeholder="Zoizo_Bleu" 
          />
        </div>
        
        {/* Tu pourras ajouter tes autres champs (email, mot de passe) ici avec exactement les mêmes classes que l'input du dessus */}
        
        {error && (
          <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/30 text-red-400 text-sm font-medium text-center backdrop-blur-sm">
            {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading} 
          className={`w-full py-3 rounded-lg text-white font-bold transition-all shadow-lg ${
            loading 
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700' 
              : 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-emerald-900/40 hover:shadow-cyan-900/40 border border-emerald-500/50'
          }`}
        >
          {loading ? "Création du profil..." : "Prendre son envol"}
        </button>
      </form>

      <div className="mt-6 text-center text-slate-400 text-sm">
        Déjà un nid ? <Link href="/auth/login" className="text-emerald-400 hover:text-cyan-400 hover:underline transition-colors">Se connecter</Link>
      </div>
    </div>
  );
}