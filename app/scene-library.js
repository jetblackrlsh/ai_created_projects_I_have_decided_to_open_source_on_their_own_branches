(function (root) {
  "use strict";
  const S =
      root.Studio ||
      (typeof require === "function" ? require("./core.js") : null),
    P =
      root.StudioPuppet2D ||
      (typeof require === "function" ? require("./puppet.js") : null),
    Props =
      root.StudioSceneProps2D ||
      (typeof require === "function" ? require("./scene-props.js") : null),
    Backgrounds =
      root.StudioSceneBackgrounds2D ||
      (typeof require === "function"
        ? require("./scene-backgrounds.js")
        : null),
    Effects =
      root.StudioSceneEffects2D ||
      (typeof require === "function" ? require("./scene-effects.js") : null);
  function attach(rig, kind, id, side = "R", options = {}) {
    if (rig?.puppet?.rig !== P.rigVersion || !["L", "R"].includes(side))
      throw Error("Select an articulated puppet and hand");
    const scale = options.scale ?? 1,
      rotation = options.rotation ?? 0,
      x = options.x ?? 0,
      y = options.y ?? 0;
    if (
      ![scale, rotation, x, y].every(Number.isFinite) ||
      scale < 0.1 ||
      scale > 3 ||
      Math.abs(rotation) > 720 ||
      Math.abs(x) > 500 ||
      Math.abs(y) > 500
    )
      throw Error("Invalid grip placement");
    const info = Props.items.find((p) => p.id === kind);
    if (!info?.grip)
      throw Error(
        "This scenery prop is stage-only; add it freely and stage it manually",
      );
    const hand = P.joint(rig, "wrist" + side);
    if (
      hand.children.some((n) => n.library?.role === "prop" || n.puppetAccessory)
    )
      throw Error(
        "This hand already has a prop/effect. Remove it explicitly or use the other hand.",
      );
    const prop = Props.build(kind, id);
    let duplicate = false;
    S.walk([rig], (n) => {
      if (n.id === id || n.id.startsWith(id + "_")) duplicate = true;
    });
    if (duplicate) throw Error("Prop ID collides with existing artwork");
    prop.pose = { ...S.defaults, x, y, rotation, scaleX: scale, scaleY: scale };
    prop.grip = { ...prop.grip, puppetId: rig.id, side };
    hand.children.unshift(prop);
    return prop;
  }
  function remove(rig, side) {
    if (rig?.puppet?.rig !== P.rigVersion || !["L", "R"].includes(side))
      throw Error("Select an articulated puppet and hand");
    const h = P.joint(rig, "wrist" + side);
    const count = h.children.filter(
      (n) => n.grip?.puppetId === rig.id && n.grip.side === side,
    ).length;
    h.children = h.children.filter(
      (n) => !(n.grip?.puppetId === rig.id && n.grip.side === side),
    );
    return count;
  }
  const api = {
    props: Props.items,
    backgrounds: Backgrounds.items,
    effects: Effects.items,
    prop: Props.build,
    background: Backgrounds.build,
    effect: Effects.build,
    attach,
    remove,
  };
  root.StudioSceneLibrary2D = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
