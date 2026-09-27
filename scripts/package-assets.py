from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import shutil,json,hashlib
r=Path(__file__).resolve().parents[1]
for f in (r/'output/pdf').glob('*.pdf'):shutil.copy2(f,r/'public/assets'/f.name)
for f in (r/'documentation/assets').glob('*.png'):shutil.copy2(f,r/'public/assets'/f.name)
files=[p for p in (r/'public/assets').iterdir() if p.is_file() and p.suffix in ['.png','.pdf','.svg']]
files += [r/'portfolio'/name for name in ['case-study.html','SHARE-COPY.md','ASSET-GUIDE.md']]
with ZipFile(r/'public/assets/flower-spectrum-portfolio-kit.zip','w',ZIP_DEFLATED) as z:
 for p in files:z.write(p,p.name)
manifest=[{'file':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in files]
(r/'portfolio/manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Packaged',len(files),'portfolio files.')
