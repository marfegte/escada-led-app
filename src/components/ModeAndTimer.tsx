import React from 'react';
import { Moon, Clock, RefreshCw } from 'lucide-react';
import { StaircaseConfig } from '../types';

interface ModeAndTimerProps {
  config: StaircaseConfig;
  baseConfig: Partial<StaircaseConfig>;
  connected: boolean;
  onUpdate: (updates: Partial<StaircaseConfig>) => void;
  onSyncTime: (h: number, m: number) => void;
}

export const ModeAndTimer: React.FC<ModeAndTimerProps> = ({
  config,
  baseConfig,
  connected,
  onUpdate,
  onSyncTime,
}) => {
  const noturnoDirty =
    baseConfig.modoNoturno !== undefined && config.modoNoturno !== baseConfig.modoNoturno;
  const timerDirty =
    (baseConfig.timerAtivo !== undefined && config.timerAtivo !== baseConfig.timerAtivo) ||
    (baseConfig.timerOnH !== undefined && config.timerOnH !== baseConfig.timerOnH) ||
    (baseConfig.timerOnM !== undefined && config.timerOnM !== baseConfig.timerOnM) ||
    (baseConfig.timerOffH !== undefined && config.timerOffH !== baseConfig.timerOffH) ||
    (baseConfig.timerOffM !== undefined && config.timerOffM !== baseConfig.timerOffM);

  const handleSyncWithLocalClock = () => {
    const now = new Date();
    onSyncTime(now.getHours(), now.getMinutes());
  };

  return (
    <div className="bg-[#14161b] border border-white/10 rounded-2xl overflow-hidden shadow-lg space-y-0 divide-y divide-white/5">
      {/* Header */}
      <div className="px-5 py-3 bg-[#101216] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
            Modos de Operação & Agendamento
          </h3>
        </div>
      </div>

      {/* Modo Noturno Sempre Ativo */}
      <div className={`p-4 transition-colors ${noturnoDirty ? 'bg-amber-500/5' : ''}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-white flex items-center gap-2">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Modo Noturno Sempre Ativo</span>
              {noturnoDirty && (
                <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
                  alterado
                </span>
              )}
            </div>
            <p className="text-[11px] text-white/50">
              {config.modoNoturno
                ? 'Sempre ativo: a escada dispara ao detectar movimento a qualquer momento (ignora LDR e relógio).'
                : 'Automático: responde às condições do sensor LDR de luz ambiente.'}
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={config.modoNoturno}
              onChange={(e) => onUpdate({ modoNoturno: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>
      </div>

      {/* Temporizador Automático */}
      <div className={`p-4 transition-colors ${timerDirty ? 'bg-amber-500/5' : ''}`}>
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-white flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Temporizador Automático por Horário</span>
              {timerDirty && (
                <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
                  alterado
                </span>
              )}
            </div>
            <p className="text-[11px] text-white/50">
              {config.timerAtivo
                ? 'Habilita o funcionamento da escada somente dentro da janela de horários programada.'
                : 'Desativado: o sistema segue o sensor LDR ou o modo noturno.'}
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={config.timerAtivo}
              onChange={(e) => onUpdate({ timerAtivo: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

        {/* Time select fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Ligar às */}
          <div className="p-3 bg-[#0f1115] border border-white/5 rounded-xl space-y-1.5">
            <span className="text-[11px] text-white/60 font-medium">Ligar às:</span>
            <div className="flex items-center gap-1.5">
              <select
                value={config.timerOnH}
                onChange={(e) => onUpdate({ timerOnH: parseInt(e.target.value) })}
                className="bg-[#181a20] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-amber-400 outline-none"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}h
                  </option>
                ))}
              </select>
              <span className="text-white/40 font-bold">:</span>
              <select
                value={config.timerOnM}
                onChange={(e) => onUpdate({ timerOnM: parseInt(e.target.value) })}
                className="bg-[#181a20] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-amber-400 outline-none"
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}m
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Desligar às */}
          <div className="p-3 bg-[#0f1115] border border-white/5 rounded-xl space-y-1.5">
            <span className="text-[11px] text-white/60 font-medium">Desligar às:</span>
            <div className="flex items-center gap-1.5">
              <select
                value={config.timerOffH}
                onChange={(e) => onUpdate({ timerOffH: parseInt(e.target.value) })}
                className="bg-[#181a20] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-amber-400 outline-none"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}h
                  </option>
                ))}
              </select>
              <span className="text-white/40 font-bold">:</span>
              <select
                value={config.timerOffM}
                onChange={(e) => onUpdate({ timerOffM: parseInt(e.target.value) })}
                className="bg-[#181a20] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-amber-400 outline-none"
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}m
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* RTC Clock Sync button */}
        <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-white/50">
            Sincronizar relógio interno do Arduino com este dispositivo:
          </span>
          <button
            onClick={handleSyncWithLocalClock}
            disabled={!connected}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-98"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sincronizar Agora ({new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
