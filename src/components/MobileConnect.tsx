import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, CheckCircle, Loader, ArrowLeft, Wifi, Download, Upload } from 'lucide-react';

interface MobileConnectProps {
  offerCode?: string;
}

export const MobileConnect: React.FC<MobileConnectProps> = ({ offerCode: initialOffer }) => {
  const [offerCode, setOfferCode] = useState<string>(initialOffer || '');
  const [answerCode, setAnswerCode] = useState<string>('');
  const [status, setStatus] = useState<'waiting-offer' | 'connecting' | 'showing-answer' | 'connected'>('waiting-offer');
  const [error, setError] = useState<string>('');
  const [peerName, setPeerName] = useState<string>('');

  // Extract offer from URL hash
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && !offerCode) {
      try {
        const decoded = decodeURIComponent(hash);
        setOfferCode(decoded);
      } catch (err) {
        setError('Invalid connection code in URL');
      }
    }
  }, [offerCode]);

  // Process the offer and generate answer
  const handleConnect = async () => {
    if (!offerCode) {
      setError('No connection code provided');
      return;
    }

    try {
      setStatus('connecting');
      setError('');

      // Decode the offer
      const offer = JSON.parse(atob(offerCode));
      
      if (offer.type !== 'offer') {
        throw new Error('Invalid offer code');
      }

      setPeerName(offer.senderName || 'PC');

      // Create WebRTC connection
      const pc = new RTCPeerConnection({
        iceServers: [],
        iceTransportPolicy: 'all',
      });

      // Set up data channel handler
      pc.ondatachannel = (event) => {
        const channel = event.channel;
        channel.onopen = () => {
          console.log('Data channel opened');
          setStatus('connected');
        };
      };

      // Set remote description (offer)
      await pc.setRemoteDescription(offer.sdp);

      // Create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Wait for ICE gathering
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === 'complete') {
          resolve();
        } else {
          pc.onicegatheringstatechange = () => {
            if (pc.iceGatheringState === 'complete') {
              resolve();
            }
          };
          setTimeout(resolve, 2000);
        }
      });

      // Create answer code
      const answerData = {
        type: 'answer',
        sdp: pc.localDescription,
        senderName: 'Mobile-' + Math.floor(Math.random() * 1000),
        senderId: 'mobile-' + Date.now(),
      };

      const answerStr = btoa(JSON.stringify(answerData));
      setAnswerCode(answerStr);
      setStatus('showing-answer');
    } catch (err) {
      setError('Failed to create connection. Please try again.');
      setStatus('waiting-offer');
      console.error(err);
    }
  };

  // Manual QR code input
  const handleManualInput = () => {
    const input = prompt('Paste the connection code from PC:');
    if (input) {
      setOfferCode(input);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900/50 backdrop-blur-lg border-b border-gray-800 p-4">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">NetShare Mobile</h1>
            <p className="text-xs text-gray-400">Offline P2P File Transfer</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          
          {/* Waiting for Offer */}
          {status === 'waiting-offer' && (
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-8 h-8 text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Connect to PC</h2>
                <p className="text-sm text-gray-400">
                  Scan the QR code on your PC or paste the connection code
                </p>
              </div>

              {offerCode ? (
                <button
                  onClick={handleConnect}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Connect to PC
                </button>
              ) : (
                <button
                  onClick={handleManualInput}
                  className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-all"
                >
                  Paste Connection Code
                </button>
              )}

              {error && (
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <div className="bg-blue-900/10 border border-blue-800/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Wifi className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-300">
                    <p className="font-semibold mb-1">100% Offline</p>
                    <p className="text-blue-400/80 text-xs">
                      Files transfer directly between devices. No internet required.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Connecting */}
          {status === 'connecting' && (
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 text-center">
              <Loader className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-bold text-white mb-2">Connecting...</h2>
              <p className="text-sm text-gray-400">
                Establishing peer-to-peer connection
              </p>
            </div>
          )}

          {/* Showing Answer QR */}
          {status === 'showing-answer' && (
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 space-y-4">
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-white mb-2">Connection Ready!</h2>
                <p className="text-sm text-gray-400">
                  Show this QR code to your PC
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 flex justify-center">
                <QRCodeSVG
                  value={answerCode}
                  size={280}
                  level="M"
                  includeMargin={true}
                />
              </div>

              <div className="bg-green-900/20 border border-green-800 rounded-lg p-3 text-center">
                <p className="text-sm text-green-300">
                  👆 PC will scan this QR code to complete connection
                </p>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-2">Connected to:</p>
                <p className="text-sm text-white font-medium">{peerName}</p>
              </div>
            </div>
          )}

          {/* Connected */}
          {status === 'connected' && (
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Connected!</h2>
                <p className="text-sm text-gray-400">
                  You can now transfer files with {peerName}
                </p>
              </div>

              <div className="space-y-3">
                <button className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2">
                  <Download className="w-5 h-5" />
                  Receive Files
                </button>
                <button className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2">
                  <Upload className="w-5 h-5" />
                  Send Files
                </button>
              </div>

              <div className="bg-green-900/10 border border-green-800/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Wifi className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-300">
                    <p className="font-semibold mb-1">Transfer Ready</p>
                    <p className="text-green-400/80 text-xs">
                      Files will transfer directly at LAN speed. No internet used.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900/50 backdrop-blur-lg border-t border-gray-800 p-4">
        <div className="max-w-md mx-auto text-center">
          <p className="text-xs text-gray-500">
            NetShare Mobile • Offline P2P File Transfer
          </p>
        </div>
      </div>
    </div>
  );
};
