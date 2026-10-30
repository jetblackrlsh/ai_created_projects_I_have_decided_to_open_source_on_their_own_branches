(function () {
  "use strict";
  const input = document.getElementById("bitmapImport2D");
  input.onchange = async () => {
    try {
      const file = input.files[0];
      if (!file) return;
      if (file.size > 20e6) throw Error("Bitmap import limit is 20 MB");
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
        throw Error("Only PNG, JPEG and WebP bitmaps are supported");
      const data = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const im = new Image();
      im.src = data;
      await im.decode();
      if (im.naturalWidth * im.naturalHeight > 40e6)
        throw Error("Bitmap exceeds 40 megapixels");
      const p = Editor.getProject(),
        t = Editor.getTime(),
        s = Studio.locate(p, t).scene,
        ids = new Set();
      p.scenes.forEach((x) => Studio.walk(x.nodes, (n) => ids.add(n.id)));
      let serial = 1,
        id;
      do {
        id = "bitmap_" + serial++;
      } while (ids.has(id));
      const scale = Math.min(
          1,
          (p.width * 0.8) / im.naturalWidth,
          (p.height * 0.8) / im.naturalHeight,
        ),
        width = im.naturalWidth * scale,
        height = im.naturalHeight * scale;
      s.nodes.push({
        id,
        tag: "image",
        attrs: {
          x: -width / 2,
          y: -height / 2,
          width,
          height,
          href: data,
          preserveAspectRatio: "xMidYMid meet",
        },
        pose: { ...Studio.defaults, x: p.width / 2, y: p.height / 2 },
        keys: [],
        children: [],
        library: { role: "bitmap", sourceName: file.name },
      });
      Studio.validate(p);
      Editor.load(p);
      Editor.seek(t);
      document.getElementById("status").textContent =
        "Bitmap embedded as an editable animated layer. Save project JSON to keep it.";
      input.value = "";
    } catch (e) {
      document.getElementById("status").textContent = e.message;
    }
  };
})();
