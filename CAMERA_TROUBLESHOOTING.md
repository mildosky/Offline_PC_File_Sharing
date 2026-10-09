# 📷 Camera Access Troubleshooting Guide

## Issue: "Camera error: Unknown error"

If you're seeing a generic "Unknown error" when trying to scan QR codes, follow this guide to diagnose and fix the issue.

---

## 🔍 Step 1: Check Windows Camera Permissions

### Windows 10/11

1. **Open Windows Settings**
   - Press `Win + I`

2. **Navigate to Privacy Settings**
   - Click on **Privacy & security** (Windows 11) or **Privacy** (Windows 10)
   - Click on **Camera**

3. **Enable Camera Access**
   - Make sure **Camera access** is turned **ON**
   - Make sure **Let apps access your camera** is turned **ON**
   - Scroll down and make sure **Let desktop apps access your camera** is turned **ON**

4. **Restart the App**
   - Close NetShare completely
   - Reopen the app

---

## 🔍 Step 2: Check if Camera Works in Other Apps

Test your camera in other applications:

- **Windows Camera app** (search "Camera" in Start menu)
- **Zoom** or **Microsoft Teams**
- **Skype**
- **Any other video app**

**If camera works in other apps but not in NetShare:**
- The issue is with Electron/NetShare permissions
- Continue to Step 3

**If camera doesn't work in any app:**
- The issue is with Windows or the camera hardware
- Check device manager (Step 4)

---

## 🔍 Step 3: Check Electron Console Logs

### Enable Developer Tools

1. **Open the app**
2. **Press `Ctrl + Shift + I`** (or `Cmd + Option + I` on Mac)
3. **Click on the "Console" tab**
4. **Try to scan a QR code**
5. **Look for error messages**

### Expected Log Output

You should see logs like:
```
[Permission] Request: camera from: file://...
[Permission] Granting: camera
Camera error with rear camera: [Error details]
Trying front camera...
Camera error with front camera: [Error details]
Trying default camera...
All camera attempts failed: {...}
```

### Common Error Patterns

#### Pattern 1: Permission Denied
```
NotAllowedError: Permission denied
```
**Solution:** Windows camera permissions are disabled (see Step 1)

#### Pattern 2: Device Not Found
```
NotFoundError: Requested device not found
```
**Solution:** No camera detected. Check Device Manager (Step 4)

#### Pattern 3: Device In Use
```
NotReadableError: Could not start video source
```
**Solution:** Another app is using the camera. Close other apps.

#### Pattern 4: Security Error
```
SecurityError: Invalid security origin
```
**Solution:** Electron permission handler issue. Check main.cjs logs.

---

## 🔍 Step 4: Check Device Manager

1. **Open Device Manager**
   - Press `Win + X`
   - Click **Device Manager**

2. **Find Cameras**
   - Expand **Cameras** or **Imaging devices**
   - You should see your webcam listed

3. **Check Status**
   - ✅ No yellow warning icon = Device is working
   - ⚠️ Yellow warning icon = Driver issue
   - ❌ Red X = Device disabled

4. **If Device is Disabled**
   - Right-click the camera
   - Click **Enable device**

5. **If Device has Warning**
   - Right-click the camera
   - Click **Update driver**
   - Choose **Search automatically for drivers**

6. **If Device is Missing**
   - Click **Action** > **Scan for hardware changes**
   - Or restart your computer

---

## 🔍 Step 5: Test Camera in Browser

Since NetShare uses web technologies, test if the camera works in a browser:

1. **Open Chrome or Edge**
2. **Go to:** https://webcamtests.com/
3. **Allow camera access** when prompted
4. **Check if camera works**

**If camera works in browser but not in NetShare:**
- The issue is specific to Electron
- Check the Electron console logs (Step 3)

**If camera doesn't work in browser either:**
- The issue is with Windows or the camera hardware
- Check Device Manager (Step 4)

---

## 🔍 Step 6: Check Electron Main Process Logs

### View Electron Logs

1. **Open the app from command line:**
   ```bash
   .\release\NetShare-1.0.0.exe
   ```

2. **Look for permission logs:**
   ```
   [Permission] Request: camera from: ...
   [Permission] Granting: camera
   ```

3. **If you don't see permission logs:**
   - The permission handler might not be set up correctly
   - Check `electron/main.cjs`

---

## 🔧 Solutions by Error Type

### Error: "NotAllowedError" or "Permission denied"

**Cause:** Windows camera permissions are disabled

**Solution:**
1. Open Windows Settings > Privacy > Camera
2. Enable "Camera access"
3. Enable "Let desktop apps access your camera"
4. Restart the app

---

### Error: "NotFoundError" or "No camera found"

**Cause:** No camera detected by the system

**Solution:**
1. Check Device Manager for camera device
2. Enable the device if disabled
3. Update camera drivers
4. Restart computer
5. Connect external USB camera if built-in camera is broken

---

### Error: "NotReadableError" or "Camera in use"

**Cause:** Another application is using the camera

**Solution:**
1. Close all apps that might use the camera:
   - Zoom
   - Microsoft Teams
   - Skype
   - Windows Camera app
   - Any video conferencing apps
2. Restart NetShare
3. Try again

---

### Error: "SecurityError" or "Invalid security origin"

**Cause:** Electron permission handler issue

**Solution:**
1. Check `electron/main.cjs` for permission handler setup
2. Make sure `setPermissionRequestHandler` is called after window creation
3. Check console logs for permission requests
4. Restart the app

---

### Error: "Unknown error" (Generic)

**Cause:** Unclear - need more information

**Solution:**
1. Check Electron console logs (Ctrl + Shift + I)
2. Check Windows camera permissions
3. Test camera in other apps
4. Check Device Manager
5. Restart computer
6. If still failing, report the full error details

---

## 🛠️ Advanced Troubleshooting

### Test with Different Camera Configurations

The app now tries multiple camera configurations:
1. Rear camera (facingMode: 'environment')
2. Front camera (facingMode: 'user')
3. Default camera (no facing mode specified)

If all three fail, check the console logs for specific error details.

### Check Windows Camera Service

1. **Open Services**
   - Press `Win + R`
   - Type `services.msc`
   - Press Enter

2. **Find Camera Service**
   - Look for "Windows Camera Frame Server"
   - Make sure it's **Running**
   - If not, right-click > **Start**

3. **Restart the Service**
   - Right-click > **Restart**

### Reset Camera Permissions

1. **Open PowerShell as Administrator**
   - Right-click Start button
   - Click **Windows PowerShell (Admin)**

2. **Reset camera permissions:**
   ```powershell
   Get-AppxPackage *camera* | Remove-AppxPackage
   ```

3. **Reinstall Camera app:**
   ```powershell
   Get-AppxPackage *camera* | Foreach {Add-AppxPackage -DisableDevelopmentMode -Register "$($_.InstallLocation)\AppXManifest.xml"}
   ```

4. **Restart computer**

---

## 📋 Checklist

Before reporting the issue, verify:

- [ ] Windows camera permissions are enabled
- [ ] Camera works in other apps (Zoom, Teams, etc.)
- [ ] Camera works in browser (https://webcamtests.com/)
- [ ] Camera is enabled in Device Manager
- [ ] No yellow warning icons in Device Manager
- [ ] No other apps are using the camera
- [ ] App has been restarted after changing permissions
- [ ] Computer has been restarted at least once
- [ ] Checked Electron console logs (Ctrl + Shift + I)
- [ ] Checked Windows Camera Frame Server service is running

---

## 📞 Still Not Working?

If you've tried all the steps above and the camera still doesn't work:

### Collect This Information

1. **Windows version:**
   - Press `Win + R`
   - Type `winver`
   - Press Enter
   - Note the version number

2. **Camera model:**
   - Open Device Manager
   - Expand Cameras
   - Note the camera name

3. **Error details:**
   - Open Electron console (Ctrl + Shift + I)
   - Try to scan QR code
   - Copy the full error message from Console tab

4. **Permission logs:**
   - Check the terminal/command prompt where you launched the app
   - Look for `[Permission]` logs

### Report the Issue

Provide:
- Windows version
- Camera model
- Full error message from console
- Permission logs from terminal
- Steps you've already tried

---

## 🎯 Quick Fix Checklist

**Most common solution:**

1. ✅ Open Windows Settings > Privacy > Camera
2. ✅ Enable "Camera access"
3. ✅ Enable "Let desktop apps access your camera"
4. ✅ Restart NetShare app
5. ✅ Try scanning QR code again

**If that doesn't work:**

6. ✅ Restart computer
7. ✅ Try again

**If still not working:**

8. ✅ Check Device Manager
9. ✅ Test camera in other apps
10. ✅ Check Electron console logs

---

## 📝 Notes

- The app automatically tries 3 different camera configurations
- Permission handler logs all requests to help diagnose issues
- Error messages are now more specific and actionable
- Camera access is auto-granted in Electron (no permission dialog)

---

**Author:** Musah Ibrahim  
**Date:** 2026-01-09  
**Version:** 1.0.0
