import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import Manifeste from '../components/layout/Manifeste';
import AuthProvider from '../components/providers/AuthProvider'; // 👈 Ton nouveau gardien
import './globals.css';

export const metadata: Metadata = {
  title: 'Ilot Zoizos - Nexus',
  description: 'Le Bordel de DhÖ - Plateforme MERN hybride',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Chargement du dictionnaire (le français par défaut de l'Îlot)
  const messages = (await import('../dictionaries/fr.json')).default;

  return (
    <html lang="fr">
      <body className="bg-slate-950 antialiased text-slate-200">
        {/* 2. On enveloppe avec AuthProvider pour que useSession() fonctionne partout */}
        <AuthProvider>
          <NextIntlClientProvider locale="fr" messages={messages}>
            {/* 3. Le Manifeste fournit le cadre visuel et les lumières */}
            <Manifeste>
              {children}
            </Manifeste>
          </NextIntlClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}