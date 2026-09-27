from urllib.request import urlopen
from pathlib import Path
import hashlib,json
base='https://flower-spectrum-suite.vercel.app'
paths=['/','/social.html','/favicon.svg','/robots.txt','/sitemap.xml']+['/assets/'+str(p.relative_to(Path('public/assets'))) for p in Path('public/assets').rglob('*') if p.is_file()]
results=[]
for path in paths:
 with urlopen(base+path) as res:
  data=res.read();row={'path':path,'status':res.status,'bytes':len(data)}
  if path.startswith('/assets/'):
   local=Path('public')/path.lstrip('/');row['matchesLocal']=data==local.read_bytes()
  if path=='/':
   html=data.decode();row['metadata']={key:key in html for key in ['og:type','og:site_name','og:title','og:description','og:url','og:image:secure_url','og:image:type','og:image:width','og:image:height','og:image:alt','twitter:card','twitter:image:alt','rel="canonical"']};row['noindex']='noindex' in html
  results.append(row)
Path('documentation/live-http-verification.json').write_text(json.dumps(results,indent=2)+'\n')
assert all(x['status']==200 and x.get('matchesLocal',True) for x in results)
print(json.dumps({'endpoints':len(results),'all200':True,'allAssetsMatchLocal':True}))
