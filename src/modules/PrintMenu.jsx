import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";

// Adapted from source/print-menu-v2.jsx. Shared catalog and model; measured pagination.
const VERSION = "v2.0";
const BUILD = "06_19_2026";

/* ── 10 CANONICAL AROMA PROFILES (Context Pack §4 — colors locked) ── */
import { PROFILES } from '../data/profiles.js';
import { TERPENES } from '../data/engine-terpenes.js';
import { classify, bandSegments, blendName } from '../lib/classifier.js';
import { printToProduct } from '../lib/product-model.js';
import { csvSerialize, CSV_MASTER, productToRow } from '../lib/menu-data.js';
import { usePrintCatalog } from '../lib/print-catalog.jsx';
import PrintPages from '../components/PrintPages.jsx';
const PBK = Object.fromEntries(PROFILES.map(p => [p.key, p]));
const shortOf = k => (PBK[k]?.label || k).split(" / ")[0];

/* ── TERPENE DATABASE (compact 27 — matches Explorer v10.1 / Label v1.0) ── */
const POT_DEF = { primary:1.0, impact:1.1, trace:0.7 };
const TBK = Object.fromEntries(TERPENES.map(t => [t.key, t]));
const potOf = t => (t.potency != null ? t.potency : POT_DEF[t.tier]);

/* ── PROFILE CONTENT (sensory + hedged lean) — copied from Education Materials
   v1.0. Aroma-led, OLCC-compliant: no effect/medical claims. NAMED content debt. */
const PROFILE_CONTENT = Object.fromEntries(PROFILES.map(p=>[p.key,p]));
const PROFILE_TERPS = Object.fromEntries(PROFILES.map(p => {
  const home = TERPENES.filter(t => t.profile === p.key);
  const also = TERPENES.filter(t => t.profile !== p.key && (t.also||[]).includes(p.key));
  const byTier = tier => home.filter(t => t.tier === tier);
  return [p.key, { primary: byTier("primary"), impact: byTier("impact"), trace: byTier("trace"), also }];
}));

/* ── TERPENE CARD CONTENT (aroma + impact) for the 27 compact keys — from
   Education Materials v1.0. NAMED content debt (same source as PROFILE_CONTENT). */
const TBK_CONTENT = TBK;
const CATS = {
  flower:      { label:"Flower",       key:"spectrum", potency:{ label:"THC", unit:"%" }, priceMain:["eighth","/8th"], priceSub:["g","/g"],     group:"aroma" },
  preroll:     { label:"Pre-Rolls",    key:"spectrum", potency:{ label:"THC", unit:"%" }, priceMain:["each","ea"],    priceSub:["pack","/5pk"], group:"aroma" },
  concentrate: { label:"Concentrates", key:"spectrum", potency:{ label:"THC", unit:"%" }, priceMain:["g","/g"],       priceSub:["half","/½g"],  group:"aroma" },
  vape:        { label:"Vapes",        key:"tags",     potency:{ label:"THC", unit:"%" }, priceMain:["full","1g"],    priceSub:["half","½g"],   group:"tag"   },
  edible:      { label:"Edibles",      key:"tags",     potency:{ label:"THC", unit:"mg"}, priceMain:["pack","/pk"],   priceSub:["unit","ea"],   group:"tag"   },
};
const CAT_ORDER = ["flower"];
const catOf = row => CATS[row.category] || CATS.flower;
const priceVal = (row, slot) => { const c = catOf(row); const f = (slot==="main"?c.priceMain:c.priceSub)[0]; return row.price?.[f] ?? "—"; };
const priceUnit = (row, slot) => { const c = catOf(row); return (slot==="main"?c.priceMain:c.priceSub)[1]; };

/* ── PRODUCT TAGS (cannabinoid / process / dietary) — tags-key vocabulary ── */
const TAGS = [
  { key:"solventless",  label:"Solventless",   color:"#6AAFA0" },
  { key:"live_rosin",   label:"Live Rosin",    color:"#D28B49" },
  { key:"live_resin",   label:"Live Resin",    color:"#C9A84C" },
  { key:"full_spectrum",label:"Full-Spectrum", color:"#7FA688" },
  { key:"distillate",   label:"Distillate",    color:"#8a8478" },
  { key:"nano",         label:"Nano-Enhanced", color:"#B98BBE" },
  { key:"fast_acting",  label:"Fast-Acting",   color:"#D4A843" },
  { key:"cbn",          label:"CBN",           color:"#9E6B4A" },
  { key:"cbg",          label:"CBG",           color:"#6B8E5A" },
  { key:"cbc",          label:"CBC",           color:"#4F7A5B" },
  { key:"thcv",         label:"THCV",          color:"#B75F4A" },
  { key:"ratio_1_1",    label:"1:1 THC:CBD",   color:"#4F9A86" },
  { key:"high_cbd",     label:"High-CBD",      color:"#7FA688" },
  { key:"vegan",        label:"Vegan",         color:"#6B8E5A" },
  { key:"sugar_free",   label:"Sugar-Free",    color:"#8a8478" },
];
const TAGBK = Object.fromEntries(TAGS.map(t => [t.key, t]));

function contribOf(t) {
  const c = {}; c[t.profile] = 0.7;
  (t.also || []).forEach((p, i) => { c[p] = i === 0 ? 0.2 : 0.1; });
  const s = Object.values(c).reduce((a, b) => a + b, 0);
  Object.keys(c).forEach(k => c[k] = c[k] / s);
  return c;
}

/* classify() — verbatim from Explorer v10.1 (emergent gas K=1.5 P=1.5) */
function topTerpenes(values, n=3) {
  if (!values) return [];
  return TERPENES.map(t => ({ t, v: values[t.key]||0 }))
    .filter(x => x.v > 0).sort((a,b) => b.v - a.v).slice(0, n);
}

/* bandSegments / blendName — verbatim semantics from Explorer v10.1 (60%-of-leader, max 3) */
function manualClassification(m) {
  if (!m || !m.primary) return null;
  const ranked = PROFILES.map(p => ({ ...p, pct: 0 }));
  const setPct = (key, pct) => { const r = ranked.find(x => x.key === key); if (r) r.pct = pct; };
  const conf = m.confidence || "Leaning";
  if (m.secondary && m.secondary !== m.primary) {
    if (conf === "Blend")   { setPct(m.primary, 52); setPct(m.secondary, 48); }
    else if (conf === "Leaning") { setPct(m.primary, 64); setPct(m.secondary, 36); }
    else { setPct(m.primary, 80); setPct(m.secondary, 20); } // Defined still shows a faint 2nd
  } else {
    setPct(m.primary, 100);
  }
  ranked.sort((a,b) => b.pct - a.pct);
  return { ranked, confidence: conf, gap: ranked[0].pct - ranked[1].pct, totalTerp: m.totalTerp || 0, source:"manual" };
}

/* row → classification: engine when terpenes present & meaningful, else manual */
function hasTerpSignal(values) {
  if (!values) return false;
  return TERPENES.some(t => (values[t.key]||0) > 0);
}
function classifyRow(row) {
  if (row.classification) return row.provenance?.reviewedAt?{...row.classification,modeledTotalTerp:row.classification.totalTerp,totalTerp:row.provenance.reportedTotal}:row.classification;
  if (hasTerpSignal(row.values)) {
    const c = classify(row.values);
    if (c) return c;
  }
  return manualClassification(row.manual);
}

/* ── PRICING (Context Pack §14): whole-dollar deal price, $.50 rounds DOWN ── */
function roundHalfDown(v) { return -Math.round(-v); }      // 13.5→13, 13.6→14
function salePrice(price, pct) {
  const p = parseFloat(price), d = parseFloat(pct);
  if (isNaN(p) || isNaN(d) || d <= 0) return null;
  return Math.round(p * (1 - d / 100));
}
const onDeal = row => parseFloat(row.dealPct) > 0 && priceVal(row,"main") !== "—";

/* ── color helpers ── */
function wedge(cx,cy,ir,or_,sa,ea) {
  const f = v => v.toFixed(2);
  const x1=cx+ir*Math.cos(sa), y1=cy+ir*Math.sin(sa);
  const x2=cx+or_*Math.cos(sa), y2=cy+or_*Math.sin(sa);
  const x3=cx+or_*Math.cos(ea), y3=cy+or_*Math.sin(ea);
  const x4=cx+ir*Math.cos(ea), y4=cy+ir*Math.sin(ea);
  return `M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)} A${f(or_)} ${f(or_)} 0 0 1 ${f(x3)} ${f(y3)} L${f(x4)} ${f(y4)} A${f(ir)} ${f(ir)} 0 0 0 ${f(x1)} ${f(y1)} Z`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   SEED FLOWER DATA — from Profile Explorer v10.1 (8 real Ideal COAs +
   illustrative, all flagged). growMethod/tier/price/deal are OPERATOR metadata
   (not COA-derived) — surfaced & editable. Terpene values drive classification.
   ═══════════════════════════════════════════════════════════════════════════ */
const uid = () => `r${Date.now().toString(36)}${Math.random().toString(36).slice(2,7)}`;
const GROW_METHODS = ["Indoor","Sungrown","Greenhouse","Mixed-Light","Living Soil","Hydroponic"];
const TIER_LABEL = { top:"Top Shelf", mid:"Mid Shelf", value:"Value" };
const TIER_ORDER = ["top","mid","value"];

/* ── sort / group ── */
function sortStrains(list, sortKey) {
  const a = [...list];
  const mp = r => parseFloat(priceVal(r,"main"))||0;
  switch (sortKey) {
    case "name":       return a.sort((x,y)=>x.name.localeCompare(y.name));
    case "price_desc": return a.sort((x,y)=>mp(y)-mp(x));
    case "price_asc":  return a.sort((x,y)=>mp(x)-mp(y));
    case "thc_desc":   return a.sort((x,y)=>y.thc-x.thc);
    case "terps_desc": return a.sort((x,y)=>(y._c?.totalTerp||0)-(x._c?.totalTerp||0));
    case "deal_desc":  return a.sort((x,y)=>(parseFloat(y.dealPct)||0)-(parseFloat(x.dealPct)||0));
    case "profile":    return a.sort((x,y)=>PROFILES.findIndex(p=>p.key===x._c?.ranked[0].key)-PROFILES.findIndex(p=>p.key===y._c?.ranked[0].key));
    default:           return a;
  }
}
function buildGroups(list, groupBy, sortKey) {
  const sorted = sortStrains(list, sortKey === "default" ? "profile" : sortKey);
  if (groupBy === "none") return [{ key:"all", label:"All", color:"#8a8478", strains: sorted }];
  if (groupBy === "tier") {
    return TIER_ORDER.map(t => ({ key:t, label:TIER_LABEL[t], color:"#8a8478", strains: sorted.filter(s=>s.tier===t) })).filter(g=>g.strains.length);
  }
  if (groupBy === "tag") {
    const used = TAGS.filter(t => sorted.some(s => (s.tags||[]).includes(t.key)));
    const groups = used.map(t => ({ key:t.key, label:t.label, color:t.color,
      strains: sorted.filter(s => TAGS.find(x=>(s.tags||[]).includes(x.key))?.key===t.key) }));
    const untagged = sorted.filter(s => !TAGS.some(t=>(s.tags||[]).includes(t.key)));
    if (untagged.length) groups.push({ key:"_untagged", label:"More", color:"#8a8478", strains:untagged });
    return groups;
  }
  return PROFILES.map(p => ({ key:p.key, label:p.label, color:p.color, tagline:p.tagline,
    strains: sorted.filter(s => s._c && s._c.ranked[0].key === p.key) })).concat([{key:"unclassified",label:"Unclassified",color:"#8a8478",strains:sorted.filter(s=>!s._c)}]).filter(g=>g.strains.length);
}

/* ── canonical CSV (Context Pack §18 menu columns; data-URI export) ── */
function toCSV(list) { return csvSerialize(CSV_MASTER,list.map(row=>productToRow(printToProduct(row,row)))); }

/* ═══════════════════════════════════════════ SHARED VISUAL COMPONENTS ══════ */
const M = "var(--mono)", B = "var(--body)", D = "var(--display)";

/* Per-profile line icons — adapted from the uploaded flower-spectrum.jsx and
   remapped onto the canonical 10 keys (Savory/Funk dropped, locked-removed). */
import ReferenceFingerprint from '../components/Fingerprint.jsx';
import {referenceRanked} from '../lib/profile-reference.js';

function Tag({ children, color, dark=false }) {
  return <span style={{ display:"inline-block", padding:"2px 7px", borderRadius:3, background:color, color: dark ? "#fff" : "#15130f", fontFamily:M, fontSize:8, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase" }}>{children}</span>;
}

/* proportional 1–3 color band */
function Band({ c, orientation="vertical", thickness=null, length=null }) {
  if (!c) return null;
  const segs = bandSegments(c), isV = orientation === "vertical";
  const w = isV ? (thickness||38) : (length||"100%");
  const h = isV ? (length||"100%") : (thickness||14);
  return (
    <div style={{ width:w, height:h, display:"flex", flexDirection:isV?"column":"row", overflow:"hidden", flexShrink:0 }}>
      {segs.map(s => <div key={s.key} style={{ flex:`${s.frac} 0 0`, background:s.color }}/>)}
    </div>
  );
}

/* 10-sector radar fingerprint · paper=true tunes guides for white stock */
function Fingerprint({ c, size=110, highlight=null, paper=false }) {
  if (!c) return <div style={{ width:size, height:size }}/>;
  const cx=size/2, cy=size/2, maxR=size*0.46, minR=size*0.13;
  const n=PROFILES.length, slice=2*Math.PI/n, gap=0.05;
  const guideStroke = paper ? "#cfc6b4" : "#2a2824";
  const emptyOp = paper ? 0.22 : 0.15;
  const pctMap = Object.fromEntries(c.ranked.map(r=>[r.key,r.pct]));
  const maxV = Math.max(...Object.values(pctMap),1);
  const guides=[0.5,1.0].map(f=>minR+f*(maxR-minR));
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ display:"block" }}>
      {guides.map((r,i)=><circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={guideStroke} strokeWidth={0.5} strokeDasharray="2 4" opacity={0.6}/>)}
      <circle cx={cx} cy={cy} r={maxR} fill="none" stroke={guideStroke} strokeWidth={0.75}/>
      <circle cx={cx} cy={cy} r={minR} fill="none" stroke={guideStroke} strokeWidth={0.5}/>
      {PROFILES.map((p,i)=>{
        const v=pctMap[p.key]||0, has=v>0.5;
        const r=has?minR+(v/maxV)*(maxR-minR):minR+size*0.015;
        const sa=-Math.PI/2+i*slice+gap/2, ea=-Math.PI/2+(i+1)*slice-gap/2;
        const dim=highlight&&highlight!==p.key;
        return <path key={p.key} d={wedge(cx,cy,minR,r,sa,ea)} fill={p.color} opacity={has?(dim?0.25:0.92):emptyOp}/>;
      })}
      <circle cx={cx} cy={cy} r={size*0.025} fill={highlight?PBK[highlight].color:(paper?"#8a8170":"#5e5a50")}/>
    </svg>
  );
}

/* ── UNIFIED MENU KEY (the "lit-ribbon" from v1 Deals, now standard everywhere)
   variant "spectrum" → 10 aroma profiles · variant "tags" → product tags.
   `lit` = Set of keys present in this menu; unlit swatches fade back.        */
function MenuKey({ variant, lit, label, paper=true, ink="#3a3530", sub="#6b6358", rule="#d6cdbb", count=true }) {
  const items = variant === "tags" ? TAGS.filter(t=>lit.has(t.key)) : PROFILES;
  const total = variant === "tags" ? items.length : PROFILES.length;
  const onCount = variant === "tags" ? items.length : [...lit].length;
  const cap = variant === "tags" ? "Tags in this menu" : "Aroma profiles in this menu";
  if (variant === "tags" && items.length === 0) return null;
  return (
    <div style={{ marginTop:14, paddingTop:12, borderTop:`1px solid ${rule}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:7 }}>
        <div style={{ fontFamily:M, fontSize:7.5, color:sub, letterSpacing:1.5, textTransform:"uppercase" }}>{label||cap}</div>
        {count && <div style={{ fontFamily:M, fontSize:8.5, color:ink, letterSpacing:1, fontWeight:700 }}>{onCount}{variant==="tags"?"":` of ${total}`} {variant==="tags"?"tags":"lit"}</div>}
      </div>
      <div style={{ display:"flex", gap:4 }}>
        {items.map(p => {
          const isLit = lit.has(p.key);
          return (
            <div key={p.key} style={{ flex:1, textAlign:"center", minWidth:0 }}>
              <div style={{ height:14, background:p.color, opacity:isLit?1:0.12, borderRadius:2 }}/>
              <div style={{ fontFamily:M, fontSize:6, letterSpacing:0.2, textTransform:"uppercase", color:isLit?ink:"#bdb4a2", marginTop:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.short||p.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
/* small tag chip for product rows/cards */
function TagChips({ tags, ink="#5e574d", size=7.5 }) {
  if (!tags || !tags.length) return null;
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:4 }}>
      {tags.map(k => { const t = TAGBK[k]; if (!t) return null; return (
        <span key={k} style={{ display:"inline-flex", alignItems:"center", gap:4, fontFamily:M, fontSize:size, letterSpacing:0.3, textTransform:"uppercase", color:ink, border:`1px solid ${t.color}66`, background:`${t.color}14`, padding:"1px 6px", borderRadius:20 }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:t.color }}/>{t.label}
        </span>
      ); })}
    </div>
  );
}

/* compact stat line shared on paper menus */
function Stat({ s, c, paper=true }) {
  const dim = paper ? "#6b6358" : "var(--muted)";
  const fg  = paper ? "#15130f" : "var(--fg)";
  return (
    <div style={{ fontFamily:M, fontSize:9.5, color: paper?"#3a3530":"var(--fg-dim)" }}>
      <strong style={{ color:fg }}>{s.thc??"—"}%</strong> THC
      {c?.totalTerp>0 && <span style={{ color:dim }}> · {c.totalTerp.toFixed(1)}% terps</span>}
    </div>
  );
}

/* ── PAPER MENU SHEET WRAPPER (orientation-aware) ──
   Renders the exact print surface; preview scaled by zoom; faint page-break
   guides drawn at multiples of page height so the operator sees where breaks land. */
const PAGE = { portrait:{ w:8.5, h:11 }, landscape:{ w:11, h:8.5 } };
function Sheet({ orientation, children, dark=false, pad=true }) {
  const { w, h } = PAGE[orientation];
  return (
    <div className="fs-sheet" style={{
      width:`${w}in`, minHeight:`${h}in`, background: dark?"#15130f":"#f4eee3", color: dark?"var(--fg)":"#1a1816",
      margin:"0 auto", position:"relative", boxShadow:"0 8px 40px rgba(0,0,0,0.45)", overflow:"hidden",
      padding: pad ? "0" : "0",
    }}>
      {children}
      {/* page-break guides (screen only) */}
      <div className="fs-no-print" aria-hidden style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ position:"absolute", left:0, right:0, top:`${h*i}in`, borderTop:"1px dashed rgba(120,110,90,0.35)" }}>
            <span style={{ position:"absolute", right:6, top:2, fontFamily:M, fontSize:7, letterSpacing:1, color:"rgba(120,110,90,0.7)" }}>PAGE {i+1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════ SPECTRUM PRODUCT MENU (aroma-keyed) ══
   Flower · Pre-Rolls · Concentrates. Grouped by aroma profile (or tier/none),
   color band per row, unified spectrum key. Column visibility via `cols`.      */
function SpectrumMenu({ list, config, menuText, showKey, sortKey, groupBy, orientation, columns, cols:show, category }) {
  const cat = CATS[category] || CATS.flower;
  const groups = buildGroups(list, groupBy, sortKey);
  const litSet = new Set();
  list.forEach(s => { if (s._c) bandSegments(s._c).forEach(seg=>litSet.add(seg.key)); });
  const colCount = orientation==="landscape" ? columns : 1;
  show = show || {};
  return (
    <Sheet orientation={orientation}>
      <div style={{ padding:"0.42in 0.5in 0" }}>
        <div style={{ paddingBottom:14, borderBottom:"2px solid #1a1816" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:20 }}>
            <div>
              <div style={{ display:"flex", gap:3, marginBottom:10 }}>{PROFILES.map(p=><span key={p.key} style={{ width:7, height:20, background:p.color }}/>)}</div>
              <h2 style={{ fontFamily:D, fontSize:32, fontWeight:700, margin:0, color:"#15130f", lineHeight:1 }}>{menuText.title}</h2>
              <div style={{ fontFamily:B, fontSize:12.5, fontStyle:"italic", color:"#5e574d", marginTop:4 }}>{menuText.subtitle}</div>
            </div>
            <div style={{ textAlign:"right", fontFamily:M, fontSize:8.5, color:"#6b6358", letterSpacing:1, lineHeight:1.5 }}>
              {config.storeName.toUpperCase()}<br/>{config.location}<br/>{fmtDate(config.date)}
            </div>
          </div>
          {showKey && <MenuKey variant="spectrum" lit={litSet} />}
        </div>
        <div style={{ columnCount:colCount, columnGap:"0.4in", paddingTop:6 }}>
          {groups.length === 0 && <EmptyPaper text="No products in this category yet — add rows in the Data backend." />}
          {groups.map(g => (
            <div key={g.key} className="fs-group" style={{ marginTop:8, breakInside:"avoid" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 0", borderBottom:`1px solid ${g.color}` }}>
                <span style={{ width:11, height:11, borderRadius:3, background:g.color }}/>
                <span style={{ fontFamily:M, fontSize:10.5, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"#15130f" }}>{g.label}</span>
                {g.tagline && <span style={{ fontFamily:B, fontSize:10.5, fontStyle:"italic", color:"#6b6358" }}>— {g.tagline}</span>}
              </div>
              {g.strains.map(s => {
                const c = s._c, blend = c && c.confidence!=="Defined" ? blendName(c) : null;
                const tops = topTerpenes(s.values,3).map(t=>t.t.label).join(" · ");
                const main = priceVal(s,"main"), sub = priceVal(s,"sub");
                return (
                  <div key={s.id} className="fs-row" style={{ display:"flex", alignItems:"stretch", gap:11, padding:"8px 0", borderBottom:"1px solid #e2d9c8", breakInside:"avoid" }}>
                    <div style={{ width:4, alignSelf:"stretch", display:"flex", flexDirection:"column", flexShrink:0 }}>
                      {(c?bandSegments(c):[]).map(seg=><div key={seg.key} style={{ flex:`${seg.frac} 0 0`, background:seg.color }}/>)}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"baseline", gap:8, flexWrap:"wrap" }}>
                        <span style={{ fontFamily:D, fontSize:14.5, fontWeight:600, color:"#15130f" }}>{s.name}</span>
                        <span style={{ fontFamily:B, fontSize:10.5, fontStyle:"italic", color:"#6b6358" }}>{s.grower}</span>
                        {blend && <span style={{ fontFamily:M, fontSize:7.5, color:c.ranked[1].color, fontWeight:700, letterSpacing:0.5 }}>{blend.toUpperCase()}</span>}
                        {s.staffPick && <span style={{ fontFamily:M, fontSize:8, color:"#9E6B4A" }}>★</span>}
                      </div>
                      {(show.lineage!==false) && <div style={{ fontFamily:M, fontSize:8, color:"#8a8170", letterSpacing:0.3, marginTop:1 }}>
                        {s.lineage}{show.grow!==false && s.growMethod && <span> · {s.growMethod.toUpperCase()}</span>}
                      </div>}
                      {(show.aroma!==false) && <div style={{ fontFamily:B, fontSize:10.5, color:"#5e574d", marginTop:2 }}>{s.aroma}</div>}
                      {(show.terps!==false) && tops && <div style={{ fontFamily:M, fontSize:7.5, color:"#8a8170", letterSpacing:0.4, textTransform:"uppercase", marginTop:2 }}>Top Terps · {tops}</div>}
                      {(show.tags!==false) && <TagChips tags={s.tags} />}
                    </div>
                    {(show.potency!==false) && <div style={{ fontFamily:M, fontSize:9, color:"#3a3530", textAlign:"right", width:74, flexShrink:0 }}>
                      <div><strong>{s.thc??"—"}{cat.potency.unit}</strong> {cat.potency.label}</div>
                      {c?.totalTerp>0 && <div style={{ color:"#6b6358" }}>{c.totalTerp.toFixed(1)}% terps</div>}
                    </div>}
                    <div style={{ textAlign:"right", width:74, flexShrink:0, fontFamily:D, color:"#15130f" }}>
                      {onDeal(s) ? (
                        <>
                          <div style={{ fontSize:17, fontWeight:700, lineHeight:1, color:"#9E5B38" }}>${salePrice(main,s.dealPct)}<span style={{ fontFamily:M, fontSize:7.5, fontWeight:400 }}> {priceUnit(s,"main")}</span></div>
                          <div style={{ fontFamily:M, fontSize:8.5, textDecoration:"line-through", color:"#9a9080" }}>{main==="—"?"—":`$${main}`}</div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize:17, fontWeight:700, lineHeight:1 }}>{main==="—"?"—":`$${main}`}<span style={{ fontFamily:M, fontSize:7.5, fontWeight:400, color:"#6b6358" }}> {priceUnit(s,"main")}</span></div>
                          {sub>0 && <div style={{ fontSize:11.5, fontWeight:600, color:"#5e574d", marginTop:1 }}>${sub}<span style={{ fontFamily:M, fontSize:7.5, fontWeight:400, color:"#6b6358" }}> {priceUnit(s,"sub")}</span></div>}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <MenuFooter config={config} />
    </Sheet>
  );
}

/* ═══════════════════════════════════════════════ TAG PRODUCT MENU (tag-keyed) ══
   Vapes · Edibles. Grouped by tag (default) or tier; tag-chip rows; tags key.   */
function TagMenu({ list, config, menuText, showKey, sortKey, groupBy, orientation, columns, cols:show, category }) {
  const cat = CATS[category] || CATS.vape;
  const gb = (groupBy==="profile"||!groupBy) ? "tag" : groupBy;
  const groups = buildGroups(list, gb, sortKey);
  const litSet = new Set(); list.forEach(s => (s.tags||[]).forEach(k=>litSet.add(k)));
  const colCount = orientation==="landscape" ? columns : 1;
  show = show || {};
  return (
    <Sheet orientation={orientation}>
      <div style={{ padding:"0.42in 0.5in 0" }}>
        <div style={{ paddingBottom:14, borderBottom:"2px solid #1a1816" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:20 }}>
            <div>
              <div style={{ display:"flex", gap:3, marginBottom:10 }}>{TAGS.slice(0,11).map(t=><span key={t.key} style={{ width:7, height:20, background:t.color, opacity:litSet.has(t.key)?1:0.18 }}/>)}</div>
              <h2 style={{ fontFamily:D, fontSize:32, fontWeight:700, margin:0, color:"#15130f", lineHeight:1 }}>{menuText.title}</h2>
              <div style={{ fontFamily:B, fontSize:12.5, fontStyle:"italic", color:"#5e574d", marginTop:4 }}>{menuText.subtitle}</div>
            </div>
            <div style={{ textAlign:"right", fontFamily:M, fontSize:8.5, color:"#6b6358", letterSpacing:1, lineHeight:1.5 }}>
              {config.storeName.toUpperCase()}<br/>{config.location}<br/>{fmtDate(config.date)}
            </div>
          </div>
          {showKey && <MenuKey variant="tags" lit={litSet} label="Look for these tags" />}
        </div>
        <div style={{ columnCount:colCount, columnGap:"0.4in", paddingTop:6 }}>
          {groups.length === 0 && <EmptyPaper text="No products in this category yet — add rows in the Data backend." />}
          {groups.map(g => (
            <div key={g.key} className="fs-group" style={{ marginTop:8, breakInside:"avoid" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 0", borderBottom:`1px solid ${g.color}` }}>
                <span style={{ width:11, height:11, borderRadius:3, background:g.color }}/>
                <span style={{ fontFamily:M, fontSize:10.5, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"#15130f" }}>{g.label}</span>
              </div>
              {g.strains.map(s => {
                const main = priceVal(s,"main"), sub = priceVal(s,"sub");
                return (
                  <div key={s.id} className="fs-row" style={{ display:"flex", alignItems:"stretch", gap:11, padding:"8px 0", borderBottom:"1px solid #e2d9c8", breakInside:"avoid" }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"baseline", gap:8, flexWrap:"wrap" }}>
                        <span style={{ fontFamily:D, fontSize:14.5, fontWeight:600, color:"#15130f" }}>{s.name}</span>
                        <span style={{ fontFamily:B, fontSize:10.5, fontStyle:"italic", color:"#6b6358" }}>{s.grower}</span>
                        {s.staffPick && <span style={{ fontFamily:M, fontSize:8, color:"#9E6B4A" }}>★</span>}
                      </div>
                      {(show.lineage!==false) && s.lineage && <div style={{ fontFamily:M, fontSize:8, color:"#8a8170", letterSpacing:0.3, marginTop:1 }}>{s.lineage}</div>}
                      {(show.aroma!==false) && s.aroma && <div style={{ fontFamily:B, fontSize:10.5, color:"#5e574d", marginTop:2 }}>{s.aroma}</div>}
                      {(show.tags!==false) && <TagChips tags={s.tags} />}
                    </div>
                    {(show.potency!==false) && <div style={{ fontFamily:M, fontSize:9, color:"#3a3530", textAlign:"right", width:78, flexShrink:0 }}>
                      <div><strong>{s.thc??"—"}{cat.potency.unit}</strong> {cat.potency.label}</div>
                    </div>}
                    <div style={{ textAlign:"right", width:74, flexShrink:0, fontFamily:D, color:"#15130f" }}>
                      {onDeal(s) ? (
                        <>
                          <div style={{ fontSize:17, fontWeight:700, lineHeight:1, color:"#9E5B38" }}>${salePrice(main,s.dealPct)}<span style={{ fontFamily:M, fontSize:7.5, fontWeight:400 }}> {priceUnit(s,"main")}</span></div>
                          <div style={{ fontFamily:M, fontSize:8.5, textDecoration:"line-through", color:"#9a9080" }}>{main==="—"?"—":`$${main}`}</div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize:17, fontWeight:700, lineHeight:1 }}>{main==="—"?"—":`$${main}`}<span style={{ fontFamily:M, fontSize:7.5, fontWeight:400, color:"#6b6358" }}> {priceUnit(s,"main")}</span></div>
                          {sub>0 && <div style={{ fontSize:11.5, fontWeight:600, color:"#5e574d", marginTop:1 }}>${sub}<span style={{ fontFamily:M, fontSize:7.5, fontWeight:400, color:"#6b6358" }}> {priceUnit(s,"sub")}</span></div>}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <MenuFooter config={config} />
    </Sheet>
  );
}

/* router: pick the right product menu by category key-type */
function ProductMenu(props) {
  const cat = CATS[props.category] || CATS.flower;
  return cat.key === "tags" ? <TagMenu {...props} /> : <SpectrumMenu {...props} />;
}

/* ═══════════════════════════════════════ STAFF PICKS — now on WHITE paper ══
   Per Spencer: designed + previewed for white stock. Fingerprint switched to
   paper mode; quote block & chrome restyled to ink on cream/white.            */
function StaffPicksMenu({ list, config, menuText, sortKey, orientation, columns, category }) {
  const cat = CATS[category] || CATS.flower;
  const picks = sortStrains(list.filter(s=>s.staffPick), sortKey);
  const colCount = orientation==="landscape" ? columns : 1;
  const spectrum = cat.key !== "tags";
  return (
    <Sheet orientation={orientation}>
      <div style={{ padding:"0.42in 0.5in 0.18in", borderBottom:"1px solid #d6cdbb", textAlign:"center" }}>
        <div style={{ fontFamily:M, fontSize:9.5, letterSpacing:4, textTransform:"uppercase", color:"#3f8273", marginBottom:8 }}>The Spectrum Selects</div>
        <h2 style={{ fontFamily:D, fontSize:30, fontWeight:700, margin:0, color:"#15130f", lineHeight:1.05 }}>{menuText.title}</h2>
        <div style={{ fontFamily:B, fontSize:12.5, fontStyle:"italic", color:"#5e574d", marginTop:6, maxWidth:480, marginLeft:"auto", marginRight:"auto" }}>{menuText.subtitle}</div>
      </div>
      <div style={{ padding:"8px 0.32in", columnCount:colCount, columnGap:"0.32in" }}>
        {picks.length === 0 && <EmptyPaper text="No staff picks yet — flag a product with ★ in the Data backend." />}
        {picks.map(s => {
          const c = s._c, p1 = c?.ranked[0], tops = topTerpenes(s.values,4);
          const main = priceVal(s,"main"), sub = priceVal(s,"sub");
          return (
            <div key={s.id} className="fs-pick" style={{ display:"flex", gap:18, padding:"16px 8px", borderBottom:"1px solid #e2d9c8", alignItems:"center", breakInside:"avoid" }}>
              <div style={{ flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
                {spectrum && c ? (
                  <>
                    <Fingerprint c={c} size={92} highlight={p1.key} paper />
                    <span style={{ fontFamily:M, fontSize:8, color:p1.color, letterSpacing:1, textTransform:"uppercase" }}>{blendName(c)}</span>
                  </>
                ) : (
                  <div style={{ width:92, height:92, borderRadius:"50%", border:"1px solid #d6cdbb", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:2 }}>
                    <span style={{ fontFamily:D, fontSize:26, fontWeight:700, color:"#15130f" }}>{s.thc??"—"}<span style={{ fontFamily:M, fontSize:10 }}>{cat.potency.unit}</span></span>
                    <span style={{ fontFamily:M, fontSize:7, letterSpacing:1, color:"#8a8170" }}>{cat.potency.label}</span>
                  </div>
                )}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"baseline", gap:9, flexWrap:"wrap" }}>
                  <span style={{ fontFamily:D, fontSize:21, fontWeight:700, color:"#15130f" }}>{s.name}</span>
                  <span style={{ fontFamily:B, fontSize:11.5, fontStyle:"italic", color:"#8a8170" }}>{s.grower}</span>
                  {s.sourceId && <Tag color="#6B8E5A" dark>Historical panel</Tag>}
                </div>
                {s.lineage && <div style={{ fontFamily:M, fontSize:8.5, color:"#8a8170", letterSpacing:0.3, marginTop:3 }}>{s.lineage}{s.growMethod && <span> · {s.growMethod.toUpperCase()}</span>}</div>}
                <div style={{ display:"flex", gap:14, margin:"7px 0 9px", fontFamily:M, fontSize:9.5, color:"#5e574d" }}>
                  <span><strong style={{ color:"#15130f" }}>{s.thc??"—"}{cat.potency.unit}</strong> {cat.potency.label.toUpperCase()}</span>
                  {c?.totalTerp>0 && <span><strong style={{ color:"#15130f" }}>{c.totalTerp.toFixed(2)}%</strong> TERPS</span>}
                  {spectrum && c && <span style={{ color:c.confidence!=="Defined"?p1.color:"#8a8170" }}>{c.confidence!=="Defined"?blendName(c)+" blend":c.confidence}</span>}
                </div>
                {s.staffPick?.quote && (
                  <div style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"9px 13px", background:"#efe9dd", borderLeft:`2px solid ${spectrum&&p1?p1.color:"#3f8273"}`, borderRadius:"0 6px 6px 0" }}>
                    <div style={{ flexShrink:0, width:26, height:26, borderRadius:"50%", background:"#e0d8c7", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:D, fontSize:12, fontWeight:700, color:"#3f8273" }}>{(s.staffPick.by||"·")[0]}</div>
                    <div>
                      <div style={{ fontFamily:M, fontSize:7.5, color:"#8a8170", letterSpacing:1, textTransform:"uppercase", marginBottom:2 }}>{s.staffPick.by}'s pick</div>
                      <div style={{ fontFamily:B, fontSize:12, fontStyle:"italic", color:"#3a3530", lineHeight:1.5 }}>"{s.staffPick.quote}"</div>
                    </div>
                  </div>
                )}
                {s.aroma && <div style={{ fontFamily:B, fontSize:11.5, fontStyle:"italic", color:"#5e574d", marginTop:8 }}>{s.aroma}</div>}
                {tops.length>0 && <div style={{ fontFamily:M, fontSize:7.5, color:"#8a8170", letterSpacing:0.8, textTransform:"uppercase", marginTop:4 }}>Top Terps · {tops.map(t=>t.t.label).join(" · ")}</div>}
                <TagChips tags={s.tags} />
              </div>
              <div style={{ flexShrink:0, textAlign:"right" }}>
                <div style={{ fontFamily:D, fontSize:28, fontWeight:700, color:"#15130f", lineHeight:1 }}>{main==="—"?"—":`$${main}`}</div>
                <div style={{ fontFamily:M, fontSize:8, color:"#8a8170", letterSpacing:1 }}>{priceUnit(s,"main").toUpperCase()}</div>
                {sub>0 && <div style={{ fontFamily:M, fontSize:9, color:"#5e574d", marginTop:6 }}>${sub} {priceUnit(s,"sub")}</div>}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ padding:"12px 0.5in", textAlign:"center", fontFamily:M, fontSize:8, color:"#8a8170", letterSpacing:1, borderTop:"1px solid #d6cdbb" }}>
        {config.storeName.toUpperCase()} · TERPENE-TESTED · AROMA CLASSIFICATION, NOT EFFECTS · FLOWER SPECTRUM
      </div>
    </Sheet>
  );
}

/* ═══════════════════════════════════════════════════════ DEALS — category aware ══
   Spectrum categories → "Spectrum on Sale" ribbon. Tag categories → tags ribbon. */
function DealsMenu({ list, config, menuText, sortKey, orientation, columns, category }) {
  const cat = CATS[category] || CATS.flower;
  const spectrum = cat.key !== "tags";
  const deals = list.filter(onDeal);
  const sorted = sortStrains(deals, sortKey === "default" ? "deal_desc" : sortKey);
  const litSet = new Set();
  if (spectrum) deals.forEach(s => { if (s._c) bandSegments(s._c).forEach(seg=>litSet.add(seg.key)); });
  else deals.forEach(s => (s.tags||[]).forEach(k=>litSet.add(k)));
  const colCount = orientation==="landscape" ? columns : 1;
  const SALE = "#9E5B38";
  return (
    <Sheet orientation={orientation}>
      <div style={{ padding:"0.42in 0.5in 0" }}>
        <div style={{ paddingBottom:13, borderBottom:`2px solid ${SALE}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:20 }}>
            <div>
              <div style={{ fontFamily:M, fontSize:9.5, letterSpacing:3, textTransform:"uppercase", color:SALE, marginBottom:6, fontWeight:700 }}>{spectrum ? "The Spectrum on Sale" : "Deals"}</div>
              <h2 style={{ fontFamily:D, fontSize:32, fontWeight:700, margin:0, color:"#15130f", lineHeight:1 }}>{menuText.title}</h2>
              <div style={{ fontFamily:B, fontSize:12.5, fontStyle:"italic", color:"#5e574d", marginTop:4 }}>{menuText.subtitle}</div>
            </div>
            <div style={{ textAlign:"right", fontFamily:M, fontSize:8.5, color:"#6b6358", letterSpacing:1, lineHeight:1.5 }}>
              {config.storeName.toUpperCase()}<br/>{config.location}<br/>{fmtDate(config.date)}
            </div>
          </div>
          <MenuKey variant={spectrum?"spectrum":"tags"} lit={litSet}
            label={spectrum ? "On sale across the spectrum" : "On sale by tag"} />
        </div>
        <div style={{ columnCount:colCount, columnGap:"0.4in", paddingTop:10 }}>
          {sorted.length === 0 && <EmptyPaper text="No deals set — add a Deal % to any product in the Data backend, or use the rule bar." />}
          {sorted.map(s => {
            const c = s._c, pct = Math.round(parseFloat(s.dealPct));
            const main = priceVal(s,"main"), sub = priceVal(s,"sub");
            const nowMain = salePrice(main, s.dealPct), nowSub = sub>0?salePrice(sub, s.dealPct):null;
            const save = main - nowMain;
            const blend = spectrum && c ? blendName(c) : null;
            return (
              <div key={s.id} className="fs-deal" style={{ display:"flex", gap:0, marginBottom:11, border:"1px solid #ddd2bf", borderRadius:7, overflow:"hidden", background:"#fbf7ef", breakInside:"avoid" }}>
                {spectrum && c ? <Band c={c} orientation="vertical" thickness={8} /> : <div style={{ width:8, background:(s.tags&&TAGBK[s.tags[0]]?.color)||"#8a8478" }}/>}
                <div style={{ flex:1, minWidth:0, padding:"11px 13px", display:"flex", gap:12, alignItems:"center" }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"baseline", gap:8, flexWrap:"wrap" }}>
                      <span style={{ fontFamily:D, fontSize:16, fontWeight:700, color:"#15130f" }}>{s.name}</span>
                      <span style={{ fontFamily:B, fontSize:10.5, fontStyle:"italic", color:"#6b6358" }}>{s.grower}</span>
                    </div>
                    {spectrum && c ? (
                      <div style={{ display:"flex", alignItems:"center", gap:7, marginTop:3, flexWrap:"wrap" }}>
                        <span style={{ display:"flex", alignItems:"center", gap:5, fontFamily:M, fontSize:8, color:"#5e574d", letterSpacing:0.5, textTransform:"uppercase" }}>
                          <span style={{ width:8, height:8, borderRadius:2, background:c.ranked[0].color }}/>{blend}{c.confidence!=="Defined" ? " blend" : ""}
                        </span>
                        {s.growMethod && <span style={{ fontFamily:M, fontSize:7.5, color:"#8a8170", letterSpacing:0.4, textTransform:"uppercase" }}>· {s.growMethod}</span>}
                      </div>
                    ) : <TagChips tags={s.tags} />}
                    {s.aroma && <div style={{ fontFamily:B, fontSize:10, fontStyle:"italic", color:"#5e574d", marginTop:4, lineHeight:1.35 }}>{s.aroma}</div>}
                    <div style={{ fontFamily:M, fontSize:8.5, color:"#3a3530", marginTop:4 }}>
                      <strong>{s.thc??"—"}{cat.potency.unit}</strong> {cat.potency.label}{c?.totalTerp>0 && <span style={{ color:"#6b6358" }}> · {c.totalTerp.toFixed(1)}% terps</span>}
                    </div>
                  </div>
                  <div style={{ flexShrink:0, textAlign:"right", display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3 }}>
                    <span style={{ fontFamily:M, fontSize:9, fontWeight:700, letterSpacing:0.5, color:"#fff", background:SALE, padding:"2px 7px", borderRadius:3 }}>{pct}% OFF</span>
                    <div style={{ fontFamily:M, fontSize:9, textDecoration:"line-through", color:"#9a9080" }}>{main==="—"?"—":`$${main}`} {priceUnit(s,"main")}</div>
                    <div style={{ fontFamily:D, fontSize:23, fontWeight:700, color:SALE, lineHeight:1 }}>${nowMain}<span style={{ fontFamily:M, fontSize:8, fontWeight:400 }}> {priceUnit(s,"main")}</span></div>
                    {nowSub!=null && <div style={{ fontFamily:M, fontSize:8.5, color:"#5e574d" }}>${nowSub} {priceUnit(s,"sub")}</div>}
                    <div style={{ fontFamily:M, fontSize:8, color:SALE, fontWeight:700, letterSpacing:0.3 }}>SAVE ${save}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <MenuFooter config={config} saleLine />
    </Sheet>
  );
}

/* ═══════════════════════════════════════════ AROMA CARDS (printable shelf cards) ══
   Profile cards = the MAIN card: icon + sensory copy + the profile's terpenes by
   tier + LIVE in-stock strains. Terpene cards = Primary / Secondary / Trace set.
   Designed to cut out and place at the shelf. cardSet: profiles | terps | both.  */
function AromaCards({ list, config, menuText, orientation, cardSet, cardCols }) {
  const flowerish = list.filter(s => s._c);            // anything classified (flower, preroll, concentrate)
  const stockFor = pk => flowerish.filter(s => s._c.ranked[0].key === pk);
  const cols = cardCols || (orientation==="landscape" ? 3 : 2);
  const showProfiles = cardSet === "profiles" || cardSet === "both";
  const showTerps = cardSet === "terps" || cardSet === "both";
  return (
    <Sheet orientation={orientation}>
      <div style={{ padding:"0.42in 0.5in 0" }}>
        <div style={{ paddingBottom:13, borderBottom:"2px solid #1a1816", textAlign:"center" }}>
          <div style={{ display:"flex", gap:3, marginBottom:9, justifyContent:"center" }}>{PROFILES.map(p=><span key={p.key} style={{ width:7, height:20, background:p.color }}/>)}</div>
          <h2 style={{ fontFamily:D, fontSize:30, fontWeight:700, margin:0, color:"#15130f", lineHeight:1 }}>{menuText.title}</h2>
          <div style={{ fontFamily:B, fontSize:12.5, fontStyle:"italic", color:"#5e574d", marginTop:4 }}>{menuText.subtitle}</div>
        </div>

        {showProfiles && (
          <div style={{ columnCount:cols, columnGap:"0.3in", paddingTop:12 }}>
            {PROFILES.map(p => {
              const ct = PROFILE_CONTENT[p.key]||{}, terps = PROFILE_TERPS[p.key];
              const stock = stockFor(p.key);
              return (
                <div key={p.key} className="fs-card" style={{ breakInside:"avoid", border:"1px solid #ddd2bf", borderTop:`4px solid ${p.color}`, borderRadius:7, padding:"13px 14px 12px", marginBottom:"0.3in", background:"#fbf7ef" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                    <div style={{ width:38, height:38, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background:`${p.color}1a`, borderRadius:9 }}>
                      <ReferenceFingerprint ranked={referenceRanked(p.key)} size={48} label={`${p.label}: illustrative profile blend`} />
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontFamily:D, fontSize:17, fontWeight:700, color:"#15130f", lineHeight:1.05 }}>{p.label}</div>
                      <div style={{ fontFamily:M, fontSize:7.5, color:p.color, letterSpacing:1, textTransform:"uppercase" }}>{p.short} · {p.tagline}</div>
                    </div>
                  </div>
                  <div style={{ fontFamily:B, fontSize:10.5, color:"#3a3530", lineHeight:1.5 }}>{ct.sensory}</div>
                  {ct.lean && <div style={{ fontFamily:B, fontSize:9.5, fontStyle:"italic", color:"#6b6358", marginTop:4 }}>{ct.lean}</div>}
                  {ct.note && <div style={{ fontFamily:B, fontSize:8.5, color:"#8a8170", marginTop:4, lineHeight:1.4, paddingLeft:7, borderLeft:`2px solid ${p.color}66` }}>{ct.note}</div>}

                  <div style={{ marginTop:9, paddingTop:8, borderTop:"1px solid #e2d9c8" }}>
                    <div style={{ fontFamily:M, fontSize:7, color:"#8a8170", letterSpacing:1.2, textTransform:"uppercase", marginBottom:4 }}>Driver Terpenes</div>
                    <div style={{ fontFamily:B, fontSize:10, color:"#15130f", fontWeight:600, marginBottom:5 }}>{(ct.drivers||[]).join(" · ")}</div>
                    {[["Primary","primary"],["Secondary","impact"],["Trace","trace"]].map(([lab,tk]) => terps[tk].length>0 && (
                      <div key={tk} style={{ display:"flex", gap:6, alignItems:"baseline", marginBottom:2 }}>
                        <span style={{ flexShrink:0, width:52, fontFamily:M, fontSize:6.5, color:"#9a9080", letterSpacing:0.5, textTransform:"uppercase" }}>{lab}</span>
                        <span style={{ fontFamily:B, fontSize:9, color:"#6b6358" }}>{terps[tk].map(t=>t.label).join(", ")}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop:8, paddingTop:8, borderTop:"1px solid #e2d9c8" }}>
                    <div style={{ fontFamily:M, fontSize:7, color:"#8a8170", letterSpacing:1.2, textTransform:"uppercase", marginBottom:4 }}>In This Catalog · {stock.length}</div>
                    {stock.length === 0 ? (
                      <div style={{ fontFamily:B, fontSize:9.5, fontStyle:"italic", color:"#9a9080" }}>Nothing in this profile right now — ask a budtender.</div>
                    ) : (
                      <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                        {stock.slice(0,5).map(s => (
                          <div key={s.id} style={{ display:"flex", justifyContent:"space-between", gap:8, fontFamily:B, fontSize:10 }}>
                            <span style={{ color:"#15130f", fontWeight:600, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.name}{s.staffPick && <span style={{ color:"#9E6B4A" }}> ★</span>}</span>
                            <span style={{ flexShrink:0, fontFamily:M, fontSize:8.5, color:"#6b6358" }}>${priceVal(s,"main")} {priceUnit(s,"main")}</span>
                          </div>
                        ))}
                        {stock.length>5 && <div style={{ fontFamily:M, fontSize:8, color:"#9a9080" }}>+{stock.length-5} more</div>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showTerps && (
          <div style={{ paddingTop:14 }}>
            <div style={{ fontFamily:M, fontSize:9, color:"#6b6358", letterSpacing:2, textTransform:"uppercase", padding:"6px 0", borderBottom:"1px solid #d6cdbb", marginBottom:10 }}>Terpene Cards · Primary · Secondary · Trace</div>
            {[["Primary","primary"],["Secondary (Impact)","impact"],["Trace","trace"]].map(([lab,tk]) => (
              <div key={tk} className="fs-terp-group" style={{ marginBottom:10, breakInside:"avoid" }}>
                <div style={{ fontFamily:M, fontSize:8, color:"#8a8170", letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>{lab}</div>
                <div style={{ columnCount:cols, columnGap:"0.3in" }}>
                  {TERPENES.filter(t=>t.tier===tk).map(t => {
                    const home = PBK[t.profile];
                    const leaders = flowerish.filter(s => (topTerpenes(s.values,1)[0]?.t.key)===t.key);
                    return (
                      <div key={t.key} className="fs-card" style={{ breakInside:"avoid", border:"1px solid #ddd2bf", borderLeft:`4px solid ${home.color}`, borderRadius:6, padding:"9px 11px", marginBottom:"0.22in", background:"#fbf7ef" }}>
                        <div style={{ display:"flex", alignItems:"baseline", gap:7 }}>
                          <span style={{ fontFamily:D, fontSize:13.5, fontWeight:700, color:"#15130f" }}>{t.label}</span>
                          <span style={{ fontFamily:M, fontSize:7, color:home.color, letterSpacing:0.8, textTransform:"uppercase" }}>{home.short}</span>
                        </div>
                        <div style={{ fontFamily:B, fontSize:9.5, color:"#3a3530", marginTop:2 }}>{TBK_CONTENT[t.key]?.aroma}</div>
                        <div style={{ fontFamily:B, fontSize:8.5, fontStyle:"italic", color:"#6b6358", marginTop:3, lineHeight:1.4 }}>{TBK_CONTENT[t.key]?.impact}</div>
                        {leaders.length>0 && <div style={{ fontFamily:M, fontSize:7, color:"#8a8170", letterSpacing:0.4, textTransform:"uppercase", marginTop:4 }}>Leads · {leaders.slice(0,3).map(s=>s.name).join(" · ")}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ padding:"12px 0.5in", textAlign:"center", fontFamily:M, fontSize:8, color:"#6b6358", letterSpacing:1, borderTop:"2px solid #1a1816" }}>
        {config.storeName.toUpperCase()} · SHELF CARDS · AROMA CLASSIFICATION, NOT EFFECTS OR MEDICAL CLAIMS · FLOWER SPECTRUM
      </div>
    </Sheet>
  );
}

function MenuFooter({ config, saleLine=false }) {
  return (
    <div style={{ padding:"12px 0.5in", borderTop:"2px solid #1a1816", display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8, fontFamily:M, fontSize:8, color:"#6b6358", letterSpacing:1 }}>
      <span>{config.storeName.toUpperCase()} {config.license && `· License ${config.license}`} · {config.footer}</span>
      <span>{saleLine ? "WHILE SUPPLIES LAST · " : ""}AROMA CLASSIFICATION · NOT EFFECTS OR MEDICAL CLAIMS</span>
    </div>
  );
}
function EmptyPaper({ text, dark=false }) {
  return <div style={{ padding:"40px 20px", textAlign:"center", fontFamily:B, fontSize:13, fontStyle:"italic", color: dark?"var(--muted)":"#8a8170" }}>{text}</div>;
}
function fmtDate(d) {
  try { return new Date(d+"T00:00:00").toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}); }
  catch { return d; }
}

/* ═══════════════════════════════════════════════════════════ DATA BACKEND ══ */
const selS = { background:"var(--bg)", border:"1px solid var(--border)", color:"var(--fg)", fontFamily:M, fontSize:10, padding:"4px 6px", borderRadius:5 };
const inS  = { width:"100%", background:"transparent", border:"1px solid transparent", color:"var(--fg-dim)", fontFamily:B, fontSize:11, padding:"3px 5px", borderRadius:4 };
const thS  = { textAlign:"left", fontFamily:M, fontSize:8, color:"var(--muted)", letterSpacing:1, textTransform:"uppercase", padding:"8px 6px", borderBottom:"1px solid var(--border)", position:"sticky", top:0, background:"var(--surface)", whiteSpace:"nowrap", zIndex:2 };
const tdS  = { padding:"2px 4px", verticalAlign:"middle", borderBottom:"1px solid var(--border)" };
const CONF = ["Defined","Leaning","Blend"];

function TerpEditor({ row, onChange }) {
  const tiers = ["primary","impact","trace"];
  return (
    <div style={{ padding:"12px 14px", background:"var(--bg)", border:"1px solid var(--border)", borderRadius:8, marginTop:4 }}>
      <div style={{ fontFamily:M, fontSize:8.5, color:"var(--accent)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>
        Terpene % — entering any value classifies this row by the engine (overrides manual)
      </div>
      {tiers.map(tier => (
        <div key={tier} style={{ marginBottom:8 }}>
          <div style={{ fontFamily:M, fontSize:7.5, color:"var(--muted)", letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>{tier}</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(120px,1fr))", gap:6 }}>
            {TERPENES.filter(t=>t.tier===tier).map(t => (
              <label key={t.key} style={{ display:"flex", alignItems:"center", gap:5, fontFamily:M, fontSize:9, color:"var(--fg-dim)" }}>
                <span style={{ flex:1, minWidth:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t.label}</span>
                <input type="number" step="0.01" value={row.values?.[t.key] ?? ""} placeholder="0"
                  onChange={e => { const v = parseFloat(e.target.value); onChange({ ...(row.values||{}), [t.key]: isNaN(v)?0:v }); }}
                  style={{ width:52, background:"var(--surface)", border:"1px solid var(--border)", color:"var(--fg)", fontFamily:M, fontSize:10, padding:"3px 5px", borderRadius:4 }}/>
              </label>
            ))}
          </div>
        </div>
      ))}
      <button onClick={()=>onChange(null)} style={{ ...selS, color:"#C97A5A", border:"1px solid var(--border)", cursor:"pointer", marginTop:4 }}>Clear terpenes (revert to manual profile)</button>
    </div>
  );
}

/* tag picker (tags-keyed categories) */
function TagEditor({ row, onToggle }) {
  const sel = new Set(row.tags||[]);
  return (
    <div style={{ padding:"12px 14px", background:"var(--bg)", border:"1px solid var(--border)", borderRadius:8, marginTop:4 }}>
      <div style={{ fontFamily:M, fontSize:8.5, color:"var(--accent)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>Product Tags — drive the tags key & grouping</div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
        {TAGS.map(t => { const on = sel.has(t.key); return (
          <button key={t.key} onClick={()=>onToggle(t.key)} style={{ display:"inline-flex", alignItems:"center", gap:5, fontFamily:M, fontSize:9, letterSpacing:0.3, textTransform:"uppercase", cursor:"pointer", color: on?"#0e0e0c":"var(--fg-dim)", background: on?t.color:"transparent", border:`1px solid ${on?t.color:"var(--border)"}`, padding:"4px 9px", borderRadius:20 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background: on?"#0e0e0c":t.color }}/>{t.label}
          </button>
        ); })}
      </div>
    </div>
  );
}

function DataBackend({ rows, onEdit, onAdd, onDup, onDel, onExport, onApplyRule, onClearDeals, onToggleTag, category, showDeals }) {
  const [openRow, setOpenRow] = useState(null);
  const [rulePct, setRulePct] = useState("20");
  const [ruleMax, setRuleMax] = useState("40");
  const cat = CATS[category] || CATS.flower;
  const isTag = cat.key === "tags";
  const mainF = cat.priceMain[0], subF = cat.priceSub[0];
  const potHdr = `${cat.potency.label} ${cat.potency.unit}`;
  const headSpectrum = ["Product","Brand","Lineage","Grow","Aroma Profile","2nd","Conf",potHdr,"Terps%",`$ ${cat.priceMain[1]}`,`$ ${cat.priceSub[1]}`,"Tier","★","By","Deal%",""];
  const headTags = ["Product","Brand","Detail","Tags",potHdr,`$ ${cat.priceMain[1]}`,`$ ${cat.priceSub[1]}`,"Tier","★","By","Deal%",""];
  const head = isTag ? headTags : headSpectrum;
  const colSpan = head.length;
  return (
    <div className="fs-no-print" style={{ border:"1px solid var(--border)", borderRadius:12, background:"var(--surface)", marginBottom:22, overflow:"hidden" }}>
      <div style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)", display:"flex", flexWrap:"wrap", gap:12, alignItems:"center" }}>
        <span style={{ fontFamily:M, fontSize:10, color:"var(--accent)", letterSpacing:2, textTransform:"uppercase" }}>Data Backend · {cat.label}</span>
        <span style={{ fontFamily:M, fontSize:9, color:"var(--muted)" }}>{rows.length} rows · {isTag?"tags-keyed":"aroma-keyed"}</span>
        <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
          <button onClick={onAdd} style={btn()}>+ Add Row</button>
          <button onClick={onExport} style={btn()}>↓ Export CSV</button>
        </div>
      </div>

      {showDeals && (
        <div style={{ padding:"10px 16px", borderBottom:"1px solid var(--border)", display:"flex", gap:10, alignItems:"flex-end", flexWrap:"wrap", background:"var(--bg)" }}>
          <Field label="% Off"><input value={rulePct} onChange={e=>setRulePct(e.target.value)} style={{ ...selS, width:64 }}/></Field>
          <Field label={`Items under $ (${cat.priceMain[1]})`}><input value={ruleMax} onChange={e=>setRuleMax(e.target.value)} style={{ ...selS, width:90 }}/></Field>
          <button onClick={()=>onApplyRule(rulePct, ruleMax)} style={btn(true)}>Apply Rule</button>
          <button onClick={onClearDeals} style={{ ...btn(), color:"#C97A5A" }}>Clear Deals (this category)</button>
          <span style={{ fontFamily:M, fontSize:9, color:"var(--muted)", alignSelf:"center", maxWidth:280, lineHeight:1.5 }}>Applies {rulePct||"—"}% to {cat.label.toLowerCase()} with {cat.priceMain[1]} under ${ruleMax||"∞"} (skips items already on deal).</span>
        </div>
      )}

      <div style={{ overflowX:"auto", maxHeight:380, overflowY:"auto" }}>
        <table style={{ borderCollapse:"collapse", width:"100%", minWidth: isTag?920:1080 }}>
          <thead><tr>{head.map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.length===0 && <tr><td colSpan={colSpan} style={{ ...tdS, textAlign:"center", padding:"22px", color:"var(--muted)", fontFamily:B, fontStyle:"italic" }}>No {cat.label.toLowerCase()} yet — “+ Add Row”.</td></tr>}
            {rows.map((s, i) => {
              const engine = hasTerpSignal(s.values);
              const c = s._c, open = openRow===s.id;
              return (
                <React.Fragment key={s.id}>
                  <tr>
                    <td style={tdS}><input value={s.name} onChange={e=>onEdit(s.id,"name",e.target.value)} style={{ ...inS, width:140 }} onFocus={foc} onBlur={blur}/></td>
                    <td style={tdS}><input value={s.grower} onChange={e=>onEdit(s.id,"grower",e.target.value)} style={{ ...inS, width:120 }} onFocus={foc} onBlur={blur}/></td>
                    <td style={tdS}><input value={s.lineage} onChange={e=>onEdit(s.id,"lineage",e.target.value)} style={{ ...inS, width:isTag?150:170 }} onFocus={foc} onBlur={blur}/></td>
                    {!isTag && (
                      <td style={tdS}>
                        <select value={s.growMethod||""} onChange={e=>onEdit(s.id,"growMethod",e.target.value)} style={{ ...selS, width:96 }}>
                          <option value="">—</option>{GROW_METHODS.map(g=><option key={g} value={g}>{g}</option>)}
                        </select>
                      </td>
                    )}
                    {isTag ? (
                      <td style={tdS}>
                        <button onClick={()=>setOpenRow(open?null:s.id)} style={{ ...rbtn(open), fontFamily:M, fontSize:9, padding:"3px 8px" }}>{(s.tags||[]).length||0} tags ▾</button>
                      </td>
                    ) : (
                      <>
                        <td style={tdS}>
                          {engine ? (
                            <span style={{ display:"flex", alignItems:"center", gap:5, fontFamily:M, fontSize:10, color:"var(--fg-dim)", whiteSpace:"nowrap" }}>
                              <span style={{ width:8, height:8, borderRadius:2, background:c?.ranked[0].color }}/>{c?.ranked[0].label}<Tag color="#6AAFA0">Engine</Tag>
                            </span>
                          ) : (
                            <select value={s.manual?.primary||""} onChange={e=>onEdit(s.id,"manual",{ ...(s.manual||{confidence:"Leaning"}), primary:e.target.value })} style={{ ...selS, width:120 }}>
                              <option value="">— pick —</option>{PROFILES.map(p=><option key={p.key} value={p.key}>{p.label}</option>)}
                            </select>
                          )}
                        </td>
                        <td style={tdS}>
                          {engine ? <span style={{ fontFamily:M, fontSize:9.5, color:"var(--muted)" }}>{c?.confidence!=="Defined"?c?.ranked[1].label:"—"}</span> : (
                            <select value={s.manual?.secondary||""} onChange={e=>onEdit(s.id,"manual",{ ...(s.manual||{}), secondary:e.target.value })} style={{ ...selS, width:108 }} disabled={!s.manual?.primary}>
                              <option value="">—</option>{PROFILES.filter(p=>p.key!==s.manual?.primary).map(p=><option key={p.key} value={p.key}>{shortOf(p.key)}</option>)}
                            </select>
                          )}
                        </td>
                        <td style={tdS}>
                          {engine ? <span style={{ fontFamily:M, fontSize:9.5, color:"var(--muted)" }}>{c?.confidence}</span> : (
                            <select value={s.manual?.confidence||"Leaning"} onChange={e=>onEdit(s.id,"manual",{ ...(s.manual||{}), confidence:e.target.value })} style={{ ...selS, width:84 }} disabled={!s.manual?.primary}>
                              {CONF.map(x=><option key={x} value={x}>{x}</option>)}
                            </select>
                          )}
                        </td>
                      </>
                    )}
                    <td style={tdS}><input value={s.thc??"—"} onChange={e=>onEdit(s.id,"thc",parseFloat(e.target.value)||0)} style={{ ...inS, width:52, textAlign:"right" }} onFocus={foc} onBlur={blur}/></td>
                    {!isTag && (
                      <td style={tdS}>
                        {engine ? <span style={{ fontFamily:M, fontSize:10, color:"var(--muted)" }}>{c?.totalTerp.toFixed(2)}</span> :
                          <input value={s.manual?.totalTerp ?? ""} placeholder="—" onChange={e=>onEdit(s.id,"manual",{ ...(s.manual||{}), totalTerp:parseFloat(e.target.value)||0 })} style={{ ...inS, width:48, textAlign:"right" }} onFocus={foc} onBlur={blur}/>}
                      </td>
                    )}
                    <td style={tdS}><input value={s.price?.[mainF] ?? ""} onChange={e=>onEdit(s.id,`price.${mainF}`,e.target.value===""?null:parseFloat(e.target.value)||0)} style={{ ...inS, width:48, textAlign:"right" }} onFocus={foc} onBlur={blur}/></td>
                    <td style={tdS}><input value={s.price?.[subF] ?? ""} onChange={e=>onEdit(s.id,`price.${subF}`,e.target.value===""?null:parseFloat(e.target.value)||0)} style={{ ...inS, width:48, textAlign:"right" }} onFocus={foc} onBlur={blur}/></td>
                    <td style={tdS}>
                      <select value={s.tier||""} onChange={e=>onEdit(s.id,"tier",e.target.value)} style={{ ...selS, width:64 }}>
                        <option value="">—</option>{TIER_ORDER.map(t=><option key={t} value={t}>{TIER_LABEL[t]}</option>)}
                      </select>
                    </td>
                    <td style={{ ...tdS, textAlign:"center" }}>
                      <input type="checkbox" checked={!!s.staffPick} onChange={e=>onEdit(s.id,"staffPick", e.target.checked ? (s.staffPick||{ by:"", quote:"" }) : null)} style={{ accentColor:"var(--accent)", cursor:"pointer" }}/>
                    </td>
                    <td style={tdS}><input value={s.staffPick?.by||""} disabled={!s.staffPick} placeholder={s.staffPick?"name":""} onChange={e=>onEdit(s.id,"staffPick",{ ...(s.staffPick||{}), by:e.target.value })} style={{ ...inS, width:64, opacity:s.staffPick?1:0.4 }} onFocus={foc} onBlur={blur}/></td>
                    <td style={tdS}><input value={s.dealPct||""} onChange={e=>onEdit(s.id,"dealPct",e.target.value)} placeholder="—" style={{ ...inS, width:44, textAlign:"right" }} onFocus={foc} onBlur={blur}/></td>
                    <td style={tdS}>
                      <div style={{ display:"flex", gap:3 }}>
                        <button title={isTag?"Edit tags / details":"Edit terpenes / details"} onClick={()=>setOpenRow(open?null:s.id)} style={rbtn(open)}>⌗</button>
                        <button title="Duplicate" onClick={()=>onDup(s.id)} style={rbtn()}>⧉</button>
                        <button title="Delete" onClick={()=>onDel(s.id)} style={{ ...rbtn(), color:"#C97A5A" }}>×</button>
                      </div>
                    </td>
                  </tr>
                  {open && (
                    <tr><td colSpan={colSpan} style={{ padding:"0 8px 10px" }}>
                      {isTag
                        ? <TagEditor row={s} onToggle={k=>onToggleTag(s.id,k)} />
                        : <TerpEditor row={s} onChange={vals=>onEdit(s.id,"values",vals)} />}
                      {s.staffPick && (
                        <div style={{ marginTop:8 }}>
                          <Field label="Pick quote (Staff Picks menu)">
                            <input value={s.staffPick?.quote||""} onChange={e=>onEdit(s.id,"staffPick",{ ...(s.staffPick||{}), quote:e.target.value })} style={{ ...selS, width:"100%" }}/>
                          </Field>
                        </div>
                      )}
                      <Field label={isTag?"Description (menu)":"Aroma sentence (label + menu)"}>
                        <input value={s.aroma||""} onChange={e=>onEdit(s.id,"aroma",e.target.value)} style={{ ...selS, width:"100%", marginTop:6 }}/>
                      </Field>
                    </td></tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ padding:"8px 16px", fontFamily:M, fontSize:9, color:"var(--muted)", letterSpacing:0.4, lineHeight:1.6 }}>
        {isTag
          ? <>Tag-keyed category — products carry <b style={{ color:"var(--fg-dim)" }}>tags</b> (CBN, Nano, Solventless…), not aroma classification. Potency, price, tier &amp; tags are operator-entered.</>
          : <>Aroma profile auto-derives from terpene % (⌗) when present — tagged <b style={{ color:"var(--fg-dim)" }}>Engine</b>; otherwise an operator-asserted <b style={{ color:"var(--fg-dim)" }}>Manual</b> profile. Grow method, tier &amp; price are operator-entered, not COA-derived.</>}
        {" "}CSV import lands next.
      </div>
    </div>
  );
}
function Field({ label, children }) {
  return <label style={{ display:"flex", flexDirection:"column", gap:3 }}>
    <span style={{ fontFamily:M, fontSize:8, letterSpacing:1.2, textTransform:"uppercase", color:"var(--muted)" }}>{label}</span>{children}
  </label>;
}
const foc = e => e.target.style.border = "1px solid var(--accent)";
const blur = e => e.target.style.border = "1px solid transparent";
const btn = (pri=false) => ({ background: pri?"var(--accent)":"transparent", color: pri?"#0e0e0c":"var(--fg-dim)", border:`1px solid ${pri?"var(--accent)":"var(--border)"}`, padding:"7px 13px", borderRadius:6, fontFamily:M, fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase", cursor:"pointer" });
const rbtn = (on=false) => ({ background: on?"var(--accent)":"transparent", color: on?"#0e0e0c":"var(--fg-dim)", border:`1px solid ${on?"var(--accent)":"var(--border)"}`, padding:"2px 7px", borderRadius:4, fontFamily:M, fontSize:11, cursor:"pointer", lineHeight:1 });

/* ═══════════════════════════════════════════════════════════ CSV MODAL ══════ */
function CsvModal({ csv, filename, onClose }) {
  if (!csv) return null;
  const href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  return (
    <div className="fs-no-print" onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.72)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:24, maxWidth:560, width:"100%" }}>
        <div style={{ fontFamily:D, fontSize:20, fontWeight:700, color:"var(--fg)", marginBottom:6 }}>Export CSV</div>
        <div style={{ fontFamily:B, fontSize:13, color:"var(--fg-dim)", lineHeight:1.5, marginBottom:16 }}>Full shared-catalog columns, including terpene values and product IDs. Import this file from the digital menu catalog editor.</div>
        <a href={href} download={filename} style={{ display:"inline-block", padding:"11px 20px", background:"var(--accent)", color:"#0e0e0c", borderRadius:8, fontFamily:M, fontSize:12, fontWeight:700, letterSpacing:1, textTransform:"uppercase", textDecoration:"none" }}>↓ Download {filename}</a>
        <button onClick={onClose} style={{ marginLeft:10, padding:"11px 18px", background:"transparent", border:"1px solid var(--border)", color:"var(--fg-dim)", borderRadius:8, fontFamily:M, fontSize:12, cursor:"pointer" }}>Close</button>
        <pre style={{ marginTop:16, padding:12, background:"var(--bg)", border:"1px solid var(--border)", borderRadius:8, fontFamily:M, fontSize:9.5, color:"var(--muted)", maxHeight:160, overflow:"auto", whiteSpace:"pre" }}>{csv.split("\n").slice(0,6).join("\n")}{"\n…"}</pre>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ APP ══ */
const PRODUCT_TABS = CAT_ORDER.map(k => [k, CATS[k].label]);
const KINDS = [["menu","Menu"],["picks","Staff Picks"],["deals","Deals"]];
const DEFAULT_CONFIG = {
  storeName:"Flower Spectrum", license:"", location:"Portfolio demonstration",
  date:new Date().toISOString().slice(0,10), footer:"Illustrative catalog · Verify prices before use",
};
function defaultText(category, kind) {
  if (category === "cards") return { title:"The Aroma Spectrum", subtitle:"Ten aromas, the terpenes behind each, and what's in the case right now." };
  const cat = CATS[category], L = cat.label, tag = cat.key === "tags";
  if (kind === "picks") return { title:`${L} — Staff Picks`, subtitle:"The ones we'd spend our own money on. Chosen by people who work the floor." };
  if (kind === "deals") return { title:`${L} Deals`, subtitle: tag ? "This week's best value across the case." : "Find a discounted pick in the aroma you already love." };
  const subs = {
    flower:"Organized by terpene profile, not indica/sativa. The nose knows — explore the supplied aroma model.",
    preroll:"Singles and packs, grouped by the aroma profile of the flower inside.",
    concentrate:"Solventless and live — grouped by the aroma their terpenes actually express.",
    vape:"Carts and pods, sorted by what's inside: process and cannabinoids.",
    edible:"Sorted by what matters most here — onset, cannabinoids, and dietary tags.",
  };
  return { title:`${L}, by ${tag ? "Tag" : "Aroma"}`, subtitle: subs[category] || "" };
}

export default function App() {
  const [allRows, setRows] = usePrintCatalog();
  const requestedIds=new URLSearchParams(location.hash.split('?')[1]).get('ids');
  const rows=useMemo(()=>requestedIds?allRows.filter(p=>requestedIds.split(',').includes(p.id)):allRows,[allRows,requestedIds]);
  const [category, setCategory] = useState("flower");   // CAT_ORDER key or "cards"
  const [kind, setKind] = useState("menu");             // menu | picks | deals
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [textOv, setTextOv] = useState({});             // overrides keyed `${category}:${kind}`
  const [showData, setShowData] = useState(false);
  const [showCfg, setShowCfg] = useState(false);
  const [orientation, setOrientation] = useState("portrait");
  const [columns, setColumns] = useState(2);
  const [sortKey, setSortKey] = useState("default");
  const [groupBy, setGroupBy] = useState("profile");
  const [showKey, setShowKey] = useState(true);
  const [cardSet, setCardSet] = useState("both");
  const [vis, setVis] = useState({ lineage:true, grow:true, aroma:true, terps:true, tags:true, potency:true });
  const [zoom, setZoom] = useState(0.62);
  const [csv, setCsv] = useState(null);

  const isCards = category === "cards";
  const cat = isCards ? null : CATS[category];
  const isTag = cat && cat.key === "tags";
  const classified = useMemo(() => rows.map(s => ({ ...s, _c: classifyRow(s) })), [rows]);
  const catRows = useMemo(() => classified.filter(s => (s.category||"flower") === category), [classified, category]);

  const textKey = isCards ? "cards" : `${category}:${kind}`;
  const mt = textOv[textKey] || defaultText(category, kind);
  const setText = (field, val) => setTextOv(prev => ({ ...prev, [textKey]: { ...(prev[textKey]||defaultText(category,kind)), [field]: val } }));

  // ── id-based row handlers (table shows a category-filtered subset) ──
  const editRow = useCallback((id, path, val) => setRows(prev => prev.map(s => {
    if (s.id !== id) return s;
    if (path.startsWith('price.')) val=val===null?null:Math.max(0,Number(val)||0);
    if (path==='dealPct' && val!=='') val=String(Math.max(0,Math.min(100,Number(val)||0)));
    if (path==='thc') val=val===null?null:Math.max(0,Math.min(s.category==='edible'?100000:100,Number(val)||0));
    if (path.includes(".")) { const [a,b] = path.split("."); return { ...s, [a]: { ...(s[a]||{}), [b]: val } }; }
    return { ...s, [path]: val };
  })), []);
  const toggleTag = useCallback((id, key) => setRows(prev => prev.map(s => {
    if (s.id !== id) return s; const has = (s.tags||[]).includes(key);
    return { ...s, tags: has ? s.tags.filter(t=>t!==key) : [...(s.tags||[]), key] };
  })), []);
  const addRow = useCallback(() => {
    const c = CATS[category] || CATS.flower;
    const price = {}; [c.priceMain[0], c.priceSub[0]].forEach(f => price[f]=0);
    const base = { id:uid(), category, name:`New ${c.label.replace(/s$/,"")}`, grower:"", lineage:"", aroma:"",
      thc:0, tier:"top", price, dealPct:"", staffPick:null, notes:"", real:false };
    const row = c.key === "tags"
      ? { ...base, tags:[], values:null, manual:null }
      : { ...base, growMethod:"Indoor", values:null, manual:{ primary:"gas_fuel", confidence:"Leaning" }, tags:[] };
    setRows(prev => [row, ...prev]);
  }, [category]);
  const dupRow = useCallback(id => setRows(prev => { const i = prev.findIndex(s=>s.id===id); if (i<0) return prev;
    const c = { ...JSON.parse(JSON.stringify(prev[i])), id:uid(), name:prev[i].name+" (copy)" }; return [...prev.slice(0,i+1), c, ...prev.slice(i+1)]; }), []);
  const delRow = useCallback(id => setRows(prev => prev.filter(s=>s.id!==id)), []);
  const applyRule = useCallback((pct, max) => {
    const p = parseFloat(pct), m = parseFloat(max); if (isNaN(p) || p<=0) return;
    setRows(prev => prev.map(s => {
      if ((s.category||"flower") !== category) return s;
      const mainF = (CATS[s.category]||CATS.flower).priceMain[0];
      const v = parseFloat(s.price?.[mainF]);
      if (!isNaN(v) && (isNaN(m) || v < m) && !(parseFloat(s.dealPct)>0)) return { ...s, dealPct:String(p) };
      return s;
    }));
  }, [category]);
  const clearDeals = useCallback(() => setRows(prev => prev.map(s => (s.category||"flower")===category ? { ...s, dealPct:"" } : s)), [category]);
  const exportCSV = useCallback(() => setCsv({ text: toCSV(catRows), name:`${BUILD}-fs-menu-${category}-${VERSION}.csv` }), [catRows, category]);

  // adaptive control option sets
  const groupOpts = isTag ? [["tag","By Tag"],["tier","Tier"],["none","None"]] : [["profile","Aroma Profile"],["tier","Tier"],["none","None"]];
  const visKeys = isTag ? [["lineage","Detail"],["aroma","Desc"],["tags","Tags"],["potency","Potency"]]
                        : [["lineage","Lineage"],["grow","Grow"],["aroma","Aroma"],["terps","Terps"],["tags","Tags"],["potency","Potency"]];

  return (
    <div style={{
      "--bg":"#0e0e0c","--surface":"#181715","--border":"#2a2824",
      "--fg":"#e8e3d9","--fg-dim":"#a8a092","--muted":"#6e675b","--accent":"#6AAFA0",
      "--display":"'Newsreader',Georgia,serif","--body":"'DM Sans',system-ui,sans-serif","--mono":"'JetBrains Mono',monospace",
      minHeight:"100vh", background:"var(--bg)", color:"var(--fg)", fontFamily:"var(--body)",
    }}>
      <style>{`
        *{box-sizing:border-box} button{font:inherit}
        input,select{outline:none}
        @media print {
          .fs-no-print{ display:none !important; }
          .fs-sheet{ box-shadow:none !important; margin:0 !important; }
          .fs-group,.fs-row,.fs-pick,.fs-deal,.fs-card{ break-inside:avoid; page-break-inside:avoid; }
          body{ -webkit-print-color-adjust:exact; print-color-adjust:exact; }
          @page{ size: letter ${orientation}; margin:0; }
        }`}</style>

      <CsvModal csv={csv?.text} filename={csv?.name} onClose={()=>setCsv(null)} />

      {/* TOOLBAR */}
      <div className="fs-no-print" style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:14, padding:"12px clamp(14px,3vw,28px)", borderBottom:"1px solid var(--border)", position:"sticky", top:0, background:"var(--bg)", zIndex:60 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ display:"flex", gap:2 }}>{PROFILES.slice(0,6).map(p=><span key={p.key} style={{ width:5, height:16, background:p.color, borderRadius:1 }}/>)}</div>
          <span style={{ fontFamily:D, fontSize:17, fontWeight:600, letterSpacing:"-0.01em", color:"var(--fg)" }}>Flower Spectrum <span style={{ color:"var(--accent)" }}>Menu</span></span>
          <span style={{ fontFamily:M, fontSize:9, letterSpacing:1.5, color:"var(--muted)", border:"1px solid var(--border)", padding:"2px 6px", borderRadius:3 }}>FS-MENU-GEN · {VERSION}</span>
        </div>
        <div style={{ flex:1 }}/>
        <div style={{ display:"flex", gap:7, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ display:"flex", border:"1px solid var(--border)", borderRadius:6, overflow:"hidden" }}>
            {[["portrait","▯ Portrait"],["landscape","▭ Landscape"]].map(([k,l])=>(
              <button key={k} onClick={()=>setOrientation(k)} style={{ background: orientation===k?"var(--accent)":"transparent", color: orientation===k?"#0e0e0c":"var(--fg-dim)", border:"none", padding:"7px 11px", fontFamily:M, fontSize:9.5, letterSpacing:0.5, cursor:"pointer" }}>{l}</button>
            ))}
          </div>
          <button onClick={()=>setShowCfg(v=>!v)} style={tbtn(showCfg)}>Header</button>
          {!isCards && <button onClick={()=>setShowData(v=>!v)} style={tbtn(showData)}>⚙ Data</button>}
          {!isCards && <button onClick={exportCSV} style={tbtn()}>↓ CSV</button>}
          <button onClick={()=>window.print()} style={tbtn(true)}>⎙ Print</button>
        </div>
      </div>

      {/* CATEGORY TABS */}
      <div className="fs-no-print" style={{ display:"flex", gap:4, padding:"14px clamp(14px,3vw,28px) 0", borderBottom:"1px solid var(--border)", flexWrap:"wrap" }}>
        {requestedIds&&<a href="#print" style={{color:"#6aafa0",padding:10}}>Shortlist menu · show all flower ↗</a>}{PRODUCT_TABS.map(([k,label]) => (
          <button key={k} onClick={()=>{ setCategory(k); setSortKey("default"); setGroupBy(CATS[k].key==="tags"?"tag":"profile"); }} style={catTab(category===k)}>{label}</button>
        ))}
        <button onClick={()=>setCategory("cards")} style={{ ...catTab(isCards), marginLeft:8, borderColor: isCards?"var(--accent)":"#3a4f49", color: isCards?"var(--fg)":"#6AAFA0" }}>✦ Aroma Cards</button>
      </div>

      {/* KIND toggle (product categories only) */}
      {!isCards && (
        <div className="fs-no-print" style={{ display:"flex", gap:6, padding:"12px clamp(14px,3vw,28px) 0", alignItems:"center", flexWrap:"wrap" }}>
          <span style={{ fontFamily:M, fontSize:9, color:"var(--muted)", letterSpacing:1.5, textTransform:"uppercase", marginRight:4 }}>{cat.label} ·</span>
          {KINDS.map(([k,label]) => (
            <button key={k} onClick={()=>setKind(k)} style={{ background: kind===k?"var(--accent)":"transparent", color: kind===k?"#0e0e0c":"var(--fg-dim)", border:`1px solid ${kind===k?"var(--accent)":"var(--border)"}`, padding:"5px 13px", borderRadius:20, fontFamily:M, fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase", cursor:"pointer" }}>{label}</button>
          ))}
          <span style={{ fontFamily:M, fontSize:9, color:"var(--muted)", marginLeft:6 }}>{isTag ? "tags-keyed" : "aroma-keyed"} · {catRows.length} products</span>
        </div>
      )}

      {/* CONFIG (store/compliance + this menu's title/subtitle) */}
      {showCfg && (
        <div className="fs-no-print" style={{ background:"var(--surface)", borderBottom:"1px solid var(--border)", borderTop:"1px solid var(--border)", marginTop:12, padding:"14px clamp(14px,3vw,28px)", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:12 }}>
          <Field label="Store"><input value={config.storeName} onChange={e=>setConfig({ ...config, storeName:e.target.value })} style={cfgIn}/></Field>
          <Field label="License (optional)"><input value={config.license} onChange={e=>setConfig({ ...config, license:e.target.value })} style={cfgIn}/></Field>
          <Field label="Location"><input value={config.location} onChange={e=>setConfig({ ...config, location:e.target.value })} style={cfgIn}/></Field>
          <Field label="Date"><input type="date" value={config.date} onChange={e=>setConfig({ ...config, date:e.target.value })} style={cfgIn}/></Field>
          <Field label="Footer / compliance"><input value={config.footer} onChange={e=>setConfig({ ...config, footer:e.target.value })} style={cfgIn}/></Field>
          <Field label={isCards?"Cards Title":"Menu Title"}><input value={mt.title} onChange={e=>setText("title",e.target.value)} style={cfgIn}/></Field>
          <Field label="Subtitle"><input value={mt.subtitle} onChange={e=>setText("subtitle",e.target.value)} style={cfgIn}/></Field>
        </div>
      )}

      <div style={{ maxWidth:1180, margin:"0 auto", padding:"22px clamp(14px,3vw,28px) 80px" }}>
        {!isCards && showData && (
          <DataBackend rows={catRows} onEdit={editRow} onAdd={addRow} onDup={dupRow} onDel={delRow}
            onExport={exportCSV} onApplyRule={applyRule} onClearDeals={clearDeals} onToggleTag={toggleTag}
            category={category} showDeals={kind==="deals"} />
        )}

        {/* PREVIEW CONTROLS */}
        <div className="fs-no-print" style={{ display:"flex", gap:14, alignItems:"center", flexWrap:"wrap", marginBottom:14 }}>
          <span style={{ fontFamily:M, fontSize:10, color:"var(--accent)", letterSpacing:2, textTransform:"uppercase" }}>
            {isCards ? "Aroma Cards" : `${cat.label} · ${KINDS.find(k=>k[0]===kind)[1]}`} · Print Preview
          </span>

          {isCards ? (
            <Ctl label="Cards"><select value={cardSet} onChange={e=>setCardSet(e.target.value)} style={selS}>
              <option value="profiles">Profile cards</option><option value="terps">Terpene cards</option><option value="both">Both</option>
            </select></Ctl>
          ) : (kind==="menu") && (
            <>
              <Ctl label="Group"><select value={groupBy} onChange={e=>setGroupBy(e.target.value)} style={selS}>
                {groupOpts.map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select></Ctl>
              <Ctl label="Key"><input type="checkbox" checked={showKey} onChange={e=>setShowKey(e.target.checked)} style={{ accentColor:"var(--accent)" }}/></Ctl>
              <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                <span style={{ fontFamily:M, fontSize:9, color:"var(--muted)", letterSpacing:1, textTransform:"uppercase" }}>Cols:</span>
                {visKeys.map(([k,l])=>(
                  <label key={k} style={{ display:"flex", alignItems:"center", gap:3, fontFamily:M, fontSize:9, color:"var(--fg-dim)", cursor:"pointer" }}>
                    <input type="checkbox" checked={vis[k]} onChange={e=>setVis(v=>({ ...v, [k]:e.target.checked }))} style={{ accentColor:"var(--accent)" }}/>{l}
                  </label>
                ))}
              </div>
            </>
          )}

          {!isCards && (
            <Ctl label="Sort"><select value={sortKey} onChange={e=>setSortKey(e.target.value)} style={selS}>
              <option value="default">Default</option><option value="name">Name A–Z</option>
              <option value="price_desc">Price high→low</option><option value="price_asc">Price low→high</option>
              <option value="thc_desc">Potency high→low</option>
              {!isTag && <option value="terps_desc">Terps high→low</option>}
              {kind==="deals" && <option value="deal_desc">% Off high→low</option>}
            </select></Ctl>
          )}
          {orientation==="landscape" && (
            <Ctl label="Columns"><select value={columns} onChange={e=>setColumns(parseInt(e.target.value))} style={selS}>
              <option value={1}>1</option><option value={2}>2</option><option value={3}>3</option>
            </select></Ctl>
          )}
          <div style={{ marginLeft:"auto", display:"flex", gap:4, alignItems:"center" }}>
            <button onClick={()=>setZoom(z=>Math.max(0.3,z-0.08))} style={tbtn()}>−</button>
            <span style={{ fontFamily:M, fontSize:10, color:"var(--muted)", minWidth:38, textAlign:"center" }}>{Math.round(zoom*100)}%</span>
            <button onClick={()=>setZoom(z=>Math.min(1.1,z+0.08))} style={tbtn()}>+</button>
          </div>
        </div>

        {/* PREVIEW SURFACE */}
        <div className="print-preview-surface" style={{ background:"#1f1d1a", borderRadius:10, padding:"24px 0", overflow:"auto" }}>
          <PrintPages orientation={orientation} columns={isCards?Math.max(2,columns):orientation==="landscape"?columns:1} zoom={zoom}>
            {isCards && <AromaCards list={classified} config={config} menuText={mt} orientation={orientation} cardSet={cardSet} cardCols={Math.max(2,orientation==="landscape"?Math.max(columns,2):columns)} />}
            {!isCards && kind==="menu"  && <ProductMenu list={catRows} config={config} menuText={mt} showKey={showKey} sortKey={sortKey} groupBy={groupBy} orientation={orientation} columns={columns} cols={vis} category={category} />}
            {!isCards && kind==="picks" && <StaffPicksMenu list={catRows} config={config} menuText={mt} sortKey={sortKey} orientation={orientation} columns={columns} category={category} />}
            {!isCards && kind==="deals" && <DealsMenu list={catRows} config={config} menuText={mt} sortKey={sortKey} orientation={orientation} columns={columns} category={category} />}
          </PrintPages>
        </div>
      </div>

      {/* FOOTER */}
      <div className="fs-no-print" style={{ borderTop:"1px solid var(--border)", padding:"20px clamp(14px,3vw,28px)", textAlign:"center" }}>
        <div style={{ fontFamily:M, fontSize:9, color:"var(--muted)", letterSpacing:2, textTransform:"uppercase" }}>Flower Spectrum · Menu Generator · {VERSION} · {BUILD}</div>
        <div style={{ fontFamily:B, fontSize:11, color:"var(--muted)", marginTop:5 }}>CannaCre8ive · Aroma classification, not effects or medical claims · cannacre8ive.com</div>
      </div>
    </div>
  );
}

const catTab = (on=false) => ({
  padding:"10px 16px", border:`1px solid ${on?"var(--accent)":"var(--border)"}`,
  borderBottom: on?"1px solid var(--bg)":"1px solid var(--border)", borderRadius:"8px 8px 0 0", marginBottom:-1,
  background: on?"var(--surface)":"transparent", color: on?"var(--fg)":"var(--muted)",
  fontFamily:"var(--mono)", fontSize:11, letterSpacing:1, textTransform:"uppercase", cursor:"pointer",
});

function Ctl({ label, children }) {
  return <label style={{ display:"flex", alignItems:"center", gap:6, fontFamily:M, fontSize:10, color:"var(--fg-dim)", textTransform:"uppercase", letterSpacing:0.5 }}>{label}{children}</label>;
}
const tbtn = (on=false) => ({ background: on?"var(--accent)":"transparent", color: on?"#0e0e0c":"var(--fg-dim)", border:`1px solid ${on?"var(--accent)":"var(--border)"}`, padding:"7px 12px", borderRadius:6, fontFamily:"var(--mono)", fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:"uppercase", cursor:"pointer", whiteSpace:"nowrap" });
const cfgIn = { background:"var(--bg)", border:"1px solid var(--border)", color:"var(--fg)", fontFamily:"var(--body)", fontSize:12, padding:"6px 9px", borderRadius:5, width:"100%" };
