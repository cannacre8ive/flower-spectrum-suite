import { PROFILES, PROFILE_MAP as PBK } from "../data/profiles.js";
import { TERPENES, TERP_BY_KEY, MODIFIERS, potencyOf, contribOf } from "../data/engine-terpenes.js";
export { TERPENES as ENGINE_TERPENES } from "../data/engine-terpenes.js";
const shortOf=k=>PBK[k]?.short||k;
export function classify(input = {}) {
  const values = Object.fromEntries(Object.entries(input).filter(([,v]) => typeof v === "number" && Number.isFinite(v) && v > 0 && v <= 100));
  const scores = {};
  PROFILES.forEach(p => scores[p.key] = 0);
  const modScores = {};
  let activeCount = 0;
  let totalRaw = 0;

  TERPENES.forEach(t => {
    const v = values[t.key] || 0;
    if (v <= 0) return;
    activeCount++;
    totalRaw += v;
    const weighted = v * potencyOf(t);
    const c = contribOf(t);
    Object.entries(c).forEach(([pk, w]) => { scores[pk] += weighted * w; });
    if (t.modifier) modScores[t.modifier] = (modScores[t.modifier] || 0) + weighted;
  });

  // ── EMERGENT GAS/FUEL ──
  // Gas is not a single terpene; it is the gestalt of pungent (caryophyllene),
  // citrus (limonene), and musky (myrcene/humulene) terpenes occurring TOGETHER
  // and in BALANCE — the Sour Diesel / Chemdawg signature. A flower dominated by
  // any single leg (pure caryophyllene = Spicy, pure limonene = Citrus, GG4 =
  // caryophyllene-led = Spicy) is intentionally NOT pushed into Gas; only a
  // balanced co-occurrence of all three legs tips a flower over to Gas.
  {
    const car = (values.caryophyllene || 0) * potencyOf(TERP_BY_KEY.caryophyllene);
    const lim = (values.limonene || 0) * potencyOf(TERP_BY_KEY.limonene);
    const mus = ((values.myrcene || 0) * potencyOf(TERP_BY_KEY.myrcene))
              + ((values.humulene || 0) * potencyOf(TERP_BY_KEY.humulene));
    if (car > 0 && lim > 0 && mus > 0) {
      const mn = Math.min(car, lim, mus), mx = Math.max(car, lim, mus);
      const balance = mn / mx;                 // 1.0 = perfectly balanced legs
      scores.gas_fuel += 1.5 * mn * Math.pow(balance, 1.5);
    }
  }

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  if (totalScore === 0) return null;

  const ranked = PROFILES
    .map(p => ({ ...p, score: scores[p.key], pct: Math.round((scores[p.key] / totalScore) * 100) }))
    .sort((a, b) => b.score - a.score);

  const modifiers = MODIFIERS
    .map(m => ({ ...m, score: modScores[m.key] || 0, active: (modScores[m.key] || 0) / totalScore > 0.05 }))
    .filter(m => m.active);

  // confidence: how dominant the top profile is over the runner-up
  const gap = ranked[0].pct - ranked[1].pct;
  const confidence = gap >= 22 ? "Defined" : gap >= 10 ? "Leaning" : "Blend";

  return { ranked, modifiers, totalScore, totalRaw, totalTerp:totalRaw, activeCount, confidence, gap, source:"engine" };
}
export function bandSegments(c){
  if(!c)return[];const r=c.ranked.filter(x=>x.pct>0);if(!r.length)return[];
  const lead=r[0].pct;const segs=r.filter(x=>x.pct>=lead*0.6).slice(0,3);
  const total=segs.reduce((a,s)=>a+s.pct,0)||1;
  return segs.map(s=>({key:s.key,color:s.color,label:s.label,short:s.short,frac:s.pct/total,pct:s.pct}));
}
export function blendName(c){const segs=bandSegments(c);if(segs.length<=1)return caps(shortOf(segs[0]?.key||c.ranked[0].key));return segs.slice(0,2).map(s=>caps(shortOf(s.key))).join("-");}
function caps(s){return s.charAt(0)+s.slice(1).toLowerCase();}
