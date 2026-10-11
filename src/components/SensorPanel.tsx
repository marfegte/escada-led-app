import React from 'react';
import { Radio, Moon, Sun, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { SystemStatus, StaircaseConfig } from '../types';

interface SensorPanelProps {
  status: SystemStatus;
  config: StaircaseConfig;
  connected: boolean;
  onTrigS1: () => void;
  onTrigS2: () => void;
}

export const SensorPanel: React.FC<SensorPanelProps> = ({
  status,
  config,
  connected,
  onTrigS1,
  onTrigS2,
}) => {
  // LDR Percentage for the bar
  const ldrPct = Math.min(100, Math.max(0, Math.round((status.ldrLive / 1023) * 100)));
  const thresholdPct = Math.min(100, Math.max(0, Math.round((config.ldrLimiar / 1023) * 100)));
  const isDark = status.ldrLive <= config.ldrLimiar;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">
          Sensores Ultrassônicos e LDR
        </h3>
        <span className="text-[11px] text-white/40 flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>Monitoramento em tempo real</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Sensor 1 Card */}
        <div
          className={`relative p-4 rounded-xl border transition-all duration-300 ${
            status.s1Active
              ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
              : 'bg-[#14161b] border-white/10'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-[11px] font-medium text-white/40 mb-0.5">Sensor 1 — Inferior</div>
              <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                <span>Degrau 1 (Base)</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xs text-white/50">Sequência normal (1 → N)</div>
            </div>

            <div
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border flex items-center gap-1.5 ${
                status.s1Active
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-white/5 text-white/40 border-white/10'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  status.s1Active ? 'bg-emerald-400 animate-ping' : 'bg-white/20'
                }`}
              />
              <span>{status.s1Active ? 'Disparado' : 'Aguardando'}</span>
            </div>
          </div>

          <div className="text-[11px] text-white/50 mb-3 flex items-center justify-between">
            <span>Alcance configurado:</span>
            <span className="font-mono text-white/80">{config.distCm} cm</span>
          </div>

          <button
            onClick={onTrigS1}
            disabled={!connected}
            className="w-full py-2 px-3 rounded-lg bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/30 border border-white/10 text-xs font-medium text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-98"
          >
            Disparar Sensor 1
          </button>
        </div>

        {/* Sensor 2 Card */}
        <div
          className={`relative p-4 rounded-xl border transition-all duration-300 ${
            status.s2Active
              ? 'bg-cyan-950/30 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
              : 'bg-[#14161b] border-white/10'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-[11px] font-medium text-white/40 mb-0.5">Sensor 2 — Superior</div>
              <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                <span>Degrau {config.saidas} (Topo)</span>
                <ArrowDownRight className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-xs text-white/50">Sequência reversa (N → 1)</div>
            </div>

            <div
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border flex items-center gap-1.5 ${
                status.s2Active
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-white/5 text-white/40 border-white/10'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  status.s2Active ? 'bg-cyan-400 animate-ping' : 'bg-white/20'
                }`}
              />
              <span>{status.s2Active ? 'Disparado' : 'Aguardando'}</span>
            </div>
          </div>

          <div className="text-[11px] text-white/50 mb-3 flex items-center justify-between">
            <span>Alcance configurado:</span>
            <span className="font-mono text-white/80">{config.distCm} cm</span>
          </div>

          <button
            onClick={onTrigS2}
            disabled={!connected}
            className="w-full py-2 px-3 rounded-lg bg-white/5 hover:bg-cyan-500/10 hover:text-cyan-300 hover:border-cyan-500/30 border border-white/10 text-xs font-medium text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-98"
          >
            Disparar Sensor 2
          </button>
        </div>
      </div>

      {/* Live LDR Sensor Bar Card */}
      <div className="p-4 rounded-xl bg-[#14161b] border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-white">Leitura LDR ao Vivo</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                isDark
                  ? 'bg-indigo-950/50 text-indigo-300 border-indigo-500/30'
                  : 'bg-amber-950/40 text-amber-300 border-amber-500/30'
              }`}
            >
              {isDark ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
              <span>{isDark ? 'Ambiente Escuro (Ativo)' : 'Ambiente Claro (Espera)'}</span>
            </span>
            <span className="font-mono text-xs font-bold text-white bg-white/5 px-2 py-0.5 rounded border border-white/10">
              {status.ldrLive} / 1023
            </span>
          </div>
        </div>

        {/* Visual Bar with Threshold Line */}
        <div className="relative h-3 w-full rounded-full bg-white/10 overflow-hidden my-2">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isDark ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gradient-to-r from-amber-500 to-yellow-400'
            }`}
            style={{ width: `${ldrPct}%` }}
          />
          {/* Threshold marker */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-rose-400 shadow-[0_0_6px_#f43f5e] z-10"
            style={{ left: `${thresholdPct}%` }}
            title={`Limiar configurado: ${config.ldrLimiar}`}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-white/40">
          <span>0 (Escuridão total)</span>
          <span className="text-rose-400 font-medium">Linha: Limiar ({config.ldrLimiar})</span>
          <span>1023 (Luz plena)</span>
        </div>
      </div>
    </div>
  );
};
