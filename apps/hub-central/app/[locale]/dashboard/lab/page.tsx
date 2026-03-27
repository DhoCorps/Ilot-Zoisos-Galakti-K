'use client';

import { useState, useEffect } from 'react';
import { 
  Zap, 
  Activity, 
  AlertTriangle, 
  Thermometer, 
  Wind, 
  BrainCircuit,
  Loader2,
  RefreshCw,
  ShieldCheck
} from "lucide-react";
import { lab as labApi } from "../../../../lib/apiClient";

export default function LaboratoryPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBioMetrics = async () => {
    try {
      setIsLoading(true);
      // On simule ici un scan global de la météo de l'île
      const weather = await labApi.getIslandWeather();
      setMetrics(weather);
    } catch (error) {
      console.error("🚨 Échec du scan biométrique :", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBioMetrics();
  }, []);

  return (
    <div className="p-8 md:p-12 space-y-12 animate-in fade-in duration-1000">
      
      {/* HEADER DU LAB */}
      <div className="flex justify-between items-end border-b border-slate-900 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4">
            <Zap className="text-amber-500 fill-amber-500/20" />
            LABORATOIRE BIOMÉTRIQUE
          </h1>
          <p className="text-slate-500 mt-2 font-mono text-[10px] uppercase tracking-[0.3em]">
            Surveillance des flux de données et de la charge mentale collective
          </p>
        </div>
        <button 
          onClick={fetchBioMetrics}
          className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-amber-500/50 transition-all group"
        >
          <RefreshCw className={`w-5 h-5 text-slate-500 group-hover:text-amber-500 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* GRILLE DE SURVEILLANCE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* CARD : STRESS GLOBAL */}
        <div className="bio-card p-8 space-y-6 relative overflow-hidden group">
          <div className="flex justify-between items-start relative z-10">
            <BrainCircuit className="text-red-500 w-8 h-8" />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Niveau de Stress</span>
          </div>
          <div className="relative z-10">
            <div className="text-5xl font-black text-white italic">42<span className="text-xl text-red-500/50">%</span></div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-red-600 w-[42%] shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-mono leading-relaxed relative z-10">
            Calcul basé sur l'indice global de fatigue des fragments actifs.
          </p>
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity size={120} className="text-red-500" />
          </div>
        </div>

        {/* CARD : VITESSE RÉDUITE */}
        <div className="bio-card p-8 space-y-6 border-amber-500/20">
          <div className="flex justify-between items-start">
            <Wind className="text-amber-500 w-8 h-8" />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Atmosphère</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
              <span className="text-xl font-bold text-slate-200">Vitesse Réduite</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Le protocole de ralentissement est actif sur 3 nids pour préserver la structure.
            </p>
          </div>
        </div>

        {/* CARD : ALERTES DE MODÉRATION */}
        <div className="bio-card p-8 space-y-6">
          <div className="flex justify-between items-start">
            <AlertTriangle className="text-slate-500 w-8 h-8" />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sécurité Nexus</span>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Nids signalés</span>
              <span className="font-mono text-white">0</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Fragments corrompus</span>
              <span className="font-mono text-white">2</span>
            </div>
            <div className="pt-4 border-t border-slate-900 flex items-center gap-2 text-[9px] font-black text-red-500 uppercase tracking-tighter">
              <ShieldCheck size={12} /> Système de modération UP
            </div>
          </div>
        </div>

      </div>

      {/* SECTION : ANALYSE DES FLUX */}
      <div className="bio-card p-10 bg-slate-950/40">
        <h3 className="text-sm font-black uppercase tracking-[0.4em] text-slate-500 mb-8 flex items-center gap-4">
          <Thermometer className="text-red-600" size={18} />
          Température des Escouades
        </h3>
        <div className="space-y-8">
          {/* Exemple de barre de chargement par Nid */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest">
              <span className="text-slate-300">Nid Alpha</span>
              <span className="text-amber-500">68% de charge</span>
            </div>
            <div className="w-full h-1 bg-slate-900 rounded-full">
              <div className="h-full bg-gradient-to-r from-red-600 to-amber-500 w-[68%]" />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}