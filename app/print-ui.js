/* Independent still and comic desks; never mutate Editor's movie. */
(function () {
  "use strict";
  const P = StudioPrint2D,
    S = Studio,
    $ = (id) => document.getElementById(id);
  let shot = null,
    comic = null,
    index = 0,
    busy = false;
  const report = (m) => ($("printStatus").textContent = m),
    copy = S.clone;
  function guard(fn) {
    return async () => {
      if (busy) return;
      busy = true;
      try {
        await fn();
      } catch (e) {
        report(e.message);
      } finally {
        busy = false;
      }
    };
  }
  function download(name, data, type) {
    const b =
        data instanceof Blob
          ? data
          : new Blob([data], { type: type || "application/json" }),
      url = URL.createObjectURL(b),
      a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  async function show(canvas, target) {
    const old = $(target);
    old.width = canvas.width;
    old.height = canvas.height;
    old.getContext("2d").drawImage(canvas, 0, 0);
  }
  function requireShot() {
    if (!shot) throw Error("Copy a movie moment or load a still first");
    return shot;
  }
  function opts() {
    return {
      width: Number($("stillWidth2D").value),
      height: Number($("stillHeight2D").value),
      captions: $("stillCaptions2D").checked,
      fit: $("stillFit2D").value,
    };
  }
  async function shotPreview() {
    await show(await P.still(requireShot(), opts()), "stillCanvas2D");
  }
  function stillForm() {
    if (!shot) return;
    $("stillSource2D").value = JSON.stringify(shot, null, 2);
    $("stillTime2D").value = shot.time;
    $("stillCaptions2D").checked = !!shot.captions;
  }
  function sync() {
    if (!comic) return;
    $("comicTitle2D").value = comic.title;
    $("comicPages2D").replaceChildren();
    comic.pages.forEach((p, i) =>
      $("comicPages2D").add(new Option(`${i + 1}: ${p.layout}`, i)),
    );
    $("comicPages2D").value = index;
    $("comicLayout2D").value = comic.pages[index].layout;
    $("comicSource2D").value = JSON.stringify(comic.pages[index], null, 2);
  }
  async function pagePreview() {
    if (!comic) throw Error("Create or load a comic first");
    await show(await P.page(comic, index), "comicCanvas2D");
    sync();
  }
  async function change(fn) {
    if (!comic) throw Error("Create or load a comic first");
    const next = copy(comic),
      oldIndex = index;
    try {
      fn(next);
      P.validateComic(next);
      const rendered = await P.page(next, index);
      comic = next;
      sync();
      await show(rendered, "comicCanvas2D");
      report("Comic edited in memory. Save its editable JSON to keep it.");
    } catch (e) {
      index = oldIndex;
      throw e;
    }
  }
  $("stillCapture2D").onclick = guard(async () => {
    Editor.stop();
    shot = P.capture(Editor.getProject(), Editor.getTime());
    stillForm();
    await shotPreview();
    report("Independent still copied. Editing it does not alter the movie.");
  });
  $("stillApply2D").onclick = guard(async () => {
    const next = JSON.parse($("stillSource2D").value);
    P.validateStill(next);
    await P.still(next, opts());
    shot = next;
    stillForm();
    await shotPreview();
  });
  $("stillTime2D").onchange = guard(async () => {
    const next = copy(requireShot());
    next.time = Number($("stillTime2D").value);
    P.validateStill(next);
    shot = next;
    stillForm();
    await shotPreview();
  });
  $("stillPreview2D").onclick = guard(shotPreview);
  $("stillPng2D").onclick = guard(async () => {
    const c = await P.still(requireShot(), opts());
    download(
      "Fresh-Still.png",
      await new Promise((r) => c.toBlob(r, "image/png")),
      "image/png",
    );
  });
  $("stillSave2D").onclick = guard(() => {
    requireShot();
    shot.captions = $("stillCaptions2D").checked;
    download("Fresh-Still.jetstill2d.json", JSON.stringify(shot, null, 2));
  });
  $("stillLoad2D").onchange = guard(async () => {
    const f = $("stillLoad2D").files[0];
    if (!f) return;
    if (f.size > 150e6) throw Error("Still exceeds 150MB");
    const next = JSON.parse(await f.text());
    P.validateStill(next);
    shot = next;
    stillForm();
    await shotPreview();
    $("stillLoad2D").value = "";
  });
  $("comicNew2D").onclick = guard(async () => {
    const s = shot || P.capture(Editor.getProject(), Editor.getTime());
    comic = P.createComic(s);
    index = 0;
    await pagePreview();
    report("Independent comic created. Save JSON to keep edits.");
  });
  $("comicTitle2D").onchange = guard(() =>
    change((c) => (c.title = $("comicTitle2D").value)),
  );
  $("comicPages2D").onchange = guard(async () => {
    index = Number($("comicPages2D").value);
    await pagePreview();
  });
  $("comicLayout2D").onchange = guard(() =>
    change((c) => {
      const layout = $("comicLayout2D").value;
      if (c.pages[index].panels.length > P.layouts[layout].length)
        throw Error(
          "Layout has fewer slots than existing panels. Remove panels explicitly in page JSON first.",
        );
      c.pages[index].layout = layout;
    }),
  );
  $("comicAddPage2D").onclick = guard(() =>
    change((c) => {
      c.pages.push({ layout: "six", title: "", panels: [] });
      index = c.pages.length - 1;
    }),
  );
  $("comicAddPanel2D").onclick = guard(() =>
    change((c) => {
      const p = c.pages[index];
      if (p.panels.length >= P.layouts[p.layout].length)
        throw Error("This page is full");
      p.panels.push({
        snapshot: copy(
          shot || P.capture(Editor.getProject(), Editor.getTime()),
        ),
        caption: "",
        balloons: [],
      });
    }),
  );
  $("comicDuplicate2D").onclick = guard(() =>
    change((c) => {
      c.pages.splice(index + 1, 0, copy(c.pages[index]));
      index++;
    }),
  );
  $("comicDelete2D").onclick = guard(() =>
    change((c) => {
      if (c.pages.length === 1) throw Error("Keep at least one page");
      c.pages.splice(index, 1);
      index = Math.min(index, c.pages.length - 1);
    }),
  );
  for (const [id, delta] of [
    ["comicEarlier2D", -1],
    ["comicLater2D", 1],
  ])
    $(id).onclick = guard(() =>
      change((c) => {
        const j = index + delta;
        if (j < 0 || j >= c.pages.length) return;
        [c.pages[index], c.pages[j]] = [c.pages[j], c.pages[index]];
        index = j;
      }),
    );
  $("comicApply2D").onclick = guard(() =>
    change((c) => (c.pages[index] = JSON.parse($("comicSource2D").value))),
  );
  $("comicSave2D").onclick = guard(() => {
    P.validateComic(comic);
    download("Cartoon-Comic.jetcomic2d.json", JSON.stringify(comic, null, 2));
  });
  $("comicLoad2D").onchange = guard(async () => {
    const f = $("comicLoad2D").files[0];
    if (!f) return;
    if (f.size > 150e6) throw Error("Comic exceeds 150MB");
    const next = JSON.parse(await f.text());
    P.validateComic(next);
    const preview = await P.page(next, 0);
    comic = next;
    index = 0;
    sync();
    await show(preview, "comicCanvas2D");
    $("comicLoad2D").value = "";
  });
  $("comicPng2D").onclick = guard(async () => {
    const c = await P.page(comic, index);
    download(
      "Comic-Page-" + (index + 1) + ".png",
      await new Promise((r) => c.toBlob(r, "image/png")),
      "image/png",
    );
  });
  $("comicPdf2D").onclick = guard(async () => {
    report("Rendering complete comic PDF…");
    download(
      "Cartoon-Comic.pdf",
      await P.pdf(comic, {
        onProgress: (n, t) => report(`Rendering page ${n}/${t}`),
      }),
      "application/pdf",
    );
    report("PDF downloaded. Save editable comic JSON too.");
  });
  window.PrintEditor2D = {
    getStill: () => copy(shot),
    getComic: () => copy(comic),
    getPageIndex: () => index,
  };
})();
