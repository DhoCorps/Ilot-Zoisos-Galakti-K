'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from "../../../../navigation";
import { Plus, Loader2, X, Activity, Users } from "lucide-react";
import { CreateTeamForm } from "../../../../components/teams/CreateTeamForm"; 

export default function TeamsListPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [mounted, setMounted] = useState(false);

  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/teams'); 
      if (response.ok) {
        const result = await response.json();
        const extractedTeams = result.data || result.teams || (Array.isArray(result) ? result : []);
        setTeams(extractedTeams);
      }
    } catch (error) {
      console.error("Impossible d'observer les Nids :", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchTeams();
  }, []);

  const handleSuccess = () => {
    setIsModalOpen(false);
    fetchTeams();
  };

  return (
    <>
      <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 relative z-0">
        
        {/* HEADER DE LA PAGE */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-100 tracking-tight flex items-center gap-3">
              <Users className="w-8 h-8 text-red-500" />
              Vos Nids (Équipes)
            </h1>
            <p className="text-slate-500 mt-2 font-mono text-xs uppercase tracking-widest">
              Gérez vos escouades et la sécurité collective
            </p>
          </div>
          
          {/* BOUTON BLINDÉ N°1 */}
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsModalOpen(true);
            }} 
            className="flex items-center gap-2 px-6 py-3 bg-red-900/80 hover:bg-red-800 text-slate-100 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)] border border-red-500/30 cursor-pointer relative z-50 pointer-events-auto"
          >
            <Plus className="w-5 h-5" />
            Tresser un Nid
          </button>
        </div>

        {/* GRILLE DES NIDS */}
        {isLoading ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-4" />
            <p className="text-xs font-mono text-red-500/80 uppercase tracking-widest animate-pulse">Scan de la canopée...</p>
          </div>
        ) : teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <Link 
                key={team.uid || team._id} 
                href={`/dashboard/teams/${team.uid || team._id}`}
                className="bio-card p-6 group hover:border-red-500/50 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <h3 className="text-xl font-bold text-slate-100 mb-2 group-hover:text-red-400 transition-colors">{team.name}</h3>
                <p className="text-slate-500 text-sm mb-4 line-clamp-2 min-h-[40px]">
                  {team.description || "Aucune description fournie par le fondateur."}
                </p>
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-slate-600">
                  <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> UID: {(team.uid || team._id || "inconnu").toString().substring(0,8)}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bio-card p-12 text-center border-dashed border-slate-800 rounded-t-none relative z-10">
            <div className="text-4xl mb-4 opacity-30 grayscale">🪺</div>
            <p className="text-slate-500 mb-6 font-light italic">"Un oiseau ne chante bien que dans son propre nid."</p>
            
            {/* BOUTON BLINDÉ N°2 */}
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsModalOpen(true);
              }} 
              className="text-red-400 font-medium hover:text-red-300 transition-colors tracking-wide hover:underline decoration-red-500/30 underline-offset-4 uppercase text-xs font-mono cursor-pointer relative z-50 pointer-events-auto"
            >
              Tressez votre premier nid
            </button>
          </div>
        )}
      </div>

      {/* 🚀 L'HYPER-SAUT : LE PORTAIL DE LA MODALE */}
      {mounted && isModalOpen && createPortal(
        <div 
          className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300"
          style={{ zIndex: 2147483647 }} 
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl no-scrollbar border border-slate-800/50 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-6 right-6 z-50 text-slate-500 hover:text-red-400 transition-colors bg-slate-900/80 rounded-full p-2 backdrop-blur-md border border-slate-800 hover:border-red-900"
            >
              <X className="w-5 h-5" />
            </button>

            <CreateTeamForm onSuccess={handleSuccess} />
            
          </div>
        </div>,
        document.body
      )}
    </>
  );
}