
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  /** Debounce with explicit cancellation (prevents timer churn on rapid events). */
  function debounce(fn, wait = 160) {
    let t = 0;
    const debounced = (...args) => {
      if (t) window.clearTimeout(t);
      t = window.setTimeout(() => fn(...args), wait);
    };
    debounced.cancel = () => {
      if (t) window.clearTimeout(t);
      t = 0;
    };
    return debounced;
  }

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  /* =========================================================
     Public API (created unconditionally to avoid race conditions)
     ========================================================= */
  window.__PORTFOLIO__ = window.__PORTFOLIO__ || {
    projects: [],
    highlightProjectByTitle: () => false
  };

  /* =========================
     NAV (mobile) — with basic focus trap
     ========================= */
  (function initNav() {
    const toggle = $(".nav-toggle");
    const menu = $("#nav-links");
    if (!toggle || !menu) return;

    const focusableSel = 'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])';
    let lastActive = null;

    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menu.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);

      if (open) {
        lastActive = document.activeElement;
        // Move focus into the menu for keyboard users
        const first = menu.querySelector(focusableSel);
        (first || menu).focus?.();
      } else {
        // Restore focus
        lastActive?.focus?.();
        lastActive = null;
      }
    };

    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      setOpen(!open);
    });

    // Close when clicking a link
    menu.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      setOpen(false);
    });

    // Click outside closes
    document.addEventListener(
      "click",
      (e) => {
        if (e.target.closest(".nav")) return;
        setOpen(false);
      },
      { passive: true }
    );

    // Escape closes
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });

    // Focus trap (Tab cycling) when menu is open
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      if (!isOpen) return;

      const focusables = $$(focusableSel, menu).filter((el) => el.offsetParent !== null);
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  })();

  /* =========================
     THEMES
     ========================= */
  const THEMES = {
    minimal: { bg: "#0b1020", a: "#7ae7ff", b: "#a78bfa", c: "#ff8fb3" },
    cyber: { bg: "#050914", a: "#00ffd5", b: "#4da3ff", c: "#ff4df0" }
  };

  function dispatchThemeChange() {
    window.dispatchEvent(
      new CustomEvent("themechange", {
        detail: { theme: document.body.dataset.theme || "minimal" }
      })
    );
  }

  function applyTheme(themeKey) {
    const key = THEMES[themeKey] ? themeKey : "minimal";
    document.body.dataset.theme = key;
    document.body.classList.toggle("theme-minimal", key === "minimal");
    document.body.classList.toggle("theme-cyber", key === "cyber");
    localStorage.setItem("theme", key);

    // Update palette active state
    $$(".theme-option").forEach((btn) => btn.classList.toggle("is-active", btn.dataset.theme === key));

    dispatchThemeChange();
  }

  /* =========================
     IMMERSIVE SWITCH (ripple reveal)
     - Uses clip-path when available, falls back to opacity fade.
     - Disables body transitions during the switch to prevent illegible intermediate states.
     ========================= */
  (function initThemeSwitch() {
    const btn = $("#themeBtn");
    const palette = $("#themePalette");
    const reveal = $("#metaReveal");
    const options = $$(".theme-option", palette || document);

    const readStored = () => {
      const stored = localStorage.getItem("theme");
      return THEMES[stored] ? stored : "minimal";
    };

    function setOriginFromEvent(e) {
      if (!reveal) return;
      const x = e?.clientX != null ? `${Math.round((e.clientX / innerWidth) * 100)}%` : "70%";
      const y = e?.clientY != null ? `${Math.round((e.clientY / innerHeight) * 100)}%` : "20%";
      reveal.style.setProperty("--rx", x);
      reveal.style.setProperty("--ry", y);
    }

    function paintReveal(themeKey) {
      if (!reveal) return;
      const t = THEMES[themeKey] || THEMES.minimal;
      reveal.style.setProperty("--n-bg", t.bg);
      reveal.style.setProperty("--n-a", t.a);
      reveal.style.setProperty("--n-b", t.b);
      reveal.style.setProperty("--n-c", t.c);
    }

    function togglePalette(open) {
      if (!palette || !btn) return;
      const next = typeof open === "boolean" ? open : !palette.classList.contains("is-open");
      palette.classList.toggle("is-open", next);
      btn.setAttribute("aria-expanded", String(next));
    }

    function runMetamorphosisTo(themeKey, meta = { closePalette: true }) {
      if (prefersReducedMotion || !reveal) {
        applyTheme(themeKey);
        if (meta.closePalette) togglePalette(false);
        return;
      }

      // Prevent mid-transition illegible text states by freezing transitions.
      document.body.classList.add("theme-is-switching");

      paintReveal(themeKey);

      // restart anim reliably
      reveal.classList.remove("is-revealing");
      // force reflow
      void reveal.offsetWidth;
      reveal.classList.add("is-revealing");

      const cleanup = () => {
        reveal.classList.remove("is-revealing");
        reveal.style.filter = ""; // defensive: ensure filters never accumulate
        document.body.classList.remove("theme-is-switching");
      };

      reveal.addEventListener(
        "animationend",
        () => {
          applyTheme(themeKey);
          cleanup();
          if (meta.closePalette) togglePalette(false);
        },
        { once: true }
      );
    }

    // init theme from storage
    applyTheme(readStored());

    if (btn && palette) {
      btn.addEventListener("click", (e) => {
        setOriginFromEvent(e);
        togglePalette();
      });
      document.addEventListener("click", (e) => {
        if (!e.target.closest("#themeSwitch")) togglePalette(false);
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") togglePalette(false);
      });
    }

    options.forEach((opt) => {
      opt.addEventListener("click", (e) => {
        setOriginFromEvent(e);
        runMetamorphosisTo(opt.dataset.theme || "minimal", { closePalette: true });
      });
    });
  })();

  /* =========================
     REVEALS (IntersectionObserver) — disconnect when done
     ========================= */
  (function initReveals() {
    const nodes = $$(".reveal");
    if (!nodes.length) return;

    if (prefersReducedMotion) {
      nodes.forEach((n) => n.classList.add("is-in"));
      return;
    }

    let remaining = nodes.length;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
          remaining -= 1;
          if (remaining <= 0) io.disconnect();
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );

    nodes.forEach((n) => io.observe(n));
  })();

  /* =========================
     TILT — cancel RAF on leave
     ========================= */
  (function initTilt() {
    if (prefersReducedMotion) return;

    const cards = $$("[data-tilt]");
    if (!cards.length) return;

    const max = 10;

    const onMove = (el, e) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / (r.width / 2);
      const dy = (e.clientY - cy) / (r.height / 2);
      const rx = clamp((-dy) * max, -max, max);
      const ry = clamp(dx * max, -max, max);
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
      el.style.transformOrigin = "center";
    };

    const onLeave = (el) => {
      el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)";
    };

    cards.forEach((el) => {
      let raf = 0;

      el.addEventListener(
        "mousemove",
        (e) => {
          if (raf) cancelAnimationFrame(raf);
          raf = requestAnimationFrame(() => onMove(el, e));
        },
        { passive: true }
      );

      el.addEventListener(
        "mouseleave",
        () => {
          if (raf) cancelAnimationFrame(raf);
          raf = 0;
          onLeave(el);
        },
        { passive: true }
      );
    });
  })();

  /* =========================
     CANVAS PARTICLES (theme aware, pause when hidden/offscreen)
     ========================= */
  (function initCanvas() {
    const canvas = $("#fx-canvas");
    if (!canvas || prefersReducedMotion) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let w = 0,
      h = 0,
      dpr = 1;

    const read = () => getComputedStyle(document.documentElement);

    const hexToRgba = (hex, a) => {
      const h = String(hex || "").replace("#", "").trim();
      if (h.length !== 6) return `rgba(255,255,255,${a})`;
      const r = parseInt(h.slice(0, 2), 16);
      const g = parseInt(h.slice(2, 4), 16);
      const b = parseInt(h.slice(4, 6), 16);
      return `rgba(${r},${g},${b},${a})`;
    };

    const themeColors = () => {
      const s = read();
      const A = s.getPropertyValue("--a").trim() || "#7ae7ff";
      const B = s.getPropertyValue("--b").trim() || "#a78bfa";
      const C = s.getPropertyValue("--c").trim() || "#ff8fb3";
      return [hexToRgba(A, 0.18), hexToRgba(B, 0.14), hexToRgba(C, 0.11)];
    };

    let colors = themeColors();

    const resize = () => {
      w = innerWidth;
      h = innerHeight;

      // Higher DPR improves sharpness on premium devices, but keep a safe cap.
      dpr = clamp(devicePixelRatio || 1, 1, 3);

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onResize = debounce(resize, 160);
    window.addEventListener("resize", onResize, { passive: true });

    resize();

    const count = clamp(Math.floor((w * h) / 56000), 24, 70);
    const pts = Array.from({ length: count }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1.2 + Math.random() * 2.2,
      vx: -0.18 + Math.random() * 0.36,
      vy: -0.12 + Math.random() * 0.24,
      c: colors[Math.floor(Math.random() * colors.length)]
    }));

    window.addEventListener("themechange", () => {
      colors = themeColors();
      pts.forEach((p) => (p.c = colors[Math.floor(Math.random() * colors.length)]));
    });

    let mx = w * 0.5,
      my = h * 0.5;
    window.addEventListener(
      "mousemove",
      (e) => {
        mx = e.clientX;
        my = e.clientY;
      },
      { passive: true }
    );

    let rafId = 0;
    let running = false;
    let canvasVisible = true;

    function draw() {
      if (!running) return;

      ctx.clearRect(0, 0, w, h);

      for (const p of pts) {
        p.vx += (mx - p.x) * 0.000004;
        p.vy += (my - p.y) * 0.000004;
        p.vx *= 0.998;
        p.vy *= 0.998;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        ctx.beginPath();
        ctx.fillStyle = p.c;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(draw);
    }

    function start() {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(draw);
    }

    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    }

    // Pause when tab hidden (battery + CPU)
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else if (canvasVisible) start();
    });

    // Pause when canvas is offscreen (e.g., printed layouts / embedded contexts)
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        canvasVisible = !!entry?.isIntersecting;
        if (!canvasVisible) stop();
        else if (!document.hidden) start();
      },
      { threshold: 0.01 }
    );
    io.observe(canvas);

    start();
  })();

  /* =========================
     PROJECT DATA + RENDER (one-time DOM build + fast filtering)
     ========================= */
  const PROJECTS = [
    {
      title: "Portfolio",
      description: "This site — built to be fast, clean, and easy to maintain.",
      tech: ["HTML", "CSS", "JavaScript"],
      category: ["web"],
      liveUrl: "https://sandeep848.github.io/Portfolio/",
      thumbSeed: "portfolio"
    },
    {
      title: "Agentic Chatbot with Multi-tool Access",
      description: "A chatbot that can route tasks to different tools and workflows, built for real utility.",
      tech: ["Python", "LangChain", "Streamlit"],
      category: ["ai", "nlp"],
      liveUrl: "https://agentic-chatbot-with-multi-tool-access-ca4b9apsapp33hpptduytfy.streamlit.app/",
      thumbSeed: "agentic"
    },
    {
      title: "Deep Gesture Interpretation for American Sign Language",
      description: "Real-time ASL recognition using deep learning and efficient hand tracking.",
      tech: ["TensorFlow", "Computer Vision", "MediaPipe"],
      category: ["ai", "cv"],
      liveUrl: "https://ijcrt.org/viewfull.php?&p_id=IJCRT2411127",
      thumbSeed: "asl"
    },
    {
      title: "Cross-Lingual NLP Models for Multilingual Understanding",
      description: "Multilingual transformer experiments focused on cross-language understanding.",
      tech: ["Transformers", "Hugging Face", "Multilingual NLP"],
      category: ["ai", "nlp"],
      liveUrl: "https://colab.research.google.com/drive/1d-9gi4yRj7dw_6FgwB_nPBjXv5FZF3GS?usp=sharing",
      thumbSeed: "xling"
    }
  ];

  const normalize = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

  function svgThumb(seedText) {
    const safe = String(seedText || "project").replace(/[^\w-]/g, "").slice(0, 20);
    const s = getComputedStyle(document.documentElement);
    const a = s.getPropertyValue("--a").trim() || "#7ae7ff";
    const b = s.getPropertyValue("--b").trim() || "#a78bfa";
    const c = s.getPropertyValue("--c").trim() || "#ff8fb3";

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${a}" stop-opacity="0.95"/>
      <stop offset="0.5" stop-color="${b}" stop-opacity="0.92"/>
      <stop offset="1" stop-color="${c}" stop-opacity="0.90"/>
    </linearGradient>
    <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="28"/>
    </filter>
  </defs>
  <rect width="1200" height="675" fill="#0b1020"/>
  <circle cx="260" cy="180" r="220" fill="url(#g)" filter="url(#blur)" opacity="0.55"/>
  <circle cx="940" cy="160" r="260" fill="url(#g)" filter="url(#blur)" opacity="0.40"/>
  <circle cx="860" cy="560" r="260" fill="url(#g)" filter="url(#blur)" opacity="0.28"/>
  <rect x="64" y="72" width="1072" height="531" rx="34" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)"/>
  <text x="110" y="180" fill="rgba(255,255,255,0.92)" font-family="Manrope, Arial" font-size="54" font-weight="800" letter-spacing="-0.5">${safe.toUpperCase()}</text>
  <text x="110" y="240" fill="rgba(255,255,255,0.70)" font-family="JetBrains Mono, monospace" font-size="22">Click the card to open</text>
</svg>`;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  (function initProjects() {
    const grid = $("#projectsGrid");
    if (!grid) return;

    const searchInput = $("#projectSearch");
    const filterWrap = $(".filters");

    const state = { filter: "all", query: "" };
    const cards = [];

    const matches = (p) => {
      const inFilter = state.filter === "all" || (p.category || []).includes(state.filter);
      if (!inFilter) return false;

      const q = normalize(state.query);
      if (!q) return true;

      const hay = normalize([p.title, p.description, ...(p.tech || []), ...(p.category || [])].join(" "));
      return hay.includes(q);
    };

    function makeCard(p, i) {
      const card = document.createElement("article");
      card.className = "project-card reveal tilt";
      card.dataset.tilt = "";
      card.dataset.title = encodeURIComponent(p.title || "");
      card.dataset.live = encodeURIComponent(p.liveUrl || "");
      card.dataset.idx = String(i);
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `Open ${p.title}`);

      const media = document.createElement("div");
      media.className = "project-media";

      const img = document.createElement("img");
      img.loading = "lazy";
      img.decoding = "async";
      img.alt = `${p.title} thumbnail`;
      img.width = 1200;
      img.height = 675;
      img.src = svgThumb(p.thumbSeed || p.title);
      media.appendChild(img);

      const body = document.createElement("div");
      body.className = "project-body";

      const h = document.createElement("h3");
      h.className = "project-title";
      h.textContent = p.title;

      const d = document.createElement("p");
      d.className = "project-desc";
      d.textContent = p.description;

      const tags = document.createElement("div");
      tags.className = "project-tags";
      tags.setAttribute("aria-label", "Technologies");
      (p.tech || []).slice(0, 6).forEach((t) => {
        const s = document.createElement("span");
        s.className = "tag";
        s.textContent = t;
        tags.appendChild(s);
      });

      body.append(h, d, tags);
      card.append(media, body);

      // Reveal delay (optional stagger, keeps HTML cleaner than strings)
      card.style.setProperty("--d", `${Math.min(i * 80, 480)}ms`);

      return { card, img, project: p };
    }

    // Build once
    const frag = document.createDocumentFragment();
    PROJECTS.forEach((p, i) => {
      const item = makeCard(p, i);
      cards.push(item);
      frag.appendChild(item.card);
    });
    grid.innerHTML = "";
    grid.appendChild(frag);

    // Single delegated open handler
    const openFromCard = (cardEl) => {
      const live = decodeURIComponent(cardEl.getAttribute("data-live") || "");
      if (live) window.open(live, "_blank", "noopener,noreferrer");
    };

    grid.addEventListener("click", (e) => {
      const card = e.target.closest(".project-card");
      if (!card) return;
      openFromCard(card);
    });

    // Keyboard open: Enter/Space (prevent page scroll)
    grid.addEventListener("keydown", (e) => {
      const key = e.key;
      if (key !== "Enter" && key !== " " && key !== "Spacebar") return;

      const card = e.target.closest(".project-card");
      if (!card) return;

      e.preventDefault();
      openFromCard(card);
    });

    // Reveal in-view (disconnect when done)
    if (prefersReducedMotion) {
      $$(".reveal", grid).forEach((n) => n.classList.add("is-in"));
    } else {
      let remaining = cards.length;
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
            remaining -= 1;
            if (remaining <= 0) io.disconnect();
          }
        },
        { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
      );
      $$(".reveal", grid).forEach((n) => io.observe(n));
    }

    // Filtering without re-creating DOM
    function renderFilter() {
      let any = false;
      for (const { card, project } of cards) {
        const show = matches(project);
        card.toggleAttribute("hidden", !show);
        card.setAttribute("aria-hidden", String(!show));
        if (show) any = true;
      }

      const empty = $(".empty", grid);
      if (!any) {
        if (!empty) {
          const el = document.createElement("div");
          el.className = "empty";
          el.textContent = "Nothing matched that search. Try a different keyword or category.";
          grid.appendChild(el);
        }
      } else if (empty) {
        empty.remove();
      }
    }

    // Filters
    if (filterWrap) {
      filterWrap.addEventListener("click", (e) => {
        const btn = e.target.closest(".filter-btn");
        if (!btn) return;

        $$(".filter-btn", filterWrap).forEach((b) => {
          const active = b === btn;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-selected", String(active));
        });

        state.filter = btn.dataset.filter || "all";
        renderFilter();
      });
    }

    // Search
    if (searchInput) {
      const onInput = debounce((e) => {
        state.query = e.target.value || "";
        renderFilter();
      }, 120);
      searchInput.addEventListener("input", onInput);
    }

    // Update thumbs on theme change (ensures "theme-synced" visuals)
    window.addEventListener("themechange", () => {
      for (const item of cards) {
        item.img.src = svgThumb(item.project.thumbSeed || item.project.title);
      }
    });

    // Expose helper API for assistant
    window.__PORTFOLIO__.projects = PROJECTS;

    window.__PORTFOLIO__.highlightProjectByTitle = (title) => {
      const norm = normalize(title);
      if (!norm) return false;

      let best = null;

      for (const { card } of cards) {
        const t = decodeURIComponent(card.getAttribute("data-title") || "");
        if (normalize(t) === norm) {
          best = card;
          break;
        }
      }
      if (!best) {
        for (const { card } of cards) {
          const t = decodeURIComponent(card.getAttribute("data-title") || "");
          const n = normalize(t);
          if (n.includes(norm) || norm.includes(n)) {
            best = card;
            break;
          }
        }
      }
      if (!best) return false;

      best.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
      best.classList.remove("is-ping");
      void best.offsetWidth;
      best.classList.add("is-ping");
      window.setTimeout(() => best.classList.remove("is-ping"), 1200);
      return true;
    };

    // Notify late-loading consumers (chatbot) that projects are ready.
    window.dispatchEvent(new CustomEvent("portfolio:ready", { detail: { projects: PROJECTS } }));
  })();

  /* Footer year */
  (() => {
    const y = $("#year");
    if (y) y.textContent = String(new Date().getFullYear());
  })();
})();
