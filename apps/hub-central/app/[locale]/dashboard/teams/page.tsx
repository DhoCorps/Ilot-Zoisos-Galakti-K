'use client';

import { useState, useEffect } from 'react';
import { Link } from "../../../../navigation";
import { Users, Plus, Loader2, X, Network, ShieldCheck } from "lucide-react";
import { teams as teamsApi } from "../../../../lib/apiClient"; 
import { CreateTeamForm } from "../../../../components/teams/CreateTeamForm.";
import { NestCard } from "../../../../components/nids/NestCard";

export default function TeamsListPage() {
  const [nids, setNids] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Scan de la Canopée via l'apiClient
  const fetchNids = async () => {
    try {
      setIsLoading(true);
      const response = await teamsApi.getAll();
      // On s'assure d'avoir un tableau propre
      setNids(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("🚨 Perturbation lors du scan des nids :", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNids();
  }, []);

  const handleSuccess = () => {
    setIsModalOpen(false);
    fetchNids(); 
  };

  return (
    <div className="min-h-screen bg-[#05070A] p-8 md:p-12">
      <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
        
        {/* EN-TÊTE DE LA FORGE */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-slate-800/50 pb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-100 tracking-tighter flex items-center gap-4">
              <Network className="w-10 h-10 text-red-600" strokeWidth={2.5} />
              OBSERVATOIRE DES NIDS
            </h1>
            <p className="text-slate-500 mt-2 font-mono text-[10px] uppercase tracking-[0.3em]">
              Gestion des infrastructures collectives et des escouades
            </p>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="group flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(220,38,38,0.2)]"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            Tresser un Nid
          </button>
        </div>

        {/* GRILLE DES NIDS */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-red-600" />
            <p className="font-mono text-[10px] text-slate-700 uppercase tracking-widest">Calcul des vecteurs de la canopée...</p>
          </div>
        ) : nids.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {nids.map((team) => (
              <NestCard key={team.uid} team={team} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-slate-900 rounded-3xl bg-slate-950/20">
            <div className="text-6xl mb-6 opacity-20 grayscale">🪺</div>
            <p className="text-slate-500 font-light text-center max-w-sm leading-relaxed">
              Aucune signature thermique détectée. <br/>
              Votre environnement est prêt pour une nouvelle inception.
            </p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="mt-8 text-red-500 hover:text-red-400 font-black text-xs uppercase tracking-widest underline underline-offset-8"
            >
              Initier le premier tressage
            </button>
          </div>
        )}
      </div>

      {/* MODALE D'INCEPTION (High-Visibility) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/95 backdrop-blur-md animate-in fade-in duration-500" 
            onClick={() => setIsModalOpen(false)} 
          />
          
          <div className="relative w-full max-w-xl bg-[#05070A] border border-slate-800 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-6 right-6 z-[1001] p-2 text-slate-500 hover:text-red-500 transition-all"
            >
              <X size={24} />
            </button>

            <div className="max-h-[85vh] overflow-y-auto no-scrollbar">
              <CreateTeamForm onSuccess={handleSuccess} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}