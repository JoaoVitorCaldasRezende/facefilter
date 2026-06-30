export default function SliderControl({ label, value, min, max, step = 0.01, onChange }) {
  const percent = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const isInteger = Number.isInteger(step);
  const display = isInteger ? value : value.toFixed(2);
  const isModified = value !== 1.0 && value !== 0;

  return (
    <div className="flex flex-col gap-2 group">
      <div className="flex justify-between items-baseline">
        <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-text-muted group-hover:text-text-secondary transition-colors">
          {label}
        </span>
        <span className={`text-[10px] font-bold tabular-nums transition-colors ${isModified ? 'text-accent' : 'text-text-muted'}`}>
          {display}
        </span>
      </div>
      <div className="relative h-px bg-border-main group-hover:bg-border-light transition-colors" style={{ marginTop: '2px' }}>
        {/* Active fill */}
        <div
          className="absolute inset-y-0 left-0 bg-accent/70 transition-none"
          style={{ width: `${percent}%` }}
        />
        {/* Thumb line */}
        <div
          className="absolute w-px h-2.5 bg-accent shadow-[0_0_5px_rgba(45,212,191,0.5)] transition-none"
          style={{ left: `${percent}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
        />
        {/* Invisible interaction input — tall hit area */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute w-full opacity-0 cursor-pointer"
          style={{ height: '20px', top: '50%', transform: 'translateY(-50%)', left: 0 }}
        />
      </div>
    </div>
  );
}
