import type { Metadata, Viewport } from 'next';
import { Fraunces, Space_Grotesk, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { BRAND } from '@/lib/content';

const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
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
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#050505',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${grotesk.variable} ${plex.variable}`}>
      <body className="grain overflow-x-clip bg-[#050505] text-[#fcfcf7]">
        {children}
      </body>
    </html>
  );
}
