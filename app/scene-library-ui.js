(function () {
  "use strict";
  const L = StudioSceneLibrary2D,
    S = Studio,
    $ = (id) => document.getElementById(id);
  let serial = 1;
  const report = (t) => ($("sceneLibraryStatus").textContent = t),
    guard = (fn) => async () => {
      try {
        await fn();
      } catch (e) {
        report(e.message);
      }
    };
  function ctx() {
    const p = Editor.getProject(),
      t = Editor.getTime();
    return { p, t, row: S.locate(p, t) };
  }
  function uid(p) {
    const ids = new Set();
    p.scenes.forEach((s) => S.walk(s.nodes, (n) => ids.add(n.id)));
    let id;
    do {
      id = "asset_" + serial++;
    } while ([...ids].some((x) => x === id || x.startsWith(id + "_")));
    return id;
  }
  function commit(p, t) {
    S.validate(p);
    Editor.load(p);
    Editor.seek(t);
    refresh();
  }
  function fill(type) {
    const rows = L[type],
      category = $(type + "Category").value,
      select = $(type + "Asset"),
      old = select.value;
    select.replaceChildren();
    for (const a of rows)
      if (category === "All" || category === a.category)
        select.add(new Option(a.label, a.id));
    if ([...select.options].some((o) => o.value === old)) select.value = old;
    if (type === "props") help();
    if (type === "effects")
      $("effectTint").value = rows.find((a) => a.id === select.value).color;
  }
  function help() {
    const a = L.props.find((a) => a.id === $("propsAsset").value);
    $("propAssetHelp").textContent =
      (a.grip ? "Hand-grippable or free-standing. " : "Stage-only scenery. ") +
      (a.actions.length
        ? "Suggested motion: " + a.actions.join(", ") + ". "
        : "") +
      "Adjust grip and shot timing; contact is not automatic.";
  }
  for (const type of ["props", "backgrounds", "effects"]) {
    const cat = $(type + "Category");
    cat.add(new Option("All categories", "All"));
    for (const c of [...new Set(L[type].map((a) => a.category))])
      cat.add(new Option(c, c));
    cat.onchange = () => fill(type);
    fill(type);
  }
  function refresh() {
    const { row } = ctx(),
      sel = $("propPuppet"),
      old = sel.value;
    sel.replaceChildren();
    S.walk(row.scene.nodes, (n) => {
      if (n.puppet?.rig === "humanoid-v1") sel.add(new Option(n.id, n.id));
    });
    if ([...sel.options].some((o) => o.value === old)) sel.value = old;
  }
  function actor(row) {
    let r;
    S.walk(row.scene.nodes, (n) => {
      if (n.id === $("propPuppet").value) r = n;
    });
    if (!r)
      throw Error("Add a blank articulated puppet, then refresh the list");
    return r;
  }
  function options() {
    return {
      scale: Number($("propAssetScale").value),
      rotation: Number($("propGripRotation").value),
      x: Number($("propGripX").value),
      y: Number($("propGripY").value),
    };
  }
  $("propsAsset").onchange = help;
  $("effectsAsset").onchange = () => {
    $("effectTint").value = L.effects.find(
      (a) => a.id === $("effectsAsset").value,
    ).color;
  };
  $("refreshSceneLibrary").onclick = refresh;
  $("addSceneProp").onclick = guard(() => {
    const { p, t, row } = ctx(),
      o = options();
    if ($("propAttach").checked) {
      L.attach(
        actor(row),
        $("propsAsset").value,
        uid(p),
        $("propHand").value,
        o,
      );
    } else {
      if (
        ![o.scale, o.rotation].every(Number.isFinite) ||
        o.scale < 0.1 ||
        o.scale > 3 ||
        Math.abs(o.rotation) > 720
      )
        throw Error("Invalid prop scale or rotation");
      const n = L.prop($("propsAsset").value, uid(p));
      n.pose = {
        ...S.defaults,
        x: p.width * 0.5,
        y: p.height * 0.65,
        scaleX: o.scale,
        scaleY: o.scale,
        rotation: o.rotation,
      };
      row.scene.nodes.push(n);
    }
    commit(p, t);
    report(
      "Editable prop added. Save the project; audio and action timing remain separate.",
    );
  });
  $("removeHandProp").onclick = guard(() => {
    const { p, t, row } = ctx();
    if (
      !confirm(
        "Remove the reusable library prop on this hand? Other artwork and animation remain.",
      )
    )
      return;
    const n = L.remove(actor(row), $("propHand").value);
    commit(p, t);
    report(
      n
        ? "Hand prop removed."
        : "No reusable-library hand prop found. Preset-generated effects are cleared with puppet animation.",
    );
  });
  $("addSceneBackground").onclick = guard(() => {
    const { p, t, row } = ctx(),
      n = L.background($("backgroundsAsset").value, uid(p), p.width, p.height);
    row.scene.nodes = row.scene.nodes.filter(
      (n) => n.library?.role !== "background",
    );
    row.scene.nodes.unshift(n);
    commit(p, t);
    report(
      "Layered background replaced; characters, props and audio preserved.",
    );
  });
  $("addSceneOverlay").onclick = guard(() => {
    const { p, t, row } = ctx(),
      d = Number($("overlayDuration").value);
    if (row.time + d > row.scene.duration + 1e-7)
      throw Error("Overlay extends past this scene");
    const n = L.effect(
      $("effectsAsset").value,
      uid(p),
      row.time,
      d,
      p.width * 0.5,
      p.height * 0.5,
      {
        color: $("effectTint").value,
        scale: Number($("overlayScale").value),
        intensity: Number($("overlayIntensity").value),
        width: p.width,
        height: p.height,
      },
    );
    row.scene.nodes.push(n);
    commit(p, t);
    report(
      "Transparent animated overlay added at playhead. Edit its layer position or keys; add sound separately.",
    );
  });
  refresh();
})();
