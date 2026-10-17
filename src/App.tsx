import React, { useState, useEffect, useRef, useCallback } from 'react';
import { deviceService } from './services/deviceConnection';
import { StaircaseConfig, SystemStatus, LogEntry, ConnectionMode, AnimationPhase } from './types';
import { Header } from './components/Header';
import { ConnectionBar } from './components/ConnectionBar';
import { SensorPanel } from './components/SensorPanel';
import { StaircaseVisualizer } from './components/StaircaseVisualizer';
import { ConfigEditor } from './components/ConfigEditor';
import { ModeAndTimer } from './components/ModeAndTimer';
import { ActionsBar } from './components/ActionsBar';
import { SerialLogConsole } from './components/SerialLogConsole';
import { FirmwareGuideModal } from './components/FirmwareGuideModal';
import { IframePermissionNotice } from './components/IframePermissionNotice';
import { ApkGuideModal } from './components/ApkGuideModal';
import { BluetoothScannerModal } from './components/BluetoothScannerModal';

export default function App() {
  const [mode, setMode] = useState<ConnectionMode>('bt');
  const [connected, setConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'ok' | 'err' | 'wait'>('err');
  const [connectionLabel, setConnectionLabel] = useState('Desconectado');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isApkGuideOpen, setIsApkGuideOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState<'bluetooth' | 'serial' | null>(null);

  // Configuration state
  const [config, setConfig] = useState<StaircaseConfig>({
    reg: 3,
    totalSaidas: 24,
    saidas: 15,
    tempo: 5000,
    fs: 5,
    fe: 15,
    ldrLimiar: 10,
    distCm: 50,
    brilhoMax: 100,
    modoNoturno: false,
    timerAtivo: false,
    timerOnH: 18,
    timerOnM: 0,
    timerOffH: 6,
    timerOffM: 0,
  });

  const [baseConfig, setBaseConfig] = useState<Partial<StaircaseConfig>>({});

  // System status state
  const [status, setStatus] = useState<SystemStatus>({
    s1Active: false,
    s2Active: false,
    leds: new Array(15).fill(0),
    ldrLive: 25,
    sistemaAtivo: false,
  });

  // Animation state
  const [animPhase, setAnimPhase] = useState<AnimationPhase>('idle');
  const [phaseLabel, setPhaseLabel] = useState('');

  // Logs
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      message: 'Painel inicializado. Conexão Bluetooth BLE-Nano pronta para pareamento.',
      type: 'info',
    },
  ]);

  // Saving state
  const [sending, setSending] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [progressStepName, setProgressStepName] = useState('');

  const animRef = useRef<boolean>(false);

  // Add Log utility
  const addLog = useCallback((msg: string, type: LogEntry['type'] = 'info') => {
    setLogs((prev) => {
      const newEntry: LogEntry = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        message: msg,
        type,
      };
      const updated = [...prev, newEntry];
      return updated.length > 250 ? updated.slice(updated.length - 250) : updated;
    });
  }, []);

  // Check dirty fields
  const hasDirtyFields =
    (baseConfig.reg !== undefined && config.reg !== baseConfig.reg) ||
    (baseConfig.saidas !== undefined && config.saidas !== baseConfig.saidas) ||
    (baseConfig.tempo !== undefined && config.tempo !== baseConfig.tempo) ||
    (baseConfig.fs !== undefined && config.fs !== baseConfig.fs) ||
    (baseConfig.fe !== undefined && config.fe !== baseConfig.fe) ||
    (baseConfig.ldrLimiar !== undefined && config.ldrLimiar !== baseConfig.ldrLimiar) ||
    (baseConfig.distCm !== undefined && config.distCm !== baseConfig.distCm) ||
    (baseConfig.brilhoMax !== undefined && config.brilhoMax !== baseConfig.brilhoMax) ||
    (baseConfig.modoNoturno !== undefined && config.modoNoturno !== baseConfig.modoNoturno) ||
    (baseConfig.timerAtivo !== undefined && config.timerAtivo !== baseConfig.timerAtivo) ||
    (baseConfig.timerOnH !== undefined && config.timerOnH !== baseConfig.timerOnH) ||
    (baseConfig.timerOnM !== undefined && config.timerOnM !== baseConfig.timerOnM) ||
    (baseConfig.timerOffH !== undefined && config.timerOffH !== baseConfig.timerOffH) ||
    (baseConfig.timerOffM !== undefined && config.timerOffM !== baseConfig.timerOffM);

  // Setup device service listeners
  useEffect(() => {
    deviceService.onLog = (msg, type) => addLog(msg, type);

    deviceService.onConnectionChange = (conn, label, st) => {
      setConnected(conn);
      setConnectionLabel(label);
      setConnectionState(st);
    };

    deviceService.onConfigReceived = (cfg) => {
      setConfig(cfg);
      setBaseConfig(cfg);
      // Synchronize leds array size
      setStatus((prev) => {
        const newLeds =
          prev.leds.length === cfg.saidas ? prev.leds : new Array(cfg.saidas).fill(0);
        return { ...prev, leds: newLeds };
      });
    };

    deviceService.onStatusReceived = (st) => {
      if (animRef.current) {
        // While animating sequence, don't overwrite the live stepping leds
        setStatus((prev) => ({
          ...prev,
          s1Active: st.s1Active,
          s2Active: st.s2Active,
          ldrLive: st.ldrLive,
          sistemaAtivo: st.sistemaAtivo,
        }));
      } else {
        setStatus(st);
      }
    };

    deviceService.onSeqEvent = (evt) => {
      if (evt === 'S1_START') {
        runClientAnimation(1);
      } else if (evt === 'S2_START') {
        runClientAnimation(-1);
      } else if (evt === 'S1_END' || evt === 'S2_END') {
        animRef.current = false;
        setAnimPhase('idle');
        setPhaseLabel('Concluído');
        setTimeout(() => setPhaseLabel(''), 3000);
        setTimeout(() => deviceService.sendCmd('GET_STATUS'), 200);
      }
    };

    deviceService.onTimerEvent = (evt) => {
      addLog(`Evento Temporizador: Sistema ${evt === 'ON' ? 'LIGADO' : 'DESLIGADO'}`, 'timer');
    };

    deviceService.onPermissionBlocked = (feat) => {
      setBlockedFeature(feat);
    };

    deviceService.onRequestScannerModal = () => {
      setIsScannerModalOpen(true);
    };

    deviceService.setMode('bt');
  }, [addLog]);

  // Client animation runner matching hardware timing
  const runClientAnimation = async (dir: 1 | -1) => {
    animRef.current = true;
    const total = config.saidas;
    const fadeS = config.fs;
    const fadeE = config.fe;
    const pause = config.tempo;

    setAnimPhase('on');
    setPhaseLabel(dir === 1 ? `Acendendo 1 → ${total}` : `Acendendo ${total} → 1`);

    const order =
      dir === 1
        ? Array.from({ length: total }, (_, i) => i)
        : Array.from({ length: total }, (_, i) => total - 1 - i);

    // Initial off
    setStatus((prev) => ({ ...prev, leds: new Array(total).fill(0) }));

    const stepMs = Math.max(35, fadeS * 35);
    for (const idx of order) {
      if (!animRef.current) break;
      setStatus((prev) => {
        const next = [...prev.leds];
        next[idx] = 1;
        return { ...prev, leds: next };
      });
      await new Promise((r) => setTimeout(r, stepMs));
    }

    if (!animRef.current) return;
    setAnimPhase('pause');
    setPhaseLabel(`Pausa (${(pause / 1000).toFixed(1)}s)`);
    await new Promise((r) => setTimeout(r, pause));

    if (!animRef.current) return;
    setAnimPhase('off');
    setPhaseLabel(dir === 1 ? `Apagando 1 → ${total}` : `Apagando ${total} → 1`);

    const fadeOutStepMs = Math.max(35, fadeE * 35);
    for (const idx of order) {
      if (!animRef.current) break;
      setStatus((prev) => {
        const next = [...prev.leds];
        next[idx] = 0;
        return { ...prev, leds: next };
      });
      await new Promise((r) => setTimeout(r, fadeOutStepMs));
    }

    animRef.current = false;
    setAnimPhase('idle');
    setPhaseLabel('Concluído');
    setTimeout(() => setPhaseLabel(''), 3000);
  };

  // Periodic status poll
  useEffect(() => {
    const timer = setInterval(() => {
      if (deviceService.isConnected() && animPhase === 'idle' && !sending) {
        deviceService.sendCmd('GET_STATUS');
      }
    }, 4500);
    return () => clearInterval(timer);
  }, [animPhase, sending]);

  // Mode change
  const handleModeChange = (newMode: ConnectionMode) => {
    deviceService.setMode(newMode);
    setMode(newMode);
  };

  // Connection triggers
  const handleConnect = async () => {
    await deviceService.connect();
  };

  const handleDisconnect = async () => {
    animRef.current = false;
    await deviceService.disconnect();
  };

  const handleReadConfig = async () => {
    await deviceService.sendCmd('GET_CFG');
    setTimeout(() => deviceService.sendCmd('GET_STATUS'), 300);
  };

  // Sliders change
  const handleConfigChange = (key: keyof StaircaseConfig, val: number) => {
    setConfig((prev) => {
      const next = { ...prev, [key]: val };
      if (key === 'reg') {
        next.totalSaidas = val * 8;
        if (next.saidas > next.totalSaidas) {
          next.saidas = next.totalSaidas;
        }
      }
      return next;
    });
  };

  const handleUpdate = (updates: Partial<StaircaseConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  // Discard changes
  const handleDiscard = () => {
    if (Object.keys(baseConfig).length === 0) return;
    setConfig((prev) => ({
      ...prev,
      ...baseConfig,
    }));
    addLog('Alterações descartadas. Restaurados valores da placa.', 'info');
  };

  // Batch Save changes
  const handleSendChanges = async () => {
    if (sending || !connected) return;
    setSending(true);
    setProgressPct(0);

    const commandsToSend: { cmd: string; name: string }[] = [];

    if (baseConfig.reg !== undefined && config.reg !== baseConfig.reg) {
      commandsToSend.push({ cmd: `SET_REG:${config.reg}`, name: 'Registradores' });
    }
    if (baseConfig.saidas !== undefined && config.saidas !== baseConfig.saidas) {
      commandsToSend.push({ cmd: `SET_SAIDAS:${config.saidas}`, name: 'Degraus' });
    }
    if (baseConfig.tempo !== undefined && config.tempo !== baseConfig.tempo) {
      commandsToSend.push({ cmd: `SET_TEMPO:${config.tempo}`, name: 'Tempo Ligado' });
    }
    if (baseConfig.fs !== undefined && config.fs !== baseConfig.fs) {
      commandsToSend.push({ cmd: `SET_FADE_S:${config.fs}`, name: 'Fade Acender' });
    }
    if (baseConfig.fe !== undefined && config.fe !== baseConfig.fe) {
      commandsToSend.push({ cmd: `SET_FADE_E:${config.fe}`, name: 'Fade Apagar' });
    }
    if (baseConfig.ldrLimiar !== undefined && config.ldrLimiar !== baseConfig.ldrLimiar) {
      commandsToSend.push({ cmd: `SET_LDR:${config.ldrLimiar}`, name: 'Limiar LDR' });
    }
    if (baseConfig.distCm !== undefined && config.distCm !== baseConfig.distCm) {
      commandsToSend.push({ cmd: `SET_DIST:${config.distCm}`, name: 'Distância' });
    }
    if (baseConfig.brilhoMax !== undefined && config.brilhoMax !== baseConfig.brilhoMax) {
      commandsToSend.push({ cmd: `SET_BRILHO:${config.brilhoMax}`, name: 'Brilho PWM' });
    }
    if (baseConfig.modoNoturno !== undefined && config.modoNoturno !== baseConfig.modoNoturno) {
      commandsToSend.push({
        cmd: `SET_NOTURNO:${config.modoNoturno ? 1 : 0}`,
        name: 'Modo Noturno',
      });
    }
    if (baseConfig.timerAtivo !== undefined && config.timerAtivo !== baseConfig.timerAtivo) {
      commandsToSend.push({
        cmd: `SET_TIMER_ATIVO:${config.timerAtivo ? 1 : 0}`,
        name: 'Timer Ativo',
      });
    }
    if (
      (baseConfig.timerOnH !== undefined && config.timerOnH !== baseConfig.timerOnH) ||
      (baseConfig.timerOnM !== undefined && config.timerOnM !== baseConfig.timerOnM)
    ) {
      const hStr = config.timerOnH.toString().padStart(2, '0');
      const mStr = config.timerOnM.toString().padStart(2, '0');
      commandsToSend.push({ cmd: `SET_TIMER_ON:${hStr}:${mStr}`, name: 'Hora Ligar' });
    }
    if (
      (baseConfig.timerOffH !== undefined && config.timerOffH !== baseConfig.timerOffH) ||
      (baseConfig.timerOffM !== undefined && config.timerOffM !== baseConfig.timerOffM)
    ) {
      const hStr = config.timerOffH.toString().padStart(2, '0');
      const mStr = config.timerOffM.toString().padStart(2, '0');
      commandsToSend.push({ cmd: `SET_TIMER_OFF:${hStr}:${mStr}`, name: 'Hora Desligar' });
    }

    const total = commandsToSend.length;
    let completed = 0;

    for (const item of commandsToSend) {
      setProgressStepName(item.name);
      await deviceService.sendCmd(item.cmd);
      const ackCmd = item.cmd.split(':')[0];
      const ok = await deviceService.waitForAck(ackCmd, 4000);
      completed++;
      setProgressPct(Math.round((completed / total) * 100));

      if (!ok) {
        addLog(`Aviso: Sem confirmação de ACK para ${ackCmd}`, 'err');
      }
      // Brief pause between commands
      await new Promise((r) => setTimeout(r, 60));
    }

    addLog('Todos os parâmetros gravados! Atualizando configuração...', 'ok');
    await deviceService.sendCmd('GET_CFG');

    setTimeout(() => {
      setSending(false);
      setProgressPct(0);
      setProgressStepName('');
    }, 1200);
  };

  // Sync clock
  const handleSyncTime = async (h: number, m: number) => {
    const hStr = h.toString().padStart(2, '0');
    const mStr = m.toString().padStart(2, '0');
    await deviceService.sendCmd(`SET_HORA:${hStr}:${mStr}`);
    addLog(`Horário do Arduino sincronizado: ${hStr}:${mStr}`, 'ok');
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-[#e2e4e9] p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Header with Mode Switcher & Guide Button */}
        <Header
          mode={mode}
          onModeChange={handleModeChange}
          onOpenGuide={() => setIsGuideOpen(true)}
          onOpenApkGuide={() => setIsApkGuideOpen(true)}
        />

        {/* Iframe Permission Warning if blocked by Permissions Policy */}
        <IframePermissionNotice
          blockedFeature={blockedFeature}
          onDismiss={() => setBlockedFeature(null)}
          onUseSimulator={() => {
            handleModeChange('sim');
            deviceService.connect();
          }}
        />

        {/* Connection Bar */}
        <ConnectionBar
          connected={connected}
          connectionState={connectionState}
          connectionLabel={connectionLabel}
          status={status}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onReadConfig={handleReadConfig}
        />

        {/* Sensors Status and Live LDR reading */}
        <SensorPanel
          status={status}
          config={config}
          connected={connected}
          onTrigS1={() => deviceService.sendCmd('TRIG_S1')}
          onTrigS2={() => deviceService.sendCmd('TRIG_S2')}
        />

        {/* Staircase Visualizer & Outputs Status */}
        <StaircaseVisualizer
          saidas={config.saidas}
          leds={status.leds}
          animPhase={animPhase}
          phaseLabel={phaseLabel}
          connected={connected}
          onAllOn={() => deviceService.sendCmd('ALL_ON')}
          onAllOff={() => deviceService.sendCmd('ALL_OFF')}
          onTrigS1={() => deviceService.sendCmd('TRIG_S1')}
          onTrigS2={() => deviceService.sendCmd('TRIG_S2')}
        />

        {/* Configuration Sliders & Summary Cards */}
        <ConfigEditor
          currentConfig={config}
          baseConfig={baseConfig}
          onChange={handleConfigChange}
        />

        {/* Modes & Schedule Timer */}
        <ModeAndTimer
          config={config}
          baseConfig={baseConfig}
          connected={connected}
          onUpdate={handleUpdate}
          onSyncTime={handleSyncTime}
        />

        {/* Floating/Sticky Action Bar: Save / Discard */}
        <ActionsBar
          hasDirtyFields={hasDirtyFields}
          sending={sending}
          connected={connected}
          progressPct={progressPct}
          progressStepName={progressStepName}
          onSend={handleSendChanges}
          onDiscard={handleDiscard}
        />

        {/* Serial Log Terminal & Command Sender */}
        <SerialLogConsole
          logs={logs}
          connected={connected}
          onClear={() => setLogs([])}
          onSendRaw={(cmd) => deviceService.sendCmd(cmd)}
        />

        {/* Footer Technical Note */}
        <footer className="text-center text-[11px] text-white/30 pt-4 pb-8 space-y-1">
          <p>
            Compatível com Arduino Nano V3, BLE-Nano (CC2540 / HM-10), ESP32 e registradores 74HC595.
          </p>
          <p>
            Taxa de transmissão: 115200 baud | Comunicação sem latência via Web Serial API & Web Bluetooth API.
          </p>
        </footer>
      </div>

      {/* Firmware Guide & Pinout Modal */}
      <FirmwareGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* APK Generation & GitHub Actions Guide Modal */}
      <ApkGuideModal
        isOpen={isApkGuideOpen}
        onClose={() => setIsApkGuideOpen(false)}
      />

      {/* In-App Bluetooth LE Device Scanner Modal (Android & Web) */}
      <BluetoothScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onDeviceConnected={() => setIsScannerModalOpen(false)}
      />
    </div>
  );
}
