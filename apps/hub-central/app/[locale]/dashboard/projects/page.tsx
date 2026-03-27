'use client';

import { useState, useEffect } from 'react';
import { Link } from "../../../../navigation"; // Le Link de next-intl gère la langue tout seul !
import { LayoutGrid, Plus, Loader2, X, Activity } from "lucide-react";
import { CreateProjectForm } from "../../../../components/projects/CreateProjectForm"; 

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Impossible d'observer les fragments :", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleProjectCreated = () => {
    setIsModalOpen(false);
    fetchProjects(); // On rafraîchit la liste instantanément après l'inception
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* EN-TÊTE */}
      <div className="flex justify-between items-center bio-card p-6 border-b-0 rounded-b-none bg-slate-900/40">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3 tracking-tight">
          <LayoutGrid className="text-red-500" strokeWidth={1.5} />
          Mes Fragments
        </h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800 text-slate-100 rounded-xl font-bold transition-all shadow-lg shadow-red-950/40 border border-red-500/30 hover:border-red-400/50"
        >
          <Plus className="w-5 h-5" />
          Nouveau Chantier
        </button>
      </div>

      {/* LISTE DES PROJETS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-0">
        {isLoading ? (
          <div className="col-span-full flex justify-center p-12 bio-card rounded-t-none">
            <Loader2 className="w-10 h-10 animate-spin text-red-500 drop-shadow-[0_0_15px_rgba(229,72,77,0.3)]" />
          </div>
        ) : projects.length > 0 ? (
          projects.map((project) => (
            <Link 
              key={project.uid} 
              // 🔴 MAGIE ICI : On ne met plus ${locale}, on donne le chemin brut
              href={`/dashboard/projects/${project.uid}`} 
              className="group bio-card p-6 flex flex-col h-full hover:border-red-500/30 transition-all duration-500"
            >
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`px-2.5 py-1 rounded-sm text-[9px] font-bold uppercase tracking-widest border ${
                  project.statut === 'En Cours' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                  project.statut === 'Bloqué' || project.statut === 'En Pause' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                  'bg-slate-800/50 text-slate-400 border-slate-700'
                }`}>
                  {project.statut}
                </div>
                {project.wellbeing?.isAtReducedSpeed && (
                  <div className="text-amber-500/80 animate-pulse" title="Vitesse réduite activée">
                    <Activity size={14} />
                  </div>
                )}
              </div>
              
              <h2 className="font-bold text-xl text-slate-200 group-hover:text-red-400 transition-colors duration-500 mb-2 line-clamp-1 relative z-10">
                {project.titre}
              </h2>
              
              <p className="text-sm text-slate-500 font-light line-clamp-2 flex-grow mb-6 relative z-10 group-hover:text-slate-400 transition-colors">
                {project.description || "Aucune description détaillée pour ce fragment."}
              </p>

              <div className="mt-auto pt-4 border-t border-slate-800/50 flex items-center justify-between text-xs text-slate-600 relative z-10">
                <span className="font-mono tracking-widest uppercase">ID: {project.uid.substring(0,6)}</span>
                <span className="text-red-500 font-medium group-hover:translate-x-2 transition-transform duration-500 flex items-center gap-1">
                  Explorer <span className="text-[10px]">→</span>
                </span>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center p-16 bio-card border-dashed border-slate-800 rounded-t-none">
            <div className="text-4xl mb-4 opacity-30 grayscale">🏗️</div>
            <p className="text-slate-500 mb-6 font-light">L'atelier est vide. Aucun fragment détecté dans la matrice.</p>
            <button onClick={() => setIsModalOpen(true)} className="text-red-400 font-medium hover:text-red-300 transition-colors tracking-wide hover:underline decoration-red-500/30 underline-offset-4">
              Démarrez votre premier chantier
            </button>
          </div>
        )}
      </div>

      {/* MODALE D'INCEPTION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl no-scrollbar border border-slate-800/50 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-6 right-6 z-10 text-slate-500 hover:text-red-400 transition-colors bg-slate-900/80 rounded-full p-2 backdrop-blur-md border border-slate-800 hover:border-red-900"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="bg-[#05070A]">
              <CreateProjectForm onSuccess={handleProjectCreated} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}