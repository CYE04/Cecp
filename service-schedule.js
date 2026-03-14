/**
 * service-schedule.js  v8.0
 * CECP 服事安排 — 日期纵排 · 岗位横排 · 深浅色主题
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

  /* ── 岗位列定义 ─────────────────────────────────────────────────────────── */
  var COLS = [
    { key: 'leader',  label: '主领 / 司仪', type: 'badges'  },
    { key: 'worship', label: '敬拜带领',    type: 'badges'  },
    { key: 'band',    label: '乐手 / 司琴', type: 'badges'  },
    { key: 'prayer',  label: '祷告带领',    type: 'badges'  },
    { key: 'reading', label: '读　　经',    type: 'reading' },
    { key: 'note',    label: '证道讲员',    type: 'note'    },
  ];

  /* ── 聚会类型配色 ────────────────────────────────────────────────────────── */
  var TYPE_DARK = {
    '主日下午': { bg: '#0c1a38', border: '#1a3468', pill_bg: '#1a3468', pill_txt: '#78b4f0', row_alt: '#0e1f42' },
    '主日晚上': { bg: '#180e34', border: '#341a66', pill_bg: '#341a66', pill_txt: '#b07ae8', row_alt: '#1c1240' },
    '青年团契': { bg: '#081e14', border: '#1a4830', pill_bg: '#1a4830', pill_txt: '#5ec48a', row_alt: '#0a2418' },
  };
  var TYPE_LIGHT = {
    '主日下午': { bg: '#edf4fc', border: '#b8d4f0', pill_bg: '#2a5ea8', pill_txt: '#ffffff', row_alt: '#ddeaf8' },
    '主日晚上': { bg: '#f0ebfc', border: '#c8a8f0', pill_bg: '#5838a8', pill_txt: '#ffffff', row_alt: '#e8def8' },
    '青年团契': { bg: '#ebf8f0', border: '#90d8b0', pill_bg: '#1e6e42', pill_txt: '#ffffff', row_alt: '#ddf2e8' },
  };
  var TC_DEF_D = { bg: '#111', border: '#222', pill_bg: '#2a2a2a', pill_txt: '#888', row_alt: '#141414' };
  var TC_DEF_L = { bg: '#fafafa', border: '#ddd', pill_bg: '#888', pill_txt: '#fff', row_alt: '#f4f4f4' };

  /* ── Badge 颜色板 ────────────────────────────────────────────────────────── */
  var PAL_D = [
    ['#0a2540','#5aaae0'],['#0a3018','#50c07a'],['#280c44','#9c68d8'],
    ['#380a1a','#cc607e'],['#08262e','#48b0be'],['#281a04','#c09030'],
    ['#0a1c38','#5078c0'],['#1c0a38','#8460c0'],['#0a2018','#58b080'],
    ['#2e1208','#b87858'],['#082028','#48a0b0'],['#1a0e3c','#7068c0'],
    ['#2c0c10','#b06060'],['#0c280c','#60b060'],['#0c0c2c','#6060b0'],
    ['#0e2c26','#50a898'],['#2c1c04','#a89050'],['#141030','#7070b0'],
  ];
  var PAL_L = [
    ['#ddeef8','#1a5888'],['#d8f0e4','#1a5e38'],['#ede0f8','#5a2888'],
    ['#f8dde6','#882040'],['#d8eef0','#1a5868'],['#f8f0d8','#785010'],
    ['#dde4f8','#1a3878'],['#e8d8f8','#502080'],['#d8eee8','#1a5848'],
    ['#f8e8de','#784830'],['#d8e8f0','#1a4860'],['#e4ddf8','#402878'],
    ['#f8dede','#783040'],['#ddf8de','#207830'],['#deddf8','#282078'],
    ['#d8f0ec','#185858'],['#f0e8d8','#604828'],['#e0def8','#303078'],
  ];

  function badgeColor(name) {
    if (!name) return null;
    var h = 0;
    for (var i = 0; i < name.length; i++) h = (Math.imul(31, h) + name.charCodeAt(i)) | 0;
    var pal = isDark ? PAL_D : PAL_L;
    return pal[Math.abs(h) % pal.length];
  }

  /* ── 主题 ────────────────────────────────────────────────────────────────── */
  var isDark = true;
  try {
    var saved = localStorage.getItem('cecp-theme');
    if (saved) isDark = saved === 'dark';
    else isDark = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  } catch(e) {}

  /* ── CSS ─────────────────────────────────────────────────────────────────── */
  if (!document.getElementById('_cs8css')) {
    var st = document.createElement('style');
    st.id = '_cs8css';
    st.textContent = `
#cecp-schedule {
  font-family: "PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif;
  border-radius: 16px;
  overflow: hidden;
  box-sizing: border-box;
  width: 100%;
  transition: background .25s, color .25s;
}
#cecp-schedule * { box-sizing: border-box; margin: 0; padding: 0; }

/* ── 主题变量 ── */
#cecp-schedule.cs8-dark {
  background: #0e0e0e; color: #d0d0d0;
  --bg:     #0e0e0e; --bg2: #141414; --bg3: #1c1c1c;
  --border: #1e1e1e; --border2: #282828;
  --text:   #d0d0d0; --text2: #555; --text3: #2a2a2a;
  --label:  #444;
  --hdr-bg: #111; --tab-bg: #181818; --tab-on: #242424; --tab-txt: #e0e0e0;
  --rd-ref: #3a6a3a; --note-pfx: #7a6838;
  --empty:  #1e1e1e;
}
#cecp-schedule.cs8-light {
  background: #fff; color: #1a1a1a;
  --bg:     #fff;  --bg2: #f8f8f8; --bg3: #efefef;
  --border: #e8e8e8; --border2: #d0d0d0;
  --text:   #1a1a1a; --text2: #999; --text3: #ccc;
  --label:  #888;
  --hdr-bg: #f5f5f5; --tab-bg: #ececec; --tab-on: #fff; --tab-txt: #1a1a1a;
  --rd-ref: #2a6a3a; --note-pfx: #7a6030;
  --empty:  #d0d0d0;
}

/* ── 顶栏 ── */
.cs8-bar {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 20px 12px;
  background: var(--hdr-bg);
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}
.cs8-tabs {
  display: flex; gap: 2px;
  background: var(--tab-bg); border-radius: 10px; padding: 3px;
}
.cs8-tab {
  padding: 6px 16px; font-size: 13px; color: var(--text2);
  cursor: pointer; border-radius: 8px; border: none; background: none;
  font-family: inherit; white-space: nowrap; transition: all .15s; letter-spacing: .02em;
}
.cs8-tab.on { background: var(--tab-on); color: var(--tab-txt); font-weight: 600; }
.cs8-tab:hover:not(.on) { color: var(--text); }

.cs8-right { margin-left: auto; display: flex; align-items: center; gap: 8px; }

.cs8-theme {
  width: 34px; height: 34px; border-radius: 50%;
  border: 1px solid var(--border2); background: var(--bg2);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 15px; transition: all .2s; flex-shrink: 0;
}
.cs8-theme:hover { background: var(--bg3); transform: scale(1.1) rotate(15deg); }

.cs8-export {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 13px; font-size: 12px; color: var(--text2);
  border: 1px solid var(--border2); border-radius: 8px; background: none;
  cursor: pointer; font-family: inherit; white-space: nowrap; transition: all .15s;
}
.cs8-export:hover { color: var(--text); border-color: var(--label); background: var(--bg2); }
.cs8-export:disabled { opacity: .35; cursor: not-allowed; }

/* ── 类型筛选 ── */
.cs8-filters {
  display: flex; gap: 6px; padding: 9px 20px;
  border-bottom: 1px solid var(--border);
  background: var(--hdr-bg); flex-wrap: wrap;
}
.cs8-filter {
  padding: 4px 14px; font-size: 11px; border-radius: 20px; cursor: pointer;
  border: 1px solid var(--border2); background: none;
  font-family: inherit; color: var(--label); transition: all .15s; letter-spacing: .03em;
}
.cs8-filter.on { color: #fff !important; border-color: transparent; }
.cs8-filter:hover:not(.on) { color: var(--text); border-color: var(--label); }

/* ── 主表格 ── */
.cs8-table-wrap {
  width: 100%; overflow-x: hidden; overflow-y: visible;
}
.cs8-table {
  border-collapse: collapse; width: 100%;
  table-layout: fixed;
}
.cs8-table th, .cs8-table td {
  border-bottom: 1px solid var(--border);
  border-right: 1px solid var(--border);
}
.cs8-table tr th:last-child,
.cs8-table tr td:last-child { border-right: none; }

/* 列标题（岗位）*/
.cs8-col-hdr {
  background: var(--hdr-bg);
  padding: 12px 14px;
  font-size: 12px;
  font-weight: 600;
  color: var(--label);
  text-align: center;
  letter-spacing: .04em;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 2;
  border-bottom: 2px solid var(--border2) !important;
}
/* 左上角 */
.cs8-corner {
  background: var(--hdr-bg);
  padding: 12px 14px;
  font-size: 11px;
  color: var(--text3);
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 3;
  border-bottom: 2px solid var(--border2) !important;
  border-right: 2px solid var(--border2) !important;
}

/* 日期+类型格（左侧锚定列）*/
.cs8-row-info {
  padding: 12px 14px;
  vertical-align: middle;
  text-align: left;
  border-right: 2px solid var(--border2) !important;
  white-space: nowrap;
  min-width: 130px;
  width: 130px;
}
.cs8-date-big {
  font-size: 22px; font-weight: 800;
  line-height: 1; letter-spacing: -.01em;
  display: block;
}
.cs8-date-sub {
  font-size: 10px; color: var(--text2);
  margin-top: 2px; display: block; letter-spacing: .03em;
}
.cs8-type-pill {
  display: inline-block;
  margin-top: 6px;
  padding: 3px 10px;
  border-radius: 14px;
  font-size: 10px; font-weight: 600;
  letter-spacing: .04em; color: #fff;
}

/* 内容格 */
.cs8-cell {
  padding: 11px 12px;
  text-align: center;
  vertical-align: middle;
  transition: background .1s;
}
.cs8-cell:hover { filter: brightness(1.06); }

/* 读经格 */
.cs8-rd-ref {
  display: block; font-size: 10px;
  color: var(--rd-ref); margin-bottom: 3px;
  letter-spacing: .04em; font-weight: 600;
}
/* 证道前缀 */
.cs8-note-pfx {
  display: block; font-size: 10px;
  color: var(--note-pfx); margin-bottom: 3px;
  letter-spacing: .03em; font-weight: 600;
}

/* Badge */
.cs8-badge {
  display: inline-block; padding: 4px 10px;
  border-radius: 20px; font-size: 12px; font-weight: 600;
  line-height: 1.4; margin: 2px; white-space: nowrap;
  cursor: pointer; letter-spacing: .02em;
  transition: opacity .12s, transform .1s, box-shadow .12s;
  user-select: none; position: relative;
}
.cs8-badge.lit    { transform: scale(1.12); box-shadow: 0 0 0 2px rgba(255,255,255,.3);  z-index: 1; }
.cs8-badge.dim    { opacity: .14; }
.cs8-badge.locked { transform: scale(1.15); box-shadow: 0 0 0 2.5px rgba(255,255,255,.55); z-index: 1; }
.cs8-badge.ldim   { opacity: .1; }
.cs8-light .cs8-badge.lit    { box-shadow: 0 0 0 2px rgba(0,0,0,.25); }
.cs8-light .cs8-badge.locked { box-shadow: 0 0 0 2.5px rgba(0,0,0,.45); }

/* 空值 */
.cs8-empty { color: var(--empty); font-size: 16px; }

/* 月份分隔标题 */
.cs8-month-sep td {
  padding: 8px 16px;
  font-size: 11px; font-weight: 700;
  letter-spacing: .08em;
  color: var(--text2);
  border-bottom: 1px solid var(--border2) !important;
  border-right: none !important;
  text-transform: uppercase;
}

/* 加载 / 错误 */
.cs8-loading { display: flex; align-items: center; gap: 12px; padding: 56px 24px; color: var(--text2); font-size: 15px; }
.cs8-spinner { width: 20px; height: 20px; border: 2px solid var(--border2); border-top-color: var(--label); border-radius: 50%; animation: cs8spin .7s linear infinite; flex-shrink: 0; }
@keyframes cs8spin { to { transform: rotate(360deg); } }
.cs8-nodata { padding: 56px; text-align: center; color: var(--text3); font-size: 15px; }
.cs8-err { padding: 24px; color: #a04040; font-size: 14px; line-height: 1.8; }

/* 移动端列宽收窄 */
@media (max-width: 600px) {
  .cs8-col-hdr, .cs8-cell, .cs8-rd-ref, .cs8-note-pfx { padding: 8px 8px; font-size: 11px; }
  .cs8-badge { font-size: 11px; padding: 3px 7px; }
  .cs8-date-big { font-size: 18px; }
  .cs8-row-info { min-width: 100px; width: 100px; padding: 10px 10px; }
  .cs8-bar { padding: 10px 14px 9px; }
  .cs8-tab { padding: 5px 10px; font-size: 12px; }
}
`;
    document.head.appendChild(st);
  }

  function applyTheme() {
    EL.classList.toggle('cs8-dark',  isDark);
    EL.classList.toggle('cs8-light', !isDark);
  }
  applyTheme();

  /* ── 加载 ─────────────────────────────────────────────────────────────────── */
  EL.innerHTML = '<div class="cs8-loading"><div class="cs8-spinner"></div>加载服事安排…</div>';

  if (!API || API === 'DEMO') { setTimeout(function () { boot(demo()); }, 200); return; }

  fetch(API + '?action=all')
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (res) {
      if (!res.ok) throw new Error(res.error || '脚本错误');
      boot(res.data);
    })
    .catch(function (e) {
      EL.innerHTML = '<div class="cs8-err">⚠ ' + esc(e.message)
        + '<br><small style="opacity:.6">请确认 Apps Script 已部署最新版本</small></div>';
    });

  /* ── 高亮 ─────────────────────────────────────────────────────────────────── */
  var locked = null;

  /* ── 初始化 ───────────────────────────────────────────────────────────────── */
  function boot(rows) {
    if (!rows || !rows.length) { EL.innerHTML = '<div class="cs8-nodata">暂无服事安排</div>'; return; }

    // 按月分组
    var months = {};
    rows.forEach(function (r) {
      var mk = r.date ? r.date.slice(0, 7) : '';
      if (!mk) return;
      if (!months[mk]) months[mk] = [];
      months[mk].push(r);
    });
    var keys = Object.keys(months).sort();
    if (!keys.length) return;

    // 当前月
    var now = new Date();
    var nowKey = now.getFullYear() + '-' + pad(now.getMonth() + 1);
    var curIdx = keys.indexOf(nowKey);
    if (curIdx < 0) {
      for (var i = 0; i < keys.length; i++) { if (keys[i] >= nowKey) { curIdx = i; break; } }
      if (curIdx < 0) curIdx = keys.length - 1;
    }

    // 所有类型
    var allTypes = [];
    rows.forEach(function (r) { if (r.type && allTypes.indexOf(r.type) < 0) allTypes.push(r.type); });
    var tOrd = {'主日下午':0,'主日晚上':1,'青年团契':2};
    allTypes.sort(function (a, b) { return (tOrd[a]||9) - (tOrd[b]||9); });

    var activeTypes = allTypes.slice();
    render(curIdx);

    function render(i) {
      locked = null;
      var key = keys[i];

      // ── 月份切换 tabs ──
      var tabsHtml = '';
      if (i > 0)               tabsHtml += '<button class="cs8-tab" id="csPrev">← ' + mlabel(keys[i-1]) + '</button>';
      tabsHtml +=                           '<button class="cs8-tab on">' + mlabel(key) + '</button>';
      if (i < keys.length - 1) tabsHtml += '<button class="cs8-tab" id="csNext">' + mlabel(keys[i+1]) + ' →</button>';

      // ── 类型筛选 ──
      var fHtml = allTypes.map(function (tp) {
        var tc = getTc(tp);
        var on = activeTypes.indexOf(tp) >= 0;
        return '<button class="cs8-filter'+(on?' on':'')+'" data-type="'+esc(tp)+'"'
          +(on?' style="background:'+tc.pill_bg+'"':'')+'>'+esc(tp)+'</button>';
      }).join('');

      // ── 表格列标题 ──
      var colHeaders = '<th class="cs8-corner">日期</th>'
        + COLS.map(function (c) {
            return '<th class="cs8-col-hdr">'+c.label+'</th>';
          }).join('');

      // ── 表格行：每场聚会一行 ──
      // 排序：日期 → 下午→晚上→青年
      var svcs = months[key].filter(function (s) { return activeTypes.indexOf(s.type) >= 0; });
      svcs.sort(function (a, b) {
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        return (tOrd[a.type]||9) - (tOrd[b.type]||9);
      });

      // 按日期分组，让相邻同日行视觉分开
      var bodyHtml = '';
      var prevDate = '';
      svcs.forEach(function (s, idx) {
        var tc = getTc(s.type);
        var isNewDate = (s.date !== prevDate);
        prevDate = s.date;

        // 行背景：同类型奇偶交替
        var rowBg = (idx % 2 === 0) ? tc.bg : tc.row_alt;
        // 顶部加细线分隔新日期
        var topBorder = isNewDate && idx > 0
          ? 'border-top: 2px solid var(--border2) !important;' : '';

        var dateCell = '<td class="cs8-row-info" style="background:'+tc.bg+';'+topBorder+'">'
          + '<span class="cs8-date-big" style="color:'+(isDark?'#f0f0f0':'#1a1a1a')+'">'+dateShort(s.date)+'</span>'
          + '<span class="cs8-date-sub">'+weekday(s.date)+'</span>'
          + '<span class="cs8-type-pill" style="background:'+tc.pill_bg+';color:'+tc.pill_txt+'">'+esc(s.type)+'</span>'
          + '</td>';

        var dataCells = COLS.map(function (col) {
          return renderTd(col, s[col.key] || '', rowBg, topBorder);
        }).join('');

        bodyHtml += '<tr>'+dateCell+dataCells+'</tr>';
      });

      if (!svcs.length) {
        bodyHtml = '<tr><td colspan="'+(COLS.length+1)+'" style="padding:40px;text-align:center;color:var(--text3)">暂无数据</td></tr>';
      }

      // 列宽：日期列固定，其余均分
      var colGroup = '<colgroup><col style="width:130px">'
        + COLS.map(function () { return '<col>'; }).join('')
        + '</colgroup>';

      EL.innerHTML =
        '<div class="cs8-bar">'
          + '<div class="cs8-tabs">'+tabsHtml+'</div>'
          + '<div class="cs8-right">'
            + '<button class="cs8-theme" id="csTheme">'+(isDark?'☀️':'🌙')+'</button>'
            + '<button class="cs8-export" id="csExp">'+svgDown()+'导出图片</button>'
          + '</div>'
        + '</div>'
        + (allTypes.length > 1 ? '<div class="cs8-filters" id="csFilters">'+fHtml+'</div>' : '')
        + '<div class="cs8-table-wrap"><table class="cs8-table" id="csTable">'
          + colGroup
          + '<thead><tr>'+colHeaders+'</tr></thead>'
          + '<tbody>'+bodyHtml+'</tbody>'
        + '</table></div>';

      // 事件
      var prev    = EL.querySelector('#csPrev');
      var next    = EL.querySelector('#csNext');
      var exp     = EL.querySelector('#csExp');
      var themeB  = EL.querySelector('#csTheme');
      var fbox    = EL.querySelector('#csFilters');

      if (prev)   prev.addEventListener('click', function () { render(i-1); });
      if (next)   next.addEventListener('click', function () { render(i+1); });
      if (exp)    exp.addEventListener('click',  function () { exportPng(key); });
      if (themeB) themeB.addEventListener('click', function () {
        isDark = !isDark;
        try { localStorage.setItem('cecp-theme', isDark?'dark':'light'); } catch(e){}
        applyTheme();
        render(i);
      });
      if (fbox) fbox.querySelectorAll('.cs8-filter').forEach(function (b) {
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

  /* ── 渲染 td ──────────────────────────────────────────────────────────────── */
  function renderTd(col, val, rowBg, topBorder) {
    var style = 'background:'+rowBg+';'+(topBorder||'');
    var cls = 'cs8-cell';

    if (col.type === 'reading') {
      var rd = parseReading(val);
      if (!rd || !rd.name) {
        return '<td class="'+cls+'" style="'+style+'"><span class="cs8-empty">—</span></td>';
      }
      return '<td class="'+cls+'" style="'+style+'">'
        + '<span class="cs8-rd-ref">'+esc(rd.ref)+'</span>'
        + mkBadge(rd.name)
        + '</td>';
    }

    if (col.type === 'note') {
      if (!val) return '<td class="'+cls+'" style="'+style+'"><span class="cs8-empty">—</span></td>';
      var m = val.match(/^(证道[：:]\s*)(.+)$/);
      if (m) {
        return '<td class="'+cls+'" style="'+style+'">'
          + '<span class="cs8-note-pfx">'+esc(m[1])+'</span>'
          + mkBadge(m[2])
          + '</td>';
      }
      return '<td class="'+cls+'" style="'+style+'">'+mkBadge(val)+'</td>';
    }

    // 普通 badges
    if (!val) return '<td class="'+cls+'" style="'+style+'"><span class="cs8-empty">—</span></td>';
    var names = val.split(/[\/\n]/).map(function (n) { return n.trim(); }).filter(Boolean);
    return '<td class="'+cls+'" style="'+style+'">'+names.map(mkBadge).join('')+'</td>';
  }

  /* ── Badge ────────────────────────────────────────────────────────────────── */
  function mkBadge(name) {
    if (!name) return '';
    var c = badgeColor(name);
    if (!c) return '<span class="cs8-badge" style="background:var(--bg2);color:var(--label)">'+esc(name)+'</span>';
    return '<span class="cs8-badge" data-n="'+esc(name)+'" style="background:'+c[0]+';color:'+c[1]+'">'+esc(name)+'</span>';
  }

  /* ── 高亮 ─────────────────────────────────────────────────────────────────── */
  function allBadges() { return EL.querySelectorAll('.cs8-badge'); }

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

  /* ── 导出 ─────────────────────────────────────────────────────────────────── */
  function exportPng(key) {
    var btn   = EL.querySelector('#csExp');
    var table = EL.querySelector('#csTable');
    if (!btn || !table) return;
    btn.disabled = true; btn.textContent = '处理中…';

    function run() {
      window.html2canvas(table, { backgroundColor: isDark?'#0e0e0e':'#fff', scale: 2, useCORS: true, logging: false })
        .then(function (c) {
          var a = document.createElement('a');
          a.download = '服事安排_'+key+'.png'; a.href = c.toDataURL('image/png'); a.click();
          btn.innerHTML = svgDown()+'导出图片'; btn.disabled = false;
        })
        .catch(function () { btn.textContent = '导出失败'; btn.disabled = false; });
    }

    if (!window.html2canvas) {
      var sc = document.createElement('script');
      sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      sc.onload = run; document.head.appendChild(sc);
    } else { run(); }
  }

  /* ── 工具 ─────────────────────────────────────────────────────────────────── */
  var WEEK_DAYS = ['日','一','二','三','四','五','六'];
  var MONTHS_CN = ['一','二','三','四','五','六','七','八','九','十','十一','十二'];

  function getTc(type) {
    return (isDark ? TYPE_DARK : TYPE_LIGHT)[type] || (isDark ? TC_DEF_D : TC_DEF_L);
  }
  function parseReading(v) {
    if (!v) return null;
    var m = v.match(/^(诗\d+)\s+(.+)$/);
    return m ? { ref: m[1], name: m[2].trim() } : { ref: v, name: '' };
  }
  function dateShort(s) {
    var m = s && s.match(/\d{4}[-\/](\d{1,2})[-\/](\d{1,2})/);
    return m ? parseInt(m[1],10)+'月'+parseInt(m[2],10)+'日' : s;
  }
  function weekday(s) {
    try { var d = new Date(s); return '周'+WEEK_DAYS[d.getDay()]; } catch(e) { return ''; }
  }
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
