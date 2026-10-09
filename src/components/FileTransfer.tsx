import { useState, useRef, useCallback } from 'react';
import { Peer, FileTransferItem } from '../types';
import { formatFileSize, getFileIcon } from '../utils/fileUtils';
import { Upload, Send, FileUp, ArrowUpRight, ArrowDownLeft, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface FileTransferProps {
  peers: Peer[];
  transfers: FileTransferItem[];
  sendFile: (file: File, peerId: string) => Promise<void>;
}

export function FileTransfer({ peers, transfers, sendFile }: FileTransferProps) {
  const [selectedPeer, setSelectedPeer] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!selectedPeer || selectedFiles.length === 0) return;
    setSending(true);
    
    for (const file of selectedFiles) {
      await sendFile(file, selectedPeer);
    }
    
    setSelectedFiles([]);
    setSending(false);
  };

  const getStatusIcon = (status: FileTransferItem['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'sending':
      case 'receiving': return <Clock className="w-4 h-4 text-blue-400 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const connectedPeers = peers.filter(p => p.status === 'connected');

  return (
    <div className="space-y-6">
      {/* Send Files Section */}
      <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Send className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Send Files</h2>
            <p className="text-xs text-gray-400">Transfer files to connected devices</p>
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
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              browse
            </button>
          </p>
          <p className="text-xs text-gray-600">Supports all file types • No size limit</p>
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">
                {selectedFiles.length} file(s) selected ({formatFileSize(selectedFiles.reduce((acc, f) => acc + f.size, 0))})
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
            
            <button
              onClick={handleSend}
              disabled={!selectedPeer || sending}
              className="w-full mt-3 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-white rounded-xl font-medium text-sm transition-all duration-200 shadow-lg shadow-green-500/20 disabled:shadow-none flex items-center justify-center gap-2"
            >
              <FileUp className="w-4 h-4" />
              {sending ? 'Sending...' : `Send ${selectedFiles.length} file(s)`}
            </button>
          </div>
        )}
      </div>

      {/* Transfer History */}
      <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <FileUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Transfer History</h2>
            <p className="text-xs text-gray-400">{transfers.length} transfers</p>
          </div>
        </div>

        {transfers.length === 0 ? (
          <div className="text-center py-8">
            <FileUp className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No transfers yet</p>
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
                      <span className="text-xs text-blue-400 font-medium">{transfer.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
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
