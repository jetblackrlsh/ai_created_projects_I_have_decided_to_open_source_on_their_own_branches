/* Export deterministic canvas frames. Requires installed playwright and ffmpeg. */
const fs=require('fs'),path=require('path'),os=require('os');
const {pathToFileURL}=require('url');const {spawnSync}=require('child_process');
async function main(){
 const argv=process.argv.slice(2);let mode='fast';const mi=argv.indexOf('--mode');
 if(mi>=0){mode=argv[mi+1];argv.splice(mi,2)}
 if(!['fast','full'].includes(mode))throw Error('Mode must be fast or full');
 const defaults=mode==='full'?['24','1920','1080']:['6','640','360'];
 const [input,output,seconds='8',fps=defaults[0],width=defaults[1],height=defaults[2]]=argv;
 if(!input||!output)throw Error('Usage: node render_frames.cjs input.html output.mp4 [seconds fps width height] [--mode fast|full]');
 const S=+seconds,F=+fps,W=+width,H=+height;
 if(![S,F,W,H].every(n=>Number.isFinite(n)&&n>0)||W%2||H%2)throw Error('Positive sizes/rate/duration and even dimensions required');
 if(fs.existsSync(output))throw Error('Refusing to overwrite existing output');
 const {chromium}=require('playwright');const dir=fs.mkdtempSync(path.join(os.tmpdir(),'canvas-glsl-'));let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});const page=await browser.newPage({viewport:{width:W,height:H}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(input)).href);await page.waitForFunction(()=>window.artInfo&&window.renderAt);
  const info=await page.evaluate(({mode,W,H})=>{
   if(window.setRenderMode)window.setRenderMode(W===1920&&H===1080?'full':mode);
   return window.artInfo;
  },{mode,W,H});
  if(info.width!==W||info.height!==H||!info.glsl)throw Error('Canvas dimensions mismatch or GLSL unavailable: '+JSON.stringify(info));
  for(let i=0;i<Math.round(S*F);i++){
   const data=await page.evaluate(t=>{window.renderAt(t);return document.getElementById('art').toDataURL('image/png').split(',')[1]},i/F);
   if(errors.length)throw Error(errors.join('\n'));
   fs.writeFileSync(path.join(dir,String(i).padStart(6,'0')+'.png'),Buffer.from(data,'base64'));
  }
  const result=spawnSync('ffmpeg',['-v','error','-n','-framerate',String(F),'-i',path.join(dir,'%06d.png'),'-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',path.resolve(output)],{stdio:'inherit'});
  if(result.status!==0)throw Error('ffmpeg failed: '+(result.error||result.status));
  console.log(JSON.stringify({output:path.resolve(output),frames:Math.round(S*F),width:W,height:H,fps:F}));
 }finally{if(browser)await browser.close();fs.rmSync(dir,{recursive:true,force:true});}
}
main().catch(e=>{console.error(e);process.exitCode=1});
