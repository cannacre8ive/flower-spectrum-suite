import { useState, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   FLOWER SPECTRUM · EDUCATION MATERIALS
   Print-first teaching set, generated from the same data as the tools.
   1. The Nose Knows — Primer (customer)
   2. The Ten Profiles — Reference (customer + staff)
   3. Major Terpenes — Library (staff)
   4. Minor & Supporting Terpenes (staff / enthusiast)
   5. Budtender Quick-Reference (staff)
   6. The Great THC Myth — Myth vs. Fact (customer)          ← v1.1
   7. How to Read a Jar — Sensory how-to (customer + staff)  ← v1.1
   8. The Science of Smell — Why it works (enthusiast)       ← v1.1
   9. Find Your Profile — Interactive aroma key (customer)   ← v1.1
   Effect language: aroma-led, with traditionally-associated leans, hedged.
   Piece 9 quiz logic is a PREFERENCE ROUTER over PROFILES — NOT the 38-terpene
   classifier engine. It adds no copy to the §17 engine-propagation register.
   ═══════════════════════════════════════════════════════════════════════════ */

const VERSION = "v1.1";
const BUILD = "06_19_2026";

const PROFILES = [
  { key:"gas_fuel", label:"Gas / Fuel", color:"#C9A84C", short:"GAS",
    tagline:"Loud, pungent diesel and chemical funk",
    sensory:"Pungent diesel, solvent, and aggressive skunk. The loudest jar on the shelf — it announces itself before you open it.",
    lean:"Often associated with heavy, full-bodied, deeply relaxing experiences.",
    drivers:["β-Caryophyllene","D-Limonene","Myrcene","α-Humulene"],
    foundWith:["spicy_warm","earthy_dank"],
    examples:["Sour Diesel","Motorbreath #15"],
    note:"Gas is the one profile that emerges from a balance of several terpenes rather than a single driver — when caryophyllene, limonene, and myrcene/humulene all land in similar amounts, you get diesel." },
  { key:"earthy_dank", label:"Earthy / Dank", color:"#6B8E5A", short:"EARTH",
    tagline:"Deep soil, musk, and weight",
    sensory:"Wet forest floor, damp soil, fresh-cut mushroom. Grounded and heavy, with an old-school musk that reads as substantial.",
    lean:"Traditionally linked to grounding, restful, body-forward experiences.",
    drivers:["Myrcene","α-Humulene"],
    foundWith:["gas_fuel","herbal_woody"],
    examples:["Meat Stomper","Afghan Kush"] },
  { key:"citrus_bright", label:"Citrus / Bright", color:"#D4A843", short:"CITRUS",
    tagline:"Zesty lemon, orange, grapefruit",
    sensory:"Fresh-cut citrus rind, lemon zest, ripe orange. Sharp and uplifting — the brightest, most awake corner of the spectrum.",
    lean:"Commonly associated with bright, uplifting, social energy.",
    drivers:["D-Limonene","Valencene"],
    foundWith:["fruity_sweet","piney_fresh"],
    examples:["Layer Cake"] },
  { key:"fruity_sweet", label:"Fruity / Sweet", color:"#B75F4A", short:"FRUIT",
    tagline:"Juicy, candy, ripe stone fruit",
    sensory:"Berry, stone fruit, candy. The sweetest, juiciest profile — often led by terpinolene's haze-like fruit-fresh character.",
    lean:"Often described as balanced and gently mood-lifting.",
    drivers:["Terpinolene","β-Ocimene","β-Farnesene"],
    foundWith:["floral_soft","tropical_tangy"],
    examples:["Positive Mental Attitude","Cascade Orange","Mt. Hood Magic"] },
  { key:"floral_soft", label:"Floral / Soft", color:"#B98BBE", short:"FLORAL",
    tagline:"Lavender, rose, perfumed softness",
    sensory:"Crushed lavender, rose petal, soft perfume. Delicate and aromatic — the calmest corner of the spectrum.",
    lean:"Traditionally linked to calm, soothing, wind-down experiences.",
    drivers:["Linalool","α-Bisabolol","trans-Nerolidol","α-Terpineol"],
    foundWith:["dessert_creamy","fruity_sweet"],
    examples:["Lavender Haze"] },
  { key:"dessert_creamy", label:"Dessert / Creamy", color:"#D6B58A", short:"DESSERT",
    tagline:"Vanilla, cake, rich and smooth",
    sensory:"Vanilla, cake batter, sweet cream. Smooth and indulgent — sits on top of other profiles rather than driving them.",
    lean:"Often associated with smooth, mellow, indulgent relaxation.",
    drivers:["Linalool + α-Bisabolol over a sweet, spicy base"],
    foundWith:["floral_soft","spicy_warm"],
    examples:["Wedding Cake Gelato","Ice Cream Cake"],
    combination:true,
    note:"A combination profile — it emerges from soft florals layered over sweetness and warmth, not from a single 'dessert' terpene. These strains classify Primary Floral or Spicy on a COA; the culture calls them dessert." },
  { key:"spicy_warm", label:"Spicy / Warm", color:"#9E6B4A", short:"SPICY",
    tagline:"Black pepper, clove, warm spice",
    sensory:"Cracked black pepper, clove, baking spice. Warm and assertive — the only profile dominated by a single aromatic heavyweight.",
    lean:"Commonly linked to warming, grounding, balanced experiences.",
    drivers:["β-Caryophyllene","Caryophyllene Oxide","α-Humulene"],
    foundWith:["gas_fuel","herbal_woody"],
    examples:["Gorilla Glue #4","Do Si Dos"] },
  { key:"piney_fresh", label:"Piney / Fresh", color:"#4F7A5B", short:"PINE",
    tagline:"Pine, fir, crisp mountain air",
    sensory:"Pine needle, Douglas fir, crisp mountain air. Sharp and resinous — clean, bracing, often invigorating.",
    lean:"Often associated with clear-headed, alert, focused energy.",
    drivers:["α-Pinene","β-Pinene","Camphene","Δ-3-Carene"],
    foundWith:["herbal_woody","citrus_bright"],
    examples:["Trainwreck","Mountain Crest"] },
  { key:"herbal_woody", label:"Herbal / Woody", color:"#7FA688", short:"HERB",
    tagline:"Loose tea, sage, fresh-cut wood",
    sensory:"Loose-leaf tea, sage, dry hop, fresh sawn wood. Dry and savory — refined and understated, more 'considered' than loud.",
    lean:"Traditionally linked to mellow, contemplative, even-keeled experiences.",
    drivers:["α-Humulene","Guaiol","Fenchol","Eucalyptol"],
    foundWith:["piney_fresh","spicy_warm"],
    examples:["Northern Lights","Headband"] },
  { key:"tropical_tangy", label:"Tropical / Tangy", color:"#D28B49", short:"TROPIC",
    tagline:"Mango, guava, sun-ripened fruit",
    sensory:"Mango, guava, passionfruit. Exotic and tangy — vibrant fruit you'd find in a juice bar, not a pie.",
    lean:"Often described as vibrant, playful, and energizing.",
    drivers:["β-Ocimene","Terpinolene","Valencene"],
    foundWith:["fruity_sweet","citrus_bright"],
    examples:["Pineapple Express","Maui Wowie"] },
];
const PBK = Object.fromEntries(PROFILES.map(p => [p.key, p]));

// ── TERPENE LIBRARY (full data, reused from classifier v1.2) ──
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
const POT_DEF = { primary:1.0, impact:1.1, trace:0.7 };
const potOf = t => (t.potency != null ? t.potency : POT_DEF[t.tier]);
const TBK = Object.fromEntries(TERPENES.map(t => [t.key, t]));

// idealized spectrum % for a profile — the canonical "pure" shape for teaching
function idealPct(p) {
  const o = {}; PROFILES.forEach(x => o[x.key] = 6);
  o[p.key] = 100;
  (p.foundWith || []).forEach((k,i) => o[k] = i === 0 ? 40 : 30);
  return o;
}

function wedge(cx,cy,ir,or_,sa,ea){
  const f=v=>v.toFixed(2);
  const x1=cx+ir*Math.cos(sa),y1=cy+ir*Math.sin(sa),x2=cx+or_*Math.cos(sa),y2=cy+or_*Math.sin(sa);
  const x3=cx+or_*Math.cos(ea),y3=cy+or_*Math.sin(ea),x4=cx+ir*Math.cos(ea),y4=cy+ir*Math.sin(ea);
  return `M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)} A${f(or_)} ${f(or_)} 0 0 1 ${f(x3)} ${f(y3)} L${f(x4)} ${f(y4)} A${f(ir)} ${f(ir)} 0 0 0 ${f(x1)} ${f(y1)} Z`;
}

// Spectrum fingerprint — 10 fixed sectors from explicit percentages
function Fingerprint({ pct, size=104, highlight=null }) {
  const cx=size/2, cy=size/2, maxR=size*0.46, minR=size*0.13;
  const n=PROFILES.length, slice=2*Math.PI/n, gap=0.05;
  const maxV=Math.max(...Object.values(pct), 1);
  const guides=[0.5,1.0].map(f=>minR+f*(maxR-minR));
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ display:"block" }}>
      {guides.map((r,i)=><circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke="#cdbfa6" strokeWidth={0.5} strokeDasharray="2 4"/>)}
      <circle cx={cx} cy={cy} r={maxR} fill="none" stroke="#cdbfa6" strokeWidth={0.75}/>
      {PROFILES.map((p,i)=>{
        const v=pct[p.key]||0, has=v>0.5;
        const r=has?minR+(v/maxV)*(maxR-minR):minR+size*0.015;
        const sa=-Math.PI/2+i*slice+gap/2, ea=-Math.PI/2+(i+1)*slice-gap/2;
        const dim=highlight&&highlight!==p.key;
        return <path key={p.key} d={wedge(cx,cy,minR,r,sa,ea)} fill={p.color} opacity={has?(dim?0.3:0.95):0.18}/>;
      })}
      <circle cx={cx} cy={cy} r={size*0.025} fill={highlight?PBK[highlight].color:"#8a8170"}/>
    </svg>
  );
}

// terpenes that drive / support a given profile
function terpsForProfile(pk) {
  const primary = TERPENES.filter(t => t.profile === pk);
  const secondary = TERPENES.filter(t => (t.also||[]).includes(pk));
  return { primary, secondary };
}

// ── shared paper styling ──
const D = "'Newsreader',Georgia,serif";
const B = "'DM Sans',system-ui,sans-serif";
const M = "'JetBrains Mono',monospace";
const PAPER = { background:"#f4efe4", color:"#1a1816", borderRadius:6, boxShadow:"0 8px 40px rgba(0,0,0,0.5)", padding:"44px 48px", maxWidth:760, margin:"0 auto" };
const INK = "#15130f", DIM = "#5e574d", FAINT = "#8a8170", RULE = "#d8cdb8";

const Kicker = ({ children, color=INK }) => <div style={{ fontFamily:M, fontSize:10, letterSpacing:3, textTransform:"uppercase", color, marginBottom:10 }}>{children}</div>;
const Rule = () => <div style={{ height:1, background:RULE, margin:"22px 0" }}/>;

function ColorKey({ small=false }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap: small?"5px 14px":"8px 20px" }}>
      {PROFILES.map(p => (
        <span key={p.key} style={{ display:"flex", alignItems:"center", gap:7, fontFamily:M, fontSize: small?9.5:11, color:INK }}>
          <span style={{ width: small?10:12, height: small?10:12, borderRadius:3, background:p.color }}/>{p.label}
        </span>
      ))}
    </div>
  );
}

// ═══ PIECE 1 — THE NOSE KNOWS (Primer, customer) ═══
function PrimerSheet() {
  return (
    <div className="fs-sheet" data-piece="primer" style={PAPER}>
      <div style={{ display:"flex", gap:3, marginBottom:18 }}>{PROFILES.map(p=><span key={p.key} style={{width:8,height:24,background:p.color}}/>)}</div>
      <Kicker>Flower Spectrum · A Field Primer</Kicker>
      <h1 style={{ fontFamily:D, fontSize:40, fontWeight:700, lineHeight:1.05, margin:"0 0 8px", color:INK }}>The nose knows.</h1>
      <p style={{ fontFamily:D, fontSize:18, fontStyle:"italic", color:DIM, margin:"0 0 24px", lineHeight:1.4 }}>This is just the science catching up to what people have always known.</p>

      <p style={{ fontFamily:B, fontSize:15, lineHeight:1.7, color:"#2a2620", margin:"0 0 16px" }}>
        For years, shopping for flower has meant chasing one number: <strong>THC</strong>. But THC only tells you how <em>strong</em> something is — never how it will smell, taste, or make you feel. Two flowers at the same THC can be completely different experiences.
      </p>
      <p style={{ fontFamily:B, fontSize:15, lineHeight:1.7, color:"#2a2620", margin:"0 0 16px" }}>
        What actually shapes that experience are <strong>terpenes</strong> — the aromatic compounds that give every flower its smell. They're the difference between a jar that reads as bright lemon and one that reads as heavy diesel. Your nose has always picked up on them. The Flower Spectrum just gives them names and colors.
      </p>

      <Rule/>
      <Kicker>How To Read It</Kicker>
      <p style={{ fontFamily:B, fontSize:14, lineHeight:1.7, color:"#2a2620", margin:"0 0 14px" }}>
        Every flower is sorted into one of ten aroma profiles, each with its own color. A label's colored band tells you the profile at a glance — a solid band means one aroma dominates; a split band means it's a blend of two or three. The bigger the color, the more it leads.
      </p>
      <div style={{ padding:"16px 18px", background:"#ece4d3", borderRadius:8, marginBottom:18 }}>
        <div style={{ fontFamily:M, fontSize:9, letterSpacing:1.5, textTransform:"uppercase", color:FAINT, marginBottom:10 }}>The Ten Aroma Profiles</div>
        <ColorKey/>
      </div>
      <p style={{ fontFamily:B, fontSize:14, lineHeight:1.7, color:"#2a2620", margin:0 }}>
        Find a smell you're drawn to, and you'll find flower you enjoy — far more reliably than chasing a percentage. Ask any budtender to walk you across the spectrum. <strong>Trust your nose. It's smarter than the number.</strong>
      </p>
      <div style={{ marginTop:24, paddingTop:14, borderTop:`2px solid ${INK}`, display:"flex", justifyContent:"space-between", fontFamily:M, fontSize:8.5, color:FAINT, letterSpacing:1 }}>
        <span>FLOWER SPECTRUM SYSTEM</span><span>AROMA CLASSIFICATION · NOT EFFECTS OR MEDICAL CLAIMS</span>
      </div>
    </div>
  );
}

// ═══ PIECE 2 — THE TEN PROFILES (Reference, customer + staff) ═══
function ProfileCardEdu({ p }) {
  return (
    <div className="fs-card" style={{ border:`1px solid ${p.color}`, borderTop:`5px solid ${p.color}`, borderRadius:6, padding:"16px 18px", background:"#faf6ec", breakInside:"avoid" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:M, fontSize:8.5, letterSpacing:2, textTransform:"uppercase", color:p.color, marginBottom:3 }}>{p.short}</div>
          <div style={{ fontFamily:D, fontSize:20, fontWeight:700, color:INK, lineHeight:1 }}>{p.label}</div>
          <div style={{ fontFamily:D, fontSize:13, fontStyle:"italic", color:DIM, marginTop:2 }}>{p.tagline}</div>
        </div>
        <Fingerprint pct={idealPct(p)} size={66} highlight={p.key}/>
      </div>
      <p style={{ fontFamily:B, fontSize:12, lineHeight:1.55, color:"#2a2620", margin:"10px 0 10px" }}>{p.sensory}</p>
      <div style={{ display:"flex", gap:6, alignItems:"flex-start", padding:"7px 10px", background:"#efe7d6", borderRadius:6, marginBottom:10 }}>
        <span style={{ fontFamily:M, fontSize:7.5, letterSpacing:1, textTransform:"uppercase", color:p.color, marginTop:1, flexShrink:0 }}>Lean</span>
        <span style={{ fontFamily:B, fontSize:10.5, fontStyle:"italic", color:DIM, lineHeight:1.4 }}>{p.lean}</span>
      </div>
      <div style={{ fontFamily:M, fontSize:8, letterSpacing:1, textTransform:"uppercase", color:FAINT, marginBottom:4 }}>Driven By</div>
      <div style={{ fontFamily:B, fontSize:11, color:"#2a2620", marginBottom:8 }}>{p.drivers.join(" · ")}</div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", gap:8 }}>
        <div>
          <div style={{ fontFamily:M, fontSize:8, letterSpacing:1, textTransform:"uppercase", color:FAINT, marginBottom:3 }}>Found With</div>
          <div style={{ display:"flex", gap:8 }}>{p.foundWith.map(k=>(
            <span key={k} style={{ display:"flex", alignItems:"center", gap:4, fontFamily:M, fontSize:9, color:DIM }}><span style={{width:7,height:7,borderRadius:"50%",background:PBK[k].color}}/>{PBK[k].label.split(" / ")[0]}</span>
          ))}</div>
        </div>
        <div style={{ textAlign:"right", maxWidth:"50%" }}>
          <div style={{ fontFamily:M, fontSize:8, letterSpacing:1, textTransform:"uppercase", color:FAINT, marginBottom:3 }}>On Our Shelf</div>
          <div style={{ fontFamily:B, fontSize:10.5, fontStyle:"italic", color:p.color }}>{p.examples.join(", ")}</div>
        </div>
      </div>
    </div>
  );
}
function ProfilesSheet() {
  return (
    <div className="fs-sheet" data-piece="profiles" style={PAPER}>
      <Kicker>Flower Spectrum · Reference</Kicker>
      <h1 style={{ fontFamily:D, fontSize:34, fontWeight:700, lineHeight:1.05, margin:"0 0 6px", color:INK }}>The Ten Aroma Profiles</h1>
      <p style={{ fontFamily:B, fontSize:14, color:DIM, margin:"0 0 8px", lineHeight:1.5 }}>Every flower lives somewhere on this spectrum. Find the smell you love; the rest follows.</p>
      <p style={{ fontFamily:B, fontSize:11, fontStyle:"italic", color:FAINT, margin:"0 0 20px" }}>The "lean" notes are traditional aromatic associations, not medical claims — effects vary by person, dose, and setting.</p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        {PROFILES.map(p => <ProfileCardEdu key={p.key} p={p}/>)}
      </div>
      <div style={{ marginTop:22, paddingTop:14, borderTop:`2px solid ${INK}`, display:"flex", justifyContent:"space-between", fontFamily:M, fontSize:8.5, color:FAINT, letterSpacing:1 }}>
        <span>FLOWER SPECTRUM SYSTEM · {VERSION}</span><span>AROMA CLASSIFICATION · NOT EFFECTS OR MEDICAL CLAIMS</span>
      </div>
    </div>
  );
}

// ── terpene entry row (staff library) ──
function TerpRow({ t }) {
  const prof = PBK[t.profile];
  return (
    <div className="fs-card" style={{ display:"flex", gap:12, padding:"11px 0", borderBottom:`1px solid ${RULE}`, breakInside:"avoid" }}>
      <div style={{ width:4, alignSelf:"stretch", background:prof.color, borderRadius:2, flexShrink:0 }}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:8, flexWrap:"wrap" }}>
          <span style={{ fontFamily:D, fontSize:15, fontWeight:700, color:INK }}>{t.label}</span>
          <span style={{ fontFamily:M, fontSize:8.5, letterSpacing:1, textTransform:"uppercase", color:prof.color }}>{prof.label}</span>
          {t.also && t.also.length > 0 && <span style={{ fontFamily:M, fontSize:8, color:FAINT }}>+ {t.also.map(a=>PBK[a].label.split(" / ")[0]).join(", ")}</span>}
        </div>
        <div style={{ fontFamily:B, fontSize:12, color:"#2a2620", fontStyle:"italic", margin:"2px 0 4px" }}>{t.aroma}</div>
        <div style={{ fontFamily:B, fontSize:11.5, color:DIM, lineHeight:1.5 }}>{t.impact}</div>
        {t.foundWith && <div style={{ fontFamily:M, fontSize:8.5, color:FAINT, marginTop:4, letterSpacing:0.3 }}>FOUND WITH · {t.foundWith.join(" · ")}</div>}
      </div>
    </div>
  );
}

// ═══ PIECE 3 — MAJOR TERPENES (staff) ═══
function MajorTerpenesSheet() {
  const primary = TERPENES.filter(t => t.tier === "primary");
  // "key impact" = impact terpenes that lead a profile's character (potency >= 1.1 or named drivers)
  const keyImpact = TERPENES.filter(t => t.tier === "impact" && ["bisabolol","valencene","nerolidol","terpineol","caryophyllene_oxide","guaiol","pcymene"].includes(t.key));
  return (
    <div className="fs-sheet" data-piece="major" style={PAPER}>
      <Kicker>Flower Spectrum · Staff Library</Kicker>
      <h1 style={{ fontFamily:D, fontSize:32, fontWeight:700, lineHeight:1.05, margin:"0 0 6px", color:INK }}>The Major Terpenes</h1>
      <p style={{ fontFamily:B, fontSize:13, color:DIM, margin:"0 0 18px", lineHeight:1.5 }}>The loud ones — the terpenes that set a flower's primary character. Color stripe shows the profile each one drives.</p>

      <div style={{ fontFamily:M, fontSize:9, letterSpacing:2, textTransform:"uppercase", color:INK, marginBottom:6, paddingBottom:5, borderBottom:`2px solid ${INK}` }}>Primary Drivers · {primary.length}</div>
      {primary.map(t => <TerpRow key={t.key} t={t}/>)}

      <div style={{ fontFamily:M, fontSize:9, letterSpacing:2, textTransform:"uppercase", color:INK, margin:"22px 0 6px", paddingBottom:5, borderBottom:`2px solid ${INK}` }}>Key Impact Terpenes · {keyImpact.length}</div>
      {keyImpact.map(t => <TerpRow key={t.key} t={t}/>)}

      <div style={{ marginTop:22, paddingTop:14, borderTop:`2px solid ${INK}`, display:"flex", justifyContent:"space-between", fontFamily:M, fontSize:8.5, color:FAINT, letterSpacing:1 }}>
        <span>FLOWER SPECTRUM SYSTEM · STAFF REFERENCE</span><span>{VERSION}</span>
      </div>
    </div>
  );
}

// ═══ PIECE 4 — MINOR & SUPPORTING TERPENES (staff / enthusiast) ═══
function MinorTerpenesSheet() {
  const usedKey = ["bisabolol","valencene","nerolidol","terpineol","caryophyllene_oxide","guaiol","pcymene"];
  const minorImpact = TERPENES.filter(t => t.tier === "impact" && !usedKey.includes(t.key));
  const trace = TERPENES.filter(t => t.tier === "trace");
  return (
    <div className="fs-sheet" data-piece="minor" style={PAPER}>
      <Kicker>Flower Spectrum · Staff Library</Kicker>
      <h1 style={{ fontFamily:D, fontSize:32, fontWeight:700, lineHeight:1.05, margin:"0 0 6px", color:INK }}>Minor &amp; Supporting Terpenes</h1>
      <p style={{ fontFamily:B, fontSize:13, color:DIM, margin:"0 0 16px", lineHeight:1.5 }}>The quiet ones. Often present, rarely dominant — but they explain <em>why</em> a flower reads the way it does, and why the loudest number on a COA isn't always the loudest smell.</p>

      {/* teaching callouts */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:18 }}>
        <div style={{ padding:"12px 14px", background:"#ece4d3", borderRadius:8, borderLeft:`3px solid ${PBK.fruity_sweet.color}` }}>
          <div style={{ fontFamily:M, fontSize:8, letterSpacing:1, textTransform:"uppercase", color:FAINT, marginBottom:4 }}>Mass ≠ Aroma</div>
          <div style={{ fontFamily:B, fontSize:11, color:"#2a2620", lineHeight:1.5 }}>β-Farnesene can top a COA by quantity yet barely register to the nose. We weight it low — a big number that doesn't drive the smell shouldn't drive the classification.</div>
        </div>
        <div style={{ padding:"12px 14px", background:"#ece4d3", borderRadius:8, borderLeft:`3px solid ${PBK.gas_fuel.color}` }}>
          <div style={{ fontFamily:M, fontSize:8, letterSpacing:1, textTransform:"uppercase", color:FAINT, marginBottom:4 }}>Gas Is Emergent</div>
          <div style={{ fontFamily:B, fontSize:11, color:"#2a2620", lineHeight:1.5 }}>No single terpene smells like "gas." It appears when caryophyllene, limonene, and myrcene/humulene land in balance. p-Cymene confirms it but rarely carries it alone.</div>
        </div>
      </div>

      <div style={{ fontFamily:M, fontSize:9, letterSpacing:2, textTransform:"uppercase", color:INK, marginBottom:6, paddingBottom:5, borderBottom:`2px solid ${INK}` }}>Supporting · Impact Tier · {minorImpact.length}</div>
      {minorImpact.map(t => <TerpRow key={t.key} t={t}/>)}

      <div style={{ fontFamily:M, fontSize:9, letterSpacing:2, textTransform:"uppercase", color:INK, margin:"22px 0 6px", paddingBottom:5, borderBottom:`2px solid ${INK}` }}>Trace · Nuance Tier · {trace.length}</div>
      {trace.map(t => <TerpRow key={t.key} t={t}/>)}

      <div style={{ marginTop:18, padding:"12px 14px", background:"#ece4d3", borderRadius:8 }}>
        <div style={{ fontFamily:M, fontSize:8, letterSpacing:1, textTransform:"uppercase", color:FAINT, marginBottom:4 }}>What A Panel Can't See</div>
        <div style={{ fontFamily:B, fontSize:11, color:"#2a2620", lineHeight:1.5 }}>The savory, garlicky "funk" in some gas strains comes from volatile sulfur compounds, not terpenes — standard COAs don't measure them. That's why a funky flower reads Earthy or Gas on terpene data alone. Always confirm with your nose.</div>
      </div>

      <div style={{ marginTop:18, paddingTop:14, borderTop:`2px solid ${INK}`, display:"flex", justifyContent:"space-between", fontFamily:M, fontSize:8.5, color:FAINT, letterSpacing:1 }}>
        <span>FLOWER SPECTRUM SYSTEM · STAFF REFERENCE</span><span>{VERSION}</span>
      </div>
    </div>
  );
}

// ═══ PIECE 5 — BUDTENDER QUICK-REFERENCE (staff) ═══
const WANTS = [
  { want:"Wind down / sleep", keys:["earthy_dank","floral_soft","gas_fuel"] },
  { want:"Daytime / energy", keys:["citrus_bright","piney_fresh","tropical_tangy"] },
  { want:"Focus / clear head", keys:["piney_fresh","herbal_woody"] },
  { want:"Social / uplifted", keys:["citrus_bright","fruity_sweet","tropical_tangy"] },
  { want:"Calm / mellow", keys:["floral_soft","dessert_creamy"] },
  { want:"Loud & gassy", keys:["gas_fuel","spicy_warm"] },
];
function CheatSheet() {
  return (
    <div className="fs-sheet" data-piece="cheat" style={PAPER}>
      <Kicker>Flower Spectrum · Floor Reference</Kicker>
      <h1 style={{ fontFamily:D, fontSize:32, fontWeight:700, lineHeight:1.05, margin:"0 0 6px", color:INK }}>Budtender Quick-Reference</h1>
      <p style={{ fontFamily:B, fontSize:13, color:DIM, margin:"0 0 20px", lineHeight:1.5 }}>Translate what a customer wants into where to point them — and how to move the conversation past THC.</p>

      {/* wants matrix */}
      <div style={{ fontFamily:M, fontSize:9, letterSpacing:2, textTransform:"uppercase", color:INK, marginBottom:8, paddingBottom:5, borderBottom:`2px solid ${INK}` }}>If They Want… → Point To</div>
      <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:22 }}>
        {WANTS.map(w => (
          <div key={w.want} style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontFamily:B, fontSize:13, fontWeight:600, color:INK, width:150, flexShrink:0 }}>{w.want}</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {w.keys.map(k => (
                <span key={k} style={{ display:"flex", alignItems:"center", gap:5, fontFamily:M, fontSize:10, color:"#2a2620", padding:"3px 8px", background:`${PBK[k].color}22`, border:`1px solid ${PBK[k].color}`, borderRadius:4 }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:PBK[k].color }}/>{PBK[k].label.split(" / ")[0]}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontFamily:B, fontSize:10.5, fontStyle:"italic", color:FAINT, margin:"-12px 0 22px" }}>Reminder: these are aroma-based starting points, not guarantees. Effect varies by person, dose, and tolerance — always frame as "a good place to start."</p>

      {/* scripts */}
      <div style={{ fontFamily:M, fontSize:9, letterSpacing:2, textTransform:"uppercase", color:INK, marginBottom:10, paddingBottom:5, borderBottom:`2px solid ${INK}` }}>Three Lines That Work</div>
      {[
        ["Move them off THC", "\u201CTHC tells you how strong it is, not how it'll feel. Two flowers at 25% can be completely different — the terpenes are what shape it. What kind of smell are you drawn to?\u201D"],
        ["Explain a blend", "\u201CSpicy-Gas means it leads with pepper but has real diesel underneath. The band on the label shows you the mix — the bigger the color, the more it leads.\u201D"],
        ["The nudge", "\u201CIf you tell me a smell you love, I can almost always find you something you'll like better than picking by the number. The nose knows.\u201D"],
      ].map(([t,q]) => (
        <div key={t} style={{ marginBottom:12, padding:"11px 14px", background:"#ece4d3", borderRadius:8, borderLeft:`3px solid ${PBK.citrus_bright.color}` }}>
          <div style={{ fontFamily:M, fontSize:8, letterSpacing:1, textTransform:"uppercase", color:FAINT, marginBottom:4 }}>{t}</div>
          <div style={{ fontFamily:D, fontSize:14, fontStyle:"italic", color:"#2a2620", lineHeight:1.45 }}>{q}</div>
        </div>
      ))}

      <div style={{ marginTop:20, paddingTop:14, borderTop:`2px solid ${INK}`, display:"flex", justifyContent:"space-between", fontFamily:M, fontSize:8.5, color:FAINT, letterSpacing:1 }}>
        <span>FLOWER SPECTRUM SYSTEM · FLOOR REFERENCE</span><span>{VERSION}</span>
      </div>
    </div>
  );
}

// ═══ PIECE 6 — THE GREAT THC MYTH (Myth vs. Fact, customer) ═══
// Consumer-facing persuasion piece. Every "fact" is framed factually and
// aroma-led; no effect claims. The indica/sativa and lab-number entries are the
// load-bearing myth-busters for moving the floor conversation off potency.
const MYTHS = [
  { myth:"Higher THC means a stronger, better high.",
    fact:"THC tells you potency, not character or quality. Two jars at 25% can smell — and land — nothing alike. The aroma is what shapes the experience; the number just sets the ceiling.",
    tag:"The big one" },
  { myth:"Indica means couch-lock, sativa means energy.",
    fact:"Those words describe how the plant grows, not how a specific flower will feel. Decades of crossbreeding have blurred them past the point of usefulness. A flower's aroma chemistry is a far more honest guide than the label on the bin.",
    tag:"The stubborn one" },
  { myth:"The frostier and stickier it looks, the stronger it is.",
    fact:"Those crystals are resin glands — they signal a well-grown, well-cured flower, which is worth wanting. But sparkle is not a dial you can read for intensity. Your nose reads the chemistry; your eyes only read the surface.",
    tag:"The shiny one" },
  { myth:"The percentage on the label is exact.",
    fact:"A printed number is a snapshot of one tested sample, and testing carries real-world variation. Treat it as a useful ballpark, not a precision instrument — and let smell break the tie when two numbers look close.",
    tag:"The precise-looking one" },
  { myth:"Terpenes are just the smell — the THC does the real work.",
    fact:"Aroma is the most accessible read you have on a flower's full chemistry. In one sniff your nose integrates dozens of compounds that no single line on a lab sheet captures. Smell isn't a side detail; it's the summary.",
    tag:"The dismissive one" },
];
function MythSheet() {
  return (
    <div className="fs-sheet" data-piece="myth" style={PAPER}>
      <Kicker>Flower Spectrum · Field Primer</Kicker>
      <h1 style={{ fontFamily:D, fontSize:34, fontWeight:700, lineHeight:1.05, margin:"0 0 6px", color:INK }}>The Great THC Myth</h1>
      <p style={{ fontFamily:B, fontSize:14, color:DIM, margin:"0 0 4px", lineHeight:1.5 }}>Five things the shelf has taught everyone — and what the flower actually says.</p>
      <p style={{ fontFamily:B, fontSize:11, fontStyle:"italic", color:FAINT, margin:"0 0 20px" }}>We're not here to dunk on anyone. These are honest mistakes a confusing market made easy. Let's clear them up.</p>

      <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
        {MYTHS.map((m,i) => (
          <div key={i} className="fs-card" style={{ border:`1px solid ${RULE}`, borderRadius:8, overflow:"hidden", breakInside:"avoid", background:"#faf6ec" }}>
            <div style={{ display:"flex", alignItems:"center", gap:9, padding:"9px 14px", background:"#ece4d3" }}>
              <span style={{ fontFamily:M, fontSize:8, letterSpacing:1.5, textTransform:"uppercase", color:"#fff", background:PBK.gas_fuel.color, padding:"2px 7px", borderRadius:3 }}>Myth</span>
              <span style={{ fontFamily:D, fontSize:15, fontWeight:600, fontStyle:"italic", color:INK, lineHeight:1.25 }}>“{m.myth}”</span>
            </div>
            <div style={{ display:"flex", gap:10, padding:"11px 14px" }}>
              <span style={{ fontFamily:M, fontSize:8, letterSpacing:1.5, textTransform:"uppercase", color:"#fff", background:PBK.piney_fresh.color, padding:"2px 7px", borderRadius:3, height:"fit-content", flexShrink:0, marginTop:1 }}>Fact</span>
              <span style={{ fontFamily:B, fontSize:12, color:"#2a2620", lineHeight:1.6 }}>{m.fact}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop:18, padding:"13px 16px", background:INK, borderRadius:8 }}>
        <div style={{ fontFamily:M, fontSize:8.5, letterSpacing:2, textTransform:"uppercase", color:PBK.citrus_bright.color, marginBottom:5 }}>The takeaway</div>
        <div style={{ fontFamily:D, fontSize:16, fontStyle:"italic", color:"#f4efe4", lineHeight:1.45 }}>Buy the smell you love, not the number you were told to chase. Your nose has never once led you wrong at the dinner table — it won't start here.</div>
      </div>

      <div style={{ marginTop:18, paddingTop:14, borderTop:`2px solid ${INK}`, display:"flex", justifyContent:"space-between", fontFamily:M, fontSize:8.5, color:FAINT, letterSpacing:1 }}>
        <span>FLOWER SPECTRUM SYSTEM</span><span>AROMA CLASSIFICATION · NOT EFFECTS OR MEDICAL CLAIMS</span>
      </div>
    </div>
  );
}

// ═══ PIECE 7 — HOW TO READ A JAR (Sensory how-to, customer + staff) ═══
const RITUAL = [
  { n:"1", t:"Wake it up", d:"Aromatics are volatile — they need a little warmth and air. Gently cup the flower in your hands or give the open jar a soft roll. Don't crush it; you're coaxing the smell out, not bruising it." },
  { n:"2", t:"Short sniffs, not deep ones", d:"Treat it like wine, not a campfire. Two or three quick passes read louder and cleaner than one long inhale, which overwhelms your nose and flattens everything into 'weed smell.'" },
  { n:"3", t:"Name the lead, then the layers", d:"What hits first? What sits underneath? What lingers after you pull away? Most flowers are a chord, not a single note — the Spectrum band on the label maps exactly that order, loudest color first." },
  { n:"4", t:"Reset between jars", d:"Your nose tires fast. After two or three jars, smell your own sleeve or some coffee beans, take a breath of clean air, and come back. The fourth jar in a row always smells like the third — that's fatigue, not the flower." },
  { n:"5", t:"Check it against the band", d:"Does the color on the label match what you're getting? When your nose and the band agree, you've found your read. When they don't, trust your nose and ask — that conversation is the whole point." },
];
const JAR_BLOCKERS = [
  ["A stuffy nose", "Congestion mutes the high, bright notes first. On a stuffed-up day, lean on the label and a budtender's read."],
  ["Cold flower", "Straight from a cold room, aromatics stay locked in. Give it a minute in your hand to warm."],
  ["Smoke in the air", "A smoky shop dulls everyone's nose, including yours. Step toward fresh air for the real read."],
  ["Smelling ten in a row", "Nose fatigue is real and fast. Three jars, then reset — quality over quantity."],
];
function ReadAJarSheet() {
  return (
    <div className="fs-sheet" data-piece="readjar" style={PAPER}>
      <Kicker>Flower Spectrum · Field Skill</Kicker>
      <h1 style={{ fontFamily:D, fontSize:34, fontWeight:700, lineHeight:1.05, margin:"0 0 6px", color:INK }}>How to Read a Jar</h1>
      <p style={{ fontFamily:B, fontSize:14, color:DIM, margin:"0 0 20px", lineHeight:1.5 }}>Smelling flower well is a skill, and it takes about thirty seconds to learn. Here's the whole ritual.</p>

      <div style={{ display:"flex", flexDirection:"column", gap:11, marginBottom:20 }}>
        {RITUAL.map(s => (
          <div key={s.n} className="fs-card" style={{ display:"flex", gap:14, breakInside:"avoid" }}>
            <div style={{ fontFamily:D, fontSize:30, fontWeight:700, color:PBK.citrus_bright.color, lineHeight:1, width:34, flexShrink:0, textAlign:"center" }}>{s.n}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:D, fontSize:17, fontWeight:700, color:INK, marginBottom:2 }}>{s.t}</div>
              <div style={{ fontFamily:B, fontSize:12, color:"#2a2620", lineHeight:1.6 }}>{s.d}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily:M, fontSize:9, letterSpacing:2, textTransform:"uppercase", color:INK, marginBottom:10, paddingBottom:5, borderBottom:`2px solid ${INK}` }}>What Gets In The Way</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:11, marginBottom:6 }}>
        {JAR_BLOCKERS.map(([t,d]) => (
          <div key={t} style={{ padding:"11px 13px", background:"#ece4d3", borderRadius:8, breakInside:"avoid" }}>
            <div style={{ fontFamily:D, fontSize:13, fontWeight:700, color:INK, marginBottom:3 }}>{t}</div>
            <div style={{ fontFamily:B, fontSize:11, color:DIM, lineHeight:1.5 }}>{d}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop:18, paddingTop:14, borderTop:`2px solid ${INK}`, display:"flex", justifyContent:"space-between", fontFamily:M, fontSize:8.5, color:FAINT, letterSpacing:1 }}>
        <span>FLOWER SPECTRUM SYSTEM · FLOOR SKILL</span><span>{VERSION}</span>
      </div>
    </div>
  );
}

// ═══ PIECE 8 — THE SCIENCE OF SMELL (Why it works, enthusiast) ═══
// COMPLIANCE-SENSITIVE SHEET. Strictly aroma-mechanism. Experience associations
// are hedged exactly as the existing "lean" lines. Term "entourage effect" is
// deliberately avoided (reads as an effects claim under OLCC posture).
function ScienceSheet() {
  return (
    <div className="fs-sheet" data-piece="science" style={PAPER}>
      <Kicker>Flower Spectrum · The Why</Kicker>
      <h1 style={{ fontFamily:D, fontSize:32, fontWeight:700, lineHeight:1.05, margin:"0 0 6px", color:INK }}>The Science of Smell</h1>
      <p style={{ fontFamily:B, fontSize:13, color:DIM, margin:"0 0 18px", lineHeight:1.5 }}>Why a system built on aroma is built on something real — not a marketing gimmick dressed up in color.</p>

      <Kicker>What a terpene actually is</Kicker>
      <p style={{ fontFamily:B, fontSize:13, lineHeight:1.7, color:"#2a2620", margin:"0 0 14px" }}>
        Terpenes are aromatic compounds the plant produces alongside cannabinoids like THC. They aren't unique to cannabis — the same molecules give lavender its calm perfume, black pepper its bite, pine its crispness, and citrus its zest. When you recognize lemon in a jar of flower, you're smelling <strong>limonene</strong>, the exact compound that's in the lemon. Your nose already knows these notes from a lifetime of meals, gardens, and forests.
      </p>

      <Rule/>
      <Kicker>Why aroma is information, not decoration</Kicker>
      <p style={{ fontFamily:B, fontSize:13, lineHeight:1.7, color:"#2a2620", margin:"0 0 14px" }}>
        Your sense of smell is a chemical detector. The moment you open a jar, your nose is reading dozens of airborne compounds at once and integrating them into a single impression — instantly, with no lab required. A printed COA lists those compounds one line at a time; your nose delivers the <em>summary</em>. That's why a good sniff often tells you more about how a flower will read than any single number can.
      </p>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
        <div style={{ padding:"12px 14px", background:"#ece4d3", borderRadius:8, borderLeft:`3px solid ${PBK.fruity_sweet.color}` }}>
          <div style={{ fontFamily:M, fontSize:8, letterSpacing:1, textTransform:"uppercase", color:FAINT, marginBottom:4 }}>Mass isn't loudness</div>
          <div style={{ fontFamily:B, fontSize:11, color:"#2a2620", lineHeight:1.55 }}>Some compounds show up big on a lab sheet but barely register to the nose — β-farnesene is the classic example. The Spectrum weights every terpene by <strong>aromatic impact</strong>, not raw quantity, so the loudest number doesn't hijack the smell.</div>
        </div>
        <div style={{ padding:"12px 14px", background:"#ece4d3", borderRadius:8, borderLeft:`3px solid ${PBK.gas_fuel.color}` }}>
          <div style={{ fontFamily:M, fontSize:8, letterSpacing:1, textTransform:"uppercase", color:FAINT, marginBottom:4 }}>Some notes are a chord</div>
          <div style={{ fontFamily:B, fontSize:11, color:"#2a2620", lineHeight:1.55 }}>No single terpene smells like "gas." That diesel character <strong>emerges</strong> when pepper, citrus, and earthy compounds land in balance together — proof that the full bouquet, not any one molecule, is what your nose actually judges.</div>
        </div>
      </div>

      <Rule/>
      <Kicker>How the Spectrum turns a lab sheet into a color</Kicker>
      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
        {[
          ["Read the COA","Start from the flower's real lab-tested terpene values — never guesses, never vibes."],
          ["Weight by aroma","Scale each terpene by how loud it actually smells, so impact beats mass."],
          ["Map to ten profiles","Sort that weighted signal onto the aroma spectrum — the same ten colors everywhere in the system."],
          ["Show the blend","Draw the band: loudest profile first, up to three, widths set by how much each one leads."],
        ].map(([t,d],i) => (
          <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
            <div style={{ fontFamily:M, fontSize:10, fontWeight:700, color:"#fff", background:INK, width:20, height:20, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>{i+1}</div>
            <div><span style={{ fontFamily:D, fontSize:13, fontWeight:700, color:INK }}>{t}.</span> <span style={{ fontFamily:B, fontSize:12, color:"#2a2620", lineHeight:1.55 }}>{d}</span></div>
          </div>
        ))}
      </div>

      <div style={{ padding:"12px 15px", background:"#faf2e0", border:`1px solid ${PBK.spicy_warm.color}55`, borderRadius:8 }}>
        <div style={{ fontFamily:M, fontSize:8, letterSpacing:1.5, textTransform:"uppercase", color:PBK.spicy_warm.color, marginBottom:4 }}>An honest word on "effects"</div>
        <div style={{ fontFamily:B, fontSize:11.5, color:"#2a2620", lineHeight:1.6 }}>
          Certain aromas carry long-standing reputations — bright citrus with a lift, deep earth with a wind-down. Those are <strong>traditional associations</strong>, shaped by culture and shared experience, and they genuinely vary by person, dose, and setting. We classify the smell, which is measurable. How any flower makes <em>you</em> feel is yours to discover — the aroma is just the most reliable place to start.
        </div>
      </div>

      <div style={{ marginTop:18, paddingTop:14, borderTop:`2px solid ${INK}`, display:"flex", justifyContent:"space-between", fontFamily:M, fontSize:8.5, color:FAINT, letterSpacing:1 }}>
        <span>FLOWER SPECTRUM SYSTEM · {VERSION}</span><span>AROMA CLASSIFICATION · NOT EFFECTS OR MEDICAL CLAIMS</span>
      </div>
    </div>
  );
}

// ═══ PIECE 9 — FIND YOUR PROFILE (Interactive aroma key, customer) ═══
// A dichotomous key over PROFILES. NOT the classifier engine — a preference
// router. Same tree drives the on-screen quiz and the printed decision key.
const AROMA_TREE = {
  q:"When you open a great jar, the first thing that grabs you is…",
  a:[
    { label:"Something sweet", hint:"fruit, candy, vanilla, flowers", next:{
      q:"Sweet more like…",
      a:[
        { label:"Ripe fruit", hint:"juicy, fresh, zesty", next:{
          q:"Which fruit, exactly?",
          a:[
            { label:"Berry, stone fruit, or candy", to:"fruity_sweet" },
            { label:"Lemon, orange, or grapefruit", to:"citrus_bright" },
            { label:"Mango, guava, or passionfruit", to:"tropical_tangy" },
          ] } },
        { label:"Dessert or perfume", hint:"rich, soft, smooth", next:{
          q:"Closer to…",
          a:[
            { label:"Vanilla, cake, or sweet cream", to:"dessert_creamy" },
            { label:"Lavender, rose, or soft florals", to:"floral_soft" },
          ] } },
      ] } },
    { label:"Something sharp or savory", hint:"gas, spice, pine, earth", next:{
      q:"Is it loud and pungent, or dry and green?",
      a:[
        { label:"Loud & pungent", hint:"it fills the room", next:{
          q:"Loud like…",
          a:[
            { label:"Diesel, chemical, or skunk", to:"gas_fuel" },
            { label:"Black pepper, clove, or warm spice", to:"spicy_warm" },
          ] } },
        { label:"Dry & green", hint:"clean, grounded, herbal", next:{
          q:"Which green?",
          a:[
            { label:"Pine, fir, or crisp mountain air", to:"piney_fresh" },
            { label:"Loose tea, sage, or fresh-cut wood", to:"herbal_woody" },
            { label:"Damp soil, musk, or mushroom", to:"earthy_dank" },
          ] } },
      ] } },
  ],
};

// walk a path of chosen indices; returns {node, result}
function walkTree(path) {
  let node = AROMA_TREE;
  for (const idx of path) {
    const choice = node.a[idx];
    if (!choice) break;
    if (choice.to) return { node:null, result:choice.to };
    node = choice.next;
  }
  return { node, result:null };
}

function QuizResultCard({ pk, onReset }) {
  const p = PBK[pk];
  return (
    <div style={{ border:`1px solid ${p.color}`, borderTop:`6px solid ${p.color}`, borderRadius:10, padding:"20px 22px", background:"#faf6ec" }}>
      <div style={{ fontFamily:M, fontSize:9, letterSpacing:2, textTransform:"uppercase", color:p.color, marginBottom:6 }}>Your nose points to</div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:D, fontSize:30, fontWeight:700, color:INK, lineHeight:1 }}>{p.label}</div>
          <div style={{ fontFamily:D, fontSize:15, fontStyle:"italic", color:DIM, marginTop:4 }}>{p.tagline}</div>
        </div>
        <Fingerprint pct={idealPct(p)} size={84} highlight={p.key}/>
      </div>
      <p style={{ fontFamily:B, fontSize:13, lineHeight:1.6, color:"#2a2620", margin:"12px 0 12px" }}>{p.sensory}</p>
      <div style={{ display:"flex", flexWrap:"wrap", gap:14, marginBottom:14 }}>
        <div>
          <div style={{ fontFamily:M, fontSize:8, letterSpacing:1, textTransform:"uppercase", color:FAINT, marginBottom:3 }}>Driven by</div>
          <div style={{ fontFamily:B, fontSize:12, color:"#2a2620" }}>{p.drivers.join(" · ")}</div>
        </div>
        <div>
          <div style={{ fontFamily:M, fontSize:8, letterSpacing:1, textTransform:"uppercase", color:FAINT, marginBottom:3 }}>Try on our shelf</div>
          <div style={{ fontFamily:B, fontSize:12, fontStyle:"italic", color:p.color }}>{p.examples.join(", ")}</div>
        </div>
      </div>
      <div style={{ fontFamily:B, fontSize:11, fontStyle:"italic", color:FAINT, marginBottom:14, lineHeight:1.5 }}>
        Not quite it? The fun is in being wrong — tell a budtender what you smelled and they'll walk you a shade left or right. The neighbors on the spectrum are {p.foundWith.map(k=>PBK[k].label.split(" / ")[0]).join(" and ")}.
      </div>
      <button onClick={onReset} style={{ padding:"9px 16px", background:INK, color:"#f4efe4", border:"none", borderRadius:7, fontFamily:M, fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", cursor:"pointer" }}>↺ Start Over</button>
    </div>
  );
}

// printed decision key (dichotomous) — recursive indented outline
function TreeKey({ node, depth=0 }) {
  return (
    <div style={{ marginLeft: depth===0 ? 0 : 16, borderLeft: depth===0 ? "none" : `1px solid ${RULE}`, paddingLeft: depth===0 ? 0 : 12 }}>
      <div style={{ fontFamily:M, fontSize: depth===0?10:9, letterSpacing:0.5, color: depth===0?INK:DIM, fontWeight: depth===0?700:400, margin:"6px 0 4px", textTransform: depth===0?"uppercase":"none" }}>{node.q}</div>
      {node.a.map((c,i) => (
        <div key={i} style={{ margin:"3px 0" }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:7 }}>
            <span style={{ fontFamily:D, fontSize:12, fontWeight:600, color:"#2a2620" }}>→ {c.label}</span>
            {c.hint && <span style={{ fontFamily:B, fontSize:9.5, fontStyle:"italic", color:FAINT }}>{c.hint}</span>}
            {c.to && <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontFamily:M, fontSize:9, color:PBK[c.to].color, fontWeight:700 }}><span style={{ width:8, height:8, borderRadius:"50%", background:PBK[c.to].color }}/>{PBK[c.to].label}</span>}
          </div>
          {c.next && <TreeKey node={c.next} depth={depth+1}/>}
        </div>
      ))}
    </div>
  );
}

function FindYourProfileSheet() {
  const [path, setPath] = useState([]);
  const { node, result } = walkTree(path);
  const choose = (i) => setPath([...path, i]);
  const back = () => setPath(path.slice(0, -1));
  const reset = () => setPath([]);
  const stepNo = path.length + 1;

  return (
    <div className="fs-sheet" data-piece="quiz" style={PAPER}>
      <Kicker>Flower Spectrum · Interactive</Kicker>
      <h1 style={{ fontFamily:D, fontSize:34, fontWeight:700, lineHeight:1.05, margin:"0 0 6px", color:INK }}>Find Your Profile</h1>
      <p style={{ fontFamily:B, fontSize:14, color:DIM, margin:"0 0 18px", lineHeight:1.5 }}>Four quick gut-checks on what you actually like to smell. No wrong answers, no chemistry degree required.</p>

      {/* ── INTERACTIVE (screen only) ── */}
      <div className="fs-noprint">
        {result ? (
          <QuizResultCard pk={result} onReset={reset}/>
        ) : (
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              {[0,1,2,3].map(s => (
                <span key={s} style={{ height:5, flex:1, borderRadius:3, background: s < path.length ? PBK.citrus_bright.color : (s===path.length ? INK : RULE) }}/>
              ))}
            </div>
            <div style={{ fontFamily:M, fontSize:9, letterSpacing:2, textTransform:"uppercase", color:FAINT, marginBottom:8 }}>Step {stepNo}</div>
            <div style={{ fontFamily:D, fontSize:22, fontWeight:700, color:INK, lineHeight:1.2, marginBottom:16 }}>{node.q}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
              {node.a.map((c,i) => (
                <button key={i} onClick={()=>choose(i)} style={{
                  textAlign:"left", padding:"14px 16px", cursor:"pointer", borderRadius:9,
                  border:`1px solid ${RULE}`, background:"#faf6ec", display:"flex", justifyContent:"space-between", alignItems:"center", gap:12,
                }}>
                  <span>
                    <span style={{ fontFamily:D, fontSize:16, fontWeight:600, color:INK }}>{c.label}</span>
                    {c.hint && <span style={{ fontFamily:B, fontSize:11, fontStyle:"italic", color:FAINT, display:"block", marginTop:2 }}>{c.hint}</span>}
                  </span>
                  {c.to && <span style={{ width:14, height:14, borderRadius:"50%", background:PBK[c.to].color, flexShrink:0 }}/>}
                  <span style={{ fontFamily:D, fontSize:20, color:PBK.citrus_bright.color }}>›</span>
                </button>
              ))}
            </div>
            {path.length > 0 && (
              <button onClick={back} style={{ marginTop:14, padding:"7px 14px", background:"transparent", color:DIM, border:`1px solid ${RULE}`, borderRadius:7, fontFamily:M, fontSize:10, letterSpacing:1, textTransform:"uppercase", cursor:"pointer" }}>← Back</button>
            )}
          </div>
        )}
      </div>

      {/* ── PRINTED DECISION KEY (print only) ── */}
      <div className="fs-printonly">
        <div style={{ fontFamily:B, fontSize:12, fontStyle:"italic", color:DIM, margin:"0 0 12px", lineHeight:1.5 }}>
          Follow the arrows from the top. Each answer narrows the field until a colored dot names your starting profile — the same key our staff use, and the same logic a botanist uses to identify a plant.
        </div>
        <div style={{ padding:"16px 18px", background:"#faf6ec", border:`1px solid ${RULE}`, borderRadius:8 }}>
          <TreeKey node={AROMA_TREE}/>
        </div>
        <div style={{ marginTop:14 }}>
          <div style={{ fontFamily:M, fontSize:8.5, letterSpacing:1.5, textTransform:"uppercase", color:FAINT, marginBottom:8 }}>Where each answer lands</div>
          <ColorKey small/>
        </div>
      </div>

      <div style={{ marginTop:20, paddingTop:14, borderTop:`2px solid ${INK}`, display:"flex", justifyContent:"space-between", fontFamily:M, fontSize:8.5, color:FAINT, letterSpacing:1 }}>
        <span>FLOWER SPECTRUM SYSTEM</span><span>AROMA CLASSIFICATION · NOT EFFECTS OR MEDICAL CLAIMS</span>
      </div>
    </div>
  );
}

// ── PIECES registry ──
const PIECES = [
  { key:"primer", label:"01 · The Nose Knows", audience:"Customer", Comp:PrimerSheet },
  { key:"profiles", label:"02 · The Ten Profiles", audience:"Customer + Staff", Comp:ProfilesSheet },
  { key:"major", label:"03 · Major Terpenes", audience:"Staff", Comp:MajorTerpenesSheet },
  { key:"minor", label:"04 · Minor & Supporting", audience:"Staff", Comp:MinorTerpenesSheet },
  { key:"cheat", label:"05 · Budtender Reference", audience:"Staff", Comp:CheatSheet },
  { key:"myth", label:"06 · The Great THC Myth", audience:"Customer", Comp:MythSheet },
  { key:"readjar", label:"07 · How to Read a Jar", audience:"Customer + Staff", Comp:ReadAJarSheet },
  { key:"science", label:"08 · The Science of Smell", audience:"Enthusiast", Comp:ScienceSheet },
  { key:"quiz", label:"09 · Find Your Profile", audience:"Customer · Interactive", Comp:FindYourProfileSheet },
];

// ── APP ──
export default function App() {
  const [active, setActive] = useState("primer");

  const printOne = (key) => {
    if (typeof document !== "undefined") document.documentElement.setAttribute("data-printonly", key);
    if (typeof window !== "undefined") window.print();
  };
  useEffect(() => {
    const clear = () => { if (typeof document !== "undefined") document.documentElement.removeAttribute("data-printonly"); };
    if (typeof window !== "undefined") window.addEventListener("afterprint", clear);
    return () => { if (typeof window !== "undefined") window.removeEventListener("afterprint", clear); };
  }, []);

  const printRules = PIECES.map(p =>
    `html[data-printonly="${p.key}"] .fs-sheet-wrap:not([data-piece="${p.key}"]){display:none !important;}`
  ).join("\n");

  return (
    <div style={{
      "--bg":"#0e0e0c","--surface":"#181715","--border":"#2a2824","--fg":"#e8e3d9","--fg-dim":"#a8a092","--muted":"#6e675b","--accent":"#6AAFA0",
      minHeight:"100vh", background:"var(--bg)", color:"var(--fg)", fontFamily:B,
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;0,6..72,700;1,6..72,400;1,6..72,500&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700;800&display=swap');*{box-sizing:border-box}button{font:inherit}
        .fs-printonly { display:none; }
        @media screen {
          .fs-sheet-wrap { display:none; }
          .fs-sheet-wrap.is-active { display:block; }
        }
        @media print {
          @page { size: letter; margin: 0.45in; }
          .fs-noprint { display:none !important; }
          .fs-printonly { display:block !important; }
          .fs-sheet-wrap { display:block; }
          .fs-sheet { box-shadow:none !important; max-width:none !important; margin:0 !important; }
          .fs-card { break-inside:avoid; page-break-inside:avoid; }
          .fs-sheet-wrap { break-after:page; }
          body { -webkit-print-color-adjust:exact; print-color-adjust:exact; background:#fff; }
          ${printRules}
        }`}</style>

      {/* NAV */}
      <nav className="fs-noprint" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px clamp(16px,4vw,40px)", borderBottom:"1px solid var(--border)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:11 }}>
          <div style={{ display:"flex", gap:2 }}>{PROFILES.slice(0,6).map(p=><span key={p.key} style={{width:5,height:16,background:p.color,borderRadius:1}}/>)}</div>
          <span style={{ fontFamily:M, fontSize:11, letterSpacing:2, textTransform:"uppercase", color:"var(--fg-dim)" }}>Flower Spectrum</span>
        </div>
        <span style={{ fontFamily:M, fontSize:10, color:"var(--muted)", letterSpacing:1 }}>Education Materials · {VERSION}</span>
      </nav>

      <div className="fs-noprint" style={{ maxWidth:1000, margin:"0 auto", padding:"24px clamp(16px,4vw,40px) 0" }}>
        <div style={{ fontFamily:M, fontSize:10, color:"var(--accent)", letterSpacing:3, textTransform:"uppercase", marginBottom:8 }}>Printable Teaching Set</div>
        <h1 style={{ fontFamily:D, fontSize:"clamp(24px,4vw,34px)", fontWeight:600, color:"var(--fg)", margin:"0 0 16px", lineHeight:1.1 }}>Nine pieces, one system.</h1>
        {/* index */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 }}>
          {PIECES.map(p => {
            const on = active === p.key;
            return (
              <button key={p.key} onClick={()=>setActive(p.key)} style={{
                textAlign:"left", padding:"10px 14px", cursor:"pointer", borderRadius:8,
                border:`1px solid ${on?"var(--accent)":"var(--border)"}`, background:on?"var(--surface)":"transparent",
              }}>
                <div style={{ fontFamily:M, fontSize:11, color:on?"var(--fg)":"var(--fg-dim)", letterSpacing:0.5 }}>{p.label}</div>
                <div style={{ fontFamily:M, fontSize:8, color:"var(--muted)", letterSpacing:1, textTransform:"uppercase", marginTop:2 }}>{p.audience}</div>
              </button>
            );
          })}
        </div>
        <div style={{ display:"flex", gap:8, marginBottom:24 }}>
          <button onClick={()=>printOne(active)} style={{ padding:"9px 16px", background:"var(--accent)", color:"#0e0e0c", border:"none", borderRadius:7, fontFamily:M, fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase", cursor:"pointer" }}>⎙ Print This Sheet</button>
          <button onClick={()=>{ if(typeof document!=="undefined") document.documentElement.removeAttribute("data-printonly"); if(typeof window!=="undefined") window.print(); }} style={{ padding:"9px 16px", background:"transparent", color:"var(--fg-dim)", border:"1px solid var(--border)", borderRadius:7, fontFamily:M, fontSize:11, letterSpacing:1, textTransform:"uppercase", cursor:"pointer" }}>⎙ Print All</button>
        </div>
      </div>

      {/* All sheets render; CSS controls screen (active only) vs print (all or one) */}
      <div style={{ padding:"0 clamp(16px,4vw,40px) 60px" }}>
        {PIECES.map(p => {
          const C = p.Comp;
          return (
            <div key={p.key} className={"fs-sheet-wrap" + (active === p.key ? " is-active" : "")} data-piece={p.key}>
              <C/>
            </div>
          );
        })}
      </div>

      <div className="fs-noprint" style={{ borderTop:"1px solid var(--border)", padding:"20px clamp(16px,4vw,40px)", textAlign:"center" }}>
        <div style={{ fontFamily:M, fontSize:9, color:"var(--muted)", letterSpacing:2, textTransform:"uppercase" }}>Flower Spectrum · Education Materials · {VERSION} · {BUILD}</div>
        <div style={{ fontFamily:B, fontSize:11, color:"var(--muted)", marginTop:5 }}>CannaCre8ive · Aroma classification, not effects or medical claims · cannacre8ive.com</div>
      </div>
    </div>
  );
}