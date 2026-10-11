import React from 'react';
import { Sliders, Sun, Gauge, Timer, Layers, ShieldCheck } from 'lucide-react';
import { StaircaseConfig } from '../types';

interface ConfigEditorProps {
  currentConfig: StaircaseConfig;
  baseConfig: Partial<StaircaseConfig>;
  onChange: (key: keyof StaircaseConfig, val: number) => void;
}

export const ConfigEditor: React.FC<ConfigEditorProps> = ({
  currentConfig,
  baseConfig,
  onChange,
}) => {
  const isDirty = (key: keyof StaircaseConfig) => {
    return baseConfig[key] !== undefined && currentConfig[key] !== baseConfig[key];
  };

  const getPercentage = (val: number, min: number, max: number) => {
    return Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards: Stored State */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-[#14161b] border border-white/10 rounded-xl p-3">
          <div className="text-[11px] text-white/50 mb-1 flex items-center gap-1">
            <Layers className="w-3 h-3 text-amber-400" />
            <span>Registradores</span>
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {baseConfig.reg ?? '—'}
          </div>
        </div>

        <div className="bg-[#14161b] border border-white/10 rounded-xl p-3">
          <div className="text-[11px] text-white/50 mb-1">Total Saídas</div>
          <div className="text-xl font-bold font-mono text-white">
            {baseConfig.totalSaidas ?? (baseConfig.reg ? baseConfig.reg * 8 : '—')}
          </div>
        </div>

        <div className="bg-[#14161b] border border-white/10 rounded-xl p-3">
          <div className="text-[11px] text-white/50 mb-1">Saídas Usadas</div>
          <div className="text-xl font-bold font-mono text-amber-400">
            {baseConfig.saidas ?? '—'}
          </div>
        </div>

        <div className="bg-[#14161b] border border-white/10 rounded-xl p-3">
          <div className="text-[11px] text-white/50 mb-1 flex items-center gap-1">
            <Timer className="w-3 h-3 text-cyan-400" />
            <span>Tempo Pausa</span>
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {baseConfig.tempo !== undefined ? (
              <>
                {baseConfig.tempo}
                <span className="text-xs font-normal text-white/40 ml-1">ms</span>
              </>
            ) : (
              '—'
            )}
          </div>
        </div>
      </div>

      {/* Group 1: Sequência de Acendimento */}
      <div className="bg-[#14161b] border border-white/10 rounded-2xl overflow-hidden shadow-lg">
        <div className="px-5 py-3 border-b border-white/10 bg-[#101216] flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
            Ajustes da Sequência e Degraus
          </h3>
        </div>

        <div className="divide-y divide-white/5">
          {/* Registradores */}
          <div
            className={`p-4 transition-colors ${
              isDirty('reg') ? 'bg-amber-500/5' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <span>Registradores 74HC595</span>
                  <code className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-amber-300 font-mono">
                    qtdRegistradores
                  </code>
                </div>
                <div className="text-[11px] text-white/50">
                  Número de CIs 74HC595 cascateados (cada um controla até 8 degraus)
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-lg font-mono font-bold text-white">
                  {currentConfig.reg}
                </span>
                {isDirty('reg') && (
                  <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
                    alterado
                  </span>
                )}
              </div>
            </div>
            <input
              type="range"
              min={1}
              max={8}
              step={1}
              value={currentConfig.reg}
              onChange={(e) => onChange('reg', parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] text-white/40 mt-1">
              <span>1 (8 degraus)</span>
              <span>8 (64 degraus)</span>
            </div>
          </div>

          {/* Saídas Usadas */}
          <div
            className={`p-4 transition-colors ${
              isDirty('saidas') ? 'bg-amber-500/5' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <span>Degraus Ativos</span>
                  <code className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-amber-300 font-mono">
                    qtdSaidas
                  </code>
                </div>
                <div className="text-[11px] text-white/50">
                  Total de degraus físicos conectados (máximo {currentConfig.totalSaidas})
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-lg font-mono font-bold text-amber-400">
                  {currentConfig.saidas}
                </span>
                {isDirty('saidas') && (
                  <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
                    alterado
                  </span>
                )}
              </div>
            </div>
            <input
              type="range"
              min={1}
              max={currentConfig.totalSaidas}
              step={1}
              value={currentConfig.saidas}
              onChange={(e) => onChange('saidas', parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] text-white/40 mt-1">
              <span>1 degrau</span>
              <span>{currentConfig.totalSaidas} degraus máx</span>
            </div>
          </div>

          {/* Tempo Ligado (Pausa) */}
          <div
            className={`p-4 transition-colors ${
              isDirty('tempo') ? 'bg-amber-500/5' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <span>Tempo Ligado</span>
                  <code className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-amber-300 font-mono">
                    tempo
                  </code>
                </div>
                <div className="text-[11px] text-white/50">
                  Pausa com todos os degraus totalmente iluminados antes de iniciar o apagamento
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-lg font-mono font-bold text-white">
                  {(currentConfig.tempo / 1000).toFixed(1)}
                  <span className="text-xs font-normal text-white/40 ml-1">s</span>
                </span>
                {isDirty('tempo') && (
                  <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
                    alterado
                  </span>
                )}
              </div>
            </div>
            <input
              type="range"
              min={100}
              max={30000}
              step={100}
              value={currentConfig.tempo}
              onChange={(e) => onChange('tempo', parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] text-white/40 mt-1">
              <span>0.1s (100ms)</span>
              <span>30 segundos</span>
            </div>
          </div>

          {/* Fade Acender */}
          <div
            className={`p-4 transition-colors ${
              isDirty('fs') ? 'bg-amber-500/5' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <span>Velocidade de Acendimento</span>
                  <code className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-amber-300 font-mono">
                    fadeSaida
                  </code>
                </div>
                <div className="text-[11px] text-white/50">
                  Intervalo entre cada degrau ao acender (menor = mais rápido)
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-lg font-mono font-bold text-white">
                  {currentConfig.fs}
                  <span className="text-xs font-normal text-white/40 ml-1">ms/passo</span>
                </span>
                {isDirty('fs') && (
                  <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
                    alterado
                  </span>
                )}
              </div>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              step={1}
              value={currentConfig.fs}
              onChange={(e) => onChange('fs', parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] text-white/40 mt-1">
              <span>1ms (ultra-rápido)</span>
              <span>50ms (efeito suave)</span>
            </div>
          </div>

          {/* Fade Apagar */}
          <div
            className={`p-4 transition-colors ${
              isDirty('fe') ? 'bg-amber-500/5' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <span>Velocidade de Apagamento</span>
                  <code className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-amber-300 font-mono">
                    fadeEntrada
                  </code>
                </div>
                <div className="text-[11px] text-white/50">
                  Intervalo entre cada degrau ao desligar na sequência
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-lg font-mono font-bold text-white">
                  {currentConfig.fe}
                  <span className="text-xs font-normal text-white/40 ml-1">ms/passo</span>
                </span>
                {isDirty('fe') && (
                  <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
                    alterado
                  </span>
                )}
              </div>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              step={1}
              value={currentConfig.fe}
              onChange={(e) => onChange('fe', parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] text-white/40 mt-1">
              <span>1ms</span>
              <span>50ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Group 2: Sensores e Calibração */}
      <div className="bg-[#14161b] border border-white/10 rounded-2xl overflow-hidden shadow-lg">
        <div className="px-5 py-3 border-b border-white/10 bg-[#101216] flex items-center gap-2">
          <Gauge className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
            Calibração de Sensores e Iluminação
          </h3>
        </div>

        <div className="divide-y divide-white/5">
          {/* Sensibilidade LDR */}
          <div
            className={`p-4 transition-colors ${
              isDirty('ldrLimiar') ? 'bg-amber-500/5' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <span>Limiar Fotossensível LDR</span>
                  <code className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-amber-300 font-mono">
                    ldrLimiar
                  </code>
                </div>
                <div className="text-[11px] text-white/50">
                  Nível de luz para definir noite. Leituras abaixo deste valor ativam a escada.
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-lg font-mono font-bold text-white">
                  {currentConfig.ldrLimiar}
                </span>
                {isDirty('ldrLimiar') && (
                  <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
                    alterado
                  </span>
                )}
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={1023}
              step={1}
              value={currentConfig.ldrLimiar}
              onChange={(e) => onChange('ldrLimiar', parseInt(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] text-white/40 mt-1">
              <span>0 (Muito escuro)</span>
              <span>1023 (Muito claro)</span>
            </div>
          </div>

          {/* Distância Ultrassônica */}
          <div
            className={`p-4 transition-colors ${
              isDirty('distCm') ? 'bg-amber-500/5' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <span>Distância de Ativação HC-SR04</span>
                  <code className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-amber-300 font-mono">
                    distCm
                  </code>
                </div>
                <div className="text-[11px] text-white/50">
                  Distância máxima para detectar uma pessoa se aproximando do primeiro degrau
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-lg font-mono font-bold text-white">
                  {currentConfig.distCm}
                  <span className="text-xs font-normal text-white/40 ml-1">cm</span>
                </span>
                {isDirty('distCm') && (
                  <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
                    alterado
                  </span>
                )}
              </div>
            </div>
            <input
              type="range"
              min={10}
              max={200}
              step={5}
              value={currentConfig.distCm}
              onChange={(e) => onChange('distCm', parseInt(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] text-white/40 mt-1">
              <span>10 cm (bem próximo)</span>
              <span>200 cm (2 metros)</span>
            </div>
          </div>

          {/* Brilho Máximo PWM */}
          <div
            className={`p-4 transition-colors ${
              isDirty('brilhoMax') ? 'bg-amber-500/5' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <span>Brilho Máximo dos LEDs</span>
                  <code className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-amber-300 font-mono">
                    brilhoMax
                  </code>
                </div>
                <div className="text-[11px] text-white/50">
                  Ajuste de intensidade luminosa via sinal PWM no pino OE dos 74HC595
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-lg font-mono font-bold text-amber-400">
                  {Math.round((currentConfig.brilhoMax / 255) * 100)}%
                  <span className="text-xs font-normal text-white/40 ml-1">
                    ({currentConfig.brilhoMax}/255)
                  </span>
                </span>
                {isDirty('brilhoMax') && (
                  <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
                    alterado
                  </span>
                )}
              </div>
            </div>
            <input
              type="range"
              min={10}
              max={255}
              step={5}
              value={currentConfig.brilhoMax}
              onChange={(e) => onChange('brilhoMax', parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] text-white/40 mt-1">
              <span>10 (luz suave noturna)</span>
              <span>255 (potência máxima)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
