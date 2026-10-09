import { useCallback, useRef, useState } from 'react';
import { Peer, FileTransferItem, ChatMessage } from '../types';
import { generateId, formatFileSize } from '../utils/fileUtils';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

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

  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const dataChannels = useRef<Map<string, RTCDataChannel>>(new Map());
  const incomingFiles = useRef<Map<string, { chunks: ArrayBuffer[]; meta: any; received: number }>>(new Map());

  const updatePeerStatus = useCallback((peerId: string, status: Peer['status']) => {
    setPeers(prev => prev.map(p => p.id === peerId ? { ...p, status, lastSeen: new Date() } : p));
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
          chunks: [],
          meta: msg,
          received: 0
        });
        
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
          const blob = new Blob(incoming.chunks, { type: incoming.meta.fileType });
          const url = URL.createObjectURL(blob);
          
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
        }
      }
    } else if (data instanceof ArrayBuffer) {
      // Binary data - file chunk
      const view = new DataView(data);
      const transferIdLength = view.getUint8(0);
      const transferId = new TextDecoder().decode(new Uint8Array(data, 1, transferIdLength));
      const chunkData = data.slice(1 + transferIdLength);
      
      const incoming = incomingFiles.current.get(transferId);
      if (incoming) {
        incoming.chunks.push(chunkData);
        incoming.received++;
        const progress = Math.round((incoming.received / incoming.meta.totalChunks) * 100);
        
        setTransfers(prev => prev.map(t => 
          t.id === transferId ? { ...t, progress } : t
        ));
      }
    }
  }, []);

  const setupDataChannel = useCallback((peerId: string, channel: RTCDataChannel) => {
    channel.binaryType = 'arraybuffer';
    
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
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        updatePeerStatus(peerId, 'disconnected');
      }
    };

    if (isInitiator) {
      const channel = pc.createDataChannel('fileTransfer', {
        ordered: true,
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
        // Timeout after 3 seconds
        setTimeout(resolve, 3000);
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
            setTimeout(resolve, 3000);
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
        // Find the pending connection
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

  const sendFile = useCallback(async (file: File, peerId: string) => {
    const channel = dataChannels.current.get(peerId);
    if (!channel || channel.readyState !== 'open') {
      console.error('Channel not ready');
      return;
    }

    const transferId = generateId();
    const totalChunks = Math.ceil(file.size / (64 * 1024));
    const peer = peers.find(p => p.id === peerId);

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

    // Send chunks
    const CHUNK_SIZE = 64 * 1024;
    const encoder = new TextEncoder();
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = await file.slice(start, end).arrayBuffer();
      
      // Create message with transfer ID prefix
      const transferIdBytes = encoder.encode(transferId);
      const message = new Uint8Array(1 + transferIdBytes.length + chunk.byteLength);
      message[0] = transferIdBytes.length;
      message.set(transferIdBytes, 1);
      message.set(new Uint8Array(chunk), 1 + transferIdBytes.length);
      
      channel.send(message.buffer);
      
      const progress = Math.round(((i + 1) / totalChunks) * 100);
      setTransfers(prev => prev.map(t => 
        t.id === transferId ? { ...t, progress } : t
      ));
      
      // Small delay to prevent overwhelming the channel
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    // Signal completion
    channel.send(JSON.stringify({
      type: 'file-complete',
      transferId,
    }));

    setTransfers(prev => prev.map(t => 
      t.id === transferId ? { ...t, progress: 100, status: 'completed' } : t
    ));
  }, [peers, myPeerName]);

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

  // Demo mode - simulate connections for testing UI
  const addDemoPeer = useCallback(() => {
    const demoNames = ['Alpha-PC', 'Beta-Workstation', 'Gamma-Laptop', 'Delta-Desktop', 'Epsilon-Mac'];
    const name = demoNames[peers.length % demoNames.length];
    const id = generateId();
    
    setPeers(prev => [...prev, {
      id,
      name,
      status: 'connected',
      avatar: name.charAt(0).toUpperCase(),
      lastSeen: new Date()
    }]);

    // Simulate receiving a file
    setTimeout(() => {
      const transferId = generateId();
      setTransfers(prev => [...prev, {
        id: transferId,
        fileName: `document_${Math.floor(Math.random() * 100)}.pdf`,
        fileSize: Math.floor(Math.random() * 5000000) + 100000,
        fileType: 'application/pdf',
        progress: 100,
        status: 'completed',
        peerId: id,
        peerName: name,
        direction: 'received',
        timestamp: new Date()
      }]);
    }, 2000);
  }, [peers.length]);

  return {
    peers,
    transfers,
    messages,
    myPeerId,
    myPeerName,
    setMyPeerName,
    myCode,
    isListening,
    generateConnectionCode,
    connectWithCode,
    sendFile,
    sendChatMessage,
    disconnectPeer,
    addDemoPeer,
    setTransfers,
  };
}
