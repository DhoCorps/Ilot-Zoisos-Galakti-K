'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Target, Plus, X, ListTodo } from 'lucide-react';
import { TaskBoard } from '../../../../components/tasks/TaskBoard';
import { CreateTaskForm } from '../../../../components/tasks/CreateTaskForm';
import { TaskModal } from '../../../../components/tasks/TaskModal';
import { ITask } from '@ilot/types';

export default function TasksPage() {
  const [mounted, setMounted] = useState(false);
  
  // États pour contrôler les sas (modales)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ITask | null>(null);
  
  // Compteur forçant le TaskBoard à se recharger quand on crée/modifie une brindille
  const [refreshKey, setRefreshKey] = useState(0); 

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleTaskCreated = () => {
    setIsCreateModalOpen(false);
    setRefreshKey(prev => prev + 1); // Déclenche un nouveau scan radar
  };

  const handleTaskUpdated = () => {
    setRefreshKey(prev => prev + 1); // Met à jour le radar derrière
  };

  return (
    <>
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 relative z-0">
        
        <div className="bio-card p-8 md:p-10 relative overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[400px] h-[400px] bg-red-950/10 blur-[100px] rounded-full pointer-events-none -z-10" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <ListTodo className="w-8 h-8 text-red-500" />
                <h1 className="text-3xl md:text-4xl font-bold text-slate-100 tracking-tight">
                  Le Tom-Hat-Toes
                </h1>
              </div>
              <p className="text-slate-500 mt-2 font-mono text-xs uppercase tracking-widest">
                Centre névralgique de vos brindilles et de la méthode Pomodoro
              </p>
            </div>
            
            <button 
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-red-900/80 hover:bg-red-800 text-slate-100 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)] border border-red-500/30"
            >
              <Plus className="w-5 h-5" />
              Forger une Brindille
            </button>
          </div>
        </div>

        <div className="bio-card p-8 border-slate-800/60 relative z-10 min-h-[50vh]">
          <TaskBoard 
            key={refreshKey} 
            onTaskClick={(task) => setSelectedTask(task)} 
          />
        </div>
      </div>

      {mounted && isCreateModalOpen && createPortal(
        <div 
          className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300"
          style={{ zIndex: 2147483647 }} 
        >
          <div className="relative w-full max-w-2xl bg-[#05070A] rounded-2xl border border-slate-700/50 shadow-[0_0_50px_rgba(0,0,0,0.8)] p-8 max-h-[90vh] overflow-y-auto no-scrollbar">
            <button 
              onClick={() => setIsCreateModalOpen(false)} 
              className="absolute top-6 right-6 z-10 p-2 text-slate-500 hover:text-red-400 bg-slate-900/80 rounded-full transition-colors border border-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                <Target className="text-red-500" /> Tisser une nouvelle brindille
              </h3>
            </div>
            
            <CreateTaskForm onSuccess={handleTaskCreated} />
          </div>
        </div>,
        document.body
      )}

      {mounted && selectedTask && createPortal(
        <div 
          className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in zoom-in-95 duration-200"
          style={{ zIndex: 2147483647 }} 
        >
          <div className="relative w-full max-w-3xl bg-transparent max-h-[90vh] overflow-y-auto no-scrollbar flex items-center justify-center">
            <TaskModal 
              task={selectedTask} 
              onClose={() => setSelectedTask(null)} 
              onUpdate={handleTaskUpdated} 
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}