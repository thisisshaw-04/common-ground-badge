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

export type CordId = 'ink' | 'signal' | 'flare' | 'acid'
export type BorderId = 'none' | 'dashed' | 'dotted' | 'wiggly'
export type StickerTab = 'role' | 'track' | 'vibe' | 'pronouns' | 'about'
export type FootVideoId =
  | 'ink'
  | 'paper'
  | 'violet'
  | 'signal'
  | 'flare'
  | 'heat'
  | 'acid'
  | 'mint'

/** Die-cut shapes — blob matches FigBuild clover stickers. */
export type StickerShape = 'pill' | 'soft' | 'ticket' | 'tag' | 'jagged' | 'flower' | 'blob' | 'bump'

export interface StickerDef {
  id: string
  tab: StickerTab
  label: string
  color: string
  textColor?: string
  shape: StickerShape
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
  footVideo: FootVideoId
  stickers: PlacedSticker[]
  drawingDataUrl: string | null
}

/** Videos shown in the grey foot strip at the bottom of the badge. */
export const FOOT_VIDEOS: Record<
  FootVideoId,
  { label: string; file: string; swatch: string }
> = {
  heat: { label: 'Heat', file: 'heat.mp4', swatch: '#ff2a2a' },
  paper: { label: 'Paper', file: 'paper.mp4', swatch: '#f0f0f0' },
  violet: { label: 'Violet', file: 'violet.mp4', swatch: '#6b4cff' },
  signal: { label: 'Signal', file: 'signal.mp4', swatch: '#ffe34a' },
  flare: { label: 'Flare', file: 'flare.mp4', swatch: '#d44cff' },
  ink: { label: 'Ink', file: 'ink.mp4', swatch: '#111111' },
  acid: { label: 'Acid', file: 'acid.mp4', swatch: '#2ad4ff' },
  mint: { label: 'Mint', file: 'mint.mp4', swatch: '#2fe08a' },
}

/** Display order matching the 2×4 poster grid. */
export const FOOT_VIDEO_ORDER: FootVideoId[] = [
  'heat',
  'paper',
  'violet',
  'signal',
  'flare',
  'ink',
  'acid',
  'mint',
]

export function footVideoSrc(id: FootVideoId) {
  const base = import.meta.env.BASE_URL || '/'
  return `${base}foot-videos/${FOOT_VIDEOS[id].file}`
}

export const CORDS: Record<
  CordId,
  { label: string; from: string; to: string }
> = {
  ink: { label: 'Ink', from: '#1a1a1a', to: '#3a3a3a' },
  signal: { label: 'Signal', from: '#ffe600', to: '#c4b000' },
  flare: { label: 'Flare', from: '#ff4fd8', to: '#ff9a3c' },
  acid: { label: 'Acid', from: '#39ffb6', to: '#4c54f5' },
}

export const STICKERS: StickerDef[] = [
  /* Roles — bubbly clover + foot-video colours */
  { id: 'designer', tab: 'role', label: 'DESIGNER', color: '#ff2a2a', textColor: '#fff', shape: 'bump', tilt: -6 },
  { id: 'developer', tab: 'role', label: 'DEVELOPER', color: '#2fe08a', textColor: '#111', shape: 'bump', tilt: 4 },
  { id: 'maker', tab: 'role', label: 'MAKER', color: '#ffe34a', textColor: '#111', shape: 'bump', tilt: -5 },
  { id: 'storyteller', tab: 'role', label: 'STORYTELLER', color: '#6b4cff', textColor: '#fff', shape: 'bump', tilt: 4 },
  { id: 'researcher', tab: 'role', label: 'RESEARCHER', color: '#2ad4ff', textColor: '#111', shape: 'bump', tilt: -3 },
  { id: 'wildcard', tab: 'role', label: 'WILDCARD', color: '#d44cff', textColor: '#fff', shape: 'bump', tilt: 5 },
  /* Year — FigBuild clover sheet */
  { id: 'dxtech', tab: 'track', label: 'DESIGN × TECH', color: '#2fe08a', textColor: '#111', shape: 'ticket', tilt: -3 },
  { id: 'cxtech', tab: 'track', label: 'CULTURE × TECH', color: '#ffe34a', textColor: '#111', shape: 'ticket', tilt: 3 },
  { id: 'solo', tab: 'track', label: 'SOLO BUILDER', color: '#4c54f5', textColor: '#fff', shape: 'tag', tilt: -4 },
  { id: 'squad', tab: 'track', label: 'SQUAD UP', color: '#ff5ec8', textColor: '#111', shape: 'pill', tilt: 4 },
  { id: 'learn', tab: 'vibe', label: 'HERE TO LEARN', color: '#c8ff4a', textColor: '#111', shape: 'pill', tilt: -4 },
  { id: 'funvibe', tab: 'vibe', label: 'HERE 4 FUN', color: '#ff9a3c', textColor: '#111', shape: 'soft', tilt: 5 },
  { id: 'win', tab: 'vibe', label: 'HERE 2 WIN', color: '#ffe34a', textColor: '#111', shape: 'pill', tilt: -3 },
  { id: 'weave', tab: 'vibe', label: 'HERE TO WEAVE', color: '#4c54f5', textColor: '#fff', shape: 'flower', tilt: 4 },
  { id: 'sheher', tab: 'pronouns', label: 'SHE/HER', color: '#ff7ac3', textColor: '#111', shape: 'pill', tilt: -2 },
  { id: 'hehim', tab: 'pronouns', label: 'HE/HIM', color: '#4c54f5', textColor: '#fff', shape: 'pill', tilt: 2 },
  { id: 'theythem', tab: 'pronouns', label: 'THEY/THEM', color: '#2fe08a', textColor: '#111', shape: 'pill', tilt: -2 },
  { id: 'shethey', tab: 'pronouns', label: 'SHE/THEY', color: '#c8ff4a', textColor: '#111', shape: 'pill', tilt: 3 },
  { id: 'askme', tab: 'pronouns', label: 'ASK ME', color: '#c9a0ff', textColor: '#2a1050', shape: 'soft', tilt: -3 },
  { id: 'curious', tab: 'about', label: 'CURIOUS', color: '#2fe08a', textColor: '#111', shape: 'soft', tilt: 4 },
  { id: 'firsttimer', tab: 'about', label: 'FIRST TIMER', color: '#ff5ec8', textColor: '#111', shape: 'ticket', tilt: -4 },
  { id: 'nightowl', tab: 'about', label: 'NIGHT OWL', color: '#4c54f5', textColor: '#fff', shape: 'flower', tilt: 5 },
  { id: 'snackboss', tab: 'about', label: 'SNACK BOSS', color: '#ffe34a', textColor: '#111', shape: 'ticket', tilt: -3 },
  { id: 'codex', tab: 'about', label: 'CODEX', color: '#ff9a3c', textColor: '#111', shape: 'soft', tilt: 4 },
  { id: 'sg', tab: 'about', label: 'SG LOCAL', color: '#2fe08a', textColor: '#111', shape: 'pill', tilt: -2 },
]

/** Sample placements for the landing preview badge. */
export const DEMO_STICKERS: PlacedSticker[] = [
  { uid: 'demo-dev', defId: 'developer', x: 24, y: 42, rotation: -8, trackId: '214' },
  { uid: 'demo-des', defId: 'designer', x: 76, y: 48, rotation: 10, trackId: '318' },
  { uid: 'demo-pro', defId: 'shethey', x: 28, y: 62, rotation: -4, trackId: '102' },
  { uid: 'demo-fl', defId: 'weave', x: 72, y: 34, rotation: 6, trackId: '441' },
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
  footVideo: 'heat',
  stickers: [],
  drawingDataUrl: null,
}

export const DEMO_STATE: BadgeState = {
  name: 'you',
  cord: 'ink',
  border: 'none',
  footVideo: 'heat',
  stickers: DEMO_STICKERS,
  drawingDataUrl: null,
}

export function stickerById(id: string) {
  return STICKERS.find((s) => s.id === id)
}
