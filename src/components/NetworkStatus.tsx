import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Monitor, ArrowLeftRight, Shield, Zap } from 'lucide-react';

interface NetworkStatusProps {
  isListening: boolean;
  peerCount: number;
  activeTransfers: number;
}

export function NetworkStatus({ isListening, peerCount, activeTransfers }: NetworkStatusProps) {
  const [localIP, setLocalIP] = useState<string>('Detecting...');

  useEffect(() => {
    // Detect local IP using WebRTC (no internet needed)
    detectLocalIP().then(ip => setLocalIP(ip));
  }, []);

  return (
    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <Wifi className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-sm font-semibold text-white">Network Status</h3>
      </div>

      <div className="space-y-3">
        {/* Internet Status */}
        <div className="flex items-center justify-between p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <WifiOff className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-green-300">No Internet Required</p>
              <p className="text-xs text-gray-500">Transfers use local network only</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-400 font-medium">Offline Ready</span>
          </div>
        </div>

        {/* Local IP */}
        <div className="flex items-center justify-between p-3 bg-gray-800/30 border border-gray-700/20 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Monitor className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-300">Your Local IP</p>
              <p className="text-xs text-gray-500 font-mono">{localIP}</p>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 bg-gray-800/30 border border-gray-700/20 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-300">Active Connections</p>
              <p className="text-xs text-gray-500">{peerCount} peer{peerCount !== 1 ? 's' : ''} connected</p>
            </div>
          </div>
          {activeTransfers > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 rounded-full">
              <Zap className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-blue-400 font-medium">{activeTransfers} transferring</span>
            </div>
          )}
        </div>

        {/* Data Flow Explanation */}
        <div className="p-3 bg-gray-800/20 border border-gray-700/10 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <p className="text-xs font-medium text-cyan-300">Data Flow</p>
          </div>
          <div className="flex items-center justify-center gap-2 py-2">
            <div className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-300">
              PC 1
            </div>
            <div className="flex items-center gap-0.5">
              <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
              <div className="w-8 h-px bg-gradient-to-r from-blue-500 to-purple-500" />
              <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" style={{ animationDelay: '0.3s' }} />
              <div className="w-8 h-px bg-gradient-to-r from-purple-500 to-pink-500" />
              <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" style={{ animationDelay: '0.6s' }} />
            </div>
            <div className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded text-xs text-purple-300">
              PC 2
            </div>
          </div>
          <p className="text-center text-xs text-gray-500 mt-1">
            Direct local transfer • Zero ISP data used
          </p>
        </div>
      </div>
    </div>
  );
}

// Detect local IP address using WebRTC (works without internet)
async function detectLocalIP(): Promise<string> {
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('');
      
      pc.onicecandidate = (event) => {
        if (!event.candidate) {
          pc.close();
          resolve('Unable to detect');
          return;
        }
        
        const candidate = event.candidate.candidate;
        const ipMatch = candidate.match(/(\d{1,3}\.){3}\d{1,3}/);
        
        if (ipMatch) {
          const ip = ipMatch[0];
          // Filter out non-local IPs
          if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
            pc.close();
            resolve(ip);
          }
        }
      };
      
      pc.createOffer().then(offer => pc.setLocalDescription(offer));
      
      // Timeout fallback
      setTimeout(() => {
        pc.close();
        resolve('Local Network');
      }, 3000);
    } catch {
      resolve('Local Network');
    }
  });
}
