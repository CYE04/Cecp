/**
 * service-schedule.js  v12.0  — CECP 事工表
 * ═══════════════════════════════════════════════════════
 * Design system: 统一设计规范，可复用于所有安排表
 *
 * 设计原则:
 *   · 两层 header：上层=导航+操作，下层=筛选
 *   · 8px 基础间距单位，统一 border-radius 层级
 *   · 字体规模: 24px week / 11px month / 12px label / 12px badge
 *   · 三种按钮规格: nav / pill-filter / icon-action
 *   · 深浅两套完整主题变量，一键切换
 *
 * 用法:
 *   <div id="cecp-schedule" data-api="API_URL"></div>
 *   <script src="https://cye04.github.io/Cecp/service-schedule.js"></script>
 * ═══════════════════════════════════════════════════════
 */
(function () {
  'use strict';

  var EL = document.getElementById('cecp-schedule');
  if (!EL) return;
  var API = (EL.dataset.api || '').trim();

  /* ── 岗位列 ──────────────────────────────────────────── */
  var COLS = [
    { key: 'leader',  label: '主领 / 司仪', kind: 'badges'  },
    { key: 'worship', label: '敬拜带领',    kind: 'badges'  },
    { key: 'band',    label: '乐手 / 司琴', kind: 'badges'  },
    { key: 'prayer',  label: '祷告带领',    kind: 'badges'  },
    { key: 'reading', label: '读　　经',    kind: 'reading' },
    { key: 'note',    label: '证道讲员',    kind: 'note'    },
  ];

  /* ── 类型主题色 ──────────────────────────────────────── */
  var TYPE_THEME = {
    '主日下午': {
      accent: '#4a8ef0',          /* 左边框、focus 色 */
      dark:  { tag: '#1c3a70', txt: '#82bcf0' },
      light: { tag: '#2a5eb8', txt: '#ffffff' },
    },
    '主日晚上': {
      accent: '#9960e8',
      dark:  { tag: '#3a1c70', txt: '#c090f0' },
      light: { tag: '#6838b0', txt: '#ffffff' },
    },
    '青年团契': {
      accent: '#30c070',
      dark:  { tag: '#1a5030', txt: '#60e898' },
      light: { tag: '#1a7840', txt: '#ffffff' },
    },
  };
  var TYPE_DEFAULT = {
    accent: '#606060',
    dark:  { tag: '#2a2a2a', txt: '#aaaaaa' },
    light: { tag: '#888888', txt: '#ffffff' },
  };

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

  function getTC(type) {
    var t = TYPE_THEME[type] || TYPE_DEFAULT;
    return { accent: t.accent, tag: isDark ? t.dark.tag : t.light.tag, txt: isDark ? t.dark.txt : t.light.txt };
  }

  /* ── 主题 ─────────────────────────────────────────────── */
  var isDark = true;
  try {
    var _t = localStorage.getItem('cecp-theme');
    if (_t) isDark = _t === 'dark';
    else isDark = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  } catch (e) {}

  function applyTheme() {
    EL.classList.toggle('s-dark',  isDark);
    EL.classList.toggle('s-light', !isDark);
  }

  /* ══════════════════════════════════════════════════════
     设计系统 CSS
     ────────────────────────────────────────────────────
     设计规范:
       spacing:  8px 基础单位 (xs=4 s=8 m=12 l=16 xl=24)
       radius:   widget=16px  card=12px  btn=8px  pill=20px
       font:     system-ui stack (PingFang/Noto/YaHei)
       weight:   900=week 700=tag/badge 600=colhdr 500=nav 400=label
     ══════════════════════════════════════════════════════ */
  if (!document.getElementById('_s12css')) {
    var el = document.createElement('style');
    el.id = '_s12css';
    el.textContent = `
/* ── 根容器 ── */
#cecp-schedule {
  font-family: "PingFang SC","Noto Sans SC","Microsoft YaHei",system-ui,sans-serif;
  border-radius: 16px;
  overflow: hidden;
  box-sizing: border-box;
  width: 100%;
  /* 细微阴影让 widget 和页面背景分离 */
  box-shadow: 0 1px 3px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.06);
}
#cecp-schedule * { box-sizing: border-box; margin: 0; padding: 0; }

/* ── 主题变量 (深色) ── */
#cecp-schedule.s-dark {
  background: #0f0f0f; color: #d4d4d4;
  /* surface */
  --s-bg:    #0f0f0f;
  --s-bg-2:  #181818;
  --s-bg-3:  #202020;
  --s-bg-4:  #282828;
  /* border */
  --s-line:  #1e1e1e;
  --s-line2: #2c2c2c;
  /* text */
  --s-tx:    #d4d4d4;
  --s-tx-2:  #606060;
  --s-tx-3:  #303030;
  --s-muted: #484848;
  /* components */
  --s-hdr:       #111111;
  --s-nav-bg:    #1a1a1a;
  --s-nav-on:    #242424;
  --s-nav-txt:   #f0f0f0;
  --s-pill-on:   #242424;
  /* semantic */
  --s-rd:  #2e6030;   /* reading green */
  --s-nt:  #6a5420;   /* note amber */
  --s-sep: #2a2a2a;
}

/* ── 主题变量 (浅色) ── */
#cecp-schedule.s-light {
  background: #ffffff; color: #1a1a1a;
  --s-bg:    #ffffff;
  --s-bg-2:  #f5f5f5;
  --s-bg-3:  #eeeeee;
  --s-bg-4:  #e8e8e8;
  --s-line:  #ebebeb;
  --s-line2: #d8d8d8;
  --s-tx:    #1a1a1a;
  --s-tx-2:  #999999;
  --s-tx-3:  #cccccc;
  --s-muted: #888888;
  --s-hdr:       #f7f7f7;
  --s-nav-bg:    #ebebeb;
  --s-nav-on:    #ffffff;
  --s-nav-txt:   #1a1a1a;
  --s-pill-on:   #ffffff;
  --s-rd:  #1a5c28;
  --s-nt:  #6a4a10;
  --s-sep: #e0e0e0;
}

/* ════════════════════════════════
   HEADER ZONE 1 — 导航 + 操作
   ════════════════════════════════ */
.s-hdr-nav {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--s-hdr);
  border-bottom: 1px solid var(--s-line);
  gap: 0;
}

/* 月份导航块 (左) */
.s-month-nav {
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--s-nav-bg);
  border-radius: 10px;
  padding: 3px;
}

/* 通用导航按钮 */
.s-nav-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--s-tx-2);
  border-radius: 8px;
  border: none;
  background: none;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  transition: color .12s, background .12s;
  line-height: 1.4;
}
.s-nav-btn:hover:not(.active) { color: var(--s-tx); }
.s-nav-btn.active {
  background: var(--s-nav-on);
  color: var(--s-nav-txt);
  font-weight: 700;
  /* 浅色模式加细边框让 active 更清晰 */
  box-shadow: 0 1px 3px rgba(0,0,0,.1);
}
/* 箭头按钮：更紧凑 */
.s-nav-btn.arrow {
  padding: 6px 10px;
  font-size: 14px;
  font-weight: 400;
}
.s-nav-btn.arrow:hover { color: var(--s-tx); background: var(--s-bg-3); }

/* 操作按钮组 (右) */
.s-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 图标按钮 (主题切换) */
.s-icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--s-line2);
  background: var(--s-bg-2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
  transition: background .15s, border-color .15s, transform .15s;
  color: var(--s-tx-2);
}
.s-icon-btn:hover {
  background: var(--s-bg-3);
  border-color: var(--s-muted);
  transform: scale(1.06);
}

/* 文字+图标 操作按钮 (导出) */
.s-text-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0 12px;
  height: 32px;
  font-size: 12px;
  font-weight: 500;
  color: var(--s-tx-2);
  border: 1px solid var(--s-line2);
  border-radius: 8px;
  background: var(--s-bg-2);
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  transition: color .12s, background .12s, border-color .12s;
}
.s-text-btn:hover {
  color: var(--s-tx);
  border-color: var(--s-muted);
  background: var(--s-bg-3);
}
.s-text-btn:disabled { opacity: .4; cursor: not-allowed; }

/* ════════════════════════════════
   HEADER ZONE 2 — 类型筛选
   ════════════════════════════════ */
.s-hdr-filter {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--s-hdr);
  border-bottom: 1px solid var(--s-line);
  flex-wrap: wrap;
}

/* 筛选分隔线 */
.s-filter-divider {
  width: 1px;
  height: 14px;
  background: var(--s-line2);
  margin: 0 2px;
  flex-shrink: 0;
}

/* Pill 筛选按钮 */
.s-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 20px;
  border: 1.5px solid var(--s-line2);
  background: none;
  color: var(--s-muted);
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  transition: color .12s, background .12s, border-color .12s;
  letter-spacing: .02em;
}
.s-pill:hover:not(.on) {
  color: var(--s-tx);
  border-color: var(--s-muted);
  background: var(--s-bg-2);
}
.s-pill.on {
  color: #fff;
  border-color: transparent;
  font-weight: 600;
}
/* 「全部」单独样式 */
.s-pill.all.on {
  background: var(--s-muted);
  color: var(--s-bg);
}
/* 类型标记点 */
.s-pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ════════════════════════════════
   TABLE
   ════════════════════════════════ */
.s-table-wrap { width: 100%; overflow-x: hidden; background: var(--s-bg); }
.s-table {
  border-collapse: collapse;
  width: 100%;
  table-layout: fixed;
}
.s-table th, .s-table td {
  border-bottom: 1px solid var(--s-line);
  border-right: 1px solid var(--s-line);
  vertical-align: middle;
}
.s-table tr th:last-child, .s-table tr td:last-child { border-right: none; }

/* 列标题行 */
.s-col-hdr {
  background: var(--s-bg-2);
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 600;
  color: var(--s-tx-2);
  text-align: center;
  white-space: nowrap;
  letter-spacing: .06em;
  text-transform: uppercase;
  position: sticky;
  top: 0;
  z-index: 2;
  border-bottom: 1.5px solid var(--s-line2) !important;
}
/* 左上角 */
.s-corner {
  background: var(--s-bg-2);
  padding: 10px 14px;
  font-size: 10px;
  color: var(--s-tx-3);
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 3;
  border-bottom: 1.5px solid var(--s-line2) !important;
  border-right: 1.5px solid var(--s-line2) !important;
  letter-spacing: .04em;
  text-transform: uppercase;
}

/* 聚会信息格 (左列) */
.s-row-info {
  padding: 14px 16px;
  vertical-align: middle;
  text-align: left;
  border-right: 1.5px solid var(--s-line2) !important;
  border-left: 3px solid transparent;
  min-width: 130px;
  width: 130px;
  background: var(--s-bg);
  transition: background .1s;
}
/* 周次：最大最粗，一眼看到 */
.s-week-label {
  display: block;
  font-size: 22px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -.02em;
  color: var(--s-tx);
}
/* 月份：小字辅助信息 */
.s-month-label {
  display: block;
  font-size: 10px;
  font-weight: 500;
  color: var(--s-tx-2);
  margin-top: 4px;
  letter-spacing: .02em;
}
/* 类型标签 */
.s-type-tag {
  display: inline-block;
  margin-top: 8px;
  padding: 3px 9px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .04em;
  line-height: 1.4;
}

/* 内容格 */
.s-cell {
  padding: 10px 12px;
  text-align: center;
  background: var(--s-bg);
  transition: background .08s;
}
.s-cell:hover { background: var(--s-bg-2); }

/* 读经：参考编号 + 读经人 */
.s-rd-ref {
  display: block;
  font-size: 10px;
  font-weight: 700;
  color: var(--s-rd);
  margin-bottom: 3px;
  letter-spacing: .04em;
}
/* 证道：前缀文字 */
.s-note-pfx {
  display: block;
  font-size: 10px;
  font-weight: 700;
  color: var(--s-nt);
  margin-bottom: 3px;
  letter-spacing: .02em;
}

/* 周次分隔行 */
.s-week-sep td {
  padding: 0;
  height: 6px;
  background: var(--s-bg-2);
  border-bottom: 1px solid var(--s-sep) !important;
  border-right: none !important;
}

/* 空值 */
.s-empty { color: var(--s-tx-3); font-size: 14px; }

/* ════════════════════════════════
   BADGE
   ════════════════════════════════ */
.s-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
  margin: 2px;
  white-space: nowrap;
  cursor: pointer;
  letter-spacing: .02em;
  transition: opacity .1s, transform .1s, box-shadow .1s;
  user-select: none;
  position: relative;
}
/* hover 高亮 */
.s-badge.lit {
  transform: scale(1.1);
  box-shadow: 0 0 0 2px rgba(255,255,255,.28);
  z-index: 1;
}
.s-badge.dim { opacity: .14; }
/* click 锁定 */
.s-badge.locked {
  transform: scale(1.12);
  box-shadow: 0 0 0 2.5px rgba(255,255,255,.55);
  z-index: 1;
}
.s-badge.ldim { opacity: .1; }
/* 浅色模式阴影调整 */
.s-light .s-badge.lit    { box-shadow: 0 0 0 2px rgba(0,0,0,.2); }
.s-light .s-badge.locked { box-shadow: 0 0 0 2.5px rgba(0,0,0,.42); }

/* ════════════════════════════════
   状态 UI (加载 / 错误 / 空)
   ════════════════════════════════ */
.s-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 64px 24px;
  color: var(--s-tx-2);
  font-size: 14px;
}
.s-spinner {
  width: 20px; height: 20px;
  border: 2px solid var(--s-line2);
  border-top-color: var(--s-muted);
  border-radius: 50%;
  animation: sspin .7s linear infinite;
  flex-shrink: 0;
}
@keyframes sspin { to { transform: rotate(360deg); } }
.s-error { padding: 24px; color: #b04040; font-size: 14px; line-height: 1.8; }

/* ════════════════════════════════
   响应式
   ════════════════════════════════ */
@media (max-width: 560px) {
  .s-week-label { font-size: 17px; }
  .s-row-info   { min-width: 96px; width: 96px; padding: 10px 10px; }
  .s-cell       { padding: 8px 8px; }
  .s-col-hdr    { padding: 8px 8px; font-size: 10px; }
  .s-badge      { font-size: 11px; padding: 3px 8px; }
  .s-nav-btn    { padding: 5px 10px; font-size: 12px; }
  .s-hdr-nav    { padding: 10px 12px; }
  .s-hdr-filter { padding: 7px 12px; }
}
`;
    document.head.appendChild(el);
  }

  applyTheme();
  EL.innerHTML = '<div class="s-state"><div class="s-spinner"></div>加载服事安排…</div>';

  /* ── 拉取数据 ─────────────────────────────────────────── */
  if (!API || API === 'DEMO') { setTimeout(function () { boot(demo()); }, 200); return; }

  fetch(API + '?action=all')
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (res) {
      if (!res.ok) throw new Error(res.error || '脚本错误');
      boot(res.data);
    })
    .catch(function (e) {
      EL.innerHTML = '<div class="s-error">⚠ ' + esc(e.message)
        + '<br><small style="opacity:.5">请确认 Apps Script 已部署，访问权限为「所有人」</small></div>';
    });

  /* ── 高亮状态 ─────────────────────────────────────────── */
  var locked = null;

  /* ── 初始化 ───────────────────────────────────────────── */
  function boot(rows) {
    if (!rows || !rows.length) {
      EL.innerHTML = '<div class="s-state">暂无服事安排数据</div>';
      return;
    }

    // 按月分组
    var months = {};
    rows.forEach(function (r) {
      var m = tv(r.month); if (!m) return;
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
    allTypes.sort(function (a, b) { return (tord[a]||9) - (tord[b]||9); });

    var activeFilter = '全部';
    render(curIdx);

    function render(i) {
      locked = null;
      var key = keys[i];

      /* ── Zone 1: 月份导航 + 操作按钮 ── */
      // 月份导航：←  前一月  当前月(active)  下一月  →
      var navInner = '';
      if (i > 0) {
        navInner += '<button class="s-nav-btn arrow" id="sPrev">←</button>'
          + '<button class="s-nav-btn" id="sPrevM">' + keys[i-1] + '</button>';
      }
      navInner += '<button class="s-nav-btn active">' + key + '</button>';
      if (i < keys.length - 1) {
        navInner += '<button class="s-nav-btn" id="sNextM">' + keys[i+1] + '</button>'
          + '<button class="s-nav-btn arrow" id="sNext">→</button>';
      }

      /* ── Zone 2: 类型筛选 ── */
      var filterInner = '<button class="s-pill all' + (activeFilter==='全部'?' on':'') + '" data-f="全部">全部</button>';
      if (allTypes.length > 1) filterInner += '<span class="s-filter-divider"></span>';
      allTypes.forEach(function (tp) {
        var tc = getTC(tp);
        var on = activeFilter === tp;
        filterInner += '<button class="s-pill' + (on?' on':'') + '" data-f="' + esc(tp) + '"'
          + (on ? ' style="background:' + tc.tag + ';border-color:' + tc.tag + '"' : '') + '>'
          + '<span class="s-pill-dot" style="background:' + tc.accent + '"></span>'
          + esc(tp) + '</button>';
      });

      /* ── 表格 ── */
      var hdr = '<th class="s-corner">聚会</th>'
        + COLS.map(function (c) { return '<th class="s-col-hdr">' + c.label + '</th>'; }).join('');

      var cg = '<colgroup><col style="width:130px">'
        + COLS.map(function () { return '<col>'; }).join('') + '</colgroup>';

      var svcs = months[key].filter(function (s) {
        return activeFilter === '全部' || s.type === activeFilter;
      }).sort(function (a, b) {
        var dw = word(a.week) - word(b.week); if (dw) return dw;
        return (tord[a.type]||9) - (tord[b.type]||9);
      });

      var tbody = '';
      var prevWk = '';
      svcs.forEach(function (s, idx) {
        var tc = getTC(s.type);
        if (s.week !== prevWk) {
          if (idx > 0) tbody += '<tr class="s-week-sep"><td colspan="' + (COLS.length+1) + '"></td></tr>';
          prevWk = s.week;
        }

        var info = '<td class="s-row-info" style="border-left-color:' + tc.accent + '">'
          + '<span class="s-week-label">' + esc(s.week) + '</span>'
          + '<span class="s-month-label">' + esc(s.month) + '</span>'
          + '<span class="s-type-tag" style="background:' + tc.tag + ';color:' + tc.txt + '">' + esc(s.type) + '</span>'
          + '</td>';

        tbody += '<tr>' + info + COLS.map(function (c) { return renderTd(c, s[c.key]||''); }).join('') + '</tr>';
      });

      if (!svcs.length) {
        tbody = '<tr><td colspan="' + (COLS.length+1) + '" style="padding:48px;text-align:center;color:var(--s-tx-3);font-size:14px">暂无数据</td></tr>';
      }

      EL.innerHTML =
        // Zone 1
        '<div class="s-hdr-nav">'
          + '<div class="s-month-nav">' + navInner + '</div>'
          + '<div class="s-actions">'
            + '<button class="s-icon-btn" id="sTheme" title="切换主题">' + (isDark ? '☀️' : '🌙') + '</button>'
            + '<button class="s-text-btn" id="sExp">' + svgDL() + '导出图片</button>'
          + '</div>'
        + '</div>'
        // Zone 2
        + '<div class="s-hdr-filter" id="sFilters">' + filterInner + '</div>'
        // Table
        + '<div class="s-table-wrap">'
          + '<table class="s-table" id="sTable">' + cg
            + '<thead><tr>' + hdr + '</tr></thead>'
            + '<tbody>' + tbody + '</tbody>'
          + '</table>'
        + '</div>';

      // 事件
      var prev  = EL.querySelector('#sPrev');
      var prevM = EL.querySelector('#sPrevM');
      var next  = EL.querySelector('#sNext');
      var nextM = EL.querySelector('#sNextM');
      var exp   = EL.querySelector('#sExp');
      var theme = EL.querySelector('#sTheme');
      var fbox  = EL.querySelector('#sFilters');

      if (prev)  prev.addEventListener('click',  function () { render(i-1); });
      if (prevM) prevM.addEventListener('click', function () { render(i-1); });
      if (next)  next.addEventListener('click',  function () { render(i+1); });
      if (nextM) nextM.addEventListener('click', function () { render(i+1); });
      if (exp)   exp.addEventListener('click',   function () { exportPng(key); });
      if (theme) theme.addEventListener('click', function () {
        isDark = !isDark;
        try { localStorage.setItem('cecp-theme', isDark?'dark':'light'); } catch(e){}
        applyTheme();
        render(i);
      });
      if (fbox) fbox.querySelectorAll('.s-pill').forEach(function (b) {
        b.addEventListener('click', function () { activeFilter = this.dataset.f; render(i); });
      });

      bindHL();
    }
  }

  /* ── 渲染 td ──────────────────────────────────────────── */
  function renderTd(col, val) {
    if (col.kind === 'reading') {
      var rd = parseReading(val);
      if (!rd || !rd.name) return '<td class="s-cell"><span class="s-empty">—</span></td>';
      return '<td class="s-cell"><span class="s-rd-ref">' + esc(rd.ref) + '</span>' + mkBadge(rd.name) + '</td>';
    }
    if (col.kind === 'note') {
      if (!val) return '<td class="s-cell"><span class="s-empty">—</span></td>';
      var m = val.match(/^(证道[：:]\s*)(.+)$/);
      if (m) return '<td class="s-cell"><span class="s-note-pfx">' + esc(m[1]) + '</span>' + mkBadge(m[2]) + '</td>';
      return '<td class="s-cell">' + mkBadge(val) + '</td>';
    }
    if (!val) return '<td class="s-cell"><span class="s-empty">—</span></td>';
    var ns = val.split(/[\/\n]/).map(function (n) { return n.trim(); }).filter(Boolean);
    return '<td class="s-cell">' + ns.map(mkBadge).join('') + '</td>';
  }

  function mkBadge(name) {
    if (!name) return '';
    var c = badgeColor(name);
    if (!c) return '<span class="s-badge" style="background:var(--s-bg-3);color:var(--s-muted)">' + esc(name) + '</span>';
    return '<span class="s-badge" data-n="' + esc(name) + '" style="background:' + c[0] + ';color:' + c[1] + '">' + esc(name) + '</span>';
  }

  function parseReading(v) {
    if (!v) return null;
    var m = v.match(/^(诗\d+)\s+(.+)$/);
    return m ? { ref: m[1], name: m[2].trim() } : { ref: v, name: '' };
  }

  /* ── 高亮 ─────────────────────────────────────────────── */
  function allB() { return EL.querySelectorAll('.s-badge'); }

  function applyHL(name, lock) {
    allB().forEach(function (b) {
      var n = b.dataset.n || b.textContent;
      b.classList.remove('lit','dim','locked','ldim');
      if (n === name) b.classList.add(lock ? 'locked' : 'lit');
      else            b.classList.add(lock ? 'ldim'   : 'dim');
    });
  }
  function clearHL() { allB().forEach(function (b) { b.classList.remove('lit','dim','locked','ldim'); }); }

  function bindHL() {
    allB().forEach(function (b) {
      var n = b.dataset.n || b.textContent;
      b.addEventListener('mouseenter', function () { if (!locked) applyHL(n, false); });
      b.addEventListener('mouseleave', function () { if (!locked) clearHL(); });
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        if (locked === n) { locked = null; clearHL(); }
        else { locked = n; applyHL(n, true); }
      });
    });
    EL.addEventListener('click', function () { if (locked) { locked = null; clearHL(); } });
  }

  /* ── 导出 PNG ─────────────────────────────────────────── */
  function exportPng(key) {
    var btn = EL.querySelector('#sExp');
    var tbl = EL.querySelector('#sTable');
    if (!btn || !tbl) return;
    btn.disabled = true; btn.textContent = '处理中…';

    function run() {
      window.html2canvas(tbl, { backgroundColor: isDark?'#0f0f0f':'#fff', scale: 2, useCORS: true, logging: false })
        .then(function (c) {
          var a = document.createElement('a');
          a.download = '服事安排_' + key + '.png';
          a.href = c.toDataURL('image/png'); a.click();
          btn.innerHTML = svgDL() + '导出图片'; btn.disabled = false;
        })
        .catch(function () { btn.textContent = '导出失败'; btn.disabled = false; });
    }

    if (!window.html2canvas) {
      var sc = document.createElement('script');
      sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      sc.onload = run; document.head.appendChild(sc);
    } else { run(); }
  }

  /* ── 工具 ─────────────────────────────────────────────── */
  function mord(s) { var m = String(s).match(/^(\d{1,2})月$/); return m ? parseInt(m[1],10) : 99; }
  function word(s) { return {'第一周':1,'第二周':2,'第三周':3,'第四周':4,'第五周':5}[s] || 99; }
  function tv(v)   { return String(v==null?'':v).trim(); }
  function esc(s)  { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function svgDL() {
    return '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M7 1v8M4 6l3 3 3-3M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1"/></svg>';
  }

  /* ── Demo ─────────────────────────────────────────────── */
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
