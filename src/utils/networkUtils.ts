/**
 * Detect the local LAN IP address
 * Uses WebRTC to find the local IP without requiring a server
 */
export async function getLocalIP(): Promise<string> {
  return new Promise((resolve) => {
    // Try Electron API first if available
    if (window.electronAPI?.getLocalIP) {
      window.electronAPI.getLocalIP().then((ips: string[]) => {
        if (ips && ips.length > 0) {
          // Filter out virtual/VPN adapters
          const realIP = filterRealIP(ips);
          resolve(realIP);
        } else {
          resolve(getLocalIPViaWebRTC());
        }
      }).catch(() => {
        resolve(getLocalIPViaWebRTC());
      });
      return;
    }

    // Fallback to WebRTC method
    resolve(getLocalIPViaWebRTC());
  });
}

/**
 * Filter out virtual/VPN adapter IPs and return the real LAN IP
 */
function filterRealIP(ips: string[]): string {
  // Virtual/VPN adapters to exclude (check these FIRST)
  const virtualPatterns = [
    /^192\.168\.56\./,      // VirtualBox Host-Only
    /^192\.168\.99\./,      // Docker Machine
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // Docker/VPN ranges
    /^169\.254\./,          // Link-local
    /^127\./,               // Loopback
    /^0\./,                 // Invalid
  ];
  
  // Filter out virtual IPs first
  const realIPs = ips.filter(ip => !virtualPatterns.some(pattern => pattern.test(ip)));
  
  if (realIPs.length === 0) {
    return ips[0] || 'localhost';
  }
  
  // Priority order for real network adapters
  const priority = [
    // Typical home/office WiFi ranges
    /^192\.168\.(1|0)\./,  // 192.168.0.x and 192.168.1.x (most common)
    /^192\.168\./,          // Other 192.168.x.x ranges (like 192.168.100.x)
    /^10\.0\.0\./,          // 10.0.0.x (common home network)
    /^10\./,                // Other 10.x.x.x ranges
  ];
  
  // Try to find a priority IP from the filtered list
  for (const pattern of priority) {
    const match = realIPs.find(ip => pattern.test(ip));
    if (match) {
      return match;
    }
  }
  
  // If no priority match, return first real IP
  return realIPs[0];
}

/**
 * Detect local IP using WebRTC
 * This works in browsers without requiring a server
 */
function getLocalIPViaWebRTC(): Promise<string> {
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      const candidates: string[] = [];
      let ipFound = false;

      pc.createDataChannel('');
      
      pc.onicecandidate = (event) => {
        if (!event.candidate) {
          // ICE gathering complete, pick the best IP
          pc.close();
          
          if (candidates.length === 0) {
            resolve('localhost');
            return;
          }

          // Filter and prioritize candidates
          const realIP = filterRealIP(candidates);
          if (!ipFound) {
            ipFound = true;
            resolve(realIP);
          }
          return;
        }

        const candidate = event.candidate.candidate;
        
        // Extract IP from candidate string
        // Format: candidate:foundation component protocol priority address port type ...
        const ipMatch = candidate.match(/(\d{1,3}\.){3}\d{1,3}/);
        
        if (ipMatch) {
          const ip = ipMatch[0];
          
          // Filter out common non-routable IPs
          if (!ip.startsWith('0.') && 
              !ip.startsWith('127.') && 
              !ip.startsWith('169.254.') &&
              ip !== '0.0.0.0') {
            candidates.push(ip);
          }
        }
      };

      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .catch(() => {
          resolve('localhost');
        });

      // Timeout after 2 seconds
      setTimeout(() => {
        if (!ipFound) {
          pc.close();
          if (candidates.length > 0) {
            resolve(filterRealIP(candidates));
          } else {
            resolve('localhost');
          }
        }
      }, 2000);
    } catch (err) {
      resolve('localhost');
    }
  });
}

/**
 * Get the full URL for mobile connection
 * @param offerCode - The WebRTC offer code
 * @param manualIP - Optional manual IP override (if auto-detection fails)
 */
export async function getMobileConnectionURL(offerCode: string, manualIP?: string): Promise<string> {
  const ip = manualIP || await getLocalIP();
  
  // Get server port from Electron if available, otherwise use window.location.port or default to 3000
  let port = '3000';
  if (window.electronAPI?.getServerPort) {
    try {
      port = (await window.electronAPI.getServerPort()).toString();
    } catch (e) {
      port = window.location.port || '3000';
    }
  } else {
    port = window.location.port || '3000';
  }
  
  const encodedOffer = encodeURIComponent(offerCode);
  
  // Use hash-based routing for compatibility with file:// protocol
  return `http://${ip}:${port}/#/mobile?offer=${encodedOffer}`;
}
