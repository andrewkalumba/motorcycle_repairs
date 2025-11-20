import type { Metadata } from 'next';
import { Quantico } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Navigation } from '@/components/layout/Navigation';

const quantico = Quantico({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EU Motorcycle Repair Directory - Bike Service Management',
  description: 'Find trusted motorcycle repair shops across Europe, manage your bikes, track service history, and book appointments',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={quantico.className}>
        <AuthProvider>
          <Navigation />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
