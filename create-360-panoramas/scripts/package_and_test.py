#!/usr/bin/env python3
"""Package a 2:1 panorama as a GPano JPEG and render diagnostic spherical views."""
import argparse, json, math
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import map_coordinates

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('image',type=Path); parser.add_argument('output',type=Path)
    args=parser.parse_args(); args.output.mkdir(parents=True,exist_ok=True)
    im=Image.open(args.image).convert('RGB'); w,h=im.size
    if w != 2*h: parser.error(f'expected 2:1 image, got {w}x{h}; do not stretch automatically')
    pixels=np.asarray(im,dtype=np.int16); report={'width':w,'height':h,'seam_mean_absolute_channel_difference':float(np.abs(pixels[:,0]-pixels[:,-1]).mean()),'note':'diagnostic only; inspect seam and poles visually'}
    jpg=args.output/'panorama-360.jpg'; im.save(jpg,quality=96,subsampling=0)
    xml=(f'<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:GPano="http://ns.google.com/photos/1.0/panorama/" GPano:UsePanoramaViewer="True" GPano:ProjectionType="equirectangular" GPano:FullPanoWidthPixels="{w}" GPano:FullPanoHeightPixels="{h}" GPano:CroppedAreaImageWidthPixels="{w}" GPano:CroppedAreaImageHeightPixels="{h}" GPano:CroppedAreaLeftPixels="0" GPano:CroppedAreaTopPixels="0"/></rdf:RDF></x:xmpmeta>').encode()
    data=jpg.read_bytes(); payload=b'http://ns.adobe.com/xap/1.0/\x00'+xml
    jpg.write_bytes(data[:2]+b'\xff\xe1'+(len(payload)+2).to_bytes(2,'big')+payload+data[2:])
    arr=np.asarray(Image.open(jpg)); n=400; xx,yy=np.meshgrid(np.linspace(-1,1,n),np.linspace(1,-1,n)); f=math.tan(math.radians(80)/2); x=xx*f; y=yy*f; z=np.ones_like(x); sheet=Image.new('RGB',(n*3,n*2))
    views=[(0,0,'front'),(90,0,'right'),(180,0,'rear seam'),(-90,0,'left'),(0,70,'up'),(0,-70,'down')]
    for i,(yaw,pitch,label) in enumerate(views):
        p=math.radians(pitch); a=math.radians(yaw); Y=y*math.cos(p)+z*math.sin(p); Z=z*math.cos(p)-y*math.sin(p); X=x*math.cos(a)+Z*math.sin(a); Z2=Z*math.cos(a)-x*math.sin(a)
        lon=np.arctan2(X,Z2); lat=np.arctan2(Y,np.sqrt(X*X+Z2*Z2)); mx=((lon/(2*math.pi)+.5)*w)%w; my=np.clip((.5-lat/math.pi)*h,0,h-1)
        v=np.stack([map_coordinates(arr[:,:,c],[my,mx],order=1,mode='wrap') for c in range(3)],axis=2).astype('uint8'); frame=Image.fromarray(v); ImageDraw.Draw(frame).text((10,10),label,fill='white',stroke_width=2,stroke_fill='black'); sheet.paste(frame,((i%3)*n,(i//3)*n))
    sheet.save(args.output/'projection-contact-sheet.jpg',quality=90); (args.output/'technical-report.json').write_text(json.dumps(report,indent=2)+'\n'); print(json.dumps(report))
if __name__=='__main__': main()
