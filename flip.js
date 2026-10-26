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

  const meta = el("flip-meta");
  const dotsEl = el("flip-dots");
  const dots = panels.map(() => { const d = document.createElement("span"); dotsEl.append(d); return d; });
  const hint = el("flip-hint", "span"); hint.textContent = "Scroll to flip ↓";
  meta.append(dotsEl, hint);

  // A static copy of a card for the fold (no ids, not focusable)
  const copyOf = i => {
    const c = panels[i].cloneNode(true);
    c.classList.remove("is-current");
    c.querySelectorAll("[id]").forEach(x => x.removeAttribute("id"));
    c.removeAttribute("id");
    c.querySelectorAll("img").forEach(img => { img.loading = "eager"; img.decode && img.decode().catch(() => {}); });
    // Keep the pair styling (media padding, image corners) for cards 2 and 3
    if (panels[i].parentElement === pair) { const w = el("panel-pair"); w.append(c); return w; }
    return c;
  };
  const half = (cls, i) => { const s = el("flip-half " + cls); const shade = el("flip-shade"); s.append(copyOf(i), shade); return { s, shade }; };

  // One ready-built fold per pair of cards, so nothing is created or
  // loaded mid-flip (that's what caused the flicker on iPhone)
  const folds = panels.slice(0, -1).map((_, i) => {
    const layer = el("flip-layer"); layer.setAttribute("aria-hidden", "true"); layer.inert = true;
    const top = half("flip-top", i), bottom = half("flip-bottom", i + 1);
    const front = half("flip-front", i), back = half("flip-back", i + 1);
    const flap = el("flip-flap");
    flap.append(front.s, back.s);
    layer.append(top.s, bottom.s, flap);
    stage.append(layer);
    return { layer, flap, top, bottom, front, back };
  });
  stage.append(meta);

  const narrow = window.matchMedia("(max-width: 960px)");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const probe = el("");
  probe.style.cssText = "position:fixed;top:0;height:100vh;height:100svh;width:0;visibility:hidden;pointer-events:none";
  document.body.append(probe);

  const META = 30, GAP = 12;
  let active = false, stickTop = 0, D = 1, lastW = 0, lastVh = 700, raf = 0, current = -1, shown = -1;
  const HOLD = 0.06; // share of each scroll segment where a card rests before folding

  const setCurrent = i => {
    if (i === current) return;
    current = i;
    panels.forEach((p, k) => p.classList.toggle("is-current", k === i));
  };

  const clear = () => {
    sec.classList.remove("is-flip");
    scroller.style.height = "";
    showFold(-1);
    panels.forEach(p => p.classList.remove("is-current"));
    current = -1;
  };

  const showFold = k => {
    if (k === shown) return;
    folds.forEach((f, j) => f.layer.classList.toggle("is-on", j === k));
    shown = k;
  };

  // Where we are: raw runs 0 → n-1 across the section; i is the pair
  // being flipped and e how far through (0 = card i, 1 = card i+1)
  const position = () => {
    const raw = Math.min(n - 1, Math.max(0, (stickTop - scroller.getBoundingClientRect().top) / D));
    const i = Math.min(n - 2, Math.floor(raw));
    const e = Math.min(1, Math.max(0, (raw - i - HOLD) / (1 - 2 * HOLD)));
    return { raw, i, e };
  };

  const paint = () => {
    if (!active) return;
    const { raw, i, e } = position();
    dots.forEach((d, k) => d.classList.toggle("is-on", k === Math.round(raw)));
    hint.style.opacity = raw > 0.25 ? "0" : "1";

    if (e === 0 || e === 1) {
      showFold(-1);
      setCurrent(e === 0 ? i : i + 1);
      return;
    }
    const f = folds[i];
    const a = e * 180; // the fold follows your finger directly
    f.flap.style.transform = `rotateX(${a.toFixed(2)}deg)`;
    // Light falls from above: the lifting page darkens, the landing page brightens
    f.front.shade.style.opacity = (Math.min(1, a / 90) * 0.45).toFixed(3);
    f.back.shade.style.opacity = (a > 90 ? (1 - (a - 90) / 90) * 0.4 : 0.4).toFixed(3);
    f.bottom.shade.style.opacity = ((1 - e) * 0.5).toFixed(3);
    f.top.shade.style.opacity = (Math.min(1, e * 2) * 0.3).toFixed(3);
    showFold(i);       // show the fold first…
    setCurrent(-1);    // …then hide the real card, in the same frame
  };

  // ── One swipe = one card ──────────────────────────────────────
  // While the cards are pinned, a swipe drives the fold directly and is
  // never handed to the browser, so iPhone momentum can't carry it on into
  // the next card. Swiping down past the last card (or up past the first)
  // is left alone, so the page scrolls on as normal.
  const root = document.documentElement;
  const rawNow = () => (stickTop - scroller.getBoundingClientRect().top) / D; // unclamped
  const yFor = r => window.scrollY + scroller.getBoundingClientRect().top - stickTop + r * D;
  const clampCard = k => Math.max(0, Math.min(n - 1, k));

  let anim = 0, animating = false;
  const glideTo = (target, ms = 320) => {
    cancelAnimationFrame(anim);
    animating = true;
    root.style.scrollBehavior = "auto";
    const from = rawNow(), t0 = performance.now();
    const step = now => {
      const t = Math.min(1, (now - t0) / ms);
      const k = 1 - Math.pow(1 - t, 3); // ease out
      window.scrollTo(0, yFor(from + (target - from) * k));
      paint();
      if (t < 1) anim = requestAnimationFrame(step);
      else { animating = false; root.style.scrollBehavior = ""; }
    };
    anim = requestAnimationFrame(step);
  };

  // iPhone keeps coasting after a flick; switching scrolling off for a
  // frame stops it dead, then we glide onto the card it reached
  const stopAt = r => {
    root.style.overflow = "hidden";
    requestAnimationFrame(() => { root.style.overflow = ""; glideTo(r, 240); });
  };

  let touching = false, drag = null, coastFrom = null, coastTimer = 0, snapTimer = 0, lastY = window.scrollY, dir = 0;

  window.addEventListener("touchstart", ev => {
    touching = true;
    coastFrom = null;
    clearTimeout(snapTimer);
    if (animating) { cancelAnimationFrame(anim); animating = false; }
    const r = rawNow();
    if (!active || r < -0.02 || r > n - 1 + 0.02 || ev.touches.length > 1) { drag = null; return; }
    const t = ev.touches[0];
    drag = { x0: t.clientX, y0: t.clientY, k: clampCard(Math.round(r)), flipping: false, lastDy: 0, lastT: performance.now(), v: 0 };
  }, { passive: true });

  window.addEventListener("touchmove", ev => {
    if (!drag) return;
    const t = ev.touches[0];
    const dy = drag.y0 - t.clientY; // + = finger moving up = next card
    const dx = drag.x0 - t.clientX;
    if (!drag.flipping) {
      if (Math.abs(dy) < 6 && Math.abs(dx) < 6) return;
      // Sideways swipe, or heading out of the section: leave it to the browser
      if (Math.abs(dx) > Math.abs(dy) || (drag.k === 0 && dy < 0) || (drag.k === n - 1 && dy > 0)) { drag = null; return; }
      drag.flipping = true;
      root.style.scrollBehavior = "auto";
    }
    ev.preventDefault();
    const span = lastVh * 0.5; // finger travel for a full flip
    const target = Math.max(0, Math.min(n - 1, drag.k + Math.max(-1, Math.min(1, dy / span))));
    window.scrollTo(0, yFor(target));
    paint();
    const now = performance.now(), dt = Math.max(1, now - drag.lastT);
    drag.v = 0.7 * ((dy - drag.lastDy) / dt) + 0.3 * drag.v; // px per ms, smoothed
    drag.lastDy = dy; drag.lastT = now;
  }, { passive: false });

  const endTouch = () => {
    touching = false;
    if (drag && drag.flipping) {
      // Finish the flip if you went a quarter of the way, or flicked it
      const p = rawNow() - drag.k;
      const fresh = performance.now() - drag.lastT < 80; // finger still moving at release
      let target = drag.k;
      if (p > 0.25 || (fresh && drag.v > 0.3 && p > 0.03)) target = drag.k + 1;
      else if (p < -0.25 || (fresh && drag.v < -0.3 && p < -0.03)) target = drag.k - 1;
      drag = null;
      glideTo(clampCard(target));
      return;
    }
    drag = null;
    // A normal scroll: if it coasts into the cards, stop at the first one it reaches
    coastFrom = rawNow();
    scheduleSnap();
  };
  window.addEventListener("touchend", endTouch, { passive: true });
  window.addEventListener("touchcancel", endTouch, { passive: true });

  const checkCoast = () => {
    if (coastFrom === null || touching || animating) return;
    const r = rawNow();
    const down = r > coastFrom;
    const next = down ? Math.max(0, Math.floor(coastFrom + 0.02) + 1) : Math.min(n - 1, Math.ceil(coastFrom - 0.02) - 1);
    if (next < 0 || next > n - 1) return;
    if (down ? (coastFrom < next && r >= next) : (coastFrom > next && r <= next)) { coastFrom = null; stopAt(next); }
  };

  // Mouse wheel / trackpad: if a scroll stops mid-flip, finish it
  const snap = () => {
    if (!active || touching || animating || drag) return;
    const r = rawNow();
    if (r <= 0 || r >= n - 1) return;
    const { i, e } = position();
    if (e === 0 || e === 1) return;
    const forward = dir > 0 ? e > 0.3 : dir < 0 ? e > 0.7 : e >= 0.5;
    glideTo(forward ? i + 1 : i);
  };
  function scheduleSnap() { clearTimeout(snapTimer); snapTimer = setTimeout(snap, 160); }

  const layout = () => {
    lastW = window.innerWidth;
    if (!narrow.matches || reduce.matches) { active = false; clear(); return; }
    const vh = probe.offsetHeight || window.innerHeight;
    lastVh = vh;
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

  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    if (y !== lastY) { dir = y > lastY ? 1 : -1; lastY = y; }
    cancelAnimationFrame(raf); raf = requestAnimationFrame(paint);
    if (!active || animating || drag) return;
    checkCoast();
    clearTimeout(coastTimer); coastTimer = setTimeout(() => { coastFrom = null; }, 250);
    scheduleSnap();
  }, { passive: true });
  window.addEventListener("scrollend", () => { coastFrom = null; snap(); });
  window.addEventListener("resize", () => { if (window.innerWidth !== lastW) layout(); });
  narrow.addEventListener("change", layout);
  reduce.addEventListener("change", layout);
  window.addEventListener("load", layout);
  layout();
})();
