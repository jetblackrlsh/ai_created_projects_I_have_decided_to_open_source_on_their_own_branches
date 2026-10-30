"""Verify both exported movies with ffprobe and complete decode; inspect atempo pitch."""
import json,subprocess,pathlib,sys,wave,math,struct,tempfile
r=pathlib.Path(sys.argv[1]).resolve();report={}
for name in ['normal-speed.mp4','2x.mp4']:
 f=r/name
 data=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(f)]))
 subprocess.run(['ffmpeg','-v','error','-i',str(f),'-f','null','-'],check=True)
 report[name]={'duration':float(data['format']['duration']),'fullDecode':'passed','streams':[{k:s.get(k) for k in ['codec_name','codec_type','width','height','r_frame_rate','duration','nb_frames']} for s in data['streams']]}
assert abs(report['normal-speed.mp4']['duration']/2-report['2x.mp4']['duration'])<.1
normalV=next(s for s in report['normal-speed.mp4']['streams'] if s['codec_type']=='video');fastV=next(s for s in report['2x.mp4']['streams'] if s['codec_type']=='video')
assert int(normalV['nb_frames'])==int(fastV['nb_frames']),'2x should preserve all frames'
# Independent known-frequency fixture verifies the export's exact tempo filter.
with tempfile.TemporaryDirectory() as tmp:
 tmp=pathlib.Path(tmp);rate=24000
 with wave.open(str(tmp/'tone.wav'),'wb') as w:
  w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes(b''.join(struct.pack('<h',int(10000*math.sin(2*math.pi*660*i/rate)))for i in range(rate*2)))
 subprocess.run(['ffmpeg','-v','error','-i',str(tmp/'tone.wav'),'-af','atempo=2',str(tmp/'fast.wav')],check=True)
 with wave.open(str(tmp/'fast.wav')) as w:raw=w.readframes(w.getnframes());n=w.getnframes();sr=w.getframerate()
 samples=struct.unpack('<'+'h'*n,raw);crossings=sum(samples[i]<=0<samples[i+1]for i in range(1000,n-1001));hz=crossings/((n-2001)/sr)
 assert abs(hz-660)<3,(hz,n/sr)
 report['tempoFixture']={'filter':'atempo=2','inputHz':660,'outputMeasuredHz':hz,'outputSeconds':n/sr,'passed':True}
(r/'decode-and-tempo-verification.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
