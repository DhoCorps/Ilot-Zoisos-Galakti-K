'use client';

import { useState } from 'react';
import { ITask } from '@ilot/types';
import { tasks } from '../../lib/apiClient';
import { X, Activity, Timer, BrainCircuit, Target, Loader2 } from 'lucide-react';

interface TaskModalProps {
  task: ITask;
  onClose: () => void;
  onUpdate?: () => void; // 👈 Pour dire au TaskBoard de rafraîchir son radar
}

export function TaskModal({ task, onClose, onUpdate }: TaskModalProps) {
  const [isPending, setIsPending] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(task.status);

  // 🔄 Le levier de vitesse (Changement de statut)
  const handleStatusChange = async (newStatus: string) => {
    setIsPending(true);
    try {
      await tasks.update(task.uid!, { status: newStatus });
      setCurrentStatus(newStatus);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Erreur lors de la mutation du statut:", error);
    } finally {
      setIsPending(false);
    }
  };

  // 🎨 Télémétrie visuelle pour les boutons de statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'border-amber-500/50 text-amber-400 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
      case 'REVIEW': return 'border-blue-500/50 text-blue-400 bg-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.2)]';
      case 'DONE': return 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
      default: return 'border-slate-500/50 text-slate-300 bg-slate-700/50'; // TODO
    }
  };

  return (
    // L'Overlay (Fond sombre flouté)
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05070A]/80 backdrop-blur-sm animate-in fade-in">
      
      {/* Le Châssis de la Modale */}
      <div className="relative w-full max-w-lg bg-[#05070A] border border-slate-800 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
        
        {/* En-tête de la Modale */}
        <div className="flex items-start justify-between p-6 border-b border-slate-800/50 bg-slate-900/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-950 border border-red-500/20 rounded-xl shadow-[0_0_15px_rgba(229,72,77,0.1)]">
              <Target className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 uppercase tracking-tight pr-4 leading-tight">
                {task.title}
              </h2>
              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-1.5 flex gap-2">
                <span>UID: {task.uid?.split('-')[0]}</span>
                <span className="text-slate-700">|</span>
                <span>Priorité: <span className="text-red-400">{task.priority}</span></span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps de la Modale */}
        <div className="p-6 space-y-6">
          
          {/* Bloc de Description (S'il y en a une) */}
          {task.description && (
            <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
              <p className="text-sm text-slate-300 leading-relaxed font-light">{task.description}</p>
            </div>
          )}

          {/* Cadrans de Télémétrie */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border border-slate-800/60 rounded-2xl flex items-center gap-4 bg-slate-900/20">
              <Timer className="w-6 h-6 text-red-500 opacity-80" />
              <div>
                <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Tomates</p>
                <p className="text-base font-bold text-slate-200">{task.completedPomodoros} / {task.estimatedPomodoros}</p>
              </div>
            </div>
            <div className="p-4 border border-slate-800/60 rounded-2xl flex items-center gap-4 bg-slate-900/20">
              <BrainCircuit className="w-6 h-6 text-slate-500 opacity-80" />
              <div>
                <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Complexité</p>
                <p className="text-base font-bold text-slate-200">Niveau {task.complexity}</p>
              </div>
            </div>
          </div>

          {/* Boîte de Vitesses (Changement de Statut Kanban) */}
          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest ml-1">
              <Activity size={14} className="text-slate-500" /> Progression de la Brindille
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].map((statusOption) => (
                <button
                  key={statusOption}
                  onClick={() => handleStatusChange(statusOption)}
                  disabled={isPending || currentStatus === statusOption}
                  className={`py-2.5 px-1 text-[9px] font-black uppercase tracking-widest rounded-xl border transition-all duration-300 ${
                    currentStatus === statusOption 
                      ? getStatusColor(statusOption)
                      : 'border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300 bg-slate-950/50'
                  }`}
                >
                  {statusOption.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Pied de la Modale */}
        <div className="p-4 px-6 bg-slate-950 border-t border-slate-900 flex justify-between items-center">
          <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">
            {isPending ? (
              <span className="flex items-center gap-2 text-red-400">
                <Loader2 className="w-3 h-3 animate-spin" /> Mutation...
              </span>
            ) : (
              "Sceau Transactionnel Actif"
            )}
          </span>
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 hover:bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg hover:shadow-white/20"
          >
            Fermer le sas
          </button>
        </div>

      </div>
    </div>
  );
}