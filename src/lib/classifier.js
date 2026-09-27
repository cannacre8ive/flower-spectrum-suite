import { PROFILES, PROFILE_MAP as PBK } from "../data/profiles.js";
const shortOf=k=>PBK[k]?.short||k;
export const ENGINE_TERPENES=[
  {key:"myrcene",profile:"earthy_dank",also:["gas_fuel","herbal_woody"],tier:"primary"},
  {key:"limonene",profile:"citrus_bright",also:["fruity_sweet","gas_fuel"],tier:"primary"},
  {key:"caryophyllene",profile:"spicy_warm",also:["gas_fuel"],potency:1.15,tier:"primary"},
  {key:"linalool",profile:"floral_soft",also:["dessert_creamy"],potency:1.2,tier:"primary"},
  {key:"pinene_a",profile:"piney_fresh",also:["herbal_woody"],tier:"primary"},
  {key:"pinene_b",profile:"piney_fresh",also:["herbal_woody"],tier:"primary"},
  {key:"terpinolene",profile:"fruity_sweet",also:["tropical_tangy","piney_fresh"],tier:"primary"},
  {key:"humulene",profile:"herbal_woody",also:["spicy_warm","earthy_dank","gas_fuel"],tier:"primary"},
  {key:"ocimene",profile:"tropical_tangy",also:["fruity_sweet","floral_soft"],tier:"primary"},
  {key:"bisabolol",profile:"floral_soft",also:["dessert_creamy"],potency:1.2,tier:"impact"},
  {key:"valencene",profile:"citrus_bright",also:["tropical_tangy"],potency:1.2,tier:"impact"},
  {key:"nerolidol",profile:"floral_soft",also:["herbal_woody"],potency:1.15,tier:"impact"},
  {key:"terpineol",profile:"floral_soft",also:["piney_fresh"],tier:"impact"},
  {key:"farnesene_b",profile:"fruity_sweet",also:["herbal_woody"],potency:0.3,tier:"impact"},
  {key:"farnesene_a",profile:"fruity_sweet",also:["herbal_woody"],potency:0.3,tier:"impact"},
  {key:"camphene",profile:"piney_fresh",also:["herbal_woody"],tier:"impact"},
  {key:"fenchol",profile:"herbal_woody",also:["piney_fresh"],tier:"impact"},
  {key:"geranyl_acetate",profile:"floral_soft",also:["fruity_sweet"],tier:"trace"},
  {key:"phytol",profile:"herbal_woody",tier:"trace"},
];
const TBK=Object.fromEntries(ENGINE_TERPENES.map(t=>[t.key,t]));
const POT_DEF={primary:1.0,impact:1.1,trace:0.7};
const potOf=t=>(t.potency!=null?t.potency:POT_DEF[t.tier]);
function contribOf(t){const c={};c[t.profile]=0.7;(t.also||[]).forEach((p,i)=>{c[p]=i===0?0.2:0.1;});const s=Object.values(c).reduce((a,b)=>a+b,0);Object.keys(c).forEach(k=>c[k]=c[k]/s);return c;}
export function classify(values){
  const scores={};PROFILES.forEach(p=>scores[p.key]=0);
  ENGINE_TERPENES.forEach(t=>{const v=values[t.key]||0;if(v<=0)return;const w=v*potOf(t),c=contribOf(t);Object.entries(c).forEach(([pk,ww])=>{scores[pk]+=w*ww;});});
  const car=(values.caryophyllene||0)*potOf(TBK.caryophyllene);
  const lim=(values.limonene||0)*potOf(TBK.limonene);
  const mus=(values.myrcene||0)*potOf(TBK.myrcene)+(values.humulene||0)*potOf(TBK.humulene);
  if(car>0&&lim>0&&mus>0){const mn=Math.min(car,lim,mus),mx=Math.max(car,lim,mus);scores.gas_fuel+=1.5*mn*Math.pow(mn/mx,1.5);}
  const total=Object.values(scores).reduce((a,b)=>a+b,0);
  if(total===0)return null;
  const ranked=PROFILES.map(p=>({...p,pct:Math.round((scores[p.key]/total)*100)})).sort((a,b)=>b.pct-a.pct);
  const gap=ranked[0].pct-ranked[1].pct;
  const confidence=gap>=22?"Defined":gap>=10?"Leaning":"Blend";
  const totalTerp=ENGINE_TERPENES.reduce((s,t)=>s+(values[t.key]||0),0);
  return {ranked,confidence,gap,totalTerp};
}
export function bandSegments(c){
  if(!c)return[];const r=c.ranked.filter(x=>x.pct>0);if(!r.length)return[];
  const lead=r[0].pct;const segs=r.filter(x=>x.pct>=lead*0.6).slice(0,3);
  const total=segs.reduce((a,s)=>a+s.pct,0)||1;
  return segs.map(s=>({key:s.key,color:s.color,label:s.label,short:s.short,frac:s.pct/total,pct:s.pct}));
}
export function blendName(c){const segs=bandSegments(c);if(segs.length<=1)return caps(shortOf(segs[0]?.key||c.ranked[0].key));return segs.slice(0,2).map(s=>caps(shortOf(s.key))).join("-");}
function caps(s){return s.charAt(0)+s.slice(1).toLowerCase();}

