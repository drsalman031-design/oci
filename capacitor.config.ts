import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dr.salman.oci',
  appName: 'Orthodontic Compensation Index (OCI)',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
