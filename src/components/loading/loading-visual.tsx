import Image from 'next/image';

/**
 * Branded loader: centred iSchoolie logo with a short three-segment
 * indeterminate progress bar centred directly beneath it.
 */
export function LoadingVisual() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8 bg-white px-6">
      <Image
        src="/brand/ischoolie-logo.png"
        alt="iSchoolie"
        width={240}
        height={50}
        priority
        className="h-auto w-[min(56vw,240px)] select-none"
      />

      <div className="relative h-[4px] w-[min(70vw,320px)] overflow-hidden rounded-full bg-[#d7dce5]">
        <div
          className="absolute left-0 top-0 h-full w-[35%] rounded-full bg-[#2540ea]"
          style={{ animation: 'ischoolie-loading-bar 1.1s linear infinite' }}
        />
      </div>

      <style>{`
        @keyframes ischoolie-loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(285%); }
        }
      `}</style>
    </div>
  );
}
