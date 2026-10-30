const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const S = require("../app/core.js");
const p = S.blank();
const node = (id, tag = "g") => ({
  id,
  tag,
  attrs: {},
  pose: {},
  keys: [],
  children: [],
});
const left = node("left"),
  right = node("right"),
  sword = node("sword", "path");
sword.attrs.d = "M0 0 L1 1";
sword.owners = [
  { t: 0, parentId: "left", x: 4, y: 8 },
  { t: 2, parentId: "right", x: 9, y: 7 },
  { t: 4, parentId: null, x: 100, y: 200 },
];
p.scenes[0].nodes = [left, right, sword];
S.validate(p);
const original = JSON.stringify(p);
for (const [time, expected] of [
  [1, "left"],
  [2, "right"],
  [5, null],
]) {
  const tree = S.ownerTree(p.scenes[0], time);
  let count = 0,
    actual;
  function walk(ns, parent) {
    for (const n of ns) {
      if (n.id === "sword") {
        count++;
        actual = parent;
      }
      walk(n.children || [], n.id);
    }
  }
  walk(tree.nodes, null);
  assert.equal(count, 1);
  assert.equal(actual, expected);
  S.render(p, time);
}
assert.equal(JSON.stringify(p), original);
left.owners = [{ t: 0, parentId: "right" }];
right.owners = [{ t: 0, parentId: "left" }];
assert.throws(() => S.validate(p), /cycle/);
right.owners = [{ t: 0, parentId: "missing" }];
assert.throws(() => S.validate(p), /Owner/);
delete left.owners;
delete right.owners;
sword.owners[1].t = 0;
assert.throws(() => S.validate(p), /increase/);
const out = path.join(__dirname, "../output/ownership");
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(
  path.join(out, "verification.json"),
  JSON.stringify(
    {
      tests: [
        "one node per frame through handoff/drop",
        "exact owner at boundary",
        "immutable source",
        "cycles rejected",
        "missing group rejected",
        "nonincreasing times rejected",
      ],
      scope: "Pure scene graph and SVG renderer checks.",
    },
    null,
    2,
  ),
);
console.log("PASS six ownership invariants");
