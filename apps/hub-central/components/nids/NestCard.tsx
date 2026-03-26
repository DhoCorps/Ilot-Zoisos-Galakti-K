// apps/hub-central/components/nids/NestCard.tsx
import { Link } from "../../navigation";
import { Users, ArrowRight } from "lucide-react";

interface NestCardProps {
  team: {
    _id?: string;
    uid?: string;
    nom: string;
    description?: string;
    membersCount?: number;
    slug?: string;
  };
}

export const NestCard = ({ team }: NestCardProps) => {
  // On priorise le slug ou l'UID pour l'URL
  const targetId = team.slug || team.uid || team._id;

  return (
    <div className="group relative bg-slate-900/40 border border-emerald-500/20 rounded-2xl p-6 backdrop-blur-md hover:border-emerald-500/50 transition-all duration-300 shadow-xl shadow-emerald-950/20">
      {/* Effet de lueur au survol */}
      <div className="absolute -inset-px bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="h-12 w-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-2xl border border-emerald-500/20 group-hover:scale-110 transition-transform">
            🪺
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400/70 bg-emerald-500/5 px-2 py-1 rounded-full border border-emerald-500/10">
            <Users className="w-3 h-3" />
            {team.membersCount || 0} membres
          </div>
        </div>

        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
          {team.nom}
        </h3>
        
        <p className="text-sm text-slate-400 line-clamp-2 mb-6 min-h-[40px]">
          {team.description || "Aucune description pour ce nid de la canopée."}
        </p>

        <Link 
          href={`/dashboard/teams/${targetId}`}
          className="flex items-center justify-center gap-2 w-full py-3 bg-slate-800 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all border border-slate-700 hover:border-emerald-400 shadow-lg"
        >
          Entrer dans le nid
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};