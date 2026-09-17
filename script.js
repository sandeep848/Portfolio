(() => {
  "use strict";

  const USER="sandeep848";
  const EXCLUDED=new Set(["Portfolio","sandeep848"]);
  const CATALOG=[
    {repo:"deepfake-robustness-benchmark",title:"Deepfake Robustness Benchmark",type:"Model reliability",description:"Measures how an EfficientNet-B0 detector holds up under compression, resizing, and blur—not only on pristine benchmark data.",tech:["PyTorch","EfficientNet","Grad-CAM"],category:["cv"],featured:true},
    {repo:"european-image-geolocation",title:"European Image Geolocation",type:"Efficient vision",description:"Locates European street imagery through hierarchical classification and spherical decoding in a model under five million parameters.",tech:["PyTorch","RegNet","Geospatial AI"],category:["cv"],featured:true},
    {repo:"nuremberg-land-cover-ml",title:"Nuremberg Land-Cover Intelligence",type:"Remote sensing",description:"Transforms Sentinel-2 imagery into 100 m land-cover composition and urban-change estimates through a reproducible LightGBM pipeline.",tech:["Sentinel-2","LightGBM","Streamlit"],category:["cv","data"],featured:true},
    {repo:"agentic-multi-tool-chatbot",title:"Multi-Tool Research Agent",type:"Agentic research",description:"Routes questions across uploaded PDFs, web search, arXiv, and Wikipedia, choosing the right source for each research step.",tech:["LangChain","RAG","Streamlit"],category:["genai"]},
    {repo:"nvidia-nim-rag-assistant",title:"Citation-First NVIDIA NIM RAG",type:"Grounded answers",description:"Combines dense and lexical retrieval for document Q&A, returning page-level evidence with every answer.",tech:["NVIDIA NIM","FAISS","Hybrid Search"],category:["genai"]},
    {repo:"langchain-sqlite-assistant",title:"Safe SQLite Analytics Assistant",type:"Text to SQL",description:"Turns natural-language questions into read-only SQLite analysis with deterministic validation and an auditable query trail.",tech:["LangChain","SQLite","SQL Safety"],category:["genai","data"]},
    {repo:"langchain-text-summarizer",title:"Long-Form Content Summarizer",type:"Document intelligence",description:"Uses bounded chunking and map-reduce synthesis to summarize PDFs, webpages, and YouTube transcripts without losing structure.",tech:["LangChain","Map-Reduce","PDF"],category:["genai"]},
    {repo:"langchain-math-problem-solver",title:"Verified Math Problem Solver",type:"Symbolic reasoning",description:"Solves mathematics with SymPy first, then uses an LLM to explain the verified result in clear steps.",tech:["SymPy","LangChain","Verification"],category:["genai"]},
    {repo:"codellama-dynamic-prompt-handler",title:"Local CodeLlama Workbench",type:"Developer tools",description:"A local-first assistant with focused workflows for debugging, testing, refactoring, explanation, and security review.",tech:["CodeLlama","Ollama","Streamlit"],category:["genai"]},
    {repo:"stable-diffusion-lora-style-tuning",title:"Dual-Adapter LoRA Style Tuning",type:"Generative vision",description:"Fine-tunes two independent visual styles for Stable Diffusion 1.5 using custom-token gradient masking and lightweight adapters.",tech:["Diffusers","LoRA","PyTorch"],category:["genai","cv"]},
    {repo:"redshift-streaming-analytics",title:"Streaming Redshift Analytics",type:"Real-time pipeline",description:"Moves live query telemetry through Kafka into DuckDB and a Streamlit interface for warehouse monitoring.",tech:["Kafka","DuckDB","Docker"],category:["data"]},
    {repo:"redshift-query-metrics-prototype",title:"Redshift Capacity Scoring",type:"Performance analytics",description:"Scores exported Redshift workloads offline to reveal capacity risks and bottlenecks without cloud dependencies.",tech:["Pandas","Redshift","Capacity"],category:["data"]},
    {repo:"google-cloud-speechtext",title:"Cloud Speech Transcription",type:"Cloud application",description:"Transcribes audio with Google Cloud Speech-to-Text and persists results through Firestore and optional Cloud Storage.",tech:["Google Cloud","Node.js","Firestore"],category:["data","web"]},
    {repo:"llm-analytics-dashboard",title:"AI Analytics Workspace",type:"Full-stack product",description:"Turns uploaded datasets and business goals into visual insights and actionable recommendations in a complete web workspace.",tech:["React","FastAPI","Analytics"],category:["web","data"]}
  ];

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const normalize=value=>String(value||"").toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu," ").replace(/\s+/g," ").trim();
  const humanize=value=>String(value||"Project").replace(/[-_]+/g," ").replace(/\b\w/g,letter=>letter.toUpperCase());
  const catalogMap=new Map(CATALOG.map(project=>[project.repo.toLowerCase(),project]));

  function infer(repo){
    const signal=normalize([repo.name,repo.description,repo.language,...(repo.topics||[])].join(" "));
    const categories=[];
    if(/llm|langchain|rag|prompt|lora|diffusion|generative|agent|ollama/.test(signal))categories.push("genai");
    if(/vision|image|deepfake|geospatial|land cover|pytorch|tensorflow/.test(signal))categories.push("cv");
    if(/data|sql|redshift|kafka|duckdb|cloud|firestore|analytics/.test(signal))categories.push("data");
    if(/react|javascript|typescript|node|fastapi|web|dashboard/.test(signal))categories.push("web");
    return categories.length?[...new Set(categories)]:["web"];
  }

  const fallback=()=>CATALOG.map((project,index)=>({...project,url:`https://github.com/${USER}/${project.repo}`,language:project.tech[0],topics:[],stars:0,forks:0,updated:"2026-09-01T00:00:00Z",index}));

  async function getProjects(){
    try{
      const response=await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`,{headers:{Accept:"application/vnd.github+json"}});
      if(!response.ok)throw new Error(`GitHub API ${response.status}`);
      const repos=await response.json();
      const projects=repos.filter(repo=>!repo.private&&!EXCLUDED.has(repo.name)).map(repo=>{
        const curated=catalogMap.get(repo.name.toLowerCase());
        return {
          ...(curated||{}),repo:repo.name,title:curated?.title||humanize(repo.name),
          type:curated?.type||"Open-source project",
          description:curated?.description||repo.description||"An open-source engineering project with implementation details available on GitHub.",
          tech:curated?.tech||[repo.language,...(repo.topics||[])].filter(Boolean).slice(0,3),
          category:curated?.category||infer(repo),url:repo.html_url,language:repo.language||curated?.tech?.[0]||"Code",
          topics:repo.topics||[],stars:repo.stargazers_count||0,forks:repo.forks_count||0,updated:repo.updated_at
        };
      });
      projects.sort((a,b)=>Number(Boolean(b.featured))-Number(Boolean(a.featured))||new Date(b.updated)-new Date(a.updated));
      return {projects,synced:true};
    }catch(error){
      console.warn("GitHub sync unavailable; using embedded catalog.",error);
      return {projects:fallback(),synced:false};
    }
  }

  function make(tag,className,text){
    const node=document.createElement(tag);
    if(className)node.className=className;
    if(text!==undefined)node.textContent=text;
    return node;
  }

  function projectCard(project,index){
    const card=make("a","project reveal");
    card.href=project.url;card.target="_blank";card.rel="noopener";
    card.dataset.categories=project.category.join(" ");
    card.dataset.search=normalize([project.title,project.type,project.description,project.language,...project.tech,...project.topics].join(" "));
    card.setAttribute("aria-label",`Open ${project.title} on GitHub`);

    const top=make("div","project-top");
    top.append(make("span","project-num",String(index+1).padStart(2,"0")),make("span","project-arrow","↗"));
    const type=make("div","project-type",project.type);
    const title=make("h3","",project.title);
    const description=make("p","",project.description);
    const tags=make("div","project-tags");
    project.tech.slice(0,3).forEach(value=>tags.append(make("span","",value)));
    const meta=make("div","project-meta");
    const language=make("span","lang");language.append(make("i"),document.createTextNode(project.language));
    const date=new Intl.DateTimeFormat("en",{month:"short",year:"numeric"}).format(new Date(project.updated));
    meta.append(language,make("span","",`Updated ${date}`));
    if(project.stars)meta.append(make("span","",`★ ${project.stars}`));
    if(project.forks)meta.append(make("span","",`⑂ ${project.forks}`));
    card.append(top,type,title,description,tags,meta);
    return card;
  }

  async function initProjects(){
    const grid=$("#projectGrid");if(!grid)return;
    const {projects,synced}=await getProjects();
    const status=$("#syncStatus");
    if(status)status.textContent=synced?`Live from GitHub · ${projects.length} projects`:`Embedded archive · ${projects.length} projects`;
    status?.parentElement?.classList.toggle("fallback",!synced);
    const count=$("#projectCount");if(count)count.textContent=String(projects.length).padStart(2,"0");

    const cards=projects.map(projectCard);
    grid.replaceChildren(...cards);
    requestAnimationFrame(()=>cards.forEach((card,index)=>setTimeout(()=>card.classList.add("in"),Math.min(index*55,500))));

    const state={filter:"all",query:""};
    const render=()=>{
      let visible=0;
      cards.forEach(card=>{
        const category=state.filter==="all"||card.dataset.categories.split(" ").includes(state.filter);
        const query=!state.query||card.dataset.search.includes(normalize(state.query));
        card.hidden=!(category&&query);
        if(!card.hidden)visible++;
      });
      $(".empty",grid)?.remove();
      if(!visible)grid.append(make("div","empty","No projects match this view. Try a different category or search term."));
    };

    $$(".filters button").forEach(button=>button.addEventListener("click",()=>{
      $$(".filters button").forEach(item=>{const active=item===button;item.classList.toggle("active",active);item.setAttribute("aria-selected",String(active));});
      state.filter=button.dataset.filter;render();
    }));
    const search=$("#projectSearch");
    search?.addEventListener("input",()=>{state.query=search.value;render();});
    document.addEventListener("keydown",event=>{
      if(event.key==="/"&&document.activeElement!==search){event.preventDefault();search?.focus();}
      if(event.key==="Escape"&&document.activeElement===search){search.value="";state.query="";render();search.blur();}
    });
  }

  function initNavigation(){
    const header=$(".site-header"),menu=$(".menu-button"),nav=$(".nav-links");
    const update=()=>header?.classList.toggle("stuck",scrollY>30);
    addEventListener("scroll",update,{passive:true});update();
    menu?.addEventListener("click",()=>{
      const open=menu.classList.toggle("open");nav?.classList.toggle("open",open);menu.setAttribute("aria-expanded",String(open));
    });
    $$(".nav-links a").forEach(link=>link.addEventListener("click",()=>{menu?.classList.remove("open");nav?.classList.remove("open");menu?.setAttribute("aria-expanded","false");}));
  }

  function initReveal(){
    const nodes=$$(".reveal");
    if(matchMedia("(prefers-reduced-motion: reduce)").matches){nodes.forEach(node=>node.classList.add("in"));return;}
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("in");observer.unobserve(entry.target);}}),{threshold:.1,rootMargin:"0px 0px -7% 0px"});
    nodes.forEach(node=>observer.observe(node));
  }

  function initGlow(){
    const glow=$(".cursor-glow");
    if(!glow||matchMedia("(pointer: coarse)").matches)return;
    addEventListener("pointermove",event=>{glow.style.left=`${event.clientX}px`;glow.style.top=`${event.clientY}px`;},{passive:true});
  }

  $("#year").textContent=new Date().getFullYear();
  initNavigation();initReveal();initGlow();initProjects();
})();