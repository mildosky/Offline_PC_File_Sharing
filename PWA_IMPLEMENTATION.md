# NetShare PWA Implementation Guide

## Overview

NetShare has been converted into a Progressive Web App (PWA) for mobile devices. This allows users to:

- ✅ Install the app on their phone's home screen
- ✅ Use it offline after first load
- ✅ Scan QR codes directly from the phone camera
- ✅ Connect to PCs without needing a separate mobile app
- ✅ Works on both iOS and Android

## What Changed

### 1. QR Code Format Changed

**Before:**
```
netshare://connect?offer=ENCODED_OFFER
```
- ❌ Required NetShare desktop app installed on phone
- ❌ Redirected to search page on phones
- ❌ Didn't work without custom protocol handler

**After:**
```
http://192.168.1.100:3000/mobile#offer=ENCODED_OFFER
```
- ✅ Opens in phone's browser
- ✅ Can be installed as PWA
- ✅ Works on any device with a browser
- ✅ No app installation required

### 2. PWA Features Added

#### Manifest File (`public/manifest.json`)
- App name and description
- Theme colors
- Icon definitions
- Standalone display mode
- Portrait orientation

#### Service Worker (`public/sw.js`)
- Caches essential files for offline use
- Intercepts fetch requests
- Provides offline fallback

#### Icons
- SVG icon created (`public/icon.svg`)
- Referenced in manifest for different sizes

#### HTML Updates (`index.html`)
- PWA meta tags added
- Service worker registration
- Apple mobile web app support
- Theme color configuration

#### Routing (`src/main.tsx`)
- Added React Router
- `/mobile` route for mobile interface
- Proper URL handling

## How to Use

### For PC Users

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **Go to "Mobile Connect" tab**

3. **Click "Generate QR Code"**
   - QR code will contain: `http://YOUR_IP:3000/mobile#offer=...`

4. **Show QR code to phone**

### For Phone Users

1. **Scan the QR code with phone camera**
   - iOS: Use Camera app
   - Android: Use Camera app or Google Lens

2. **Tap the notification to open the link**
   - Opens mobile interface in browser

3. **Click "Connect to PC"**
   - Phone processes the offer
   - Generates answer QR code

4. **Show answer QR code to PC**
   - PC scans it with camera
   - Connection established!

### Install as PWA (Optional)

**On iPhone:**
1. Open the link in Safari
2. Tap the Share button (square with arrow)
3. Tap "Add to Home Screen"
4. Tap "Add"

**On Android:**
1. Open the link in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home screen"
4. Tap "Add"

Now you have a NetShare app icon on your home screen!

## Network Requirements

### Important: Both devices must be on the same network

The QR code contains your PC's local IP address (e.g., `192.168.1.100`). For the phone to access it:

- ✅ Both PC and phone must be on the same WiFi network
- ✅ PC's IP must be accessible from the phone
- ✅ No firewall blocking port 3000

### Finding Your PC's IP Address

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" under your WiFi adapter (e.g., 192.168.1.100)

**macOS/Linux:**
```bash
ifconfig
# or
ip addr
```

### Testing Connectivity

From your phone's browser, try accessing:
```
http://YOUR_PC_IP:3000
```

If this loads the NetShare interface, you're good to go!

## Troubleshooting

### QR Code Opens Search Instead of App

**Problem:** Phone opens Google/search instead of the mobile interface

**Solutions:**
1. Make sure you're using the updated version with HTTP URLs
2. Check that the QR code starts with `http://` not `netshare://`
3. Try scanning with a different camera app
4. Manually type the URL shown under the QR code

### Phone Can't Connect to PC

**Problem:** "Can't connect to server" or timeout

**Solutions:**
1. Verify both devices are on the same WiFi network
2. Check PC's IP address hasn't changed
3. Disable firewall temporarily to test
4. Try accessing `http://PC_IP:3000` directly from phone browser
5. Make sure the dev server is running (`npm run dev`)

### Camera Not Working on Phone

**Problem:** "Camera access denied" or camera doesn't open

**Solutions:**
1. Grant camera permission when prompted
2. Check browser settings for camera permissions
3. Try a different browser (Chrome recommended)
4. On iOS, check Settings > Safari > Camera
5. On Android, check Settings > Apps > Chrome > Permissions

### PWA Won't Install

**Problem:** "Add to Home Screen" option not appearing

**Solutions:**
1. Make sure you're using HTTPS or localhost (PWA requirement)
2. For development, use `http://localhost:3000`
3. Clear browser cache and reload
4. Try a different browser

## Production Deployment

For production use (not just development), you need:

### 1. Build the app
```bash
npm run build
```

### 2. Serve with HTTPS
PWAs require HTTPS in production. Options:

**Option A: Use a static file server with HTTPS**
```bash
# Install serve
npm install -g serve

# Serve with HTTPS (requires certificate)
serve -s dist --ssl-cert cert.pem --ssl-key key.pem
```

**Option B: Use Electron for desktop (already configured)**
```bash
npm run build:win
```

**Option C: Deploy to a hosting service**
- Vercel
- Netlify
- GitHub Pages
- Any static hosting with HTTPS

### 3. Generate PNG Icons

The current setup uses SVG icons. For better compatibility, generate PNG versions:

```bash
# Install sharp
npm install sharp

# Create a script to convert SVG to PNG
```

Or use an online tool to convert `public/icon.svg` to:
- `public/icon-192.png` (192x192)
- `public/icon-512.png` (512x512)

## Technical Details

### URL Structure

**Desktop QR Code:**
```
http://192.168.1.100:3000/mobile#offer=ENCODED_OFFER
```

**Components:**
- `http://192.168.1.100:3000` - PC's local address and port
- `/mobile` - Mobile interface route
- `#offer=ENCODED_OFFER` - Hash parameter with WebRTC offer

### WebRTC Connection Flow

1. **PC generates offer:**
   - Creates WebRTC offer
   - Encodes as base64
   - Embeds in URL hash

2. **Phone receives offer:**
   - Opens URL in browser
   - Extracts offer from hash
   - Creates WebRTC answer

3. **Phone generates answer QR:**
   - Encodes answer as base64
   - Displays as QR code

4. **PC scans answer:**
   - Uses camera to scan QR
   - Extracts answer
   - Completes WebRTC handshake

5. **P2P connection established:**
   - Direct connection between devices
   - No internet required
   - Files transfer at LAN speed

### Service Worker Caching

The service worker caches:
- `/` - Root path
- `/mobile` - Mobile interface
- `/index.html` - Main HTML
- `/manifest.json` - PWA manifest

This allows the app to work offline after first load.

## Security Considerations

### Local Network Only

The current implementation uses HTTP on the local network. This is acceptable because:

- ✅ Traffic stays on your local network
- ✅ No data goes to the internet
- ✅ WebRTC connection is encrypted
- ✅ Only devices on your WiFi can access it

### For Public/Internet Use

If you want to deploy publicly:

1. **Use HTTPS** (required for PWA)
2. **Add authentication** to prevent unauthorized access
3. **Use a signaling server** for WebRTC (not local network)
4. **Implement rate limiting** to prevent abuse

## Future Improvements

### Planned Features

1. **Native Mobile Apps**
   - React Native or Flutter
   - Better camera integration
   - Background file transfers
   - Push notifications

2. **Bluetooth Fallback**
   - Use Web Bluetooth API
   - For devices without WiFi
   - Slower but works anywhere

3. **NFC Quick Connect**
   - Tap phones together
   - Instant connection
   - No QR code needed

4. **File Preview**
   - Preview images before downloading
   - Stream videos
   - Open documents in app

5. **Transfer History**
   - Remember past transfers
   - Quick reconnect to devices
   - Transfer statistics

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the main README.md
3. Check browser console for errors (F12 > Console)
4. Verify network connectivity

## Summary

NetShare is now a fully functional PWA that:

- ✅ Works on any phone with a browser
- ✅ Can be installed as a native app
- ✅ Uses QR codes for easy connection
- ✅ Transfers files at LAN speed
- ✅ Works completely offline
- ✅ No app store installation needed
- ✅ Cross-platform (iOS, Android, desktop)

**Author:** Musah Ibrahim  
**Copyright:** © 2024 Musah Ibrahim. All rights reserved.
