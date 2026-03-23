"use client";

import { signIn, signOut } from "next-auth/react";
import { useAuth } from "../../context/AuthContext";

export const AuthButton = () => {
  const { user, isAuthenticated, signature, status } = useAuth();

  if (status === "loading") {
    return (
      <div className="animate-pulse flex items-center space-x-2 opacity-50">
        <div className="h-2 w-2 bg-current rounded-full"></div>
        <span className="text-[10px] uppercase tracking-tighter">Synchronisation...</span>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center space-x-4 group">
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest opacity-40">Identité : {user?.role}</p>
          <p className="text-sm font-medium">{user?.name}</p>
        </div>
        
        <button 
          onClick={() => signOut()}
          className="relative h-10 w-10 rounded-full border border-white/10 flex items-center justify-center hover:border-red-500/50 transition-all bg-black/20 overflow-hidden"
          title="Se déconnecter"
        >
          <span className="text-lg group-hover:scale-0 transition-transform duration-300">
            {signature}
          </span>
          <span className="absolute text-[10px] uppercase font-bold text-red-500 scale-0 group-hover:scale-100 transition-transform duration-300">
            OFF
          </span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("github")}
      className="px-5 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/20 text-emerald-400 text-xs uppercase tracking-[0.2em] transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
    >
      S'identifier au Nexus
    </button>
  );
};