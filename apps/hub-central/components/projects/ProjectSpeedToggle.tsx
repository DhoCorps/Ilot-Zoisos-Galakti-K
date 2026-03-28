'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wind, Loader2 } from 'lucide-react';
import { projects as projectsApi } from "../../lib/apiClient";
import { IProject } from '@ilot/types'; // 🛡️ On bannit le "any" !

export const ProjectSpeedToggle = ({ project }: { project: IProject }) => {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const isAtReducedSpeed = project.wellbeing?.isAtReducedSpeed;

  const toggleSpeed = async () => {
    setIsPending(true);
    try {
      // 🔨 On utilise le coup de marteau (!) car l'UID est obligatoire pour l'Update
      // On aligne les statuts sur l'anglais purifié
      await projectsApi.update(project.uid!, {
        wellbeing: { 
          ...project.wellbeing, 
          isAtReducedSpeed: !isAtReducedSpeed 
        },
        status: !isAtReducedSpeed ? 'REDUCED_SPEED' : 'IN_PROGRESS'
      });
      
      // 🔄 On synchronise la vue avec le nouvel état du Graphe
      router.refresh(); 

    } catch (error) {
      console.error("🚨 Échec de la modulation de vitesse :", error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button 
      onClick={toggleSpeed}
      disabled={isPending}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
        isAtReducedSpeed 
          ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
          : 'bg-slate-900 text-slate-500 border border-slate-800 hover:border-amber-500/30'
      }`}
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
      ) : (
        <Wind className={`w-3 h-3 ${isAtReducedSpeed ? 'animate-pulse' : ''}`} />
      )}
      {isAtReducedSpeed ? 'Vitesse Réduite ACTIVE' : 'Activer le Calme'}
    </button>
  );
};