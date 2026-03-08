/* CECP Music Library v1.0 — YuEn */
(function(){
  const GITHUB_API = 'https://api.github.com/repos/CYE04/Cecp/contents/songs';
  const RAW_BASE   = 'https://raw.githubusercontent.com/CYE04/Cecp/main/songs/';
  const CONTACT    = 'mailto:yuen@cecp.it?subject=诗歌申请';

  /* ── inject CSS ── */
  if(!document.getElementById('ml-style')){
    const s=document.createElement('link');
    s.id='ml-style';s.rel='stylesheet';
    s.href='https://cye04.github.io/Cecp/musiclib.css';
    document.head.appendChild(s);
  }

  /* ── find mount point ── */
  const root=document.getElementById('music-library');
  if(!root)return;

  /* ── state ── */
  let songs=[], query='', activeSong=null;

  /* ── build shell ── */
  root.innerHTML=`
    <div id="ml-header">
      <div id="ml-header-top">
        <div id="ml-logo">CECP</div>
        <div id="ml-title">诗歌库</div>
        <div id="ml-count">载入中…</div>
      </div>
      <div id="ml-search-wrap">
        <span id="ml-search-icon">🔍</span>
        <input id="ml-search" type="text" placeholder="搜索歌名、歌词…" autocomplete="off"/>
      </div>
    </div>
    <div id="ml-loading">正在载入诗歌…</div>
    <div id="ml-list"></div>
    <div id="ml-empty">
      <div id="ml-empty-icon">🎵</div>
      <div id="ml-empty-msg">找不到「<span id="ml-query-text"></span>」</div>
      <div id="ml-empty-sub">还没有这首歌，可以联系 YuEn 添加</div>
      <a id="ml-contact" href="${CONTACT}">📩 联系 YuEn 申请添加</a>
    </div>
    <div id="ml-detail">
      <div id="ml-detail-header">
        <button id="ml-back">← 返回</button>
        <div id="ml-detail-title"></div>
      </div>
      <div id="ml-detail-body"></div>
    </div>
  `;

  const $=id=>document.getElementById(id);

  /* ── search ── */
  $('ml-search').addEventListener('input',e=>{
    query=e.target.value.trim();
    render();
  });

  /* ── back button ── */
  $('ml-back').addEventListener('click',()=>{
    $('ml-detail').classList.remove('open');
    activeSong=null;
  });

  /* ── load songs from GitHub ── */
  async function loadSongs(){
    try{
      // 1. Get file list from GitHub API
      const res=await fetch(GITHUB_API);
      if(!res.ok)throw new Error('GitHub API error');
      const files=await res.json();
      const jsonFiles=files.filter(f=>f.name.endsWith('.json')&&f.name!=='test.json');

      // 2. Fetch each song JSON in parallel
      const fetches=jsonFiles.map(f=>
        fetch(RAW_BASE+f.name).then(r=>r.json()).catch(()=>null)
      );
      const results=await Promise.all(fetches);
      songs=results.filter(Boolean);

      $('ml-loading').style.display='none';
      $('ml-count').textContent=songs.length+'首';
      render();
    }catch(err){
      $('ml-loading').textContent='载入失败，请刷新重试';
      console.error('[MusicLib]',err);
    }
  }

  /* ── render list ── */
  function render(){
    const list=$('ml-list');
    const empty=$('ml-empty');
    const q=query.toLowerCase();

    const filtered=q
      ? songs.filter(s=>
          (s.title||'').toLowerCase().includes(q)||
          (s.artist||'').toLowerCase().includes(q)||
          (s.sub||'').toLowerCase().includes(q)||
          hasLyricMatch(s,q)
        )
      : [...songs];

    // sort: exact title match first
    filtered.sort((a,b)=>{
      const at=(a.title||'').toLowerCase().startsWith(q)?0:1;
      const bt=(b.title||'').toLowerCase().startsWith(q)?0:1;
      return at-bt;
    });

    if(filtered.length===0){
      list.innerHTML='';
      $('ml-query-text').textContent=query;
      empty.style.display='block';
    } else {
      empty.style.display='none';
      list.innerHTML=filtered.map(s=>cardHTML(s,q)).join('');
      // bind clicks
      list.querySelectorAll('.ml-song-card').forEach(el=>{
        el.addEventListener('click',()=>{
          const id=el.dataset.id;
          const song=songs.find(s=>s.id===id);
          if(song)openDetail(song);
        });
      });
    }
  }

  function hasLyricMatch(song,q){
    if(!song.sections)return false;
    for(const sec of song.sections){
      for(const line of sec.lines||[]){
        const lineArr=Array.isArray(line)?line:(line.line||[]);
        for(const cell of lineArr){
          if((cell.lyric||'').toLowerCase().includes(q))return true;
        }
      }
    }
    return false;
  }

  function highlight(text,q){
    if(!q||!text)return text||'';
    const esc=q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    return text.replace(new RegExp(`(${esc})`,'gi'),'<mark class="ml-highlight">$1</mark>');
  }

  function cardHTML(s,q){
    const cover=s.cover
      ? `<img class="ml-cover" src="${s.cover}" loading="lazy" onerror="this.style.display='none';this.nextSibling.style.display='flex'">`+
        `<div class="ml-cover-placeholder" style="display:none">♪</div>`
      : `<div class="ml-cover-placeholder">♪</div>`;
    return `
      <div class="ml-song-card" data-id="${s.id}">
        ${cover}
        <div class="ml-info">
          <div class="ml-song-title">${highlight(s.title,q)}</div>
          <div class="ml-song-meta">${highlight(s.artist||'',q)}${s.sub?' · '+highlight(s.sub,q):''}</div>
        </div>
        ${s.origKey?`<div class="ml-song-key">${s.origKey}</div>`:''}
      </div>`;
  }

  /* ── detail view ── */
  function openDetail(song){
    activeSong=song;
    $('ml-detail-title').textContent=song.title||'';

    const cover=song.cover
      ? `<img id="ml-detail-cover" src="${song.cover}" onerror="this.style.display='none'">`
      : `<div id="ml-detail-cover-placeholder">♪</div>`;

    // action buttons
    let btns='';
    if(song.youtube)
      btns+=`<a class="ml-btn ml-btn-primary" href="${song.youtube}" target="_blank">▶ YouTube</a>`;
    if(song.scoreImg)
      btns+=`<a class="ml-btn ml-btn-secondary" href="${song.scoreImg}" target="_blank">📄 简谱图</a>`;
    if(song.lrc)
      btns+=`<a class="ml-btn ml-btn-secondary" href="${song.lrc}" target="_blank">📝 LRC</a>`;

    // chords display
    let chordsHTML='';
    if(song.sections&&song.sections.length){
      chordsHTML=`<div id="ml-chords-section"><h3>歌词 / 和弦</h3>`;
      for(const sec of song.sections){
        chordsHTML+=`<div class="ml-section-name">${sec.name||''}</div>`;
        for(const line of sec.lines||[]){
          const cells=Array.isArray(line)?line:(line.line||[]);
          chordsHTML+=`<div class="ml-line">`;
          for(const cell of cells){
            if(cell.lyric==='｜'||cell.lyric==='\\\\'){
              chordsHTML+=`<span class="ml-bar">${cell.lyric==='\\\\' ? '<br>' : '|'}</span>`;
            } else {
              const ch=cell.chord||'';
              const ly=cell.lyric||'';
              chordsHTML+=`<span class="ml-cell"><span class="ml-chord">${ch}</span><span class="ml-lyric">${ly||' '}</span></span>`;
            }
          }
          chordsHTML+=`</div>`;
        }
      }
      chordsHTML+=`</div>`;
    }

    // score image
    let scoreHTML='';
    if(song.scoreImg){
      scoreHTML=`<div id="ml-score-section"><h3>简谱</h3><img id="ml-score-img" src="${song.scoreImg}" loading="lazy"></div>`;
    }

    $('ml-detail-body').innerHTML=`
      <div id="ml-detail-hero">
        ${cover}
        <div id="ml-detail-meta">
          <div id="ml-detail-name">${song.title||''}</div>
          <div id="ml-detail-artist">${song.artist||''}</div>
          <div id="ml-detail-sub">${song.sub||''}</div>
          <div class="ml-tags">
            ${song.origKey?`<span class="ml-tag">原调 ${song.origKey}</span>`:''}
            ${song.timeSign?`<span class="ml-tag">${song.timeSign}</span>`:''}
            ${song.bpm?`<span class="ml-tag">♩=${song.bpm}</span>`:''}
          </div>
        </div>
      </div>
      ${btns?`<div id="ml-actions">${btns}</div>`:''}
      ${chordsHTML}
      ${scoreHTML}
    `;

    $('ml-detail').classList.add('open');
    $('ml-detail').scrollTop=0;
  }

  /* ── start ── */
  loadSongs();
})();
