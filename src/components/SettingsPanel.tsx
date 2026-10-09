import { Monitor, Download, FolderOpen, Bell, Shield, Info, ExternalLink, HardDrive, Zap, Package } from 'lucide-react';

interface SettingsPanelProps {
  isElectron: boolean;
}

export function SettingsPanel({ isElectron }: SettingsPanelProps) {
  return (
    <div className="space-y-6">
      {/* App Info */}
      <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Monitor className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Application</h2>
            <p className="text-xs text-gray-400">NetShare Desktop v1.0.0</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/20">
            <p className="text-xs text-gray-500">Version</p>
            <p className="text-sm font-medium text-white">1.0.0</p>
          </div>
          <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/20">
            <p className="text-xs text-gray-500">Mode</p>
            <p className="text-sm font-medium text-white flex items-center gap-1">
              {isElectron ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Desktop (.exe)
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  Web Browser
                </>
              )}
            </p>
          </div>
          <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/20">
            <p className="text-xs text-gray-500">Platform</p>
            <p className="text-sm font-medium text-white">
              {isElectron && window.electronAPI ? window.electronAPI.platform : 'Browser'}
            </p>
          </div>
          <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/20">
            <p className="text-xs text-gray-500">Electron</p>
            <p className="text-sm font-medium text-white">
              {isElectron ? navigator.userAgent.match(/Electron\/([\d.]+)/)?.[1] || 'Yes' : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Build as .exe */}
      <div className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 border border-green-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Build as Windows .exe</h2>
            <p className="text-xs text-gray-400">Package NetShare as a standalone desktop app</p>
          </div>
        </div>

        {!isElectron ? (
          <div className="space-y-4">
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
              <p className="text-sm text-gray-300 mb-3">
                You're currently running NetShare in a web browser. To get the full desktop experience with native features, build it as a standalone .exe:
              </p>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-blue-400 font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">Clone the repository</p>
                    <code className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded mt-1 block font-mono">
                      git clone https://github.com/netshare/app.git && cd app
                    </code>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-blue-400 font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">Install dependencies</p>
                    <code className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded mt-1 block font-mono">
                      npm install
                    </code>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-blue-400 font-bold">3</span>
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">Build the .exe installer</p>
                    <code className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded mt-1 block font-mono">
                      npm run build:win
                    </code>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-green-400 font-bold">✓</span>
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">Find your .exe in the release/ folder</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Output: <code className="bg-gray-800 px-1.5 py-0.5 rounded font-mono">release/NetShare-1.0.0-Setup.exe</code>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-300 font-medium mb-1">Desktop Features</p>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li>• System tray integration — runs in background</li>
                    <li>• Native file dialogs — familiar Windows experience</li>
                    <li>• Auto-discovery — finds peers on LAN via mDNS</li>
                    <li>• Native notifications — Windows toast notifications</li>
                    <li>• Custom title bar — native window controls</li>
                    <li>• No browser needed — standalone .exe</li>
                    <li>• Auto-start option — launch on Windows startup</li>
                    <li>• Portable mode — run without installation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-green-300 font-medium">Running as Desktop App</p>
                <p className="text-xs text-gray-400">All native features are active</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Features (when in Electron) */}
      {isElectron && (
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Native Features</h2>
              <p className="text-xs text-gray-400">Active desktop integrations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: Monitor, label: 'System Tray', desc: 'Minimize to tray', active: true },
              { icon: FolderOpen, label: 'Native Dialogs', desc: 'File picker', active: true },
              { icon: Bell, label: 'Notifications', desc: 'Toast alerts', active: true },
              { icon: HardDrive, label: 'File System', desc: 'Direct access', active: true },
              { icon: Zap, label: 'Auto-Discovery', desc: 'mDNS/Bonjour', active: true },
              { icon: Shield, label: 'Background Mode', desc: 'Runs quietly', active: true },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-xl border border-gray-700/20">
                <feature.icon className="w-4 h-4 text-blue-400" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-white">{feature.label}</p>
                  <p className="text-[10px] text-gray-500">{feature.desc}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transfer Settings */}
      <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Transfer Settings</h2>
            <p className="text-xs text-gray-400">Optimize transfer performance</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl border border-gray-700/20">
            <div>
              <p className="text-sm text-white">Chunk Size</p>
              <p className="text-xs text-gray-500">Larger chunks = faster but more memory</p>
            </div>
            <span className="text-sm font-mono text-green-400">256 KB</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl border border-gray-700/20">
            <div>
              <p className="text-sm text-white">Buffer Size</p>
              <p className="text-xs text-gray-500">Max data buffered before pausing</p>
            </div>
            <span className="text-sm font-mono text-green-400">16 MB</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl border border-gray-700/20">
            <div>
              <p className="text-sm text-white">Transfer Mode</p>
              <p className="text-xs text-gray-500">Unordered for maximum throughput</p>
            </div>
            <span className="text-sm font-mono text-green-400">Turbo</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl border border-gray-700/20">
            <div>
              <p className="text-sm text-white">Auto-Download</p>
              <p className="text-xs text-gray-500">Save received files automatically</p>
            </div>
            <div className="w-10 h-5 bg-green-500 rounded-full relative cursor-pointer">
              <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full shadow" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
