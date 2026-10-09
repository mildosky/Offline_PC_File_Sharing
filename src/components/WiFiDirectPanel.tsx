import React, { useState, useEffect, useRef } from 'react';
import { Wifi, Radio, Signal, SignalHigh, SignalLow, Users, CheckCircle, XCircle, Loader, Zap, Info, AlertTriangle, Shield, Globe } from 'lucide-react';

interface WiFiDirectPanelProps {
  isElectron?: boolean;
  onPeerConnected?: (peer: { id: string; name: string; status: 'connected' }) => void;
}

interface WiFiDirectPeer {
  id: string;
  name: string;
  signalStrength: number;
  status: 'available' | 'connecting' | 'connected' | 'group-owner';
  isGroupOwner: boolean;
  ipAddress?: string;
  frequency?: string;
}

export const WiFiDirectPanel: React.FC<WiFiDirectPanelProps> = ({ isElectron = false, onPeerConnected }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [peers, setPeers] = useState<WiFiDirectPeer[]>([]);
  const [connectedPeer, setConnectedPeer] = useState<WiFiDirectPeer | null>(null);
  const [isGroupOwner, setIsGroupOwner] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupIP, setGroupIP] = useState('');
  const [error, setError] = useState<string>('');
  const [connectionMode, setConnectionMode] = useState<'discover' | 'create-group' | 'join-group'>('discover');
  const [pin, setPin] = useState('');

  useEffect(() => {
    checkSupport();
  }, []);

  const checkSupport = async () => {
    // WiFi Direct is supported on Windows 8+, Android 4.0+, and some Linux
    if (isElectron && window.electronAPI) {
      try {
        const supported = await window.electronAPI.checkWiFiDirectSupport();
        setIsSupported(supported);
      } catch {
        setIsSupported(navigator.userAgent.includes('Windows'));
      }
    } else {
      // In browser, WiFi Direct requires native APIs
      setIsSupported(false);
      setError('⚠️ WiFi Direct requires the desktop app (.exe). This is a DEMO preview only - connections will not actually work in browser mode.');
    }
  };

  const handleStartScan = async () => {
    setIsScanning(true);
    setError('');

    try {
      if (isElectron && window.electronAPI) {
        const discoveredPeers = await window.electronAPI.scanWiFiDirectPeers();
        setPeers(discoveredPeers as WiFiDirectPeer[]);
      } else {
        // Demo mode - show warning
        setError('🎭 DEMO MODE: These are fake devices. WiFi Direct only works in the desktop app (.exe). Build and run the .exe to use real WiFi Direct connections.');
        
        // Still show demo data for UI preview
        await new Promise(resolve => setTimeout(resolve, 1500));
        setPeers([
          {
            id: 'wfd-001',
            name: '🎭 DEMO - Musah-Laptop',
            signalStrength: 85,
            status: 'available',
            isGroupOwner: true,
            frequency: '5 GHz',
          },
          {
            id: 'wfd-002',
            name: '🎭 DEMO - Ibrahim-Phone',
            signalStrength: 72,
            status: 'available',
            isGroupOwner: false,
            frequency: '2.4 GHz',
          },
          {
            id: 'wfd-003',
            name: '🎭 DEMO - Office-Printer',
            signalStrength: 45,
            status: 'available',
            isGroupOwner: true,
            frequency: '2.4 GHz',
          },
        ]);
      }
    } catch (err: any) {
      setError(`❌ Scan failed: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleCreateGroup = async () => {
    setError('');
    try {
      if (isElectron && window.electronAPI) {
        const group = await window.electronAPI.createWiFiDirectGroup();
        setIsGroupOwner(true);
        setGroupName(group.name);
        setGroupIP(group.ip);
        setPin(group.pin);
      } else {
        // Demo mode
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsGroupOwner(true);
        setGroupName('NETSHARE-' + Math.random().toString(36).substr(2, 4).toUpperCase());
        setGroupIP('192.168.49.1');
        setPin(Math.floor(10000000 + Math.random() * 90000000).toString());
      }
      setConnectionMode('create-group');
    } catch (err: any) {
      setError(`Failed to create group: ${err.message}`);
    }
  };

  const handleConnectToPeer = async (peer: WiFiDirectPeer) => {
    setError('');
    setPeers(prev => prev.map(p => p.id === peer.id ? { ...p, status: 'connecting' as const } : p));

    try {
      if (isElectron && window.electronAPI) {
        await window.electronAPI.connectToWiFiDirectPeer(peer.id);
      } else {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      setConnectedPeer({ ...peer, status: 'connected', ipAddress: '192.168.49.' + Math.floor(Math.random() * 254 + 2) });
      setPeers(prev => prev.map(p => p.id === peer.id ? { ...p, status: 'connected' as const } : p));
      
      // Notify parent component about the connected peer
      if (onPeerConnected) {
        onPeerConnected({
          id: peer.id,
          name: peer.name,
          status: 'connected'
        });
      }
    } catch (err: any) {
      setError(`Connection failed: ${err.message}`);
      setPeers(prev => prev.map(p => p.id === peer.id ? { ...p, status: 'available' as const } : p));
    }
  };

  const handleDisconnect = async () => {
    try {
      if (isElectron && window.electronAPI) {
        await window.electronAPI.disconnectWiFiDirect();
      }
      setConnectedPeer(null);
      setIsGroupOwner(false);
      setGroupName('');
      setGroupIP('');
      setPin('');
      setConnectionMode('discover');
    } catch (err: any) {
      setError(`Disconnect failed: ${err.message}`);
    }
  };

  const getSignalIcon = (strength: number) => {
    if (strength >= 75) return <SignalHigh className="w-4 h-4 text-green-400" />;
    if (strength >= 50) return <Signal className="w-4 h-4 text-yellow-400" />;
    return <SignalLow className="w-4 h-4 text-orange-400" />;
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
            <Wifi className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">WiFi Direct</h2>
            <p className="text-xs text-gray-400">Peer-to-peer without router</p>
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
              <p className="text-sm font-medium text-amber-300 mb-1">WiFi Direct Requires Desktop App</p>
              <p className="text-xs text-amber-200/70">
                WiFi Direct uses native OS APIs not available in browsers. Build the desktop .exe to use this feature.
                Demo mode is available below for preview.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs px-2 py-1 bg-amber-500/10 rounded text-amber-300">Windows 8+ ✓</span>
                <span className="text-xs px-2 py-1 bg-amber-500/10 rounded text-amber-300">Android 4.0+ ✓</span>
                <span className="text-xs px-2 py-1 bg-amber-500/10 rounded text-amber-300">Linux (wpa_supplicant) ✓</span>
                <span className="text-xs px-2 py-1 bg-gray-700/50 rounded text-gray-500">macOS ✗</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Speed Info */}
      <div className="bg-teal-500/5 border border-teal-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-teal-300 mb-1">WiFi Direct Speeds</p>
            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 flex items-center gap-1">
                  <Wifi className="w-3 h-3 text-teal-400" /> WiFi Direct (802.11ac)
                </span>
                <span className="text-teal-400 font-bold">Up to 250 MB/s</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 flex items-center gap-1">
                  <Wifi className="w-3 h-3 text-blue-400" /> WiFi Direct (802.11n)
                </span>
                <span className="text-blue-400 font-bold">Up to 75 MB/s</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-green-400" /> Regular LAN
                </span>
                <span className="text-green-400 font-bold">Up to 120 MB/s</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              No router needed! Devices connect directly to each other over WiFi.
            </p>
          </div>
        </div>
      </div>

      {/* Connection Mode Selection */}
      {!connectedPeer && !isGroupOwner && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setConnectionMode('discover')}
              className={`p-3 rounded-xl border text-left transition-all ${
                connectionMode === 'discover'
                  ? 'bg-teal-500/10 border-teal-500/30'
                  : 'bg-gray-800/30 border-gray-700/20 hover:border-gray-600/30'
              }`}
            >
              <Radio className="w-5 h-5 text-teal-400 mb-2" />
              <p className="text-sm font-medium text-white">Discover Peers</p>
              <p className="text-xs text-gray-500">Find nearby WiFi Direct devices</p>
            </button>
            <button
              onClick={handleCreateGroup}
              className="p-3 rounded-xl border border-gray-700/20 bg-gray-800/30 hover:border-gray-600/30 text-left transition-all"
            >
              <Users className="w-5 h-5 text-purple-400 mb-2" />
              <p className="text-sm font-medium text-white">Create Group</p>
              <p className="text-xs text-gray-500">Become group owner</p>
            </button>
          </div>

          {/* Discover Mode */}
          {connectionMode === 'discover' && (
            <div className="space-y-3">
              <button
                onClick={handleStartScan}
                disabled={isScanning}
                className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-teal-500/20 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {isScanning ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Scanning for Devices...
                  </>
                ) : (
                  <>
                    <Radio className="w-4 h-4" />
                    Scan for WiFi Direct Devices
                  </>
                )}
              </button>

              {peers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Discovered Devices</p>
                  {peers.map(peer => (
                    <div key={peer.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl border border-gray-700/20 hover:border-gray-600/30 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white">
                            <Wifi className="w-4 h-4" />
                          </div>
                          {peer.isGroupOwner && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-[8px] text-white font-bold">GO</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-white font-medium">{peer.name}</p>
                          <div className="flex items-center gap-2">
                            {getSignalIcon(peer.signalStrength)}
                            <span className="text-xs text-gray-500">{peer.signalStrength}% • {peer.frequency}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleConnectToPeer(peer)}
                        disabled={peer.status === 'connecting'}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:bg-gray-700 text-white text-xs rounded-lg font-medium transition-colors"
                      >
                        {peer.status === 'connecting' ? 'Connecting...' : 'Connect'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Group Owner Mode */}
      {isGroupOwner && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-6 h-6 text-purple-400" />
              <div>
                <p className="text-sm font-semibold text-purple-300">Group Created</p>
                <p className="text-xs text-gray-400">Other devices can now connect to you</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                <span className="text-xs text-gray-400">Group Name</span>
                <span className="text-xs text-white font-mono font-medium">{groupName}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                <span className="text-xs text-gray-400">Group IP</span>
                <span className="text-xs text-white font-mono">{groupIP}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                <span className="text-xs text-gray-400">WPS PIN</span>
                <span className="text-xs text-white font-mono tracking-wider">{pin}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Share the group name and PIN with other devices to connect.
            </p>
          </div>
          <button
            onClick={handleDisconnect}
            className="w-full py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl text-sm font-medium transition-colors"
          >
            Disband Group
          </button>
        </div>
      )}

      {/* Connected State */}
      {connectedPeer && (
        <div className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-sm font-semibold text-green-300">WiFi Direct Connected</p>
                <p className="text-xs text-gray-400">Direct peer-to-peer link established</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                <span className="text-xs text-gray-400">Connected to</span>
                <span className="text-xs text-white font-medium">{connectedPeer.name}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                <span className="text-xs text-gray-400">IP Address</span>
                <span className="text-xs text-white font-mono">{connectedPeer.ipAddress}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                <span className="text-xs text-gray-400">Signal</span>
                <div className="flex items-center gap-1">
                  {getSignalIcon(connectedPeer.signalStrength)}
                  <span className="text-xs text-white">{connectedPeer.signalStrength}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                <span className="text-xs text-gray-400">Frequency</span>
                <span className="text-xs text-white">{connectedPeer.frequency}</span>
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

      {/* How it works */}
      <div className="bg-gray-800/30 border border-gray-700/20 rounded-xl p-4">
        <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">How WiFi Direct Works</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="text-center">
            <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center mx-auto mb-2">
              <span className="text-xs text-teal-400 font-bold">1</span>
            </div>
            <p className="text-xs text-gray-400">One device creates a WiFi Direct group (becomes "Group Owner")</p>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center mx-auto mb-2">
              <span className="text-xs text-teal-400 font-bold">2</span>
            </div>
            <p className="text-xs text-gray-400">Other devices discover and connect using WPS PIN or push-button</p>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center mx-auto mb-2">
              <span className="text-xs text-teal-400 font-bold">3</span>
            </div>
            <p className="text-xs text-gray-400">Devices communicate directly at WiFi speeds — no router needed!</p>
          </div>
        </div>
      </div>
    </div>
  );
};
