import React from 'react';
import { Send, RotateCcw, CheckCircle, Loader2 } from 'lucide-react';

interface ActionsBarProps {
  hasDirtyFields: boolean;
  sending: boolean;
  connected: boolean;
  progressPct: number;
  progressStepName: string;
  onSend: () => void;
  onDiscard: () => void;
}

export const ActionsBar: React.FC<ActionsBarProps> = ({
  hasDirtyFields,
  sending,
  connected,
  progressPct,
  progressStepName,
  onSend,
  onDiscard,
}) => {
  return (
    <div className="space-y-2 sticky bottom-3 z-30">
      <div className="p-3 bg-[#16181f]/95 backdrop-blur-md border border-white/15 rounded-2xl shadow-2xl flex flex-wrap items-center justify-between gap-3">
        {/* Status text */}
        <div className="flex items-center gap-2">
          {sending ? (
            <div className="flex items-center gap-2 text-xs text-amber-300 font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Gravando na EEPROM: {progressStepName}...</span>
            </div>
          ) : hasDirtyFields ? (
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Existem parâmetros alterados prontos para envio.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-white/50">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Configuração sincronizada com a placa.</span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onDiscard}
            disabled={!hasDirtyFields || sending}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Descartar</span>
          </button>

          <button
            onClick={onSend}
            disabled={!hasDirtyFields || sending || !connected}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs shadow-lg shadow-amber-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{sending ? 'Gravando...' : 'Gravar no Arduino ↗'}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {sending && (
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden shadow">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
    </div>
  );
};
