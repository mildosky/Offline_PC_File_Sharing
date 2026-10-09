export interface Peer {
  id: string;
  name: string;
  status: 'connecting' | 'connected' | 'disconnected';
  avatar: string;
  lastSeen: Date;
}

export interface FileTransferItem {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  progress: number;
  status: 'pending' | 'sending' | 'receiving' | 'completed' | 'failed' | 'cancelled';
  peerId: string;
  peerName: string;
  direction: 'sent' | 'received';
  timestamp: Date;
  thumbnail?: string;
}

export interface ChatMessage {
  id: string;
  peerId: string;
  peerName: string;
  text: string;
  timestamp: Date;
  type: 'text' | 'file-info';
}

export interface ConnectionOffer {
  type: 'offer';
  sdp: string;
  senderName: string;
  senderId: string;
}

export interface ConnectionAnswer {
  type: 'answer';
  sdp: string;
  senderName: string;
  senderId: string;
}
