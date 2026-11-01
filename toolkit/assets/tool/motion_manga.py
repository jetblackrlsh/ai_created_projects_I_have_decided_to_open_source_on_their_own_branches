#!/usr/bin/env python3
"""Local Motion Manga CLI. No downloads, remote APIs or publishing."""
import argparse,json,sys,subprocess
from pathlib import Path
HERE=Path(__file__).resolve().parent;sys.path.insert(0,str(HERE/'scripts'))
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('command',choices=['validate','plan','crop','speech','generate-audio','mix','render','verify','package']);p.add_argument('project');p.add_argument('--mode',choices=['both','film','card'],default='both');p.add_argument('--allow-missing-generated-assets',action='store_true');a,extra=p.parse_known_args()
 if a.command in ['speech','generate-audio']:
  module='speech.py' if a.command=='speech' else 'generate_audio.py';extra=extra[1:] if extra[:1]==['--'] else extra
  return subprocess.call([sys.executable,str(HERE/'scripts'/module),a.project]+extra)
 if extra:p.error('Unexpected arguments: '+' '.join(extra))
 from project import validate
 if a.command=='validate':result=validate(a.project,not a.allow_missing_generated_assets);result={'valid':True,'title':result['title']}
 elif a.command=='plan':
  from plan import plan;result=plan(a.project)
 elif a.command=='crop':
  from crop import crop;result=crop(a.project)
 elif a.command=='mix':
  validate(a.project)
  from mix_audio import build;result=build(a.project)[0]
 elif a.command=='render':
  from render import render;result=render(a.project,a.mode)
 elif a.command=='verify':
  validate(a.project)
  from verify import validate as verify;result=verify(a.project)
 elif a.command=='package':
  from package import package;result=package(a.project)
 print(json.dumps(result,indent=2));return 0
if __name__=='__main__':
 try:raise SystemExit(main())
 except (ValueError,FileNotFoundError,FileExistsError,KeyError) as e:print('ERROR:',e,file=sys.stderr);raise SystemExit(2)
