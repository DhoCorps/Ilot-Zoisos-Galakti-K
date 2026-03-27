import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import Manifeste from '../components/layout/Manifeste';
import AuthProvider from '../components/providers/AuthProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ilot Zoizos - Hub',
  description: 'Le Bordel de DhÖ - Architecture Organique',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = (await import('../dictionaries/fr.json')).default;

  return (
    <html lang="fr" className="dark">
      {/* Modification des couleurs de sélection pour du rouge/rosé sombre */}
      <body className="antialiased selection:bg-red-500/20 selection:text-red-100 overflow-x-hidden">
        <AuthProvider>
          <NextIntlClientProvider locale="fr" messages={messages}>
            <Manifeste>
              {children}
            </Manifeste>
          </NextIntlClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}