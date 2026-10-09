import { useState, useCallback, useRef, useEffect } from 'react';
import { generateId } from '../utils/fileUtils';

export interface BluetoothPeer {
  id: string;
  name: string;
  status: 'discovered' | 'connecting' | 'connected' | 'disconnected';
  lastSeen: Date;
  signalStrength?: 'strong' | 'medium' | 'weak';
}

// UUIDs for our custom file transfer service
// In a real app, you'd register your own UUID with Bluetooth SIG
const NETSHARE_SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';

export function useBluetooth() {
  const [peers, setPeers] = useState<BluetoothPeer[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSecureContext, setIsSecureContext] = useState(false);
  
  const connectedDevices = useRef<Map<string, BluetoothDevice>>(new Map());

  useEffect(() => {
    // Check if Web Bluetooth is supported
    const supported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;
    setIsSupported(supported);
    setIsSecureContext(window.isSecureContext);
  }, []);

  const scanForDevices = useCallback(async () => {
    if (!navigator.bluetooth) {
      setError('Bluetooth is not supported in this browser. Use Chrome or Edge on desktop, or Chrome on Android.');
      return;
    }

    if (!window.isSecureContext) {
      setError('Bluetooth requires HTTPS. Please serve this page over HTTPS or localhost.');
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      // Request Bluetooth device - this shows the browser's device picker
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [NETSHARE_SERVICE_UUID],
      });

      if (device) {
        const newPeer: BluetoothPeer = {
          id: device.id,
          name: device.name || 'Unknown Device',
          status: 'discovered',
          lastSeen: new Date(),
        };

        setPeers(prev => {
          const exists = prev.find(d => d.id === device.id);
          if (exists) {
            return prev.map(d => d.id === device.id ? { ...d, lastSeen: new Date() } : d);
          }
          return [...prev, newPeer];
        });
      }
    } catch (err: any) {
      if (err.name === 'NotFoundError' || err.name === 'AbortError') {
        // User cancelled the dialog - not an error
        setError(null);
      } else if (err.name === 'SecurityError') {
        setError('Bluetooth requires a secure context (HTTPS).');
      } else {
        setError(`Bluetooth scan failed: ${err.message}`);
      }
    } finally {
      setIsScanning(false);
    }
  }, []);

  const connectToDevice = useCallback(async (peerId: string) => {
    const peer = peers.find(p => p.id === peerId);
    if (!peer) return;

    // We need to re-request the device since we can't store BluetoothDevice objects
    // In a real app, you'd maintain a device cache
    setError(null);

    setPeers(prev => prev.map(p => 
      p.id === peerId ? { ...p, status: 'connecting' } : p
    ));

    try {
      if (!navigator.bluetooth) {
        throw new Error('Bluetooth not available');
      }
      // Re-request the device to get a fresh reference
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [NETSHARE_SERVICE_UUID],
      });

      if (!device.gatt) {
        throw new Error('GATT not supported by this device');
      }

      // Connect to GATT server
      const server = await device.gatt.connect();
      
      // Try to discover our NetShare service
      let isNetShareDevice = false;
      try {
        const service = await server.getPrimaryService(NETSHARE_SERVICE_UUID);
        isNetShareDevice = true;
      } catch {
        // Not a NetShare device - that's okay for demo
        isNetShareDevice = false;
      }

      connectedDevices.current.set(peerId, device);

      setPeers(prev => prev.map(p => 
        p.id === peerId ? { ...p, status: 'connected' } : p
      ));

      // Listen for disconnection
      device.addEventListener('gattserverdisconnected', () => {
        setPeers(prev => prev.map(p => 
          p.id === peerId ? { ...p, status: 'disconnected' } : p
        ));
        connectedDevices.current.delete(peerId);
      });

    } catch (err: any) {
      setError(`Connection failed: ${err.message}`);
      setPeers(prev => prev.map(p => 
        p.id === peerId ? { ...p, status: 'discovered' } : p
      ));
    }
  }, [peers]);

  const disconnectDevice = useCallback((peerId: string) => {
    const device = connectedDevices.current.get(peerId);
    if (device?.gatt?.connected) {
      device.gatt.disconnect();
    }
    connectedDevices.current.delete(peerId);
    setPeers(prev => prev.map(p => 
      p.id === peerId ? { ...p, status: 'discovered' } : p
    ));
  }, []);

  const removePeer = useCallback((peerId: string) => {
    disconnectDevice(peerId);
    setPeers(prev => prev.filter(p => p.id !== peerId));
  }, [disconnectDevice]);

  return {
    peers,
    isScanning,
    isSupported,
    isSecureContext,
    error,
    scanForDevices,
    connectToDevice,
    disconnectDevice,
    removePeer,
    setError,
  };
}
