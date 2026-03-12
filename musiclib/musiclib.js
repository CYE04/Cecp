/* ✦ Designed & Built by YuEn © 2025–2026 ✦ */
/* CECP Music Library v3.2 */
(function(){
  const GITHUB_API='https://api.github.com/repos/CYE04/Cecp/contents/songs';
  const RAW_BASE='https://raw.githubusercontent.com/CYE04/Cecp/main/songs/';
  const WECHAT='CYuen_290104';

  if(!document.getElementById('ml-style')){
    const s=document.createElement('link');s.id='ml-style';s.rel='stylesheet';
    try{
      const cur=document.currentScript && document.currentScript.src ? new URL(document.currentScript.src, location.href) : null;
      s.href=cur ? new URL('musiclib.css', cur.href).href : 'musiclib.css';
      s.onerror=()=>{ if(!/cye04\.github\.io\/Cecp\/musiclib\.css$/.test(s.href)) s.href='https://cye04.github.io/Cecp/musiclib.css'; };
    }catch(_){
      s.href='musiclib.css';
      s.onerror=()=>{ s.href='https://cye04.github.io/Cecp/musiclib.css'; };
    }
    document.head.appendChild(s);
  }

  const root=document.getElementById('music-library');
  if(!root)return;

  let songs=[],query='';
  let _apLoaded=false,_ap=null;
  let _audioCtx=null,_metroTimer=null,_metroNext=0,_metroRunning=false,_metroBpm=72;
  let _themeObserver=null;
  let _detailStatePushed=false;

  root.innerHTML=`
    <div id="ml-minibar">
      <div id="ml-mb-cover"></div>
      <div id="ml-mb-info">
        <div id="ml-mb-title">未播放</div>
        <div id="ml-mb-artist"></div>
        <div id="ml-mb-lyric"></div>
      </div>
      <div id="ml-mb-controls">
        <button id="ml-mb-prev">⏮</button>
        <button id="ml-mb-playpause">▶</button>
        <button id="ml-mb-next">⏭</button>
      </div>
      <div id="ml-mb-right">
        <div id="ml-mb-progress-bar"><div id="ml-mb-progress-fill"></div></div>
        <div id="ml-mb-times"><span id="ml-mb-cur">0:00</span><span id="ml-mb-dur">0:00</span></div>
        <input id="ml-mb-vol" type="range" min="0" max="1" step="0.02" value="1">
      </div>
    </div>
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
      <div id="ml-detail-overlay"></div>
      <div id="ml-detail-swipe-hint"></div>
      <div id="ml-detail-header">
        <button id="ml-back">‹ 返回</button>
        <div id="ml-detail-title"></div>
      </div>
      <div id="ml-miniplayer">
        <audio id="ml-mp-audio"></audio>
        <div id="ml-mp-stage">
          <div id="ml-mp-cover-wrap">
            <div id="ml-mp-cover"><span>♪</span></div>
          </div>
          <div id="ml-mp-lrc-panel">
            <div id="ml-mp-lrc-inner"></div>
          </div>
        </div>
        <div id="ml-mp-bottom">
          <div id="ml-mp-info">
            <div id="ml-mp-title"></div>
            <div id="ml-mp-artist"></div>
          </div>
          <div id="ml-mp-controls">
            <button id="ml-mp-prev">⏮</button>
            <button id="ml-mp-playpause">▶</button>
            <button id="ml-mp-next">⏭</button>
          </div>
          <div id="ml-mp-right">
            <div id="ml-mp-progress-bar"><div id="ml-mp-progress-fill"></div></div>
            <div id="ml-mp-times"><span id="ml-mp-cur">0:00</span><span id="ml-mp-dur">0:00</span></div>
            <input id="ml-mp-vol" type="range" min="0" max="1" step="0.02" value="1">
          </div>
        </div>
      </div>
      <div id="ml-detail-body"></div>
    </div>
    <div id="ml-lightbox">
      <button id="ml-lightbox-close">✕</button>
      <img id="ml-lightbox-img" src="" alt="">
    </div>
  `;

  const $=id=>document.getElementById(id);
  const detail=$('ml-detail');

  (function buildNoticeUI(){
    const noticeHTML=`
      <div class="ml-notice-track">
        <div class="ml-notice-item"><span class="ml-notice-dot"></span><span>本页面所展示之诗歌内容，仅作为学习、练习与敬拜辅助之用；其歌词、曲谱、音频及相关版权均归原权利人所有。若你需要其他歌曲，欢迎联系 <span class="ml-notice-name">YuEn</span>。</span></div>
        <div class="ml-notice-item" aria-hidden="true"><span class="ml-notice-dot"></span><span>本页面所展示之诗歌内容，仅作为学习、练习与敬拜辅助之用；其歌词、曲谱、音频及相关版权均归原权利人所有。若你需要其他歌曲，欢迎联系 <span class="ml-notice-name">YuEn</span>。</span></div>
      </div>`;

    const listNotice=document.createElement('button');
    listNotice.id='ml-notice';
    listNotice.type='button';
    listNotice.setAttribute('aria-label','版权与申请新歌说明');
    listNotice.innerHTML=noticeHTML;
    root.insertBefore(listNotice, $('ml-header'));

    const detailNotice=document.createElement('button');
    detailNotice.id='ml-detail-notice';
    detailNotice.type='button';
    detailNotice.setAttribute('aria-label','版权与申请新歌说明');
    detailNotice.innerHTML=noticeHTML;
    detail.insertBefore(detailNotice, $('ml-detail-body'));

    const modal=document.createElement('div');
    modal.id='ml-notice-modal';
    modal.innerHTML=`
      <div id="ml-notice-dialog" role="dialog" aria-modal="true" aria-labelledby="ml-notice-modal-title">
        <button id="ml-notice-close" type="button" aria-label="关闭">✕</button>
        <div id="ml-notice-kicker">COPYRIGHT NOTICE</div>
        <h2 id="ml-notice-modal-title">诗歌版权与申请新歌</h2>
        <div id="ml-notice-copy">本站所展示之诗歌、歌词、曲谱、音频及相关资料，其著作权及相关权利均归原权利人所有。本站内容仅用于教会内部诗歌练习、学习与敬拜辅助，不以营利为目的。若相关权利人认为本站任何内容涉及侵权，请与我们联系，我们将在核实后及时处理、修改或下架相关内容。</div>
        <div id="ml-notice-sub">需要申请新歌练习可联系 <strong>YuEn</strong>。制作一首歌通常需要约 <strong>1–2 小时</strong>，请尽量提前说明。</div>
        <div id="ml-notice-actions">
          <button class="ml-notice-action is-copy" id="ml-copy-wechat" type="button">
            <span class="ml-notice-action-title">复制微信号</span>
            <span class="ml-notice-action-sub">点击后自动复制</span>
          </button>
          <button class="ml-notice-action" id="ml-open-ins" type="button">
            <span class="ml-notice-action-title">INS 加我</span>
            <span class="ml-notice-action-sub">打开 YuEn 的 Instagram</span>
          </button>
          <button class="ml-notice-action" id="ml-open-church-ins" type="button">
            <span class="ml-notice-action-title">教会青年 INS</span>
            <span class="ml-notice-action-sub">打开 CECP 青年账号</span>
          </button>
        </div>
      </div>`;
    root.appendChild(modal);

    const toast=document.createElement('div');
    toast.id='ml-toast';
    root.appendChild(toast);

    const mbLyric=$('ml-mb-lyric');
    if(mbLyric) mbLyric.textContent='';
  })();

  syncHaloTheme();
  observeThemeChanges();

  $('ml-search').addEventListener('input',e=>{query=e.target.value.trim();render();});
  $('ml-back').addEventListener('click',closeDetail);

  function showToast(text){
    const t=$('ml-toast');
    if(!t) return;
    t.textContent=text;
    t.classList.add('show');
    clearTimeout(showToast._timer);
    showToast._timer=setTimeout(()=>t.classList.remove('show'),1800);
  }

  async function copyText(text, msg){
    try{
      if(navigator.clipboard && navigator.clipboard.writeText){
        await navigator.clipboard.writeText(text);
      }else{
        const ta=document.createElement('textarea');
        ta.value=text;
        ta.setAttribute('readonly','');
        ta.style.cssText='position:fixed;left:-9999px;opacity:0;';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      showToast(msg||'已复制');
    }catch(_){
      showToast('复制失败，请手动复制');
    }
  }

  function openNoticeModal(){ $('ml-notice-modal')?.classList.add('open'); }
  function closeNoticeModal(){ $('ml-notice-modal')?.classList.remove('open'); }

  $('ml-contact').addEventListener('click',()=>copyText(WECHAT,'微信号已复制'));
  $('ml-notice')?.addEventListener('click',openNoticeModal);
  $('ml-detail-notice')?.addEventListener('click',openNoticeModal);
  $('ml-copy-wechat')?.addEventListener('click',()=>copyText(WECHAT,'微信号已复制'));
  $('ml-open-ins')?.addEventListener('click',()=>window.open('https://www.instagram.com/_yuen0129/','_blank','noopener'));
  $('ml-open-church-ins')?.addEventListener('click',()=>window.open('https://www.instagram.com/cecp.it_youth/','_blank','noopener'));
  $('ml-notice-close')?.addEventListener('click',closeNoticeModal);
  $('ml-notice-modal')?.addEventListener('click',e=>{ if(e.target===e.currentTarget) closeNoticeModal(); });

  $('ml-lightbox').addEventListener('click',e=>{
    if(e.target===e.currentTarget||e.target.id==='ml-lightbox-close') $('ml-lightbox').classList.remove('open');
  });
  $('ml-lightbox-img').addEventListener('click',e=>e.stopPropagation());

  function openLightbox(src){$('ml-lightbox-img').src=src;$('ml-lightbox').classList.add('open');}

  function closeDetail(fromPop){
    if(!fromPop && _detailStatePushed){
      history.back();
      return;
    }
    destroyAP();
    stopMetronome();
    detail.classList.remove('open');
    detail.style.transform='';
    detail.classList.remove('swiping');
    $('ml-detail-overlay').style.opacity='0';
    _detailStatePushed=false;
  }

  function tryColor(el, prop){
    if(!el)return '';
    const v=getComputedStyle(el).getPropertyValue(prop).trim();
    return v && v!=='transparent' && v!=='rgba(0, 0, 0, 0)' ? v : '';
  }

  function getThemeGuess(){
    const cs=getComputedStyle(document.body);
    const bg=cs.backgroundColor || 'rgb(255,255,255)';
    const m=bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if(!m)return 'light';
    const avg=(+m[1] + +m[2] + +m[3]) / 3;
    return avg < 120 ? 'dark' : 'light';
  }

  function syncHaloTheme(){
    const rb=root.style;
    const body=document.body, html=document.documentElement;
    const mode=getThemeGuess();

    const bg = tryColor(body,'--theme-bg') || tryColor(html,'--theme-bg') || tryColor(body,'background-color') || (mode==='dark'?'#0b0b0d':'#f5f5f7');
    const bg2 = tryColor(body,'--card-bg') || tryColor(html,'--card-bg') || tryColor(body,'--halo-card-bg') || (mode==='dark'?'#17171a':'#ffffff');
    const bg3 = tryColor(body,'--muted-bg') || tryColor(html,'--muted-bg') || (mode==='dark'?'#222227':'#ececf1');
    const text = tryColor(body,'--theme-text') || tryColor(html,'--theme-text') || tryColor(body,'color') || (mode==='dark'?'#f5f7fb':'#1d1d1f');
    const text2 = tryColor(body,'--theme-text-secondary') || tryColor(html,'--theme-text-secondary') || (mode==='dark'?'rgba(245,247,251,.68)':'#6e6e73');
    const text3 = tryColor(body,'--theme-text-tertiary') || tryColor(html,'--theme-text-tertiary') || (mode==='dark'?'rgba(245,247,251,.36)':'#aeaeb2');
    const accent = tryColor(body,'--theme-primary') || tryColor(html,'--theme-primary') || tryColor(body,'--halo-accent') || (mode==='dark'?'#7c9cff':'#007aff');
    const border = tryColor(body,'--theme-border') || tryColor(html,'--theme-border') || (mode==='dark'?'rgba(255,255,255,.08)':'rgba(0,0,0,.08)');
    const borderMd = tryColor(body,'--theme-border-strong') || tryColor(html,'--theme-border-strong') || (mode==='dark'?'rgba(255,255,255,.13)':'rgba(0,0,0,.13)');

    rb.setProperty('--halo-bg', bg);
    rb.setProperty('--halo-bg2', bg2);
    rb.setProperty('--halo-bg3', bg3);
    rb.setProperty('--halo-text', text);
    rb.setProperty('--halo-text2', text2);
    rb.setProperty('--halo-text3', text3);
    rb.setProperty('--halo-accent', accent);
    rb.setProperty('--halo-border', border);
    rb.setProperty('--halo-border-md', borderMd);
    rb.setProperty('--halo-accent-light', colorMix(accent, 0.16));
  }

  function colorMix(color, alpha){
    if(color.startsWith('rgb')){
      const m=color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
      if(m)return `rgba(${m[1]},${m[2]},${m[3]},${alpha})`;
    }
    if(color.startsWith('#')){
      const hex=color.slice(1);
      const full=hex.length===3?hex.split('').map(x=>x+x).join(''):hex;
      const r=parseInt(full.slice(0,2),16),g=parseInt(full.slice(2,4),16),b=parseInt(full.slice(4,6),16);
      return `rgba(${r},${g},${b},${alpha})`;
    }
    return `rgba(0,122,255,${alpha})`;
  }

  function observeThemeChanges(){
    if(_themeObserver)_themeObserver.disconnect();
    _themeObserver=new MutationObserver(()=>syncHaloTheme());
    _themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class','style','data-theme']});
    _themeObserver.observe(document.body,{attributes:true,attributeFilter:['class','style','data-theme']});
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',syncHaloTheme);
  }

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
      // update playlist for mini player
      _mpSongs = songs.filter(s=>s.mp3);
      list.querySelectorAll('.ml-song-card').forEach(el=>{
        el.addEventListener('click',()=>{const s=songs.find(x=>x.id===el.dataset.id);if(s)openDetail(s);});
        // play button on hover
        const playBtn=document.createElement('button');
        playBtn.className='ml-mp-play-btn';
        playBtn.innerHTML='▶';
        playBtn.title='播放';
        playBtn.onclick=e=>{
          e.stopPropagation();
          const s=songs.find(x=>x.id===el.dataset.id);
          if(!s||!s.mp3) return;
          const idx=_mpSongs.findIndex(x=>x.id===s.id);
          if(idx>=0) _mpPlayIdx(idx);
        };
        el.appendChild(playBtn);
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
    if(num.slice(-2)==='__'){uline=2;num=num.slice(0,-2);} else if(num.slice(-1)==='_'){uline=1;num=num.slice(0,-1);}
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

  /* ── Mini Player ── */
  const _mpAudio = document.getElementById('ml-mp-audio');
  let _mpSongs = [], _mpIdx = -1, _mpLrc = [], _mpLrcIdx = -1;

  function _mpFmt(s){
    const m=Math.floor(s/60),ss=Math.floor(s%60);
    return m+':'+(ss<10?'0':'')+ss;
  }
  function _mpParseLrc(text){
    const lines=[];
    text.split('\n').forEach(l=>{
      const m=l.match(/^\[(\d+):(\d+\.\d+)\](.*)/);
      if(m) lines.push({time:parseInt(m[1])*60+parseFloat(m[2]),text:m[3].trim()});
    });
    return lines.sort((a,b)=>a.time-b.time);
  }
  function _mbUpdateLyric(forceIdx){
    const el=$('ml-mb-lyric');
    if(!el) return;
    if(!_mpLrc.length){
      el.textContent='';
      el.classList.remove('show');
      return;
    }
    let idx=typeof forceIdx==='number' ? forceIdx : _mpLrcIdx;
    if(idx < 0){
      idx=_mpLrc.findIndex(l=>(l.text||'').trim());
    }
    const text=(idx>=0 && _mpLrc[idx] ? (_mpLrc[idx].text||'').trim() : '');
    if(!text){
      el.textContent='';
      el.classList.remove('show');
      return;
    }
    el.textContent=text;
    el.classList.add('show');
  }

  function _mpHighlightLrc(){
    if(!_mpLrc.length){ _mbUpdateLyric(-1); return; }
    const t=_mpAudio.currentTime;
    let idx=-1;
    _mpLrc.forEach((l,i)=>{ if(l.time<=t) idx=i; });
    if(idx===_mpLrcIdx){ _mbUpdateLyric(idx); return; }
    _mpLrcIdx=idx;
    document.querySelectorAll('.ml-mp-lrc-line').forEach((r,i)=>r.classList.toggle('active',i===idx));
    _mbUpdateLyric(idx);
    if(idx>=0){
      const el=document.querySelectorAll('.ml-mp-lrc-line')[idx];
      if(el) el.scrollIntoView({block:'center',behavior:'smooth'});
    }
  }
  function _mpSetState(playing){
    // playing=true: cover slides left, lyrics appear
    // playing=false (initial/paused first time): cover center
    // once played, always stay in played layout
    const stage=document.getElementById('ml-mp-stage');
    if(!stage) return;
    if(playing) stage.classList.add('playing');
    // never remove 'playing' class after first play
  }
  function _mpSetCover(src){
    const c=document.getElementById('ml-mp-cover');
    if(!c) return;
    if(src){ const img=new Image(); img.src=src; img.alt=''; c.innerHTML=''; c.appendChild(img); }
    else { c.innerHTML='<span>♪</span>'; }
  }
  function _mpRenderLrc(){
    const inner=document.getElementById('ml-mp-lrc-inner');
    if(!inner) return;
    inner.innerHTML='';
    _mpLrc.forEach(l=>{
      const d=document.createElement('div');
      d.className='ml-mp-lrc-line';
      d.textContent=l.text;
      d.onclick=()=>{ _mpAudio.currentTime=l.time; };
      inner.appendChild(d);
    });
  }
  function _mpLoadSong(song){
    _mpLrc=[]; _mpLrcIdx=-1;
    const titleEl=document.getElementById('ml-mp-title');
    const artistEl=document.getElementById('ml-mp-artist');
    if(titleEl) titleEl.textContent=song.title||'';
    if(artistEl) artistEl.textContent=song.artist||'';
    _mpSetCover(song.cover||null);
    // reset stage: cover back to center for new song
    const stage=document.getElementById('ml-mp-stage');
    if(stage) stage.classList.remove('playing');
    const inner=document.getElementById('ml-mp-lrc-inner');
    if(inner) inner.innerHTML='';
    // show/hide detail player based on mp3
    const detailPlayer=document.getElementById('ml-miniplayer');
    if(detailPlayer) detailPlayer.classList.toggle('has-mp3', !!song.mp3);
    _mpAudio.src=song.mp3||'';
    if(song.lrc){
      fetch(song.lrc).then(r=>r.text()).then(text=>{
        _mpLrc=_mpParseLrc(text);
        _mpRenderLrc();
        _mbUpdateLyric(-1);
      }).catch(()=>{ _mbUpdateLyric(-1); });
    } else {
      _mbUpdateLyric(-1);
    }
    // no auto-play — user must press play
  }
  function _mpPlayIdx(idx){
    if(idx<0||idx>=_mpSongs.length) return;
    _mpIdx=idx; _mpLoadSong(_mpSongs[idx]);
  }
  function _mpUpdateProgress(){
    const dur=_mpAudio.duration||0, cur=_mpAudio.currentTime||0;
    const c=document.getElementById('ml-mp-cur'),d=document.getElementById('ml-mp-dur');
    if(c) c.textContent=_mpFmt(cur);
    if(d) d.textContent=_mpFmt(dur);
    const fill=document.getElementById('ml-mp-progress-fill');
    if(fill) fill.style.width=(dur?cur/dur*100:0)+'%';
    _mpHighlightLrc();
  }
  function _mpUpdateBtn(){
    const btn=document.getElementById('ml-mp-playpause');
    if(btn) btn.textContent=_mpAudio.paused?'▶':'⏸';
  }
  _mpAudio.addEventListener('timeupdate',_mpUpdateProgress);
  _mpAudio.addEventListener('play',()=>{ _mpSetState(true); _mpUpdateBtn(); });
  _mpAudio.addEventListener('pause',_mpUpdateBtn);
  _mpAudio.addEventListener('ended',()=>{ if(_mpIdx<_mpSongs.length-1)_mpPlayIdx(_mpIdx+1); else _mpUpdateBtn(); });
  document.getElementById('ml-mp-playpause').onclick=()=>{ _mpAudio.paused?_mpAudio.play():_mpAudio.pause(); };
  document.getElementById('ml-mp-prev').onclick=()=>{ if(_mpIdx>0)_mpPlayIdx(_mpIdx-1); };
  document.getElementById('ml-mp-next').onclick=()=>{ if(_mpIdx<_mpSongs.length-1)_mpPlayIdx(_mpIdx+1); };
  document.getElementById('ml-mp-vol').oninput=e=>{ _mpAudio.volume=parseFloat(e.target.value); };
  document.getElementById('ml-mp-progress-bar').onclick=e=>{
    if(!_mpAudio.duration) return;
    const r=e.currentTarget.getBoundingClientRect();
    _mpAudio.currentTime=((e.clientX-r.left)/r.width)*_mpAudio.duration;
  };

  function destroyAP(){ _mpAudio.pause(); }

  /* ── Compact Minibar (list page) ── */
  let _mbCoverSrc = '';
  function _mbUpdate(){
    const bar = document.getElementById('ml-minibar');
    if(!bar) return;
    const title = document.getElementById('ml-mb-title');
    const artist = document.getElementById('ml-mb-artist');
    const cover = document.getElementById('ml-mb-cover');
    const btn = document.getElementById('ml-mb-playpause');
    const fill = document.getElementById('ml-mb-progress-fill');
    const cur = document.getElementById('ml-mb-cur');
    const dur = document.getElementById('ml-mb-dur');
    const song = _mpSongs[_mpIdx];
    if(song){
      if(title) title.textContent = song.title||'';
      if(artist) artist.textContent = song.artist||'';
      if(cover && song.cover !== _mbCoverSrc){
        _mbCoverSrc = song.cover||'';
        if(song.cover){
          cover.innerHTML='';
          const img=document.createElement('img');
          img.src=song.cover; img.alt='';
          cover.appendChild(img);
        } else {
          cover.innerHTML='♪';
        }
      }
      bar.classList.add('active');
    }
    if(btn) btn.textContent = _mpAudio.paused ? '▶' : '⏸';
    _mbUpdateLyric();
    const d = _mpAudio.duration||0, t = _mpAudio.currentTime||0;
    if(fill) fill.style.width = (d ? t/d*100 : 0)+'%';
    if(cur) cur.textContent = _mpFmt(t);
    if(dur) dur.textContent = _mpFmt(d);
  }
  _mpAudio.addEventListener('play', _mbUpdate);
  _mpAudio.addEventListener('pause', _mbUpdate);
  _mpAudio.addEventListener('timeupdate', _mbUpdate);
  document.getElementById('ml-mb-playpause').onclick = ()=>{ _mpAudio.paused?_mpAudio.play():_mpAudio.pause(); };
  document.getElementById('ml-mb-prev').onclick = ()=>{ if(_mpIdx>0) _mpPlayIdx(_mpIdx-1); };
  document.getElementById('ml-mb-next').onclick = ()=>{ if(_mpIdx<_mpSongs.length-1) _mpPlayIdx(_mpIdx+1); };
  document.getElementById('ml-mb-vol').oninput = e=>{ _mpAudio.volume=parseFloat(e.target.value); };
  document.getElementById('ml-mb-progress-bar').onclick = e=>{
    if(!_mpAudio.duration) return;
    const r=e.currentTarget.getBoundingClientRect();
    _mpAudio.currentTime=((e.clientX-r.left)/r.width)*_mpAudio.duration;
  };

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

  function ensureAudioCtx(){
    if(_audioCtx)return _audioCtx;
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return null;
    _audioCtx=new AC();
    return _audioCtx;
  }

  function clickAt(time, accent=false){
    const ctx=ensureAudioCtx();
    if(!ctx)return;
    const osc=ctx.createOscillator();
    const gain=ctx.createGain();
    osc.type='triangle';
    osc.frequency.setValueAtTime(accent?1480:1080,time);
    gain.gain.setValueAtTime(0.0001,time);
    gain.gain.exponentialRampToValueAtTime(accent?0.18:0.11,time+0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001,time+0.06);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(time); osc.stop(time+0.07);
  }

  function scheduler(){
    const ctx=ensureAudioCtx();
    if(!_metroRunning||!ctx)return;
    while(_metroNext < ctx.currentTime + 0.12){
      clickAt(_metroNext, true);
      _metroNext += 60 / _metroBpm;
    }
  }

  function startMetronome(){
    const ctx=ensureAudioCtx();
    if(!ctx)return;
    ctx.resume?.();
    _metroRunning=true;
    _metroNext=ctx.currentTime + 0.04;
    scheduler();
    clearInterval(_metroTimer);
    _metroTimer=setInterval(scheduler, 25);
    syncMetUI();
  }

  function stopMetronome(){
    _metroRunning=false;
    if(_metroTimer){clearInterval(_metroTimer);_metroTimer=null;}
    syncMetUI();
  }

  function syncMetUI(){
    const btn=document.getElementById('ml-met-toggle');
    const bpm=document.getElementById('ml-met-bpm');
    const range=document.getElementById('ml-met-range');
    if(btn){btn.textContent=_metroRunning?'停止':'开始';btn.classList.toggle('off',!_metroRunning);}
    if(bpm)bpm.innerHTML=`${_metroBpm}<small>BPM</small>`;
    if(range && +range.value!==_metroBpm)range.value=_metroBpm;
  }

  function createMetronome(initialBpm){
    _metroBpm=Math.max(40, Math.min(240, initialBpm||72));
    const box=document.createElement('div');box.className='ml-met';
    box.innerHTML=`
      <div class="ml-met-top">
        <div>
          <div class="ml-met-title">节拍器</div>
          <div class="ml-met-sub">跟随这首歌的 BPM，也可以手动调整</div>
        </div>
        <button id="ml-met-toggle" class="ml-met-toggle off" type="button">开始</button>
      </div>
      <div class="ml-met-body">
        <div id="ml-met-bpm" class="ml-met-bpm"></div>
        <button id="ml-met-minus" class="ml-met-btn" type="button">−</button>
        <button id="ml-met-plus" class="ml-met-btn" type="button">+</button>
        <button id="ml-met-reset" class="ml-met-btn" type="button" title="恢复歌曲 BPM">↺</button>
        <input id="ml-met-range" class="ml-met-range" type="range" min="40" max="240" step="1" value="${_metroBpm}">
        <div class="ml-met-hint">点开始即可打拍。滑杆可细调，± 可快速调节。</div>
      </div>`;
    queueMicrotask(()=>{
      const toggle=$('ml-met-toggle'), minus=$('ml-met-minus'), plus=$('ml-met-plus'), reset=$('ml-met-reset'), range=$('ml-met-range');
      toggle?.addEventListener('click',()=>_metroRunning?stopMetronome():startMetronome());
      minus?.addEventListener('click',()=>{_metroBpm=Math.max(40,_metroBpm-1);syncMetUI();});
      plus?.addEventListener('click',()=>{_metroBpm=Math.min(240,_metroBpm+1);syncMetUI();});
      reset?.addEventListener('click',()=>{_metroBpm=Math.max(40, Math.min(240, initialBpm||72));syncMetUI();});
      range?.addEventListener('input',e=>{_metroBpm=+e.target.value;syncMetUI();});
      syncMetUI();
    });
    return box;
  }

  window.addEventListener('popstate',()=>{
    if(detail.classList.contains('open')) closeDetail(true);
  });

  function attachSwipeBack(){
    let startX=0,startY=0,dragging=false,active=false;
    const overlay=$('ml-detail-overlay');
    const maxShift=Math.min(window.innerWidth*0.32, 120);

    function begin(x,y){
      if(detail.scrollTop>6 || !detail.classList.contains('open')) return;
      startX=x; startY=y; dragging=true; active=false; detail.classList.add('swiping');
    }
    function move(x,y){
      if(!dragging) return;
      const dx=x-startX, dy=y-startY;
      if(!active){
        if(Math.abs(dx)<10 && Math.abs(dy)<10) return;
        if(dx>10 && Math.abs(dx)>Math.abs(dy) && startX<42) active=true;
        else if(Math.abs(dy)>Math.abs(dx)){ cancel(); return; }
      }
      if(!active) return;
      const shift=Math.max(0, Math.min(dx, maxShift));
      detail.style.transform=`translateX(${shift}px)`;
      overlay.style.opacity=String(Math.min(shift / maxShift, .95));
    }
    function end(x){
      if(!dragging) return;
      const dx=x-startX;
      const shouldClose=active && dx>Math.max(70, window.innerWidth*0.18);
      detail.classList.remove('swiping');
      detail.style.transition='transform .2s ease';
      detail.style.transform=shouldClose?`translateX(${window.innerWidth}px)`:'';
      overlay.style.opacity=shouldClose?'1':'0';
      setTimeout(()=>{detail.style.transition=''; if(shouldClose) closeDetail(); else detail.style.transform='';}, shouldClose?160:200);
      dragging=false; active=false;
    }
    function cancel(){dragging=false;active=false;detail.classList.remove('swiping');detail.style.transform='';overlay.style.opacity='0';}

    detail.addEventListener('touchstart',e=>{if(e.touches[0])begin(e.touches[0].clientX,e.touches[0].clientY);},{passive:true});
    detail.addEventListener('touchmove',e=>{if(e.touches[0])move(e.touches[0].clientX,e.touches[0].clientY);},{passive:true});
    detail.addEventListener('touchend',e=>{const t=e.changedTouches&&e.changedTouches[0];end(t?t.clientX:startX);},{passive:true});

    detail.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse' && e.clientX>24)return; begin(e.clientX,e.clientY);});
    detail.addEventListener('pointermove',e=>move(e.clientX,e.clientY));
    detail.addEventListener('pointerup',e=>end(e.clientX));
    detail.addEventListener('pointercancel',cancel);
  }

  function openDetail(s){
    destroyAP();
    stopMetronome();
    syncHaloTheme();
    // load song into mini player if it has mp3
    if(s.mp3){
      const idx=_mpSongs.findIndex(x=>x.id===s.id);
      const isSameSong = (idx>=0 && idx===_mpIdx);
      if(!isSameSong){
        // different song: load fresh
        if(idx>=0) _mpIdx=idx; else { _mpSongs=[s]; _mpIdx=0; }
        _mpLrc=[]; _mpLrcIdx=-1;
        _mpAudio.src=s.mp3||'';
        if(s.lrc) fetch(s.lrc).then(r=>r.text()).then(text=>{_mpLrc=_mpParseLrc(text);_mpRenderLrc();}).catch(()=>{});
      }
      // always update UI text & cover
      const titleEl=document.getElementById('ml-mp-title');
      const artistEl=document.getElementById('ml-mp-artist');
      if(titleEl) titleEl.textContent=s.title||'';
      if(artistEl) artistEl.textContent=s.artist||'';
      _mpSetCover(s.cover||null);
      // stage: show playing layout only if audio is actually playing
      const stage=document.getElementById('ml-mp-stage');
      if(stage) stage.classList.toggle('playing', !_mpAudio.paused);
      // restore lrc inner if same song
      if(isSameSong && _mpLrc.length && !document.getElementById('ml-mp-lrc-inner')?.children.length){
        _mpRenderLrc();
      }
      const detailPlayer=document.getElementById('ml-miniplayer');
      if(detailPlayer) detailPlayer.classList.add('has-mp3');
    } else {
      const detailPlayer=document.getElementById('ml-miniplayer');
      if(detailPlayer) detailPlayer.classList.remove('has-mp3');
    }
    if(!detail.classList.contains('open') && !(_detailStatePushed && history.state && history.state.__mlDetail)){
      try{
        history.pushState(Object.assign({}, history.state||{}, {__mlDetail:true}), '');
        _detailStatePushed=true;
      }catch(err){}
    }
    $('ml-detail-title').textContent=s.title||'';
    const body=$('ml-detail-body');
    body.innerHTML='';



    const KEYS=['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
    let curKey=s.origKey||'C';

    const wrap=document.createElement('div');wrap.className='sw-wrap';
    const kPill=document.createElement('span');kPill.className='sw-pill sw-kpill';kPill.textContent='1 = '+curKey;

    const coverThumb=document.createElement(s.cover?'img':'div');
    coverThumb.className='sw-cover-thumb';
    if(s.cover){coverThumb.src=s.cover;coverThumb.alt=s.title||'';}
    else{coverThumb.textContent='♪';}

    const infoDiv=document.createElement('div');infoDiv.className='sw-info';
    infoDiv.innerHTML=`<div class="sw-eyebrow">Worship Song</div>
      <div class="sw-title">${s.title||''}</div>
      <div class="sw-sub">${s.sub||''}</div>`;
    const pillsDiv=document.createElement('div');pillsDiv.className='sw-pills';
    pillsDiv.appendChild(kPill);
    if(s.timeSign){const p=document.createElement('span');p.className='sw-pill';p.textContent=s.timeSign;pillsDiv.appendChild(p);}
    if(s.bpm){const p=document.createElement('span');p.className='sw-pill';p.textContent='♩ = '+s.bpm;pillsDiv.appendChild(p);}
    infoDiv.appendChild(pillsDiv);

    const titleRow=document.createElement('div');titleRow.className='sw-title-row';
    titleRow.appendChild(coverThumb);titleRow.appendChild(infoDiv);

    const togBtn=document.createElement('button');togBtn.className='sw-tog';
    togBtn.innerHTML='<svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg> 移调';
    const hd=document.createElement('div');hd.className='sw-hd';
    hd.appendChild(titleRow);hd.appendChild(togBtn);wrap.appendChild(hd);

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
    const panel=document.createElement('div');panel.className='sw-panel';panel.appendChild(panelInner);wrap.appendChild(panel);
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

    body.appendChild(createMetronome(s.bpm || 72));

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

    function renderScore(){
      const info=calcCapo(curKey,s.origKey||'C'),st=info.st;
      kPill.textContent='1 = '+curKey;
      if(scoreKeyBadge)scoreKeyBadge.textContent='1 = '+curKey;
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
      lbDiv.innerHTML='';
      for(const sec of s.sections||[]){
        const se=_div('sw-lsec');
        const sn=_div('sw-lsec-name');sn.textContent=sec.name||'';se.appendChild(sn);
        for(const line of sec.lines||[]){
          const le=_div('sw-lline');const row=_div('sw-lrow'+((!Array.isArray(line)&&line.b)?' bold':''));
          const segs=Array.isArray(line)?line:(line.line||[]);
          for(const seg of segs){
            const segEl=_div('sw-seg');
            const chord=document.createElement('span');
            chord.className='sw-chord'+(seg.chord?'':' empty');
            if(seg.chord)chord.textContent=trChord(seg.chord,st);
            segEl.appendChild(chord);
            if(seg.n&&seg.n.trim())segEl.appendChild(renderNStr(seg.n));
            const lyric=document.createElement('span');lyric.className='sw-lyric';lyric.textContent=seg.lyric||'';
            segEl.appendChild(lyric);
            if(seg.lyric2){const ly2=document.createElement('span');ly2.className='sw-lyric sw-lyric2';ly2.textContent=seg.lyric2;segEl.appendChild(ly2);}
            row.appendChild(segEl);
          }
          le.appendChild(row);se.appendChild(le);
        }
        lbDiv.appendChild(se);
      }
    }
    function fitRows(){
      requestAnimationFrame(function(){
        // 重置
        lbDiv.style.transform='';lbDiv.style.transformOrigin='';
        lbDiv.style.width='';lbDiv.style.marginBottom='';
        var avail=lbDiv.parentElement.clientWidth;
        if(!avail)return;
        // 找最宽的行
        var maxW=0;
        lbDiv.querySelectorAll('.sw-lrow').forEach(function(row){
          row.style.display='inline-flex';
          if(row.scrollWidth>maxW)maxW=row.scrollWidth;
          row.style.display='';
        });
        if(maxW>avail){
          var scale=avail/maxW;
          // 整个 lbDiv 等比缩放，像图片一样
          lbDiv.style.transform='scale('+scale+')';
          lbDiv.style.transformOrigin='left top';
          lbDiv.style.width=maxW+'px';
          var naturalH=lbDiv.offsetHeight;
          lbDiv.style.marginBottom=(naturalH*(scale-1))+'px';
          lbDiv.parentElement.style.overflow='hidden';
        } else {
          lbDiv.parentElement.style.overflow='';
        }
      });
    }
    renderScore();
    fitRows();
    if(window._mlFitObs)window._mlFitObs.disconnect();
    window._mlFitObs=new ResizeObserver(fitRows);
    window._mlFitObs.observe(lbDiv);

    detail.classList.add('open');
    detail.scrollTop=0;
  }

  attachSwipeBack();
  loadSongs();
})();
