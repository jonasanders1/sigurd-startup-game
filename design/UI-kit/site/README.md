# Site UI Kit (v2 — Arcade)

Recreation of the Sigurd Startup marketing site with a full arcade dress:

- **Fjord night** palette (deep navy → signal red → cold white)
- **Pixelify Sans** headings, **VT323** for numeric/LCD readouts, **JetBrains Mono** body
- **Marquee ticker** across the top
- **Pixel-bezel** cards (corner brackets, hard pixel shadows)
- **CRT scanlines** on the hero, flicker animation on the wordmark
- **Fjord silhouette** at the bottom of the hero (pixel-art)
- **"PRESS START" / "INSERT COIN"** arcade cabinet cues

The v1 kit (old system, unchanged) is preserved at `ui_kits/site-v1/` for comparison.

## Files
- `index.html` — mounts the home view
- `Sidebar.jsx` — arcade sidebar with player-ID LCD, INSERT COIN footer
- `components.jsx` — `PixelBezel`, `Marquee`, `LCDReadout`, `ArcadeButton`, `Kbd`, `Icon`, `FjordBackdrop`
- `app.jsx` — hero + stats + rules composition
