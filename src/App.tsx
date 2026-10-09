import { useState } from 'react';
import { ConnectionPanel } from './components/ConnectionPanel';
import { FileTransfer } from './components/FileTransfer';
import { ChatPanel } from './components/ChatPanel';
import { NetworkStatus } from './components/NetworkStatus';
import { usePeerConnection } from './hooks/usePeerConnection';
import { 
  Globe, Shield, Zap, Monitor, 
  ArrowRight, Network, Lock, 
  Radio, HardDrive, Users, Gauge
} from 'lucide-react';

type Tab = 'transfer' | 'chat' | 'connections';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('connections');
  const [showLanding, setShowLanding] = useState(true);
  
  const {
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
  } = usePeerConnection();

  if (showLanding) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-gray-800/50 backdrop-blur-xl bg-gray-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Network className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  NetShare
                </h1>
                <p className="text-xs text-gray-500 -mt-0.5">P2P File Sharing</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-700/50">
                <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                {isListening ? 'Online' : 'Offline'}
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-700/50">
                <Users className="w-3 h-3" />
                {peers.length} peers
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-700/50">
                <HardDrive className="w-3 h-3" />
                {transfers.length} transfers
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="relative z-10 border-b border-gray-800/50 bg-gray-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 py-2">
            {[
              { id: 'connections' as Tab, label: 'Connections', icon: Network },
              { id: 'transfer' as Tab, label: 'File Transfer', icon: HardDrive },
              { id: 'chat' as Tab, label: 'Chat', icon: Radio },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'chat' && messages.length > 0 && (
                  <span className="bg-pink-500 text-white text-xs px-1.5 py-0.5 rounded-full">{messages.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'connections' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <NetworkStatus
              isListening={isListening}
              peerCount={peers.filter(p => p.status === 'connected').length}
              activeTransfers={transfers.filter(t => t.status === 'sending' || t.status === 'receiving').length}
            />
            <ConnectionPanel
              myPeerName={myPeerName}
              setMyPeerName={setMyPeerName}
              myCode={myCode}
              isListening={isListening}
              peers={peers}
              generateConnectionCode={generateConnectionCode}
              connectWithCode={connectWithCode}
              applyAnswer={applyAnswer}
              disconnectPeer={disconnectPeer}
              addDemoPeer={addDemoPeer}
            />
            
            {/* How it works - Manual Signaling Explanation */}
            <div className="mt-8 bg-gray-900/30 border border-gray-800/50 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                How Manual Signaling Works (No Internet Required)
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Since there's no server to coordinate connections, you manually exchange connection codes between PCs. 
                Both devices must be on the same local network (WiFi or Ethernet).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <span className="text-xs">1</span>
                    </div>
                    <p className="text-xs font-medium text-blue-300">PC 1: Generate Code</p>
                  </div>
                  <p className="text-xs text-gray-400">
                    Click "Start Listening" → copy the generated connection code
                  </p>
                </div>
                <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <span className="text-xs">2</span>
                    </div>
                    <p className="text-xs font-medium text-purple-300">Transfer Code to PC 2</p>
                  </div>
                  <p className="text-xs text-gray-400">
                    Share via USB drive, local file share, print, or any offline method
                  </p>
                </div>
                <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                      <span className="text-xs">3</span>
                    </div>
                    <p className="text-xs font-medium text-green-300">PC 2: Connect & Reply</p>
                  </div>
                  <p className="text-xs text-gray-400">
                    Paste the code → click "Connect" → copy the generated answer code
                  </p>
                </div>
                <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <span className="text-xs">4</span>
                    </div>
                    <p className="text-xs font-medium text-orange-300">PC 1: Paste Answer</p>
                  </div>
                  <p className="text-xs text-gray-400">
                    Send the answer code back to PC 1 → paste it → connection established!
                  </p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                <p className="text-xs text-yellow-300/80 flex items-start gap-2">
                  <span>💡</span>
                  <span><strong>Tip:</strong> Once connected, all file transfers happen directly between devices over your local network — no internet, no cloud, no server involved. Your data stays completely private.</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transfer' && (
          <div className="max-w-2xl mx-auto">
            <FileTransfer
              peers={peers}
              transfers={transfers}
              sendFile={sendFile}
              globalSpeed={globalSpeed}
            />
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="max-w-2xl mx-auto">
            <ChatPanel
              peers={peers}
              messages={messages}
              sendChatMessage={sendChatMessage}
              myPeerId={myPeerId}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3" /> End-to-end encrypted
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" /> No internet required
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" /> P2P direct transfer
              </span>
            </div>
            <p className="text-xs text-gray-600">
              NetShare v1.0 • Peer-to-Peer File Sharing
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Landing Page Component
function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-3xl" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Network className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            NetShare
          </span>
        </div>
        <button
          onClick={onGetStarted}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
        >
          Get Started
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-8">
            <Zap className="w-4 h-4 text-green-400 animate-pulse" />
            <span className="text-sm text-green-300 font-semibold">⚡ BLAZING FAST • Up to 100+ MB/s on LAN</span>
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-bold leading-tight mb-6">
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Transfer Files at
            </span>
            <br />
            <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Lightning Speed
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-6 leading-relaxed">
            Experience <span className="text-green-400 font-semibold">100+ MB/s transfer speeds</span> on your local network. 
            No internet required. No cloud. No limits. Just pure, direct P2P speed.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4 mb-10 text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-full border border-gray-700/50">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-gray-300">256KB Optimized Chunks</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-full border border-gray-700/50">
              <Gauge className="w-4 h-4 text-blue-400" />
              <span className="text-gray-300">Real-time Speed Monitor</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-full border border-gray-700/50">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-gray-300">Zero Internet Data</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={onGetStarted}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl text-lg font-semibold transition-all shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 flex items-center gap-2"
            >
              Start Sharing
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="px-8 py-4 border border-gray-700 hover:border-gray-600 rounded-xl text-lg font-medium text-gray-300 hover:text-white transition-all">
              Learn More
            </button>
          </div>

          {/* Hero Visual - Speed Dashboard Preview */}
          <div className="relative max-w-3xl mx-auto">
            <div className="bg-gray-900/50 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-green-500/5">
              {/* Turbo Mode Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-lg shadow-green-500/30">
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  <Zap className="w-3 h-3" /> TURBO MODE
                </span>
              </div>
              
              <div className="flex items-center justify-center gap-6 sm:gap-12 mt-4">
                {/* Device 1 */}
                <div className="text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-2">
                    <Monitor className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />
                  </div>
                  <p className="text-xs text-gray-400 font-medium">PC 1</p>
                </div>

                {/* Speed Indicator */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-gradient-to-t from-green-500 to-emerald-400 rounded-full animate-pulse"
                          style={{
                            height: `${12 + i * 6}px`,
                            animationDelay: `${i * 0.1}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xl sm:text-2xl font-bold text-green-400 tabular-nums">112.4</p>
                    <p className="text-xs text-gray-500">MB/s</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <div className="w-12 sm:w-20 h-0.5 bg-gradient-to-r from-green-500 to-emerald-400" />
                    <Zap className="w-3 h-3 text-yellow-400 animate-pulse" />
                    <div className="w-12 sm:w-20 h-0.5 bg-gradient-to-r from-emerald-400 to-green-500" />
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" style={{ animationDelay: '0.5s' }} />
                  </div>
                  <span className="text-xs text-green-400 font-medium">P2P Direct</span>
                </div>

                {/* Device 2 */}
                <div className="text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center mb-2">
                    <Monitor className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400" />
                  </div>
                  <p className="text-xs text-gray-400 font-medium">PC 2</p>
                </div>
              </div>
              
              {/* Bottom stats */}
              <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-800/50">
                <div className="text-center">
                  <p className="text-xs text-gray-500">1GB File</p>
                  <p className="text-sm font-bold text-white">~9 seconds</p>
                </div>
                <div className="w-px h-8 bg-gray-800" />
                <div className="text-center">
                  <p className="text-xs text-gray-500">Internet Used</p>
                  <p className="text-sm font-bold text-green-400">0 MB</p>
                </div>
                <div className="w-px h-8 bg-gray-800" />
                <div className="text-center">
                  <p className="text-xs text-gray-500">vs Cloud</p>
                  <p className="text-sm font-bold text-yellow-400">20x faster</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Speed Showcase Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-4">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-yellow-300 font-semibold">THE SPEED ADVANTAGE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Engineered for Maximum Speed
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Every component optimized for throughput. From 256KB chunk sizes to intelligent backpressure 
            management — NetShare squeezes every bit of bandwidth from your local network.
          </p>
        </div>

        {/* Speed Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          {[
            { value: '256KB', label: 'Chunk Size', sub: 'Optimized for LAN', icon: '📦' },
            { value: '100+', label: 'MB/s', sub: 'On Gigabit LAN', icon: '⚡' },
            { value: '16MB', label: 'Buffer', sub: 'Smart backpressure', icon: '🔄' },
            { value: '0', label: 'Internet Data', sub: '100% local transfer', icon: '🛡️' },
          ].map((stat, i) => (
            <div key={i} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-5 text-center hover:border-gray-700/50 transition-all">
              <span className="text-2xl mb-2 block">{stat.icon}</span>
              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">{stat.value}</p>
              <p className="text-sm text-gray-300 font-medium">{stat.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Speed Comparison Visual */}
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-white mb-6 text-center">Transfer Speed Comparison</h3>
          <div className="space-y-4 max-w-2xl mx-auto">
            {[
              { label: 'Cloud Upload (Google Drive)', speed: '5 MB/s', width: '5%', color: 'from-gray-600 to-gray-500', time: '~3.3 min for 1GB' },
              { label: 'Email Attachment', speed: '2 MB/s', width: '2%', color: 'from-gray-700 to-gray-600', time: '~8.3 min for 1GB' },
              { label: 'USB 2.0 Drive', speed: '30 MB/s', width: '30%', color: 'from-yellow-600 to-yellow-500', time: '~33s for 1GB' },
              { label: 'WiFi 5 (5GHz)', speed: '50 MB/s', width: '50%', color: 'from-blue-600 to-blue-500', time: '~20s for 1GB' },
              { label: 'WiFi 6 (6GHz)', speed: '80 MB/s', width: '80%', color: 'from-purple-600 to-purple-500', time: '~12.5s for 1GB' },
              { label: 'NetShare P2P (Gigabit LAN)', speed: '100+ MB/s', width: '100%', color: 'from-green-500 to-emerald-400', time: '~10s for 1GB', highlight: true },
            ].map((item, i) => (
              <div key={i} className={`${item.highlight ? 'bg-green-500/5 border border-green-500/30 rounded-xl p-4' : 'p-3'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${item.highlight ? 'text-green-300 font-semibold' : 'text-gray-300'}`}>
                    {item.highlight && '⚡ '}{item.label}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{item.time}</span>
                    <span className={`text-sm font-bold ${item.highlight ? 'text-green-400' : 'text-gray-400'}`}>{item.speed}</span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-1000`}
                    style={{ width: item.width }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Built Different
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Every feature designed to maximize speed and minimize friction.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Zap,
              title: 'Blazing Fast Transfers',
              description: '256KB optimized chunks with intelligent backpressure. Unordered data channels for maximum throughput. Hit 100+ MB/s on Gigabit LAN.',
              gradient: 'from-yellow-500 to-orange-500',
              highlight: true,
            },
            {
              icon: Gauge,
              title: 'Real-time Speed Monitor',
              description: 'Beautiful gauge showing live transfer speed, peak throughput, average speed, and total data transferred. Know exactly how fast you\'re going.',
              gradient: 'from-blue-500 to-cyan-500',
            },
            {
              icon: Globe,
              title: 'No Internet Required',
              description: 'Transfer files directly between devices on your local network. Works even with zero internet connectivity. Your ISP data plan stays untouched.',
              gradient: 'from-green-500 to-emerald-500',
            },
            {
              icon: Users,
              title: 'Multi-PC Support',
              description: 'Connect multiple computers simultaneously. Share files between any combination of devices in your network at full speed.',
              gradient: 'from-purple-500 to-pink-500',
            },
            {
              icon: Lock,
              title: 'End-to-End Encrypted',
              description: 'All transfers are encrypted directly between devices. No data passes through any server. Your files stay private.',
              gradient: 'from-indigo-500 to-blue-500',
            },
            {
              icon: HardDrive,
              title: 'Any File, Any Size',
              description: 'Send documents, images, videos, archives — any file type with no size restrictions. Transfer multi-gigabyte files without breaking a sweat.',
              gradient: 'from-rose-500 to-pink-500',
            },
          ].map((feature, index) => (
            <div
              key={index}
              className={`group rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 ${
                feature.highlight
                  ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border border-yellow-500/30 hover:border-yellow-500/50'
                  : 'bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 hover:border-gray-700/50'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              {feature.highlight && (
                <span className="inline-block px-2 py-0.5 bg-yellow-500/20 text-yellow-300 text-xs font-bold rounded-full mb-2">
                  SELLING POINT
                </span>
              )}
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Supported Files Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 sm:p-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Share Anything
            </h2>
            <p className="text-gray-400">Support for all file types and sizes</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { emoji: '📄', label: 'Documents' },
              { emoji: '🖼️', label: 'Images' },
              { emoji: '🎬', label: 'Videos' },
              { emoji: '🎵', label: 'Audio' },
              { emoji: '📦', label: 'Archives' },
              { emoji: '📊', label: 'Spreadsheets' },
              { emoji: '📝', label: 'Text Files' },
              { emoji: '💾', label: 'Executables' },
              { emoji: '🎨', label: 'Design Files' },
              { emoji: '📽️', label: 'Presentations' },
              { emoji: '🗃️', label: 'Databases' },
              { emoji: '⚙️', label: 'Config Files' },
            ].map((item, index) => (
              <div key={index} className="flex flex-col items-center p-4 bg-gray-800/30 rounded-xl border border-gray-700/20 hover:border-gray-600/30 transition-colors">
                <span className="text-3xl mb-2">{item.emoji}</span>
                <span className="text-xs text-gray-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-cyan-500/10 border border-green-500/20 rounded-3xl p-8 sm:p-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full mb-6">
            <Zap className="w-4 h-4 text-green-400 animate-pulse" />
            <span className="text-sm text-green-300 font-semibold">Ready for max speed?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Experience LAN-Speed File Transfer
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-8">
            No downloads, no installations. Open NetShare in your browser and watch your files fly 
            between devices at 100+ MB/s. Zero internet data. Zero cloud. Pure speed.
          </p>
          <button
            onClick={onGetStarted}
            className="px-10 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl text-lg font-semibold transition-all shadow-xl shadow-green-500/25 hover:shadow-green-500/40 inline-flex items-center gap-2"
          >
            <Zap className="w-5 h-5" />
            Launch at Full Speed
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800/50 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-blue-400" />
              <span className="font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                NetShare
              </span>
            </div>
            <p className="text-xs text-gray-600">
              © 2026 NetShare • Peer-to-Peer File Sharing • No Internet Required
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
