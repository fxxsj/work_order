import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.workorder.app',
  appName: 'WorkOrder',
  webDir: 'www',
  bundledWebRuntime: false
}

// Optional dev mode:
// - CAP_SERVER_URL=http://10.0.2.2:5173  (Android emulator -> host)
// - CAP_SERVER_URL=http://192.168.1.10:5173 (real device -> LAN host)
const devServerUrl = process.env.CAP_SERVER_URL
if (devServerUrl) {
  config.server = {
    url: devServerUrl,
    cleartext: devServerUrl.startsWith('http://')
  }
}

export default config
