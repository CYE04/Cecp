/**
 * service-schedule.js  v11.0  — CECP 事工表
 * ═══════════════════════════════════════════════════════
 * GitHub: cye04.github.io/Cecp/service-schedule.js
 *
 * Halo HTML块:
 *   <div id="cecp-schedule" data-api="YOUR_API_URL"></div>
 *   <script src="https://cye04.github.io/Cecp/service-schedule.js"></script>
 *
 * API 字段: month / week / type / leader / worship /
 *           band / prayer / reading / note
 * ═══════════════════════════════════════════════════════
 */
(function () {
  'use strict';

  var EL = document.getElementById('cecp-schedule');
  if (!EL) return;
  var API = (EL.dataset.api || '').trim();

  /* ── 岗位列定义 ──────────────────────────────────────── */
  var COLS = [
    { key: 'leader',  label: '主领 / 司仪', kind: 'badges'  },
    { key: 'worship', label: '敬拜带领',    kind: 'badges'  },
    { key: 'band',    label: '乐手 / 司琴', kind: 'badges'  },
    { key: 'prayer',  label: '祷告带领',    kind: 'badges'  },
    { key: 'reading', label: '读　　经',    kind: 'reading' },
    { key: 'note',    label: '证道讲员',    kind: 'note'    },
  ];

  /* ── 类型配色 ─────────────────────────────────────────── */
  var TC = {
    '主日下午': { bar: '#3a7bd4', tag: '#1a3878', txt: '#82bcf8' },
    '主日晚上': { bar: '#8a48d8', tag: '#3c1a80', txt: '#c090f0' },
    '青年团契':  { bar: '#28b868', tag: '#145830', txt: '#60e898' },
  };
  var TC_DEF = { bar: '#555', tag: '#2a2a2a', txt: '#aaa' };

  /* ── Badge 颜色板 ─────────────────────────────────────── */
  var PAL_D = [
    ['#0c2848','#6ab4ec'],['#0a3018','#56c87c'],['#2c1050','#a870e0'],
    ['#3c0c1e','#d86888'],['#082830','#50b8c8'],['#2c1c04','#c89838'],
    ['#0c2040','#6080cc'],['#200c40','#9068cc'],['#0c2420','#60b888'],
    ['#321408','#c07860'],['#082430','#50a8bc'],['#1c0e40','#7870cc'],
    ['#300c10','#c06868'],['#0c300c','#68c068'],['#0c0c30','#6868c0'],
    ['#0e3028','#58b0a0'],['#301c04','#b09058'],['#141238','#7878b8'],
  ];
  var PAL_L = [
    ['#1a5890','#ddeef8'],['#1a5e38','#d8f0e4'],['#5a2890','#ede0f8'],
    ['#882040','#f8dde6'],['#1a5868','#d8eef0'],['#785010','#f8f0d8'],
    ['#1a3878','#dde4f8'],['#502080','#e8d8f8'],['#1a5848','#d8eee8'],
    ['#784830','#f8e8de'],['#1a4860','#d8e8f0'],['#402878','#e4ddf8'],
    ['#783040','#f8dede'],['#207830','#ddf8de'],['#282078','#deddf8'],
    ['#185858','#d8f0ec'],['#604828','#f0e8d8'],['#303078','#e0def8'],
  ];

  function badgeColor(name) {
    if (!name) return null;
    var h = 0;
    for (var i = 0; i < name.length; i++) h = (Math.imul(31, h) + name.charCodeAt(i)) | 0;
    return (isDark ? PAL_D : PAL_L)[Math.abs(h) % PAL_D.length];
  }

  /* ── 主题 ─────────────────────────────────────────────── */
  var isDark = true;
  try {
    var _t = localStorage.getItem('cecp-theme');
    if (_t) isDark = _t === 'dark';
    else isDark = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  } catch (e) {}

  function applyTheme() {
    EL.classList.toggle('cd', isDark);
    EL.classList.toggle('cl', !isDark);
  }

  /* ── CSS ──────────────────────────────────────────────── */
  if (!document.getElementById('_cecp11')) {
    var _s = document.createElement('style');
    _s.id = '_cecp11';
    _s.textContent = `
#cecp-schedule{font-family:"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif;border-radius:16px;overflow:hidden;box-sizing:border-box;width:100%}
#cecp-schedule *{box-sizing:border-box;margin:0;padding:0}

/* 深色 */
#cecp-schedule.cd{background:#0e0e0e;color:#d8d8d8;--bg:#0e0e0e;--bg2:#161616;--bg3:#1e1e1e;--ln:#1e1e1e;--ln2:#2a2a2a;--tx:#d8d8d8;--tx2:#555;--tx3:#2a2a2a;--lbl:#484848;--bar:#111;--tabbg:#1a1a1a;--tabon:#232323;--rd:#3a6a3a;--nt:#7a6838}
/* 浅色 */
#cecp-schedule.cl{background:#fff;color:#1a1a1a;--bg:#fff;--bg2:#f6f6f6;--bg3:#eeeeee;--ln:#e8e8e8;--ln2:#d0d0d0;--tx:#1a1a1a;--tx2:#aaa;--tx3:#ccc;--lbl:#888;--bar:#f4f4f4;--tabbg:#ebebeb;--tabon:#fff;--rd:#236a33;--nt:#7a5a20}

/* 顶栏 */
.cc-bar{display:flex;align-items:center;gap:8px;padding:14px 20px 12px;background:var(--bar);border-bottom:1px solid var(--ln);flex-wrap:wrap}
.cc-nav{display:flex;gap:2px;background:var(--tabbg);border-radius:10px;padding:3px;flex-shrink:0}
.cc-nb{padding:6px 14px;font-size:13px;font-weight:500;color:var(--tx2);cursor:pointer;border-radius:8px;border:none;background:none;font-family:inherit;white-space:nowrap;transition:all .15s}
.cc-nb.on{background:var(--tabon);color:var(--tx);font-weight:700}
.cc-nb:hover:not(.on){color:var(--tx)}
.cc-right{margin-left:auto;display:flex;gap:8px;align-items:center}
.cc-theme{width:34px;height:34px;border-radius:50%;border:1px solid var(--ln2);background:var(--bg2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:15px;transition:transform .2s,background .15s;flex-shrink:0}
.cc-theme:hover{background:var(--bg3);transform:scale(1.1) rotate(18deg)}
.cc-dl{display:flex;align-items:center;gap:5px;padding:6px 13px;font-size:12px;color:var(--tx2);border:1px solid var(--ln2);border-radius:8px;background:none;cursor:pointer;font-family:inherit;white-space:nowrap;transition:all .15s}
.cc-dl:hover{color:var(--tx);border-color:var(--lbl);background:var(--bg2)}
.cc-dl:disabled{opacity:.35;cursor:not-allowed}

/* 筛选 */
.cc-filters{display:flex;gap:6px;padding:8px 20px;border-bottom:1px solid var(--ln);background:var(--bar);flex-wrap:wrap}
.cc-fb{padding:4px 14px;font-size:12px;border-radius:20px;cursor:pointer;border:1px solid var(--ln2);background:none;font-family:inherit;color:var(--lbl);transition:all .15s;font-weight:500}
.cc-fb.on{color:#fff;border-color:transparent}
.cc-fb.all.on{background:#3a3a3a}
.cd .cc-fb.all.on{background:#3a3a3a}
.cl .cc-fb.all.on{background:#777;color:#fff}
.cc-fb:hover:not(.on){color:var(--tx);border-color:var(--lbl)}

/* 表格容器 */
.cc-wrap{width:100%;overflow-x:hidden}
.cc-table{border-collapse:collapse;width:100%;table-layout:fixed}
.cc-table th,.cc-table td{border-bottom:1px solid var(--ln);border-right:1px solid var(--ln);vertical-align:middle}
.cc-table tr th:last-child,.cc-table tr td:last-child{border-right:none}

/* 列标题 */
.cc-chdr{background:var(--bar);padding:12px 14px;font-size:12px;font-weight:700;color:var(--lbl);text-align:center;white-space:nowrap;letter-spacing:.04em;position:sticky;top:0;z-index:2;border-bottom:2px solid var(--ln2) !important}
.cc-corner{background:var(--bar);padding:12px 14px;font-size:11px;color:var(--tx3);text-align:center;position:sticky;top:0;z-index:3;border-bottom:2px solid var(--ln2) !important;border-right:2px solid var(--ln2) !important}

/* 左侧聚会信息格 */
.cc-info{padding:12px 16px;vertical-align:middle;text-align:left;border-right:2px solid var(--ln2) !important;border-left:4px solid transparent;min-width:130px;width:130px;background:var(--bg)}
.cc-week{font-size:24px;font-weight:900;line-height:1;letter-spacing:-.02em;display:block;color:var(--tx)}
.cc-month{font-size:11px;color:var(--tx2);margin-top:3px;display:block;font-weight:500}
.cc-tag{display:inline-block;margin-top:7px;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;letter-spacing:.03em}

/* 内容格 */
.cc-cell{padding:10px 12px;text-align:center;background:var(--bg);transition:background .1s}
.cc-cell:hover{background:var(--bg2)}

/* 读经格 */
.cc-ref{display:block;font-size:10px;color:var(--rd);margin-bottom:3px;font-weight:700;letter-spacing:.04em}
/* 证道前缀 */
.cc-npfx{display:block;font-size:10px;color:var(--nt);margin-bottom:3px;font-weight:700}

/* Badge */
.cc-badge{display:inline-block;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700;line-height:1.4;margin:2px;white-space:nowrap;cursor:pointer;letter-spacing:.02em;transition:opacity .12s,transform .1s,box-shadow .12s;user-select:none;position:relative}
.cc-badge.lit   {transform:scale(1.12);box-shadow:0 0 0 2px rgba(255,255,255,.3);z-index:1}
.cc-badge.dim   {opacity:.14}
.cc-badge.locked{transform:scale(1.15);box-shadow:0 0 0 2.5px rgba(255,255,255,.58);z-index:1}
.cc-badge.ldim  {opacity:.1}
.cl .cc-badge.lit   {box-shadow:0 0 0 2px rgba(0,0,0,.22)}
.cl .cc-badge.locked{box-shadow:0 0 0 2.5px rgba(0,0,0,.42)}

/* 空值 / 分隔线 */
.cc-empty{color:var(--tx3);font-size:15px}
.cc-sep td{padding:3px 0;background:var(--bar);border-bottom:2px solid var(--ln2) !important;border-right:none !important}

/* 加载 / 错误 */
.cc-loading{display:flex;align-items:center;gap:12px;padding:56px 24px;color:var(--tx2);font-size:15px}
.cc-spinner{width:20px;height:20px;border:2px solid var(--ln2);border-top-color:var(--lbl);border-radius:50%;animation:ccspin .7s linear infinite;flex-shrink:0}
@keyframes ccspin{to{transform:rotate(360deg)}}
.cc-nodata{padding:56px;text-align:center;color:var(--tx3);font-size:15px}
.cc-err{padding:24px;color:#a04040;font-size:14px;line-height:1.8}

/* 响应式：手机 */
@media(max-width:600px){
  .cc-week{font-size:18px}
  .cc-info{min-width:100px;width:100px;padding:10px 10px}
  .cc-badge{font-size:11px;padding:3px 8px}
  .cc-cell{padding:8px 8px}
  .cc-chdr{padding:9px 9px;font-size:11px}
  .cc-nb{padding:5px 10px;font-size:12px}
}
`;
    document.head.appendChild(_s);
  }

  applyTheme();

  /* ── 加载状态 ─────────────────────────────────────────── */
  EL.innerHTML = '<div class="cc-loading"><div class="cc-spinner"></div>加载服事安排…</div>';

  /* ── 拉取数据 ─────────────────────────────────────────── */
  if (!API || API === 'DEMO') { setTimeout(function () { boot(demo()); }, 200); return; }

  fetch(API + '?action=all')
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (res) {
      if (!res.ok) throw new Error(res.error || '脚本错误');
      boot(res.data);
    })
    .catch(function (e) {
      EL.innerHTML = '<div class="cc-err">⚠ ' + esc(e.message)
        + '<br><small style="opacity:.5">请确认 Apps Script 已部署最新版本，访问权限为「所有人」</small></div>';
    });

  /* ── 高亮状态 ─────────────────────────────────────────── */
  var locked = null;

  /* ── 初始化 ───────────────────────────────────────────── */
  function boot(rows) {
    if (!rows || !rows.length) {
      EL.innerHTML = '<div class="cc-nodata">暂无服事安排数据</div>';
      return;
    }

    // 按月份分组
    var months = {};
    rows.forEach(function (r) {
      var m = tv(r.month);
      if (!m) return;
      if (!months[m]) months[m] = [];
      months[m].push(r);
    });

    var keys = Object.keys(months).sort(function (a, b) { return mord(a) - mord(b); });
    if (!keys.length) return;

    // 定位当前月
    var nowM = (new Date().getMonth() + 1) + '月';
    var curIdx = keys.indexOf(nowM);
    if (curIdx < 0) {
      for (var i = 0; i < keys.length; i++) { if (mord(keys[i]) >= mord(nowM)) { curIdx = i; break; } }
      if (curIdx < 0) curIdx = keys.length - 1;
    }

    // 类型列表
    var allTypes = [];
    rows.forEach(function (r) { if (r.type && allTypes.indexOf(r.type) < 0) allTypes.push(r.type); });
    var tord = { '主日下午': 0, '主日晚上': 1, '青年团契': 2 };
    allTypes.sort(function (a, b) { return (tord[a] || 9) - (tord[b] || 9); });

    var activeFilter = '全部';
    render(curIdx);

    function render(i) {
      locked = null;
      var key = keys[i];

      // 月份导航
      var nav = '';
      if (i > 0)               nav += '<button class="cc-nb" id="ccPrev">← ' + keys[i-1] + '</button>';
      nav +=                           '<button class="cc-nb on">' + key + '</button>';
      if (i < keys.length - 1) nav += '<button class="cc-nb" id="ccNext">' + keys[i+1] + ' →</button>';

      // 筛选按钮
      var flt = '<button class="cc-fb all' + (activeFilter==='全部'?' on':'') + '" data-f="全部">全部</button>';
      allTypes.forEach(function (tp) {
        var tc = TC[tp] || TC_DEF;
        var on = activeFilter === tp;
        flt += '<button class="cc-fb' + (on?' on':'') + '" data-f="' + esc(tp) + '"'
          + (on ? ' style="background:' + tc.tag + ';color:' + tc.txt + '"' : '') + '>' + esc(tp) + '</button>';
      });

      // 过滤 + 排序
      var svcs = months[key].filter(function (s) {
        return activeFilter === '全部' || s.type === activeFilter;
      }).sort(function (a, b) {
        var dw = word(a.week) - word(b.week);
        if (dw) return dw;
        return (tord[a.type] || 9) - (tord[b.type] || 9);
      });

      // 列标题
      var hdr = '<th class="cc-corner">聚会</th>'
        + COLS.map(function (c) { return '<th class="cc-chdr">' + c.label + '</th>'; }).join('');

      // colgroup
      var cg = '<colgroup><col style="width:130px">' + COLS.map(function () { return '<col>'; }).join('') + '</colgroup>';

      // 行
      var tbody = '';
      var prevWk = '';
      svcs.forEach(function (s, idx) {
        var tc = TC[s.type] || TC_DEF;
        var isNewWk = (s.week !== prevWk);
        prevWk = s.week;

        // 周次分隔线
        if (isNewWk && idx > 0) {
          tbody += '<tr class="cc-sep"><td colspan="' + (COLS.length + 1) + '"></td></tr>';
        }

        // 聚会信息格
        var info = '<td class="cc-info" style="border-left-color:' + tc.bar + '">'
          + '<span class="cc-week">' + esc(s.week) + '</span>'
          + '<span class="cc-month">' + esc(s.month) + '</span>'
          + '<span class="cc-tag" style="background:' + tc.tag + ';color:' + tc.txt + '">' + esc(s.type) + '</span>'
          + '</td>';

        var cells = COLS.map(function (col) { return renderTd(col, s[col.key] || ''); }).join('');
        tbody += '<tr>' + info + cells + '</tr>';
      });

      if (!svcs.length) {
        tbody = '<tr><td colspan="' + (COLS.length+1) + '" style="padding:48px;text-align:center;color:var(--tx3);font-size:15px">暂无数据</td></tr>';
      }

      EL.innerHTML =
        '<div class="cc-bar">'
          + '<div class="cc-nav">' + nav + '</div>'
          + '<div class="cc-right">'
            + '<button class="cc-theme" id="ccTheme">' + (isDark ? '☀️' : '🌙') + '</button>'
            + '<button class="cc-dl" id="ccExp">' + svgDL() + '导出图片</button>'
          + '</div>'
        + '</div>'
        + '<div class="cc-filters" id="ccFilters">' + flt + '</div>'
        + '<div class="cc-wrap">'
          + '<table class="cc-table" id="ccTable">' + cg
            + '<thead><tr>' + hdr + '</tr></thead>'
            + '<tbody>' + tbody + '</tbody>'
          + '</table>'
        + '</div>';

      // 事件绑定
      var prev  = EL.querySelector('#ccPrev');
      var next  = EL.querySelector('#ccNext');
      var exp   = EL.querySelector('#ccExp');
      var thBtn = EL.querySelector('#ccTheme');
      var fbox  = EL.querySelector('#ccFilters');

      if (prev)  prev.addEventListener('click', function () { render(i-1); });
      if (next)  next.addEventListener('click', function () { render(i+1); });
      if (exp)   exp.addEventListener('click',  function () { exportPng(key); });
      if (thBtn) thBtn.addEventListener('click', function () {
        isDark = !isDark;
        try { localStorage.setItem('cecp-theme', isDark ? 'dark' : 'light'); } catch (e) {}
        applyTheme();
        render(i);
      });
      if (fbox) fbox.querySelectorAll('.cc-fb').forEach(function (b) {
        b.addEventListener('click', function () { activeFilter = this.dataset.f; render(i); });
      });

      bindHL();
    }
  }

  /* ── 渲染单元格 ──────────────────────────────────────── */
  function renderTd(col, val) {
    if (col.kind === 'reading') {
      var rd = parseReading(val);
      if (!rd || !rd.name) return '<td class="cc-cell"><span class="cc-empty">—</span></td>';
      return '<td class="cc-cell"><span class="cc-ref">' + esc(rd.ref) + '</span>' + badge(rd.name) + '</td>';
    }
    if (col.kind === 'note') {
      if (!val) return '<td class="cc-cell"><span class="cc-empty">—</span></td>';
      var m = val.match(/^(证道[：:]\s*)(.+)$/);
      if (m) return '<td class="cc-cell"><span class="cc-npfx">' + esc(m[1]) + '</span>' + badge(m[2]) + '</td>';
      return '<td class="cc-cell">' + badge(val) + '</td>';
    }
    if (!val) return '<td class="cc-cell"><span class="cc-empty">—</span></td>';
    var names = val.split(/[\/\n]/).map(function (n) { return n.trim(); }).filter(Boolean);
    return '<td class="cc-cell">' + names.map(badge).join('') + '</td>';
  }

  function badge(name) {
    if (!name) return '';
    var c = badgeColor(name);
    if (!c) return '<span class="cc-badge" style="background:var(--bg2);color:var(--lbl)">' + esc(name) + '</span>';
    return '<span class="cc-badge" data-n="' + esc(name) + '" style="background:' + c[0] + ';color:' + c[1] + '">' + esc(name) + '</span>';
  }

  function parseReading(v) {
    if (!v) return null;
    var m = v.match(/^(诗\d+)\s+(.+)$/);
    return m ? { ref: m[1], name: m[2].trim() } : { ref: v, name: '' };
  }

  /* ── 高亮逻辑 ─────────────────────────────────────────── */
  function allBadges() { return EL.querySelectorAll('.cc-badge'); }

  function applyHL(name, isLock) {
    allBadges().forEach(function (b) {
      var n = b.dataset.n || b.textContent;
      b.classList.remove('lit', 'dim', 'locked', 'ldim');
      if (n === name) b.classList.add(isLock ? 'locked' : 'lit');
      else            b.classList.add(isLock ? 'ldim'   : 'dim');
    });
  }
  function clearHL() { allBadges().forEach(function (b) { b.classList.remove('lit','dim','locked','ldim'); }); }

  function bindHL() {
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

  /* ── 导出 PNG ─────────────────────────────────────────── */
  function exportPng(key) {
    var btn = EL.querySelector('#ccExp');
    var tbl = EL.querySelector('#ccTable');
    if (!btn || !tbl) return;
    btn.disabled = true;
    btn.textContent = '处理中…';

    function run() {
      window.html2canvas(tbl, { backgroundColor: isDark ? '#0e0e0e' : '#fff', scale: 2, useCORS: true, logging: false })
        .then(function (c) {
          var a = document.createElement('a');
          a.download = '服事安排_' + key + '.png';
          a.href = c.toDataURL('image/png');
          a.click();
          btn.innerHTML = svgDL() + '导出图片';
          btn.disabled = false;
        })
        .catch(function () { btn.textContent = '导出失败'; btn.disabled = false; });
    }

    if (!window.html2canvas) {
      var sc = document.createElement('script');
      sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      sc.onload = run;
      document.head.appendChild(sc);
    } else { run(); }
  }

  /* ── 工具函数 ─────────────────────────────────────────── */
  function mord(s) { var m = String(s).match(/^(\d{1,2})月$/); return m ? parseInt(m[1],10) : 99; }
  function word(s) { return {'第一周':1,'第二周':2,'第三周':3,'第四周':4,'第五周':5}[s] || 99; }
  function tv(v)   { return String(v == null ? '' : v).trim(); }
  function esc(s)  { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function svgDL() {
    return '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M7 1v8M4 6l3 3 3-3M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1"/></svg>';
  }

  /* ── Demo 数据（测试用） ──────────────────────────────── */
  function demo() {
    return [
      {month:'3月',week:'第一周',type:'主日下午',leader:'金展',worship:'胡娜',band:'杨亦佳',prayer:'林文宝',reading:'诗9 金Silvia',note:'证道：金美德'},
      {month:'3月',week:'第一周',type:'主日晚上',leader:'林文宝',worship:'翁撒该/杨雪克/叶春叶',band:'金紫涵/黄天丽',prayer:'戴献和',reading:'',note:'证道：金美德'},
      {month:'3月',week:'第一周',type:'青年团契',leader:'',worship:'',band:'',prayer:'',reading:'',note:'活动游戏'},
      {month:'3月',week:'第二周',type:'主日下午',leader:'林文宝',worship:'吴超凡',band:'青少年',prayer:'金展',reading:'诗10 季轩',note:'证道：吴恬恬'},
      {month:'3月',week:'第二周',type:'主日晚上',leader:'吴超凡',worship:'吴超凡及青少年',band:'青少年',prayer:'林文宝/董希昆',reading:'',note:'证道：彭永剑'},
      {month:'3月',week:'第二周',type:'青年团契',leader:'',worship:'',band:'',prayer:'',reading:'',note:'吴超凡'},
      {month:'3月',week:'第三周',type:'主日下午',leader:'彭永剑',worship:'孙琴乐',band:'季轩/吴以勒',prayer:'徐永西',reading:'诗11 何若诗',note:'证道：陈金东'},
      {month:'3月',week:'第三周',type:'主日晚上',leader:'金展',worship:'胡娜/林文宝',band:'翁撒该',prayer:'徐永西',reading:'',note:'证道：戴献和'},
      {month:'3月',week:'第三周',type:'青年团契',leader:'',worship:'',band:'',prayer:'',reading:'',note:'吴恬恬'},
      {month:'3月',week:'第四周',type:'主日下午',leader:'戴献和',worship:'王皞阳',band:'黄天丽/金丽莎',prayer:'彭永剑',reading:'诗12 何心如',note:'证道：潘隆正'},
      {month:'3月',week:'第四周',type:'主日晚上',leader:'彭永剑/王皞阳',worship:'叶春叶/董希昆',band:'徐博杰/黄天丽',prayer:'金展',reading:'',note:'证道：潘隆正'},
      {month:'3月',week:'第四周',type:'青年团契',leader:'',worship:'',band:'',prayer:'',reading:'',note:'意语敬拜'},
      {month:'3月',week:'第五周',type:'主日下午',leader:'王皞阳',worship:'吴恬恬',band:'谢安/金Silvia',prayer:'戴献和',reading:'诗13 林颖慧',note:'证道：潘庆峰'},
      {month:'3月',week:'第五周',type:'主日晚上',leader:'翁撒该',worship:'金梦熙',band:'胡娜',prayer:'林文宝',reading:'',note:'证道：潘庆峰'},
      {month:'3月',week:'第五周',type:'青年团契',leader:'',worship:'',band:'',prayer:'',reading:'',note:'潘庆峰'},
    ];
  }

})();
