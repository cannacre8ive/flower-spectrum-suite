import "@fontsource/newsreader/400.css";
import "@fontsource/newsreader/600.css";
import "@fontsource/newsreader/400-italic.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/jetbrains-mono/400.css";
import * as htmlToImage from "html-to-image";
import { PROFILES, PROFILE_MAP as PBK } from "../data/profiles.js";
import { classify, bandSegments, blendName } from "../lib/classifier.js";
import {socialStrains} from '../lib/social-catalog.js';
import {jsPDF} from 'jspdf';
let catalog=[];try{const stored=JSON.parse(localStorage.getItem('fs-suite-catalog-v1')||'[]');if(Array.isArray(stored))catalog=stored}catch{}
const STRAINS=socialStrains(catalog),SBK=Object.fromEntries(STRAINS.map(s=>[s.id,s]));
const PROFILE_CONTENT=PBK;
const shortOf=k=>PBK[k]?.short||k;
window.htmlToImage=htmlToImage;

/* ═══════════════════════════════════════════════════════════════════
   CANONICAL ENGINE — math held byte-identical to Classifier v1.3 /
   Menu-Gen v2.0 (contribOf · emergent gas K=1.5/P=1.5 · 60%-of-leader
   band · Defined/Leaning/Blend confidence). Compact terpene set covering
   every analyte present in these COAs.
   ═══════════════════════════════════════════════════════════════════ */
const VERSION="v1.0", BUILD="07_02_2026";
/* ═══════════════ STRIP + FINGERPRINT (the two devices) ═══════════════ */
function stripHTML(c,{h=40,labels="short",gap=0}={}){
  const segs=bandSegments(c);
  return `<div class="fs-strip" style="height:${h}px;gap:${gap}px">`+segs.map(s=>{
    const lbl = labels==="none" ? "" :
      labels==="full" ? `<b style="font-size:${Math.max(9,h*0.20)}px;line-height:1.2;padding:0 ${h*0.18}px ${h*0.18}px">${s.label} · ${s.pct}%</b>` :
      `<b style="font-size:${Math.max(8,h*0.30)}px;padding:0 ${h*0.28}px ${h*0.22}px">${s.short} ${s.pct}%</b>`;
    return `<div class="seg" style="flex:${s.frac};background:${s.color}">${lbl}</div>`;
  }).join("")+`</div>`;
}
function wedge(cx,cy,ir,or_,sa,ea){
  const f=v=>v.toFixed(2);
  const x1=cx+ir*Math.cos(sa),y1=cy+ir*Math.sin(sa),x2=cx+or_*Math.cos(sa),y2=cy+or_*Math.sin(sa);
  const x3=cx+or_*Math.cos(ea),y3=cy+or_*Math.sin(ea),x4=cx+ir*Math.cos(ea),y4=cy+ir*Math.sin(ea);
  return `M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)} A${f(or_)} ${f(or_)} 0 0 1 ${f(x3)} ${f(y3)} L${f(x4)} ${f(y4)} A${f(ir)} ${f(ir)} 0 0 0 ${f(x1)} ${f(y1)} Z`;
}
function fingerprintSVG(c,{size=200,highlight=null,guide="#2a2824"}={}){
  if(!c)return `<div style="width:${size}px;height:${size}px"></div>`;
  const cx=size/2,cy=size/2,maxR=size*0.46,minR=size*0.13;
  const n=PROFILES.length,slice=2*Math.PI/n,g=0.05;
  const pctMap=Object.fromEntries(c.ranked.map(r=>[r.key,r.pct]));
  const maxV=Math.max(...Object.values(pctMap),1);
  const rings=[0.5,1.0].map(f=>minR+f*(maxR-minR));
  let s=`<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="display:block">`;
  rings.forEach(r=>{s+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${guide}" stroke-width="${size*0.004}" stroke-dasharray="2 4" opacity="0.6"/>`;});
  s+=`<circle cx="${cx}" cy="${cy}" r="${maxR}" fill="none" stroke="${guide}" stroke-width="${size*0.005}"/>`;
  s+=`<circle cx="${cx}" cy="${cy}" r="${minR}" fill="none" stroke="${guide}" stroke-width="${size*0.004}"/>`;
  PROFILES.forEach((p,i)=>{
    const v=pctMap[p.key]||0,has=v>0.5;
    const r=has?minR+(v/maxV)*(maxR-minR):minR+size*0.015;
    const sa=-Math.PI/2+i*slice+g/2,ea=-Math.PI/2+(i+1)*slice-g/2;
    const dim=highlight&&highlight!==p.key;
    s+=`<path d="${wedge(cx,cy,minR,r,sa,ea)}" fill="${p.color}" opacity="${has?(dim?0.22:0.92):0.14}"/>`;
  });
  s+=`<circle cx="${cx}" cy="${cy}" r="${size*0.028}" fill="${highlight?PBK[highlight].color:"#5e5a50"}"/>`;
  s+=`</svg>`;return s;
}

/* ═══════════════ PROFILE CONTENT (Brand Guidelines v1.0) ═══════════════ */
/* ═══════════════ STRAIN DATA — real Ideal Cannabis COAs (ChemHistory) ═══════════════
   `values` = engine-keyed terpene panel (drives classification).
   `panel`  = raw COA terpenes by mass, for display (includes analytes the
              compact engine doesn't model, e.g. Anisole — shown, not scored). */
/* ═══════════════ SHARED BITS ═══════════════ */
let settings={}; try { settings=JSON.parse(localStorage.getItem("fs-suite-brand")||"{}"); } catch {}
let FARM=settings.farm||"Ideal Cannabis", HANDLE=settings.handle||"@idealcannabis";
const esc=v=>String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
function compliance(){ return `${SBK[selStrain.value]?.user?"User-supplied panel":"Historical portfolio sample"} · Aroma model, not effect predictions`; }
function leadColor(s){ return bandSegments(s.c)[0].color; }
function brief(value,max=160){const s=String(value||'');return s.length>max?s.slice(0,max).replace(/\s+\S*$/,'')+'…':s}
function topPanel(s,n){ return s.panel.slice(0,n); }

/* ═══════════════ SOCIAL TEMPLATES (1080-canvas interiors) ═══════════════ */
function T_highlight(s){
  const col=leadColor(s), segs=bandSegments(s.c);
  return `<div class="frame dark" data-w="1080" data-h="1080">
    <div class="grid-bg"></div>
    <div class="pad">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div class="f-kick">Strain Highlight</div>
        <div style="text-align:right">
          <div class="f-sig">Flower Spectrum</div>
          <div style="font-family:var(--mono);font-size:13px;letter-spacing:.16em;color:var(--muted);margin-top:6px;text-transform:uppercase">${esc(FARM)}</div>
        </div>
      </div>
      <div style="margin-top:32px">
        <div class="f-strain" style="font-size:${s.name.length>24?68:96}px">${esc(s.name)}</div>
        <div class="f-blend" style="color:${col};font-size:26px;margin-top:16px">${esc(s.blend)} · ${esc(s.c.confidence)}</div>
      </div>
      <div style="display:flex;align-items:center;gap:40px;margin-top:26px">
        <div style="flex:1">${stripHTML(s.c,{h:70,labels:"full"})}</div>
        <div style="flex-shrink:0">${fingerprintSVG(s.c,{size:180,highlight:segs[0].key})}</div>
      </div>
      <div style="display:flex;align-items:center;gap:30px;margin-top:16px"><div class="f-aroma" style="font-size:27px;max-width:26ch;flex:1">&ldquo;${esc(brief(s.aroma,175))}&rdquo;</div>${s.photo?`<img src="${esc(s.photo)}" alt="Flower photograph" style="width:220px;height:170px;object-fit:cover;border:1px solid ${col}"/>`:""}</div>
      <div style="margin-top:auto">
        <div class="f-rule"></div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:24px">
          <div>
            <div style="font-family:var(--mono);font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:14px">Leading measured analytes</div>
            <div class="f-chips">${topPanel(s,3).map(t=>`<span class="f-chip" style="font-size:13px;padding:7px 10px">${esc(t[0])} ${t[1].toFixed(2)}%</span>`).join("")}</div>
          </div>
          <div style="text-align:right">
            <div style="font-family:var(--display);font-weight:600;font-size:40px;color:var(--fg)">${s.thc}<span style="font-size:22px;color:var(--fg-dim)">% THC</span></div>
            <div style="font-family:var(--mono);font-size:14px;letter-spacing:.16em;color:var(--accent);margin-top:6px">${esc(HANDLE)}</div>
          </div>
        </div>
        <div class="f-compliance" style="font-size:12px;margin-top:16px">${compliance()}</div>
      </div>
    </div>
  </div>`;
}

function T_drop(s){
  const col=leadColor(s), segs=bandSegments(s.c);
  return `<div class="frame dark" data-w="1080" data-h="1920">
    <div class="grid-bg"></div>
    <div class="pad" style="padding:96px 80px">
      <div class="f-kick" style="justify-content:space-between"><span>Just Dropped</span><span class="dim">${esc(s.harvest)}</span></div>
      <div style="flex:1;display:flex;flex-direction:column;justify-content:center">
        <div class="f-sig" style="color:var(--muted)">${esc(FARM)}</div>
        <div class="f-strain" style="font-size:${s.name.length>24?86:130}px;margin-top:20px">${esc(s.name)}</div>
        <div class="f-blend" style="color:${col};font-size:30px;margin-top:22px">${esc(s.blend)}</div>
        <div class="f-aroma" style="font-size:38px;margin-top:40px;max-width:18ch">&ldquo;${esc(s.aroma)}&rdquo;</div>
        <div style="display:flex;align-items:center;justify-content:center;gap:30px;margin:40px 0">${fingerprintSVG(s.c,{size:360,highlight:segs[0].key})}${s.photo?`<img src="${esc(s.photo)}" alt="Flower photograph" style="width:350px;height:350px;object-fit:cover"/>`:""}</div>
      </div>
      <div>
        ${stripHTML(s.c,{h:96,labels:"full"})}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:30px">
          <div style="font-family:var(--display);font-weight:600;font-size:44px;color:var(--fg)">${s.thc}<span style="font-size:24px;color:var(--fg-dim)">% THC</span></div>
          <div style="font-family:var(--mono);font-size:20px;letter-spacing:.18em;color:var(--accent)">${esc(HANDLE)}</div>
        </div>
        <div class="f-rule" style="margin-top:26px"></div>
        <div class="f-compliance" style="font-size:14px;margin-top:20px;text-align:center">${compliance()}</div>
      </div>
    </div>
  </div>`;
}

function T_spotlight(pk){
  const p=PBK[pk], content=PROFILE_CONTENT[pk], no=PROFILES.findIndex(x=>x.key===pk)+1;
  return `<div class="frame dark" data-w="1080" data-h="1080">
    <div class="grid-bg"></div>
    <div class="pad">
      <div class="f-kick" style="justify-content:space-between"><span>Aroma Spotlight</span><span class="dim">${String(no).padStart(2,"0")} / 10</span></div>
      <div style="height:14px;background:${p.color};margin-top:40px"></div>
      <div style="margin-top:34px">
        <div style="font-family:var(--mono);font-size:20px;font-weight:700;letter-spacing:.24em;color:${p.color};text-transform:uppercase">${p.short}</div>
        <div class="f-strain" style="font-size:96px;margin-top:14px">${esc(p.label)}</div>
      </div>
      <div class="f-aroma" style="font-size:30px;margin-top:32px;max-width:24ch;color:var(--fg)">${esc(content.sensory)}</div>
      <div style="margin-top:36px">
        <div style="font-family:var(--mono);font-size:14px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin-bottom:16px">Primary drivers</div>
        <div class="f-chips">${content.drivers.map(d=>`<span class="f-chip" style="font-size:18px;padding:10px 16px;border-color:${p.color}66;color:var(--fg)">${esc(d)}</span>`).join("")}</div>
      </div>
      <div style="margin-top:auto">
        <div class="f-aroma" style="font-family:var(--display);font-style:italic;font-size:27px;color:var(--fg-dim);max-width:22ch">Trust your nose. It&rsquo;s smarter than the number.</div>
        <div class="f-rule" style="margin-top:26px"></div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:22px">
          <div class="f-sig">Flower Spectrum</div>
          <div style="font-family:var(--mono);font-size:16px;letter-spacing:.16em;color:var(--accent)">${esc(HANDLE)}</div>
        </div>
        <div class="f-compliance" style="font-size:12px;margin-top:18px">${compliance()}</div>
      </div>
    </div>
  </div>`;
}

function T_fingerprint(s){
  const segs=bandSegments(s.c);
  return `<div class="frame dark" data-w="1080" data-h="1350">
    <div class="grid-bg"></div>
    <div class="pad" style="padding:80px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div class="f-kick">Fingerprint ID</div>
        <div class="f-sig" style="color:var(--muted)">${esc(FARM)}</div>
      </div>
      <div class="f-aroma" style="font-family:var(--display);font-size:40px;color:var(--fg);margin-top:30px;max-width:20ch">Every flower has a signature.</div>
      <div style="display:flex;justify-content:center;margin:20px 0 10px">${fingerprintSVG(s.c,{size:520,highlight:segs[0].key})}</div>
      <div style="text-align:center">
        <div class="f-strain" style="font-size:72px">${esc(s.name)}</div>
        <div class="f-blend" style="color:${leadColor(s)};font-size:24px;margin-top:12px">${esc(s.blend)} · ${esc(s.c.confidence)}</div>
      </div>
      <div style="margin-top:40px">${stripHTML(s.c,{h:58,labels:"full"})}</div>
      <div style="margin-top:auto">
        <div class="f-rule"></div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:22px">
          <div class="f-compliance" style="font-size:13px">The ten-sector map behind the strip · ${compliance()}</div>
          <div style="font-family:var(--mono);font-size:16px;letter-spacing:.16em;color:var(--accent)">${esc(HANDLE)}</div>
        </div>
      </div>
    </div>
  </div>`;
}

function T_compare(a,b){
  const side=s=>`
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;text-align:center">
      ${fingerprintSVG(s.c,{size:230,highlight:bandSegments(s.c)[0].key})}
      <div class="f-strain" style="font-size:52px;margin-top:20px">${esc(s.name)}</div>
      <div class="f-blend" style="color:${leadColor(s)};font-size:19px;margin-top:10px">${esc(s.blend)}</div>
      <div style="width:100%;margin-top:22px">${stripHTML(s.c,{h:46,labels:"short"})}</div>
      <div class="f-aroma" style="font-size:21px;margin-top:20px;max-width:22ch">${esc(brief(s.aroma,110))}</div>
    </div>`;
  return `<div class="frame dark" data-w="1080" data-h="1080">
    <div class="grid-bg"></div>
    <div class="pad">
      <div style="text-align:center">
        <div class="f-kick" style="justify-content:center">Different Flower · Different Aroma</div>
        <div class="f-aroma" style="font-family:var(--display);font-size:34px;color:var(--fg);margin-top:20px;max-width:26ch;margin-left:auto;margin-right:auto">Two flowers can share a number and share nothing else. The nose knows the difference.</div>
      </div>
      <div style="display:flex;gap:56px;align-items:flex-start;margin-top:48px">
        ${side(a)}
        <div style="width:1px;align-self:stretch;background:var(--border)"></div>
        ${side(b)}
      </div>
      <div style="margin-top:auto">
        <div class="f-rule"></div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:22px">
          <div class="f-sig">Flower Spectrum · ${esc(FARM)}</div>
          <div style="font-family:var(--mono);font-size:15px;letter-spacing:.16em;color:var(--accent)">${esc(HANDLE)}</div>
        </div>
        <div class="f-compliance" style="font-size:12px;margin-top:16px">${compliance()}</div>
      </div>
    </div>
  </div>`;
}

function T_voice(){
  return `<div class="frame dark" data-w="1080" data-h="1080">
    <div class="grid-bg"></div>
    <div class="pad">
      <div class="f-kick">Trust Your Nose</div>
      <div style="flex:1;display:flex;align-items:center">
        <div class="f-aroma" style="font-family:var(--display);font-weight:500;font-size:76px;line-height:1.14;color:var(--fg);max-width:15ch">Two flowers at the same THC can be completely <span style="font-style:italic;color:var(--accent)">different</span>.</div>
      </div>
      <div class="f-aroma" style="font-size:30px;color:var(--fg-dim);max-width:30ch">The number on the jar was never the answer. Aroma is measurable, honest, and already understood by every nose that opens a jar.</div>
      <div style="margin-top:44px">${stripHTML(SBK[selStrain.value].c,{h:28,labels:"none"})}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:26px">
        <div class="f-sig">Flower Spectrum · ${esc(FARM)}</div>
        <div style="font-family:var(--mono);font-size:16px;letter-spacing:.16em;color:var(--accent)">${esc(HANDLE)}</div>
      </div>
      <div class="f-compliance" style="font-size:12px;margin-top:18px">${compliance()}</div>
    </div>
  </div>`;
}

/* ═══════════════ ASSET REGISTRY + RENDER ═══════════════ */
function currentAssets(){
  const s=SBK[selStrain.value], p=selProfile.value, a=SBK[selStrain.value], b=SBK[selCompare.value];
  return [
    {id:"highlight", name:"Strain Highlight", fmt:"1:1 · 1080", file:`fs-highlight-${s.id}`, html:T_highlight(s)},
    {id:"drop",      name:"New Drop",         fmt:"9:16 · Story", file:`fs-drop-${s.id}`, html:T_drop(s)},
    {id:"spotlight", name:"Aroma Spotlight",  fmt:"1:1 · Education", file:`fs-spotlight-${p}`, html:T_spotlight(p)},
    {id:"fingerprint",name:"Fingerprint ID",  fmt:"4:5 · Portrait", file:`fs-fingerprint-${s.id}`, html:T_fingerprint(s)},
    {id:"compare",   name:"Compare Aroma Profiles", fmt:"1:1 · Comparison", file:`fs-compare-${a.id}-${b.id}`, html:T_compare(a,b)},
    {id:"voice",     name:"Voice Card",        fmt:"1:1 · Quote", file:`fs-voice`, html:T_voice()},
  ];
}
function renderGallery(){
  const g=document.getElementById("gallery");
  g.innerHTML=currentAssets().map(a=>`
    <div class="asset">
      <div class="bar">
        <div><div class="nm">${esc(a.name)}</div><div class="fmt">${esc(a.fmt)}</div></div>
        <button class="exp" data-file="${a.file}">Export PNG</button>
      </div>
      <div class="viewport" data-w="${a.html.match(/data-w="(\d+)"/)[1]}" data-h="${a.html.match(/data-h="(\d+)"/)[1]}">${a.html}</div>
    </div>`).join("");
  layoutFrames();
  g.querySelectorAll(".exp").forEach(btn=>btn.addEventListener("click",()=>exportPNG(btn)));
}
function layoutFrames(){
  document.querySelectorAll(".viewport").forEach(vp=>{
    const w=+vp.dataset.w,h=+vp.dataset.h,cw=vp.clientWidth,scale=cw/w;
    vp.style.height=(h*scale)+"px";
    const f=vp.querySelector(".frame"); if(f) {f.style.width=w+"px";f.style.height=h+"px";f.style.transform=`scale(${scale})`;}
  });
}
window.addEventListener("resize",layoutFrames);

/* ═══════════════ PNG EXPORT ═══════════════ */
let fontsReady=false;
async function exportPNG(btn){
  const vp=btn.closest(".asset").querySelector(".viewport");
  const frame=vp.querySelector(".frame");
  const w=+frame.dataset.w,h=+frame.dataset.h;
  if(!window.htmlToImage){ toast("Export library didn't load — screenshot the preview to save."); return; }
  const label=btn.textContent; btn.disabled=true; btn.textContent="Rendering…";
  try{
    if(!fontsReady && document.fonts && document.fonts.ready){ await document.fonts.ready; fontsReady=true; }
    const opts={pixelRatio:1,width:w,height:h,cacheBust:true,style:{transform:"none",transformOrigin:"top left",margin:"0"}};
    // warm-up pass stabilizes embedded fonts on first run
    await window.htmlToImage.toPng(frame,opts);
    const url=await window.htmlToImage.toPng(frame,opts);
    const a=document.createElement("a"); a.href=url; a.download=btn.dataset.file+".png";
    document.body.appendChild(a); a.click(); a.remove();
    toast("Saved "+btn.dataset.file+".png");
  }catch(e){ console.error(e); toast("Export failed — try again in a moment."); }
  finally{ btn.disabled=false; btn.textContent=label; }
}
let toastT;
function toast(msg){ const t=document.getElementById("toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove("show"),1600); }

/* ═══════════════ CHEMOVAR CARDS (canonical restyle) ═══════════════ */
function scoreBars(c){
  return c.ranked.filter(r=>r.pct>0).slice(0,6).map(r=>
    `<div class="bar"><span>${r.label}</span><span class="track"><span class="fill" style="width:${r.pct}%;background:${r.color}"></span></span><span>${r.pct}%</span></div>`).join("");
}
function cardHTML(s){
  const segs=bandSegments(s.c), col=segs[0].color;
  return `<article class="sheet">
    <div class="mast">
      <div class="titleblock"><h2>${esc(s.name)}</h2><div class="chem">${esc(s.cross)}</div></div>
      <div class="labelblock">
        <div><b>Flower Spectrum</b><span class="blend" style="color:${col}">${esc(s.blend)}</span></div>
        <div><b>Confidence</b>${esc(s.c.confidence)}</div>
        <div><b>Lot / Sample</b>${esc(s.lot)}<br>${esc(s.sample)}</div>
        <div><b>Farm · Harvest</b>${esc(FARM)}<br>${esc(s.harvest)}</div>
      </div>
      <div class="card-band">${bandSegments(s.c).map(x=>`<div style="flex:${x.frac};background:${x.color}"></div>`).join("")}</div>
    </div>
    <div class="content">
      <aside class="left">
        <div class="module">
          <p class="h">Fingerprint ID</p>
          <div class="fp-wrap">
            ${fingerprintSVG(s.c,{size:120,highlight:segs[0].key})}
            <div style="font-family:var(--mono);font-size:11px;color:var(--fg-dim);line-height:1.9">${segs.map(x=>`<div><span style="display:inline-block;width:9px;height:9px;background:${x.color};margin-right:8px"></span>${x.short} · ${x.pct}%</div>`).join("")}</div>
          </div>
        </div>
        <div class="module"><p class="h">COA metrics</p><div class="metrics">
          <div class="metric"><b>THC</b><strong>${s.thc}%</strong></div>
          <div class="metric"><b>Total cannabinoids</b><strong>${s.cann}%</strong></div>
          <div class="metric"><b>Total terpenes</b><strong>${s.terps}%</strong></div>
          <div class="metric"><b>CBD</b><strong>${s.cbd}%</strong></div>
        </div></div>
        <div class="module"><p class="h">Spectrum score</p><div class="bars">${scoreBars(s.c)}</div></div>
        <div class="module"><p class="h">Engine note</p><p class="note">${s.user?esc(s.sourceNote):"Classified from the historical panel transcribed in the supplied project. Original lab PDFs were not supplied."} Aroma is weighted over mass; Gas is emergent (a balance of caryophyllene, limonene, and myrcene/humulene), never a single terpene.</p></div>
      </aside>
      <section>
        ${s.photo?`<div class="module"><img src="${esc(s.photo)}" alt="Flower photograph" style="width:100%;height:240px;object-fit:cover"/></div>`:""}
        <div class="module"><p class="h">Aroma read</p><p class="bigline">${esc(s.aroma)}</p></div>
        <div class="module copy">${s.copy.map(p=>`<p>${esc(p)}</p>`).join("")}</div>
        <div class="module"><p class="h">Sensory architecture</p><div class="sensory">
          <div class="sense"><b>Top</b>${esc(s.top)}</div><div class="sense"><b>Middle</b>${esc(s.mid)}</div><div class="sense"><b>Base</b>${esc(s.base)}</div>
        </div></div>
        <div class="module"><p class="h">Aroma tags</p><div class="tags">${s.tags.map(t=>`<span class="tag"><i style="background:${PBK[t[0]].color}"></i>${esc(t[1])}</span>`).join("")}</div></div>
        <div class="module"><p class="h">Terpene test results — raw COA</p>
          <table><thead><tr><th>Terpene</th><th>%</th><th>mg/g</th></tr></thead><tbody>
          ${s.panel.map(t=>`<tr><td class="n">${esc(t[0])}</td><td class="m">${t[1].toFixed(2)}%</td><td class="m">${(t[1]*10).toFixed(1)}</td></tr>`).join("")}
          </tbody></table>
          <p class="note" style="margin-top:14px;font-size:11px">All included source rows are preserved. Unmodeled compounds are shown here but do not shift the 38-compound aroma model. Relative scores are not lab concentrations.</p>
        </div>
      </section>
    </div>
  </article>`;
}
function renderCards(){
 const s=SBK[selStrain.value];document.getElementById("cards").innerHTML=`<div class="card-downloads"><span>Selected flower: ${esc(s.name)}</span><button id="card-png">Download chemovar PNG ↓</button><button id="card-pdf">Download sales card PDF ↓</button></div>`+cardHTML(s);
 ['png','pdf'].forEach(type=>document.getElementById('card-'+type).onclick=async event=>{const button=event.target;button.disabled=true;try{await document.fonts.ready;const card=document.querySelector('#cards .sheet').cloneNode(true);card.id='export-card';Object.assign(card.style,{width:'1120px',position:'fixed',left:'-20000px',top:'0',margin:'0'});card.querySelector('.mast').style.gridTemplateColumns='1.25fr .75fr';card.querySelector('.content').style.gridTemplateColumns='.82fr 1.18fr';card.querySelector('h2').style.fontSize='64px';document.body.appendChild(card);const height=Math.ceil(card.getBoundingClientRect().height);const opts={pixelRatio:1,width:1120,height,backgroundColor:'#181715',style:{position:'static',left:'auto',top:'auto'}};await htmlToImage.toPng(card,opts);const url=await htmlToImage.toPng(card,opts);const a=document.createElement('a');if(type==='pdf'){const doc=new jsPDF({unit:'px',format:[card.clientWidth,height],hotfixes:['px_scaling']});doc.addImage(url,'PNG',0,0,card.clientWidth,height,undefined,'FAST');doc.save('fs-chemovar-'+s.id+'.pdf')}else{a.href=url;a.download='fs-chemovar-'+s.id+'.png';a.click()}toast('Chemovar card exported.')}catch(e){console.error(e);toast('Export failed. Please try again.')}finally{document.getElementById('export-card')?.remove();button.disabled=false}});
}

/* ═══════════════ INIT ═══════════════ */
const selStrain=document.getElementById("selStrain");
const selProfile=document.getElementById("selProfile");
const selCompare=document.getElementById("selCompare");
const inFarm=document.getElementById("inFarm");
const inHandle=document.getElementById("inHandle");

selStrain.innerHTML=STRAINS.map(s=>`<option value="${esc(s.id)}">${esc(s.name)} — ${esc(s.blend)}</option>`).join("");
selProfile.innerHTML=PROFILES.map(p=>`<option value="${p.key}">${esc(p.label)}</option>`).join("");
selCompare.innerHTML=STRAINS.map(s=>`<option value="${esc(s.id)}">${esc(s.name)}</option>`).join("");
selStrain.value=SBK[new URLSearchParams(location.search).get("strain")] ? new URLSearchParams(location.search).get("strain") : "jb"; selProfile.value="earthy_dank"; selCompare.value="sdr";

[selProfile,selCompare].forEach(el=>el.addEventListener("change",renderGallery));
selStrain.addEventListener("change",()=>{if(SBK[selStrain.value].farm){FARM=SBK[selStrain.value].farm;inFarm.value=FARM}if(SBK[selStrain.value].user&&!settings.handle){HANDLE="@yourfarm";inHandle.value=HANDLE}renderGallery();renderCards()});
inFarm.addEventListener("input",()=>{ FARM=inFarm.value||"Ideal Cannabis"; renderGallery(); renderCards(); });
inHandle.addEventListener("input",()=>{ HANDLE=inHandle.value||"@yourfarm"; renderGallery(); });

if(SBK[selStrain.value].farm)FARM=SBK[selStrain.value].farm;
if(SBK[selStrain.value].user&&!settings.handle)HANDLE="@yourfarm";
inFarm.value=FARM; inHandle.value=HANDLE;
[inFarm,inHandle].forEach(el=>el.addEventListener("input",()=>{try { localStorage.setItem("fs-suite-brand",JSON.stringify({farm:FARM,handle:HANDLE})); } catch {} }));
/* hero band = the full ten-hue palette */
document.getElementById("heroBand").innerHTML=PROFILES.map(p=>`<div class="s" style="background:${p.color}"><b>${p.short}</b></div>`).join("");
/* guide legend */
document.getElementById("guideLegend").innerHTML=PROFILES.map(p=>`<div class="li"><div class="sw" style="background:${p.color}"></div><div class="nm">${esc(p.label)}</div><div class="tl">${esc(PROFILE_CONTENT[p.key].sensory.split(".")[0])}.</div></div>`).join("");

/* tabs */
document.querySelectorAll("nav.tabs button").forEach(b=>b.addEventListener("click",()=>{
  document.querySelectorAll("nav.tabs button").forEach(x=>x.classList.remove("active"));
  document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");
  document.getElementById("view-"+b.dataset.view).classList.add("active");
  layoutFrames();
}));

renderGallery();
renderCards();
if(document.fonts&&document.fonts.ready){ document.fonts.ready.then(()=>{ fontsReady=true; layoutFrames(); }); }
