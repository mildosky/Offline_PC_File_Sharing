import { useState, useEffect } from 'react';
import { ConnectionPanel } from './components/ConnectionPanel';
import { FileTransfer } from './components/FileTransfer';
import { ChatPanel } from './components/ChatPanel';
import { NetworkStatus } from './components/NetworkStatus';
import { BluetoothPanel } from './components/BluetoothPanel';
import { QRConnectionPanel } from './components/QRConnectionPanel';
import { MobileConnect } from './components/MobileConnect';
import { USBConnectionPanel } from './components/USBConnectionPanel';
import { TitleBar } from './components/TitleBar';
import { SettingsPanel } from './components/SettingsPanel';
import { usePeerConnection } from './hooks/usePeerConnection';
import { useBluetooth } from './hooks/useBluetooth';
import { 
  Network, HardDrive, MessageSquare, 
  Bluetooth as BluetoothIcon, Settings, 
  Download, Monitor, Wifi, Users,
  Zap, Shield, ChevronRight, FolderOpen,
  Activity, Bell, Info, Smartphone, QrCode, Usb
} from 'lucide-react';

type Tab = 'connections' | 'transfer' | 'chat' | 'bluetooth' | 'mobile' | 'usb' | 'settings';

// Detect if we're in mobile mode
const isMobileMode = () => {
  return window.location.pathname.includes('/mobile') || 
         window.location.hash.includes('mobile') ||
         /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

function App() {
  // Check if mobile mode
  const [mobileMode, setMobileMode] = useState(isMobileMode());
  
  // If mobile mode, render mobile interface
  if (mobileMode) {
    return <MobileConnect />;
  }
  const [activeTab, setActiveTab] = useState<Tab>('connections');
  const [isElectron, setIsElectron] = useState(false);
  const [localIPs, setLocalIPs] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; time: Date }>>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  
  const {
    peers,
    transfers,
    messages,
    myPeerId,
    myPeerName,
    setMyPeerName,
    myCode,
    isListening,
    globalSpeed,
    generateConnectionCode,
    connectWithCode,
    applyAnswer,
    sendFile,
    sendChatMessage,
    disconnectPeer,
    addDemoPeer,
  } = usePeerConnection();

  const {
    peers: bluetoothPeers,
    isScanning,
    isSupported: bluetoothSupported,
    isSecureContext,
    error: bluetoothError,
    scanForDevices,
    connectToDevice: connectBluetoothDevice,
    disconnectDevice: disconnectBluetoothDevice,
    removePeer: removeBluetoothPeer,
    setError: setBluetoothError,
  } = useBluetooth();

  // Detect Electron environment
  useEffect(() => {
    const electron = typeof window !== 'undefined' && window.electronAPI?.isElectron;
    setIsElectron(!!electron);
    
    if (electron && window.electronAPI) {
      // Get local IPs from Electron
      window.electronAPI.getLocalIP().then(ips => setLocalIPs(ips));
      
      // Listen for auto-discovered peers
      window.electronAPI.onPeerDiscovered((peer) => {
        console.log('Auto-discovered peer:', peer);
        // Could auto-add to peers list
      });
      
      // Listen for tray actions
      window.electronAPI.onTrayAction((action) => {
        if (action === 'start-listening') {
          generateConnectionCode();
        }
      });
    }
  }, []);

  const addNotification = (title: string, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, title, message, time: new Date() }]);
    
    if (isElectron && window.electronAPI) {
      window.electronAPI.showNotification({ title, body: message });
    }
  };

  const connectedPeers = peers.filter(p => p.status === 'connected');
  const activeTransfers = transfers.filter(t => t.status === 'sending' || t.status === 'receiving');

  const navItems = [
    { id: 'connections' as Tab, label: 'Connections', icon: Network, badge: connectedPeers.length || undefined },
    { id: 'mobile' as Tab, label: 'Mobile Connect', icon: Smartphone },
    { id: 'transfer' as Tab, label: 'File Transfer', icon: HardDrive, badge: activeTransfers.length || undefined },
    { id: 'chat' as Tab, label: 'Chat', icon: MessageSquare },
    { id: 'bluetooth' as Tab, label: 'Bluetooth', icon: BluetoothIcon },
    { id: 'usb' as Tab, label: 'USB Direct', icon: Usb },
    { id: 'settings' as Tab, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      {/* Custom Title Bar (Electron only) */}
      <TitleBar isElectron={isElectron} />

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 bg-gray-900/80 border-r border-gray-800/50 flex flex-col">
          {/* App Logo */}
          <div className="p-4 border-b border-gray-800/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Network className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white">NetShare</h1>
                <p className="text-[10px] text-gray-500">v1.0 Desktop</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-0.5">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group ${
                  activeTab === item.id
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full min-w-[20px] text-center">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Sidebar Footer - Status */}
          <div className="p-3 border-t border-gray-800/50 space-y-2">
            {/* Connection Status */}
            <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-800/30 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
              <span className="text-xs text-gray-400">
                {isListening ? 'Listening' : 'Offline'}
              </span>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-gray-800/30 rounded-lg p-2 text-center">
                <p className="text-xs font-bold text-white">{connectedPeers.length}</p>
                <p className="text-[10px] text-gray-500">Peers</p>
              </div>
              <div className="bg-gray-800/30 rounded-lg p-2 text-center">
                <p className="text-xs font-bold text-white">{transfers.length}</p>
                <p className="text-[10px] text-gray-500">Transfers</p>
              </div>
            </div>

            {/* Electron badge */}
            {isElectron && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-lg">
                <Monitor className="w-3 h-3 text-green-400" />
                <span className="text-[10px] text-green-400 font-medium">Desktop App</span>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <div className="h-12 border-b border-gray-800/50 bg-gray-900/30 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-white">
                {navItems.find(n => n.id === activeTab)?.label}
              </h2>
              {isElectron && localIPs.length > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-800/50 rounded text-xs text-gray-400">
                  <Wifi className="w-3 h-3" />
                  <span className="font-mono">{localIPs[0]}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Speed indicator */}
              {activeTransfers.length > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                  <Zap className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-green-400 font-mono font-bold">
                    {(globalSpeed.bytesPerSecond / 1_000_000).toFixed(1)} MB/s
                  </span>
                </div>
              )}
              
              {/* Notifications */}
              <button
                onClick={() => setShowNotifPanel(!showNotifPanel)}
                className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'connections' && (
              <div className="max-w-3xl mx-auto space-y-6">
                <NetworkStatus
                  isListening={isListening}
                  peerCount={connectedPeers.length}
                  activeTransfers={activeTransfers.length}
                  isElectron={isElectron}
                  localIPs={localIPs}
                />
                <ConnectionPanel
                  myPeerName={myPeerName}
                  setMyPeerName={setMyPeerName}
                  myCode={myCode}
                  isListening={isListening}
                  peers={peers}
                  generateConnectionCode={generateConnectionCode}
                  connectWithCode={connectWithCode}
                  applyAnswer={applyAnswer}
                  disconnectPeer={disconnectPeer}
                  addDemoPeer={addDemoPeer}
                  isElectron={isElectron}
                />
              </div>
            )}

            {activeTab === 'mobile' && (
              <div className="max-w-3xl mx-auto">
                <QRConnectionPanel peerConnection={{
                  myPeerId,
                  myPeerName,
                  generateConnectionCode,
                  connectWithCode,
                  applyAnswer,
                  peers,
                }} />
              </div>
            )}

            {activeTab === 'bluetooth' && (
              <div className="max-w-3xl mx-auto">
                <BluetoothPanel
                  peers={bluetoothPeers}
                  isScanning={isScanning}
                  isSupported={bluetoothSupported}
                  isSecureContext={isSecureContext}
                  error={bluetoothError}
                  scanForDevices={scanForDevices}
                  connectToDevice={connectBluetoothDevice}
                  disconnectDevice={disconnectBluetoothDevice}
                  removePeer={removeBluetoothPeer}
                  setError={setBluetoothError}
                />
              </div>
            )}

            {activeTab === 'usb' && (
              <div className="max-w-3xl mx-auto">
                <USBConnectionPanel />
              </div>
            )}

            {activeTab === 'transfer' && (
              <div className="max-w-3xl mx-auto">
                <FileTransfer
                  peers={peers}
                  transfers={transfers}
                  sendFile={sendFile}
                  globalSpeed={globalSpeed}
                  isElectron={isElectron}
                />
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="max-w-3xl mx-auto">
                <ChatPanel
                  peers={peers}
                  messages={messages}
                  sendChatMessage={sendChatMessage}
                  myPeerId={myPeerId}
                />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-3xl mx-auto">
                <SettingsPanel isElectron={isElectron} />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Status Bar (bottom) */}
      <div className="h-6 bg-gray-900 border-t border-gray-800/50 flex items-center justify-between px-3 text-[10px] text-gray-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-green-500' : 'bg-gray-600'}`} />
            {isListening ? 'Connected' : 'Disconnected'}
          </span>
          {isElectron && (
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Desktop Mode
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span>{peers.length} peer{peers.length !== 1 ? 's' : ''}</span>
          <span>•</span>
          <span>{transfers.length} transfers</span>
          {isElectron && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                Electron v{navigator.userAgent.match(/Electron\/([\d.]+)/)?.[1] || '?'}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
