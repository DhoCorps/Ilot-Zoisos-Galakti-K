"use client";

import { useSession, signOut } from "next-auth/react";

export default function UserNav() {
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <div className="flex items-center gap-4 p-2 bg-slate-900/80 border border-emerald-500/30 rounded-full backdrop-blur-md shadow-lg shadow-emerald-900/20">
      {/* Avatar avec ta signature unique */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white font-bold shadow-inner">
        {session.user?.signature || "<(:<"}
      </div>
      
      <div className="flex flex-col pr-4">
        <span className="text-sm font-bold text-white leading-none">
          {session.user?.name}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-medium">
          {session.user?.role || "Bâtisseur"}
        </span>
      </div>

      <button 
        onClick={() => signOut()}
        className="p-2 hover:bg-red-500/20 rounded-full transition-colors text-slate-400 hover:text-red-400"
        title="Quitter l'Îlot"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      </button>
    </div>
  );
}