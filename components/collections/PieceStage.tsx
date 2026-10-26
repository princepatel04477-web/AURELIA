'use client';

import dynamic from 'next/dynamic';
import { modelForSlug, PLATE_URI } from '@/lib/assets';
import { WebGLBoundary } from '@/components/providers/WebGLBudget';
import { useFirstExisting, usePlateImages } from '@/lib/useAssetProbe';

/**
 * THE PIECE, ON ITS OWN PAGE.
 *
 * A delivered model gets the React Bits `ModelViewer` (one WebGL canvas, held
 * inside a slot and released when the piece scrolls away). Without a model the
 * piece is a `TiltedCard` still — same 4:5 box either way, so nothing moves when
 * one arrives.
 */

const ModelViewer = dynamic(() => import('@/components/reactbits/ModelViewer/ModelViewer'), {
  ssr: false,
});

const TiltedCard = dynamic(() => import('@/components/reactbits/TiltedCard/TiltedCard'), {
  ssr: false,
});

type PieceStageProps = {
  slug: string;
  name: string;
  image: string;
  alt: string;
};

export function PieceStage({ slug, name, image, alt }: PieceStageProps) {
  const model = modelForSlug(slug);
  const modelExists = useFirstExisting(model ? [model] : []);
  const stills = usePlateImages([image]);

  // Still checking: hold the frame, decide nothing yet.
  if (modelExists === undefined || stills === undefined) {
    return (
      <div
        aria-hidden
        className="aspect-[4/5] w-full rounded-xs border border-line/40 bg-surface"
        data-piece-stage="checking"
      />
    );
  }

  if (modelExists) {
    return (
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xs border border-line">
        <WebGLBoundary id={`piece:${slug}`} className="h-full w-full" canvasLabel="model">
          <ModelViewer
            url={modelExists}
            width="100%"
            height="100%"
            environment="studio"
            environmentIntensity={0.9}
            exposure={1.05}
            autoRotate
            autoRotateSpeed={0.6}
            autoRotateDelay={1200}
            dragRotate
            turntable
            zoom
            minZoom={0.6}
            maxZoom={1.8}
            float={0.15}
            shadow
            shadowOpacity={0.35}
            intro="fade"
            startAngle={24}
            tilt={6}
            fit={1.1}
            className="h-full w-full"
          />
        </WebGLBoundary>
        <span className="label pointer-events-none absolute bottom-4 left-4 text-muted">
          Drag to turn · scroll to zoom
        </span>
      </div>
    );
  }

  const still = stills[image] ?? PLATE_URI;

  return (
    <div className="aspect-[4/5] w-full" data-piece-stage="still">
      <TiltedCard
        imageSrc={still}
        altText={alt}
        captionText={name}
        containerHeight="100%"
        containerWidth="100%"
        imageHeight="100%"
        imageWidth="100%"
        rotateAmplitude={10}
        scaleOnHover={1.04}
        showTooltip={false}
        radius={2}
        glare={0.18}
        glareColor="#EBD8A6"
        shadow={0.5}
        parallax={18}
        axis="both"
        intro
      />
    </div>
  );
}
