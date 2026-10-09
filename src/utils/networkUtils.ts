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
          resolve(ips[0]);
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
 * Detect local IP using WebRTC
 * This works in browsers without requiring a server
 */
function getLocalIPViaWebRTC(): Promise<string> {
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      let ipFound = false;

      pc.createDataChannel('');
      
      pc.onicecandidate = (event) => {
        if (!event.candidate) {
          pc.close();
          if (!ipFound) {
            resolve('localhost');
          }
          return;
        }

        const candidate = event.candidate.candidate;
        
        // Extract IP from candidate string
        // Format: candidate:foundation component protocol priority address port type ...
        const ipMatch = candidate.match(/(\d{1,3}\.){3}\d{1,3}/);
        
        if (ipMatch && !ipFound) {
          const ip = ipMatch[0];
          
          // Filter out common non-routable IPs
          if (!ip.startsWith('0.') && 
              !ip.startsWith('127.') && 
              !ip.startsWith('169.254.') &&
              ip !== '0.0.0.0') {
            ipFound = true;
            pc.close();
            resolve(ip);
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
          resolve('localhost');
        }
      }, 2000);
    } catch (err) {
      resolve('localhost');
    }
  });
}

/**
 * Get the full URL for mobile connection
 */
export async function getMobileConnectionURL(offerCode: string): Promise<string> {
  const ip = await getLocalIP();
  const port = window.location.port || '3000';
  const encodedOffer = encodeURIComponent(offerCode);
  
  return `http://${ip}:${port}/mobile#offer=${encodedOffer}`;
}
