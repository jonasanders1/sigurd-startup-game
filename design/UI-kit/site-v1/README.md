# Site UI Kit

Recreation of the Sigurd Startup marketing site (Next.js + Tailwind + shadcn/ui). Focuses on home/rules surfaces — login/profile/leaderboard are out of scope.

**Files**
- `index.html` — mounts the interactive home view with sidebar
- `Sidebar.jsx` — fixed sidebar with collapse + nav items
- `components.jsx` — Card, SectionCard, StatCard, Button, Kbd, Icon
- `app.jsx` — home view composition (hero, stats, rules sections)

Source of truth: `jonasanders1/sigurd-startup-site` → `src/legacy-pages/Home.tsx`, `src/components/Sidebar.tsx`, `src/components/ui/card.tsx`.
