const { app, BrowserWindow, ipcMain, dialog, shell, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const Bonjour = require('bonjour-service');

let mainWindow;
let tray;
let bonjour;
let httpServer;
let serverPort = 3000;

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
      preload: path.join(__dirname, 'preload.cjs'),
    },
    show: false,
  });

  // Load the app
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, the path is relative to the app directory
    const htmlPath = path.join(__dirname, '../dist/index.html');
    console.log('Loading HTML from:', htmlPath);
    
    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(htmlPath)) {
      console.error('HTML file not found at:', htmlPath);
      // Try alternative path for packaged app
      const altPath = path.join(process.resourcesPath || __dirname, '../dist/index.html');
      console.log('Trying alternative path:', altPath);
      mainWindow.loadFile(altPath);
    } else {
      mainWindow.loadFile(htmlPath);
    }
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle load errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    mainWindow.loadURL(`data:text/html;charset=utf-8,
      <html>
        <body style="background: #030712; color: white; font-family: sans-serif; padding: 40px;">
          <h1>Failed to Load Application</h1>
          <p>Error: ${errorDescription}</p>
          <p>Code: ${errorCode}</p>
        </body>
      </html>
    `);
  });

  // Handle render crashes
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('Renderer process gone:', details);
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

// Initialize HTTP server to serve the app to mobile devices
function initHttpServer() {
  const distPath = path.join(__dirname, '../dist');
  
  httpServer = http.createServer((req, res) => {
    // Handle CORS for mobile access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    let filePath;
    const url = req.url.split('?')[0]; // Remove query params
    
    // Serve index.html for all routes (SPA routing)
    if (url === '/' || url === '/mobile' || url.startsWith('/#/')) {
      filePath = path.join(distPath, 'index.html');
    } else {
      // Serve static assets
      filePath = path.join(distPath, url);
    }
    
    // Check if file exists
    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        // Fallback to index.html for SPA routing
        filePath = path.join(distPath, 'index.html');
      }
      
      // Determine content type
      const ext = path.extname(filePath);
      const contentTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
      };
      
      const contentType = contentTypes[ext] || 'application/octet-stream';
      
      // Serve the file
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      });
    });
  });
  
  // Try to start on port 3000, fall back to other ports if needed
  const tryPort = (port) => {
    httpServer.listen(port, '0.0.0.0', () => {
      serverPort = port;
      console.log(`HTTP server listening on http://0.0.0.0:${port}`);
      console.log(`Mobile devices can access: http://<your-ip>:${port}/#/mobile`);
    });
  };
  
  httpServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${serverPort} in use, trying ${serverPort + 1}...`);
      serverPort++;
      tryPort(serverPort);
    } else {
      console.error('HTTP server error:', err);
    }
  });
  
  tryPort(serverPort);
}

// Initialize mDNS/Bonjour for auto-discovery
function initBonjour() {
  bonjour = new Bonjour();
  
  // Publish our HTTP service so phones can find it
  const service = bonjour.publish({
    name: 'NetShare-' + process.pid,
    type: 'http',
    port: serverPort,
    txt: {
      version: '1.0.0',
      protocol: 'webrtc',
      path: '/#/mobile'
    }
  });
  
  console.log('Published NetShare HTTP service via mDNS on port', serverPort);
  
  // Browse for other NetShare instances
  const browser = bonjour.find({ type: 'http' }, (service) => {
    if (service.txt && service.txt.protocol === 'webrtc') {
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

ipcMain.handle('get-server-port', async () => {
  return serverPort;
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

// Register custom protocol for deep linking
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('netshare', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('netshare');
}

// Handle protocol URLs
app.on('open-url', (event, url) => {
  event.preventDefault();
  if (mainWindow) {
    mainWindow.webContents.send('deep-link', url);
    mainWindow.show();
  }
});

// Handle second instance (Windows/Linux)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      
      // Check if there's a protocol URL in the command line
      const url = commandLine.find(arg => arg.startsWith('netshare://'));
      if (url) {
        mainWindow.webContents.send('deep-link', url);
      }
    }
  });
}

// Configure permissions for camera/microphone/bluetooth
app.whenReady().then(() => {
  const { session } = require('electron');
  
  // Enable Web Bluetooth
  app.commandLine.appendSwitch('enable-web-bluetooth');
  
  // Allow camera, microphone, and bluetooth access
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media' || permission === 'camera' || permission === 'microphone' || permission === 'bluetooth') {
      callback(true);
    } else {
      callback(false);
    }
  });
  
  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    if (permission === 'media' || permission === 'camera' || permission === 'microphone' || permission === 'bluetooth') {
      return true;
    }
    return false;
  });
  
  createWindow();
  createTray();
  initHttpServer(); // Start HTTP server for mobile access
  initBonjour();
  
  // Send server port to renderer after a short delay
  setTimeout(() => {
    if (mainWindow) {
      mainWindow.webContents.send('server-port', serverPort);
    }
  }, 1000);
  
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
  if (httpServer) {
    httpServer.close();
  }
  if (bonjour) {
    bonjour.destroy();
  }
});
