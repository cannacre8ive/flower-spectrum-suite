import { PROFILES } from '../data/profiles.js';
export default function Fingerprint({ranked, size=360, label="Aroma fingerprint: ten sectors show the relative model scores"}) {
 const pct=Object.fromEntries(ranked.map(x=>[x.key,x.pct]));const max=Math.max(...Object.values(pct),1);const c=200,inner=55,outer=182;
 const point=(r,a)=>`${c+r*Math.cos(a)},${c+r*Math.sin(a)}`;
 return <svg viewBox="0 0 400 400" width={size} height={size} role="img" aria-label={label}><circle cx={c} cy={c} r={outer} fill="none" stroke="currentColor" opacity=".15"/>{[100,140].map(r=><circle key={r} cx={c} cy={c} r={r} fill="none" stroke="currentColor" opacity=".15" strokeDasharray="2 6"/>)}{PROFILES.map((p,i)=>{const a=-Math.PI/2+i*Math.PI/5+.035,b=a+Math.PI/5-.07,r=inner+Math.max(.025,(pct[p.key]||0)/max)*(outer-inner);return <path key={p.key} d={`M${point(inner,a)} L${point(r,a)} A${r},${r} 0 0 1 ${point(r,b)} L${point(inner,b)} A${inner},${inner} 0 0 0 ${point(inner,a)}`} fill={p.color} opacity={pct[p.key]>.5?.95:.18}/>})}<circle cx={c} cy={c} r="7" fill="#6aafa0"/></svg>
}
