import time
PROCESS_START=time.perf_counter()
import ctypes as C,os
os.environ['LIBGL_ALWAYS_SOFTWARE']='true'
from PIL import Image
import numpy as np,json
import argparse,math
ap=argparse.ArgumentParser(description='Render compatible seven-layer story Canvas + exact GLSL. Fast is default.')
ap.add_argument('project',type=str)
ap.add_argument('--mode',choices=['fast','full'],default='fast')
ap.add_argument('--start',type=float,default=0)
ap.add_argument('--seconds',type=float)
ap.add_argument('--output',default='video-only.mp4')
args=ap.parse_args()
W,H,FPS=(640,360,6) if args.mode=='fast' else (1920,1080,24)
os.environ['CANVAS_RENDER_MODE']=args.mode
from pathlib import Path
r=Path(args.project).resolve()
if args.seconds is None:args.seconds=json.loads((r/'audio/timeline.json').read_text())['total_duration']-args.start
if not math.isfinite(args.seconds) or args.seconds<=0 or not math.isfinite(args.start) or args.start<0:ap.error('Positive finite duration and nonnegative start required')
N=round(args.seconds*FPS)
if N<1:ap.error('Duration must produce at least one frame')
output=Path(args.output).resolve()
if output.exists():ap.error('Refusing to overwrite existing output')
output.parent.mkdir(parents=True,exist_ok=True)
E=C.CDLL('libEGL.so.1');E.eglGetProcAddress.restype=C.c_void_p;E.eglGetProcAddress.argtypes=[C.c_char_p]
def egl(name,restype,args):
 f=getattr(E,name);f.restype=restype;f.argtypes=args;return f
P=C.c_void_p;I=C.c_int;U=C.c_uint;F=C.c_float
getPlatform=C.CFUNCTYPE(P,U,P,C.POINTER(I))(E.eglGetProcAddress(b'eglGetPlatformDisplayEXT'))
d=getPlatform(0x31DD,None,None)
init=egl('eglInitialize',U,[P,C.POINTER(I),C.POINTER(I)])
ma,mi=I(),I();assert init(d,C.byref(ma),C.byref(mi)), 'EGL initialize failed'
assert egl('eglBindAPI',U,[U])(0x30A0)
attrs=(I*15)(0x3033,1,0x3040,4,0x3024,8,0x3023,8,0x3022,8,0x3021,8,0x3038,0,0)
config=P();n=I();assert egl('eglChooseConfig',U,[P,C.POINTER(I),C.POINTER(P),I,C.POINTER(I)])(d,attrs,C.byref(config),1,C.byref(n))
surf=egl('eglCreatePbufferSurface',P,[P,P,C.POINTER(I)])(d,config,(I*5)(0x3057,W,0x3056,H,0x3038))
context=egl('eglCreateContext',P,[P,P,P,C.POINTER(I)])(d,config,None,(I*3)(0x3098,2,0x3038))
assert egl('eglMakeCurrent',U,[P,P,P,P])(d,surf,surf,context)
def gl(name,ret,args):return C.CFUNCTYPE(ret,*args)(E.eglGetProcAddress(name.encode()))
createShader=gl('glCreateShader',U,[U]);shaderSource=gl('glShaderSource',None,[U,I,C.POINTER(C.c_char_p),C.POINTER(I)]);compileShader=gl('glCompileShader',None,[U]);getShaderiv=gl('glGetShaderiv',None,[U,U,C.POINTER(I)])


import subprocess,time,hashlib,argparse
sources={'VERTEX':(r/'src/vertex.glsl').read_text(),'FINAL':(r/'src/fragment.glsl').read_text()}
def program():
 shaders=[]
 for name,kind in [('VERTEX',0x8B31),('FINAL',0x8B30)]:
  s=createShader(kind);ptr=C.c_char_p(sources[name].encode());shaderSource(s,1,C.byref(ptr),None);compileShader(s);ok=I();getShaderiv(s,0x8B81,C.byref(ok));assert ok.value,name+' compile failed';shaders.append(s)
 p=gl('glCreateProgram',U,[])()
 for s in shaders:gl('glAttachShader',None,[U,U])(p,s)
 gl('glLinkProgram',None,[U])(p);ok=I();gl('glGetProgramiv',None,[U,U,C.POINTER(I)])(p,0x8B82,C.byref(ok));assert ok.value,'link failed'
 return p
p=program();gl('glUseProgram',None,[U])(p)
vertices=(F*12)(-1,-1,1,-1,-1,1,-1,1,1,-1,1,1)
vbo=U();gl('glGenBuffers',None,[I,C.POINTER(U)])(1,C.byref(vbo));gl('glBindBuffer',None,[U,U])(0x8892,vbo);gl('glBufferData',None,[U,C.c_ssize_t,P,U])(0x8892,C.sizeof(vertices),C.cast(vertices,P),0x88E4)
loc=gl('glGetAttribLocation',I,[U,C.c_char_p])(p,b'a_position');gl('glEnableVertexAttribArray',None,[U])(loc);gl('glVertexAttribPointer',None,[U,I,U,U,I,P])(loc,2,0x1406,0,0,None)
uniform=gl('glGetUniformLocation',I,[U,C.c_char_p]);u1=gl('glUniform1f',None,[I,F]);u2=gl('glUniform2f',None,[I,F,F])
tex=U();gl('glGenTextures',None,[I,C.POINTER(U)])(1,C.byref(tex));gl('glBindTexture',None,[U,U])(0x0DE1,tex)
for k,v in [(0x2801,0x2601),(0x2800,0x2601),(0x2802,0x812F),(0x2803,0x812F)]:gl('glTexParameteri',None,[U,U,I])(0x0DE1,k,v)
gl('glUniform1i',None,[I,I])(uniform(p,b'u_scene'),0);u2(uniform(p,b'u_resolution'),1920,1080);u1(uniform(p,b'u_glow'),1);u1(uniform(p,b'u_duration'),json.loads((r/'audio/timeline.json').read_text())['total_duration'])
gl('glViewport',None,[I,I,I,I])(0,0,W,H)
upload=gl('glTexImage2D',None,[U,I,I,I,I,I,U,U,P]);draw=gl('glDrawArrays',None,[U,I,I]);read=gl('glReadPixels',None,[I,I,I,I,U,U,P]);out=C.create_string_buffer(W*H*4)
def render(raw,t,glow=1):
 arr=np.frombuffer(raw,np.uint8).reshape(H,W,4)[::-1].copy();upload(0x0DE1,0,0x1908,W,H,0,0x1908,0x1401,arr.ctypes.data_as(P));u1(uniform(p,b'u_time'),t);u1(uniform(p,b'u_glow'),glow);draw(4,0,6);read(0,0,W,H,0x1908,0x1401,C.cast(out,P));return np.frombuffer(out.raw,np.uint8).reshape(H,W,4)[::-1].copy()
delta=None
node=subprocess.Popen(['node',str(Path(__file__).with_name('render_story_canvas.cjs')),str(r),str(args.start),str(N)],stdout=subprocess.PIPE)
ff=subprocess.Popen(['ffmpeg','-n','-hide_banner','-loglevel','error','-f','rawvideo','-pixel_format','rgba','-video_size',f'{W}x{H}','-framerate',str(FPS),'-i','-','-an','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-movflags','+faststart',str(output)],stdin=subprocess.PIPE)
frames=[];start=time.time();setup_seconds=time.perf_counter()-PROCESS_START
try:
 for i in range(N):
  raw=node.stdout.read(W*H*4);assert len(raw)==W*H*4,(i,len(raw));img=render(raw,args.start+i/FPS);ff.stdin.write(img.tobytes())
  if i%240==0:
   name=str(output.with_name(output.stem+f'-frame-{i:04d}.jpg'));Image.fromarray(img).convert('RGB').save(name,quality=94);frames.append(name)
  if i%120==0:print('Rendered',i,'seconds elapsed',round(time.time()-start,1),flush=True)
 ff.stdin.close();assert ff.wait()==0;assert node.wait()==0
finally:
 for process in (node,ff):
  if process.poll() is None:
   process.terminate()
   try:process.wait(timeout=5)
   except subprocess.TimeoutExpired:process.kill();process.wait()
err=gl('glGetError',U,[])();assert err==0
result={'mode':args.mode,'width':W,'height':H,'fps':FPS,'frames':N,'duration':args.seconds,'GLSL':'Exact vertex and fragment shaders compiled, linked and rendered every frame','renderer':gl('glGetString',C.c_char_p,[U])(0x1F01).decode(),'gl_error':err,'shader_uniform_mean_rgba_difference':delta,'canvas_layers':['far','mid','stage','actors','energy','foreground','captions'],'frames_for_visual_inspection':frames,'elapsed_seconds':time.time()-start,'setup_seconds':setup_seconds,'total_seconds':time.perf_counter()-PROCESS_START,'browser_UI':'Not interactively verified; native Canvas and Mesa EGL rendering verified'}
Path(str(output)+'.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
