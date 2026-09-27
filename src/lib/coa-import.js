import {canon, LOOKUP, cannabinoidKind} from './coa-aliases.js';
import {TERPENES} from '../data/engine-terpenes.js';
const keys=new Set(TERPENES.map(t=>t.key));
export function csvRows(text){
 const out=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(c===','&&!quoted){row.push(cell.trim());cell=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell.trim());if(row.some(Boolean))out.push(row);row=[];cell=''}else cell+=c}
 if(quoted)throw Error('The CSV has an unclosed quoted field. Check the file and try again.');
 row.push(cell.trim());if(row.some(Boolean))out.push(row);return out;
}
function number(cell,unit){
 const s=String(cell??'').trim();if(!s)return {value:'',flag:'Missing result'};
 if(/^(ND|N\/D|BLQ|BDL|not detected|<\s*(?:LOD|LOQ)|<\s*[\d.]+)/i.test(s))return {value:0,flag:'Below detection / quantification; counted as zero'};
 if(!/^[+-]?(?:\d*\.)?\d+\s*(?:%|mg\s*\/\s*g)?$/i.test(s))return {value:'',flag:'Check result and units'};
 const n=parseFloat(s);return {value:n/((/mg\s*\/\s*g/i.test(s)||unit==='mg/g')?10:1),flag:!Number.isFinite(n)||n<0?'Invalid negative result':''};
}
export function parsePanel(text,{csv=false}={}){
 const lines=csv?csvRows(text.replace(/^\uFEFF/,'')):text.split(/\r?\n/).map(s=>s.trim().split(/\t|\s{2,}/));
 const totalMatch=text.replace(/\s+/g,' ').match(/([0-9]*\.?[0-9]+)\s*%\s*Total Terpenes/i)||text.replace(/\s+/g,' ').match(/Total Terpenes\s*([0-9]*\.?[0-9]+)\s*%/i);
 const rows=[];let header=null,total=totalMatch?Number(totalMatch[1]):'',thc='',meta={};
 const hasTable=lines.some(c=>c.some(x=>/^(analyte|compound|terpene|name|constituent)s?$/i.test(x)));
 for(let lineIndex=0;lineIndex<lines.length;lineIndex++){
  let cells=lines[lineIndex];
  if(!cells.some(Boolean))continue;
  const raw=cells.join(' ').trim();
  if(/^\d+\s+of\s+\d+$/i.test(raw))continue;
  const nameIdx=cells.findIndex(c=>/^(analyte|compound|terpene|name|constituent)s?$/i.test(c));
  if(nameIdx>=0){
   // Multi-line laboratory headers put units on a second row, omitting the analyte cell.
   const units=lines[lineIndex+1]||[];
   if(cells.some(x=>/^Mass$/i.test(x))&&units.length===cells.length-1&&units.every(x=>/^(%|mg\/g|ppm|ppb)$/i.test(x))){cells=cells.map((x,i)=>i===nameIdx?x:`${x} (${units[i>nameIdx?i-1:i]})`);lineIndex++}
   const viable=cells.map((c,i)=>({c,i})).filter(x=>x.i!==nameIdx&&!/LOD|LOQ|limit/i.test(x.c));
   const value=viable.find(x=>/%|percent/i.test(x.c))||viable.find(x=>/mg\s*\/\s*g/i.test(x.c))||viable.find(x=>/result|amount|concentration|value/i.test(x.c));
   if(value)header={name:nameIdx,value:value.i,unit:/mg\s*\/\s*g/i.test(value.c)?'mg/g':'%',assumed:!/%|percent|mg\s*\/\s*g/i.test(value.c),unitIdx:cells.findIndex(c=>/^units?$/i.test(c))};
   continue;
  }
  const admin=raw.match(/^(strain|product|farm|grower|producer|batch|lot|sample(?: id)?)\s*[:#]\s*(.+)$/i);
  if(admin){meta[admin[1].toLowerCase()]=admin[2];continue}
  if(/^(Primary Aromas|Method|Quality Control|Notes?)\b/i.test(raw)){header=null;continue}
  let name,result,unit='%',assumed=false;
  if(header&&cells.length>header.value){name=cells[header.name];result=cells[header.value];unit=header.unitIdx>=0?cells[header.unitIdx]||header.unit:header.unit;assumed=header.assumed&&header.unitIdx<0}
  else {
   const m=raw.match(/^(.*?)\s*[:;]?\s+((?:[+-]?(?:\d*\.)?\d+\s*(?:%|mg\s*\/\s*g)?)|(?:ND|N\/D|BLQ|BDL|<\s*(?:LOQ|LOD|[\d.]+)))\s*$/i);
   if(!m)continue;name=m[1].trim();result=m[2];unit=/mg\s*\/\s*g/i.test(result)?'mg/g':'%';assumed=!/%|mg\s*\/\s*g|ND|LOQ|LOD|BLQ|BDL/i.test(result);
  }
  if(!name)continue;
  if(/^(Primary Aromas|Method|Quality Control|Notes?)\b/i.test(name)){header=null;continue}
  if(hasTable&&!header&&!LOOKUP[canon(name)]&&!/^total\s*terp/i.test(name))continue;
  const cn=canon(name), n=/^(%|percent|wt\s*%|mg\s*\/\s*g)$/i.test(String(unit).trim())?number(result,unit):{value:'',flag:'Unsupported units: '+unit+'. Enter the verified percentage.'};
  if(/^totalterpen(?:e|es|oids)$/.test(cn)){if(n.value!=='')total=n.value;continue}
  if(cannabinoidKind(cn)){if(cn==='totalthc')thc=n.value;continue}
  if(/^(sample|product|lot|batch|report|certificate|license|harvest|tested|received|issued|method|instrument|page|address|total)/i.test(name)&&!LOOKUP[cn])continue;
  if(!/[a-z]/i.test(name))continue;
  rows.push({raw:name,originalLabel:name,key:LOOKUP[cn]||'',value:n.value,originalResult:String(result),unit,flag:n.flag||(assumed?'Confirm assumed % units':''),included:true});
 }
 return {rows,total,thc,meta,text};
}
export function reviewPanel(rows,total){
 const included=rows.filter(r=>r.included),values={};const issues=[];
 for(const r of included){const n=Number(r.value);if(r.value===''||!Number.isFinite(n)||n<0||n>100)issues.push(`Check the result for ${r.raw||'an unnamed row'}.`);else if(keys.has(r.key))values[r.key]=(values[r.key]||0)+n}
 const sum=included.reduce((s,r)=>s+(Number(r.value)||0),0), modeled=Object.values(values).reduce((s,n)=>s+n,0), coverage=sum?modeled/sum:0;
 if(Object.values(values).filter(n=>n>0).length<2)issues.push('Enter at least two positive modeled terpene results.');
 if(total===''||!Number.isFinite(Number(total))||Number(total)<=0||Number(total)>100)issues.push('Enter the total terpenes from the test report.');
 else if(Math.abs(sum-Number(total))>.0200001)issues.push('The included rows must match the reported total within 0.02 percentage points.');
 if(sum>100)issues.push('Total terpene concentration cannot exceed 100%.');
 if(coverage<.95)issues.push('At least 95% of the reported terpene mass must be covered by the model. Preserve unknown compounds and check their names.');
 return {values,sum,modeled,coverage,issues,unmodeled:Math.max(0,sum-modeled)};
}
