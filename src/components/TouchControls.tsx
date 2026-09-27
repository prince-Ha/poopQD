import React, { useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TouchControlsProps {
  onMoveLeftStart: () => void;
  onMoveLeftEnd: () => void;
  onMoveRightStart: () => void;
  onMoveRightEnd: () => void;
  isMovingLeft: boolean;
  isMovingRight: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMoveLeftStart,
  onMoveLeftEnd,
  onMoveRightStart,
  onMoveRightEnd,
  isMovingLeft,
  isMovingRight,
}) => {
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(8);
      } catch {}
    }
  };

  const handleLeftDown = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      triggerHaptic();
      onMoveLeftStart();
    },
    [onMoveLeftStart]
  );

  const handleLeftUp = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      onMoveLeftEnd();
    },
    [onMoveLeftEnd]
  );

  const handleRightDown = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      triggerHaptic();
      onMoveRightStart();
    },
    [onMoveRightStart]
  );

  const handleRightUp = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      onMoveRightEnd();
    },
    [onMoveRightEnd]
  );

  return (
    <div className="absolute bottom-2 left-0 right-0 px-4 sm:px-8 pb-3 z-30 flex items-center justify-between pointer-events-none select-none">
      {/* Left Move Button (◀) - 2000s Hand-Drawn Style */}
      <button
        type="button"
        onTouchStart={handleLeftDown}
        onTouchEnd={handleLeftUp}
        onTouchCancel={handleLeftUp}
        onMouseDown={handleLeftDown}
        onMouseUp={handleLeftUp}
        onMouseLeave={handleLeftUp}
        className={`pointer-events-auto w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center transition-all duration-75 select-none touch-none border-3 border-zinc-900 ${
          isMovingLeft
            ? 'bg-zinc-200 translate-x-[2px] translate-y-[2px] shadow-[1px_1px_0px_#18181b]'
            : 'bg-white shadow-[4px_4px_0px_#18181b] hover:bg-zinc-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#18181b]'
        }`}
        aria-label="왼쪽으로 이동"
      >
        <ChevronLeft className="w-12 h-12 sm:w-14 sm:h-14 stroke-[3] text-zinc-900" />
      </button>

      {/* Center watermark */}
      <div className="flex flex-col items-center opacity-60">
        <span className="text-[11px] text-zinc-500 font-doodle">by.수인쌤ㅋ</span>
      </div>

      {/* Right Move Button (▶) - 2000s Hand-Drawn Style */}
      <button
        type="button"
        onTouchStart={handleRightDown}
        onTouchEnd={handleRightUp}
        onTouchCancel={handleRightUp}
        onMouseDown={handleRightDown}
        onMouseUp={handleRightUp}
        onMouseLeave={handleRightUp}
        className={`pointer-events-auto w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center transition-all duration-75 select-none touch-none border-3 border-zinc-900 ${
          isMovingRight
            ? 'bg-zinc-200 translate-x-[2px] translate-y-[2px] shadow-[1px_1px_0px_#18181b]'
            : 'bg-white shadow-[4px_4px_0px_#18181b] hover:bg-zinc-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#18181b]'
        }`}
        aria-label="오른쪽으로 이동"
      >
        <ChevronRight className="w-12 h-12 sm:w-14 sm:h-14 stroke-[3] text-zinc-900" />
      </button>
    </div>
  );
};
