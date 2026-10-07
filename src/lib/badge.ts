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
export type StickerShape = 'pill' | 'soft' | 'ticket' | 'tag' | 'jagged' | 'flower' | 'blob' | 'bump' | 'burst' | 'wave' | 'sun' | 'star'

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

/** Shared sticker swatches — hex lives in `:root` (`--sticker-*`). */
export const STICKER_SWATCH = {
  red: { color: 'var(--sticker-red)', textColor: '#fff' },
  green: { color: 'var(--sticker-green)', textColor: '#111' },
  ochre: { color: 'var(--sticker-ochre)', textColor: '#111' },
  blue: { color: 'var(--sticker-blue)', textColor: '#fff' },
  cyan: { color: 'var(--sticker-cyan)', textColor: '#111' },
  magenta: { color: 'var(--sticker-magenta)', textColor: '#fff' },
} as const

const STICKER_PALETTE = [
  STICKER_SWATCH.red,
  STICKER_SWATCH.green,
  STICKER_SWATCH.ochre,
  STICKER_SWATCH.blue,
  STICKER_SWATCH.cyan,
  STICKER_SWATCH.magenta,
] as const

function paint(i: number) {
  return STICKER_PALETTE[i % STICKER_PALETTE.length]
}

export const STICKERS: StickerDef[] = [
  { id: 'designer', tab: 'role', label: 'DESIGNER', ...paint(0), shape: 'bump', tilt: -6 },
  { id: 'developer', tab: 'role', label: 'DEVELOPER', ...paint(1), shape: 'bump', tilt: 4 },
  { id: 'maker', tab: 'role', label: 'MAKER', ...paint(2), shape: 'bump', tilt: -5 },
  { id: 'storyteller', tab: 'role', label: 'STORYTELLER', ...paint(3), shape: 'bump', tilt: 4 },
  { id: 'researcher', tab: 'role', label: 'RESEARCHER', ...paint(4), shape: 'bump', tilt: -3 },
  { id: 'dxtech', tab: 'track', label: 'DESIGN × TECH', ...paint(5), shape: 'star', tilt: -3 },
  { id: 'cxtech', tab: 'track', label: 'CULTURE × TECH', ...paint(0), shape: 'star', tilt: 3 },
  { id: 'solo', tab: 'track', label: 'SOLO BUILDER', ...paint(1), shape: 'star', tilt: -4 },
  { id: 'squad', tab: 'track', label: 'SQUAD UP', ...paint(2), shape: 'star', tilt: 4 },
  { id: 'learn', tab: 'vibe', label: 'HERE TO LEARN', ...paint(3), shape: 'sun', tilt: -4 },
  { id: 'funvibe', tab: 'vibe', label: 'HERE 4 FUN', ...paint(4), shape: 'sun', tilt: 5 },
  { id: 'win', tab: 'vibe', label: 'HERE 2 WIN', ...paint(5), shape: 'sun', tilt: -3 },
  { id: 'weave', tab: 'vibe', label: 'HERE TO WEAVE', ...paint(0), shape: 'sun', tilt: 4 },
  { id: 'sheher', tab: 'pronouns', label: 'SHE/HER', ...paint(1), shape: 'pill', tilt: -2 },
  { id: 'hehim', tab: 'pronouns', label: 'HE/HIM', ...paint(2), shape: 'pill', tilt: 2 },
  { id: 'theythem', tab: 'pronouns', label: 'THEY/THEM', ...paint(3), shape: 'pill', tilt: -2 },
  { id: 'shethey', tab: 'pronouns', label: 'SHE/THEY', ...paint(4), shape: 'pill', tilt: 3 },
  { id: 'askme', tab: 'pronouns', label: 'ASK ME', ...paint(5), shape: 'soft', tilt: -3 },
  { id: 'curious', tab: 'about', label: 'CURIOUS', ...paint(0), shape: 'soft', tilt: 4 },
  { id: 'firsttimer', tab: 'about', label: 'FIRST TIMER', ...paint(1), shape: 'ticket', tilt: -4 },
  { id: 'nightowl', tab: 'about', label: 'NIGHT OWL', ...paint(2), shape: 'flower', tilt: 5 },
  { id: 'snackboss', tab: 'about', label: 'SNACK BOSS', ...paint(3), shape: 'ticket', tilt: -3 },
  { id: 'codex', tab: 'about', label: 'CODEX', ...paint(4), shape: 'soft', tilt: 4 },
  { id: 'sg', tab: 'about', label: 'SG LOCAL', ...paint(5), shape: 'pill', tilt: -2 },
]

/** Sample placements for the landing preview badge. */
export const DEMO_STICKERS: PlacedSticker[] = [
  { uid: 'demo-dev', defId: 'developer', x: 24, y: 42, rotation: -8, trackId: '214' },
  { uid: 'demo-des', defId: 'designer', x: 76, y: 48, rotation: 10, trackId: '318' },
  { uid: 'demo-pro', defId: 'theythem', x: 28, y: 62, rotation: -4, trackId: '102' },
  { uid: 'demo-fl', defId: 'win', x: 72, y: 34, rotation: 6, trackId: '441' },
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
