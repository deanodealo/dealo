// dealo — "How it works": the timeline draws itself as you scroll, each
// step lights up as the line reaches it, and the phone in step 2 builds a
// made-up client site piece by piece. Scrolling back up runs it in reverse.
(() => {
  const sec = document.querySelector(".steps-anim");
  if (!sec) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const vertical = window.matchMedia("(max-width: 760px)");
  const list = sec.querySelector(".step-list");
  const steps = Array.from(list.children);
  const phone = sec.querySelector(".build-phone");
  const blocks = phone ? Array.from(phone.querySelectorAll(".bp-block")) : [];

  // How far through the phone's scroll each piece snaps in
  const BUILD_AT = [0.06, 0.2, 0.34, 0.48, 0.62];
  const BOOKED_AT = 0.8, DONE_AT = 0.9;

  let reach = [], raf = 0, on = false;
  const clamp = v => Math.max(0, Math.min(1, v));

  // Where along the line each step's number sits (0 → 1)
  const measure = () => {
    const vert = vertical.matches;
    const len = vert ? list.offsetHeight : list.offsetWidth;
    reach = steps.map(li => {
      const at = vert ? li.offsetTop + 16 : li.offsetLeft;
      return Math.max(0.001, at / len);
    });
  };

  const paint = () => {
    if (!on) return;
    const vh = window.innerHeight;
    const r = list.getBoundingClientRect();
    // Phones: the line's tip follows a point 60% down the screen.
    // Wider screens: it draws across as the steps come up the screen.
    const p = vertical.matches
      ? clamp((vh * 0.6 - r.top) / r.height)
      : clamp((vh * 0.85 - r.top) / (vh * 0.4));
    list.style.setProperty("--steps-p", p.toFixed(4));
    steps.forEach((li, i) => li.classList.toggle("is-on", p >= reach[i]));

    if (phone) {
      const pr = phone.getBoundingClientRect();
      // Start once most of the phone is on screen; finish as it nears the top.
      // Pieces build top-down, so the part being built is always in view.
      const start = vh - pr.height * 0.55, end = Math.min(start - 200, vh * 0.14);
      const q = clamp((start - pr.top) / Math.max(1, start - end));
      blocks.forEach((b, i) => b.classList.toggle("is-built", q >= BUILD_AT[i]));
      phone.classList.toggle("is-booked", q >= BOOKED_AT);
      phone.classList.toggle("is-done", q >= DONE_AT);
    }
  };

  const setup = () => {
    on = !reduce.matches;
    sec.classList.toggle("is-live", on);
    if (!on) return;
    measure();
    paint();
  };

  window.addEventListener("scroll", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(paint); }, { passive: true });
  window.addEventListener("resize", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(setup); });
  reduce.addEventListener("change", setup);
  window.addEventListener("load", setup);
  setup();
})();
