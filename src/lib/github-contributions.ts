// Minimal stand-in for the real lib/github-contributions module.
// Shape: weeks[] of days[], each day is a contribution intensity level 0-4.

export type ContributionLevel = 0 | 1 | 2 | 3 | 4;
export type ContributionMatrix = ContributionLevel[][];

export function emptyMatrix(): ContributionMatrix {
  return [];
}
