import Hero from '@/components/sections/Hero';
import StoryChapters from '@/components/sections/StoryChapters';
import Collections from '@/components/sections/Collections';
import FeaturedPiece from '@/components/sections/FeaturedPiece';
import BespokeCTA from '@/components/sections/BespokeCTA';
import { Atelier } from '@/components/sections/Atelier';

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
