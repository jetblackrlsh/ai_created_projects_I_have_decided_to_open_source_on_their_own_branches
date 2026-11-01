"""Original silhouette studies of heroic convention, not biological gender rules.
These bodies are authored contours, not front figures squeezed into profiles.
"""
import math,html
from heads import render_head,render_hand
from figures import path,line,limb
INK='#17202b'
def render_body(o):
 p=o.get('id','body');kind=o.get('body','guard');view=o.get('view','front');skin='#efd4b9';suit=o.get('suit','#587887');accent='#cfad67';s='';H=700
 if kind in {'guard','heroine','ordinary'}:
  fem=kind=='heroine';ordinary=kind=='ordinary';w=43 if fem else 48 if ordinary else 68;waist=29 if fem else 39 if ordinary else 36;hip=51 if fem else 40
  ident=dict(hair='long'if fem else 'short',jaw='narrow'if fem else 'broad',build='slim'if fem else 'athletic')
  if view=='profile':
   # Independent sagittal silhouette: chest, abdomen, seat and calf planes.
   s+=path('M -12,304 Q -45,377 -27,470 Q -20,522 -29,639 L -33,680 -15,700 23,700 21,686 -2,674 Q 14,576 11,480 Q 24,389 16,309 Z',suit,2.4)
   s+=path('M 12,306 Q 43,386 22,477 Q 10,539 19,650 L 15,681 45,689 50,700 7,700 -9,686 -7,648 Q -15,541 -2,474 Q -20,388 -18,316 Z',suit,2.4)
   chest=39 if fem else 48 if not ordinary else 34
   s+=path(f'M -9,75 Q -13,95 -27,108 Q -37,145 -23,188 Q -18,228 -28,265 Q -43,287 -24,331 Q -9,343 18,330 Q 32,314 29,292 Q 20,254 21,226 Q 28,193 35,175 Q {chest},157 31,133 L 17,103 13,76 Z',suit,2.6)
   s+=path('M -16,104 Q -29,151 -16,185 Q -9,215 -12,238 L -17,317 -7,337 6,333 8,314 Q 10,238 9,207 Q 20,156 4,117 Z',skin,2)
   s+=path('M -10,131 Q 1,154 -4,181 M -9,205 Q 2,220 -3,243 M -5,280 L -7,313',w=1.2)
   s+=render_hand(dict(id=p+'-hand',x=-2,y=336,scale=.42,pose='open',rotation=180))
   s+=path('M -10,79 L -12,99 18,108 14,76 Z',skin,1.8)
   s+=path('M 22,183 Q 10,196 11,222 M -23,265 Q -5,276 25,270 M 0,468 l 15,6 M 15,516 Q 25,556 17,594',w=1.2)
  else:
   for sg in [-1,1]:
    a=[sg*hip*.62,310];b=[sg*35,500];c=[sg*39,674]
    s+=limb(a,b,c,[31 if fem else 35,18,11],suit,p+str(sg)+'leg',True)
    s+=path(f'M {sg*39-13},668 L {sg*39+12},668  {sg*39+25},691 {sg*39+23},700 {sg*39-19},700 Z',INK,2)
    s+=limb([sg*w,119],[sg*(w+17),231],[sg*(w+10),340],[18 if fem else 25 if not ordinary else 17,12,8],skin,p+str(sg)+'arm')
    s+=render_hand(dict(id=p+str(sg)+'hand',x=sg*(w+10),y=349,scale=.43,pose='open',rotation=180))
   s+=path(f'M -13,76 L -14,94 Q -24,106 {-w},114 Q {-w-5},158 {-w+12},188 Q {-waist},225 {-waist},246 Q {-waist},264 {-hip},294 Q {-hip-5},320 -29,338 L 0,345 29,338 Q {hip+5},320 {hip},294 Q {waist},264 {waist},246 Q {waist},225 {w-12},188 Q {w+5},158 {w},114 Q 24,106 14,94 L 13,76 Z',suit,2.7)
   s+=path('M -13,76 L -14,94 -25,107 Q 0,125 25,107 L 14,94 13,76 Z',skin,1.8)
   if fem:s+=path('M -39,152 Q -26,174 -4,168 M 4,168 Q 26,174 39,152 M -30,202 Q -19,223 -23,240 M 30,202 Q 19,223 23,240',w=1.3)
   else:s+=path(f'M {-w+13},146 Q -23,169 -4,159 M 4,159 Q 23,169 {w-13},146 M -29,199 Q -15,211 -4,205 M 4,205 Q 15,211 29,199',w=1.4)
   s+=path(f'M {-waist},250 Q 0,261 {waist},250 L {waist+2},261 Q 0,274 {-waist-2},261 Z',accent,1.2)
  s+=render_head(dict(id=p+'-head',x=0,y=40,scale=.80,view=view,identity=ident,neck=False))
 elif kind=='rock':
  H=480
  s+=path('M -54,291 L -75,371 -67,442 -95,459 -96,480 -18,480 -8,459 -16,400 8,326 32,400 28,458 36,480 115,480 110,458 77,443 78,367 52,289 Z','#839793',3)
  s+=path('M -55,98 L -105,124 -139,209 -123,281 -91,290 -78,260 -89,206 -66,179 -60,248 -45,308 49,308 64,249 70,176 95,207 83,263 96,290 129,278 145,213 110,128 58,99 Z','#839793',3)
  s+=path('M -39,75 L -54,104 -46,146 -20,164 24,164 49,143 53,105 36,76 Z','#839793',3)
  s+=path('M -32,113 L -12,110 M 12,110 L 32,113 M -5,119 L -7,133 8,133 M -17,145 L 20,145',w=3)
  # Angular interlocking original stone plates, no source character outline.
  for yy,xxs in [(178,[-35,0,35]),(215,[-30,5,34]),(253,[-26,8,29]),(290,[-21,12,29])]:
   for i,x in enumerate(xxs):s+=path(f'M {x-17},{yy-17} L {x+9},{yy-20} {x+20},{yy-3} {x+12},{yy+15} {x-12},{yy+18} {x-20},{yy} Z','none',1.1)
  for x,y in [(-99,169),(103,170),(-105,235),(113,238),(-45,378),(54,380)]:s+=path(f'M {x-17},{y-16} L {x+12},{y-12} {x+20},{y+10} {x-7},{y+21} {x-20},{y+7} Z','none',1.2)
 elif kind=='heavy':
  H=550
  s+=path('M -73,345 Q -87,400 -85,504 L -105,534 -104,550 -28,550 -18,531 -24,454 -5,391 18,452 13,532 25,550 102,550 105,534 84,505 Q 91,403 70,345 Z','#344d62',3)
  s+=path('M -62,105 Q -117,116 -137,175 L -145,297 -122,343 -95,332 -97,271 -89,227 Q -92,302 -75,364 Q 0,391 78,363 Q 95,300 89,228 L 98,276 95,330 122,343 146,299 137,179 Q 119,120 62,105 Z','#ab7958',3)
  s+=path('M -54,111 Q 0,142 54,111 L 66,180 30,203 3,367 -34,199 -70,178 Z','#f4eee1',2)
  s+=path('M -55,112 L -85,150 -49,191 -58,214 3,367 34,212 53,194 83,151 54,112 M -107,180 Q -126,224 -117,271 M 108,180 Q 125,226 117,270 M -49,415 L -45,505 M 52,413 L 48,505',w=1.5)
  s+=render_hand(dict(id=p+'-left-hand',x=-120,y=340,scale=.85,pose='fist',rotation=180));s+=render_hand(dict(id=p+'-right-hand',x=120,y=340,scale=.85,pose='fist',rotation=180))
  s+=render_head(dict(id=p+'-head',x=0,y=65,scale=1.12,identity=dict(shape='pear',hair='bald',age='elder'),neck=False))
 else:raise ValueError('Unsupported body type')
 if o.get('guides'):
  for i in range(10):
   yy=i*80
   if yy>H:break
   s+=line([-115,yy],[115,yy],.65,'#65a5b6');s+=f'<text x="-140" y="{yy+5}" font-size="14" fill="#467888">{i}</text>'
  s+=line([-115,H],[115,H],.65,'#65a5b6')
 return f'<g id="{html.escape(p)}" transform="translate({o.get("x",0)} {o.get("y",0)}) scale({o.get("scale",1)})">{s}</g>'
