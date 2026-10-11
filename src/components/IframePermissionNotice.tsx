import React, { useState } from 'react';
import { ExternalLink, Copy, Check, ShieldAlert, Cpu, X } from 'lucide-react';

interface IframePermissionNoticeProps {
  blockedFeature: 'bluetooth' | 'serial' | null;
  onDismiss: () => void;
  onUseSimulator: () => void;
}

export const IframePermissionNotice: React.FC<IframePermissionNoticeProps> = ({
  blockedFeature,
  onDismiss,
  onUseSimulator,
}) => {
  const [copied, setCopied] = useState(false);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  if (!blockedFeature) return null;

  const featureName = blockedFeature === 'bluetooth' ? 'Bluetooth (BLE-Nano)' : 'USB / Serial';

  const copyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl shadow-xl relative animate-in fade-in slide-in-from-top-2 duration-300">
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
        title="Fechar aviso"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3.5 pr-6">
        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0 mt-0.5">
          <ShieldAlert className="w-5 h-5" />
        </div>

        <div className="space-y-2 flex-1">
          <div>
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <span>Acesso ao {featureName} bloqueado pelo visualizador</span>
            </h4>
            <p className="text-xs text-white/70 mt-1 leading-relaxed">
              O navegador impede conexões de hardware (Web Bluetooth e Web Serial) dentro de janelas embutidas (iframes).
              Para conectar fisicamente ao seu Arduino ou BLE-Nano, abra este aplicativo diretamente em uma <strong>nova aba do navegador</strong>:
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-all shadow-md active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir em Nova Aba Direta ↗</span>
            </a>

            <button
              onClick={copyUrl}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 transition-all active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Link Copiado!' : 'Copiar URL Direta'}</span>
            </button>

            <button
              onClick={() => {
                onUseSimulator();
                onDismiss();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-amber-300 text-xs font-medium border border-amber-500/20 transition-all active:scale-95"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Testar com Simulador Virtual</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
