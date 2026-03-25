/* ✦ Designed & Built by YuEn © 2025–2026 ✦ */
/* CECP Music Library v3.3 */
(function(){
  const ML_VER='2026.03.25.1';
  const GITHUB_API='https://api.github.com/repos/CYE04/Cecp/contents/songs';
  const RAW_BASE='https://raw.githubusercontent.com/CYE04/Cecp/main/songs/';
  const WECHAT='CYuen_290104';
  const SOURCE_RULES=[
    {name:'赞美之泉',patterns:['赞美之泉','stream of praise']},
    {name:'约书亚乐团',patterns:['约书亚乐团','joshua band','约书亚']},
    {name:'火把音乐',patterns:['火把音乐','torch music','torch worship']},
    {name:'泥土音乐',patterns:['泥土音乐','soil music']},
    {name:'小羊诗歌',patterns:['小羊诗歌','lamb music']},
    {name:'生命河灵粮堂',patterns:['生命河','river of life']},
    {name:'希尔颂',patterns:['hillsong']},
    {name:'伯特利音乐',patterns:['bethel music','bethel']},
    {name:'高地敬拜',patterns:['elevation worship','elevation']},
    {name:'城市之光',patterns:['cityalight']},
    {name:'激励者乐团',patterns:['planetshakers']},
    {name:'其他',patterns:[]}
  ];

  if(!document.getElementById('ml-style')){
    const s=document.createElement('link');s.id='ml-style';s.rel='stylesheet';
    try{
      const cur=document.currentScript && document.currentScript.src ? new URL(document.currentScript.src, location.href) : null;
      const cssUrl=cur ? new URL('musiclib.css', cur.href) : new URL('musiclib.css', location.href);
      cssUrl.searchParams.set('v',ML_VER);
      s.href=cssUrl.href;
      s.onerror=()=>{ if(!/cye04\.github\.io\/Cecp\/musiclib\.css/.test(s.href)) s.href='https://cye04.github.io/Cecp/musiclib.css?v='+encodeURIComponent(ML_VER); };
    }catch(_){
      s.href='musiclib.css?v='+encodeURIComponent(ML_VER);
      s.onerror=()=>{ s.href='https://cye04.github.io/Cecp/musiclib.css?v='+encodeURIComponent(ML_VER); };
    }
    document.head.appendChild(s);
  }

  const root=document.getElementById('music-library');
  if(!root)return;
  root.setAttribute('data-ml-version',ML_VER);
  try{console.info('[musiclib] loaded version',ML_VER);}catch(_){}

  let songs=[],query='',sourceFilter='全部';
  let _apLoaded=false,_ap=null;
  let _audioCtx=null,_metroTimer=null,_metroNext=0,_metroRunning=false,_metroBpm=72;
  let _themeObserver=null;
  let _detailStatePushed=false;

  root.innerHTML=`
    <div id="ml-header">
      <div id="ml-nav">
        <div id="ml-brand">
          <span class="ml-brand-dot"></span>
          <span class="ml-brand-name">诗歌库</span>
        </div>
        <div id="ml-nav-actions">
          <button class="ml-nav-icon-btn" id="ml-nav-search" type="button" aria-label="聚焦搜索">⌕</button>
          <button class="ml-nav-icon-btn" id="ml-nav-theme" type="button" aria-label="切换深浅主题">◐</button>
        </div>
      </div>
      <div id="ml-hero">
        <h1 id="ml-title">诗歌库</h1>
        <div id="ml-subtitle">精选敬拜诗歌集合，含歌词、简谱、移调与音频练习。</div>
      </div>
      <div id="ml-search-row">
        <div id="ml-search-wrap">
          <span id="ml-search-icon">⌕</span>
          <input id="ml-search" type="text" placeholder="搜索歌名、歌手或歌词..." autocomplete="off" autocorrect="off"/>
        </div>
        <div id="ml-count-wrap">
          <span class="ml-count-label">总数</span>
          <strong id="ml-count"></strong>
        </div>
      </div>
      <div id="ml-source-bar"></div>
    </div>
    <div id="ml-loading"><div id="ml-spinner"></div>正在载入诗歌…</div>
    <div id="ml-list-stage">
      <div id="ml-list-head">
        <div class="ml-section-label">全部诗歌</div>
        <div id="ml-result-count">全部诗歌</div>
      </div>
      <div id="ml-list"></div>
    </div>
    <div id="ml-empty">
      <div id="ml-empty-icon">🎵</div>
      <div id="ml-empty-msg">找不到「<span id="ml-query-text"></span>」</div>
      <div id="ml-empty-sub">库里暂时还没有这首歌，你可以联系 YuEn 申请添加。</div>
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
      <div class="pl-song-row">
        <div class="pl-info">
          <div id="ml-mp-title" class="pl-title"></div>
          <div id="ml-mp-artist" class="pl-artist"></div>
        </div>
        <button class="pl-btn" id="ml-mp-expand" aria-label="展开播放器">⤢</button>
      </div>
      <div class="pl-progress-wrap">
        <div class="pl-progress-bar"><div class="pl-progress-fill" id="ml-mp-fill"></div></div>
        <div class="pl-times"><span id="ml-mp-cur">0:00</span><span id="ml-mp-dur">0:00</span></div>
      </div>
      <div class="pl-controls">
        <button class="pl-btn" id="ml-mp-seek-back" aria-label="后退15秒"><svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/><text x="12" y="15.5" text-anchor="middle" font-size="5.5" fill="currentColor" font-family="system-ui,sans-serif" font-weight="600">15</text></svg></button>
        <button class="pl-btn" id="ml-mp-prev" aria-label="上一首"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6a1 1 0 0 1 1 1v10a1 1 0 1 1-2 0V7a1 1 0 0 1 1-1zm3.2 5.65 7.1-4.8A.43.43 0 0 1 17 7.2v9.6a.43.43 0 0 1-.7.35L9.2 12.35a.43.43 0 0 1 0-.7z"/></svg></button>
        <button class="pl-btn pl-playpause" id="ml-mp-playpause" aria-label="播放"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v14l11-7-11-7z"/></svg></button>
        <button class="pl-btn" id="ml-mp-next" aria-label="下一首"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 6a1 1 0 0 0-1 1v10a1 1 0 1 0 2 0V7a1 1 0 0 0-1-1zm-3.2 5.65-7.1-4.8A.43.43 0 0 0 7 7.2v9.6a.43.43 0 0 0 .7.35l7.1-4.8a.43.43 0 0 0 0-.7z"/></svg></button>
        <button class="pl-btn" id="ml-mp-seek-fwd" aria-label="前进15秒"><svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/><text x="12" y="15.5" text-anchor="middle" font-size="5.5" fill="currentColor" font-family="system-ui,sans-serif" font-weight="600">15</text></svg></button>
        <button class="pl-btn pl-repeat" id="ml-mp-repeat" aria-label="循环"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg></button>
      </div>
      <div class="pl-vol-wrap">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
        <input class="pl-vol" id="ml-mp-vol" type="range" min="0" max="1" step="0.02" value="1">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM18.5 12c0-2.77-1.5-5.15-3.75-6.45v12.9C16.99 17.14 18.5 14.77 18.5 12z"/></svg>
      </div>
    </div>

      <div id="ml-detail-body"></div>
    </div>
    <div id="ml-player-view">
      <div id="ml-player-view-top">
        <button id="ml-player-view-close" type="button">⌄</button>
        <div id="ml-player-view-now">
          <div id="ml-player-now-title">正在播放</div>
          <div id="ml-player-now-sub"></div>
        </div>
        <button id="ml-player-view-menu" type="button" aria-label="播放设置">☰</button>
      </div>
      <div id="ml-player-view-grid">
        <aside id="ml-player-rail" aria-hidden="true">
          <button class="ml-player-rail-btn active" type="button">▮▮</button>
          <button class="ml-player-rail-btn" type="button">＋</button>
          <div class="ml-player-rail-dot"></div>
          <div class="ml-player-rail-dot"></div>
          <div class="ml-player-rail-dot"></div>
        </aside>
        <section id="ml-player-lyrics">
          <div id="ml-player-lyrics-inner"></div>
        </section>
        <aside id="ml-player-side">
          <div id="ml-player-side-tabs">
            <button class="ml-player-side-tab active" id="ml-player-tab-song" type="button">歌曲</button>
            <button class="ml-player-side-tab" id="ml-player-tab-queue" type="button">队列</button>
          </div>
          <div id="ml-player-side-song">
            <div id="ml-player-cover"><span>♪</span></div>
            <div id="ml-player-title"></div>
            <div id="ml-player-artist"></div>
            <div id="ml-player-actions">
              <button class="ml-player-icon-btn" type="button" aria-label="收藏">♡</button>
              <button class="ml-player-icon-btn" type="button" aria-label="分享">⤴</button>
            </div>
            <div id="ml-player-pills">
              <span id="ml-player-key" class="ml-player-pill"></span>
              <span id="ml-player-bpm" class="ml-player-pill"></span>
            </div>
          </div>
          <div id="ml-player-side-queue" hidden>
            <div id="ml-player-queue-empty">当前还没有可播放队列</div>
            <div id="ml-player-queue-list"></div>
          </div>
        </aside>
      </div>
      <div id="ml-player-dock">
        <div id="ml-player-dock-song">
          <div id="ml-player-dock-cover"><span>♪</span></div>
          <div id="ml-player-dock-meta">
            <div id="ml-player-dock-title"></div>
            <div id="ml-player-dock-artist"></div>
          </div>
        </div>
        <div id="ml-player-dock-center">
          <div id="ml-player-controls">
            <button class="ml-player-ctl is-ghost" id="ml-player-shuffle" type="button">⇄</button>
            <button class="ml-player-ctl" id="ml-player-prev" type="button">⏮</button>
            <button class="ml-player-ctl is-main" id="ml-player-playpause" type="button">▶</button>
            <button class="ml-player-ctl" id="ml-player-next" type="button">⏭</button>
            <button class="ml-player-ctl is-ghost" id="ml-player-repeat-toggle" type="button">↻</button>
          </div>
          <div class="ml-player-progress-wrap">
            <span id="ml-player-cur">0:00</span>
            <div class="ml-player-progress-bar" id="ml-player-progress"><div class="ml-player-progress-fill" id="ml-player-fill"></div></div>
            <span id="ml-player-dur">0:00</span>
          </div>
        </div>
        <div id="ml-player-dock-right">
          <span class="ml-player-vol-icon">🔉</span>
          <input id="ml-player-dock-vol" type="range" min="0" max="1" step="0.02" value="1">
        </div>
      </div>
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
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M9.5 4C5.36 4 2 6.92 2 10.5c0 2.04 1.06 3.86 2.72 5.08L4 18l2.5-1.25A8.6 8.6 0 0 0 9.5 17c.17 0 .34 0 .5-.01A5.7 5.7 0 0 1 9.5 15c0-3.04 2.69-5.5 6-5.5.17 0 .34 0 .5.01C15.41 6.67 12.73 4 9.5 4zm8 7c-2.76 0-5 1.79-5 4s2.24 4 5 4c.72 0 1.4-.14 2-.38L22 20l-.62-1.86A3.93 3.93 0 0 0 22.5 15c0-2.21-2.24-4-5-4z"/></svg>
            <span class="ml-notice-action-title">复制微信号 YuEn</span>
          </button>
          <button class="ml-notice-action" id="ml-open-ins" type="button">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
            <span class="ml-notice-action-title">打开 YuEn 的 Instagram</span>
          </button>
          <button class="ml-notice-action" id="ml-open-church-ins" type="button">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
            <span class="ml-notice-action-title">教会青年 Instagram</span>
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
  $('ml-nav-search')?.addEventListener('click',()=>{$('ml-search')?.focus();});
  $('ml-nav-theme')?.addEventListener('click',()=>{
    const rootEl=document.documentElement;
    if(!rootEl) return;
    rootEl.classList.toggle('dark');
    syncHaloTheme();
  });

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

  function openNoticeModal(){
    $('ml-notice-modal')?.classList.add('open');
    document.body.style.overflow='hidden';
  }
  function closeNoticeModal(){
    $('ml-notice-modal')?.classList.remove('open');
    document.body.style.overflow='';
  }

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

  function getSongIdFromUrl(){
    try{
      const u=new URL(location.href);
      return u.searchParams.get('song')||'';
    }catch(_){
      return '';
    }
  }

  function buildSongUrl(songId){
    try{
      const u=new URL(location.href);
      if(songId) u.searchParams.set('song', songId);
      else u.searchParams.delete('song');
      return u.toString();
    }catch(_){
      return location.href;
    }
  }

  function setSongUrl(songId, replaceOnly=true){
    try{
      const nextUrl=buildSongUrl(songId);
      const nextState=Object.assign({}, history.state||{}, {
        __mlSongId: songId||'',
        __mlDetail: !!songId
      });
      (replaceOnly?history.replaceState:history.pushState).call(history, nextState, '', nextUrl);
    }catch(_){ }
  }

  function shareSong(song){
    const urlText=buildSongUrl(song.id);
    const title=song.title||'诗歌';
    if(navigator.share){
      navigator.share({ title, url:urlText }).then(()=>{
        showToast('分享成功');
      }).catch(()=>{
        copyText(urlText,'链接已复制');
      });
    }else{
      copyText(urlText,'链接已复制');
    }
  }

  function openSongFromUrl(){
    const songId=getSongIdFromUrl();
    if(!songId||!songs.length) return;
    const target=songs.find(x=>x.id===songId);
    if(target) openDetail(target,{fromUrl:true});
  }

  function closeDetail(fromPop){
    if(!fromPop && _detailStatePushed){
      history.back();
      return;
    }
    destroyAP();
    stopMetronome();
    _mpSetExpanded(false);
    detail.classList.remove('open');
    detail.style.transform='';
    detail.classList.remove('swiping');
    $('ml-detail-overlay').style.opacity='0';
    _detailStatePushed=false;
    setSongUrl('', true);
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
      const res=await fetch(GITHUB_API+'?t='+Date.now(),{cache:'no-store'});if(!res.ok)throw 0;
      const files=await res.json();
      const jsons=files.filter(f=>f.name.endsWith('.json')&&f.name!=='test.json');
      const all=await Promise.all(jsons.map(f=>fetch(RAW_BASE+f.name,{cache:'no-store'}).then(r=>r.json()).catch(()=>null)));
      songs=all.filter(Boolean).map(enrichSong);
      $('ml-loading').style.display='none';
      $('ml-count').textContent=songs.length+' 首';
      render();
      openSongFromUrl();
    }catch(e){
      $('ml-loading').innerHTML='<div style="color:#ff3b30;font-size:14px">载入失败，请刷新重试</div>';
    }
  }

  function hasLyricMatch(s,q){
    for(const sec of s.sections||[])for(const line of sec.lines||[]){
      const arr=Array.isArray(line)?line:(line.line||[]);
      for(const c of arr)if((c.lyric||'').toLowerCase().includes(q)||(c.lyric2||'').toLowerCase().includes(q)||(c.lyric3||'').toLowerCase().includes(q)||(c.lyric4||'').toLowerCase().includes(q))return true;
    }return false;
  }
  function lower(v){ return String(v||'').trim().toLowerCase(); }
  function detectSongSource(song){
    const artist=(song.artist||'').trim();
    const haystack=lower([song.artist,song.sub,song.title].filter(Boolean).join(' '));
    if(artist){
      const direct=SOURCE_RULES.find(rule=>rule.name!=='其他' && (lower(rule.name)===lower(artist) || rule.patterns.some(p=>lower(artist).includes(lower(p)))));
      if(direct) return direct.name;
      return artist;
    }
    const matched=SOURCE_RULES.find(rule=>rule.name!=='其他' && rule.patterns.some(p=>haystack.includes(lower(p))));
    return matched ? matched.name : '其他';
  }
  function enrichSong(song){
    const source=detectSongSource(song);
    return Object.assign({},song,{
      source,
      displayArtist:(song.artist||source||'未知来源').trim()
    });
  }
  function hi(t,q){
    if(!q||!t)return t||'';
    return t.replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`,'gi'),'<mark class="ml-highlight">$1</mark>');
  }
  function renderSourceBar(){
    const bar=$('ml-source-bar');
    if(!bar) return;
    const counts=songs.reduce((acc,s)=>{
      const key=s.source||'其他';
      acc[key]=(acc[key]||0)+1;
      return acc;
    },{});
    const items=[{name:'全部',count:songs.length}].concat(
      Object.keys(counts)
        .sort((a,b)=>counts[b]-counts[a]||a.localeCompare(b,'zh-Hans-CN'))
        .map(name=>({name,count:counts[name]}))
    );
    if(sourceFilter!=='全部' && !counts[sourceFilter]) sourceFilter='全部';
    bar.innerHTML=items.map(item=>`
      <button class="ml-source-chip${item.name===sourceFilter?' active':''}" data-source="${item.name}" type="button">
        <span class="ml-source-name">${item.name}</span>
        <strong>${item.count}</strong>
      </button>
    `).join('');
    bar.querySelectorAll('.ml-source-chip').forEach(btn=>{
      btn.addEventListener('click',()=>{
        sourceFilter=btn.dataset.source||'全部';
        render();
      });
    });
  }

  function render(){
    const list=$('ml-list'),empty=$('ml-empty'),q=query.toLowerCase();
    renderSourceBar();
    const filtered=songs.filter(s=>{
      const sourceOk=sourceFilter==='全部'||(s.source||'其他')===sourceFilter;
      if(!sourceOk) return false;
      if(!q) return true;
      return (s.title||'').toLowerCase().includes(q)||(s.artist||'').toLowerCase().includes(q)||(s.source||'').toLowerCase().includes(q)||hasLyricMatch(s,q);
    });
    $('ml-result-count').textContent=q
      ? `找到 ${filtered.length} 首相关诗歌`
      : sourceFilter==='全部'
        ? `全部 ${songs.length} 首诗歌`
        : `${sourceFilter} · ${filtered.length} 首`;
    if(!filtered.length){
      list.innerHTML='';$('ml-query-text').textContent=query;empty.style.display='block';
      list.classList.remove('is-grouped');
      $('ml-list-stage').style.display='none';
    }else{
      empty.style.display='none';
      $('ml-list-stage').style.display='';
      if(q||sourceFilter!=='全部'){
        list.classList.remove('is-grouped');
        list.innerHTML=filtered.map(s=>cardHTML(s,q)).join('')+'<div id="ml-list-end"></div>';
      }else{
        list.classList.add('is-grouped');
        const grouped=new Map();
        filtered.forEach(song=>{
          const key=song.source||'其他';
          if(!grouped.has(key)) grouped.set(key,[]);
          grouped.get(key).push(song);
        });
        list.innerHTML=Array.from(grouped.entries())
          .sort((a,b)=>b[1].length-a[1].length||a[0].localeCompare(b[0],'zh-Hans-CN'))
          .map(([name,items])=>`
            <section class="ml-group">
              <div class="ml-group-head">
                <div>
                  <div class="ml-group-kicker">歌手 / 团体</div>
                  <div class="ml-group-title">${name}</div>
                </div>
                <div class="ml-group-count">${items.length} 首</div>
              </div>
              <div class="ml-group-grid">
                ${items.map(s=>cardHTML(s,q)).join('')}
              </div>
            </section>
          `).join('')+'<div id="ml-list-end"></div>';
      }
      _mpSongs = songs.filter(s=>s.mp3);
      _mpRenderQueue();
      list.querySelectorAll('.ml-song-card').forEach(el=>{
        el.addEventListener('click',()=>{const s=songs.find(x=>x.id===el.dataset.id);if(s)openDetail(s);});

        const shareBtn=document.createElement('button');
        shareBtn.className='ml-share-btn';
        shareBtn.innerHTML=`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>`;
        shareBtn.title='分享';
        shareBtn.onclick=e=>{
          e.stopPropagation();
          const s=songs.find(x=>x.id===el.dataset.id);
          if(s) shareSong(s);
        };
        el.appendChild(shareBtn);

        const playBtn=document.createElement('button');
        playBtn.className='ml-mp-play-btn';
        playBtn.innerHTML=`<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v14l11-7-11-7z"/></svg>`;
        playBtn.title='播放';
        playBtn.onclick=e=>{
          e.stopPropagation();
          const s=songs.find(x=>x.id===el.dataset.id);
          if(!s||!s.mp3) return;
          const idx=_mpSongs.findIndex(x=>x.id===s.id);
          if(idx>=0) _mpPlayIdx(idx,true);
        };
        el.appendChild(playBtn);
      });
    }
  }

  function cardHTML(s,q){
    const cover=s.cover
      ?`<img class="ml-cover" src="${s.cover}" loading="lazy" onerror="this.outerHTML='<div class=\\'ml-cover-placeholder\\'>♪</div>'">`
      :`<div class="ml-cover-placeholder">封面</div>`;
    const meta=[s.displayArtist,s.sub].filter(Boolean).join(' · ');
    const tags=[
      s.origKey?`<span class="ml-song-tag is-key">${s.origKey}</span>`:'',
      s.timeSign?`<span class="ml-song-tag">${s.timeSign}</span>`:'',
      s.mp3?`<span class="ml-song-tag">音频</span>`:''
    ].filter(Boolean).join('');
    return`<div class="ml-song-card" data-id="${s.id}">
      <div class="ml-card-art">${cover}</div>
      <div class="ml-card-body">
        <div class="ml-song-overline">${hi(s.source||s.displayArtist||'诗歌',q)}</div>
        <div class="ml-song-title">${hi(s.title,q)}</div>
        <div class="ml-song-meta">${hi(meta||'收录歌词、简谱与练习资料',q)}</div>
        <div class="ml-song-tags">${tags}</div>
      </div>
    </div>`;
  }

  function _div(cls){const d=document.createElement('div');d.className=cls;return d;}

  function getVoltaStartLabel(nStr){
    if(!nStr) return '';
    var m=nStr.match(/\[v:([^\]\s]+)\]/);
    if(m&&m[1]) return m[1];
    if(nStr.indexOf('[v1')>=0) return '1';
    if(nStr.indexOf('[v2')>=0) return '2';
    return '';
  }
  function hasVoltaEnd(nStr){
    return !!(nStr&&nStr.indexOf(']v')>=0);
  }
  function makeBarline(tok){
    const o=document.createElement('span');
    o.style.cssText='display:inline-flex;flex-direction:column;align-items:flex-start;vertical-align:bottom;';
    const top=document.createElement('span');top.style.height='12px';o.appendChild(top);
    const mid=document.createElement('span');mid.style.cssText='display:inline-flex;align-items:stretch;height:26px;';
    function thin(){const l=document.createElement('span');l.style.cssText='width:1.5px;background:currentColor;flex-shrink:0;';return l;}
    function thick(){const l=document.createElement('span');l.style.cssText='width:3.5px;background:currentColor;flex-shrink:0;';return l;}
    function gap(px){const g=document.createElement('span');g.style.cssText='width:'+px+'px;flex-shrink:0;';return g;}
    function dots(){const d=document.createElement('span');d.style.cssText='display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;width:6px;flex-shrink:0;';const d1=document.createElement('span');d1.style.cssText='width:3px;height:3px;border-radius:50%;background:currentColor;';const d2=document.createElement('span');d2.style.cssText='width:3px;height:3px;border-radius:50%;background:currentColor;';d.appendChild(d1);d.appendChild(d2);return d;}
    if(tok==='|'){mid.appendChild(thin());}
    else if(tok==='||'){mid.appendChild(thin());mid.appendChild(gap(2));mid.appendChild(thin());}
    else if(tok==='||/'||tok==='|]'){mid.appendChild(thin());mid.appendChild(gap(2));mid.appendChild(thick());}
    else if(tok==='|:'){mid.appendChild(thin());mid.appendChild(gap(1));mid.appendChild(thick());mid.appendChild(gap(3));mid.appendChild(dots());}
    else if(tok===':|'){mid.appendChild(dots());mid.appendChild(gap(3));mid.appendChild(thick());mid.appendChild(gap(1));mid.appendChild(thin());}
    else if(tok==='|:|'){mid.appendChild(dots());mid.appendChild(gap(3));mid.appendChild(thick());mid.appendChild(gap(1));mid.appendChild(thick());mid.appendChild(gap(3));mid.appendChild(dots());}
    o.appendChild(mid);
    const bot=document.createElement('span');bot.style.height='16px';o.appendChild(bot);
    return o;
  }
  function makeJpPlain(sym){
    const pl=document.createElement('span');pl.className='jp-plain';
    const t=document.createElement('span');t.className='jp-plain-top';pl.appendChild(t);
    const s=document.createElement('span');s.className='jp-plain-sym'+(sym==='-'?' is-dash':'');s.textContent=sym;pl.appendChild(s);
    const b=document.createElement('span');b.className='jp-plain-bot';pl.appendChild(b);
    return pl;
  }
  function setDots(el,cnt){
    el.innerHTML='';
    for(var i=0;i<cnt;i++){const d=document.createElement('span');d.textContent='·';el.appendChild(d);}
  }
  function parseJpToken(tok){
    if(tok==='|'||tok==='||'||tok==='||/'||tok==='|]'||tok==='|:'||tok===':|'||tok==='|:|')return makeBarline(tok);
    if(!tok||tok==='-'||tok===' ')return makeJpPlain(tok);
    if(tok==='0')return makeJpPlain('0');
    var hasFermata=false;
    if(tok.slice(-1)==='^'){hasFermata=true;tok=tok.slice(0,-1);}
    if(tok==='sp'||tok==='sp_'||tok==='sp__'){
      const fake=tok==='sp__'?'0__':tok==='sp_'?'0_':'0';
      const e2=parseJpToken(fake);
      const ns=e2.querySelector('.jp-num')||e2.querySelector('.jp-plain-sym');
      if(ns)ns.style.visibility='hidden';
      return e2;
    }
    var zm=tok.match(/^(0·?)(_*)$/);
    if(zm){
      var wz=document.createElement('span');wz.className='jp-wrap';
      var tdz=document.createElement('span');tdz.className='jp-dot-top';wz.appendChild(tdz);
      var lwz=document.createElement('span');lwz.className='jp-lines-wrap';
      var nrz=document.createElement('span');nrz.className='jp-num-row';
      var nsz=document.createElement('span');nsz.className='jp-num';nsz.textContent='0';nrz.appendChild(nsz);
      if(zm[1].indexOf('\u00b7')>-1){var agz=document.createElement('span');agz.className='jp-aug';agz.textContent='·';nrz.appendChild(agz);}
      var ulz=zm[2].length;
      if(ulz>=1)nrz.style.borderBottom='1.5px solid currentColor';
      lwz.appendChild(nrz);
      if(ulz===2){var ul2z=document.createElement('span');ul2z.className='jp-u2-line';lwz.appendChild(ul2z);}
      wz.appendChild(lwz);
      var bdz=document.createElement('span');bdz.className='jp-dot-bot';wz.appendChild(bdz);
      return wz;
    }
    let num=tok,isHigh=0,isLow=0,isDot=false,uline=0;
    if(num.slice(-2)==='__'){uline=2;num=num.slice(0,-2);} else if(num.slice(-1)==='_'){uline=1;num=num.slice(0,-1);}
    if(num.indexOf('\u00b7')>-1){isDot=true;num=num.replace(/\u00b7/g,'');}
    const hm=num.match(/^(.+?)('+)$/);if(hm){isHigh=hm[2].length;num=hm[1];}
    const lm=num.match(/^(.+?)(,+)$/);if(lm){isLow=lm[2].length;num=lm[1];}
    var w=document.createElement('span');w.className='jp-wrap';
    var td=document.createElement('span');td.className='jp-dot-top';setDots(td,isHigh>=2?2:isHigh);w.appendChild(td);
    var lw2=document.createElement('span');lw2.className='jp-lines-wrap';
    var numRow=document.createElement('span');numRow.className='jp-num-row';
    var ns2=document.createElement('span');ns2.className='jp-num';ns2.textContent=num;numRow.appendChild(ns2);
    if(isDot){var dot=document.createElement('span');dot.className='jp-aug';dot.textContent='·';numRow.appendChild(dot);}
    if(uline>=1)numRow.style.borderBottom='1.5px solid currentColor';
    lw2.appendChild(numRow);
    if(uline===2){var l2=document.createElement('span');l2.className='jp-u2-line';lw2.appendChild(l2);}
    w.appendChild(lw2);
    var bot=document.createElement('span');bot.className='jp-dot-bot';setDots(bot,isLow>=2?2:isLow);w.appendChild(bot);
    if(hasFermata){var fw=document.createElement('span');fw.className='jp-fermata';fw.appendChild(w);return fw;}
    return w;
  }

  function makeTuplet(n){
    var w=document.createElement('span');w.className='jp-tuplet';
    var br=document.createElement('span');br.className='jp-tuplet-br';w.appendChild(br);
    var nm=document.createElement('span');nm.className='jp-tuplet-num';nm.textContent=String(n);w.appendChild(nm);
    return w;
  }
  function renderNStr(nStr){
    var d=document.createElement('div');d.className='p-n';
    if(!nStr||!nStr.trim())return d;
    var toks=nStr.trim().split(/\s+/),i=0;
    while(i<toks.length){
      var t=toks[i];
      if(t==='('){var sl=document.createElement('span');sl.className='jp-slur';i++;while(i<toks.length&&toks[i]!==')')sl.appendChild(parseJpToken(toks[i++]));d.appendChild(sl);i++;continue;}
      if(t==='(['){var so=document.createElement('span');so.className='jp-slur-open';i++;while(i<toks.length&&toks[i]!=='])')so.appendChild(parseJpToken(toks[i++]));if(i<toks.length)i++;d.appendChild(so);continue;}
      if(t==='])'){var sc=document.createElement('span');sc.className='jp-slur-close';i++;if(i<toks.length)sc.appendChild(parseJpToken(toks[i++]));d.appendChild(sc);continue;}
      if(t==='[v1'||t==='[v2'||t===']v'||/^\[v:(.+)\]$/.test(t)){i++;continue;}
      var tm2=t.match(/^\{(3|5)$/);if(tm2){var tn=parseInt(tm2[1],10);var tp=makeTuplet(tn);i++;while(i<toks.length&&toks[i]!=='}')tp.appendChild(parseJpToken(toks[i++]));d.appendChild(tp);i++;continue;}
      if(t==='}'){i++;continue;}
      d.appendChild(parseJpToken(t));i++;
    }
    return d;
  }

  const NOTE_MAP={C:0,'B#':0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,Fb:4,'E#':5,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11,Cb:11};
  const NOTES_SHARP=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const NOTES_FLAT =['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
  const FLAT_KEYS=new Set(['F','Bb','Eb','Ab','Db','Gb','Cb']);
  const USE_FLAT_MINOR_ROOTS=new Set(['D','G','C','F','Bb','Eb']);
  function parseKeyName(key){
    const k=(key||'').trim();
    if(!k)return {root:'C',suf:''};
    const m=k.match(/^([A-G](?:#|b)?)(.*)$/);
    if(!m)return {root:k,suf:''};
    return {root:m[1],suf:m[2]||''};
  }
  function needFlat(root,suf){
    const minor=/m(?!aj)/i.test(suf);
    if(minor) return USE_FLAT_MINOR_ROOTS.has(root);
    return FLAT_KEYS.has(root);
  }
  function trKeyName(key,st,useFlat){
    const {root,suf}=parseKeyName(key);
    const n=(NOTE_MAP[root]+st+120)%12;
    const flat=(useFlat!==undefined)?useFlat:needFlat(root,suf);
    const nr=flat?NOTES_FLAT[n]:NOTES_SHARP[n];
    return nr+suf;
  }
  function trBass(bass,st,useFlat){
    return trKeyName(bass,st,useFlat);
  }
  function normLyricText(text){
    return String(text||'');
  }
  function setLyricContent(el,text){
    const raw=String(text||'');
    el.textContent='';
    for(const ch of raw){
      if(ch==='\u3164'){
        const gap=document.createElement('span');
        gap.className='lyric-gap';
        gap.setAttribute('aria-hidden','true');
        gap.textContent=ch;
        el.appendChild(gap);
      }else{
        el.appendChild(document.createTextNode(ch));
      }
    }
  }
  function trChordToken(ch,st,useFlat){
    const m=String(ch||'').trim().match(/^([A-G](?:#|b)?)(.*)$/);
    if(!m)return ch;
    let rest=m[2]||'';
    rest=rest.replace(/\/\s*([A-G](?:#|b)?)/g,(a,b)=>'/'+trBass(b,st,useFlat));
    return trKeyName(m[1],st,useFlat)+rest;
  }
  function resizeChordGap(gap,len){
    const chars=[...String(gap||'')].map(ch=>ch==='\u3164'?'\u3000':ch);
    if(!chars.length||len<=0)return '';
    let out='';
    for(let i=0;i<len;i++)out+=chars[i%chars.length];
    return out;
  }
  function trChord(ch,st,useFlat){
    if(!ch)return ch;
    const parts=String(ch).split(/([ \t\u3164]+)/);
    let out='';
    for(let i=0;i<parts.length;i++){
      const part=parts[i];
      if(!/[^\s\u3164]/.test(part)){out+=part;continue;}
      const tr=trChordToken(part,st,useFlat);
      out+=tr;
      if(i+1<parts.length&&/[ \t\u3164]+/.test(parts[i+1])){
        const gap=parts[i+1];
        let nextLen=Math.max(0,[...gap].length + ([...part].length - [...tr].length));
        if(nextLen===0 && i+2<parts.length && /[^\s\u3164]/.test(parts[i+2]))nextLen=1;
        out+=resizeChordGap(gap,nextLen);
        i++;
      }
    }
    return out;
  }
  function calcCapo(target,orig){
    const {root:targetRoot,suf:targetSuf}=parseKeyName(target);
    const {root:origRoot}=parseKeyName(orig);
    const t=NOTE_MAP[targetRoot], o=NOTE_MAP[origRoot];
    const st=(t-o+12)%12;
    let best=null;
    ['C','D','E','F','G','A','B'].forEach(function(pk){
      const c=(t-NOTE_MAP[pk]+12)%12;
      if(c<=7 && (!best || c<best.capo)) best={playKey:pk+targetSuf,capo:c};
    });
    return {st, capo:best?best.capo:0, playKey:best?best.playKey:target};
  }

  let _mpAudio=null,_mpSongs=[],_mpIdx=-1,_mpLoop=false,_mpShuffle=false,_mpLrc=[],_mpLrcIdx=-1,_mpCoverFallback='',_mpExpanded=false,_mpSideMode='song',_mpSideCollapsed=false;

  function _mpFmt(t){
    if(!isFinite(t)) return '0:00';
    const m=Math.floor(t/60), s=Math.floor(t%60);
    return m+':'+String(s).padStart(2,'0');
  }
  function _mpSetCover(src){
    const el=$('ml-mp-cover');
    const xl=$('ml-player-cover');
    const dl=$('ml-player-dock-cover');
    if(!el) return;
    if(src){
      el.innerHTML=`<img src="${src}" alt="">`;
      if(xl) xl.innerHTML=`<img src="${src}" alt="">`;
      if(dl) dl.innerHTML=`<img src="${src}" alt="">`;
    }else{
      el.innerHTML='<span>♪</span>';
      if(xl) xl.innerHTML='<span>♪</span>';
      if(dl) dl.innerHTML='<span>♪</span>';
    }
  }
  function _mpSetExpanded(open){
    const pv=$('ml-player-view');
    if(!pv) return;
    _mpExpanded=!!open;
    pv.classList.toggle('open',_mpExpanded);
    pv.classList.toggle('side-collapsed',!!_mpSideCollapsed);
    document.body.style.overflow=_mpExpanded?'hidden':'';
  }
  function _mpSetSideMode(mode){
    _mpSideMode=(mode==='queue')?'queue':'song';
    const tabSong=$('ml-player-tab-song');
    const tabQueue=$('ml-player-tab-queue');
    const panelSong=$('ml-player-side-song');
    const panelQueue=$('ml-player-side-queue');
    if(tabSong) tabSong.classList.toggle('active',_mpSideMode==='song');
    if(tabQueue) tabQueue.classList.toggle('active',_mpSideMode==='queue');
    if(panelSong) panelSong.hidden=_mpSideMode!=='song';
    if(panelQueue) panelQueue.hidden=_mpSideMode!=='queue';
  }
  function _mpRenderQueue(){
    const box=$('ml-player-queue-list');
    const empty=$('ml-player-queue-empty');
    if(!box) return;
    box.innerHTML='';
    if(!_mpSongs.length){
      if(empty) empty.hidden=false;
      return;
    }
    if(empty) empty.hidden=true;
    _mpSongs.forEach((song,i)=>{
      const row=document.createElement('button');
      row.type='button';
      row.className='ml-player-queue-item'+(i===_mpIdx?' is-active':'');
      row.innerHTML=`
        <span class="ml-player-queue-index">${i+1}</span>
        <span class="ml-player-queue-main">
          <span class="ml-player-queue-title">${song.title||'未命名歌曲'}</span>
          <span class="ml-player-queue-artist">${song.artist||song.source||'诗歌'}</span>
        </span>
      `;
      row.addEventListener('click',()=>_mpPlayIdx(i,true));
      box.appendChild(row);
    });
  }
  function _mpSyncModeUI(){
    const r1=$('ml-mp-repeat');
    const r2=$('ml-player-repeat-toggle');
    const s2=$('ml-player-shuffle');
    if(r1) r1.classList.toggle('on',!!_mpLoop);
    if(r2) r2.classList.toggle('on',!!_mpLoop);
    if(s2) s2.classList.toggle('on',!!_mpShuffle);
  }
  function _mpNextIdxFrom(cur){
    if(!_mpSongs.length) return 0;
    if(_mpShuffle){
      if(_mpSongs.length===1) return 0;
      let n=cur;
      while(n===cur) n=Math.floor(Math.random()*_mpSongs.length);
      return n;
    }
    let n=cur+1;
    if(n>=_mpSongs.length) n=0;
    return n;
  }
  function _mpSetPlayUI(isPlaying){
    const btn=$('ml-mp-playpause');
    const xbtn=$('ml-player-playpause');
    const stage=$('ml-mp-stage');
    if(btn){
      btn.innerHTML=isPlaying
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5h3v14H8zm5 0h3v14h-3z"/></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v14l11-7-11-7z"/></svg>`;
    }
    if(xbtn) xbtn.textContent=isPlaying?'⏸':'▶';
    if(stage) stage.classList.toggle('playing', !!isPlaying);
  }
  function _mpParseLrc(text){
    const arr=[];
    String(text||'').split(/\r?\n/).forEach(line=>{
      const m=line.match(/\[(\d+):(\d+(?:\.\d+)?)\](.*)/);
      if(m){
        arr.push({ t:(+m[1])*60 + parseFloat(m[2]), tx:(m[3]||'').trim() });
      }
    });
    return arr.sort((a,b)=>a.t-b.t);
  }
  function _mpRenderLrc(){
    function paint(innerId,panelId,lineClass){
      const inner=$(innerId);
      const panel=$(panelId);
      if(!inner) return;
      inner.innerHTML='';
      if(!_mpLrc.length){
        inner.innerHTML=`<div class="${lineClass}">暂无歌词</div>`;
        return;
      }
      _mpLrc.forEach((it,i)=>{
        const d=document.createElement('div');
        d.className=lineClass+(i===0?' active':'');
        d.textContent=it.tx || '…';
        d.addEventListener('click',()=>{
          if(_mpAudio && isFinite(_mpLrc[i].t)) _mpAudio.currentTime=_mpLrc[i].t;
        });
        inner.appendChild(d);
      });
      if(panel) panel.scrollTop=0;
    }
    paint('ml-mp-lrc-inner','ml-mp-lrc-panel','ml-mp-lrc-line');
    paint('ml-player-lyrics-inner','ml-player-lyrics','ml-player-lrc-line');
    _mpLrcIdx=0;
  }
  function _mpSyncLrc(cur){
    if(!_mpLrc.length) return;
    let idx=0;
    for(let i=0;i<_mpLrc.length;i++){
      if(cur>=_mpLrc[i].t) idx=i; else break;
    }
    if(idx===_mpLrcIdx) return;
    _mpLrcIdx=idx;
    function sync(innerId,panelId){
      const inner=$(innerId), panel=$(panelId);
      if(!inner || !panel) return;
      [...inner.children].forEach((el,i)=>el.classList.toggle('active', i===idx));
      const active=inner.children[idx];
      if(active){
        const y=active.offsetTop - panel.clientHeight/2 + active.clientHeight/2;
        panel.scrollTo({ top: Math.max(0,y), behavior:'smooth' });
      }
    }
    sync('ml-mp-lrc-inner','ml-mp-lrc-panel');
    sync('ml-player-lyrics-inner','ml-player-lyrics');
  }
  function _mpBind(){
    if(_mpAudio) return;
    _mpAudio=$('ml-mp-audio');
    if(!_mpAudio) return;
    const mv=$('ml-mp-vol'); if(mv) mv.value=String(_mpAudio.volume||1);
    const dv=$('ml-player-dock-vol'); if(dv) dv.value=String(_mpAudio.volume||1);

    _mpAudio.addEventListener('loadedmetadata',()=>{
      $('ml-mp-dur').textContent=_mpFmt(_mpAudio.duration);
      const xd=$('ml-player-dur'); if(xd) xd.textContent=_mpFmt(_mpAudio.duration);
    });
    _mpAudio.addEventListener('timeupdate',()=>{
      $('ml-mp-cur').textContent=_mpFmt(_mpAudio.currentTime);
      const xc=$('ml-player-cur'); if(xc) xc.textContent=_mpFmt(_mpAudio.currentTime);
      const dur=_mpAudio.duration||0;
      $('ml-mp-fill').style.width=dur?((_mpAudio.currentTime/dur)*100)+'%':'0%';
      const xf=$('ml-player-fill'); if(xf) xf.style.width=dur?((_mpAudio.currentTime/dur)*100)+'%':'0%';
      _mpSyncLrc(_mpAudio.currentTime);
    });
    _mpAudio.addEventListener('play',()=>_mpSetPlayUI(true));
    _mpAudio.addEventListener('pause',()=>_mpSetPlayUI(false));
    _mpAudio.addEventListener('ended',()=>{
      if(_mpLoop){
        _mpAudio.currentTime=0;
        _mpAudio.play().catch(()=>{});
      }else{
        _mpPlayIdx(_mpNextIdxFrom(_mpIdx),true);
      }
    });

    $('ml-mp-playpause')?.addEventListener('click',()=>{
      if(!_mpAudio.src) return;
      if(_mpAudio.paused) _mpAudio.play().catch(()=>{});
      else _mpAudio.pause();
    });
    $('ml-player-playpause')?.addEventListener('click',()=>{
      if(!_mpAudio.src) return;
      if(_mpAudio.paused) _mpAudio.play().catch(()=>{});
      else _mpAudio.pause();
    });
    $('ml-mp-prev')?.addEventListener('click',()=>_mpPlayIdx(_mpIdx-1,true));
    $('ml-mp-next')?.addEventListener('click',()=>_mpPlayIdx(_mpNextIdxFrom(_mpIdx),true));
    $('ml-player-prev')?.addEventListener('click',()=>_mpPlayIdx(_mpIdx-1,true));
    $('ml-player-next')?.addEventListener('click',()=>_mpPlayIdx(_mpNextIdxFrom(_mpIdx),true));
    $('ml-mp-seek-back')?.addEventListener('click',()=>{
      if(!_mpAudio.src) return;
      _mpAudio.currentTime=Math.max(0, (_mpAudio.currentTime||0)-15);
    });
    $('ml-mp-seek-fwd')?.addEventListener('click',()=>{
      if(!_mpAudio.src) return;
      _mpAudio.currentTime=Math.min(_mpAudio.duration||1e9, (_mpAudio.currentTime||0)+15);
    });
    $('ml-mp-repeat')?.addEventListener('click',e=>{
      _mpLoop=!_mpLoop;
      _mpSyncModeUI();
    });
    $('ml-player-repeat-toggle')?.addEventListener('click',()=>{
      _mpLoop=!_mpLoop;
      _mpSyncModeUI();
    });
    $('ml-player-shuffle')?.addEventListener('click',()=>{
      _mpShuffle=!_mpShuffle;
      _mpSyncModeUI();
    });
    $('ml-mp-vol')?.addEventListener('input',e=>{
      const v=parseFloat(e.target.value||'1');
      _mpAudio.volume=v;
      const dv=$('ml-player-dock-vol'); if(dv) dv.value=String(v);
    });
    $('ml-player-dock-vol')?.addEventListener('input',e=>{
      const v=parseFloat(e.target.value||'1');
      _mpAudio.volume=v;
      const mv=$('ml-mp-vol'); if(mv) mv.value=String(v);
    });
    document.querySelector('.pl-progress-bar')?.addEventListener('click',e=>{
      if(!_mpAudio.src || !_mpAudio.duration) return;
      const r=e.currentTarget.getBoundingClientRect();
      const p=Math.max(0, Math.min(1, (e.clientX-r.left)/r.width));
      _mpAudio.currentTime=_mpAudio.duration*p;
    });
    $('ml-player-progress')?.addEventListener('click',e=>{
      if(!_mpAudio.src || !_mpAudio.duration) return;
      const r=e.currentTarget.getBoundingClientRect();
      const p=Math.max(0, Math.min(1, (e.clientX-r.left)/r.width));
      _mpAudio.currentTime=_mpAudio.duration*p;
    });
    $('ml-miniplayer')?.addEventListener('click',e=>{
      if(e.target.closest('.pl-btn, .pl-progress-wrap, .pl-vol-wrap, #ml-mp-expand, .pl-vol')) return;
      _mpSetExpanded(true);
    });
    $('ml-mp-expand')?.addEventListener('click',()=>_mpSetExpanded(true));
    $('ml-player-view-close')?.addEventListener('click',()=>_mpSetExpanded(false));
    $('ml-player-view')?.addEventListener('click',e=>{ if(e.target.id==='ml-player-view') _mpSetExpanded(false); });
    $('ml-player-tab-song')?.addEventListener('click',()=>{_mpSideCollapsed=false;_mpSetSideMode('song');_mpSetExpanded(true);});
    $('ml-player-tab-queue')?.addEventListener('click',()=>{_mpSideCollapsed=false;_mpSetSideMode('queue');_mpSetExpanded(true);});
    $('ml-player-view-menu')?.addEventListener('click',()=>{
      _mpSideCollapsed=!_mpSideCollapsed;
      _mpSetExpanded(true);
    });
    const railBtns=document.querySelectorAll('#ml-player-rail .ml-player-rail-btn');
    if(railBtns[0]){
      railBtns[0].addEventListener('click',()=>{
        _mpSideCollapsed=false;
        _mpSetSideMode('song');
        _mpSetExpanded(true);
      });
    }
    if(railBtns[1]){
      railBtns[1].addEventListener('click',()=>{
        _mpSideCollapsed=false;
        _mpSetSideMode('queue');
        _mpSetExpanded(true);
      });
    }
    document.addEventListener('keydown',e=>{
      const t=e.target;
      const typing=t&&((t.tagName==='INPUT')||(t.tagName==='TEXTAREA')||t.isContentEditable);
      if(e.key==='Escape'&&_mpExpanded){
        _mpSetExpanded(false);
        return;
      }
      if(typing || !_mpAudio) return;
      if(e.code==='Space'){
        e.preventDefault();
        if(!_mpAudio.src) return;
        if(_mpAudio.paused) _mpAudio.play().catch(()=>{});
        else _mpAudio.pause();
      }else if(e.key==='ArrowRight'){
        if(!_mpAudio.src) return;
        _mpAudio.currentTime=Math.min(_mpAudio.duration||1e9, (_mpAudio.currentTime||0)+5);
      }else if(e.key==='ArrowLeft'){
        if(!_mpAudio.src) return;
        _mpAudio.currentTime=Math.max(0, (_mpAudio.currentTime||0)-5);
      }else if((e.key==='ArrowUp' || e.key==='ArrowDown') && _mpExpanded){
        const delta=e.key==='ArrowUp'?0.05:-0.05;
        const v=Math.max(0,Math.min(1,(_mpAudio.volume||0)+delta));
        _mpAudio.volume=v;
        const mv=$('ml-mp-vol'); if(mv) mv.value=String(v);
        const dv=$('ml-player-dock-vol'); if(dv) dv.value=String(v);
      }else if((e.key==='q'||e.key==='Q') && _mpExpanded){
        _mpSideCollapsed=false;
        _mpSetSideMode('queue');
        _mpSetExpanded(true);
      }else if((e.key==='s'||e.key==='S') && _mpExpanded){
        _mpSideCollapsed=false;
        _mpSetSideMode('song');
        _mpSetExpanded(true);
      }
    });
    _mpSetSideMode(_mpSideMode);
    _mpRenderQueue();
    _mpSyncModeUI();
  }

  function _mpPlayIdx(idx,autoplay){
    _mpBind();
    if(!_mpSongs.length) return;
    if(idx<0) idx=_mpSongs.length-1;
    if(idx>=_mpSongs.length) idx=0;
    _mpIdx=idx;
    const s=_mpSongs[idx];
    if(!s) return;
    const mini=$('ml-miniplayer');
    if(mini) mini.classList.add('has-mp3');
    $('ml-mp-title').textContent=s.title||'';
    $('ml-mp-artist').textContent=s.artist||'';
    const xt=$('ml-player-title'); if(xt) xt.textContent=s.title||'';
    const xa=$('ml-player-artist'); if(xa) xa.textContent=s.artist||'';
    const dt=$('ml-player-dock-title'); if(dt) dt.textContent=s.title||'';
    const da=$('ml-player-dock-artist'); if(da) da.textContent=s.artist||'';
    const xk=$('ml-player-key'); if(xk) xk.textContent='调: '+(s.origKey||'—');
    const xb=$('ml-player-bpm'); if(xb) xb.textContent='速度: '+(s.bpm||'—');
    const xnt=$('ml-player-now-title'); if(xnt) xnt.textContent=s.title||'正在播放';
    const xns=$('ml-player-now-sub'); if(xns) xns.textContent=s.artist||s.source||'诗歌';
    _mpSetCover(s.cover||'');
    _mpAudio.src=s.mp3||'';
    $('ml-mp-cur').textContent='0:00';
    $('ml-mp-dur').textContent='0:00';
    $('ml-mp-fill').style.width='0%';
    const xcur=$('ml-player-cur'); if(xcur) xcur.textContent='0:00';
    const xdur=$('ml-player-dur'); if(xdur) xdur.textContent='0:00';
    const xfill=$('ml-player-fill'); if(xfill) xfill.style.width='0%';
    _mpLrc=[]; _mpLrcIdx=-1; _mpRenderLrc();
    _mpRenderQueue();
    if(s.lrc){
      fetch(s.lrc).then(r=>r.text()).then(text=>{
        _mpLrc=_mpParseLrc(text); _mpRenderLrc();
      }).catch(()=>{});
    }
    if(autoplay) _mpAudio.play().catch(()=>{});
  }

  function destroyAP(){}

  function stopMetronome(){
    _metroRunning=false;
    if(_metroTimer){clearInterval(_metroTimer);_metroTimer=null;}
    const btn=document.querySelector('.ml-met-toggle');
    if(btn){btn.textContent='开始';btn.classList.add('off');}
  }

  function startMetronome(bpm){
    stopMetronome();
    _metroBpm=Math.max(30,Math.min(240,parseInt(bpm||72,10)||72));
    const bpmNum=document.querySelector('.ml-met-bpm-num');
    let beat=0;
    function tick(){
      if(!_audioCtx){
        const AC=window.AudioContext||window.webkitAudioContext;
        if(AC) _audioCtx=new AC();
      }
      if(_audioCtx){
        const o=_audioCtx.createOscillator(),g=_audioCtx.createGain();
        o.type='sine'; o.frequency.value=beat%4===0?1200:900;
        g.gain.value=0.0001;
        o.connect(g); g.connect(_audioCtx.destination);
        const now=_audioCtx.currentTime;
        g.gain.exponentialRampToValueAtTime(0.15, now+0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, now+0.08);
        o.start(now); o.stop(now+0.09);
      }
      if(bpmNum){bpmNum.style.opacity='.45';requestAnimationFrame(()=>{bpmNum.style.opacity='';});}
      beat++;
    }
    tick();
    _metroRunning=true;
    _metroTimer=setInterval(tick,60000/_metroBpm);
    const btn=document.querySelector('.ml-met-toggle');
    if(btn){btn.textContent='停止';btn.classList.remove('off');}
  }

  function createMetronome(defaultBpm){
    const wrap=document.createElement('div');wrap.className='ml-met';
    const top=document.createElement('div');top.className='ml-met-top';
    const leftDiv=document.createElement('div');
    const titleEl=document.createElement('div');titleEl.className='ml-met-title';titleEl.textContent='节拍器';
    const subEl=document.createElement('div');subEl.className='ml-met-sub';subEl.textContent='跟随这首歌的节奏，也可以手动调整';
    leftDiv.appendChild(titleEl);leftDiv.appendChild(subEl);
    const toggle=document.createElement('button');
    toggle.className='ml-met-toggle off';toggle.type='button';toggle.textContent='开始';
    top.appendChild(leftDiv);top.appendChild(toggle);
    const body=document.createElement('div');body.className='ml-met-body';
    const bpmEl=document.createElement('div');bpmEl.className='ml-met-bpm';
    const bpmNum=document.createElement('span');bpmNum.className='ml-met-bpm-num';bpmNum.textContent=String(defaultBpm||72);
    const bpmSmall=document.createElement('small');bpmSmall.textContent=' 速度';
    bpmEl.appendChild(bpmNum);bpmEl.appendChild(bpmSmall);
    const minusBtn=document.createElement('button');minusBtn.className='ml-met-btn';minusBtn.type='button';minusBtn.textContent='−';
    const plusBtn=document.createElement('button');plusBtn.className='ml-met-btn';plusBtn.type='button';plusBtn.textContent='+';
    const resetBtn=document.createElement('button');resetBtn.className='ml-met-btn';resetBtn.type='button';resetBtn.title='重置';
    resetBtn.innerHTML='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>';
    const range=document.createElement('input');
    range.className='ml-met-range';range.type='range';
    range.min='30';range.max='240';range.value=String(defaultBpm||72);
    const hint=document.createElement('div');hint.className='ml-met-hint';
    hint.textContent='点开始即可打拍。滑杆可细调，± 可快速调节。';
    body.appendChild(bpmEl);body.appendChild(minusBtn);body.appendChild(plusBtn);body.appendChild(resetBtn);
    body.appendChild(range);body.appendChild(hint);
    wrap.appendChild(top);wrap.appendChild(body);
    const getBpm=()=>Math.max(30,Math.min(240,parseInt(range.value,10)||72));
    const updateDisplay=()=>{bpmNum.textContent=String(getBpm());range.value=String(getBpm());};
    minusBtn.onclick=()=>{range.value=String(getBpm()-1);updateDisplay();if(_metroRunning)startMetronome(getBpm());};
    plusBtn.onclick=()=>{range.value=String(getBpm()+1);updateDisplay();if(_metroRunning)startMetronome(getBpm());};
    resetBtn.onclick=()=>{range.value=String(defaultBpm||72);updateDisplay();if(_metroRunning)startMetronome(getBpm());};
    range.oninput=()=>{updateDisplay();if(_metroRunning)startMetronome(getBpm());};
    toggle.onclick=()=>{if(_metroRunning){stopMetronome();}else{startMetronome(getBpm());}};
    return wrap;
  }

  function attachSwipeBack(){
    const panel=detail;
    const overlay=$('ml-detail-overlay');
    let sx=0,sy=0,dx=0,dragging=false,started=false;
    function canStart(t){
      if(!panel.classList.contains('open')) return false;
      const header=t.closest('#ml-detail-header');
      const body=t.closest('#ml-detail');
      if(header) return true;
      if(!body) return false;
      const scroller=t.closest('#ml-detail-body');
      if(scroller && scroller.scrollTop>0) return false;
      return (window.innerWidth<=900);
    }
    panel.addEventListener('touchstart',e=>{
      if(!canStart(e.target)) return;
      const t=e.touches[0];
      sx=t.clientX; sy=t.clientY; dx=0; dragging=false; started=true;
      panel.classList.remove('swiping');
    },{passive:true});
    panel.addEventListener('touchmove',e=>{
      if(!started) return;
      const t=e.touches[0];
      const mx=t.clientX-sx, my=t.clientY-sy;
      if(!dragging){
        if(Math.abs(mx)>10 && Math.abs(mx)>Math.abs(my) && mx>0) dragging=true;
        else if(Math.abs(my)>10) { started=false; return; }
      }
      if(!dragging) return;
      dx=Math.max(0,mx);
      panel.classList.add('swiping');
      panel.style.transform=`translateX(${dx}px)`;
      overlay.style.opacity=String(Math.max(0,1-dx/(window.innerWidth*0.9)));
      e.preventDefault();
    },{passive:false});
    function end(){
      if(!started) return;
      started=false;
      if(!dragging){
        panel.style.transform=''; overlay.style.opacity=''; return;
      }
      if(dx>Math.min(140,window.innerWidth*0.28)){
        panel.style.transition='transform .22s ease, opacity .22s ease';
        panel.style.transform=`translateX(${window.innerWidth}px)`;
        overlay.style.opacity='0';
        setTimeout(()=>{
          panel.style.transition='';
          closeDetail();
        },220);
      }else{
        panel.style.transition='transform .22s ease, opacity .22s ease';
        panel.style.transform='';
        overlay.style.opacity='';
        setTimeout(()=>{panel.style.transition='';panel.classList.remove('swiping');},220);
      }
      dragging=false; dx=0;
    }
    panel.addEventListener('touchend',end,{passive:true});
    panel.addEventListener('touchcancel',end,{passive:true});

    window.addEventListener('popstate',()=>{
      if(panel.classList.contains('open')) closeDetail(true);
    });
  }

  function openDetail(s,opts={}){
    destroyAP();
    stopMetronome();
    syncHaloTheme();

    _mpBind();
    if(s.mp3){
      const idx=_mpSongs.findIndex(x=>x.id===s.id);
      const isSameSong = (idx>=0 && idx===_mpIdx);
      if(!isSameSong){
        if(idx>=0) _mpIdx=idx; else { _mpSongs=[s]; _mpIdx=0; }
        _mpRenderQueue();
        _mpLrc=[]; _mpLrcIdx=-1;
        _mpAudio.src=s.mp3||'';
        if(s.lrc) fetch(s.lrc).then(r=>r.text()).then(text=>{_mpLrc=_mpParseLrc(text);_mpRenderLrc();}).catch(()=>{});
      }
      const titleEl=document.getElementById('ml-mp-title');
      const artistEl=document.getElementById('ml-mp-artist');
      if(titleEl) titleEl.textContent=s.title||'';
      if(artistEl) artistEl.textContent=s.artist||'';
      const xt=document.getElementById('ml-player-title');
      const xa=document.getElementById('ml-player-artist');
      const xk=document.getElementById('ml-player-key');
      const xb=document.getElementById('ml-player-bpm');
      const xnt=document.getElementById('ml-player-now-title');
      const xns=document.getElementById('ml-player-now-sub');
      if(xt) xt.textContent=s.title||'';
      if(xa) xa.textContent=s.artist||'';
      if(xk) xk.textContent='调: '+(s.origKey||'—');
      if(xb) xb.textContent='速度: '+(s.bpm||'—');
      if(xnt) xnt.textContent=s.title||'正在播放';
      if(xns) xns.textContent=s.artist||s.source||'诗歌';
      _mpSetCover(s.cover||null);
      const stage=document.getElementById('ml-mp-stage');
      if(stage) stage.classList.toggle('playing', !_mpAudio.paused);
      if(isSameSong && _mpLrc.length && !document.getElementById('ml-mp-lrc-inner')?.children.length){
        _mpRenderLrc();
      }
      const detailPlayer=document.getElementById('ml-miniplayer');
      if(detailPlayer) detailPlayer.classList.add('has-mp3');
    } else {
      const detailPlayer=document.getElementById('ml-miniplayer');
      if(detailPlayer) detailPlayer.classList.remove('has-mp3');
    }
    const fromUrl=!!opts.fromUrl;
    if(!fromUrl){
      try{
        history.pushState(Object.assign({}, history.state||{}, {__mlDetail:true,__mlSongId:s.id}), '', buildSongUrl(s.id));
        _detailStatePushed=true;
      }catch(err){}
    }else{
      _detailStatePushed=false;
      setSongUrl(s.id, true);
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
    infoDiv.innerHTML=`<div class="sw-eyebrow">诗歌库</div>
      <div class="sw-title">${s.title||''}</div>
      <div class="sw-sub">${s.sub||s.artist||'用于练习、学习与敬拜辅助'}</div>`;
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

    const shareBtn=document.createElement('button');
    shareBtn.className='sw-pill';
    shareBtn.type='button';
    shareBtn.style.cssText='font-size:12px;padding:5px 12px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;border:none;';
    shareBtn.textContent='🔗 分享';
    shareBtn.addEventListener('click',()=>shareSong(s));
    toolsRow.appendChild(shareBtn);

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
      const info=calcCapo(curKey,s.origKey||'C'),st=info.st,useFlat=FLAT_KEYS.has(curKey);
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
          const le=_div('sw-lline');const row=_div('sw-lrow prev-row'+((!Array.isArray(line)&&line.b)?' bold':''));
          const segs=Array.isArray(line)?line:(line.line||[]);
          let voltaWrap=null;
          for(const seg of segs){
            const segEl=_div('prev-seg');
            const chord=document.createElement('div');
            chord.className='p-chord'+(seg.chord?'':' empty');
            chord.textContent=(seg.chord?trChord(seg.chord,st,useFlat):'\u00a0');
            segEl.appendChild(chord);
            if(seg.n&&seg.n.trim())segEl.appendChild(renderNStr(seg.n));
            const lyric=document.createElement('div');lyric.className='p-lyric'+((!Array.isArray(line)&&line.b)?' bold':'');setLyricContent(lyric,normLyricText(seg.lyric));
            segEl.appendChild(lyric);
            if(seg.lyric2){const ly2=document.createElement('div');ly2.className='p-lyric p-lyric2'+((!Array.isArray(line)&&line.b)?' bold':'');setLyricContent(ly2,normLyricText(seg.lyric2));segEl.appendChild(ly2);}
            if(seg.lyric3){const ly3=document.createElement('div');ly3.className='p-lyric p-lyric3'+((!Array.isArray(line)&&line.b)?' bold':'');setLyricContent(ly3,normLyricText(seg.lyric3));segEl.appendChild(ly3);}
            if(seg.lyric4){const ly4=document.createElement('div');ly4.className='p-lyric p-lyric4'+((!Array.isArray(line)&&line.b)?' bold':'');setLyricContent(ly4,normLyricText(seg.lyric4));segEl.appendChild(ly4);}
            const _vn=getVoltaStartLabel(seg.n);
            if(_vn){voltaWrap=document.createElement('span');voltaWrap.className='prev-volta';voltaWrap.setAttribute('data-v',_vn+'.');}
            (voltaWrap||row).appendChild(segEl);
            if(voltaWrap&&hasVoltaEnd(seg.n)){voltaWrap.classList.add('closed');row.appendChild(voltaWrap);voltaWrap=null;}
          }
          if(voltaWrap)row.appendChild(voltaWrap);
          le.appendChild(row);se.appendChild(le);
        }
        lbDiv.appendChild(se);
      }
    }
    function fitRows(){
      requestAnimationFrame(function(){
        lbDiv.style.transform='';lbDiv.style.transformOrigin='';
        lbDiv.style.width='';lbDiv.style.marginBottom='';
        lbDiv.style.padding='8px 18px 16px 8px';
        lbDiv.style.boxSizing='border-box';
        var avail=lbDiv.parentElement.clientWidth;
        if(!avail)return;
        var maxW=0;
        var gutterX=24;
        var gutterY=18;
        lbDiv.querySelectorAll('.sw-lrow').forEach(function(row){
          row.style.display='inline-flex';
          if(row.scrollWidth>maxW)maxW=row.scrollWidth;
          row.style.display='';
        });
        if(!maxW)return;
        var measureW=maxW+gutterX;
        var scale=avail/measureW;
        lbDiv.style.transform='scale('+scale+')';
        lbDiv.style.transformOrigin='left top';
        lbDiv.style.width=measureW+'px';
        var naturalH=lbDiv.offsetHeight;
        lbDiv.style.marginBottom=(naturalH*(scale-1) + gutterY)+'px';
        lbDiv.parentElement.style.overflow='hidden';
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
