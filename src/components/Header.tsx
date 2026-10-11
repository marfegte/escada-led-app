import React from 'react';
import { Usb, Bluetooth, Cpu, BookOpen, Layers, ExternalLink, Smartphone } from 'lucide-react';
import { ConnectionMode } from '../types';

interface HeaderProps {
  mode: ConnectionMode;
  onModeChange: (m: ConnectionMode) => void;
  onOpenGuide: () => void;
  onOpenApkGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({ mode, onModeChange, onOpenGuide, onOpenApkGuide }) => {
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <header className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold shadow-lg shadow-amber-500/20">
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="13" width="14" height="2" rx="1" fill="currentColor" opacity=".35" />
              <rect x="2" y="9.5" width="11" height="2" rx="1" fill="currentColor" opacity=".65" />
              <rect x="2" y="6" width="8" height="2" rx="1" fill="currentColor" opacity=".85" />
              <rect x="2" y="2.5" width="5" height="2" rx="1" fill="currentColor" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Escada LED — Configuração
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
                v2.4 Pro
              </span>
            </div>
            <p className="text-xs text-white/50">
              Controle e programação de fita de LED inteligente para degraus via 74HC595
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenApkGuide}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all active:scale-98"
            title="Como compilar e baixar o APK nativo no GitHub Actions"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Gerar APK (Actions)</span>
          </button>

          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir em aba separada para permissão total de Bluetooth/USB"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-medium transition-all active:scale-98"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            <span>Nova Aba ↗</span>
          </a>

          <button
            onClick={onOpenGuide}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-medium transition-all active:scale-98"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Guia & Firmware (.ino)</span>
          </button>
        </div>
      </div>

      {/* Mode selection tabs */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-[#121418] border border-white/10 rounded-xl">
        <button
          onClick={() => onModeChange('usb')}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            mode === 'usb'
              ? 'bg-amber-500 text-black shadow-md'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Usb className="w-3.5 h-3.5" />
          <span>USB / Serial</span>
        </button>

        <button
          onClick={() => onModeChange('bt')}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            mode === 'bt'
              ? 'bg-amber-500 text-black shadow-md'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Bluetooth className="w-3.5 h-3.5" />
          <span>BLE-Nano</span>
        </button>

        <button
          onClick={() => onModeChange('sim')}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            mode === 'sim'
              ? 'bg-amber-500 text-black shadow-md'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Simulador</span>
        </button>
      </div>

      {/* Context info box */}
      <div className="p-3 bg-[#14161b] border border-white/5 rounded-xl text-xs text-white/60 flex items-center justify-between">
        {mode === 'usb' && (
          <span>
            Conexão via <strong className="text-white">Cabo USB</strong> direto (115200 baud). Compatível com Chrome/Edge ≥ 89. Sem necessidade de driver adicional.
          </span>
        )}
        {mode === 'bt' && (
          <span>
            Conexão sem fio via <strong className="text-white">BLE-Nano Bluetooth</strong> (Serviço FFE0 / Char FFE1). Requer Bluetooth ativo no computador ou celular.
          </span>
        )}
        {mode === 'sim' && (
          <span>
            <strong className="text-amber-300">Modo Simulador Ativo</strong>: Simula um Arduino Nano virtual com 74HC595 na memória, permitindo testar e visualizar todas animações e configurações sem placa física!
          </span>
        )}
      </div>
    </header>
  );
};
