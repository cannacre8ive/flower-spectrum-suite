import { CAT, SORT_LABEL, TIER_RANK, activeSales, salePrice, usd, num, truthy, fmtCountdown, getBand, priceInfo, sortValue, sortProducts, csvCell, csvSerialize, csvParse, CSV_MASTER, TEMPLATE_COLS, CAT_CSV, productToRow, rowToProduct, parseBand, parseCsvToProducts, dataUri, templateCsv } from "../lib/menu-data.js";
import { PROFILES as PROFILE_LIST, PROFILE_ORDER } from "../data/profiles.js";
import { DEFAULT_PRODUCTS } from "../data/products.js";
import { useCatalog } from "../lib/catalog.jsx";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* =========================================================================
   FLOWER SPECTRUM — TABLET MENU  (v0.3)
   CannaCre8ive · customer-facing browse kiosk + operator data layer
   -------------------------------------------------------------------------
   v0.3 adds on top of v0.2 (increments 3 + 5 + polish):
     ✓ LEARN section + unified CONTENT store — terpene deep-dives, profile
       pages, extraction/infusion/pricing explainers; every contextual "i"
       and the Learn grid read the same objects (no copy drift)
     ✓ Staff Picks surface — fingerprint-forward, budtender-attributed
     ✓ Flash Sale surface — struck pricing, live per-item countdowns; sale
       data lives ON products (SalePct/SaleEndsMin) so the editor + CSV
       round-trip covers it; ticker derives from live sale data
     ✓ Sale badges on cards + sale-aware detail pricing
   GLOSSARY COPY IS STRICTLY DESCRIPTIVE (zero effect claims — kiosk = retail
   context). Pending Spencer's OLCC sign-off before floor deployment.
   -------------------------------------------------------------------------
   v0.2 delivered:
     ✓ Central PRODUCTS store — every surface reads from it
     ✓ Config-driven category browse (all 5 categories) with category-aware
       sort (price · THC% · aroma · tier · dose · infusion · cart type …)
     ✓ Product detail sheet (aroma band at scale, specs, "i" affordances)
     ✓ Aroma / infusion filter row, category-aware
     ✓ Operator Data Editor (⚙, idle-paused): CRUD on every product/field
     ✓ CSV export — per-category simulated templates + full current dataset
     ✓ CSV import — the tool's OWN format (paste or file upload)
   -------------------------------------------------------------------------
   CSV MAPPING (cross-format, e.g. Dutchie → this schema) is intentionally
   OUT OF SCOPE here — deferred to a dedicated auto-mapping tool. Import
   accepts this tool's own template format only.
   -------------------------------------------------------------------------
   DATA: aroma classifications are REAL (§6 Ideal Cannabis COAs). Pricing &
   potency are ILLUSTRATIVE demo values (flagged). Concentrate/vape/edible/
   preroll items are illustrative products. No invented terpene/COA values.
   ========================================================================= */

const VERSION = "0.3";
const BUILD = "07_01_2026";

const T = {
  bg: "#0e0e0c", surface: "#181715", surface2: "#201e1b", surface3: "#26241f",
  border: "#2a2824", fg: "#e8e3d9", fgDim: "#a8a092", muted: "#6e675b",
  accent: "#6AAFA0", amber: "#C9A84C", danger: "#B75F4A",
};

const PROFILES = Object.fromEntries(PROFILE_LIST.map(p=>[p.key,{...p,drivers:p.drivers.join(" · ")} ]));
/* =====================================================================
   CONTENT — unified education store. The Learn section and every
   contextual "i" sheet read from here. STRICTLY DESCRIPTIVE COPY:
   aroma character, origins, process — zero effect or medical claims.
   PENDING OLCC SIGN-OFF (Spencer) BEFORE FLOOR DEPLOYMENT.
   ===================================================================== */
const TERPENES = {
  myrcene:       { name: "Myrcene",         aroma: "Musky, earthy, ripe mango skin",        nature: "Mango, hops, lemongrass, thyme",      profiles: ["earthy_dank"] },
  limonene:      { name: "D-Limonene",      aroma: "Bright citrus peel — lemon, orange",    nature: "Citrus rind, juniper, peppermint",     profiles: ["citrus_bright","gas_fuel"] },
  caryophyllene: { name: "β-Caryophyllene", aroma: "Cracked black pepper, clove, warm spice", nature: "Black pepper, cloves, cinnamon, basil", profiles: ["spicy_warm","gas_fuel"] },
  pinene:        { name: "α- & β-Pinene",   aroma: "Fresh pine needles, crisp forest air",  nature: "Pine trees, rosemary, dill, basil",    profiles: ["piney_fresh"] },
  linalool:      { name: "Linalool",        aroma: "Lavender, soft floral, a hint of citrus", nature: "Lavender, birch bark, coriander",     profiles: ["floral_soft","dessert_creamy"] },
  terpinolene:   { name: "Terpinolene",     aroma: "Complex — fruity, floral, piney at once", nature: "Nutmeg, tea tree, apples, lilac",     profiles: ["fruity_sweet","tropical_tangy"] },
  humulene:      { name: "α-Humulene",      aroma: "Hoppy, woody, earthy bitterness",       nature: "Hops, sage, ginseng, coriander",       profiles: ["herbal_woody","earthy_dank","spicy_warm"] },
  ocimene:       { name: "β-Ocimene",       aroma: "Sweet, herbaceous, tropical top-notes", nature: "Mint, parsley, orchids, mangoes",      profiles: ["tropical_tangy","fruity_sweet"] },
};
const CONCEPTS = {
  infusion: { title: "Infusion types", kicker: "EDIBLES",
    body: "How an edible is infused changes its flavor and character. Distillate is purified and flavorless — clean and consistent. RSO is a whole-plant extract with a strong, distinctly cannabis taste. Live rosin is solventless and keeps the character of the flower it came from. Cannabutter is the classic homemade-style base." },
  extraction: { title: "Live resin, cured resin & rosin", kicker: "CONCENTRATES",
    body: "Cured resin is extracted from dried, cured flower. Live resin starts from flower frozen at harvest, preserving far more of the original aroma. Rosin is pressed with only heat and pressure — no solvents. Live rosin combines both ideas: fresh-frozen material, solventless press." },
  pricing: { title: "Why extraction drives price", kicker: "CONCENTRATES",
    body: "Fresh-frozen material is harder to handle, yields less, and demands more skill — so live products cost more than cured. Solventless rosin adds another premium: lower yields and hands-on pressing, with no solvent to recover losses. You are paying for preserved aroma and process, not potency." },
  distillate: { title: "Why no aroma profile?", kicker: "VAPES",
    body: "Distillate is refined to nearly pure cannabinoids, so the aromatic terpenes are stripped out along the way. Any flavor is added afterward — botanically derived or reintroduced — rather than strain-derived. The Flower Spectrum classifies strain aroma, so it does not apply to distillate." },
  band: { title: "Reading the aroma band", kicker: "THE SYSTEM",
    body: "Every classified product shows a color band built from its lab terpene panel. The leading color is its primary aroma family; a second color appears only when the secondary profile is strong enough to genuinely share the nose. DEFINED means one family clearly dominates. LEANING means a clear leader with company. BLEND means two families in real balance." },
  coa: { title: "Where classifications come from", kicker: "THE SYSTEM",
    body: "Every classification traces to a Certificate of Analysis — the lab report each product batch receives. We read the terpene panel, not the THC number, because terpenes are what you actually smell. Same plant, same data, different question." },
};


const NAV = [
  { id: "home", label: "Home", kind: "real" },
  { id: "flower", label: "Flower", kind: "cat" },
  { id: "prerolls", label: "Pre-Rolls", kind: "cat" },
  { id: "vapes", label: "Vapes", kind: "cat" },
  { id: "concentrates", label: "Concentrates", kind: "cat" },
  { id: "edibles", label: "Edibles", kind: "cat" },
  { id: "staff", label: "Staff Picks", kind: "special" },
  { id: "flash", label: "Flash Sale", kind: "special" },
  { id: "learn", label: "Learn", kind: "special" },
];

/* ------------------------------ primitives ------------------------------ */
function InfoDot({ onClick, title = "Learn more" }) {
  return (
    <button className="fs-info" aria-label={title} onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
      style={{ width: 22, height: 22, borderRadius: "50%", flex: "0 0 auto", border: "1px solid " + T.border, background: "transparent",
        color: T.fgDim, fontFamily: "'Newsreader', serif", fontStyle: "italic", fontSize: 13, lineHeight: 1, cursor: "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center" }}>i</button>
  );
}
function Chip({ children, color, solid }) {
  return (
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase",
      color: solid ? T.bg : (color || T.fgDim), background: solid ? (color || T.accent) : "transparent",
      border: "1px solid " + (color || T.border), padding: "3px 7px", borderRadius: 2, whiteSpace: "nowrap" }}>{children}</span>
  );
}
function AromaBand({ band, height = 10, animate = true }) {
  const total = band.reduce((s, b) => s + b.pct, 0) || 1;
  return (
    <div style={{ display: "flex", width: "100%", height, borderRadius: 2, overflow: "hidden", background: T.surface2 }}>
      {band.map((b, i) => (
        <div key={b.key} className={animate ? "fs-band-seg" : ""}
          style={{ width: (b.pct / total) * 100 + "%", background: PROFILES[b.key].color, transformOrigin: "left", animationDelay: i * 90 + "ms" }} />
      ))}
    </div>
  );
}

/* ------------------------------ attract ------------------------------ */
function Attract({ onStart, reduced }) {
  return (
    <button onClick={onStart} style={{ position: "absolute", inset: 0, background: T.bg, border: "none", cursor: "pointer",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: T.fg, textAlign: "center", padding: 40 }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: "0.35em", color: T.accent, marginBottom: 20 }}>CANNACRE8IVE</div>
      <div style={{ fontFamily: "'Newsreader', serif", fontSize: 68, fontWeight: 600, lineHeight: 1.02, letterSpacing: "-0.02em", marginBottom: 8 }}>Flower Spectrum</div>
      <div style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", fontSize: 22, color: T.fgDim, marginBottom: 40, maxWidth: 560 }}>Shop by aroma. The nose knows — this is the science catching up.</div>
      <div style={{ display: "flex", width: 460, maxWidth: "80vw", height: 14, borderRadius: 3, overflow: "hidden", boxShadow: "0 0 40px rgba(106,175,160,0.12)" }}>
        {PROFILE_ORDER.map((k, i) => <div key={k} className={reduced ? "" : "fs-attract-seg"} style={{ flex: 1, background: PROFILES[k].color, animationDelay: i * 70 + "ms" }} />)}
      </div>
      <div className={reduced ? "" : "fs-pulse"} style={{ marginTop: 44, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, letterSpacing: "0.25em", color: T.fgDim }}>TAP TO EXPLORE</div>
      <div style={{ position: "absolute", bottom: 22, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.muted, letterSpacing: "0.08em" }}>DEMO BUILD v{VERSION} · {BUILD} · ILLUSTRATIVE PRICING &amp; POTENCY</div>
    </button>
  );
}

/* ------------------------------ left rail ------------------------------ */
function LeftRail({ view, onNav, onEditor }) {
  return (
    <nav className="menu-rail" style={{ width: 236, flex: "0 0 236px", background: T.surface, borderRight: "1px solid " + T.border, display: "flex", flexDirection: "column", padding: "20px 0" }}>
      <div style={{ padding: "0 22px 18px" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.3em", color: T.accent }}>CANNACRE8IVE</div>
        <div style={{ fontFamily: "'Newsreader', serif", fontSize: 24, fontWeight: 600, marginTop: 2, lineHeight: 1.05 }}>Flower<br />Spectrum</div>
      </div>
      <div style={{ height: 1, background: T.border, marginBottom: 10 }} />
      <div style={{ flex: 1, overflowY: "auto" }}>
        {NAV.map((n) => {
          const active = view === n.id, isCat = n.kind === "cat";
          return (
            <button key={n.id} onClick={() => onNav(n.id)} style={{ width: "100%", textAlign: "left", background: active ? T.surface2 : "transparent",
              border: "none", borderLeft: "3px solid " + (active ? T.accent : "transparent"), color: active ? T.fg : T.fgDim, padding: "13px 20px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 11, fontFamily: n.kind === "special" ? "'JetBrains Mono', monospace" : "'DM Sans', sans-serif",
              fontSize: n.kind === "special" ? 12 : 15, fontWeight: 500, letterSpacing: n.kind === "special" ? "0.12em" : "0", textTransform: n.kind === "special" ? "uppercase" : "none" }}>
              {isCat && <span style={{ width: 9, height: 9, background: active ? T.accent : T.muted, flex: "0 0 auto" }} />}
              {n.kind === "special" && <span style={{ color: n.id === "flash" ? T.amber : T.accent }}>◆</span>}
              {n.label}
            </button>
          );
        })}
      </div>
      <div style={{ height: 1, background: T.border, margin: "10px 0" }} />
      <button onClick={onEditor} style={{ margin: "0 20px 10px", background: "transparent", border: "1px solid " + T.border, color: T.fgDim, borderRadius: 3, padding: "9px 12px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 8 }}>
        <span>⚙</span> DATA EDITOR
      </button>
      <div style={{ padding: "0 22px", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.muted, letterSpacing: "0.06em" }}>AROMA CLASSIFICATION —<br />NOT EFFECTS OR MEDICAL CLAIMS.</div>
    </nav>
  );
}

/* ------------------------------ aroma / infusion filter ------------------------------ */
function AromaStrip({ active, onPick, onInfo, title = "SHOP BY AROMA" }) {
  return (
    <div style={{ borderBottom: "1px solid " + T.border, background: T.bg, padding: "14px 26px 16px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.2em", color: T.fgDim }}>{title}</div>
        <button onClick={() => onPick(null)} style={{ background: active == null ? T.accent : "transparent", color: active == null ? T.bg : T.fgDim, border: "1px solid " + (active == null ? T.accent : T.border), borderRadius: 2, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.1em", padding: "4px 12px" }}>ALL</button>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {PROFILE_ORDER.map((k) => {
          const p = PROFILES[k], on = active === k;
          return (
            <button key={k} onClick={() => onPick(on ? null : k)} className="fs-swatch" style={{ flex: 1, position: "relative", cursor: "pointer", background: T.surface,
              border: "1px solid " + (on ? p.color : T.border), borderRadius: 3, padding: "10px 6px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 7,
              boxShadow: on ? "0 0 0 1px " + p.color + ", 0 6px 18px rgba(0,0,0,0.35)" : "none", transform: on ? "translateY(-2px)" : "none", transition: "transform .15s ease, box-shadow .15s ease" }}>
              <span style={{ width: on ? 26 : 22, height: on ? 26 : 22, borderRadius: "50%", background: p.color, transition: "all .15s ease" }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.06em", color: on ? T.fg : T.fgDim }}>{p.short}</span>
              <span onClick={(e) => { e.stopPropagation(); onInfo(k); }} style={{ position: "absolute", top: 3, right: 4, fontFamily: "'Newsreader', serif", fontStyle: "italic", fontSize: 11, color: T.muted }}>i</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------ product card ------------------------------ */
function ProductCard({ p, onInfo, onOpen }) {
  const band = getBand(p);
  const pi = priceInfo(p);
  return (
    <div className="fs-card" onClick={() => onOpen(p)} style={{ background: T.surface, border: "1px solid " + T.border, borderRadius: 4, padding: 18, display: "flex", flexDirection: "column", gap: 12, cursor: "pointer" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "'Newsreader', serif", fontSize: 20, fontWeight: 600, lineHeight: 1.12 }}>{p.name}</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: T.muted, marginTop: 3 }}>{p.grower}</div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {p.salePct != null && p.salePct > 0 && <Chip color={T.amber} solid>{p.salePct}% OFF</Chip>}
          {p.staffPick && <Chip color={T.accent}>★ Pick</Chip>}
          {p.illustrative && <Chip color={T.amber}>Illustrative</Chip>}
          {p.tier && <Chip>{p.tier}</Chip>}

        </div>
      </div>

      {p.category === "edible" ? (
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, background: T.surface2, borderRadius: 3, padding: "10px 12px" }}>
            <div style={{ fontFamily: "'Newsreader', serif", fontSize: 22, fontWeight: 600 }}>{p.dosePerPiece}mg</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.muted, letterSpacing: "0.08em" }}>PER PIECE · {p.pieces}CT</div>
          </div>
          <div style={{ flex: 1, background: T.surface2, borderRadius: 3, padding: "10px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15 }}>{p.infusion}</span>
              <InfoDot onClick={() => onInfo("infusion")} title="About infusion types" />
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.muted, letterSpacing: "0.08em", marginTop: 3 }}>ONSET {p.onset}</div>
          </div>
        </div>
      ) : band ? (
        <>
          <AromaBand band={band} height={10} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: PROFILES[band[0].key].color }} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>{p.blend}</span>
            </span>
            {p.confidence && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.muted, letterSpacing: "0.08em" }}>· {p.confidence.toUpperCase()}</span>}
            <InfoDot onClick={() => onInfo(band[0].key)} title={"About " + PROFILES[band[0].key].label} />
            {p.extractionType && <Chip color={T.border}>{p.extractionType}</Chip>}
          </div>
        </>
      ) : (
        // non-aroma (e.g. distillate vape) — lead with the spec, note why no band
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {p.cartType && <Chip color={T.accent}>{p.cartType}</Chip>}
          {p.flavor && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.fgDim }}>{p.flavor}</span>}
          <InfoDot onClick={() => onInfo("distillate")} title="Why no aroma profile?" />
        </div>
      )}

      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, lineHeight: 1.5, color: T.fgDim, flex: 1 }}>{p.blurb}</div>
      <div style={{ height: 1, background: T.border }} />
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <span>
          {p.salePct != null && p.salePct > 0 ? (
            <>
              <span style={{ fontFamily: "'Newsreader', serif", fontSize: 25, fontWeight: 600, color: T.amber }}>{usd(salePrice(pi.big, p.salePct))}</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.muted, textDecoration: "line-through", marginLeft: 7 }}>{usd(pi.big)}</span>
            </>
          ) : (
            <span style={{ fontFamily: "'Newsreader', serif", fontSize: 25, fontWeight: 600 }}>{usd(pi.big)}</span>
          )}
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: T.muted }}> {pi.unit}</span>
          {pi.sub && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: T.muted, marginLeft: 8 }}>{pi.sub}</span>}
        </span>
        {p.thc != null && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: T.fgDim }}>{p.thc}% THC</span>}
      </div>
    </div>
  );
}

/* ------------------------------ hero (home) ------------------------------ */
function Hero({ p, onInfo, onOpen, count, index, onDot }) {
  const band = getBand(p) || [{ key: "gas_fuel", pct: 1 }];
  const lead = PROFILES[band[0].key];
  const pi = priceInfo(p);
  return (
    <div style={{ position: "relative", border: "1px solid " + T.border, borderRadius: 5, overflow: "hidden", background: "linear-gradient(180deg," + T.surface + " 0%," + T.bg + " 100%)" }}>
      <div style={{ height: 4, display: "flex" }}>{band.map((b) => <div key={b.key} style={{ flex: b.pct, background: PROFILES[b.key].color }} />)}</div>
      <div className="fs-hero-body" onClick={() => onOpen(p)} style={{ padding: "26px 30px 22px", display: "flex", flexDirection: "column", gap: 14, cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.22em", color: T.accent }}>FEATURED</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.muted }}>· {p.grower}</span>
        </div>
        <div style={{ fontFamily: "'Newsreader', serif", fontSize: 46, fontWeight: 600, lineHeight: 1.0, letterSpacing: "-0.015em" }}>{p.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: lead.color }} />
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17 }}>{p.blend}</span>
          {p.confidence && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.muted, letterSpacing: "0.08em" }}>· {p.confidence.toUpperCase()}</span>}
          <InfoDot onClick={() => onInfo(band[0].key)} title={"About " + lead.label} />
        </div>
        <div style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", fontSize: 17, lineHeight: 1.5, color: T.fgDim, maxWidth: 640 }}>{p.blurb}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 4 }}>
          <span><span style={{ fontFamily: "'Newsreader', serif", fontSize: 30, fontWeight: 600 }}>{usd(pi.big)}</span><span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.muted }}> {pi.unit}{pi.sub ? " · " + pi.sub : ""}</span></span>
          {p.tier && <Chip>{p.tier}</Chip>}

          {p.thc != null && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: T.fgDim }}>{p.thc}% THC</span>}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 16, right: 20, display: "flex", gap: 7 }}>
        {Array.from({ length: count }).map((_, i) => (
          <button key={i} onClick={() => onDot(i)} aria-label={"Featured " + (i + 1)} style={{ width: i === index ? 22 : 8, height: 8, borderRadius: 4, border: "none", cursor: "pointer", background: i === index ? T.accent : T.border, transition: "width .2s ease" }} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ home ------------------------------ */
function Home({ products, activeProfile, onInfo, onOpen, heroIndex, setHeroIndex }) {
  const featured = products.filter((p) => p.featured);
  const heroes = featured.filter((p) => p.hero);
  const hero = heroes[heroIndex % (heroes.length || 1)] || featured[0];
  let grid = featured, filtered = false;
  if (activeProfile) { filtered = true; grid = products.filter((p) => { const b = getBand(p); return b && b.some((s) => s.key === activeProfile); }); }
  return (
    <div style={{ padding: "22px 26px 30px" }}>
      {!filtered && hero && <div style={{ marginBottom: 22 }}><Hero p={hero} onInfo={onInfo} onOpen={onOpen} count={heroes.length} index={heroIndex % (heroes.length || 1)} onDot={setHeroIndex} /></div>}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontFamily: "'Newsreader', serif", fontSize: 20, fontWeight: 600 }}>{filtered ? PROFILES[activeProfile].label : "Featured Selections"}</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.muted, letterSpacing: "0.06em" }}>{filtered ? PROFILES[activeProfile].tagline : "Curated by our staff · " + featured.length + " picks"}</div>
      </div>
      {grid.length === 0 ? (
        <div style={{ border: "1px dashed " + T.border, borderRadius: 4, padding: "40px 20px", textAlign: "center", color: T.muted, fontFamily: "'DM Sans', sans-serif" }}>
          Nothing in {PROFILES[activeProfile].label} right now — try another aroma or browse a category.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {grid.map((p) => <ProductCard key={p.id} p={p} onInfo={onInfo} onOpen={onOpen} />)}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ category browse ------------------------------ */
function SortBar({ options, sortKey, dir, onSort, count }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 26px", borderBottom: "1px solid " + T.border, flexWrap: "wrap" }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.15em", color: T.muted }}>SORT</span>
      {options.map((k) => {
        const on = sortKey === k;
        return (
          <button key={k} onClick={() => onSort(k)} style={{ background: on ? T.surface3 : "transparent", border: "1px solid " + (on ? T.accent : T.border), color: on ? T.fg : T.fgDim, borderRadius: 2, padding: "6px 12px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}>
            {SORT_LABEL[k]}{on && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.accent }}>{dir === "asc" ? "↑" : "↓"}</span>}
          </button>
        );
      })}
      <span style={{ marginLeft: "auto", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.muted }}>{count} items</span>
    </div>
  );
}
function CategoryBrowse({ catId, products, activeProfile, onPick, onInfo, onOpen, sortKey, dir, onSort }) {
  const cfg = CAT[catId];
  const cat = CAT_CSV[catId];
  let list = products.filter((p) => p.category === cat);
  if (activeProfile && cfg.aroma) list = list.filter((p) => { const b = getBand(p); return b && b.some((s) => s.key === activeProfile); });
  list = sortProducts(list, sortKey, dir);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {cfg.aroma && <AromaStrip active={activeProfile} onPick={onPick} onInfo={onInfo} title={cfg.aroma === "partial" ? "FILTER BY AROMA (FULL-SPECTRUM ONLY)" : "SHOP BY AROMA"} />}
      <SortBar options={cfg.sorts} sortKey={sortKey} dir={dir} onSort={onSort} count={list.length} />
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 26px 30px" }}>
        {list.length === 0 ? (
          <div style={{ border: "1px dashed " + T.border, borderRadius: 4, padding: "40px 20px", textAlign: "center", color: T.muted, fontFamily: "'DM Sans', sans-serif" }}>No items match this filter.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {list.map((p) => <ProductCard key={p.id} p={p} onInfo={onInfo} onOpen={onOpen} />)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ product detail ------------------------------ */
function Spec({ label, value }) {
  if (value == null || value === "" ) return null;
  return (
    <div style={{ padding: "10px 0", borderBottom: "1px solid " + T.border, display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: T.muted, textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: T.fg, textAlign: "right" }}>{value}</span>
    </div>
  );
}
function ProductDetail({ p, onClose, onInfo }) {
  if (!p) return null;
  const band = getBand(p);
  const pi = priceInfo(p);
  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 45, display: "flex", justifyContent: "flex-end" }}>
      <div className="fs-detail" onClick={(e) => e.stopPropagation()} style={{ width: "min(560px, 82%)", height: "100%", background: T.surface, borderLeft: "1px solid " + T.border, overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 26px", borderBottom: "1px solid " + T.border, position: "sticky", top: 0, background: T.surface }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.2em", color: T.accent }}>{CAT[Object.keys(CAT_CSV).find((k) => CAT_CSV[k] === p.category)] ? CAT[Object.keys(CAT_CSV).find((k) => CAT_CSV[k] === p.category)].label.toUpperCase() : p.category.toUpperCase()}</span>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid " + T.border, color: T.fgDim, borderRadius: 3, padding: "6px 14px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>CLOSE</button>
        </div>
        <div style={{ padding: "22px 26px 40px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            {p.staffPick && <Chip color={T.accent} solid>★ Staff Pick</Chip>}
            {p.illustrative && <Chip color={T.amber}>Illustrative</Chip>}
            {p.tier && <Chip>{p.tier}</Chip>}
            {p.sourceId && <a href={`#social?strain=${p.sourceId}`} style={{color:T.accent,fontSize:12}}>Create assets from this sample ↗</a>}

          </div>
          <div style={{ fontFamily: "'Newsreader', serif", fontSize: 34, fontWeight: 600, lineHeight: 1.05 }}>{p.name}</div>
          {p.sourceId && <p style={{fontSize:12,color:T.fgDim,lineHeight:1.6}}>Historical 2023 panel transcribed in the supplied prototype. Original lab PDFs not included. No current availability or price.</p>}
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.muted, marginTop: 4 }}>{p.grower}{p.lineage && p.lineage !== "—" ? " · " + p.lineage : ""}</div>

          {band && (
            <div style={{ margin: "22px 0" }}>
              <AromaBand band={band} height={16} />
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                <span style={{ width: 14, height: 14, borderRadius: "50%", background: PROFILES[band[0].key].color }} />
                <span style={{ fontFamily: "'Newsreader', serif", fontSize: 22, fontWeight: 600 }}>{p.blend}</span>
                {p.confidence && <Chip>{p.confidence}</Chip>}
                <InfoDot onClick={() => onInfo(band[0].key)} title={"About " + PROFILES[band[0].key].label} />
              </div>
              {band.length > 1 && (
                <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
                  {band.map((b) => (
                    <span key={b.key} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.fgDim }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: PROFILES[b.key].color }} />
                      {PROFILES[b.key].short} {p[b.key === p.primaryKey ? "primaryPct" : "secondaryPct"] != null ? p[b.key === p.primaryKey ? "primaryPct" : "secondaryPct"] + "%" : ""}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {p.category === "vape" && !band && (
            <div style={{ margin: "22px 0", padding: 16, background: T.surface2, borderRadius: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Chip color={T.accent}>{p.cartType}</Chip>
                <InfoDot onClick={() => onInfo("distillate")} title="Why no aroma profile?" />
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.fgDim, marginTop: 8 }}>Distillate is largely terpene-stripped, so its flavor is added rather than strain-derived — the Flower Spectrum classification doesn't apply here.</div>
            </div>
          )}

          <div style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", fontSize: 17, lineHeight: 1.55, color: T.fg, margin: "18px 0 22px" }}>{p.blurb}</div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 18 }}>
            {p.salePct != null && p.salePct > 0 ? (
              <>
                <span style={{ fontFamily: "'Newsreader', serif", fontSize: 40, fontWeight: 600, color: T.amber }}>{usd(salePrice(pi.big, p.salePct))}</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: T.muted, textDecoration: "line-through" }}>{usd(pi.big)}</span>
                <Chip color={T.amber} solid>{p.salePct}% OFF</Chip>
              </>
            ) : (
              <span style={{ fontFamily: "'Newsreader', serif", fontSize: 40, fontWeight: 600 }}>{usd(pi.big)}</span>
            )}
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: T.muted }}>{pi.unit}{pi.sub ? " · " + pi.sub : ""}</span>
          </div>

          {/* category-specific spec table */}
          <div>
            {p.thc != null && <Spec label="THC" value={p.thc + "%"} />}
            {p.category === "edible" && <>
              <Spec label="Dose / piece" value={p.dosePerPiece + "mg"} />
              <Spec label="Count" value={p.pieces + " pieces · " + (p.dosePerPiece * p.pieces) + "mg total"} />
              <div style={{ padding: "10px 0", borderBottom: "1px solid " + T.border, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: T.muted }}>INFUSION</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>{p.infusion}</span><InfoDot onClick={() => onInfo("infusion")} /></span>
              </div>
              <Spec label="Ratio" value={p.ratio} />
              <Spec label="Onset" value={p.onset} />
              <Spec label="Dietary" value={p.diet} />
            </>}
            {p.category === "concentrate" && <div style={{ padding: "10px 0", borderBottom: "1px solid " + T.border, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: T.muted }}>EXTRACTION</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>{p.extractionType}</span><InfoDot onClick={() => onInfo("extraction")} /></span>
            </div>}
            {p.category === "vape" && <><Spec label="Cart type" value={p.cartType} /><Spec label="Hardware" value={p.hardware} /></>}
            {p.category === "preroll" && <><Spec label="Type" value={p.infused ? "Infused" : "Flower"} />{p.infused && <Spec label="Infused with" value={p.infusedWith} />}<Spec label="Size" value={(p.count || 1) + " × " + p.size} /></>}
          </div>

          {p.staffPick && p.pickNote && (
            <div style={{ marginTop: 20, padding: 16, background: T.surface2, borderRadius: 4, borderLeft: "3px solid " + T.accent }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: T.accent, marginBottom: 6 }}>★ STAFF PICK{p.pickedBy ? " · " + p.pickedBy.toUpperCase() : ""}</div>
              <div style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", fontSize: 16, color: T.fg }}>“{p.pickNote}”</div>
            </div>
          )}
          <div style={{ marginTop: 24, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.muted, letterSpacing: "0.06em" }}>AROMA CLASSIFICATION, NOT EFFECTS OR MEDICAL CLAIMS.</div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ info sheet ------------------------------ */
function InfoSheet({ concept, onOpenConcept, onClose }) {
  if (!concept) return null;
  const isProfile = !!PROFILES[concept];
  const isTerp = !!TERPENES[concept];
  const p = PROFILES[concept];
  const t = TERPENES[concept];
  const n = CONCEPTS[concept];
  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 50, display: "flex", alignItems: "flex-end" }}>
      <div className="fs-sheet" onClick={(e) => e.stopPropagation()} style={{ width: "100%", background: T.surface, borderTop: "1px solid " + T.border, borderTopLeftRadius: 10, borderTopRightRadius: 10, padding: "24px 30px 30px", maxHeight: "72%", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.2em", color: T.accent }}>
            {isProfile ? "AROMA PROFILE" : isTerp ? "TERPENE" : (n && n.kicker) || "GOOD TO KNOW"}
          </span>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid " + T.border, color: T.fgDim, borderRadius: 3, padding: "6px 14px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>CLOSE</button>
        </div>

        {isProfile && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <span style={{ width: 40, height: 40, borderRadius: "50%", background: p.color, flex: "0 0 auto" }} />
              <div><div style={{ fontFamily: "'Newsreader', serif", fontSize: 30, fontWeight: 600, lineHeight: 1 }}>{p.label}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.muted, letterSpacing: "0.1em", marginTop: 4 }}>{p.short}</div></div>
            </div>
            <div style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", fontSize: 20, color: T.fg, marginBottom: 16 }}>{p.tagline}.</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: T.accent, marginBottom: 8 }}>LED BY — TAP TO GO DEEPER</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.keys(TERPENES).filter((k) => TERPENES[k].profiles.includes(concept)).map((k) => (
                <button key={k} onClick={() => onOpenConcept(k)} style={{ background: T.surface2, border: "1px solid " + T.border, color: T.fg, borderRadius: 3, padding: "8px 14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>{TERPENES[k].name} →</button>
              ))}
            </div>
          </div>
        )}

        {isTerp && (
          <div>
            <div style={{ fontFamily: "'Newsreader', serif", fontSize: 30, fontWeight: 600, marginBottom: 10 }}>{t.name}</div>
            <div style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", fontSize: 19, color: T.fg, marginBottom: 16 }}>{t.aroma}.</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: T.accent, marginBottom: 6 }}>ALSO FOUND IN</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: T.fgDim, marginBottom: 16 }}>{t.nature}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: T.accent, marginBottom: 8 }}>DRIVES THESE PROFILES</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {t.profiles.map((k) => (
                <button key={k} onClick={() => onOpenConcept(k)} style={{ display: "flex", alignItems: "center", gap: 7, background: T.surface2, border: "1px solid " + T.border, color: T.fg, borderRadius: 3, padding: "8px 14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: PROFILES[k].color }} />{PROFILES[k].label} →
                </button>
              ))}
            </div>
          </div>
        )}

        {!isProfile && !isTerp && (
          <div>
            <div style={{ fontFamily: "'Newsreader', serif", fontSize: 28, fontWeight: 600, marginBottom: 10 }}>{n ? n.title : "Good to know"}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, lineHeight: 1.65, color: T.fgDim, maxWidth: 720 }}>{n ? n.body : ""}</div>
          </div>
        )}

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid " + T.border, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.muted, letterSpacing: "0.05em", lineHeight: 1.6 }}>
          AROMA CLASSIFICATION, NOT EFFECTS OR MEDICAL CLAIMS.
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ learn section ------------------------------ */
function Learn({ onOpen }) {
  const cards = [
    ...Object.keys(CONCEPTS).map((k) => ({ k, kicker: CONCEPTS[k].kicker, title: CONCEPTS[k].title, dot: null })),
    ...PROFILE_ORDER.map((k) => ({ k, kicker: "AROMA PROFILE", title: PROFILES[k].label, dot: PROFILES[k].color })),
    ...Object.keys(TERPENES).map((k) => ({ k, kicker: "TERPENE", title: TERPENES[k].name, dot: null })),
  ];
  return (
    <div style={{ padding: "22px 26px 30px" }}>
      <div style={{ maxWidth: 680, marginBottom: 22 }}>
        <div style={{ fontFamily: "'Newsreader', serif", fontSize: 30, fontWeight: 600, marginBottom: 8 }}>How this menu works</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, lineHeight: 1.6, color: T.fgDim }}>
          Everything here is organized by <b style={{ color: T.fg }}>aroma</b>, read straight from each batch's lab terpene panel — because your nose is a better guide than a THC number. Tap any topic.
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 12 }}>
        {cards.map((c) => (
          <button key={c.k} onClick={() => onOpen(c.k)} className="fs-card" style={{ textAlign: "left", background: T.surface, border: "1px solid " + T.border, borderRadius: 4, padding: 16, cursor: "pointer", display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {c.dot && <span style={{ width: 10, height: 10, borderRadius: "50%", background: c.dot }} />}
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.15em", color: T.accent }}>{c.kicker}</span>
            </span>
            <span style={{ fontFamily: "'Newsreader', serif", fontSize: 18, fontWeight: 600, color: T.fg }}>{c.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ data editor ------------------------------ */
const CATS_FOR_NEW = ["flower","preroll","vape","concentrate","edible"];
function Field({ label, value, onChange, type = "text", options }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.08em", color: T.muted, textTransform: "uppercase" }}>{label}</span>
      {options ? (
        <select value={value == null ? "" : value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
          <option value="">—</option>
          {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      ) : (
        <input type={type} value={value == null ? "" : value} onChange={(e) => onChange(type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)} style={inputStyle} />
      )}
    </label>
  );
}
const inputStyle = { background: T.bg, border: "1px solid " + T.border, color: T.fg, borderRadius: 3, padding: "8px 10px", fontFamily: "'DM Sans', sans-serif", fontSize: 14, width: "100%" };
const profileOpts = PROFILE_ORDER.map((k) => ({ v: k, l: PROFILES[k].label }));

function EditForm({ draft, setDraft, onSave, onCancel }) {
  const u = (k) => (v) => setDraft({ ...draft, [k]: v });
  const cat = draft.category;
  const aroma = cat === "flower" || cat === "concentrate" || cat === "preroll" || cat === "vape";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Category" value={cat} onChange={u("category")} options={CATS_FOR_NEW.map((c) => ({ v: c, l: c }))} />
        <Field label="Name" value={draft.name} onChange={u("name")} />
        <Field label="Grower" value={draft.grower} onChange={u("grower")} />
        <Field label="Lineage" value={draft.lineage} onChange={u("lineage")} />
        <Field label="Tier" value={draft.tier} onChange={u("tier")} />
        <Field label="THC %" value={draft.thc} onChange={u("thc")} type="number" />
      </div>

      {aroma && <>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: T.accent }}>AROMA CLASSIFICATION</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 1fr 90px", gap: 12 }}>
          <Field label="Primary" value={draft.primaryKey} onChange={u("primaryKey")} options={profileOpts} />
          <Field label="Prim %" value={draft.primaryPct} onChange={u("primaryPct")} type="number" />
          <Field label="Secondary" value={draft.secondaryKey} onChange={u("secondaryKey")} options={profileOpts} />
          <Field label="Sec %" value={draft.secondaryPct} onChange={u("secondaryPct")} type="number" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Blend name" value={draft.blend} onChange={u("blend")} />
          <Field label="Confidence" value={draft.confidence} onChange={u("confidence")} options={[{v:"Defined",l:"Defined"},{v:"Leaning",l:"Leaning"},{v:"Blend",l:"Blend"}]} />
        </div>
      </>}

      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: T.accent }}>PRICING &amp; CATEGORY SPECS</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {cat === "flower" && <><Field label="Price 1/8" value={draft.priceEighth} onChange={u("priceEighth")} type="number" /><Field label="Price 1g" value={draft.priceGram} onChange={u("priceGram")} type="number" /></>}
        {cat === "concentrate" && <><Field label="Price 1g" value={draft.priceGram} onChange={u("priceGram")} type="number" /><Field label="Extraction" value={draft.extractionType} onChange={u("extractionType")} /></>}
        {cat === "vape" && <><Field label="Price each" value={draft.priceEach} onChange={u("priceEach")} type="number" /><Field label="Cart type" value={draft.cartType} onChange={u("cartType")} /><Field label="Hardware" value={draft.hardware} onChange={u("hardware")} /></>}
        {cat === "preroll" && <><Field label="Price each" value={draft.priceEach} onChange={u("priceEach")} type="number" /><Field label="Size" value={draft.size} onChange={u("size")} /><Field label="Count" value={draft.count} onChange={u("count")} type="number" /><Field label="Infused with" value={draft.infusedWith} onChange={u("infusedWith")} /></>}
        {cat === "edible" && <><Field label="Price pack" value={draft.pricePack} onChange={u("pricePack")} type="number" /><Field label="Dose/pc (mg)" value={draft.dosePerPiece} onChange={u("dosePerPiece")} type="number" /><Field label="Pieces" value={draft.pieces} onChange={u("pieces")} type="number" /><Field label="Infusion" value={draft.infusion} onChange={u("infusion")} /><Field label="Ratio" value={draft.ratio} onChange={u("ratio")} /><Field label="Onset" value={draft.onset} onChange={u("onset")} /><Field label="Diet" value={draft.diet} onChange={u("diet")} /></>}
      </div>

      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: T.accent }}>MERCHANDISING</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="Featured" value={draft.featured ? "yes" : ""} onChange={(v) => setDraft({ ...draft, featured: truthy(v) })} options={[{v:"yes",l:"Yes"},{v:"",l:"No"}]} />
        <Field label="Hero" value={draft.hero ? "yes" : ""} onChange={(v) => setDraft({ ...draft, hero: truthy(v) })} options={[{v:"yes",l:"Yes"},{v:"",l:"No"}]} />
        <Field label="Illustrative" value={draft.illustrative ? "yes" : ""} onChange={(v) => setDraft({ ...draft, illustrative: truthy(v) })} options={[{v:"yes",l:"Yes"},{v:"",l:"No"}]} />
        <Field label="Staff pick" value={draft.staffPick ? "yes" : ""} onChange={(v) => setDraft({ ...draft, staffPick: truthy(v) })} options={[{v:"yes",l:"Yes"},{v:"",l:"No"}]} />
        <Field label="Picked by" value={draft.pickedBy} onChange={u("pickedBy")} />
      </div>
      <Field label="Pick note" value={draft.pickNote} onChange={u("pickNote")} />
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.08em", color: T.muted }}>BLURB</span>
        <textarea value={draft.blurb || ""} onChange={(e) => u("blurb")(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
      </label>

      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button onClick={onSave} style={btn(true)}>SAVE</button>
        <button onClick={onCancel} style={btn(false)}>CANCEL</button>
      </div>
    </div>
  );
}
function btn(primary) {
  return { background: primary ? T.accent : "transparent", color: primary ? T.bg : T.fgDim, border: "1px solid " + (primary ? T.accent : T.border), borderRadius: 3, padding: "10px 18px", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: "0.08em" };
}

function DataEditor({ products, onClose, onReplaceAll, onUpsert, onDelete }) {
  const [tab, setTab] = useState("products");
  const [editing, setEditing] = useState(null); // draft product or null
  const [importText, setImportText] = useState("");
  const [importReport, setImportReport] = useState(null);

  const startNew = () => setEditing({ id: "new_" + Math.random().toString(36).slice(2, 7), category: "flower", name: "", grower: "", lineage: "—", tier: "" });
  const saveDraft = () => { const checked=parseCsvToProducts(csvSerialize(CSV_MASTER,[productToRow(editing)])); if (checked.errors.length) {window.alert(checked.errors.join("\n"));return;} const original=products.find(p=>p.id===editing.id); const changed=original && ["primaryKey","primaryPct","secondaryKey","secondaryPct"].some(k=>editing[k]!==original[k]); onUpsert(changed?{...editing,band:undefined,sourceId:null,archivedValues:editing.values,values:{}}:editing); setEditing(null); };

  const currentCsv = useMemo(() => csvSerialize(CSV_MASTER, products.map(productToRow)), [products]);
  const templates = useMemo(() => Object.keys(TEMPLATE_COLS).map((c) => ({ id: c, label: CAT[c].label, csv: templateCsv(c) })), []);

  const runImport = (mode) => {
    const res = parseCsvToProducts(importText);
    const ok = res.products.filter((p) => p.category);
    setImportReport({ total: res.products.length, ok: res.errors.length ? 0 : ok.length, errors: res.errors });
    if (res.errors.length) return;
    if (ok.length) { if (mode === "replace") onReplaceAll(ok); else ok.forEach((p) => onUpsert(p)); }
  };

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 60, display: "flex", justifyContent: "center", alignItems: "stretch", padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(1000px, 100%)", background: T.surface, border: "1px solid " + T.border, borderRadius: 6, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", borderBottom: "1px solid " + T.border }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: "0.18em", color: T.accent }}>⚙ DATA EDITOR</span>
            <Chip color={T.amber}>Local demo editor</Chip>
          </div>
          <button onClick={onClose} style={btn(false)}>DONE</button>
        </div>
        <div style={{ display: "flex", gap: 6, padding: "10px 22px", borderBottom: "1px solid " + T.border }}>
          {[["products","Products"],["import","Import CSV"],["export","Export / Templates"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ background: tab === k ? T.surface3 : "transparent", border: "1px solid " + (tab === k ? T.accent : T.border), color: tab === k ? T.fg : T.fgDim, borderRadius: 3, padding: "7px 14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>{l}</button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 22 }}>
          {tab === "products" && !editing && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: T.fgDim }}>{products.length} products</span>
                <button onClick={startNew} style={btn(true)}>+ ADD PRODUCT</button>
              </div>
              <div style={{ border: "1px solid " + T.border, borderRadius: 4, overflow: "hidden" }}>
                {products.map((p, i) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: i < products.length - 1 ? "1px solid " + T.border : "none", background: i % 2 ? T.surface : T.surface2 }}>
                    {p.primaryKey ? <span style={{ width: 10, height: 10, borderRadius: "50%", background: PROFILES[p.primaryKey].color, flex: "0 0 auto" }} /> : <span style={{ width: 10, height: 10, background: T.muted, flex: "0 0 auto" }} />}
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                    <Chip>{p.category}</Chip>
                    {p.featured && <Chip color={T.accent}>Featured</Chip>}
                    <button onClick={() => setEditing({ ...p })} style={{ ...btn(false), padding: "6px 12px" }}>EDIT</button>
                    <button onClick={() => { if (typeof window === "undefined" || window.confirm("Delete " + p.name + "?")) onDelete(p.id); }} style={{ ...btn(false), padding: "6px 12px", color: T.danger, borderColor: T.border }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === "products" && editing && (
            <div>
              <div style={{ fontFamily: "'Newsreader', serif", fontSize: 22, fontWeight: 600, marginBottom: 16 }}>{editing.name || "New product"}</div>
              <EditForm draft={editing} setDraft={setEditing} onSave={saveDraft} onCancel={() => setEditing(null)} />
            </div>
          )}

          {tab === "import" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: T.fgDim, lineHeight: 1.6 }}>
                Paste or upload a CSV in <b style={{ color: T.fg }}>this tool's own format</b> (use the templates on the Export tab). Cross-format mapping — e.g. a raw Dutchie or lab export — is a separate tool and isn't wired here yet.
              </div>
              <input type="file" accept=".csv,text/csv" onChange={(e) => { const f = e.target.files && e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => setImportText(String(r.result)); r.readAsText(f); }}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.fgDim }} />
              <textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={8} placeholder="…or paste CSV text here" style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, resize: "vertical" }} />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => runImport("replace")} style={btn(true)} disabled={!importText.trim()}>REPLACE ALL</button>
                <button onClick={() => runImport("append")} style={btn(false)} disabled={!importText.trim()}>APPEND</button>
              </div>
              {importReport && (
                <div style={{ padding: 14, background: T.surface2, borderRadius: 4, fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
                  <div style={{ color: T.accent }}>Imported {importReport.ok} of {importReport.total} rows.</div>
                  {importReport.errors.length > 0 && <div style={{ color: T.amber, marginTop: 6 }}>{importReport.errors.slice(0, 6).map((e, i) => <div key={i}>{e}</div>)}</div>}
                </div>
              )}
            </div>
          )}

          {tab === "export" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.12em", color: T.accent, marginBottom: 10 }}>CURRENT DATASET</div>
                <a href={dataUri(currentCsv)} download={"flower-spectrum-menu-data-" + BUILD + ".csv"} style={{ ...btn(true), textDecoration: "none", display: "inline-block" }}>↓ EXPORT ALL PRODUCTS ({products.length})</a>
              </div>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.12em", color: T.accent, marginBottom: 6 }}>SIMULATED TEMPLATES — ONE PER MENU</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: T.muted, marginBottom: 12 }}>Each carries only that menu's columns plus a couple of clearly-marked SAMPLE rows to fill in or delete.</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                  {templates.map((t) => (
                    <a key={t.id} href={dataUri(t.csv)} download={"flower-spectrum-" + t.id + "-template.csv"} style={{ ...btn(false), textDecoration: "none", textAlign: "center" }}>↓ {t.label} template</a>
                  ))}
                </div>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.muted, letterSpacing: "0.05em", lineHeight: 1.6, borderTop: "1px solid " + T.border, paddingTop: 14 }}>
                DOWNLOADS ARE DATA-URI LINKS — TAP TO SAVE. FORMAT MATCHES THE IMPORT TAB (ROUND-TRIP).<br />CROSS-FORMAT / POS AUTO-MAPPING IS A SEPARATE, LATER TOOL.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ flash ticker ------------------------------ */
function FlashTicker({ products, elapsedSec, onGo }) {
  const sales = activeSales(products, elapsedSec);
  if (sales.length === 0) return (
    <div style={{ height: 40, flex: "0 0 40px", background: T.surface, borderTop: "1px solid " + T.border, display: "flex", alignItems: "center", padding: "0 16px" }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.muted, letterSpacing: "0.12em" }}>FLOWER SPECTRUM · SHOP BY AROMA</span>
    </div>
  );
  const line = sales.map((p) => {
    const left = p.saleEndsMin != null ? Math.max(0, p.saleEndsMin * 60 - elapsedSec) : null;
    return "◆  FLASH SALE — " + p.name + "  " + p.salePct + "% OFF" + (left != null ? "  · ENDS IN " + fmtCountdown(left) : "") + "   ";
  }).join("");
  return (
    <button onClick={onGo} style={{ height: 40, flex: "0 0 40px", background: T.surface, borderTop: "1px solid " + T.border, border: "none", borderTopStyle: "solid", borderTopWidth: 1, borderTopColor: T.border, display: "flex", alignItems: "center", overflow: "hidden", cursor: "pointer", padding: 0, width: "100%" }}>
      <span style={{ padding: "0 16px", flex: "0 0 auto", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.15em", color: T.amber, borderRight: "1px solid " + T.border, height: "100%", display: "flex", alignItems: "center" }}>LIVE</span>
      <span style={{ flex: 1, overflow: "hidden", whiteSpace: "nowrap", textAlign: "left" }}>
        <span className="fs-ticker" style={{ display: "inline-block", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: T.amber, letterSpacing: "0.1em" }}>
          <span>{line}</span><span>{line}</span>
        </span>
      </span>
    </button>
  );
}

/* ------------------------------ staff picks ------------------------------ */
function StaffPicks({ products, onInfo, onOpen }) {
  const picks = products.filter((p) => p.staffPick);
  return (
    <div style={{ padding: "22px 26px 30px" }}>
      <div style={{ maxWidth: 680, marginBottom: 22 }}>
        <div style={{ fontFamily: "'Newsreader', serif", fontSize: 30, fontWeight: 600, marginBottom: 8 }}>Staff Picks</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, lineHeight: 1.6, color: T.fgDim }}>What our budtenders reach for — and why, in their own words.</div>
      </div>
      {picks.length === 0 ? (
        <div style={{ border: "1px dashed " + T.border, borderRadius: 4, padding: "40px 20px", textAlign: "center", color: T.muted, fontFamily: "'DM Sans', sans-serif" }}>No staff picks flagged right now — set them in the Data Editor.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 860 }}>
          {picks.map((p) => {
            const band = getBand(p); const pi = priceInfo(p);
            return (
              <div key={p.id} className="fs-card" onClick={() => onOpen(p)} style={{ background: T.surface, border: "1px solid " + T.border, borderLeft: "3px solid " + T.accent, borderRadius: 4, padding: 22, cursor: "pointer", display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.15em", color: T.accent, marginBottom: 6 }}>★ {p.pickedBy ? p.pickedBy.toUpperCase() + "'S PICK" : "STAFF PICK"}</div>
                    <div style={{ fontFamily: "'Newsreader', serif", fontSize: 26, fontWeight: 600, lineHeight: 1.05 }}>{p.name}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: T.muted, marginTop: 3 }}>{p.grower}</div>
                  </div>
                  <span><span style={{ fontFamily: "'Newsreader', serif", fontSize: 26, fontWeight: 600 }}>{usd(pi.big)}</span><span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: T.muted }}> {pi.unit}</span></span>
                </div>
                {band && <>
                  <AromaBand band={band} height={14} />
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: PROFILES[band[0].key].color }} />
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>{p.blend}</span>
                    {p.confidence && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.muted, letterSpacing: "0.08em" }}>· {p.confidence.toUpperCase()}</span>}
                    <InfoDot onClick={() => onInfo(band[0].key)} />
                  </div>
                </>}
                {p.pickNote && <div style={{ fontFamily: "'Newsreader', serif", fontStyle: "italic", fontSize: 18, color: T.fg, lineHeight: 1.5 }}>“{p.pickNote}”</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ flash sale ------------------------------ */
function FlashSale({ products, elapsedSec, onInfo, onOpen }) {
  const sales = activeSales(products, elapsedSec);
  return (
    <div style={{ padding: "22px 26px 30px" }}>
      <div style={{ maxWidth: 680, marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: T.amber }}>◆</span>
          <span style={{ fontFamily: "'Newsreader', serif", fontSize: 30, fontWeight: 600 }}>Flash Sale</span>
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, lineHeight: 1.6, color: T.fgDim }}>Live markdowns, while the clock runs. Ask your budtender to ring them in.</div>
      </div>
      {sales.length === 0 ? (
        <div style={{ border: "1px dashed " + T.border, borderRadius: 4, padding: "40px 20px", textAlign: "center", color: T.muted, fontFamily: "'DM Sans', sans-serif" }}>Nothing on flash sale right now — check back soon.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {sales.map((p) => {
            const band = getBand(p); const pi = priceInfo(p);
            const now = salePrice(pi.big, p.salePct);
            const left = p.saleEndsMin != null ? Math.max(0, p.saleEndsMin * 60 - elapsedSec) : null;
            return (
              <div key={p.id} className="fs-card" onClick={() => onOpen(p)} style={{ background: T.surface, border: "1px solid " + T.amber + "44", borderRadius: 4, padding: 20, cursor: "pointer", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Chip color={T.amber} solid>{p.salePct}% OFF</Chip>
                  {left != null && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: T.amber, letterSpacing: "0.06em" }}>{fmtCountdown(left)}</span>}
                </div>
                <div>
                  <div style={{ fontFamily: "'Newsreader', serif", fontSize: 22, fontWeight: 600, lineHeight: 1.1 }}>{p.name}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: T.muted, marginTop: 3 }}>{p.grower}</div>
                </div>
                {band && <AromaBand band={band} height={10} />}
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: "auto" }}>
                  <span style={{ fontFamily: "'Newsreader', serif", fontSize: 28, fontWeight: 600, color: T.amber }}>{usd(now)}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: T.muted, textDecoration: "line-through" }}>{usd(pi.big)}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: T.muted }}>{pi.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ marginTop: 24, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.muted, letterSpacing: "0.06em" }}>SALE PRICING IS ILLUSTRATIVE IN THIS DEMO.</div>
    </div>
  );
}

/* ------------------------------ root ------------------------------ */
export default function TabletMenu({ profile = null }) {
  const [mode, setMode] = useState(profile ? "active" : "attract");
  const [view, setView] = useState(profile ? "flower" : "home");
  const [activeProfile, setActiveProfile] = useState(profile);
  const [info, setInfo] = useState(null);
  const [detail, setDetail] = useState(/*DETAIL*/ null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [products, setProducts] = useCatalog();
  const [sort, setSort] = useState({ key: "tier", dir: "desc" });

  const reduced = typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;
  const editorRef = useRef(editorOpen); editorRef.current = editorOpen;
  const idleRef = useRef(null);
  const resetIdle = useCallback(() => {
    if (idleRef.current) clearTimeout(idleRef.current);
    if (editorRef.current) return; // don't reset an operator mid-edit
    idleRef.current = setTimeout(() => { setMode("attract"); setView("home"); setActiveProfile(null); setInfo(null); setDetail(null); setHeroIndex(0); }, 60000);
  }, []);
  useEffect(() => { if (mode === "active") resetIdle(); return () => { if (idleRef.current) clearTimeout(idleRef.current); }; }, [mode, resetIdle, editorOpen]);

  useEffect(() => {
    if (mode !== "active" || view !== "home" || activeProfile || detail || editorOpen || reduced) return;
    const heroes = products.filter((p) => p.featured && p.hero).length || 1;
    const id = setInterval(() => setHeroIndex((i) => (i + 1) % heroes), 6000);
    return () => clearInterval(id);
  }, [mode, view, activeProfile, detail, editorOpen, reduced, products]);

  useEffect(() => { if (mode !== "active") return; const id = setInterval(() => setElapsedSec((s) => s + 1), 1000); return () => clearInterval(id); }, [mode]);

  const start = () => { setMode("active"); resetIdle(); };
  const nav = (id) => { setView(id); setActiveProfile(null); setInfo(null); setDetail(null); if (CAT[id]) setSort({ key: CAT[id].sorts[0], dir: CAT[id].sorts[0] === "name" ? "asc" : "desc" }); resetIdle(); };
  const pick = (k) => { setActiveProfile(k); resetIdle(); };
  const openInfo = (c) => { setInfo(c); resetIdle(); };
  const openDetail = (p) => { setDetail(p); resetIdle(); };
  const doSort = (k) => { setSort((s) => (s.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: k === "name" || k === "grower" ? "asc" : "desc" })); resetIdle(); };

  const upsert = (prod) => setProducts((ps) => { const i = ps.findIndex((x) => x.id === prod.id); if (i >= 0) { const n = [...ps]; n[i] = prod; return n; } return [...ps, prod]; });
  const del = (id) => setProducts((ps) => ps.filter((x) => x.id !== id));
  const replaceAll = (arr) => setProducts(arr);

  const shownProducts = products.map(p => p.saleEndsMin != null && p.saleEndsMin * 60 <= elapsedSec ? {...p, salePct:null} : p);
  const detailLive = detail ? shownProducts.find((x) => x.id === detail.id) || detail : null;

  return (
    <div onPointerDown={mode === "active" ? resetIdle : undefined} style={{ position: "relative", width: "100%", height: "calc(100dvh - 116px)", minHeight: 640, background: T.bg, color: T.fg, overflow: "hidden", fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{CSS}</style>
      {mode === "attract" ? <Attract onStart={start} reduced={reduced} /> : (
        <>
          <div className="menu-layout" style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <LeftRail view={view} onNav={nav} onEditor={() => setEditorOpen(true)} />
            <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 26px", borderBottom: "1px solid " + T.border }}>
                <span style={{ fontFamily: "'Newsreader', serif", fontSize: 22, fontWeight: 600 }}>{NAV.find((n) => n.id === view) ? NAV.find((n) => n.id === view).label : ""}</span>
                <Chip color={T.amber}>Portfolio demo · sample data</Chip>
              </div>
              {view === "home" && <AromaStrip active={activeProfile} onPick={pick} onInfo={openInfo} />}
              <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {view === "home" ? (
                  <div style={{ flex: 1, overflowY: "auto" }}><Home products={shownProducts} activeProfile={activeProfile} onInfo={openInfo} onOpen={openDetail} heroIndex={heroIndex} setHeroIndex={setHeroIndex} /></div>
                ) : CAT[view] ? (
                  <CategoryBrowse catId={view} products={shownProducts} activeProfile={activeProfile} onPick={pick} onInfo={openInfo} onOpen={openDetail} sortKey={sort.key} dir={sort.dir} onSort={doSort} />
                ) : view === "staff" ? (
                  <div style={{ flex: 1, overflowY: "auto" }}><StaffPicks products={shownProducts} onInfo={openInfo} onOpen={openDetail} /></div>
                ) : view === "flash" ? (
                  <div style={{ flex: 1, overflowY: "auto" }}><FlashSale products={shownProducts} elapsedSec={elapsedSec} onInfo={openInfo} onOpen={openDetail} /></div>
                ) : view === "learn" ? (
                  <div style={{ flex: 1, overflowY: "auto" }}><Learn onOpen={openInfo} /></div>
                ) : null}
              </div>
            </main>
          </div>
          <FlashTicker products={shownProducts} elapsedSec={elapsedSec} onGo={() => nav("flash")} />
          <ProductDetail p={detailLive} onClose={() => setDetail(null)} onInfo={openInfo} />
          <InfoSheet concept={info} onOpenConcept={openInfo} onClose={() => setInfo(null)} />
          {editorOpen && <DataEditor products={products} onClose={() => { setEditorOpen(false); resetIdle(); }} onReplaceAll={replaceAll} onUpsert={upsert} onDelete={del} />}
        </>
      )}
    </div>
  );
}

/* ------------------------------ css / motion ------------------------------ */
const CSS = `

* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
select, input, textarea { outline: none; }
select:focus, input:focus, textarea:focus { border-color: #6AAFA0; }
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb { background: #2a2824; border-radius: 4px; }
@keyframes bandDraw { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes attractRise { from { opacity: 0; transform: scaleY(0.2); } to { opacity: 1; transform: scaleY(1); } }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.fs-band-seg { animation: bandDraw 0.5s ease both; }
.fs-hero-body { animation: fadeUp 0.4s ease both; }
.fs-sheet { animation: sheetUp 0.28s cubic-bezier(0.16,1,0.3,1) both; }
.fs-detail { animation: slideLeft 0.3s cubic-bezier(0.16,1,0.3,1) both; }
.fs-attract-seg { animation: attractRise 0.5s ease both; transform-origin: bottom; }
.fs-pulse { animation: pulse 2.2s ease-in-out infinite; }
.fs-ticker { animation: ticker 26s linear infinite; }
.fs-card { transition: transform 0.14s ease, border-color 0.14s ease; }
.fs-card:hover { border-color: #3a382f; }
.fs-card:active { transform: scale(0.99); }
.fs-swatch:active { transform: translateY(-1px) scale(0.98); }
.fs-info:active { transform: scale(0.9); }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
`;
