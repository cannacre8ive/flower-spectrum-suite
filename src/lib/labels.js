import { jsPDF } from 'jspdf';
import { PROFILES } from '../data/profiles.js';
import { TERP_BY_KEY as TBK } from '../data/engine-terpenes.js';
import { bandSegments, blendName } from './classifier.js';
import { productToPrint } from './product-model.js';
export const TEMPLATES = {avery6464:{id:'avery6464',name:'Avery 6464 · 4 × 3⅓ in · 6-up',page:'letter',pw:8.5,ph:11,lw:4,lh:10/3,cols:2,rows:3,xs:[0.156,4.343],ys:[0.5,0.5+10/3,0.5+20/3]}};
export function labelOrder(products,copies=1,order='grouped') {
 if(!Number.isInteger(copies)||copies<1||copies>200)throw new Error('Copies must be a whole number from 1 to 200.');
 if(products.length*copies>3000)throw new Error('Limit each export to 3,000 labels.');
 return order==='interleaved'?Array.from({length:copies},()=>products).flat():products.flatMap(p=>Array(copies).fill(p));
}
export function labelPositions(count,offset=0,template=TEMPLATES.avery6464) {
 const per=template.cols*template.rows;
 if(!Number.isInteger(offset)||offset<0||offset>=per)throw new Error('Start position must be 1–6.');
 return Array.from({length:count},(_,i)=>{const cell=(i+offset)%per;return {page:Math.floor((i+offset)/per),x:template.xs[cell%template.cols],y:template.ys[Math.floor(cell/template.cols)]}});
}
function hexToRgb(h){ const n=parseInt(h.slice(1),16); return [(n>>16)&255,(n>>8)&255,n&255]; }
function terpLabel(key){ return (TBK[key] && TBK[key].label) || key; }
// consumer-label convention: drop α/β/Δ/D-/trans- prefixes (jsPDF core fonts lack Greek glyphs)
function cleanTerp(label){
  return label.replaceAll('α','alpha').replaceAll('β','beta').replaceAll('γ','gamma').replaceAll('δ','delta').replaceAll('Δ','delta');
}
function topTerpsLabeled(values, n){
  return Object.entries(values).map(([k,v])=>({k,v})).filter(o=>o.v>0)
    .sort((a,b)=>b.v-a.v).slice(0,n).map(o=>cleanTerp(terpLabel(o.k)));
}

// 10-sector fingerprint, drawn as fanned filled wedges
function drawFingerprint(doc, cx, cy, R, classification){
  const pct = Object.fromEntries(classification.ranked.map(r=>[r.key,r.pct]));
  const maxV = Math.max(...Object.values(pct),1);
  const n = PROFILES.length, slice=2*Math.PI/n, ri=R*0.18;
  doc.setFillColor(232,224,206); doc.circle(cx,cy,R,'F');
  PROFILES.forEach((p,i)=>{
    const v=pct[p.key]||0; const rr = v>0.5 ? ri+(v/maxV)*(R-ri) : ri+R*0.015;
    const a0=-Math.PI/2+i*slice+0.035, a1=-Math.PI/2+(i+1)*slice-0.035;
    const [r,g,b]=hexToRgb(p.color); doc.setFillColor(r,g,b);
    const steps=4;
    for(let s=0;s<steps;s++){
      const b0=a0+(a1-a0)*s/steps, b1=a0+(a1-a0)*(s+1)/steps;
      doc.triangle(cx+ri*Math.cos(b0), cy+ri*Math.sin(b0),
                   cx+rr*Math.cos(b0), cy+rr*Math.sin(b0),
                   cx+rr*Math.cos(b1), cy+rr*Math.sin(b1), 'F');
      doc.triangle(cx+ri*Math.cos(b0), cy+ri*Math.sin(b0),
                   cx+rr*Math.cos(b1), cy+rr*Math.sin(b1),
                   cx+ri*Math.cos(b1), cy+ri*Math.sin(b1), 'F');
    }
  });
  doc.setFillColor(138,129,112); doc.circle(cx,cy,R*0.05,'F');
}

// fit a name to one line (shrink), else wrap to 2 lines; returns {size, lines, yAfter}
function fitName(doc, name, maxW, baseSize, minSize){
  doc.setFont('times','bold');
  let size=baseSize;
  while(size>minSize){ doc.setFontSize(size); if(doc.getTextWidth(name)<=maxW) break; size-=0.5; }
  doc.setFontSize(size);
  if(doc.getTextWidth(name)<=maxW) return { size, lines:[name] };
  const lines = doc.splitTextToSize(name, maxW).slice(0,2);
  return { size:minSize, lines };
}

function drawLabel(doc, s, lx, ly, T, opts){
  opts = opts || {};
  const c=s.classification, lw=T.lw, lh=T.lh;
  const segs=bandSegments(c);
  doc.setFillColor(244,239,228); doc.rect(lx,ly,lw,lh,'F');
  // proportional color band (left)
  const bandW=0.26; let yy=ly;
  segs.forEach(seg=>{ const [r,g,b]=hexToRgb(seg.color); doc.setFillColor(r,g,b); const h=lh*seg.frac; doc.rect(lx,yy,bandW,h,'F'); yy+=h; });
  const x=lx+bandW+0.2, rgt=lx+lw-0.2, fpR=0.46, nameMaxW=lw-bandW-0.2-(fpR*2)-0.25;
  // profile + blend + confidence
  doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(110,99,88);
  const blend=c ? blendName(c)+(c.source==='manual'?' · MANUAL PROFILE':c.confidence!=='Defined'?' · '+c.confidence:'') : 'UNCLASSIFIED';
  doc.text(blend.toUpperCase(), x, ly+0.28);
  // strain name (auto-fit)
  const fit=fitName(doc, s.name, nameMaxW, 20, 12);
  doc.setTextColor(21,19,15);
  let nameY=ly+0.55;
  fit.lines.forEach((ln,i)=>{ doc.text(ln, x, nameY+i*(fit.size/72*1.02)); });
  const afterName = nameY + (fit.lines.length-1)*(fit.size/72*1.02) + 0.2;
  // grower
  doc.setFont('times','italic'); doc.setFontSize(10); doc.setTextColor(94,87,77);
  doc.text(doc.splitTextToSize(s.grower||'', nameMaxW).slice(0,1), x, afterName);
  // lineage
  doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(138,129,112);
  doc.text(doc.splitTextToSize((s.lineage||'').toUpperCase(), lw-bandW-0.45).slice(0,1), x, afterName+0.15);
  // fingerprint top-right
  if(c) drawFingerprint(doc, rgt-fpR, ly+0.5+fpR*0.4, fpR, c);
  // breakdown bars (top 4)
  let by=Math.max(afterName+0.42, ly+1.35); const barX=x, barW=1.5;
  (c?.ranked||[]).filter(r=>r.pct>0).slice(0,4).forEach(r=>{
    const [cr,cg,cb]=hexToRgb(r.color);
    doc.setFillColor(225,217,200); doc.rect(barX, by-0.065, barW, 0.065,'F');
    doc.setFillColor(cr,cg,cb); doc.rect(barX, by-0.065, barW*(r.pct/(c.ranked[0].pct||1)), 0.065,'F');
    doc.setFont('helvetica','normal'); doc.setFontSize(6.8); doc.setTextColor(58,53,48);
    doc.text(r.label, barX+barW+0.08, by-0.008);
    doc.setTextColor(120,114,100); if(c.source!=='manual') doc.text(r.pct+'%', rgt, by-0.008, {align:'right'});
    by+=0.155;
  });
  // aroma sentence
  doc.setFont('times','italic'); doc.setFontSize(9.5); doc.setTextColor(58,53,48);
  const aromaLines=doc.splitTextToSize(s.aroma||'', lw-bandW-0.45).slice(0,2);
  doc.text(aromaLines, x, by+0.12);
  // footer
  const fy=ly+lh;
  doc.setDrawColor(214,205,187); doc.setLineWidth(0.008); doc.line(x, fy-0.62, rgt, fy-0.62);
  doc.setFont('helvetica','normal'); doc.setFontSize(6.2); doc.setTextColor(110,99,88);
  doc.text(doc.splitTextToSize('TOP TERPS · '+(topTerpsLabeled(s.values||{},4).join(' · ')||'No panel supplied'), lw-bandW-0.45).slice(0,2), x, fy-0.46);
  doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(21,19,15);
  doc.text(s.category==='edible' ? 'THC '+(s.thc??'—')+'mg / piece' : 'THC '+(s.thc??'—')+'%', x, fy-0.24);
  if(c?.source==='engine')doc.text('TERPS '+c.totalTerp.toFixed(2)+'%', x+1.08, fy-0.24);
  doc.setFont('times','bolditalic'); doc.setFontSize(15); doc.setTextColor(21,19,15);
  doc.text(s.labelPrice, rgt, fy-0.21, {align:'right'});
  doc.setFont('helvetica','normal'); doc.setFontSize(5.6); doc.setTextColor(140,129,112);
  doc.text('AROMA MODEL · '+(s.sourceId?'HISTORICAL SAMPLE':s.illustrative?'ILLUSTRATIVE SAMPLE':'USER-ENTERED DATA'), x, fy-0.1);
  // cut guide
  if(opts.cutGuides){ doc.setDrawColor(190,190,190); doc.setLineWidth(0.003); doc.rect(lx,ly,lw,lh); }
}


export function buildLabelPDF(products,{copies=1,order='grouped',offset=0,cutGuides=true,templateId='avery6464'}={}) {
 if(!products.length)throw new Error('Select at least one product.');
 const T=TEMPLATES[templateId];if(!T)throw new Error('Unknown label stock.');
 const list=labelOrder(products,copies,order),positions=labelPositions(list.length,offset,T);
 const doc=new jsPDF({unit:'in',format:T.page});doc.setProperties({title:'Flower Spectrum · Aroma Labels',author:'CannaCre8ive'});
 list.forEach((p,i)=>{const pos=positions[i];if(pos.page+1>doc.getNumberOfPages())doc.addPage();const s=productToPrint(p);const amount=p.category==='flower'?p.priceEighth:p.category==='concentrate'?p.priceGram:p.category==='edible'?p.pricePack:p.priceEach;const unit=p.category==='flower'?'/8th':p.category==='concentrate'?'/g':p.category==='edible'?'/pack':'/ea';s.labelPrice=amount==null?'Price not set':'$'+(p.salePct>0?Math.round(amount*(1-p.salePct/100)):amount)+' '+unit;drawLabel(doc,s,pos.x,pos.y,T,{cutGuides})});return doc;
}
