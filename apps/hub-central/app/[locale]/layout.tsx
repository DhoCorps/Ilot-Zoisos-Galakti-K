import { ReactNode } from 'react';
import '../globals.css';
import { AuthProvider } from '../AuthProvider'; 

export default function LocaleLayout({ 
  children, 
  params: { locale } 
}: { 
  children: ReactNode; 
  params: { locale: string } 
}) {
  return (
    <html lang={locale}>
      <body>
        {/* 🛰️ Le signal passe par le pont AuthProvider qui est 'Client' */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}