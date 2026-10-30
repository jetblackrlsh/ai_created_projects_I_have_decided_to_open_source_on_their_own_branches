#!/usr/bin/env python3
"""Linux process-group RSS/wall monitor; advisory sampled RSS, not kernel hard cap."""
import argparse,json,os,signal,subprocess,time
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--report',required=True);p.add_argument('--seconds',type=float,default=600);p.add_argument('--rss-mib',type=float,default=4500);p.add_argument('command',nargs=argparse.REMAINDER);a=p.parse_args()
cmd=a.command[1:] if a.command[:1]==['--'] else a.command
if not cmd or a.seconds<=0 or a.rss_mib<=0:raise ValueError('Command and positive bounds required')
report=Path(a.report)
if report.exists():raise ValueError('Report exists')
report.parent.mkdir(parents=True,exist_ok=True);start=time.monotonic();peak=0;reason=None
with report.with_suffix('.stdout').open('x') as out,report.with_suffix('.stderr').open('x') as err:
 child=subprocess.Popen(cmd,stdout=out,stderr=err,start_new_session=True)
 try:
  while child.poll() is None:
   rss=0
   for entry in Path('/proc').glob('[0-9]*'):
    try:
     if os.getpgid(int(entry.name))==child.pid:
      rows=(entry/'status').read_text().splitlines();rss+=int(next(x for x in rows if x.startswith('VmRSS:')).split()[1])
    except (ProcessLookupError,PermissionError,FileNotFoundError,StopIteration):pass
   peak=max(peak,rss)
   if rss>a.rss_mib*1024:reason='sampled process-group RSS exceeded'
   if time.monotonic()-start>a.seconds:reason='wall timeout'
   if reason:
    os.killpg(child.pid,signal.SIGTERM)
    try:child.wait(timeout=3)
    except subprocess.TimeoutExpired:os.killpg(child.pid,signal.SIGKILL);child.wait()
    break
   time.sleep(.1)
 finally:
  if child.poll() is None:os.killpg(child.pid,signal.SIGKILL);child.wait()
 result=dict(command=cmd,seconds=time.monotonic()-start,peakProcessGroupRSSKiB=peak,exitCode=child.returncode,stoppedReason=reason)
 report.write_text(json.dumps(result,indent=2));print(json.dumps(result))
raise SystemExit(child.returncode if not reason else 124)
