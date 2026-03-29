'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Target, Link as LinkIcon, FileText, Activity, AlertTriangle, Zap, Network, Lock, Globe, CheckCircle2 } from 'lucide-react';
import { useSession } from 'next-auth/react'; 
import { teams } from '../../lib/apiClient'; 

// 🛡️ IMPORT DES MODULES DE TÂCHES POUR LA ROUTE 2
import { CreateTaskForm } from '../tasks/CreateTaskForm';
import { TaskBoard } from '../tasks/TaskBoard';

interface CreateProjectFormProps {
  teamId?: string; // Si présent, on lie directement à ce nid
  onSuccess?: () => void;
}

export const CreateProjectForm = ({ teamId, onSuccess }: CreateProjectFormProps) => {
  const router = useRouter();
  const { data: session } = useSession(); 
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🛡️ NOUVEL ÉTAT : L'UID du projet nouvellement créé (Active la Route 2)
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  // --- ÉTATS POUR LA SUTURE DES NIDS ---
  const [isPrivate, setIsPrivate] = useState(true);
  const [availableTeams, setAvailableTeams] = useState<any[]>([]);
  // ⚡ FIX : Renommé en selectedTeamId pour une cohérence totale avec la BDD
  const [selectedTeamId, setSelectedTeamId] = useState(teamId || "");
  const [isLoadingTeams, setIsLoadingTeams] = useState(!teamId);

  // Chargement des nids si aucun teamId n'est imposé
  useEffect(() => {
    // Si un projet a déjà été créé, on ne charge plus les nids
    if (!teamId && !createdProjectId) {
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
  }, [teamId, createdProjectId]);

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

   // 🛡️ PAYLOAD MIS À JOUR AVEC ISPRIVATE
    const projectData = {
      title: rawtitle,
      slug: slug,
      description: formData.get('description') as string,
      status: formData.get('status') as string,
      priority: formData.get('priority') as string,
      teamId: selectedTeamId, 
      ownerId: ownerId,       
      isPrivate: isPrivate, // 👈 Injection de la variable
    };

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || "La matrice a rejeté l'inception.");
      }

      // 🛡️ DÉCLENCHEMENT DE LA ROUTE 2 : On sauvegarde l'UID et on bascule l'interface
      if (responseData.uid || responseData._id) {
         setCreatedProjectId(responseData.uid || responseData._id);
         if (onSuccess) onSuccess();
      } else {
         router.refresh(); 
      }
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 INTERFACE ROUTE 2 : Le Fragment existe, on gère les Tâches
  if (createdProjectId) {
    return (
      <div className="w-full relative overflow-hidden bg-[#05070A] p-8 md:p-10 rounded-2xl border border-red-500/50 shadow-[0_0_30px_rgba(229,72,77,0.1)] animate-in fade-in duration-500">
        <div className="flex items-center gap-4 mb-8">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          <div>
            <h2 className="text-2xl font-bold text-slate-100 uppercase tracking-tight">Fragment Sécurisé</h2>
            <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.2em]">Phase 2 : Tissage des brindilles</p>
          </div>
        </div>

        <div className="space-y-12">
          {/* Formulaire d'ajout rapide verrouillé sur ce projet */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Ajouter une tâche initiale</h3>
            <CreateTaskForm projectId={createdProjectId} />
          </div>

          {/* Radar des tâches pour voir ce qu'on vient d'ajouter */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Brindilles rattachées</h3>
            <TaskBoard projectId={createdProjectId} />
          </div>
        </div>
      </div>
    );
  }


  // 🛠️ INTERFACE ROUTE 1 : Création classique du Fragment
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
        
        {/* 🛡️ VISIBILITÉ GALAKTI-K */}
        <div className="flex items-center justify-between p-4 bg-slate-900/20 border border-slate-800/60 rounded-xl group hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-3">
            {isPrivate ? <Lock className="w-4 h-4 text-red-500" /> : <Globe className="w-4 h-4 text-slate-500" />}
            <div>
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                {isPrivate ? "Visibilité Furtive" : "Visibilité Publique"}
              </p>
              <p className="text-[9px] text-slate-600 font-mono uppercase">
                {isPrivate ? "Seule l'escouade peut voir ce fragment" : "Visible par tous les oiseaux de l'Îlot"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPrivate(!isPrivate)}
            className={`w-10 h-5 rounded-full transition-all relative ${isPrivate ? 'bg-red-600' : 'bg-slate-800'}`}
          >
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isPrivate ? 'left-6' : 'left-1'}`} />
          </button>
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