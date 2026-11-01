"""Evidence gate, not a classifier or proof of artistic quality."""
import hashlib,json
from pathlib import Path
from PIL import Image

def need(value,message):
 if not value:raise ValueError(message)
def asset(base,record):
 need(isinstance(record,dict),'Reviewed asset record required')
 name=record.get('file');need(isinstance(name,str) and name and not Path(name).is_absolute(),'Review assets must be relative')
 p=(base/name).resolve();need(p.is_relative_to(base.resolve()) and p.is_file(),'Review asset missing or escapes project')
 need(hashlib.sha256(p.read_bytes()).hexdigest()==record.get('sha256'),'Stale reviewed asset: '+name)
 return p

def reviewed_image(base,record):
 p=asset(base,record)
 with Image.open(p) as im:im.verify()
 return p

def require_style_review(base,c):
 mode=c.get('visualTreatment','heroic')
 need(mode in ['heroic','generic-panel'],'Unknown visualTreatment')
 if mode=='generic-panel':
  need(isinstance(c.get('genericPanelReason'),str) and len(c['genericPanelReason'].strip())>=20,'Explain explicit generic-panel compatibility use')
  return {'visualTreatment':mode,'label':'PANEL MOTION COMIC','styleCertified':False}
 name=c.get('styleReview');need(isinstance(name,str) and name,'Heroic production requires a hash-bound styleReview file')
 record={'file':name,'sha256':c.get('styleReviewSha256')};p=asset(base,record);r=json.loads(p.read_text())
 need(r.get('schemaVersion')==1,'Style review schemaVersion must be 1')
 need(r.get('status')=='accepted','Style review missing or rejected; inspect and revise artwork')
 for field in ['reviewer','reviewedAt','brief','referenceObservations','limitations']:
  need(isinstance(r.get(field),str) and r[field].strip(),'Style review needs actual '+field)
 need(isinstance(r.get('reference'),dict),'Inspected reference evidence required');reviewed_image(base,r['reference'])
 need(isinstance(r.get('representative'),dict),'Representative drawing review required')
 targets={s['image'] for s in c['shots']};rows=r.get('panels',[])
 need(isinstance(rows,list) and {x.get('image',{}).get('file') for x in rows}==targets and len(rows)==len(targets),'Review every final panel exactly once')
 rep=r['representative'];need(rep.get('status')=='accepted','Representative panel not accepted')
 for row in [rep]+rows:
  need(row.get('status')=='accepted','Unresolved panel review')
  reviewed_image(base,row.get('image'));reviewed_image(base,row.get('construction'));asset(base,row.get('source'))
  need(isinstance(row.get('observations'),dict),'Concrete visual observations required')
  for trait in ['proportionsIdentity','connectedFormsContacts','gestureExpression','inkFormShadows','perspectiveDepth','speciesDesign','storyTone']:
   val=row['observations'].get(trait);need(isinstance(val,str) and len(val.strip())>=12,'Missing observation: '+trait)
  provenance=row.get('drawingProvenance',{});need(isinstance(provenance,dict),'Drawing provenance required')
  need(provenance.get('method') in ['shared-modules','bespoke-paths','mixed'],'Record actual drawing method')
  for field in ['visibleGeometry','functionsAndParametersOrPaths']:
   val=provenance.get(field);need(isinstance(val,str) and len(val.strip())>=20,'Drawing provenance needs '+field)
  need(isinstance(row.get('unresolvedIssues'),list),'Record unresolved issues explicitly')
  need(not row['unresolvedIssues'],'Unresolved visual concerns block heroic production')
 if r.get('previouslyRejectedByUser'):
  need(isinstance(r.get('userResolution'),str) and len(r['userResolution'].strip())>=20,'Record user resolution of rejected preview before production')
 return {'visualTreatment':mode,'label':'HEROIC MOTION COMIC','styleCertified':False,'reviewEvidenceSha256':record['sha256'],'reviewStatus':'accepted-by-recorded-reviewer'}
