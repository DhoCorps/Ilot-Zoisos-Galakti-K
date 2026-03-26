import { Link } from "../../../navigation";

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-slate-900/50 border border-emerald-500/20 rounded-3xl p-10 backdrop-blur-md shadow-2xl">
        <h1 className="text-4xl font-bold text-white mb-4">Bienvenue dans l'Îlot 🌿</h1>
        <p className="text-emerald-100/60 text-lg mb-8">
          Votre centre de contrôle hybride est opérationnel. Que souhaitez-vous faire ?
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/dashboard/teams" className="group p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl hover:bg-emerald-500/20 transition-all">
            <h3 className="text-emerald-400 font-bold text-xl mb-2">Gérer les Escouades →</h3>
            <p className="text-sm text-slate-400">Administrez les rôles et les membres de vos nids.</p>
          </Link>
          
          <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-2xl opacity-50 cursor-not-allowed">
            <h3 className="text-slate-400 font-bold text-xl mb-2">Explorateur (Bientôt)</h3>
            <p className="text-sm text-slate-500">Visualisation du graphe Neo4j en temps réel.</p>
          </div>
        </div>
      </div>
    </div>
  );
}