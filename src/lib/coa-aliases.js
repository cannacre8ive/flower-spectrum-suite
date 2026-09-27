// Explicit aliases adapted from the source-preserving FS COA Classifier v1.1.
import {TERPENES} from '../data/engine-terpenes.js';
function canon(s){
  return (s||"").toString().toLowerCase()
    .replace(/\u03b1/g,"alpha").replace(/\u03b2/g,"beta")
    .replace(/\u03b3/g,"gamma").replace(/\u03b4/g,"delta").replace(/\u0394/g,"delta")
    .replace(/\u03c1/g,"rho")
    .replace(/[^a-z0-9]/g,"");
}

// key -> list of human aliases (canon() is applied at build time)
const ALIASES = [
  ["myrcene",            ["myrcene","\u03b2-myrcene","beta-myrcene"]],
  ["limonene",           ["limonene","d-limonene","\u03b4-limonene","dl-limonene","(d)-limonene","r-limonene","(r)-(+)-limonene"]],
  ["caryophyllene",      ["caryophyllene","\u03b2-caryophyllene","beta-caryophyllene","trans-caryophyllene","(e)-caryophyllene","trans-\u03b2-caryophyllene","b-caryophyllene","beta caryophyllene"]],
  ["linalool",           ["linalool","linalol","\u03b2-linalool"]],
  ["pinene_a",           ["\u03b1-pinene","alpha-pinene","a-pinene","(+)-\u03b1-pinene","(1r)-(+)-\u03b1-pinene","alpha pinene"]],
  ["pinene_b",           ["\u03b2-pinene","beta-pinene","b-pinene","(-)-\u03b2-pinene","beta pinene"]],
  ["terpinolene",        ["terpinolene"]],
  ["humulene",           ["\u03b1-humulene","alpha-humulene","humulene","\u03b1-caryophyllene","alpha-caryophyllene","alpha humulene"]],
  ["ocimene",            ["\u03b2-ocimene","beta-ocimene","ocimene","(e)-ocimene","(z)-ocimene","cis-ocimene","trans-ocimene","ocimene 1","ocimene 2","ocimene-1","ocimene-2","(e)-\u03b2-ocimene","beta-ocimene 1","beta-ocimene 2"]],
  ["bisabolol",          ["\u03b1-bisabolol","alpha-bisabolol","bisabolol","(-)-\u03b1-bisabolol","levomenol","alpha bisabolol"]],
  ["valencene",          ["valencene","(+)-valencene"]],
  ["nerolidol",          ["trans-nerolidol","nerolidol","cis-nerolidol","(e)-nerolidol","(z)-nerolidol","nerolidol 1","nerolidol 2","nerolidol-1","nerolidol-2","trans-\u03b2-nerolidol"]],
  ["guaiol",             ["guaiol"]],
  ["terpineol",          ["\u03b1-terpineol","alpha-terpineol","terpineol","alpha terpineol"]],
  ["caryophyllene_oxide",["caryophyllene oxide","caryophyllene-oxide","\u03b2-caryophyllene oxide","caryophylleneoxide"]],
  ["farnesene_b",        ["\u03b2-farnesene","beta-farnesene","(e)-\u03b2-farnesene","trans-\u03b2-farnesene","cis-\u03b2-farnesene"]],
  ["farnesene_a",        ["\u03b1-farnesene","alpha-farnesene","farnesene","(e,e)-\u03b1-farnesene"]],
  ["camphene",           ["camphene"]],
  ["carene",             ["\u03b4-3-carene","delta-3-carene","3-carene","carene","\u03b4-carene","d-3-carene","(+)-3-carene","delta3carene"]],
  ["geraniol",           ["geraniol"]],
  ["fenchol",            ["fenchol","fenchyl alcohol","endo-fenchyl alcohol","(-)-fenchol","endo-fenchol","(+)-fenchol","fenchyl-alcohol"]],
  ["borneol",            ["borneol","(-)-borneol","(+)-borneol","l-borneol"]],
  ["sabinene",           ["sabinene"]],
  ["pcymene",            ["p-cymene","para-cymene","cymene","\u03c1-cymene","4-cymene","p cymene"]],
  ["eucalyptol",         ["eucalyptol","1,8-cineole","cineole","1,8-cineol","eucalyptol (1,8-cineole)","1 8-cineole"]],
  ["citronellol",        ["citronellol","\u03b2-citronellol"]],
  ["nerol",              ["nerol"]],
  ["isopulegol",         ["isopulegol"]],
  ["pulegone",           ["pulegone","(r)-(+)-pulegone"]],
  ["menthol",            ["menthol","l-menthol","(-)-menthol"]],
  ["cedrene",            ["\u03b1-cedrene","alpha-cedrene","cedrene"]],
  ["bergamotene",        ["\u03b1-bergamotene","alpha-bergamotene","bergamotene","trans-\u03b1-bergamotene","(e)-\u03b1-bergamotene"]],
  ["gterpinene",         ["\u03b3-terpinene","gamma-terpinene","g-terpinene","gamma terpinene"]],
  ["sabinene_hydrate",   ["sabinene hydrate","cis-sabinene hydrate","trans-sabinene hydrate","sabinene-hydrate"]],
  ["phytol",             ["phytol"]],
  ["phellandrene",       ["\u03b1-phellandrene","alpha-phellandrene","phellandrene"]],
  ["aterpinene",         ["\u03b1-terpinene","alpha-terpinene","alpha terpinene"]],
  ["geranyl_acetate",    ["geranyl acetate","geranyl-acetate","geranylacetate"]],
];
const LOOKUP = {};
ALIASES.forEach(([key, list]) => { list.forEach(a => { LOOKUP[canon(a)] = key; }); });
// also map each engine label/key itself
TERPENES.forEach(t => { LOOKUP[canon(t.label)] = t.key; LOOKUP[canon(t.key)] = t.key; });

// Names too ambiguous to auto-assign — surfaced with guidance instead of guessed.
const AMBIGUOUS = {
  [canon("terpinene")]:  "ambiguous \u2014 specify \u03b1-terpinene or \u03b3-terpinene",
  [canon("pinene")]:     "ambiguous \u2014 specify \u03b1-pinene or \u03b2-pinene",
  [canon("nerolidol total")]: "isomer total \u2014 list individual nerolidol peaks if possible",
};

// cannabinoids / non-terpene rows to skip (and best-effort THC capture)
function cannabinoidKind(cn){
  if(/^totalthc$/.test(cn)) return "total_thc";
  if(/^(delta9thc|d9thc|thc)$/.test(cn)) return "thc";
  if(/^thca$/.test(cn)) return "thca";
  if(/^cbda$/.test(cn)) return "cbda";
  if(/^(cbd|totalcbd)$/.test(cn)) return "cbd";
  if(/^(totalcannabinoids|cannabinoidtotal)$/.test(cn)) return "total_cannabinoids";
  if(/(thcv|cbga?$|cbn$|cbc$|cbdv|delta8thc|d8thc|cannabinoids)/.test(cn)) return "other_cannabinoid";
  return null;
}


export {canon, LOOKUP, AMBIGUOUS, cannabinoidKind};
