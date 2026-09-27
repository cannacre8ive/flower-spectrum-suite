from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import shutil,json,hashlib
r=Path(__file__).resolve().parents[1]
for f in (r/'output/pdf').glob('*.pdf'):shutil.copy2(f,r/'public/assets'/f.name)
for f in (r/'documentation/assets').glob('*.png'):
 if f.name!='social-preview.png':shutil.copy2(f,r/'public/assets'/f.name)
shutil.copy2(r/'public/assets/social-preview.png',r/'documentation/assets/social-preview.png')
profiles=sorted((r/'public/assets/profiles').glob('*'))
with ZipFile(r/'public/assets/flower-spectrum-profile-assets.zip','w',ZIP_DEFLATED) as z:
 for p in profiles:z.write(p,p.name)
files=sorted(p for p in (r/'public/assets').rglob('*') if p.is_file() and p.suffix in ['.png','.pdf','.svg','.csv'])
files += [r/'portfolio'/name for name in ['case-study.html','SHARE-COPY.md','ASSET-GUIDE.md']]
def arc(p):return str(p.relative_to(r/'public/assets')) if p.is_relative_to(r/'public/assets') else p.name
with ZipFile(r/'public/assets/flower-spectrum-portfolio-kit.zip','w',ZIP_DEFLATED) as z:
 for p in files:z.write(p,arc(p))
manifest=[{'file':arc(p),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in files]
(r/'portfolio/manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Packaged',len(profiles),'profile assets and',len(files),'portfolio files.')
