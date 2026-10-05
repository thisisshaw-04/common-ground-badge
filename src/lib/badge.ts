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
export type FieldId = 'signal' | 'pulse' | 'flare'
export type StickerTab = 'role' | 'track' | 'vibe' | 'pronouns' | 'about'

export type StickerShape = 'blob' | 'pill' | 'star' | 'ticket' | 'cloud'

export interface StickerDef {
  id: string
  tab: StickerTab
  label: string
  color: string
  textColor?: string
  shape: StickerShape
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
  field: FieldId
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

/** Bright translucent tracked blob fields (no checker grids). */
export const FIELDS: Record<
  FieldId,
  {
    label: string
    blobs: { color: string; x: number; y: number; w: number; h: number; id: string }[]
  }
> = {
  signal: {
    label: 'Signal',
    blobs: [
      { color: 'rgba(57,255,182,0.45)', x: 8, y: 28, w: 42, h: 36, id: '001' },
      { color: 'rgba(255,230,0,0.4)', x: 48, y: 42, w: 38, h: 32, id: '002' },
      { color: 'rgba(91,140,255,0.42)', x: 28, y: 58, w: 44, h: 28, id: '003' },
    ],
  },
  pulse: {
    label: 'Pulse',
    blobs: [
      { color: 'rgba(255,79,216,0.42)', x: 12, y: 30, w: 40, h: 34, id: '011' },
      { color: 'rgba(255,154,60,0.4)', x: 50, y: 38, w: 36, h: 40, id: '012' },
      { color: 'rgba(57,255,182,0.38)', x: 30, y: 62, w: 48, h: 26, id: '013' },
    ],
  },
  flare: {
    label: 'Flare',
    blobs: [
      { color: 'rgba(91,140,255,0.44)', x: 10, y: 26, w: 36, h: 38, id: '021' },
      { color: 'rgba(255,230,0,0.42)', x: 42, y: 36, w: 46, h: 30, id: '022' },
      { color: 'rgba(255,79,216,0.4)', x: 24, y: 56, w: 40, h: 34, id: '023' },
    ],
  },
}

export const STICKERS: StickerDef[] = [
  { id: 'designer', tab: 'role', label: 'DESIGNER', color: 'rgba(255,79,216,0.85)', shape: 'blob' },
  { id: 'developer', tab: 'role', label: 'DEVELOPER', color: 'rgba(57,255,182,0.85)', textColor: '#04140e', shape: 'blob' },
  { id: 'maker', tab: 'role', label: 'MAKER', color: 'rgba(255,230,0,0.9)', textColor: '#1a1600', shape: 'star' },
  { id: 'storyteller', tab: 'role', label: 'STORYTELLER', color: 'rgba(91,140,255,0.88)', shape: 'cloud' },
  { id: 'researcher', tab: 'role', label: 'RESEARCHER', color: 'rgba(201,160,255,0.88)', textColor: '#1a0a28', shape: 'ticket' },
  { id: 'wildcard', tab: 'role', label: 'WILDCARD', color: 'rgba(255,154,60,0.9)', textColor: '#1a0a00', shape: 'star' },
  { id: 'dxtech', tab: 'track', label: 'DESIGN × TECH', color: 'rgba(57,255,182,0.85)', textColor: '#04140e', shape: 'ticket' },
  { id: 'cxtech', tab: 'track', label: 'CULTURE × TECH', color: 'rgba(255,230,0,0.9)', textColor: '#1a1600', shape: 'ticket' },
  { id: 'solo', tab: 'track', label: 'SOLO BUILDER', color: 'rgba(91,140,255,0.88)', shape: 'pill' },
  { id: 'squad', tab: 'track', label: 'SQUAD UP', color: 'rgba(255,79,216,0.85)', shape: 'pill' },
  { id: 'learn', tab: 'vibe', label: 'HERE TO LEARN', color: 'rgba(57,255,182,0.85)', textColor: '#04140e', shape: 'blob' },
  { id: 'funvibe', tab: 'vibe', label: 'HERE 4 FUN', color: 'rgba(255,154,60,0.9)', textColor: '#1a0a00', shape: 'star' },
  { id: 'win', tab: 'vibe', label: 'HERE 2 WIN', color: 'rgba(255,230,0,0.9)', textColor: '#1a1600', shape: 'cloud' },
  { id: 'weave', tab: 'vibe', label: 'HERE TO WEAVE', color: 'rgba(91,140,255,0.88)', shape: 'blob' },
  { id: 'sheher', tab: 'pronouns', label: 'SHE/HER', color: 'rgba(255,79,216,0.75)', shape: 'pill' },
  { id: 'hehim', tab: 'pronouns', label: 'HE/HIM', color: 'rgba(91,140,255,0.75)', shape: 'pill' },
  { id: 'theythem', tab: 'pronouns', label: 'THEY/THEM', color: 'rgba(57,255,182,0.75)', textColor: '#04140e', shape: 'pill' },
  { id: 'shethey', tab: 'pronouns', label: 'SHE/THEY', color: 'rgba(255,230,0,0.8)', textColor: '#1a1600', shape: 'pill' },
  { id: 'askme', tab: 'pronouns', label: 'ASK ME', color: 'rgba(201,160,255,0.8)', textColor: '#1a0a28', shape: 'pill' },
  { id: 'curious', tab: 'about', label: 'CURIOUS', color: 'rgba(57,255,182,0.85)', textColor: '#04140e', shape: 'cloud' },
  { id: 'firsttimer', tab: 'about', label: 'FIRST TIMER', color: 'rgba(255,79,216,0.85)', shape: 'blob' },
  { id: 'nightowl', tab: 'about', label: 'NIGHT OWL', color: 'rgba(91,140,255,0.88)', shape: 'star' },
  { id: 'snackboss', tab: 'about', label: 'SNACK BOSS', color: 'rgba(255,230,0,0.9)', textColor: '#1a1600', shape: 'ticket' },
  { id: 'codex', tab: 'about', label: 'CODEX CURIOUS', color: 'rgba(255,154,60,0.9)', textColor: '#1a0a00', shape: 'blob' },
  { id: 'sg', tab: 'about', label: 'SG LOCAL', color: 'rgba(57,255,182,0.85)', textColor: '#04140e', shape: 'pill' },
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
  field: 'signal',
  stickers: [],
  drawingDataUrl: null,
}

export function stickerById(id: string) {
  return STICKERS.find((s) => s.id === id)
}
