import { useState } from 'react';
import SliderControl from '../SliderControl/SliderControl';

const COLORS = [
  { key: 'red',     label: 'Vermelho', dot: '#ef4444' },
  { key: 'orange',  label: 'Laranja',  dot: '#f97316' },
  { key: 'yellow',  label: 'Amarelo',  dot: '#eab308' },
  { key: 'green',   label: 'Verde',    dot: '#22c55e' },
  { key: 'aqua',    label: 'Ciano',    dot: '#06b6d4' },
  { key: 'blue',    label: 'Azul',     dot: '#3b82f6' },
  { key: 'purple',  label: 'Roxo',     dot: '#a855f7' },
  { key: 'magenta', label: 'Magenta',  dot: '#ec4899' },
];

const DEFAULT_CHANNEL = { hue: 0, saturation: 0, luminance: 0 };

export default function HSLMixer({ hslMixer, onAdjust }) {
  const [selected, setSelected] = useState('red');
  const mixer = hslMixer ?? {};
  const current = mixer[selected] ?? DEFAULT_CHANNEL;

  function updateChannel(channel, value) {
    const next = { ...(mixer[selected] ?? DEFAULT_CHANNEL), [channel]: value };
    onAdjust('hslMixer', { ...mixer, [selected]: next });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Color selector grid */}
      <div className="grid grid-cols-4 gap-1">
        {COLORS.map(c => (
          <button
            key={c.key}
            onClick={() => setSelected(c.key)}
            className={`py-2 flex flex-col items-center gap-1 text-[8px] font-bold tracking-wide border transition-all
              ${selected === c.key ? 'border-accent bg-accent/5 text-accent' : 'border-border-main text-text-muted hover:border-border-light'}`}
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.dot }} />
            {c.label}
          </button>
        ))}
      </div>

      {/* H/S/L sliders for selected color */}
      <div className="flex flex-col gap-5">
        <SliderControl label="Matiz"      value={current.hue}        min={-180} max={180} step={1} onChange={(v) => updateChannel('hue', v)} />
        <SliderControl label="Saturação"  value={current.saturation} min={-100} max={100} step={1} onChange={(v) => updateChannel('saturation', v)} />
        <SliderControl label="Luminância" value={current.luminance}  min={-100} max={100} step={1} onChange={(v) => updateChannel('luminance', v)} />
      </div>

      <button
        onClick={() => onAdjust('hslMixer', null)}
        className="py-2 text-[9px] font-bold tracking-[0.15em] uppercase text-text-muted hover:text-accent border border-border-main hover:border-accent/25 transition-all"
      >
        RESETAR HSL
      </button>
    </div>
  );
}
