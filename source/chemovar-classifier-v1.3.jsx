import { useState, useCallback, useMemo, useRef, useEffect } from "react";

const VERSION = "v1.3";
const BUILD = "06_18_2026";

/* ─────────────────────────────────────────────────────────────────────────
   FLOWER SPECTRUM · CHEMOVAR CLASSIFIER
   Merge of the Terpene Classifier engine + the Flower Spectrum taxonomy.
   - 10 core sensory profiles (Savory/Funk removed in v1.2 → folds into Gas/Fuel; Clean/Fresh is a modifier)
   - 38-terpene database, tiered: primary / impact / trace
   - Fingerprint: Spectrum mode (10 fixed profile sectors) + Detailed mode
     (individual primary/impact terpenes; trace terpenes grouped into per-profile buckets)
   ───────────────────────────────────────────────────────────────────────── */

// ── 10 CORE PROFILES (Flower Spectrum tokens) ──
const PROFILES = [
  { key:"gas_fuel",      label:"Gas / Fuel",      color:"#C9A84C", desc:"Loud, pungent diesel & chemical funk — gassy, skunky, dank" },
  { key:"earthy_dank",   label:"Earthy / Dank",   color:"#6B8E5A", desc:"Deep, musky, soil, heavy body" },
  { key:"citrus_bright", label:"Citrus / Bright", color:"#D4A843", desc:"Zesty lemon-orange, uplifting" },
  { key:"fruity_sweet",  label:"Fruity / Sweet",  color:"#B75F4A", desc:"Juicy, candy, ripe stone fruit" },
  { key:"floral_soft",   label:"Floral / Soft",   color:"#B98BBE", desc:"Lavender, rose, perfume, soft" },
  { key:"dessert_creamy",label:"Dessert / Creamy",color:"#D6B58A", desc:"Vanilla, cake, rich, smooth" },
  { key:"spicy_warm",    label:"Spicy / Warm",    color:"#9E6B4A", desc:"Pepper, clove, warm spice" },
  { key:"piney_fresh",   label:"Piney / Fresh",   color:"#4F7A5B", desc:"Pine, fir, crisp, resinous" },
  { key:"herbal_woody",  label:"Herbal / Woody",  color:"#7FA688", desc:"Tea, sage, dry wood, hops" },
  { key:"tropical_tangy",label:"Tropical / Tangy",color:"#D28B49", desc:"Mango, guava, exotic, tangy" },
];
const PROFILE_BY_KEY = Object.fromEntries(PROFILES.map(p => [p.key, p]));
const profileIndex = k => PROFILES.findIndex(p => p.key === k);

// ── MODIFIERS (state tags, not core profiles) ──
const MODIFIERS = [
  { key:"clean_fresh", label:"Clean / Fresh", color:"#88A9B2", desc:"Cooling eucalyptus / mentholated lift" },
];
const MOD_BY_KEY = Object.fromEntries(MODIFIERS.map(m => [m.key, m]));

/* ── TERPENE DATABASE ──
   tier: primary | impact | trace
   profile: primary profile association · also[]: secondary associations
   potency: aromatic weight per unit % (defaults applied by tier if omitted)
   modifier: optional modifier key
*/
const TERPENES = [
  // ── PRIMARY ──
  { key:"myrcene", label:"Myrcene", abbr:"MYR", tier:"primary", profile:"earthy_dank", also:["gas_fuel","herbal_woody"],
    aroma:"Earthy, musky, ripe mango, clove", foundWith:["β-Caryophyllene","Limonene","α-Pinene"],
    impact:"Most abundant cannabis terpene; sets a heavy grounding base and amplifies overall aromatic weight." },
  { key:"limonene", label:"D-Limonene", abbr:"LIM", tier:"primary", profile:"citrus_bright", also:["fruity_sweet","gas_fuel"],
    aroma:"Citrus, lemon, orange peel", foundWith:["β-Caryophyllene","Myrcene","Terpinolene"],
    impact:"Defines bright citrus character; with caryophyllene and myrcene it turns the corner into gas." },
  { key:"caryophyllene", label:"β-Caryophyllene", abbr:"CAR", tier:"primary", profile:"spicy_warm", also:["gas_fuel"], potency:1.15,
    aroma:"Black pepper, clove, warm wood", foundWith:["Humulene","Limonene","Myrcene"],
    impact:"The pepper backbone; aromatically loud, so even moderate levels drive a clear spice/gas lead." },
  { key:"linalool", label:"Linalool", abbr:"LIN", tier:"primary", profile:"floral_soft", also:["dessert_creamy"],
    aroma:"Lavender, floral, sweet spice", foundWith:["β-Caryophyllene","Limonene","Myrcene"],
    impact:"Potent at low levels; a little linalool softens and perfumes the whole profile.", potency:1.2 },
  { key:"pinene_a", label:"α-Pinene", abbr:"αPIN", tier:"primary", profile:"piney_fresh", also:["herbal_woody"],
    aroma:"Pine needle, fresh, sharp", foundWith:["β-Pinene","Myrcene","Terpinolene"],
    impact:"Crisp pine sharpness; cuts through heavier terpenes and reads as fresh and bright." },
  { key:"pinene_b", label:"β-Pinene", abbr:"βPIN", tier:"primary", profile:"piney_fresh", also:["herbal_woody"],
    aroma:"Pine, dill, woody-herbal", foundWith:["α-Pinene","Myrcene"],
    impact:"Pairs with α-pinene for forest character with a slightly more herbal, resinous edge." },
  { key:"terpinolene", label:"Terpinolene", abbr:"TPL", tier:"primary", profile:"fruity_sweet", also:["tropical_tangy","piney_fresh"],
    aroma:"Fruity, floral, piney, fresh", foundWith:["Myrcene","β-Ocimene","α-Pinene"],
    impact:"Complex and volatile; a terpinolene lead signals bright, fruity-fresh 'haze' character." },
  { key:"humulene", label:"α-Humulene", abbr:"HUM", tier:"primary", profile:"herbal_woody", also:["spicy_warm","earthy_dank","gas_fuel"],
    aroma:"Hops, woody, dry earth", foundWith:["β-Caryophyllene","Myrcene"],
    impact:"Travels with caryophyllene; adds a dry, hoppy woodiness and depth to gassy profiles." },
  { key:"ocimene", label:"β-Ocimene", abbr:"OCI", tier:"primary", profile:"tropical_tangy", also:["fruity_sweet","floral_soft"],
    aroma:"Sweet, herbal, tropical", foundWith:["Terpinolene","Limonene","Myrcene"],
    impact:"Sweet tropical lift; pushes a profile toward exotic, fruity-floral territory." },

  // ── IMPACT (minor, high quality impact) ──
  { key:"bisabolol", label:"α-Bisabolol", abbr:"BIS", tier:"impact", profile:"floral_soft", also:["dessert_creamy"],
    aroma:"Chamomile, soft floral, sweet", foundWith:["Linalool","β-Caryophyllene"],
    impact:"Smooth, delicate floral; a marker of refined, premium-feeling profiles.", potency:1.2 },
  { key:"valencene", label:"Valencene", abbr:"VAL", tier:"impact", profile:"citrus_bright", also:["tropical_tangy"],
    aroma:"Sweet orange, grapefruit", foundWith:["Limonene","Myrcene"],
    impact:"Juicy citrus top-note; lifts and rounds out limonene-forward profiles.", potency:1.2 },
  { key:"nerolidol", label:"trans-Nerolidol", abbr:"NER", tier:"impact", profile:"floral_soft", also:["herbal_woody"],
    aroma:"Apple, rose, woody bark", foundWith:["Linalool","β-Caryophyllene","Bisabolol"],
    impact:"Soft woody-floral bridge; adds depth and a fresh-bark finish.", potency:1.15 },
  { key:"guaiol", label:"Guaiol", abbr:"GUA", tier:"impact", profile:"herbal_woody", also:["piney_fresh"],
    aroma:"Pine, rose-wood, cooling", foundWith:["α-Humulene","α-Pinene"],
    impact:"Rare woody-cooling note; signals a distinctive, structured profile." },
  { key:"terpineol", label:"α-Terpineol", abbr:"TPN", tier:"impact", profile:"floral_soft", also:["piney_fresh"],
    aroma:"Lilac, pine, clove", foundWith:["α-Pinene","Linalool"],
    impact:"Soft lilac-pine; smooths transitions between floral and resinous notes." },
  { key:"caryophyllene_oxide", label:"Caryophyllene Oxide", abbr:"COX", tier:"impact", profile:"spicy_warm", also:["herbal_woody"],
    aroma:"Dry pepper, oxidized wood", foundWith:["β-Caryophyllene","α-Humulene"],
    impact:"Oxidation marker of caryophyllene; dry, savory-spice edge." },
  { key:"farnesene_b", label:"β-Farnesene", abbr:"βFAR", tier:"impact", profile:"fruity_sweet", also:["herbal_woody"], potency:0.3,
    aroma:"Green apple, woody, faint citrus", foundWith:["α-Farnesene","β-Caryophyllene","α-Humulene"],
    impact:"High-mass but aromatically quiet — can top a COA by quantity yet barely shape the nose. Low potency keeps it from hijacking the classification." },
  { key:"farnesene_a", label:"α-Farnesene", abbr:"αFAR", tier:"impact", profile:"fruity_sweet", also:["herbal_woody"], potency:0.3,
    aroma:"Green apple skin, woody, citrus", foundWith:["β-Farnesene","β-Caryophyllene"],
    impact:"Apple-skin top note found in many modern crosses; subtle even at high concentration." },
  { key:"camphene", label:"Camphene", abbr:"CMP", tier:"impact", profile:"piney_fresh", also:["herbal_woody"],
    aroma:"Damp fir, camphor", foundWith:["α-Pinene","Myrcene"],
    impact:"Cool resinous fir; deepens the piney structure." },
  { key:"carene", label:"Δ-3-Carene", abbr:"CRN", tier:"impact", profile:"piney_fresh", also:["citrus_bright"],
    aroma:"Sweet pine, cedar, lemon", foundWith:["α-Pinene","Limonene"],
    impact:"Sweet-resinous; bridges pine and citrus with a cedar finish." },
  { key:"geraniol", label:"Geraniol", abbr:"GER", tier:"impact", profile:"floral_soft", also:["fruity_sweet"],
    aroma:"Rose, geranium, sweet", foundWith:["Linalool","Limonene"],
    impact:"Bright rose-floral; potent and instantly recognizable.", potency:1.2 },
  { key:"fenchol", label:"Fenchol", abbr:"FEN", tier:"impact", profile:"herbal_woody", also:["piney_fresh"],
    aroma:"Basil, camphor, lemon-earth", foundWith:["α-Pinene","Camphene"],
    impact:"Earthy-herbal pivot; common in basil-leaning profiles." },
  { key:"borneol", label:"Borneol", abbr:"BOR", tier:"impact", profile:"herbal_woody", also:["piney_fresh"],
    aroma:"Camphor, mint, herbal", foundWith:["Camphene","α-Pinene"],
    impact:"Cooling camphor-herb; lends a medicinal-herbal crispness." },
  { key:"sabinene", label:"Sabinene", abbr:"SAB", tier:"impact", profile:"piney_fresh", also:["spicy_warm"],
    aroma:"Peppery, woody, citrus-spice", foundWith:["α-Pinene","γ-Terpinene"],
    impact:"Spicy-woody freshness; adds peppery complexity to pine." },
  { key:"pcymene", label:"p-Cymene", abbr:"CYM", tier:"impact", profile:"gas_fuel", also:["spicy_warm"], potency:0.85,
    aroma:"Pungent, solvent, citrus-spice", foundWith:["Limonene","γ-Terpinene","β-Caryophyllene"],
    impact:"A genuine gas marker, but usually present in small amounts — a confirming note, not the main driver of fuel character." },
  { key:"eucalyptol", label:"Eucalyptol", abbr:"EUC", tier:"impact", profile:"herbal_woody", also:["piney_fresh"], modifier:"clean_fresh",
    aroma:"Eucalyptus, mint, cooling", foundWith:["α-Pinene","Limonene"],
    impact:"Cooling lift; primary driver of the Clean / Fresh modifier.", potency:1.2 },

  // ── TRACE (super-minor, grouped by profile in the fingerprint) ──
  { key:"citronellol", label:"Citronellol", abbr:"CIT", tier:"trace", profile:"floral_soft", also:["fruity_sweet"],
    aroma:"Rose, citrus, soft floral", foundWith:["Geraniol","Linalool"],
    impact:"Trace rose-citrus nuance; rounds floral tops." },
  { key:"nerol", label:"Nerol", abbr:"NRL", tier:"trace", profile:"floral_soft", also:["citrus_bright"],
    aroma:"Sweet rose, fresh citrus", foundWith:["Geraniol","Citronellol"],
    impact:"Trace sweet-floral lift." },
  { key:"phytol", label:"Phytol", abbr:"PHY", tier:"trace", profile:"herbal_woody",
    aroma:"Balsamic, green, faint floral", foundWith:["(chlorophyll degradation)"],
    impact:"Trace green-balsamic; a backdrop note, not a lead." },
  { key:"isopulegol", label:"Isopulegol", abbr:"ISO", tier:"trace", profile:"herbal_woody", also:["piney_fresh"], modifier:"clean_fresh",
    aroma:"Mint, cooling, herbal", foundWith:["Pulegone","Menthol"],
    impact:"Trace minty-cool note; reinforces Clean / Fresh modifier." },
  { key:"pulegone", label:"Pulegone", abbr:"PUL", tier:"trace", profile:"herbal_woody", modifier:"clean_fresh",
    aroma:"Minty, camphor, herbal", foundWith:["Isopulegol","Menthol"],
    impact:"Trace mint-camphor; supports cooling character." },
  { key:"menthol", label:"Menthol", abbr:"MEN", tier:"trace", profile:"herbal_woody", modifier:"clean_fresh",
    aroma:"Cooling mint", foundWith:["Isopulegol","Pulegone"],
    impact:"Rare cooling trace; strong Clean / Fresh signal when present." },
  { key:"cedrene", label:"α-Cedrene", abbr:"CED", tier:"trace", profile:"herbal_woody",
    aroma:"Cedar, dry wood", foundWith:["Guaiol","α-Humulene"],
    impact:"Trace cedar nuance; deepens woody structure." },
  { key:"bergamotene", label:"α-Bergamotene", abbr:"BRG", tier:"trace", profile:"spicy_warm", also:["herbal_woody"],
    aroma:"Warm wood, faint tea", foundWith:["β-Caryophyllene","Farnesene"],
    impact:"Trace warm-wood spice." },
  { key:"phellandrene", label:"α-Phellandrene", abbr:"PHL", tier:"trace", profile:"citrus_bright", also:["herbal_woody"],
    aroma:"Mint-citrus, peppery", foundWith:["Limonene","γ-Terpinene"],
    impact:"Trace minty-citrus pepper." },
  { key:"gterpinene", label:"γ-Terpinene", abbr:"γTPN", tier:"trace", profile:"piney_fresh", also:["citrus_bright"],
    aroma:"Fresh, woody-citrus", foundWith:["Sabinene","p-Cymene"],
    impact:"Trace fresh-woody lift." },
  { key:"sabinene_hydrate", label:"Sabinene Hydrate", abbr:"SBH", tier:"trace", profile:"herbal_woody", also:["piney_fresh"],
    aroma:"Marjoram, fresh herb", foundWith:["Sabinene","γ-Terpinene"],
    impact:"Trace fresh-herb nuance." },
  { key:"geranyl_acetate", label:"Geranyl Acetate", abbr:"GAC", tier:"trace", profile:"floral_soft", also:["fruity_sweet"],
    aroma:"Rose, sweet fruit, floral ester", foundWith:["Geraniol","Linalool"],
    impact:"Trace sweet-rose ester; lifts floral and candied tops." },
  { key:"aterpinene", label:"α-Terpinene", abbr:"αTPN", tier:"trace", profile:"piney_fresh", also:["citrus_bright"],
    aroma:"Fresh citrus, woody-pine", foundWith:["γ-Terpinene","Sabinene","p-Cymene"],
    impact:"Trace fresh-citrus pine; common alongside terpinolene." },
];
const TERP_BY_KEY = Object.fromEntries(TERPENES.map(t => [t.key, t]));
const TIER_RANK = { primary:0, impact:1, trace:2 };
const POTENCY_DEFAULT = { primary:1.0, impact:1.1, trace:0.7 };
const potencyOf = t => (t.potency != null ? t.potency : POTENCY_DEFAULT[t.tier]);

// ── PROFILE CONTRIBUTION (auto-derived from profile + also[]) ──
function contribOf(t) {
  const c = {};
  c[t.profile] = 0.7;
  (t.also || []).forEach((p, i) => { c[p] = i === 0 ? 0.2 : 0.1; });
  const s = Object.values(c).reduce((a, b) => a + b, 0);
  Object.keys(c).forEach(k => c[k] = c[k] / s);
  return c;
}

// ── CLASSIFY ──
function classify(values) {
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

  return { ranked, modifiers, totalScore, totalRaw, activeCount, confidence };
}

// ── color shade helper ──
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (amt >= 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  else { r *= (1 + amt); g *= (1 + amt); b *= (1 + amt); }
  const h = x => Math.round(x).toString(16).padStart(2, "0");
  return "#" + h(r) + h(g) + h(b);
}

// ─────────────────────────────────────────────────────────────────────────
//  FINGERPRINT
// ─────────────────────────────────────────────────────────────────────────

function wedgePath(cx, cy, innerR, outerR, sa, ea) {
  const f = v => v.toFixed(2);
  const x1 = cx + innerR * Math.cos(sa), y1 = cy + innerR * Math.sin(sa);
  const x2 = cx + outerR * Math.cos(sa), y2 = cy + outerR * Math.sin(sa);
  const x3 = cx + outerR * Math.cos(ea), y3 = cy + outerR * Math.sin(ea);
  const x4 = cx + innerR * Math.cos(ea), y4 = cy + innerR * Math.sin(ea);
  return `M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)} A${f(outerR)} ${f(outerR)} 0 0 1 ${f(x3)} ${f(y3)} L${f(x4)} ${f(y4)} A${f(innerR)} ${f(innerR)} 0 0 0 ${f(x1)} ${f(y1)} Z`;
}

// Build detailed-mode segments: individual primary/impact terpenes + per-profile trace buckets
function buildDetailedSegments(values) {
  const indiv = [];
  const buckets = {};
  TERPENES.forEach(t => {
    const v = values[t.key] || 0;
    if (v <= 0.0001) return;
    const w = v * potencyOf(t);
    if (t.tier === "trace") {
      buckets[t.profile] = (buckets[t.profile] || 0) + w;
    } else {
      indiv.push({
        id: t.key, label: t.label, profile: t.profile, tier: t.tier,
        value: v, weight: w, color: shade(PROFILE_BY_KEY[t.profile].color, t.tier === "impact" ? 0.16 : 0),
        isBucket: false,
      });
    }
  });
  const bucketSegs = Object.entries(buckets).map(([pk, w]) => ({
    id: "trace_" + pk, label: PROFILE_BY_KEY[pk].label + " trace", profile: pk, tier: "trace",
    value: null, weight: w, color: shade(PROFILE_BY_KEY[pk].color, -0.2), isBucket: true,
  }));
  const segs = [...indiv, ...bucketSegs];
  segs.sort((a, b) =>
    profileIndex(a.profile) - profileIndex(b.profile) ||
    TIER_RANK[a.tier] - TIER_RANK[b.tier] ||
    b.weight - a.weight
  );
  return segs;
}

function Fingerprint({ values, result, mode, size = 200, interactive = false }) {
  const [hov, setHov] = useState(null);
  const cx = size / 2, cy = size / 2;
  const maxR = size * 0.44, minR = size * 0.12;
  const guides = [0.25, 0.5, 0.75].map(f => minR + f * (maxR - minR));

  let segments = [];
  if (mode === "spectrum") {
    const maxPct = result ? Math.max(...result.ranked.map(r => r.pct), 1) : 1;
    const n = PROFILES.length;
    const slice = (Math.PI * 2) / n;
    const gap = 0.05;
    segments = PROFILES.map((p, i) => {
      const pct = result ? (result.ranked.find(r => r.key === p.key)?.pct || 0) : 0;
      const sa = -Math.PI / 2 + i * slice + gap / 2;
      const ea = -Math.PI / 2 + (i + 1) * slice - gap / 2;
      return {
        id: p.key, label: p.label, color: p.color, isBucket: false,
        r: minR + (pct / maxPct) * (maxR - minR), sa, ea, mid: (sa + ea) / 2,
        sub: pct + "%", has: pct > 0.5,
      };
    });
  } else {
    const segs = buildDetailedSegments(values);
    if (segs.length) {
      const widthOf = s => s.tier === "primary" ? 1.0 : s.tier === "impact" ? 0.62 : 0.45;
      const totalW = segs.reduce((a, s) => a + widthOf(s), 0);
      const maxW = Math.max(...segs.map(s => s.weight), 0.0001);
      let angle = -Math.PI / 2;
      segments = segs.map(s => {
        const arc = (widthOf(s) / totalW) * Math.PI * 2;
        const g = Math.min(0.045, arc * 0.28);
        const sa = angle + g / 2, ea = angle + arc - g / 2;
        angle += arc;
        return {
          ...s, sa, ea, mid: (sa + ea) / 2,
          r: minR + (s.weight / maxW) * (maxR - minR),
          sub: s.isBucket ? "trace" : (s.value != null ? s.value.toFixed(2) + "%" : ""),
          has: true,
        };
      });
    }
  }

  const hovSeg = segments.find(s => s.id === hov);

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display:"block", overflow:"visible" }}>
        {guides.map((r, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke="#2a2824" strokeWidth={0.5} strokeDasharray="2 4" opacity={0.6} />
        ))}
        <circle cx={cx} cy={cy} r={maxR} fill="none" stroke="#2a2824" strokeWidth={0.8} />
        <circle cx={cx} cy={cy} r={minR} fill="none" stroke="#2a2824" strokeWidth={0.5} />

        {segments.map(s => {
          const isHov = hov === s.id;
          const drawR = s.has ? s.r : minR + size * 0.025;
          return (
            <g key={s.id}
              onMouseEnter={interactive ? () => setHov(s.id) : undefined}
              onMouseLeave={interactive ? () => setHov(null) : undefined}
              style={{ cursor: interactive ? "pointer" : "default" }}>
              <path d={wedgePath(cx, cy, minR, drawR, s.sa, s.ea)} fill={s.color}
                opacity={s.has ? (isHov ? 1 : (s.isBucket ? 0.55 : 0.82)) : 0.16}
                stroke={s.isBucket ? s.color : "none"} strokeWidth={s.isBucket ? 0.5 : 0}
                strokeDasharray={s.isBucket ? "2 2" : "0"} style={{ transition:"opacity 0.12s" }} />
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={size * 0.026}
          fill={result ? result.ranked[0].color : "#3a3830"} opacity={0.9} />
      </svg>

      {/* hover readout */}
      <div style={{ minHeight: 18, marginTop: 8, textAlign:"center" }}>
        {hovSeg ? (
          <span style={{ fontFamily:"var(--mono)", fontSize: 11, color: hovSeg.color }}>
            {hovSeg.label}{hovSeg.sub ? " · " + hovSeg.sub : ""}
          </span>
        ) : (
          <span style={{ fontFamily:"var(--mono)", fontSize: 9, color:"var(--muted)", textTransform:"uppercase", letterSpacing: 1.5 }}>
            {mode === "spectrum" ? `${PROFILES.length} profile sectors` : "terpene detail · trace grouped by profile"}
          </span>
        )}
      </div>
    </div>
  );
}

// ── SPECTRUM STRIP (legend) ──
function SpectrumStrip({ result }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap: 6 }}>
      {PROFILES.map(p => {
        const pct = result ? (result.ranked.find(r => r.key === p.key)?.pct || 0) : 0;
        const on = pct > 4;
        return (
          <div key={p.key} title={p.desc} style={{
            display:"flex", alignItems:"center", gap: 6, padding:"4px 9px",
            border:`1px solid ${on ? p.color : "var(--border)"}`, borderRadius: 20,
            opacity: on ? 1 : 0.45, transition:"all 0.2s",
          }}>
            <span style={{ width: 8, height: 8, borderRadius:"50%", background: p.color }} />
            <span style={{ fontFamily:"var(--mono)", fontSize: 10, color:"var(--fg-dim)", letterSpacing: 0.5 }}>{p.label}</span>
            {on && <span style={{ fontFamily:"var(--mono)", fontSize: 10, color: p.color, fontWeight: 700 }}>{pct}%</span>}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
//  CHEMOVAR CARD
// ─────────────────────────────────────────────────────────────────────────

function topTerpenes(values, n = 5) {
  return TERPENES
    .map(t => ({ t, v: values[t.key] || 0 }))
    .filter(x => x.v > 0)
    .sort((a, b) => b.v - a.v)
    .slice(0, n);
}

// Total terpene richness — a quality signal that rewards thorough testing (replaces a THC headline)
function richness(values) {
  const total = TERPENES.reduce((s, t) => s + (values[t.key] || 0), 0);
  const tier = total >= 2.5 ? { label: "Exceptional", color: "#4F7A5B" }
    : total >= 1.8 ? { label: "High", color: "#6B8E5A" }
    : total >= 1.2 ? { label: "Notable", color: "#A3785E" }
    : { label: "Standard", color: "#9a9080" };
  return { total, ...tier };
}

function buildCopy(values, result) {
  if (!result) return { shelf: "", retail: "", internal: "" };
  const [p1, p2, p3] = result.ranked;
  const tops = topTerpenes(values, 3);
  // Aromatic lead = potency-weighted, so a high-mass/low-odor terpene (e.g. farnesene) doesn't get named as the driver
  const aromaRank = TERPENES
    .map(t => ({ t, w: (values[t.key] || 0) * potencyOf(t) }))
    .filter(x => x.w > 0)
    .sort((a, b) => b.w - a.w);
  const lead = aromaRank[0]?.t.label || "—";
  const aromaWords = aromaRank.slice(0, 3).map(x => x.t.aroma.split(",")[0].toLowerCase());
  const mods = result.modifiers.map(m => m.label).join(", ");
  const shelf = `${p1.label.split(" / ")[0]}${p2.pct > 12 ? " · " + p2.label.split(" / ")[0] : ""}${result.modifiers.length ? " · " + result.modifiers[0].label.split(" / ")[0] : ""}`;
  const retail =
    `A ${p1.label.toLowerCase()} chemovar led by ${lead}, ` +
    `with ${p2.label.toLowerCase()} support` +
    (p3.pct > 8 ? ` and a ${p3.label.toLowerCase()} undertone` : "") + ". " +
    `Expect ${aromaWords.join(", ")} on the nose` +
    (mods ? `, finishing with a ${mods.toLowerCase()} lift.` : ".");
  const internal =
    `Primary ${p1.label} (${p1.pct}%) / Secondary ${p2.label} (${p2.pct}%) / Tertiary ${p3.label} (${p3.pct}%). ` +
    `Confidence: ${result.confidence}. Aromatic lead: ${lead}. Top by mass: ${tops.map(x => x.t.label).join(", ")}.` +
    (mods ? ` Modifiers: ${mods}.` : "");
  return { shelf, retail, internal };
}

function ChemovarCard({ name, producer, values, result, mode }) {
  if (!result) return (
    <div style={{ border:"1px dashed var(--border)", borderRadius: 12, padding: 32, textAlign:"center" }}>
      <div style={{ fontSize: 26, opacity: 0.2, marginBottom: 8 }}>◯</div>
      <div style={{ fontFamily:"var(--body)", fontSize: 13, color:"var(--muted)" }}>Load a cultivar or enter terpene values to generate a Chemovar Card</div>
    </div>
  );
  const [p1, p2, p3] = result.ranked;
  const copy = buildCopy(values, result);
  const tops = topTerpenes(values, 5);
  const backbone = TERPENES.filter(t => t.tier === "primary" && (values[t.key] || 0) > 0);
  const rich = richness(values);

  return (
    <div style={{ background:"var(--surface)", border:`1px solid ${p1.color}45`, borderRadius: 14, overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"18px 20px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap: 12 }}>
        <div>
          <div style={{ fontFamily:"var(--mono)", fontSize: 9, color:"var(--muted)", textTransform:"uppercase", letterSpacing: 2, marginBottom: 4 }}>Chemovar</div>
          <div style={{ fontFamily:"var(--display)", fontSize: 24, fontWeight: 700, color:"var(--fg)", lineHeight: 1.1 }}>{name || "Untitled Cultivar"}</div>
          {producer && <div style={{ fontFamily:"var(--body)", fontSize: 12, color:"var(--fg-dim)", fontStyle:"italic", marginTop: 3 }}>{producer}</div>}
        </div>
        <div style={{ textAlign:"right", flexShrink: 0 }}>
          <span style={{ display:"inline-block", padding:"4px 10px", borderRadius: 20, background: p1.color, color:"#13110c", fontFamily:"var(--mono)", fontSize: 10, fontWeight: 700, textTransform:"uppercase", letterSpacing: 0.5 }}>{p1.label}</span>
          <div style={{ fontFamily:"var(--mono)", fontSize: 9, color:"var(--muted)", marginTop: 6, textTransform:"uppercase", letterSpacing: 1 }}>Confidence · {result.confidence}</div>
          <div style={{ display:"flex", alignItems:"center", gap: 5, justifyContent:"flex-end", marginTop: 6 }}>
            <span style={{ fontFamily:"var(--mono)", fontSize: 12, fontWeight: 700, color:"var(--fg)" }}>{rich.total.toFixed(2)}%</span>
            <span style={{ fontFamily:"var(--mono)", fontSize: 8, fontWeight: 700, color:"#fff", background: rich.color, padding:"2px 6px", borderRadius: 3, textTransform:"uppercase", letterSpacing: 0.5 }}>{rich.label}</span>
          </div>
          <div style={{ fontFamily:"var(--mono)", fontSize: 7.5, color:"var(--muted)", marginTop: 2, textTransform:"uppercase", letterSpacing: 1 }}>Terpene Richness</div>
        </div>
      </div>

      {/* Fingerprint + classification */}
      <div style={{ display:"grid", gridTemplateColumns:"auto 1fr", gap: 18, padding: 20, alignItems:"center" }}>
        <Fingerprint values={values} result={result} mode={mode} size={150} />
        <div>
          <div style={{ fontFamily:"var(--mono)", fontSize: 9, color:"var(--muted)", textTransform:"uppercase", letterSpacing: 2, marginBottom: 10 }}>Classification</div>
          {[["Primary", p1], ["Secondary", p2], ["Tertiary", p3]].map(([role, p]) => (
            <div key={role} style={{ display:"flex", alignItems:"center", gap: 8, marginBottom: 7 }}>
              <span style={{ fontFamily:"var(--mono)", fontSize: 9, color:"var(--muted)", width: 64, flexShrink: 0, textTransform:"uppercase" }}>{role}</span>
              <span style={{ width: 8, height: 8, borderRadius:"50%", background: p.color, flexShrink: 0 }} />
              <span style={{ fontFamily:"var(--body)", fontSize: 13, color:"var(--fg)", fontWeight: 600, flex: 1 }}>{p.label}</span>
              <span style={{ fontFamily:"var(--mono)", fontSize: 11, color: p.color, fontWeight: 700 }}>{p.pct}%</span>
            </div>
          ))}
          {result.modifiers.length > 0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap: 6, marginTop: 10 }}>
              {result.modifiers.map(m => (
                <span key={m.key} style={{ padding:"3px 9px", borderRadius: 20, border:`1px solid ${m.color}`, color: m.color, fontFamily:"var(--mono)", fontSize: 9, textTransform:"uppercase", letterSpacing: 0.5 }}>+ {m.label}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown — full 10-profile spectrum */}
      <div style={{ padding:"0 20px 18px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom: 10 }}>
          <div style={{ fontFamily:"var(--mono)", fontSize: 9, color:"var(--muted)", textTransform:"uppercase", letterSpacing: 2 }}>Category Breakdown</div>
          <div style={{ fontFamily:"var(--mono)", fontSize: 8, color:"var(--muted)", letterSpacing: 0.5 }}>{PROFILES.length} profiles · sums to 100%</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap: 5 }}>
          {result.ranked.map((p, i) => {
            const pmax = result.ranked[0].pct || 1;
            const isPrimary = i === 0;
            return (
              <div key={p.key} style={{ display:"flex", alignItems:"center", gap: 8 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: p.color, flexShrink: 0, opacity: p.pct > 0 ? 1 : 0.3 }} />
                <span style={{ fontFamily:"var(--body)", fontSize: 12, color: p.pct > 0 ? "var(--fg-dim)" : "var(--muted)", width: 118, flexShrink: 0, fontWeight: isPrimary ? 700 : 400 }}>{p.label}</span>
                <div style={{ flex: 1, height: 7, background:"var(--bg)", borderRadius: 3, overflow:"hidden" }}>
                  <div style={{ height:"100%", width: `${(p.pct / pmax) * 100}%`, background: p.color, borderRadius: 3, opacity: isPrimary ? 1 : 0.7, transition:"width 0.3s" }} />
                </div>
                <span style={{ fontFamily:"var(--mono)", fontSize: 11, color: isPrimary ? p.color : "var(--muted)", fontWeight: isPrimary ? 700 : 500, width: 34, textAlign:"right" }}>{p.pct}%</span>
                {isPrimary && <span style={{ fontFamily:"var(--mono)", fontSize: 7, color:"var(--bg)", background: p.color, padding:"2px 5px", borderRadius: 3, textTransform:"uppercase", letterSpacing: 0.5, flexShrink: 0 }}>Primary</span>}
                {!isPrimary && <span style={{ width: 0 }} />}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 11, padding:"9px 12px", background:"var(--bg)", borderRadius: 8, fontFamily:"var(--body)", fontSize: 11.5, color:"var(--muted)", lineHeight: 1.55 }}>
          Every terpene votes across the profiles, weighted by how much is present and how loud it smells. The tallest bar is the flower's <strong style={{ color:"var(--fg-dim)" }}>primary profile</strong>. Its lead over the runner-up sets confidence:
          {" "}<strong style={{ color:"var(--fg-dim)" }}>{result.confidence}</strong>
          {" "}— {result.confidence === "Defined" ? "one profile clearly dominates." : result.confidence === "Leaning" ? "a clear lead, with real support underneath." : "two or more profiles sit close — a true blend."}
        </div>
      </div>

      {/* Data */}
      <div style={{ padding:"0 20px 16px" }}>
        <div style={{ fontFamily:"var(--mono)", fontSize: 9, color:"var(--muted)", textTransform:"uppercase", letterSpacing: 2, marginBottom: 8 }}>Top Terpenes</div>
        <div style={{ display:"flex", flexDirection:"column", gap: 4 }}>
          {tops.map(({ t, v }) => {
            const pmax = tops[0].v;
            return (
              <div key={t.key} style={{ display:"flex", alignItems:"center", gap: 8 }}>
                <span style={{ fontFamily:"var(--body)", fontSize: 12, color:"var(--fg-dim)", width: 120, flexShrink: 0 }}>{t.label}</span>
                <div style={{ flex: 1, height: 4, background:"var(--bg)", borderRadius: 2, overflow:"hidden" }}>
                  <div style={{ height:"100%", width: `${(v / pmax) * 100}%`, background: PROFILE_BY_KEY[t.profile].color, borderRadius: 2 }} />
                </div>
                <span style={{ fontFamily:"var(--mono)", fontSize: 11, color:"var(--muted)", width: 46, textAlign:"right" }}>{v.toFixed(2)}%</span>
                <span style={{ fontFamily:"var(--mono)", fontSize: 8, color:"var(--muted)", width: 52, textAlign:"right", textTransform:"uppercase" }}>{t.tier}</span>
              </div>
            );
          })}
        </div>
        <div style={{ fontFamily:"var(--mono)", fontSize: 10, color:"var(--muted)", marginTop: 12 }}>
          Structural backbone: {backbone.length ? backbone.map(t => t.label).join(" · ") : "—"}
        </div>
      </div>

      {/* Copy */}
      <div style={{ padding: 20, borderTop:"1px solid var(--border)", display:"flex", flexDirection:"column", gap: 12 }}>
        <div>
          <div style={{ fontFamily:"var(--mono)", fontSize: 9, color:"var(--muted)", textTransform:"uppercase", letterSpacing: 2, marginBottom: 5 }}>Shelf Tag</div>
          <div style={{ fontFamily:"var(--display)", fontSize: 16, color:"var(--fg)", fontStyle:"italic" }}>{copy.shelf}</div>
        </div>
        <div>
          <div style={{ fontFamily:"var(--mono)", fontSize: 9, color:"var(--muted)", textTransform:"uppercase", letterSpacing: 2, marginBottom: 5 }}>Retail Description</div>
          <div style={{ fontFamily:"var(--body)", fontSize: 13, color:"var(--fg-dim)", lineHeight: 1.6 }}>{copy.retail}</div>
        </div>
        <div>
          <div style={{ fontFamily:"var(--mono)", fontSize: 9, color:"var(--muted)", textTransform:"uppercase", letterSpacing: 2, marginBottom: 5 }}>Internal Notes</div>
          <div style={{ fontFamily:"var(--mono)", fontSize: 11, color:"var(--muted)", lineHeight: 1.6 }}>{copy.internal}</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
//  TERPENE REFERENCE CARDS
// ─────────────────────────────────────────────────────────────────────────

const TIER_LABEL = { primary:"Primary", impact:"High-Impact Minor", trace:"Trace" };

function TerpeneCard({ t }) {
  const p = PROFILE_BY_KEY[t.profile];
  return (
    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius: 10, padding: 14, borderLeft:`3px solid ${p.color}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap: 8 }}>
        <div>
          <div style={{ fontFamily:"var(--body)", fontSize: 14, fontWeight: 700, color:"var(--fg)" }}>{t.label}</div>
          <div style={{ fontFamily:"var(--body)", fontSize: 12, color:"var(--fg-dim)", lineHeight: 1.4, marginTop: 3 }}>{t.aroma}</div>
        </div>
        <span style={{
          flexShrink: 0, padding:"3px 8px", borderRadius: 6, fontFamily:"var(--mono)", fontSize: 8, textTransform:"uppercase", letterSpacing: 0.5,
          background: t.tier === "primary" ? p.color : "transparent",
          color: t.tier === "primary" ? "#13110c" : p.color,
          border: t.tier === "primary" ? "none" : `1px solid ${p.color}`,
        }}>{TIER_LABEL[t.tier]}</span>
      </div>

      <div style={{ display:"flex", alignItems:"center", gap: 6, marginTop: 10 }}>
        <span style={{ width: 8, height: 8, borderRadius:"50%", background: p.color }} />
        <span style={{ fontFamily:"var(--mono)", fontSize: 10, color: p.color, letterSpacing: 0.5 }}>{p.label}</span>
        {(t.also || []).map(a => (
          <span key={a} style={{ fontFamily:"var(--mono)", fontSize: 9, color:"var(--muted)" }}>· {PROFILE_BY_KEY[a].label}</span>
        ))}
        {t.modifier && (
          <span style={{ marginLeft:"auto", fontFamily:"var(--mono)", fontSize: 9, color: MOD_BY_KEY[t.modifier].color }}>+ {MOD_BY_KEY[t.modifier].label}</span>
        )}
      </div>

      <div style={{ marginTop: 10, fontFamily:"var(--body)", fontSize: 11, color:"var(--muted)", lineHeight: 1.5 }}>{t.impact}</div>

      <div style={{ marginTop: 10, paddingTop: 10, borderTop:"1px solid var(--border)" }}>
        <span style={{ fontFamily:"var(--mono)", fontSize: 8, color:"var(--muted)", textTransform:"uppercase", letterSpacing: 1 }}>Commonly found with</span>
        <div style={{ display:"flex", flexWrap:"wrap", gap: 4, marginTop: 5 }}>
          {t.foundWith.map(f => (
            <span key={f} style={{ fontFamily:"var(--mono)", fontSize: 9, color:"var(--fg-dim)", padding:"2px 7px", border:"1px solid var(--border)", borderRadius: 4 }}>{f}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function TerpeneLibrary() {
  const [filter, setFilter] = useState("all");
  const tiers = ["all", "primary", "impact", "trace"];
  const list = filter === "all" ? TERPENES : TERPENES.filter(t => t.tier === filter);
  return (
    <div>
      <div style={{ display:"flex", gap: 6, marginBottom: 16, flexWrap:"wrap" }}>
        {tiers.map(tr => (
          <button key={tr} onClick={() => setFilter(tr)} style={{
            padding:"6px 12px", borderRadius: 6, cursor:"pointer",
            background: filter === tr ? "var(--accent)" : "transparent",
            border:`1px solid ${filter === tr ? "var(--accent)" : "var(--border)"}`,
            color: filter === tr ? "var(--bg)" : "var(--muted)",
            fontFamily:"var(--body)", fontSize: 12, fontWeight: 600, textTransform:"capitalize",
          }}>{tr === "impact" ? "High-Impact" : tr} {tr !== "all" ? `· ${TERPENES.filter(t => t.tier === tr).length}` : `· ${TERPENES.length}`}</button>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
        {list.map(t => <TerpeneCard key={t.key} t={t} />)}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
//  INPUT PANEL
// ─────────────────────────────────────────────────────────────────────────

const SLIDER_MAX = { flower: 1.5, live_resin: 20 };

// ── REAL COA DATA ── Ideal Cannabis (Leafly-certified, 2021); Do Si Dos = 2025 compliance panel.
// Mass %, <LOQ omitted. Producer surfaced to credit farms that test for terpenes.
const FLOWER_PRESETS = [
  { name:"Gorilla Glue #4", producer:"Ideal Cannabis", lot:"GG4 063021", harvest:"06.30.2021",
    values:{ caryophyllene:0.75, farnesene_b:0.93, farnesene_a:0.32, myrcene:0.43, limonene:0.48, nerolidol:0.30, humulene:0.21, linalool:0.12, bisabolol:0.11, valencene:0.10, pinene_b:0.07, pinene_a:0.04, fenchol:0.06, terpineol:0.06, geranyl_acetate:0.03, phytol:0.03 }},
  { name:"Meat Stomper", producer:"Ideal Cannabis", lot:"MS 030221", harvest:"03.02.2021",
    values:{ myrcene:0.97, linalool:0.31, caryophyllene:0.24, limonene:0.20, nerolidol:0.15, farnesene_a:0.10, humulene:0.09, ocimene:0.07, valencene:0.04, pinene_b:0.04, phytol:0.04, farnesene_b:0.03 }},
  { name:"Positive Mental Attitude", producer:"Ideal Cannabis", lot:"PMA 040921", harvest:"04.09.2021",
    values:{ terpinolene:1.15, myrcene:0.40, limonene:0.34, farnesene_b:0.37, pinene_b:0.12, caryophyllene:0.10, nerolidol:0.08, pinene_a:0.07, phellandrene:0.06, farnesene_a:0.06, humulene:0.05, terpineol:0.05, aterpinene:0.04, carene:0.04, fenchol:0.03, bisabolol:0.03, valencene:0.03, phytol:0.04 }},
  { name:"Cascade Orange", producer:"Ideal Cannabis", lot:"CO 041621", harvest:"04.16.2021",
    values:{ terpinolene:0.74, limonene:0.33, myrcene:0.29, caryophyllene:0.11, nerolidol:0.10, pinene_b:0.09, pinene_a:0.07, terpineol:0.07, ocimene:0.05, farnesene_b:0.05, farnesene_a:0.05, humulene:0.04, fenchol:0.04, phytol:0.04, aterpinene:0.03, phellandrene:0.03, bisabolol:0.03 }},
  { name:"Layer Cake", producer:"Ideal Cannabis", lot:"LC 051221", harvest:"05.05.2021",
    values:{ limonene:0.88, myrcene:0.48, caryophyllene:0.27, nerolidol:0.16, terpinolene:0.15, pinene_b:0.13, farnesene_a:0.12, humulene:0.10, fenchol:0.09, terpineol:0.09, pinene_a:0.08, valencene:0.04, phytol:0.03, bisabolol:0.03 }},
  { name:"Mt. Hood Magic", producer:"Ideal Cannabis", lot:"MHM 051221", harvest:"05.12.2021",
    values:{ terpinolene:1.05, caryophyllene:0.43, myrcene:0.29, farnesene_b:0.25, limonene:0.22, ocimene:0.22, farnesene_a:0.21, humulene:0.17, pinene_b:0.11, bisabolol:0.07, pinene_a:0.06, valencene:0.05, phellandrene:0.05, aterpinene:0.04, terpineol:0.04, nerolidol:0.04, carene:0.04, phytol:0.03 }},
  { name:"Wedding Cake Gelato", producer:"Ideal Cannabis", lot:"WCG 051221", harvest:"05.12.2021",
    values:{ caryophyllene:0.86, farnesene_b:0.58, limonene:0.42, farnesene_a:0.39, humulene:0.28, nerolidol:0.27, myrcene:0.20, valencene:0.08, pinene_b:0.08, terpinolene:0.08, fenchol:0.07, terpineol:0.07, pinene_a:0.06, ocimene:0.05, geranyl_acetate:0.04, phytol:0.04 }},
  { name:"Do Si Dos", producer:"Certified Cannabis", lot:"CTNY-251114-001", harvest:"12.01.2025",
    values:{ caryophyllene:1.03, limonene:0.45, linalool:0.31, humulene:0.30, bisabolol:0.16, farnesene_b:0.09, myrcene:0.08, pinene_b:0.07, fenchol:0.05, terpineol:0.04, pinene_a:0.03 }},
];
// Live-resin presets are illustrative (≈10x flower) — replace with real concentrate COAs before retail use.
const LIVE_RESIN_PRESETS = [
  { name:"GG4 (illustrative)", producer:"—", values:{ caryophyllene:7.5, farnesene_b:9.3, farnesene_a:3.2, myrcene:4.3, limonene:4.8, nerolidol:3.0, humulene:2.1, linalool:1.2, bisabolol:1.1 }},
  { name:"Wedding Cake Gelato (illustrative)", producer:"—", values:{ caryophyllene:8.6, farnesene_b:5.8, limonene:4.2, farnesene_a:3.9, humulene:2.8, nerolidol:2.7, myrcene:2.0 }},
  { name:"Mt. Hood Magic (illustrative)", producer:"—", values:{ terpinolene:10.5, caryophyllene:4.3, myrcene:2.9, farnesene_b:2.5, limonene:2.2, ocimene:2.2, farnesene_a:2.1 }},
  { name:"Layer Cake (illustrative)", producer:"—", values:{ limonene:8.8, myrcene:4.8, caryophyllene:2.7, nerolidol:1.6, terpinolene:1.5, pinene_b:1.3 }},
];

function useBreakpoint() {
  const [bp, setBp] = useState("desktop");
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      setBp(w < 640 ? "mobile" : w < 1024 ? "tablet" : "desktop");
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  return bp;
}

function TierSliders({ tier, values, onChange, mode, open, onToggle }) {
  const list = TERPENES.filter(t => t.tier === tier);
  const activeCount = list.filter(t => (values[t.key] || 0) > 0).length;
  const max = SLIDER_MAX[mode];
  return (
    <div style={{ marginBottom: 12, border:"1px solid var(--border)", borderRadius: 10, overflow:"hidden" }}>
      <button onClick={onToggle} style={{
        width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"12px 14px", background:"var(--surface)", border:"none", cursor:"pointer",
      }}>
        <span style={{ fontFamily:"var(--mono)", fontSize: 11, color:"var(--fg)", textTransform:"uppercase", letterSpacing: 1.5 }}>
          {TIER_LABEL[tier]} <span style={{ color:"var(--muted)" }}>· {list.length}</span>
          {activeCount > 0 && <span style={{ color:"var(--accent)" }}>  ({activeCount} active)</span>}
        </span>
        <span style={{ fontFamily:"var(--mono)", fontSize: 12, color:"var(--muted)" }}>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div style={{ padding:"12px 14px", borderTop:"1px solid var(--border)" }}>
          {list.map(t => {
            const v = values[t.key] || 0;
            const p = PROFILE_BY_KEY[t.profile];
            const pct = (v / max) * 100;
            return (
              <div key={t.key} style={{ marginBottom: 11 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 3 }}>
                  <div style={{ display:"flex", alignItems:"center", gap: 7 }}>
                    <span style={{ width: 6, height: 6, borderRadius:"50%", background: p.color, flexShrink: 0 }} />
                    <span style={{ fontFamily:"var(--body)", fontSize: 12, color:"var(--fg-dim)" }}>{t.label}</span>
                  </div>
                  <span style={{ fontFamily:"var(--mono)", fontSize: 10, color:"var(--muted)" }}>{mode === "live_resin" ? v.toFixed(1) : v.toFixed(2)}%</span>
                </div>
                <div style={{ position:"relative", height: 3, background:"var(--bg)", borderRadius: 2 }}>
                  <div style={{ position:"absolute", height:"100%", width: `${pct}%`, background: p.color, borderRadius: 2 }} />
                </div>
                <input type="range" min="0" max={max} step={mode === "live_resin" ? 0.1 : 0.01} value={v}
                  onChange={e => onChange(t.key, parseFloat(e.target.value))}
                  style={{ width:"100%", marginTop: 3, accentColor: p.color, cursor:"pointer", height: 13, opacity: 0.7 }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── CSV EXPORT ──
function buildCSV(name, producer, values, result, mode) {
  const rich = richness(values);
  const lines = [];
  lines.push(`Flower Spectrum Chemovar Classifier,${VERSION}`);
  lines.push(`Cultivar,${(name || "Untitled").replace(/,/g, " ")}`);
  lines.push(`Producer,${(producer || "-").replace(/,/g, " ")}`);
  lines.push(`Mode,${mode}`);
  lines.push(`Build,${BUILD}`);
  lines.push("");
  lines.push("Terpene,Tier,Primary Profile,Value %");
  TERPENES.forEach(t => {
    const v = values[t.key] || 0;
    if (v > 0) lines.push(`${t.label},${t.tier},${PROFILE_BY_KEY[t.profile].label},${v.toFixed(3)}`);
  });
  lines.push("");
  lines.push("Profile,Score %");
  if (result) result.ranked.forEach(r => lines.push(`${r.label},${r.pct}`));
  lines.push("");
  lines.push(`Total Terpenes %,${rich.total.toFixed(2)}`);
  lines.push(`Terpene Richness,${rich.label}`);
  lines.push(`Confidence,${result ? result.confidence : "-"}`);
  lines.push(`Modifiers,${result ? result.modifiers.map(m => m.label).join(" | ") || "none" : "-"}`);
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────
//  COMPARISON  (v1.3 — additive; the classification path above is untouched)
//  Pin 2–4 chemovars → side-by-side fingerprints, an aligned profile matrix on
//  a shared scale, divergence readout, and a top-terpene comparison.
// ─────────────────────────────────────────────────────────────────────────

const MAX_PINS = 4;

// Compact "Spicy-Gas" style label from a result's top profiles.
function comboLabel(result) {
  if (!result) return "—";
  const short = p => p.label.split(" / ")[0];
  if (result.confidence === "Defined") return short(result.ranked[0]);
  return short(result.ranked[0]) + "-" + short(result.ranked[1]);
}

// Potency-weighted aromatic lead (mirrors buildCopy's lead logic, kept local so
// a high-mass/low-odor terpene like β-Farnesene is never named as the driver).
function aromaticLead(values) {
  const ranked = TERPENES
    .map(t => ({ t, w: (values[t.key] || 0) * potencyOf(t) }))
    .filter(x => x.w > 0)
    .sort((a, b) => b.w - a.w);
  return ranked[0]?.t.label || "—";
}

const pctOf = (pin, key) => pin.result ? (pin.result.ranked.find(r => r.key === key)?.pct || 0) : 0;

// One pinned chemovar: identity, blend tag, confidence, fingerprint, richness, lead.
function CompareColumn({ pin, onRemove }) {
  const result = pin.result;
  const p1 = result ? result.ranked[0] : null;
  const rich = richness(pin.values);
  return (
    <div style={{ flex:"1 1 210px", minWidth: 200, maxWidth: 300, background:"var(--surface)", border:`1px solid ${p1 ? p1.color + "45" : "var(--border)"}`, borderRadius: 12, padding: 16, position:"relative" }}>
      <button onClick={onRemove} title="Remove from comparison" style={{ position:"absolute", top: 10, right: 10, width: 22, height: 22, borderRadius: 6, border:"1px solid var(--border)", background:"var(--bg)", color:"var(--muted)", cursor:"pointer", fontSize: 14, lineHeight: 1, fontFamily:"var(--mono)" }}>×</button>
      <div style={{ fontFamily:"var(--display)", fontSize: 17, fontWeight: 700, color:"var(--fg)", lineHeight: 1.15, paddingRight: 26 }}>{pin.name || "Untitled"}</div>
      {pin.producer && <div style={{ fontFamily:"var(--body)", fontSize: 11, color:"var(--fg-dim)", fontStyle:"italic", marginTop: 2 }}>{pin.producer}</div>}
      {p1 && (
        <div style={{ display:"flex", alignItems:"center", gap: 6, flexWrap:"wrap", marginTop: 9 }}>
          <span style={{ padding:"3px 9px", borderRadius: 20, background: p1.color, color:"#13110c", fontFamily:"var(--mono)", fontSize: 9, fontWeight: 700, textTransform:"uppercase", letterSpacing: 0.5 }}>{comboLabel(result)}</span>
          <span style={{ fontFamily:"var(--mono)", fontSize: 9, color:"var(--muted)", textTransform:"uppercase", letterSpacing: 1 }}>{result.confidence}</span>
        </div>
      )}
      <div style={{ display:"flex", justifyContent:"center", marginTop: 8 }}>
        <Fingerprint values={pin.values} result={result} mode="spectrum" size={150} />
      </div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop: 4, paddingTop: 10, borderTop:"1px solid var(--border)" }}>
        <span style={{ fontFamily:"var(--mono)", fontSize: 9, color:"var(--muted)", textTransform:"uppercase", letterSpacing: 1 }}>Richness</span>
        <span style={{ display:"flex", alignItems:"center", gap: 5 }}>
          <span style={{ fontFamily:"var(--mono)", fontSize: 11, fontWeight: 700, color:"var(--fg)" }}>{rich.total.toFixed(2)}%</span>
          <span style={{ fontFamily:"var(--mono)", fontSize: 7.5, fontWeight: 700, color:"#fff", background: rich.color, padding:"2px 5px", borderRadius: 3, textTransform:"uppercase", letterSpacing: 0.5 }}>{rich.label}</span>
        </span>
      </div>
      <div style={{ marginTop: 9 }}>
        <span style={{ fontFamily:"var(--mono)", fontSize: 9, color:"var(--muted)", textTransform:"uppercase", letterSpacing: 1 }}>Aromatic lead</span>
        <div style={{ fontFamily:"var(--body)", fontSize: 12, color:"var(--fg-dim)", marginTop: 2 }}>{aromaticLead(pin.values)}</div>
      </div>
    </div>
  );
}

// 10-profile matrix, profiles as rows, pins as columns, shared scale across the
// whole grid so bar lengths are directly comparable. Each pin's primary profile
// cell is highlighted; the most-divergent row is flagged.
function ProfileMatrix({ pins }) {
  const globalMax = Math.max(1, ...pins.flatMap(pin => PROFILES.map(p => pctOf(pin, p.key))));
  const spreads = PROFILES.map(p => {
    const vals = pins.map(pin => pctOf(pin, p.key));
    return { key: p.key, spread: Math.max(...vals) - Math.min(...vals) };
  });
  const maxSpread = Math.max(0, ...spreads.map(s => s.spread));
  const divKeys = maxSpread > 0 ? spreads.filter(s => s.spread === maxSpread).map(s => s.key) : [];
  const divLabel = divKeys.length ? PROFILE_BY_KEY[divKeys[0]].label : null;
  const LABEL_W = 148;

  return (
    <div>
      {divLabel && (
        <div style={{ display:"inline-flex", alignItems:"center", gap: 8, marginBottom: 14, padding:"7px 12px", border:"1px solid var(--border)", borderLeft:`2px solid ${PROFILE_BY_KEY[divKeys[0]].color}`, borderRadius:"0 8px 8px 0", background:"var(--surface)" }}>
          <span style={{ fontFamily:"var(--mono)", fontSize: 9, color:"var(--muted)", textTransform:"uppercase", letterSpacing: 1.5 }}>Largest divergence</span>
          <span style={{ fontFamily:"var(--body)", fontSize: 13, color:"var(--fg)", fontWeight: 600 }}>{divLabel}</span>
          <span style={{ fontFamily:"var(--mono)", fontSize: 11, color: PROFILE_BY_KEY[divKeys[0]].color, fontWeight: 700 }}>{maxSpread}% spread</span>
        </div>
      )}

      {/* header row: strain identities */}
      <div style={{ display:"flex", alignItems:"flex-end", gap: 10, marginBottom: 10 }}>
        <div style={{ width: LABEL_W, flexShrink: 0 }} />
        {pins.map(pin => {
          const c = pin.result ? pin.result.ranked[0].color : "var(--muted)";
          return (
            <div key={pin.id} style={{ flex: 1, minWidth: 0, display:"flex", alignItems:"center", gap: 6 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: c, flexShrink: 0 }} />
              <span style={{ fontFamily:"var(--body)", fontSize: 12, fontWeight: 600, color:"var(--fg)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{pin.name || "Untitled"}</span>
            </div>
          );
        })}
      </div>

      {/* profile rows */}
      <div style={{ display:"flex", flexDirection:"column", gap: 6 }}>
        {PROFILES.map(p => {
          const isDiv = divKeys.includes(p.key);
          return (
            <div key={p.key} style={{ display:"flex", alignItems:"center", gap: 10, padding:"3px 0", borderLeft: isDiv ? `2px solid ${p.color}` : "2px solid transparent", paddingLeft: 6 }}>
              <div style={{ width: LABEL_W - 6, flexShrink: 0, display:"flex", alignItems:"center", gap: 7 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: p.color, flexShrink: 0 }} />
                <span style={{ fontFamily:"var(--body)", fontSize: 12, color: isDiv ? "var(--fg)" : "var(--fg-dim)", fontWeight: isDiv ? 600 : 400 }}>{p.label}</span>
              </div>
              {pins.map(pin => {
                const pct = pctOf(pin, p.key);
                const isPrimary = pin.result && pin.result.ranked[0].key === p.key;
                return (
                  <div key={pin.id} style={{ flex: 1, minWidth: 0, display:"flex", alignItems:"center", gap: 7 }}>
                    <div style={{ flex: 1, height: 8, background:"var(--bg)", borderRadius: 3, overflow:"hidden" }}>
                      <div style={{ height:"100%", width: `${(pct / globalMax) * 100}%`, background: p.color, opacity: isPrimary ? 1 : 0.5, borderRadius: 3, transition:"width 0.3s" }} />
                    </div>
                    <span style={{ fontFamily:"var(--mono)", fontSize: 10.5, color: isPrimary ? p.color : "var(--muted)", fontWeight: isPrimary ? 700 : 500, width: 30, textAlign:"right", flexShrink: 0 }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 12, padding:"9px 12px", background:"var(--bg)", borderRadius: 8, fontFamily:"var(--body)", fontSize: 11.5, color:"var(--muted)", lineHeight: 1.55 }}>
        Bars share one scale across every pinned chemovar, so length is directly comparable column to column. A pin's <strong style={{ color:"var(--fg-dim)" }}>primary profile</strong> cell is shown at full strength; the flagged row is where these chemovars differ most.
      </div>
    </div>
  );
}

// Per-pin top-5 terpenes by mass — the structural backbone behind each fingerprint.
function TopTerpCompare({ pins }) {
  return (
    <div>
      <div style={{ fontFamily:"var(--mono)", fontSize: 9, color:"var(--muted)", textTransform:"uppercase", letterSpacing: 2, marginBottom: 12 }}>Top Terpenes by Mass</div>
      <div style={{ display:"flex", gap: 10, flexWrap:"wrap" }}>
        {pins.map(pin => {
          const tops = topTerpenes(pin.values, 5);
          const pmax = tops[0] ? tops[0].v : 1;
          const c = pin.result ? pin.result.ranked[0].color : "var(--muted)";
          return (
            <div key={pin.id} style={{ flex:"1 1 200px", minWidth: 190, maxWidth: 320, background:"var(--surface)", border:"1px solid var(--border)", borderRadius: 10, padding: 14 }}>
              <div style={{ display:"flex", alignItems:"center", gap: 7, marginBottom: 10 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: c, flexShrink: 0 }} />
                <span style={{ fontFamily:"var(--body)", fontSize: 13, fontWeight: 600, color:"var(--fg)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{pin.name || "Untitled"}</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap: 5 }}>
                {tops.map(({ t, v }) => (
                  <div key={t.key} style={{ display:"flex", alignItems:"center", gap: 7 }}>
                    <span style={{ fontFamily:"var(--body)", fontSize: 11.5, color:"var(--fg-dim)", width: 92, flexShrink: 0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t.label}</span>
                    <div style={{ flex: 1, height: 4, background:"var(--bg)", borderRadius: 2, overflow:"hidden" }}>
                      <div style={{ height:"100%", width: `${(v / pmax) * 100}%`, background: PROFILE_BY_KEY[t.profile].color, borderRadius: 2 }} />
                    </div>
                    <span style={{ fontFamily:"var(--mono)", fontSize: 10, color:"var(--muted)", width: 42, textAlign:"right", flexShrink: 0 }}>{v.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompareView({ pins, onRemove, onClear, onQuickAdd, pinnedNames }) {
  const remaining = MAX_PINS - pins.length;
  const quickAdds = FLOWER_PRESETS.filter(p => !pinnedNames.includes(p.name));

  return (
    <div>
      <SL>Side-by-Side Comparison</SL>
      <h1 style={{ fontFamily:"var(--display)", fontSize:"clamp(24px,4.5vw,38px)", fontWeight: 600, lineHeight: 1.1, margin:"0 0 12px", maxWidth: 760 }}>
        Pin two to four chemovars and read them against each other.
      </h1>
      <p style={{ fontFamily:"var(--body)", fontSize:"clamp(13px,2vw,15px)", color:"var(--fg-dim)", lineHeight: 1.6, maxWidth: 620, margin:"0 0 8px" }}>
        Pin the chemovar you're tuning from the Classifier, or quick-add a real Ideal Cannabis COA below. Fingerprints, the full {PROFILES.length}-profile breakdown on a shared scale, and the terpene backbone line up column to column.
      </p>

      {/* quick-add real COAs */}
      {remaining > 0 && quickAdds.length > 0 && (
        <div style={{ margin:"18px 0 6px" }}>
          <div style={{ fontFamily:"var(--mono)", fontSize: 9, color:"var(--muted)", textTransform:"uppercase", letterSpacing: 2, marginBottom: 8 }}>
            Quick-add COA · {remaining} slot{remaining === 1 ? "" : "s"} open
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap: 6 }}>
            {quickAdds.map(p => (
              <button key={p.name} onClick={() => onQuickAdd(p)} style={{
                padding:"6px 12px", borderRadius: 6, background:"var(--surface)", border:"1px solid var(--border)",
                color:"var(--fg-dim)", fontFamily:"var(--body)", fontSize: 12, cursor:"pointer", display:"flex", alignItems:"center", gap: 6,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--fg)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--fg-dim)"; }}
              ><span style={{ color:"var(--accent)" }}>+</span>{p.name}</button>
            ))}
          </div>
        </div>
      )}

      {pins.length === 0 ? (
        <div style={{ marginTop: 24, border:"1px dashed var(--border)", borderRadius: 12, padding: 40, textAlign:"center" }}>
          <div style={{ fontSize: 26, opacity: 0.2, marginBottom: 8 }}>◑◐</div>
          <div style={{ fontFamily:"var(--body)", fontSize: 14, color:"var(--muted)", lineHeight: 1.6 }}>
            No chemovars pinned yet. Quick-add a COA above, or head to the Classifier, load a cultivar, and hit <strong style={{ color:"var(--fg-dim)" }}>Pin to Compare</strong>.
          </div>
        </div>
      ) : (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", margin:"24px 0 12px" }}>
            <span style={{ fontFamily:"var(--mono)", fontSize: 9, color:"var(--muted)", textTransform:"uppercase", letterSpacing: 2 }}>{pins.length} pinned · max {MAX_PINS}</span>
            <button onClick={onClear} style={{ padding:"6px 12px", borderRadius: 6, background:"transparent", border:"1px solid var(--border)", color:"var(--muted)", fontFamily:"var(--body)", fontSize: 12, cursor:"pointer" }}>Clear all</button>
          </div>

          <div style={{ display:"flex", gap: 12, flexWrap:"wrap", alignItems:"stretch" }}>
            {pins.map(pin => <CompareColumn key={pin.id} pin={pin} onRemove={() => onRemove(pin.id)} />)}
          </div>

          {pins.length < 2 ? (
            <div style={{ marginTop: 18, padding:"10px 14px", border:"1px solid var(--border)", borderLeft:"2px solid var(--accent)", borderRadius:"0 8px 8px 0", fontFamily:"var(--body)", fontSize: 12.5, color:"var(--fg-dim)" }}>
              Pin at least one more chemovar to unlock the side-by-side profile matrix.
            </div>
          ) : (
            <>
              <HR />
              <SL>Profile Matrix</SL>
              <ST>Where they overlap, where they part.</ST>
              <ProfileMatrix pins={pins} />
              <HR />
              <TopTerpCompare pins={pins} />
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
//  ROOT
// ─────────────────────────────────────────────────────────────────────────

const SL = ({ children }) => <div style={{ fontFamily:"var(--mono)", fontSize: 10, textTransform:"uppercase", letterSpacing: 3, color:"var(--muted)", marginBottom: 12 }}>{children}</div>;
const ST = ({ children }) => <h2 style={{ fontFamily:"var(--display)", fontSize:"clamp(20px,4vw,28px)", fontWeight: 600, color:"var(--fg)", margin:"0 0 16px", lineHeight: 1.2 }}>{children}</h2>;
const HR = () => <div style={{ height: 1, background:"var(--border)", margin:"40px 0" }} />;

export default function App() {
  const bp = useBreakpoint();
  const [mode, setMode] = useState("flower");
  const [fpMode, setFpMode] = useState("spectrum");
  const [name, setName] = useState("Gorilla Glue #4");
  const [producer, setProducer] = useState("Ideal Cannabis");
  const [values, setValues] = useState(() => FLOWER_PRESETS[0].values);
  const [openTiers, setOpenTiers] = useState({ primary: true, impact: false, trace: false });
  const [csv, setCsv] = useState(null);
  const [view, setView] = useState("classify");
  const [pinned, setPinned] = useState([]);
  const pinId = useRef(1);

  const result = useMemo(() => classify(values), [values]);
  const presets = mode === "flower" ? FLOWER_PRESETS : LIVE_RESIN_PRESETS;
  const pinnedNames = pinned.map(p => p.name);
  const alreadyPinned = pinnedNames.includes(name);

  // Pins are snapshots: classify() is run at pin time and stored alongside the values.
  const addPin = useCallback((nm, prod, vals) => {
    setPinned(prev => prev.length >= MAX_PINS ? prev
      : [...prev, { id: pinId.current++, name: nm, producer: prod, values: { ...vals }, result: classify(vals) }]);
  }, []);
  const pinCurrent = useCallback(() => addPin(name || "Untitled", producer, values), [addPin, name, producer, values]);
  const pinPreset = useCallback(p => addPin(p.name, p.producer || "", p.values), [addPin]);
  const removePin = useCallback(id => setPinned(prev => prev.filter(p => p.id !== id)), []);
  const clearPins = useCallback(() => setPinned([]), []);

  const setVal = useCallback((k, v) => setValues(p => ({ ...p, [k]: v })), []);
  const loadPreset = useCallback(p => { setValues({ ...p.values }); setName(p.name); setProducer(p.producer || ""); }, []);
  const clearAll = useCallback(() => setValues({}), []);
  const toggleTier = useCallback(t => setOpenTiers(p => ({ ...p, [t]: !p[t] })), []);
  const switchMode = useCallback(m => { setMode(m); setValues({}); }, []);

  const cols = bp === "mobile" ? "1fr" : "minmax(0, 1.1fr) minmax(0, 1fr)";

  return (
    <div style={{
      "--bg":"#0e0e0c", "--surface":"#181816", "--border":"#2a2824",
      "--fg":"#e2ded6", "--fg-dim":"#a09a8e", "--muted":"#5e5a50",
      "--accent":"#6AAFA0",
      "--display":"'Newsreader',Georgia,serif",
      "--body":"'DM Sans',system-ui,sans-serif",
      "--mono":"'JetBrains Mono',monospace",
      minHeight:"100vh", background:"var(--bg)", color:"var(--fg)", fontFamily:"var(--body)", overflowX:"hidden",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;0,6..72,700;1,6..72,400&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        input[type=range]{-webkit-appearance:none;background:transparent}
        *{box-sizing:border-box}`}</style>

      {/* NAV */}
      <nav style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px clamp(16px,4vw,40px)", borderBottom:"1px solid var(--border)" }}>
        <div style={{ display:"flex", alignItems:"center", gap: 10 }}>
          <div style={{ display:"flex", gap: 2 }}>
            {PROFILES.slice(0, 6).map(p => <span key={p.key} style={{ width: 5, height: 14, background: p.color, borderRadius: 1 }} />)}
          </div>
          <span style={{ fontFamily:"var(--mono)", fontSize: 11, textTransform:"uppercase", letterSpacing: 2, color:"var(--fg-dim)" }}>Flower Spectrum</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap: 14 }}>
          <div style={{ display:"flex", background:"var(--surface)", border:"1px solid var(--border)", borderRadius: 7, padding: 2, gap: 2 }}>
            {[["classify","Classifier"],["compare", pinned.length ? `Compare · ${pinned.length}` : "Compare"]].map(([k, l]) => (
              <button key={k} onClick={() => setView(k)} style={{
                padding:"5px 12px", borderRadius: 5, border:"none", cursor:"pointer",
                background: view === k ? "var(--accent)" : "transparent",
                color: view === k ? "var(--bg)" : "var(--muted)",
                fontFamily:"var(--body)", fontSize: 11, fontWeight: 600,
              }}>{l}</button>
            ))}
          </div>
          <span style={{ fontFamily:"var(--mono)", fontSize: 10, color:"var(--muted)", letterSpacing: 1 }}>{VERSION}</span>
        </div>
      </nav>

      {view === "classify" && (
      <div style={{ padding:"clamp(24px,5vw,48px) clamp(16px,4vw,40px)", maxWidth: 1180, margin:"0 auto" }}>

        {/* HEADER */}
        <SL>Terpene Classification System</SL>
        <h1 style={{ fontFamily:"var(--display)", fontSize:"clamp(28px,5vw,44px)", fontWeight: 600, lineHeight: 1.1, margin:"0 0 14px", maxWidth: 760 }}>
          From COA terpene panel to a classified chemovar.
        </h1>
        <p style={{ fontFamily:"var(--body)", fontSize:"clamp(14px,2vw,16px)", color:"var(--fg-dim)", lineHeight: 1.6, maxWidth: 600, margin: 0 }}>
          Enter a terpene panel for flower or live resin. The engine maps {TERPENES.length} terpenes onto {PROFILES.length} sensory profiles, builds a fingerprint, and generates a Chemovar Card.
        </p>

        {/* Data provenance notice */}
        <div style={{ marginTop: 16, padding:"10px 14px", border:"1px solid var(--border)", borderLeft:"2px solid #6B8E5A", borderRadius:"0 8px 8px 0", fontFamily:"var(--body)", fontSize: 12, color:"var(--muted)", lineHeight: 1.5 }}>
          Flower presets use <strong style={{ color:"var(--fg-dim)" }}>real COA data</strong> from Ideal Cannabis (Leafly-certified, 2021) and a 2025 Do Si Dos compliance panel. Live-resin presets remain illustrative (≈10× flower) until real concentrate COAs are loaded.
        </div>

        <HR />

        {/* CONTROLS */}
        <div style={{ display:"flex", flexWrap:"wrap", gap: 16, alignItems:"flex-end", marginBottom: 24 }}>
          {/* mode */}
          <div>
            <div style={{ fontFamily:"var(--mono)", fontSize: 9, color:"var(--muted)", textTransform:"uppercase", letterSpacing: 2, marginBottom: 6 }}>Product Type</div>
            <div style={{ display:"flex", background:"var(--surface)", border:"1px solid var(--border)", borderRadius: 8, padding: 3, gap: 3 }}>
              {[["flower","🌿 Flower","0–1.5%"],["live_resin","💎 Live Resin","0–20%"]].map(([k, l, r]) => (
                <button key={k} onClick={() => switchMode(k)} style={{
                  padding:"7px 14px", borderRadius: 6, border:"none", cursor:"pointer",
                  background: mode === k ? "var(--accent)" : "transparent",
                  color: mode === k ? "var(--bg)" : "var(--muted)",
                  fontFamily:"var(--body)", fontSize: 12, fontWeight: 600,
                }}>
                  <div>{l}</div>
                  <div style={{ fontFamily:"var(--mono)", fontSize: 8, opacity: 0.7, marginTop: 1, color: mode === k ? "var(--bg)" : "var(--muted)" }}>{r}</div>
                </button>
              ))}
            </div>
          </div>
          {/* cultivar name */}
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontFamily:"var(--mono)", fontSize: 9, color:"var(--muted)", textTransform:"uppercase", letterSpacing: 2, marginBottom: 6 }}>Cultivar Name</div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Cultivar name"
              style={{ width:"100%", padding:"9px 12px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius: 8, color:"var(--fg)", fontFamily:"var(--body)", fontSize: 14 }} />
          </div>
          {/* producer */}
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontFamily:"var(--mono)", fontSize: 9, color:"var(--muted)", textTransform:"uppercase", letterSpacing: 2, marginBottom: 6 }}>Producer / Farm</div>
            <input value={producer} onChange={e => setProducer(e.target.value)} placeholder="Producer"
              style={{ width:"100%", padding:"9px 12px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius: 8, color:"var(--fg)", fontFamily:"var(--body)", fontSize: 14 }} />
          </div>
          {/* pin to compare */}
          <button onClick={pinCurrent} disabled={alreadyPinned || pinned.length >= MAX_PINS}
            title={pinned.length >= MAX_PINS ? "Comparison full (max 4)" : alreadyPinned ? "Already pinned" : "Add this chemovar to the comparison"} style={{
            padding:"9px 16px", borderRadius: 8, border:"1px solid var(--border)",
            background: (alreadyPinned || pinned.length >= MAX_PINS) ? "transparent" : "var(--accent)",
            color: (alreadyPinned || pinned.length >= MAX_PINS) ? "var(--muted)" : "var(--bg)",
            fontFamily:"var(--body)", fontSize: 13, fontWeight: 700,
            cursor: (alreadyPinned || pinned.length >= MAX_PINS) ? "default" : "pointer",
            opacity: (alreadyPinned || pinned.length >= MAX_PINS) ? 0.6 : 1,
          }}>{alreadyPinned ? "✓ Pinned" : `Pin to Compare${pinned.length ? ` · ${pinned.length}` : ""}`}</button>
          {/* export */}
          <button onClick={() => setCsv(buildCSV(name, producer, values, result, mode))} style={{
            padding:"9px 16px", borderRadius: 8, border:"1px solid var(--accent)", background:"transparent",
            color:"var(--accent)", fontFamily:"var(--body)", fontSize: 13, fontWeight: 600, cursor:"pointer",
          }}>Export CSV</button>
        </div>

        {/* presets */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily:"var(--mono)", fontSize: 9, color:"var(--muted)", textTransform:"uppercase", letterSpacing: 2, marginBottom: 8 }}>{mode === "flower" ? "Flower Presets · Ideal Cannabis" : "Live Resin Presets (illustrative)"}</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap: 6 }}>
            {presets.map(p => (
              <button key={p.name} onClick={() => loadPreset(p)} style={{
                padding:"6px 12px", borderRadius: 6, background:"var(--surface)", border:"1px solid var(--border)",
                color:"var(--fg-dim)", fontFamily:"var(--body)", fontSize: 12, cursor:"pointer",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--fg)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--fg-dim)"; }}
              >{p.name.replace("LR · ", "")}</button>
            ))}
            <button onClick={clearAll} style={{ padding:"6px 12px", borderRadius: 6, background:"transparent", border:"1px solid var(--border)", color:"var(--muted)", fontFamily:"var(--body)", fontSize: 12, cursor:"pointer" }}>Clear</button>
          </div>
        </div>

        {/* MAIN GRID */}
        <div style={{ display:"grid", gridTemplateColumns: cols, gap: 28, alignItems:"start" }}>
          {/* LEFT — card + fingerprint controls */}
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 12 }}>
              <span style={{ fontFamily:"var(--mono)", fontSize: 9, color:"var(--muted)", textTransform:"uppercase", letterSpacing: 2 }}>Fingerprint Mode</span>
              <div style={{ display:"flex", background:"var(--surface)", border:"1px solid var(--border)", borderRadius: 7, padding: 2, gap: 2 }}>
                {[["spectrum","Spectrum"],["detailed","Detailed"]].map(([k, l]) => (
                  <button key={k} onClick={() => setFpMode(k)} style={{
                    padding:"5px 12px", borderRadius: 5, border:"none", cursor:"pointer",
                    background: fpMode === k ? "var(--accent)" : "transparent",
                    color: fpMode === k ? "var(--bg)" : "var(--muted)",
                    fontFamily:"var(--body)", fontSize: 11, fontWeight: 600,
                  }}>{l}</button>
                ))}
              </div>
            </div>
            <ChemovarCard name={name} producer={producer} values={values} result={result} mode={fpMode} />

            <div style={{ marginTop: 20 }}>
              <div style={{ fontFamily:"var(--mono)", fontSize: 9, color:"var(--muted)", textTransform:"uppercase", letterSpacing: 2, marginBottom: 10 }}>Spectrum Strip</div>
              <SpectrumStrip result={result} />
            </div>
          </div>

          {/* RIGHT — inputs */}
          <div>
            <div style={{ fontFamily:"var(--mono)", fontSize: 9, color:"var(--muted)", textTransform:"uppercase", letterSpacing: 2, marginBottom: 12 }}>
              Terpene Panel · max {SLIDER_MAX[mode]}% each
            </div>
            <TierSliders tier="primary" values={values} onChange={setVal} mode={mode} open={openTiers.primary} onToggle={() => toggleTier("primary")} />
            <TierSliders tier="impact" values={values} onChange={setVal} mode={mode} open={openTiers.impact} onToggle={() => toggleTier("impact")} />
            <TierSliders tier="trace" values={values} onChange={setVal} mode={mode} open={openTiers.trace} onToggle={() => toggleTier("trace")} />
          </div>
        </div>

        <HR />

        {/* TERPENE LIBRARY */}
        <SL>Terpene Reference Library</SL>
        <ST>Every terpene in the engine.</ST>
        <p style={{ fontFamily:"var(--body)", fontSize: 14, color:"var(--fg-dim)", lineHeight: 1.6, maxWidth: 600, margin:"0 0 24px" }}>
          Each card shows the terpene's aroma, its primary and secondary profile associations, its tier (primary, high-impact minor, or trace), and the terpenes it most commonly co-occurs with.
        </p>
        <TerpeneLibrary />

        <HR />

        {/* FOOTER */}
        <div style={{ textAlign:"center", padding:"16px 0 8px" }}>
          <div style={{ fontFamily:"var(--mono)", fontSize: 10, textTransform:"uppercase", letterSpacing: 2, color:"var(--muted)", marginBottom: 6 }}>Flower Spectrum · Chemovar Classifier {VERSION}</div>
          <div style={{ fontFamily:"var(--body)", fontSize: 12, color:"var(--muted)" }}>CannaCre8ive · Portland, OR · Aroma/flavor classification only — not effects or medical claims</div>
        </div>
      </div>
      )}

      {view === "compare" && (
        <div style={{ padding:"clamp(24px,5vw,48px) clamp(16px,4vw,40px)", maxWidth: 1180, margin:"0 auto" }}>
          <CompareView pins={pinned} onRemove={removePin} onClear={clearPins} onQuickAdd={pinPreset} pinnedNames={pinnedNames} />
        </div>
      )}

      {/* CSV MODAL */}
      {csv && (
        <div onClick={() => setCsv(null)} style={{ position:"fixed", inset: 0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", padding: 20, zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius: 12, padding: 24, maxWidth: 520, width:"100%" }}>
            <div style={{ fontFamily:"var(--display)", fontSize: 20, fontWeight: 700, color:"var(--fg)", marginBottom: 8 }}>Export CSV</div>
            <div style={{ fontFamily:"var(--body)", fontSize: 13, color:"var(--fg-dim)", marginBottom: 16 }}>Chemovar export for {name || "Untitled"}.</div>
            <pre style={{ background:"var(--bg)", border:"1px solid var(--border)", borderRadius: 8, padding: 12, maxHeight: 240, overflow:"auto", fontFamily:"var(--mono)", fontSize: 11, color:"var(--fg-dim)", whiteSpace:"pre-wrap" }}>{csv}</pre>
            <div style={{ display:"flex", gap: 10, marginTop: 16 }}>
              <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download={`${(name || "chemovar").replace(/[^a-z0-9]/gi, "_")}_${VERSION}_${BUILD}.csv`}
                style={{ flex: 1, textAlign:"center", padding:"10px 16px", borderRadius: 8, background:"var(--accent)", color:"var(--bg)", fontFamily:"var(--body)", fontSize: 13, fontWeight: 700, textDecoration:"none" }}>Download .csv</a>
              <button onClick={() => setCsv(null)} style={{ padding:"10px 16px", borderRadius: 8, background:"transparent", border:"1px solid var(--border)", color:"var(--muted)", fontFamily:"var(--body)", fontSize: 13, cursor:"pointer" }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
