import { STRAINS } from "./strains.js";
import { bandSegments } from "../lib/classifier.js";
const ORIGINAL_PRODUCTS = [
  // --- Flower (real classifications) ---
  { id:"pma", category:"flower", name:"Positive Mental Attitude", grower:"Ideal Cannabis", lineage:"—",
    primaryKey:"fruity_sweet", primaryPct:35, secondaryKey:null, secondaryPct:null, blend:"Fruity / Sweet", confidence:"Defined",
    thc:24, priceEighth:42, priceGram:14, tier:"Top Shelf", featured:true, hero:true, staffPick:true, pickedBy:"Renata", pickNote:"The cleanest terpinolene nose on the shelf.",
    blurb:"Terpinolene-forward and haze-bright — ripe tropical fruit over sweet citrus peel. The strain that defines the Fruity end of the spectrum." },
  { id:"gg4", category:"flower", name:"Gorilla Glue #4", grower:"Ideal Cannabis", lineage:"Chem's Sister × Sour Dubb × Chocolate Diesel",
    primaryKey:"spicy_warm", primaryPct:19, secondaryKey:"gas_fuel", secondaryPct:17, blend:"Spicy–Gas", confidence:"Blend",
    thc:22, priceEighth:38, priceGram:13, tier:"Top Shelf", featured:true, hero:true,
    blurb:"Cracked black pepper and clove up front, a loud diesel undertone right behind. Spicy leads, Gas answers — a peppery classic." },
  { id:"dsd", category:"flower", name:"Do-Si-Dos", grower:"Ideal Cannabis", lineage:"OGKB × Face Off OG",
    primaryKey:"spicy_warm", primaryPct:34, secondaryKey:"floral_soft", secondaryPct:16, blend:"Spicy / Warm", confidence:"Leaning",
    thc:27, priceEighth:35, priceGram:12, tier:"Top Shelf", featured:true, hero:true, staffPick:true, pickedBy:"Marcus", pickNote:"Warm and rounded — my everyday recommend.",
    blurb:"Warm spice and pepper rounded by a soft floral lift. Classic, full, and comforting on the nose." },
  { id:"layer", category:"flower", name:"Layer Cake", grower:"Ideal Cannabis", lineage:"Wedding Cake × GMO",
    primaryKey:"citrus_bright", primaryPct:24, secondaryKey:"gas_fuel", secondaryPct:13, blend:"Citrus–Gas", confidence:"Leaning",
    thc:26, priceEighth:40, priceGram:14, tier:"Top Shelf", featured:true,
    blurb:"Bright lemon lift over a soft gassy base. Zesty and clean with just enough weight to ground it." },
  { id:"meat", category:"flower", name:"Meat Stomper", grower:"Ideal Cannabis", lineage:"Chimera × Guzzlers",
    primaryKey:"earthy_dank", primaryPct:29, secondaryKey:"gas_fuel", secondaryPct:13, blend:"Earthy / Dank", confidence:"Leaning",
    thc:25, priceEighth:32, priceGram:11, tier:"Mid Shelf", featured:true, salePct:20, saleEndsMin:45,
    blurb:"Deep soil and musk with a savory funk — the dank, weighty end of the spectrum. Gas sits underneath." },
  { id:"cascade", category:"flower", name:"Cascade Orange", grower:"Ideal Cannabis", lineage:"—",
    primaryKey:"fruity_sweet", primaryPct:null, secondaryKey:null, secondaryPct:null, blend:"Fruity / Sweet", confidence:"Leaning",
    thc:21, priceEighth:28, priceGram:10, tier:"Value", featured:true,
    blurb:"Sweet stone-fruit with a citrus top note. Juicy, approachable, and easy to like." },
  { id:"mthood", category:"flower", name:"Mt. Hood Magic", grower:"Ideal Cannabis", lineage:"—",
    primaryKey:"fruity_sweet", primaryPct:null, secondaryKey:"tropical_tangy", secondaryPct:null, blend:"Fruity / Sweet", confidence:"Leaning",
    thc:23, priceEighth:30, priceGram:11, tier:"Mid Shelf",
    blurb:"Ripe fruit with a tropical secondary lift — mango and sweet citrus rounding it out." },

  // --- Concentrates (illustrative) ---
  { id:"sourd_lr", category:"concentrate", name:"Sour Diesel · Live Resin", grower:"Illustrative", lineage:"—",
    primaryKey:"gas_fuel", primaryPct:30, secondaryKey:null, secondaryPct:null, blend:"Gas / Fuel", confidence:"Leaning",
    thc:78, priceGram:34, tier:"Live Resin", extractionType:"Live Resin", illustrative:true, featured:true,
    blurb:"Full-spectrum live resin — pungent diesel and citrus funk preserved from fresh-frozen flower." },
  { id:"gmo_cr", category:"concentrate", name:"GMO · Cured Resin", grower:"Illustrative", lineage:"—",
    primaryKey:"earthy_dank", primaryPct:26, secondaryKey:"gas_fuel", secondaryPct:16, blend:"Earthy–Gas", confidence:"Leaning",
    thc:74, priceGram:28, tier:"Cured Resin", extractionType:"Cured Resin", illustrative:true,
    blurb:"Savory garlic-and-funk with a heavy gassy backbone. Batter-textured cured resin." },
  { id:"wed_rosin", category:"concentrate", name:"Wedding Cake · Live Rosin", grower:"Illustrative", lineage:"—",
    primaryKey:"dessert_creamy", primaryPct:null, secondaryKey:null, secondaryPct:null, blend:"Dessert / Creamy", confidence:"Leaning",
    thc:71, priceGram:48, tier:"Live Rosin", extractionType:"Live Rosin", illustrative:true,
    blurb:"Solventless live rosin — sweet cake batter and vanilla. The premium, hydrocarbon-free pick." },

  // --- Vapes (illustrative) ---
  { id:"sourd_vape", category:"vape", name:"Sour Diesel · Live Resin Cart", grower:"Illustrative", lineage:"—",
    primaryKey:"gas_fuel", primaryPct:28, secondaryKey:null, secondaryPct:null, blend:"Gas / Fuel", confidence:"Leaning",
    thc:82, priceEach:40, cartType:"Live Resin", hardware:"510", illustrative:true,
    blurb:"Full-spectrum live resin cart — the strain's true diesel aroma carried over intact." },
  { id:"blue_distill", category:"vape", name:"Blueberry · Distillate Cart", grower:"Illustrative", lineage:"—",
    primaryKey:null, primaryPct:null, secondaryKey:null, secondaryPct:null, blend:null, confidence:null,
    thc:88, priceEach:30, cartType:"Distillate", hardware:"AIO", flavor:"Blueberry (botanical terpenes)", illustrative:true,
    blurb:"High-potency distillate with a botanical blueberry flavor. Aroma is added, not strain-derived — so no spectrum classification." },

  // --- Edibles (illustrative) ---
  { id:"gummy", category:"edible", name:"Wildberry Gummies", grower:"Illustrative", lineage:"—",
    dosePerPiece:5, pieces:20, infusion:"Distillate", ratio:"THC only", onset:"45–90 min", diet:"Vegan", pricePack:18, illustrative:true, featured:true, salePct:15, saleEndsMin:120,
    blurb:"Five milligrams per piece, made with distillate — fast, clean, and consistent with no cannabis flavor." },
  { id:"choc_rosin", category:"edible", name:"Dark Chocolate Squares", grower:"Illustrative", lineage:"—",
    dosePerPiece:10, pieces:10, infusion:"Live Rosin", ratio:"THC only", onset:"60–120 min", diet:"Contains dairy", pricePack:26, illustrative:true,
    blurb:"Solventless live-rosin chocolate — full-spectrum flavor with the character of the flower it came from." },
  { id:"rso_cap", category:"edible", name:"RSO Softgels", grower:"Illustrative", lineage:"—",
    dosePerPiece:25, pieces:10, infusion:"RSO", ratio:"1:1 THC:CBD", onset:"60–120 min", diet:"Vegan", pricePack:34, illustrative:true,
    blurb:"Whole-plant RSO in a balanced 1:1 softgel. Higher dose, longer onset — read the label." },

  // --- Pre-Rolls ---
  { id:"pma_pr", category:"preroll", name:"Positive Mental Attitude · Pre-Roll", grower:"Ideal Cannabis", lineage:"—",
    primaryKey:"fruity_sweet", primaryPct:35, secondaryKey:null, secondaryPct:null, blend:"Fruity / Sweet", confidence:"Defined",
    thc:24, priceEach:12, infused:false, size:"1g", count:1,
    blurb:"A single gram of the same haze-bright PMA flower, rolled and ready." },
  { id:"diamond_pr", category:"preroll", name:"Gas Diamond Infused Pre-Roll", grower:"Illustrative", lineage:"—",
    primaryKey:"gas_fuel", primaryPct:30, secondaryKey:null, secondaryPct:null, blend:"Gas / Fuel", confidence:"Leaning",
    thc:41, priceEach:18, infused:true, infusedWith:"Live Resin Diamonds", size:"1g", count:1, illustrative:true,
    blurb:"Flower coated and cored with live-resin diamonds — much higher potency, gassy nose." },
];


export const DEFAULT_PRODUCTS = [...STRAINS.map(s=>{const band=bandSegments(s.c);return {id:s.id,category:"flower",name:s.name,grower:"Ideal Cannabis",lineage:s.cross,primaryKey:band[0].key,primaryPct:band[0].pct,secondaryKey:band[1]?.key||null,secondaryPct:band[1]?.pct||null,band:band.map(x=>({key:x.key,pct:x.pct})),blend:s.blend,confidence:s.c.confidence,thc:Number(s.thc),tier:"COA example",featured:true,hero:true,blurb:s.aroma,sourceId:s.id,notes:"Historical 2023 example transcribed in supplied source. Original lab PDFs not included. No current availability or price."}}),...ORIGINAL_PRODUCTS];
