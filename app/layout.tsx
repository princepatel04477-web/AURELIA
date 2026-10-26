import type { Metadata, Viewport } from 'next';
import { cormorant, inter } from './fonts';
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider';
import { Letterbox } from '@/components/chrome/Letterbox';
import { SiteNav } from '@/components/chrome/SiteNav';
import { PageTransition } from '@/components/cinematic/PageTransition';
import { Footer } from '@/components/sections/Footer';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://aurelia.example'),
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
    url: '/',
    siteName: 'AURELIA',
    type: 'website',
    locale: 'en_IN',
    images: [
      {
        url: '/cinematic/og-aurelia.jpg',
        width: 1200,
        height: 630,
        alt: 'AURELIA — Fine Jewellery, Surat',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AURELIA — Fine Jewellery, Surat',
    description: 'Diamonds cut by hand, set in gold, made to be inherited.',
    images: ['/cinematic/og-aurelia.jpg'],
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
          

          <main id="main" className="relative">
            {children}
          </main>

          <Footer />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
