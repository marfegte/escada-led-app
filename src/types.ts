export type ConnectionMode = 'usb' | 'bt' | 'sim';

export interface StaircaseConfig {
  reg: number;         // qtdRegistradores (1 - 8)
  totalSaidas: number; // reg * 8
  saidas: number;      // qtdSaidas (1 - totalSaidas)
  tempo: number;       // tempo pausa (100 - 30000 ms)
  fs: number;          // fadeSaida (1 - 50 ms/passo)
  fe: number;          // fadeEntrada (1 - 50 ms/passo)
  ldrLimiar: number;   // LDR limiar noite (0 - 1023)
  distCm: number;      // Distância ativação (10 - 200 cm)
  brilhoMax: number;   // Brilho máximo PWM (10 - 255)
  modoNoturno: boolean;// Noturno sempre ativo
  timerAtivo: boolean; // Temporizador ativo
  timerOnH: number;    // Hora ligar (0 - 23)
  timerOnM: number;    // Minuto ligar (0 - 59)
  timerOffH: number;   // Hora desligar (0 - 23)
  timerOffM: number;   // Minuto desligar (0 - 59)
}

export interface SystemStatus {
  s1Active: boolean;
  s2Active: boolean;
  leds: number[];       // array of 0 or 1 for each output
  ldrLive: number;      // 0 - 1023
  sistemaAtivo: boolean; // true if within active hours/light threshold
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'tx' | 'rx' | 'ok' | 'err' | 'bt' | 'seq' | 'timer' | 'info';
}

export type AnimationPhase = 'idle' | 'on' | 'pause' | 'off';
