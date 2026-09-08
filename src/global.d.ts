import type { SoundDebugApi } from './lib/sound'

declare global {
  interface Window {
    __pdfFixerReady?: boolean
    __pdfFixerSound?: SoundDebugApi
  }
}
export {}
