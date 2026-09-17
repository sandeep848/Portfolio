(() => {
  "use strict";

  const USER = "sandeep848";
  const EXCLUDED = new Set(["Portfolio", "sandeep848"]);
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const normalize = (value) => String(value || "").toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim();

  const CATALOG = [
    {repo:"deepfake-robustness-benchmark",title:"Deepfake Robustness Benchmark",description:"Stress-tests an EfficientNet-B0 detector against compression, resizing, and blur to measure how deepfake models behave outside ideal datasets.",tech:["PyTorch","EfficientNet","Grad-CAM"],category:["cv"],eyebrow:"Model reliability",featured:true,seed:"deepfake"},
    {repo:"european-image-geolocation",title:"European Image Geolocation",description:"Predicts where a European street image was captured using hierarchical classification and spherical coordinate decoding in a sub-5M-parameter model.",tech:["PyTorch","RegNet","Geospatial AI"],category:["cv"],eyebrow:"Efficient vision",featured:true,seed:"geolocation"},
    {repo:"nuremberg-land-cover-ml",title:"Nuremberg Land-Cover Intelligence",description:"Turns Sentinel-2 imagery into 100 m land-cover composition and urban-change estimates using a reproducible LightGBM pipeline.",tech:["Sentinel-2","LightGBM","Streamlit"],category:["cv","data"],eyebrow:"Remote sensing",featured:true,seed:"landcover"},
    {repo:"agentic-multi-tool-chatbot",title:"Multi-Tool Research Agent",description:"Routes research questions across uploaded PDFs, web search, arXiv, and Wikipedia, selecting the right tool for each step.",tech:["LangChain","RAG","Streamlit"],category:["genai"],eyebrow:"Agentic research",seed:"agent"},
    {repo:"nvidia-nim-rag-assistant",title:"Citation-First NVIDIA NIM RAG",description:"Combines dense and lexical retrieval for document Q&A, returning page-level citations so answers remain inspectable.",tech:["NVIDIA NIM","FAISS","Hybrid Search"],category:["genai"],eyebrow:"Grounded answers",seed:"rag"},
    {repo:"langchain-sqlite-assistant",title:"Safe SQLite Analytics Assistant",description:"Translates natural-language questions into read-only SQLite analysis with deterministic validation and an auditable query trail.",tech:["LangChain","SQLite","SQL Safety"],category:["genai","data"],eyebrow:"Text to SQL",seed:"sqlite"},
    {repo:"langchain-text-summarizer",title:"Long-Form Content Summarizer",description:"Uses bounded chunking and map-reduce synthesis to summarize PDFs, webpages, and YouTube transcripts without losing structure.",tech:["LangChain","Map-Reduce","PDF"],category:["genai"],eyebrow:"Document intelligence",seed:"summary"},
    {repo:"langchain-math-problem-solver",title:"Verified Math Problem Solver",description:"Solves symbolic mathematics with SymPy first, then uses an LLM to explain the verified result in understandable steps.",tech:["SymPy","LangChain","Verification"],category:["genai"],eyebrow:"Symbolic reasoning",seed:"math"},
    {repo:"codellama-dynamic-prompt-handler",title:"Local CodeLlama Engineering Workbench",description:"A private-by-default local assistant with focused workflows for debugging, testing, refactoring, explanation, and security review.",tech:["CodeLlama","Ollama","Streamlit"],category:["genai"],eyebrow:"Developer tools",seed:"codellama"},
    {repo:"stable-diffusion-lora-style-tuning",title:"Dual-Adapter LoRA Style Tuning",description:"Fine-tunes two independent visual styles for Stable Diffusion 1.5 with custom-token gradient masking and lightweight adapters.",tech:["Diffusers","LoRA","PyTorch"],category:["genai","cv"],eyebrow:"Generative vision",seed:"lora"},
    {repo:"redshift-streaming-analytics",title:"Streaming Redshift Analytics",description:"Moves live query telemetry through Kafka into DuckDB and a Streamlit dashboard for real-time warehouse monitoring.",tech:["Kafka","DuckDB","Docker"],category:["data"],eyebrow:"Real-time pipeline",seed:"streaming"},
    {repo:"redshift-query-metrics-prototype",title:"Redshift Capacity Scoring",description:"Scores exported Redshift workloads offline to surface capacity risks and performance bottlenecks without cloud dependencies.",tech:["Pandas","Redshift","Capacity Planning"],category:["data"],eyebrow:"Performance analytics",seed:"metrics"},
    {repo:"google-cloud-speechtext",title:"Cloud Speech Transcription Service",description:"Transcribes audio with Google Cloud Speech-to-Text and persists results through Firestore with optional Cloud Storage.",tech:["Google Cloud","Node.js","Firestore"],category:["data","web"],eyebrow:"Cloud application",seed:"speech"},
    {repo:"llm-analytics-dashboard",title:"AI Analytics Workspace",description:"A full-stack workspace that turns uploaded datasets and business goals into visual insights and actionable recommendations.",tech:["React","FastAPI","Analytics"],category:["web","data"],eyebrow:"Full-stack product",seed:"dashboard"}
  ];

  const byRepo = new Map(CATALOG.map((project) => [project.repo.toLowerCase(), project]));
  const humanize = (name) => String(name || "Project").replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  const inferCategory = (repo) => {
    const signal = normalize([repo.name, repo.description, repo.language, ...(repo.topics || [])].join(" "));
    const values = [];
    if (/llm|langchain|rag|prompt|lora|diffusion|generative|agent|ollama/.test(signal)) values.push("genai");
    if (/vision|image|deepfake|geospatial|land cover|pytorch|tensorflow/.test(signal)) values.push("cv");
    if (/data|sql|redshift|kafka|duckdb|cloud|firestore|analytics/.test(signal)) values.push("data");
    if (/react|javascript|typescript|node|fastapi|web|dashboard/.test(signal)) values.push("web");
    return values.length ? [...new Set(values)] : ["web"];
  };

  const fallback = () => CATALOG.map((project) => ({
    ...project,
    repoUrl:`https://github.com/${USER}/${project.repo}`,
    language:project.tech[0],
    topics:[],
    stars:0,
    forks:0,
    updatedAt:"2026-09-01T00:00:00Z"
  }));

  async function load() {
    try {
      const response = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`, {headers:{Accept:"application/vnd.github+json"}});
      if (!response.ok) throw new Error(`GitHub API ${response.status}`);
      const repos = await response.json();
      const projects = repos.filter((repo) => !repo.private && !EXCLUDED.has(repo.name)).map((repo) => {
        const curated = byRepo.get(repo.name.toLowerCase());
        return {
          ...(curated || {}),
          repo:repo.name,
          title:curated?.title || humanize(repo.name),
          description:curated?.description || repo.description || "Explore the implementation, engineering decisions, and source code in this repository.",
          tech:curated?.tech || [repo.language, ...(repo.topics || [])].filter(Boolean).slice(0,4),
          category:curated?.category || inferCategory(repo),
          eyebrow:curated?.eyebrow || "GitHub project",
          seed:curated?.seed || repo.name,
          repoUrl:repo.html_url,
          language:repo.language || curated?.tech?.[0] || "Code",
          topics:repo.topics || [],
          stars:repo.stargazers_count || 0,
          forks:repo.forks_count || 0,
          updatedAt:repo.updated_at || "2026-09-01T00:00:00Z"
        };
      });
      projects.sort((a,b) => Number(Boolean(b.featured))-Number(Boolean(a.featured)) || new Date(b.updatedAt)-new Date(a.updatedAt));
      return {projects,synced:true};
    } catch (error) {
      console.warn("Using built-in project catalog:",error);
      return {projects:fallback(),synced:false};
    }
  }

  function thumb(project) {
    const style = getComputedStyle(document.documentElement);
    const a = style.getPropertyValue("--a").trim() || "#7ae7ff";
    const b = style.getPropertyValue("--b").trim() || "#a78bfa";
    const c = style.getPropertyValue("--c").trim() || "#ff8fb3";
    const name = String(project.seed || project.repo).replace(/[^\w-]/g,"").slice(0,20).toUpperCase();
    const label = String(project.eyebrow || "Engineering project").replace(/[<>&"]/g,"").slice(0,28).toUpperCase();
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${a}"/><stop offset=".52" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient><filter id="blur"><feGaussianBlur stdDeviation="42"/></filter></defs><rect width="1200" height="675" fill="#080d1c"/><circle cx="270" cy="120" r="260" fill="${a}" opacity=".3" filter="url(#blur)"/><circle cx="970" cy="520" r="300" fill="${b}" opacity=".28" filter="url(#blur)"/><path d="M0 540C280 370 460 680 760 470S1080 320 1200 410V675H0Z" fill="url(#g)" opacity=".18"/><rect x="66" y="64" width="1068" height="547" rx="38" fill="#fff" fill-opacity=".045" stroke="#fff" stroke-opacity=".14"/><text x="112" y="174" fill="#fff" fill-opacity=".62" font-family="monospace" font-size="21" letter-spacing="3">${label}</text><text x="112" y="274" fill="#fff" font-family="Arial" font-size="64" font-weight="800">${name}</text><rect x="112" y="326" width="112" height="7" rx="4" fill="url(#g)"/><circle cx="1050" cy="144" r="31" fill="none" stroke="#fff" stroke-opacity=".6"/><path d="M1038 156l25-25m-17 0h17v17" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  const formatDate = (value) => new Intl.DateTimeFormat("en",{month:"short",year:"numeric"}).format(new Date(value));

  load().then(({projects,synced}) => {
    const grid=$("#projectsGrid");
    if (!grid) return;
    const status=$("#projectSyncStatus");
    if (status) status.textContent=synced ? `Synced with GitHub • ${projects.length} public projects` : `Showing ${projects.length} projects • live sync will retry on refresh`;
    status?.closest(".project-sync")?.classList.toggle("is-fallback",!synced);
    const metric=$("#projectMetric");
    if (metric) metric.textContent=`${projects.length}+`;

    const cards=projects.map((project,index) => {
      const card=document.createElement("article");
      card.className=`project-card reveal is-in${project.featured ? " is-featured":""}`;
      card.dataset.title=encodeURIComponent(project.title);
      card.dataset.live=encodeURIComponent(project.repoUrl);
      card.tabIndex=0;
      card.setAttribute("role","link");
      card.setAttribute("aria-label",`Open ${project.title} on GitHub`);
      const media=document.createElement("div"); media.className="project-media";
      const img=document.createElement("img"); img.alt=""; img.width=1200; img.height=675; img.loading=index<3?"eager":"lazy"; img.decoding="async"; img.src=thumb(project); media.append(img);
      const body=document.createElement("div"); body.className="project-body";
      const top=document.createElement("div"); top.className="project-card-top";
      const eyebrow=document.createElement("span"); eyebrow.className="project-eyebrow mono"; eyebrow.textContent=project.eyebrow;
      const arrow=document.createElement("span"); arrow.className="project-arrow"; arrow.setAttribute("aria-hidden","true"); arrow.textContent="↗"; top.append(eyebrow,arrow);
      const title=document.createElement("h3"); title.className="project-title"; title.textContent=project.title;
      const description=document.createElement("p"); description.className="project-desc"; description.textContent=project.description;
      const tags=document.createElement("div"); tags.className="project-tags"; tags.setAttribute("aria-label","Technologies");
      project.tech.slice(0,4).forEach((value) => {const tag=document.createElement("span"); tag.className="tag"; tag.textContent=value; tags.append(tag);});
      const meta=document.createElement("div"); meta.className="project-meta mono";
      const language=document.createElement("span"); language.className="project-language"; const dot=document.createElement("i"); dot.setAttribute("aria-hidden","true"); language.append(dot,document.createTextNode(project.language));
      const updated=document.createElement("span"); updated.textContent=`Updated ${formatDate(project.updatedAt)}`; meta.append(language,updated);
      if(project.stars){const stars=document.createElement("span");stars.textContent=`★ ${project.stars}`;meta.append(stars);}
      if(project.forks){const forks=document.createElement("span");forks.textContent=`⑂ ${project.forks}`;meta.append(forks);}
      body.append(top,title,description,tags,meta); card.append(media,body);
      return {card,img,project};
    });
    grid.replaceChildren(...cards.map(({card})=>card));

    const open=(card) => {const url=decodeURIComponent(card.dataset.live||"");if(url) window.open(url,"_blank","noopener,noreferrer");};
    grid.addEventListener("click",(event)=>{const card=event.target.closest(".project-card");if(card)open(card);});
    grid.addEventListener("keydown",(event)=>{if(!["Enter"," ","Spacebar"].includes(event.key))return;const card=event.target.closest(".project-card");if(card){event.preventDefault();open(card);}});

    const state={filter:"all",query:""};
    const render=()=>{
      let visible=0;
      cards.forEach(({card,project})=>{
        const hay=normalize([project.title,project.description,project.eyebrow,project.language,...project.tech,...project.topics].join(" "));
        const show=(state.filter==="all"||project.category.includes(state.filter))&&(!normalize(state.query)||hay.includes(normalize(state.query)));
        card.toggleAttribute("hidden",!show); card.setAttribute("aria-hidden",String(!show)); if(show)visible++;
      });
      const empty=$(".empty",grid);
      if(!visible&&!empty){const el=document.createElement("div");el.className="empty";el.textContent="No projects match that search. Try another keyword or category.";grid.append(el);}
      else if(visible&&empty)empty.remove();
    };
    $(".filters")?.addEventListener("click",(event)=>{const button=event.target.closest(".filter-btn");if(!button)return;$$(".filter-btn",$(".filters")).forEach((item)=>{const active=item===button;item.classList.toggle("is-active",active);item.setAttribute("aria-selected",String(active));});state.filter=button.dataset.filter||"all";render();});
    let timer; $("#projectSearch")?.addEventListener("input",(event)=>{clearTimeout(timer);timer=setTimeout(()=>{state.query=event.target.value||"";render();},130);});
    window.addEventListener("themechange",()=>cards.forEach(({img,project})=>{img.src=thumb(project);}));

    window.__PORTFOLIO__=window.__PORTFOLIO__||{};
    window.__PORTFOLIO__.projects=projects.map((project)=>({...project,liveUrl:project.repoUrl}));
    window.__PORTFOLIO__.highlightProjectByTitle=(value)=>{
      const query=normalize(value);
      const match=cards.find(({project})=>{const candidate=normalize([project.title,project.repo].join(" "));return candidate===query||candidate.includes(query)||query.includes(candidate);});
      if(!match)return false;
      match.card.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"center"});
      match.card.classList.remove("is-ping"); void match.card.offsetWidth; match.card.classList.add("is-ping"); setTimeout(()=>match.card.classList.remove("is-ping"),1200); return true;
    };
    window.dispatchEvent(new CustomEvent("portfolio:ready",{detail:{projects:window.__PORTFOLIO__.projects}}));
  });
})();