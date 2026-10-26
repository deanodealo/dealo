// dealo — shared site script (index.html, football.html)

// Nav: border once scrolled
const siteNav = document.getElementById("siteNav");
const onScroll = () => siteNav && siteNav.classList.toggle("is-scrolled", window.scrollY > 10);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Mobile menu
const navBurger = document.getElementById("navBurger");
const navEl = siteNav && siteNav.querySelector("nav");
function setMenu(open) {
  if (!navEl) return;
  navEl.classList.toggle("is-open", open);
  navBurger.setAttribute("aria-expanded", open ? "true" : "false");
  navBurger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}
if (navBurger && navEl) {
  navBurger.addEventListener("click", () => setMenu(!navEl.classList.contains("is-open")));
  navEl.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", e => { if (e.key === "Escape" && navEl.classList.contains("is-open")) { setMenu(false); navBurger.focus(); } });
  window.addEventListener("resize", () => { if (window.innerWidth > 900) setMenu(false); });
}

// ── Home hero cards: dots, arrows and swipe position ─────────
const heroRail = document.getElementById("heroRail");
if (heroRail) {
  const cards = Array.from(heroRail.querySelectorAll(".hcard"));
  const dotsEl = document.getElementById("heroDots");
  const prev = document.getElementById("heroPrev");
  const next = document.getElementById("heroNext");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const goTo = i => {
    const c = cards[Math.max(0, Math.min(cards.length - 1, i))];
    heroRail.scrollTo({ left: c.offsetLeft - cards[0].offsetLeft, behavior: reduce ? "auto" : "smooth" });
  };
  const dots = cards.map((c, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "hero-dot";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-label", `Card ${i + 1} of ${cards.length}`);
    b.addEventListener("click", () => goTo(i));
    dotsEl.appendChild(b);
    return b;
  });
  let current = 0;
  const update = () => {
    const step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : 1;
    const atEnd = heroRail.scrollLeft + heroRail.clientWidth >= heroRail.scrollWidth - 4;
    current = atEnd ? cards.length - 1 : Math.round(heroRail.scrollLeft / step);
    dots.forEach((d, i) => d.setAttribute("aria-selected", i === current ? "true" : "false"));
    if (prev) prev.disabled = current === 0;
    if (next) next.disabled = current === cards.length - 1;
  };
  let raf = 0;
  heroRail.addEventListener("scroll", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); }, { passive: true });
  window.addEventListener("resize", update);
  if (prev) prev.addEventListener("click", () => goTo(current - 1));
  if (next) next.addEventListener("click", () => goTo(current + 1));
  update();
}

// ── "Three ways" cards: stack like a flip book on smaller screens ──
// Cards are pinned by their bottom edge, so a card taller than the screen
// is read in full before the next one slides over it. All bottoms line up
// (with a small stagger) so a covered card never shows below the one on top.
const services = document.querySelector(".services");
if (services) {
  const panels = Array.from(services.querySelectorAll(".panel"));
  const narrow = window.matchMedia("(max-width: 960px)");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  // Height of the screen with the browser's toolbars showing (100svh)
  const probe = document.createElement("div");
  probe.style.cssText = "position:fixed;top:0;height:100vh;height:100svh;width:0;visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);
  const STAGGER = 8, EDGE = 12;
  let active = false, tops = [], raf = 0, lastW = 0, lastVh = 0;

  const paint = () => {
    if (!active) return;
    panels.forEach((p, i) => {
      const next = panels[i + 1];
      let t = 0;
      if (next) {
        // 0 while the next card is a screen away, 1 once it's pinned on top
        const dist = next.getBoundingClientRect().top - tops[i + 1];
        t = Math.min(1, Math.max(0, 1 - dist / (lastVh * 0.85)));
      }
      p.style.transform = t ? `scale(${1 - 0.06 * t})` : "";
      p.style.setProperty("--stack-dim", (0.38 * t).toFixed(3));
    });
  };

  const layout = () => {
    active = narrow.matches && !reduce.matches;
    services.classList.toggle("is-stacked", active);
    panels.forEach(p => { p.style.transform = ""; p.style.removeProperty("--stack-top"); p.style.removeProperty("--stack-dim"); });
    if (!active) return;
    lastW = window.innerWidth;
    lastVh = probe.offsetHeight || window.innerHeight;
    const navH = siteNav ? siteNav.offsetHeight : 0;
    const heights = panels.map(p => p.offsetHeight);
    const last = (panels.length - 1) * STAGGER;
    const bottom = Math.min(lastVh - EDGE - last, navH + EDGE + Math.max(...heights));
    tops = heights.map((h, i) => bottom + i * STAGGER - h);
    panels.forEach((p, i) => p.style.setProperty("--stack-top", tops[i] + "px"));
    paint();
  };

  window.addEventListener("scroll", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(paint); }, { passive: true });
  // Ignore height-only resizes (mobile toolbars showing/hiding while scrolling)
  window.addEventListener("resize", () => { if (window.innerWidth !== lastW || !active) layout(); });
  narrow.addEventListener("change", layout);
  reduce.addEventListener("change", layout);
  if ("ResizeObserver" in window) {
    let ro = 0;
    const obs = new ResizeObserver(() => { cancelAnimationFrame(ro); ro = requestAnimationFrame(layout); });
    panels.forEach(p => obs.observe(p));
  }
  window.addEventListener("load", layout);
  layout();
}

const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ── Testimonials ───────────────────────────────────────────────
// Approved reviews live in testimonials.json (reviews come in through
// review.html and Formspree; Dean approves one by adding it to the file).
// The section stays hidden until there's at least one.
const quotesEl = document.getElementById("quotes");
if (quotesEl) {
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  fetch("testimonials.json", { cache: "no-cache" })
    .then(r => (r.ok ? r.json() : []))
    .then(list => {
      if (!Array.isArray(list) || !list.length) return;
      quotesEl.innerHTML = list.map(t => `
        <figure class="quote">
          <blockquote>“${esc(t.quote)}”</blockquote>
          <figcaption>
            ${t.logo ? `<img src="${esc(t.logo)}" alt="" height="40">` : ""}
            <span><b>${esc(t.name)}</b>${esc([t.role, t.organisation].filter(Boolean).join(", "))}</span>
          </figcaption>
        </figure>`).join("");
      document.getElementById("testimonials").hidden = false;
    })
    .catch(() => {});
}

// ── Savings calculator (only on pages that have it) ────────────
const calcButton = document.getElementById("calcButton");
if (calcButton) {
  const toggleBtns = document.querySelectorAll(".calc-toggle-btn");
  const hostingField = document.getElementById("calcHostingField");
  let hasWebsite = true;

  toggleBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      toggleBtns.forEach(b => { b.classList.remove("is-active"); b.setAttribute("aria-pressed", "false"); });
      btn.classList.add("is-active");
      btn.setAttribute("aria-pressed", "true");
      hasWebsite = btn.dataset.website === "yes";
      hostingField.style.display = hasWebsite ? "" : "none";
      if (!hasWebsite) document.getElementById("calcHosting").value = "";
    });
  });

  const fmt = n => "£" + Math.round(n).toLocaleString("en-GB");

  // Conservative recovery estimates: we'd still charge for hosting/support,
  // and automation rarely removes 100% of admin time. Explained on the page.
  const HOSTING_RECOVERY = 0.5;
  const SOFTWARE_RECOVERY = 0.5;
  const TIME_RECOVERY = 0.7;

  calcButton.addEventListener("click", () => {
    const val = id => parseFloat(document.getElementById(id).value) || 0;
    const annualHosting = hasWebsite ? val("calcHosting") * 12 * HOSTING_RECOVERY : 0;
    const annualSoftware = val("calcSoftware") * 12 * SOFTWARE_RECOVERY;
    const annualTime = val("calcHours") * 52 * val("calcRate") * TIME_RECOVERY;

    document.getElementById("calcTotal").textContent = fmt(annualHosting + annualSoftware + annualTime);
    document.getElementById("calcHostingOut").textContent = fmt(annualHosting) + "/yr";
    document.getElementById("calcSoftwareOut").textContent = fmt(annualSoftware) + "/yr";
    document.getElementById("calcTimeOut").textContent = fmt(annualTime) + "/yr";
    document.getElementById("calcHostingRow").style.display = hasWebsite ? "" : "none";

    const note = document.getElementById("calcWebsiteNote");
    note.textContent = hasWebsite ? "" : "And without a website, you're probably missing customers who search online before they buy. That's on top of these figures.";
    note.classList.toggle("is-visible", !hasWebsite);

    document.getElementById("calcPlaceholder").classList.add("is-hidden");
    document.getElementById("calcOutput").classList.add("is-visible");
  });
}
