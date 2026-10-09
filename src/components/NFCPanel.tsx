import React, { useState, useEffect } from 'react';
import { Smartphone, Radio, CheckCircle, XCircle, Loader, Zap, AlertTriangle, Wifi } from 'lucide-react';

interface NFCPanelProps {
  isElectron?: boolean;
}

interface NFCDevice {
  id: string;
  name: string;
  type: string;
  status: 'detected' | 'connecting' | 'connected' | 'transferring';
  transferProgress?: number;
}

export const NFCPanel: React.FC<NFCPanelProps> = ({ isElectron = false }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [detectedDevices, setDetectedDevices] = useState<NFCDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<NFCDevice | null>(null);
  const [error, setError] = useState<string>('');
  const [connectionMode, setConnectionMode] = useState<'tap' | 'manual'>('tap');
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    checkSupport();
  }, []);

  const checkSupport = async () => {
    if (isElectron && window.electronAPI) {
      try {
        const supported = await window.electronAPI.checkNFCSupport();
        setIsSupported(supported);
      } catch {
        setIsSupported(false);
      }
    } else {
      setIsSupported(false);
      setError('⚠️ NFC requires the desktop app (.exe). This is a DEMO preview only - connections will not actually work in browser mode.');
    }
  };

  const handleStartScan = async () => {
    setIsScanning(true);
    setError('');

    try {
      if (isElectron && window.electronAPI) {
        await window.electronAPI.startNFCScan();
        
        // Listen for NFC device detection
        window.electronAPI.onNFCDeviceDetected((device) => {
          setDetectedDevices(prev => {
            const exists = prev.find(d => d.id === device.id);
            if (exists) return prev;
            return [...prev, { ...device, status: 'detected' as const }];
          });
        });
      } else {
        // Demo mode - show warning
        setError('🎭 DEMO MODE: These are fake devices. NFC only works in the desktop app (.exe). Build and run the .exe to use real NFC connections.');
        
        // Still show demo data for UI preview
        await new Promise(resolve => setTimeout(resolve, 1500));
        setDetectedDevices([
          {
            id: 'nfc-001',
            name: '🎭 DEMO - Musah-Phone',
            type: 'smartphone',
            status: 'detected',
          },
          {
            id: 'nfc-002',
            name: '🎭 DEMO - Ibrahim-Tablet',
            type: 'tablet',
            status: 'detected',
          },
        ]);
      }
    } catch (err: any) {
      setError(`❌ NFC scan failed: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleStopScan = async () => {
    try {
      if (isElectron && window.electronAPI) {
        await window.electronAPI.stopNFCScan();
      }
      setIsScanning(false);
    } catch (err: any) {
      setError(`Failed to stop scan: ${err.message}`);
    }
  };

  const handleConnectToDevice = async (device: NFCDevice) => {
    setError('');
    setDetectedDevices(prev => prev.map(d => d.id === device.id ? { ...d, status: 'connecting' as const } : d));

    try {
      // NFC connection typically triggers WiFi Direct pairing
      if (isElectron && window.electronAPI) {
        // Send NDEF message with connection info
        const connectionInfo = JSON.stringify({
          type: 'netshare-pairing',
          deviceName: 'NetShare-PC',
          timestamp: Date.now(),
        });
        await window.electronAPI.sendNDEFMessage(connectionInfo);
      } else {
        // Demo mode
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      setConnectedDevice({ ...device, status: 'connected' });
      setDetectedDevices(prev => prev.map(d => d.id === device.id ? { ...d, status: 'connected' as const } : d));
    } catch (err: any) {
      setError(`Connection failed: ${err.message}`);
      setDetectedDevices(prev => prev.map(d => d.id === device.id ? { ...d, status: 'detected' as const } : d));
    }
  };

  const handleDisconnect = async () => {
    setConnectedDevice(null);
    setDetectedDevices([]);
  };

  const handleManualConnect = async () => {
    if (!manualCode.trim()) {
      setError('Please enter a pairing code');
      return;
    }

    setError('');
    try {
      // In real implementation, this would validate the code and establish connection
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setConnectedDevice({
        id: 'manual-' + Date.now(),
        name: 'Manual Device',
        type: 'unknown',
        status: 'connected',
      });
    } catch (err: any) {
      setError(`Manual connection failed: ${err.message}`);
    }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">NFC + WiFi Direct</h2>
            <p className="text-xs text-gray-400">Tap to connect, then transfer at WiFi speeds</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isSupported ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-400">{isSupported ? 'Supported' : 'Unavailable'}</span>
        </div>
      </div>

      {/* Support Warning */}
      {!isSupported && !isElectron && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-300 mb-1">NFC Requires Desktop App</p>
              <p className="text-xs text-amber-200/70">
                NFC uses native OS APIs not available in browsers. Build the desktop .exe to use this feature.
                Demo mode is available below for preview.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs px-2 py-1 bg-amber-500/10 rounded text-amber-300">Windows 10+ ✓</span>
                <span className="text-xs px-2 py-1 bg-amber-500/10 rounded text-amber-300">Android 4.0+ ✓</span>
                <span className="text-xs px-2 py-1 bg-gray-700/50 rounded text-gray-500">Linux ✗</span>
                <span className="text-xs px-2 py-1 bg-gray-700/50 rounded text-gray-500">macOS ✗</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* How it Works */}
      <div className="bg-pink-500/5 border border-pink-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-pink-300 mb-2">How NFC + WiFi Direct Works</p>
            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex items-start gap-2">
                <span className="text-pink-400 font-bold">1.</span>
                <span><strong>Tap devices together</strong> — NFC establishes instant connection (&lt; 1 second)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-pink-400 font-bold">2.</span>
                <span><strong>Automatic WiFi Direct pairing</strong> — Devices exchange connection info via NFC</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-pink-400 font-bold">3.</span>
                <span><strong>High-speed transfer</strong> — Data flows over WiFi Direct at 50-250 MB/s</span>
              </div>
            </div>
            <div className="mt-3 p-2 bg-gray-800/50 rounded-lg">
              <p className="text-xs text-gray-500">
                <strong className="text-gray-400">Best of both worlds:</strong> NFC provides instant, user-friendly connection. WiFi Direct provides high-speed data transfer.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Mode Selection */}
      {!connectedDevice && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setConnectionMode('tap')}
              className={`p-3 rounded-xl border text-left transition-all ${
                connectionMode === 'tap'
                  ? 'bg-pink-500/10 border-pink-500/30'
                  : 'bg-gray-800/30 border-gray-700/20 hover:border-gray-600/30'
              }`}
            >
              <Smartphone className="w-5 h-5 text-pink-400 mb-2" />
              <p className="text-sm font-medium text-white">Tap to Connect</p>
              <p className="text-xs text-gray-500">Bring devices close together</p>
            </button>
            <button
              onClick={() => setConnectionMode('manual')}
              className={`p-3 rounded-xl border text-left transition-all ${
                connectionMode === 'manual'
                  ? 'bg-pink-500/10 border-pink-500/30'
                  : 'bg-gray-800/30 border-gray-700/20 hover:border-gray-600/30'
              }`}
            >
              <Radio className="w-5 h-5 text-purple-400 mb-2" />
              <p className="text-sm font-medium text-white">Manual Pairing</p>
              <p className="text-xs text-gray-500">Enter pairing code</p>
            </button>
          </div>

          {/* Tap Mode */}
          {connectionMode === 'tap' && (
            <div className="space-y-3">
              {!isScanning ? (
                <button
                  onClick={handleStartScan}
                  className="w-full py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  Start NFC Scanning
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/30 rounded-xl p-6 text-center">
                    <div className="relative w-24 h-24 mx-auto mb-4">
                      <div className="absolute inset-0 bg-pink-500/20 rounded-full animate-ping" />
                      <div className="absolute inset-2 bg-pink-500/30 rounded-full animate-pulse" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Smartphone className="w-10 h-10 text-pink-400" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-pink-300 mb-1">Scanning for NFC Devices...</p>
                    <p className="text-xs text-gray-400">Bring your phone or device close to the NFC reader</p>
                  </div>
                  <button
                    onClick={handleStopScan}
                    className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    Stop Scanning
                  </button>
                </div>
              )}

              {detectedDevices.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Detected Devices</p>
                  {detectedDevices.map(device => (
                    <div key={device.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl border border-gray-700/20 hover:border-gray-600/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm text-white font-medium">{device.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{device.type}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleConnectToDevice(device)}
                        disabled={device.status === 'connecting'}
                        className="px-3 py-1.5 bg-pink-600 hover:bg-pink-500 disabled:bg-gray-700 text-white text-xs rounded-lg font-medium transition-colors"
                      >
                        {device.status === 'connecting' ? 'Connecting...' : 'Connect'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Manual Mode */}
          {connectionMode === 'manual' && (
            <div className="space-y-3">
              <div className="bg-gray-800/30 border border-gray-700/20 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-3">
                  Enter the pairing code displayed on the other device:
                </p>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Enter pairing code..."
                  className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                />
              </div>
              <button
                onClick={handleManualConnect}
                disabled={!manualCode.trim()}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-purple-500/20 disabled:shadow-none"
              >
                Connect Manually
              </button>
            </div>
          )}
        </div>
      )}

      {/* Connected State */}
      {connectedDevice && (
        <div className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-sm font-semibold text-green-300">Connected via NFC</p>
                <p className="text-xs text-gray-400">WiFi Direct link established</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                <span className="text-xs text-gray-400">Connected to</span>
                <span className="text-xs text-white font-medium">{connectedDevice.name}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                <span className="text-xs text-gray-400">Connection method</span>
                <div className="flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-pink-400" />
                  <Wifi className="w-3 h-3 text-teal-400" />
                  <span className="text-xs text-white">NFC + WiFi Direct</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                <span className="text-xs text-gray-400">Transfer speed</span>
                <span className="text-xs text-teal-400 font-bold">Up to 250 MB/s</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="w-full py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl text-sm font-medium transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {/* Use Cases */}
      <div className="bg-gray-800/30 border border-gray-700/20 rounded-xl p-4">
        <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">Best Use Cases</h4>
        <div className="space-y-2 text-xs text-gray-400">
          <div className="flex items-start gap-2">
            <span className="text-pink-400">📱</span>
            <span>Quick phone-to-PC transfers with tap-to-connect</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-pink-400">🎪</span>
            <span>Event scenarios — instant pairing between multiple devices</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-pink-400">💼</span>
            <span>Business meetings — share files without network setup</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-pink-400">🎓</span>
            <span>Classrooms — teacher to student file distribution</span>
          </div>
        </div>
      </div>
    </div>
  );
};
