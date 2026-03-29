import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth'; 

// 🛡️ LA SUTURE DE COMPILATION : Force le rendu dynamique
export const dynamic = 'force-dynamic';

export default async function TomHatToesPage() {
  // 1. 🛂 LA DOUANE : On vérifie l'identité du pilote
  const session = await getServerSession(authOptions);

  // 2. 🛑 LE DRAPEAU ROUGE : Pas de session ? Retour aux stands
  if (!session || !session.user) {
    redirect('/'); 
  }

  // 3. 🟢 L'INTERFACE MAGMATIQUE
  return (
    <div className="p-8 max-w-md mx-auto mt-20">
      <div className="bio-card text-center p-10 group">
        
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-slate-100 to-red-600 mb-4 tracking-widest uppercase drop-shadow-sm">
          Tom-Hat-Toes
        </h1>
        
        <p className="text-slate-400 font-light tracking-wide group-hover:text-red-300/80 transition-colors duration-500">
          Interface de l'inception opérationnelle. &lt;(:&lt;
        </p>
        
        <div className="mt-8 flex items-center justify-center gap-2 opacity-50">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
          <span className="text-[10px] text-slate-500 uppercase font-mono tracking-widest">Opérationnel</span>
        </div>
        
      </div>
    </div>
  );
}