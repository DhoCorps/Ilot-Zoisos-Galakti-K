'use client';

import { useState } from 'react';
import { ShieldAlert, Wind, Save, Loader2, Globe, Lock } from 'lucide-react';
import { teams as teamsApi } from "../../lib/apiClient";
import { ITeam } from '@ilot/types';

interface TeamSettingsFormProps {
  team: ITeam;
  onUpdate?: () => void;
}

export const TeamSettingsForm = ({ team, onUpdate }: TeamSettingsFormProps) => {
  const [isPending, setIsPending] = useState(false);
  const [settings, setSettings] = useState({
    isGlobalReducedSpeed: team.settings?.isGlobalReducedSpeed || false,
    isPrivate: team.isPrivate ?? true, 
  });

  const handleToggleReducedSpeed = async () => {
    setIsPending(true);
    try {
      const newStatus = !settings.isGlobalReducedSpeed;
      await teamsApi.update(team.uid!, { 
        settings: { ...team.settings, isGlobalReducedSpeed: newStatus } 
      });
      setSettings({ ...settings, isGlobalReducedSpeed: newStatus });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Échec de la mutation du Nid :", error);
    } finally {
      setIsPending(false);
    }
  };

  // 🛡️ FIX : La fonction de sauvegarde globale
  const handleSaveGlobal = async () => {
    setIsPending(true);
    try {
      await teamsApi.update(team.uid!, { 
        isPrivate: settings.isPrivate, 
        settings: { 
          ...team.settings, 
          isGlobalReducedSpeed: settings.isGlobalReducedSpeed,
          allowSearch: !settings.isPrivate 
        } 
      });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Échec de la sauvegarde globale :", error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-8 p-1 animate-in fade-in duration-500">
      
      {/* SECTION : PROTOCOLE DE SAUVEGARDE */}
      <div className={`p-6 rounded-2xl border transition-all duration-500 ${
        settings.isGlobalReducedSpeed 
          ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.1)]' 
          : 'bg-slate-900/40 border-slate-800'
      }`}>
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-100">
              <Wind className={settings.isGlobalReducedSpeed ? 'text-amber-500' : 'text-slate-500'} size={18} />
              Vitesse Réduite Globale
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-md">
              En activant ce mode, tous les fragments (projets) de ce nid passent instantanément en mode préservation. 
              La charge mentale sera automatiquement recalculée pour protéger l'escouade.
            </p>
          </div>
          
          <button
            onClick={handleToggleReducedSpeed}
            disabled={isPending}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              settings.isGlobalReducedSpeed ? 'bg-amber-600' : 'bg-slate-700'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.isGlobalReducedSpeed ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {/* 🛡️ SECTION : VISIBILITÉ (UPGRADE GALAKTI-K) */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <ShieldAlert size={14} /> Confidentialité du Nid
        </h3>
        
        <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800/60 rounded-xl group hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-3">
            {settings.isPrivate ? <Lock className="w-4 h-4 text-red-500" /> : <Globe className="w-4 h-4 text-slate-500" />}
            <div>
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                {settings.isPrivate ? "Visibilité Furtive" : "Visibilité Publique"}
              </p>
              <p className="text-[9px] text-slate-600 font-mono uppercase">
                {settings.isPrivate ? "Mode Ghost activé (Membres uniquement)" : "Ce nid est visible dans la canopée globale"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSettings({ ...settings, isPrivate: !settings.isPrivate })}
            className={`w-10 h-5 rounded-full transition-all relative ${settings.isPrivate ? 'bg-red-600' : 'bg-slate-800'}`}
          >
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.isPrivate ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
      </div>

      {/* BOUTON DE SAUVEGARDE GÉNÉRALE (Connecté à handleSaveGlobal) */}
      <button
        onClick={handleSaveGlobal}
        disabled={isPending}
        className="w-full py-4 bg-slate-100 hover:bg-white text-black rounded-xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-3 shadow-xl"
      >
        {isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
        Enregistrer les mutations
      </button>
    </div>
  );
};