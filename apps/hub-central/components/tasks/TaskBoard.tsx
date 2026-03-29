'use client';

import { useState, useEffect } from 'react';
import { tasks } from '../../lib/apiClient';
import { ITask } from '@ilot/types';
import { Loader2, Timer, AlertCircle, CheckCircle2, PlayCircle } from 'lucide-react';

interface TaskBoardProps {
  projectId?: string; // Optionnel : pour filtrer le radar sur un fragment précis
  onTaskClick?: (task: ITask) => void; // 👈 Le connecteur pour la future Modale !
}

export function TaskBoard({ projectId, onTaskClick }: TaskBoardProps) {
  const [taskList, setTaskList] = useState<ITask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 📡 Balayage Radar au démarrage
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const data = await tasks.getAll(projectId);
        setTaskList(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || "Erreur de transmission avec le moteur.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, [projectId]);

  // 🎨 Télémétrie visuelle : Code couleur selon la criticité
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'text-red-500 bg-red-500/10 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
      case 'EXTREME': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'HARD': return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
      case 'MEDIUM': return 'text-slate-300 bg-slate-700/50 border-slate-600';
      default: return 'text-slate-500 bg-slate-800/50 border-slate-700'; // Trivial / Easy
    }
  };

  // ⏳ État 1 : Le moteur chauffe
  if (isLoading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center bg-[#05070A] border border-slate-900 rounded-2xl shadow-inner">
        <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-4" />
        <span className="text-slate-500 font-mono text-xs uppercase tracking-widest">Balayage radar en cours...</span>
      </div>
    );
  }

  // 🚨 État 2 : Avarie
  if (error) {
    return (
      <div className="w-full p-6 bg-red-950/20 border border-red-900/50 rounded-2xl flex items-center gap-4 animate-in fade-in">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <div>
          <h3 className="text-red-400 font-bold uppercase tracking-widest text-sm">Avarie système</h3>
          <p className="text-red-300/70 text-xs font-mono mt-1">{error}</p>
        </div>
      </div>
    );
  }

  // 🍃 État 3 : Radar clair (Zéro brindille)
  if (taskList.length === 0) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center bg-slate-900/20 border border-slate-800/50 rounded-2xl border-dashed">
        <CheckCircle2 className="w-12 h-12 text-slate-700 mb-4" />
        <h3 className="text-slate-400 font-bold uppercase tracking-widest">Le secteur est clair</h3>
        <p className="text-slate-600 text-xs font-mono mt-2">Aucune brindille détectée sur les radars.</p>
      </div>
    );
  }

  // 🟢 État 4 : Grille Opérationnelle
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max">
      {taskList.map((task) => (
        <div 
          key={task.uid}
          onClick={() => onTaskClick && onTaskClick(task)}
          className="group relative bg-[#05070A] p-5 rounded-2xl border border-slate-800 hover:border-red-500/40 hover:shadow-[0_0_25px_rgba(229,72,77,0.08)] transition-all duration-300 cursor-pointer flex flex-col h-full"
        >
          {/* Ligne 1 : Statut & Priorité */}
          <div className="flex items-center justify-between mb-3">
            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
            <span className="text-slate-600 font-mono text-[9px] uppercase tracking-wider group-hover:text-slate-400 transition-colors">
              {task.status}
            </span>
          </div>

          {/* Ligne 2 : Titre */}
          <h3 className="text-base font-bold text-slate-200 mb-2 leading-tight group-hover:text-red-400 transition-colors line-clamp-2">
            {task.title}
          </h3>

          {/* Ligne 3 : Description (Flexible pour pousser le footer en bas) */}
          <div className="flex-grow">
            {task.description && (
              <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                {task.description}
              </p>
            )}
          </div>

          {/* Ligne 4 : Footer (Tomates & Action) */}
          <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400 group-hover:text-red-300 transition-colors">
              <Timer className="w-4 h-4" />
              <span className="text-xs font-mono font-bold">
                {task.completedPomodoros} / {task.estimatedPomodoros} 🍅
              </span>
            </div>
            
            <button className="p-1.5 bg-slate-900 rounded-lg group-hover:bg-red-950/50 group-hover:text-red-400 text-slate-600 transition-all">
              <PlayCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}