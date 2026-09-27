import {PROFILES} from '../data/profiles.js';

// Illustrative teaching blends: the same dominant + supporting shape used by
// Education, normalized to 100%. They are not COA-derived or cultivar averages.
export function referenceRanked(key) {
  const profile = PROFILES.find(p => p.key === key);
  if (!profile) return [];
  const weights = PROFILES.map(p => ({...p, weight: p.key === key ? 100 :
    p.key === profile.foundWith?.[0] ? 40 : p.key === profile.foundWith?.[1] ? 30 : 6}));
  const total = weights.reduce((sum, p) => sum + p.weight, 0);
  return weights.map(({weight, ...p}) => ({...p, pct: weight / total * 100}));
}
export const referencePct = key => Object.fromEntries(referenceRanked(key).map(p => [p.key, p.pct]));
