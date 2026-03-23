"use client";

export default function LoadingZoizos({ message = "L'oiseau prépare son nid..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <div className="relative w-16 h-16">
        {/* Cercle extérieur rotatif (Le Nexus) */}
        <div className="absolute inset-0 rounded-full border-2 border-t-emerald-500 border-r-transparent border-b-cyan-500 border-l-transparent animate-spin" />
        
        {/* L'oiseau (Icône centrale pulsante) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl animate-bounce">
            (:
          </span>
        </div>
      </div>
      
      <p className="text-slate-400 text-sm font-medium animate-pulse italic">
        {message}
      </p>
      
      {/* Barre de progression subtile */}
      <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 animate-progress-indefinite" />
      </div>

      <style jsx>{`
        @keyframes progress-indefinite {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-progress-indefinite {
          animation: progress-indefinite 1.5s infinite linear;
        }
      `}</style>
    </div>
  );
}