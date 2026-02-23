type PushInitResult =
  | { supported: false; reason: string }
  | { supported: true; registered: boolean }

export async function initPushNotifications(): Promise<PushInitResult> {
  const cap = (window as any)?.Capacitor
  const push = cap?.Plugins?.PushNotifications

  if (!cap || !push) {
    return { supported: false, reason: 'PushNotifications plugin not available' }
  }

  try {
    const perm = await push.requestPermissions()
    const receive = perm?.receive
    if (receive !== 'granted') {
      return { supported: true, registered: false }
    }

    push.addListener?.('registration', (token: any) => {
      // TODO: send token to backend when server side is ready
      void token
    })

    push.addListener?.('registrationError', (err: any) => {
      void err
    })

    push.addListener?.('pushNotificationReceived', (notification: any) => {
      void notification
    })

    await push.register()
    return { supported: true, registered: true }
  } catch {
    return { supported: true, registered: false }
  }
}

