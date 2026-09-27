import { PROFILE_MAP as PROFILES, PROFILE_ORDER } from "../data/profiles.js";
import { DEFAULT_PRODUCTS } from "../data/products.js";
const PROFILE_BY_LABEL = {};
PROFILE_ORDER.forEach((k) => { const p = PROFILES[k]; PROFILE_BY_LABEL[p.label.toLowerCase()] = k; PROFILE_BY_LABEL[p.short.toLowerCase()] = k; PROFILE_BY_LABEL[k.toLowerCase()] = k; });
function toProfileKey(s) { if (!s) return null; return PROFILE_BY_LABEL[String(s).trim().toLowerCase()] || null; }

/* Per-category behavior: does aroma lead, which sorts apply, tier ranks */
const CAT = {
  flower:       { label: "Flower",       aroma: true,      sorts: ["tier","price","thc","aroma","grower","name"] },
  prerolls:     { label: "Pre-Rolls",    aroma: true,      sorts: ["price","aroma","thc","name"] },
  vapes:        { label: "Vapes",        aroma: "partial", sorts: ["price","cart","thc","aroma","name"] },
  concentrates: { label: "Concentrates", aroma: true,      sorts: ["price","extract","thc","aroma","name"] },
  edibles:      { label: "Edibles",      aroma: false,     sorts: ["price","dose","infusion","name"] },
};
const SORT_LABEL = { tier:"Tier", price:"Price", thc:"THC%", aroma:"Aroma", grower:"Grower", name:"Name", cart:"Cart", extract:"Type", dose:"Dose", infusion:"Infusion" };
const TIER_RANK = { "Value":0, "Mid Shelf":1, "Top Shelf":2, "Cured Resin":1, "Live Resin":2, "Live Rosin":3 };

/* ------------------------------ seed data ------------------------------ */
/* aroma classifications REAL (§6); pricing/potency ILLUSTRATIVE; non-flower items illustrative products */
/* sale data lives ON products (salePct + saleEndsMin) — editor & CSV cover it */
function activeSales(products, elapsedSec) {
  return products.filter((p) => p.salePct != null && p.salePct > 0 && (p.saleEndsMin == null || p.saleEndsMin * 60 - elapsedSec > 0));
}
function salePrice(n, pct) { return n == null ? null : Math.round(n * (1 - pct / 100)); }

/* ------------------------------ helpers ------------------------------ */
function usd(n) { return n == null ? "—" : "$" + Math.round(n); }
function num(v) { if (v == null || v === "") return null; const n = parseFloat(String(v).replace(/[^0-9.\-]/g, "")); return isNaN(n) ? null : n; }
function truthy(v) { return /^(yes|true|1|y|x)$/i.test(String(v == null ? "" : v).trim()); }
function fmtCountdown(s) { const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60; const p = (x)=>String(x).padStart(2,"0"); return (h>0?p(h)+":":"")+p(m)+":"+p(sec); }

function getBand(p) {
  if (p.band?.length) return p.band;
  if (!p.primaryKey) return null;
  const pp = p.primaryPct != null && p.primaryPct !== "" ? Number(p.primaryPct) : null;
  const band = [{ key: p.primaryKey, pct: pp != null ? pp : 1 }];
  const sp = p.secondaryPct != null && p.secondaryPct !== "" ? Number(p.secondaryPct) : null;
  if (p.secondaryKey && sp != null && sp > 0 && pp != null && sp >= 0.6 * pp) band.push({ key: p.secondaryKey, pct: sp });
  return band;
}
function priceInfo(p) {
  if (p.category === "flower" && p.priceEighth != null) return { big: p.priceEighth, unit: "/8th", sub: p.priceGram != null ? "$" + p.priceGram + "/g" : null };
  if (p.category === "edible") return { big: p.pricePack, unit: "/pack", sub: null };
  if (p.category === "concentrate") return { big: p.priceGram, unit: "/g", sub: null };
  if (p.category === "vape" || p.category === "preroll") return { big: p.priceEach, unit: "/ea", sub: null };
  if (p.priceEighth != null) return { big: p.priceEighth, unit: "/8th", sub: null };
  return { big: p.priceGram != null ? p.priceGram : p.priceEach != null ? p.priceEach : p.pricePack, unit: "", sub: null };
}
function sortValue(p, key) {
  switch (key) {
    case "tier": return TIER_RANK[p.tier] != null ? TIER_RANK[p.tier] : -1;
    case "price": { const pi = priceInfo(p); return pi.big != null ? pi.big : 1e9; }
    case "thc": return p.thc != null ? p.thc : -1;
    case "aroma": return p.primaryKey ? PROFILE_ORDER.indexOf(p.primaryKey) : 99;
    case "grower": return (p.grower || "").toLowerCase();
    case "name": return (p.name || "").toLowerCase();
    case "cart": return (p.cartType || "").toLowerCase();
    case "extract": return (p.extractionType || "").toLowerCase();
    case "dose": return p.dosePerPiece != null ? p.dosePerPiece : -1;
    case "infusion": return (p.infusion || "").toLowerCase();
    default: return 0;
  }
}
function sortProducts(list, key, dir) {
  const s = [...list].sort((a, b) => {
    const va = sortValue(a, key), vb = sortValue(b, key);
    if (va < vb) return -1; if (va > vb) return 1; return (a.name||"").localeCompare(b.name||"");
  });
  return dir === "desc" ? s.reverse() : s;
}

/* ------------------------------ CSV utils ------------------------------ */
function csvCell(v) { v = v == null ? "" : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
function csvSerialize(headers, rowObjs) {
  const lines = [headers.map(csvCell).join(",")];
  for (const r of rowObjs) lines.push(headers.map((h) => csvCell(r[h])).join(","));
  return lines.join("\n");
}
function csvParse(text) {
  const rows = []; let row = [], field = "", q = false;
  text = String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else {
      if (c === '"') q = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else field += c;
    }
  }
  if (q) throw new Error("Unclosed quoted field in CSV.");
  row.push(field); rows.push(row);
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

const CSV_MASTER = ["ManualTotalTerp", "ArchivedValues", "Values", "Tags", "PrintPrice", "GrowMethod", "ClassificationSource", "ID", "Illustrative", "Flavor", "SourceID", "Band",
  "Category","Name","Grower","Lineage","Featured","Hero","StaffPick","PickedBy","PickNote","Tier","Notes",
  "THC%","PrimaryProfile","Primary%","SecondaryProfile","Secondary%","Blend","Confidence",
  "Price1/8","Price1g","PriceEach","PricePack",
  "DosePerPiece","Pieces","Infusion","Ratio","Onset","Diet",
  "ExtractionType","CartType","Hardware","Infused","InfusedWith","Size","Count","SalePct","SaleEndsMin","Blurb",
];
const TEMPLATE_COLS = {
  flower:       ["Category","Name","Grower","Lineage","Tier","Featured","StaffPick","PickedBy","PickNote","THC%","PrimaryProfile","Primary%","SecondaryProfile","Secondary%","Blend","Confidence","Price1/8","Price1g","SalePct","SaleEndsMin","Blurb"],
  prerolls:     ["Category","Name","Grower","Infused","InfusedWith","Size","Count","THC%","PrimaryProfile","Primary%","SecondaryProfile","Secondary%","Blend","Confidence","PriceEach","SalePct","SaleEndsMin","Blurb"],
  vapes:        ["Category","Name","Grower","CartType","Hardware","THC%","PrimaryProfile","Primary%","Blend","Confidence","PriceEach","SalePct","SaleEndsMin","Blurb"],
  concentrates: ["Category","Name","Grower","ExtractionType","Tier","THC%","PrimaryProfile","Primary%","SecondaryProfile","Secondary%","Blend","Confidence","Price1g","SalePct","SaleEndsMin","Blurb"],
  edibles:      ["Category","Name","Grower","DosePerPiece","Pieces","Infusion","Ratio","Onset","Diet","PricePack","SalePct","SaleEndsMin","Blurb"],
};
const CAT_CSV = { flower:"flower", prerolls:"preroll", vapes:"vape", concentrates:"concentrate", edibles:"edible" };

function productToRow(p) {
  return {
    ManualTotalTerp:p.manualTotalTerp||0,ArchivedValues:JSON.stringify(p.archivedValues||{}),Values:JSON.stringify(p.values||{}),Tags:JSON.stringify(p.tags||[]),PrintPrice:JSON.stringify(p.printPrice||{}),GrowMethod:p.growMethod||"",ClassificationSource:p.classificationSource||"",ID:p.id, Illustrative:p.illustrative?"yes":"", Flavor:p.flavor||"", SourceID:p.sourceId||"", Band:JSON.stringify(p.band||[]),
    Category: p.category, Name: p.name, Grower: p.grower, Lineage: p.lineage, Tier: p.tier,
    Featured: p.featured ? "yes" : "", Hero: p.hero ? "yes" : "", StaffPick: p.staffPick ? "yes" : "", PickedBy: p.pickedBy, PickNote: p.pickNote,
    Notes: p.notes, "THC%": p.thc,
    PrimaryProfile: p.primaryKey ? PROFILES[p.primaryKey].label : "", "Primary%": p.primaryPct,
    SecondaryProfile: p.secondaryKey ? PROFILES[p.secondaryKey].label : "", "Secondary%": p.secondaryPct,
    Blend: p.blend, Confidence: p.confidence,
    "Price1/8": p.priceEighth, Price1g: p.priceGram, PriceEach: p.priceEach, PricePack: p.pricePack,
    DosePerPiece: p.dosePerPiece, Pieces: p.pieces, Infusion: p.infusion, Ratio: p.ratio, Onset: p.onset, Diet: p.diet,
    ExtractionType: p.extractionType, CartType: p.cartType, Hardware: p.hardware,
    Infused: p.infused ? "yes" : "", InfusedWith: p.infusedWith, Size: p.size, Count: p.count,
    SalePct: p.salePct, SaleEndsMin: p.saleEndsMin, Blurb: p.blurb,
  };
}
function rowToProduct(obj, i) {
  const catRaw = (obj.Category || "").trim().toLowerCase();
  const catMap = { flower:"flower", preroll:"preroll", "pre-roll":"preroll", prerolls:"preroll", vape:"vape", vapes:"vape", concentrate:"concentrate", concentrates:"concentrate", edible:"edible", edibles:"edible" };
  const category = catMap[catRaw] || null;
  return {
    _rowError: category ? null : "Unknown category: '" + (obj.Category || "") + "'",
    id: obj.ID || "imp_" + i + "_" + Math.random().toString(36).slice(2, 7),
    illustrative: truthy(obj.Illustrative), flavor: obj.Flavor || "", sourceId: obj.SourceID || null,
    band: parseBand(obj.Band),manualTotalTerp:num(obj.ManualTotalTerp)||0,archivedValues:JSON.parse(obj.ArchivedValues||"{}"),values:JSON.parse(obj.Values||"{}"),tags:JSON.parse(obj.Tags||"[]"),printPrice:JSON.parse(obj.PrintPrice||"{}"),growMethod:obj.GrowMethod||"",classificationSource:obj.ClassificationSource||"",
    category, name: obj.Name || "(unnamed)", grower: obj.Grower || "", lineage: obj.Lineage || "—", tier: obj.Tier || "",
    featured: truthy(obj.Featured), hero: truthy(obj.Hero), staffPick: truthy(obj.StaffPick), pickedBy: obj.PickedBy || "", pickNote: obj.PickNote || "", notes: obj.Notes || "",
    thc: num(obj["THC%"]),
    primaryKey: toProfileKey(obj.PrimaryProfile), primaryPct: num(obj["Primary%"]),
    secondaryKey: toProfileKey(obj.SecondaryProfile), secondaryPct: num(obj["Secondary%"]),
    blend: obj.Blend || "", confidence: obj.Confidence || "",
    priceEighth: num(obj["Price1/8"]), priceGram: num(obj.Price1g), priceEach: num(obj.PriceEach), pricePack: num(obj.PricePack),
    dosePerPiece: num(obj.DosePerPiece), pieces: num(obj.Pieces), infusion: obj.Infusion || "", ratio: obj.Ratio || "", onset: obj.Onset || "", diet: obj.Diet || "",
    extractionType: obj.ExtractionType || "", cartType: obj.CartType || "", hardware: obj.Hardware || "",
    infused: truthy(obj.Infused), infusedWith: obj.InfusedWith || "", size: obj.Size || "", count: num(obj.Count),
    salePct: num(obj.SalePct), saleEndsMin: num(obj.SaleEndsMin),
    blurb: obj.Blurb || "",
  };
}
function parseBand(value) { try { const a=JSON.parse(value || "[]"); return Array.isArray(a)?a.filter(x=>PROFILES[x.key] && Number.isFinite(x.pct) && x.pct>=0):[]; } catch { return []; } }
function parseCsvToProducts(text) {
  let rows; try { rows = csvParse(text); } catch(e) { return {products:[],errors:[e.message],headers:[]}; }
  if (rows.length < 2) return { products: [], errors: ["No data rows found."], headers: [] };
  const headers = rows[0].map((h) => h.trim());
  const out = [], errors = [];
  if (!headers.includes("Name") || !headers.includes("Category")) return {products:[],errors:["Required headers: Name and Category."],headers};
  for (let r = 1; r < rows.length; r++) {
    const obj = {}; headers.forEach((h, c) => { obj[h] = (rows[r][c] || "").trim(); });
    if (Object.values(obj).every((v) => v === "")) continue;
    let p;
    try {
      for(const key of ['Values','ArchivedValues','PrintPrice','Tags']) {const v=JSON.parse(obj[key]||(key==='Tags'?'[]':'{}'));if(key==='Tags'? !Array.isArray(v)||v.some(x=>typeof x!=='string') : !v||Array.isArray(v)||typeof v!=='object'||Object.values(v).some(x=>x!==null&&(typeof x!=='number'||!Number.isFinite(x)||x<0||key==='Values'&&x>100)))throw new Error('Invalid '+key+' JSON');}
      p = rowToProduct(obj,r);
    } catch(e) {errors.push('Row '+(r+1)+': '+e.message);continue;}
    if (rows[r].length !== headers.length) p._rowError = "Column count does not match headers.";
    if ((obj.PrimaryProfile && !p.primaryKey) || (obj.SecondaryProfile && !p.secondaryKey)) p._rowError = "Unknown aroma profile.";
    const numeric=["THC%","Primary%","Secondary%","Price1/8","Price1g","PriceEach","PricePack","DosePerPiece","Pieces","Count","SalePct","SaleEndsMin"];
    for(const key of numeric) if(obj[key] && !/^[$]?\d+(?:\.\d+)?%?$/.test(obj[key])) p._rowError="Invalid number in "+key;
    if (!obj.Name?.trim()) p._rowError = "Product name is required.";
    for (const [key,val] of Object.entries(p)) if (typeof val === "number" && val < 0) p._rowError = "Negative value in " + key;
    if (Object.values(p.values).reduce((a,b)=>a+(b||0),0)>100) p._rowError = "Total terpene concentration cannot exceed 100%.";
    if (p.salePct > 100 || p.thc > 100 || p.primaryPct > 100 || p.secondaryPct > 100) p._rowError = "Percentages cannot exceed 100.";
    if (out.some(x=>x.id===p.id)) p._rowError = "Duplicate product ID.";
    if (p._rowError) errors.push("Row " + r + ": " + p._rowError);
    out.push(p);
  }
  return { products: out, errors, headers };
}
function dataUri(csv) { return "data:text/csv;charset=utf-8," + encodeURIComponent(csv); }
function templateCsv(catId) {
  const cols = TEMPLATE_COLS[catId];
  const cat = CAT_CSV[catId];
  const samples = DEFAULT_PRODUCTS.filter((p) => p.category === cat).slice(0, 2).map((p) => {
    const row = productToRow(p); row.Name = "SAMPLE — " + row.Name; return row;
  });
  return csvSerialize(cols, samples);
}


export { CAT, SORT_LABEL, TIER_RANK, activeSales, salePrice, usd, num, truthy, fmtCountdown, getBand, priceInfo, sortValue, sortProducts, csvCell, csvSerialize, csvParse, CSV_MASTER, TEMPLATE_COLS, CAT_CSV, productToRow, rowToProduct, parseBand, parseCsvToProducts, dataUri, templateCsv };
