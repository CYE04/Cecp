/* ✦ Designed & Built by YuEn © 2025–2026 ✦ */
/* CECP Music Library v3.0 */
(function(){
  const GITHUB_API='https://api.github.com/repos/CYE04/Cecp/contents/songs';
  const RAW_BASE='https://raw.githubusercontent.com/CYE04/Cecp/main/songs/';
  const WECHAT='CYuen_290104';

  if(!document.getElementById('ml-style')){
    const s=document.createElement('link');s.id='ml-style';s.rel='stylesheet';
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
      <div id="ml-empty-icon">🎵</div>
      <div id="ml-empty-msg">找不到「<span id="ml-query-text"></span>」</div>
      <div id="ml-empty-sub">还没有这首歌，可以微信联系 YuEn 申请添加</div>
      <button id="ml-contact">💬 复制微信号 YuEn</button>
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
      <img id="ml-lightbox-img" src="" alt="">
    </div>
  `;

  const $=id=>document.getElementById(id);

  $('ml-search').addEventListener('input',e=>{query=e.target.value.trim();render();});
  $('ml-back').addEventListener('click',()=>{destroyAP();$('ml-detail').classList.remove('open');});
  $('ml-contact').addEventListener('click',function(){
    navigator.clipboard&&navigator.clipboard.writeText(WECHAT).then(()=>{
      this.textContent='✓ 已复制微信号';
      setTimeout(()=>{this.textContent='💬 复制微信号 YuEn';},2000);
    });
  });
  $('ml-lightbox').addEventListener('click',e=>{
    if(e.target===e.currentTarget||e.target.id==='ml-lightbox-close')
      $('ml-lightbox').classList.remove('open');
  });
  $('ml-lightbox-img').addEventListener('click',e=>e.stopPropagation());
  function openLightbox(src){$('ml-lightbox-img').src=src;$('ml-lightbox').classList.add('open');}

  /* ── Load songs ── */
  async function loadSongs(){
    try{
      const res=await fetch(GITHUB_API);if(!res.ok)throw 0;
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
    for(const sec of s.sections||[])for(const line of sec.lines||[]){
      const arr=Array.isArray(line)?line:(line.line||[]);
      for(const c of arr)if((c.lyric||'').toLowerCase().includes(q))return true;
    }return false;
  }
  function hi(t,q){
    if(!q||!t)return t||'';
    return t.replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`,'gi'),'<mark class="ml-highlight">$1</mark>');
  }

  function render(){
    const list=$('ml-list'),empty=$('ml-empty'),q=query.toLowerCase();
    const filtered=q
      ?songs.filter(s=>(s.title||'').toLowerCase().includes(q)||(s.artist||'').toLowerCase().includes(q)||hasLyricMatch(s,q))
      :[...songs];
    if(!filtered.length){
      list.innerHTML='';$('ml-query-text').textContent=query;empty.style.display='block';
    }else{
      empty.style.display='none';
      list.innerHTML=filtered.map(s=>cardHTML(s,q)).join('')+'<div id="ml-list-end"></div>';
      list.querySelectorAll('.ml-song-card').forEach(el=>{
        el.addEventListener('click',()=>{const s=songs.find(x=>x.id===el.dataset.id);if(s)openDetail(s);});
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
      ${s.origKey?`<span class="ml-song-key">${s.origKey}</span>`:''}
      <span class="ml-chevron">›</span>
    </div>`;
  }

  /* ══ Jianpu helpers (from youth-engine) ══ */
  function _div(cls){const d=document.createElement('div');d.className=cls;return d;}

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
      const e2=parseJpToken(fake);const lw=e2.children[1];
      if(lw){const nr=lw.children[0];if(nr){const ns=nr.children[0];if(ns)ns.style.visibility='hidden';}}
      return e2;
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
  function makeTuplet(n){const w=document.createElement('span');w.className='jp-tuplet';const br=document.createElement('span');br.className='jp-tuplet-br';w.appendChild(br);const nm=document.createElement('span');nm.className='jp-tuplet-num';nm.textContent=String(n);w.appendChild(nm);return w;}
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

  /* ══ APlayer ══ */
  let _apLoaded=false,_ap=null;
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
  function destroyAP(){if(_ap){try{_ap.destroy();}catch(_){}_ap=null;}}

  /* ══ Transpose helpers ══ */
  const CHR=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const ENH={Db:'C#',Eb:'D#',Gb:'F#',Ab:'G#',Bb:'A#'};
  const FLT={'C#':'Db','D#':'Eb','F#':'Gb','G#':'Ab','A#':'Bb'};
  function nIdx(n){return CHR.indexOf(ENH[n]||n);}
  function trNote(n,st){const i=nIdx(n);if(i<0)return n;const r=CHR[(i+st+12)%12];return FLT[r]||r;}
  function trS(c,st){const m=c.match(/^([A-G][b#]?)(.*)$/);if(!m)return c;return trNote(m[1],st)+m[2];}
  function trChord(c,st){if(!st)return c;const s=c.indexOf('/');if(s>-1)return trS(c.slice(0,s),st)+'/'+trS(c.slice(s+1),st);return trS(c,st);}
  function calcCapo(t,o){
    const st=(nIdx(t)-nIdx(o)+12)%12;let best=null;
    ['C','D','E','F','G','A','B'].forEach(pk=>{const c=(nIdx(t)-nIdx(pk)+12)%12;if(c<=7&&(!best||c<best.capo))best={playKey:pk,capo:c};});
    return{st,capo:best?best.capo:0,playKey:best?best.playKey:t};
  }

  /* ══ Detail page ══ */
  function openDetail(s){
    destroyAP();
    $('ml-detail-title').textContent=s.title||'';
    const body=$('ml-detail-body');
    body.innerHTML='';

    /* 1. APlayer — full width at top */
    if(s.mp3){
      const apWrap=document.createElement('div');apWrap.id='ml-aplayer-top';
      const apMount=document.createElement('div');apMount.id='ml-aplayer';
      apWrap.appendChild(apMount);body.appendChild(apWrap);
    }

    /* 2. Song info + 移调 toggle (youth-engine sw-hd layout) */
    const KEYS=['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
    let curKey=s.origKey||'C';

    const wrap=document.createElement('div');wrap.className='sw-wrap';

    // header row: info + toggle button
    const kPill=document.createElement('span');kPill.className='sw-pill sw-kpill';kPill.textContent='1 = '+curKey;
    const infoDiv=document.createElement('div');
    infoDiv.innerHTML=`<div class="sw-eyebrow">Worship Song</div>
      <div class="sw-title">${s.title||''}</div>
      <div class="sw-sub">${s.sub||''}</div>`;
    const pillsDiv=document.createElement('div');pillsDiv.className='sw-pills';
    pillsDiv.appendChild(kPill);
    if(s.timeSign){const p=document.createElement('span');p.className='sw-pill';p.textContent=s.timeSign;pillsDiv.appendChild(p);}
    if(s.bpm){const p=document.createElement('span');p.className='sw-pill';p.textContent='♩ = '+s.bpm;pillsDiv.appendChild(p);}
    infoDiv.appendChild(pillsDiv);

    const togBtn=document.createElement('button');togBtn.className='sw-tog';
    togBtn.innerHTML='<svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg> 移调';

    const hd=document.createElement('div');hd.className='sw-hd';
    hd.appendChild(infoDiv);hd.appendChild(togBtn);
    wrap.appendChild(hd);

    // transpose panel
    const kg=document.createElement('div');kg.className='sw-kg';
    const capoEl=document.createElement('div');
    capoEl.className='sw-capo plain';
    capoEl.innerHTML=`<div style="font-size:15px;flex-shrink:0">🎸</div>
      <div style="flex:1"><div class="sw-capo-t"></div><div class="sw-capo-s"></div></div>
      <div class="sw-capo-n"></div>`;
    const lbDiv=document.createElement('div');lbDiv.className='sw-lb';

    const ksDiv=document.createElement('div');ksDiv.className='sw-ks';
    const slabel=document.createElement('div');slabel.className='sw-slabel';slabel.textContent='目标调';
    ksDiv.appendChild(slabel);ksDiv.appendChild(kg);

    const panelInner=document.createElement('div');panelInner.className='sw-panel-inner';
    panelInner.appendChild(ksDiv);panelInner.appendChild(capoEl);panelInner.appendChild(lbDiv);

    const panel=document.createElement('div');panel.className='sw-panel';
    panel.appendChild(panelInner);
    wrap.appendChild(panel);
    body.appendChild(wrap);

    togBtn.addEventListener('click',()=>{
      panel.classList.toggle('open');
      togBtn.classList.toggle('on',panel.classList.contains('open'));
    });

    KEYS.forEach(k=>{
      const b=document.createElement('button');
      b.className='sw-kb'+(k===curKey?' on':'');b.textContent=k;
      b.addEventListener('click',()=>{
        curKey=k;
        kg.querySelectorAll('.sw-kb').forEach(x=>x.classList.remove('on'));
        b.classList.add('on');renderScore();
      });
      kg.appendChild(b);
    });

    /* 3. Tools row — YT + LRC */
    const tools=document.createElement('div');tools.className='sw-tools';
    const toolsRow=document.createElement('div');toolsRow.className='sw-tools-row';
    if(s.youtube){
      const yt=document.createElement('a');yt.className='yt-btn';yt.href=s.youtube;yt.target='_blank';yt.title='YouTube';
      yt.innerHTML='<svg viewBox="0 0 24 24"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/></svg>';
      toolsRow.appendChild(yt);
    }
    if(s.lrc){
      const lrc=document.createElement('a');lrc.className='sw-pill';
      lrc.href=s.lrc;lrc.target='_blank';
      lrc.style.cssText='font-size:12px;padding:5px 12px;text-decoration:none;cursor:pointer;display:inline-flex;align-items:center;gap:4px;';
      lrc.textContent='📝 LRC';toolsRow.appendChild(lrc);
    }
    if(toolsRow.children.length){tools.appendChild(toolsRow);body.appendChild(tools);}

    /* 4. Score image */
    let scoreKeyBadge=null;
    if(s.scoreImg){
      const scoreDiv=document.createElement('div');scoreDiv.className='sw-score';
      const scoreTop=document.createElement('div');scoreTop.className='sw-score-top';
      scoreKeyBadge=document.createElement('span');scoreKeyBadge.className='sw-score-key';scoreKeyBadge.textContent='1 = '+curKey;
      const lbl=document.createElement('span');lbl.className='sw-score-lbl';lbl.textContent='简谱原稿';
      scoreTop.appendChild(lbl);scoreTop.appendChild(scoreKeyBadge);
      const img=document.createElement('img');img.src=s.scoreImg;img.loading='lazy';img.alt='简谱';
      img.addEventListener('click',()=>openLightbox(s.scoreImg));
      scoreDiv.appendChild(scoreTop);scoreDiv.appendChild(img);
      body.appendChild(scoreDiv);
    }

    /* renderScore — chord transposition + jianpu rebuild */
    function renderScore(){
      const info=calcCapo(curKey,s.origKey||'C'),st=info.st;
      kPill.textContent='1 = '+curKey;
      if(scoreKeyBadge)scoreKeyBadge.textContent='1 = '+curKey;
      // capo display
      if(curKey===(s.origKey||'C')){
        capoEl.className='sw-capo plain';
        capoEl.querySelector('.sw-capo-t').textContent='原调演奏';
        capoEl.querySelector('.sw-capo-s').textContent='不需要变调夹';
        capoEl.querySelector('.sw-capo-n').textContent='—';
      }else if(info.capo===0){
        capoEl.className='sw-capo plain';
        capoEl.querySelector('.sw-capo-t').textContent='不需要变调夹';
        capoEl.querySelector('.sw-capo-s').textContent='按 '+info.playKey+' 调指法演奏';
        capoEl.querySelector('.sw-capo-n').textContent='开放';
      }else{
        capoEl.className='sw-capo';
        capoEl.querySelector('.sw-capo-t').textContent='变调夹夹第 '+info.capo+' 格';
        capoEl.querySelector('.sw-capo-s').textContent='按 '+info.playKey+' 调指法 → 实际 '+curKey;
        capoEl.querySelector('.sw-capo-n').textContent=info.capo;
      }
      // rebuild jianpu + chords
      lbDiv.innerHTML='';
      for(const sec of s.sections||[]){
        const se=_div('sw-lsec');
        const sn=_div('sw-lsec-name');sn.textContent=sec.name||'';se.appendChild(sn);
        for(const line of sec.lines||[]){
          const le=_div('sw-lline');const row=_div('sw-lrow');
          const segs=Array.isArray(line)?line:(line.line||[]);
          for(const seg of segs){
            const segEl=_div('sw-seg');
            const chord=document.createElement('span');
            chord.className='sw-chord'+(seg.chord?'':' empty');
            if(seg.chord)chord.textContent=trChord(seg.chord,st);
            segEl.appendChild(chord);
            if(seg.n&&seg.n.trim())segEl.appendChild(renderNStr(seg.n));
            const lyric=document.createElement('span');lyric.className='sw-lyric';lyric.textContent=seg.lyric||'';
            segEl.appendChild(lyric);row.appendChild(segEl);
          }
          le.appendChild(row);se.appendChild(le);
        }
        lbDiv.appendChild(se);
      }
    }
    renderScore();

    /* Init APlayer */
    if(s.mp3){
      loadAPlayer(()=>{
        const mount=document.getElementById('ml-aplayer');if(!mount)return;
        const mp3=s.mp3.startsWith('http')?s.mp3:'https://cecp.it'+s.mp3;
        _ap=new window.APlayer({
          container:mount,
          audio:[{name:s.title||'',artist:s.artist||'',url:mp3,cover:s.cover||'',lrc:s.lrc||undefined}],
          autoplay:false,theme:'#0a84ff',lrcType:s.lrc?3:0,
        });
      });
    }

    $('ml-detail').classList.add('open');
    $('ml-detail').scrollTop=0;
  }

  loadSongs();
})();
