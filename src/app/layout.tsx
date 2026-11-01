import '@fontsource-variable/inter';
import '@fontsource-variable/geist';
import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Centro de mando ESG — Green Owl Labs',
  description: 'Inteligencia de sostenibilidad corporativa, doble materialidad y gestión del desempeño.',
  icons: { icon: '/green-owl-mark.png' },
};

export const viewport: Viewport = {
  themeColor: '#0b1411',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
