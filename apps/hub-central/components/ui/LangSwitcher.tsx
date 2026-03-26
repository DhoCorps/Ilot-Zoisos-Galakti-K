"use client";

import { useLocale } from 'next-intl';
// 🛑 On supprime l'ancien routeur
// import { useRouter, usePathname } from 'next/navigation';

// 🟢 On importe notre boussole magique
import { useRouter, usePathname } from '../../navigation'; 
import { Languages, Loader2 } from 'lucide-react'; 
import { useState } from 'react';

export const LangSwitcher = () => {
  const locale = useLocale();
  const router = useRouter();
  // 🪄 Ici, pathname vaut "/dashboard" (la locale est masquée !)
  const pathname = usePathname(); 
  
  const [isSyncing, setIsSyncing] = useState(false);

  const toggleLanguage = () => {
    setIsSyncing(true); 
    
    const nextLocale = locale === 'fr' ? 'en' : 'fr';
    
    // On laisse ton animation vivre un court instant
    setTimeout(() => {
      // 🚀 LE COUP DE GRÂCE : On remplace la page actuelle en injectant la nouvelle langue
      router.replace(pathname, { locale: nextLocale });
    }, 400); 
  };

  return (
    <button
      onClick={toggleLanguage}
      disabled={isSyncing}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500 group
        ${isSyncing 
          ? 'border-emerald-500/50 bg-emerald-500/10 scale-95' 
          : 'border-white/10 bg-white/5 hover:bg-white/10'}
      `}
      title={locale === 'fr' ? 'Switch to English' : 'Passer en Français'}
    >
      {/* Icône qui tourne si on synchronise, sinon icône fixe */}
      {isSyncing ? (
        <Loader2 size={14} className="animate-spin text-emerald-500" />
      ) : (
        <Languages 
          size={14} 
          className="opacity-50 group-hover:opacity-100 group-hover:text-emerald-500 transition-colors" 
        />
      )}

      <span className={`text-[10px] font-bold uppercase tracking-widest transition-opacity ${isSyncing ? 'opacity-50' : 'opacity-100'}`}>
        {locale}
      </span>
      
      {/* Indicateur visuel (drapeau) qui s'estompe pendant la transition */}
      <div className={`flex flex-col gap-0.5 ml-1 transition-all duration-500 ${isSyncing ? 'blur-sm opacity-0' : 'opacity-100'}`}>
        {locale === 'fr' ? (
           <div className="flex gap-0.5">
             <div className="w-1 h-2 bg-blue-500 rounded-sm" />
             <div className="w-1 h-2 bg-white rounded-sm" />
             <div className="w-1 h-2 bg-red-500 rounded-sm" />
           </div>
        ) : (
          <div className="flex flex-col gap-0.5">
             <div className="w-3 h-1 bg-red-500 rounded-sm" />
             <div className="w-3 h-1 bg-blue-800 rounded-sm" />
          </div>
        )}
      </div>
    </button>
  );
};