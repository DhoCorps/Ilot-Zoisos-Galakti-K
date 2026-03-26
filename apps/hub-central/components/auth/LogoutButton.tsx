'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-lg transition-all border border-transparent hover:border-red-500/20"
    >
      <LogOut className="w-3.5 h-3.5" />
      QUITTER LE NID
    </button>
  );
}