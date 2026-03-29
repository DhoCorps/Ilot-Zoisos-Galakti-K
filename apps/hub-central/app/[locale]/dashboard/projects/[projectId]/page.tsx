'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Activity, AlignLeft, ShieldAlert, Trash2, Edit3, Save, X, Target, Plus, CheckCircle } from 'lucide-react';
import { Link } from "../../../../../navigation"; 
import { projects } from "../../../../../lib/apiClient"; 

type ProjectStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "PAUSED" | "REDUCED_SPEED";
type ProjectPriority = "TRIVIAL" | "EASY" | "MEDIUM" | "HARD" | "EXTREME" | "CRITICAL";

interface EditProjectData {
  title: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNED: 'Planifié',
  IN_PROGRESS: 'En Cours',
  COMPLETED: 'Terminé',
  PAUSED: 'En Pause',
  REDUCED_SPEED: 'Vitesse Réduite'
};

const PRIORITY_LABELS: Record<ProjectPriority, string> = {
  TRIVIAL: 'Triviale',
  EASY: 'Facile',
  MEDIUM: 'Normale',
  HARD: 'Haute',
  EXTREME: 'Extrême',
  CRITICAL: 'Critique'
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
  IN_PROGRESS: 'bg-red-500/10 text-red-400 border-red-500/30',
  REDUCED_SPEED: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  PAUSED: 'bg-slate-700/50 text-slate-300 border-slate-600',
  COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  PLANNED: 'bg-slate-800/50 text-slate-400 border-slate-700'
};

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  
  const projectId = params?.projectId as string;
  const locale = (params?.locale as string) || 'fr'; 
  
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 🛠️ NOUVEAU : État pour gérer l'ouverture du sas des Brindilles
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  
  const [editData, setEditData] = useState<EditProjectData>({
    title: '',
    description: '',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM'
  });

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!projectId) return;
      try {
        setIsLoading(true);
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) throw new Error("Impossible de lire ce nœud dans la matrice.");
        const data = await response.json();
        setProject(data);
      } catch (err: any) {
        console.error("Erreur de scan :", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjectDetails();
  }, [projectId]); 

  const handleEdit = () => {
    setEditData({
      title: project.title || '',
      description: project.description || '',
      status: (project.status as ProjectStatus) || 'IN_PROGRESS',
      priority: (project.priority as ProjectPriority) || 'MEDIUM'
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => setIsEditing(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await projects.update(projectId, editData);
      setProject({ ...project, ...editData });
      setIsEditing(false);
    } catch (err: any) {
      console.error("Erreur de soudure :", err);
      alert("Échec de la sauvegarde : " + (err.message || "Erreur réseau."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("⚠️ DESTRUCTION IMMINENTE ! Voulez-vous vraiment purger ce fragment ?")) return;
    try {
      setIsLoading(true); 
      await projects.delete(projectId);
      router.push(`/${locale}/dashboard/projects`);
      router.refresh(); 
    } catch (err: any) {
      console.error("Erreur lors de la purge :", err);
      alert(err.message || "Impossible de détruire ce fragment.");
      setIsLoading(false); 
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-red-500 drop-shadow-[0_0_15px_rgba(229,72,77,0.5)] mb-4" />
        <p className="text-xs font-mono text-red-500/80 uppercase tracking-widest animate-pulse">Décryptage du Fragment...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-8 max-w-4xl mx-auto mt-10">
        <div className="bio-card p-12 text-center border-red-900/50">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-6 opacity-50" />
          <h1 className="text-2xl font-bold text-slate-100 mb-4 tracking-tight">Anomalie Détectée</h1>
          <p className="text-slate-400 font-light mb-8">{error || "Fragment introuvable."}</p>
          <button onClick={() => router.push(`/${locale}/dashboard/projects`)} className="text-red-400 hover:text-red-300 font-mono text-sm tracking-widest uppercase transition-colors">
            ← Retour à l'Atelier
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 relative z-0">
        
        <button onClick={() => router.push(`/${locale}/dashboard/projects`)} className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors group w-fit">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-mono uppercase tracking-widest">Retour aux fragments</span>
        </button>

        {/* HEADER DU PROJET */}
        <div className="bio-card p-8 md:p-10 relative overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[400px] h-[400px] bg-red-950/10 blur-[100px] rounded-full pointer-events-none -z-10" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="relative z-10 w-full md:w-auto flex-1">
              <div className="flex items-center gap-3 mb-3">
                {isEditing ? (
                  <>
                    <select 
                      value={editData.status} 
                      onChange={(e) => setEditData({...editData, status: e.target.value as ProjectStatus})}
                      className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-md px-2 py-1 outline-none focus:border-red-500"
                    >
                      <option value="PLANNED">Planifié</option>
                      <option value="IN_PROGRESS">En Cours</option>
                      <option value="PAUSED">En Pause</option>
                      <option value="REDUCED_SPEED">Vitesse Réduite</option>
                      <option value="COMPLETED">Terminé</option>
                    </select>
                    
                    <select 
                      value={editData.priority} 
                      onChange={(e) => setEditData({...editData, priority: e.target.value as ProjectPriority})}
                      className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-md px-2 py-1 outline-none focus:border-red-500"
                    >
                      <option value="TRIVIAL">Triviale</option>
                      <option value="EASY">Facile</option>
                      <option value="MEDIUM">Normale</option>
                      <option value="HARD">Haute</option>
                      <option value="EXTREME">Extrême</option>
                      <option value="CRITICAL">Critique</option>
                    </select>
                  </>
                ) : (
                  <>
                    <span className={`px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest border ${STATUS_COLORS[project.status as ProjectStatus] || STATUS_COLORS.PLANNED}`}>
                      {STATUS_LABELS[project.status as ProjectStatus] || project.status}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest border-l border-slate-700 pl-3">
                      Priorité : <span className={project.priority === 'CRITICAL' || project.priority === 'EXTREME' || project.priority === 'HARD' ? 'text-rose-400' : 'text-slate-300'}>
                        {PRIORITY_LABELS[project.priority as ProjectPriority] || project.priority}
                      </span>
                    </span>
                  </>
                )}
              </div>

              {isEditing ? (
                <input 
                  type="text" 
                  value={editData.title}
                  onChange={(e) => setEditData({...editData, title: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-700 text-3xl md:text-4xl font-bold text-slate-100 tracking-tight rounded-lg px-3 py-1 outline-none focus:border-red-500 transition-colors"
                />
              ) : (
                <h1 className="text-3xl md:text-4xl font-bold text-slate-100 tracking-tight">
                  {project.title}
                </h1>
              )}
              
              <p className="text-slate-500 mt-2 font-mono text-xs uppercase tracking-widest">
                ID: {project.uid}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 relative z-10 w-full md:w-auto">
              {isEditing ? (
                <>
                  <button onClick={handleCancelEdit} disabled={isSaving} className="flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-slate-800">
                    <X className="w-4 h-4" /> Annuler
                  </button>
                  <button onClick={handleSave} disabled={isSaving} className="flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-2.5 bg-emerald-900/50 hover:bg-emerald-900/80 text-emerald-400 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-emerald-900/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Valider
                  </button>
                </>
              ) : (
                <>
                  <button onClick={handleEdit} className="flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-slate-800 hover:border-slate-700 shadow-inner group">
                    <Edit3 className="w-4 h-4 group-hover:scale-110 transition-transform" /> Éditer
                  </button>
                  <button onClick={handleDelete} className="flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-2.5 bg-slate-900/50 hover:bg-red-950/40 text-slate-500 hover:text-red-400 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-slate-800 hover:border-red-900/50 shadow-inner group">
                    <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" /> Purger
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* GRILLE PRINCIPALE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLONNE GAUCHE (Description + Tâches) */}
          <div className="col-span-1 lg:col-span-2 space-y-8">
            
            {/* 1. DESCRIPTION DU PROJET */}
            <div className="bio-card p-8">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-800/50 pb-4">
                <AlignLeft className="w-5 h-5 text-red-500" />
                <h2 className="text-sm font-mono font-bold tracking-widest text-slate-300 uppercase">Matrice de Données</h2>
              </div>
              
              {isEditing ? (
                <textarea 
                  value={editData.description}
                  onChange={(e) => setEditData({...editData, description: e.target.value})}
                  rows={6}
                  className="w-full bg-slate-900/50 border border-slate-700 text-slate-300 rounded-lg p-4 outline-none focus:border-red-500 transition-colors resize-y leading-relaxed"
                  placeholder="Description du fragment..."
                />
              ) : (
                <div className="text-slate-400 font-light leading-relaxed whitespace-pre-wrap">
                  {project.description || "Aucune description fournie lors de l'inception."}
                </div>
              )}
            </div>

            {/* 🛠️ 2. LE BLOC DES BRINDILLES (Blindage Anti-Mute activé) */}
          <div className="bio-card p-8 border-slate-800/60 relative z-10">
            <div className="flex items-center justify-between mb-6 border-b border-slate-800/50 pb-4 relative z-20">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-emerald-500" />
                <h2 className="text-sm font-mono font-bold tracking-widest text-slate-300 uppercase">Brindilles du Fragment</h2>
              </div>
              
              {/* 🛡️ LE BOUTON INDESTRUCTIBLE */}
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsTaskModalOpen(true);
                }} 
                className="flex items-center gap-2 px-4 py-2 bg-emerald-950/20 hover:bg-emerald-900/40 text-emerald-400 text-[10px] font-mono uppercase tracking-widest rounded-lg border border-emerald-900/30 hover:border-emerald-500/50 transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] cursor-pointer relative z-50 pointer-events-auto"
              >
                <Plus className="w-4 h-4" /> Forger
              </button>
            </div>
            
            <div className="text-center py-10 bg-slate-900/20 rounded-xl border border-dashed border-slate-800">
              <CheckCircle className="w-8 h-8 text-slate-700 mx-auto mb-3 opacity-50" />
              <p className="text-slate-500 font-light text-sm italic">
                Aucune brindille n'est actuellement tissée sur ce fragment.
              </p>
            </div>
          </div>

          </div>

          {/* COLONNE DROITE (Télémétrie) */}
          <div className="col-span-1 space-y-8">
            <div className="bio-card p-6 border-slate-800/60">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-4 h-4 text-slate-500" />
                <h2 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">Télémétrie</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest mb-1">Slug</p>
                  <p className="text-sm text-slate-300 font-medium">{project.slug}</p>
                </div>
                {project.teamUid && (
                  <div className="pt-4 border-t border-slate-800/50">
                    <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest mb-2">Escouade Associée</p>
                    <Link href={`/dashboard/teams/${project.teamUid}`} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-red-900/50 hover:bg-red-950/20 transition-all group">
                      <span className="text-sm text-slate-300 font-mono group-hover:text-red-400 transition-colors">
                        {project.teamUid.substring(0,8)}...
                      </span>
                      <span className="text-slate-600 group-hover:text-red-500 transition-colors">→</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* 🛠️ LE SAS : MODALE DE CRÉATION DE BRINDILLE (Blindage Indestructible) */}
      {isTaskModalOpen && (
        <div 
          className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
          style={{ zIndex: 2147483647 }} 
        >
          {/* Conteneur principal de la modale avec un max-h pour éviter qu'elle déborde */}
          <div className="relative w-full max-w-2xl bg-[#05070A] rounded-2xl border border-emerald-900/30 shadow-[0_0_50px_rgba(0,0,0,0.8)] p-8 max-h-[90vh] overflow-y-auto no-scrollbar">
            
            <button 
              onClick={() => setIsTaskModalOpen(false)} 
              className="absolute top-6 right-6 z-10 p-2 text-slate-500 hover:text-red-400 bg-slate-900/80 rounded-full transition-colors border border-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-8 mt-2 relative z-0">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-6 h-6 text-emerald-500" />
                <h3 className="text-2xl font-bold text-slate-100 tracking-tight">Forger une Brindille</h3>
              </div>
              <p className="text-slate-400 text-sm font-light">
                Cette brindille sera ancrée directement sur le fragment <strong className="text-emerald-400 font-medium">{project.title}</strong>.
              </p>
            </div>

            {/* 🚧 Ici, tu pourras importer et glisser ton composant <CreateTaskForm projectId={projectId} /> */}
            <div className="border-2 border-dashed border-emerald-900/30 rounded-xl p-10 text-center bg-emerald-950/10">
              <p className="text-emerald-500/50 font-mono text-xs uppercase tracking-widest animate-pulse">
                [ Espace réservé au formulaire Tom-Hat-Toes ]
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}