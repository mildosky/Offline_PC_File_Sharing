# 🔨 Building NetShare .exe - Step by Step Guide

## ✅ Prerequisites Fixed

The following issues have been resolved:
- ✅ Added `build:win` script to package.json
- ✅ Downgraded Electron to v28.3.3 (compatible with Node.js v20.15.0)
- ✅ Downgraded electron-builder to v24.13.3
- ✅ Removed missing icon file references
- ✅ Added version and author fields to package.json

---

## 🚀 Build Instructions (Windows)

### Step 1: Open PowerShell in Your Project Folder

```powershell
cd C:\Users\Admin\Downloads\Offline_PC_File_Sharing-offline-pc-file-sharing-a6fe9
```

### Step 2: Install Dependencies (if not already done)

```powershell
npm install
```

**Note:** You may see some warnings about deprecated packages - these are safe to ignore.

### Step 3: Build the Frontend

```powershell
npm run build
```

This creates the `dist/` folder with the compiled React app.

### Step 4: Build the Windows .exe

```powershell
npm run build:win
```

This will:
1. Build the frontend (if not already built)
2. Package everything with Electron
3. Create Windows executables in the `release/` folder

### Step 5: Find Your .exe Files

After the build completes, look in the `release/` folder:

```
release/
├── NetShare-1.0.0-Setup.exe          # Installer (recommended)
├── NetShare-1.0.0.exe                # Portable version
└── win-unpacked/                     # Unpacked version (for testing)
```

---

## 📦 What You Get

### 1. **NetShare-1.0.0-Setup.exe** (Installer)
- Full installer with Start Menu shortcut
- Desktop shortcut option
- Uninstaller included
- **Recommended for distribution**

### 2. **NetShare-1.0.0.exe** (Portable)
- No installation required
- Run directly from any folder
- Can run from USB drive
- **Great for testing or portable use**

### 3. **win-unpacked/** (Unpacked)
- Full application folder
- Useful for debugging
- Contains all application files

---

## 🎯 Alternative Build Commands

### Build Only Portable Version
```powershell
npm run build:win:portable
```

### Build Only Installer
```powershell
npm run build:win:installer
```

### Build for Mac (if on macOS)
```powershell
npm run build:mac
```

### Build for Linux (if on Linux)
```powershell
npm run build:linux
```

---

## 🐛 Troubleshooting

### Error: "Missing script: build:win"
**Solution:** Make sure you've updated package.json with the new scripts. Run:
```powershell
npm install
```

### Error: "Node.js version incompatible"
**Solution:** Your Node.js v20.15.0 is now compatible. If you still see errors, try:
```powershell
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
```

### Error: "Cannot find module 'electron'"
**Solution:** Electron wasn't installed properly. Run:
```powershell
npm install electron@28.3.3 --save-dev
```

### Build succeeds but .exe won't run
**Solution:** Check if Windows Defender is blocking it. Try:
1. Right-click the .exe → Properties
2. Check "Unblock" at the bottom
3. Click Apply

### Build takes too long
**Solution:** First build downloads Electron (~150MB). Subsequent builds are faster.

---

## 📊 Build Output Sizes

Expected output sizes:
- **Installer (.exe):** ~80-100 MB
- **Portable (.exe):** ~80-100 MB
- **Unpacked folder:** ~150-200 MB

These sizes include the Electron runtime (~70MB) plus your application.

---

## 🎓 Understanding the Build Process

### What happens during `npm run build:win`?

1. **Frontend Build** (`vite build`)
   - Compiles TypeScript → JavaScript
   - Bundles React components
   - Minifies CSS and JS
   - Creates `dist/` folder

2. **Electron Packaging** (`electron-builder`)
   - Downloads Electron runtime (if not cached)
   - Copies your app files
   - Creates Windows executable
   - Generates installer (NSIS)
   - Creates portable version

3. **Output**
   - `release/NetShare-1.0.0-Setup.exe` (installer)
   - `release/NetShare-1.0.0.exe` (portable)
   - `release/win-unpacked/` (unpacked)

---

## ✅ Verification Checklist

After building, verify:

- [ ] `release/` folder exists
- [ ] `NetShare-1.0.0-Setup.exe` exists
- [ ] `NetShare-1.0.0.exe` exists
- [ ] Both .exe files are ~80-100 MB
- [ ] You can run the portable .exe without errors
- [ ] The installer installs successfully
- [ ] The app launches and shows the UI
- [ ] Author credit "Musah Ibrahim" appears in title bar
- [ ] All 8 connection methods are accessible

---

## 🚀 Next Steps After Building

### 1. Test the Application
```powershell
# Run portable version
.\release\NetShare-1.0.0.exe
```

### 2. Test the Installer
```powershell
# Run installer
.\release\NetShare-1.0.0-Setup.exe
```

### 3. Distribute
- Share `NetShare-1.0.0-Setup.exe` with users
- Or share `NetShare-1.0.0.exe` for portable use

### 4. Code Signing (Optional)
For production distribution, consider code signing:
- Prevents Windows SmartScreen warnings
- Builds user trust
- Requires code signing certificate

---

## 📞 Support

If you encounter issues:

1. **Check the error message** - Most errors are self-explanatory
2. **Clear npm cache** - `npm cache clean --force`
3. **Reinstall dependencies** - Delete `node_modules` and run `npm install`
4. **Check Node.js version** - Should be v20.15.0 or higher
5. **Check disk space** - Build needs ~500MB free space

---

## 🎉 Success!

Once you've successfully built the .exe, you have a **complete, standalone Windows application** that:

✅ Works completely offline  
✅ Supports 8 different connection methods  
✅ Transfers files at up to 625 MB/s  
✅ Has native Windows integration  
✅ Credits Musah Ibrahim as the author  
✅ Is ready for distribution  

**Congratulations! You've built a professional desktop application!** 🚀

---

**Built with ❤️ by Musah Ibrahim**  
**© 2024 Musah Ibrahim. All rights reserved.**
