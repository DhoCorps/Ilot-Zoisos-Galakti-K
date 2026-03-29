'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { tasks, projects } from '../../lib/apiClient'; 
import { Loader2, Target, FileText, Timer, ShieldAlert, AlertTriangle, Network, BrainCircuit, Activity, Lock, Globe } from 'lucide-react';
import { IProject } from '@ilot/types';

interface CreateTaskFormProps {
  projectId?: string; // Si on ouvre le formulaire depuis un projet spécifique
  onSuccess?: () => void;
}

export function CreateTaskForm({ projectId, onSuccess }: CreateTaskFormProps) {
  const router = useRouter();
  
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 🌿 Chargement de la Canopée (Les Projets disponibles)
  const [availableProjects, setAvailableProjects] = useState<IProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(!projectId);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: projectId || '',
    priority: 'MEDIUM',
    complexity: 1,
    estimatedPomodoros: 1,
    isPrivate: true
  });

  // Récupération des projets si aucun n'est imposé
  useEffect(() => {
    if (!projectId) {
      const fetchProjects = async () => {
        try {
          const data = await projects.getAll();
          setAvailableProjects(Array.isArray(data) ? data : []);
          if (data.length > 0) {
            setFormData(prev => ({ ...prev, projectId: data[0].uid || '' }));
          }
        } catch (err) {
          console.error("Erreur de scan des fragments:", err);
        } finally {
          setIsLoadingProjects(false);
        }
      };
      fetchProjects();
    }
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    if (!formData.projectId) {
      setError("La brindille doit impérativement être rattachée à un fragment (Projet).");
      setIsPending(false);
      return;
    }

    try {
      await tasks.create({
        title: formData.title,
        description: formData.description,
        projectId: formData.projectId,
        priority: formData.priority as "TRIVIAL" | "EASY" | "MEDIUM" | "HARD" | "EXTREME" | "CRITICAL",
        complexity: Number(formData.complexity),
        estimatedPomodoros: Number(formData.estimatedPomodoros),
        isPrivate: formData.isPrivate,
      });

      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
        // Reset du formulaire après succès
        setFormData({ ...formData, title: '', description: '', estimatedPomodoros: 1 });
      }
    } catch (err: any) {
      console.error("Échec de la genèse de la tâche :", err);
      setError(err.message || "La matrice a rejeté l'inception.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="w-full relative overflow-hidden bg-[#05070A] p-6 md:p-8 rounded-2xl border border-slate-900 shadow-2xl">
      {/* Lueur de fond magmatique */}
      <div className="absolute -top-40 -right-40 w-[400px] h-[400px] bg-red-950/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="mb-6 flex items-center gap-4 border-b border-slate-800/50 pb-4">
        <div className="p-3 rounded-xl bg-slate-900 border border-red-500/20 shadow-[0_0_15px_rgba(229,72,77,0.1)]">
          <Target className="w-5 h-5 text-red-500" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100 uppercase tracking-tight">Nouvelle Brindille</h2>
          <p className="text-slate-500 mt-1 font-mono text-[10px] uppercase tracking-[0.2em]">
            Protocole Tom-Hat-Toes 🍅
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
        
        {/* CHOIX DU PROJET */}
        {!projectId && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest ml-1">
              <Network size={14} className="text-red-500" /> Fragment de rattachement *
            </label>
            {isLoadingProjects ? (
              <div className="w-full py-3 px-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
                <span className="text-slate-700 text-xs font-mono uppercase">Scan en cours...</span>
              </div>
            ) : (
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 outline-none focus:border-red-500 appearance-none transition-all cursor-pointer font-light shadow-inner"
              >
                {availableProjects.length === 0 ? (
                  <option value="">Aucun fragment disponible...</option>
                ) : (
                  availableProjects.map((p) => (
                    <option key={p.uid} value={p.uid} className="bg-slate-950 text-slate-200">
                      {p.title?.toUpperCase() || 'PROJET SANS NOM'}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>
        )}

        {/* TITRE ET DESCRIPTION */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest ml-1">
            <Target size={14} className="text-slate-500" /> Objectif *
          </label>
          <input
            required
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-700 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 shadow-inner transition-all font-light"
            placeholder="Ex: Câbler la base de données Neo4j"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest ml-1">
            <FileText size={14} className="text-slate-500" /> Détails de l'opération
          </label>
          <textarea
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-700 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 shadow-inner transition-all font-light resize-none no-scrollbar"
            placeholder="Notes, liens, ou sous-étapes..."
          />
        </div>

        {/* MÉTRIQUES TOM-HAT-TOES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-900/20 rounded-xl border border-slate-800/50">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              <Timer size={14} className="text-red-400" /> Tomates Prévues
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.estimatedPomodoros}
              onChange={(e) => setFormData({ ...formData, estimatedPomodoros: Number(e.target.value) })}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none focus:border-red-500 text-sm shadow-inner"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              <BrainCircuit size={14} className="text-slate-500" /> Complexité
            </label>
            <select
              value={formData.complexity}
              onChange={(e) => setFormData({ ...formData, complexity: Number(e.target.value) })}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 outline-none focus:border-red-500 appearance-none cursor-pointer text-sm shadow-inner"
            >
              <option value="1">1 - Basique</option>
              <option value="2">2 - Simple</option>
              <option value="3">3 - Moyenne</option>
              <option value="5">5 - Complexe</option>
              <option value="8">8 - Labyrinthique</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              <Activity size={14} className="text-slate-500" /> Priorité
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 outline-none focus:border-red-500 appearance-none cursor-pointer text-sm shadow-inner"
            >
              <option value="TRIVIAL">Trivial</option>
              <option value="EASY">Facile</option>
              <option value="MEDIUM">Moyen</option>
              <option value="HARD">Difficile</option>
              <option value="CRITICAL">Critique</option>
            </select>
          </div>
        </div>

        {/* 🛡️ INTERRUPTEUR GALAKTI-K */}
        <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800/60 rounded-xl group hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-3">
            {formData.isPrivate ? <Lock className="w-4 h-4 text-red-500" /> : <Globe className="w-4 h-4 text-slate-500" />}
            <div>
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                {formData.isPrivate ? "Tâche Furtive" : "Tâche Publique"}
              </p>
              <p className="text-[9px] text-slate-600 font-mono uppercase">
                {formData.isPrivate ? "Uniquement visible par l'équipe" : "Visible dans l'Îlot"}
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

        {error && (
          <div className="p-4 bg-red-950/20 border border-red-900/50 rounded-xl flex items-center gap-3 text-red-300 text-xs font-mono animate-in slide-in-from-top-2">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" /> {error.toUpperCase()}
          </div>
        )}

        {/* BOUTON D'INJECTION */}
        <button
          type="submit"
          disabled={isPending || !formData.projectId || formData.title.length < 2}
          className="w-full py-4 mt-2 bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800 text-slate-100 rounded-xl font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 border border-red-500/30 hover:border-red-400/50 tracking-[0.2em] uppercase text-[10px]"
        >
          {isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Forge en cours...</>
          ) : (
            <>Tisser la Brindille →</>
          )}
        </button>
      </form>
    </div>
  );
}