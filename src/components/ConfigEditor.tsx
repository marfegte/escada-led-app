import React, { useState } from 'react';
import {
  Sliders,
  Sun,
  Gauge,
  Timer,
  Layers,
  ShieldCheck,
  Eye,
  EyeOff,
  Plus,
  Minus,
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
  // Hide sliders by default to prevent accidental swipes on mobile
  const [showSliders, setShowSliders] = useState<boolean>(false);

  const isDirty = (key: keyof StaircaseConfig) => {
    return baseConfig[key] !== undefined && currentConfig[key] !== baseConfig[key];
  };

  const adjustValue = (
    key: keyof StaircaseConfig,
    delta: number,
    min: number,
    max: number
  ) => {
    const current = (currentConfig[key] as number) ?? min;
    const next = Math.max(min, Math.min(max, current + delta));
    onChange(key, next);
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

      {/* Accidental touch protection banner with toggle */}
      <div className="p-3 bg-[#121418] border border-white/10 rounded-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white flex items-center gap-2">
              <span>Modo Toque Seguro</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {showSliders ? 'Rolagens Visíveis' : 'Rolagens Ocultas'}
              </span>
            </div>
            <p className="text-[11px] text-white/50">
              {showSliders
                ? 'Barras visíveis. Cuidado ao rolar a tela para não alterar valores sem querer.'
                : 'Barras de rolagem ocultas! Use os botões [+] e [-] para ajustar com precisão.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowSliders(!showSliders)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 shrink-0 ${
            showSliders
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/10'
          }`}
        >
          {showSliders ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">
            {showSliders ? 'Ocultar Rolagens' : 'Mostrar Rolagens'}
          </span>
        </button>
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
                  Número de CIs cascateados (cada um controla até 8 degraus)
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

            {/* Tactile Button Steppers */}
            <div className="flex items-center gap-2 my-2">
              <button
                type="button"
                onClick={() => adjustValue('reg', -1, 1, 8)}
                disabled={currentConfig.reg <= 1}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Minus className="w-3.5 h-3.5" />
                <span>-1 CI</span>
              </button>

              <div className="px-4 py-2 rounded-xl bg-[#0e1014] border border-white/10 font-mono text-xs font-bold text-amber-400 min-w-[70px] text-center">
                {currentConfig.reg} ({currentConfig.reg * 8} deg)
              </div>

              <button
                type="button"
                onClick={() => adjustValue('reg', 1, 1, 8)}
                disabled={currentConfig.reg >= 8}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+1 CI</span>
              </button>
            </div>

            {/* Optional Slider (visible only if user explicitly toggles it) */}
            {showSliders && (
              <div className="pt-2 animate-in fade-in duration-150">
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
            )}
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

            {/* Tactile Button Steppers with Quick Steps */}
            <div className="flex items-center gap-2 my-2">
              <button
                type="button"
                onClick={() => adjustValue('saidas', -5, 1, currentConfig.totalSaidas)}
                disabled={currentConfig.saidas <= 1}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white/70 font-semibold text-xs transition-all active:scale-95"
              >
                -5
              </button>

              <button
                type="button"
                onClick={() => adjustValue('saidas', -1, 1, currentConfig.totalSaidas)}
                disabled={currentConfig.saidas <= 1}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
              >
                <Minus className="w-3.5 h-3.5" />
                <span>-1</span>
              </button>

              <div className="px-4 py-2 rounded-xl bg-[#0e1014] border border-white/10 font-mono text-xs font-bold text-amber-400 min-w-[70px] text-center">
                {currentConfig.saidas} deg
              </div>

              <button
                type="button"
                onClick={() => adjustValue('saidas', 1, 1, currentConfig.totalSaidas)}
                disabled={currentConfig.saidas >= currentConfig.totalSaidas}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+1</span>
              </button>

              <button
                type="button"
                onClick={() => adjustValue('saidas', 5, 1, currentConfig.totalSaidas)}
                disabled={currentConfig.saidas >= currentConfig.totalSaidas}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white/70 font-semibold text-xs transition-all active:scale-95"
              >
                +5
              </button>
            </div>

            {/* Optional Slider */}
            {showSliders && (
              <div className="pt-2 animate-in fade-in duration-150">
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
            )}
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
                  Pausa com todos os degraus acesos antes de iniciar o apagamento
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

            {/* Tactile Button Steppers with Seconds and Half-Seconds */}
            <div className="flex items-center gap-2 my-2">
              <button
                type="button"
                onClick={() => adjustValue('tempo', -1000, 100, 30000)}
                disabled={currentConfig.tempo <= 100}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white/70 font-semibold text-xs transition-all active:scale-95"
              >
                -1s
              </button>

              <button
                type="button"
                onClick={() => adjustValue('tempo', -500, 100, 30000)}
                disabled={currentConfig.tempo <= 100}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
              >
                <Minus className="w-3.5 h-3.5" />
                <span>-0.5s</span>
              </button>

              <div className="px-4 py-2 rounded-xl bg-[#0e1014] border border-white/10 font-mono text-xs font-bold text-amber-400 min-w-[70px] text-center">
                {(currentConfig.tempo / 1000).toFixed(1)}s
              </div>

              <button
                type="button"
                onClick={() => adjustValue('tempo', 500, 100, 30000)}
                disabled={currentConfig.tempo >= 30000}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+0.5s</span>
              </button>

              <button
                type="button"
                onClick={() => adjustValue('tempo', 1000, 100, 30000)}
                disabled={currentConfig.tempo >= 30000}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white/70 font-semibold text-xs transition-all active:scale-95"
              >
                +1s
              </button>
            </div>

            {/* Optional Slider */}
            {showSliders && (
              <div className="pt-2 animate-in fade-in duration-150">
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
            )}
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

            {/* Tactile Steppers */}
            <div className="flex items-center gap-2 my-2">
              <button
                type="button"
                onClick={() => adjustValue('fs', -5, 1, 50)}
                disabled={currentConfig.fs <= 1}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white/70 font-semibold text-xs transition-all active:scale-95"
              >
                -5ms
              </button>

              <button
                type="button"
                onClick={() => adjustValue('fs', -1, 1, 50)}
                disabled={currentConfig.fs <= 1}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
              >
                <Minus className="w-3.5 h-3.5" />
                <span>-1ms</span>
              </button>

              <div className="px-4 py-2 rounded-xl bg-[#0e1014] border border-white/10 font-mono text-xs font-bold text-amber-400 min-w-[70px] text-center">
                {currentConfig.fs} ms
              </div>

              <button
                type="button"
                onClick={() => adjustValue('fs', 1, 1, 50)}
                disabled={currentConfig.fs >= 50}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+1ms</span>
              </button>

              <button
                type="button"
                onClick={() => adjustValue('fs', 5, 1, 50)}
                disabled={currentConfig.fs >= 50}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white/70 font-semibold text-xs transition-all active:scale-95"
              >
                +5ms
              </button>
            </div>

            {/* Optional Slider */}
            {showSliders && (
              <div className="pt-2 animate-in fade-in duration-150">
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
            )}
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

            {/* Tactile Steppers */}
            <div className="flex items-center gap-2 my-2">
              <button
                type="button"
                onClick={() => adjustValue('fe', -5, 1, 50)}
                disabled={currentConfig.fe <= 1}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white/70 font-semibold text-xs transition-all active:scale-95"
              >
                -5ms
              </button>

              <button
                type="button"
                onClick={() => adjustValue('fe', -1, 1, 50)}
                disabled={currentConfig.fe <= 1}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
              >
                <Minus className="w-3.5 h-3.5" />
                <span>-1ms</span>
              </button>

              <div className="px-4 py-2 rounded-xl bg-[#0e1014] border border-white/10 font-mono text-xs font-bold text-amber-400 min-w-[70px] text-center">
                {currentConfig.fe} ms
              </div>

              <button
                type="button"
                onClick={() => adjustValue('fe', 1, 1, 50)}
                disabled={currentConfig.fe >= 50}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+1ms</span>
              </button>

              <button
                type="button"
                onClick={() => adjustValue('fe', 5, 1, 50)}
                disabled={currentConfig.fe >= 50}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white/70 font-semibold text-xs transition-all active:scale-95"
              >
                +5ms
              </button>
            </div>

            {/* Optional Slider */}
            {showSliders && (
              <div className="pt-2 animate-in fade-in duration-150">
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

            {/* Tactile Steppers */}
            <div className="flex items-center gap-2 my-2">
              <button
                type="button"
                onClick={() => adjustValue('ldrLimiar', -50, 0, 1023)}
                disabled={currentConfig.ldrLimiar <= 0}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white/70 font-semibold text-xs transition-all active:scale-95"
              >
                -50
              </button>

              <button
                type="button"
                onClick={() => adjustValue('ldrLimiar', -10, 0, 1023)}
                disabled={currentConfig.ldrLimiar <= 0}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
              >
                <Minus className="w-3.5 h-3.5" />
                <span>-10</span>
              </button>

              <div className="px-4 py-2 rounded-xl bg-[#0e1014] border border-white/10 font-mono text-xs font-bold text-cyan-400 min-w-[70px] text-center">
                {currentConfig.ldrLimiar}
              </div>

              <button
                type="button"
                onClick={() => adjustValue('ldrLimiar', 10, 0, 1023)}
                disabled={currentConfig.ldrLimiar >= 1023}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+10</span>
              </button>

              <button
                type="button"
                onClick={() => adjustValue('ldrLimiar', 50, 0, 1023)}
                disabled={currentConfig.ldrLimiar >= 1023}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white/70 font-semibold text-xs transition-all active:scale-95"
              >
                +50
              </button>
            </div>

            {/* Optional Slider */}
            {showSliders && (
              <div className="pt-2 animate-in fade-in duration-150">
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
            )}
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
                  Distância máxima para detectar uma pessoa se aproximando
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

            {/* Tactile Steppers */}
            <div className="flex items-center gap-2 my-2">
              <button
                type="button"
                onClick={() => adjustValue('distCm', -20, 10, 200)}
                disabled={currentConfig.distCm <= 10}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white/70 font-semibold text-xs transition-all active:scale-95"
              >
                -20cm
              </button>

              <button
                type="button"
                onClick={() => adjustValue('distCm', -5, 10, 200)}
                disabled={currentConfig.distCm <= 10}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
              >
                <Minus className="w-3.5 h-3.5" />
                <span>-5cm</span>
              </button>

              <div className="px-4 py-2 rounded-xl bg-[#0e1014] border border-white/10 font-mono text-xs font-bold text-cyan-400 min-w-[70px] text-center">
                {currentConfig.distCm} cm
              </div>

              <button
                type="button"
                onClick={() => adjustValue('distCm', 5, 10, 200)}
                disabled={currentConfig.distCm >= 200}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+5cm</span>
              </button>

              <button
                type="button"
                onClick={() => adjustValue('distCm', 20, 10, 200)}
                disabled={currentConfig.distCm >= 200}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white/70 font-semibold text-xs transition-all active:scale-95"
              >
                +20cm
              </button>
            </div>

            {/* Optional Slider */}
            {showSliders && (
              <div className="pt-2 animate-in fade-in duration-150">
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
            )}
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
                  Ajuste de intensidade luminosa via sinal PWM no pino OE
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

            {/* Tactile Steppers */}
            <div className="flex items-center gap-2 my-2">
              <button
                type="button"
                onClick={() => adjustValue('brilhoMax', -25, 10, 255)}
                disabled={currentConfig.brilhoMax <= 10}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white/70 font-semibold text-xs transition-all active:scale-95"
              >
                -10%
              </button>

              <button
                type="button"
                onClick={() => adjustValue('brilhoMax', -5, 10, 255)}
                disabled={currentConfig.brilhoMax <= 10}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
              >
                <Minus className="w-3.5 h-3.5" />
                <span>-2%</span>
              </button>

              <div className="px-4 py-2 rounded-xl bg-[#0e1014] border border-white/10 font-mono text-xs font-bold text-amber-400 min-w-[70px] text-center">
                {Math.round((currentConfig.brilhoMax / 255) * 100)}%
              </div>

              <button
                type="button"
                onClick={() => adjustValue('brilhoMax', 5, 10, 255)}
                disabled={currentConfig.brilhoMax >= 255}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white font-semibold text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+2%</span>
              </button>

              <button
                type="button"
                onClick={() => adjustValue('brilhoMax', 25, 10, 255)}
                disabled={currentConfig.brilhoMax >= 255}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white/70 font-semibold text-xs transition-all active:scale-95"
              >
                +10%
              </button>
            </div>

            {/* Optional Slider */}
            {showSliders && (
              <div className="pt-2 animate-in fade-in duration-150">
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
