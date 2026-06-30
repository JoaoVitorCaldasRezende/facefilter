import { useState } from 'react';
import SliderControl from '../SliderControl/SliderControl';
import HSLMixer from '../HSLMixer/HSLMixer';
import ColorGrading from '../ColorGrading/ColorGrading';
import Histogram from '../Histogram/Histogram';
import ToneCurve from '../ToneCurve/ToneCurve';

const LUZ_SLIDERS = [
  { key: 'exposure',    label: 'Exposição',    min: 0.5,  max: 1.5,  step: 0.01 },
  { key: 'brightness',  label: 'Brilho',       min: 0.0,  max: 2.0,  step: 0.01 },
  { key: 'contrast',    label: 'Contraste',    min: 0.0,  max: 2.0,  step: 0.01 },
  { key: 'highlights',  label: 'Realces',      min: -100, max: 100,  step: 1    },
  { key: 'shadows',     label: 'Sombras',      min: -100, max: 100,  step: 1    },
  { key: 'whites',      label: 'Brancos',      min: -100, max: 100,  step: 1    },
  { key: 'blacks',      label: 'Pretos',       min: -100, max: 100,  step: 1    },
  { key: 'clarity',     label: 'Clareza',      min: -100, max: 100,  step: 1    },
  { key: 'dehaze',      label: 'Neblina',      min: -100, max: 100,  step: 1    },
];

const COR_SLIDERS = [
  { key: 'temperature', label: 'Temperatura',  min: -100, max: 100,  step: 1    },
  { key: 'tint',        label: 'Matiz',        min: -100, max: 100,  step: 1    },
  { key: 'vibrance',    label: 'Vibração',     min: -100, max: 100,  step: 1    },
  { key: 'saturation',  label: 'Saturação',    min: 0.0,  max: 3.0,  step: 0.01 },
];

const DETALHE_SLIDERS = [
  { key: 'sharpness',      label: 'Nitidez',       min: 0,   max: 3.0, step: 0.1  },
  { key: 'noiseReduction', label: 'Red. Ruído',    min: 0,   max: 1.0, step: 0.01 },
];

const EFEITOS_SLIDERS = [
  { key: 'grain',    label: 'Grão',    min: 0, max: 1.0, step: 0.01 },
  { key: 'vignette', label: 'Vinheta', min: 0, max: 1.0, step: 0.01 },
];

const RATIOS = [
  { label: 'Livre', value: null },
  { label: '1:1',   value: [1, 1] },
  { label: '4:3',   value: [4, 3] },
  { label: '16:9',  value: [16, 9] },
  { label: '9:16',  value: [9, 16] },
];

const TABS = [
  { id: 'luz',       label: 'LUZ' },
  { id: 'cor',       label: 'COR' },
  { id: 'detalhe',   label: 'DETALHE' },
  { id: 'efeitos',   label: 'EFEITOS' },
  { id: 'hsl',       label: 'HSL' },
  { id: 'grading',   label: 'GRADING' },
  { id: 'presets',   label: 'PRESETS' },
  { id: 'curva',     label: 'CURVA' },
  { id: 'transformar', label: 'TRANSF.' },
  { id: 'recortar',  label: 'RECORTAR' },
];

function SliderGroup({ sliders, adjustments, onAdjust }) {
  return (
    <div className="flex flex-col gap-6">
      {sliders.map(s => (
        <SliderControl
          key={s.key}
          label={s.label}
          value={adjustments[s.key] ?? 0}
          min={s.min}
          max={s.max}
          step={s.step}
          onChange={(v) => onAdjust(s.key, v)}
        />
      ))}
    </div>
  );
}

export default function AdjustmentsPanel({ adjustments, onAdjust, onReset, onStartCrop, imageURL, presets, onSavePreset, onDeletePreset, onApplyPreset, onCurveChange }) {
  const [tab, setTab] = useState('luz');

  return (
    <aside className="w-[260px] flex-shrink-0 bg-bg-surface border-l border-border-main flex flex-col overflow-hidden">
      {imageURL && (
        <div className="border-b border-border-main px-2 py-1.5 bg-bg-base/50">
          <Histogram imageURL={imageURL} adjustments={adjustments} />
        </div>
      )}

      {/* Tab bar */}
      <div className="flex border-b border-border-main flex-shrink-0 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-shrink-0 h-10 px-3 text-[9px] font-bold tracking-[0.14em] transition-all relative
              ${tab === t.id ? 'text-accent' : 'text-text-muted hover:text-text-secondary'}`}
          >
            {t.label}
            {tab === t.id && (
              <div className="absolute bottom-0 inset-x-0 h-px bg-accent shadow-[0_0_8px_rgba(45,212,191,0.4)]" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        {tab === 'luz' && (
          <>
            <SliderGroup sliders={LUZ_SLIDERS} adjustments={adjustments} onAdjust={onAdjust} />
            <button
              onClick={onReset}
              className="mt-6 w-full py-2 text-[9px] font-bold tracking-[0.15em] uppercase text-text-muted hover:text-accent border border-border-main hover:border-accent/25 transition-all"
            >
              RESETAR TUDO
            </button>
          </>
        )}

        {tab === 'cor' && (
          <SliderGroup sliders={COR_SLIDERS} adjustments={adjustments} onAdjust={onAdjust} />
        )}

        {tab === 'detalhe' && (
          <SliderGroup sliders={DETALHE_SLIDERS} adjustments={adjustments} onAdjust={onAdjust} />
        )}

        {tab === 'efeitos' && (
          <SliderGroup sliders={EFEITOS_SLIDERS} adjustments={adjustments} onAdjust={onAdjust} />
        )}

        {tab === 'hsl' && (
          <HSLMixer hslMixer={adjustments.hslMixer} onAdjust={onAdjust} />
        )}

        {tab === 'grading' && (
          <ColorGrading colorGrading={adjustments.colorGrading} onAdjust={onAdjust} />
        )}

        {tab === 'presets' && (
          <div className="flex flex-col gap-4">
            <button
              onClick={() => {
                const name = window.prompt('Nome do preset:');
                if (name?.trim()) onSavePreset?.(name.trim());
              }}
              className="py-2.5 text-[9px] font-bold tracking-[0.15em] uppercase text-accent border border-accent/30 bg-accent/5 hover:bg-accent/10 transition-all"
            >
              + SALVAR PRESET ATUAL
            </button>

            {(!presets || presets.length === 0) && (
              <p className="text-[9px] text-text-muted text-center py-4">Nenhum preset salvo.</p>
            )}

            <div className="flex flex-col gap-1.5">
              {(presets ?? []).map(p => (
                <div key={p.id} className="flex items-center gap-2 group">
                  <button
                    onClick={() => onApplyPreset?.(p.adjustments)}
                    className="flex-1 py-2 px-3 text-left text-[9px] font-medium text-text-secondary hover:text-text-primary border border-border-main hover:border-border-light transition-all truncate"
                  >
                    {p.name}
                  </button>
                  <button
                    onClick={() => onDeletePreset?.(p.id)}
                    className="w-6 h-6 flex items-center justify-center text-[10px] text-text-muted hover:text-red-400 border border-border-main hover:border-red-500/30 transition-all flex-shrink-0 opacity-0 group-hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'curva' && (
          <ToneCurve
            curvePoints={adjustments.curvePoints ?? [[0, 0], [255, 255]]}
            onChange={onCurveChange}
          />
        )}

        {tab === 'transformar' && (
          <div className="flex flex-col gap-5">
            <SliderControl
              label="Rotação"
              value={adjustments.rotation ?? 0}
              min={-180} max={180} step={1}
              onChange={(v) => onAdjust('rotation', v)}
            />
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-text-muted">Espelhar</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => onAdjust('flipH', !(adjustments.flipH ?? false))}
                  className={`flex-1 py-2 text-[9px] font-bold border transition-all
                    ${adjustments.flipH ? 'border-accent text-accent bg-accent/5' : 'border-border-main text-text-muted hover:border-accent/40 hover:text-accent'}`}
                >
                  ↔ H
                </button>
                <button
                  onClick={() => onAdjust('flipV', !(adjustments.flipV ?? false))}
                  className={`flex-1 py-2 text-[9px] font-bold border transition-all
                    ${adjustments.flipV ? 'border-accent text-accent bg-accent/5' : 'border-border-main text-text-muted hover:border-accent/40 hover:text-accent'}`}
                >
                  ↕ V
                </button>
              </div>
            </div>
            <button
              onClick={() => { onAdjust('rotation', 0); onAdjust('flipH', false); onAdjust('flipV', false); }}
              className="py-2 text-[9px] font-bold tracking-[0.15em] uppercase text-text-muted hover:text-accent border border-border-main hover:border-accent/25 transition-all"
            >
              RESETAR
            </button>
          </div>
        )}

        {tab === 'recortar' && (
          <div className="flex flex-col gap-5">
            <p className="text-[9px] text-text-muted tracking-wide leading-relaxed">
              Escolha uma proporção e arraste os handles sobre a imagem.
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {RATIOS.map(r => (
                <button
                  key={r.label}
                  onClick={() => onStartCrop(r.value)}
                  className="py-3 text-[9px] font-bold tracking-[0.12em] border border-border-main hover:border-accent/40 hover:text-accent text-text-muted transition-all"
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
