export const MODIFIERS = [
  { key:"clean_fresh", label:"Clean / Fresh", color:"#88A9B2", desc:"Cooling eucalyptus / mentholated lift" },
];
export const MOD_BY_KEY = Object.fromEntries(MODIFIERS.map(m => [m.key, m]));

/* ── TERPENE DATABASE ──
   tier: primary | impact | trace
   profile: primary profile association · also[]: secondary associations
   potency: aromatic weight per unit % (defaults applied by tier if omitted)
   modifier: optional modifier key
*/
export const TERPENES = [
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
export const TERP_BY_KEY = Object.fromEntries(TERPENES.map(t => [t.key, t]));
export const TIER_RANK = { primary:0, impact:1, trace:2 };
export const POTENCY_DEFAULT = { primary:1.0, impact:1.1, trace:0.7 };
export const potencyOf = t => (t.potency != null ? t.potency : POTENCY_DEFAULT[t.tier]);

// ── PROFILE CONTRIBUTION (auto-derived from profile + also[]) ──
export function contribOf(t) {
  const c = {};
  c[t.profile] = 0.7;
  (t.also || []).forEach((p, i) => { c[p] = i === 0 ? 0.2 : 0.1; });
  const s = Object.values(c).reduce((a, b) => a + b, 0);
  Object.keys(c).forEach(k => c[k] = c[k] / s);
  return c;
}

