import React from 'react';
import { Power, RefreshCw, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { SystemStatus } from '../types';

interface ConnectionBarProps {
  connected: boolean;
  connectionState: 'ok' | 'err' | 'wait';
  connectionLabel: string;
  status: SystemStatus;
  onConnect: () => void;
  onDisconnect: () => void;
  onReadConfig: () => void;
}

export const ConnectionBar: React.FC<ConnectionBarProps> = ({
  connected,
  connectionState,
  connectionLabel,
  status,
  onConnect,
  onDisconnect,
  onReadConfig,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#14161b] border border-white/10 rounded-2xl shadow-md">
      {/* Status indicator and label */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <div
            className={`w-3.5 h-3.5 rounded-full transition-colors duration-300 ${
              connectionState === 'ok'
                ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]'
                : connectionState === 'wait'
                ? 'bg-amber-500 animate-ping'
                : 'bg-rose-500'
            }`}
          />
          {connectionState === 'ok' && (
            <div className="absolute w-5 h-5 rounded-full bg-emerald-500/30 animate-pulse pointer-events-none" />
          )}
        </div>

        <div>
          <div className="text-xs font-semibold text-white">{connectionLabel}</div>
          <div className="text-[11px] text-white/50">
            {connected
              ? status.sistemaAtivo
                ? 'Escada armada: responderá ao sensor'
                : 'Escada desarmada: modo diurno ou fora do horário'
              : 'Clique em Conectar para iniciar comunicação'}
          </div>
        </div>
      </div>

      {/* System state and action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* System Active Badge */}
        {connected && (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
              status.sistemaAtivo
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-white/5 text-white/50 border-white/10'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                status.sistemaAtivo ? 'bg-emerald-400' : 'bg-white/30'
              }`}
            />
            <span>{status.sistemaAtivo ? 'Sistema Ativo' : 'Sistema Inativo'}</span>
          </span>
        )}

        {!connected ? (
          <button
            onClick={onConnect}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs shadow-md transition-all active:scale-95"
          >
            <Power className="w-3.5 h-3.5" />
            <span>Conectar</span>
          </button>
        ) : (
          <>
            <button
              onClick={onReadConfig}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 text-xs font-medium transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ler config</span>
            </button>

            <button
              onClick={onDisconnect}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-medium transition-all active:scale-95"
            >
              <Power className="w-3.5 h-3.5" />
              <span>Desconectar</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
