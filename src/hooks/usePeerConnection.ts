import { useCallback, useRef, useState } from 'react';
import { Peer, FileTransferItem, ChatMessage } from '../types';
import { generateId } from '../utils/fileUtils';

// Pure LAN mode - no STUN/TURN servers needed
const ICE_CONFIG: RTCConfiguration = {
  iceServers: [],
  iceTransportPolicy: 'all',
};

// Performance-tuned constants
const CHUNK_SIZE = 256 * 1024; // 256KB chunks - optimal for LAN
const MAX_BUFFER_SIZE = 16 * 1024 * 1024; // 16MB buffer threshold
const BUFFER_LOW_THRESHOLD = 4 * 1024 * 1024; // Resume sending when buffer drops to 4MB

interface SpeedStats {
  bytesPerSecond: number;
  averageSpeed: number;
  peakSpeed: number;
  totalBytes: number;
  startTime: number;
  elapsedMs: number;
}

export function usePeerConnection() {
  const [peers, setPeers] = useState<Peer[]>([]);
  const [transfers, setTransfers] = useState<FileTransferItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [myPeerId] = useState(() => generateId());
  const [myPeerName, setMyPeerName] = useState(() => {
    const names = ['Phoenix', 'Nebula', 'Quantum', 'Stellar', 'Cosmic', 'Pulsar', 'Nova', 'Orion'];
    return names[Math.floor(Math.random() * names.length)] + '-' + Math.floor(Math.random() * 1000);
  });
  const [myCode, setMyCode] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [globalSpeed, setGlobalSpeed] = useState<SpeedStats>({
    bytesPerSecond: 0,
    averageSpeed: 0,
    peakSpeed: 0,
    totalBytes: 0,
    startTime: 0,
    elapsedMs: 0,
  });

  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const dataChannels = useRef<Map<string, RTCDataChannel>>(new Map());
  const incomingFiles = useRef<Map<string, { chunks: ArrayBuffer[]; meta: any; received: number; startTime: number }>>(new Map());
  
  // Speed tracking
  const speedTracker = useRef<{
    bytesInWindow: number;
    windowStart: number;
    totalBytes: number;
    peakSpeed: number;
    startTime: number;
    intervalId: number | null;
  }>({
    bytesInWindow: 0,
    windowStart: Date.now(),
    totalBytes: 0,
    peakSpeed: 0,
    startTime: 0,
    intervalId: null,
  });

  const updatePeerStatus = useCallback((peerId: string, status: Peer['status']) => {
    setPeers(prev => prev.map(p => p.id === peerId ? { ...p, status, lastSeen: new Date() } : p));
  }, []);

  // Start speed tracking interval
  const startSpeedTracking = useCallback(() => {
    if (speedTracker.current.intervalId) return;
    
    speedTracker.current.startTime = Date.now();
    speedTracker.current.windowStart = Date.now();
    speedTracker.current.bytesInWindow = 0;
    speedTracker.current.totalBytes = 0;
    speedTracker.current.peakSpeed = 0;
    
    speedTracker.current.intervalId = window.setInterval(() => {
      const now = Date.now();
      const windowDuration = (now - speedTracker.current.windowStart) / 1000; // seconds
      const currentSpeed = windowDuration > 0 
        ? speedTracker.current.bytesInWindow / windowDuration 
        : 0;
      
      if (currentSpeed > speedTracker.current.peakSpeed) {
        speedTracker.current.peakSpeed = currentSpeed;
      }
      
      const totalElapsed = (now - speedTracker.current.startTime) / 1000;
      const avgSpeed = totalElapsed > 0 
        ? speedTracker.current.totalBytes / totalElapsed 
        : 0;
      
      setGlobalSpeed({
        bytesPerSecond: currentSpeed,
        averageSpeed: avgSpeed,
        peakSpeed: speedTracker.current.peakSpeed,
        totalBytes: speedTracker.current.totalBytes,
        startTime: speedTracker.current.startTime,
        elapsedMs: now - speedTracker.current.startTime,
      });
      
      // Reset window
      speedTracker.current.windowStart = now;
      speedTracker.current.bytesInWindow = 0;
    }, 250); // Update 4x per second for smooth display
  }, []);

  const stopSpeedTracking = useCallback(() => {
    if (speedTracker.current.intervalId) {
      clearInterval(speedTracker.current.intervalId);
      speedTracker.current.intervalId = null;
    }
  }, []);

  const trackBytes = useCallback((bytes: number) => {
    speedTracker.current.bytesInWindow += bytes;
    speedTracker.current.totalBytes += bytes;
  }, []);

  const handleDataChannelMessage = useCallback((peerId: string, event: MessageEvent) => {
    const data = event.data;
    
    if (typeof data === 'string') {
      const msg = JSON.parse(data);
      
      if (msg.type === 'chat') {
        setMessages(prev => [...prev, {
          id: generateId(),
          peerId,
          peerName: msg.senderName,
          text: msg.text,
          timestamp: new Date(),
          type: 'text'
        }]);
      } else if (msg.type === 'file-meta') {
        incomingFiles.current.set(msg.transferId, {
          chunks: new Array(msg.totalChunks),
          meta: msg,
          received: 0,
          startTime: Date.now()
        });
        
        startSpeedTracking();
        
        setTransfers(prev => [...prev, {
          id: msg.transferId,
          fileName: msg.fileName,
          fileSize: msg.fileSize,
          fileType: msg.fileType,
          progress: 0,
          status: 'receiving',
          peerId,
          peerName: msg.senderName,
          direction: 'received',
          timestamp: new Date()
        }]);
      } else if (msg.type === 'file-complete') {
        const incoming = incomingFiles.current.get(msg.transferId);
        if (incoming) {
          // Filter out undefined slots (shouldn't happen but safety)
          const validChunks = incoming.chunks.filter(c => c !== undefined);
          const blob = new Blob(validChunks, { type: incoming.meta.fileType });
          const url = URL.createObjectURL(blob);
          
          const elapsed = (Date.now() - incoming.startTime) / 1000;
          const speed = elapsed > 0 ? incoming.meta.fileSize / elapsed : 0;
          
          setTransfers(prev => prev.map(t => 
            t.id === msg.transferId 
              ? { ...t, progress: 100, status: 'completed' }
              : t
          ));
          
          // Auto-download
          const a = document.createElement('a');
          a.href = url;
          a.download = incoming.meta.fileName;
          a.click();
          
          incomingFiles.current.delete(msg.transferId);
          
          // Check if any transfers still active
          const activeTransfers = [...incomingFiles.current.values()].length;
          if (activeTransfers === 0) {
            stopSpeedTracking();
          }
        }
      }
    } else if (data instanceof ArrayBuffer) {
      // Binary chunk with format: [transferIdLen(1)][transferId][chunkIndex(4)][chunkData]
      const view = new DataView(data);
      const transferIdLength = view.getUint8(0);
      const transferId = new TextDecoder().decode(new Uint8Array(data, 1, transferIdLength));
      const chunkIndex = view.getUint32(1 + transferIdLength);
      const chunkData = data.slice(1 + transferIdLength + 4);
      
      const incoming = incomingFiles.current.get(transferId);
      if (incoming) {
        incoming.chunks[chunkIndex] = chunkData;
        incoming.received++;
        
        // Track speed
        trackBytes(chunkData.byteLength);
        
        const progress = Math.round((incoming.received / incoming.meta.totalChunks) * 100);
        
        setTransfers(prev => prev.map(t => 
          t.id === transferId ? { ...t, progress } : t
        ));
      }
    }
  }, [startSpeedTracking, stopSpeedTracking, trackBytes]);

  const setupDataChannel = useCallback((peerId: string, channel: RTCDataChannel) => {
    channel.binaryType = 'arraybuffer';
    
    // Optimize for high throughput
    // Note: bufferedAmountLowThreshold is read-only in some browsers, 
    // but we'll manage backpressure manually
    
    channel.onmessage = (event) => handleDataChannelMessage(peerId, event);
    
    channel.onopen = () => {
      updatePeerStatus(peerId, 'connected');
    };
    
    channel.onclose = () => {
      updatePeerStatus(peerId, 'disconnected');
    };
    
    dataChannels.current.set(peerId, channel);
  }, [handleDataChannelMessage, updatePeerStatus]);

  const createPeerConnection = useCallback((peerId: string, isInitiator: boolean) => {
    const pc = new RTCPeerConnection(ICE_CONFIG);
    
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        updatePeerStatus(peerId, 'disconnected');
      }
    };

    if (isInitiator) {
      // Use unordered for maximum throughput - we handle ordering via chunk indices
      const channel = pc.createDataChannel('fileTransfer', {
        ordered: false, // Unordered = faster, we reconstruct by index
        maxRetransmits: 10,
      });
      setupDataChannel(peerId, channel);
    } else {
      pc.ondatachannel = (event) => {
        setupDataChannel(peerId, event.channel);
      };
    }

    peerConnections.current.set(peerId, pc);
    return pc;
  }, [setupDataChannel, updatePeerStatus]);

  const generateConnectionCode = useCallback(async (): Promise<string> => {
    const peerId = generateId();
    const pc = createPeerConnection(peerId, true);
    
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    await new Promise<void>((resolve) => {
      if (pc.iceGatheringState === 'complete') {
        resolve();
      } else {
        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === 'complete') resolve();
        };
        setTimeout(resolve, 2000);
      }
    });

    const code = btoa(JSON.stringify({
      type: 'offer',
      sdp: pc.localDescription,
      senderName: myPeerName,
      senderId: myPeerId,
      peerId
    }));
    
    setMyCode(code);
    setIsListening(true);
    return code;
  }, [createPeerConnection, myPeerName, myPeerId]);

  const connectWithCode = useCallback(async (code: string) => {
    try {
      const decoded = JSON.parse(atob(code));
      
      if (decoded.type === 'offer') {
        const peerId = decoded.peerId || generateId();
        const pc = createPeerConnection(peerId, false);
        
        await pc.setRemoteDescription(decoded.sdp);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        await new Promise<void>((resolve) => {
          if (pc.iceGatheringState === 'complete') {
            resolve();
          } else {
            pc.onicegatheringstatechange = () => {
              if (pc.iceGatheringState === 'complete') resolve();
            };
            setTimeout(resolve, 2000);
          }
        });

        const answerCode = btoa(JSON.stringify({
          type: 'answer',
          sdp: pc.localDescription,
          senderName: myPeerName,
          senderId: myPeerId,
        }));

        setPeers(prev => [...prev, {
          id: peerId,
          name: decoded.senderName,
          status: 'connecting',
          avatar: decoded.senderName.charAt(0).toUpperCase(),
          lastSeen: new Date()
        }]);

        return answerCode;
      } else if (decoded.type === 'answer') {
        const entries = [...peerConnections.current.entries()];
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          const [peerId, pc] = lastEntry;
          await pc.setRemoteDescription(decoded.sdp);
          
          setPeers(prev => [...prev, {
            id: peerId,
            name: decoded.senderName,
            status: 'connecting',
            avatar: decoded.senderName.charAt(0).toUpperCase(),
            lastSeen: new Date()
          }]);
        }
        return null;
      }
    } catch (err) {
      console.error('Connection error:', err);
    }
    return null;
  }, [createPeerConnection, myPeerName, myPeerId]);

  const applyAnswer = useCallback(async (answerCodeStr: string) => {
    try {
      const decoded = JSON.parse(atob(answerCodeStr));
      if (decoded.type === 'answer') {
        const entries = [...peerConnections.current.entries()];
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          const [peerId, pc] = lastEntry;
          await pc.setRemoteDescription(decoded.sdp);
          
          setPeers(prev => {
            const exists = prev.find(p => p.id === peerId);
            if (exists) return prev;
            return [...prev, {
              id: peerId,
              name: decoded.senderName,
              status: 'connecting',
              avatar: decoded.senderName.charAt(0).toUpperCase(),
              lastSeen: new Date()
            }];
          });
          return true;
        }
      }
    } catch (err) {
      console.error('Error applying answer:', err);
    }
    return false;
  }, []);

  // Wait for buffer to drain before sending more
  const waitForBufferDrain = (channel: RTCDataChannel): Promise<void> => {
    return new Promise((resolve) => {
      if (channel.bufferedAmount < BUFFER_LOW_THRESHOLD) {
        resolve();
        return;
      }
      
      const check = () => {
        if (channel.bufferedAmount < BUFFER_LOW_THRESHOLD) {
          resolve();
        } else {
          setTimeout(check, 1); // Check every 1ms for minimal latency
        }
      };
      setTimeout(check, 1);
    });
  };

  const sendFile = useCallback(async (file: File, peerId: string) => {
    const channel = dataChannels.current.get(peerId);
    if (!channel || channel.readyState !== 'open') {
      console.error('Channel not ready');
      return;
    }

    const transferId = generateId();
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const peer = peers.find(p => p.id === peerId);
    const encoder = new TextEncoder();
    const transferIdBytes = encoder.encode(transferId);

    // Send file metadata
    channel.send(JSON.stringify({
      type: 'file-meta',
      transferId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      totalChunks,
      senderName: myPeerName,
    }));

    startSpeedTracking();

    setTransfers(prev => [...prev, {
      id: transferId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      progress: 0,
      status: 'sending',
      peerId,
      peerName: peer?.name || 'Unknown',
      direction: 'sent',
      timestamp: new Date()
    }]);

    // Send chunks with backpressure management
    let sentChunks = 0;
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = await file.slice(start, end).arrayBuffer();
      
      // Build message: [transferIdLen(1)][transferId][chunkIndex(4)][chunkData]
      const message = new Uint8Array(1 + transferIdBytes.length + 4 + chunk.byteLength);
      message[0] = transferIdBytes.length;
      message.set(transferIdBytes, 1);
      
      // Write chunk index as 4-byte big-endian
      const indexView = new DataView(message.buffer);
      indexView.setUint32(1 + transferIdBytes.length, i);
      
      message.set(new Uint8Array(chunk), 1 + transferIdBytes.length + 4);
      
      // Backpressure: wait if buffer is full
      if (channel.bufferedAmount > MAX_BUFFER_SIZE) {
        await waitForBufferDrain(channel);
      }
      
      channel.send(message.buffer);
      sentChunks++;
      
      // Track speed
      trackBytes(chunk.byteLength);
      
      const progress = Math.round((sentChunks / totalChunks) * 100);
      setTransfers(prev => prev.map(t => 
        t.id === transferId ? { ...t, progress } : t
      ));
    }

    // Signal completion
    channel.send(JSON.stringify({
      type: 'file-complete',
      transferId,
    }));

    setTransfers(prev => prev.map(t => 
      t.id === transferId ? { ...t, progress: 100, status: 'completed' } : t
    ));
  }, [peers, myPeerName, startSpeedTracking, trackBytes]);

  const sendChatMessage = useCallback((text: string, peerId: string) => {
    const channel = dataChannels.current.get(peerId);
    if (!channel || channel.readyState !== 'open') return;

    channel.send(JSON.stringify({
      type: 'chat',
      text,
      senderName: myPeerName,
    }));

    setMessages(prev => [...prev, {
      id: generateId(),
      peerId,
      peerName: myPeerName,
      text,
      timestamp: new Date(),
      type: 'text'
    }]);
  }, [myPeerName]);

  const disconnectPeer = useCallback((peerId: string) => {
    const pc = peerConnections.current.get(peerId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(peerId);
    }
    dataChannels.current.delete(peerId);
    setPeers(prev => prev.filter(p => p.id !== peerId));
  }, []);

  const addDemoPeer = useCallback(() => {
    const demoNames = ['🎭 DEMO - Alpha-PC', '🎭 DEMO - Beta-Workstation', '🎭 DEMO - Gamma-Laptop', '🎭 DEMO - Delta-Desktop', '🎭 DEMO - Epsilon-Mac'];
    const name = demoNames[peers.length % demoNames.length];
    const id = generateId();
    
    setPeers(prev => [...prev, {
      id,
      name,
      status: 'connected',
      avatar: name.charAt(0).toUpperCase(),
      lastSeen: new Date()
    }]);

    // Simulate a high-speed file receive (DEMO ONLY - not real)
    setTimeout(() => {
      const transferId = generateId();
      const fileSize = Math.floor(Math.random() * 500_000_000) + 50_000_000; // 50-550 MB
      const startTime = Date.now();
      
      // Simulate progressive transfer at high speed (DEMO SIMULATION)
      setTransfers(prev => [...prev, {
        id: transferId,
        fileName: `🎭 DEMO - project_files_${Math.floor(Math.random() * 100)}.zip`,
        fileSize,
        fileType: 'application/zip',
        progress: 0,
        status: 'receiving',
        peerId: id,
        peerName: name,
        direction: 'received',
        timestamp: new Date()
      }]);
      
      startSpeedTracking();
      
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5; // 5-20% per tick
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setTransfers(prev => prev.map(t => 
            t.id === transferId ? { ...t, progress: 100, status: 'completed' } : t
          ));
          stopSpeedTracking();
        } else {
          setTransfers(prev => prev.map(t => 
            t.id === transferId ? { ...t, progress: Math.round(progress) } : t
          ));
        }
      }, 100);
    }, 1500);
  }, [peers.length, startSpeedTracking, stopSpeedTracking]);

  return {
    peers,
    transfers,
    messages,
    myPeerId,
    myPeerName,
    setMyPeerName,
    myCode,
    isListening,
    globalSpeed,
    generateConnectionCode,
    connectWithCode,
    applyAnswer,
    sendFile,
    sendChatMessage,
    disconnectPeer,
    addDemoPeer,
    setTransfers,
  };
}
