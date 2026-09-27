import {PROFILES} from '../data/profiles.js';
import {bandSegments} from '../lib/classifier.js';
export default function ProfileBand({classification, ranked=classification?.ranked || [], leading=false}) {
  const segments = leading ? bandSegments(classification) : PROFILES.map(p => ranked.find(q => q.key === p.key)).filter(p => p?.pct > 0);
  return <div className={`profile-spectrum-band ${leading ? 'leading-band' : ''}`} role="img" aria-label={`${leading ? 'Leading profiles' : 'Full spectrum'}: ${segments.map(p => `${p.label} ${Math.round(p.pct)}%`).join(', ')}`}>
    {segments.map(p => <span key={p.key} style={{background:p.color,flex:p.pct}} title={`${p.label}: ${Math.round(p.pct)}%`}>
      {leading && <b>{p.short} · {p.pct}%</b>}
    </span>)}
  </div>;
}
