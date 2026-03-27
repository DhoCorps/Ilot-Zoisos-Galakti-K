'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react'; // 🔑 Crucial pour l'owner
import { teams } from '../../lib/apiClient'; 
import { Loader2, ShieldPlus, TextQuote, Fingerprint, Activity, Lock, Globe } from 'lucide-react';

interface CreateTeamFormProps {
  onSuccess?: () => void;
  parentTeamId?: string | null;
}

export function CreateTeamForm({ onSuccess, parentTeamId = null }: CreateTeamFormProps) {
  const router = useRouter();
  const { data: session } = useSession(); // On récupère l'identité de l'oiseau
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    // Extraction de l'UID du créateur
    const userId = (session?.user as any)?.uid || (session?.user as any)?._id;

    if (!userId) {
      setError("Protocole interrompu : Entité créatrice non identifiée.");
      setIsPending(false);
      return;
    }

    try {
      // 🧬 Forge de l'objet Team aligné sur l'Ilot Zoizos
      const newTeam = await teams.create({
        name: formData.name,
        description: formData.description,
        owner: userId, // On injecte le créateur
        parent: parentTeamId, // Pour la hiérarchie des nids
        collectiveHealth: { isOverloaded: false },
        moderation: { isFlagged: false }
      });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/dashboard/teams/${newTeam.uid || newTeam._id}`);
      }
    } catch (err: any) {
      console.error("Échec de la genèse du nid :", err);
      setError(err.message || "Erreur lors de l'injection dans la matrice.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-1 bg-[#05070A]">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Header du Formulaire */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-red-950/20 rounded-xl border border-red-900/30">
            <ShieldPlus className="w-6 h-6 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight uppercase">Tresser un Nid</h2>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] mt-1">
              {parentTeamId ? `Sous-Nid de l'entité ${parentTeamId.substring(0,8)}` : "Initialisation Racine"}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-xl text-red-400 text-[10px] font-mono uppercase tracking-wider animate-pulse">
            ⚠️ {error}
          </div>
        )}

        {/* Champ NOM */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] ml-1">
            <Fingerprint className="w-3 h-3 text-red-500" /> Identifiant du Nid
          </label>
          <input
            required
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="EX: LA CANOPÉE CENTRALE"
            className="w-full px-4 py-3 bg-slate-900/40 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all placeholder:text-slate-800 font-bold"
          />
        </div>

        {/* Champ DESCRIPTION */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] ml-1">
            <TextQuote className="w-3 h-3 text-red-500" /> Mission & Inscription
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Définissez la fréquence de ce nid..."
            rows={3}
            className="w-full px-4 py-3 bg-slate-900/40 border border-slate-800 rounded-xl text-slate-300 outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all placeholder:text-slate-800 resize-none text-sm leading-relaxed"
          />
        </div>

        {/* Toggle Confidentialité - Unifié avec le style Galakti-K */}
        <div className="flex items-center justify-between p-4 bg-slate-900/20 border border-slate-800/60 rounded-xl group hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-3">
            {formData.isPrivate ? <Lock className="w-4 h-4 text-red-500" /> : <Globe className="w-4 h-4 text-slate-500" />}
            <div>
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wide">Visibilité Furtive</p>
              <p className="text-[9px] text-slate-600 font-mono uppercase">Mode Ghost activé pour ce nid</p>
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

        {/* Bouton de validation */}
        <button
          type="submit"
          disabled={isPending || formData.name.length < 3}
          className="w-full py-4 mt-4 bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800 disabled:from-slate-900 disabled:to-slate-900 disabled:text-slate-700 text-white rounded-xl font-black uppercase tracking-[0.3em] text-[10px] transition-all flex items-center justify-center gap-3 shadow-xl border border-red-500/20"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-red-400" />
              <span>Suture du Graphe...</span>
            </>
          ) : (
            <span>Tresser le fragment</span>
          )}
        </button>
      </form>
    </div>
  );
}