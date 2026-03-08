/* ✦ Designed & Built by YuEn © 2025–2026 ✦ */
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
  $('ml-back').addEventListener('click',()=>{destroyAP();$('ml-detail').classList.remove('open');});

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

  /* ══════════════ Jianpu helpers (ported from youth-engine) ══════════════ */
  function _div(cls){ const d=document.createElement('div'); d.className=cls; return d; }

  function parseJpToken(tok){
    if(!tok||tok==='|'||tok==='||'||tok===' '){
      const pl=document.createElement('span');
      pl.style.cssText='display:inline-flex;flex-direction:column;align-items:center;vertical-align:bottom;min-width:1em;';
      const _t=document.createElement('span');_t.style.height='12px';pl.appendChild(_t);
      const _s=document.createElement('span');_s.style.cssText='font-size:15px;line-height:1;text-align:center;';_s.textContent=tok||'';pl.appendChild(_s);
      const _b=document.createElement('span');_b.style.height='16px';pl.appendChild(_b);
      return pl;
    }
    if(tok==='sp'||tok==='sp_'||tok==='sp__'){
      const fake=tok==='sp__'?'0__':tok==='sp_'?'0_':'0';
      const el2=parseJpToken(fake);
      const lw=el2.children[1];if(lw){const nr=lw.children[0];if(nr){const ns=nr.children[0];if(ns)ns.style.visibility='hidden';}}
      return el2;
    }
    let num=tok,isHigh=0,isLow=0,isDot=false,uline=0;
    if(num.slice(-2)==='__'){uline=2;num=num.slice(0,-2);}
    else if(num.slice(-1)==='_'){uline=1;num=num.slice(0,-1);}
    if(num.indexOf('\u00b7')>-1){isDot=true;num=num.replace(/\u00b7/g,'');}
    const hm=num.match(/^(.+?)('+)$/);if(hm){isHigh=hm[2].length;num=hm[1];}
    const lm=num.match(/^(.+?)(,+)$/);if(lm){isLow=lm[2].length;num=lm[1];}
    const w=document.createElement('span');w.style.cssText='display:inline-flex;flex-direction:column;align-items:center;vertical-align:bottom;';
    const topDot=document.createElement('span');topDot.style.cssText='font-size:7px;line-height:1;height:12px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;';
    if(isHigh>=2)topDot.innerHTML='\u00b7<br>\u00b7';else if(isHigh===1)topDot.textContent='\u00b7';
    w.appendChild(topDot);
    const lw2=document.createElement('span');lw2.style.cssText='display:inline-flex;flex-direction:column;align-items:stretch;padding-bottom:4px;position:relative;';
    const numRow=document.createElement('span');numRow.style.cssText='display:inline-flex;align-items:center;justify-content:center;position:relative;'+(uline>=1?'border-bottom:1.5px solid currentColor;':'');
    const ns2=document.createElement('span');ns2.style.cssText='font-size:22px;line-height:1;display:inline-block;text-align:center;min-width:1em;';ns2.textContent=num;numRow.appendChild(ns2);
    if(isDot){const dt=document.createElement('span');dt.style.cssText='font-size:10px;position:absolute;right:-0.42em;top:0.1em;line-height:1;';dt.textContent='\u00b7';numRow.appendChild(dt);}
    lw2.appendChild(numRow);
    if(uline===2){const u2=document.createElement('span');u2.style.cssText='position:absolute;bottom:0;left:0;right:0;height:1.5px;background:currentColor;';lw2.appendChild(u2);}
    w.appendChild(lw2);
    const botDot=document.createElement('span');botDot.style.cssText='font-size:7px;line-height:1;height:16px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;';
    if(isLow>=2)botDot.innerHTML='\u00b7<br>\u00b7';else if(isLow===1)botDot.textContent='\u00b7';
    w.appendChild(botDot);
    return w;
  }

  function makeTuplet(n){
    const w=document.createElement('span');w.className='jp-tuplet';
    const br=document.createElement('span');br.className='jp-tuplet-br';w.appendChild(br);
    const nm=document.createElement('span');nm.className='jp-tuplet-num';nm.textContent=String(n);w.appendChild(nm);
    return w;
  }

  function renderNStr(nStr){
    const d=document.createElement('div');d.className='sw-jianpu';
    if(!nStr||!nStr.trim())return d;
    const toks=nStr.trim().split(/\s+/);let i=0;
    while(i<toks.length){
      const t=toks[i];
      if(t==='('){const sl=document.createElement('span');sl.className='jp-slur';i++;while(i<toks.length&&toks[i]!==')')sl.appendChild(parseJpToken(toks[i++]));d.appendChild(sl);i++;continue;}
      if(t==='(['){const so=document.createElement('span');so.className='jp-slur-open';i++;while(i<toks.length&&toks[i]!=='])')so.appendChild(parseJpToken(toks[i++]));if(i<toks.length)i++;d.appendChild(so);continue;}
      if(t==='])'){const sc=document.createElement('span');sc.className='jp-slur-close';i++;if(i<toks.length)sc.appendChild(parseJpToken(toks[i++]));d.appendChild(sc);continue;}
      const tm2=t.match(/^\{(3|5)$/);if(tm2){const tn=parseInt(tm2[1],10);const tp=makeTuplet(tn);i++;while(i<toks.length&&toks[i]!=='}')tp.appendChild(parseJpToken(toks[i++]));d.appendChild(tp);i++;continue;}
      if(t==='}'){i++;continue;}
      d.appendChild(parseJpToken(t));i++;
    }
    return d;
  }

  /* ── APlayer loader ── */
  let _apLoaded=false;
  function loadAPlayer(cb){
    if(_apLoaded){cb();return;}
    if(window.APlayer){_apLoaded=true;cb();return;}
    const css=document.createElement('link');css.rel='stylesheet';
    css.href='https://cdnjs.cloudflare.com/ajax/libs/aplayer/1.10.1/APlayer.min.css';
    document.head.appendChild(css);
    const js=document.createElement('script');
    js.src='https://cdnjs.cloudflare.com/ajax/libs/aplayer/1.10.1/APlayer.min.js';
    js.onload=()=>{_apLoaded=true;cb();};
    document.head.appendChild(js);
  }
  let _ap=null;
  function destroyAP(){if(_ap){try{_ap.destroy();}catch(_){} _ap=null;}}

  function openDetail(s){
    destroyAP();
    $('ml-detail-title').textContent=s.title||'';

    const cover=s.cover
      ?`<img id="ml-detail-cover" src="${s.cover}" onerror="this.outerHTML='<div id=\\'ml-detail-cover-placeholder\\'>♪</div>'">`
      :`<div id="ml-detail-cover-placeholder">♪</div>`;

    let btns='';
    if(s.youtube)btns+=`<a class="ml-btn ml-btn-primary" href="${s.youtube}" target="_blank">▶&nbsp;YouTube</a>`;
    if(s.lrc)btns+=`<a class="ml-btn ml-btn-secondary" href="${s.lrc}" target="_blank">📝&nbsp;LRC</a>`;

    const playerHTML=s.mp3?`<div id="ml-player-section"><div id="ml-aplayer"></div></div>`:'';

    /* static HTML for hero + actions + player */
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
      ${playerHTML}
    `;

    /* ── Chords + Jianpu section (DOM, youth-engine style) ── */
    if(s.sections&&s.sections.length){
      const sec_wrap=document.createElement('div');
      sec_wrap.id='ml-chords-section';
      const lbDiv=_div('sw-lb');
      for(const sec of s.sections){
        const se=_div('sw-lsec');
        const sn=_div('sw-lsec-name');sn.textContent=sec.name||'';se.appendChild(sn);
        for(const line of sec.lines||[]){
          const le=_div('sw-lline');
          const row=_div('sw-lrow');
          const segs=Array.isArray(line)?line:(line.line||[]);
          for(const seg of segs){
            const segEl=_div('sw-seg');
            const chord=document.createElement('span');
            chord.className='sw-chord'+(seg.chord?'':' empty');
            chord.textContent=seg.chord||'';
            segEl.appendChild(chord);
            if(seg.n&&seg.n.trim())segEl.appendChild(renderNStr(seg.n));
            const lyric=document.createElement('span');
            lyric.className='sw-lyric';
            lyric.textContent=seg.lyric||'';
            segEl.appendChild(lyric);
            row.appendChild(segEl);
          }
          le.appendChild(row);se.appendChild(le);
        }
        lbDiv.appendChild(se);
      }
      sec_wrap.appendChild(lbDiv);
      $('ml-detail-body').appendChild(sec_wrap);
    }

    /* ── Score image (youth-engine sw-score style) ── */
    if(s.scoreImg){
      const scoreDiv=document.createElement('div');
      scoreDiv.className='sw-score';
      scoreDiv.style.margin='14px 16px';
      scoreDiv.innerHTML=`
        <div class="sw-score-top">
          <span class="sw-score-lbl">简谱原稿</span>
          <span class="sw-score-key">1 = ${s.origKey||'?'}</span>
        </div>
      `;
      const img=document.createElement('img');
      img.src=s.scoreImg;img.loading='lazy';
      img.style.cssText='width:100%;display:block;cursor:zoom-in;';
      img.addEventListener('click',()=>openLightbox(s.scoreImg));
      scoreDiv.appendChild(img);
      $('ml-detail-body').appendChild(scoreDiv);
    }

    /* ── APlayer ── */
    if(s.mp3){
      loadAPlayer(()=>{
        const mount=document.getElementById('ml-aplayer');
        if(!mount)return;
        const mp3=s.mp3.startsWith('http')?s.mp3:('https://cecp.it'+s.mp3);
        _ap=new window.APlayer({
          container:mount,
          audio:[{name:s.title||'',artist:s.artist||'',url:mp3,cover:s.cover||'',lrc:s.lrc||undefined}],
          autoplay:false,theme:'var(--accent,#007aff)',lrcType:s.lrc?3:0,
        });
      });
    }

    $('ml-detail').classList.add('open');
    $('ml-detail').scrollTop=0;
  }

  loadSongs();
})();
