// Type definitions for Electron API exposed via preload script

export interface ElectronAPI {
  // File operations
  selectFiles: () => Promise<string[]>;
  saveFile: (options: { fileName: string; suggestedName: string }) => Promise<string | undefined>;
  openFileLocation: (filePath: string) => Promise<void>;
  
  // System info
  getLocalIP: () => Promise<string[]>;
  
  // Notifications
  showNotification: (options: { title: string; body: string }) => Promise<void>;
  
  // Window controls
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  
  // WiFi Direct
  checkWiFiDirectSupport: () => Promise<boolean>;
  scanWiFiDirectPeers: () => Promise<Array<{
    id: string;
    name: string;
    signalStrength: number;
    status: string;
    isGroupOwner: boolean;
    frequency?: string;
  }>>;
  createWiFiDirectGroup: () => Promise<{ name: string; ip: string; pin: string }>;
  connectToWiFiDirectPeer: (peerId: string) => Promise<void>;
  disconnectWiFiDirect: () => Promise<void>;
  
  // NFC
  checkNFCSupport: () => Promise<boolean>;
  startNFCScan: () => Promise<void>;
  stopNFCScan: () => Promise<void>;
  sendNDEFMessage: (message: string) => Promise<boolean>;
  
  // Event listeners
  onPeerDiscovered: (callback: (data: { id: string; name: string; host: string; port: number; addresses: string[] }) => void) => void;
  onTrayAction: (callback: (action: string) => void) => void;
  onNFCDeviceDetected: (callback: (device: { id: string; name: string; type: string }) => void) => void;
  onDeepLink: (callback: (url: string) => void) => void;
  
  // Platform info
  platform: string;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
