import React, { useState, useEffect, useRef } from 'react';
import { Usb, Cable, CheckCircle, XCircle, Loader, Zap, Info, AlertTriangle } from 'lucide-react';

interface USBConnectionPanelProps {
  onDeviceConnected?: (device: any) => void;
  onDeviceDisconnected?: (device: any) => void;
}

export const USBConnectionPanel: React.FC<USBConnectionPanelProps> = ({
  onDeviceConnected,
  onDeviceDisconnected,
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>('');
  const [transferSpeed, setTransferSpeed] = useState<string>('');

  useEffect(() => {
    // Check if WebUSB is supported
    if ('usb' in navigator) {
      setIsSupported(true);
      // Get previously authorized devices
      loadAuthorizedDevices();
    } else {
      setIsSupported(false);
    }
  }, []);

  const loadAuthorizedDevices = async () => {
    try {
      const authorizedDevices = await (navigator as any).usb.getDevices();
      setDevices(authorizedDevices);
    } catch (err) {
      console.error('Failed to load USB devices:', err);
    }
  };

  const handleRequestDevice = async () => {
    try {
      setError('');
      setIsConnecting(true);

      // Request USB device (shows browser's device picker)
      const device = await (navigator as any).usb.requestDevice({
        filters: [
          // Accept any USB device
          // In production, you'd specify vendor/product IDs
        ],
      });

      if (device) {
        // Open the device
        await device.open();
        
        // Select configuration (usually configuration 1)
        if (device.configuration === null) {
          await device.selectConfiguration(1);
        }

        // Claim interface (usually interface 0)
        await device.claimInterface(0);

        setConnectedDevice(device);
        setDevices(prev => [...prev, device]);
        
        // Detect USB speed
        detectUSBSpeed(device);

        if (onDeviceConnected) {
          onDeviceConnected(device);
        }

        // Listen for disconnect
        device.addEventListener('disconnect', () => {
          setConnectedDevice(null);
          setDevices(prev => prev.filter(d => d !== device));
          if (onDeviceDisconnected) {
            onDeviceDisconnected(device);
          }
        });
      }
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        // User cancelled
        setError('');
      } else {
        setError(`Failed to connect: ${err.message}`);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const detectUSBSpeed = (device: any) => {
    // USB speed detection based on device properties
    const usbVersion = device.usbVersionMajor || 2;
    
    if (usbVersion >= 3) {
      setTransferSpeed('USB 3.0+ (5 Gbps)');
    } else if (usbVersion >= 2) {
      setTransferSpeed('USB 2.0 (480 Mbps)');
    } else {
      setTransferSpeed('USB 1.1 (12 Mbps)');
    }
  };

  const handleDisconnect = async () => {
    if (connectedDevice) {
      try {
        await connectedDevice.close();
        setConnectedDevice(null);
      } catch (err) {
        console.error('Failed to disconnect:', err);
      }
    }
  };

  const handleForgetDevice = async (device: any) => {
    try {
      await device.forget();
      setDevices(prev => prev.filter(d => d !== device));
      if (connectedDevice === device) {
        setConnectedDevice(null);
      }
    } catch (err) {
      console.error('Failed to forget device:', err);
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg">
          <Usb className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">USB Direct Connection</h2>
          <p className="text-sm text-gray-400">Fastest offline transfer via USB cable</p>
        </div>
      </div>

      {/* Support Warning */}
      {!isSupported && (
        <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-300 mb-1">USB Not Supported</p>
              <p className="text-xs text-amber-400/80">
                WebUSB is only supported in Chrome, Edge, and Opera browsers. 
                Please use a compatible browser or try LAN/Bluetooth connection instead.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Speed Info */}
      {isSupported && (
        <div className="bg-blue-900/10 border border-blue-800/50 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p className="font-semibold mb-1">USB Transfer Speeds</p>
              <div className="space-y-1 text-xs text-blue-400/80">
                <p>• USB 3.0+: Up to 5 Gbps (625 MB/s)</p>
                <p>• USB 2.0: Up to 480 Mbps (60 MB/s)</p>
                <p>• USB 1.1: Up to 12 Mbps (1.5 MB/s)</p>
              </div>
              <p className="text-xs text-blue-400/60 mt-2">
                Much faster than Bluetooth (0.5 MB/s) and comparable to LAN speeds!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Connection Status */}
      {connectedDevice ? (
        <div className="space-y-4">
          <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-sm font-semibold text-green-300">USB Device Connected</p>
                <p className="text-xs text-green-400/80">{connectedDevice.productName || 'Unknown Device'}</p>
              </div>
            </div>
            
            {transferSpeed && (
              <div className="bg-green-900/30 rounded p-2 mb-3">
                <p className="text-xs text-green-300">
                  <span className="font-semibold">Speed:</span> {transferSpeed}
                </p>
              </div>
            )}

            <button
              onClick={handleDisconnect}
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all"
            >
              Disconnect
            </button>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-2">Device Information:</p>
            <div className="space-y-1 text-xs text-gray-300">
              <p><span className="text-gray-500">Vendor ID:</span> {connectedDevice.vendorId?.toString(16).padStart(4, '0')}</p>
              <p><span className="text-gray-500">Product ID:</span> {connectedDevice.productId?.toString(16).padStart(4, '0')}</p>
              <p><span className="text-gray-500">Serial Number:</span> {connectedDevice.serialNumber || 'N/A'}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={handleRequestDevice}
            disabled={!isSupported || isConnecting}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Cable className="w-5 h-5" />
                Connect USB Device
              </>
            )}
          </button>

          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Previously Connected Devices */}
      {devices.length > 0 && !connectedDevice && (
        <div className="mt-6">
          <p className="text-sm text-gray-400 mb-2">Previously Connected Devices:</p>
          <div className="space-y-2">
            {devices.map((device, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Usb className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-white">{device.productName || 'Unknown Device'}</p>
                    <p className="text-xs text-gray-500">
                      {device.vendorId?.toString(16)}:{device.productId?.toString(16)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleForgetDevice(device)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Forget
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Use Cases */}
      <div className="mt-6 bg-gray-800 rounded-lg p-4">
        <p className="text-xs font-semibold text-gray-300 mb-2">Best Use Cases:</p>
        <div className="space-y-1 text-xs text-gray-400">
          <p>• 📱 PC to Android phone via USB cable</p>
          <p>• 💾 PC to USB storage devices</p>
          <p>• 🖥️ PC to PC via USB networking cable</p>
          <p>• 📷 Cameras and other USB devices</p>
          <p>• 🚀 When maximum speed is needed</p>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-4 bg-blue-900/10 border border-blue-800/50 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-300">
            <span className="font-semibold">Note:</span> USB connection requires physical cable. 
            The connected device must support USB communication. For phones, enable USB debugging or file transfer mode.
          </p>
        </div>
      </div>
    </div>
  );
};
