import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.musicimposter.app',
  appName: 'OneOff',
  webDir: 'out',
  
  // Android Performance Optimizations
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#0f172a',
    // Hardware acceleration
    useLegacyBridge: false,
  },
  
  // Server configuration for better performance
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  
  // Plugins configuration
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#0f172a',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      spinnerColor: '#a855f7',
      launchFadeOutDuration: 300,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
