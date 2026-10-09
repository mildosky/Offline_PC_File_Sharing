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
  
  // WiFi Direct
  checkWiFiDirectSupport: () => ipcRenderer.invoke('check-wifi-direct-support'),
  scanWiFiDirectPeers: () => ipcRenderer.invoke('scan-wifi-direct-peers'),
  createWiFiDirectGroup: () => ipcRenderer.invoke('create-wifi-direct-group'),
  connectToWiFiDirectPeer: (peerId) => ipcRenderer.invoke('connect-to-wifi-direct-peer', peerId),
  disconnectWiFiDirect: () => ipcRenderer.invoke('disconnect-wifi-direct'),
  
  // NFC
  checkNFCSupport: () => ipcRenderer.invoke('check-nfc-support'),
  startNFCScan: () => ipcRenderer.invoke('start-nfc-scan'),
  stopNFCScan: () => ipcRenderer.invoke('stop-nfc-scan'),
  sendNDEFMessage: (message) => ipcRenderer.invoke('send-ndef-message', message),
  
  // Event listeners
  onPeerDiscovered: (callback) => {
    ipcRenderer.on('peer-discovered', (event, data) => callback(data));
  },
  onTrayAction: (callback) => {
    ipcRenderer.on('tray-action', (event, action) => callback(action));
  },
  onNFCDeviceDetected: (callback) => {
    ipcRenderer.on('nfc-device-detected', (event, device) => callback(device));
  },
  
  // Platform info
  platform: process.platform,
  isElectron: true,
});
