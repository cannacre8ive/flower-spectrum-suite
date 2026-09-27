import {useState} from 'react';
import {SBK} from '../data/strains.js';
import {TERP_BY_KEY, potencyOf, contribOf} from '../data/engine-terpenes.js';
import {classify, blendName} from '../lib/classifier.js';
import Fingerprint from './Fingerprint.jsx';
import ProfileBand from './ProfileBand.jsx';

export const WEIGHTING_EXAMPLE = {myrcene:0.60, limonene:0.30, linalool:0.55};
const keys = Object.keys(WEIGHTING_EXAMPLE);
const fmt = n => n.toFixed(3);
export default function FingerprintGuide() {
  const [values,setValues] = useState({...WEIGHTING_EXAMPLE});
  const result = classify(values);
  const kush = SBK.km;
  const earth = values.myrcene * potencyOf(TERP_BY_KEY.myrcene) * contribOf(TERP_BY_KEY.myrcene).earthy_dank;
  const floral = values.linalool * potencyOf(TERP_BY_KEY.linalool) * contribOf(TERP_BY_KEY.linalool).floral_soft;
  return <section className="fingerprint-guide" id="fingerprint-guide" aria-labelledby="guide-heading">
    <div className="eyebrow">FROM LAB PANEL TO VISUAL ID</div>
    <h2 id="guide-heading">A fingerprint is a blend,<br/><em>not a winner-takes-all label.</em></h2>
    <div className="fingerprint-method">
      <article><span>01 / MEASURE</span><h3>Start with this batch.</h3><p>The lab reports each compound’s concentration. We preserve those measurements, convert units, and check the panel before classification. A strain name alone never supplies its fingerprint.</p></article>
      <article><span>02 / WEIGHT + DISTRIBUTE</span><h3>Give each note a role.</h3><p>The model multiplies concentration by an aroma weight, then divides that contribution across the compound’s primary and supporting profiles. Several compounds can build the same profile.</p></article>
      <article><span>03 / COMBINE</span><h3>Read the whole mixture.</h3><p>Contributions are added across the panel. The model also adds a Gas / Fuel score when weighted caryophyllene, limonene, and myrcene/humulene are present in balance.</p></article>
      <article><span>04 / DRAW</span><h3>Keep the quieter notes.</h3><p>Scores become relative shares across ten fixed sectors. Spoke length is scaled to the largest score; smaller spokes keep the supporting character visible. These percentages are model shares, not lab concentrations.</p></article>
    </div>
    <div className="fingerprint-example">
      <div>
        <div className="eyebrow">WORKED EXAMPLE / SUPPLIED HISTORICAL PANEL</div>
        <h3>Kush Mints</h3>
        <p className="example-blend">{kush.blend} · {kush.c.confidence}</p>
        <p>This sample leads with Citrus ({kush.c.ranked.find(p=>p.key==='citrus_bright').pct}%) and Floral ({kush.c.ranked.find(p=>p.key==='floral_soft').pct}%). Earth, spice, pine, herb, and the other smaller scores still belong to its identity.</p>
        <div className="sample-measures"><span>Limonene <b>0.91%</b></span><span>Linalool <b>0.50%</b></span><span>Myrcene <b>0.35%</b></span></div>
        <p className="fine-note">Sample {kush.sample} · lot {kush.lot}. Recomputed from the supplied historical panel, not a claim about every batch called Kush Mints. Anisole (0.09%) is recorded in the source but is outside this model.</p>
        <a className="button" href="#social?strain=km">Open this flower in Social studio →</a>
      </div>
      <div className="example-visual">
        <Fingerprint ranked={kush.c.ranked} size={260}/>
        <div className="band-caption">FULL FINGERPRINT / ALL TEN SCORES</div>
        <ProfileBand classification={kush.c}/>
        <div className="score-key">{kush.c.ranked.map(p=><span key={p.key}><i style={{background:p.color}}/>{p.short} {p.pct}%</span>)}</div>
        <div className="band-caption">SOCIAL STRIP / LEADING PROFILES</div>
        <ProfileBand classification={kush.c} leading/>
        <p className="fine-note">The social strip selects up to three profiles scoring at least 60% of the leader. Their widths are proportional within that selection; the printed percentages remain shares of the full model. Rounded scores may not total exactly 100%.</p>
      </div>
    </div>
    <div className="fingerprint-lab" aria-labelledby="weight-heading">
      <div className="lab-heading"><div><div className="eyebrow">TRY THE MODEL / ILLUSTRATIVE INPUTS</div><h3 id="weight-heading">Most abundant doesn’t always mean most defining.</h3><p>Start with 0.60% myrcene and 0.55% linalool. Myrcene is the largest measured compound, but Floral leads: linalool gets a 1.20× model weight and sends a larger share of that contribution to Floral. Move the sliders to see the result change.</p></div><button className="button" onClick={()=>setValues({...WEIGHTING_EXAMPLE})}>Reset example</button></div>
      <div className="lab-layout"><div>
        {keys.map(key=><label className="terpene-slider" key={key}><span>{TERP_BY_KEY[key].label}<output>{values[key].toFixed(2)}%</output></span><input type="range" aria-label={`${TERP_BY_KEY[key].label} concentration`} min="0" max="1.2" step="0.01" value={values[key]} onChange={e=>{const value=Number(e.target.value);setValues(previous=>({...previous,[key]:value}));}}/><small>Model weight {potencyOf(TERP_BY_KEY[key]).toFixed(2)}×</small></label>)}
        <div className="contribution-math"><p>Myrcene → Earth: {values.myrcene.toFixed(2)} × 1.00 × 70% = <b>{fmt(earth)}</b></p><p>Linalool → Floral: {values.linalool.toFixed(2)} × 1.20 × 77.8% ≈ <b>{fmt(floral)}</b></p><small>Contribution scores before normalization. Each compound also contributes to supporting profiles; 77.8% is rounded.</small></div>
      </div><div className="lab-result" aria-live="polite">
        {result ? <><Fingerprint ranked={result.ranked} size={210}/><h4>{blendName(result)}</h4><p>{result.ranked[0].label} leads at {result.ranked[0].pct}% of model score</p><ProfileBand classification={result}/><div className="score-key">{result.ranked.filter(p=>p.pct>0).map(p=><span key={p.key}><i style={{background:p.color}}/>{p.short} {p.pct}%</span>)}</div></> : <p>Add a measured amount to build a fingerprint.</p>}
      </div></div>
      <p className="fine-note">These weights are Flower Spectrum’s model assumptions, not laboratory measurements of smell intensity or validated sensory thresholds. This is an aroma interpretation, not an effects prediction. The three-compound example is illustrative and is not the Kush Mints panel.</p>
    </div>
    <details className="model-details"><summary>What else should I know about the model?</summary><p>For each compound, primary and supporting profile weights are normalized to sum to one. The default starting weights are 0.7 for its primary profile, 0.2 for its first supporting profile, and 0.1 for each additional supporting profile. Aroma weights default to 1.0 for primary, 1.1 for impact, and 0.7 for trace compounds, with explicit overrides such as 1.2 for linalool and 0.3 for farnesenes.</p><p>A profile can lead because of one weighted contribution or several contributions accumulating together. The model does not assume that all minor compounds are more impactful than major ones. Missing or unsupported compounds limit the interpretation.</p><p>Dessert / Creamy is a combination descriptor in this system. Its teaching card emphasizes that character for illustration; the current classifier may place a related measured panel primarily in Floral or Spicy. None of the ten illustrated reference blends is a measured cultivar average.</p></details>
  </section>;
}
