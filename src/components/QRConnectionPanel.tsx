import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import { Smartphone, QrCode, Camera, CheckCircle, XCircle, Loader, Wifi, ArrowRight } from 'lucide-react';
import { usePeerConnection } from '../hooks/usePeerConnection';
import { getMobileConnectionURL } from '../utils/networkUtils';

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [detectedIP, setDetectedIP] = useState<string>('');
  const [manualIP, setManualIP] = useState<string>('');
  const [showManualIP, setShowManualIP] = useState(false);
  
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-scanner-container';

  // Generate QR code for connection
  const handleGenerateQR = async () => {
    try {
      setError('');
      setIsGenerating(true);
      
      // Generate WebRTC offer
      const offer = await generateConnectionCode();
      
      // Get mobile connection URL with auto-detected IP (hash-based routing)
      const mobileUrl = await getMobileConnectionURL(offer, manualIP || undefined);
      
      // Extract and store the detected IP for display
      const ipMatch = mobileUrl.match(/http:\/\/([^:]+):/);
      if (ipMatch) {
        setDetectedIP(ipMatch[1]);
      }
      
      setOfferCode(mobileUrl);
      setMode('showing-offer');
    } catch (err) {
      setError('Failed to generate connection code');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Start scanning for phone's answer QR
  const handleStartScanning = async () => {
    const startCamera = async (facingMode: string = 'environment') => {
      const html5QrCode = new Html5Qrcode(scannerContainerId);
      qrScannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode },
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
    };

    try {
      setError('');
      setScanning(true);
      setMode('scanning-answer');

      // Try with rear camera first
      await startCamera('environment');
    } catch (err: any) {
      console.error('Camera error with rear camera:', err);
      
      // Try with front camera as fallback
      try {
        console.log('Trying front camera...');
        await startCamera('user');
      } catch (err2: any) {
        console.error('Camera error with front camera:', err2);
        
        // Try without specifying facing mode
        try {
          console.log('Trying default camera...');
          const html5QrCode = new Html5Qrcode(scannerContainerId);
          qrScannerRef.current = html5QrCode;
          await html5QrCode.start(
            { deviceId: { exact: '' } }, // Try default device
            { fps: 10, qrbox: { width: 250, height: 250 } },
            async (decodedText) => {
              try {
                await applyAnswer(decodedText);
                setMode('connected');
                setScanning(false);
                await html5QrCode.stop();
              } catch (err) {
                setError('Invalid QR code. Please try again.');
              }
            },
            () => {}
          );
        } catch (err3: any) {
          console.error('All camera attempts failed:', {
            error1: err,
            error2: err2,
            error3: err3
          });
          
          setScanning(false);
          
          // Provide detailed error information
          const errorName = err.name || err2.name || err3.name || '';
          const errorMessage = err.message || err2.message || err3.message || '';
          
          if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError' || 
              errorMessage.includes('Permission') || errorMessage.includes('denied')) {
            setError('Camera access denied. Please check Windows Settings > Privacy > Camera and ensure "Desktop apps" can access the camera. Then restart the app.');
          } else if (errorName === 'NotFoundError' || errorMessage.includes('not found')) {
            setError('No camera found. Please connect a camera and restart the app.');
          } else if (errorName === 'NotReadableError' || errorMessage.includes('in use')) {
            setError('Camera is in use by another app. Close other apps using the camera and try again.');
          } else {
            setError(`Camera error: ${errorMessage || 'Unknown error'}. Check Windows Settings > Privacy > Camera. Error: ${errorName || 'none'}`);
          }
        }
      }
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
              <li>Phone scans the QR code with camera (must be on same WiFi!)</li>
              <li>Phone opens mobile interface and shows answer QR</li>
              <li>PC scans phone's QR code</li>
              <li>Connection established! Transfer files offline</li>
            </ol>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <p className="text-xs text-amber-300">
              <strong>⚠️ Important:</strong> Your phone must be connected to the <strong>same WiFi network</strong> as this PC. 
              Your PC's IP is <strong className="text-white">192.168.100.3</strong>. Your phone should have an IP like <strong className="text-white">192.168.100.x</strong> (not a mobile data IP like 102.x.x.x).
            </p>
          </div>

          {/* Manual IP Override */}
          <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-3">
            <button
              onClick={() => setShowManualIP(!showManualIP)}
              className="w-full text-left text-sm text-yellow-300 hover:text-yellow-200 flex items-center justify-between"
            >
              <span>⚠️ Wrong IP detected? Click to manually override</span>
              <span className="text-xs">{showManualIP ? '▼' : '▶'}</span>
            </button>
            
            {showManualIP && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-yellow-400">
                  Enter your PC's WiFi IP address (e.g., 192.168.1.100). Find it using:
                  <br />
                  <code className="bg-gray-800 px-2 py-1 rounded mt-1 inline-block">
                    Windows: ipconfig | Mac/Linux: ifconfig
                  </code>
                </p>
                <input
                  type="text"
                  value={manualIP}
                  onChange={(e) => setManualIP(e.target.value)}
                  placeholder="192.168.1.100"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
            )}
          </div>

          <button
            onClick={handleGenerateQR}
            disabled={isGenerating}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Detecting IP & Generating...
              </>
            ) : (
              <>
                <QrCode className="w-5 h-5" />
                Generate QR Code
              </>
            )}
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
          {/* Detected IP Display */}
          {detectedIP && (
            <div className="bg-green-900/20 border border-green-800 rounded-lg p-3">
              <p className="text-xs text-green-400 text-center">
                📍 Detected IP: <span className="font-mono font-bold">{detectedIP}</span>
              </p>
              <p className="text-xs text-green-500 text-center mt-1">
                Make sure your phone is on the same WiFi network
              </p>
            </div>
          )}

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
            <p className="text-sm text-blue-300 text-center mb-2">
              👆 Show this QR code to your phone
            </p>
            <p className="text-xs text-blue-400 text-center font-mono break-all">
              {offerCode}
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
