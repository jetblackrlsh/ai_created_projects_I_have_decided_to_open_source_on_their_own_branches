(function () {
  "use strict";
  const P = StudioPuppet2D,
    S = Studio,
    $ = (id) => document.getElementById(id);
  let serial = 1;
  const report = (t) => ($("puppetStatus").textContent = t),
    guard = (fn) => async () => {
      try {
        await fn();
      } catch (e) {
        report(e.message);
      }
    };
  const context = () => {
    const p = Editor.getProject(),
      t = Editor.getTime();
    return { p, t, row: S.locate(p, t) };
  };
  function selected(row) {
    let r;
    S.walk(row.scene.nodes, (n) => {
      if (n.id === $("puppetSelect").value) r = n;
    });
    if (!r?.puppet) throw Error("Add or select an articulated puppet first.");
    return r;
  }
  function refresh() {
    const { row } = context(),
      old = $("puppetSelect").value;
    $("puppetSelect").replaceChildren();
    S.walk(row.scene.nodes, (n) => {
      if (n.puppet?.rig === P.rigVersion)
        $("puppetSelect").add(new Option(n.id, n.id));
    });
    if ([...$("puppetSelect").options].some((o) => o.value === old))
      $("puppetSelect").value = old;
    refreshJoints();
  }
  function refreshJoints() {
    const { row } = context();
    if (!$("puppetSelect").value) return;
    const r = selected(row),
      old = $("puppetJoint").value;
    $("puppetJoint").replaceChildren();
    for (const name of r.puppet.joints)
      $("puppetJoint").add(new Option(name, name));
    if (r.puppet.joints.includes(old)) $("puppetJoint").value = old;
    for (const k of ["skin", "shirt", "pants", "shoes", "hair"])
      $("puppet" + k).value = r.puppet.style[k];
    $("puppetHairVisible").checked = r.puppet.style.hairVisible;
    readJoint();
  }
  function readJoint() {
    const { row } = context();
    if (!$("puppetSelect").value) return;
    const r = selected(row),
      p = P.capturePose(r, row.time),
      v = p.channels[$("puppetJoint").value] || {};
    $("puppetRotation").value = v.rotation || 0;
    $("puppetX").value = v.x || 0;
    $("puppetY").value = v.y || 0;
  }
  function commit(p, t, id) {
    S.validate(p);
    Editor.load(p);
    Editor.seek(t);
    refresh();
    if (id) $("puppetSelect").value = id;
    refreshJoints();
  }
  function save(name, data) {
    const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      ),
      a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  function actionOptions() {
    const old = $("puppetAction").value,
      category = $("puppetCategory").value;
    $("puppetAction").replaceChildren();
    for (const action of P.actions) {
      const info = P.actionInfo[action] || {};
      if (category === "All" || info.category === category)
        $("puppetAction").add(new Option(info.label || action, action));
    }
    if ([...$("puppetAction").options].some((o) => o.value === old))
      $("puppetAction").value = old;
    actionHelp();
  }
  function actionHelp() {
    const info = P.actionInfo[$("puppetAction").value] || {};
    $("puppetActionHelp").textContent =
      (info.prop
        ? "Optional matching accessory: " + info.prop + ". "
        : "Pose-only preset. ") +
      (info.notes ||
        "Preview anticipation, action and recovery before using in a scene.");
  }
  const actionClip = () =>
    P.makeClip($("puppetAction").value, Number($("puppetDuration").value), {
      intensity: Number($("puppetIntensity").value),
      mirror: $("puppetMirror").checked,
    });
  $("puppetCategory").onchange = actionOptions;
  $("puppetAction").onchange = actionHelp;
  actionOptions();
  $("puppetRefresh").onclick = refresh;
  $("puppetSelect").onchange = refreshJoints;
  $("puppetJoint").onchange = readJoint;
  $("puppetAdd").onclick = guard(() => {
    const { p, t, row } = context(),
      ids = new Set();
    p.scenes.forEach((s) => S.walk(s.nodes, (n) => ids.add(n.id)));
    let id;
    do {
      id = "personPuppet" + serial++;
    } while ([...ids].some((x) => x === id || x.startsWith(id + "_")));
    row.scene.nodes.push(P.create(id, p.width / 2, p.height * 0.85));
    commit(p, t, id);
    report(
      "Blank articulated puppet added. 17 skeletal controls, plus facial and hand-state layers.",
    );
  });
  $("puppetStyle").onclick = guard(() => {
    const { p, t, row } = context(),
      r = selected(row),
      style = { hairVisible: $("puppetHairVisible").checked };
    for (const k of ["skin", "shirt", "pants", "shoes", "hair"])
      style[k] = $("puppet" + k).value;
    P.restyle(r, style);
    commit(p, t, r.id);
    report("Appearance changed; joint hierarchy and animation keys preserved.");
  });
  $("puppetSetJoint").onclick = guard(() => {
    const { p, t, row } = context(),
      r = selected(row),
      pose = P.capturePose(r, row.time);
    pose.channels[$("puppetJoint").value] = {
      ...pose.channels[$("puppetJoint").value],
      rotation: Number($("puppetRotation").value),
      x: Number($("puppetX").value),
      y: Number($("puppetY").value),
    };
    P.applyPose(r, pose, row.time);
    commit(p, t, r.id);
    report(
      "Full pose keyed at this scene time. Joint offsets are relative to the neutral rig.",
    );
  });
  $("puppetSetHand").onclick = guard(() => {
    const { p, t, row } = context(),
      r = selected(row),
      pose = P.capturePose(r, row.time),
      side = $("puppetHandSide").value,
      kind = $("puppetHandShape").value;
    for (const name of ["Open", "Fist", "Point"])
      pose.channels["hand" + side + name] = {
        opacity: name.toLowerCase() === kind ? 1 : 0,
      };
    P.applyPose(r, pose, row.time);
    commit(p, t, r.id);
    report("Hand shape keyed at the playhead.");
  });
  $("puppetApplyAction").onclick = guard(() => {
    const { p, t, row } = context(),
      r = selected(row),
      duration = Number($("puppetDuration").value);
    if (row.time + duration > row.scene.duration + 1e-7)
      throw Error(
        "Action extends past the scene. Shorten it or move the playhead earlier.",
      );
    const clip = actionClip();
    P.applyClip(r, clip, row.time);
    if ($("puppetAddAccessory").checked) P.addActionProp(r, clip, row.time);
    commit(p, t, r.id);
    report("Articulated action applied. Preview it, then save your project.");
  });
  $("puppetClear").onclick = guard(() => {
    const { p, t, row } = context(),
      r = selected(row);
    if (
      !confirm(
        "Clear this puppet’s animation and restore its neutral pose? Other characters and appearance will stay unchanged.",
      )
    )
      return;
    P.clearAnimation(r);
    commit(p, t, r.id);
    report("Selected puppet reset; appearance preserved.");
  });
  $("puppetSavePose").onclick = guard(() => {
    const { row } = context();
    save("Pose.jetpose2d.json", P.capturePose(selected(row), row.time));
    report("Reusable pose saved.");
  });
  $("puppetSaveClip").onclick = guard(() => {
    save("Action.jetmotion2d.json", actionClip());
    report(
      "Reusable action template saved; this exports the selected preset, not an arbitrary edited timeline.",
    );
  });
  $("puppetLoadTemplate").onchange = guard(async () => {
    const f = $("puppetLoadTemplate").files[0];
    if (!f) return;
    if (f.size > 8000000) throw Error("Template is too large");
    const data = JSON.parse(await f.text()),
      { p, t, row } = context(),
      r = selected(row);
    if (data.format === "jet2d-puppet-pose") P.applyPose(r, data, row.time);
    else if (data.format === "jet2d-puppet-clip") {
      if (row.time + data.duration > row.scene.duration)
        throw Error("Imported clip extends past the scene");
      P.applyClip(r, data, row.time);
    } else throw Error("Expected a puppet pose or action template");
    commit(p, t, r.id);
    report(
      "Template retargeted by joint name; this character’s style and location are preserved.",
    );
  });
  $("puppetArtwork").onchange = guard(async () => {
    const file = $("puppetArtwork").files[0];
    if (!file) return;
    if (file.size > 2000000) throw Error("SVG artwork limit is 2 MB");
    const imported = S.importSVG(await file.text()),
      { p, t, row } = context(),
      r = selected(row);
    P.replaceArtwork(r, $("puppetJoint").value, imported.nodes, {
      x: Number($("puppetArtX").value),
      y: Number($("puppetArtY").value),
    });
    commit(p, t, r.id);
    report(
      "Joint artwork replaced; skeleton, child joints and motion retained. Inspect local alignment before saving.",
    );
  });
  refresh();
})();
