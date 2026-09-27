import {PROFILES} from '../data/profiles.js';
import Fingerprint from '../components/Fingerprint.jsx';
import ProfileBand from '../components/ProfileBand.jsx';
import FingerprintGuide from '../components/FingerprintGuide.jsx';
import {referenceRanked} from '../lib/profile-reference.js';
export default function Profiles(){return <main className="production-tool">
  <div className="eyebrow">THE VISUAL LANGUAGE / FINGERPRINT + BAND</div>
  <h1>A leading note.<br/>A complete <em>fingerprint.</em></h1>
  <p className="tool-intro">Flower has a leading character and a supporting cast. Each reference blend gives its main profile the longest spoke, with smaller notes around it and a proportional spectrum strip. Explore the ten profiles, then see how a measured batch becomes its own visual ID.</p>
  <div className="action-row"><a className="button primary" href="#import">Create my flower’s assets →</a><button className="button" onClick={()=>document.getElementById('fingerprint-guide')?.scrollIntoView({behavior:'smooth'})}>How a fingerprint is generated ↓</button><a className="button" href="/assets/flower-spectrum-profile-assets.zip" download>Download ten reference cards ↓</a><a className="button" href="#print">Print shelf cards ↗</a></div>
  <p className="fine-note">ILLUSTRATIVE BLENDS · These teaching compositions show leading and supporting character, not lab results or averages for a named strain. For an actual flower, every spoke comes from its reviewed panel.</p>
  <div className="profile-asset-grid fingerprint-library">{PROFILES.map((p,i)=>{
    const ranked=referenceRanked(p.key), leading=[...ranked].sort((a,b)=>b.pct-a.pct).slice(0,3);
    return <article key={p.key} style={{'--profile-color':p.color}}><div className="profile-asset-art"><span>{String(i+1).padStart(2,'0')} / ILLUSTRATIVE PROFILE BLEND</span><Fingerprint ranked={ranked} size={210} label={`${p.label}: illustrative blend with smaller supporting profiles`}/><h2>{p.label}</h2><p>{p.tagline}</p><ProfileBand ranked={ranked}/><div className="reference-notes">{leading.map(q=><span key={q.key}><i style={{background:q.color}}/>{q.short} {Math.round(q.pct)}%</span>)}</div></div><div className="profile-asset-copy"><p>{p.sensory}</p><small>DRIVEN BY · {p.drivers.join(' / ')}</small>{p.combination&&<p className="fine-note">A combination descriptor; measured panels may lead with Floral or Spicy.</p>}<div><a href={`/assets/profiles/${p.key}.png`} download>PNG card ↓</a><a href={`/assets/profiles/${p.key}.svg`} download>SVG fingerprint ↓</a></div><a href={`#workflows?role=buyer&profile=${p.key}`}>Find flower with this profile →</a></div></article>
  })}</div>
  <FingerprintGuide/>
</main>}
