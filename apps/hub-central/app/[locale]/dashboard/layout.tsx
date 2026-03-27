'use client';

import { ReactNode } from 'react';
import { usePathname } from "../../../navigation";
import { Link } from "../../../navigation";
import { 
  Network, 
  LayoutGrid, 
  Zap, 
  User, 
  LogOut, 
  ChevronRight,
  Activity
} from "lucide-react";
import { signOut } from "next-auth/react";

interface DashboardLayoutProps {
  children: ReactNode;
  params: { locale: string };
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();

  const navItems = [
    { 
      name: 'Observatoire (Nids)', 
      href: '/dashboard/teams', 
      icon: Network,
      color: 'text-red-500'
    },
    { 
      name: 'Fragments (Projets)', 
      href: '/dashboard/projects', 
      icon: LayoutGrid,
      color: 'text-rose-500'
    },
    { 
      name: 'Laboratoire', 
      href: '/dashboard/lab', 
      icon: Zap,
      color: 'text-amber-500'
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#05070A] text-slate-200 font-sans selection:bg-red-500/30">
      
      {/* 🌌 SIDEBAR (La Colonne Vertébrale) */}
      <aside className="w-72 border-r border-slate-900 bg-[#05070A] flex flex-col sticky top-0 h-screen z-40">
        
        {/* LOGO & NOM DU PROJET */}
        <div className="p-8">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.3)] group-hover:scale-110 transition-transform duration-500">
              <span className="text-white font-black text-xl">D</span>
            </div>
            <div>
              <h2 className="text-sm font-black tracking-[0.3em] text-white uppercase">DhÖ Nexus</h2>
              <p className="text-[8px] font-mono text-slate-600 uppercase tracking-widest mt-0.5">Galakti-K System</p>
            </div>
          </Link>
        </div>

        {/* NAVIGATION PRINCIPALE */}
        <nav className="flex-grow px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-4 py-4 rounded-2xl transition-all duration-300 group ${
                  isActive 
                    ? 'bg-red-950/20 border border-red-900/30 text-white' 
                    : 'text-slate-500 hover:bg-slate-900/50 hover:text-slate-300 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-4">
                  <item.icon className={`w-5 h-5 ${isActive ? item.color : 'text-slate-600 group-hover:text-slate-400'}`} />
                  <span className="text-xs font-bold uppercase tracking-widest">{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-red-600 animate-pulse" />}
              </Link>
            );
          })}
        </nav>

        {/* FOOTER SIDEBAR (Profil & Logout) */}
        <div className="p-4 mt-auto border-t border-slate-900 space-y-2">
          <Link 
            href="/dashboard/profile"
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-900 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:border-slate-500 transition-colors">
              <User className="w-4 h-4 text-slate-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-300">Mon Profil</span>
          </Link>

          <button 
            onClick={() => signOut()}
            className="flex items-center gap-3 p-3 w-full rounded-xl hover:bg-red-950/10 transition-colors group text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-red-900/10 flex items-center justify-center group-hover:border-red-900/40 transition-colors">
              <LogOut className="w-4 h-4 text-red-900 group-hover:text-red-600" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-red-900 group-hover:text-red-600">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* 💠 CONTENU PRINCIPAL */}
      <main className="flex-grow overflow-y-auto no-scrollbar relative">
        {/* Overlay visuel subtil */}
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-red-900/5 blur-[150px] pointer-events-none -z-10 rounded-full" />
        
        {/* Le contenu des pages (Teams, Projects, etc.) s'injecte ici */}
        <div className="relative z-10 min-h-full">
          {children}
        </div>
      </main>

    </div>
  );
}