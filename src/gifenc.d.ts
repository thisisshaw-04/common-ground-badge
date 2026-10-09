declare module 'gifenc' {
  export function GIFEncoder(): {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      opts?: {
        palette?: number[][]
        delay?: number
        repeat?: number
      },
    ): void
    finish(): void
    bytes(): Uint8Array
  }
  export function quantize(
    rgba: Uint8Array,
    maxColors: number,
    opts?: { format?: 'rgb444' | 'rgb565' | 'rgb888' },
  ): number[][]
  export function applyPalette(
    rgba: Uint8Array,
    palette: number[][],
    format?: 'rgb444' | 'rgb565' | 'rgb888',
  ): Uint8Array
}
