import { Bluetooth, BluetoothOff, Radio, Search, AlertTriangle, Zap, Info, X, Wifi } from 'lucide-react';
import { BluetoothPeer } from '../hooks/useBluetooth';

interface BluetoothPanelProps {
  peers: BluetoothPeer[];
  isScanning: boolean;
  isSupported: boolean;
  isSecureContext: boolean;
  error: string | null;
  scanForDevices: () => Promise<void>;
  connectToDevice: (peerId: string) => Promise<void>;
  disconnectDevice: (peerId: string) => void;
  removePeer: (peerId: string) => void;
  setError: (error: string | null) => void;
}

export function BluetoothPanel({
  peers,
  isScanning,
  isSupported,
  isSecureContext,
  error,
  scanForDevices,
  connectToDevice,
  disconnectDevice,
  removePeer,
  setError,
}: BluetoothPanelProps) {
  const getStatusColor = (status: BluetoothPeer['status']) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500 animate-pulse';
      case 'discovered': return 'bg-blue-500';
      case 'disconnected': return 'bg-red-500';
    }
  };

  const getStatusText = (status: BluetoothPeer['status']) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'discovered': return 'Ready';
      case 'disconnected': return 'Disconnected';
    }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
            <Bluetooth className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Bluetooth Connect</h2>
            <p className="text-xs text-gray-400">Connect without WiFi/LAN</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isSupported && isSecureContext ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-400">
            {isSupported && isSecureContext ? 'Available' : 'Unavailable'}
          </span>
        </div>
      </div>

      {/* Support Warning */}
      {(!isSupported || !isSecureContext) && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-300 mb-1">
                {!isSecureContext ? 'HTTPS Required' : 'Bluetooth Not Supported'}
              </p>
              <p className="text-xs text-amber-200/70">
                {!isSecureContext 
                  ? 'Bluetooth requires a secure context. Please access this page via HTTPS or localhost.'
                  : 'Web Bluetooth is only supported in Chrome, Edge, and Opera browsers. For the best experience, use LAN transfer instead.'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs px-2 py-1 bg-amber-500/10 rounded text-amber-300">Chrome ✓</span>
                <span className="text-xs px-2 py-1 bg-amber-500/10 rounded text-amber-300">Edge ✓</span>
                <span className="text-xs px-2 py-1 bg-amber-500/10 rounded text-amber-300">Opera ✓</span>
                <span className="text-xs px-2 py-1 bg-gray-700/50 rounded text-gray-500">Firefox ✗</span>
                <span className="text-xs px-2 py-1 bg-gray-700/50 rounded text-gray-500">Safari ✗</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Speed Warning */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-300 mb-1">Bluetooth Speed Expectations</p>
            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 flex items-center gap-1">
                  <Wifi className="w-3 h-3 text-green-400" /> LAN Transfer
                </span>
                <span className="text-green-400 font-bold">100+ MB/s ⚡</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 flex items-center gap-1">
                  <Bluetooth className="w-3 h-3 text-blue-400" /> Bluetooth (BLE)
                </span>
                <span className="text-amber-400 font-bold">~0.1-0.5 MB/s</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Bluetooth is slower but works without any network. Best for small files, codes, or when no WiFi is available.
            </p>
          </div>
        </div>
      </div>

      {/* Scan Button */}
      {isSupported && isSecureContext && (
        <div className="space-y-2">
          <button
            onClick={scanForDevices}
            disabled={isScanning}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-white rounded-xl font-medium text-sm transition-all duration-200 shadow-lg shadow-indigo-500/20 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {isScanning ? (
              <>
                <Search className="w-4 h-4 animate-spin" />
                Opening Device Picker...
              </>
            ) : (
              <>
                <Radio className="w-4 h-4" />
                Scan for Bluetooth Devices
              </>
            )}
          </button>
          
          {isScanning && (
            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-3">
              <p className="text-xs text-indigo-300 text-center">
                📱 A device picker dialog should appear. Select a Bluetooth device to connect.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-300 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Discovered Devices */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bluetooth className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Discovered Devices</span>
            <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">{peers.length}</span>
          </div>
        </div>

        {peers.length === 0 ? (
          <div className="text-center py-8">
            <BluetoothOff className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No devices discovered</p>
            <p className="text-xs text-gray-600 mt-1">Click scan to find nearby Bluetooth devices</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {peers.map(peer => (
              <div key={peer.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl border border-gray-700/20 hover:border-gray-600/30 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white">
                      <Bluetooth className="w-4 h-4" />
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-900 ${getStatusColor(peer.status)}`} />
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{peer.name}</p>
                    <p className="text-xs text-gray-500">{getStatusText(peer.status)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {peer.status === 'discovered' && (
                    <button
                      onClick={() => connectToDevice(peer.id)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg font-medium transition-colors"
                    >
                      Connect
                    </button>
                  )}
                  {peer.status === 'connected' && (
                    <button
                      onClick={() => disconnectDevice(peer.id)}
                      className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs rounded-lg font-medium transition-colors"
                    >
                      Disconnect
                    </button>
                  )}
                  <button
                    onClick={() => removePeer(peer.id)}
                    className="p-1.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Use Cases */}
      <div className="bg-gray-800/30 border border-gray-700/20 rounded-xl p-4">
        <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">Best Use Cases for Bluetooth</h4>
        <div className="space-y-2">
          {[
            { icon: '📱', text: 'Share connection codes between devices' },
            { icon: '📄', text: 'Transfer small documents (< 10MB)' },
            { icon: '🔑', text: 'Exchange authentication tokens' },
            { icon: '📍', text: 'Share location or contact info' },
            { icon: '🚫', text: 'When no WiFi/network is available' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
