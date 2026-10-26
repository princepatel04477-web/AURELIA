import Hero from '@/components/sections/Hero';
import StoryChapters from '@/components/sections/StoryChapters';
import Collections from '@/components/sections/Collections';
import { Atelier } from '@/components/sections/Atelier';

export default function Home() {
  return (
    <>
      <Hero />
      <StoryChapters />
      <Collections />
      <Atelier />
    </>
  );
}
