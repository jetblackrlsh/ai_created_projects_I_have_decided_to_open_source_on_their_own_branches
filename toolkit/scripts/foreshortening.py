"""True world-space construction mannequins; not finished anatomical figures."""
import math,copy
from world import Camera,box,cylinder,sphere,sub,dot,cross,norm,render_faces

def tube(id,a,b,radius,fill='#b0c6cf'):
 axis=norm(sub(b,a));ref=(0,0,1) if abs(axis[2])<.95 else (1,0,0);u=norm(cross(axis,ref));v=cross(u,axis);center=tuple((x+y)/2 for x,y in zip(a,b));length=math.sqrt(dot(sub(b,a),sub(b,a)))
 faces=cylinder(id,(0,0,0),radius,length,fill)
 for f in faces:f['points']=[tuple(center[i]+p[0]*u[i]+p[1]*axis[i]+p[2]*v[i]for i in range(3))for p in f['points']]
 return faces

def poses(name='stand'):
 j={'hipL':[-.65,4.1,0],'hipR':[.65,4.1,0],'kneeL':[-.65,2.2,0],'kneeR':[.65,2.2,0],'ankleL':[-.65,.35,0],'ankleR':[.65,.35,0],'shoulderL':[-1.15,6.7,0],'shoulderR':[1.15,6.7,0],'elbowL':[-1.5,5.2,0],'elbowR':[1.5,5.2,0],'wristL':[-1.5,3.8,0],'wristR':[1.5,3.8,0],'neck':[0,7.05,0],'head':[0,7.8,0],'rib':[0,6,0],'pelvis':[0,4.1,0]}
 if name=='reach':j.update(shoulderR=[1.15,6.6,0],elbowR=[1.3,6.5,1.5],wristR=[1.35,6.5,3.0],elbowL=[-1.8,5.5,0],wristL=[-1.2,4.8,.7],kneeR=[.7,2.2,.7],ankleR=[.7,.35,1.2])
 if name=='seated':
  for k in ['hipL','hipR','pelvis','rib','shoulderL','shoulderR','neck','head','elbowL','elbowR','wristL','wristR']:j[k][1]-=1.8
  j.update(kneeL=[-.65,2.2,2],kneeR=[.65,2.2,2],ankleL=[-.65,.35,2.1],ankleR=[.65,.35,2.1],elbowL=[-1.4,3.5,.8],wristL=[-.8,2.5,1.7],elbowR=[1.5,3.5,.8],wristR=[.8,2.5,1.7])
 if name=='charge':j.update(rib=[0,5.7,.8],neck=[0,6.8,1.2],head=[0,7.55,1.35],shoulderL=[-1.1,6.4,.8],shoulderR=[1.1,6.4,.8],elbowL=[-1.6,5.4,1.4],wristL=[-1.5,6.1,2.5],elbowR=[1.9,5.8,-.3],wristR=[2.2,6.6,-.8],kneeL=[-.65,3.3,1.7],ankleL=[-.65,1.7,2.2],kneeR=[.65,2.3,-.5],ankleR=[.65,.8,-1.3])
 if name=='fly':
  for k,p in j.items():j[k]=[p[0],4+p[2],p[1]-4]
  j.update(elbowL=[-1.5,4,4.2],wristL=[-1.6,4,5.8],elbowR=[2,4,2.4],wristR=[2.5,4,3.7],kneeR=[.8,4.7,-1],ankleR=[.8,5.4,-2.5])
 return j

def figure_faces(id='figure',pose='stand',joints=None,offset=(0,0,0),scale=1,color='#adc6cf'):
 j=copy.deepcopy(joints or poses(pose));faces=[]
 def B(tag,c,s,fill=color):faces.extend(box(id+'-'+tag,c,s,fill))
 B('rib',j['rib'],(2.2,2.1,1.05));B('pelvis',j['pelvis'],(1.65,.8,1.1),'#a99476');B('head',j['head'],(.9,1.2,.9),'#d9c9aa')
 faces+=tube(id+'-neck',j['neck'],j['head'],.28,'#c8b28c')
 for side in ['L','R']:
  for a,b,r in [('shoulder','elbow',.33),('elbow','wrist',.25),('hip','knee',.43),('knee','ankle',.3)]:faces+=tube(id+'-'+side+'-'+a,j[a+side],j[b+side],r,color)
  for joint in ['elbow','knee']:faces+=sphere(id+'-'+joint+side,j[joint+side],.33,'#c5ac83',12)
  B('hand'+side,j['wrist'+side],(.65,.7,.5),'#cfba93');p=j['ankle'+side];B('foot'+side,[p[0],p[1]-.2,p[2]+.3],(.65,.3,1.1),'#728d9e')
 for f in faces:f['points']=[tuple(p[i]*scale+offset[i]for i in range(3))for p in f['points']]
 return faces

def render_figure(o):
 w=o.get('width',600);h=o.get('height',500);cfg=o.get('camera',{});cam=Camera(tuple(cfg.get('eye',[12,10,18])),tuple(cfg.get('target',[0,4,0])),w,h,cfg.get('fov',40))
 return render_faces(figure_faces(o.get('id','figure'),o.get('pose','stand'),o.get('joints'),o.get('offset',[0,0,0]),o.get('scale',1),o.get('color','#adc6cf')),cam)
