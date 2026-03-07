/* musictool.js — 音乐工具箱
   用法：在 Halo 页面放 <div id="music-toolbox"></div> 然后载入此文件
*/
(function(){
'use strict';

/* ── 注入 HTML ── */
const root = document.getElementById('music-toolbox');
if(!root) return;

root.innerHTML = `
<!-- HUB -->
<div class="mt-hub" id="mt-hub">
  <div class="mt-hub-title">
    <h1>音 乐 工 具 箱</h1>
    <p>MUSIC TOOLS · 赞美诗工作站</p>
  </div>
  <div class="mt-tool-grid">
    <div class="mt-tool-card c1" id="mt-card-lrc">
      <div class="mt-tool-icon">🎵</div>
      <div class="mt-tool-name">歌词编辑器</div>
      <div class="mt-tool-desc">LRC 时间轴打轴<br>导入 / 导出 .lrc 文件</div>
      <div class="mt-tool-arrow">OPEN →</div>
    </div>
    <div class="mt-tool-card c2" id="mt-card-jf">
      <div class="mt-tool-icon">♩</div>
      <div class="mt-tool-name">简谱编辑器</div>
      <div class="mt-tool-desc">音符输入 · 和弦标注<br>导出 JSON 文件</div>
      <div class="mt-tool-arrow">OPEN →</div>
    </div>
  </div>
</div>

<!-- TOOLVIEW -->
<div class="mt-toolview" id="mt-toolview">
  <div class="mt-topbar">
    <button class="mt-back" id="mt-back">← 返回</button>
    <span class="mt-nav-label">工具箱 /</span>
    <span class="mt-nav-name" id="mt-nav-name"></span>
  </div>
  <div class="mt-body">

    <!-- LRC -->
    <div class="mt-panel" id="mt-panel-lrc">
      <audio id="mt-audio"></audio>
      <div class="mt-lrc-top">
        <div class="mt-lrc-progbar" id="mt-progbar">
          <div class="mt-lrc-progfill" id="mt-progfill"></div>
        </div>
        <div class="mt-lrc-controls">
          <span class="mt-lrc-time" id="mt-time">[00:00.00]</span>
          <button class="mt-play-btn" id="mt-playbtn">▶</button>
          <div class="mt-vol-wrap">
            <span class="mt-vol-label">音量</span>
            <input type="range" class="mt-vol-range" id="mt-vol" min="0" max="1" step="0.01" value="1">
          </div>
        </div>
      </div>
      <div class="mt-lrc-body">
        <div class="mt-lrc-left">
          <button class="mt-side-btn" id="mt-btn-music">⬆ 上传音乐</button>
          <input type="file" id="mt-music-file" accept="audio/*" style="display:none">
          <button class="mt-side-btn" id="mt-btn-lyric">⬆ 上传歌词</button>
          <input type="file" id="mt-lyric-file" accept=".lrc,.txt" style="display:none">
          <button class="mt-side-btn" id="mt-btn-create">📄 创建歌词</button>
          <button class="mt-side-btn" id="mt-btn-dl">⬇ 下载歌词</button>
        </div>
        <div class="mt-lrc-center" id="mt-lrc-center">
          <div class="mt-info-row">
            <div class="mt-info-dot"></div>
            <button class="mt-info-btn" id="mt-btn-info">add info</button>
          </div>
          <div id="mt-lines"></div>
        </div>
        <div class="mt-lrc-right">
          <div>
            <span class="mt-r-label">偏移</span>
            <div class="mt-offset-row">
              <input type="number" class="mt-offset-inp" id="mt-offset" value="0" step="0.1">
              <span class="mt-offset-unit">s</span>
            </div>
            <button class="mt-apply-btn" id="mt-btn-offset">应用偏移</button>
          </div>
          <div>
            <span class="mt-r-label">同步滚动</span>
            <div class="mt-toggle-row">
              <div class="mt-toggle on" id="mt-toggle"></div>
              <span class="mt-toggle-lbl" id="mt-toggle-lbl">开</span>
            </div>
          </div>
          <button class="mt-add-end-btn" id="mt-btn-addend">+ 新增歌词</button>
        </div>
      </div>
    </div>

    <!-- 简谱 iframe -->
    <div class="mt-panel mt-panel-jf" id="mt-panel-jf">
      <iframe id="mt-jf-iframe" src="" title="简谱编辑器"></iframe>
    </div>
  </div>
</div>

<!-- Modal: info -->
<div class="mt-modal-overlay" id="mt-modal-info">
  <div class="mt-modal-box">
    <div class="mt-modal-title">Add Info · 歌曲信息</div>
    <div class="mt-modal-row"><label>歌手 Artist</label><input class="mt-modal-inp" id="mt-meta-ar" placeholder="赞美之泉"></div>
    <div class="mt-modal-row"><label>歌名 Title</label><input class="mt-modal-inp" id="mt-meta-ti" placeholder="展开清晨的翅膀"></div>
    <div class="mt-modal-row"><label>专辑 Album</label><input class="mt-modal-inp" id="mt-meta-al"></div>
    <div class="mt-modal-row"><label>制作 By</label><input class="mt-modal-inp" id="mt-meta-by"></div>
    <div class="mt-modal-footer">
      <button class="mt-modal-ok" id="mt-info-ok">确定</button>
      <button class="mt-modal-cancel" id="mt-info-cancel">取消</button>
    </div>
  </div>
</div>

<!-- Modal: create -->
<div class="mt-modal-overlay" id="mt-modal-create">
  <div class="mt-modal-box">
    <div class="mt-modal-title">创建歌词 · 每行一句</div>
    <textarea class="mt-modal-ta" id="mt-create-ta" placeholder="第一行歌词&#10;第二行歌词&#10;第三行歌词"></textarea>
    <div class="mt-modal-footer">
      <button class="mt-modal-ok" id="mt-create-ok">创建</button>
      <button class="mt-modal-cancel" id="mt-create-cancel">取消</button>
    </div>
  </div>
</div>
`;

/* ── 路由 ── */
const hub      = $('mt-hub');
const toolview = $('mt-toolview');
const navName  = $('mt-nav-name');
const panels   = { lrc: $('mt-panel-lrc'), jf: $('mt-panel-jf') };

function $(id){ return document.getElementById(id); }

function openTool(id, name){
  navName.textContent = name;
  hub.style.display = 'none';
  toolview.classList.add('on');
  Object.values(panels).forEach(p => p.classList.remove('on'));
  panels[id].classList.add('on');
  if(id === 'jf'){
    const fr = $('mt-jf-iframe');
    if(!fr.src || !fr.src.includes('jianpu.html')){
      fr.src = 'https://cye04.github.io/Cecp/jianpu.html';
    }
  }
}
function closeTool(){
  toolview.classList.remove('on');
  hub.style.display = '';
  audio.pause();
  updatePlayBtn();
}

$('mt-card-lrc').onclick = () => openTool('lrc','歌词编辑器');
$('mt-card-jf').onclick  = () => openTool('jf','简谱编辑器');
$('mt-back').onclick     = closeTool;

/* ── LRC 播放器 ── */
const audio = $('mt-audio');
let lrcData = [], autoScroll = true, curIdx = -1;

audio.addEventListener('timeupdate', () => { updateTime(); updateProg(); if(autoScroll) highlightPlaying(); });
audio.addEventListener('play',  updatePlayBtn);
audio.addEventListener('pause', updatePlayBtn);
audio.addEventListener('ended', updatePlayBtn);

function fmt(s){ const m=Math.floor(s/60),sec=s%60; return String(m).padStart(2,'0')+':'+sec.toFixed(2).padStart(5,'0'); }
function fmtLRC(s){ return '['+fmt(s)+']'; }
function updateTime(){ $('mt-time').textContent='['+fmt(audio.currentTime)+']'; }
function updateProg(){ if(audio.duration) $('mt-progfill').style.width=(audio.currentTime/audio.duration*100)+'%'; }
function updatePlayBtn(){ $('mt-playbtn').textContent = audio.paused ? '▶' : '⏸'; }

function highlightPlaying(){
  const t = audio.currentTime;
  let idx = -1;
  lrcData.forEach((l,i) => { if(l.time !== null && l.time <= t) idx = i; });
  if(idx === curIdx) return;
  curIdx = idx;
  document.querySelectorAll('.mt-ly-row').forEach((r,i) => r.classList.toggle('playing', i===idx));
  if(idx >= 0 && autoScroll){
    const rows = document.querySelectorAll('.mt-ly-row');
    if(rows[idx]) rows[idx].scrollIntoView({block:'center',behavior:'smooth'});
  }
}

$('mt-playbtn').onclick = () => { audio.paused ? audio.play() : audio.pause(); };
$('mt-progbar').onclick = e => {
  if(!audio.duration) return;
  const r = e.currentTarget.getBoundingClientRect();
  audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
};
$('mt-vol').oninput = e => { audio.volume = e.target.value; };

/* 上传音乐 */
$('mt-btn-music').onclick = () => $('mt-music-file').click();
$('mt-music-file').onchange = function(){ if(this.files[0]){ audio.src=URL.createObjectURL(this.files[0]); audio.load(); }};

/* 上传歌词 */
$('mt-btn-lyric').onclick = () => $('mt-lyric-file').click();
$('mt-lyric-file').onchange = function(){
  if(!this.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    const parsed = [];
    e.target.result.split('\n').forEach(l => {
      const mm = l.match(/^\[(ar|ti|al|by):([^\]]*)\]/i);
      if(mm){ const k=mm[1].toLowerCase(),v=mm[2].trim(); $('mt-meta-'+k) && ($('mt-meta-'+k).value=v); }
      const m = l.match(/^\[(\d+):(\d+\.\d+)\](.*)/);
      if(m) parsed.push({time:parseInt(m[1])*60+parseFloat(m[2]), text:m[3].trim()});
    });
    if(parsed.length){ lrcData=parsed; renderLines(); }
  };
  reader.readAsText(this.files[0]);
};

/* 创建歌词 */
$('mt-btn-create').onclick  = () => $('mt-modal-create').classList.add('open');
$('mt-create-cancel').onclick = () => $('mt-modal-create').classList.remove('open');
$('mt-create-ok').onclick = () => {
  const raw = $('mt-create-ta').value.trim();
  if(!raw) return;
  lrcData = raw.split('\n').map(t => ({time:null, text:t}));
  $('mt-modal-create').classList.remove('open');
  renderLines();
};

/* 下载歌词 */
$('mt-btn-dl').onclick = () => {
  const ar=$('mt-meta-ar').value, ti=$('mt-meta-ti').value,
        al=$('mt-meta-al').value, by=$('mt-meta-by').value;
  const lines=[];
  if(ar) lines.push('[ar:'+ar+']');
  if(ti) lines.push('[ti:'+ti+']');
  if(al) lines.push('[al:'+al+']');
  if(by) lines.push('[by:'+by+']');
  lrcData.forEach(l => { if(l.time!==null) lines.push(fmtLRC(l.time)+l.text); });
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain'}));
  a.download=(ti||'lyrics')+'.lrc';
  a.click();
};

/* Info modal */
$('mt-btn-info').onclick   = () => $('mt-modal-info').classList.add('open');
$('mt-info-ok').onclick    = () => $('mt-modal-info').classList.remove('open');
$('mt-info-cancel').onclick= () => $('mt-modal-info').classList.remove('open');

/* 偏移 */
$('mt-btn-offset').onclick = () => {
  const offset = parseFloat($('mt-offset').value)||0;
  if(!offset) return;
  lrcData.forEach(l => { if(l.time!==null) l.time=Math.max(0,l.time+offset); });
  $('mt-offset').value='0';
  renderLines();
};

/* 同步滚动 toggle */
$('mt-toggle').onclick = () => {
  autoScroll = !autoScroll;
  $('mt-toggle').classList.toggle('on', autoScroll);
  $('mt-toggle-lbl').textContent = autoScroll ? '开' : '关';
};

/* 新增歌词（末尾） */
$('mt-btn-addend').onclick = () => {
  lrcData.push({time:null, text:''});
  renderLines();
  setTimeout(()=>{ const inp=document.querySelectorAll('.mt-ly-inp'); if(inp.length) inp[inp.length-1].focus(); },50);
};

/* ── 渲染歌词列表 ── */
function renderLines(){
  const wrap = $('mt-lines');
  const st   = $('mt-lrc-center').scrollTop;
  wrap.innerHTML = '';
  lrcData.forEach((l, i) => {
    const row = document.createElement('div');
    row.className = 'mt-ly-row' + (i===curIdx?' playing':'');

    // 时间戳
    const ts = document.createElement('span');
    ts.className = 'mt-ly-time' + (l.time===null?' unstamped':'');
    ts.textContent = l.time!==null ? fmtLRC(l.time) : '[--:--.--]';
    if(l.time!==null) ts.onclick = () => { audio.currentTime=l.time; };
    row.appendChild(ts);

    // 打轴圆圈
    const sb = document.createElement('button');
    sb.className='mt-ly-stamp'; sb.textContent='○';
    sb.onclick = () => stampLine(i);
    row.appendChild(sb);

    // 文字输入
    const inp = document.createElement('input');
    inp.type='text'; inp.className='mt-ly-inp'; inp.value=l.text;
    inp.oninput = () => lrcData[i].text = inp.value;
    inp.onkeydown = e => {
      if(e.key==='Enter'){ e.preventDefault(); addAfter(i); }
      if(e.key==='Tab'){
        e.preventDefault(); stampLine(i);
        const all=document.querySelectorAll('.mt-ly-inp');
        if(all[i+1]) all[i+1].focus();
      }
    };
    row.appendChild(inp);

    // 悬停操作
    const act = document.createElement('div');
    act.className='mt-ly-actions';
    act.innerHTML=`<button class="mt-ly-act update" onclick="mtLRC.updateTime(${i})">更新时间</button>`
                 +`<button class="mt-ly-act add"    onclick="mtLRC.addAfter(${i})">新增歌词</button>`
                 +`<button class="mt-ly-act del"    onclick="mtLRC.delLine(${i})">删除歌词</button>`;
    row.appendChild(act);
    wrap.appendChild(row);
  });
  $('mt-lrc-center').scrollTop = st;
}

function stampLine(i){ lrcData[i].time=audio.currentTime; renderLines(); }
function addAfter(i){
  lrcData.splice(i+1,0,{time:null,text:''});
  renderLines();
  setTimeout(()=>{ const all=document.querySelectorAll('.mt-ly-inp'); if(all[i+1]) all[i+1].focus(); },50);
}
function delLine(i){ lrcData.splice(i,1); renderLines(); }
function updateTime(i){ lrcData[i].time=audio.currentTime; renderLines(); }

/* 暴露给 inline onclick 使用 */
window.mtLRC = { stampLine, addAfter, delLine, updateTime };

/* 键盘快捷键 */
document.addEventListener('keydown', e => {
  if(!$('mt-panel-lrc').classList.contains('on')) return;
  const tag = document.activeElement.tagName;
  if(tag==='INPUT'||tag==='TEXTAREA') return;
  if(e.key===' '){ e.preventDefault(); audio.paused?audio.play():audio.pause(); }
  if(e.key==='ArrowLeft'){ e.preventDefault(); audio.currentTime=Math.max(0,audio.currentTime-3); }
  if(e.key==='ArrowRight'){ e.preventDefault(); audio.currentTime=Math.min(audio.duration||0,audio.currentTime+3); }
});

/* 点击 modal 背景关闭 */
['mt-modal-info','mt-modal-create'].forEach(id => {
  $(id).addEventListener('click', e => { if(e.target===e.currentTarget) e.currentTarget.classList.remove('open'); });
});

renderLines();
})();
