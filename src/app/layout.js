import './globals.css';
import Navigation from './components/Navigation';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'CupPredict 2026',
  description: 'World Cup 2026 prediction game.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Navigation />
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
