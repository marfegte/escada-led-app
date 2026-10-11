import { StaircaseConfig, SystemStatus, LogEntry } from '../types';
import { BleClient } from '@capacitor-community/bluetooth-le';
import { Capacitor } from '@capacitor/core';

const BLE_SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
const BLE_CHAR_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';

// Web Bluetooth and Web Serial type declarations if not in global dom types
interface BluetoothRemoteGATTServer {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  writeValue(value: BufferSource): Promise<void>;
  value?: DataView;
}

interface BluetoothDevice extends EventTarget {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
}

type BluetoothServiceUUID = number | string;
type BluetoothCharacteristicUUID = number | string;

export class DeviceConnectionService {
  private mode: 'usb' | 'bt' | 'sim' = 'usb';
  private connected: boolean = false;
  private connecting: boolean = false;
  private receiveBuffer: string = '';

  // USB Web Serial handles
  private usbPort: any = null;
  private usbReader: any = null;
  private usbWriter: any = null;

  // Bluetooth handles
  private bleDevice: BluetoothDevice | null = null;
  private bleChar: BluetoothRemoteGATTCharacteristic | null = null;
  private nativeBleDeviceId: string | null = null;

  // Simulator handles
  private simInterval: any = null;
  private simConfig: StaircaseConfig = {
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
  };
  private simLeds: number[] = new Array(15).fill(0);
  private simLdrLive: number = 28;
  private simActive: boolean = true;

  // ACK resolvers
  private ackResolvers = new Map<string, () => void>();

  // Callbacks
  public onConfigReceived?: (cfg: StaircaseConfig) => void;
  public onStatusReceived?: (status: SystemStatus) => void;
  public onSeqEvent?: (event: 'S1_START' | 'S2_START' | 'S1_END' | 'S2_END') => void;
  public onTimerEvent?: (event: 'ON' | 'OFF') => void;
  public onLog?: (msg: string, type: LogEntry['type']) => void;
  public onConnectionChange?: (connected: boolean, label: string, state: 'ok' | 'err' | 'wait') => void;
  public onPermissionBlocked?: (feature: 'bluetooth' | 'serial') => void;

  constructor() {}

  public getMode(): 'usb' | 'bt' | 'sim' {
    return this.mode;
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public setMode(m: 'usb' | 'bt' | 'sim') {
    if (this.connected) {
      this.disconnect();
    }
    this.mode = m;
  }

  private log(msg: string, type: LogEntry['type'] = 'info') {
    if (this.onLog) {
      this.onLog(msg, type);
    }
  }

  // ------------------------- USB Serial -------------------------
  public async connectUSB(): Promise<boolean> {
    if (!('serial' in navigator)) {
      this.log('Web Serial não é suportado por este navegador. Use Chrome/Edge ≥ 89.', 'err');
      this.onConnectionChange?.(false, 'Navegador sem suporte a Web Serial', 'err');
      return false;
    }

    try {
      this.connecting = true;
      this.onConnectionChange?.(false, 'Aguardando seleção de porta...', 'wait');
      this.usbPort = await (navigator as any).serial.requestPort();
      await this.usbPort.open({ baudRate: 115200 });

      this.usbWriter = this.usbPort.writable.getWriter();
      this.usbReader = this.usbPort.readable.getReader();

      this.connected = true;
      this.connecting = false;
      this.onConnectionChange?.(true, 'USB Conectado (115200 baud)', 'ok');
      this.log('Porta USB aberta com sucesso (115200 baud)', 'ok');

      this.startUsbReadLoop();

      // Wait a moment for Arduino bootloader to stabilize, then request config
      setTimeout(async () => {
        if (this.connected) {
          await this.sendCmd('GET_CFG');
          setTimeout(() => this.sendCmd('GET_STATUS'), 400);
        }
      }, 1800);

      return true;
    } catch (e: any) {
      this.connecting = false;
      this.connected = false;
      const isPolicyBlocked =
        e.name === 'SecurityError' ||
        e.message?.toLowerCase().includes('permissions policy') ||
        e.message?.toLowerCase().includes('disallowed');

      if (isPolicyBlocked) {
        this.log('Web Serial bloqueado pelo iframe (Permissions Policy). Abra em uma nova aba do navegador.', 'err');
        this.onPermissionBlocked?.('serial');
      } else if (e.name !== 'NotFoundError') {
        this.log('Falha ao conectar USB: ' + (e.message || e), 'err');
      }
      this.onConnectionChange?.(false, 'Desconectado', 'err');
      return false;
    }
  }

  private async startUsbReadLoop() {
    const decoder = new TextDecoder();
    try {
      while (this.usbReader) {
        const { value, done } = await this.usbReader.read();
        if (done) break;
        if (value) {
          this.processIncoming(decoder.decode(value));
        }
      }
    } catch (e: any) {
      if (!e.message?.includes('closed') && !e.message?.includes('canceled')) {
        this.log('Erro de leitura USB: ' + e.message, 'err');
      }
    }
  }

  public async disconnectUSB() {
    try {
      if (this.usbReader) {
        await this.usbReader.cancel();
        this.usbReader.releaseLock();
        this.usbReader = null;
      }
      if (this.usbWriter) {
        this.usbWriter.releaseLock();
        this.usbWriter = null;
      }
      if (this.usbPort) {
        await this.usbPort.close();
        this.usbPort = null;
      }
      this.connected = false;
      this.onConnectionChange?.(false, 'Desconectado', 'err');
      this.log('USB desconectado', 'info');
    } catch (e: any) {
      this.log('Erro ao fechar USB: ' + (e.message || e), 'err');
      this.connected = false;
      this.onConnectionChange?.(false, 'Desconectado', 'err');
    }
  }

  // ------------------------- BLE Nano -------------------------
  public async connectBLE(): Promise<boolean> {
    // 1. Android / Native App Platform (via Capacitor)
    if (Capacitor.isNativePlatform()) {
      try {
        this.connecting = true;
        this.log('Iniciando Bluetooth nativo do Android...', 'bt');
        this.onConnectionChange?.(false, 'Iniciando Bluetooth nativo...', 'wait');

        await BleClient.initialize();

        this.log('Procurando módulo BLE-Nano...', 'bt');
        this.onConnectionChange?.(false, 'Buscando dispositivo Bluetooth...', 'wait');

        // Request device via native Android BLE dialog
        const device = await BleClient.requestDevice({
          services: [BLE_SERVICE_UUID, 'ffe0'],
          optionalServices: [BLE_SERVICE_UUID, 'ffe0'],
        });

        if (!device || !device.deviceId) {
          this.connecting = false;
          this.onConnectionChange?.(false, 'Desconectado', 'err');
          return false;
        }

        this.nativeBleDeviceId = device.deviceId;
        this.log(`Conectando ao dispositivo ${device.name || device.deviceId}...`, 'info');

        await BleClient.connect(device.deviceId, () => {
          this.nativeBleDeviceId = null;
          this.connected = false;
          this.onConnectionChange?.(false, 'BLE Desconectado', 'err');
          this.log('BLE Desconectado (nativo)', 'err');
        });

        await BleClient.startNotifications(
          device.deviceId,
          BLE_SERVICE_UUID,
          BLE_CHAR_UUID,
          (value: DataView) => {
            const decoder = new TextDecoder();
            const text = decoder.decode(value);
            this.processIncoming(text);
          }
        );

        this.connected = true;
        this.connecting = false;
        const devName = device.name || 'BLE-Nano';
        this.onConnectionChange?.(true, `BLE-Nano: ${devName}`, 'ok');
        this.log(`BLE-Nano conectado nativamente no Android (${devName}) ✓`, 'ok');

        this.autoLoadBleConfig();
        return true;
      } catch (e: any) {
        this.connecting = false;
        this.connected = false;
        this.nativeBleDeviceId = null;
        this.log('Falha ao conectar BLE nativo: ' + (e.message || e), 'err');
        this.onConnectionChange?.(false, 'Desconectado', 'err');
        return false;
      }
    }

    // 2. Web Browser Platform (Web Bluetooth API)
    if (!('bluetooth' in navigator)) {
      this.log('Web Bluetooth não é suportado por este navegador. Use o Google Chrome ou instale o APK nativo.', 'err');
      this.onConnectionChange?.(false, 'Navegador sem suporte a Web Bluetooth', 'err');
      return false;
    }

    try {
      this.connecting = true;
      this.log('Procurando módulo BLE-Nano...', 'bt');
      this.onConnectionChange?.(false, 'Buscando dispositivo Bluetooth...', 'wait');

      this.bleDevice = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: [BLE_SERVICE_UUID] }],
        optionalServices: [BLE_SERVICE_UUID],
      });

      if (!this.bleDevice) return false;

      this.bleDevice.addEventListener('gattserverdisconnected', async () => {
        this.bleChar = null;
        if (!this.bleDevice) return; // Clean disconnect
        this.log('Conexão GATT caiu — tentando reconectar...', 'err');
        this.onConnectionChange?.(false, 'Reconectando BLE...', 'wait');
        try {
          this.bleChar = await this.gattConnect(this.bleDevice);
          this.bleChar.addEventListener('characteristicvaluechanged', (ev: any) => {
            const val = ev.target.value;
            this.processIncoming(new TextDecoder().decode(val));
          });
          this.connected = true;
          this.onConnectionChange?.(true, `BLE-Nano: ${this.bleDevice.name || 'Conectado'}`, 'ok');
          this.log('BLE Reconectado com sucesso!', 'ok');
        } catch (err: any) {
          this.connected = false;
          this.onConnectionChange?.(false, 'Desconectado', 'err');
          this.log('Reconexão BLE falhou: ' + (err.message || err), 'err');
        }
      });

      this.log('Conectando ao GATT do BLE-Nano...', 'info');
      this.bleChar = await this.gattConnect(this.bleDevice);
      this.bleChar.addEventListener('characteristicvaluechanged', (ev: any) => {
        const val = ev.target.value;
        this.processIncoming(new TextDecoder().decode(val));
      });

      this.connected = true;
      this.connecting = false;
      const devName = this.bleDevice.name || 'BLE-Nano';
      this.onConnectionChange?.(true, `BLE-Nano: ${devName}`, 'ok');
      this.log(`BLE-Nano conectado com sucesso (${devName}) ✓`, 'ok');

      this.autoLoadBleConfig();
      return true;
    } catch (e: any) {
      this.connecting = false;
      this.connected = false;
      const isPolicyBlocked =
        e.name === 'SecurityError' ||
        e.message?.toLowerCase().includes('permissions policy') ||
        e.message?.toLowerCase().includes('disallowed');

      if (isPolicyBlocked) {
        this.log('Web Bluetooth bloqueado pelo iframe (Permissions Policy). Abra em uma nova aba do navegador para parear.', 'err');
        this.onPermissionBlocked?.('bluetooth');
      } else if (e.name !== 'NotFoundError') {
        this.log('Falha ao conectar BLE: ' + (e.message || e), 'err');
      }
      this.onConnectionChange?.(false, 'Desconectado', 'err');
      return false;
    }
  }

  private async gattConnect(device: BluetoothDevice): Promise<BluetoothRemoteGATTCharacteristic> {
    for (let t = 1; t <= 5; t++) {
      try {
        const server = await device.gatt!.connect();
        await new Promise((r) => setTimeout(r, 500));
        const svc = await server.getPrimaryService(BLE_SERVICE_UUID);
        const ch = await svc.getCharacteristic(BLE_CHAR_UUID);
        await ch.startNotifications();
        return ch;
      } catch (e: any) {
        this.log(`GATT tentativa ${t}/5: ` + (e.message || e), 'err');
        if (t < 5) {
          await new Promise((r) => setTimeout(r, 700 * t));
        } else {
          throw e;
        }
      }
    }
    throw new Error('Falha ao obter serviço BLE');
  }

  private async autoLoadBleConfig() {
    for (let t = 1; t <= 4; t++) {
      await new Promise((r) => setTimeout(r, t === 1 ? 1200 : 2000));
      if (!this.bleChar && !this.usbWriter && !this.nativeBleDeviceId) return;
      this.log(t === 1 ? 'Solicitando configuração do Arduino...' : `Tentativa ${t}/4 ler config...`, 'info');
      await this.sendCmd('GET_CFG');
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  public async disconnectBLE() {
    if (this.nativeBleDeviceId) {
      const id = this.nativeBleDeviceId;
      this.nativeBleDeviceId = null;
      try {
        await BleClient.disconnect(id);
      } catch (e) {}
    }
    const dev = this.bleDevice;
    this.bleDevice = null;
    this.bleChar = null;
    if (dev && dev.gatt && dev.gatt.connected) {
      dev.gatt.disconnect();
    }
    this.connected = false;
    this.onConnectionChange?.(false, 'Desconectado', 'err');
    this.log('BLE Desconectado', 'info');
  }

  // ------------------------- Virtual Simulator -------------------------
  public startSimulator() {
    this.connected = true;
    this.onConnectionChange?.(true, 'Simulador Arduino Virtual (Ativo)', 'ok');
    this.log('Simulador Virtual iniciado — todos comandos e animações simulados!', 'ok');

    // Send initial config
    setTimeout(() => {
      this.dispatchLine(
        `CFG:${this.simConfig.reg},${this.simConfig.totalSaidas},${this.simConfig.saidas},${this.simConfig.tempo},${this.simConfig.fs},${this.simConfig.fe},${this.simConfig.ldrLimiar},${this.simConfig.distCm},${this.simConfig.brilhoMax},${this.simConfig.modoNoturno ? 1 : 0},${this.simConfig.timerOnH},${this.simConfig.timerOnM},${this.simConfig.timerOffH},${this.simConfig.timerOffM},${this.simConfig.timerAtivo ? 1 : 0}`
      );
      this.sendSimStatus();
    }, 300);

    // Periodic status updates with realistic slight LDR variation
    if (this.simInterval) clearInterval(this.simInterval);
    this.simInterval = setInterval(() => {
      if (this.connected && this.mode === 'sim') {
        // slight jitter
        const jitter = Math.floor(Math.random() * 5) - 2;
        this.simLdrLive = Math.max(0, Math.min(1023, this.simLdrLive + jitter));
        this.sendSimStatus();
      }
    }, 4000);
  }

  public stopSimulator() {
    if (this.simInterval) {
      clearInterval(this.simInterval);
      this.simInterval = null;
    }
    this.connected = false;
    this.onConnectionChange?.(false, 'Desconectado', 'err');
    this.log('Simulador desativado', 'info');
  }

  private sendSimStatus() {
    const bitString = this.simLeds.map((v) => (v ? '1' : '0')).join('');
    this.dispatchLine(
      `STATUS:0,0,${bitString},${this.simLdrLive},${this.simActive ? 1 : 0}`
    );
  }

  // ------------------------- Universal Send Command -------------------------
  public async sendCmd(cmd: string): Promise<boolean> {
    const cleanCmd = cmd.trim();
    this.log('→ ' + cleanCmd, 'tx');

    // Simulator Handler
    if (this.mode === 'sim') {
      return this.handleSimulatorCmd(cleanCmd);
    }

    const payload = new TextEncoder().encode(cleanCmd + '\n');
    try {
      if (this.usbWriter) {
        await this.usbWriter.write(payload);
        return true;
      }
      if (this.nativeBleDeviceId) {
        // Native Android Bluetooth LE via BleClient
        for (let i = 0; i < payload.length; i += 20) {
          const chunk = payload.slice(i, i + 20);
          const dataView = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
          await BleClient.write(this.nativeBleDeviceId, BLE_SERVICE_UUID, BLE_CHAR_UUID, dataView);
          await new Promise((r) => setTimeout(r, 45));
        }
        return true;
      }
      if (this.bleChar) {
        // Web Bluetooth
        for (let i = 0; i < payload.length; i += 20) {
          const chunk = payload.slice(i, i + 20);
          await this.bleChar.writeValue(chunk);
          await new Promise((r) => setTimeout(r, 45));
        }
        return true;
      }
    } catch (e: any) {
      this.log('Erro ao transmitir comando: ' + (e.message || e), 'err');
      return false;
    }
    return false;
  }

  private async handleSimulatorCmd(cmd: string): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 60)); // Simulate UART transmission delay

    if (cmd === 'GET_CFG') {
      const line = `CFG:${this.simConfig.reg},${this.simConfig.totalSaidas},${this.simConfig.saidas},${this.simConfig.tempo},${this.simConfig.fs},${this.simConfig.fe},${this.simConfig.ldrLimiar},${this.simConfig.distCm},${this.simConfig.brilhoMax},${this.simConfig.modoNoturno ? 1 : 0},${this.simConfig.timerOnH},${this.simConfig.timerOnM},${this.simConfig.timerOffH},${this.simConfig.timerOffM},${this.simConfig.timerAtivo ? 1 : 0}`;
      this.processIncoming(line + '\n');
      return true;
    }

    if (cmd === 'GET_STATUS') {
      this.sendSimStatus();
      return true;
    }

    if (cmd.startsWith('SET_REG:')) {
      const val = parseInt(cmd.split(':')[1]);
      this.simConfig.reg = val;
      this.simConfig.totalSaidas = val * 8;
      if (this.simConfig.saidas > this.simConfig.totalSaidas) {
        this.simConfig.saidas = this.simConfig.totalSaidas;
      }
      this.processIncoming('ACK:SET_REG\n');
      return true;
    }

    if (cmd.startsWith('SET_SAIDAS:')) {
      const val = parseInt(cmd.split(':')[1]);
      this.simConfig.saidas = val;
      this.simLeds = new Array(val).fill(0);
      this.processIncoming('ACK:SET_SAIDAS\n');
      return true;
    }

    if (cmd.startsWith('SET_TEMPO:')) {
      this.simConfig.tempo = parseInt(cmd.split(':')[1]);
      this.processIncoming('ACK:SET_TEMPO\n');
      return true;
    }

    if (cmd.startsWith('SET_FADE_S:')) {
      this.simConfig.fs = parseInt(cmd.split(':')[1]);
      this.processIncoming('ACK:SET_FADE_S\n');
      return true;
    }

    if (cmd.startsWith('SET_FADE_E:')) {
      this.simConfig.fe = parseInt(cmd.split(':')[1]);
      this.processIncoming('ACK:SET_FADE_E\n');
      return true;
    }

    if (cmd.startsWith('SET_LDR:')) {
      this.simConfig.ldrLimiar = parseInt(cmd.split(':')[1]);
      this.processIncoming('ACK:SET_LDR\n');
      return true;
    }

    if (cmd.startsWith('SET_DIST:')) {
      this.simConfig.distCm = parseInt(cmd.split(':')[1]);
      this.processIncoming('ACK:SET_DIST\n');
      return true;
    }

    if (cmd.startsWith('SET_BRILHO:')) {
      this.simConfig.brilhoMax = parseInt(cmd.split(':')[1]);
      this.processIncoming('ACK:SET_BRILHO\n');
      return true;
    }

    if (cmd.startsWith('SET_NOTURNO:')) {
      this.simConfig.modoNoturno = cmd.split(':')[1] === '1';
      this.processIncoming('ACK:SET_NOTURNO\n');
      return true;
    }

    if (cmd.startsWith('SET_TIMER_ATIVO:')) {
      this.simConfig.timerAtivo = cmd.split(':')[1] === '1';
      this.processIncoming('ACK:SET_TIMER_ATIVO\n');
      return true;
    }

    if (cmd.startsWith('SET_TIMER_ON:')) {
      const parts = cmd.split(':')[1].split(':');
      this.simConfig.timerOnH = parseInt(parts[0]);
      this.simConfig.timerOnM = parseInt(parts[1]);
      this.processIncoming('ACK:SET_TIMER_ON\n');
      return true;
    }

    if (cmd.startsWith('SET_TIMER_OFF:')) {
      const parts = cmd.split(':')[1].split(':');
      this.simConfig.timerOffH = parseInt(parts[0]);
      this.simConfig.timerOffM = parseInt(parts[1]);
      this.processIncoming('ACK:SET_TIMER_OFF\n');
      return true;
    }

    if (cmd.startsWith('SET_HORA:')) {
      this.processIncoming('ACK:SET_HORA\n');
      return true;
    }

    if (cmd === 'ALL_ON') {
      this.simLeds = new Array(this.simConfig.saidas).fill(1);
      this.processIncoming('ACK:ALL_ON\n');
      this.sendSimStatus();
      return true;
    }

    if (cmd === 'ALL_OFF') {
      this.simLeds = new Array(this.simConfig.saidas).fill(0);
      this.processIncoming('ACK:ALL_OFF\n');
      this.sendSimStatus();
      return true;
    }

    if (cmd === 'TRIG_S1') {
      this.processIncoming('ACK:TRIG_S1\n');
      this.runSimulatedSequence(1);
      return true;
    }

    if (cmd === 'TRIG_S2') {
      this.processIncoming('ACK:TRIG_S2\n');
      this.runSimulatedSequence(-1);
      return true;
    }

    // Default ACK
    this.processIncoming(`ACK:${cmd.split(':')[0]}\n`);
    return true;
  }

  private async runSimulatedSequence(dir: 1 | -1) {
    const eventStart = dir === 1 ? 'SEQ:S1_START\n' : 'SEQ:S2_START\n';
    this.processIncoming(eventStart);

    const stepMs = Math.max(30, this.simConfig.fs * 40);
    const pauseMs = this.simConfig.tempo || 3000;
    const fadeOutStepMs = Math.max(30, this.simConfig.fe * 40);

    const total = this.simConfig.saidas;
    const indices = dir === 1
      ? Array.from({ length: total }, (_, i) => i)
      : Array.from({ length: total }, (_, i) => total - 1 - i);

    // Fade on
    for (const i of indices) {
      this.simLeds[i] = 1;
      this.sendSimStatus();
      await new Promise((r) => setTimeout(r, stepMs));
    }

    // Pause with all LEDs lit
    await new Promise((r) => setTimeout(r, pauseMs));

    // Fade off
    for (const i of indices) {
      this.simLeds[i] = 0;
      this.sendSimStatus();
      await new Promise((r) => setTimeout(r, fadeOutStepMs));
    }

    const eventEnd = dir === 1 ? 'SEQ:S1_END\n' : 'SEQ:S2_END\n';
    this.processIncoming(eventEnd);
  }

  public waitForAck(cmd: string, timeoutMs: number = 5000): Promise<boolean> {
    const key = 'ACK:' + cmd;
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.ackResolvers.delete(key);
        resolve(false);
      }, timeoutMs);

      this.ackResolvers.set(key, () => {
        clearTimeout(timer);
        resolve(true);
      });
    });
  }

  // ------------------------- Incoming Packet Processing -------------------------
  public processIncoming(text: string) {
    this.receiveBuffer += text.replace(/\r/g, '');
    let nlIndex: number;

    while ((nlIndex = this.receiveBuffer.indexOf('\n')) >= 0) {
      const line = this.receiveBuffer.slice(0, nlIndex).trim();
      this.receiveBuffer = this.receiveBuffer.slice(nlIndex + 1);
      if (line) {
        this.dispatchLine(line);
      }
    }

    if (this.receiveBuffer.length > 1024) {
      this.log('Buffer serial excedeu limite seguro — resetado.', 'err');
      this.receiveBuffer = '';
    }
  }

  private dispatchLine(line: string) {
    let type: LogEntry['type'] = 'rx';
    if (line.startsWith('ERR')) type = 'err';
    else if (line.startsWith('CFG') || line.startsWith('ACK') || line === 'BOOT_OK') type = 'ok';
    else if (line.startsWith('SEQ')) type = 'seq';
    else if (line.startsWith('TIMER')) type = 'timer';

    this.log('← ' + line, type);

    // Check ACK listeners
    if (line.startsWith('ACK:')) {
      const resolver = this.ackResolvers.get(line.trim());
      if (resolver) {
        this.ackResolvers.delete(line.trim());
        resolver();
      }
    }

    if (line.startsWith('CFG:')) {
      this.parseConfig(line);
    } else if (line.startsWith('STATUS:')) {
      this.parseStatus(line);
    } else if (line === 'SEQ:S1_START') {
      this.onSeqEvent?.('S1_START');
    } else if (line === 'SEQ:S2_START') {
      this.onSeqEvent?.('S2_START');
    } else if (line === 'SEQ:S1_END') {
      this.onSeqEvent?.('S1_END');
    } else if (line === 'SEQ:S2_END') {
      this.onSeqEvent?.('S2_END');
    } else if (line === 'TIMER:ON') {
      this.onTimerEvent?.('ON');
    } else if (line === 'TIMER:OFF') {
      this.onTimerEvent?.('OFF');
    }
  }

  private parseConfig(line: string) {
    const raw = line.replace('CFG:', '').trim();
    const parts = raw.split(',');
    if (parts.length < 15) {
      this.log(`CFG incompleto (${parts.length}/15 partes recebidas) — tente "Ler config"`, 'err');
      return;
    }

    const [
      reg,
      total,
      saidas,
      tempo,
      fs,
      fe,
      ldrLimiar,
      distCm,
      brilhoMax,
      noturno,
      tonH,
      tonM,
      toffH,
      toffM,
      timerAtivo,
    ] = parts.map(Number);

    if (isNaN(reg) || isNaN(saidas) || reg < 1 || saidas < 1) {
      this.log('CFG contém valores numéricos inválidos — ignorado', 'err');
      return;
    }

    const cfg: StaircaseConfig = {
      reg,
      totalSaidas: total || reg * 8,
      saidas,
      tempo,
      fs,
      fe,
      ldrLimiar,
      distCm,
      brilhoMax,
      modoNoturno: !!noturno,
      timerAtivo: !!timerAtivo,
      timerOnH: tonH,
      timerOnM: tonM,
      timerOffH: toffH,
      timerOffM: toffM,
    };

    this.onConfigReceived?.(cfg);
    this.log(`Configuração carregada ✓ ${saidas} degraus, LDR: ${ldrLimiar}, Dist: ${distCm}cm, Brilho: ${brilhoMax}`, 'ok');
  }

  private parseStatus(line: string) {
    const raw = line.replace('STATUS:', '').trim();
    const parts = raw.split(',');
    if (parts.length < 5) return;

    const s1Active = parts[0] === '1';
    const s2Active = parts[1] === '1';
    const ledBits = parts[2].split('').map((c) => (c === '1' ? 1 : 0));
    const ldrLive = parseInt(parts[3]) || 0;
    const sistemaAtivo = parts[4] === '1';

    const status: SystemStatus = {
      s1Active,
      s2Active,
      leds: ledBits,
      ldrLive,
      sistemaAtivo,
    };

    this.onStatusReceived?.(status);
  }

  public async connect(): Promise<boolean> {
    if (this.mode === 'usb') return this.connectUSB();
    if (this.mode === 'bt') return this.connectBLE();
    if (this.mode === 'sim') {
      this.startSimulator();
      return true;
    }
    return false;
  }

  public async disconnect() {
    if (this.mode === 'usb') await this.disconnectUSB();
    else if (this.mode === 'bt') await this.disconnectBLE();
    else if (this.mode === 'sim') this.stopSimulator();
  }
}

export const deviceService = new DeviceConnectionService();
