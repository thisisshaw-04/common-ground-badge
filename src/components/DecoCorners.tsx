/** Decorative sticker cluster — FigBuild-style corner confetti. */
export function DecoCorners() {
  return (
    <>
      <div className="deco-cluster absolute bottom-6 left-3 z-10 hidden w-44 sm:block md:left-6 md:w-52 lg:bottom-8 lg:w-60">
        <svg viewBox="0 0 220 160" className="h-auto w-full" aria-hidden>
          <rect x="8" y="70" width="54" height="54" fill="var(--sticker-magenta)" />
          <rect x="8" y="70" width="27" height="27" fill="var(--sticker-green)" />
          <rect x="35" y="97" width="27" height="27" fill="var(--sticker-green)" />
          <circle cx="92" cy="118" r="22" fill="var(--sticker-ochre)" />
          <path
            d="M88 104 C96 112, 96 124, 88 132 C80 124, 80 112, 88 104 Z M104 112 C112 120, 100 132, 92 124 C100 116, 112 104, 104 112 Z"
            fill="var(--sticker-blue)"
          />
          <path
            d="M130 78 C148 70, 168 88, 158 108 C148 126, 120 118, 122 96 C124 84, 128 80, 130 78 Z"
            fill="var(--sticker-red)"
          />
          <path
            d="M40 28 C52 18, 70 28, 66 46 C80 50, 78 72, 62 74 C58 90, 36 88, 32 70 C16 68, 14 46, 30 42 C28 28, 34 22, 40 28 Z"
            fill="var(--sticker-cyan)"
          />
          <rect x="150" y="30" width="48" height="48" rx="6" fill="#111" />
          <text
            x="174"
            y="62"
            textAnchor="middle"
            fill="#fff"
            fontFamily="Google Sans, sans-serif"
            fontSize="22"
            fontWeight="700"
          >
            Aa
          </text>
          <path
            d="M175 95 Q190 110 175 125 Q160 110 175 95"
            fill="none"
            stroke="var(--sticker-blue)"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="deco-cluster absolute right-3 bottom-6 z-10 hidden w-40 sm:block md:right-6 md:w-48 lg:bottom-8 lg:w-56">
        <svg viewBox="0 0 200 150" className="h-auto w-full" aria-hidden>
          <path
            d="M30 20 C42 10, 60 20, 56 38 C70 42, 68 64, 52 66 C48 82, 26 80, 22 62 C6 60, 4 38, 20 34 C18 20, 24 14, 30 20 Z"
            fill="var(--sticker-ochre)"
          />
          <rect x="70" y="18" width="44" height="44" fill="var(--sticker-magenta)" />
          <rect x="70" y="18" width="22" height="22" fill="var(--sticker-green)" />
          <rect x="92" y="40" width="22" height="22" fill="var(--sticker-green)" />
          <circle cx="150" cy="40" r="20" fill="var(--sticker-blue)" />
          <path
            d="M20 90 C40 78, 70 92, 62 118 C90 122, 88 150, 58 148 C50 168, 18 160, 20 132 C0 128, 2 98, 20 90 Z"
            fill="var(--sticker-cyan)"
          />
          <path
            d="M120 80 C138 72, 158 90, 148 110 C138 128, 110 120, 112 98 C114 86, 118 82, 120 80 Z"
            fill="var(--sticker-red)"
          />
          <text
            x="155"
            y="130"
            fill="#111"
            fontFamily="Google Sans, sans-serif"
            fontSize="36"
            fontWeight="800"
          >
            Aa
          </text>
        </svg>
      </div>
    </>
  )
}
