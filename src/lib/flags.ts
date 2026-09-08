import type { Lang } from '../i18n'

const GREECE_FLAG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 27 18">
<rect width="27" height="18" fill="#fff"/>
<g fill="#0d5eaf">
<rect width="27" height="2" y="0"/>
<rect width="27" height="2" y="4"/>
<rect width="27" height="2" y="8"/>
<rect width="27" height="2" y="12"/>
<rect width="27" height="2" y="16"/>
</g>
<rect width="10" height="10" fill="#0d5eaf"/>
<rect width="2" height="10" x="4" fill="#fff"/>
<rect width="10" height="2" y="4" fill="#fff"/>
</svg>`

const UK_FLAG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30">
<clipPath id="t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath>
<rect width="60" height="30" fill="#012169"/>
<path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/>
<path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#t)" stroke="#C8102E" stroke-width="4"/>
<path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/>
<path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6"/>
</svg>`

function dataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export const FLAGS: Record<Lang, string> = {
  el: dataUri(GREECE_FLAG),
  en: dataUri(UK_FLAG),
}

export function otherLang(lang: Lang): Lang {
  return lang === 'el' ? 'en' : 'el'
}
