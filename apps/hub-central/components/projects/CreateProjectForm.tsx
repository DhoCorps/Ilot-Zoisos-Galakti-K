'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Target, Link as LinkIcon, FileText, Activity, AlertTriangle, Zap, Network } from 'lucide-react';
import { useSession } from 'next-auth/react'; 
import { teams } from '../../lib/apiClient'; 

interface CreateProjectFormProps {
  teamId?: string; // Si présent, on lie directement à ce nid
  onSuccess?: () => void;
}

export const CreateProjectForm = ({ teamId, onSuccess }: CreateProjectFormProps) => {
  const router = useRouter();
  const { data: session } = useSession(); 
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- ÉTATS POUR LA SUTURE DES NIDS ---
  const [availableTeams, setAvailableTeams] = useState<any[]>([]);
  // ⚡ FIX : Renommé en selectedTeamId pour une cohérence totale avec la BDD
  const [selectedTeamId, setSelectedTeamId] = useState(teamId || "");
  const [isLoadingTeams, setIsLoadingTeams] = useState(!teamId);

  // Chargement des nids si aucun teamId n'est imposé
  useEffect(() => {
    if (!teamId) {
      const fetchTeams = async () => {
        try {
          const response = await teams.getAll();
          const data = Array.isArray(response) ? response : (response as any).data || [];
          setAvailableTeams(data);
          if (data.length > 0) setSelectedTeamId(data[0].uid);
        } catch (err) {
          console.error("Erreur de scan de la canopée:", err);
        } finally {
          setIsLoadingTeams(false);
        }
      };
      fetchTeams();
    }
  }, [teamId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Extraction de l'identité du forgeron
    const ownerId = (session?.user as any)?.uid || (session?.user as any)?._id || (session?.user as any)?.id;
    
    if (!ownerId) {
      setError("Erreur : Votre signature thermique est introuvable.");
      setLoading(false);
      return;
    }

    if (!selectedTeamId) {
      setError("Un fragment doit impérativement être rattaché à un nid.");
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const rawtitle = formData.get('title') as string;
    
    // Génération automatique du slug si vide
    let slug = formData.get('slug') as string;
    if (!slug) {
      slug = rawtitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    // 🛡️ FIX : Payload 100% raccord avec ton Schéma Zod
    const projectData = {
      title: rawtitle,
      slug: slug,
      description: formData.get('description') as string,
      status: formData.get('status') as string,
      priority: formData.get('priority') as string,
      teamId: selectedTeamId, // 👈 Le pivot exact attendu par Zod/Mongo
      ownerId: ownerId,       // 👈 La clé exacte attendue
    };

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "La matrice a rejeté l'inception.");
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh(); 
      }
      
      (e.target as HTMLFormElement).reset();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full relative overflow-hidden bg-[#05070A] p-8 md:p-10 rounded-2xl border border-slate-900 shadow-2xl">
      <div className="absolute -top-40 -right-40 w-[400px] h-[400px] bg-red-950/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="mb-8 flex items-start gap-4 border-b border-slate-800/50 pb-6">
        <div className="p-3 rounded-xl bg-slate-900 border border-red-500/20 shadow-[0_0_20px_rgba(229,72,77,0.1)] shrink-0">
          <Zap className="w-6 h-6 text-red-500" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-100 uppercase tracking-tight">
            Inception de <span className="text-red-500">Fragment</span>
          </h2>
          <p className="text-slate-500 mt-1 font-mono text-[10px] uppercase tracking-[0.2em]">
            {teamId ? `Nœud lié au nid : ${teamId.substring(0,8)}` : 'Assignation à une escouade'}
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        
        {/* SÉLECTEUR DE NID (Si non imposé) */}
        {!teamId && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest ml-1">
              <Network size={14} className="text-red-500" />
              Nid de destination *
            </label>
            <div className="relative">
              {isLoadingTeams ? (
                <div className="w-full py-3 px-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
                  <span className="text-slate-700 text-xs font-mono uppercase">Scan de la canopée...</span>
                </div>
              ) : (
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-red-500 appearance-none transition-all cursor-pointer font-light shadow-inner"
                >
                  {availableTeams.length === 0 ? (
                    <option value="">Aucun nid disponible...</option>
                  ) : (
                    availableTeams.map((t) => (
                      <option key={t.uid} value={t.uid} className="bg-slate-950 text-slate-200">
                        {t.name.toUpperCase()}
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest ml-1">
              <Target size={14} className="text-slate-500" />
              Titre du chantier *
            </label>
            <input
              name="title"
              type="text"
              required
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-800 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 shadow-inner transition-all font-light"
              placeholder="Ex: Refonte du Noyau"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest ml-1">
              <LinkIcon size={14} className="text-slate-500" />
              Identifiant (Slug)
            </label>
            <input
              name="slug"
              type="text"
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-800 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 shadow-inner transition-all font-light"
              placeholder="refonte-noyau"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest ml-1">
            <FileText size={14} className="text-slate-500" />
            Matrice de Données (Description)
          </label>
          <textarea
            name="description"
            rows={3}
            className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-800 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 shadow-inner transition-all font-light resize-none no-scrollbar"
            placeholder="Détaillez les objectifs du fragment..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-900/20 rounded-xl border border-slate-800/50">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              <Activity size={14} className="text-slate-500" />
              Statut
            </label>
            <select
              name="status"
              defaultValue="PLANNED"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 outline-none focus:border-red-500 appearance-none cursor-pointer text-sm shadow-inner"
            >
              {/* 🛡️ FIX : Valeurs ENUM strictes pour Zod */}
              <option value="PLANNED">Planifié</option>
              <option value="IN_PROGRESS">En Cours</option>
              <option value="PAUSED">En Pause</option>
              <option value="COMPLETED">Terminé</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              <AlertTriangle size={14} className="text-slate-500" />
              Criticité
            </label>
            <select
              name="priority"
              defaultValue="MEDIUM"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 outline-none focus:border-red-500 appearance-none cursor-pointer text-sm shadow-inner"
            >
              {/* 🛡️ FIX : Valeurs ENUM complètes et strictes */}
              <option value="TRIVIAL">Trivial</option>
              <option value="EASY">Facile</option>
              <option value="MEDIUM">Moyen</option>
              <option value="HARD">Difficile</option>
              <option value="EXTREME">Extrême</option>
              <option value="CRITICAL">Critique</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-xl flex items-center gap-3 text-red-300 text-xs font-mono animate-in slide-in-from-top-2">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            {error.toUpperCase()}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || availableTeams.length === 0}
          className="w-full py-4 mt-4 bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800 text-slate-100 rounded-xl font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 border border-red-500/30 hover:border-red-400/50 tracking-[0.2em] uppercase text-[10px]"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Synchronisation...</>
          ) : (
            <>Injecter le Fragment →</>
          )}
        </button>
      </form>
    </div>
  );
};