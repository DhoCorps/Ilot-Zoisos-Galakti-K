"use client";
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn('credentials', { email, password, redirect: false });
    if (!result?.error) router.push('/');
    else alert("Identifiants incorrects.");
  };

  return (
    <div className="p-8 bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-emerald-500/30 shadow-2xl">
      <h1 className="text-2xl font-bold text-white mb-6">Retour au Nid</h1>
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <input type="email" placeholder="Email" className="p-3 rounded bg-slate-800 text-white border border-slate-700" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Mot de passe" className="p-3 rounded bg-slate-800 text-white border border-slate-700" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded font-bold">Se connecter</button>
      </form>
      <div className="mt-4 text-sm text-slate-400 flex justify-between">
        <a href="/auth/forgot-password">Clé perdue ?</a>
        <a href="/auth/register" className="text-emerald-400">Pas encore d'oiseau ?</a>
      </div>
    </div>
  );
}