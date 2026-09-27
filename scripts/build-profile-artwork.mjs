import {createServer} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {mkdir,writeFile} from 'node:fs/promises';
import {PROFILES} from '../src/data/profiles.js';
import {referenceRanked} from '../src/lib/profile-reference.js';
const server=await createServer({server:{middlewareMode:true,hmr:false,ws:false}});
const {default:Icon}=await server.ssrLoadModule('/src/components/Fingerprint.jsx');
await mkdir('public/assets/profiles',{recursive:true});await mkdir('output/playwright/profile-artwork',{recursive:true});
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
for(const [i,p] of PROFILES.entries()){
 const svg=renderToStaticMarkup(React.createElement(Icon,{ranked:referenceRanked(p.key),size:480})).replace(' role="img"','').replace(/ aria-label="[^"]*"/,'').replace('<svg','<svg style="color:#9c9a84" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="'+p.label+'"');
 await writeFile(`public/assets/profiles/${p.key}.svg`,svg);
 const html=`<!doctype html><html><head><meta charset="utf-8"><title>${p.label} — Flower Spectrum</title><style>
 @font-face{font-family:Newsreader;src:url('/node_modules/@fontsource/newsreader/files/newsreader-latin-400-normal.woff2')}@font-face{font-family:DM;src:url('/node_modules/@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff2')}@font-face{font-family:Mono;src:url('/node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2')}
 *{box-sizing:border-box}body{margin:0;width:1080px;height:1080px;background:#0e0e0c;color:#e8e3d9;font-family:DM;position:relative;overflow:hidden}.band{height:20px;background:#0e0e0c}header{margin:55px 64px;display:flex;justify-content:space-between;font:14px Mono;letter-spacing:2px;color:#a8a092}.art{position:absolute;right:50px;top:140px;opacity:.84}.art svg{width:410px;height:410px}.number{font:130px Newsreader;color:${p.color};padding:24px 64px}.copy{position:absolute;left:64px;top:465px;right:64px}h1{font:76px/1.05 Newsreader;margin:0 0 28px;letter-spacing:-2px}.tagline{font:18px Mono;letter-spacing:.5px;color:#a8a092}.sensory{font:27px/1.5 DM;max-width:875px;margin-top:30px}.drivers{position:absolute;left:64px;right:64px;bottom:110px;border-top:1px solid #3d3c34;padding-top:25px;font-size:19px;line-height:1.6}.drivers b{font:12px Mono;display:block;letter-spacing:2px;color:#6aafa0;margin-bottom:10px}footer{position:absolute;left:64px;right:64px;bottom:40px;display:flex;justify-content:space-between;font:11px Mono;letter-spacing:1px;color:#a8a092}</style></head><body><div class="band" style="display:flex">${PROFILES.map(q=>`<span style="flex:1;background:${q.color};opacity:${q.key===p.key?1:.14}"></span>`).join('')}</div><header><span>FLOWER SPECTRUM / FINGERPRINT ATLAS</span><span>PROFILE ${String(i+1).padStart(2,'0')} OF 10</span></header><div class="number">${String(i+1).padStart(2,'0')}.</div><div class="art">${svg}</div><section class="copy"><h1>${esc(p.label)}</h1><div class="tagline">${esc(p.tagline)}</div><p class="sensory">${esc(p.sensory)}</p></section><div class="drivers"><b>AROMA DRIVERS / SUPPLIED MODEL</b>${p.drivers.map(esc).join(' · ')}</div><footer><span>CANNACRE8IVE / FLOWER SPECTRUM SUITE</span><span>SECTOR REFERENCE · NOT A MEASURED FLOWER</span></footer></body></html>`;
 await writeFile(`output/playwright/profile-artwork/${p.key}.html`,html);
}
await server.close();console.log('Prepared ten editable SVG fingerprints and ten card compositions.');
