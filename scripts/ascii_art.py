#!/usr/bin/env python3
"""Convert images to editable ASCII/RGB; apply bounded patches without redrawing."""
import argparse, hashlib, json, pathlib, time, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont
RAMP=' .,:;irsXA253hMHGS#9B&@'

def digest(p): return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def save(p,x): pathlib.Path(p).write_text(json.dumps(x,indent=2)+'\n')
def font_path(value=None):
    if value: return value
    for p in ['/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf','/usr/share/fonts/dejavu/DejaVuSansMono-Bold.ttf']:
        if pathlib.Path(p).is_file(): return p
    raise ValueError('Pass --font pointing to a licensed monospace TTF')
def load(stem):
    stem=str(stem); rows=pathlib.Path(stem+'.txt').read_text().splitlines()
    if not rows or not rows[0] or len(set(map(len,rows)))!=1: raise ValueError('Rectangular nonempty grid required')
    if any(not 32<=ord(ch)<=126 for row in rows for ch in row): raise ValueError('Printable ASCII only')
    raw=json.loads(pathlib.Path(stem+'.colors.json').read_text())
    c=np.asarray(raw)
    if c.shape!=(len(rows),len(rows[0]),3) or c.dtype.kind not in 'iu' or np.any(c<0) or np.any(c>255): raise ValueError('RGB shape/range invalid')
    return np.array([list(r) for r in rows]),c.astype(np.uint8)
def render(g,c,font):
    # Every glyph is clipped to its own cell: a local edit cannot bleed into a neighbor.
    im=Image.new('RGB',(g.shape[1]*8,g.shape[0]*16),(12,17,25)); f=ImageFont.truetype(font,14)
    for y,row in enumerate(g):
        for x,ch in enumerate(row):
            cell=Image.new('RGB',(8,16),(12,17,25)); ImageDraw.Draw(cell).text((0,0),str(ch),font=f,fill=tuple(map(int,c[y,x])))
            im.paste(cell,(x*8,y*16))
    return im

def write(stem,g,c,font):
    stem=pathlib.Path(stem); stem.parent.mkdir(parents=True,exist_ok=True)
    for ext in ['.txt','.colors.json','.png','.report.json']:
        if pathlib.Path(str(stem)+ext).exists(): raise ValueError('Preserve versions: output exists '+str(stem)+ext)
    pathlib.Path(str(stem)+'.txt').write_text('\n'.join(''.join(r) for r in g)+'\n')
    save(str(stem)+'.colors.json',c.tolist()); im=render(g,c,font); im.save(str(stem)+'.png')
    gg,cc=load(stem)
    if not np.array_equal(np.asarray(im),np.asarray(render(gg,cc,font))): raise ValueError('Roundtrip failed')
    return im

def main():
    a=argparse.ArgumentParser(description=__doc__); sub=a.add_subparsers(dest='cmd',required=True)
    q=sub.add_parser('convert');q.add_argument('image');q.add_argument('output');q.add_argument('--columns',type=int,default=120);q.add_argument('--rows',type=int,default=60);q.add_argument('--font')
    q=sub.add_parser('patch');q.add_argument('input');q.add_argument('patch');q.add_argument('output');q.add_argument('--font')
    q=sub.add_parser('render');q.add_argument('input');q.add_argument('output');q.add_argument('--font')
    v=a.parse_args();t=time.perf_counter();font=font_path(v.font)
    if v.cmd=='convert':
        if not 8<=v.columns<=240 or not 4<=v.rows<=120: raise ValueError('Grid bounds 8..240 by 4..120')
        with Image.open(v.image) as src:
            im=src.convert('RGB'); small=np.asarray(im.resize((v.columns,v.rows),Image.Resampling.LANCZOS)); gray=np.asarray(im.convert('L').resize((v.columns,v.rows),Image.Resampling.LANCZOS))
        g=np.array(list(RAMP))[(gray.astype(float)/255*(len(RAMP)-1)).astype(int)]; c=np.clip(small.astype(float)*1.1+28,0,255).astype(np.uint8)
        write(v.output,g,c,font);report={'source_sha256':digest(v.image),'grid':[v.columns,v.rows],'changed_cells':0,'roundtrip_identical':True,'baseline_stem':pathlib.Path(v.output).name,'baseline_txt_sha256':digest(v.output+'.txt'),'baseline_colors_sha256':digest(v.output+'.colors.json'),'rois':[]}
    elif v.cmd=='patch':
        g,c=load(v.input); spec=json.loads(pathlib.Path(v.patch).read_text()); h,w=g.shape
        previous=json.loads(pathlib.Path(v.input+'.report.json').read_text())
        if previous.get('font_sha256')!=digest(font): raise ValueError('Patch must preserve original font')
        if not np.array_equal(np.asarray(Image.open(v.input+'.png').convert('RGB')),np.asarray(render(g,c,font))): raise ValueError('Input rendered PNG differs from saved text/colors')
        baseline=(pathlib.Path(v.input).parent/previous['baseline_stem']).resolve();bg,bc=load(baseline)
        if bg.shape!=g.shape: raise ValueError('Baseline dimensions differ')
        if digest(str(baseline)+'.txt')!=previous['baseline_txt_sha256'] or digest(str(baseline)+'.colors.json')!=previous['baseline_colors_sha256']: raise ValueError('Immutable baseline changed')
        if spec.get('before_txt_sha256')!=digest(v.input+'.txt') or spec.get('before_colors_sha256')!=digest(v.input+'.colors.json'): raise ValueError('Patch preimage hashes differ')
        rois=spec.get('rois',[]); mask=np.zeros((h,w),bool); aggregate=np.zeros((h,w),bool)
        for x0,y0,x1,y1 in previous.get('rois',[]): aggregate[y0:y1,x0:x1]=True
        if not rois: raise ValueError('Predeclared ROIs required')
        for roi in rois:
            if len(roi)!=4 or any(type(x)!=int for x in roi): raise ValueError('Integer half-open ROIs required')
            x0,y0,x1,y1=roi
            if not 0<=x0<x1<=w or not 0<=y0<y1<=h: raise ValueError('ROI out of bounds')
            mask[y0:y1,x0:x1]=True
        # Fixed guardrail prevents broad redraws disguised as patches.
        if np.any(((g!=bg)|np.any(c!=bc,axis=2))[~aggregate]): raise ValueError('Input has undeclared changes outside previous ROIs')
        aggregate |= mask
        if aggregate.sum()>max(1,int(w*h*.05)): raise ValueError('ROIs exceed 5% local patch budget; accept remaining flaw')
        ng=g.copy();nc=c.copy();seen=set()
        for p in spec.get('cells',[]):
            x,y=p['x'],p['y']
            if type(x)!=int or type(y)!=int or not 0<=x<w or not 0<=y<h or not mask[y,x] or (x,y) in seen: raise ValueError('Cell outside ROI, invalid, or duplicated')
            seen.add((x,y));ch=p['char'];rgb=p['rgb']
            if not isinstance(ch,str) or len(ch)!=1 or not 32<=ord(ch)<=126: raise ValueError('One printable ASCII char required')
            if not isinstance(rgb,list) or len(rgb)!=3 or any(type(z)!=int or not 0<=z<=255 for z in rgb): raise ValueError('Invalid RGB')
            ng[y,x]=ch;nc[y,x]=rgb
        changed=(ng!=g)|np.any(nc!=c,axis=2)
        totalchanged=(ng!=bg)|np.any(nc!=bc,axis=2)
        if totalchanged.sum()>max(1,int(w*h*.02)): raise ValueError('Changes exceed 2% local budget; never redraw')
        if np.any(changed[~mask]): raise ValueError('Outside-grid mutation')
        before=render(g,c,font);after=render(ng,nc,font);pixelmask=np.repeat(np.repeat(mask,16,axis=0),8,axis=1)
        if np.any(np.asarray(before)[~pixelmask]!=np.asarray(after)[~pixelmask]): raise ValueError('Outside-ROI pixels changed')
        write(v.output,ng,nc,font);report={'input_txt_sha256':digest(v.input+'.txt'),'patch_sha256':digest(v.patch),'source_sha256':previous.get('source_sha256'),'baseline_stem':os.path.relpath(baseline,pathlib.Path(v.output).parent.resolve()),'rois':previous.get('rois',[])+rois,'aggregate_changed_cells':int(totalchanged.sum()),'baseline_txt_sha256':previous['baseline_txt_sha256'],'baseline_colors_sha256':previous['baseline_colors_sha256'],'changed_cells':int(changed.sum()),'changed_fraction':float(changed.mean()),'outside_roi_characters_rgb_pixels_identical':True,'roundtrip_identical':True}
    else:
        g,c=load(v.input)
        if pathlib.Path(v.output).exists(): raise ValueError('Output exists')
        render(g,c,font).save(v.output); return
    report.update(font_sha256=digest(font),elapsed_seconds=time.perf_counter()-t)
    save(v.output+'.report.json',report);print(json.dumps(report))
if __name__=='__main__': main()
