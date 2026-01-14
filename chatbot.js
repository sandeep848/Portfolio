/* =========================
   Portfolio Assistant (theme-aware)
   - Syncs greeting + subtitle with active interface
   - Uses themechange event from script.js
   - Keeps command navigation + project matching + highlight
   ========================= */

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const fab = $("#chatbotFab");
  const panel = $("#chatbotPanel");
  const closeBtn = $("#chatbotClose");
  const body = $("#chatbotBody");
  const form = $("#chatbotForm");
  const input = $("#chatbotInput");
  const chips = $$(".chatbot-chip");
  const subtitle = $("#chatbotSubtitle");

  if (!fab || !panel || !body || !form || !input) return;

  const SECTION_LINKS = {
    about: { id: "about", label: "About" },
    projects: { id: "projects", label: "Projects" },
    skills: { id: "skills", label: "Expertise" },
    experience: { id: "experience", label: "Experience" },
    contact: { id: "contact", label: "Contact" },
    top: { id: "top", label: "Top" },
  };

  const SECTION_ALIASES = {
    about: ["about", "who are you", "intro", "introduction"],
    projects: ["projects", "work", "portfolio", "built", "my work", "your work"],
    skills: ["skills", "expertise", "stack", "tech stack", "tools"],
    experience: ["experience", "internship", "internships", "jobs", "work experience"],
    contact: ["contact", "reach", "email", "message", "hire", "connect"],
    top: ["top", "home", "start"],
  };

  const state = { open: false, greeted: false };

  const getTheme = () => document.body.dataset.theme || "minimal";

  function setSubtitleForTheme() {
    if (!subtitle) return;
    const t = getTheme();
    subtitle.textContent = t === "cyber"
      ? "Fast routing • Neon mode synced."
      : "Navigate fast. Ask naturally.";
  }

  // Theme sync
  setSubtitleForTheme();
  window.addEventListener("themechange", setSubtitleForTheme);

  const normalize = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();

  function scrollToBottom() {
    body.scrollTop = body.scrollHeight;
  }

  function addMessage(html, who = "bot") {
    const wrap = document.createElement("div");
    wrap.className = `chatbot-msg ${who === "user" ? "is-user" : "is-bot"}`;

    const bubble = document.createElement("div");
    bubble.className = "chatbot-bubble";
    bubble.innerHTML = html;

    wrap.appendChild(bubble);
    body.appendChild(wrap);
    scrollToBottom();
  }

  function escapeHTML(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function linkHTML(href, label) {
    const safeLabel = escapeHTML(label);
    const safeHref = escapeHTML(href);
    return ` <a href="${safeHref}" data-chatlink="1">${safeLabel} ↗</a>`;
  }

  function sectionLink(key) {
    const s = SECTION_LINKS[key];
    if (!s) return linkHTML("#top", "Top");
    return linkHTML(`#${s.id}`, s.label);
  }

  function userSay(text) {
    addMessage(escapeHTML(text), "user");
  }
  function botSay(html) {
    addMessage(html, "bot");
  }

  function setOpen(open) {
    state.open = open;
    panel.classList.toggle("is-open", open);
    fab.setAttribute("aria-expanded", String(open));
    fab.setAttribute("aria-label", open ? "Close portfolio assistant" : "Open portfolio assistant");

    if (open) {
      if (!state.greeted) {
        state.greeted = true;

        const t = getTheme();
        const greeting =
          t === "cyber"
            ? `// LINK ESTABLISHED. Try: “OPEN ASL”, “GO TO CONTACT”, “SHOW PROJECTS”.${sectionLink("projects")}`
            : `Tell me what you want to see — try “Open the ASL project” or “Go to contact”.${sectionLink("projects")}`;

        botSay(greeting);
      }

      setTimeout(() => input.focus(), prefersReducedMotion ? 0 : 80);
      scrollToBottom();
    }
  }

  function scrollToHash(hash) {
    const id = (hash || "").replace("#", "");
    if (!id) return false;
    const el = document.getElementById(id);
    if (!el) return false;
    el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
    return true;
  }

  function clampSentences(text, maxSentences = 2) {
    const parts = String(text || "")
      .replace(/\s+/g, " ")
      .trim()
      .split(/(?<=[.!?])\s+/)
      .filter(Boolean);
    return parts.slice(0, maxSentences).join(" ");
  }

  function getProjectsArray() {
    const api = window.__PORTFOLIO__;
    if (api && Array.isArray(api.projects)) return api.projects;
    const arr = window.PROJECTS;
    return Array.isArray(arr) ? arr : [];
  }

  function scoreMatch(query, candidate) {
    const q = normalize(query);
    const c = normalize(candidate);
    if (!q || !c) return 0;
    if (q === c) return 100;
    if (c.includes(q)) return 70;
    if (q.includes(c)) return 65;

    const qt = q.split(" ").filter(Boolean);
    const ct = c.split(" ").filter(Boolean);
    let score = 0;

    for (const t of qt) {
      if (t.length < 3) continue;
      if (ct.includes(t)) score += 10;
      else if (c.includes(t)) score += 6;
    }
    return score;
  }

  function findProjectMatch(q) {
    const query = normalize(q);
    if (!query) return null;

    const projects = getProjectsArray();
    if (!projects.length) return null;

    let best = null;
    let bestScore = 0;

    for (const p of projects) {
      const title = p?.title || "";
      const s = scoreMatch(query, title);
      if (s > bestScore) {
        bestScore = s;
        best = p;
      }

      // also score against tech/description (lower weight)
      const tech = (p?.tech || []).join(" ");
      const desc = p?.description || "";
      const s2 = Math.max(scoreMatch(query, tech) - 18, scoreMatch(query, desc) - 22);
      if (s2 > bestScore) {
        bestScore = s2;
        best = p;
      }
    }

    if (!best || bestScore < 24) return null;
    return { project: best, score: bestScore };
  }

  function highlightProject(title) {
    const api = window.__PORTFOLIO__;
    if (api && typeof api.highlightProjectByTitle === "function") {
      return api.highlightProjectByTitle(title);
    }
    return false;
  }

  function openProjectLive(project) {
    const url = project?.liveUrl || project?.url || "";
    if (!url) return false;
    window.open(url, "_blank", "noopener,noreferrer");
    return true;
  }

  function listProjectsHTML(limit = 6) {
    const projects = getProjectsArray();
    if (!projects.length) {
      return `I don’t see any projects loaded yet. Try refreshing, or scroll to ${sectionLink("projects")}.`;
    }
    const items = projects.slice(0, limit).map((p) => {
      const title = escapeHTML(p.title || "Untitled");
      const url = escapeHTML(p.liveUrl || "");
      const link = url ? ` — <a href="${url}" target="_blank" rel="noopener noreferrer" data-chatlink="1">Open ↗</a>` : "";
      return `• <strong>${title}</strong>${link}`;
    });
    const more = projects.length > limit ? `<div style="margin-top:8px;opacity:.85">More in ${sectionLink("projects")}.</div>` : "";
    return `<div>${items.join("<br>")}</div>${more}`;
  }

  function detectSectionFromText(text) {
    const t = normalize(text);

    // direct #hash support
    const hashMatch = String(text || "").match(/#([a-zA-Z0-9_-]+)/);
    if (hashMatch?.[1]) {
      const id = hashMatch[1].toLowerCase();
      const key = Object.keys(SECTION_LINKS).find((k) => SECTION_LINKS[k].id === id);
      if (key) return key;
    }

    // alias scoring
    let bestKey = null;
    let bestScore = 0;
    for (const key of Object.keys(SECTION_ALIASES)) {
      const aliases = SECTION_ALIASES[key] || [];
      for (const a of aliases) {
        const s = scoreMatch(t, a);
        if (s > bestScore) {
          bestScore = s;
          bestKey = key;
        }
      }
      // also match against label/id
      bestScore = Math.max(bestScore, scoreMatch(t, SECTION_LINKS[key]?.id || ""));
      bestScore = Math.max(bestScore, scoreMatch(t, SECTION_LINKS[key]?.label || ""));
    }

    if (!bestKey || bestScore < 40) return null;
    return bestKey;
  }

  function parseIntent(text) {
    const raw = String(text || "");
    const t = normalize(raw);

    const isHelp =
      /\b(help|commands|what can you do|how to use)\b/.test(t);

    const isListProjects =
      /\b(show|list|display|see)\b/.test(t) && /\bprojects?\b/.test(t);

    const hasOpenVerb =
      /\b(open|launch|visit)\b/.test(t);

    const hasShowVerb =
      /\b(show|display|view|see)\b/.test(t);

    const hasGotoVerb =
      /\b(go to|take me to|navigate|scroll to|jump to)\b/.test(t);

    const sectionKey = detectSectionFromText(raw);

    // Try project match if user mentions project-ish intent OR if any match exists strongly
    const maybeProject =
      /\bproject\b/.test(t) || hasOpenVerb || hasShowVerb;

    const projectMatch = maybeProject ? findProjectMatch(raw) : null;

    return {
      isHelp,
      isListProjects,
      hasOpenVerb,
      hasShowVerb,
      hasGotoVerb,
      sectionKey,
      projectMatch,
      raw,
      norm: t
    };
  }

  function respondHelp() {
    const t = getTheme();
    const tone = t === "cyber"
      ? `Commands I understand:<br>• <strong>OPEN</strong> [project]<br>• <strong>SHOW</strong> [project]<br>• <strong>GO TO</strong> [about/projects/expertise/experience/contact]<br>• <strong>SHOW PROJECTS</strong>${sectionLink("projects")}`
      : `Here’s what you can type:<br>• <strong>Open</strong> [project name]<br>• <strong>Show</strong> [project name]<br>• <strong>Go to</strong> [about/projects/expertise/experience/contact]<br>• <strong>Show projects</strong>${sectionLink("projects")}`;
    botSay(tone);
  }

  function handleUserText(text) {
    const intent = parseIntent(text);

    if (intent.isHelp) {
      respondHelp();
      return;
    }

    // Section routing first if explicit
    if (intent.sectionKey && (intent.hasGotoVerb || /\bsection\b/.test(intent.norm) || intent.norm.startsWith("#"))) {
      const ok = scrollToHash(`#${SECTION_LINKS[intent.sectionKey].id}`);
      if (ok) {
        botSay(`Going to <strong>${escapeHTML(SECTION_LINKS[intent.sectionKey].label)}</strong>.${sectionLink(intent.sectionKey)}`);
      } else {
        botSay(`I couldn’t find that section on the page. Try ${sectionLink("top")} or ${sectionLink("projects")}.`);
      }
      return;
    }

    // Project list
    if (intent.isListProjects) {
      botSay(`Here are a few projects:<br>${listProjectsHTML(6)}`);
      return;
    }

    // Project match
    if (intent.projectMatch?.project) {
      const p = intent.projectMatch.project;
      const title = p.title || "That project";

      // Always highlight/scroll when found
      const didHighlight = highlightProject(title);

      // Open live URL only when user explicitly says open/launch/visit
      const didOpen = intent.hasOpenVerb ? openProjectLive(p) : false;

      const parts = [];
      if (intent.hasOpenVerb) {
        parts.push(`Opening <strong>${escapeHTML(title)}</strong> in a new tab.`);
      } else {
        parts.push(`Showing <strong>${escapeHTML(title)}</strong>.`);
      }
      if (didHighlight) parts.push(`I highlighted it in ${sectionLink("projects")}.`);
      else parts.push(`Scroll here: ${sectionLink("projects")}.`);

      if (!didOpen && (p.liveUrl || "")) {
        parts.push(`Want the live link? Type “Open ${escapeHTML(title)}”.`);
      }

      // small snippet
      if (p.description) {
        parts.push(`<span style="opacity:.85">${escapeHTML(clampSentences(p.description, 2))}</span>`);
      }

      botSay(parts.join("<br>"));
      return;
    }

    // If user said "go to ..." but we didn't detect a section, try soft detect anyway
    if (intent.hasGotoVerb && intent.sectionKey) {
      const ok = scrollToHash(`#${SECTION_LINKS[intent.sectionKey].id}`);
      botSay(ok
        ? `Going to <strong>${escapeHTML(SECTION_LINKS[intent.sectionKey].label)}</strong>.${sectionLink(intent.sectionKey)}`
        : `I couldn’t find that section. Try ${sectionLink("projects")} or ${sectionLink("contact")}.`
      );
      return;
    }

    // Contact questions
    if (/\b(contact|email|reach|message you)\b/.test(intent.norm)) {
      botSay(`You can message me via the form in ${sectionLink("contact")} or email directly: <a href="mailto:das364278@gmail.com" data-chatlink="1">das364278@gmail.com ↗</a>`);
      return;
    }

    // Fallback with suggestions
    const projects = getProjectsArray();
    const suggestion = projects.length
      ? `Try: “Show ${escapeHTML(projects[0].title || "a project")}”, or “Go to contact”.`
      : `Try: “Go to projects” or “Go to contact”.`;

    botSay(`I can route you to sections and projects. ${suggestion}`);
  }

  // ----- UI Events -----

  fab.addEventListener("click", () => setOpen(!state.open));

  closeBtn?.addEventListener("click", () => setOpen(false));

  // close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });

  // click outside closes (when open)
  document.addEventListener("click", (e) => {
    if (!state.open) return;
    if (e.target.closest("#chatbotPanel")) return;
    if (e.target.closest("#chatbotFab")) return;
    setOpen(false);
  }, { passive: true });

  // chips
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const q = chip.getAttribute("data-q") || "";
      if (!q.trim()) return;
      setOpen(true);
      userSay(q);
      handleUserText(q);
    });
  });

  // allow clicking links inside bubble to scroll smoothly
  body.addEventListener("click", (e) => {
    const a = e.target.closest('a[data-chatlink="1"]');
    if (!a) return;
    const href = a.getAttribute("href") || "";
    if (href.startsWith("#")) {
      e.preventDefault();
      scrollToHash(href);
    }
  });

  // textarea autosize
  function autosize() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
  }
  input.addEventListener("input", autosize, { passive: true });
  autosize();

  // Enter to send, Shift+Enter for newline
  input.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    if (e.shiftKey) return;
    e.preventDefault();
    form.requestSubmit();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = (input.value || "").trim();
    if (!text) return;

    userSay(text);
    input.value = "";
    autosize();

    handleUserText(text);
  });
})();
