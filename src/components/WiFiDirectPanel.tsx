import React, { useState } from 'react';
import { Wifi, AlertTriangle } from 'lucide-react';

interface WiFiDirectPanelProps {
  isElectron?: boolean;
}

export const WiFiDirectPanel: React.FC<WiFiDirectPanelProps> = ({ isElectron = false }) => {
  return (
    <div className="space-y-6">
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-300 mb-2">WiFi Direct Not Available</h3>
            <p className="text-sm text-red-200/80 mb-3">
              WiFi Direct requires native Windows APIs that are only available in the desktop app (.exe), not in web browsers.
            </p>
            <p className="text-sm text-gray-400 mb-3">
              <strong className="text-white">Working alternatives in browser mode:</strong>
            </p>
            <ul className="text-sm text-gray-400 space-y-1 ml-4">
              <li>✅ <strong>LAN (WebRTC)</strong> - If both devices are on the same WiFi</li>
              <li>✅ <strong>Mobile QR</strong> - Scan QR code from phone</li>
              <li>✅ <strong>Bluetooth</strong> - Short range, slower but works</li>
              <li>✅ <strong>USB Direct</strong> - Fastest, requires cable</li>
            </ul>
            <p className="text-xs text-gray-500 mt-4">
              To use WiFi Direct, build the desktop app: <code className="bg-gray-800 px-2 py-1 rounded">npm run build:win</code>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Wifi className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">About WiFi Direct</h2>
            <p className="text-sm text-gray-400">What it does (in desktop mode)</p>
          </div>
        </div>

        <div className="space-y-3 text-sm text-gray-400">
          <p>
            WiFi Direct allows devices to connect directly to each other without a router, creating a peer-to-peer WiFi network.
          </p>
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
            <p className="font-semibold text-white">Features (Desktop .exe only):</p>
            <ul className="space-y-1 ml-4">
              <li>• Connect devices without WiFi router</li>
              <li>• Speeds up to 250 MB/s</li>
              <li>• Range up to 200 meters</li>
              <li>• Works on Windows 8+, Android 4.0+</li>
            </ul>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <p className="text-xs text-amber-300">
              <strong>Note:</strong> This feature is currently a placeholder. Full implementation requires native Windows WiFi Direct API integration in the Electron main process.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
