import type { Metadata, Viewport } from 'next';
import { cormorant, inter } from './fonts';
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider';
import { NoiseOverlay } from '@/components/chrome/NoiseOverlay';
import { Letterbox } from '@/components/chrome/Letterbox';
import { SiteNav } from '@/components/chrome/SiteNav';
import { PageTransition } from '@/components/cinematic/PageTransition';
import { Footer } from '@/components/sections/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'AURELIA — Fine Jewellery, Surat',
    template: '%s — AURELIA',
  },
  description:
    'AURELIA is a fine jewellery house in Surat, Gujarat. Diamonds cut by hand, set in gold, made to be inherited.',
  applicationName: 'AURELIA',
  authors: [{ name: 'AURELIA' }],
  keywords: ['fine jewellery', 'high jewellery', 'Surat', 'diamond', 'Atelier Aurelia'],
  openGraph: {
    title: 'AURELIA — Fine Jewellery, Surat',
    description: 'Diamonds cut by hand, set in gold, made to be inherited.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'AURELIA',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#0A0907',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh bg-bg font-body text-ivory antialiased">
        <SmoothScrollProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-[7vh] focus:z-[90] focus:bg-surface focus:px-4 focus:py-2 focus:text-gold"
          >
            Skip to content
          </a>

          <Letterbox />
          <PageTransition />
          <SiteNav />
          <NoiseOverlay />

          <main id="main" className="relative">
            {children}
          </main>

          <Footer />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
