export default function TomHatToesPage() {
  return (
    <div className="p-8 max-w-md mx-auto mt-20">
      {/* Remplacement de nexus-card par bio-card, ajout de padding et du mode group pour l'interaction */}
      <div className="bio-card text-center p-10 group">
        
        {/* Le Titre : Passage du dégradé émeraude/cyan au rouge magmatique/rosé */}
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-slate-100 to-red-600 mb-4 tracking-widest uppercase drop-shadow-sm">
          Tom-Hat-Toes
        </h1>
        
        {/* Le Sous-titre : Gris bleuté clair qui rougit subtilement au survol */}
        <p className="text-slate-400 font-light tracking-wide group-hover:text-red-300/80 transition-colors duration-500">
          Interface de l'inception opérationnelle. &lt;(:&lt;
        </p>
        
        {/* Petit détail technique "2030" : Un indicateur d'état en bas de carte */}
        <div className="mt-8 flex items-center justify-center gap-2 opacity-50">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
          <span className="text-[10px] text-slate-500 uppercase font-mono tracking-widest">Opérationnel</span>
        </div>
        
      </div>
    </div>
  );
}