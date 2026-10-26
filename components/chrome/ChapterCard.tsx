import { cn } from '@/lib/utils';

type ChapterCardProps = {
  /** Roman numeral of the chapter: I, II, III… */
  numeral: string;
  /** Chapter title, set in the label face: THE LIGHT, THE STONE… */
  title: string;
  /** Optional right-hand meta line (piece count, year, location). */
  meta?: string;
  className?: string;
  align?: 'left' | 'center';
};

/**
 * The chapter card that opens every section.
 * `CHAPTER I — THE LIGHT`, 0.32em tracking, one hairline, nothing else.
 */
export function ChapterCard({ numeral, title, meta, className, align = 'left' }: ChapterCardProps) {
  return (
    <div
      className={cn(
        'flex w-full items-center gap-4',
        align === 'center' && 'justify-center',
        className
      )}
    >
      <span className="label whitespace-nowrap">
        <span className="text-gold">Chapter {numeral}</span>
        <span className="px-2 text-muted">—</span>
        <span>{title}</span>
      </span>

      <span className="hairline hidden flex-1 sm:block" />

      {meta ? <span className="label whitespace-nowrap text-muted">{meta}</span> : null}
    </div>
  );
}
