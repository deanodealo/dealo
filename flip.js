// dealo — flip test: the "Three ways" cards fold over like Flipboard.
// Scrolling drives the fold (nothing is hijacked), so it runs both ways and
// the page carries on after the last card. Phones/tablets only; desktop,
// reduced motion, or a screen too short to fit a card get the normal layout.
(() => {
  const sec = document.querySelector(".flip-services");
  if (!sec) return;
  const panels = Array.from(sec.querySelectorAll(".panel"));
  const pair = sec.querySelector(".panel-pair");
  const nav = document.getElementById("siteNav");
  const n = panels.length;
  if (n < 2) return;

  // ── Structure: scroller (tall) > stage (sticky) > cards + fold layer + dots
  const el = (cls, tag = "div") => { const e = document.createElement(tag); e.className = cls; return e; };
  const scroller = el("flip-scroller");
  const stage = el("flip-stage");
  panels[0].before(scroller);
  scroller.append(stage);
  stage.append(panels[0], pair);

  const slot = cls => { const s = el("flip-half " + cls); const shade = el("flip-shade"); s.append(shade); return { s, shade, card: -1 }; };
  const layer = el("flip-layer"); layer.hidden = true; layer.setAttribute("aria-hidden", "true");
  const top = slot("flip-top"), bottom = slot("flip-bottom"), front = slot("flip-front"), back = slot("flip-back");
  const flap = el("flip-flap");
  flap.append(front.s, back.s);
  layer.append(top.s, bottom.s, flap);
  stage.append(layer);

  const meta = el("flip-meta");
  const dotsEl = el("flip-dots");
  const dots = panels.map(() => { const d = document.createElement("span"); dotsEl.append(d); return d; });
  const hint = el("flip-hint", "span"); hint.textContent = "Scroll to flip ↓";
  meta.append(dotsEl, hint);
  stage.append(meta);

  // A static copy of a card for the fold (no ids, not focusable)
  const copyOf = i => {
    const c = panels[i].cloneNode(true);
    c.classList.remove("is-current");
    c.querySelectorAll("[id]").forEach(x => x.removeAttribute("id"));
    c.removeAttribute("id");
    c.querySelectorAll("img").forEach(img => img.loading = "eager");
    // Keep the pair styling (media padding, image corners) for cards 2 and 3
    if (panels[i].parentElement === pair) { const w = el("panel-pair"); w.append(c); return w; }
    return c;
  };
  const put = (sl, i) => {
    if (sl.card === i) return;
    if (sl.s.firstChild !== sl.shade) sl.s.firstChild.remove();
    sl.s.prepend(copyOf(i));
    sl.card = i;
  };

  const narrow = window.matchMedia("(max-width: 960px)");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const probe = el("");
  probe.style.cssText = "position:fixed;top:0;height:100vh;height:100svh;width:0;visibility:hidden;pointer-events:none";
  document.body.append(probe);

  const META = 30, GAP = 12;
  let active = false, stickTop = 0, D = 1, lastW = 0, raf = 0, current = -1, pairAt = -1;

  const setCurrent = i => {
    if (i === current) return;
    current = i;
    panels.forEach((p, k) => p.classList.toggle("is-current", k === i));
  };

  const clear = () => {
    sec.classList.remove("is-flip");
    scroller.style.height = "";
    layer.hidden = true;
    panels.forEach(p => p.classList.remove("is-current"));
    current = -1;
  };

  const paint = () => {
    if (!active) return;
    const raw = Math.min(n - 1, Math.max(0, (stickTop - scroller.getBoundingClientRect().top) / D));
    const i = Math.min(n - 2, Math.floor(raw));
    // Hold each card briefly, flip across the middle of the scroll segment
    const f = Math.min(1, Math.max(0, (raw - i - 0.12) / 0.76));
    const e = f * f * (3 - 2 * f); // smoothstep
    dots.forEach((d, k) => d.classList.toggle("is-on", k === Math.round(raw)));
    hint.style.opacity = raw > 0.25 ? "0" : "1";

    if (e === 0 || e === 1) {
      layer.hidden = true;
      setCurrent(e === 0 ? i : i + 1);
      return;
    }
    if (pairAt !== i) { put(top, i); put(front, i); put(back, i + 1); put(bottom, i + 1); pairAt = i; }
    setCurrent(-1);
    layer.hidden = false;
    const a = e * 180;
    flap.style.transform = `rotateX(${a}deg)`;
    // Light falls from above: the lifting page darkens, the landing page brightens
    front.shade.style.opacity = (Math.min(1, a / 90) * 0.45).toFixed(3);
    back.shade.style.opacity = (a > 90 ? (1 - (a - 90) / 90) * 0.4 : 0.4).toFixed(3);
    bottom.shade.style.opacity = ((1 - e) * 0.5).toFixed(3);
    top.shade.style.opacity = (Math.min(1, e * 2) * 0.3).toFixed(3);
  };

  const layout = () => {
    lastW = window.innerWidth;
    if (!narrow.matches || reduce.matches) { active = false; clear(); return; }
    const vh = probe.offsetHeight || window.innerHeight;
    stickTop = (nav ? nav.offsetHeight : 0) + GAP;
    const h = Math.floor(vh - stickTop - META - GAP);
    sec.style.setProperty("--flip-top", stickTop + "px");
    sec.style.setProperty("--flip-h", h + "px");
    sec.style.setProperty("--flip-meta", META + "px");
    sec.classList.add("is-flip");
    // Too short a screen to show a whole card (copy + some picture)? Use the normal layout.
    const fits = h >= 420 && panels.every(p => p.querySelector(".panel-copy").offsetHeight + 110 <= h);
    if (!fits) { active = false; clear(); return; }
    active = true;
    D = Math.max(320, vh * 0.7);
    scroller.style.height = h + META + (n - 1) * D + "px";
    top.card = bottom.card = front.card = back.card = pairAt = -1; // heights changed: rebuild copies
    current = -1;
    paint();
  };

  // Menu and hero links to #websites / #systems / #ai: scroll to that card
  document.addEventListener("click", ev => {
    const a = ev.target.closest('a[href^="#"]');
    if (!a || !active) return;
    const i = panels.findIndex(p => "#" + p.id === a.getAttribute("href"));
    if (i < 0) return;
    ev.preventDefault();
    const y = window.scrollY + scroller.getBoundingClientRect().top - stickTop + i * D;
    window.scrollTo({ top: y, behavior: reduce.matches ? "auto" : "smooth" });
  });

  window.addEventListener("scroll", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(paint); }, { passive: true });
  window.addEventListener("resize", () => { if (window.innerWidth !== lastW) layout(); });
  narrow.addEventListener("change", layout);
  reduce.addEventListener("change", layout);
  window.addEventListener("load", layout);
  layout();
})();
