import { PROFILES } from '../data/profiles.js';
import { STRAINS } from '../data/strains.js';
import { classify, bandSegments, blendName } from './classifier.js';
export function productValues(p) { return p.values ?? STRAINS.find(s=>s.id===p.sourceId)?.values ?? {}; }
export function productClassification(p) {
 const c=classify(productValues(p)); if(c)return c;
 if(!p.primaryKey)return null;
 const amounts = p.band?.length ? p.band : [{key:p.primaryKey,pct:p.primaryPct??1},...(p.secondaryKey&&p.secondaryPct>0?[{key:p.secondaryKey,pct:p.secondaryPct}]:[])];
 const ranked=PROFILES.map(x=>({...x,pct:amounts.find(a=>a.key===x.key)?.pct||0})).sort((a,b)=>b.pct-a.pct);
 return {ranked,confidence:p.confidence||'Manual',totalTerp:p.manualTotalTerp||0,totalRaw:0,source:'manual',modifiers:[]};
}
export function withClassification(p) {
 const c=classify(productValues(p)); if(!c)return p;
 const band=bandSegments(c);
 return {...p,values:productValues(p),primaryKey:band[0].key,primaryPct:band[0].pct,secondaryKey:band[1]?.key||null,secondaryPct:band[1]?.pct??null,band:band.map(x=>({key:x.key,pct:x.pct})),blend:blendName(c),confidence:c.confidence};
}
export function productToPrint(p) {
 const tags=Array.isArray(p.tags)?p.tags:[p.infusion,p.extractionType,p.cartType,p.diet,p.ratio].filter(Boolean).flatMap(t=>{const s=t.toLowerCase();return [s.includes('rosin')?'solventless':null,s.includes('live rosin')?'live_rosin':s.includes('live resin')?'live_resin':s.includes('distillate')?'distillate':null,s.includes('vegan')?'vegan':null,s.includes('1:1')?'ratio_1_1':null].filter(Boolean)});
 return {...p,catalogTier:p.tier,values:productValues(p),classification:productClassification(p),aroma:p.blurb||'',tier:({'Top Shelf':'top','Mid Shelf':'mid','Value':'value'})[p.tier]||p.printTier||'top',thc:p.category==='edible'?p.dosePerPiece??null:p.thc,price:{...(p.printPrice||{}),eighth:p.priceEighth??null,g:p.priceGram??null,each:p.priceEach??null,full:p.priceEach??null,pack:p.pricePack??null},dealPct:p.salePct??'',staffPick:p.staffPick?{by:p.pickedBy||'',quote:p.pickNote||''}:null,manual:p.primaryKey?{primary:p.primaryKey,secondary:p.secondaryKey,confidence:p.confidence,totalTerp:p.manualTotalTerp||0}:null,tags,real:false};
}
export function printToProduct(row, original={}) {
 const p={...original,id:row.id,category:row.category,name:row.name,grower:row.grower,lineage:row.lineage,blurb:row.aroma,notes:row.notes,growMethod:row.growMethod,manualTotalTerp:row.manual?.totalTerp||0,values:row.values||{},printTier:row.tier,tier:original.id&&row.tier===productToPrint(original).tier?(original.catalogTier??original.tier):({top:'Top Shelf',mid:'Mid Shelf',value:'Value'})[row.tier]||row.tier,tags:row.tags||[],printPrice:row.price,priceEighth:row.price?.eighth??null,priceGram:row.price?.g??null,priceEach:(row.category==='vape'?row.price?.full:row.price?.each)??null,pricePack:row.price?.pack??null,salePct:row.dealPct===''?null:Number(row.dealPct),staffPick:!!row.staffPick,pickedBy:row.staffPick?.by||'',pickNote:row.staffPick?.quote||'',...(row.category==='edible'?{dosePerPiece:row.thc}:{thc:row.thc})};
 if(!classify(p.values)) {p.primaryKey=row.manual?.primary||null;p.secondaryKey=row.manual?.secondary||null;p.confidence=row.manual?.confidence||null;if(p.primaryKey!==original.primaryKey||p.secondaryKey!==original.secondaryKey){p.band=[];p.primaryPct=null;p.secondaryPct=null;p.blend=p.primaryKey?PROFILES.find(x=>x.key===p.primaryKey)?.label:''}}
 return withClassification(p);
}
