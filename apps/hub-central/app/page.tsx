import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Effet de lueur en arrière-plan */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-900/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="z-10 w-full max-w-4xl space-y-12 text-center">
        
        {/* En-tête */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 uppercase tracking-tighter">
            L'Îlot Zoizos
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
            Le réseau social et outil de gestion où les oiseaux forgent des nids, tissent des liens et bâtissent des projets.
          </p>
        </div>

        {/* Grille de Navigation (Le Nexus) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          
          {/* Carte 1 : Les Escouades */}
          <Link href="/teams/create" className="group block">
            <div className="nexus-card h-full bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition-all shadow-xl hover:shadow-emerald-900/20">
              <div className="text-3xl mb-4">🦅</div>
              <h2 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                Forger une Escouade
              </h2>
              <p className="text-slate-500 text-sm">
                Rassemble tes Bâtisseurs. Crée un nid principal ou une sous-équipe et distribue les rôles.
              </p>
            </div>
          </Link>

          {/* Carte 2 : Les Projets (À venir) */}
          <div className="nexus-card h-full bg-slate-900/40 p-6 rounded-2xl border border-slate-800/50 opacity-70 cursor-not-allowed relative overflow-hidden">
            <div className="absolute top-2 right-3 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded uppercase">En chantier</div>
            <div className="text-3xl mb-4">🏗️</div>
            <h2 className="text-xl font-bold text-white mb-2">
              Les Projets
            </h2>
            <p className="text-slate-500 text-sm">
              L'atelier de construction. Gère les tâches, le code et l'avancement de tes idées.
            </p>
          </div>

          {/* Carte 3 : L'Identité / Auth */}
          <Link href="/auth/login" className="group block">
            <div className="nexus-card h-full bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 transition-all shadow-xl hover:shadow-cyan-900/20">
              <div className="text-3xl mb-4">💠</div>
              <h2 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                Identification
              </h2>
              <p className="text-slate-500 text-sm">
                Connecte-toi à ton profil ou rejoins la volée pour commencer à bâtir.
              </p>
            </div>
          </Link>

        </div>

        {/* Signature */}
        <div className="pt-12 border-t border-slate-800/50 text-slate-600 text-sm font-bold tracking-widest">
          LE BORDEL DE DHÖ <span className="text-emerald-500">&lt;(:&lt;</span>
        </div>

      </div>
    </div>
  );
}