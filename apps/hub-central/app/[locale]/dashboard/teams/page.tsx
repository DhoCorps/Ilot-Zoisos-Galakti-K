'use client';

import { useState, useEffect } from 'react';
import { Link, useRouter } from "../../../../navigation";
import { Users, Plus, Loader2, X } from "lucide-react";
import { teams } from "../../../../lib/apiClient"; 

export default function TeamsListPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  // 🟢 NOUVEAU : État pour stocker la vraie liste des nids
  const [myTeams, setMyTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🟢 NOUVEAU : Récupération des nids au chargement de la page
  useEffect(() => {
    const fetchNids = async () => {
      try {
        const data = await teams.getAll();
        // Si l'API renvoie un tableau direct ou { data: [...] }
        setMyTeams(Array.isArray(data) ? data : (data as any).data || []);
      } catch (error) {
        console.error("Impossible d'observer la canopée :", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNids();
  }, []);

  

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    try {
      setIsCreating(true);
      const newTeam = await teams.create({ nom: teamName });
      setIsModalOpen(false);
      
      const targetId = (newTeam as any).uid || (newTeam as any)._id || (newTeam as any).slug;
      
      router.push(`/dashboard/teams/${targetId}`);
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de la création du nid :", error);
      alert("Le ciel est trop chargé...");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <Users className="text-emerald-600" />
          Mes Escouades
        </h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-emerald-900/10"
        >
          <Plus className="w-4 h-4" />
          Nouveau Nid
        </button>
      </div>

      {/* 🟢 LISTE DES TEAMS (Dynamique) */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : myTeams.length > 0 ? (
          myTeams.map((team) => (
            <Link 
              key={team.uid || team._id} 
              href={`/dashboard/teams/${team.uid || team._id}`} 
              className="block p-6 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500/50 transition-all"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-lg text-slate-900">{team.nom}</h2>
                  <p className="text-sm text-slate-500">
                    {team.description || "Nid en pleine construction."}
                  </p>
                </div>
                <span className="text-emerald-600 font-medium">Gérer →</span>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-slate-300">
            <p className="text-slate-500 mb-4">La canopée est vide.</p>
            <button onClick={() => setIsModalOpen(true)} className="text-emerald-600 font-bold hover:underline">
              Fondez le premier nid
            </button>
          </div>
        )}
      </div>

      {/* --- LA MODALE DE CRÉATION (Inchangée) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-emerald-100 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Forger une Escouade</h2>
            <form onSubmit={handleCreateTeam} className="space-y-4 mt-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nom de l'escouade</label>
                <input
                  autoFocus
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Ex: Les Faucons du Code"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 transition-colors bg-slate-50"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isCreating || !teamName.trim()}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreating ? <><Loader2 className="w-5 h-5 animate-spin" /> Synchronisation hybride...</> : "Créer l'Escouade"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}