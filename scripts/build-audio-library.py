"""Rebundle user-created public music and rebuild original deterministic SFX."""
import pathlib,math,struct,wave,random,json,hashlib,base64,subprocess
R=pathlib.Path(__file__).resolve().parents[1];assets=[];rate=24000
for name in ['Anger','Determination','Playfulness','Fear','Nostalgia','Tranquility','Excitement','Suspense','Sorrow','Joy']:
 out=R/'library'/(name+'.mp3');raw=out.read_bytes();meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-of','json',str(out)]));actual=meta['format']['format_name'];mime='audio/mp4' if 'mp4' in actual else 'audio/mpeg';dur=float(meta['format']['duration'])
 assets.append(dict(id='music/'+name,name=name,kind='music',available=True,duration=dur,data='data:'+mime+';base64,'+base64.b64encode(raw).decode(),mime=mime,file=out.name,sha256=hashlib.sha256(raw).hexdigest(),provenance={'source':'Original music by Jet Black','author':'Jet Black','rights':'CC0 dedication of contributor-owned original music; public redistribution explicitly authorized','formatNote':'Original filename extension retained; MIME reflects detected container.'}))
def synth(kind,dur):
 rng=random.Random(20261020+sum(map(ord,kind)));buf=[];low=0
 for i in range(round(rate*dur)):
  t=i/rate;n=rng.uniform(-1,1);low=.94*low+.06*n
  if kind=='metal-step':v=(.48*math.sin(2*math.pi*95*t)+.24*n)*math.exp(-t*22)
  elif kind=='blade-clang':v=(.26*math.sin(2*math.pi*617*t)+.22*math.sin(2*math.pi*943*t)+.16*math.sin(2*math.pi*1477*t))*math.exp(-t*5)+.18*n*math.exp(-t*55)
  elif kind=='soft-impact':v=(.5*math.sin(2*math.pi*(90*t-25*t*t))+.2*n)*math.exp(-t*14)
  elif kind=='panel-creak':v=(.18*math.sin(2*math.pi*(160*t+26*math.sin(12*t)))+.8*low)*math.sin(math.pi*t/dur)**2
  elif kind=='polarity-click':v=(.35*n*math.exp(-t*80)+.26*math.sin(2*math.pi*(780*t-500*t*t))*math.exp(-t*10))
  elif kind=='servo':v=(.2*math.sin(2*math.pi*(130*t+100*t*t))+.12*math.sin(2*math.pi*480*t)+.3*low)*math.sin(math.pi*t/dur)**2
  elif kind=='furnace':v=(1.5*low+.08*math.sin(2*math.pi*48*t))*math.sin(math.pi*t/dur)**.5
  buf.append(v)
 peak=max(abs(v)for v in buf);return b''.join(struct.pack('<h',round(v/peak*.68*32767))for v in buf)
for name,dur in [('metal-step',.32),('blade-clang',.8),('soft-impact',.4),('panel-creak',.75),('polarity-click',.38),('servo',.75),('furnace',2.8)]:
 out=R/'library'/(name+'.wav')
 with wave.open(str(out),'wb')as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(rate);f.writeframes(synth(name,dur))
 raw=out.read_bytes();assets.append(dict(id='sfx/'+name,name=name.replace('-',' ').title(),kind='sfx',available=True,duration=dur,mime='audio/wav',file=out.name,data='data:audio/wav;base64,'+base64.b64encode(raw).decode(),sha256=hashlib.sha256(raw).hexdigest(),provenance={'source':'Original local deterministic PCM synthesis','generator':'scripts/build-audio-library.py','seedScheme':'20261020 + sum(codepoints(effect name))','rights':'Original deterministic PCM synthesis; project-contributed CC0 asset. No outside recording.'}))
lib=dict(format='jet2d-audio-library',version=1,title='Jet Black · Music & Action Effects',assets=assets)
(R/'app/library.js').write_text('window.AUDIO_LIBRARY='+json.dumps(lib,separators=(',',':'))+';\n')
(R/'library/library.jet-audio-library.json').write_text(json.dumps(lib,separators=(',',':')))
manifest={**lib,'assets':[{k:v for k,v in a.items()if k!='data'}for a in assets]};(R/'library/manifest.json').write_text(json.dumps(manifest,indent=2));print([(a['id'],a['duration'])for a in assets])
