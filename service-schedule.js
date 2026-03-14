/**
 * service-schedule.js  v7.0
 * CECP 服事安排 — 全页宽 · 响应式 · 深浅色主题
 * https://cye04.github.io/Cecp/service-schedule.js
 *
 * 用法:
 *   <div id="cecp-schedule" data-api="Apps_Script_URL"></div>
 *   <script src="https://cye04.github.io/Cecp/service-schedule.js"></script>
 */
(function () {
  'use strict';

  var EL = document.getElementById('cecp-schedule');
  if (!EL) return;
  var API = EL.dataset.api || '';

  /* ── 岗位行定义 ─────────────────────────────────────────────────────────── */
  var ROWS = [
    { key: 'leader',  label: '主领 / 司仪', type: 'badges' },
    { key: 'worship', label: '敬拜带领',    type: 'badges' },
    { key: 'band',    label: '乐手 / 司琴', type: 'badges' },
    { key: 'prayer',  label: '祷告带领',    type: 'badges' },
    { key: 'reading', label: '读　　经',    type: 'reading' },
    { key: 'note',    label: '证道讲员',    type: 'note'    },
  ];

  /* ── 聚会类型配色 (dark / light 各一套) ──────────────────────────────────── */
  var TYPE_DARK = {
    '主日下午': { hdr: '#0f2040', pill: '#1a3468', txt: '#78b4f0', col: '#0a1628' },
    '主日晚上': { hdr: '#20103c', pill: '#341a66', txt: '#b07ae8', col: '#150a28' },
    '青年团契': { hdr: '#0c2418', pill: '#1a4830', txt: '#5ec48a', col: '#081510' },
  };
  var TYPE_LIGHT = {
    '主日下午': { hdr: '#deeaf8', pill: '#3a6ab8', txt: '#ffffff', col: '#edf4fc' },
    '主日晚上': { hdr: '#e8ddf8', pill: '#6840b8', txt: '#ffffff', col: '#f2ecfc' },
    '青年团契': { hdr: '#d8f0e4', pill: '#2a7e50', txt: '#ffffff', col: '#ecf8f2' },
  };
  var TC_DEF_DARK  = { hdr: '#1a1a1a', pill: '#2a2a2a', txt: '#888', col: '#111' };
  var TC_DEF_LIGHT = { hdr: '#f0f0f0', pill: '#888',    txt: '#fff', col: '#fafafa' };

  /* ── 姓名 badge 颜色 (dark) ─────────────────────────────────────────────── */
  var PAL_DARK = [
    ['#0a2540','#5aaae0'],['#0a3018','#50c07a'],['#280c44','#9c68d8'],
    ['#380a1a','#cc607e'],['#08262e','#48b0be'],['#281a04','#c09030'],
    ['#0a1c38','#5078c0'],['#1c0a38','#8460c0'],['#0a2018','#58b080'],
    ['#2e1208','#b87858'],['#082028','#48a0b0'],['#1a0e3c','#7068c0'],
    ['#2c0c10','#b06060'],['#0c280c','#60b060'],['#0c0c2c','#6060b0'],
    ['#0e2c26','#50a898'],['#2c1c04','#a89050'],['#141030','#7070b0'],
  ];
  /* ── 姓名 badge 颜色 (light) ────────────────────────────────────────────── */
  var PAL_LIGHT = [
    ['#ddeef8','#1a5888'],['#d8f0e4','#1a5e38'],['#ede0f8','#5a2888'],
    ['#f8dde6','#882040'],['#d8eef0','#1a5868'],['#f8f0d8','#785010'],
    ['#dde4f8','#1a3878'],['#e8d8f8','#502080'],['#d8eee8','#1a5848'],
    ['#f8e8de','#784830'],['#d8e8f0','#1a4860'],['#e4ddf8','#402878'],
    ['#f8dede','#783040'],['#ddf8de','#207830'],['#deddf8','#282078'],
    ['#d8f0ec','#185858'],['#f0e8d8','#604828'],['#e0def8','#303078'],
  ];

  function badgeColor(name, dark) {
    if (!name) return null;
    var h = 0;
    for (var i = 0; i < name.length; i++) h = (Math.imul(31, h) + name.charCodeAt(i)) | 0;
    var pal = dark ? PAL_DARK : PAL_LIGHT;
    return pal[Math.abs(h) % pal.length];
  }

  /* ── 主题状态 ────────────────────────────────────────────────────────────── */
  var isDark = true;
  try {
    var saved = localStorage.getItem('cecp-theme');
    if (saved) isDark = (saved === 'dark');
    else isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch(e) { isDark = true; }

  /* ── CSS ────────────────────────────────────────────────────────────────── */
  if (!document.getElementById('_cs7css')) {
    var st = document.createElement('style');
    st.id = '_cs7css';
    st.textContent = `
/* ═══════════ 根容器 ═══════════ */
#cecp-schedule {
  font-family: "PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif;
  border-radius: 16px;
  overflow: hidden;
  box-sizing: border-box;
  width: 100%;
  transition: background .25s, color .25s;
}
#cecp-schedule * { box-sizing: border-box; margin: 0; padding: 0; }

/* ═══════════ 深色主题 ═══════════ */
#cecp-schedule.cs7-dark {
  background: #0e0e0e;
  color: #d0d0d0;
  --cs-bg:       #0e0e0e;
  --cs-bg2:      #141414;
  --cs-bg3:      #1a1a1a;
  --cs-border:   #1e1e1e;
  --cs-border2:  #252525;
  --cs-text:     #d0d0d0;
  --cs-text2:    #666;
  --cs-text3:    #3a3a3a;
  --cs-label:    #444;
  --cs-bar-bg:   #111;
  --cs-tab-bg:   #181818;
  --cs-tab-on:   #222;
  --cs-tab-txt:  #e0e0e0;
  --cs-empty:    #1e1e1e;
  --cs-note:     #7a6838;
  --cs-reading:  #3a6a3a;
}

/* ═══════════ 浅色主题 ═══════════ */
#cecp-schedule.cs7-light {
  background: #ffffff;
  color: #1a1a1a;
  --cs-bg:       #ffffff;
  --cs-bg2:      #f8f8f8;
  --cs-bg3:      #f0f0f0;
  --cs-border:   #e8e8e8;
  --cs-border2:  #d8d8d8;
  --cs-text:     #1a1a1a;
  --cs-text2:    #888;
  --cs-text3:    #cccccc;
  --cs-label:    #888;
  --cs-bar-bg:   #f5f5f5;
  --cs-tab-bg:   #ececec;
  --cs-tab-on:   #ffffff;
  --cs-tab-txt:  #1a1a1a;
  --cs-empty:    #d8d8d8;
  --cs-note:     #7a6030;
  --cs-reading:  #2a6a3a;
}

/* ═══════════ 顶部工具栏 ═══════════ */
.cs7-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px 14px;
  background: var(--cs-bar-bg);
  border-bottom: 1px solid var(--cs-border);
  flex-wrap: wrap;
}
.cs7-left  { display: flex; align-items: center; gap: 10px; flex: 1; flex-wrap: wrap; }
.cs7-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

/* 月份切换 */
.cs7-tabs {
  display: flex;
  gap: 2px;
  background: var(--cs-tab-bg);
  border-radius: 10px;
  padding: 3px;
}
.cs7-tab {
  padding: 6px 16px;
  font-size: 13px;
  color: var(--cs-text2);
  cursor: pointer;
  border-radius: 8px;
  border: none;
  background: none;
  font-family: inherit;
  white-space: nowrap;
  transition: all .15s;
  letter-spacing: .02em;
}
.cs7-tab.on { background: var(--cs-tab-on); color: var(--cs-tab-txt); font-weight: 600; }
.cs7-tab:hover:not(.on) { color: var(--cs-text); }

/* 主题切换按钮 */
.cs7-theme-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--cs-border2);
  background: var(--cs-bg2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all .2s;
  flex-shrink: 0;
}
.cs7-theme-btn:hover { background: var(--cs-bg3); transform: scale(1.1); }

/* 导出按钮 */
.cs7-export-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 12px;
  color: var(--cs-text2);
  border: 1px solid var(--cs-border2);
  border-radius: 8px;
  background: none;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  transition: all .15s;
}
.cs7-export-btn:hover { color: var(--cs-text); border-color: var(--cs-label); background: var(--cs-bg2); }
.cs7-export-btn:disabled { opacity: .35; cursor: not-allowed; }

/* 类型筛选 */
.cs7-filters {
  display: flex;
  gap: 6px;
  padding: 10px 20px;
  border-bottom: 1px solid var(--cs-border);
  flex-wrap: wrap;
  background: var(--cs-bar-bg);
}
.cs7-filter-btn {
  padding: 4px 14px;
  font-size: 12px;
  border-radius: 20px;
  cursor: pointer;
  border: 1px solid var(--cs-border2);
  background: none;
  font-family: inherit;
  color: var(--cs-label);
  transition: all .15s;
  letter-spacing: .03em;
}
.cs7-filter-btn.on { color: #fff; border-color: transparent; }
.cs7-filter-btn:hover:not(.on) { color: var(--cs-text); border-color: var(--cs-label); }

/* ═══════════ 桌面端：横向大表格 ═══════════ */
.cs7-scroll {
  overflow-x: auto;
  overflow-y: visible;
  background: var(--cs-bg);
}
.cs7-scroll::-webkit-scrollbar { height: 4px; }
.cs7-scroll::-webkit-scrollbar-track { background: var(--cs-bg); }
.cs7-scroll::-webkit-scrollbar-thumb { background: var(--cs-border2); border-radius: 2px; }

.cs7-table { border-collapse: collapse; width: 100%; }
.cs7-table th, .cs7-table td { border: 1px solid var(--cs-border); }

/* 左上角 */
.cs7-corner {
  background: var(--cs-bg2);
  position: sticky;
  left: 0;
  z-index: 3;
  padding: 14px 18px;
  font-size: 12px;
  color: var(--cs-text3);
  vertical-align: bottom;
  min-width: 90px;
  border-right: 2px solid var(--cs-border2);
}

/* 列标题（日期+类型） */
.cs7-col-h {
  text-align: center;
  vertical-align: bottom;
  padding: 0;
  min-width: 110px;
}
.cs7-col-date {
  display: block;
  padding: 14px 14px 5px;
  font-size: 26px;
  font-weight: 800;
  color: #f0f0f0;
  line-height: 1;
  letter-spacing: -.02em;
}
.cs7-light .cs7-col-date { color: #1a1a1a; }
.cs7-col-pill {
  display: block;
  padding: 4px 0 12px;
  font-size: 10px;
  letter-spacing: .06em;
  opacity: .85;
}

/* 行标题（左固定） */
.cs7-row-h {
  background: var(--cs-bg2);
  position: sticky;
  left: 0;
  z-index: 2;
  padding: 12px 18px;
  font-size: 12px;
  color: var(--cs-label);
  text-align: left;
  white-space: nowrap;
  border-right: 2px solid var(--cs-border2);
  letter-spacing: .04em;
  font-weight: 500;
}

/* 内容格 */
.cs7-cell {
  padding: 10px 12px;
  text-align: center;
  background: var(--cs-bg);
  vertical-align: middle;
  min-width: 110px;
  transition: background .1s;
}
.cs7-cell:hover { background: var(--cs-bg2); }

/* 读经格 */
.cs7-cell-rd {
  padding: 10px 12px;
  text-align: center;
  background: var(--cs-bg);
  vertical-align: middle;
  min-width: 110px;
}
.cs7-cell-rd:hover { background: var(--cs-bg2); }
.cs7-rd-ref {
  display: block;
  font-size: 10px;
  color: var(--cs-reading);
  margin-bottom: 3px;
  letter-spacing: .04em;
  font-weight: 600;
}

/* 证道格 */
.cs7-cell-note {
  padding: 10px 12px;
  text-align: center;
  background: var(--cs-bg);
  vertical-align: middle;
  min-width: 110px;
}
.cs7-cell-note:hover { background: var(--cs-bg2); }
.cs7-note-pfx {
  display: block;
  font-size: 10px;
  color: var(--cs-note);
  margin-bottom: 3px;
  letter-spacing: .03em;
  font-weight: 600;
}

/* ═══════════ 姓名 Badge ═══════════ */
.cs7-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
  margin: 2px;
  white-space: nowrap;
  cursor: pointer;
  transition: opacity .12s, transform .1s, box-shadow .12s;
  user-select: none;
  position: relative;
  letter-spacing: .02em;
}
.cs7-badge.lit    { transform: scale(1.12); box-shadow: 0 0 0 2px rgba(255,255,255,.28); z-index: 1; }
.cs7-badge.dim    { opacity: .15; }
.cs7-badge.locked { transform: scale(1.15); box-shadow: 0 0 0 2.5px rgba(255,255,255,.55); z-index: 1; }
.cs7-badge.ldim   { opacity: .1; }
.cs7-light .cs7-badge.lit    { box-shadow: 0 0 0 2px rgba(0,0,0,.22); }
.cs7-light .cs7-badge.locked { box-shadow: 0 0 0 2.5px rgba(0,0,0,.45); }

/* 空值 */
.cs7-empty { color: var(--cs-text3); font-size: 16px; }

/* ═══════════ 移动端：卡片堆叠 ═══════════ */
.cs7-cards { display: none; flex-direction: column; gap: 12px; padding: 16px; }

.cs7-card {
  border: 1px solid var(--cs-border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--cs-bg);
}
.cs7-card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--cs-border);
}
.cs7-card-date {
  font-size: 28px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -.02em;
}
.cs7-card-type-pill {
  padding: 3px 10px;
  border-radius: 16px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .04em;
  color: #fff;
}
.cs7-card-body { padding: 10px 0; }
.cs7-card-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 7px 16px;
  border-bottom: 1px solid var(--cs-border);
}
.cs7-card-row:last-child { border-bottom: none; }
.cs7-card-label {
  font-size: 11px;
  color: var(--cs-label);
  white-space: nowrap;
  min-width: 68px;
  padding-top: 5px;
  letter-spacing: .03em;
  font-weight: 500;
}
.cs7-card-value {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
}

/* ═══════════ 响应式切换 ═══════════ */
@media (max-width: 700px) {
  .cs7-scroll  { display: none; }
  .cs7-cards   { display: flex; }
  .cs7-tab { padding: 5px 10px; font-size: 12px; }
  .cs7-bar { padding: 12px 14px 10px; gap: 8px; }
}
@media (min-width: 701px) {
  .cs7-scroll  { display: block; }
  .cs7-cards   { display: none; }
}

/* ═══════════ 加载 / 错误 ═══════════ */
.cs7-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 56px 24px;
  color: var(--cs-text2);
  font-size: 15px;
}
.cs7-spinner {
  width: 20px; height: 20px;
  border: 2px solid var(--cs-border2);
  border-top-color: var(--cs-label);
  border-radius: 50%;
  animation: cs7spin .7s linear infinite;
  flex-shrink: 0;
}
@keyframes cs7spin { to { transform: rotate(360deg); } }
.cs7-nodata { padding: 56px; text-align: center; color: var(--cs-text3); font-size: 15px; }
.cs7-err { padding: 24px; color: #a04040; font-size: 14px; line-height: 1.8; }
`;
    document.head.appendChild(st);
  }

  /* ── 应用主题 ────────────────────────────────────────────────────────────── */
  function applyTheme() {
    EL.classList.toggle('cs7-dark',  isDark);
    EL.classList.toggle('cs7-light', !isDark);
  }
  applyTheme();

  /* ── 加载状态 ────────────────────────────────────────────────────────────── */
  EL.innerHTML = '<div class="cs7-loading"><div class="cs7-spinner"></div>加载服事安排…</div>';

  /* ── 拉取数据 ─────────────────────────────────────────────────────────────── */
  if (!API || API === 'DEMO') { setTimeout(function () { boot(demo()); }, 200); return; }

  fetch(API + '?action=all')
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (res) {
      if (!res.ok) throw new Error(res.error || '脚本错误');
      boot(res.data);
    })
    .catch(function (e) {
      EL.innerHTML = '<div class="cs7-err">⚠ ' + esc(e.message) +
        '<br><small style="opacity:.6">请确认 Apps Script 已部署最新版本</small></div>';
    });

  /* ── 高亮状态 ────────────────────────────────────────────────────────────── */
  var locked = null;

  /* ── 初始化 ──────────────────────────────────────────────────────────────── */
  function boot(rows) {
    if (!rows || !rows.length) { EL.innerHTML = '<div class="cs7-nodata">暂无服事安排</div>'; return; }

    var months = {};
    rows.forEach(function (r) {
      var mk = r.date ? r.date.slice(0, 7) : '';
      if (!mk) return;
      if (!months[mk]) months[mk] = [];
      months[mk].push(r);
    });
    var keys = Object.keys(months).sort();
    if (!keys.length) return;

    var now = new Date();
    var nowKey = now.getFullYear() + '-' + pad(now.getMonth() + 1);
    var idx = keys.indexOf(nowKey);
    if (idx < 0) {
      for (var i = 0; i < keys.length; i++) { if (keys[i] >= nowKey) { idx = i; break; } }
      if (idx < 0) idx = keys.length - 1;
    }

    var allTypes = [];
    rows.forEach(function (r) { if (r.type && allTypes.indexOf(r.type) < 0) allTypes.push(r.type); });
    var tOrd = {'主日下午':0,'主日晚上':1,'青年团契':2};
    allTypes.sort(function (a, b) { return (tOrd[a]||9) - (tOrd[b]||9); });

    var activeTypes = allTypes.slice();
    render(idx);

    function render(i) {
      locked = null;
      var key  = keys[i];
      var data = months[key];
      var svcs = data.filter(function (s) { return activeTypes.indexOf(s.type) >= 0; });

      /* 月份导航 */
      var tabsHtml = '';
      if (i > 0)               tabsHtml += '<button class="cs7-tab" id="csPrev">← ' + mlabel(keys[i-1]) + '</button>';
      tabsHtml +=                           '<button class="cs7-tab on">' + mlabel(key) + '</button>';
      if (i < keys.length - 1) tabsHtml += '<button class="cs7-tab" id="csNext">' + mlabel(keys[i+1]) + ' →</button>';

      /* 类型筛选 */
      var fHtml = allTypes.map(function (tp) {
        var tc = tc4(tp);
        var on = activeTypes.indexOf(tp) >= 0;
        return '<button class="cs7-filter-btn'+(on?' on':'')+'" data-type="'+esc(tp)+'"'
          +(on?' style="background:'+tc.pill+'"':'')+'>'+esc(tp)+'</button>';
      }).join('');

      /* ── 桌面表格 ── */
      var hdr = '<tr><th class="cs7-corner">服事</th>';
      svcs.forEach(function (s) {
        var tc = tc4(s.type);
        hdr += '<th class="cs7-col-h" style="background:'+tc.hdr+'">'
          + '<span class="cs7-col-date">'+dayStr(s.date)+'</span>'
          + '<span class="cs7-col-pill" style="color:'+tc.txt+'">'+esc(s.type)+'</span>'
          + '</th>';
      });
      hdr += '</tr>';

      var tableBody = ROWS.map(function (row) {
        var tr = '<tr><td class="cs7-row-h">'+row.label+'</td>';
        svcs.forEach(function (s) { tr += renderTd(row, s[row.key] || ''); });
        return tr + '</tr>';
      }).join('');

      /* ── 移动卡片 ── */
      var cardsHtml = svcs.map(function (s) {
        var tc = tc4(s.type);
        var cardRows = ROWS.map(function (row) {
          var val = s[row.key] || '';
          var inner = renderValue(row, val);
          return '<div class="cs7-card-row">'
            + '<span class="cs7-card-label">'+row.label+'</span>'
            + '<div class="cs7-card-value">'+inner+'</div>'
            + '</div>';
        }).join('');
        return '<div class="cs7-card">'
          + '<div class="cs7-card-head" style="background:'+tc.hdr+'">'
            + '<span class="cs7-card-date" style="color:'+(isDark?'#f0f0f0':'#1a1a1a')+'">'+dayStr(s.date)+'</span>'
            + '<span class="cs7-card-type-pill" style="background:'+tc.pill+'">'+esc(s.type)+'</span>'
          + '</div>'
          + '<div class="cs7-card-body">'+cardRows+'</div>'
        + '</div>';
      }).join('');

      EL.innerHTML =
        '<div class="cs7-bar">'
          + '<div class="cs7-left">'
            + '<div class="cs7-tabs">'+tabsHtml+'</div>'
          + '</div>'
          + '<div class="cs7-right">'
            + '<button class="cs7-theme-btn" id="csTheme" title="切换主题">'+(isDark?'☀️':'🌙')+'</button>'
            + '<button class="cs7-export-btn" id="csExp">'+svgDown()+'导出图片</button>'
          + '</div>'
        + '</div>'
        + (allTypes.length > 1 ? '<div class="cs7-filters" id="csFilters">'+fHtml+'</div>' : '')
        + '<div class="cs7-scroll" id="csScroll">'
          + '<table class="cs7-table" id="csTable"><thead>'+hdr+'</thead><tbody>'+tableBody+'</tbody></table>'
        + '</div>'
        + '<div class="cs7-cards" id="csCards">'+cardsHtml+'</div>';

      /* 事件绑定 */
      var prev   = EL.querySelector('#csPrev');
      var next   = EL.querySelector('#csNext');
      var exp    = EL.querySelector('#csExp');
      var themeB = EL.querySelector('#csTheme');
      var fbox   = EL.querySelector('#csFilters');

      if (prev)   prev.addEventListener('click', function () { render(i-1); });
      if (next)   next.addEventListener('click', function () { render(i+1); });
      if (exp)    exp.addEventListener('click',  function () { exportPng(key); });
      if (themeB) themeB.addEventListener('click', function () {
        isDark = !isDark;
        try { localStorage.setItem('cecp-theme', isDark ? 'dark' : 'light'); } catch(e){}
        applyTheme();
        render(i);   // 重新渲染颜色
      });
      if (fbox) fbox.querySelectorAll('.cs7-filter-btn').forEach(function (b) {
        b.addEventListener('click', function () {
          var tp = this.dataset.type;
          var ix = activeTypes.indexOf(tp);
          if (ix >= 0) { if (activeTypes.length > 1) activeTypes.splice(ix, 1); }
          else activeTypes.push(tp);
          render(i);
        });
      });

      bindHighlight();
    }
  }

  /* ── 渲染单元格 td (桌面) ─────────────────────────────────────────────────── */
  function renderTd(row, val) {
    if (row.type === 'reading') {
      var rd = parseReading(val);
      if (!rd || !rd.name) return '<td class="cs7-cell-rd"><span class="cs7-empty">—</span></td>';
      return '<td class="cs7-cell-rd">'
        + '<span class="cs7-rd-ref">'+esc(rd.ref)+'</span>'
        + mkBadge(rd.name)
        + '</td>';
    }
    if (row.type === 'note') {
      if (!val) return '<td class="cs7-cell-note"><span class="cs7-empty">—</span></td>';
      var m = val.match(/^(证道[：:]\s*)(.+)$/);
      if (m) return '<td class="cs7-cell-note"><span class="cs7-note-pfx">'+esc(m[1])+'</span>'+mkBadge(m[2])+'</td>';
      return '<td class="cs7-cell-note">'+mkBadge(val)+'</td>';
    }
    if (!val) return '<td class="cs7-cell"><span class="cs7-empty">—</span></td>';
    var names = val.split(/[\/\n]/).map(function (n) { return n.trim(); }).filter(Boolean);
    return '<td class="cs7-cell">'+names.map(mkBadge).join('')+'</td>';
  }

  /* ── 渲染单元格值 (移动卡片复用) ──────────────────────────────────────────── */
  function renderValue(row, val) {
    if (row.type === 'reading') {
      var rd = parseReading(val);
      if (!rd || !rd.name) return '<span class="cs7-empty">—</span>';
      return '<span class="cs7-rd-ref" style="margin-right:4px">'+esc(rd.ref)+'</span>'+mkBadge(rd.name);
    }
    if (row.type === 'note') {
      if (!val) return '<span class="cs7-empty">—</span>';
      var m = val.match(/^(证道[：:]\s*)(.+)$/);
      if (m) return '<span class="cs7-note-pfx" style="margin-right:4px">'+esc(m[1])+'</span>'+mkBadge(m[2]);
      return mkBadge(val);
    }
    if (!val) return '<span class="cs7-empty">—</span>';
    return val.split(/[\/\n]/).map(function (n) { return n.trim(); }).filter(Boolean).map(mkBadge).join('');
  }

  /* ── Badge 工厂 ───────────────────────────────────────────────────────────── */
  function mkBadge(name) {
    if (!name) return '';
    var c = badgeColor(name, isDark);
    if (!c) return '<span class="cs7-badge" style="background:var(--cs-bg2);color:var(--cs-label)">'+esc(name)+'</span>';
    return '<span class="cs7-badge" data-n="'+esc(name)+'" style="background:'+c[0]+';color:'+c[1]+'">'+esc(name)+'</span>';
  }

  /* ── 高亮逻辑 ─────────────────────────────────────────────────────────────── */
  function allBadges() { return EL.querySelectorAll('.cs7-badge'); }

  function applyHL(name, isLock) {
    allBadges().forEach(function (b) {
      var n = b.dataset.n || b.textContent;
      b.classList.remove('lit','dim','locked','ldim');
      if (n === name) b.classList.add(isLock ? 'locked' : 'lit');
      else            b.classList.add(isLock ? 'ldim'   : 'dim');
    });
  }
  function clearHL() {
    allBadges().forEach(function (b) { b.classList.remove('lit','dim','locked','ldim'); });
  }

  function bindHighlight() {
    allBadges().forEach(function (b) {
      var name = b.dataset.n || b.textContent;
      b.addEventListener('mouseenter', function () { if (!locked) applyHL(name, false); });
      b.addEventListener('mouseleave', function () { if (!locked) clearHL(); });
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        if (locked === name) { locked = null; clearHL(); }
        else { locked = name; applyHL(name, true); }
      });
    });
    EL.addEventListener('click', function () { if (locked) { locked = null; clearHL(); } });
  }

  /* ── 导出 PNG ─────────────────────────────────────────────────────────────── */
  function exportPng(key) {
    var btn   = EL.querySelector('#csExp');
    var wrap  = EL.querySelector('#csScroll');
    var table = EL.querySelector('#csTable');
    if (!btn || !table) return;
    btn.disabled = true; btn.textContent = '处理中…';

    function run() {
      var ov = wrap.style.overflow; wrap.style.overflow = 'visible';
      window.html2canvas(table, { backgroundColor: isDark ? '#0e0e0e' : '#ffffff', scale: 2, useCORS: true, logging: false })
        .then(function (c) {
          wrap.style.overflow = ov;
          var a = document.createElement('a');
          a.download = '服事安排_'+key+'.png'; a.href = c.toDataURL('image/png'); a.click();
          btn.innerHTML = svgDown()+'导出图片'; btn.disabled = false;
        })
        .catch(function () { wrap.style.overflow = ov; btn.textContent = '导出失败'; btn.disabled = false; });
    }

    if (!window.html2canvas) {
      var sc = document.createElement('script');
      sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      sc.onload = run; document.head.appendChild(sc);
    } else { run(); }
  }

  /* ── 工具 ─────────────────────────────────────────────────────────────────── */
  function tc4(type) {
    return (isDark ? TYPE_DARK : TYPE_LIGHT)[type] || (isDark ? TC_DEF_DARK : TC_DEF_LIGHT);
  }
  function parseReading(v) {
    if (!v) return null;
    var m = v.match(/^(诗\d+)\s+(.+)$/);
    return m ? { ref: m[1], name: m[2].trim() } : { ref: v, name: '' };
  }
  function dayStr(s) { var m = s && s.match(/\d{4}[-\/]\d{1,2}[-\/](\d{1,2})/); return m ? +m[1]+'日' : s; }
  function mlabel(k) { var p = k.split('-'); return p[0]+'年'+parseInt(p[1],10)+'月'; }
  function pad(n) { return n < 10 ? '0'+n : ''+n; }
  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function svgDown() {
    return '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M7 1v8M4 6l3 3 3-3M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1"/></svg>';
  }

  /* ── Demo 数据 ────────────────────────────────────────────────────────────── */
  function demo() {
    return [
      {date:'2026-03-01',type:'主日下午',leader:'金展',worship:'胡娜',band:'杨亦佳',prayer:'林文宝',reading:'诗9 金Silvia',note:'证道：金美德'},
      {date:'2026-03-01',type:'主日晚上',leader:'林文宝',worship:'翁撒该/杨雪克/叶春叶',band:'金紫涵/黄天丽',prayer:'戴献和',reading:'',note:'证道：金美德'},
      {date:'2026-03-08',type:'主日下午',leader:'林文宝',worship:'吴超凡',band:'青少年',prayer:'翁撒该',reading:'诗10 季轩',note:'证道：吴恬恬'},
      {date:'2026-03-08',type:'主日晚上',leader:'吴超凡',worship:'吴超凡及青少年',band:'青少年',prayer:'林文宝/董希昆',reading:'',note:'证道：彭永剑'},
      {date:'2026-03-08',type:'青年团契',leader:'',worship:'吴超凡',band:'',prayer:'',reading:'',note:''},
      {date:'2026-03-15',type:'主日下午',leader:'彭永剑',worship:'孙琴乐',band:'季轩/吴以勒',prayer:'徐永西',reading:'诗11 何若诗',note:'证道：陈金东'},
      {date:'2026-03-15',type:'主日晚上',leader:'金展',worship:'胡娜/林文宝',band:'翁撒该',prayer:'徐永西',reading:'',note:'证道：戴先和'},
      {date:'2026-03-15',type:'青年团契',leader:'',worship:'吴恬恬',band:'',prayer:'',reading:'',note:''},
      {date:'2026-03-22',type:'主日下午',leader:'戴献和',worship:'王皞阳',band:'黄天丽/金丽莎',prayer:'胡蓉',reading:'诗12 何心如',note:'证道：潘隆正'},
      {date:'2026-03-22',type:'主日晚上',leader:'彭永剑/王皞阳',worship:'叶春叶/董希昆',band:'徐博杰/黄天丽',prayer:'金展',reading:'',note:'证道：潘隆正'},
      {date:'2026-03-22',type:'青年团契',leader:'',worship:'意语敬拜',band:'',prayer:'',reading:'',note:''},
      {date:'2026-03-29',type:'主日下午',leader:'王皞阳',worship:'吴恬恬',band:'谢安/金Silvia',prayer:'戴献和',reading:'诗13 林颖慧',note:'证道：潘庆峰'},
      {date:'2026-03-29',type:'主日晚上',leader:'翁撒该',worship:'金梦熙',band:'胡娜',prayer:'林文宝',reading:'',note:'证道：潘庆峰'},
      {date:'2026-03-29',type:'青年团契',leader:'',worship:'潘庆峰',band:'',prayer:'',reading:'',note:''},
    ];
  }

})();
