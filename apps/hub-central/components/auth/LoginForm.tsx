'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');

    // 🏐 Le Smash NextAuth
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false, // On gère la redirection nous-mêmes pour plus de contrôle
    });

    if (result?.error) {
      setError("L'oiseau n'a pas été reconnu... Vérifie tes accès.");
      setLoading(false);
    } else {
      // ✅ SUCCÈS : On propulse l'oiseau vers le dashboard
      // On utilise window.location pour forcer un rafraîchissement propre de la session
      window.location.href = '/fr/dashboard'; 
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Connexion à l'Îlot</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email de l'oiseau</label>
          <input
            name="email"
            type="email"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="geo@ilot.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
          <input
            name="password"
            type="password"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm font-semibold">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded-md text-white font-bold transition-colors ${
            loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Vérification dans la canopée...' : 'Entrer dans l\'Îlot'}
        </button>
      </form>
    </div>
  );
}