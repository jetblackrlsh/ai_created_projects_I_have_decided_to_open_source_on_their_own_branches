const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto');
const {createCanvas}=require('@napi-rs/canvas');
const path=require('path');const root=path.resolve(__dirname,'..');
const golden={'0':'fe1a06480b26f6b0f1f75942d2abf9b547424136f25ef1b0b6893a7ba5b264fe','1':'9c99a48bbaedb56d2c85e2493ef79f6103e4206d7bd1be4aed2ca51af9af44de','7.25':'2ced5d7882500194640eebc563b29dfdd5599fec3edd6124d42da8da79d95b49'};
function load(file){let canvases=[],controls={status:{},'render-mode':{value:'',addEventListener(t,f){this.listener=f}}},upload;
const gl=new Proxy({getShaderParameter:()=>true,getProgramParameter:()=>true,getError:()=>0,NO_ERROR:0,texImage2D(...args){upload=args.at(-1)}},{get(o,k){return k in o?o[k]:(()=>{})}});
const art=createCanvas(1920,1080);art.getContext=()=>gl;controls.art=art;
const context={window:{},location:{search:''},URLSearchParams,document:{getElementById:id=>controls[id],createElement(){const c=createCanvas(1,1);canvases.push(c);return c}}};vm.createContext(context);vm.runInContext(fs.readFileSync(file,'utf8').match(/<script>([\s\S]*?)<\/script>/)[1],context);
return {context,controls,image:()=>Buffer.from(upload.data())};}
const updated=load(root+'/assets/starter.html');
assert.equal(updated.context.window.artInfo.width,640);assert.equal(updated.context.window.artInfo.fps,6);
updated.context.window.setRenderMode('full');assert.equal(updated.context.window.artInfo.width,1920);assert.equal(updated.context.window.artInfo.fps,24);
for(const t of [0,1,7.25]){updated.context.window.renderAt(t);assert.equal(crypto.createHash('sha256').update(updated.image()).digest('hex'),golden[t],`Full resolution scene changed at ${t}`)}
updated.controls['render-mode'].listener({target:{value:'fast'}});assert.equal(updated.context.window.artInfo.width,640);
updated.context.window.renderAt(2);let a=updated.image();updated.context.window.renderAt(2);assert.deepEqual(a,updated.image());
assert.throws(()=>updated.context.window.setRenderMode('bad'));
const shaderHashes=[...fs.readFileSync(root+'/assets/starter.html','utf8').matchAll(/const (VERTEX|FRAGMENT)=`([^`]+)`/g)].map(x=>crypto.createHash('sha256').update(x[2]).digest('hex'));
assert.deepEqual(shaderHashes,['9126e1bc43c1d3bd905dddf6dffafe0c8139b2675e80c76d29b18f868c6151bc', 'a15f8814df5e01631da48545b1395aa52b889c49223e249136baa930c2fa6676']);
console.log('PASS: default fast, full switch, control switch, repeat determinism, invalid mode, exact full baseline Canvas pixels and unchanged shader bytes. WebGL stubbed here; real EGL tested separately.');
