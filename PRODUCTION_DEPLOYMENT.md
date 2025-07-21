# 🚀 Production Deployment Guide

## 📱 Building APK for Real Devices

### 1. **Server Configuration**
- ✅ Production server: `https://akdm-tasks.onrender.com`
- ✅ API endpoints: `https://akdm-tasks.onrender.com/api/*`
- ✅ HTTPS enabled for secure connections

### 2. **Build Production APK**

#### Option A: Using Build Script
```bash
# Make script executable
chmod +x build-production.sh

# Run build script
./build-production.sh
```

#### Option B: Manual Build
```bash
# Clean previous builds
cd android && ./gradlew clean && cd ..

# Build production APK
cd android && ./gradlew assembleRelease && cd ..
```

### 3. **APK Location**
```
android/app/build/outputs/apk/release/app-release.apk
```

## 🔧 Configuration Changes Made

### 1. **API Configuration** (`src/services/api.ts`)
- ✅ Development: Uses local server (`http://10.0.2.2:5000`)
- ✅ Production: Uses deployed server (`https://akdm-tasks.onrender.com`)
- ✅ Increased timeout to 30 seconds for production
- ✅ Better error handling and logging

### 2. **Android Configuration** (`android/app/src/main/AndroidManifest.xml`)
- ✅ Added network permissions
- ✅ Added network security configuration
- ✅ Enabled cleartext traffic for development

### 3. **Network Security** (`android/app/src/main/res/xml/network_security_config.xml`)
- ✅ Allows HTTPS connections to `akdm-tasks.onrender.com`
- ✅ Secure by default for other domains

## 📋 Testing Checklist

### Before Installing on Device:
- [ ] Server is running at `https://akdm-tasks.onrender.com`
- [ ] Server responds to health check: `https://akdm-tasks.onrender.com/api/health`
- [ ] APK builds successfully without errors

### After Installing on Device:
- [ ] App opens without crashing
- [ ] Login screen appears
- [ ] Can connect to server and login
- [ ] All features work (users, tasks, departments, etc.)

## 🐛 Troubleshooting

### App Won't Open:
1. Check if APK is properly signed
2. Verify device has internet connection
3. Check Android logs for crash details

### Can't Connect to Server:
1. Verify server is running: `https://akdm-tasks.onrender.com`
2. Check device internet connection
3. Test server health: `https://akdm-tasks.onrender.com/api/health`

### Login Issues:
1. Verify server authentication endpoints work
2. Check if user credentials are correct
3. Verify server database is accessible

## 🔄 Development vs Production

| Environment | Server URL | Purpose |
|-------------|------------|---------|
| Development | `http://10.0.2.2:5000` | Local development on emulator |
| Production | `https://akdm-tasks.onrender.com` | Real devices and production use |

## 📞 Support

If you encounter issues:
1. Check console logs for error details
2. Verify server status at `https://akdm-tasks.onrender.com`
3. Test API endpoints directly in browser
4. Check device network connectivity 