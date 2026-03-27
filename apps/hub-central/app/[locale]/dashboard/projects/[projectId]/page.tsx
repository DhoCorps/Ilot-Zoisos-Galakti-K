'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Activity, AlignLeft, ShieldAlert } from 'lucide-react';
import { Link } from "../../../../../navigation"; 

export default function ProjectDetailsPage() {
  // ✅ ÉTAPE 1 : Déclarer les Hooks au sommet du composant
  const params = useParams();
  const router = useRouter();
  
  // Extraire les variables d'URL une seule fois ici
  const projectId = params?.projectId as string;
  const locale = (params?.locale as string) || 'fr'; 
  
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ✅ ÉTAPE 2 : On n'appelle PLUS useParams/useRouter ici !
    // On utilise directement projectId défini plus haut.
    
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
  }, [projectId]); // Le useEffect réagit quand l'ID change

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-red-500 drop-shadow-[0_0_15px_rgba(229,72,77,0.5)] mb-4" />
        <p className="text-xs font-mono text-red-500/80 uppercase tracking-widest animate-pulse">
          Décryptage du Fragment...
        </p>
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
          <button 
            onClick={() => router.push(`/${locale}/dashboard/projects`)} 
            className="text-red-400 hover:text-red-300 font-mono text-sm tracking-widest uppercase transition-colors"
          >
            ← Retour à l'Atelier
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* Navigation de retour avec la locale dynamique */}
      <button 
        onClick={() => router.push(`/${locale}/dashboard/projects`)} 
        className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors group w-fit"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-mono uppercase tracking-widest">Retour aux fragments</span>
      </button>

      {/* En-tête du Projet */}
      <div className="bio-card p-8 md:p-10 relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[400px] h-[400px] bg-red-950/10 blur-[100px] rounded-full pointer-events-none -z-10" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest border ${
                  project.statut === 'En Cours' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                  project.statut === 'Bloqué' || project.statut === 'En Pause' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                  'bg-slate-800/50 text-slate-400 border-slate-700'
                }`}>
                {project.statut}
              </span>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest border-l border-slate-700 pl-3">
                Priorité : <span className={project.priority === 'critical' || project.priority === 'hard' ? 'text-rose-400' : 'text-slate-300'}>{project.priority}</span>
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-100 tracking-tight">
              {project.titre}
            </h1>
            <p className="text-slate-500 mt-2 font-mono text-xs uppercase tracking-widest">
              ID: {project.uid}
            </p>
          </div>
          
          <div className="flex items-center gap-3 relative z-10 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 rounded-xl font-medium transition-all border border-slate-800 hover:border-slate-700 shadow-inner">
              Éditer
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-1 lg:col-span-2 space-y-8">
          <div className="bio-card p-8">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-800/50 pb-4">
              <AlignLeft className="w-5 h-5 text-red-500" />
              <h2 className="text-sm font-mono font-bold tracking-widest text-slate-300 uppercase">Matrice de Données</h2>
            </div>
            <div className="text-slate-400 font-light leading-relaxed whitespace-pre-wrap">
              {project.description || "Aucune description fournie lors de l'inception."}
            </div>
          </div>
        </div>

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
  );
}