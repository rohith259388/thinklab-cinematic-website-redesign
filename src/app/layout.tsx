import type { Metadata, Viewport } from 'next';
import { League_Spartan, Space_Grotesk, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { BRAND } from '@/lib/content';
import ServiceWorker from '@/components/ui/ServiceWorker';

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  variable: '--font-league-spartan',
  display: 'swap',
});

const grotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-grotesk',
  display: 'swap',
});

const plex = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.thinklabdigitalsolutions.com'),
  title: {
    default: 'Thinklab Digital Solutions — The Right Partner For Digital Growth',
    template: '%s — Thinklab Digital Solutions',
  },
  description: BRAND.descriptor,
  keywords: [
    'Thinklab Digital Solutions',
    'digital marketing agency',
    'SEO',
    'website development',
    'brand strategy',
    'CRM services',
    'AI workflow automation',
    'strategic planning',
    'Vijayawada',
    'Sydney',
  ],
  openGraph: {
    title: 'Thinklab Digital Solutions — The Right Partner For Digital Growth',
    description: BRAND.descriptor,
    url: 'https://www.thinklabdigitalsolutions.com',
    siteName: 'Thinklab Digital Solutions',
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/images/tlds-favicon.png', sizes: '200x200', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/images/tlds-favicon.png', sizes: '200x200', type: 'image/png' },
    ],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#050505',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${leagueSpartan.variable} ${grotesk.variable} ${plex.variable}`}>
      <body className="grain overflow-x-clip bg-[#050505] text-[#fcfcf7]">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
