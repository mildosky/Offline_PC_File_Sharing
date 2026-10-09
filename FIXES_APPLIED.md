# Fixes applied

## Run it
    npm install
    npm start          # builds, then launches the desktop app
(Allow NetShare through Windows Firewall on *Private* networks when prompted - phones need it.)
Browser mode: `npm run dev` also works (phone pairing API is built into Vite).

## Root causes
1. **Mobile QR page error** - nothing served the page the QR pointed to (app loaded from file://, URL used a guessed port 3000).
   Now Electron runs an embedded HTTP server (electron/server.cjs) that serves the app on the LAN and a pairing API.
   The QR holds a short URL; the phone fetches the PC's offer, posts its answer, and the PC connects automatically
   (no second QR scan). The old giant base64 offer in the URL also risked overflowing the QR.
2. **Bluetooth** - Electron has no device chooser, so requestDevice() always failed. Added `select-bluetooth-device`
   handling + an in-app picker, Bluetooth permission, Linux flags.
3. **File transfers** - unreliable data channel (maxRetransmits) could corrupt files; 256KB chunks exceeded the
   WebRTC message limit; phone "Send/Receive" buttons were stubs; the Electron "browse" button did nothing.
4. Service worker cached stale builds / failed to install; hooks-order bug in App; invisible 1px tray icon; fake
   WiFi-Direct demo peers; hardcoded IP text in QR panel.

## Still placeholders (need native code)
WiFi Direct and NFC panels, and Bluetooth file transfer (Web Bluetooth can only be a GATT client, so it can
discover/connect to devices but cannot receive files from another PC).
