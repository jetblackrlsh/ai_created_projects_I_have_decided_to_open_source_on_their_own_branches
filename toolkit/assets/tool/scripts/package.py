"""Export verified editable assets; fail closed on missing or stale QA."""
from pathlib import Path
import json,hashlib,zipfile,zlib
from project import read,local,need,digest,validate

def package(path):
 path=Path(path).resolve();base,c=read(path);validate(path);qa=base/'out/verification.json';need(qa.is_file(),'Run verify successfully before packaging');v=json.loads(qa.read_text());need(v.get('passed') is True and v.get('projectSha256')==digest(path),'Missing/stale verification')
 hashes=v.get('hashes',{});need(hashes,'Verification has no evidence hashes')
 for name,h in hashes.items():need(digest(local(base,name))==h,f'Stale QA evidence: {name}')
 need(hashlib.sha256(json.dumps(hashes,sort_keys=True,separators=(',',':')).encode()).hexdigest()==v['manifestHash'],'QA manifest hash mismatch')
 names={str(path.relative_to(base)),'out/verification.json','out/mix.json'}
 for q in c['speech']:names.add(q['file'])
 for q in c['panels']:names.update([q['image'],q['source']])
 for q in c.get('effects',[]):names.add(q['file'])
 if c.get('music'):names.add(c['music']['file'])
 if c.get('background'):names.add(c['background'])
 for folder in ['provenance','receipts']:
  if (base/folder).exists():names.update(str(p.relative_to(base)) for p in (base/folder).rglob('*') if p.is_file() and p.suffix in ['.json','.md','.txt'])
 for p in base.rglob('*.receipt.json'):
  if 'delivery' not in p.parts:names.add(str(p.relative_to(base)))
 for pattern in ['*-generation.json','*-jobs.json','*provenance.json','crops.json','metadata.json','transcript.txt']:
  names.update(str(p.relative_to(base)) for p in base.glob(pattern))
 rows=[]
 for name in sorted(names):
  p=local(base,name);b=p.read_bytes();size=len(zlib.compress(b,6));need(size<17000000,f'Single asset too large for18MB part: {name}; split source asset intentionally first');rows.append(dict(path=name,bytes=len(b),sha256=digest(p),compressed=size))
 bins=[]
 for row in sorted(rows,key=lambda x:x['compressed'],reverse=True):
  target=next((a for a in bins if sum(x['compressed']+400+len(x['path'])*2 for x in a)+row['compressed']<17000000),None)
  if target is None:target=[];bins.append(target)
  target.append(row)
 dest=base/'delivery';need(not dest.exists(),'Preserve previous delivery directory');dest.mkdir();parts=[]
 for i,items in enumerate(bins,1):
  p=dest/f'editable-{i:02d}-of-{len(bins):02d}.zip'
  with zipfile.ZipFile(p,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
   for q in items:z.write(base/q['path'],q['path'])
   z.writestr(f'PART-{i:02d}.json',json.dumps(items,indent=2))
   if i==1:
    tool=Path(__file__).resolve().parents[1]
    toolfiles=[tool/'motion_manga.py',tool/'README.md',tool/'LICENSE',tool/'NOTICE.md',tool/'requirements.txt']
    for folder in ['scripts','docs','references']:toolfiles.extend(p for p in (tool/folder).rglob('*') if p.is_file() and p.suffix in ['.py','.md','.json','.txt'])
    for src in toolfiles:z.write(src,'tool/'+str(src.relative_to(tool)))
  with zipfile.ZipFile(p) as z:need(z.testzip() is None,'ZIP CRC failure')
  need(p.stat().st_size<18000000,'ZIP exceeds18MB');parts.append(dict(file=p.name,bytes=p.stat().st_size,sha256=digest(p)))
 result=dict(parts=parts,allPartsRequired=True,files=rows,toolIncluded='tool/ in part01; run from extracted project with python tool/motion_manga.py',verificationManifestHash=v['manifestHash']);(dest/'manifest.json').write_text(json.dumps(result,indent=2));return result
