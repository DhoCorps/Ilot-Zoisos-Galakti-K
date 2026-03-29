'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react'; 
import { teams } from '../../lib/apiClient'; 
// 🛡️ FIX: J'ai rajouté ShieldPlus ici !
import { Fingerprint, Loader2, TextQuote, Lock, Globe, ShieldPlus } from 'lucide-react';

interface CreateTeamFormProps {
  onSuccess?: () => void;
  parentId?: string | null; 
}

export function CreateTeamForm({ onSuccess, parentId = null }: CreateTeamFormProps) {
  const router = useRouter();
  const { data: session } = useSession(); 
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: true // 🛡️ Sceau de Feu : Furtif par défaut !
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const userId = (session?.user as any)?.uid || (session?.user as any)?._id || (session?.user as any)?.id;

    if (!userId) {
      setError("Protocole interrompu : Signature thermique non identifiée.");
      setIsPending(false);
      return;
    }

    try {
      const newTeam = await teams.create({
        name: formData.name,
        description: formData.description,
        parentId: parentId || undefined, 
        creatorUid: userId, 
        isPrivate: formData.isPrivate, 
        settings: {
          allowSearch: !formData.isPrivate,
          isGlobalReducedSpeed: false
        }
      });

      if (onSuccess) onSuccess();
      else router.push(`/dashboard/teams/${newTeam.uid || newTeam._id}`);
    } catch (err: any) {
      console.error("Échec de la genèse du nid :", err);
      setError(err.message || "Erreur lors de l'injection dans la matrice.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-8 bg-[#05070A] border border-slate-900 rounded-3xl shadow-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="flex items-center gap-4 mb-8 border-b border-slate-900 pb-6">
          <div className="p-3 bg-red-950/20 rounded-xl border border-red-900/30">
            <ShieldPlus className="w-6 h-6 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight uppercase">Tresser un Nid</h2>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] mt-1">
              {parentId ? `SUTURE DE SOUS-NID : ${parentId.substring(0,8)}` : "INITIALISATION RACINE"}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-950/10 border border-red-900/40 rounded-xl text-red-400 text-[10px] font-mono uppercase tracking-wider animate-in fade-in slide-in-from-top-2">
            ⚠️ {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] ml-1">
            <Fingerprint className="w-3 h-3 text-red-500" /> Identifiant du Nid
          </label>
          <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="EX: LA CANOPÉE CENTRALE" className="w-full px-4 py-3 bg-slate-900/40 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all placeholder:text-slate-800 font-bold uppercase" />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] ml-1">
            <TextQuote className="w-3 h-3 text-red-500" /> Mission & Inscription
          </label>
          <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Définissez la fréquence de ce nid..." rows={3} className="w-full px-4 py-3 bg-slate-900/40 border border-slate-800 rounded-xl text-slate-300 outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all placeholder:text-slate-800 resize-none text-sm leading-relaxed" />
        </div>

        {/* 🛡️ VISIBILITÉ GALAKTI-K ÉPURÉE */}
        <div className="flex items-center justify-between p-4 bg-slate-900/20 border border-slate-800/60 rounded-xl group hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-3">
            {formData.isPrivate ? <Lock className="w-4 h-4 text-red-500" /> : <Globe className="w-4 h-4 text-slate-500" />}
            <div>
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                {formData.isPrivate ? "Visibilité Furtive" : "Visibilité Publique"}
              </p>
              <p className="text-[9px] text-slate-600 font-mono uppercase">
                {formData.isPrivate ? "Mode Ghost activé pour ce nid" : "Visible dans la canopée"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isPrivate: !formData.isPrivate })}
            className={`w-10 h-5 rounded-full transition-all relative ${formData.isPrivate ? 'bg-red-600' : 'bg-slate-800'}`}
          >
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.isPrivate ? 'left-6' : 'left-1'}`} />
          </button>
        </div>

        <button type="submit" disabled={isPending || formData.name.length < 3} className="w-full py-4 mt-4 bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800 disabled:from-slate-900 disabled:to-slate-900 disabled:text-slate-700 text-white rounded-xl font-black uppercase tracking-[0.3em] text-[10px] transition-all flex items-center justify-center gap-3 shadow-xl border border-red-500/20">
          {isPending ? <><Loader2 className="w-4 h-4 animate-spin text-red-400" /><span>Suture du Graphe...</span></> : <span>Tresser le fragment →</span>}
        </button>
      </form>
    </div>
  );
}