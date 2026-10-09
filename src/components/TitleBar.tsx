import { Minus, Square, X, Network } from 'lucide-react';

interface TitleBarProps {
  title?: string;
  isElectron?: boolean;
}

export function TitleBar({ title = 'NetShare', isElectron = false }: TitleBarProps) {
  const handleMinimize = () => {
    if (isElectron && window.electronAPI) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if (isElectron && window.electronAPI) {
      window.electronAPI.maximizeWindow();
    }
  };

  const handleClose = () => {
    if (isElectron && window.electronAPI) {
      window.electronAPI.closeWindow();
    }
  };

  return (
    <div className="h-8 bg-gray-950 border-b border-gray-800/50 flex items-center justify-between select-none" style={{ WebkitAppRegion: 'drag' } as any}>
      {/* Left: App icon and title */}
      <div className="flex items-center gap-2 px-3">
        <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Network className="w-2.5 h-2.5 text-white" />
        </div>
        <span className="text-xs font-medium text-gray-400">{title}</span>
        <span className="text-xs text-gray-600">by Musah Ibrahim</span>
      </div>

      {/* Right: Window controls */}
      {isElectron && (
        <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button
            onClick={handleMinimize}
            className="w-11 h-8 flex items-center justify-center hover:bg-gray-800 transition-colors"
          >
            <Minus className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-11 h-8 flex items-center justify-center hover:bg-gray-800 transition-colors"
          >
            <Square className="w-3 h-3 text-gray-400" />
          </button>
          <button
            onClick={handleClose}
            className="w-11 h-8 flex items-center justify-center hover:bg-red-600 transition-colors group"
          >
            <X className="w-3.5 h-3.5 text-gray-400 group-hover:text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
