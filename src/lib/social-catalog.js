import {STRAINS as HISTORICAL} from '../data/strains.js';
import {withClassification} from './product-model.js';
import {TERPENES} from '../data/engine-terpenes.js';
import {classify,blendName,bandSegments} from './classifier.js';
const num=v=>v!=null&&v!==''&&Number.isFinite(Number(v))?Number(v).toFixed(2):'—';
export function socialStrains(products=[]){
 const additions=products.map(withClassification).filter(p=>p.category==='flower'&&(!p.sourceId||p.provenance||p.classificationSource)).flatMap(p=>{
  const c=classify(p.values||{});if(!c)return [];const b=bandSegments(c),source=p.provenance?.reviewedAt?p.provenance:null;
  const panel=source?source.sourceRows.filter(r=>r.included&&Number(r.value)>=0).map(r=>[r.raw,Number(r.value)]):Object.entries(p.values).filter(([,v])=>Number(v)>0).map(([k,v])=>[TERPENES.find(t=>t.key===k)?.label||k,Number(v)]);
  return [{id:p.id,name:p.name,c,values:p.values,blend:blendName(c),cross:p.lineage||'Flower · '+(source?'reviewed report':'manually entered panel'),lot:source?.batch||'Not provided',sample:source?.fileName||'Manual panel',harvest:'Date not provided',thc:num(p.thc),cbd:'—',cann:'—',terps:num(source?.reportedTotal??c.totalTerp),farm:p.grower,photo:/^data:image\/(jpeg|png|webp);base64,/.test(p.photo||'')?p.photo:'',aroma:p.blurb||b.map(x=>x.label).join(' · '),top:'Sensory notes not supplied',mid:'Sensory notes not supplied',base:'Sensory notes not supplied',tags:b.map(x=>[x.key,x.label]),copy:[source?`Reviewed ${source.method} import. ${(source.modeledCoverage*100).toFixed(1)}% of the included terpene mass is represented by the model.`:'Manually entered terpene panel. Check it against the original report before sharing.','Relative aroma scores describe a model, not measured profile concentrations or effects.'],panel:panel.sort((a,b)=>b[1]-a[1]),sourceNote:source?`Reviewed user report · ${source.fileName} · page ${source.page}`:'User-entered panel',user:true}];
 });
 return [...HISTORICAL,...additions];
}
