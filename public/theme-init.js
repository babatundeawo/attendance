/* Runs before first paint so the page never flashes the wrong theme. */
(function () {
  try {
    var saved = localStorage.getItem("attendance-theme");
    if (saved === "dark" || saved === "light") document.documentElement.dataset.theme = saved;
  } catch {
    /* storage unavailable: fall back to the device setting */
  }
})();
