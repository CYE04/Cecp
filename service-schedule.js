/**
 * service-schedule.js v14.0 — CECP 事工表
 * 适配新版 Apps Script 字段：
 * leader / worship / band / prayerLeader / praisePrayer / memorialPrayer / reading / note
 */
(function () {
  'use strict';

  var EL = document.getElementById('cecp-schedule');
  if (!EL) return;
  var API = (EL.dataset.api || '').trim();

  /* ── 岗位列 ──────────────────────────────────────────── */
  var COLS = [
    { key: 'leader',         label: '主领 / 司仪', kind: 'badges'  },
    { key: 'worship',        label: '敬拜带领',    kind: 'badges'  },
    { key: 'band',           label: '乐手 / 司琴', kind: 'badges'  },
    { key: 'prayerLeader',   label: '祷告会带领',  kind: 'badges'  },
    { key: 'praisePrayer',   label: '颂赞祷告',    kind: 'badges'  },
    { key: 'memorialPrayer', label: '纪念祷告',    kind: 'badges'  },
    { key: 'reading',        label: '读　　经',    kind: 'reading' },
    { key: 'note',           label: '证道讲员',    kind: 'note'    },
  ];

  /* ── 类型色 ───────────────────────────────────────────── */
  var TYPE_C = {
    '主日下午': { accent:'#3a78d4', dark:{ bg:'#1c3870', tx:'#82bcf0' }, light:{ bg:'#2a5eb8', tx:'#ffffff' } },
    '主日晚上': { accent:'#8040d0', dark:{ bg:'#3a1c70', tx:'#c090f0' }, light:{ bg:'#6838b0', tx:'#ffffff' } },
    '青年团契': { accent:'#28a85a', dark:{ bg:'#1a5030', tx:'#60e898' }, light:{ bg:'#1a7840', tx:'#ffffff' } }
  };
  var TYPE_DEF = { accent:'#707070', dark:{ bg:'#2a2a2a', tx:'#b8b8b8' }, light:{ bg:'#8c8c8c', tx:'#ffffff' } };

  /* ── Badge 色板 ───────────────────────────────────────── */
  var PAL_D = [
    ['#0c2848','#6ab4ec'],['#0a3018','#56c87c'],['#2c1050','#a870e0'],
    ['#3c0c1e','#d86888'],['#082830','#50b8c8'],['#2c1c04','#c89838'],
    ['#0c2040','#6080cc'],['#200c40','#9068cc'],['#0c2420','#60b888'],
    ['#321408','#c07860'],['#082430','#50a8bc'],['#1c0e40','#7870cc'],
    ['#300c10','#c06868'],['#0c300c','#68c068'],['#0c0c30','#6868c0'],
    ['#0e3028','#58b0a0'],['#301c04','#b09058'],['#141238','#7878b8'],
  ];
  var PAL_L = [
    ['#355c7d','#edf3f8'],
    ['#3d6b52','#edf6f0'],
    ['#6b4c9a','#f2ecfa'],
    ['#9a4d67','#faedf2'],
    ['#3f6f78','#edf7f8'],
    ['#8b6a2f','#faf4e8'],
    ['#46639a','#edf1fa'],
    ['#6b5aa6','#f1eefb'],
    ['#467565','#edf7f3'],
    ['#8b624e','#f8f0ec'],
    ['#416a82','#edf5f8'],
    ['#5b4e8f','#f0eef8'],
    ['#8f5968','#f9edf0'],
    ['#4c8457','#eef8f0'],
    ['#4c5f9a','#eef1fa'],
    ['#3e7a77','#ecf8f6'],
    ['#86684a','#f7f1ea'],
    ['#5a5f8f','#eef0f8'],
  ];

  /* ── 主题 ─────────────────────────────────────────────── */
  var isDark = true;
  try {
    var saved = localStorage.getItem('cecp-theme');
    if (saved) isDark = saved === 'dark';
    else isDark = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  } catch (e) {}

  function tc(type) {
    var t = TYPE_C[type] || TYPE_DEF;
    return {
      accent: t.accent,
      bg: isDark ? t.dark.bg : t.light.bg,
      tx: isDark ? t.dark.tx : t.light.tx
    };
  }

  function badgeColor(name) {
    if (!name) return null;
    var h = 0;
    for (var i = 0; i < name.length; i++) h = (Math.imul(31, h) + name.charCodeAt(i)) | 0;
    return (isDark ? PAL_D : PAL_L)[Math.abs(h) % PAL_D.length];
  }

  function applyTheme() {
    EL.classList.toggle('cec-dk', isDark);
    EL.classList.toggle('cec-lt', !isDark);
  }

  /* ── CSS ──────────────────────────────────────────────── */
  if (!document.getElementById('_cec14')) {
    var st = document.createElement('style');
    st.id = '_cec14';
    st.textContent = `
#cecp-schedule{
  font-family:"PingFang SC","Noto Sans SC","Microsoft YaHei",system-ui,sans-serif;
  border-radius:18px;
  overflow:hidden;
  box-sizing:border-box;
  width:100%;
  border:1px solid var(--ln);
  box-shadow:0 10px 30px rgba(0,0,0,.06);
}
#cecp-schedule *{box-sizing:border-box;margin:0;padding:0}

#cecp-schedule.cec-dk{
  background:#101114;color:#e5e7eb;
  --bg:#101114;--bg2:#151821;--bg3:#1b2030;--bg4:#242b3d;
  --ln:#1b2231;--ln2:#243047;--ln3:#33415d;
  --tx:#e5e7eb;--tx2:#9aa4b2;--tx3:#556070;
  --muted:#7f8aa0;--muted2:#222938;
  --hdr:#11141c;--hdr2:#121722;--hdr3:#131a27;
  --rd:#9fd3a8;--nt:#e7c47a;
}
#cecp-schedule.cec-lt{
  background:#fcfcfd;color:#1f2937;
  --bg:#fcfcfd;--bg2:#f7f8fa;--bg3:#f1f4f8;--bg4:#e9eef5;
  --ln:#e8edf3;--ln2:#d9e1ec;--ln3:#c7d2df;
  --tx:#1f2937;--tx2:#6b7280;--tx3:#b5bec9;
  --muted:#6b7280;--muted2:#eef2f7;
  --hdr:#fafbfc;--hdr2:#f7f8fa;--hdr3:#f5f7fa;
  --rd:#2f6b45;--nt:#8a6420;
}

.cec-btn{
  border:none;background:none;cursor:pointer;
  font-family:inherit;display:inline-flex;align-items:center;justify-content:center;
  white-space:nowrap;transition:background .14s,color .14s,border-color .14s,transform .14s;
  letter-spacing:.01em;flex-shrink:0;
}

/* Zone 1 */
.cec-z1{
  display:flex;align-items:center;gap:10px;
  padding:14px 16px;
  background:var(--hdr);
  border-bottom:1px solid var(--ln);
}
.cec-month-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.cec-tools{margin-left:auto;display:flex;align-items:center;gap:8px}

.cec-btn-month{
  height:40px;padding:0 18px;
  border-radius:12px;
  border:1px solid transparent;
  color:var(--tx2);font-size:14px;font-weight:600;
  background:transparent;
}
.cec-btn-month:hover:not(.on){
  background:var(--bg3);color:var(--tx);border-color:var(--ln2);
}
.cec-btn-month.on{
  background:var(--bg4);color:var(--tx);
  border:1px solid var(--ln3);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.04);
}

.cec-btn-arr,.cec-btn-icon{
  width:40px;height:40px;
  border-radius:12px;border:1px solid var(--ln2);
  color:var(--tx2);font-size:14px;
  background:var(--bg2);
}
.cec-btn-arr:hover,.cec-btn-icon:hover{
  background:var(--bg3);color:var(--tx);border-color:var(--ln3);
}

.cec-btn-tool{
  height:40px;padding:0 16px;gap:6px;
  border-radius:12px;border:1px solid var(--ln2);
  color:var(--tx2);font-size:13px;font-weight:600;
  background:var(--bg2);
}
.cec-btn-tool:hover{
  background:var(--bg3);color:var(--tx);border-color:var(--ln3);
}
.cec-btn-tool:disabled{opacity:.42;cursor:not-allowed}

/* Zone 2 */
.cec-z2{
  display:flex;align-items:center;gap:6px;
  padding:10px 16px;
  background:var(--hdr2);
  border-bottom:1px solid var(--ln);
  flex-wrap:wrap;
}
.cec-zlbl{
  font-size:11px;font-weight:700;color:var(--tx2);
  letter-spacing:.08em;text-transform:uppercase;
  margin-right:4px;flex-shrink:0;
}
.cec-btn-week{
  height:34px;padding:0 14px;
  border-radius:10px;border:1px solid transparent;
  color:var(--tx2);font-size:13px;font-weight:600;
  background:transparent;
}
.cec-btn-week:hover:not(.on){
  background:var(--bg3);color:var(--tx);border-color:var(--ln2);
}
.cec-btn-week.on{
  background:var(--bg4);color:var(--tx);
  border:1px solid var(--ln3);
}
.cec-btn-week.all.on{
  background:var(--tx);color:var(--bg);border-color:var(--tx);
}

/* Zone 3 */
.cec-z3{
  display:flex;align-items:center;gap:6px;
  padding:10px 16px 12px;
  background:var(--hdr3);
  border-bottom:1px solid var(--ln);
  flex-wrap:wrap;
}
.cec-btn-type{
  height:30px;padding:0 12px;gap:6px;
  border-radius:999px;border:1px solid transparent;
  color:var(--tx2);font-size:12px;font-weight:600;
  background:transparent;
}
.cec-btn-type:hover:not(.on){
  background:var(--bg3);color:var(--tx);border-color:var(--ln2);
}
.cec-btn-type.on{
  font-weight:700;color:var(--bg);
}
.cec-btn-type.all.on{
  background:var(--tx);border-color:var(--tx);
}
.cec-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}

/* Table */
.cec-wrap{width:100%;overflow-x:auto;background:var(--bg)}
.cec-tbl{border-collapse:separate;border-spacing:0;width:100%;table-layout:fixed}
.cec-tbl th,.cec-tbl td{
  border-bottom:1px solid var(--ln);
  border-right:1px solid var(--ln);
  vertical-align:middle;
}
.cec-tbl tr th:last-child,.cec-tbl tr td:last-child{border-right:none}

.cec-chdr{
  background:var(--bg2);padding:14px 12px;
  font-size:12px;font-weight:700;color:var(--tx2);
  text-align:center;white-space:nowrap;letter-spacing:.04em;
  position:sticky;top:0;z-index:2;
  border-bottom:1px solid var(--ln2)!important;
}
.cec-corner{
  background:var(--bg2);padding:14px 12px;
  font-size:11px;color:var(--tx3);text-align:center;
  position:sticky;top:0;z-index:3;
  border-bottom:1px solid var(--ln2)!important;
  border-right:1px solid var(--ln2)!important;
  letter-spacing:.05em;text-transform:uppercase;
}

.cec-info{
  padding:16px 14px;text-align:left;
  border-right:1px solid var(--ln2)!important;
  border-left:4px solid transparent;
  min-width:140px;width:140px;background:var(--bg);
}
.cec-wk{
  display:block;font-size:20px;font-weight:900;
  line-height:1.05;letter-spacing:-.03em;color:var(--tx);
}
.cec-mo{
  display:block;font-size:11px;font-weight:600;
  color:var(--tx2);margin-top:5px;
}
.cec-tag{
  display:inline-flex;align-items:center;
  margin-top:10px;padding:5px 10px;border-radius:999px;
  font-size:11px;font-weight:700;line-height:1.2;
}

.cec-cell{
  padding:14px 12px;text-align:center;background:var(--bg);
  transition:background .12s ease;
}
.cec-cell:hover{background:var(--bg2)}

.cec-ref{
  display:block;font-size:11px;font-weight:800;color:var(--rd);
  margin-bottom:4px;letter-spacing:.04em
}
.cec-npfx{
  display:block;font-size:11px;font-weight:800;color:var(--nt);
  margin-bottom:4px
}
.cec-sep td{
  height:8px;background:var(--bg2);
  border-bottom:1px solid var(--ln2)!important;border-right:none!important
}
.cec-empty{color:var(--tx3);font-size:14px}

/* Badge */
.cec-badge{
  display:inline-block;
  padding:5px 10px;
  border-radius:999px;
  font-size:12px;
  font-weight:700;
  line-height:1.35;
  margin:3px;
  white-space:nowrap;
  cursor:pointer;
  letter-spacing:.01em;
  transition:opacity .12s,transform .12s,box-shadow .12s;
  user-select:none;
  position:relative;
}
.cec-badge.lit{transform:scale(1.08);box-shadow:0 0 0 2px rgba(255,255,255,.24);z-index:1}
.cec-badge.dim{opacity:.16}
.cec-badge.locked{transform:scale(1.1);box-shadow:0 0 0 2.5px rgba(255,255,255,.5);z-index:1}
.cec-badge.ldim{opacity:.1}
.cec-lt .cec-badge.lit{box-shadow:0 0 0 2px rgba(0,0,0,.18)}
.cec-lt .cec-badge.locked{box-shadow:0 0 0 2.5px rgba(0,0,0,.34)}

/* 状态 */
.cec-state{
  display:flex;align-items:center;justify-content:center;gap:12px;
  padding:64px 24px;color:var(--tx2);font-size:14px
}
.cec-spin{
  width:20px;height:20px;border:2px solid var(--ln2);
  border-top-color:var(--muted);border-radius:50%;
  animation:cspin .7s linear infinite;flex-shrink:0
}
@keyframes cspin{to{transform:rotate(360deg)}}
.cec-err{padding:24px;color:#b04040;font-size:14px;line-height:1.8}

/* 响应式 */
@media(max-width:820px){
  .cec-info{min-width:120px;width:120px}
  .cec-wk{font-size:18px}
  .cec-cell{padding:12px 10px}
}
@media(max-width:560px){
  .cec-z1,.cec-z2,.cec-z3{padding-left:10px;padding-right:10px}
  .cec-month-row{gap:4px}
  .cec-tools{gap:6px}
  .cec-btn-month,.cec-btn-tool,.cec-btn-arr,.cec-btn-icon{height:36px}
  .cec-btn-arr,.cec-btn-icon{width:36px}
  .cec-btn-month{padding:0 12px;font-size:13px}
  .cec-btn-week{height:32px;padding:0 11px;font-size:12px}
  .cec-btn-type{height:28px;padding:0 10px;font-size:11px}
  .cec-info{min-width:100px;width:100px;padding:12px 10px}
  .cec-wk{font-size:16px}
  .cec-mo{font-size:10px}
  .cec-cell{padding:10px 8px}
  .cec-chdr,.cec-corner{padding:10px 8px;font-size:11px}
  .cec-badge{font-size:11px;padding:4px 8px}
}
`;
    document.head.appendChild(st);
  }

  applyTheme();
  EL.innerHTML = '<div class="cec-state"><div class="cec-spin"></div>加载服事安排…</div>';

  /* ── 数据获取 ─────────────────────────────────────────── */
  if (!API || API === 'DEMO') {
    setTimeout(function () { boot(demo()); }, 200);
    return;
  }

  fetch(API + '?action=all')
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (res) {
      if (!res.ok) throw new Error(res.error || '脚本错误');
      boot(res.data);
    })
    .catch(function (e) {
      EL.innerHTML = '<div class="cec-err">⚠ ' + esc(e.message) +
        '<br><small style="opacity:.55">请确认 Apps Script 已重新部署，访问权限为「所有人」</small></div>';
    });

  var locked = null;

  /* ── 初始化 ───────────────────────────────────────────── */
  function boot(rows) {
    if (!rows || !rows.length) {
      EL.innerHTML = '<div class="cec-state">暂无服事安排数据</div>';
      return;
    }

    var months = {};
    rows.forEach(function (r) {
      var m = tv(r.month);
      if (!m) return;
      if (!months[m]) months[m] = [];
      months[m].push(r);
    });

    var mkeys = Object.keys(months).sort(function (a, b) { return mord(a) - mord(b); });
    if (!mkeys.length) return;

    var nowM = (new Date().getMonth() + 1) + '月';
    var mIdx = mkeys.indexOf(nowM);
    if (mIdx < 0) {
      for (var i = 0; i < mkeys.length; i++) {
        if (mord(mkeys[i]) >= mord(nowM)) { mIdx = i; break; }
      }
    }
    if (mIdx < 0) mIdx = mkeys.length - 1;

    var allTypes = [];
    rows.forEach(function (r) {
      if (r.type && allTypes.indexOf(r.type) < 0) allTypes.push(r.type);
    });

    var tord = { '主日下午':0, '主日晚上':1, '青年团契':2 };
    allTypes.sort(function (a, b) { return (tord[a] || 9) - (tord[b] || 9); });

    var activeType = '全部';
    var activeWeek = '全部';

    render(mIdx);

    function render(i) {
      locked = null;
      var key = mkeys[i];

      var weeksInMonth = [];
      (months[key] || []).forEach(function (r) {
        if (r.week && weeksInMonth.indexOf(r.week) < 0) weeksInMonth.push(r.week);
      });
      weeksInMonth.sort(function (a, b) { return word(a) - word(b); });

      var z1 = '<div class="cec-month-row">';
      if (i > 0) z1 += '<button class="cec-btn cec-btn-arr" id="cPA">&#8592;</button>';
      if (i > 0) z1 += '<button class="cec-btn cec-btn-month" id="cPM">' + esc(mkeys[i - 1]) + '</button>';
      z1 += '<button class="cec-btn cec-btn-month on">' + esc(key) + '</button>';
      if (i < mkeys.length - 1) z1 += '<button class="cec-btn cec-btn-month" id="cNM">' + esc(mkeys[i + 1]) + '</button>';
      if (i < mkeys.length - 1) z1 += '<button class="cec-btn cec-btn-arr" id="cNA">&#8594;</button>';
      z1 += '</div><div class="cec-tools">' +
        '<button class="cec-btn cec-btn-icon" id="cTH" title="切换主题">' + (isDark ? '&#9728;' : '&#9790;') + '</button>' +
        '<button class="cec-btn cec-btn-tool" id="cEX">' + svgDL() + '导出</button>' +
      '</div>';

      var z2 = '<span class="cec-zlbl">周次</span>' +
        '<button class="cec-btn cec-btn-week all' + (activeWeek === '全部' ? ' on' : '') + '" data-w="全部">全部</button>';
      weeksInMonth.forEach(function (w) {
        z2 += '<button class="cec-btn cec-btn-week' + (activeWeek === w ? ' on' : '') + '" data-w="' + esc(w) + '">' + esc(w) + '</button>';
      });

      var z3 = '<span class="cec-zlbl">类型</span>' +
        '<button class="cec-btn cec-btn-type all' + (activeType === '全部' ? ' on' : '') + '" data-t="全部">全部</button>';
      allTypes.forEach(function (tp) {
        var c = tc(tp);
        var on = activeType === tp;
        z3 += '<button class="cec-btn cec-btn-type' + (on ? ' on' : '') + '" data-t="' + esc(tp) + '"' +
          (on ? ' style="background:' + c.bg + ';border-color:' + c.bg + '"' : '') + '>' +
          '<span class="cec-dot" style="background:' + c.accent + '"></span>' + esc(tp) +
        '</button>';
      });

      var hdr = '<th class="cec-corner">聚会</th>' +
        COLS.map(function (c) { return '<th class="cec-chdr">' + c.label + '</th>'; }).join('');

      var cg = '<colgroup><col style="width:140px">' +
        COLS.map(function () { return '<col>'; }).join('') +
      '</colgroup>';

      var svcs = (months[key] || []).filter(function (s) {
        var okT = activeType === '全部' || s.type === activeType;
        var okW = activeWeek === '全部' || s.week === activeWeek;
        return okT && okW;
      }).sort(function (a, b) {
        var dw = word(a.week) - word(b.week);
        if (dw) return dw;
        return (tord[a.type] || 9) - (tord[b.type] || 9);
      });

      var tbody = '';
      var prevW = '';
      svcs.forEach(function (s, idx) {
        var c = tc(s.type);
        if (s.week !== prevW) {
          if (idx > 0) tbody += '<tr class="cec-sep"><td colspan="' + (COLS.length + 1) + '"></td></tr>';
          prevW = s.week;
        }

        var info = '<td class="cec-info" style="border-left-color:' + c.accent + '">' +
          '<span class="cec-wk">' + esc(s.week) + '</span>' +
          '<span class="cec-mo">' + esc(s.month) + '</span>' +
          '<span class="cec-tag" style="background:' + c.bg + ';color:' + c.tx + '">' + esc(s.type) + '</span>' +
        '</td>';

        tbody += '<tr>' + info + COLS.map(function (col) {
          return renderTd(col, s[col.key] || '');
        }).join('') + '</tr>';
      });

      if (!svcs.length) {
        tbody = '<tr><td colspan="' + (COLS.length + 1) + '" style="padding:48px;text-align:center;color:var(--tx3);font-size:14px">暂无数据</td></tr>';
      }

      EL.innerHTML =
        '<div class="cec-z1">' + z1 + '</div>' +
        '<div class="cec-z2" id="cZ2">' + z2 + '</div>' +
        '<div class="cec-z3" id="cZ3">' + z3 + '</div>' +
        '<div class="cec-wrap"><table class="cec-tbl" id="cTbl">' +
          cg +
          '<thead><tr>' + hdr + '</tr></thead>' +
          '<tbody>' + tbody + '</tbody>' +
        '</table></div>';

      bindNav(EL.querySelector('#cPA'), function () { render(i - 1); });
      bindNav(EL.querySelector('#cPM'), function () { render(i - 1); });
      bindNav(EL.querySelector('#cNA'), function () { render(i + 1); });
      bindNav(EL.querySelector('#cNM'), function () { render(i + 1); });
      bindNav(EL.querySelector('#cTH'), function () {
        isDark = !isDark;
        try { localStorage.setItem('cecp-theme', isDark ? 'dark' : 'light'); } catch (e) {}
        applyTheme();
        render(i);
      });
      bindNav(EL.querySelector('#cEX'), function () { exportPng(key); });

      var z2el = EL.querySelector('#cZ2');
      if (z2el) {
        z2el.querySelectorAll('.cec-btn-week').forEach(function (b) {
          b.addEventListener('click', function () {
            activeWeek = this.dataset.w;
            render(i);
          });
        });
      }

      var z3el = EL.querySelector('#cZ3');
      if (z3el) {
        z3el.querySelectorAll('.cec-btn-type').forEach(function (b) {
          b.addEventListener('click', function () {
            activeType = this.dataset.t;
            render(i);
          });
        });
      }

      bindHL();
    }
  }

  function bindNav(el, fn) {
    if (el) el.addEventListener('click', fn);
  }

  /* ── 渲染 td ──────────────────────────────────────────── */
  function renderTd(col, val) {
    if (col.kind === 'reading') {
      var rd = parseRd(val);
      if (!rd || (!rd.ref && !rd.name)) {
        return '<td class="cec-cell"><span class="cec-empty">—</span></td>';
      }
      if (rd.name) {
        return '<td class="cec-cell"><span class="cec-ref">' + esc(rd.ref) + '</span>' + mkB(rd.name) + '</td>';
      }
      return '<td class="cec-cell"><span class="cec-ref">' + esc(rd.ref) + '</span></td>';
    }

    if (col.kind === 'note') {
      if (!val) return '<td class="cec-cell"><span class="cec-empty">—</span></td>';
      var m = String(val).match(/^(证道[：:]\s*)(.+)$/);
      if (m) {
        return '<td class="cec-cell"><span class="cec-npfx">' + esc(m[1]) + '</span>' + mkB(m[2]) + '</td>';
      }
      return '<td class="cec-cell">' + mkB(val) + '</td>';
    }

    if (!val) return '<td class="cec-cell"><span class="cec-empty">—</span></td>';

    return '<td class="cec-cell">' +
      String(val).split(/[\/\n]/).map(function (n) {
        n = n.trim();
        return n ? mkB(n) : '';
      }).filter(Boolean).join('') +
    '</td>';
  }

  function mkB(name) {
    if (!name) return '';
    var c = badgeColor(name);
    if (!c) return '<span class="cec-badge" style="background:var(--bg3);color:var(--muted)">' + esc(name) + '</span>';
    return '<span class="cec-badge" data-n="' + esc(name) + '" style="background:' + c[0] + ';color:' + c[1] + '">' + esc(name) + '</span>';
  }

  function parseRd(v) {
    if (!v) return null;
    var s = String(v).trim();
    var m = s.match(/^(.+?)\s+(.+)$/);
    if (m) return { ref: m[1], name: m[2].trim() };
    return { ref: s, name: '' };
  }

  /* ── 高亮 ─────────────────────────────────────────────── */
  function allB() { return EL.querySelectorAll('.cec-badge'); }

  function applyHL(n, lk) {
    allB().forEach(function (b) {
      var bn = b.dataset.n || b.textContent;
      b.classList.remove('lit', 'dim', 'locked', 'ldim');
      if (bn === n) b.classList.add(lk ? 'locked' : 'lit');
      else b.classList.add(lk ? 'ldim' : 'dim');
    });
  }

  function clearHL() {
    allB().forEach(function (b) {
      b.classList.remove('lit', 'dim', 'locked', 'ldim');
    });
  }

  function bindHL() {
    allB().forEach(function (b) {
      var n = b.dataset.n || b.textContent;
      b.addEventListener('mouseenter', function () {
        if (!locked) applyHL(n, false);
      });
      b.addEventListener('mouseleave', function () {
        if (!locked) clearHL();
      });
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        if (locked === n) {
          locked = null;
          clearHL();
        } else {
          locked = n;
          applyHL(n, true);
        }
      });
    });
    EL.addEventListener('click', function () {
      if (locked) {
        locked = null;
        clearHL();
      }
    });
  }

  /* ── 导出 ─────────────────────────────────────────────── */
  function exportPng(key) {
    var btn = EL.querySelector('#cEX');
    var tbl = EL.querySelector('#cTbl');
    if (!btn || !tbl) return;

    btn.disabled = true;
    btn.textContent = '处理中…';

    function run() {
      window.html2canvas(tbl, {
        backgroundColor: isDark ? '#101114' : '#fcfcfd',
        scale: 2,
        useCORS: true,
        logging: false
      }).then(function (canvas) {
        var a = document.createElement('a');
        a.download = '服事安排_' + key + '.png';
        a.href = canvas.toDataURL('image/png');
        a.click();
        btn.innerHTML = svgDL() + '导出';
        btn.disabled = false;
      }).catch(function () {
        btn.textContent = '导出失败';
        btn.disabled = false;
      });
    }

    if (!window.html2canvas) {
      var sc = document.createElement('script');
      sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      sc.onload = run;
      document.head.appendChild(sc);
    } else {
      run();
    }
  }

  /* ── 工具 ─────────────────────────────────────────────── */
  function mord(s) {
    var m = String(s).match(/^(\d{1,2})月$/);
    return m ? parseInt(m[1], 10) : 99;
  }

  function word(s) {
    return { '第一周':1, '第二周':2, '第三周':3, '第四周':4, '第五周':5 }[s] || 99;
  }

  function tv(v) {
    return String(v == null ? '' : v).trim();
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function svgDL() {
    return '<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M7 1v8M4 6l3 3 3-3M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1"/></svg>';
  }

  /* ── Demo ─────────────────────────────────────────────── */
  function demo() {
    return [
      {month:'3月',week:'第一周',type:'主日下午',leader:'金展',worship:'胡娜',band:'杨亦佳',prayerLeader:'林文宝',praisePrayer:'林文宝',memorialPrayer:'邱展伟',reading:'诗9 金Silvia',note:'证道：金美德'},
      {month:'3月',week:'第一周',type:'主日晚上',leader:'林文宝',worship:'翁撒该/杨雪克/叶春叶',band:'金紫涵/黄天丽',prayerLeader:'戴献和',praisePrayer:'',memorialPrayer:'',reading:'',note:'证道：金美德'},
      {month:'3月',week:'第一周',type:'青年团契',leader:'',worship:'',band:'',prayerLeader:'',praisePrayer:'',memorialPrayer:'',reading:'',note:'活动游戏'},

      {month:'3月',week:'第二周',type:'主日下午',leader:'林文宝',worship:'吴超凡',band:'青少年',prayerLeader:'翁撒该',praisePrayer:'金展',memorialPrayer:'季连芬',reading:'诗10 季轩',note:'证道：吴恬恬'},
      {month:'3月',week:'第二周',type:'主日晚上',leader:'吴超凡',worship:'吴超凡及青少年',band:'青少年',prayerLeader:'林文宝/董希昆',praisePrayer:'',memorialPrayer:'',reading:'',note:'证道：彭永剑'},
      {month:'3月',week:'第二周',type:'青年团契',leader:'',worship:'',band:'',prayerLeader:'',praisePrayer:'',memorialPrayer:'',reading:'',note:'吴超凡'},

      {month:'3月',week:'第三周',type:'主日下午',leader:'彭永剑',worship:'孙琴乐',band:'季轩/吴以勒',prayerLeader:'徐永西',praisePrayer:'徐永西',memorialPrayer:'谷小英',reading:'诗11 何若诗',note:'证道：陈金东'},
      {month:'3月',week:'第三周',type:'主日晚上',leader:'金展',worship:'胡娜/林文宝',band:'翁撒该',prayerLeader:'徐永西',praisePrayer:'',memorialPrayer:'',reading:'',note:'证道：戴献和'},
      {month:'3月',week:'第三周',type:'青年团契',leader:'',worship:'',band:'',prayerLeader:'',praisePrayer:'',memorialPrayer:'',reading:'',note:'吴恬恬'},

      {month:'3月',week:'第四周',type:'主日下午',leader:'戴献和',worship:'王皞阳',band:'黄天丽/金丽莎',prayerLeader:'胡蓉',praisePrayer:'彭永剑',memorialPrayer:'胡蓉',reading:'诗12 何心如',note:'证道：潘隆正'},
      {month:'3月',week:'第四周',type:'主日晚上',leader:'彭永剑/王皞阳',worship:'叶春叶/董希昆',band:'徐博杰/黄天丽',prayerLeader:'金展',praisePrayer:'',memorialPrayer:'',reading:'',note:'证道：潘隆正'},
      {month:'3月',week:'第四周',type:'青年团契',leader:'',worship:'',band:'',prayerLeader:'',praisePrayer:'',memorialPrayer:'',reading:'',note:'意语敬拜'},

      {month:'3月',week:'第五周',type:'主日下午',leader:'王皞阳',worship:'吴恬恬',band:'谢安/金Silvia',prayerLeader:'金展',praisePrayer:'戴献和',memorialPrayer:'吴恬恬',reading:'诗13 林颖慧',note:'证道：潘庆峰'},
      {month:'3月',week:'第五周',type:'主日晚上',leader:'翁撒该',worship:'金梦熙',band:'胡娜',prayerLeader:'林文宝',praisePrayer:'',memorialPrayer:'',reading:'',note:'证道：潘庆峰'},
      {month:'3月',week:'第五周',type:'青年团契',leader:'',worship:'',band:'',prayerLeader:'',praisePrayer:'',memorialPrayer:'',reading:'',note:'潘庆峰'}
    ];
  }

})();
