(function () {
  "use strict";
  const C = StudioCatalog2D,
    S = Studio,
    $ = (id) => document.getElementById(id);
  let serial = 1;
  const report = (t) => ($("catalogStatus2D").textContent = t),
    guard = (fn) => async () => {
      try {
        await fn();
      } catch (e) {
        report(e.message);
      }
    };
  for (const [id, list] of [
    ["catalogCharacter2D", C.characters],
    ["catalogAction2D", C.actions],
    ["catalogEnvironment2D", C.environments],
    ["catalogProp2D", C.props],
    ["catalogEffect2D", C.effects],
  ])
    for (const name of list) $(id).add(new Option(name, name));
  function context() {
    const p = Editor.getProject(),
      t = Editor.getTime(),
      row = S.locate(p, t);
    return { p, t, row };
  }
  function uid(p) {
    const ids = new Set();
    p.scenes.forEach((s) => S.walk(s.nodes, (n) => ids.add(n.id)));
    let id;
    do {
      id = "catalog_" + serial++;
    } while ([...ids].some((x) => x === id || x.startsWith(id + "_")));
    return id;
  }
  function refresh() {
    const { row } = context(),
      old = $("catalogActor2D").value;
    $("catalogActor2D").replaceChildren();
    S.walk(row.scene.nodes, (n) => {
      if (n.library?.role === "character" && !n.puppet)
        $("catalogActor2D").add(
          new Option(n.library.kind + " · " + n.id, n.id),
        );
    });
    if ([...$("catalogActor2D").options].some((x) => x.value === old))
      $("catalogActor2D").value = old;
  }
  function commit(p, t) {
    S.validate(p);
    Editor.load(p);
    Editor.seek(t);
    refresh();
    report("Editable template applied. Save the project to keep it.");
  }
  function actor(row) {
    let result;
    S.walk(row.scene.nodes, (n) => {
      if (n.id === $("catalogActor2D").value) result = n;
    });
    if (!result)
      throw Error(
        "Choose a character in the current scene; refresh the list if the scene changed.",
      );
    return result;
  }
  $("catalogRefresh2D").onclick = refresh;
  $("catalogAddCharacter2D").onclick = guard(() => {
    const { p, t, row } = context(),
      n = C.character(
        $("catalogCharacter2D").value,
        uid(p),
        p.width / 2,
        p.height * 0.8,
      );
    row.scene.nodes.push(n);
    commit(p, t);
    $("catalogActor2D").value = n.id;
  });
  $("catalogApplyAction2D").onclick = guard(() => {
    const { p, t, row } = context(),
      duration = Number($("catalogActionDuration2D").value);
    if (row.time + duration > row.scene.duration + 0.0001)
      throw Error(
        "Action extends beyond this scene. Shorten its duration or move the playhead earlier.",
      );
    C.animate(actor(row), $("catalogAction2D").value, row.time, duration);
    commit(p, t);
  });
  $("catalogAddEnvironment2D").onclick = guard(() => {
    const { p, t, row } = context();
    row.scene.nodes = row.scene.nodes.filter(
      (n) => n.library?.role !== "background",
    );
    row.scene.nodes.unshift(
      C.environment($("catalogEnvironment2D").value, uid(p), p.width, p.height),
    );
    commit(p, t);
  });
  $("catalogAddEffect2D").onclick = guard(() => {
    const { p, t, row } = context(),
      d = Number($("catalogEffectDuration2D").value);
    if (row.time + d > row.scene.duration)
      throw Error("Effect extends beyond scene");
    row.scene.nodes.push(
      C.effect(
        $("catalogEffect2D").value,
        uid(p),
        row.time,
        d,
        p.width / 2,
        p.height / 2,
      ),
    );
    commit(p, t);
  });
  $("catalogAddProp2D").onclick = guard(() => {
    const { p, t, row } = context(),
      n = C.prop($("catalogProp2D").value, uid(p));
    if ($("catalogAttachProp2D").checked) {
      const r = actor(row),
        hand = C.part(r, "armR");
      if (!hand)
        throw Error(
          "This template has no right-hand attachment. Add a free prop instead.",
        );
      if (hand.children.some((x) => x.library?.role === "prop"))
        throw Error(
          "This hand already holds a prop. Remove or reparent it explicitly first.",
        );
      n.pose = { ...S.defaults, x: 0, y: 50 };
      hand.children.push(n);
    } else {
      n.pose = { ...S.defaults, x: p.width / 2, y: p.height * 0.6 };
      row.scene.nodes.push(n);
    }
    commit(p, t);
  });
  $("catalogSaveTemplate2D").onclick = guard(() => {
    const { p, row } = context(),
      selected = Editor.getSelected();
    let node;
    S.walk(row.scene.nodes, (n) => {
      if (n.id === selected[0]) node = n;
    });
    if (!node) throw Error("Select an artwork layer or group first");
    const inside = new Set();
    S.walk([node], (n) => inside.add(n.id));
    S.walk([node], (n) => {
      for (const k of n.owners || [])
        if (k.parentId !== null && !inside.has(k.parentId))
          throw Error(
            "Template ownership refers outside this group. Save the whole project or remove those keys explicitly.",
          );
    });
    const data = {
        format: "jet2d-art-template",
        version: 1,
        width: p.width,
        height: p.height,
        node: S.clone(node),
      },
      u = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      ),
      a = document.createElement("a");
    a.href = u;
    a.download = node.id + ".jetart2d.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 2000);
    report("Reusable editable artwork template downloaded.");
  });
  $("catalogLoadTemplate2D").onchange = guard(async () => {
    const file = $("catalogLoadTemplate2D").files[0];
    if (!file) return;
    if (file.size > 20e6) throw Error("Artwork template exceeds 20MB");
    const d = JSON.parse(await file.text());
    if (d.format !== "jet2d-art-template" || d.version !== 1 || !d.node)
      throw Error("Expected jet2d-art-template version 1");
    const { p, t, row } = context(),
      node = S.clone(d.node),
      prefix = uid(p);
    let i = 0;
    const idMap = new Map();
    S.walk([node], (n) => {
      const old = n.id;
      n.id = prefix + "_" + i++;
      idMap.set(old, n.id);
      if (n.attrs?.id) n.attrs.id = n.id;
    });
    S.walk([node], (n) => {
      for (const key of n.owners || [])
        if (key.parentId !== null)
          key.parentId = idMap.get(key.parentId) || key.parentId;
    });
    row.scene.nodes.push(node);
    commit(p, t);
    $("catalogLoadTemplate2D").value = "";
    report(
      "Reusable template loaded as editable nodes; original pose retained. Adjust its size/position in the inspector.",
    );
  });
  refresh();
  window.CatalogEditor2D = { refresh };
})();
