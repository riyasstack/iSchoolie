import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

/**
 * Product logo.
 *
 * The artwork is the supplied brand lockup (`public/brand/ischoolie-logo.png`,
 * 1018×213) and its standalone mark (`public/brand/ischoolie-mark.png`) for the
 * places where the wordmark is not wanted. The lockup is drawn on white, so on
 * dark surfaces and on the brand-gradient panel it sits on a white chip.
 */

const LOCKUP = {
  sm: { height: 26, width: 124 },
  md: { height: 30, width: 143 },
  lg: { height: 36, width: 172 },
} as const;

const MARK_BOX = { sm: 'h-8 w-8', md: 'h-9 w-9', lg: 'h-11 w-11' } as const;

const CHIP_ON_DARK = {
  sm: 'rounded-md dark:bg-white dark:p-1',
  md: 'rounded-lg dark:bg-white dark:p-1.5',
  lg: 'rounded-lg dark:bg-white dark:p-2',
} as const;

const CHIP_SOLID = {
  sm: 'rounded-md bg-white p-1',
  md: 'rounded-lg bg-white p-1.5',
  lg: 'rounded-lg bg-white p-2',
} as const;

export function Logo({
  size = 'md',
  showWordmark = true,
  href = '/',
  className,
  tone = 'default',
  priority = false,
}: {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  href?: string | null;
  className?: string;
  tone?: 'default' | 'inverse';
  priority?: boolean;
}) {
  const content = (
    <span className={cn('inline-flex items-center', className)}>
      {showWordmark ? (
        <Image
          src="/brand/ischoolie-logo.png"
          alt="iSchoolie"
          width={LOCKUP[size].width}
          height={LOCKUP[size].height}
          priority={priority}
          className={cn('select-none', tone === 'inverse' ? CHIP_SOLID[size] : CHIP_ON_DARK[size])}
        />
      ) : (
        <Image
          src="/brand/ischoolie-mark.png"
          alt="iSchoolie"
          width={128}
          height={128}
          priority={priority}
          className={cn('select-none', MARK_BOX[size])}
        />
      )}
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
      {content}
    </Link>
  );
}
