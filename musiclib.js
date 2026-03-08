/* CECP Music Library v2.1 — Theme Adaptive + Lightbox */
(function(){
  const GITHUB_API='https://api.github.com/repos/CYE04/Cecp/contents/songs';
  const RAW_BASE='https://raw.githubusercontent.com/CYE04/Cecp/main/songs/';
  const CONTACT='mailto:yuen@cecp.it?subject=诗歌申请';

  if(!document.getElementById('ml-style')){
    const s=document.createElement('link');
    s.id='ml-style';s.rel='stylesheet';
    s.href='https://cye04.github.io/Cecp/musiclib.css';
    document.head.appendChild(s);
  }

  const root=document.getElementById('music-library');
  if(!root)return;

  let songs=[],query='';

  root.innerHTML=`
    <div id="ml-header">
      <div id="ml-header-top">
        <div id="ml-title">🎵 诗歌库</div>
        <div id="ml-count"></div>
      </div>
      <div id="ml-search-wrap">
        <span id="ml-search-icon">🔍</span>
        <input id="ml-search" type="text" placeholder="搜索歌名或歌词…" autocomplete="off" autocorrect="off"/>
      </div>
    </div>
    <div id="ml-loading"><div id="ml-spinner"></div>正在载入诗歌…</div>
    <div id="ml-list"></div>
    <div id="ml-empty">
      <div id="ml-empty-icon">🎶</div>
      <div id="ml-empty-msg">找不到「<span id="ml-query-text"></span>」</div>
      <div id="ml-empty-sub">还没有这首歌，可以联系 YuEn 添加</div>
      <a id="ml-contact" href="${CONTACT}">📩 联系 YuEn 申请添加</a>
    </div>
    <div id="ml-detail">
      <div id="ml-detail-header">
        <button id="ml-back">‹ 返回</button>
        <div id="ml-detail-title"></div>
      </div>
      <div id="ml-detail-body"></div>
    </div>
    <div id="ml-lightbox">
      <button id="ml-lightbox-close">✕</button>
      <img id="ml-lightbox-img" src="" alt="简谱">
    </div>
  `;

  const $=id=>document.getElementById(id);

  $('ml-search').addEventListener('input',e=>{query=e.target.value.trim();render();});
  $('ml-back').addEventListener('click',()=>$('ml-detail').classList.remove('open'));

  /* lightbox */
  $('ml-lightbox').addEventListener('click',e=>{
    if(e.target===e.currentTarget||e.target.id==='ml-lightbox-close')
      $('ml-lightbox').classList.remove('open');
  });
  $('ml-lightbox-img').addEventListener('click',e=>e.stopPropagation());

  function openLightbox(src){
    $('ml-lightbox-img').src=src;
    $('ml-lightbox').classList.add('open');
  }

  /* load */
  async function loadSongs(){
    try{
      const res=await fetch(GITHUB_API);
      if(!res.ok)throw new Error();
      const files=await res.json();
      const jsons=files.filter(f=>f.name.endsWith('.json')&&f.name!=='test.json');
      const all=await Promise.all(jsons.map(f=>fetch(RAW_BASE+f.name).then(r=>r.json()).catch(()=>null)));
      songs=all.filter(Boolean);
      $('ml-loading').style.display='none';
      $('ml-count').textContent=songs.length+' 首';
      render();
    }catch(e){
      $('ml-loading').innerHTML='<div style="color:#ff3b30;font-size:14px">载入失败，请刷新重试</div>';
    }
  }

  function hasLyricMatch(s,q){
    for(const sec of s.sections||[])
      for(const line of sec.lines||[]){
        const arr=Array.isArray(line)?line:(line.line||[]);
        for(const c of arr)if((c.lyric||'').toLowerCase().includes(q))return true;
      }
    return false;
  }

  function hi(t,q){
    if(!q||!t)return t||'';
    return t.replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`,'gi'),'<mark class="ml-highlight">$1</mark>');
  }

  function render(){
    const list=$('ml-list'),empty=$('ml-empty'),q=query.toLowerCase();
    let filtered=q
      ?songs.filter(s=>(s.title||'').toLowerCase().includes(q)||(s.artist||'').toLowerCase().includes(q)||hasLyricMatch(s,q))
      :[...songs];
    filtered.sort((a,b)=>((a.title||'').toLowerCase().startsWith(q)?0:1)-((b.title||'').toLowerCase().startsWith(q)?0:1));

    if(!filtered.length){
      list.innerHTML='';
      $('ml-query-text').textContent=query;
      empty.style.display='block';
    }else{
      empty.style.display='none';
      list.innerHTML=filtered.map(s=>cardHTML(s,q)).join('')+'<div id="ml-list-end"></div>';
      list.querySelectorAll('.ml-song-card').forEach(el=>{
        el.addEventListener('click',()=>{
          const s=songs.find(x=>x.id===el.dataset.id);
          if(s)openDetail(s);
        });
      });
    }
  }

  function cardHTML(s,q){
    const cover=s.cover
      ?`<img class="ml-cover" src="${s.cover}" loading="lazy" onerror="this.outerHTML='<div class=\\'ml-cover-placeholder\\'>♪</div>'">`
      :`<div class="ml-cover-placeholder">♪</div>`;
    return`<div class="ml-song-card" data-id="${s.id}">
      ${cover}
      <div class="ml-info">
        <div class="ml-song-title">${hi(s.title,q)}</div>
        <div class="ml-song-meta">${hi([s.artist,s.sub].filter(Boolean).join(' · '),q)}</div>
      </div>
      ${s.origKey?`<div class="ml-song-key">${s.origKey}</div>`:''}
      <span class="ml-chevron">›</span>
    </div>`;
  }

  function openDetail(s){
    $('ml-detail-title').textContent=s.title||'';
    const cover=s.cover
      ?`<img id="ml-detail-cover" src="${s.cover}" onerror="this.outerHTML='<div id=\\'ml-detail-cover-placeholder\\'>♪</div>'">`
      :`<div id="ml-detail-cover-placeholder">♪</div>`;

    let btns='';
    if(s.youtube)btns+=`<a class="ml-btn ml-btn-primary" href="${s.youtube}" target="_blank">▶&nbsp;YouTube</a>`;
    if(s.scoreImg)btns+=`<a class="ml-btn ml-btn-secondary" href="${s.scoreImg}" target="_blank">📄&nbsp;简谱</a>`;
    if(s.lrc)btns+=`<a class="ml-btn ml-btn-secondary" href="${s.lrc}" target="_blank">📝&nbsp;LRC</a>`;

    let chordsHTML='';
    if(s.sections&&s.sections.length){
      chordsHTML=`<div id="ml-chords-section"><div class="ml-section-label">歌词 / 和弦</div>`;
      for(const sec of s.sections){
        chordsHTML+=`<div class="ml-section-name">${sec.name||''}</div>`;
        for(const line of sec.lines||[]){
          const cells=Array.isArray(line)?line:(line.line||[]);
          chordsHTML+=`<div class="ml-line">`;
          for(const c of cells){
            if(c.lyric==='｜')chordsHTML+=`<span class="ml-bar">|</span>`;
            else if(c.lyric==='\\\\')chordsHTML+=`</div><div class="ml-line">`;
            else chordsHTML+=`<span class="ml-cell"><span class="ml-chord">${c.chord||''}</span><span class="ml-lyric">${c.lyric||' '}</span></span>`;
          }
          chordsHTML+=`</div>`;
        }
      }
      chordsHTML+=`</div>`;
    }

    /* score image — clickable for lightbox */
    let scoreHTML='';
    if(s.scoreImg){
      scoreHTML=`<div id="ml-score-section">
        <div class="ml-section-label">简谱（点击放大）</div>
        <img id="ml-score-img" src="${s.scoreImg}" loading="lazy" data-src="${s.scoreImg}">
      </div>`;
    }

    $('ml-detail-body').innerHTML=`
      <div id="ml-detail-hero">
        ${cover}
        <div id="ml-detail-meta">
          <div id="ml-detail-name">${s.title||''}</div>
          <div id="ml-detail-artist">${s.artist||''}</div>
          <div id="ml-detail-sub">${s.sub||''}</div>
          <div class="ml-tags">
            ${s.origKey?`<span class="ml-tag">原调 ${s.origKey}</span>`:''}
            ${s.timeSign?`<span class="ml-tag">${s.timeSign}</span>`:''}
            ${s.bpm?`<span class="ml-tag">♩=${s.bpm}</span>`:''}
          </div>
        </div>
      </div>
      ${btns?`<div id="ml-actions">${btns}</div>`:''}
      ${chordsHTML}
      ${scoreHTML}
    `;

    /* bind score image click → lightbox */
    const scoreEl=document.getElementById('ml-score-img');
    if(scoreEl){
      scoreEl.addEventListener('click',()=>openLightbox(scoreEl.dataset.src));
    }

    $('ml-detail').classList.add('open');
    $('ml-detail').scrollTop=0;
  }

  loadSongs();
})();
