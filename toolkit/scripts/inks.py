"""Original SVG ink geometry: deterministic digital analogs, not physical brush simulation."""
import math,html,random
INK='#10131c'
def path(d,fill=INK,stroke='none',width=1,id=None):
 return f'<path'+(f' id="{id}"' if id else '')+f' d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"/>'
def stroke(a,b,width=5,bend=0,id='stroke'):
 """Tapered closed quadratic brush silhouette with editable vector control points."""
 dx,dy=b[0]-a[0],b[1]-a[1];ln=math.hypot(dx,dy)
 if ln<.0001:raise ValueError('Stroke requires nonzero length')
 nx,ny=-dy/ln,dx/ln;cx=(a[0]+b[0])/2+nx*bend;cy=(a[1]+b[1])/2+ny*bend
 return path(f'M {a[0]},{a[1]} Q {cx+nx*width},{cy+ny*width} {b[0]},{b[1]} Q {cx-nx*width*.35},{cy-ny*width*.35} {a[0]},{a[1]} Z',id=id)
def feather(x,y,count=14,length=75,step=5,width=3,curve=0,id='feather'):
 return ''.join(stroke([x+curve*math.sin(i/count*math.pi),y+i*step],[x+length*(.45+.55*math.sin((i+.5)/count*math.pi)),y+i*step-8],width=width*(.5+i/count),bend=4,id=f'{id}-{i}')for i in range(count))
def hatch(x,y,w,h,spacing=9,angle=.7,id='hatch'):
 return ''.join(path(f'M {x+i},{y+h} l {h*angle},{-h}','none',INK,1,id=f'{id}-{i}')for i in range(0,int(w),spacing))
def swatch(kind,x=0,y=0,id='swatch'):
 s=''
 if kind<4:s=feather(30,25,count=16,length=78,step=5,width=[2,5,8,3][kind],curve=[0,30,-20,15][kind],id=id)
 elif kind<8:
  for i in range(7):
   yy=22+i*13; xx=25+(i%2)*12
   s+=stroke([xx,yy],[118-(i%3)*8,yy+10],width=8+(kind-4)*3,bend=(-1 if kind%2 else 1)*18,id=f'{id}-{i}')
 elif kind==8:s=feather(20,25,18,100,5,1,0,id)
 elif kind==9:
  rng=random.Random(90)
  for i in range(45):
   a=[25+rng.random()*90,20+rng.random()*90];s+=stroke(a,[a[0]+9,a[1]-3],2,id=f'{id}-{i}')
 elif kind==10:
  s=hatch(20,20,95,95,9,.2,id+'a')+hatch(20,20,95,95,14,-.2,id+'b')
 elif kind==11:
  s=path('M20,20 H125 V115 H20 Z',id=id+'-mass')
  for i in range(9):s+=path(f'M 22,{28+i*10} l 98,-4','none','#fff',1,id=f'{id}-scratch-{i}')
 elif kind==12:
  for i in range(9):s+=stroke([25,25+i*10],[122,32+i*10],width=8-i*.7,bend=7,id=f'{id}-{i}')
 elif kind==13:s=path('M25,25 Q80,0 125,45 L110,120 Q70,80 20,90 Z',id=id+'-base')+path('M40,35 Q72,20 109,50 L96,105 Q65,70 32,75 Z','#fff',id=id+'-correction')
 return f'<g id="{id}" transform="translate({x} {y})">{s}</g>'
def silhouette(x,y,scale=1,id='watcher',lean=0):
 # Original cloaked watchkeeper; no source character likeness.
 d='M0,-52 Q-22,-50 -20,-24 L-13,-6 Q-40,8 -42,47 L-68,139 Q-16,125 0,145 Q24,126 64,139 L39,47 Q32,7 14,-6 L20,-24 Q22,-50 0,-52 Z'
 return f'<g id="{id}" transform="translate({x} {y}) rotate({lean}) scale({scale})">'+path(d)+path('M-10,-31 Q0,-36 11,-31 L7,-24 H-6 Z','#fff')+'</g>'
def scene(mode='balanced',abstract=False,balance=True,id='scene'):
 """Original harbor lookout scene, consistent geometry across ink treatments."""
 s=f'<g id="{id}">';s+=path('M0,0 H480 V300 H0 Z','#fff',INK,2)
 # horizon, pylons, rain awning, deck: same pencil structure in all variants
 if not abstract:
  s+=path('M0,177 H480 M0,244 L480,206 M0,280 L480,225','none',INK,1)
  for x in range(35,480,58):s+=path(f'M{x},176 V298','none',INK,1)
  s+=path('M0,0 L170,0 L117,94 L0,117 Z','none',INK,2)
  s+=path('M309,75 L345,57 L381,77 V206 H309 Z M304,76 H386 M318,56 L345,28 L372,56 Z','none',INK,2)
  for y in [102,138,174]:s+=path(f'M327,{y} h24 v20 h-24 Z','none',INK,1)
  s+=path('M286,210 Q335,182 392,210','none',INK,1)
 if mode=='uniform':
  s+=path('M190,92 Q169,90 170,113 L178,129 Q151,143 147,179 L130,267 Q174,252 190,274 Q215,252 244,267 L230,178 Q227,145 204,129 L212,111 Q214,93 190,92 Z','none',INK,1)
  s+=path('M178,111 H203 M176,150 Q191,172 205,150 M159,190 L140,251 M218,191 L233,252','none',INK,1)
 else:
  s+=silhouette(190,139,.77,id+'-figure')
  # bright face window is focal point; single light from upper left.
  s+=path('M310,76 L329,82 L329,205 H310 Z',id=id+'-tower-shadow')
  s+=path('M347,77 L381,77 V207 H362 L363,112 Z',id=id+'-tower-side')
  s+=path('M0,274 L151,246 L166,256 L0,297 Z',id=id+'-deck-shadow')
  s+=path('M0,0 H170 L160,18 H0 Z',id=id+'-awning')
  if balance:s+=path('M12,131 l35,-9 v52 l-35,9 Z M46,182 l27,-7 v20 l-27,8 Z',id=id+'-balancing-blacks')
 if mode=='overworked':
  s+=hatch(0,1,460,295,6,.05,id+'-noise')
  for i in range(14):s+=stroke([10+i*32,230],[50+i*31,40],7,20,id+'-slash'+str(i))
 if not abstract and mode=='balanced':s+=feather(314,197,7,35,4,2,0,id+'-feather')
 return s+'</g>'
def mood(kind='calm',abstract=False,id='mood'):
 s=path('M0,0 H440 V260 H0 Z','#fff',INK,2)
 if kind=='calm':
  for x in [38,133,228,323]:s+=path(f'M{x},32 h10 v178 h-10 Z')
  for y in [73,187,224]:s+=path(f'M0,{y} H440 v5 H0 Z')
  if not abstract:
   for x in range(15,430,45):s+=path(f'M{x},224 L{x-20},260','none',INK,1)
 elif kind=='chaos':
  for i in range(10):
   a=i*math.pi*.2;x=220+math.cos(a)*130;y=130+math.sin(a)*78
   s+=stroke([x,y],[x+math.sin(a)*45,y-math.cos(a)*30],9,8,id+str(i))
  s+=stroke([0,233],[180,220],10,-7,id+'-sweep')+stroke([270,217],[440,183],10,5,id+'-sweep2')
  if not abstract:
   s+=path('M190,100 L223,70 L259,117 L226,152 Z','none',INK,2)
   for i in range(8):s+=path(f'M{50+i*47},25 l20,17','none',INK,1)
 elif kind=='horror':
  s+=path('M0,0 H150 L90,260 H0 Z M440,0 H330 L360,260 H440 Z')
  s+=silhouette(250,105,.7,id+'-shade')
  if not abstract:s+=path('M154,22 L301,0 V260 M166,55 H286 M159,97 H290 M146,150 H294','none',INK,1)
 else:
  s+=path('M0,225 L440,32 V58 L0,250 Z M58,260 L440,94 V116 L124,260 Z')
  s+=silhouette(241,85,.37,id+'-leaper',-62)
  if not abstract:
   for i in range(9):s+=path(f'M{10+i*32},{128-i*7} l58,-25','none',INK,1)
 return f'<g id="{id}">{s}</g>'
