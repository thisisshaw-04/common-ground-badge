export const EVENT = {
  name: 'Common Ground',
  subtitle: 'Makeathon',
  tagline: 'Design × Tech × Culture',
  date: '11 October',
  year: '2026',
  place: 'SQ Collective · Singapore',
  luma: 'https://luma.com/yjffwqr2',
  site: 'https://thisisshaw-04.github.io/common-ground-badge/',
} as const

export type CordId = 'ink' | 'coral' | 'mint'
export type BorderId = 'none' | 'dashed' | 'wiggly'
export type PatternId = 'swag' | 'cool' | 'fun'
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
  x: number // % of badge body
  y: number
  rotation: number
}

export interface BadgeState {
  name: string
  cord: CordId
  border: BorderId
  pattern: PatternId
  stickers: PlacedSticker[]
  drawingDataUrl: string | null
}

export const CORDS: Record<
  CordId,
  { label: string; from: string; to: string }
> = {
  ink: { label: 'Ink', from: '#1a1a1a', to: '#333' },
  coral: { label: 'Coral', from: '#ff6b35', to: '#ff8f66' },
  mint: { label: 'Mint', from: '#2bb673', to: '#7dffb3' },
}

export const PATTERNS: Record<
  PatternId,
  { label: string; a: string; b: string }
> = {
  swag: { label: 'Swag', a: '#7dffb3', b: '#5b8cff' },
  cool: { label: 'Cool', a: '#ff7ac3', b: '#b44dff' },
  fun: { label: 'Fun', a: '#ffe566', b: '#ff8a3d' },
}

export const STICKERS: StickerDef[] = [
  // roles
  { id: 'designer', tab: 'role', label: 'DESIGNER', color: '#ff7ac3', shape: 'blob' },
  { id: 'developer', tab: 'role', label: 'DEVELOPER', color: '#7dffb3', textColor: '#0b1f14', shape: 'blob' },
  { id: 'maker', tab: 'role', label: 'MAKER', color: '#ffe566', textColor: '#3a2a00', shape: 'star' },
  { id: 'storyteller', tab: 'role', label: 'STORYTELLER', color: '#5b8cff', shape: 'cloud' },
  { id: 'researcher', tab: 'role', label: 'RESEARCHER', color: '#c9a0ff', textColor: '#2a1040', shape: 'ticket' },
  { id: 'wildcard', tab: 'role', label: 'WILDCARD', color: '#ff8fab', textColor: '#3a1020', shape: 'star' },
  // tracks
  { id: 'dxtech', tab: 'track', label: 'DESIGN × TECH', color: '#7dffb3', textColor: '#0b1f14', shape: 'ticket' },
  { id: 'cxtech', tab: 'track', label: 'CULTURE × TECH', color: '#ffe566', textColor: '#3a2a00', shape: 'ticket' },
  { id: 'solo', tab: 'track', label: 'SOLO BUILDER', color: '#5b8cff', shape: 'pill' },
  { id: 'squad', tab: 'track', label: 'SQUAD UP', color: '#ff6b35', shape: 'pill' },
  // vibes
  { id: 'learn', tab: 'vibe', label: 'HERE TO LEARN', color: '#7dffb3', textColor: '#0b1f14', shape: 'blob' },
  { id: 'funvibe', tab: 'vibe', label: 'HERE 4 FUN', color: '#ff6b35', shape: 'star' },
  { id: 'win', tab: 'vibe', label: 'HERE 2 WIN', color: '#ffe566', textColor: '#3a2a00', shape: 'cloud' },
  { id: 'weave', tab: 'vibe', label: 'HERE TO WEAVE', color: '#5b8cff', shape: 'blob' },
  // pronouns
  { id: 'sheher', tab: 'pronouns', label: 'SHE/HER', color: '#ffd6e8', textColor: '#5a2040', shape: 'pill' },
  { id: 'hehim', tab: 'pronouns', label: 'HE/HIM', color: '#d6ecff', textColor: '#1a3a5a', shape: 'pill' },
  { id: 'theythem', tab: 'pronouns', label: 'THEY/THEM', color: '#e8ffd6', textColor: '#2a4010', shape: 'pill' },
  { id: 'shethey', tab: 'pronouns', label: 'SHE/THEY', color: '#ffe566', textColor: '#3a2a00', shape: 'pill' },
  { id: 'askme', tab: 'pronouns', label: 'ASK ME', color: '#c9a0ff', textColor: '#2a1040', shape: 'pill' },
  // about
  { id: 'curious', tab: 'about', label: 'CURIOUS', color: '#7dffb3', textColor: '#0b1f14', shape: 'cloud' },
  { id: 'firsttimer', tab: 'about', label: 'FIRST TIMER', color: '#ff7ac3', shape: 'blob' },
  { id: 'nightowl', tab: 'about', label: 'NIGHT OWL', color: '#5b8cff', shape: 'star' },
  { id: 'snackboss', tab: 'about', label: 'SNACK BOSS', color: '#ffe566', textColor: '#3a2a00', shape: 'ticket' },
  { id: 'codex', tab: 'about', label: 'CODEX CURIOUS', color: '#ff6b35', shape: 'blob' },
  { id: 'sg', tab: 'about', label: 'SG LOCAL', color: '#7dffb3', textColor: '#0b1f14', shape: 'pill' },
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
  cord: 'ink',
  border: 'none',
  pattern: 'swag',
  stickers: [],
  drawingDataUrl: null,
}

export function stickerById(id: string) {
  return STICKERS.find((s) => s.id === id)
}
