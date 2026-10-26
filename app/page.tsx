import type { Metadata } from 'next';
import Hero from '@/components/sections/Hero';
import StoryChapters from '@/components/sections/StoryChapters';
import Collections from '@/components/sections/Collections';
import FeaturedPiece from '@/components/sections/FeaturedPiece';
import BespokeCTA from '@/components/sections/BespokeCTA';
import { Atelier } from '@/components/sections/Atelier';

export const metadata: Metadata = {
  title: { absolute: 'AURELIA — Fine Jewellery, Surat' },
  description:
    'AURELIA is a fine jewellery house in Surat, Gujarat. Diamonds cut by hand, set in gold, made to be inherited.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'AURELIA — Fine Jewellery, Surat',
    description: 'Diamonds cut by hand, set in gold, made to be inherited.',
    url: '/',
    type: 'website',
    images: [{ url: '/cinematic/og-aurelia.jpg', width: 1200, height: 630, alt: 'AURELIA' }],
  },
};

export default function Home() {
  return (
    <>
      <Hero />
      <StoryChapters />
      <Collections />
      <FeaturedPiece />
      <BespokeCTA />
      <Atelier />
    </>
  );
}
