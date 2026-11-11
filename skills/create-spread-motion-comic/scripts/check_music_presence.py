#!/usr/bin/env python3
"""Fail on quiet scored music after final gain/limiting. Not a perceptual test."""
import argparse,json,math
import numpy as np

def audit(samples,sr,floor=-33,window=3.0,exceptions=()):
    x=np.asarray(samples,dtype=float)
    if x.ndim==1:x=x[:,None]
    if x.ndim!=2 or not x.size or sr<=0 or window<=0 or not np.isfinite(x).all():
        raise ValueError("missing, empty or nonfinite audio")
    duration=len(x)/sr
    for e in exceptions:
        if not (0<=e["start"]<e["end"]<=duration and e.get("reason")):
            raise ValueError("invalid intentional-silence exception")
    n=max(1,round(window*sr)); rows=[]
    for i in range(0,len(x),n):
        a=i/sr;b=min(len(x),i+n)/sr
        if b-a<min(0.5,window/2):continue
        rms=float(np.sqrt(np.mean(x[i:i+n]**2)))
        db=20*math.log10(max(rms,1e-12))
        exempt=any(e["start"]<=a and e["end"]>=b for e in exceptions)
        rows.append({"start":a,"end":b,"rms_dbfs":db,"exception":exempt,"pass":exempt or db>=floor})
    if not rows:raise ValueError("audio too short for configured windows")
    return {"pass":all(r["pass"] for r in rows),"floor_dbfs":floor,"window_seconds":window,"listeningVerified":False,"windows":rows}
if __name__=="__main__":
    import soundfile as sf
    p=argparse.ArgumentParser();p.add_argument("music_stem");p.add_argument("--floor",type=float,default=-33);p.add_argument("--window",type=float,default=3);p.add_argument("--exceptions");p.add_argument("--output")
    a=p.parse_args();x,sr=sf.read(a.music_stem);ex=json.load(open(a.exceptions)) if a.exceptions else []
    result=audit(x,sr,a.floor,a.window,ex);text=json.dumps(result,indent=2)
    if a.output:open(a.output,"w").write(text+"\n")
    else:print(text)
    raise SystemExit(0 if result["pass"] else 1)
