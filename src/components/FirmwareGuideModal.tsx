import React, { useState } from 'react';
import { X, Copy, Check, Cpu, Zap, Code2, AlertTriangle, Layers } from 'lucide-react';

interface FirmwareGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirmwareGuideModal: React.FC<FirmwareGuideModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'firmware' | 'pinout' | 'protocol'>('firmware');

  if (!isOpen) return null;

  const arduinoCode = `/*
  ====================================================================
  Escada LED Inteligente — Firmware Arduino / BLE-Nano
  Compatível com: Arduino Nano V3, BLE-Nano (CC2540), Uno, Pro Mini
  Driver: Shift Registers 74HC595 (Cascateados) + ULN2803 ou MOSFETs
  Sensores: 2x HC-SR04 (Inferior e Superior) + 1x LDR (Divisor Tensão)
  ====================================================================
*/

#include <EEPROM.h>

// Pinos 74HC595
const int PIN_DATA  = 11; // DS / SER
const int PIN_LATCH = 12; // ST_CP / RCLK
const int PIN_CLOCK = 13; // SH_CP / SRCLK
const int PIN_OE    = 10; // Output Enable (PWM para controle de brilho!)

// Pinos Sensor 1 (Inferior - Dispara subida)
const int PIN_TRIG1 = 2;
const int PIN_ECHO1 = 3;

// Pinos Sensor 2 (Superior - Dispara descida)
const int PIN_TRIG2 = 4;
const int PIN_ECHO2 = 5;

// Pino LDR (Leitura de luz ambiente)
const int PIN_LDR   = A0;

// Estrutura de Configuração salva na EEPROM
struct Config {
  uint8_t  reg;         // Qtd registradores (ex: 3 = 24 degraus max)
  uint8_t  saidas;      // Qtd degraus ativos (ex: 15)
  uint16_t tempo;       // Tempo pausa acesos (ms)
  uint8_t  fs;          // Fade saida acender (ms/passo)
  uint8_t  fe;          // Fade entrada apagar (ms/passo)
  uint16_t ldrLimiar;   // Limiar LDR (0-1023)
  uint8_t  distCm;      // Distancia deteccao (cm)
  uint8_t  brilhoMax;   // Brilho PWM (10-255)
  uint8_t  modoNoturno; // 1 = sempre ativo
  uint8_t  timerAtivo;  // 1 = timer ativo
  uint8_t  tonH, tonM;  // Horario ligar
  uint8_t  toffH, toffM;// Horario desligar
  uint8_t  magic;       // Flag para validar EEPROM gravada
} cfg;

uint32_t ledStateMask = 0;
bool s1Ativo = false;
bool s2Ativo = false;
bool sequenciando = false;
int horaAtual = 19, minutoAtual = 0;
unsigned long ultimoSegundo = 0;

void setup() {
  Serial.begin(115200);

  pinMode(PIN_DATA, OUTPUT);
  pinMode(PIN_LATCH, OUTPUT);
  pinMode(PIN_CLOCK, OUTPUT);
  pinMode(PIN_OE, OUTPUT);
  analogWrite(PIN_OE, 255); // Inicialmente apagado (OE ativo em LOW)

  pinMode(PIN_TRIG1, OUTPUT);
  pinMode(PIN_ECHO1, INPUT);
  pinMode(PIN_TRIG2, OUTPUT);
  pinMode(PIN_ECHO2, INPUT);

  carregarConfig();
  aplicarBrilho(cfg.brilhoMax);
  desligarTodos();

  Serial.println("BOOT_OK");
}

void carregarConfig() {
  EEPROM.get(0, cfg);
  if (cfg.magic != 0x5A) {
    // Valores padrao
    cfg.reg = 3;
    cfg.saidas = 15;
    cfg.tempo = 5000;
    cfg.fs = 5;
    cfg.fe = 15;
    cfg.ldrLimiar = 50;
    cfg.distCm = 60;
    cfg.brilhoMax = 120;
    cfg.modoNoturno = 0;
    cfg.timerAtivo = 0;
    cfg.tonH = 18; cfg.tonM = 0;
    cfg.toffH = 6;  cfg.toffM = 0;
    cfg.magic = 0x5A;
    salvarConfig();
  }
}

void salvarConfig() {
  EEPROM.put(0, cfg);
}

void loop() {
  processarSerial();
  atualizarRelogio();
  if (!sequenciando) {
    verificarSensores();
  }
}

// Envia bits para os 74HC595
void atualizarRegistradores(uint32_t mask) {
  digitalWrite(PIN_LATCH, LOW);
  for (int b = (cfg.reg * 8) - 1; b >= 0; b--) {
    digitalWrite(PIN_CLOCK, LOW);
    digitalWrite(PIN_DATA, (mask & ((uint32_t)1 << b)) ? HIGH : LOW);
    digitalWrite(PIN_CLOCK, HIGH);
  }
  digitalWrite(PIN_LATCH, HIGH);
}

void aplicarBrilho(uint8_t brilho) {
  // OE do 74HC595: LOW = ligado, HIGH = desligado
  analogWrite(PIN_OE, 255 - brilho);
}

void desligarTodos() {
  ledStateMask = 0;
  atualizarRegistradores(0);
}

void ligarTodos() {
  ledStateMask = 0;
  for (int i = 0; i < cfg.saidas; i++) {
    ledStateMask |= ((uint32_t)1 << i);
  }
  atualizarRegistradores(ledStateMask);
}

void animarSequencia(int dir) {
  sequenciando = true;
  aplicarBrilho(cfg.brilhoMax);

  if (dir == 1) Serial.println("SEQ:S1_START");
  else Serial.println("SEQ:S2_START");

  // Acender em onda
  ledStateMask = 0;
  for (int i = 0; i < cfg.saidas; i++) {
    int idx = (dir == 1) ? i : (cfg.saidas - 1 - i);
    ledStateMask |= ((uint32_t)1 << idx);
    atualizarRegistradores(ledStateMask);
    delay(cfg.fs * 15);
  }

  // Pausa com iluminacao total
  delay(cfg.tempo);

  // Apagar em onda
  for (int i = 0; i < cfg.saidas; i++) {
    int idx = (dir == 1) ? i : (cfg.saidas - 1 - i);
    ledStateMask &= ~((uint32_t)1 << idx);
    atualizarRegistradores(ledStateMask);
    delay(cfg.fe * 15);
  }

  desligarTodos();
  if (dir == 1) Serial.println("SEQ:S1_END");
  else Serial.println("SEQ:S2_END");

  sequenciando = false;
}

// Leitura ultrassonica HC-SR04
int lerDistancia(int trig, int echo) {
  digitalWrite(trig, LOW);
  delayMicroseconds(2);
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);
  long dur = pulseIn(echo, HIGH, 15000);
  if (dur == 0) return 999;
  return dur * 0.034 / 2;
}

void verificarSensores() {
  int ldr = analogRead(PIN_LDR);
  bool estaEscuro = (ldr <= cfg.ldrLimiar);
  bool ativo = cfg.modoNoturno || estaEscuro;

  if (!ativo) return;

  int d1 = lerDistancia(PIN_TRIG1, PIN_ECHO1);
  if (d1 > 0 && d1 <= cfg.distCm) {
    animarSequencia(1);
    return;
  }

  int d2 = lerDistancia(PIN_TRIG2, PIN_ECHO2);
  if (d2 > 0 && d2 <= cfg.distCm) {
    animarSequencia(-1);
    return;
  }
}

void processarSerial() {
  if (!Serial.available()) return;
  String cmd = Serial.readStringUntil('\\n');
  cmd.trim();
  if (cmd.length() == 0) return;

  if (cmd == "GET_CFG") {
    Serial.print("CFG:");
    Serial.print(cfg.reg); Serial.print(",");
    Serial.print(cfg.reg * 8); Serial.print(",");
    Serial.print(cfg.saidas); Serial.print(",");
    Serial.print(cfg.tempo); Serial.print(",");
    Serial.print(cfg.fs); Serial.print(",");
    Serial.print(cfg.fe); Serial.print(",");
    Serial.print(cfg.ldrLimiar); Serial.print(",");
    Serial.print(cfg.distCm); Serial.print(",");
    Serial.print(cfg.brilhoMax); Serial.print(",");
    Serial.print(cfg.modoNoturno); Serial.print(",");
    Serial.print(cfg.tonH); Serial.print(",");
    Serial.print(cfg.tonM); Serial.print(",");
    Serial.print(cfg.toffH); Serial.print(",");
    Serial.print(cfg.toffM); Serial.print(",");
    Serial.println(cfg.timerAtivo);
  }
  else if (cmd == "GET_STATUS") {
    int ldr = analogRead(PIN_LDR);
    Serial.print("STATUS:");
    Serial.print(s1Ativo ? "1" : "0"); Serial.print(",");
    Serial.print(s2Ativo ? "1" : "0"); Serial.print(",");
    for (int i = 0; i < cfg.saidas; i++) {
      Serial.print((ledStateMask & ((uint32_t)1 << i)) ? "1" : "0");
    }
    Serial.print(",");
    Serial.print(ldr); Serial.print(",");
    Serial.println((cfg.modoNoturno || ldr <= cfg.ldrLimiar) ? "1" : "0");
  }
  else if (cmd.startsWith("SET_REG:")) {
    cfg.reg = cmd.substring(8).toInt();
    salvarConfig();
    Serial.println("ACK:SET_REG");
  }
  else if (cmd.startsWith("SET_SAIDAS:")) {
    cfg.saidas = cmd.substring(11).toInt();
    salvarConfig();
    Serial.println("ACK:SET_SAIDAS");
  }
  else if (cmd.startsWith("SET_TEMPO:")) {
    cfg.tempo = cmd.substring(10).toInt();
    salvarConfig();
    Serial.println("ACK:SET_TEMPO");
  }
  else if (cmd.startsWith("SET_FADE_S:")) {
    cfg.fs = cmd.substring(11).toInt();
    salvarConfig();
    Serial.println("ACK:SET_FADE_S");
  }
  else if (cmd.startsWith("SET_FADE_E:")) {
    cfg.fe = cmd.substring(11).toInt();
    salvarConfig();
    Serial.println("ACK:SET_FADE_E");
  }
  else if (cmd.startsWith("SET_LDR:")) {
    cfg.ldrLimiar = cmd.substring(8).toInt();
    salvarConfig();
    Serial.println("ACK:SET_LDR");
  }
  else if (cmd.startsWith("SET_DIST:")) {
    cfg.distCm = cmd.substring(9).toInt();
    salvarConfig();
    Serial.println("ACK:SET_DIST");
  }
  else if (cmd.startsWith("SET_BRILHO:")) {
    cfg.brilhoMax = cmd.substring(11).toInt();
    aplicarBrilho(cfg.brilhoMax);
    salvarConfig();
    Serial.println("ACK:SET_BRILHO");
  }
  else if (cmd.startsWith("SET_NOTURNO:")) {
    cfg.modoNoturno = cmd.substring(12).toInt();
    salvarConfig();
    Serial.println("ACK:SET_NOTURNO");
  }
  else if (cmd.startsWith("SET_TIMER_ATIVO:")) {
    cfg.timerAtivo = cmd.substring(16).toInt();
    salvarConfig();
    Serial.println("ACK:SET_TIMER_ATIVO");
  }
  else if (cmd.startsWith("SET_TIMER_ON:")) {
    int sep = cmd.indexOf(':', 13);
    cfg.tonH = cmd.substring(13, sep).toInt();
    cfg.tonM = cmd.substring(sep + 1).toInt();
    salvarConfig();
    Serial.println("ACK:SET_TIMER_ON");
  }
  else if (cmd.startsWith("SET_TIMER_OFF:")) {
    int sep = cmd.indexOf(':', 14);
    cfg.toffH = cmd.substring(14, sep).toInt();
    cfg.toffM = cmd.substring(sep + 1).toInt();
    salvarConfig();
    Serial.println("ACK:SET_TIMER_OFF");
  }
  else if (cmd.startsWith("SET_HORA:")) {
    int sep = cmd.indexOf(':', 9);
    horaAtual = cmd.substring(9, sep).toInt();
    minutoAtual = cmd.substring(sep + 1).toInt();
    Serial.println("ACK:SET_HORA");
  }
  else if (cmd == "TRIG_S1") {
    Serial.println("ACK:TRIG_S1");
    animarSequencia(1);
  }
  else if (cmd == "TRIG_S2") {
    Serial.println("ACK:TRIG_S2");
    animarSequencia(-1);
  }
  else if (cmd == "ALL_ON") {
    ligarTodos();
    Serial.println("ACK:ALL_ON");
  }
  else if (cmd == "ALL_OFF") {
    desligarTodos();
    Serial.println("ACK:ALL_OFF");
  }
}

void atualizarRelogio() {
  if (millis() - ultimoSegundo >= 60000) {
    ultimoSegundo = millis();
    minutoAtual++;
    if (minutoAtual >= 60) {
      minutoAtual = 0;
      horaAtual = (horaAtual + 1) % 24;
    }
  }
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(arduinoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#16181e] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#121418]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Firmware & Diagrama de Ligação</h2>
              <p className="text-xs text-white/50">Código C++ pronto para gravar no Arduino Nano / BLE-Nano</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-white/10 bg-[#16181e]">
          <button
            onClick={() => setActiveTab('firmware')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'firmware'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Sketch Arduino (.ino)
          </button>
          <button
            onClick={() => setActiveTab('pinout')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'pinout'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Pinagem & Conexões
          </button>
          <button
            onClick={() => setActiveTab('protocol')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'protocol'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Comandos UART/BLE
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-white/80">
          {activeTab === 'firmware' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/60">Grave usando a Arduino IDE com velocidade 115200 baud:</span>
                <button
                  onClick={copyToClipboard}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs shadow-md transition-all active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Código Copiado!' : 'Copiar Sketch'}
                </button>
              </div>
              <pre className="p-4 bg-[#0c0d10] border border-white/10 rounded-xl font-mono text-[11px] leading-relaxed text-amber-200/90 overflow-x-auto max-h-[55vh]">
                {arduinoCode}
              </pre>
            </div>
          )}

          {activeTab === 'pinout' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 74HC595 Pinout */}
                <div className="p-4 rounded-xl bg-[#121418] border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                    <Layers className="w-4 h-4" />
                    <span>Shift Register 74HC595</span>
                  </div>
                  <ul className="space-y-1.5 text-white/70">
                    <li><strong className="text-white">Pino D11 (Arduino)</strong> → DS (Pino 14 - Dados)</li>
                    <li><strong className="text-white">Pino D12 (Arduino)</strong> → ST_CP / Latch (Pino 12)</li>
                    <li><strong className="text-white">Pino D13 (Arduino)</strong> → SH_CP / Clock (Pino 11)</li>
                    <li><strong className="text-white">Pino D10 (Arduino)</strong> → OE (Pino 13 - PWM Brilho)</li>
                    <li><strong className="text-white">MR (Pino 10)</strong> → 5V</li>
                    <li><strong className="text-white">VCC (Pino 16)</strong> → 5V</li>
                    <li><strong className="text-white">GND (Pino 8)</strong> → GND comum</li>
                    <li className="pt-1 text-[11px] text-amber-300/80">
                      *Para cascatear: ligue Q7S (Pino 9) do 1º chip no DS (Pino 14) do 2º chip.
                    </li>
                  </ul>
                </div>

                {/* HC-SR04 & LDR */}
                <div className="p-4 rounded-xl bg-[#121418] border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                    <Zap className="w-4 h-4" />
                    <span>Sensores Ultrassom & LDR</span>
                  </div>
                  <ul className="space-y-1.5 text-white/70">
                    <li><strong className="text-white">Sensor 1 (Inferior)</strong>: TRIG = D2, ECHO = D3</li>
                    <li><strong className="text-white">Sensor 2 (Superior)</strong>: TRIG = D4, ECHO = D5</li>
                    <li><strong className="text-white">LDR</strong>: Conectado a A0 com resistor de 10kΩ puxando para GND.</li>
                    <li><strong className="text-white">Alimentação</strong>: 5V e GND nos dois HC-SR04.</li>
                  </ul>
                </div>
              </div>

              {/* Dica Elétrica */}
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-amber-200/90 text-xs leading-relaxed">
                  <strong>Atenção com a corrente dos LEDs de fita (12V / 24V):</strong> As saídas do 74HC595 fornecem no máximo 20mA. Utilize drivers de potência intermediários (como arrays ULN2803 para fitas de menor potência ou placas controladoras com MOSFETs IRLZ44N por degrau) para comutar os 12V/24V das fitas sem queimar os CIs!
                </div>
              </div>
            </div>
          )}

          {activeTab === 'protocol' && (
            <div className="space-y-3">
              <p className="text-white/60">Tabela de comandos suportados pelo protocolo de comunicação serial / BLE:</p>
              <div className="border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121418] text-white/50 border-b border-white/10">
                    <tr>
                      <th className="p-2.5 font-medium">Comando</th>
                      <th className="p-2.5 font-medium">Resposta</th>
                      <th className="p-2.5 font-medium">Descrição</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                    <tr>
                      <td className="p-2 text-amber-300">GET_CFG</td>
                      <td className="p-2 text-white/80">CFG:r,tot,s,t,fs,fe,ldr,dist...</td>
                      <td className="p-2 font-sans text-white/60">Lê todos os parâmetros da EEPROM</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-amber-300">GET_STATUS</td>
                      <td className="p-2 text-white/80">STATUS:s1,s2,leds,ldr,ativo</td>
                      <td className="p-2 font-sans text-white/60">Lê sensores e estado das saídas em tempo real</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-amber-300">SET_SAIDAS:N</td>
                      <td className="p-2 text-emerald-400">ACK:SET_SAIDAS</td>
                      <td className="p-2 font-sans text-white/60">Configura a quantidade de degraus utilizados</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-amber-300">SET_TEMPO:ms</td>
                      <td className="p-2 text-emerald-400">ACK:SET_TEMPO</td>
                      <td className="p-2 font-sans text-white/60">Configura a duração do tempo ligado</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-amber-300">TRIG_S1 / TRIG_S2</td>
                      <td className="p-2 text-emerald-400">ACK:TRIG_S* + SEQ:S*_START</td>
                      <td className="p-2 font-sans text-white/60">Disparo manual de subida ou descida</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-amber-300">ALL_ON / ALL_OFF</td>
                      <td className="p-2 text-emerald-400">ACK:ALL_*</td>
                      <td className="p-2 font-sans text-white/60">Acendimento imediato ou apagamento total</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-white/10 bg-[#121418]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
