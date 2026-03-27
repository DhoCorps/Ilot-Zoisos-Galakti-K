'use client';

import { useState } from 'react';
import { Wind, Loader2 } from 'lucide-react';
import { projects as projectsApi } from "../../lib/apiClient";

export const ProjectSpeedToggle = ({ project }: { project: any }) => {
  const [isPending, setIsPending] = useState(false);
  const isAtReducedSpeed = project.wellbeing?.isAtReducedSpeed;

  const toggleSpeed = async () => {
    setIsPending(true);
    try {
      await projectsApi.update(project.uid, {
        wellbeing: { ...project.wellbeing, isAtReducedSpeed: !isAtReducedSpeed },
        status: !isAtReducedSpeed ? 'REDUCED_SPEED' : 'IN_PROGRESS'
      });
      // Rafraîchir ici via router.refresh() ou un context
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button 
      onClick={toggleSpeed}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
        isAtReducedSpeed 
          ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50' 
          : 'bg-slate-900 text-slate-500 border border-slate-800 hover:border-amber-500/30'
      }`}
    >
      {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wind className="w-3 h-3" />}
      {isAtReducedSpeed ? 'Vitesse Réduite ACTIVE' : 'Activer le Calme'}
    </button>
  );
};