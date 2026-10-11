import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, Trash2, Copy, Check, Filter } from 'lucide-react';
import { LogEntry } from '../types';

interface SerialLogConsoleProps {
  logs: LogEntry[];
  connected: boolean;
  onClear: () => void;
  onSendRaw: (cmd: string) => void;
}

export const SerialLogConsole: React.FC<SerialLogConsoleProps> = ({
  logs,
  connected,
  onClear,
  onSendRaw,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || !connected) return;
    onSendRaw(inputVal.trim());
    setInputVal('');
  };

  const copyLogs = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] ${l.type.toUpperCase()}: ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = logs.filter((l) => {
    if (filterType === 'all') return true;
    if (filterType === 'tx') return l.type === 'tx';
    if (filterType === 'err') return l.type === 'err';
    if (filterType === 'ok') return l.type === 'ok';
    if (filterType === 'seq') return l.type === 'seq';
    return true;
  });

  const quickCommands = ['GET_CFG', 'GET_STATUS', 'ALL_ON', 'ALL_OFF', 'TRIG_S1', 'TRIG_S2'];

  return (
    <div className="bg-[#14161b] border border-white/10 rounded-2xl overflow-hidden shadow-lg flex flex-col">
      {/* Console Header */}
      <div className="px-5 py-3 bg-[#101216] border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
            Console Serial & Eventos
          </h3>
          <span className="text-[11px] text-white/40">({logs.length} mensagens)</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter options */}
          <div className="inline-flex p-0.5 bg-white/5 border border-white/10 rounded-lg text-[10px]">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 py-0.5 rounded transition-all ${
                filterType === 'all' ? 'bg-amber-500 text-black font-semibold' : 'text-white/60 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('tx')}
              className={`px-2 py-0.5 rounded transition-all ${
                filterType === 'tx' ? 'bg-amber-500 text-black font-semibold' : 'text-white/60 hover:text-white'
              }`}
            >
              TX
            </button>
            <button
              onClick={() => setFilterType('ok')}
              className={`px-2 py-0.5 rounded transition-all ${
                filterType === 'ok' ? 'bg-amber-500 text-black font-semibold' : 'text-white/60 hover:text-white'
              }`}
            >
              ACK/OK
            </button>
            <button
              onClick={() => setFilterType('err')}
              className={`px-2 py-0.5 rounded transition-all ${
                filterType === 'err' ? 'bg-rose-500 text-white font-semibold' : 'text-white/60 hover:text-white'
              }`}
            >
              Erros
            </button>
          </div>

          <button
            onClick={copyLogs}
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            title="Copiar logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onClear}
            className="p-1.5 text-white/60 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors"
            title="Limpar console"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div
        ref={scrollRef}
        className="h-48 overflow-y-auto p-4 bg-[#0a0b0e] font-mono text-xs space-y-1 select-text divide-y divide-white/[0.02]"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-white/30 italic py-4 text-center">Nenhum evento registrado ainda.</div>
        ) : (
          filteredLogs.map((log) => {
            let color = 'text-white/70';
            if (log.type === 'ok') color = 'text-emerald-400';
            else if (log.type === 'err') color = 'text-rose-400 font-semibold';
            else if (log.type === 'tx') color = 'text-amber-300 font-medium';
            else if (log.type === 'bt') color = 'text-indigo-400';
            else if (log.type === 'seq') color = 'text-cyan-300 font-semibold';
            else if (log.type === 'timer') color = 'text-purple-300';

            return (
              <div key={log.id} className="pt-0.5 flex items-start gap-2 leading-relaxed">
                <span className="text-[10px] text-white/30 select-none shrink-0 font-sans">
                  [{log.timestamp}]
                </span>
                <span className={`break-all ${color}`}>{log.message}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Command Chips */}
      <div className="px-4 py-2 bg-[#0e1014] border-t border-white/5 flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] text-white/40 font-mono">Comandos rápidos:</span>
        {quickCommands.map((cmd) => (
          <button
            key={cmd}
            onClick={() => onSendRaw(cmd)}
            disabled={!connected}
            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 hover:text-amber-300 text-[10px] font-mono text-white/70 border border-white/5 transition-all disabled:opacity-40"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Raw Command Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-[#101216] border-t border-white/10 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={connected ? 'Digite comando manual (ex: GET_CFG, SET_SAIDAS:16)...' : 'Conecte para enviar comandos'}
            disabled={!connected}
            className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-white/30 focus:border-amber-400 focus:outline-none transition-all disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={!connected || !inputVal.trim()}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Enviar</span>
        </button>
      </form>
    </div>
  );
};
