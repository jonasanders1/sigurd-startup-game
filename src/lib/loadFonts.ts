import pixelifySansUrl from "../assets/Font/PixelifySans-VariableFont_wght.ttf?url";
import pixufUrl from "../assets/score-font/Pixuf.ttf?url";

/**
 * Load the game's font families. Pixelify Sans is bundled locally (the host
 * page's font wasn't reliably inheriting into the shadow DOM); JetBrains
 * Mono and VT323 still come from Google Fonts.
 *
 * All declarations land in `document.head` — @font-face declarations
 * applied inside a shadow root don't reliably register with the browser's
 * font loader, so the families need to live at document scope to be
 * resolvable from the shadow DOM the production build mounts into.
 *
 * Idempotent: a marker attribute prevents duplicate injection if both
 * entry points call this (dev: `main.tsx`, prod custom element:
 * `game-wrapper.tsx`).
 */
const FONT_MARKER = "data-sigurd-fonts";

export const ensureFontsLoaded = (): void => {
  if (typeof document === "undefined") return;
  if (document.head.querySelector(`[${FONT_MARKER}]`)) return;

  // Preload the font so the browser starts the fetch with high priority
  // before CSS parsing finishes. Combined with `font-display: block`, this
  // eliminates the flash of fallback text on initial render.
  const preload = document.createElement("link");
  preload.rel = "preload";
  preload.as = "font";
  preload.href = pixelifySansUrl;
  preload.type = "font/ttf";
  preload.crossOrigin = "anonymous";
  preload.setAttribute(FONT_MARKER, "");
  document.head.appendChild(preload);

  // Preload Pixuf so it's hot before the first floating-score draws on
  // coin/firefounding collect.
  const pixufPreload = document.createElement("link");
  pixufPreload.rel = "preload";
  pixufPreload.as = "font";
  pixufPreload.href = pixufUrl;
  pixufPreload.type = "font/ttf";
  pixufPreload.crossOrigin = "anonymous";
  pixufPreload.setAttribute(FONT_MARKER, "");
  document.head.appendChild(pixufPreload);

  const localFontStyle = document.createElement("style");
  localFontStyle.setAttribute(FONT_MARKER, "");
  localFontStyle.textContent = `
    @font-face {
      font-family: "Pixelify Sans";
      src: url("${pixelifySansUrl}");
      font-weight: 400 700;
      font-style: normal;
      font-display: block;
    }
    @font-face {
      font-family: "Pixuf";
      src: url("${pixufUrl}") format("truetype");
      font-weight: normal;
      font-style: normal;
      font-display: block;
    }
  `;
  document.head.appendChild(localFontStyle);

  const families = [
    "https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap",
    "https://fonts.googleapis.com/css2?family=VT323&display=swap",
  ];
  const preconnect = document.createElement("link");
  preconnect.rel = "preconnect";
  preconnect.href = "https://fonts.gstatic.com";
  preconnect.crossOrigin = "anonymous";
  preconnect.setAttribute(FONT_MARKER, "");
  document.head.appendChild(preconnect);
  for (const href of families) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.setAttribute(FONT_MARKER, "");
    document.head.appendChild(link);
  }
};
