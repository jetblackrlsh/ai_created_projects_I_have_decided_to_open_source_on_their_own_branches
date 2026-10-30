(function (root) {
  "use strict";
  function wavInfo(bytes) {
    const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes),
      v = new DataView(b.buffer, b.byteOffset, b.byteLength),
      str = (i, n) => String.fromCharCode(...b.subarray(i, i + n));
    if (b.length < 44 || str(0, 4) !== "RIFF" || str(8, 4) !== "WAVE")
      throw Error("Invalid generated WAV");
    let format = null,
      data = null;
    for (let i = 12; i + 8 <= b.length; ) {
      const n = v.getUint32(i + 4, true),
        id = str(i, 4);
      if (i + 8 + n > b.length) throw Error("Truncated WAV");
      if (id === "fmt ") {
        if (n < 16) throw Error("Invalid WAV format");
        format = {
          encoding: v.getUint16(i + 8, true),
          channels: v.getUint16(i + 10, true),
          sampleRate: v.getUint32(i + 12, true),
          byteRate: v.getUint32(i + 16, true),
          bits: v.getUint16(i + 22, true),
        };
      }
      if (id === "data") data = { start: i + 8, length: n };
      i += 8 + n + (n % 2);
    }
    if (
      !format ||
      !data ||
      format.encoding !== 1 ||
      ![1,2].includes(format.channels) ||
      ![8,16,24,32].includes(format.bits) ||
      format.sampleRate < 8000 || format.sampleRate > 192000 ||
      format.byteRate !== format.sampleRate*format.channels*format.bits/8 ||
      !data.length
    )
      throw Error("Unsupported or empty generated WAV");
    return { ...format, ...data, duration: data.length / format.byteRate };
  }
  function generate(text, preset = "narrator") {
    if (typeof text !== "string" || !text.trim() || text.length > 8000)
      throw Error("Enter 1–8000 characters of narration");
    if (!root.StudioVoice || !Object.hasOwn(root.StudioVoice.presets, preset))
      throw Error("Unknown or unavailable bundled voice");
    const bytes = root.StudioVoice.generate(text, preset),
      info = wavInfo(bytes);
    return { bytes, info, text, preset };
  }
  const defaults = {provider:"kokoro", voice:"af_heart", speed:1, lang:"en-us"};
  function config(value) {
    if (typeof value === "string") return {provider:"bundled",voice:value,speed:1,lang:"en-us"};
    const c = {...defaults,...value};
    if (!["kokoro","bundled"].includes(c.provider)) throw Error("Unknown speech provider");
    if (c.provider === "bundled" && (!root.StudioVoice || !Object.hasOwn(root.StudioVoice.presets,c.voice))) throw Error("Unknown bundled voice");
    if (c.provider === "kokoro" && !/^[a-z]{2}_[a-z0-9_]+$/.test(c.voice)) throw Error("Enter a Kokoro voice ID such as af_heart");
    if (!Number.isFinite(Number(c.speed)) || Number(c.speed)<0.5 || Number(c.speed)>2) throw Error("Speech speed must be 0.5–2");
    if (!/^[a-z]{2}(?:-[a-z]{2})?$/.test(c.lang)) throw Error("Invalid speech language");
    c.speed=Number(c.speed); return c;
  }
  function equalConfig(a,b) {const x=config(a),y=config(b);return ["provider","voice","speed","lang"].every(k=>x[k]===y[k]);}
  function lockCast(project,id,value) {
    if (!/^[a-z][\w-]{0,40}$/i.test(id)) throw Error("Invalid speaker ID");
    const c=config(value); project.voiceCast=project.voiceCast||{};
    if (project.voiceCast[id] && !equalConfig(project.voiceCast[id],c)) throw Error("Speaker voice is already locked; explicitly change the cast and regenerate its lines");
    project.voiceCast[id]=c.provider==="bundled" ? c.voice : c; return c;
  }
  function importWav(bytes, text, value, metadata=null) {
    if (typeof text!=="string" || !text.trim() || text.length>8000) throw Error("Enter 1–8000 characters matching the imported speech");
    const c=config(value),info=wavInfo(bytes);
    if(metadata?.provenance?.audioSha256 && typeof require==="function" && typeof module!=="undefined") {
      const actual=require("crypto").createHash("sha256").update(bytes).digest("hex");
      if(actual!==metadata.provenance.audioSha256)throw Error("Kokoro sidecar WAV SHA-256 mismatch");
    }
    if (c.provider!=="kokoro") throw Error("Select Kokoro before importing a Kokoro clip");
    if (metadata) {
      if (metadata.provider!=="kokoro" || metadata.text!==text || !equalConfig(c,{provider:metadata.provider,voice:metadata.voice,speed:metadata.speed,lang:metadata.lang})) throw Error("Kokoro sidecar text or voice does not match the current settings");
      if (metadata.durationSeconds!=null && Math.abs(metadata.durationSeconds-info.duration)>.05) throw Error("Kokoro sidecar duration does not match WAV");
    }
    return {bytes:bytes instanceof Uint8Array?bytes:new Uint8Array(bytes),info,text,preset:c.voice,config:c,provenance:{engine:"Kokoro ONNX (local external CLI)",...c,metadataVerification:metadata?"Matching sidecar fields; not a cryptographic identity guarantee":"User-labelled WAV; no sidecar verified",...(metadata?{sidecar:Object.fromEntries(Object.entries(metadata).filter(([k])=>k!=="data"))}:{})}};
  }
  async function verifyHash(bytes,metadata) {
    const expected=metadata?.provenance?.audioSha256;
    if(!expected)return false;
    if(!/^[a-f0-9]{64}$/.test(expected))throw Error("Invalid sidecar audio hash");
    if(!root.crypto?.subtle)throw Error("This browser cannot verify WAV SHA-256; use a current secure-context browser or the project CLI");
    const digest=await root.crypto.subtle.digest("SHA-256",bytes),actual=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
    if(actual!==expected)throw Error("Kokoro sidecar WAV SHA-256 mismatch");return true;
  }
  const api = { generate, wavInfo, defaults, config, equalConfig, lockCast, importWav, verifyHash };
  root.VoiceTools2D = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
