'use client';

import { Link } from "../../navigation";
import { Users, ArrowRight, Activity, ShieldCheck } from "lucide-react";

interface NestCardProps {
  team: {
    _id?: string;
    uid: string; // L'UID est désormais obligatoire pour le Graphe
    nom: string;
    description?: string;
    membersCount?: number;
    slug?: string;
    collectiveHealth?: {
      isOverloaded: boolean;
    };
    moderation?: {
      isFlagged: boolean;
    };
  };
}

export const NestCard = ({ team }: NestCardProps) => {
  // On utilise l'UID comme pivot principal pour la navigation dashboard
  const targetId = team.uid || team.slug || team._id;

  return (
    <div className="group relative bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl hover:border-red-500/40 transition-all duration-500 shadow-2xl shadow-black/50 overflow-hidden">
      
      {/* Effet de lueur cinétique au survol */}
      <div className="absolute -inset-px bg-gradient-to-br from-red-500/10 via-transparent to-rose-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="h-14 w-14 bg-red-500/5 rounded-2xl flex items-center justify-center text-3xl border border-red-500/10 group-hover:border-red-500/30 group-hover:scale-110 transition-all duration-500 shadow-inner">
            🪺
          </div>
          
          <div className="flex flex-col gap-2 items-end">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-800/50 px-2.5 py-1 rounded-sm border border-slate-700">
              <Users className="w-3 h-3 text-red-500" />
              {team.membersCount || 1} Oiseaux
            </div>
            
            {/* Indicateur de santé collective */}
            {team.collectiveHealth?.isOverloaded && (
              <div className="flex items-center gap-1 text-[9px] font-black text-amber-500 animate-pulse">
                <Activity size={10} />
                SURCHARGE
              </div>
            )}
          </div>
        </div>

        <h3 className="text-xl font-extrabold text-slate-100 mb-2 group-hover:text-red-400 transition-colors tracking-tight">
          {team.nom}
        </h3>
        
        <p className="text-sm text-slate-500 font-light line-clamp-2 mb-8 min-h-[40px] leading-relaxed group-hover:text-slate-400 transition-colors">
          {team.description || "Un espace de tressage pour vos fragments de réalité."}
        </p>

        <Link 
          href={`/dashboard/teams/${targetId}`}
          className="flex items-center justify-between w-full px-6 py-4 bg-slate-950 hover:bg-red-950/20 text-slate-200 hover:text-red-400 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all border border-slate-800 hover:border-red-500/50 shadow-lg group/btn"
        >
          <span>Pénétrer le Nid</span>
          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform duration-300 text-red-500" />
        </Link>
      </div>

      {/* Signature visuelle de modération en arrière-plan */}
      {team.moderation?.isFlagged && (
        <div className="absolute -bottom-2 -right-2 opacity-10 rotate-12">
          <ShieldCheck size={80} className="text-red-600" />
        </div>
      )}
    </div>
  );
};