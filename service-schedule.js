/**
 * service-schedule.js v15.0 — matrix style
 * 适配新版 Apps Script 字段：
 * leader / worship / band / prayerLeader / praisePrayer / memorialPrayer / reading / note
 */
(function () {
  'use strict';

  var EL = document.getElementById('cecp-schedule');
  if (!EL) return;

  var API = (EL.dataset.api || '').trim();

  /* ── 列定义 ───────────────────────────────────────────── */
  var COLS = [
    { key: 'leader',         label: '主领 / 司仪', kind: 'badges'  },
    { key: 'worship',        label: '敬拜带领',    kind: 'badges'  },
    { key: 'band',           label: '乐手 / 司琴', kind: 'badges'  },
    { key: 'prayerLeader',   label: '祷告会带领',  kind: 'badges'  },
    { key: 'praisePrayer',   label: '颂赞祷告',    kind: 'badges'  },
    { key: 'memorialPrayer', label: '纪念祷告',    kind: 'badges'  },
    { key: 'reading',        label: '读经',        kind: 'reading' },
    { key: 'note',           label: '证道讲员',    kind: 'note'    }
  ];

  /* ── 类型颜色 ─────────────────────────────────────────── */
  var TYPE_C = {
    '主日下午': { accent:'#4a8df0', dark:{ bg:'#1b3b73', tx:'#9fc4ff' }, light:{ bg:'#2c63c8', tx:'#ffffff' } },
    '主日晚上': { accent:'#8d49df', dark:{ bg:'#3f226c', tx:'#c9a0ff' }, light:{ bg:'#6c3fc3', tx:'#ffffff' } },
    '青年团契': { accent:'#33b46d', dark:{ bg:'#1b5633', tx:'#8be3ad' }, light:{ bg:'#22884f', tx:'#ffffff' } }
  };
  var TYPE_DEF = {
    accent:'#7b7f87',
    dark:{ bg:'#31343a', tx:'#c7ccd4' },
    light:{ bg:'#7f8792', tx:'#ffffff' }
  };

  /* ── Badge 调色板 ────────────────────────────────────── */
  var PAL_D = [
    ['#324862','#91b9ea'],['#284b45','#77d2c1'],['#54474a','#c7938b'],['#43515b','#98b9d7'],
    ['#4f5a42','#a8c874'],['#5a4738','#d2a86d'],['#534469','#b197f1'],['#61435a','#de92cb'],
    ['#35556b','#73c4ff'],['#39543b','#7ad87e'],['#674848','#f08d8d'],['#5f5333','#d9c04f'],
    ['#4d5865','#b7c3d3'],['#2c6171','#7fd8f2'],['#66553f','#dbb07f'],['#4f4761','#b6a0ef'],
    ['#416746','#9be28e'],['#6b5038','#efad59'],['#5f4450','#e7a4bb'],['#355a56','#75d1c2']
  ];
  var PAL_L = [
    ['#486c95','#ebf2fb'],['#3f776f','#ebf8f5'],['#8b666d','#f9eff2'],['#587488','#edf4f8'],
    ['#6f7f4f','#f2f7ea'],['#937149','#fbf3e8'],['#78619f','#f3eefb'],['#9b668d','#faf0f7'],
    ['#4f85ae','#edf6fd'],['#4f8452','#eef8ef'],['#a16d6d','#fceeee'],['#9a873b','#faf6e5'],
    ['#677789','#eef3f7'],['#447f95','#ebf8fb'],['#8f7558','#faf3eb'],['#7d709c','#f3f0fa'],
    ['#55865a','#eef8ef'],['#a46f38','#fbf1e5'],['#9a6b7f','#faf0f4'],['#4f817d','#ecf8f6']
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

  /* ── 样式 ─────────────────────────────────────────────── */
  if (!document.getElementById('_cecp_matrix_v15')) {
    var st = document.createElement('style');
    st.id = '_cecp_matrix_v15';
    st.textContent = `
#cecp-schedule{
  font-family:"PingFang SC","Noto Sans SC","Microsoft YaHei",system-ui,sans-serif;
  width:100%;
  box-sizing:border-box;
  border-radius:16px;
  overflow:hidden;
  border:1px solid var(--ln2);
}
#cecp-schedule *{box-sizing:border-box}

/* dark */
#cecp-schedule.cec-dk{
  background:#111214;color:#e8ebf0;
  --bg:#111214;
  --bg2:#17191d;
  --bg3:#1d2026;
  --bg4:#242932;
  --ln:#262a31;
  --ln2:#343943;
  --ln3:#404754;
  --tx:#e8ebf0;
  --tx2:#aeb6c3;
  --tx3:#6e7887;
  --soft:#16181c;
  --soft2:#1b1e24;
  --rd:#97d8a6;
  --nt:#f0cb78;
}

/* light */
#cecp-schedule.cec-lt{
  background:#f7f8fa;color:#1f2937;
  --bg:#f7f8fa;
  --bg2:#f1f3f6;
  --bg3:#e8edf3;
  --bg4:#dde5ef;
  --ln:#dbe2eb;
  --ln2:#cfd8e4;
  --ln3:#bec9d6;
  --tx:#1f2937;
  --tx2:#64748b;
  --tx3:#9ba7b6;
  --soft:#f5f6f8;
  --soft2:#eef2f6;
  --rd:#296942;
  --nt:#8f6920;
}

.cec-btn{
  border:none;
  background:none;
  cursor:pointer;
  font-family:inherit;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  white-space:nowrap;
  transition:background .12s ease,color .12s ease,border-color .12s ease,transform .12s ease,opacity .12s ease;
  letter-spacing:.01em;
  flex-shrink:0;
  appearance:none;
  -webkit-appearance:none;
}

/* top rows */
.cec-z1{
  display:flex;
  align-items:center;
  gap:8px;
  padding:10px 12px;
  background:var(--soft);
  border-bottom:1px solid var(--ln);
}
.cec-month-row{
  display:flex;
  align-items:center;
  gap:6px;
  flex-wrap:wrap;
}
.cec-tools{
  margin-left:auto;
  display:flex;
  align-items:center;
  gap:8px;
}

.cec-btn-month{
  height:34px;
  padding:0 14px;
  border-radius:10px;
  border:1px solid transparent;
  color:var(--tx2);
  font-size:13px;
  font-weight:700;
  background:transparent;
}
.cec-btn-month:hover:not(.on){
  background:var(--bg3);
  color:var(--tx);
  border-color:var(--ln2);
}
.cec-btn-month.on{
  background:var(--bg4);
  color:var(--tx);
  border-color:var(--ln2);
}

.cec-btn-arr,.cec-btn-icon{
  width:34px;
  height:34px;
  border-radius:10px;
  border:1px solid var(--ln2);
  color:var(--tx2);
  background:var(--bg2);
  font-size:13px;
}
.cec-btn-arr:hover,.cec-btn-icon:hover{
  background:var(--bg3);
  color:var(--tx);
  border-color:var(--ln3);
}

.cec-btn-tool{
  height:34px;
  padding:0 14px;
  gap:6px;
  border-radius:10px;
  border:1px solid var(--ln2);
  color:var(--tx2);
  background:var(--bg2);
  font-size:12px;
  font-weight:700;
}
.cec-btn-tool:hover{
  background:var(--bg3);
  color:var(--tx);
  border-color:var(--ln3);
}
.cec-btn-tool:disabled{
  opacity:.45;
  cursor:not-allowed;
}

.cec-z2,.cec-z3{
  display:flex;
  align-items:center;
  gap:6px;
  padding:8px 12px;
  background:var(--soft2);
  border-bottom:1px solid var(--ln);
  flex-wrap:wrap;
}
.cec-zlbl{
  color:var(--tx2);
  font-size:12px;
  font-weight:800;
  margin-right:2px;
}

.cec-btn-week{
  height:30px;
  padding:0 12px;
  border-radius:9px;
  border:1px solid transparent;
  color:var(--tx2);
  background:transparent;
  font-size:12px;
  font-weight:700;
}
.cec-btn-week:hover:not(.on){
  background:var(--bg3);
  color:var(--tx);
}
.cec-btn-week.on{
  background:var(--bg4);
  color:var(--tx);
  border-color:var(--ln2);
}
.cec-btn-week.all.on{
  background:var(--tx);
  color:var(--bg);
  border-color:var(--tx);
}

.cec-btn-type{
  height:28px;
  padding:0 10px;
  gap:6px;
  border-radius:999px;
  border:1px solid transparent;
  color:var(--tx2);
  background:transparent;
  font-size:12px;
  font-weight:700;
}
.cec-btn-type:hover:not(.on){
  background:var(--bg3);
  color:var(--tx);
}
.cec-btn-type.on{
  color:var(--bg);
}
.cec-btn-type.all.on{
  background:var(--tx);
  color:var(--bg);
  border-color:var(--tx);
}
.cec-dot{
  width:8px;
  height:8px;
  border-radius:50%;
  flex-shrink:0;
}

/* table */
.cec-wrap{
  width:100%;
  overflow-x:auto;
  background:var(--bg);
}
.cec-tbl{
  border-collapse:separate;
  border-spacing:0;
  width:max-content;
  min-width:100%;
  table-layout:fixed;
}
.cec-tbl th,.cec-tbl td{
  border-right:1px solid var(--ln2);
  border-bottom:1px solid var(--ln2);
  vertical-align:middle;
}
.cec-tbl tr th:last-child,
.cec-tbl tr td:last-child{border-right:none}

.cec-corner{
  background:rgba(255,255,255,.02);
  padding:14px 10px;
  text-align:center;
  color:var(--tx3);
  font-size:11px;
  font-weight:700;
  letter-spacing:.05em;
  position:sticky;
  top:0;
  z-index:3;
}
.cec-chdr{
  background:rgba(255,255,255,.02);
  padding:14px 10px;
  text-align:center;
  color:var(--tx2);
  font-size:12px;
  font-weight:800;
  letter-spacing:.02em;
  white-space:nowrap;
  position:sticky;
  top:0;
  z-index:2;
}

.cec-info{
  width:112px;
  min-width:112px;
  padding:14px 10px;
  text-align:left;
  background:rgba(255,255,255,.01);
  border-left:3px solid transparent;
}
.cec-wk{
  display:block;
  font-size:18px;
  line-height:1.04;
  font-weight:900;
  color:var(--tx);
  letter-spacing:-.03em;
}
.cec-mo{
  display:block;
  margin-top:5px;
  font-size:11px;
  font-weight:700;
  color:var(--tx3);
}
.cec-tag{
  display:inline-flex;
  align-items:center;
  margin-top:10px;
  padding:4px 8px;
  border-radius:8px;
  font-size:11px;
  font-weight:800;
  line-height:1.1;
}

.cec-cell{
  min-width:132px;
  height:78px;
  padding:14px 10px;
  text-align:center;
  background:transparent;
}
.cec-cell:hover{
  background:rgba(255,255,255,.02);
}

.cec-badges{
  display:flex;
  flex-wrap:wrap;
  justify-content:center;
  align-items:center;
  gap:8px;
  min-height:48px;
}

.cec-badge{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-height:32px;
  padding:6px 12px;
  border-radius:7px;
  font-size:11px;
  font-weight:800;
  line-height:1.2;
  margin:0;
  white-space:nowrap;
  cursor:pointer;
  letter-spacing:.01em;
  transition:opacity .12s ease,transform .12s ease,box-shadow .12s ease,filter .12s ease;
  user-select:none;
  position:relative;
}
.cec-badge.lit{
  transform:translateY(-1px);
  filter:brightness(1.08);
  box-shadow:0 0 0 1px rgba(255,255,255,.16);
}
.cec-badge.dim{opacity:.18}
.cec-badge.locked{
  transform:translateY(-1px);
  filter:brightness(1.12);
  box-shadow:0 0 0 1.5px rgba(255,255,255,.26);
}
.cec-badge.ldim{opacity:.10}
.cec-lt .cec-badge.lit{box-shadow:0 0 0 1px rgba(0,0,0,.14)}
.cec-lt .cec-badge.locked{box-shadow:0 0 0 1.5px rgba(0,0,0,.22)}

.cec-reading{
  display:flex;
  min-height:48px;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:5px;
}
.cec-ref{
  display:block;
  font-size:12px;
  font-weight:800;
  color:var(--rd);
  line-height:1.15;
}
.cec-note{
  display:flex;
  min-height:48px;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:5px;
}
.cec-npfx{
  display:block;
  font-size:11px;
  font-weight:800;
  color:var(--nt);
  line-height:1.1;
}

.cec-empty{
  color:var(--tx3);
  font-size:15px;
  line-height:1;
}

.cec-sep td{
  height:0;
  padding:0;
  background:transparent;
  border-right:none !important;
  border-bottom:1px solid var(--ln2) !important;
}

.cec-state{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:12px;
  padding:60px 24px;
  color:var(--tx2);
  font-size:14px;
}
.cec-spin{
  width:18px;
  height:18px;
  border:2px solid var(--ln3);
  border-top-color:var(--tx2);
  border-radius:50%;
  animation:cecspin .7s linear infinite;
}
@keyframes cecspin{to{transform:rotate(360deg)}}

.cec-err{
  padding:24px;
  color:#cf5e5e;
  font-size:14px;
  line-height:1.8;
}

@media(max-width:760px){
  .cec-z1,.cec-z2,.cec-z3{padding-left:10px;padding-right:10px}
  .cec-info{width:98px;min-width:98px;padding:12px 8px}
  .cec-wk{font-size:16px}
  .cec-mo{font-size:10px}
  .cec-cell{min-width:118px;height:72px;padding:10px 8px}
  .cec-chdr,.cec-corner{padding:12px 8px;font-size:11px}
  .cec-badges{gap:6px;min-height:42px}
  .cec-badge{min-height:28px;padding:5px 10px;font-size:10px;border-radius:6px}
}
@media(max-width:560px){
  .cec-btn-month,.cec-btn-tool,.cec-btn-arr,.cec-btn-icon{height:32px}
  .cec-btn-arr,.cec-btn-icon{width:32px}
  .cec-btn-month{padding:0 11px;font-size:12px}
  .cec-btn-tool{padding:0 11px;font-size:12px}
  .cec-btn-week{height:28px;padding:0 10px;font-size:11px}
  .cec-btn-type{height:26px;padding:0 9px;font-size:11px}
}
`;
    document.head.appendChild(st);
  }

  applyTheme();
  EL.innerHTML = '<div class="cec-state"><div class="cec-spin"></div>加载服事安排…</div>';

  /* ── 获取数据 ─────────────────────────────────────────── */
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
      EL.innerHTML =
        '<div class="cec-err">⚠ ' + esc(e.message) +
        '<br><small style="opacity:.6">请确认 Apps Script 已重新部署，并且 Web App 权限为「所有人」</small></div>';
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

      /* zone 1 */
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

      /* zone 2 */
      var z2 = '<span class="cec-zlbl">周次</span>' +
        '<button class="cec-btn cec-btn-week all' + (activeWeek === '全部' ? ' on' : '') + '" data-w="全部">全部</button>';
      weeksInMonth.forEach(function (w) {
        z2 += '<button class="cec-btn cec-btn-week' + (activeWeek === w ? ' on' : '') + '" data-w="' + esc(w) + '">' + esc(w) + '</button>';
      });

      /* zone 3 */
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

      /* table */
      var hdr = '<th class="cec-corner">聚会</th>' +
        COLS.map(function (c) { return '<th class="cec-chdr">' + c.label + '</th>'; }).join('');

      var cg = '<colgroup>' +
        '<col style="width:112px">' +
        '<col style="width:132px">' +
        '<col style="width:132px">' +
        '<col style="width:132px">' +
        '<col style="width:132px">' +
        '<col style="width:132px">' +
        '<col style="width:132px">' +
        '<col style="width:138px">' +
        '<col style="width:142px">' +
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

  /* ── 单元格渲染 ───────────────────────────────────────── */
  function renderTd(col, val) {
    if (col.kind === 'reading') {
      var rd = parseRd(val);
      if (!rd || (!rd.ref && !rd.name)) {
        return '<td class="cec-cell"><span class="cec-empty">-</span></td>';
      }

      var nameHtml = rd.name ? mkB(rd.name) : '';
      return '<td class="cec-cell"><div class="cec-reading">' +
        '<span class="cec-ref">' + esc(rd.ref) + '</span>' +
        (nameHtml ? nameHtml : '') +
      '</div></td>';
    }

    if (col.kind === 'note') {
      if (!val) return '<td class="cec-cell"><span class="cec-empty">-</span></td>';

      var m = String(val).match(/^(证道[：:]\s*)(.+)$/);
      if (m) {
        return '<td class="cec-cell"><div class="cec-note">' +
          '<span class="cec-npfx">' + esc(m[1]) + '</span>' +
          mkB(m[2]) +
        '</div></td>';
      }

      return '<td class="cec-cell"><div class="cec-note">' + mkB(val) + '</div></td>';
    }

    if (!val) return '<td class="cec-cell"><span class="cec-empty">-</span></td>';

    return '<td class="cec-cell"><div class="cec-badges">' +
      String(val).split(/[\/\n]/).map(function (n) {
        n = n.trim();
        return n ? mkB(n) : '';
      }).filter(Boolean).join('') +
    '</div></td>';
  }

  function mkB(name) {
    if (!name) return '';
    var c = badgeColor(name);
    if (!c) return '<span class="cec-badge" style="background:var(--bg3);color:var(--tx2)">' + esc(name) + '</span>';
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
  function allB() {
    return EL.querySelectorAll('.cec-badge');
  }

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
    btn.innerHTML = '处理中…';

    function run() {
      window.html2canvas(tbl, {
        backgroundColor: isDark ? '#111214' : '#f7f8fa',
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
        btn.innerHTML = '导出失败';
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
    return {
      '第一周': 1,
      '第二周': 2,
      '第三周': 3,
      '第四周': 4,
      '第五周': 5
    }[String(s)] || 99;
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

  /* ── demo ─────────────────────────────────────────────── */
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
