import { useState, useRef, useEffect } from 'react';
import { Peer, ChatMessage } from '../types';
import { MessageCircle, Send } from 'lucide-react';

interface ChatPanelProps {
  peers: Peer[];
  messages: ChatMessage[];
  sendChatMessage: (text: string, peerId: string) => void;
  myPeerId: string;
}

export function ChatPanel({ peers, messages, sendChatMessage, myPeerId }: ChatPanelProps) {
  const [selectedPeer, setSelectedPeer] = useState<string>('');
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const connectedPeers = peers.filter(p => p.status === 'connected');
  
  const peerMessages = messages.filter(m => 
    m.peerId === selectedPeer || (selectedPeer && m.peerId === selectedPeer)
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [peerMessages]);

  useEffect(() => {
    if (connectedPeers.length > 0 && !selectedPeer) {
      setSelectedPeer(connectedPeers[0].id);
    }
  }, [connectedPeers, selectedPeer]);

  const handleSend = () => {
    if (!message.trim() || !selectedPeer) return;
    sendChatMessage(message.trim(), selectedPeer);
    setMessage('');
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 flex flex-col h-[400px]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Chat</h2>
          <p className="text-xs text-gray-400">Message connected peers</p>
        </div>
      </div>

      {/* Peer Tabs */}
      {connectedPeers.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {connectedPeers.map(peer => (
            <button
              key={peer.id}
              onClick={() => setSelectedPeer(peer.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedPeer === peer.id
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {peer.name}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {!selectedPeer ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-500">Connect to a peer to start chatting</p>
          </div>
        ) : peerMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-500">No messages yet. Say hello!</p>
          </div>
        ) : (
          peerMessages.map(msg => {
            const isMe = true; // In a real app, compare msg.senderId with myPeerId
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                  isMe
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-700 text-gray-200 rounded-bl-sm'
                }`}>
                  <p>{msg.text}</p>
                  <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {selectedPeer && (
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-pink-500 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="p-2.5 bg-pink-600 hover:bg-pink-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
