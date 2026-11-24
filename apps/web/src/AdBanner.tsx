import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob'
const ID = import.meta.env.VITE_ADMOB_BANNER as string | undefined
let ready = false
// Android only, free users only. Uses Google's TEST banner until you set VITE_ADMOB_BANNER (your real AdMob unit).
export default function AdBanner({ show }: { show: boolean }) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    ;(async () => {
      try {
        if (!ready) { await AdMob.initialize(); ready = true }
        if (show) await AdMob.showBanner({ adId: ID || 'ca-app-pub-3940256099942544/6300978111', adSize: BannerAdSize.ADAPTIVE_BANNER, position: BannerAdPosition.BOTTOM_CENTER, margin: 64, isTesting: !ID })
        else await AdMob.removeBanner()
      } catch { /* ads are optional */ }
    })()
  }, [show])
  return null
}
