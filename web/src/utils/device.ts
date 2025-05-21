// utils/device.ts
import FingerprintJS from '@fingerprintjs/fingerprintjs'
import { UAParser } from 'ua-parser-js'

export async function getCurrentDeviceInfo() {
    const fp = await FingerprintJS.load()
    const result = await fp.get()
    const visitorId = result.visitorId  // 唯一ID

    const ua = new UAParser()
    const parsed = ua.getResult()

    return {
        fingerprint: visitorId,
        os: parsed.os.name + ' ' + parsed.os.version,
        device: parsed.device.type || 'desktop', // 'mobile' / 'tablet' / 'desktop'
        ua: navigator.userAgent,
    }
}
