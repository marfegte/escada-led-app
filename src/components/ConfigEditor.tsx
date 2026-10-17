import React, { useState } from 'react';
import {
  Sliders,
  Gauge,
  Timer,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
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
  // Store which settings are currently expanded (all collapsed by default)
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const isDirty = (key: keyof StaircaseConfig) => {
    return baseConfig[key] !== undefined && currentConfig[key] !== baseConfig[key];
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

      {/* Helpful Hint */}
      <div className="px-4 py-2 bg-[#121418] border border-white/10 rounded-xl text-xs text-white/50 flex items-center justify-between">
        <span>💡 Toque em qualquer configuração para abrir ou recolher sua barra de rolagem.</span>
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
          {/* 1. Registradores */}
          <div
            className={`transition-colors ${
              isDirty('reg') ? 'bg-amber-500/5' : ''
            }`}
          >
            {/* Clickable Header */}
            <button
              type="button"
              onClick={() => toggleExpand('reg')}
              className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] transition-colors cursor-pointer select-none"
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <span>Registradores 74HC595</span>
                  <code className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-amber-300 font-mono">
                    qtdRegistradores
                  </code>
                </div>
                <div className="text-[11px] text-white/50 mt-0.5">
                  Número de CIs cascateados (cada um controla até 8 degraus)
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex flex-col items-end">
                  <span className="text-base font-mono font-bold text-white">
                    {currentConfig.reg}
                  </span>
                  {isDirty('reg') && (
                    <span className="text-[9px] text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded-full border border-amber-500/40">
                      alterado
                    </span>
                  )}
                </div>
                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-white/60">
                  {expandedKeys['reg'] ? (
                    <ChevronUp className="w-4 h-4 text-amber-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
            </button>

            {/* Collapsible Slider */}
            {expandedKeys['reg'] && (
              <div className="px-4 pb-4 pt-1 border-t border-white/5 bg-[#101216]/50 animate-in fade-in duration-150">
                <div className="flex justify-between items-center text-xs font-medium text-white mb-2">
                  <span className="text-white/60">Arraste para ajustar CIs:</span>
                  <span className="font-mono text-amber-400 font-bold">{currentConfig.reg} CIs ({currentConfig.reg * 8} saídas máx)</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={1}
                  value={currentConfig.reg}
                  onChange={(e) => onChange('reg', parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-white/40 mt-1.5">
                  <span>1 (8 degraus)</span>
                  <span>8 (64 degraus)</span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Saídas Usadas */}
          <div
            className={`transition-colors ${
              isDirty('saidas') ? 'bg-amber-500/5' : ''
            }`}
          >
            {/* Clickable Header */}
            <button
              type="button"
              onClick={() => toggleExpand('saidas')}
              className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] transition-colors cursor-pointer select-none"
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <span>Degraus Ativos</span>
                  <code className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-amber-300 font-mono">
                    qtdSaidas
                  </code>
                </div>
                <div className="text-[11px] text-white/50 mt-0.5">
                  Total de degraus físicos conectados (máximo {currentConfig.totalSaidas})
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex flex-col items-end">
                  <span className="text-base font-mono font-bold text-amber-400">
                    {currentConfig.saidas}
                  </span>
                  {isDirty('saidas') && (
                    <span className="text-[9px] text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded-full border border-amber-500/40">
                      alterado
                    </span>
                  )}
                </div>
                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-white/60">
                  {expandedKeys['saidas'] ? (
                    <ChevronUp className="w-4 h-4 text-amber-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
            </button>

            {/* Collapsible Slider */}
            {expandedKeys['saidas'] && (
              <div className="px-4 pb-4 pt-1 border-t border-white/5 bg-[#101216]/50 animate-in fade-in duration-150">
                <div className="flex justify-between items-center text-xs font-medium text-white mb-2">
                  <span className="text-white/60">Arraste para ajustar degraus:</span>
                  <span className="font-mono text-amber-400 font-bold">{currentConfig.saidas} degraus</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={currentConfig.totalSaidas}
                  step={1}
                  value={currentConfig.saidas}
                  onChange={(e) => onChange('saidas', parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-white/40 mt-1.5">
                  <span>1 degrau</span>
                  <span>{currentConfig.totalSaidas} degraus máx</span>
                </div>
              </div>
            )}
          </div>

          {/* 3. Tempo Ligado (Pausa) */}
          <div
            className={`transition-colors ${
              isDirty('tempo') ? 'bg-amber-500/5' : ''
            }`}
          >
            {/* Clickable Header */}
            <button
              type="button"
              onClick={() => toggleExpand('tempo')}
              className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] transition-colors cursor-pointer select-none"
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <span>Tempo Ligado</span>
                  <code className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-amber-300 font-mono">
                    tempo
                  </code>
                </div>
                <div className="text-[11px] text-white/50 mt-0.5">
                  Pausa com todos degraus acesos antes de iniciar apagamento
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex flex-col items-end">
                  <span className="text-base font-mono font-bold text-white">
                    {(currentConfig.tempo / 1000).toFixed(1)}s
                  </span>
                  {isDirty('tempo') && (
                    <span className="text-[9px] text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded-full border border-amber-500/40">
                      alterado
                    </span>
                  )}
                </div>
                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-white/60">
                  {expandedKeys['tempo'] ? (
                    <ChevronUp className="w-4 h-4 text-amber-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
            </button>

            {/* Collapsible Slider */}
            {expandedKeys['tempo'] && (
              <div className="px-4 pb-4 pt-1 border-t border-white/5 bg-[#101216]/50 animate-in fade-in duration-150">
                <div className="flex justify-between items-center text-xs font-medium text-white mb-2">
                  <span className="text-white/60">Arraste para ajustar o tempo:</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {(currentConfig.tempo / 1000).toFixed(1)} segundos ({currentConfig.tempo} ms)
                  </span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={30000}
                  step={100}
                  value={currentConfig.tempo}
                  onChange={(e) => onChange('tempo', parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-white/40 mt-1.5">
                  <span>0.1s (100ms)</span>
                  <span>30 segundos</span>
                </div>
              </div>
            )}
          </div>

          {/* 4. Fade Acender */}
          <div
            className={`transition-colors ${
              isDirty('fs') ? 'bg-amber-500/5' : ''
            }`}
          >
            {/* Clickable Header */}
            <button
              type="button"
              onClick={() => toggleExpand('fs')}
              className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] transition-colors cursor-pointer select-none"
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <span>Velocidade de Acendimento</span>
                  <code className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-amber-300 font-mono">
                    fadeSaida
                  </code>
                </div>
                <div className="text-[11px] text-white/50 mt-0.5">
                  Intervalo entre degraus ao acender (menor = mais rápido)
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex flex-col items-end">
                  <span className="text-base font-mono font-bold text-white">
                    {currentConfig.fs} ms
                  </span>
                  {isDirty('fs') && (
                    <span className="text-[9px] text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded-full border border-amber-500/40">
                      alterado
                    </span>
                  )}
                </div>
                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-white/60">
                  {expandedKeys['fs'] ? (
                    <ChevronUp className="w-4 h-4 text-amber-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
            </button>

            {/* Collapsible Slider */}
            {expandedKeys['fs'] && (
              <div className="px-4 pb-4 pt-1 border-t border-white/5 bg-[#101216]/50 animate-in fade-in duration-150">
                <div className="flex justify-between items-center text-xs font-medium text-white mb-2">
                  <span className="text-white/60">Arraste para ajustar velocidade:</span>
                  <span className="font-mono text-amber-400 font-bold">{currentConfig.fs} ms por degrau</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  step={1}
                  value={currentConfig.fs}
                  onChange={(e) => onChange('fs', parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-white/40 mt-1.5">
                  <span>1ms (ultra-rápido)</span>
                  <span>50ms (efeito suave)</span>
                </div>
              </div>
            )}
          </div>

          {/* 5. Fade Apagar */}
          <div
            className={`transition-colors ${
              isDirty('fe') ? 'bg-amber-500/5' : ''
            }`}
          >
            {/* Clickable Header */}
            <button
              type="button"
              onClick={() => toggleExpand('fe')}
              className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] transition-colors cursor-pointer select-none"
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <span>Velocidade de Apagamento</span>
                  <code className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-amber-300 font-mono">
                    fadeEntrada
                  </code>
                </div>
                <div className="text-[11px] text-white/50 mt-0.5">
                  Intervalo entre degraus ao desligar na sequência
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex flex-col items-end">
                  <span className="text-base font-mono font-bold text-white">
                    {currentConfig.fe} ms
                  </span>
                  {isDirty('fe') && (
                    <span className="text-[9px] text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded-full border border-amber-500/40">
                      alterado
                    </span>
                  )}
                </div>
                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-white/60">
                  {expandedKeys['fe'] ? (
                    <ChevronUp className="w-4 h-4 text-amber-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
            </button>

            {/* Collapsible Slider */}
            {expandedKeys['fe'] && (
              <div className="px-4 pb-4 pt-1 border-t border-white/5 bg-[#101216]/50 animate-in fade-in duration-150">
                <div className="flex justify-between items-center text-xs font-medium text-white mb-2">
                  <span className="text-white/60">Arraste para ajustar velocidade:</span>
                  <span className="font-mono text-amber-400 font-bold">{currentConfig.fe} ms por degrau</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  step={1}
                  value={currentConfig.fe}
                  onChange={(e) => onChange('fe', parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-white/40 mt-1.5">
                  <span>1ms</span>
                  <span>50ms</span>
                </div>
              </div>
            )}
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
          {/* 6. Sensibilidade LDR */}
          <div
            className={`transition-colors ${
              isDirty('ldrLimiar') ? 'bg-amber-500/5' : ''
            }`}
          >
            {/* Clickable Header */}
            <button
              type="button"
              onClick={() => toggleExpand('ldrLimiar')}
              className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] transition-colors cursor-pointer select-none"
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <span>Limiar Fotossensível LDR</span>
                  <code className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-amber-300 font-mono">
                    ldrLimiar
                  </code>
                </div>
                <div className="text-[11px] text-white/50 mt-0.5">
                  Nível de luz para definir noite (leituras abaixo ativam a escada)
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex flex-col items-end">
                  <span className="text-base font-mono font-bold text-white">
                    {currentConfig.ldrLimiar}
                  </span>
                  {isDirty('ldrLimiar') && (
                    <span className="text-[9px] text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded-full border border-amber-500/40">
                      alterado
                    </span>
                  )}
                </div>
                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-white/60">
                  {expandedKeys['ldrLimiar'] ? (
                    <ChevronUp className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
            </button>

            {/* Collapsible Slider */}
            {expandedKeys['ldrLimiar'] && (
              <div className="px-4 pb-4 pt-1 border-t border-white/5 bg-[#101216]/50 animate-in fade-in duration-150">
                <div className="flex justify-between items-center text-xs font-medium text-white mb-2">
                  <span className="text-white/60">Arraste para ajustar limiar de luz:</span>
                  <span className="font-mono text-cyan-400 font-bold">{currentConfig.ldrLimiar} (0 - 1023)</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1023}
                  step={1}
                  value={currentConfig.ldrLimiar}
                  onChange={(e) => onChange('ldrLimiar', parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-white/40 mt-1.5">
                  <span>0 (Muito escuro)</span>
                  <span>1023 (Muito claro)</span>
                </div>
              </div>
            )}
          </div>

          {/* 7. Distância Ultrassônica */}
          <div
            className={`transition-colors ${
              isDirty('distCm') ? 'bg-amber-500/5' : ''
            }`}
          >
            {/* Clickable Header */}
            <button
              type="button"
              onClick={() => toggleExpand('distCm')}
              className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] transition-colors cursor-pointer select-none"
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <span>Distância de Ativação HC-SR04</span>
                  <code className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-amber-300 font-mono">
                    distCm
                  </code>
                </div>
                <div className="text-[11px] text-white/50 mt-0.5">
                  Distância máxima para detectar uma pessoa se aproximando
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex flex-col items-end">
                  <span className="text-base font-mono font-bold text-white">
                    {currentConfig.distCm} cm
                  </span>
                  {isDirty('distCm') && (
                    <span className="text-[9px] text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded-full border border-amber-500/40">
                      alterado
                    </span>
                  )}
                </div>
                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-white/60">
                  {expandedKeys['distCm'] ? (
                    <ChevronUp className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
            </button>

            {/* Collapsible Slider */}
            {expandedKeys['distCm'] && (
              <div className="px-4 pb-4 pt-1 border-t border-white/5 bg-[#101216]/50 animate-in fade-in duration-150">
                <div className="flex justify-between items-center text-xs font-medium text-white mb-2">
                  <span className="text-white/60">Arraste para ajustar distância:</span>
                  <span className="font-mono text-cyan-400 font-bold">{currentConfig.distCm} cm</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={200}
                  step={5}
                  value={currentConfig.distCm}
                  onChange={(e) => onChange('distCm', parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-white/40 mt-1.5">
                  <span>10 cm (bem próximo)</span>
                  <span>200 cm (2 metros)</span>
                </div>
              </div>
            )}
          </div>

          {/* 8. Brilho Máximo PWM */}
          <div
            className={`transition-colors ${
              isDirty('brilhoMax') ? 'bg-amber-500/5' : ''
            }`}
          >
            {/* Clickable Header */}
            <button
              type="button"
              onClick={() => toggleExpand('brilhoMax')}
              className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] transition-colors cursor-pointer select-none"
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <span>Brilho Máximo dos LEDs</span>
                  <code className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-amber-300 font-mono">
                    brilhoMax
                  </code>
                </div>
                <div className="text-[11px] text-white/50 mt-0.5">
                  Ajuste de intensidade luminosa via sinal PWM no pino OE
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex flex-col items-end">
                  <span className="text-base font-mono font-bold text-amber-400">
                    {Math.round((currentConfig.brilhoMax / 255) * 100)}%
                  </span>
                  {isDirty('brilhoMax') && (
                    <span className="text-[9px] text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded-full border border-amber-500/40">
                      alterado
                    </span>
                  )}
                </div>
                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-white/60">
                  {expandedKeys['brilhoMax'] ? (
                    <ChevronUp className="w-4 h-4 text-amber-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
            </button>

            {/* Collapsible Slider */}
            {expandedKeys['brilhoMax'] && (
              <div className="px-4 pb-4 pt-1 border-t border-white/5 bg-[#101216]/50 animate-in fade-in duration-150">
                <div className="flex justify-between items-center text-xs font-medium text-white mb-2">
                  <span className="text-white/60">Arraste para ajustar o brilho:</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {Math.round((currentConfig.brilhoMax / 255) * 100)}% ({currentConfig.brilhoMax}/255)
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={255}
                  step={5}
                  value={currentConfig.brilhoMax}
                  onChange={(e) => onChange('brilhoMax', parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-white/40 mt-1.5">
                  <span>10 (luz suave)</span>
                  <span>255 (potência máxima)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
