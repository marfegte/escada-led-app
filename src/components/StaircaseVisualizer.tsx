import React, { useState } from 'react';
import { Lightbulb, LightbulbOff, Play, ArrowUp, ArrowDown, Eye, Grid } from 'lucide-react';
import { AnimationPhase } from '../types';

interface StaircaseVisualizerProps {
  saidas: number;
  leds: number[];
  animPhase: AnimationPhase;
  phaseLabel: string;
  connected: boolean;
  onAllOn: () => void;
  onAllOff: () => void;
  onTrigS1: () => void;
  onTrigS2: () => void;
}

export const StaircaseVisualizer: React.FC<StaircaseVisualizerProps> = ({
  saidas,
  leds,
  animPhase,
  phaseLabel,
  connected,
  onAllOn,
  onAllOff,
  onTrigS1,
  onTrigS2,
}) => {
  const [viewMode, setViewMode] = useState<'3d' | 'grid'>('3d');

  // Count lit leds
  const litCount = leds.filter((v) => v === 1).length;

  return (
    <div className="bg-[#14161b] border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
      {/* Background ambient lighting */}
      <div
        className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 ${
          litCount > 0 ? 'bg-amber-500/15 opacity-100' : 'bg-transparent opacity-0'
        }`}
      />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Visualizador da Escada</h3>
              <span className="text-[11px] text-white/50">
                ({litCount} de {saidas} degraus acesos)
              </span>
            </div>
            <p className="text-xs text-white/50">Simulação e status em tempo real das saídas dos 74HC595</p>
          </div>
        </div>

        {/* View Switcher and Animation Pill */}
        <div className="flex items-center gap-2">
          {phaseLabel && (
            <span
              className={`text-xs px-3 py-1 rounded-full border transition-all ${
                animPhase === 'on' || animPhase === 'off'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                  : animPhase === 'pause'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {phaseLabel}
            </span>
          )}

          <div className="inline-flex p-1 bg-white/5 border border-white/10 rounded-lg">
            <button
              onClick={() => setViewMode('3d')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === '3d'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-white/60 hover:text-white'
              }`}
              title="Visão Escada Arquitetônica"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Degraus</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-white/60 hover:text-white'
              }`}
              title="Matriz Compacta de Saídas"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Matriz</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === '3d' ? (
        <div className="relative my-2 p-5 bg-[#0d0f13] border border-white/10 rounded-xl min-h-[260px] flex flex-col justify-end overflow-hidden">
          {/* Top landing / Sensor 2 indicator */}
          <div className="flex items-center justify-between text-xs text-white/50 pb-2 mb-2 border-b border-white/5">
            <div className="flex items-center gap-1.5 text-cyan-400/80 font-medium text-[11px]">
              <ArrowDown className="w-3.5 h-3.5" />
              <span>Sensor 2 (Superior / Descida)</span>
            </div>
            <span className="text-[11px] font-mono text-white/40">Topo da Escada</span>
          </div>

          {/* Stepped stair treads stack */}
          <div className="flex flex-col gap-1.5 py-2">
            {Array.from({ length: saidas }, (_, i) => {
              const stepIndex = saidas - 1 - i; // Step N at top, Step 1 at bottom
              const isLit = leds[stepIndex] === 1;
              const stepNumber = stepIndex + 1;
              // Width decreases as it ascends to create depth perspective
              const depthPadding = Math.min(60, i * 3);

              return (
                <div
                  key={stepIndex}
                  style={{
                    marginLeft: `${depthPadding}px`,
                    marginRight: `${depthPadding}px`,
                  }}
                  className={`relative group h-7 rounded-md border flex items-center justify-between px-3 transition-all duration-200 select-none ${
                    isLit
                      ? 'bg-gradient-to-r from-amber-500/25 via-amber-400/35 to-amber-500/25 border-amber-400/60 shadow-[0_0_16px_rgba(251,191,36,0.45)]'
                      : 'bg-[#181a20] border-white/5 opacity-80'
                  }`}
                >
                  {/* Step label */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-[11px] font-bold ${
                        isLit ? 'text-amber-200' : 'text-white/40'
                      }`}
                    >
                      #{stepNumber.toString().padStart(2, '0')}
                    </span>
                    <span
                      className={`text-[10px] uppercase tracking-wider ${
                        isLit ? 'text-amber-300/80 font-semibold' : 'text-white/20'
                      }`}
                    >
                      Degrau {stepNumber}
                    </span>
                  </div>

                  {/* Under-tread LED Neon Strip effect */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-200 ${
                        isLit
                          ? 'w-24 bg-amber-300 shadow-[0_0_10px_#f59e0b]'
                          : 'w-10 bg-white/10'
                      }`}
                    />
                    <div
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                        isLit
                          ? 'bg-amber-300 shadow-[0_0_8px_#f59e0b]'
                          : 'bg-white/15'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom landing / Sensor 1 indicator */}
          <div className="flex items-center justify-between text-xs text-white/50 pt-2 mt-2 border-t border-white/5">
            <div className="flex items-center gap-1.5 text-emerald-400/80 font-medium text-[11px]">
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Sensor 1 (Inferior / Subida)</span>
            </div>
            <span className="text-[11px] font-mono text-white/40">Base do Chão</span>
          </div>
        </div>
      ) : (
        /* Matrix Grid View */
        <div className="my-2 p-4 bg-[#0d0f13] border border-white/10 rounded-xl">
          <div className="flex flex-wrap gap-2 justify-start">
            {Array.from({ length: saidas }, (_, i) => {
              const isLit = leds[i] === 1;
              return (
                <div
                  key={i}
                  className={`w-11 h-11 rounded-lg border flex flex-col items-center justify-center font-mono text-xs font-semibold transition-all duration-200 ${
                    isLit
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_14px_rgba(251,191,36,0.35)] scale-105'
                      : 'bg-[#181a20] border-white/10 text-white/40 hover:border-white/20'
                  }`}
                >
                  <span className="text-[10px] text-white/30">D</span>
                  <span>{i + 1}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fast manual controls toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 mt-4 pt-3 border-t border-white/10">
        <button
          onClick={onAllOn}
          disabled={!connected}
          className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-98"
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Ligar Todas</span>
        </button>

        <button
          onClick={onAllOff}
          disabled={!connected}
          className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-98"
        >
          <LightbulbOff className="w-3.5 h-3.5" />
          <span>Desligar Todas</span>
        </button>

        <button
          onClick={onTrigS1}
          disabled={!connected}
          className="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-98"
        >
          <ArrowUp className="w-3.5 h-3.5" />
          <span>Testar Subida (1→N)</span>
        </button>

        <button
          onClick={onTrigS2}
          disabled={!connected}
          className="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-98"
        >
          <ArrowDown className="w-3.5 h-3.5" />
          <span>Testar Descida (N→1)</span>
        </button>
      </div>
    </div>
  );
};
