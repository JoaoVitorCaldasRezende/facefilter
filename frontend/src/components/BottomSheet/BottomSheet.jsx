import { useRef } from 'react';

const SNAP = { closed: '48px', open: '58vh' };

export default function BottomSheet({ children, isOpen, setIsOpen }) {
  const touchStartY = useRef(null);

  function onTouchStart(e) {
    touchStartY.current = e.touches[0].clientY;
  }

  function onTouchEnd(e) {
    if (touchStartY.current === null) return;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (dy < -30) setIsOpen(true);
    else if (dy > 30) setIsOpen(false);
    touchStartY.current = null;
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 bg-bg-surface border-t border-border-light flex flex-col"
      style={{
        height: isOpen ? SNAP.open : SNAP.closed,
        transition: 'height 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
        willChange: 'height',
      }}
    >
      {/* Drag handle */}
      <div
        className="flex-shrink-0 h-12 flex flex-col items-center justify-center gap-1.5 cursor-pointer touch-none select-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={() => setIsOpen(o => !o)}
      >
        <div className="w-8 h-0.5 rounded-full bg-border-light" />
        <span className="text-[8px] font-bold tracking-[0.18em] uppercase text-text-muted">
          {isOpen ? 'AJUSTES ↓' : 'AJUSTES ↑'}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
