import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import { Smartphone, QrCode, Camera, CheckCircle, XCircle, Loader, Wifi, ArrowRight } from 'lucide-react';
import { usePeerConnection } from '../hooks/usePeerConnection';

interface QRConnectionPanelProps {
  peerConnection: {
    myPeerId: string;
    myPeerName: string;
    generateConnectionCode: () => Promise<string>;
    connectWithCode: (code: string) => Promise<string | null>;
    applyAnswer: (answerCode: string) => Promise<boolean>;
    peers: any[];
  };
}

export const QRConnectionPanel: React.FC<QRConnectionPanelProps> = ({ peerConnection }) => {
  const { 
    myPeerId, 
    myPeerName, 
    generateConnectionCode, 
    connectWithCode, 
    applyAnswer,
    peers 
  } = peerConnection;

  const [mode, setMode] = useState<'idle' | 'showing-offer' | 'scanning-answer' | 'connected'>('idle');
  const [offerCode, setOfferCode] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedPeer, setSelectedPeer] = useState<string>('');
  
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-scanner-container';

  // Generate QR code for connection
  const handleGenerateQR = async () => {
    try {
      setError('');
      const offer = await generateConnectionCode();
      
      // Create a deep link URL using the netshare:// protocol
      // When scanned, this will open the NetShare app directly
      const qrUrl = `netshare://connect?offer=${encodeURIComponent(offer)}`;
      
      setOfferCode(qrUrl);
      setMode('showing-offer');
    } catch (err) {
      setError('Failed to generate connection code');
      console.error(err);
    }
  };

  // Start scanning for phone's answer QR
  const handleStartScanning = async () => {
    try {
      setError('');
      setScanning(true);
      setMode('scanning-answer');

      const html5QrCode = new Html5Qrcode(scannerContainerId);
      qrScannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          // Phone's answer scanned
          try {
            await applyAnswer(decodedText);
            setMode('connected');
            setScanning(false);
            await html5QrCode.stop();
          } catch (err) {
            setError('Invalid QR code. Please try again.');
            console.error(err);
          }
        },
        (errorMessage) => {
          // Scan error (ignore, keeps scanning)
        }
      );
    } catch (err) {
      setError('Failed to start camera. Please allow camera access.');
      setScanning(false);
      console.error(err);
    }
  };

  // Stop scanning
  const handleStopScanning = async () => {
    if (qrScannerRef.current) {
      try {
        await qrScannerRef.current.stop();
        qrScannerRef.current = null;
      } catch (err) {
        console.error(err);
      }
    }
    setScanning(false);
    setMode('idle');
  };

  // Reset to idle
  const handleReset = () => {
    handleStopScanning();
    setMode('idle');
    setOfferCode('');
    setError('');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  // Mobile app URL (for QR code)
  const mobileAppUrl = `${window.location.origin}/mobile`;

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
          <Smartphone className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Connect Mobile Phone</h2>
          <p className="text-sm text-gray-400">Scan QR code for instant offline connection</p>
        </div>
      </div>

      {/* Idle State */}
      {mode === 'idle' && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">How it works:</h3>
            <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
              <li>Click "Generate QR Code" to create a connection code</li>
              <li>Phone scans the QR code with camera</li>
              <li>Phone opens mobile app and shows answer QR</li>
              <li>PC scans phone's QR code</li>
              <li>Connection established! Transfer files offline</li>
            </ol>
          </div>

          <button
            onClick={handleGenerateQR}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
          >
            <QrCode className="w-5 h-5" />
            Generate QR Code
          </button>

          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Showing Offer QR */}
      {mode === 'showing-offer' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center">
            <QRCodeSVG
              value={offerCode}
              size={280}
              level="M"
              includeMargin={true}
            />
            <p className="text-sm text-gray-600 mt-4 text-center">
              Scan this QR code with your phone's camera
            </p>
          </div>

          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-300 text-center">
              👆 Show this QR code to your phone
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleStartScanning}
              className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Scan Phone's QR
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all"
            >
              Cancel
            </button>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Scanning Answer QR */}
      {mode === 'scanning-answer' && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-300 text-center mb-3">
              Point your camera at the phone's QR code
            </p>
            <div
              id={scannerContainerId}
              className="w-full aspect-square bg-black rounded-lg overflow-hidden"
            />
          </div>

          <button
            onClick={handleStopScanning}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all"
          >
            Cancel Scanning
          </button>

          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Connected */}
      {mode === 'connected' && (
        <div className="space-y-4">
          <div className="bg-green-900/20 border border-green-800 rounded-lg p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-green-300 mb-2">Connected!</h3>
            <p className="text-sm text-green-400">
              Your phone is now connected. You can transfer files offline.
            </p>
          </div>

          {peers.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <p className="text-sm text-gray-400 mb-2">Connected devices:</p>
              {peers.map(peer => (
                <div key={peer.id} className="flex items-center gap-2 py-2">
                  <Smartphone className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-white">{peer.name}</span>
                  <span className="text-xs text-gray-500 ml-auto">{peer.status}</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleReset}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all"
          >
            Connect Another Device
          </button>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 bg-blue-900/10 border border-blue-800/50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Wifi className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p className="font-semibold mb-1">100% Offline</p>
            <p className="text-blue-400/80">
              This connection uses WebRTC peer-to-peer. No internet required. 
              Files transfer directly between devices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
