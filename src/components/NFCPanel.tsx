import React from 'react';
import { Smartphone, AlertTriangle } from 'lucide-react';

interface NFCPanelProps {
  isElectron?: boolean;
}

export const NFCPanel: React.FC<NFCPanelProps> = ({ isElectron = false }) => {
  return (
    <div className="space-y-6">
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-300 mb-2">NFC Not Available</h3>
            <p className="text-sm text-red-200/80 mb-3">
              NFC (Near Field Communication) requires native hardware access that is only available in the desktop app (.exe), not in web browsers.
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
              To use NFC, build the desktop app: <code className="bg-gray-800 px-2 py-1 rounded">npm run build:win</code>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">About NFC + WiFi Direct</h2>
            <p className="text-sm text-gray-400">What it does (in desktop mode)</p>
          </div>
        </div>

        <div className="space-y-3 text-sm text-gray-400">
          <p>
            NFC allows instant tap-to-connect pairing, then uses WiFi Direct for high-speed data transfer.
          </p>
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
            <p className="font-semibold text-white">How it works (Desktop .exe only):</p>
            <ol className="space-y-1 ml-4 list-decimal">
              <li>Tap devices together (NFC pairing)</li>
              <li>Automatic WiFi Direct connection</li>
              <li>Transfer files at up to 250 MB/s</li>
            </ol>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
            <p className="font-semibold text-white">Requirements:</p>
            <ul className="space-y-1 ml-4">
              <li>• Windows 10+ with NFC hardware</li>
              <li>• NFC-capable phone or device</li>
              <li>• Desktop app (.exe) installed</li>
            </ul>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <p className="text-xs text-amber-300">
              <strong>Note:</strong> This feature is currently a placeholder. Full implementation requires native Windows NFC API integration in the Electron main process.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
