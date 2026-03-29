import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
      
      {/* Noyau Magmatique de l'Îlot (Arrière-plan OLED-friendly) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-gradient-radial from-red-900/15 via-rose-950/5 to-transparent blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="z-10 w-full max-w-5xl space-y-20 text-center animate-in fade-in slide-in-from-bottom-12 duration-1000 ease-out">
        
        {/* En-tête : Minimalisme Brut */}
        <div className="space-y-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900/40 border border-red-500/20 shadow-[0_0_40px_rgba(229,72,77,0.1)] backdrop-blur-md">
            <span className="text-2xl opacity-80">🏮</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-100 via-slate-300 to-slate-600 tracking-tighter drop-shadow-sm">
            L'Îlot <span className="text-transparent bg-clip-text bg-gradient-to-br from-red-400 to-rose-700">Zoizos</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed tracking-wide">
            L'écosystème où les oiseaux forgent des nids, tissent des liens et bâtissent des projets au cœur de la matrice.
          </p>
        </div>

        {/* Grille de Navigation (Les Cellules) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-5xl mx-auto">
          
          {/* Carte 1 : Les Escouades */}
          <Link href="/dashboard/teams" className="bio-card flex flex-col h-full block group p-8">
            <div className="mb-6 inline-flex p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 group-hover:border-red-500/30 group-hover:bg-red-500/10 transition-colors duration-500">
              <span className="text-2xl group-hover:scale-110 transition-transform duration-500 origin-center">🦅</span>
            </div>
            <h2 className="text-xl font-bold text-slate-200 mb-3 group-hover:text-red-400 transition-colors duration-500">
              Forger une Escouade
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed flex-grow font-light">
              Rassemble tes Bâtisseurs. Crée un nid principal ou une sous-équipe et distribue les rôles dans le graphe Neo4j.
            </p>
          </Link>

          {/* Carte 2 : Les Projets (À venir) */}
          <div className="bio-card opacity-50 flex flex-col h-full relative p-8 group">
            <div className="absolute top-6 right-6 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest">WIP</span>
            </div>
            <div className="mb-6 inline-flex p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 grayscale">
              <span className="text-2xl opacity-50">🏗️</span>
            </div>
            <h2 className="text-xl font-bold text-slate-400 mb-3">
              Les Projets
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed flex-grow font-light">
              L'atelier de construction. Gère les tâches, le code et l'avancement de tes idées.
            </p>
          </div>

          {/* Carte 3 : L'Identité / Auth */}
          <Link href="/auth/login" className="bio-card flex flex-col h-full block group p-8">
            <div className="mb-6 inline-flex p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 group-hover:border-slate-400/30 transition-colors duration-500">
              <span className="text-2xl group-hover:rotate-180 transition-transform duration-700 ease-in-out">💠</span>
            </div>
            <h2 className="text-xl font-bold text-slate-200 mb-3 group-hover:text-slate-100 transition-colors duration-500">
              Identification
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed flex-grow font-light">
              Connecte-toi à ton profil ou rejoins la volée pour commencer à interagir avec la matrice.
            </p>
          </Link>

        </div>

        {/* Signature du Créateur */}
        <div className="pt-24 pb-8 flex items-center justify-center gap-4 text-slate-600 text-[10px] font-medium tracking-[0.4em] uppercase opacity-60">
          <span className="h-[1px] w-12 bg-slate-800"></span>
          Le Bordel de Dhö <span className="text-red-500 font-black tracking-normal ml-1"> &gt;:)&gt;</span>
          <span className="h-[1px] w-12 bg-slate-800"></span>
        </div>

      </div>
    </div>
  );
}