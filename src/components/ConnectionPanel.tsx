import { useState } from 'react';
import { Peer } from '../types';
import { Wifi, WifiOff, Copy, Check, Link, Users, Plus, X } from 'lucide-react';

interface ConnectionPanelProps {
  myPeerName: string;
  setMyPeerName: (name: string) => void;
  myCode: string;
  isListening: boolean;
  peers: Peer[];
  generateConnectionCode: () => Promise<string>;
  connectWithCode: (code: string) => Promise<string | null>;
  applyAnswer: (answerCode: string) => Promise<boolean>;
  disconnectPeer: (peerId: string) => void;
  addDemoPeer: () => void;
  isElectron?: boolean;
}

export function ConnectionPanel({
  myPeerName,
  setMyPeerName,
  myCode,
  isListening,
  peers,
  generateConnectionCode,
  connectWithCode,
  applyAnswer,
  disconnectPeer,
  addDemoPeer,
  isElectron = false,
}: ConnectionPanelProps) {
  const [copied, setCopied] = useState(false);
  const [connectCode, setConnectCode] = useState('');
  const [answerCode, setAnswerCode] = useState('');
  const [showConnect, setShowConnect] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [showAnswerInput, setShowAnswerInput] = useState(false);
  const [answerInput, setAnswerInput] = useState('');
  const [applyingAnswer, setApplyingAnswer] = useState(false);

  const handleGenerateCode = async () => {
    await generateConnectionCode();
  };

  const handleCopyCode = async () => {
    if (myCode) {
      await navigator.clipboard.writeText(myCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnect = async () => {
    if (!connectCode.trim()) return;
    setConnecting(true);
    try {
      const answer = await connectWithCode(connectCode.trim());
      if (answer) {
        setAnswerCode(answer);
      }
    } catch (err) {
      console.error(err);
    }
    setConnecting(false);
  };

  const handleApplyAnswer = async () => {
    if (!answerInput.trim()) return;
    setApplyingAnswer(true);
    try {
      const success = await applyAnswer(answerInput.trim());
      if (success) {
        setAnswerInput('');
        setShowAnswerInput(false);
      }
    } catch (err) {
      console.error(err);
    }
    setApplyingAnswer(false);
  };

  const statusColor = (status: Peer['status']) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
    }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Link className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Connections</h2>
            <p className="text-xs text-gray-400">Manage peer connections</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
          <span className="text-xs text-gray-400">{isListening ? 'Listening' : 'Offline'}</span>
        </div>
      </div>

      {/* My Identity */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Your Device</span>
          {editingName ? (
            <input
              type="text"
              value={myPeerName}
              onChange={(e) => setMyPeerName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
              className="bg-gray-700 text-white text-sm px-2 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="text-sm text-blue-400 hover:text-blue-300 font-medium"
            >
              {myPeerName} ✏️
            </button>
          )}
        </div>
        
        {!isListening ? (
          <button
            onClick={handleGenerateCode}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-medium text-sm transition-all duration-200 shadow-lg shadow-blue-500/20"
          >
            <Wifi className="w-4 h-4 inline mr-2" />
            Start Listening for Connections
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-700/50 rounded-lg p-2 text-xs text-gray-300 font-mono truncate">
                {myCode ? `${myCode.substring(0, 30)}...` : 'Generating...'}
              </div>
              <button
                onClick={handleCopyCode}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                title="Copy connection code"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-300" />}
              </button>
            </div>
            <p className="text-xs text-gray-500">Share this code with another PC to connect</p>
          </div>
        )}
      </div>

      {/* Apply Answer Code (for PC 1 after receiving answer from PC 2) */}
      {isListening && (
        <div className="space-y-3">
          <button
            onClick={() => setShowAnswerInput(!showAnswerInput)}
            className="w-full py-2.5 border border-green-700/50 hover:border-green-600 text-green-300 hover:text-green-200 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 bg-green-500/5"
          >
            <Check className="w-4 h-4" />
            Paste Answer Code from Other PC
          </button>

          {showAnswerInput && (
            <div className="bg-gray-800/50 rounded-xl p-4 border border-green-700/30 space-y-3 animate-in">
              <p className="text-xs text-gray-400">
                After the other PC connects and generates an answer code, paste it here to complete the handshake:
              </p>
              <textarea
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                placeholder="Paste answer code here..."
                className="w-full bg-gray-700/50 text-white text-xs p-3 rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none resize-none h-20 font-mono"
              />
              <button
                onClick={handleApplyAnswer}
                disabled={applyingAnswer || !answerInput.trim()}
                className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium text-sm transition-all"
              >
                {applyingAnswer ? 'Connecting...' : 'Complete Connection'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Connect to Peer */}
      <div className="space-y-3">
        <button
          onClick={() => setShowConnect(!showConnect)}
          className="w-full py-2.5 border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Connect to a Peer
        </button>

        {showConnect && (
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30 space-y-3 animate-in">
            <p className="text-xs text-gray-400">Paste the connection code from another PC:</p>
            <textarea
              value={connectCode}
              onChange={(e) => setConnectCode(e.target.value)}
              placeholder="Paste connection code here..."
              className="w-full bg-gray-700/50 text-white text-xs p-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none resize-none h-20 font-mono"
            />
            <button
              onClick={handleConnect}
              disabled={connecting || !connectCode.trim()}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium text-sm transition-all"
            >
              {connecting ? 'Connecting...' : 'Connect'}
            </button>
            
            {answerCode && (
              <div className="mt-3 p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
                <p className="text-xs text-green-400 mb-2">✅ Answer generated! Send this back to the other PC:</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-700/50 rounded p-2 text-xs text-gray-300 font-mono truncate">
                    {answerCode.substring(0, 30)}...
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(answerCode)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                  >
                    <Copy className="w-3 h-3 text-gray-300" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Connected Peers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Connected Devices</span>
            <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">{peers.length}</span>
          </div>
          <button
            onClick={addDemoPeer}
            className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
            title="Add demo peer for testing"
          >
            + Demo
          </button>
        </div>

        {peers.length === 0 ? (
          <div className="text-center py-8">
            <WifiOff className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No devices connected</p>
            <p className="text-xs text-gray-600 mt-1">Use the buttons above to connect</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {peers.map(peer => (
              <div key={peer.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl border border-gray-700/20 hover:border-gray-600/30 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                      {peer.avatar}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-900 ${statusColor(peer.status)}`} />
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{peer.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{peer.status}</p>
                  </div>
                </div>
                <button
                  onClick={() => disconnectPeer(peer.id)}
                  className="p-1.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
