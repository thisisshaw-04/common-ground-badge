export type TrackId = 'design-tech' | 'culture-tech'
export type ThemeId = 'intersection' | 'saffron' | 'midnight' | 'loom'
export type RoleId =
  | 'designer'
  | 'developer'
  | 'maker'
  | 'storyteller'
  | 'researcher'
  | 'wildcard'
export type VibeId = 'curious' | 'fun' | 'win' | 'weave'

export interface BadgeData {
  name: string
  pronouns: string
  track: TrackId
  role: RoleId
  vibe: VibeId
  theme: ThemeId
  photoUrl: string | null
}

export const TRACKS: Record<
  TrackId,
  { label: string; short: string; blurb: string; color: string }
> = {
  'design-tech': {
    label: 'Design × Tech',
    short: 'D×T',
    blurb: 'Reimagine how we create, interact, and experience.',
    color: '#3ecf8e',
  },
  'culture-tech': {
    label: 'Culture × Tech',
    short: 'C×T',
    blurb: 'Reinterpret culture — past, present, and emerging.',
    color: '#f0c75e',
  },
}

export const ROLES: Record<RoleId, { label: string; color: string }> = {
  designer: { label: 'DESIGNER', color: '#ff6b35' },
  developer: { label: 'DEVELOPER', color: '#3ecf8e' },
  maker: { label: 'MAKER', color: '#f0c75e' },
  storyteller: { label: 'STORYTELLER', color: '#6ec8ff' },
  researcher: { label: 'RESEARCHER', color: '#c9a0ff' },
  wildcard: { label: 'WILDCARD', color: '#ff8fab' },
}

export const VIBES: Record<VibeId, { label: string; color: string }> = {
  curious: { label: 'HERE TO LEARN', color: '#3ecf8e' },
  fun: { label: 'HERE 4 FUN', color: '#ff6b35' },
  win: { label: 'HERE 2 WIN', color: '#f0c75e' },
  weave: { label: 'HERE TO WEAVE', color: '#6ec8ff' },
}

export const THEMES: Record<
  ThemeId,
  {
    label: string
    badgeBg: string
    badgeFg: string
    accent: string
    stripe: string
  }
> = {
  intersection: {
    label: 'Intersection',
    badgeBg: '#0f2a2e',
    badgeFg: '#e8f4f2',
    accent: '#ff6b35',
    stripe: '#3ecf8e',
  },
  saffron: {
    label: 'Saffron Field',
    badgeBg: '#2a1a0a',
    badgeFg: '#fff3e0',
    accent: '#f0c75e',
    stripe: '#ff6b35',
  },
  midnight: {
    label: 'Midnight Loom',
    badgeBg: '#0a1220',
    badgeFg: '#eef3ff',
    accent: '#6ec8ff',
    stripe: '#3ecf8e',
  },
  loom: {
    label: 'Paper Warp',
    badgeBg: '#f4f7f6',
    badgeFg: '#0f1f1c',
    accent: '#ff6b35',
    stripe: '#0f2a2e',
  },
}

export const EVENT = {
  name: 'Common Ground',
  subtitle: 'Makeathon',
  tagline: 'Design × Tech × Culture',
  date: '11 October',
  year: '2026',
  place: 'SQ Collective · Singapore',
  luma: 'https://luma.com/yjffwqr2',
} as const

export const DEFAULT_BADGE: BadgeData = {
  name: '',
  pronouns: '',
  track: 'design-tech',
  role: 'maker',
  vibe: 'curious',
  theme: 'intersection',
  photoUrl: null,
}
