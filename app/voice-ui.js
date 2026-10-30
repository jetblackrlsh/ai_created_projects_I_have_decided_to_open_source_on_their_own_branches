(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  let generated = null,
    audio = null,
    url = null;
  const report = (t) => ($("voiceStatus2D").textContent = t);
  function stop() {
    if (audio) audio.pause();
    if (url) URL.revokeObjectURL(url);
    audio = null;
    url = null;
  }
  function guard(fn) {
    return async () => {
      try {
        await fn();
      } catch (e) {
        report(e.message);
      }
    };
  }
  function selectedConfig() {if($("voiceProvider2D").value==="bundled")return VoiceTools2D.config($("voicePreset2D").value);return VoiceTools2D.config({provider:$("voiceProvider2D").value,voice:$("voiceProvider2D").value==="kokoro"?$("voiceKokoro2D").value:$("voicePreset2D").value,speed:Number($("voiceSpeed2D").value),lang:$("voiceLang2D").value});}
  function saveConfig(lock) {
    const p=Editor.getProject(),t=Editor.getTime(),c=selectedConfig();
    if(lock) VoiceTools2D.lockCast(p,$("voiceSpeaker2D").value,c);
    else p.voicePreferences=c;
    Editor.load(p);Editor.seek(t);
    report(lock?"Speaker voice locked. Existing audio was not changed.":"Provider preference saved. Existing audio and cast were not changed.");
  }
  function updateProvider() {
    const kokoro=$("voiceProvider2D").value==="kokoro";
    $("voiceGenerate2D").disabled=kokoro;
    $("voiceGenerate2D").textContent=kokoro?"Kokoro: use CLI then import WAV":"Generate bundled speech";
    $("voicePreset2D").disabled=kokoro;
    for(const id of ["voiceKokoro2D","voiceLang2D","voiceSpeed2D","voiceRequest2D","voiceImport2D"]) $(id).disabled=!kokoro;
  }
  function syncPreference() {
    const p=Editor.getProject(),c=VoiceTools2D.config(p.voicePreferences||"narrator");
    $("voiceProvider2D").value=c.provider;
    if(c.provider==="kokoro")$("voiceKokoro2D").value=c.voice;else $("voicePreset2D").value=c.voice;
    $("voiceSpeed2D").value=c.speed;$("voiceLang2D").value=c.lang;updateProvider();
  }
  function download(body,name,type) {
    const u=URL.createObjectURL(new Blob([body],{type})),a=document.createElement("a");a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);
  }
  $("voiceProvider2D").onchange=()=>{stop();generated=null;updateProvider();report("Provider selected for the next clip. Save preference to persist; existing audio unchanged.");};
  $("voiceLock2D").onclick=guard(()=>saveConfig(true));
  $("voicePreference2D").onclick=guard(()=>saveConfig(false));
  $("voiceRequest2D").onclick=guard(()=>{
    const c=selectedConfig(),text=$("voiceText2D").value;
    if(!text.trim())throw Error("Enter speech text first");
    download(JSON.stringify({format:"jet-kokoro-request",version:1,...c,speakerId:$("voiceSpeaker2D").value,text},null,2),"Kokoro-request.json","application/json");
    report("Request downloaded. Run the local CLI described in docs/kokoro.md; import its WAV + sidecar afterward.");
  });
  $("voiceImport2D").onchange=guard(async()=>{
    const files=Array.from($("voiceImport2D").files||[]),wav=files.filter(f=>/\.wav$/i.test(f.name)),json=files.filter(f=>/\.json$/i.test(f.name));
    if(files.some(f=>f.size>40e6))throw Error("Import limit: 40 MB");
    stop();generated=null;
    let bytes,meta=null;
    if(wav.length===0 && json.length===1 && files.length===1) {
      meta=JSON.parse(await json[0].text());
      if(meta.format!=="jet-kokoro-clip" || meta.version!==1 || !/^data:audio\/wav;base64,[A-Za-z0-9+/=]+$/.test(meta.data))throw Error("Expected an embedded jet-kokoro-clip JSON result");
      const binary=atob(meta.data.split(",")[1]);bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
    } else {
      if(wav.length!==1 || json.length>1 || wav.length+json.length!==files.length)throw Error("Select one WAV + optional JSON sidecar, or one embedded clip JSON");
      if(json.some(f=>f.size>1e6))throw Error("Sidecar limit 1 MB; import an embedded clip JSON on its own");
      bytes=new Uint8Array(await wav[0].arrayBuffer());meta=json.length?JSON.parse(await json[0].text()):null;
    }
    const hashVerified=await VoiceTools2D.verifyHash(bytes,meta);
    generated=VoiceTools2D.importWav(bytes,$("voiceText2D").value,selectedConfig(),meta);
    if(hashVerified)generated.provenance.audioHashVerified=true;
    report(`Imported ${generated.info.duration.toFixed(2)}s of actual WAV audio. ${meta?"Sidecar fields match.":"No sidecar: provider/text are user-labelled."} Audition before applying.`);
  });
  document.addEventListener("jet2d-project-loaded",syncPreference);
  syncPreference();
  $("voiceUseCaptions2D").onclick = () => {
    const p = Editor.getProject(),
      s = Studio.locate(p, Editor.getTime()).scene;
    $("voiceText2D").value = (s.captions || []).map((c) => c.text).join(" ");
    report(
      "Copied current scene captions. Edit wording before generating if needed.",
    );
  };
  $("voiceGenerate2D").onclick = guard(async () => {
    if(selectedConfig().provider!=="bundled")throw Error("Kokoro requires the local CLI and WAV import; Python cannot run in this page");
    stop();
    generated=null;
    report("Generating local synthetic speech…");
    await new Promise((r) => setTimeout(r, 30));
    generated = VoiceTools2D.generate(
      $("voiceText2D").value,
      $("voicePreset2D").value,
    );
    generated.config=VoiceTools2D.config(generated.preset);
    report(
      `Generated ${generated.info.duration.toFixed(2)} seconds locally. Audition, download, or replace scene narration. No voice cloning or external service.`,
    );
  });
  $("voiceAudition2D").onclick = guard(async () => {
    if (!generated) throw Error("Generate speech first");
    Editor.stop();
    stop();
    url = URL.createObjectURL(
      new Blob([generated.bytes], { type: "audio/wav" }),
    );
    audio = new Audio(url);
    await audio.play();
  });
  $("voiceStop2D").onclick = stop;
  $("voiceDownload2D").onclick = guard(() => {
    if (!generated) throw Error("Generate speech first");
    const u = URL.createObjectURL(
        new Blob([generated.bytes], { type: "audio/wav" }),
      ),
      a = document.createElement("a");
    a.href = u;
    a.download = "Generated-" + generated.preset + "-Narration.wav";
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 2000);
  });
  $("voiceApply2D").onclick = guard(() => {
    if (!generated) throw Error("Generate speech first");
    if(generated.text!==$("voiceText2D").value || !VoiceTools2D.equalConfig(generated.config||generated.preset,selectedConfig()))throw Error("Text or voice settings changed. Regenerate or reimport before applying.");
    const p = Editor.getProject(),
      t = Editor.getTime(),
      row = Studio.locate(p, t),
      end = row.start + row.scene.duration;
    if (generated.info.duration > row.scene.duration)
      throw Error(
        `Speech needs ${generated.info.duration.toFixed(2)}s; this scene is ${row.scene.duration.toFixed(2)}s. Lengthen the scene explicitly and review later audio timing, or shorten the text. Nothing was changed.`,
      );
    if (
      p.audio.some(
        (a) =>
          a.kind === "narration" &&
          a.start < row.start &&
          a.start + a.duration > row.start,
      )
    )
      throw Error(
        "Existing narration crosses this scene boundary. Edit its cue explicitly first.",
      );
    VoiceTools2D.lockCast(p,$("voiceSpeaker2D").value,generated.config||generated.preset);
    p.audio = p.audio.filter(
      (a) => !(a.kind === "narration" && a.start >= row.start && a.start < end),
    );
    let binary = "";
    for (let i = 0; i < generated.bytes.length; i += 32768)
      binary += String.fromCharCode(...generated.bytes.subarray(i, i + 32768));
    p.audio.push({
      name: "Generated " + generated.preset + " narration",
      kind: "narration",
      speakerId: $("voiceSpeaker2D").value,
      speechRole: $("voiceSpeaker2D").value==="narrator"?"narration":"dialogue",
      voiceConfig: generated.config||VoiceTools2D.config(generated.preset),
      data: "data:audio/wav;base64," + btoa(binary),
      start: row.start,
      offset: 0,
      duration: generated.info.duration,
      sourceDuration: generated.info.duration,
      gain: 0.9,
      text: generated.text,
      provenance: generated.provenance || {
        engine: "Bundled meSpeak/eSpeak",
        preset: generated.preset,
        source: "Generated locally from user-entered text",
      },
    });
    Studio.validate(p);
    Editor.load(p);
    Editor.seek(t);
    report(
      "Scene narration replaced and embedded. Captions were not rewritten; review their text and timing, then save project JSON.",
    );
  });
  $("voiceDialogue2D").onclick=guard(()=>{
    if(!generated)throw Error("Generate or import speech first");
    if(generated.text!==$("voiceText2D").value || !VoiceTools2D.equalConfig(generated.config||generated.preset,selectedConfig()))throw Error("Text or voice settings changed. Regenerate or reimport first.");
    const p=Editor.getProject(),t=Editor.getTime(),row=Studio.locate(p,t),id=$("voiceSpeaker2D").value;
    if(row.time+generated.info.duration>row.scene.duration)throw Error("Speech exceeds this scene. Extend it or shorten the line first.");
    VoiceTools2D.lockCast(p,id,generated.config||generated.preset);
    // Stagecraft is loaded later, but this action is only called after page load.
    StudioStagecraft2D.speech(p,id,generated.text,t,generated);
    row.scene.captions.push({start:row.time,end:row.time+generated.info.duration,text:id+": "+generated.text});
    Studio.validate(p);Editor.load(p);Editor.seek(t);
    report("Speaker clip and caption added at playhead; existing audio preserved. Review timing and overlaps, then save project JSON.");
  });
  window.VoiceEditor2D = {
    getGenerated: () =>
      generated
        ? {
            text: generated.text,
            preset: generated.preset,
            duration: generated.info.duration,
          }
        : null,
    importWav: (bytes,text,config,metadata) => (generated=VoiceTools2D.importWav(bytes,text,config,metadata)),
    syncPreference,
    stop,
  };
})();
