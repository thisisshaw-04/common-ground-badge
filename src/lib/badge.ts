export const EVENT = {
  name: 'COMMON GROUND',
  subtitle: 'NEXALUNE MAKEATHON',
  tagline: 'Design × Tech × Culture',
  date: '11 October',
  year: '2026',
  place: 'SQ Collective · Singapore',
  luma: 'https://luma.com/yjffwqr2',
  site: 'https://thisisshaw-04.github.io/common-ground-badge/',
} as const

export type CordId = 'signal' | 'flare' | 'acid'
export type BorderId = 'none' | 'dashed' | 'track'
export type StickerTab = 'role' | 'track' | 'vibe' | 'pronouns' | 'about'

export type StickerShape =
  | 'blob'
  | 'pill'
  | 'star'
  | 'ticket'
  | 'cloud'
  | 'burst'
  | 'flower'
  | 'diamond'
  | 'banner'
  | 'tag'

export interface StickerDef {
  id: string
  tab: StickerTab
  label: string
  color: string
  textColor?: string
  shape: StickerShape
  /** Extra spin in the tray (deg) */
  tilt?: number
}

export interface PlacedSticker {
  uid: string
  defId: string
  x: number
  y: number
  rotation: number
  trackId: string
}

export interface BadgeState {
  name: string
  cord: CordId
  border: BorderId
  stickers: PlacedSticker[]
  drawingDataUrl: string | null
}

export const CORDS: Record<
  CordId,
  { label: string; from: string; to: string }
> = {
  signal: { label: 'Signal', from: '#ffe600', to: '#c4b000' },
  flare: { label: 'Flare', from: '#ff4fd8', to: '#ff9a3c' },
  acid: { label: 'Acid', from: '#39ffb6', to: '#5b8cff' },
}

export const STICKERS: StickerDef[] = [
  { id: 'designer', tab: 'role', label: 'DESIGNER', color: '#ff4fd8', shape: 'flower', tilt: -6 },
  { id: 'developer', tab: 'role', label: 'DEVELOPER', color: '#39ffb6', textColor: '#04140e', shape: 'burst', tilt: 5 },
  { id: 'maker', tab: 'role', label: 'MAKER', color: '#ffe600', textColor: '#1a1600', shape: 'star', tilt: -8 },
  { id: 'storyteller', tab: 'role', label: 'STORYTELLER', color: '#5b8cff', shape: 'cloud', tilt: 4 },
  { id: 'researcher', tab: 'role', label: 'RESEARCHER', color: '#c9a0ff', textColor: '#1a0a28', shape: 'diamond', tilt: -3 },
  { id: 'wildcard', tab: 'role', label: 'WILDCARD', color: '#ff9a3c', textColor: '#1a0a00', shape: 'burst', tilt: 7 },
  { id: 'dxtech', tab: 'track', label: 'DESIGN × TECH', color: '#39ffb6', textColor: '#04140e', shape: 'ticket', tilt: -4 },
  { id: 'cxtech', tab: 'track', label: 'CULTURE × TECH', color: '#ffe600', textColor: '#1a1600', shape: 'banner', tilt: 3 },
  { id: 'solo', tab: 'track', label: 'SOLO BUILDER', color: '#5b8cff', shape: 'tag', tilt: -5 },
  { id: 'squad', tab: 'track', label: 'SQUAD UP', color: '#ff4fd8', shape: 'pill', tilt: 6 },
  { id: 'learn', tab: 'vibe', label: 'HERE TO LEARN', color: '#7dffb3', textColor: '#04140e', shape: 'blob', tilt: -7 },
  { id: 'funvibe', tab: 'vibe', label: 'HERE 4 FUN', color: '#ff9a3c', textColor: '#1a0a00', shape: 'star', tilt: 8 },
  { id: 'win', tab: 'vibe', label: 'HERE 2 WIN', color: '#ffe600', textColor: '#1a1600', shape: 'burst', tilt: -4 },
  { id: 'weave', tab: 'vibe', label: 'HERE TO WEAVE', color: '#5b8cff', shape: 'flower', tilt: 5 },
  { id: 'sheher', tab: 'pronouns', label: 'SHE/HER', color: '#ff7ac3', textColor: '#2a0a18', shape: 'pill', tilt: -3 },
  { id: 'hehim', tab: 'pronouns', label: 'HE/HIM', color: '#5b8cff', shape: 'pill', tilt: 3 },
  { id: 'theythem', tab: 'pronouns', label: 'THEY/THEM', color: '#39ffb6', textColor: '#04140e', shape: 'pill', tilt: -2 },
  { id: 'shethey', tab: 'pronouns', label: 'SHE/THEY', color: '#ffe600', textColor: '#1a1600', shape: 'tag', tilt: 4 },
  { id: 'askme', tab: 'pronouns', label: 'ASK ME', color: '#c9a0ff', textColor: '#1a0a28', shape: 'cloud', tilt: -5 },
  { id: 'curious', tab: 'about', label: 'CURIOUS', color: '#39ffb6', textColor: '#04140e', shape: 'diamond', tilt: 6 },
  { id: 'firsttimer', tab: 'about', label: 'FIRST TIMER', color: '#ff4fd8', shape: 'banner', tilt: -6 },
  { id: 'nightowl', tab: 'about', label: 'NIGHT OWL', color: '#6b5cff', shape: 'star', tilt: 7 },
  { id: 'snackboss', tab: 'about', label: 'SNACK BOSS', color: '#ffe600', textColor: '#1a1600', shape: 'ticket', tilt: -4 },
  { id: 'codex', tab: 'about', label: 'CODEX CURIOUS', color: '#ff9a3c', textColor: '#1a0a00', shape: 'burst', tilt: 5 },
  { id: 'sg', tab: 'about', label: 'SG LOCAL', color: '#39ffb6', textColor: '#04140e', shape: 'flower', tilt: -3 },
]

export const TABS: { id: StickerTab; label: string }[] = [
  { id: 'role', label: 'ROLE' },
  { id: 'track', label: 'TRACK' },
  { id: 'vibe', label: 'VIBE' },
  { id: 'pronouns', label: 'PRONOUNS' },
  { id: 'about', label: 'ABOUT' },
]

export const DEFAULT_STATE: BadgeState = {
  name: '',
  cord: 'signal',
  border: 'track',
  stickers: [],
  drawingDataUrl: null,
}

export function stickerById(id: string) {
  return STICKERS.find((s) => s.id === id)
}
