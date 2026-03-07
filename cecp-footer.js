/* ✦ Designed & Built by YuEn © 2025–2026 ✦ */

/* ===== 屏蔽 Ctrl+U / F12 ===== */
document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
    e.preventDefault();
    return false;
  }
  if (e.key === 'F12') {
    e.preventDefault();
    return false;
  }
});

/* ===== 竖屏/横屏 orientation class ===== */
(function () {
  function setOrientationClass() {
    const b = document.body;
    const isPortrait = window.matchMedia && window.matchMedia("(orientation: portrait)").matches;
    b.classList.toggle("cecp-portrait", !!isPortrait);
    b.classList.toggle("cecp-landscape", !isPortrait);
    // 首页判断：路径为 /
    const isHome = window.location.pathname === "/";
    b.classList.toggle("cecp-home", isHome);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setOrientationClass);
  } else {
    setOrientationClass();
  }
  window.addEventListener("resize", setOrientationClass, { passive: true });
  window.addEventListener("orientationchange", setOrientationClass, { passive: true });
})();

/* ===== 圣经 HBW v15.4 ===== */
(()=>{
  if(window.__HBW_V15_4_LOADED__)return;
  window.__HBW_V15_4_LOADED__=true;

  const WORKER="https://bible.cecp.workers.dev";
  const API_BASE=WORKER.replace(/\/$/,"");
  const LS_PREFIX="HBW::";
  const PRIMARY_LOCAL="CUNPSS";
  const PRIMARY_YV="YV:";
  const DEFAULT_PRIMARY=PRIMARY_LOCAL;

  const DESIRED_T2=[
    {code:"",label:"无第二译本"},
    {code:"YV:36",label:"CCB · 当代圣经 (简体)"},
    {code:"NR06",label:"NR06 · Nuova Riveduta 2006 (Italiano)"},
    {code:"ESV",label:"ESV · English Standard Version"},
  ];

  const BOOKS=[
    {id:1,cn:"创世记",a:["csj"]},{id:2,cn:"出埃及记",a:["caj"]},{id:3,cn:"利未记",a:["lwj"]},
    {id:4,cn:"民数记",a:["msj"]},{id:5,cn:"申命记",a:["smj"]},{id:6,cn:"约书亚记",a:["ysaj"]},
    {id:7,cn:"士师记",a:["ssj"]},{id:8,cn:"路得记",a:["ldj"]},{id:9,cn:"撒母耳记上",a:["smesjs","smesj"]},
    {id:10,cn:"撒母耳记下",a:["smesjx","smesx"]},{id:11,cn:"列王纪上",a:["lwjs"]},{id:12,cn:"列王纪下",a:["lwjx"]},
    {id:13,cn:"历代志上",a:["ldzs"]},{id:14,cn:"历代志下",a:["ldzx"]},{id:15,cn:"以斯拉记",a:["yslj"]},
    {id:16,cn:"尼希米记",a:["nxmj"]},{id:17,cn:"以斯帖记",a:["ystj"]},{id:18,cn:"约伯记",a:["ybj"]},
    {id:19,cn:"诗篇",a:["sp"]},{id:20,cn:"箴言",a:["zy"]},{id:21,cn:"传道书",a:["cds"]},
    {id:22,cn:"雅歌",a:["yg"]},{id:23,cn:"以赛亚书",a:["ysys"]},{id:24,cn:"耶利米书",a:["ylms"]},
    {id:25,cn:"耶利米哀歌",a:["ylmag"]},{id:26,cn:"以西结书",a:["yxjs"]},{id:27,cn:"但以理书",a:["dyls"]},
    {id:28,cn:"何西阿书",a:["hxas"]},{id:29,cn:"约珥书",a:["yes"]},{id:30,cn:"阿摩司书",a:["amss"]},
    {id:31,cn:"俄巴底亚书",a:["ebdys"]},{id:32,cn:"约拿书",a:["yns"]},{id:33,cn:"弥迦书",a:["mjs"]},
    {id:34,cn:"那鸿书",a:["nhs"]},{id:35,cn:"哈巴谷书",a:["hbgs"]},{id:36,cn:"西番雅书",a:["xfnys"]},
    {id:37,cn:"哈该书",a:["hgs"]},{id:38,cn:"撒迦利亚书",a:["sjlys"]},{id:39,cn:"玛拉基书",a:["mljs"]},
    {id:40,cn:"马太福音",a:["mtfy"]},{id:41,cn:"马可福音",a:["mkfy"]},{id:42,cn:"路加福音",a:["ljfy"]},
    {id:43,cn:"约翰福音",a:["yhfy"]},{id:44,cn:"使徒行传",a:["stxc"]},{id:45,cn:"罗马书",a:["lms"]},
    {id:46,cn:"哥林多前书",a:["gldqs"]},{id:47,cn:"哥林多后书",a:["gldhs"]},{id:48,cn:"加拉太书",a:["jlts"]},
    {id:49,cn:"以弗所书",a:["yfss"]},{id:50,cn:"腓立比书",a:["flbs"]},{id:51,cn:"歌罗西书",a:["glxs"]},
    {id:52,cn:"帖撒罗尼迦前书",a:["tslnjq"]},{id:53,cn:"帖撒罗尼迦后书",a:["tslnjh"]},{id:54,cn:"提摩太前书",a:["tmtqs"]},
    {id:55,cn:"提摩太后书",a:["tmths"]},{id:56,cn:"提多书",a:["tds"]},{id:57,cn:"腓利门书",a:["flms2"]},
    {id:58,cn:"希伯来书",a:["xbls"]},{id:59,cn:"雅各书",a:["ygs"]},{id:60,cn:"彼得前书",a:["bdqs"]},
    {id:61,cn:"彼得后书",a:["bdhs"]},{id:62,cn:"约翰一书",a:["yhys"]},{id:63,cn:"约翰二书",a:["yhes"]},
    {id:64,cn:"约翰三书",a:["yhss"]},{id:65,cn:"犹大书",a:["yds"]},{id:66,cn:"启示录",a:["qsl"]},
  ];

  const BOOKNAME_EN={1:"Genesis",2:"Exodus",3:"Leviticus",4:"Numbers",5:"Deuteronomy",6:"Joshua",7:"Judges",8:"Ruth",9:"1 Samuel",10:"2 Samuel",11:"1 Kings",12:"2 Kings",13:"1 Chronicles",14:"2 Chronicles",15:"Ezra",16:"Nehemiah",17:"Esther",18:"Job",19:"Psalms",20:"Proverbs",21:"Ecclesiastes",22:"Song of Songs",23:"Isaiah",24:"Jeremiah",25:"Lamentations",26:"Ezekiel",27:"Daniel",28:"Hosea",29:"Joel",30:"Amos",31:"Obadiah",32:"Jonah",33:"Micah",34:"Nahum",35:"Habakkuk",36:"Zephaniah",37:"Haggai",38:"Zechariah",39:"Malachi",40:"Matthew",41:"Mark",42:"Luke",43:"John",44:"Acts",45:"Romans",46:"1 Corinthians",47:"2 Corinthians",48:"Galatians",49:"Ephesians",50:"Philippians",51:"Colossians",52:"1 Thessalonians",53:"2 Thessalonians",54:"1 Timothy",55:"2 Timothy",56:"Titus",57:"Philemon",58:"Hebrews",59:"James",60:"1 Peter",61:"2 Peter",62:"1 John",63:"2 John",64:"3 John",65:"Jude",66:"Revelation"};
  const BOOKNAME_IT={1:"Genesi",2:"Esodo",3:"Levitico",4:"Numeri",5:"Deuteronomio",6:"Giosuè",7:"Giudici",8:"Rut",9:"1 Samuele",10:"2 Samuele",11:"1 Re",12:"2 Re",13:"1 Cronache",14:"2 Cronache",15:"Esdra",16:"Neemia",17:"Ester",18:"Giobbe",19:"Salmi",20:"Proverbi",21:"Ecclesiaste",22:"Cantico dei Cantici",23:"Isaia",24:"Geremia",25:"Lamentazioni",26:"Ezechiele",27:"Daniele",28:"Osea",29:"Gioele",30:"Amos",31:"Abdia",32:"Giona",33:"Michea",34:"Naum",35:"Abacuc",36:"Sofonia",37:"Aggeo",38:"Zaccaria",39:"Malachia",40:"Matteo",41:"Marco",42:"Luca",43:"Giovanni",44:"Atti",45:"Romani",46:"1 Corinzi",47:"2 Corinzi",48:"Galati",49:"Efesini",50:"Filippesi",51:"Colossesi",52:"1 Tessalonicesi",53:"2 Tessalonicesi",54:"1 Timoteo",55:"2 Timoteo",56:"Tito",57:"Filemone",58:"Ebrei",59:"Giacomo",60:"1 Pietro",61:"2 Pietro",62:"1 Giovanni",63:"2 Giovanni",64:"3 Giovanni",65:"Giuda",66:"Apocalisse"};

  function t2LangKey(c){c=String(c||"");if(!c)return "";if(c==="NR06")return "it";if(c==="KJV"||c==="ESV"||c==="WEB")return "en";return "";}
  function t2BookName(id,code){const l=t2LangKey(code);if(l==="it")return BOOKNAME_IT[id]||"";if(l==="en")return BOOKNAME_EN[id]||"";return "";}
  function refText(ref,t2,dual){const ex=(dual&&t2)?t2BookName(ref.book.id,t2):"";const bp=ex?`${ref.book.cn} ${ex}`:ref.book.cn;if(ref.vStart==null)return `${bp} ${ref.chapter}`;if(ref.vStart===ref.vEnd)return `${bp} ${ref.chapter}:${ref.vStart}`;return `${bp} ${ref.chapter}:${ref.vStart}-${ref.vEnd}`;}

  const stripAcc=s=>{try{return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"");}catch(e){return String(s||"");}};
  const bookKey=s=>stripAcc(String(s||"")).trim().toLowerCase().replace(/[．.]/g,"").replace(/[\u3000]/g," ").replace(/[''"]/g,"").replace(/[，,]/g," ").replace(/[：:]/g," ").replace(/\s+/g," ").trim();

  const aliasMap=new Map();
  function addAlias(key,b){const k=bookKey(key);if(!k)return;aliasMap.set(k,b);if(k.includes(" "))aliasMap.set(k.replace(/\s+/g,""),b);}
  BOOKS.forEach(b=>{(b.a||[]).forEach(x=>addAlias(x,b));addAlias(b.cn,b);addAlias(BOOKNAME_EN[b.id],b);addAlias(BOOKNAME_IT[b.id],b);});

  function parseRGB(c){if(!c)return null;c=String(c).trim().toLowerCase();let m=c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/i);if(m)return {r:+m[1],g:+m[2],b:+m[3]};m=c.match(/^#([0-9a-f]{6})$/i);if(m){const n=parseInt(m[1],16);return {r:(n>>16)&255,g:(n>>8)&255,b:n&255};}return null;}
  function lum(rgb){return rgb?(0.2126*rgb.r+0.7152*rgb.g+0.0722*rgb.b):null;}
  function detectDark(el){try{const c=parseRGB(getComputedStyle(el||document.body).color)||parseRGB(getComputedStyle(document.body).color);const L=lum(c);if(L!=null){if(L>160)return true;if(L<110)return false;}}catch(e){}return window.matchMedia?window.matchMedia("(prefers-color-scheme:dark)").matches:true;}
  function applyTheme(root,base){root.classList.toggle("hbw-light",!detectDark(base||root));}

  let __TRaf=0;
  function refreshAll(){if(__TRaf)return;__TRaf=requestAnimationFrame(()=>{__TRaf=0;document.querySelectorAll(".hbw-card").forEach(c=>applyTheme(c,c.__hbw_base_el||document.body));const m=document.querySelector(".hbw-modal");if(m)applyTheme(m,document.body);});}
  function watchTheme(){try{const mo=new MutationObserver(()=>refreshAll());mo.observe(document.documentElement,{attributes:true,attributeFilter:["class","style","data-theme","data-color-mode"]});mo.observe(document.body,{attributes:true,attributeFilter:["class","style","data-theme","data-color-mode"]});}catch(e){}try{if(window.matchMedia){const mq=window.matchMedia("(prefers-color-scheme:dark)");const fn=()=>refreshAll();mq.addEventListener?mq.addEventListener("change",fn):mq.addListener&&mq.addListener(fn);}}catch(e){}}

  const lsK=id=>LS_PREFIX+id;
  const lsLoad=id=>{try{return JSON.parse(localStorage.getItem(lsK(id))||"{}");}catch(e){return {};}};
  const lsSave=(id,st)=>{try{localStorage.setItem(lsK(id),JSON.stringify(st||{}));}catch(e){}};
  const lsClear=id=>{try{localStorage.removeItem(lsK(id));}catch(e){}};
  const mkRange=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);

  async function fetchJson(url,ms=9000){const ctrl=typeof AbortController!=="undefined"?new AbortController():null;let t=null;if(ctrl)t=setTimeout(()=>{try{ctrl.abort();}catch(_){}},ms);try{const r=await fetch(url,{cache:"no-store",signal:ctrl?.signal});if(!r.ok){const tx=await r.text().catch(()=>"");throw new Error(`${r.status} ${tx.slice(0,120)}`);}return await r.json();}finally{if(t)clearTimeout(t);}}

  async function cfGet(trans,bookId,ch,ref){const u=new URL(API_BASE+"/");u.searchParams.set("translations",(trans||[]).join(","));u.searchParams.set("book",String(bookId));u.searchParams.set("chapter",String(ch));if(ref?.vStart!=null&&ref?.vEnd!=null)u.searchParams.set("verses",mkRange(ref.vStart,ref.vEnd).join(","));const j=await fetchJson(u.toString());if(j?.ok)return j;if(j?.translations)return {ok:true,data:j.translations};throw new Error(j?.error||"CF失败");}

  let __bmReady=false,__idToPy={};
  async function ensureBookMap(){if(__bmReady)return;const ck="HBW::BOOKMAP_CACHE";try{const c=JSON.parse(localStorage.getItem(ck)||"null");if(c?.idToPy){__idToPy=c.idToPy;BOOKS.forEach(b=>{b.py=__idToPy[String(b.id)]||b.py;if(b.py)addAlias(b.py,b);});__bmReady=true;return;}}catch(_){}try{const j=await fetchJson(`${API_BASE}/books`);const bySN=j?.data?.bySN;if(!bySN)throw 0;const m={};for(const sn in bySN){const r=bySN[sn]||{};if(r.PY)m[String(sn)]=String(r.PY);}__idToPy=m;BOOKS.forEach(b=>{b.py=__idToPy[String(b.id)]||b.py;if(b.py)addAlias(b.py,b);});__bmReady=true;try{localStorage.setItem(ck,JSON.stringify({idToPy:m,at:Date.now()}));}catch(_){}}catch(e){console.warn("[HBW] bookmap:",e?.message||e);__bmReady=true;}}

  function san(s){return String(s||"").replace(/[\u3000]/g," ").replace(/[，,]/g," ").replace(/[：:]/g," ").replace(/\s+/g," ").trim();}

  function parseRef(input){
    const raw=bookKey(san(input));const tk=raw.split(" ").filter(Boolean);
    if(tk.length<2)return {ok:false,err:"格式：经卷/书名 章 起节 终节（终节可省略）例：csj 1 3 7 / Genesis 1 3 7"};
    let book=null,bi=1;
    const maxLen=Math.min(4,tk.length-1);
    for(let len=maxLen;len>=1;len--){
      const key=tk.slice(0,len).join(" ");const b=aliasMap.get(key);if(b){book=b;bi=len;break;}
      const key2=tk.slice(0,len).join("");const b2=aliasMap.get(key2);if(b2){book=b2;bi=len;break;}
    }
    if(!book)return {ok:false,err:"找不到经卷缩写/名称："+tk[0]};
    const ch=parseInt(tk[bi],10);if(!(ch>0))return {ok:false,err:"章号不对："+tk[bi]};
    let vs=null,ve=null;
    const t2=tk[bi+1];
    if(t2){if(t2.includes("-")){const[a,b]=t2.split("-").map(x=>parseInt(x,10));if(a>0)vs=a;if(b>0)ve=b;}else{const a=parseInt(t2,10);if(a>0)vs=a;}}
    const t3=tk[bi+2];if(t3&&vs!=null){const b=parseInt(t3,10);if(b>0)ve=b;}
    if(vs!=null&&ve==null)ve=vs;
    return {ok:true,book,chapter:ch,vStart:vs,vEnd:ve,whole:(vs==null)};
  }
  function sliceRange(arr,ref){if(ref.vStart==null||ref.vEnd==null)return arr||[];const a=ref.vStart,b=ref.vEnd;return (arr||[]).filter(x=>{const n=Number(x.verse);return Number.isFinite(n)&&n>=a&&n<=b;});}

  const BOLLS={
    async par(trans,bookId,ch,verses){const r=await fetch("https://bolls.life/get-parallel-verses/",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({translations:trans,book:bookId,chapter:ch,verses})});if(!r.ok)throw new Error("bolls par "+r.status);return r.json();},
    async txt(tr,bookId,ch){const r=await fetch(`https://bolls.life/get-text/${encodeURIComponent(tr)}/${bookId}/${ch}/`);if(!r.ok)throw new Error("bolls txt "+r.status);return r.json();}
  };

  const USFM={1:"GEN",2:"EXO",3:"LEV",4:"NUM",5:"DEU",6:"JOS",7:"JDG",8:"RUT",9:"1SA",10:"2SA",11:"1KI",12:"2KI",13:"1CH",14:"2CH",15:"EZR",16:"NEH",17:"EST",18:"JOB",19:"PSA",20:"PRO",21:"ECC",22:"SNG",23:"ISA",24:"JER",25:"LAM",26:"EZK",27:"DAN",28:"HOS",29:"JOL",30:"AMO",31:"OBA",32:"JON",33:"MIC",34:"NAM",35:"HAB",36:"ZEP",37:"HAG",38:"ZEC",39:"MAL",40:"MAT",41:"MRK",42:"LUK",43:"JHN",44:"ACT",45:"ROM",46:"1CO",47:"2CO",48:"GAL",49:"EPH",50:"PHP",51:"COL",52:"1TH",53:"2TH",54:"1TI",55:"2TI",56:"TIT",57:"PHM",58:"HEB",59:"JAS",60:"1PE",61:"2PE",62:"1JN",63:"2JN",64:"3JN",65:"JUD",66:"REV"};
  try{Object.keys(USFM).forEach(k=>{const id=Number(k);const b=BOOKS.find(x=>x.id===id);if(!b)return;addAlias(USFM[id],b);addAlias(String(USFM[id]).toLowerCase(),b);});}catch(_){}

  const YV_PFXS=["/proxy",""];let __yvPfx=null;
  async function yvFetch(path){const base=WORKER.replace(/\/$/,"");const tries=__yvPfx?[__yvPfx]:YV_PFXS;let le=null;for(const p of tries){const url=base+p+path;try{const r=await fetch(url);if(r.ok){__yvPfx=p;return r.json();}const t=await r.text().catch(()=>"");le=Object.assign(new Error(`YV ${r.status} ${t.slice(0,80)}`),{__status:r.status});}catch(e){le=e;}}throw le||new Error("YV失败");}
  function yvPID(ref){const u=USFM[ref.book.id];if(!u)throw new Error("USFM缺失");if(ref.vStart==null)return `${u}.${ref.chapter}`;if(ref.vStart===ref.vEnd)return `${u}.${ref.chapter}.${ref.vStart}`;const parts=[];for(let v=ref.vStart;v<=ref.vEnd;v++)parts.push(`${u}.${ref.chapter}.${v}`);return parts.join("+");}
  async function yvPassage(bId,pId){return yvFetch(`/v1/bibles/${encodeURIComponent(bId)}/passages/${encodeURIComponent(pId)}?format=text`);}
  function yvNorm(j,ref){const p=j?.data||j;const st=p?.verses||p?.verse_objects||null;if(Array.isArray(st)&&st.length)return sliceRange(st.map(v=>({verse:String(v.verse||v.number||v.verse_number||""),text:String(v.text||v.content||"").trim()})).filter(x=>x.text),ref);let raw=typeof p?.content==="string"?p.content:typeof p?.text==="string"?p.text:Array.isArray(p?.passages)&&p.passages[0]?p.passages[0].content||p.passages[0].text||"":"";raw=String(raw||"").trim();if(!raw)return [];const raw2=raw.replace(/\r/g,"\n").replace(/\n{2,}/g,"\n").trim();const parsed=[];for(const l of raw2.split(/\n+/).map(s=>s.trim()).filter(Boolean)){const m=l.match(/^(\d{1,3})[\s\u00A0]+(.+)$/);if(m)parsed.push({verse:String(+m[1]),text:String(m[2]).trim()});}return parsed.length>=2?sliceRange(parsed,ref):[{verse:"",text:raw2}];}
  async function yvGet(bId,ref){
    // Fetch whole chapter (no verse range)
    if(ref.vStart==null)return yvNorm(await yvPassage(bId,yvPID(ref)),ref);
    // Fetch each verse individually and combine - avoids merged content without verse numbers
    if(ref.vStart!=null&&ref.vEnd!=null&&ref.vStart!==ref.vEnd){
      const u=USFM[ref.book.id];
      const results=[];
      for(let v=ref.vStart;v<=ref.vEnd;v++){
        try{
          const j=await yvPassage(bId,`${u}.${ref.chapter}.${v}`);
          const text=typeof j?.content==="string"?j.content.trim():typeof j?.text==="string"?j.text.trim():"";
          if(text)results.push({verse:String(v),text});
        }catch(_){}
      }
      if(results.length)return results;
    }
    // Single verse
    try{const v=yvNorm(await yvPassage(bId,yvPID(ref)),ref);if(v?.length)return v;throw new Error("空");}
    catch(e){if(e.__status===404||e.__status===400){const u=USFM[ref.book.id];const all=yvNorm(await yvPassage(bId,`${u}.${ref.chapter}`),{...ref,vStart:null,vEnd:null});const s=sliceRange(all,ref);if(s?.length)return s;}throw e;}
  }

  async function p1Fetch(primary,ref){if(!primary||primary===PRIMARY_LOCAL){const j=await cfGet(["CUNPSS"],ref.book.id,ref.chapter,ref);return sliceRange(j?.data?.CUNPSS||[],ref).map(x=>({verse:String(x.verse),text:String(x.text||"")}));}if(String(primary).startsWith(PRIMARY_YV))return yvGet(String(primary).slice(3),ref);const j=await cfGet(["CUNPSS"],ref.book.id,ref.chapter,ref);return sliceRange(j?.data?.CUNPSS||[],ref).map(x=>({verse:String(x.verse),text:String(x.text||"")}));}
  async function p2Fetch(t2,ref){if(!t2)return [];if(String(t2).toUpperCase()==="NR06"){const j=await cfGet(["NR06"],ref.book.id,ref.chapter,ref);return sliceRange(j?.data?.NR06||[],ref).map(x=>({verse:String(x.verse),text:String(x.text||"")}));}if(String(t2).startsWith("YV:"))return yvGet(String(t2).slice(3),ref);if(ref.vStart!=null&&ref.vEnd!=null){const r=await BOLLS.par([t2],ref.book.id,ref.chapter,mkRange(ref.vStart,ref.vEnd));return (r?.[0]||[]).map(x=>({verse:String(x.verse||""),text:String(x.text||"")}));}const r=await BOLLS.txt(t2,ref.book.id,ref.chapter);return (r||[]).map(x=>({verse:String(x.verse||""),text:String(x.text||"")}));}

  const clean=s=>String(s||"").replace(/\s{2,}/g," ").trim();
  const t2Lbl=code=>{const f=DESIRED_T2.find(x=>x.code===code);return f?f.label:(code||"无");};
  const shortC=(s,max=26)=>{s=String(s||"");return s.length>max?s.slice(0,max-1)+"…":s;};

  function renderLines(el,arr,isT2,limit){el.innerHTML="";arr=arr||[];if(!arr.length){el.innerHTML=`<div class="hbw-help">(该译本此段经文暂无)</div>`;return;}const use=limit&&arr.length>limit?arr.slice(0,limit):arr;for(const v of use){const vn=v?.verse??"";const tx=clean(v?.text??"");const d=document.createElement("div");d.className="hbw-line"+(isT2?" hbw-t2":"");d.innerHTML=vn?`<span class="hbw-vn">${vn}</span><span>${tx}</span>`:`<span>${tx}</span>`;el.appendChild(d);}if(limit&&arr.length>limit){const m=document.createElement("div");m.className="hbw-help";m.textContent="…（点开查看更多）";el.appendChild(m);}}

  function renderParallelAligned(el,v1,v2){
    el.innerHTML="";v1=v1||[];v2=v2||[];
    if(!v1.length&&!v2.length){el.innerHTML=`<div class="hbw-help">(该段经文暂无)</div>`;return;}
    const m1=new Map(),m2=new Map();
    for(const x of v1){const k=String(x?.verse??"");if(k!=="")m1.set(k,clean(x?.text??""));}
    for(const x of v2){const k=String(x?.verse??"");if(k!=="")m2.set(k,clean(x?.text??""));}
    const p1=v1.filter(x=>String(x?.verse??"")==="").map(x=>clean(x?.text??"")).filter(Boolean).join("\n");
    const p2=v2.filter(x=>String(x?.verse??"")==="").map(x=>clean(x?.text??"")).filter(Boolean).join("\n");
    if(p1||p2){const row=document.createElement("div");row.className="hbw-p-row hbw-p-span";row.innerHTML=`<div class="hbw-p-cell hbw-p-span"><div class="hbw-p-line">${p1||p2||""}</div></div>`;el.appendChild(row);}
    const order=[];const seen=new Set();
    const push=k=>{if(!k||seen.has(k))return;seen.add(k);order.push(k);};
    for(const x of v1){const k=String(x?.verse??"");if(k)push(k);}
    for(const x of v2){const k=String(x?.verse??"");if(k)push(k);}
    if(order.every(k=>/^\d+$/.test(k)))order.sort((a,b)=>Number(a)-Number(b));
    for(const k of order){
      const t1=m1.get(k);const t2=m2.get(k);
      const row=document.createElement("div");row.className="hbw-p-row";
      const left=document.createElement("div");left.className="hbw-p-cell";
      left.innerHTML=t1?`<div class="hbw-p-line"><span class="hbw-vn">${k}</span><span>${t1}</span></div>`:`<div class="hbw-p-line hbw-p-miss"><span class="hbw-vn">${k}</span><span>（此译本缺少该节）</span></div>`;
      const right=document.createElement("div");right.className="hbw-p-cell";
      right.innerHTML=t2?`<div class="hbw-p-line t2"><span class="hbw-vn">${k}</span><span>${t2}</span></div>`:`<div class="hbw-p-line t2 hbw-p-miss"><span class="hbw-vn">${k}</span><span>（此译本缺少该节）</span></div>`;
      row.appendChild(left);row.appendChild(right);el.appendChild(row);
    }
  }

  function setVH(modal){try{modal.style.setProperty("--hbw-vh",Math.round(window.visualViewport?.height||window.innerHeight)+"px");}catch(_){}}

  let __LY=0;
  function lockScroll(){
    __LY=window.scrollY||document.documentElement.scrollTop||0;
    let st=document.getElementById("hbw-lock-st");
    if(!st){st=document.createElement("style");st.id="hbw-lock-st";document.head.appendChild(st);}
    st.textContent="body{overflow:hidden!important}";
  }
  function unlockScroll(){
    let st=document.getElementById("hbw-lock-st");
    if(!st){st=document.createElement("style");st.id="hbw-lock-st";document.head.appendChild(st);}
    st.textContent="html,body{scroll-behavior:auto!important}";
    window.scrollTo(0,__LY);
    document.documentElement.scrollTop=__LY;
    document.body.scrollTop=__LY;
    setTimeout(()=>{const el=document.getElementById("hbw-lock-st");if(el)el.remove();},120);
  }

  function bindDrag(modal,panel,handle){
    if(handle.__hbw_drag_bound)return;handle.__hbw_drag_bound=true;
    const bd=modal.querySelector(".hbw-backdrop");const sc=modal.querySelector(".hbw-scroll");
    const setY=y=>{panel.style.transform=`translate3d(0,${y}px,0)`;panel.__hbw_y=y;};
    const cleanup=()=>{modal.classList.remove("hbw-dragging");if(sc)sc.style.overflowY="";panel.style.transform="";panel.__hbw_y=0;if(bd)bd.style.opacity="";};
    const maxD=()=>Math.max(140,panel.getBoundingClientRect().height-70);
    const maxU=()=>Math.max(120,(window.visualViewport?.height||window.innerHeight)-180);
    let drag=false,sy=0,ly=0,lt=0,vy=0;
    const begin=cy=>{if(!modal.classList.contains("is-open"))return;drag=true;modal.classList.remove("hbw-stable");modal.classList.add("hbw-dragging");sy=cy;ly=cy;lt=performance.now();vy=0;if(sc)sc.style.overflowY="hidden";};
    const move=cy=>{if(!drag)return;const now=performance.now();const dy=cy-sy;const d=maxD(),u=maxU();const y=Math.max(-u,Math.min(d,dy));const dt=now-lt;if(dt>0)vy=(cy-ly)/dt;ly=cy;lt=now;setY(y);if(bd){const p=Math.max(0,Math.min(1,y/d));bd.style.opacity=String(1-p*0.45);}};
    const end=()=>{if(!drag)return;drag=false;const y=panel.__hbw_y||0;const d=maxD(),u=maxU();const close=(y>d*0.32)||(vy>0.9);const expand=(y<-u*0.18)||(vy<-0.9);cleanup();if(close){try{modal.__close&&modal.__close();}catch(_){}return;}if(expand)modal.classList.add("hbw-expanded");requestAnimationFrame(()=>{if(modal.classList.contains("is-open"))modal.classList.add("hbw-stable");});};
    handle.addEventListener("pointerdown",e=>{if(e.pointerType==="mouse"&&e.button!==0)return;begin(e.clientY);try{handle.setPointerCapture(e.pointerId);}catch(_){}e.preventDefault();e.stopPropagation();},{passive:false});
    handle.addEventListener("pointermove",e=>move(e.clientY),{passive:true});
    handle.addEventListener("pointerup",()=>end(),{passive:true});
    handle.addEventListener("pointercancel",()=>end(),{passive:true});
    handle.addEventListener("touchstart",e=>{const t=e.touches[0];if(!t)return;begin(t.clientY);e.preventDefault();e.stopPropagation();},{passive:false});
    handle.addEventListener("touchmove",e=>{const t=e.touches[0];if(!t)return;move(t.clientY);e.preventDefault();e.stopPropagation();},{passive:false});
    handle.addEventListener("touchend",e=>{end();e.preventDefault();e.stopPropagation();},{passive:false});
    handle.addEventListener("touchcancel",()=>end(),{passive:true});
    modal.__hbw_drag_cleanup=cleanup;
  }

  function fillT2(sel){sel.innerHTML="";for(const it of DESIRED_T2){const op=document.createElement("option");op.value=it.code;op.textContent=it.label;sel.appendChild(op);}}

  function mkCands(){const out=[];for(const b of BOOKS){const al=new Set();const push=s=>{const k=bookKey(s);if(!k)return;al.add(k);if(k.includes(" "))al.add(k.replace(/\s+/g,""));};(b.a||[]).forEach(push);if(b.py)push(b.py);push(b.cn);push(BOOKNAME_EN[b.id]);push(BOOKNAME_IT[b.id]);try{if(USFM[b.id])push(USFM[b.id]);}catch(_){}for(const code of al)out.push({id:b.id,cn:b.cn,code});}const seen=new Set();return out.filter(x=>{const k=x.id+"::"+x.code;if(seen.has(k))return false;seen.add(k);return true;});}
  const __CANDS=mkCands();
  function bestCands(prefix,lim=10){const p=bookKey(prefix);if(!p)return [];const h=[];for(const x of __CANDS)if(x.code.startsWith(p))h.push(x);h.sort((a,b)=>a.code.length-b.code.length);return h.slice(0,lim);}

  function ensureModal(){
    const old=document.querySelector(".hbw-modal");if(old)return old;
    const modal=document.createElement("div");
    modal.className="hbw hbw-modal is-hidden";
    modal.innerHTML=`
      <div class="hbw-backdrop" data-close="1"></div>
      <div class="hbw-panel" role="dialog" aria-modal="true">
        <div class="hbw-handle" data-handle></div>
        <div class="hbw-panelbar">
          <div class="hbw-title"><span data-title>经文</span></div>
          <div class="hbw-actions">
            <div class="hbw-shortcut-badge" title="按等号键快速打开">按 <kbd>=</kbd> 快速打开</div>
            <div class="hbw-act" data-pres title="投屏"><span class="hbw-act-icon">📺</span><span class="txt">投屏</span></div>
            <div class="hbw-act" data-fs title="全屏"><span class="hbw-act-icon">⛶</span><span class="txt">全屏</span></div>
            <div class="hbw-x" data-close="1">✕</div>
          </div>
        </div>
        <div class="hbw-scroll">
          <div class="hbw-controls">
            <div class="hbw-topbar">
              <div class="hbw-top-left">
                <span>双译本模式</span>
                <label class="hbw-switch" title="显示/隐藏第二译本（会记住）">
                  <input type="checkbox" data-dual><span class="hbw-knob"></span>
                </label>
              </div>
              <div class="hbw-top-right">
                <div class="hbw-field"><span>中文版本</span>
                  <select class="hbw-select" data-primary>
                    <option value="CUNPSS">CUNPSS · 和合本（默认）</option>
                  </select>
                </div>
                <div class="hbw-field"><span>第二译本</span>
                  <select class="hbw-select" data-t2></select>
                </div>
              </div>
            </div>
            <div class="hbw-row" data-row>
              <input class="hbw-input" data-input placeholder="例如：csj 2 5 7 / Genesis 2 5 7 / Genesi 2 5 7">
              <button class="hbw-btn" data-open>打开</button>
              <button class="hbw-btn hbw-ghost" data-reset>回到默认</button>
              <div class="hbw-ac" data-ac></div>
            </div>
            <div class="hbw-help" data-status></div>
            <div class="hbw-help">速记：<code>经卷/书名 章 起节 终节</code>（终节可省略）· 快捷键 <kbd>=</kbd> 随时打开</div>
          </div>
          <div class="hbw-result">
            <div class="hbw-box" data-solo>
              <h4 data-sh1></h4>
              <div data-solo-v></div>
            </div>
            <div class="hbw-box" data-parbox style="display:none">
              <div class="hbw-par-head">
                <h4 data-ph1></h4>
                <h4 data-ph2></h4>
              </div>
              <div class="hbw-par" data-par></div>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);

    const fsBtn=modal.querySelector("[data-fs]");
    const setFsLabel=()=>{const on=!!document.fullscreenElement;if(fsBtn){fsBtn.setAttribute("aria-pressed",on?"true":"false");const t=fsBtn.querySelector(".txt");if(t)t.textContent=on?"退出":"全屏";}};
    const fsCb=()=>{
      const on=!!document.fullscreenElement;
      setFsLabel();
      if(!on && modal.classList.contains("hbw-pres")) exitPres(true);
    };
    document.addEventListener("fullscreenchange",fsCb);
    modal.__hbw_fs_cleanup=()=>document.removeEventListener("fullscreenchange",fsCb);
    if(fsBtn)fsBtn.addEventListener("click",async e=>{
      e.preventDefault();e.stopPropagation();
      try{if(!document.fullscreenElement){await(modal.querySelector(".hbw-panel").requestFullscreen?.()??modal.requestFullscreen?.());}else{await document.exitFullscreen?.();}}catch(_){}
      setFsLabel();
    });

    // ── 投屏模式 ──
    const presBtn=modal.querySelector("[data-pres]");
    const panel=modal.querySelector(".hbw-panel");
    const result=modal.querySelector(".hbw-result");
    const controls=modal.querySelector(".hbw-controls");

    function calcPresFontSize(){
      // 基准字体 18px @ 420px 宽，按屏幕宽度等比缩放，上限 52px
      const vw=window.innerWidth;
      return Math.min(Math.round(18 * vw / 420), 52);
    }
    function applyPresFontSize(){
      if(!modal.classList.contains("hbw-pres"))return;
      const fs=calcPresFontSize();
      modal.querySelectorAll(".hbw-line,.hbw-p-line").forEach(el=>{
        el.style.fontSize=fs+"px";
        el.style.lineHeight="1.65";
      });
      modal.querySelectorAll(".hbw-vn").forEach(el=>{
        el.style.fontSize=Math.round(fs*0.6)+"px";
      });
    }
    function enterPres(){
      modal.classList.add("hbw-pres");
      applyPresFontSize();
      // 进入投屏时把经文区域滚回顶部，防止第一节被切掉
      setTimeout(()=>{
        try{
          result.scrollTop=0;
          const firstBox=result.querySelector(".hbw-box");
          if(firstBox)firstBox.scrollIntoView({block:"start"});
        }catch(_){}
      }, 80);
      try{ panel.requestFullscreen?.(); }catch(_){}
      if(presBtn){ const t=presBtn.querySelector(".txt"); if(t)t.textContent="退出投屏"; }
    }
    function exitPres(fromFsEvent){
      modal.classList.remove("hbw-pres");
      modal.querySelectorAll(".hbw-line,.hbw-p-line").forEach(el=>{
        el.style.fontSize="";
        el.style.lineHeight="";
      });
      modal.querySelectorAll(".hbw-vn").forEach(el=>{
        el.style.fontSize="";
      });
      result.scrollTop=0;
      if(!fromFsEvent){
        try{
          if(document.fullscreenElement) document.exitFullscreen?.();
        }catch(_){}
      }
      if(presBtn){
        const t=presBtn.querySelector(".txt");
        if(t) t.textContent="投屏";
      }
    }
    function applyPresScale(){ applyPresFontSize(); }
    function togglePres(){
      if(modal.classList.contains("hbw-pres"))exitPres(false);
      else enterPres();
    }
    if(presBtn)presBtn.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();togglePres();});
    window.addEventListener("resize",applyPresScale,{passive:true});
    // F5 触发投屏
    document.addEventListener("keydown",e=>{
      if(e.key==="F5"&&modal.classList.contains("is-open")){e.preventDefault();togglePres();}
    });
    modal.__exitPres=exitPres;

    const mIn=modal.querySelector("[data-input]");
    const mAC=modal.querySelector("[data-ac]");
    mIn.addEventListener("focus",()=>{modal.classList.add("hbw-stable");setTimeout(()=>{try{mIn.scrollIntoView({block:"center"});}catch(_){}},50);});

    let acItems=[],acIdx=-1;
    const closeAC=()=>{mAC.classList.remove("is-open");mAC.innerHTML="";acItems=[];acIdx=-1;};
    const openAC=list=>{mAC.innerHTML="";acItems=list||[];acIdx=-1;if(!acItems.length){closeAC();return;}for(let i=0;i<acItems.length;i++){const it=acItems[i];const row=document.createElement("div");row.className="hbw-ac-item";row.innerHTML=`<div class="hbw-ac-left"><span class="hbw-ac-code">${it.code}</span><span class="hbw-ac-name">${it.cn}</span></div><div class="hbw-ac-right">书卷</div>`;row.addEventListener("mousedown",e=>e.preventDefault());row.addEventListener("click",()=>pick(it.code));mAC.appendChild(row);}const h=document.createElement("div");h.className="hbw-ac-hint";h.textContent="↑↓ 选择 / Enter 确认 / Esc 关闭";mAC.appendChild(h);mAC.classList.add("is-open");};
    const setAct=i=>{mAC.querySelectorAll(".hbw-ac-item").forEach(r=>r.classList.remove("is-active"));if(i>=0&&i<acItems.length){mAC.querySelectorAll(".hbw-ac-item")[i]?.classList.add("is-active");acIdx=i;}else acIdx=-1;};
    const pick=code=>{mIn.value=String(code||"").trim()+" ";closeAC();if(modal.__triggerOpen)modal.__triggerOpen();try{mIn.setSelectionRange(mIn.value.length,mIn.value.length);}catch(_){}mIn.focus();};

    let dbT=null;
    mIn.addEventListener("input",()=>{const raw=san(mIn.value);const tk0=(raw.split(" ")[0]||"");const hasCh=/\s+\d+/.test(raw);if(tk0&&!hasCh)openAC(bestCands(tk0,10));else closeAC();if(hasCh){if(dbT)clearTimeout(dbT);dbT=setTimeout(()=>{if(modal.__triggerOpen)modal.__triggerOpen();},350);}});
    mIn.addEventListener("keydown",e=>{if(e.key==="Escape"){closeAC();return;}const op=mAC.classList.contains("is-open");if(op&&(e.key==="ArrowDown"||e.key==="ArrowUp")){e.preventDefault();const n=acItems.length;if(!n)return;let nx=acIdx;if(e.key==="ArrowDown")nx=(nx+1+n)%n;else nx=(nx-1+n)%n;setAct(nx);return;}if(e.key==="Enter"){e.preventDefault();if(op){if(acIdx<0&&acItems.length)setAct(0);if(acIdx>=0&&acItems[acIdx]){pick(acItems[acIdx].code);return;}}closeAC();if(modal.__triggerOpen)modal.__triggerOpen();return;}if(op&&e.key==="Tab"&&acItems.length){e.preventDefault();if(acIdx<0)setAct(0);if(acIdx>=0&&acItems[acIdx])pick(acItems[acIdx].code);}});
    modal.addEventListener("click",e=>{const t=e.target;if(t===mIn||mAC.contains(t))return;if(t?.getAttribute?.("data-close")==="1")modal.__close();else closeAC();});
    document.addEventListener("keydown",async e=>{
      if(e.key !== "Escape" || !modal.classList.contains("is-open")) return;
      if(modal.classList.contains("hbw-pres")){
        e.preventDefault();
        e.stopPropagation();
        exitPres(false);
        return;
      }
      if(document.fullscreenElement){
        e.preventDefault();
        e.stopPropagation();
        try{ await document.exitFullscreen?.(); }catch(_){}
        return;
      }
      modal.__close();
    });

    modal.__open=()=>{
      modal.classList.remove("is-hidden","hbw-stable");
      setVH(modal);modal.classList.remove("hbw-expanded");
      requestAnimationFrame(()=>modal.classList.add("is-open"));
      const panel=modal.querySelector(".hbw-panel");
      const stable=()=>{if(modal.classList.contains("is-open"))modal.classList.add("hbw-stable");};
      clearTimeout(modal.__hbw_st);modal.__hbw_st=setTimeout(stable,320);
      if(panel&&!panel.__hbw_sb){panel.__hbw_sb=true;panel.addEventListener("transitionend",e=>{if(e.propertyName==="transform")stable();});}
      lockScroll();refreshAll();
      const vv=window.visualViewport;
      const onR=()=>{setVH(modal);refreshAll();};
      modal.__hbw_onResize=onR;
      window.addEventListener("resize",onR,{passive:true});
      window.addEventListener("orientationchange",onR,{passive:true});
      if(vv)vv.addEventListener("resize",onR,{passive:true});
      const handle=modal.querySelector("[data-handle]");
      if(panel&&handle)bindDrag(modal,panel,handle);
      setFsLabel();
      setTimeout(()=>{try{mIn.focus();}catch(_){}},350);
    };

    modal.__close=()=>{
      try{modal.__hbw_drag_cleanup?.();}catch(_){}
      try{modal.__hbw_fs_cleanup?.();}catch(_){}
      modal.__hbw_fs_cleanup=null;
      try{if(document.fullscreenElement)document.exitFullscreen?.();}catch(_){}
      modal.classList.remove("hbw-expanded","hbw-stable");
      const panel=modal.querySelector(".hbw-panel");
      if(panel)void panel.offsetHeight;
      requestAnimationFrame(()=>{
        modal.classList.remove("is-open");
        unlockScroll();
        const vv=window.visualViewport;const onR=modal.__hbw_onResize;
        if(onR){window.removeEventListener("resize",onR);window.removeEventListener("orientationchange",onR);if(vv)vv.removeEventListener("resize",onR);}
        window.setTimeout(()=>{if(!modal.classList.contains("is-open"))modal.classList.add("is-hidden");},260);
      });
    };

    return modal;
  }

  function initMount(mount){
    if(mount.__hbw_inited_v15_3)return;mount.__hbw_inited_v15_3=true;
    const wId=mount.getAttribute("data-id")||("hbw-"+Math.random().toString(16).slice(2));
    const defRef=mount.getAttribute("data-default")||"sp 23 1 6";
    const defT2=mount.getAttribute("data-t2")||"NR06";
    const defDual=mount.getAttribute("data-dual")||"1";

    const root=document.createElement("div");root.className="hbw hbw-card";root.__hbw_base_el=mount;applyTheme(root,mount);
    const hdr=document.createElement("div");hdr.className="hbw-header";
    const ttl=document.createElement("div");ttl.className="hbw-title";
    const tM=document.createElement("span");const tS=document.createElement("small");ttl.appendChild(tM);ttl.appendChild(tS);
    const cps=document.createElement("div");cps.className="hbw-chips";
    const c1=document.createElement("div");c1.className="hbw-chip hbw-chip-strong";
    const c2=document.createElement("div");c2.className="hbw-chip";
    const badge=document.createElement("div");badge.className="hbw-shortcut-badge";badge.innerHTML=`按 <kbd>=</kbd> 打开`;
    cps.appendChild(c1);cps.appendChild(c2);cps.appendChild(badge);
    hdr.appendChild(ttl);hdr.appendChild(cps);
    const body=document.createElement("div");body.className="hbw-body";
    const vw=document.createElement("div");vw.className="hbw-verses";vw.innerHTML=`<div class="hbw-help">正在准备预览…</div>`;
    const hint=document.createElement("div");hint.className="hbw-footerhint";hint.textContent="点击卡片或按 = 键打开搜索抽屉（只影响你自己的浏览器）";
    body.appendChild(vw);body.appendChild(hint);root.appendChild(hdr);root.appendChild(body);mount.innerHTML="";mount.appendChild(root);

    const getS=()=>{const s=lsLoad(wId);return {ref:s.ref||defRef,primary:s.primary||DEFAULT_PRIMARY,dual:(String(s.dual??defDual)==="0")?"0":"1",t2:(s.t2??defT2)};};
    const renderHead=()=>{const s=getS();const ref=parseRef(s.ref);tM.textContent=ref.ok?refText(ref,s.t2,s.dual==="1"):"经文格式不对";tS.textContent=ref.ok?"":ref.err;c1.textContent=(s.primary===PRIMARY_LOCAL)?"CUNPSS（默认）":shortC(s.primary,18);c2.textContent=(s.dual==="1")?shortC("第二译本："+t2Lbl(s.t2),34):"无第二译本";};

    async function renderCard(){
      const s=getS();renderHead();const ref=parseRef(s.ref);
      if(!ref.ok){vw.innerHTML=`<div class="hbw-help hbw-error">${ref.err}</div>`;return;}
      vw.innerHTML=`<div class="hbw-help">加载预览中…</div>`;
      try{
        const v1=await p1Fetch(s.primary,ref);
        if(s.dual==="1"&&s.t2){
          const v2=await p2Fetch(s.t2,ref);
          if(v2?.length){
            vw.innerHTML="";
            const m2=new Map();(v2||[]).forEach(v=>m2.set(String(v.verse||""),v));
            let c=0;
            for(const v of v1){
              const vn=String(v.verse||"");
              const d1=document.createElement("div");d1.className="hbw-line";
              d1.innerHTML=vn?`<span class="hbw-vn">${vn}</span><span>${clean(v.text||"")}</span>`:`<span>${clean(v.text||"")}</span>`;
              vw.appendChild(d1);
              const v2r=m2.get(vn);
              if(v2r&&vn){const d2=document.createElement("div");d2.className="hbw-line hbw-t2";d2.innerHTML=`<span class="hbw-vn">${vn}</span><span>${clean(v2r.text||"")}</span>`;vw.appendChild(d2);}
              c++;if(c>=4){const m=document.createElement("div");m.className="hbw-help";m.textContent="…（点开查看更多）";vw.appendChild(m);break;}
            }
            return;
          }
        }
        renderLines(vw,v1,false,6);
      }catch(e){vw.innerHTML=`<div class="hbw-help hbw-error">预览加载失败：${e?.message||e}</div>`;}
    }

    const idle=window.requestIdleCallback||((fn)=>setTimeout(()=>fn({timeRemaining:()=>0}),450));
    idle(()=>renderCard());

    root.addEventListener("click",async()=>{
      const modal=ensureModal();applyTheme(modal,document.body);
      const mTitle=modal.querySelector("[data-title]");
      const mIn=modal.querySelector("[data-input]");
      const mDual=modal.querySelector("[data-dual]");
      const mPri=modal.querySelector("[data-primary]");
      const mT2=modal.querySelector("[data-t2]");
      const mSt=modal.querySelector("[data-status]");
      const mOpen=modal.querySelector("[data-open]");
      const mReset=modal.querySelector("[data-reset]");
      const mSoloBox=modal.querySelector("[data-solo]");
      const mSoloH=modal.querySelector("[data-sh1]");
      const mSoloV=modal.querySelector("[data-solo-v]");
      const mParBox=modal.querySelector("[data-parbox]");
      const mPH1=modal.querySelector("[data-ph1]");
      const mPH2=modal.querySelector("[data-ph2]");
      const mPar=modal.querySelector("[data-par]");

      fillT2(mT2);
      const s=getS();
      mIn.value=s.ref;mPri.value=s.primary||DEFAULT_PRIMARY;mDual.checked=s.dual==="1";
      mT2.value=([...mT2.options].some(o=>o.value===String(s.t2)))?String(s.t2):defT2;
      mT2.disabled=!mDual.checked;
      modal.__open();

      const persist=()=>{const old=lsLoad(wId);lsSave(wId,{...old,ref:mIn.value.trim()||defRef,primary:mPri.value||DEFAULT_PRIMARY,dual:mDual.checked?"1":"0",t2:(mT2.value||old.t2||defT2)});renderHead();};

      let tok=0;
      const renderPrev=async()=>{
        const t=++tok;refreshAll();
        const ref=parseRef(mIn.value);
        if(!ref.ok){mTitle.textContent="经文";mSt.textContent=ref.err;mSt.className="hbw-help hbw-error";mSoloV.innerHTML="";mPar.innerHTML="";mSoloBox.style.display="";mParBox.style.display="none";return;}
        const dual=mDual.checked;const pri=mPri.value||DEFAULT_PRIMARY;const t2=dual?(mT2.value||""):"";
        mTitle.textContent=refText(ref,t2,dual);mSt.textContent="加载中…";mSt.className="hbw-help";
        try{
          const v1=await p1Fetch(pri,ref);if(t!==tok)return;
          const v2=t2?await p2Fetch(t2,ref):[];if(t!==tok)return;
          mSt.textContent="";
          if(t2){
            mSoloBox.style.display="none";mParBox.style.display="";
            mPH1.textContent="中文版本："+(pri===PRIMARY_LOCAL?"CUNPSS":pri);
            mPH2.textContent=t2Lbl(t2);
            renderParallelAligned(mPar,v1,v2);
          }else{
            mParBox.style.display="none";mSoloBox.style.display="";
            mSoloH.textContent="中文版本："+(pri===PRIMARY_LOCAL?"CUNPSS":pri);
            renderLines(mSoloV,v1,false,null);
          }
          // 投屏模式下渲染完毕后滚回顶部，防止第一节被切掉
          if(modal.classList.contains("hbw-pres")){
            setTimeout(()=>{ try{ result.scrollTop=0; }catch(_){} }, 50);
          }
          renderCard();
        }catch(e){if(t!==tok)return;mSt.textContent="加载失败："+(e?.message||e);mSt.className="hbw-help hbw-error";}
      };

      const go=async()=>{persist();await renderPrev();};
      mPri.onchange=async()=>{persist();await renderPrev();};
      mDual.onchange=async()=>{mT2.disabled=!mDual.checked;persist();await renderPrev();};
      mT2.onchange=async()=>{persist();await renderPrev();};
      mOpen.onclick=async()=>go();
      mReset.onclick=async()=>{lsClear(wId);const s2=getS();mIn.value=s2.ref;mPri.value=s2.primary;mDual.checked=s2.dual==="1";mT2.value=s2.t2;mT2.disabled=!mDual.checked;renderHead();await renderPrev();};
      modal.__triggerOpen=go;
      ensureBookMap().catch(e=>console.warn("[HBW]",e?.message));
      await go();
    });
    renderHead();
  }

  let raf=0;
  function scan(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;document.querySelectorAll(".hb-bible").forEach(m=>initMount(m));refreshAll();});}

  function boot(){
    watchTheme();
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",scan,{once:true});
    else scan();
    window.addEventListener("pageshow",scan);
    const obs=()=>{if(!document.body)return setTimeout(obs,60);new MutationObserver(ms=>{for(const mu of ms){for(const n of mu.addedNodes||[]){if(n?.nodeType===1&&(n.matches?.(".hb-bible")||n.querySelector?.(".hb-bible"))){scan();return;}}}}).observe(document.body,{childList:true,subtree:true});};obs();
  }

  boot();
})();

/* ===== HBW 快捷键 patch v15.4 ===== */
(function(){
  function isTypingTarget(t){
    if(!t) return false;
    const tag=(t.tagName||"").toLowerCase();
    if(tag==="input"||tag==="textarea"||tag==="select") return true;
    if(t.isContentEditable) return true;
    return false;
  }

  function openNearestHBW(){
    const cards = Array.from(document.querySelectorAll(".hbw-card"));
    if(!cards.length) return false;

    const inView = cards
      .map(el=>{
        const r = el.getBoundingClientRect();
        const center = Math.abs((r.top + r.bottom)/2 - window.innerHeight/2);
        const visible = r.bottom>0 && r.top<window.innerHeight;
        return {el, center, visible};
      })
      .sort((a,b)=> (b.visible-a.visible) || (a.center-b.center));

    const target = (inView[0] && inView[0].el) || cards[0];
    try{
      target.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));
      return true;
    }catch(e){
      try{ target.click(); return true; }catch(_){}
    }
    return false;
  }

  document.addEventListener("keydown", function(e){
    if(isTypingTarget(e.target)) return;

    const modal=document.querySelector(".hbw-modal");
    if(modal && modal.classList.contains("is-open")) return;

    const isAltGraph = !!(e.getModifierState && e.getModifierState("AltGraph"));
    if(e.metaKey) return;
    if(e.ctrlKey && !isAltGraph) return;
    if(e.altKey && !isAltGraph) return;

    const hit = (e.code==="Equal" || e.code==="NumpadAdd" || e.key==="=" || e.key==="+");
    if(!hit) return;

    e.preventDefault();
    openNearestHBW();
  }, true);
})();

/* ===== Ring Coach Tour v7.1 ===== */
(function(){
'use strict';
// 用 MutationObserver 等待引擎渲染完成后插入的 #rt5-enable
function initTourWhenReady(){
  if(document.getElementById('rt5-enable')){ initTour(); return; }
  var obs=new MutationObserver(function(){
    if(document.getElementById('rt5-enable')){ obs.disconnect(); initTour(); }
  });
  var body=document.body;
  if(body) obs.observe(body,{childList:true,subtree:true});
  else document.addEventListener('DOMContentLoaded',function(){ obs.observe(document.body,{childList:true,subtree:true}); });
}
function initTour(){

var $  = function(s,r){ return (r||document).querySelector(s); };
var $$ = function(s,r){ return Array.from((r||document).querySelectorAll(s)); };
function norm(s){ return (s||'').replace(/\s+/g,' ').trim(); }
function vis(el){
  if(!el) return false;
  var r=el.getBoundingClientRect();
  if(r.width<=0||r.height<=0) return false;
  var cs=window.getComputedStyle(el);
  return cs.display!=='none'&&cs.visibility!=='hidden'&&parseFloat(cs.opacity)>0.01;
}
function byText(tag,txt,root){
  var t=norm(txt);
  return $$(tag,root||document).find(function(n){ return norm(n.textContent)===t; })||null;
}
function sc(el){ try{ if(el&&el.click) el.click(); }catch(e){} }
function smallest(list){
  list=list.filter(function(e){ return e&&vis(e); });
  if(!list.length) return null;
  return list.sort(function(a,b){
    var ra=a.getBoundingClientRect(), rb=b.getBoundingClientRect();
    return ra.width*ra.height - rb.width*rb.height;
  })[0];
}
function lerp(a,b,t){ return a+(b-a)*t; }

function nearBottom(){
  var d=document.documentElement;
  return (Math.max(d.scrollHeight,document.body.scrollHeight)-(window.pageYOffset+window.innerHeight))<=220;
}
function modalIsOpen(){
  if(document.fullscreenElement) return true;
  var ss=['#lb-root-final.open','.lb.open','.fancybox-is-open','.pswp--open','.mfp-ready'];
  for(var i=0;i<ss.length;i++){ try{ if($(ss[i])) return true; }catch(e){} }
  return false;
}

var LOCK={on:false,y:0};
function lockPage(){
  if(LOCK.on) return;
  LOCK.y=window.pageYOffset||0; LOCK.on=true;
  document.body.classList.add('rt7-lock');
}
function unlockPage(){
  if(!LOCK.on) return;
  LOCK.on=false;
  document.body.classList.remove('rt7-lock');
  try{ window.scrollTo(0,LOCK.y); }catch(e){}
}

function ap(){ return $('.ym-song-panel.active .aplayer')||$('.aplayer')||$('[class*="aplayer-wrap"]'); }
function api(s){ var r=ap(); return r?$(s,r):null; }
function apPlayBtn(){
  var r=ap(); if(!r) return null;
  var candidates=[
    api('.aplayer-icon-play'), api('.aplayer-icon-pause'),
    api('[class*="aplayer-play"]'), api('[class*="aplayer-pause"]'),
    api('button[aria-label*="play"]'), api('button[aria-label*="pause"]'),
    api('i[class*="play"]'), api('i[class*="pause"]'),
    api('svg[class*="play"]'), api('svg[class*="pause"]')
  ].filter(Boolean);
  var found=smallest(candidates);
  if(found) return found;
  var ctrl=api('.aplayer-controller')||api('.aplayer-controls')||r;
  var btns=$$('button,[role="button"],.aplayer-icon',ctrl).filter(function(e){
    return !/bar|progress|list|volume|time/i.test((e.className||'').toString());
  });
  return smallest(btns);
}
function apBar(){ return api('.aplayer-bar-wrap')||api('.aplayer-bar')||api('.aplayer-progress-wrap')||api('.aplayer-controller')||ap(); }
function apTime(){ return api('.aplayer-time')||api('.aplayer-time-inner')||ap(); }
function apVolBtn(){
  var r=ap(); if(!r) return null;
  return smallest([
    api('.aplayer-icon-volume-down'),api('.aplayer-icon-volume-up'),
    api('[class*="aplayer-volume"] button'),api('[class*="aplayer-volume"] i'),
    api('i[class*="volume"]'),api('button[aria-label*="volume"]')
  ].filter(Boolean));
}
function apLoopBtn(){
  var r=ap(); if(!r) return null;
  return smallest([
    api('.aplayer-icon-loop'),api('.aplayer-icon-order'),api('.aplayer-icon-random'),
    api('i[class*="loop"]'),api('i[class*="order"]')
  ].filter(Boolean));
}
function apList(){ return api('.aplayer-list-cur')||api('.aplayer-list')||ap(); }

function metRoot(){ return $('.sw-metro')||$('[class*="sw-metro"]')||null; }
function metBpmBg(){ var r=metRoot(); if(!r) return null; return $('.mbg',r)||null; }
function metSettings(){ var r=metRoot(); if(!r) return null; return $('.msettings',r)||null; }
function metOpenSettings(){ var s=metSettings(); if(!s) return; s.style.display='block'; }
function metMinus(){
  metOpenSettings();
  var r=metRoot()||document;
  return $('.mminus',r)||$$('button',r).find(function(b){
    return vis(b)&&['-','−','–'].includes(norm(b.textContent));
  })||null;
}
function metPlus(){
  metOpenSettings();
  var r=metRoot()||document;
  return $('.mplus',r)||$$('button',r).find(function(b){
    return vis(b)&&['+','＋'].includes(norm(b.textContent));
  })||null;
}
function metBpmInput(){
  metOpenSettings();
  var r=metRoot(); if(!r) return null;
  return $('.mbpm',r)||$('input[type="number"]',r)||null;
}
function metStop(){ var r=metRoot()||document; return $('.mstop-btn',r)||byText('button','停止',r)||null; }
function metReset(){ var r=metRoot()||document; return $('.mreset',r)||byText('button','重置',r)||null; }

function bibleCard(){
  return $('.hbw-card')||$('[class*="hbw-card"]')||
    (function(){
      return $$('div,article,section').find(function(n){
        var t=norm(n.textContent);
        return (t.includes('创世记')||t.includes('约翰福音')||t.includes('诗篇'))&&
               n.children.length<=6 && t.length<200;
      })||null;
    })();
}
function bibleModal(){ return $('.hbw-modal.is-open')||$('.hbw-modal')||$('.hbw-sheet')||$('.hbw-drawer')||null; }
function bibleCtx(){ return bibleModal()||document; }
function bibleInput(){
  var c=bibleCtx();
  return $$('input',c).find(function(i){
    return vis(i)&&(i.type==='text'||/csj|书卷|经文|search/i.test(i.placeholder||''));
  })||null;
}
function bibleToggleBtn(){
  var c=bibleCtx();
  var sw=$('.hbw-switch',c); if(sw&&vis(sw)) return sw;
  return $$('label',c).find(function(n){ return vis(n)&&norm(n.textContent).includes('双译本'); })||null;
}
function bibleOpenBtn(){
  var c=bibleCtx();
  var el=$('[data-open]',c); if(el&&vis(el)) return el;
  return $$('button,.hbw-btn',c).find(function(b){ return vis(b)&&norm(b.textContent).includes('打开'); })||null;
}
function bibleDefaultBtn(){
  var c=bibleCtx();
  var el=$('[data-reset]',c); if(el&&vis(el)) return el;
  return $$('button,.hbw-btn',c).find(function(b){ return vis(b)&&/回到默认|默认/i.test(norm(b.textContent)); })||null;
}
function bibleFullscreenBtn(){
  var c=bibleCtx();
  var el=$('[data-fs]',c); if(el&&vis(el)) return el;
  var found=$$('.hbw-act',c).find(function(b){
    return vis(b)&&(norm(b.textContent).includes('全屏')||/全屏|fullscreen/i.test(b.getAttribute('title')||''));
  });
  if(found) return found;
  return $$('*',c).find(function(b){
    return vis(b)&&(/全屏/i.test(b.getAttribute('title')||'')||norm(b.textContent).trim()==='全屏');
  })||null;
}
function triggerBibleOpen(){
  var c=bibleCard();
  if(c&&vis(c)){ sc(c); return; }
  try{ if(window.HBW&&HBW.open) HBW.open(); }catch(e){}
}
function blurAllInputs(ctx){
  try{
    ctx=ctx||document;
    var active=document.activeElement;
    if(active&&/INPUT|TEXTAREA/.test(active.tagName)) active.blur();
    $$('input,textarea',ctx).forEach(function(i){ try{i.blur();}catch(e){}});
  }catch(e){}
}

var MODS={
  aplayer:{
    label:'🎵 APlayer 播放器',
    desc:'播放/暂停、进度条、时间、音量、循环模式、歌单',
    steps:[
      { ico:'🎵', t:'播放器整体', s:'整个 APlayer 区域', find:function(){ return ap(); }, text:'这是 <b>APlayer 播放器</b>。播放歌曲、调音量、切换模式都在这里 🎶' },
      { ico:'▶', t:'播放 / 暂停', s:'点击开始，再点暂停', find:function(){ return apPlayBtn(); }, text:'这个图标是 <b>播放/暂停</b>。<br>点一次 ▶ 开始播放，再点一次 ⏸ 暂停。' },
      { ico:'⏩', t:'进度条', s:'拖动跳到任意位置', find:function(){ return apBar(); }, text:'拖动进度条可以<b>跳到任意位置</b>，方便反复练习某一段 ⏩' },
      { ico:'🕐', t:'时间显示', s:'当前进度 / 总时长', find:function(){ return apTime(); }, text:'显示 <code>当前时间 / 总时长</code>，卡点练习时非常实用。' },
      { ico:'🔊', t:'音量控制', s:'点击静音，悬停拖动调节', find:function(){ return apVolBtn(); }, text:'点音量图标 <b>快速静音</b>；悬停后拖动滑块调节大小 🔊' },
      { ico:'🔁', t:'循环 / 随机模式', s:'切换播放模式', find:function(){ return apLoopBtn(); }, text:'切换模式：<b>列表循环 → 单曲循环 → 随机播放</b>。<br>敬拜时推荐"列表循环"。' },
      { ico:'📋', t:'歌单列表', s:'查看并切换歌曲', find:function(){ return apList(); }, text:'点击歌单里的歌曲名称<b>直接切换</b> 🎶' }
    ]
  },
  metronome:{
    label:'🥁 节拍器',
    desc:'面板启动 → BPM → 长按开设置 → − + 输入框 → 停止/重置',
    steps:[
      { ico:'🥁', t:'节拍器面板', s:'点击启动 / 停止', find:function(){ return metRoot(); }, text:'这是 <b>节拍器</b>，帮你保持稳定节奏 ⏱️<br><b>点击</b>面板空白处可以启动/停止节拍声。' },
      { ico:'🔢', t:'BPM 大字', s:'当前速度，越大越快', find:function(){ return metBpmBg()||metRoot(); }, text:'这里显示当前 <b>BPM（节奏速度）</b>，数字越大节奏越快。' },
      { ico:'⚙️', t:'设置面板（长按打开）', s:'长按任意处约 0.5 秒', before:function(){ metOpenSettings(); }, find:function(){ metOpenSettings(); return metSettings()||metBpmBg()||metRoot(); }, text:'<b>长按</b>面板任意处约 0.5 秒，弹出控制面板。<br>导览已帮你自动打开 ↓' },
      { ico:'➖', t:'− 按钮', s:'每按一次 BPM −1', find:function(){ metOpenSettings(); return metMinus()||metSettings()||metRoot(); }, text:'点 <code>−</code> 降低 BPM，让节奏变慢一点。' },
      { ico:'➕', t:'＋ 按钮', s:'每按一次 BPM +1', find:function(){ metOpenSettings(); return metPlus()||metSettings()||metRoot(); }, text:'点 <code>＋</code> 提高 BPM，让节奏更快。' },
      { ico:'🎛', t:'BPM 输入框', s:'直接输入精确数值', find:function(){ metOpenSettings(); return metBpmInput()||metSettings()||metRoot(); }, text:'在输入框里直接键入数字，精确设置 BPM（30–300）。改完按回车生效。' },
      { ico:'⏹', t:'停止', s:'立刻停止节拍声', find:function(){ metOpenSettings(); return metStop()||metRoot(); }, text:'点 <b>停止</b>，立刻结束节拍声。' },
      { ico:'↺', t:'重置', s:'恢复默认 BPM', find:function(){ metOpenSettings(); return metReset()||metRoot(); }, text:'点 <b>重置</b>，恢复到这首歌的默认 BPM。' }
    ]
  },
  transpose:{
    label:'🎸 移调计算器',
    desc:'展开移调面板 → 选目标调 → 变调夹提示 → 和弦歌词区',
    steps:[
      { ico:'🎸', t:'"移调"按钮', s:'点击展开/收起移调面板', find:function(){ return $$('.sw-tog').find(function(e){return vis(e);})||null; }, text:'点击 <b>移调</b> 按钮，展开调性选择面板。<br>点击后可以为吉他手/键盘手选择最顺手的调。' },
      { ico:'🎵', t:'目标调选择', s:'点击任意调名切换',
        before:function(){ var tog=$$('.sw-tog').find(function(e){return vis(e);}); if(tog){ var panel=tog.closest('.ym-song-panel')||document; var p=panel.querySelector?panel.querySelector('.sw-panel'):$('.sw-panel'); if(p&&!p.classList.contains('open')) try{ tog.click(); }catch(e){} } },
        find:function(){ var tog=$$('.sw-tog').find(function(e){return vis(e);}); if(tog){ var panel=tog.closest('.ym-song-panel')||document; var p=panel.querySelector?panel.querySelector('.sw-panel'):$('.sw-panel'); if(p&&!p.classList.contains('open')) try{ tog.click(); }catch(e){} return panel.querySelector?panel.querySelector('.sw-kg')||panel.querySelector('.sw-panel-inner'):$('.sw-kg')||$('.sw-panel-inner')||null; } return $$('.sw-kg').find(function(e){return vis(e);})||$$('.sw-panel-inner').find(function(e){return vis(e);})||null; },
        text:'这里列出了全部 12 个调名。<br>点击任意一个，下方的和弦、变调夹提示会立刻自动更新。' },
      { ico:'🟠', t:'变调夹提示', s:'显示需要夹第几格', find:function(){ return $$('.sw-capo').find(function(e){return vis(e);})||$$('.sw-panel-inner').find(function(e){return vis(e);})||null; }, text:'这里告诉你：<br>• 是否需要变调夹，以及夹第几格<br>• 实际弹奏时用哪个调的指法<br>选原调时显示"原调演奏，不需要变调夹"。' },
      { ico:'🎼', t:'和弦 + 歌词', s:'实时更新的和弦谱', find:function(){ return $$('.sw-lb').find(function(e){return vis(e);})||$$('.sw-lsec').find(function(e){return vis(e);})||$$('.sw-panel-inner').find(function(e){return vis(e);})||null; }, text:'移调后这里的所有和弦会<b>自动换算</b>成新的调性。<br>歌词保持不变，和弦名称实时更新。' }
    ]
  },
  bible:{
    label:'📖 圣经功能',
    desc:'入口 → 进入功能页 → 搜索框 → 双译本 → 打开 → 回到默认 → 全屏',
    steps:[
      { ico:'📖', t:'圣经入口', s:'外面的圣经卡片', find:function(){ return bibleCard()||$('.hbw'); }, text:'这是页面上的 <b>圣经入口卡片</b>，点它进入搜索界面。<br><br>💡 <b>电脑设备</b>：随时按键盘 <code>=</code> 键可以快速打开圣经，不需要滚动找卡片。' },
      { ico:'⚡', t:'进入圣经功能页', s:'自动打开功能页',
        before:function(){ triggerBibleOpen(); setTimeout(function(){ var ctx=bibleModal()||document; blurAllInputs(ctx); }, 450); },
        find:function(){ return bibleModal()||bibleInput()||bibleCard()||$('.hbw'); },
        text:'已进入圣经功能页，接下来逐一介绍里面的功能 👇' },
      { ico:'🔍', t:'搜索框', s:'输入速记快速定位经文', find:function(){ return bibleInput()||bibleModal()||$('.hbw'); }, text:'在这里输入速记：<br><code>csj 1 1 10</code> = 创世记 第1章 第1-10节<br>格式：<b>书卷拼音 章 起节 止节</b>' },
      { ico:'🌐', t:'双译本模式', s:'中文 + 另一语言对照', find:function(){ return bibleToggleBtn()||bibleModal()||$('.hbw'); }, text:'开启 <b>双译本</b>，同时显示中文 + 意大利语（或其他语言）对照阅读 🌐' },
      { ico:'✅', t:'打开', s:'跳转到搜索的经文', find:function(){ return bibleOpenBtn()||bibleModal()||$('.hbw'); }, text:'输入速记后点 <b>打开</b>，跳转到对应经文段落。' },
      { ico:'↺', t:'回到默认', s:'恢复默认显示设置', find:function(){ return bibleDefaultBtn()||bibleModal()||$('.hbw'); }, text:'点 <b>回到默认</b>，恢复圣经功能页的默认设置。' },
      { ico:'📺', t:'全屏', s:'投影/演示时使用', find:function(){ return bibleFullscreenBtn()||bibleModal()||$('.hbw'); }, text:'投影时点 <b>全屏</b>，经文铺满屏幕更清晰 📺<br>按 <code>Esc</code> 退出全屏。' }
    ]
  }
};

function mk(tag,cls,html){ var e=document.createElement(tag||'div'); if(cls) e.className=cls; if(html) e.innerHTML=html; return e; }
var fab=mk('button','rt7-fab'); fab.type='button';
fab.innerHTML='<span class="rt7-dot"></span>'
  +'<div style="display:flex;flex-direction:column;line-height:1.1;">'
  +'<div class="rt7-fname">工具导游</div>'
  +'<div class="rt7-ftip">选择功能逐步讲解</div></div>';

var mask=mk('div','rt7-mask');
var hub=mk('div','rt7-hub');
hub.innerHTML='<div class="rt7-hp">'
  +'<div class="rt7-hub-top"><div><h3 class="rt7-hub-title">功能导览</h3>'
  +'<p class="rt7-hub-desc">选择功能 · 小圆圈逐一指向每个按钮讲解</p></div>'
  +'<button class="rt7-hx" type="button">✕</button></div>'
  +'<div class="rt7-hub-body">'
  +Object.keys(MODS).map(function(k){
    var m=MODS[k];
    return '<div class="rt7-hcard" data-mod="'+k+'"><h4>'+m.label+'</h4>'
      +'<p>'+m.desc+'</p><div class="rt7-chip"><i></i>开始教程</div></div>';
  }).join('')
  +'</div></div>';

var ring=mk('div','rt7-ring');
var hl  =mk('div','rt7-hl');
var tip =mk('div','rt7-tip');
tip.innerHTML=''
  +'<div class="rt7-tip-head">'
  +'<div class="rt7-tip-ico" id="r7ico"></div>'
  +'<div class="rt7-tip-htxt"><div class="rt7-tip-h1" id="r7h1"></div>'
  +'<div class="rt7-tip-h2" id="r7h2"></div></div>'
  +'<button class="rt7-tipx" type="button">✕</button></div>'
  +'<div class="rt7-tip-body" id="r7bd"></div>'
  +'<div class="rt7-tip-foot"><div class="rt7-prog" id="r7pg"></div>'
  +'<div class="rt7-btns">'
  +'<button class="rt7-btn" id="r7pv">上一步</button>'
  +'<button class="rt7-btn pri" id="r7nx">下一步</button>'
  +'</div></div>';

document.body.append(mask,hub,hl,ring,tip,fab);

var $hx  = hub.querySelector('.rt7-hx');
var $tipx= tip.querySelector('.rt7-tipx');
var $ico = tip.querySelector('#r7ico');
var $h1  = tip.querySelector('#r7h1');
var $h2  = tip.querySelector('#r7h2');
var $bd  = tip.querySelector('#r7bd');
var $pg  = tip.querySelector('#r7pg');
var $pv  = tip.querySelector('#r7pv');
var $nx  = tip.querySelector('#r7nx');

var S={ hub:false, tour:false, steps:[], idx:0, raf:0 };

function updateFab(){
  var show=!S.hub&&!S.tour&&!nearBottom()&&!modalIsOpen();
  fab.style.display=show?'inline-flex':'none';
}
var _fr=0;
function sf(){ if(_fr) return; _fr=requestAnimationFrame(function(){_fr=0;updateFab();}); }
window.addEventListener('scroll',sf,{passive:true});
window.addEventListener('resize',sf,{passive:true});
document.addEventListener('click',sf,{passive:true});
document.addEventListener('fullscreenchange',sf);
new MutationObserver(sf).observe(document.body,{attributes:true,attributeFilter:['class','style']});

function showMask(){ mask.style.display='block'; requestAnimationFrame(function(){mask.classList.add('on');}); }
function hideMask(){ mask.classList.remove('on'); setTimeout(function(){mask.style.display='none';},200); }

function openHub(){ S.hub=true; updateFab(); lockPage(); showMask(); hub.style.display='flex'; requestAnimationFrame(function(){hub.classList.add('open');}); }
function closeHub(){ hub.classList.remove('open'); setTimeout(function(){hub.style.display='none';},200); S.hub=false; hideMask(); unlockPage(); updateFab(); }

var P={ x:0,y:0,w:100,h:50, rx:0,ry:0, cx:0,cy:0,cw:100,ch:50, crx:0,cry:0, ready:false };
function setTarget(el){
  var r=el.getBoundingClientRect(), pad=8;
  P.x=r.left-pad; P.y=r.top-pad;
  P.w=r.width+pad*2; P.h=r.height+pad*2;
  var rs=ring.offsetWidth||44;
  P.rx=r.left+r.width/2-rs/2;
  P.ry=r.top+r.height/2-rs/2;
  if(!P.ready){ P.cx=P.x; P.cy=P.y; P.cw=P.w; P.ch=P.h; P.crx=P.rx; P.cry=P.ry; P.ready=true; }
}
function applyPos(){
  hl.style.left=P.cx+'px'; hl.style.top=P.cy+'px';
  hl.style.width=P.cw+'px'; hl.style.height=P.ch+'px';
  ring.style.left=P.crx+'px'; ring.style.top=P.cry+'px';
}

function placeTip(el){
  tip.classList.remove('bt');
  tip.style.right=''; tip.style.bottom=''; tip.style.width='';
  var vW=window.innerWidth, vH=window.innerHeight;
  var m=10;
  var maxW=Math.min(390, vW-m*2);
  tip.style.maxWidth=maxW+'px';
  var r=el.getBoundingClientRect();
  var cW=Math.min(tip.offsetWidth||380, maxW);
  var cH=tip.offsetHeight||230;
  function pos(dir){
    var left,top;
    if(dir==='right'){ left=r.right+m; top=Math.max(m, Math.min(vH-cH-m, r.top+r.height/2-cH/2)); }
    else if(dir==='left'){ left=r.left-cW-m; top=Math.max(m, Math.min(vH-cH-m, r.top+r.height/2-cH/2)); }
    else if(dir==='below'){ top=r.bottom+m; left=Math.max(m, Math.min(vW-cW-m, r.left+r.width/2-cW/2)); }
    else { top=r.top-cH-m; left=Math.max(m, Math.min(vW-cW-m, r.left+r.width/2-cW/2)); }
    left=Math.max(m, Math.min(vW-cW-m, left));
    top =Math.max(m, Math.min(vH-cH-m, top));
    return {left:left, top:top};
  }
  function overlaps(p){ var cl=p.left, ct=p.top, cr=cl+cW, cb=ct+cH; var rl=r.left-6, rt=r.top-6, rr=r.right+6, rb=r.bottom+6; return cl<rr && cr>rl && ct<rb && cb>rt; }
  function space(dir){ if(dir==='right') return Math.max(0, vW-r.right-m); if(dir==='left') return Math.max(0, r.left-m); if(dir==='below') return Math.max(0, vH-r.bottom-m); return Math.max(0, r.top-m); }
  var dirs=['right','left','below','above'];
  var best=null, bestSpace=-1;
  for(var i=0;i<dirs.length;i++){ var d=dirs[i]; var p=pos(d); var sp=space(d); if(!overlaps(p) && sp>0){ if(sp>bestSpace){ bestSpace=sp; best={dir:d,p:p}; } } }
  if(!best){ for(var j=0;j<dirs.length;j++){ var d2=dirs[j]; var p2=pos(d2); var sp2=space(d2); if(sp2>bestSpace){ bestSpace=sp2; best={dir:d2,p:p2}; } } }
  if(!best) best={dir:'below', p:pos('below')};
  tip.style.left=best.p.left+'px';
  tip.style.top =best.p.top+'px';
}

function stopLoop(){ if(S.raf){ cancelAnimationFrame(S.raf); S.raf=0; } }
function loop(){
  if(!S.tour){ S.raf=0; return; }
  var s=S.steps[S.idx];
  if(s){ var neo=null; try{ neo=s.find?s.find():null; }catch(e){} if(neo&&vis(neo)){ s.el=neo; setTarget(neo); placeTip(neo); } }
  if(P.ready){ var sp=0.16; P.cx=lerp(P.cx,P.x,sp); P.cy=lerp(P.cy,P.y,sp); P.cw=lerp(P.cw,P.w,sp); P.ch=lerp(P.ch,P.h,sp); P.crx=lerp(P.crx,P.rx,sp); P.cry=lerp(P.cry,P.ry,sp); applyPos(); }
  S.raf=requestAnimationFrame(loop);
}

function render(){
  var s=S.steps[S.idx];
  if(!s){ closeTour(); return; }
  if(s.before&&!s._done){ s._done=true; try{ s.before(); }catch(e){} setTimeout(render, 420); return; }
  var el=null; try{ el=s.find?s.find():s.el; }catch(e){} if(el&&vis(el)) s.el=el;
  if(!s.el||!vis(s.el)){ s._retry=(s._retry||0)+1; if(s._retry<=3){ setTimeout(render, 300); return; } s._retry=0; if(S.idx<S.steps.length-1){ S.idx++; render(); } else closeTour(); return; }
  s._retry=0;
  try{ s.el.scrollIntoView({behavior:'smooth',block:'center'}); }catch(e){}
  if(/INPUT|TEXTAREA/.test((s.el.tagName||''))){ try{ s.el.blur(); }catch(e){} }
  try{ var ac=document.activeElement; if(ac&&/INPUT|TEXTAREA/.test(ac.tagName)) ac.blur(); }catch(e){}
  $ico.textContent = s.ico||'●'; $h1.textContent = s.t||''; $h2.textContent = s.s||''; $bd.innerHTML = s.text||'';
  $pg.textContent = (S.idx+1)+' / '+S.steps.length; $pv.disabled = S.idx===0; $nx.disabled = false;
  $nx.textContent = S.idx===S.steps.length-1?'完成':'下一步';
  P.ready=false; setTarget(s.el); requestAnimationFrame(function(){ placeTip(s.el); });
}

function openTour(key){
  hub.classList.remove('open'); setTimeout(function(){ hub.style.display='none'; },200); S.hub=false;
  var mod=MODS[key]; if(!mod){ return; }
  var steps=mod.steps.map(function(x){ return { ico:x.ico, t:x.t, s:x.s, find:x.find, before:x.before, text:x.text, el:null, _done:false }; }).filter(function(s){ return s.before||s.find; });
  if(!steps.length){ openHub(); return; }
  S.steps=steps; S.idx=0; S.tour=true; P.ready=false;
  updateFab(); lockPage(); showMask();
  hl.style.display='block'; ring.style.display='block'; tip.style.display='block';
  requestAnimationFrame(function(){ hl.classList.add('on'); ring.classList.add('on'); tip.classList.add('on'); });
  render(); stopLoop(); S.raf=requestAnimationFrame(loop);
}

function closeTour(){
  stopLoop(); S.tour=false; S.steps=[]; S.idx=0;
  hl.classList.remove('on'); ring.classList.remove('on'); tip.classList.remove('on');
  setTimeout(function(){ hl.style.display='none'; ring.style.display='none'; tip.style.display='none'; },200);
  hideMask(); unlockPage(); setTimeout(updateFab,80);
}

function next(){ if($nx.disabled) return; S.idx<S.steps.length-1?(S.idx++,render()):closeTour(); }
function prev(){ if(S.idx>0){ S.idx--; render(); } }

fab.addEventListener('click',openHub);
$hx.addEventListener('click',closeHub);
mask.addEventListener('click',function(){ if(S.tour) closeTour(); else if(S.hub) closeHub(); });
hub.querySelectorAll('.rt7-hcard').forEach(function(c){ c.addEventListener('click',function(){ openTour(c.getAttribute('data-mod')); }); });
$tipx.addEventListener('click',closeTour);
$nx.addEventListener('click',next);
$pv.addEventListener('click',prev);

window.addEventListener('keydown',function(e){
  if((e.key==='='||e.key==='Equal')&&!S.hub&&!S.tour&&!e.ctrlKey&&!e.metaKey&&!e.altKey){
    var tag=(document.activeElement||{}).tagName||'';
    if(!/INPUT|TEXTAREA|SELECT/.test(tag)){ e.preventDefault(); triggerBibleOpen(); return; }
  }
  if(!S.tour&&!S.hub) return;
  if(e.key==='Escape'){ if(S.tour) closeTour(); else closeHub(); return; }
  if(S.tour){ if(e.key==='ArrowRight'||e.key==='ArrowDown') next(); if(e.key==='ArrowLeft'||e.key==='ArrowUp') prev(); }
});

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',updateFab);
else updateFab();

} // end initTour
initTourWhenReady();
})();

/* ===== YuEn 水印 ===== */
(function(){
  function addWatermark(){
    if(document.getElementById('yuen-watermark')) return;
    var el = document.createElement('div');
    el.id = 'yuen-watermark';
    el.textContent = 'YuEn';
    document.body.appendChild(el);
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', addWatermark);
  } else {
    addWatermark();
  }
})();
