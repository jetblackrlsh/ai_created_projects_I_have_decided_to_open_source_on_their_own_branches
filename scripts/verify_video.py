#!/usr/bin/env python3
"""Verify a rendered constant-frame-rate H.264 video without guessing metadata."""
import argparse,json,subprocess
from fractions import Fraction
p=argparse.ArgumentParser();p.add_argument('video');p.add_argument('--width',type=int,default=1920);p.add_argument('--height',type=int,default=1080);p.add_argument('--fps',type=float,default=24);p.add_argument('--seconds',type=float,required=True);a=p.parse_args()
r=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-count_frames','-show_entries','stream=codec_name,width,height,avg_frame_rate,nb_read_frames,duration,pix_fmt','-of','json',a.video]))
s=r['streams'][0]; expected=round(a.seconds*a.fps)
checks={'codec':s['codec_name']=='h264','dimensions':(s['width'],s['height'])==(a.width,a.height),'frame_rate':abs(float(Fraction(s['avg_frame_rate']))-a.fps)<1e-6,'frame_count':int(s['nb_read_frames'])==expected,'duration':abs(float(s['duration'])-expected/a.fps)<1/a.fps,'pixel_format':s['pix_fmt']=='yuv420p'}
print(json.dumps({'checks':checks,'actual':s,'expected_frames':expected},indent=2))
raise SystemExit(0 if all(checks.values()) else 1)
