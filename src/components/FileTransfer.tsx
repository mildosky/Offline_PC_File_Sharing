import { useState, useRef, useCallback } from 'react';
import { Peer, FileTransferItem } from '../types';
import { formatFileSize, getFileIcon } from '../utils/fileUtils';
import { Upload, Send, FileUp, ArrowUpRight, ArrowDownLeft, CheckCircle2, XCircle, Clock, Zap, Gauge } from 'lucide-react';
import { SpeedGauge, SpeedComparison } from './SpeedGauge';

interface FileTransferProps {
  peers: Peer[];
  transfers: FileTransferItem[];
  sendFile: (file: File, peerId: string) => Promise<void>;
  globalSpeed: {
    bytesPerSecond: number;
    averageSpeed: number;
    peakSpeed: number;
    totalBytes: number;
    startTime: number;
    elapsedMs: number;
  };
  isElectron?: boolean;
}

export function FileTransfer({ peers, transfers, sendFile, globalSpeed, isElectron = false }: FileTransferProps) {
  const [selectedPeer, setSelectedPeer] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTransfers = transfers.filter(t => t.status === 'sending' || t.status === 'receiving');
  const isActive = activeTransfers.length > 0;
  const totalFileSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  // Use native file dialog in Electron
  const handleNativeFileSelect = async () => {
    if (isElectron && window.electronAPI) {
      const filePaths = await window.electronAPI.selectFiles();
      if (filePaths && filePaths.length > 0) {
        // In Electron, we'd need to read files via IPC
        // For now, just show the paths
        console.log('Selected files:', filePaths);
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!selectedPeer || selectedFiles.length === 0) {
      console.warn('Cannot send: No peer selected or no files selected');
      return;
    }
    
    console.log('Starting file transfer:', {
      peerId: selectedPeer,
      fileCount: selectedFiles.length,
      files: selectedFiles.map(f => ({ name: f.name, size: f.size }))
    });
    
    setSending(true);
    
    try {
      for (const file of selectedFiles) {
        console.log('Sending file:', file.name);
        await sendFile(file, selectedPeer);
        console.log('File sent successfully:', file.name);
      }
      
      setSelectedFiles([]);
      console.log('All files sent successfully');
    } catch (err) {
      console.error('Error sending files:', err);
    } finally {
      setSending(false);
    }
  };

  const getStatusIcon = (status: FileTransferItem['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'sending':
      case 'receiving': return <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const connectedPeers = peers.filter(p => p.status === 'connected');

  // Calculate ETA for active transfers
  const getETA = (transfer: FileTransferItem) => {
    if (transfer.status !== 'sending' && transfer.status !== 'receiving') return null;
    if (globalSpeed.bytesPerSecond <= 0) return null;
    
    const remainingBytes = transfer.fileSize * (1 - transfer.progress / 100);
    const etaSeconds = remainingBytes / globalSpeed.bytesPerSecond;
    
    if (etaSeconds < 1) return 'Almost done';
    if (etaSeconds < 60) return `${etaSeconds.toFixed(0)}s remaining`;
    if (etaSeconds < 3600) return `${Math.floor(etaSeconds / 60)}m ${Math.floor(etaSeconds % 60)}s remaining`;
    return `${Math.floor(etaSeconds / 3600)}h remaining`;
  };

  return (
    <div className="space-y-6">
      {/* Speed Hero Section */}
      {isActive && (
        <div className="relative overflow-hidden bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-cyan-500/10 border border-green-500/30 rounded-2xl p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_70%)]" />
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30 animate-pulse">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-white">
                    {(globalSpeed.bytesPerSecond / 1_000_000).toFixed(1)}
                  </h2>
                  <span className="text-lg text-green-400 font-semibold">MB/s</span>
                </div>
                <p className="text-sm text-gray-400">
                  {activeTransfers.length} active transfer{activeTransfers.length > 1 ? 's' : ''} • {formatFileSize(globalSpeed.totalBytes)} sent
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-green-300 font-medium">TURBO MODE ACTIVE</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Zero internet data used</p>
            </div>
          </div>
        </div>
      )}

      {/* Speed Gauge */}
      <SpeedGauge speed={globalSpeed} isActive={isActive} />

      {/* No Internet Banner */}
      <div className="bg-gradient-to-r from-green-500/5 to-emerald-500/5 border border-green-500/20 rounded-xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-green-300">Zero Internet Data Used</p>
          <p className="text-xs text-gray-400">All transfers happen directly between devices on your local network. Your ISP data plan is not affected.</p>
        </div>
      </div>

      {/* Send Files Section */}
      <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Send className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Send Files</h2>
            <p className="text-xs text-gray-400">Lightning-fast local network transfer</p>
          </div>
        </div>

        {/* Peer Selection */}
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 block">Send to</label>
          {connectedPeers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {connectedPeers.map(peer => (
                <button
                  key={peer.id}
                  onClick={() => setSelectedPeer(peer.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    selectedPeer === peer.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs text-white font-bold">
                    {peer.avatar}
                  </div>
                  {peer.name}
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30 text-center">
              <p className="text-sm text-gray-500">No connected devices. Connect a peer first.</p>
            </div>
          )}
        </div>

        {/* Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
            dragActive
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-gray-700 hover:border-gray-600 bg-gray-800/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Upload className={`w-10 h-10 mx-auto mb-3 ${dragActive ? 'text-blue-400' : 'text-gray-500'}`} />
          <p className="text-sm text-gray-400 mb-1">
            Drag & drop files here or{' '}
            <button
              onClick={handleNativeFileSelect}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              {isElectron ? 'browse (native dialog)' : 'browse'}
            </button>
          </p>
          <p className="text-xs text-gray-600">Supports all file types • No size limit • 256KB optimized chunks</p>
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">
                {selectedFiles.length} file(s) selected ({formatFileSize(totalFileSize)})
              </span>
              <button
                onClick={() => setSelectedFiles([])}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Clear all
              </button>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg">{getFileIcon(file.type)}</span>
                    <div className="min-w-0">
                      <p className="text-xs text-white truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-gray-500 hover:text-red-400 p-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            
            {!selectedPeer && (
              <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-xs text-yellow-300 text-center">
                  ⚠️ Please select a recipient device above before sending files
                </p>
              </div>
            )}
            
            <button
              onClick={handleSend}
              disabled={!selectedPeer || sending}
              className="w-full mt-3 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-white rounded-xl font-medium text-sm transition-all duration-200 shadow-lg shadow-green-500/20 disabled:shadow-none flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              {sending ? 'Sending at max speed...' : `Send ${selectedFiles.length} file(s) at LAN speed`}
            </button>
          </div>
        )}
      </div>

      {/* Active Transfers */}
      {activeTransfers.length > 0 && (
        <div className="bg-gray-900/50 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center animate-pulse">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Active Transfers</h2>
              <p className="text-xs text-gray-400">{activeTransfers.length} file(s) in transit</p>
            </div>
          </div>

          <div className="space-y-3">
            {activeTransfers.map(transfer => {
              const eta = getETA(transfer);
              return (
                <div key={transfer.id} className="p-4 bg-gray-800/30 rounded-xl border border-gray-700/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl">{getFileIcon(transfer.fileType)}</span>
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate font-medium">{transfer.fileName}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(transfer.fileSize)} • {transfer.direction === 'sent' ? 'Sending' : 'Receiving'} {transfer.peerName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-400 tabular-nums">{transfer.progress}%</p>
                      {eta && <p className="text-xs text-gray-500">{eta}</p>}
                    </div>
                  </div>
                  
                  <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 via-emerald-400 to-cyan-400 rounded-full transition-all duration-200"
                      style={{ width: `${transfer.progress}%` }}
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)] animate-pulse" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Speed Comparison */}
      {isActive && (
        <SpeedComparison 
          currentSpeed={globalSpeed.bytesPerSecond} 
          fileSize={activeTransfers[0]?.fileSize || 100_000_000} 
        />
      )}

      {/* Transfer History */}
      <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <FileUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Transfer History</h2>
            <p className="text-xs text-gray-400">{transfers.length} total transfers</p>
          </div>
        </div>

        {transfers.length === 0 ? (
          <div className="text-center py-8">
            <Gauge className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No transfers yet</p>
            <p className="text-xs text-gray-600 mt-1">Send a file to see blazing-fast speeds</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {transfers.map(transfer => (
              <div key={transfer.id} className="p-3 bg-gray-800/30 rounded-xl border border-gray-700/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg">{getFileIcon(transfer.fileType)}</span>
                    <div className="min-w-0">
                      <p className="text-xs text-white truncate font-medium">{transfer.fileName}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(transfer.fileSize)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(transfer.status)}
                    <span className={`text-xs flex items-center gap-1 ${
                      transfer.direction === 'sent' ? 'text-blue-400' : 'text-green-400'
                    }`}>
                      {transfer.direction === 'sent' ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownLeft className="w-3 h-3" />
                      )}
                      {transfer.peerName}
                    </span>
                  </div>
                </div>
                
                {(transfer.status === 'sending' || transfer.status === 'receiving') && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">
                        {transfer.status === 'sending' ? 'Sending' : 'Receiving'}...
                      </span>
                      <span className="text-xs text-green-400 font-bold">{transfer.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-200"
                        style={{ width: `${transfer.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
