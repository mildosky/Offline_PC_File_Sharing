const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  selectFiles: () => ipcRenderer.invoke('select-files'),
  saveFile: (options) => ipcRenderer.invoke('save-file', options),
  openFileLocation: (filePath) => ipcRenderer.invoke('open-file-location', filePath),
  
  // System info
  getLocalIP: () => ipcRenderer.invoke('get-local-ip'),
  
  // Notifications
  showNotification: (options) => ipcRenderer.invoke('show-notification', options),
  
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  
  // Event listeners
  onPeerDiscovered: (callback) => {
    ipcRenderer.on('peer-discovered', (event, data) => callback(data));
  },
  onTrayAction: (callback) => {
    ipcRenderer.on('tray-action', (event, action) => callback(action));
  },
  
  // Platform info
  platform: process.platform,
  isElectron: true,
});
