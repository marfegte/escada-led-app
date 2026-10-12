import React, { useState, useEffect } from 'react';
import { Bluetooth, RefreshCw, X, Radio, MapPin, AlertTriangle, Check, Shield } from 'lucide-react';
import { deviceService } from '../services/deviceConnection';
import { DiscoveredBleDevice } from '../types';

interface BluetoothScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceConnected: () => void;
}

export const BluetoothScannerModal: React.FC<BluetoothScannerModalProps> = ({
  isOpen,
  onClose,
  onDeviceConnected,
}) => {
  const [devices, setDevices] = useState<DiscoveredBleDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [bluetoothEnabled, setBluetoothEnabled] = useState<boolean>(true);
  const [locationEnabled, setLocationEnabled] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopScan();
      return;
    }

    startScan();

    return () => {
      deviceService.stopNativeBleScan().catch(() => {});
    };
  }, [isOpen]);

  const checkPrerequisites = async () => {
    const status = await deviceService.checkBlePrerequisites();
    setBluetoothEnabled(status.bluetoothOk);
    setLocationEnabled(status.locationOk);
    if (status.error) {
      setErrorMessage(status.error);
    } else {
      setErrorMessage(null);
    }
    return status.bluetoothOk && status.locationOk;
  };

  const startScan = async () => {
    setDevices([]);
    setErrorMessage(null);
    setIsScanning(true);

    const ok = await checkPrerequisites();
    if (!ok && !bluetoothEnabled) {
      setIsScanning(false);
      return;
    }

    try {
      await deviceService.startNativeBleScan((newDevice) => {
        setDevices((prev) => {
          const existsIndex = prev.findIndex((d) => d.deviceId === newDevice.deviceId);
          if (existsIndex >= 0) {
            const copy = [...prev];
            copy[existsIndex] = { ...copy[existsIndex], ...newDevice };
            return copy;
          }
          return [...prev, newDevice];
        });
      });
    } catch (e: any) {
      setErrorMessage(e.message || 'Falha ao iniciar escaneamento BLE');
      setIsScanning(false);
    }
  };

  const stopScan = async () => {
    setIsScanning(false);
    try {
      await deviceService.stopNativeBleScan();
    } catch (e) {}
  };

  const handleConnect = async (dev: DiscoveredBleDevice) => {
    setConnectingId(dev.deviceId);
    await stopScan();

    const success = await deviceService.connectToNativeBleDevice(dev.deviceId, dev.name);
    setConnectingId(null);

    if (success) {
      onDeviceConnected();
      onClose();
    } else {
      setErrorMessage(`Falha ao conectar a ${dev.name || dev.deviceId}. Verifique se a placa está ligada.`);
    }
  };

  const handleRequestEnableBluetooth = async () => {
    await deviceService.requestEnableBluetooth();
    setTimeout(() => startScan(), 1000);
  };

  const handleOpenLocationSettings = async () => {
    await deviceService.openLocationSettings();
  };

  const handleSystemDialog = async () => {
    await stopScan();
    const success = await deviceService.connectBLESystemDialog();
    if (success) {
      onDeviceConnected();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[85vh] bg-[#16181e] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#121418]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Bluetooth className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Dispositivos Bluetooth LE</h3>
              <p className="text-[11px] text-white/50">
                {isScanning ? 'Buscando dispositivos próximos...' : `${devices.length} encontrado(s)`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagnostic warnings */}
        {!bluetoothEnabled && (
          <div className="p-3 mx-4 mt-3 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>O Bluetooth do celular está desativado.</span>
            </div>
            <button
              onClick={handleRequestEnableBluetooth}
              className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-black font-semibold text-[11px] shrink-0"
            >
              Ativar
            </button>
          </div>
        )}

        {!locationEnabled && (
          <div className="p-3 mx-4 mt-3 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-300">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>O Android exige que o GPS/Localização esteja ligado para escanear BLE.</span>
            </div>
            <button
              onClick={handleOpenLocationSettings}
              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-[11px] shrink-0"
            >
              Ligar GPS
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 mx-4 mt-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="break-words">{errorMessage}</span>
          </div>
        )}

        {/* Device List Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[220px]">
          {devices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center space-y-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                {isScanning && (
                  <div className="absolute inset-0 rounded-full border border-amber-500/40 animate-ping pointer-events-none" />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-white">
                  {isScanning ? 'Procurando BLE-Nano...' : 'Nenhum dispositivo encontrado'}
                </p>
                <p className="text-[11px] text-white/40 max-w-[260px]">
                  Certifique-se de que o Arduino/BLE-Nano está alimentado e que o Bluetooth e GPS do celular estão ligados.
                </p>
              </div>
            </div>
          ) : (
            devices.map((dev) => {
              const isConnecting = connectingId === dev.deviceId;
              const isKnownBleNano =
                dev.name.toLowerCase().includes('nano') ||
                dev.name.toLowerCase().includes('ble') ||
                dev.name.toLowerCase().includes('bt') ||
                dev.name.toLowerCase().includes('mlt') ||
                dev.name.toLowerCase().includes('hm');

              return (
                <div
                  key={dev.deviceId}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    isKnownBleNano
                      ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50'
                      : 'bg-[#121418] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white truncate">
                        {dev.name || 'Dispositivo sem nome'}
                      </span>
                      {isKnownBleNano && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                          RECOMENDADO
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-white/40 truncate">
                      {dev.deviceId}
                    </div>
                    {dev.rssi !== undefined && (
                      <div className="text-[10px] text-white/40">Sinal: {dev.rssi} dBm</div>
                    )}
                  </div>

                  <button
                    onClick={() => handleConnect(dev)}
                    disabled={isConnecting}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-all active:scale-95 disabled:opacity-50 shrink-0"
                  >
                    {isConnecting ? 'Conectando...' : 'Conectar'}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-[#121418] border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={isScanning ? stopScan : startScan}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-medium border border-white/10 transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isScanning ? 'Parar Busca' : 'Buscar Novamente'}</span>
          </button>

          <button
            onClick={handleSystemDialog}
            className="text-[11px] text-white/50 hover:text-white underline underline-offset-2 transition-colors"
          >
            Janela padrão do sistema
          </button>
        </div>
      </div>
    </div>
  );
};
