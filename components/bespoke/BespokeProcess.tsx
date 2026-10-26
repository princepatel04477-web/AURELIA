'use client';

import Image from 'next/image';
import { ChapterCard } from '@/components/chrome/ChapterCard';

interface ProcessStep {
  numeral: string;
  stepNumber: string;
  title: string;
  meta: string;
  image: string;
  alt: string;
  copy: string;
}

const STEPS: ProcessStep[] = [
  {
    numeral: 'I',
    stepNumber: '01',
    title: 'Consult',
    meta: 'Week one',
    image: '/cinematic/atelier-hands.jpg',
    alt: 'Master artisan inspecting loose diamonds and stones',
    copy: 'One hour, one table, a tray of loose stones. We photograph the hand, measure the finger, and write down what the piece has to survive.',
  },
  {
    numeral: 'II',
    stepNumber: '02',
    title: 'Sketch',
    meta: 'Week two',
    image: '/cinematic/chapter-hand.jpg',
    alt: 'Jewellery design drafting and hand preparation',
    copy: 'Drawn at actual size in graphite, then again in elevation. You approve the line before any metal is cut — changes are free until the wax.',
  },
  {
    numeral: 'III',
    stepNumber: '03',
    title: 'Craft',
    meta: 'Weeks three to seven',
    image: '/cinematic/chapter-fire.jpg',
    alt: 'Molten gold pouring and heat forging at the atelier',
    copy: 'Wax, casting, setting, and the long part: polishing by hand until the metal stops showing the tool. Four hands, one bench.',
  },
  {
    numeral: 'IV',
    stepNumber: '04',
    title: 'Deliver',
    meta: 'Week eight',
    image: '/jewelry/featured-4.webp',
    alt: 'Finished bespoke diamond masterpiece',
    copy: 'Struck with the maker’s stamp, the year, and the weight of its gold. Boxed in Surat, handed over by appointment.',
  },
];

export function BespokeProcess() {
  return (
    <section aria-labelledby="process-title" className="relative border-t border-line/40 bg-bg">
      <div className="frame py-20 lg:py-28">
        <ChapterCard numeral="VII" title="The Commission" meta="Eight weeks" />
        <h2
          id="process-title"
          className="display mt-8 max-w-2xl text-[clamp(2rem,4.6vw,3.8rem)] leading-[0.98] text-ivory"
        >
          From a conversation
          <span className="display-italic text-gold"> to a stamp.</span>
        </h2>

        {/* 4 steps as a vertical 2-column list, no scroll pinning */}
        <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-14 lg:gap-16">
          {STEPS.map((step) => (
            <article
              key={step.numeral}
              className="flex flex-col border border-line/40 bg-surface/50 p-6 sm:p-8 transition-colors duration-500 hover:border-gold/50"
            >
              {/* Image container */}
              <div className="relative aspect-[16/10] w-full overflow-hidden border border-line/30 bg-[#14110D]">
                <Image
                  src={step.image}
                  alt={step.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-center transition-transform duration-700 hover:scale-105"
                />
                <span className="label pointer-events-none absolute left-4 top-4 bg-bg/70 px-2.5 py-1 text-gold-bright backdrop-blur-sm border border-gold/20">
                  {step.stepNumber}
                </span>
              </div>

              {/* Text content */}
              <div className="mt-6 flex flex-col flex-1 justify-between">
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="label text-gold">{step.meta}</span>
                    <span className="label text-muted/60">{step.numeral}</span>
                  </div>
                  <h3 className="display mt-2 text-[clamp(1.7rem,3vw,2.4rem)] leading-none text-ivory">
                    {step.title}
                  </h3>
                  <p className="mt-4 text-body leading-relaxed text-ivory/75">
                    {step.copy}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default BespokeProcess;
