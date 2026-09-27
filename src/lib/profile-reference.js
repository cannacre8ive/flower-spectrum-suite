import {PROFILES} from '../data/profiles.js';
// A teaching diagram isolates one sector. It is intentionally not a sample COA.
export const referenceRanked=key=>PROFILES.map(p=>({...p,pct:p.key===key?100:0}));
