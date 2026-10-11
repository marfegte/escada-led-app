import React, { useState } from 'react';
import { X, Copy, Check, Smartphone, GitBranch, Download, Play, ShieldCheck, Terminal, FileCode2 } from 'lucide-react';

interface ApkGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkGuideModal: React.FC<ApkGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'passos' | 'workflow' | 'comandos'>('passos');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const workflowYaml = `name: Gerar APK Android

on:
  push:
    branches: [ main, master ]
    tags:
      - 'v*'
  pull_request:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build-apk:
    name: Compilar APK Android (Capacitor)
    runs-on: ubuntu-latest

    steps:
      - name: Baixar Código (Checkout)
        uses: actions/checkout@v4

      - name: Configurar Java 17 (Temurin)
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
          cache: 'gradle'

      - name: Configurar Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Instalar Dependências NPM
        run: npm install

      - name: Compilar Aplicação Web (Vite)
        run: npm run build

      - name: Inicializar e Sincronizar Capacitor Android
        run: |
          npx cap add android || true
          npx cap sync android

      - name: Injetar Permissões Bluetooth BLE no AndroidManifest
        run: node scripts/inject-android-permissions.cjs

      - name: Configurar Permissão do Gradle Wrapper
        run: chmod +x android/gradlew

      - name: Compilar APK Android (Debug)
        run: |
          cd android
          ./gradlew assembleDebug --no-daemon

      - name: Renomear e Mover APK
        run: |
          mkdir -p output
          cp android/app/build/outputs/apk/debug/app-debug.apk output/EscadaLED-v2.4-debug.apk

      - name: Fazer Upload do Artefato APK
        uses: actions/upload-artifact@v4
        with:
          name: EscadaLED-APK
          path: output/EscadaLED-v2.4-debug.apk
          retention-days: 30

      - name: Criar Release no GitHub (quando tag v* for criada)
        if: startsWith(github.ref, 'refs/tags/v')
        uses: softprops/action-gh-release@v2
        with:
          files: output/EscadaLED-v2.4-debug.apk
          name: Release \${{ github.ref_name }}
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}`;

  const copyWorkflow = () => {
    navigator.clipboard.writeText(workflowYaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#16181e] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#121418]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Gerar APK no GitHub Actions</h2>
              <p className="text-xs text-white/50">Compilação automatizada na nuvem com suporte nativo a Bluetooth BLE</p>
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
            onClick={() => setActiveTab('passos')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'passos'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Passo a Passo
          </button>
          <button
            onClick={() => setActiveTab('workflow')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'workflow'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Arquivo .github/workflows/build-apk.yml
          </button>
          <button
            onClick={() => setActiveTab('comandos')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'comandos'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Comandos Git
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-white/80">
          {activeTab === 'passos' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-emerald-200/90 text-xs leading-relaxed">
                  <strong>O arquivo de automação já foi criado no repositório!</strong> Quando você subir seu código para o GitHub, o GitHub Actions compilará automaticamente o APK para Android com permissões de Bluetooth nativas (sem bloqueios de navegador).
                </div>
              </div>

              <div className="space-y-3">
                {/* Passo 1 */}
                <div className="p-4 rounded-xl bg-[#121418] border border-white/10 flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="text-sm font-semibold text-white">Envie o código para o GitHub</h4>
                    <p className="text-white/60 text-xs">
                      Faça o commit e envie o repositório para o GitHub usando o Git:
                    </p>
                    <pre className="p-2.5 bg-[#0a0b0e] border border-white/10 rounded-lg font-mono text-[11px] text-amber-200/90 overflow-x-auto">
                      git add .
                      <br />
                      git commit -m "Adiciona automacao de APK no GitHub Actions"
                      <br />
                      git push origin main
                    </pre>
                  </div>
                </div>

                {/* Passo 2 */}
                <div className="p-4 rounded-xl bg-[#121418] border border-white/10 flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="text-sm font-semibold text-white">Acesse a aba Actions no GitHub</h4>
                    <p className="text-white/60 text-xs">
                      Abra a página do seu repositório no GitHub pelo navegador e clique na aba superior <strong>Actions</strong>.
                    </p>
                  </div>
                </div>

                {/* Passo 3 */}
                <div className="p-4 rounded-xl bg-[#121418] border border-white/10 flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                      <span>Execução Manual (Workflow Dispatch)</span>
                      <Play className="w-3.5 h-3.5 text-cyan-400" />
                    </h4>
                    <p className="text-white/60 text-xs">
                      Além de rodar automaticamente a cada push, você pode selecionar <strong>"Gerar APK Android"</strong> no menu à esquerda, clicar no botão <strong>"Run workflow"</strong> e disparar a geração a qualquer momento.
                    </p>
                  </div>
                </div>

                {/* Passo 4 */}
                <div className="p-4 rounded-xl bg-[#121418] border border-white/10 flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                    4
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                      <span>Baixar o APK gerado</span>
                      <Download className="w-3.5 h-3.5 text-indigo-400" />
                    </h4>
                    <p className="text-white/60 text-xs">
                      Após o término da compilação (cerca de 2 a 3 minutos), clique na execução concluída. Na parte inferior, na seção <strong>Artifacts</strong>, clique em <strong>EscadaLED-APK</strong> para baixar o instalador <code>EscadaLED-v2.4-debug.apk</code> diretamente no seu dispositivo Android!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workflow' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/60">
                  Arquivo já configurado em <code>.github/workflows/build-apk.yml</code>:
                </span>
                <button
                  onClick={copyWorkflow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all active:scale-95 shadow"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado!' : 'Copiar YAML'}</span>
                </button>
              </div>
              <pre className="p-4 bg-[#0a0b0e] border border-white/10 rounded-xl font-mono text-[11px] leading-relaxed text-emerald-200/90 overflow-x-auto max-h-[55vh]">
                {workflowYaml}
              </pre>
            </div>
          )}

          {activeTab === 'comandos' && (
            <div className="space-y-3">
              <p className="text-white/60">
                Para testar ou compilar localmente se você tiver o Android Studio instalado:
              </p>
              <div className="p-4 bg-[#0a0b0e] border border-white/10 rounded-xl font-mono text-[11px] leading-relaxed text-amber-200/90 space-y-2">
                <p className="text-white/40"># 1. Compila o projeto web e prepara o Android</p>
                <p>npm run build:apk</p>
                <p className="text-white/40 pt-2"># 2. Abre o projeto no Android Studio (opcional)</p>
                <p>npx cap open android</p>
                <p className="text-white/40 pt-2"># 3. Compilação direta via linha de comando</p>
                <p>cd android && ./gradlew assembleDebug</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
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
