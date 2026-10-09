import { useMemo } from 'react';
import { Zap, TrendingUp, Gauge, Clock } from 'lucide-react';

interface SpeedStats {
  bytesPerSecond: number;
  averageSpeed: number;
  peakSpeed: number;
  totalBytes: number;
  startTime: number;
  elapsedMs: number;
}

interface SpeedGaugeProps {
  speed: SpeedStats;
  isActive: boolean;
}

function formatSpeed(bytesPerSec: number): { value: string; unit: string } {
  if (bytesPerSec >= 1_000_000_000) {
    return { value: (bytesPerSec / 1_000_000_000).toFixed(2), unit: 'GB/s' };
  }
  if (bytesPerSec >= 1_000_000) {
    return { value: (bytesPerSec / 1_000_000).toFixed(1), unit: 'MB/s' };
  }
  if (bytesPerSec >= 1_000) {
    return { value: (bytesPerSec / 1_000).toFixed(1), unit: 'KB/s' };
  }
  return { value: bytesPerSec.toFixed(0), unit: 'B/s' };
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) return (bytes / 1_000_000_000).toFixed(2) + ' GB';
  if (bytes >= 1_000_000) return (bytes / 1_000_000).toFixed(1) + ' MB';
  if (bytes >= 1_000) return (bytes / 1_000).toFixed(1) + ' KB';
  return bytes + ' B';
}

export function SpeedGauge({ speed, isActive }: SpeedGaugeProps) {
  const { value, unit } = formatSpeed(speed.bytesPerSecond);
  
  // Calculate gauge percentage (cap at 1GB/s for visual)
  const maxSpeed = 1_000_000_000; // 1 GB/s visual max
  const percentage = Math.min((speed.bytesPerSecond / maxSpeed) * 100, 100);
  
  // Gauge arc (270 degrees)
  const arcAngle = 270;
  const startAngle = 135;
  const currentAngle = startAngle + (percentage / 100) * arcAngle;
  
  const radius = 80;
  const cx = 100;
  const cy = 100;
  
  const polarToCartesian = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  };
  
  const describeArc = (startA: number, endA: number) => {
    const start = polarToCartesian(endA);
    const end = polarToCartesian(startA);
    const largeArcFlag = endA - startA <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };
  
  const needlePos = polarToCartesian(currentAngle);
  
  // Color based on speed
  const getSpeedColor = () => {
    if (speed.bytesPerSecond >= 100_000_000) return { from: '#10b981', to: '#06b6d4', glow: 'rgba(16, 185, 129, 0.5)' };
    if (speed.bytesPerSecond >= 10_000_000) return { from: '#3b82f6', to: '#8b5cf6', glow: 'rgba(59, 130, 246, 0.5)' };
    if (speed.bytesPerSecond >= 1_000_000) return { from: '#f59e0b', to: '#ef4444', glow: 'rgba(245, 158, 11, 0.5)' };
    return { from: '#6b7280', to: '#9ca3af', glow: 'rgba(107, 114, 128, 0.3)' };
  };
  
  const colors = getSpeedColor();
  
  return (
    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
          <Gauge className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Transfer Speed</h2>
          <p className="text-xs text-gray-400">Real-time throughput monitor</p>
        </div>
        {isActive && (
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-400 font-medium">LIVE</span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center">
        {/* Gauge SVG */}
        <div className="relative w-[200px] h-[160px]">
          <svg viewBox="0 0 200 170" className="w-full h-full">
            <defs>
              <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={colors.from} />
                <stop offset="100%" stopColor={colors.to} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            
            {/* Background arc */}
            <path
              d={describeArc(startAngle, startAngle + arcAngle)}
              fill="none"
              stroke="rgba(75, 85, 99, 0.3)"
              strokeWidth="12"
              strokeLinecap="round"
            />
            
            {/* Active arc */}
            {isActive && percentage > 0 && (
              <path
                d={describeArc(startAngle, currentAngle)}
                fill="none"
                stroke="url(#speedGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                filter="url(#glow)"
                className="transition-all duration-300"
              />
            )}
            
            {/* Tick marks */}
            {[0, 25, 50, 75, 100].map((tick) => {
              const angle = startAngle + (tick / 100) * arcAngle;
              const inner = polarToCartesian(angle);
              const outerRadius = radius + 8;
              const rad = (angle * Math.PI) / 180;
              const outer = {
                x: cx + outerRadius * Math.cos(rad),
                y: cy + outerRadius * Math.sin(rad),
              };
              return (
                <line
                  key={tick}
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                  stroke="rgba(156, 163, 175, 0.5)"
                  strokeWidth="2"
                />
              );
            })}
            
            {/* Needle */}
            {isActive && (
              <line
                x1={cx}
                y1={cy}
                x2={needlePos.x}
                y2={needlePos.y}
                stroke={colors.from}
                strokeWidth="2"
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            )}
            
            {/* Center dot */}
            <circle cx={cx} cy={cy} r="4" fill={colors.from} />
          </svg>
          
          {/* Speed value overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
            <div className="text-center">
              <div className="text-3xl font-bold text-white tabular-nums">
                {isActive ? value : '0.0'}
              </div>
              <div className="text-xs text-gray-400 font-medium">{unit}</div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 w-full mt-4">
          <div className="bg-gray-800/30 border border-gray-700/20 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-green-400" />
              <span className="text-xs text-gray-500">Average</span>
            </div>
            <p className="text-sm font-bold text-white tabular-nums">
              {formatSpeed(speed.averageSpeed).value}
            </p>
            <p className="text-xs text-gray-500">{formatSpeed(speed.averageSpeed).unit}</p>
          </div>
          <div className="bg-gray-800/30 border border-gray-700/20 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span className="text-xs text-gray-500">Peak</span>
            </div>
            <p className="text-sm font-bold text-white tabular-nums">
              {formatSpeed(speed.peakSpeed).value}
            </p>
            <p className="text-xs text-gray-500">{formatSpeed(speed.peakSpeed).unit}</p>
          </div>
          <div className="bg-gray-800/30 border border-gray-700/20 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-gray-500">Total</span>
            </div>
            <p className="text-sm font-bold text-white tabular-nums">
              {formatBytes(speed.totalBytes)}
            </p>
            <p className="text-xs text-gray-500">transferred</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SpeedComparisonProps {
  currentSpeed: number;
  fileSize: number;
}

export function SpeedComparison({ currentSpeed, fileSize }: SpeedComparisonProps) {
  const comparisons = useMemo(() => {
    // Typical speeds for comparison
    const cloud = 5_000_000; // 5 MB/s (typical cloud upload)
    const usb2 = 30_000_000; // 30 MB/s (USB 2.0)
    const wifi5 = 50_000_000; // 50 MB/s (WiFi 5)
    const lan = currentSpeed || 100_000_000; // Use actual or estimate 100 MB/s
    
    const timeHere = currentSpeed > 0 ? fileSize / currentSpeed : fileSize / lan;
    const timeCloud = fileSize / cloud;
    const timeUsb = fileSize / usb2;
    
    return [
      {
        label: 'Cloud Upload',
        speed: cloud,
        time: timeCloud,
        icon: '☁️',
        multiplier: timeCloud / timeHere,
      },
      {
        label: 'USB 2.0',
        speed: usb2,
        time: timeUsb,
        icon: '🔌',
        multiplier: timeUsb / timeHere,
      },
    ];
  }, [currentSpeed, fileSize]);

  const formatTime = (seconds: number): string => {
    if (seconds < 1) return '< 1s';
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Speed Comparison</h2>
          <p className="text-xs text-gray-400">How much faster NetShare is</p>
        </div>
      </div>

      <div className="space-y-3">
        {comparisons.map((comp) => (
          <div key={comp.label} className="bg-gray-800/30 border border-gray-700/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{comp.icon}</span>
                <span className="text-sm text-gray-300">{comp.label}</span>
              </div>
              <span className="text-xs text-gray-500">{formatTime(comp.time)}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gray-500 to-gray-400 rounded-full"
                  style={{ width: `${Math.min(100, (comp.speed / (currentSpeed || 100_000_000)) * 100)}%` }}
                />
              </div>
              {comp.multiplier > 1 && (
                <span className="text-xs font-bold text-green-400 whitespace-nowrap">
                  {comp.multiplier.toFixed(1)}x slower
                </span>
              )}
            </div>
          </div>
        ))}
        
        {/* NetShare bar */}
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <span className="text-sm font-semibold text-green-300">NetShare P2P</span>
            </div>
            <span className="text-xs font-bold text-green-400">FASTEST</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
