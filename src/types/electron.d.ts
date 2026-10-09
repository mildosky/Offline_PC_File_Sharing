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
  
  // Event listeners
  onPeerDiscovered: (callback: (data: { id: string; name: string; host: string; port: number; addresses: string[] }) => void) => void;
  onTrayAction: (callback: (action: string) => void) => void;
  
  // Platform info
  platform: string;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
