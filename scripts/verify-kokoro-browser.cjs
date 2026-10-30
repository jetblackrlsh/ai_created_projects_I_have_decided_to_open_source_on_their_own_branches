'use strict';
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'..'),out=path.join(root,'output/kokoro-browser');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.JET2D_CHROME||'/usr/bin/chromium',headless:true,chromiumSandbox:true});
 try{const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+path.join(root,'START.html'));await page.waitForFunction(()=>!!window.VoiceEditor2D);
 assert.equal(await page.locator('#voiceProvider2D').inputValue(),'bundled','Legacy demo must not be changed');
 const snapshot=await page.evaluate(()=>JSON.stringify(Editor.getProject()));
 await page.selectOption('#voiceProvider2D','kokoro');
 assert.equal(await page.locator('#voiceGenerate2D').isDisabled(),true);
 assert.equal(await page.evaluate(()=>JSON.stringify(Editor.getProject())),snapshot,'Provider picker must not mutate existing project');
 await page.evaluate(()=>Editor.load(Studio.blank()));assert.equal(await page.locator('#voiceProvider2D').inputValue(),'kokoro');
 // Existing bundled synthesis remains usable, with genuine bytes.
 await page.selectOption('#voiceProvider2D','bundled');await page.fill('#voiceText2D','A test line.');await page.click('#voiceGenerate2D');
 await page.waitForFunction(()=>VoiceEditor2D.getGenerated()?.duration>0);
 assert.ok((await page.evaluate(()=>VoiceEditor2D.getGenerated())).duration>0);
 const wav=await page.evaluate(()=>Array.from(VoiceTools2D.generate('A test line.','narrator').bytes));
 // Import-path verification uses an explicitly labelled bundled fixture, not a quality claim about Kokoro.
 await page.selectOption('#voiceProvider2D','kokoro');await page.fill('#voiceSpeaker2D','hero');
 const meta={format:'jet-kokoro-clip',version:1,provider:'kokoro',voice:'af_heart',speed:1,lang:'en-us',text:'A test line.'};
 const b=Buffer.from(wav);meta.durationSeconds=await page.evaluate(x=>VoiceTools2D.wavInfo(new Uint8Array(x)).duration,wav);
 await page.locator('#voiceImport2D').setInputFiles([{name:'fixture.wav',mimeType:'audio/wav',buffer:b},{name:'fixture.wav.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(meta))}]);
 await page.waitForFunction(()=>document.getElementById('voiceStatus2D').textContent.startsWith('Imported'));
 await page.click('#voiceDialogue2D');assert.match(await page.locator('#voiceStatus2D').textContent(),/Speaker clip/);
 const p=await page.evaluate(()=>Editor.getProject());assert.equal(p.voiceCast.hero.provider,'kokoro');assert.equal(p.audio[0].speakerId,'hero');assert.ok(p.audio[0].data.length>1000);
 await page.evaluate(p=>{Editor.load(JSON.parse(JSON.stringify(p)));},p);
 assert.equal((await page.evaluate(()=>Editor.getProject())).audio[0].data,p.audio[0].data);
 // Changing text invalidates imported clip; no duplicate cue added.
 await page.fill('#voiceText2D','Changed line');await page.click('#voiceDialogue2D');assert.match(await page.locator('#voiceStatus2D').textContent(),/changed/);
 assert.equal((await page.evaluate(()=>Editor.getProject())).audio.length,1);
 await page.locator('#voiceProvider2D').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'speech-panel.png')});
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({passed:true,scope:'Real sandboxed headless Chromium; provider selection, legacy nonmutation, default new project, genuine bundled generation, file import, per-speaker embed, save/load clone, stale clip rejection. Fixture is bundled speech explicitly relabelled for import tests; not Kokoro model execution or listening review.',errors},null,2));console.log('PASS sandboxed Chromium Kokoro integration UI paths');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
