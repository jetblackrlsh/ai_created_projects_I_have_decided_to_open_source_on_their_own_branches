(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  let controller = null;
  const status = (s) => ($("recordStatus2D").textContent = s);
  $("recordMovie2D").onclick = async () => {
    if (controller) return;
    Editor.stop();
    if (window.VoiceEditor2D) VoiceEditor2D.stop();
    controller = new AbortController();
    $("recordMovie2D").disabled = true;
    try {
      const result = await StudioRecorder2D.record(Editor.getProject(), {
        first: Number($("recordFirst2D").value),
        last: Number($("recordLast2D").value),
        signal: controller.signal,
        onProgress: (n, t) =>
          status(
            `Recording ${n.toFixed(1)} / ${t.toFixed(1)}s. Keep this tab visible.`,
          ),
      });
      const url = URL.createObjectURL(result.blob),
        a = document.createElement("a");
      a.href = url;
      a.download = "Cartoon-browser-recording." + result.extension;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      status(
        "Movie downloaded. Browser recording is real-time; use headless export for deterministic normal/2x masters.",
      );
    } catch (e) {
      status(e.message);
    } finally {
      controller = null;
      $("recordMovie2D").disabled = false;
    }
  };
  $("recordCancel2D").onclick = () => controller?.abort();
  $("recordAll2D").onclick = () => {
    $("recordFirst2D").value = 0;
    $("recordLast2D").value = Editor.getProject().scenes.length - 1;
    status("Whole project selected.");
  };
})();
