const { app, BrowserWindow, ipcMain, dialog, shell, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const Bonjour = require('bonjour-service');

let mainWindow;
let tray;
let bonjour;

// Create the main application window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false, // Custom title bar
    titleBarStyle: 'hidden',
    backgroundColor: '#030712',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create system tray
function createTray() {
  // Create a simple icon (in production, use a real icon file)
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  );
  
  tray = new Tray(icon);
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Show NetShare', 
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    { 
      label: 'Start Listening', 
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('tray-action', 'start-listening');
        }
      }
    },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => {
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('NetShare - P2P File Sharing');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

// Initialize mDNS/Bonjour for auto-discovery
function initBonjour() {
  bonjour = new Bonjour();
  
  // Publish our service
  const service = bonjour.publish({
    name: 'NetShare-' + process.pid,
    type: 'netshare',
    port: 9876,
    txt: {
      version: '1.0.0',
      protocol: 'webrtc'
    }
  });
  
  console.log('Published NetShare service via mDNS');
  
  // Browse for other NetShare instances
  const browser = bonjour.find({ type: 'netshare' }, (service) => {
    console.log('Found NetShare peer:', service.name);
    if (mainWindow) {
      mainWindow.webContents.send('peer-discovered', {
        id: service.name,
        name: service.name,
        host: service.host,
        port: service.port,
        addresses: service.addresses,
      });
    }
  });
  
  browser.start();
}

// IPC Handlers
ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    title: 'Select Files to Share',
  });
  return result.filePaths;
});

ipcMain.handle('save-file', async (event, { fileName, suggestedName }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: suggestedName,
    title: 'Save File',
  });
  return result.filePath;
});

ipcMain.handle('get-local-ip', async () => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        addresses.push(interface.address);
      }
    }
  }
  
  return addresses;
});

ipcMain.handle('show-notification', async (event, { title, body }) => {
  const { Notification } = require('electron');
  new Notification({ title, body }).show();
});

ipcMain.handle('open-file-location', async (event, filePath) => {
  shell.showItemInFolder(filePath);
});

ipcMain.handle('minimize-window', () => {
  mainWindow.minimize();
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.handle('close-window', () => {
  mainWindow.hide(); // Hide to tray instead of closing
});

// WiFi Direct IPC Handlers
ipcMain.handle('check-wifi-direct-support', async () => {
  const { exec } = require('child_process');
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      exec('netsh wlan show drivers', (error, stdout) => {
        if (error) {
          resolve(false);
        } else {
          // Check if WiFi Direct is supported
          resolve(stdout.includes('Hosted network supported: Yes') || 
                  stdout.includes('Wireless Display') ||
                  stdout.includes('WiFi Direct'));
        }
      });
    } else {
      resolve(false);
    }
  });
});

ipcMain.handle('scan-wifi-direct-peers', async () => {
  // In production, this would use native WiFi Direct APIs
  // For now, return demo data
  return [
    {
      id: 'wfd-001',
      name: 'Musah-Laptop',
      signalStrength: 85,
      status: 'available',
      isGroupOwner: true,
      frequency: '5 GHz',
    },
    {
      id: 'wfd-002',
      name: 'Ibrahim-Phone',
      signalStrength: 72,
      status: 'available',
      isGroupOwner: false,
      frequency: '2.4 GHz',
    },
  ];
});

ipcMain.handle('create-wifi-direct-group', async () => {
  return {
    name: 'NETSHARE-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
    ip: '192.168.49.1',
    pin: Math.floor(10000000 + Math.random() * 90000000).toString(),
  };
});

ipcMain.handle('connect-to-wifi-direct-peer', async (event, peerId) => {
  // In production, this would establish WiFi Direct connection
  return true;
});

ipcMain.handle('disconnect-wifi-direct', async () => {
  // In production, this would disconnect WiFi Direct
  return true;
});

// NFC IPC Handlers
ipcMain.handle('check-nfc-support', async () => {
  const { exec } = require('child_process');
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      exec('pnputil /enum-devices /class NFC', (error, stdout) => {
        if (error) {
          resolve(false);
        } else {
          resolve(stdout.includes('NFC') || stdout.includes('Near Field'));
        }
      });
    } else {
      resolve(false);
    }
  });
});

ipcMain.handle('start-nfc-scan', async () => {
  // In production, this would start NFC scanning via Windows Runtime APIs
  return true;
});

ipcMain.handle('stop-nfc-scan', async () => {
  return true;
});

ipcMain.handle('send-ndef-message', async (event, message) => {
  // In production, this would send NDEF message via NFC
  return true;
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();
  initBonjour();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (bonjour) {
    bonjour.destroy();
  }
});
