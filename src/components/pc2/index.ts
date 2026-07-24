//src\components\pc2\index.ts

export { PixelCanvas }                     from "./pixel-canvas";
export { fetchGithubContributions,
         clearGithubCache,
         warmGithubCache }                 from "./services/github-client";
export type { PixelCanvasProps }           from "./types";
export type { ContributionMatrix,
              ContributionLevel }          from "@/lib/github-contributions";
export { emptyMatrix }                     from "@/lib/github-contributions";