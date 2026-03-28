import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.particle.universalwallet',
  appName: 'OMNI UA',
  webDir: 'www',
  server: {
    url: 'https://orimolty-lang.github.io/universal-wallet-web/',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
