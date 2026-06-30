import SliderControl from '../SliderControl/SliderControl';

const ZONES = [
  { key: 'shadows',    label: 'Sombras' },
  { key: 'midtones',   label: 'Médios Tons' },
  { key: 'highlights', label: 'Realces' },
];

const DEFAULT_ZONE = { hue: 0, saturation: 0 };

export default function ColorGrading({ colorGrading, onAdjust }) {
  const grading = colorGrading ?? {};

  function updateZone(zone, field, value) {
    const current = grading[zone] ?? DEFAULT_ZONE;
    onAdjust('colorGrading', { ...grading, [zone]: { ...current, [field]: value } });
  }

  function swatchColor(zone) {
    const v = grading[zone] ?? DEFAULT_ZONE;
    if (v.saturation === 0) return 'transparent';
    return `hsl(${v.hue}, ${v.saturation}%, 50%)`;
  }

  return (
    <div className="flex flex-col gap-7">
      {ZONES.map(z => {
        const v = grading[z.key] ?? DEFAULT_ZONE;
        return (
          <div key={z.key} className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full border border-border-light flex-shrink-0"
                style={{ backgroundColor: swatchColor(z.key) }}
              />
              <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-text-secondary">
                {z.label}
              </span>
            </div>
            <SliderControl
              label="Matiz"
              value={v.hue}
              min={0} max={360} step={1}
              onChange={(val) => updateZone(z.key, 'hue', val)}
            />
            <SliderControl
              label="Saturação"
              value={v.saturation}
              min={0} max={100} step={1}
              onChange={(val) => updateZone(z.key, 'saturation', val)}
            />
          </div>
        );
      })}

      <button
        onClick={() => onAdjust('colorGrading', null)}
        className="py-2 text-[9px] font-bold tracking-[0.15em] uppercase text-text-muted hover:text-accent border border-border-main hover:border-accent/25 transition-all"
      >
        RESETAR GRADING
      </button>
    </div>
  );
}
