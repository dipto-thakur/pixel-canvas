1. unzip → place `pc2/` folder at `src/components/pc2/` (replaces `.gitkeep`)
2. npm install
3. npm run dev → http://localhost:3000

deps pc2 needs, already stubbed here:
- @/lib/utils        → cn()
- @/lib/github-contributions → ContributionMatrix, ContributionLevel, emptyMatrix()
- /api/github route  → returns emptyMatrix, swap in real logic later

page.tsx renders both text + github generator modes.
