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
    // Check if Web Bluetooth is supported
    if (!navigator.bluetooth) {
      setError('❌ Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.');
      return;
    }

    // Check if we're in a secure context
    if (!window.isSecureContext) {
      setError('❌ Bluetooth requires a secure context. Please run the app via "npm run dev" (localhost) or use HTTPS.');
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      // Request Bluetooth device - this shows the browser's native device picker
      // The user must select a device from the dialog
      console.log('Opening Bluetooth device picker...');
      
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [NETSHARE_SERVICE_UUID],
      });

      if (device) {
        console.log('Device selected:', device.name);
        
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

        // Store the device reference for later connection
        connectedDevices.current.set(device.id, device);
      }
    } catch (err: any) {
      console.error('Bluetooth scan error:', err);
      
      if (err.name === 'NotFoundError' || err.name === 'AbortError') {
        // User cancelled the dialog - not an error
        setError(null);
      } else if (err.name === 'SecurityError') {
        setError('❌ Bluetooth requires a secure context (HTTPS or localhost). Please run via "npm run dev".');
      } else if (err.name === 'NotSupportedError') {
        setError('❌ Bluetooth operation not supported. Make sure Bluetooth is enabled on your device.');
      } else if (err.name === 'InvalidStateError') {
        setError('❌ Bluetooth adapter is not available. Please check your Bluetooth settings.');
      } else {
        setError(`❌ Bluetooth scan failed: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsScanning(false);
    }
  }, []);

  const connectToDevice = useCallback(async (peerId: string) => {
    const peer = peers.find(p => p.id === peerId);
    if (!peer) return;

    setError(null);

    setPeers(prev => prev.map(p => 
      p.id === peerId ? { ...p, status: 'connecting' } : p
    ));

    try {
      // Get the stored device reference
      let device = connectedDevices.current.get(peerId);
      
      // If we don't have a reference, request it again
      if (!device) {
        if (!navigator.bluetooth) {
          throw new Error('Bluetooth not available');
        }
        
        device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: [NETSHARE_SERVICE_UUID],
        });
        
        connectedDevices.current.set(peerId, device);
      }

      if (!device.gatt) {
        throw new Error('GATT not supported by this device');
      }

      // Connect to GATT server
      console.log('Connecting to GATT server...');
      const server = await device.gatt.connect();
      console.log('GATT server connected');
      
      // Try to discover our NetShare service
      let isNetShareDevice = false;
      try {
        const service = await server.getPrimaryService(NETSHARE_SERVICE_UUID);
        isNetShareDevice = true;
        console.log('NetShare service found');
      } catch {
        // Not a NetShare device - that's okay for demo
        console.log('NetShare service not found (this is normal for generic devices)');
        isNetShareDevice = false;
      }

      setPeers(prev => prev.map(p => 
        p.id === peerId ? { ...p, status: 'connected' } : p
      ));

      // Listen for disconnection
      device.addEventListener('gattserverdisconnected', () => {
        console.log('Device disconnected');
        setPeers(prev => prev.map(p => 
          p.id === peerId ? { ...p, status: 'disconnected' } : p
        ));
        connectedDevices.current.delete(peerId);
      });

    } catch (err: any) {
      console.error('Connection error:', err);
      setError(`❌ Connection failed: ${err.message}`);
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
