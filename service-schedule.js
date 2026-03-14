/**
 * service-schedule.js  v13.0  — CECP 事工表
 * ═══════════════════════════════════════════════════════
 * 设计规范 (三层筛选，方正小圆角):
 *   L1 月份导航  h=34px  font=13→14px  r=5px  pad=0 15px
 *   L2 周次筛选  h=28px  font=12px     r=4px  pad=0 11px
 *   L3 类型筛选  h=24px  font=11px     r=4px  pad=0 9px
 *   工具按钮     h=34px  方形 34×34 / 文字按钮 34px高
 *
 * 新增：周次筛选行（L2），可单选某周查看
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

  /* ── 类型色 ───────────────────────────────────────────── */
  var TYPE_C = {
    '主日下午': { accent:'#3a78d4', dark:{ bg:'#1c3870', tx:'#82bcf0' }, light:{ bg:'#2a5eb8', tx:'#ffffff' } },
    '主日晚上': { accent:'#8040d0', dark:{ bg:'#3a1c70', tx:'#c090f0' }, light:{ bg:'#6838b0', tx:'#ffffff' } },
    '青年团契':  { accent:'#28a85a', dark:{ bg:'#1a5030', tx:'#60e898' }, light:{ bg:'#1a7840', tx:'#ffffff' } },
  };
  var TYPE_DEF = { accent:'#606060', dark:{ bg:'#2a2a2a', tx:'#aaa' }, light:{ bg:'#888', tx:'#fff' } };

  function tc(type) {
    var t = TYPE_C[type] || TYPE_DEF;
    return { accent: t.accent, bg: isDark ? t.dark.bg : t.light.bg, tx: isDark ? t.dark.tx : t.light.tx };
  }

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
    EL.classList.toggle('cec-dk', isDark);
    EL.classList.toggle('cec-lt', !isDark);
  }

  /* ── CSS ──────────────────────────────────────────────── */
  if (!document.getElementById('_cec13')) {
    var _st = document.createElement('style');
    _st.id = '_cec13';
    _st.textContent = `
/* ── 根容器 ── */
#cecp-schedule{
  font-family:"PingFang SC","Noto Sans SC","Microsoft YaHei",system-ui,sans-serif;
  border-radius:12px;overflow:hidden;box-sizing:border-box;width:100%;
}
#cecp-schedule *{box-sizing:border-box;margin:0;padding:0}

/* ── 深色主题变量 ── */
#cecp-schedule.cec-dk{
  background:#111;color:#d8d8d8;
  --bg:#111;--bg2:#181818;--bg3:#202020;--bg4:#2a2a2a;
  --ln:#1e1e1e;--ln2:#2a2a2a;--ln3:#363636;
  --tx:#d8d8d8;--tx2:#585858;--tx3:#2e2e2e;
  --muted:#505050;--muted2:#3a3a3a;
  --hdr:#141414;--hdr2:#121212;--hdr3:#101010;
  --rd:#2e6030;--nt:#6a5020;
}
/* ── 浅色主题变量 ── */
#cecp-schedule.cec-lt{
  background:#fff;color:#1a1a1a;
  --bg:#fff;--bg2:#f5f5f5;--bg3:#eeeeee;--bg4:#e6e6e6;
  --ln:#e8e8e8;--ln2:#d8d8d8;--ln3:#c8c8c8;
  --tx:#1a1a1a;--tx2:#909090;--tx3:#cccccc;
  --muted:#888;--muted2:#e0e0e0;
  --hdr:#f6f6f6;--hdr2:#f2f2f2;--hdr3:#eeeeee;
  --rd:#1a5828;--nt:#6a4a10;
}

/* ════════════════════════════════
   통일 버튼 기반 (공통 리셋)
   ════════════════════════════════ */
.cec-btn{
  border:none;background:none;cursor:pointer;
  font-family:inherit;display:inline-flex;align-items:center;
  white-space:nowrap;transition:background .1s,color .1s,border-color .1s;
  letter-spacing:.01em;flex-shrink:0;
}

/* ════════════════════════════════
   ZONE 1 — 月份导航 + 工具按钮
   Level 1: h=34px r=5px font=13px
   ════════════════════════════════ */
.cec-z1{
  display:flex;align-items:center;gap:8px;
  padding:10px 14px;
  background:var(--hdr);
  border-bottom:1px solid var(--ln);
}
.cec-month-row{display:flex;align-items:center;gap:3px}
.cec-tools{margin-left:auto;display:flex;align-items:center;gap:5px}

/* 月份文字按钮 */
.cec-btn-month{
  height:34px;padding:0 14px;
  border-radius:5px;
  border:1px solid transparent;
  color:var(--tx2);font-size:13px;font-weight:500;
}
.cec-btn-month:hover:not(.on){
  background:var(--bg3);color:var(--tx);
  border-color:var(--ln3);
}
.cec-btn-month.on{
  background:var(--bg4);color:var(--tx);
  font-size:14px;font-weight:700;
  border:1px solid var(--ln3);
}

/* 箭头方形按钮 */
.cec-btn-arr{
  width:34px;height:34px;justify-content:center;
  border-radius:5px;border:1px solid var(--ln2);
  color:var(--tx2);font-size:13px;
}
.cec-btn-arr:hover{background:var(--bg3);color:var(--tx);border-color:var(--ln3)}

/* 工具图标方形按钮 */
.cec-btn-icon{
  width:34px;height:34px;justify-content:center;
  border-radius:5px;border:1px solid var(--ln2);
  color:var(--tx2);font-size:13px;
}
.cec-btn-icon:hover{background:var(--bg3);color:var(--tx);border-color:var(--ln3)}

/* 工具文字按钮 */
.cec-btn-tool{
  height:34px;padding:0 12px;gap:5px;
  border-radius:5px;border:1px solid var(--ln2);
  color:var(--tx2);font-size:12px;font-weight:500;
}
.cec-btn-tool:hover{background:var(--bg3);color:var(--tx);border-color:var(--ln3)}
.cec-btn-tool:disabled{opacity:.38;cursor:not-allowed}

/* ════════════════════════════════
   ZONE 2 — 周次筛选
   Level 2: h=28px r=4px font=12px
   ════════════════════════════════ */
.cec-z2{
  display:flex;align-items:center;gap:3px;
  padding:8px 14px;
  background:var(--hdr2);
  border-bottom:1px solid var(--ln);
}

/* 行标签 */
.cec-zlbl{
  font-size:10px;font-weight:500;color:var(--tx2);
  letter-spacing:.07em;text-transform:uppercase;
  margin-right:4px;flex-shrink:0;
}

/* 周次按钮 */
.cec-btn-week{
  height:28px;padding:0 11px;
  border-radius:4px;border:1px solid transparent;
  color:var(--tx2);font-size:12px;font-weight:500;
}
.cec-btn-week:hover:not(.on){background:var(--bg3);color:var(--tx)}
.cec-btn-week.on{
  background:var(--bg4);color:var(--tx);font-weight:600;
  border:1px solid var(--ln2);
}
.cec-btn-week.all.on{
  background:var(--muted);color:var(--bg);
  border-color:transparent;
}

/* ════════════════════════════════
   ZONE 3 — 类型筛选
   Level 3: h=24px r=4px font=11px
   ════════════════════════════════ */
.cec-z3{
  display:flex;align-items:center;gap:3px;
  padding:7px 14px;
  background:var(--hdr3);
  border-bottom:1px solid var(--ln);
  flex-wrap:wrap;
}
/* 类型按钮 */
.cec-btn-type{
  height:24px;padding:0 9px;gap:4px;
  border-radius:4px;border:1px solid transparent;
  color:var(--tx2);font-size:11px;font-weight:500;
}
.cec-btn-type:hover:not(.on){background:var(--bg3);color:var(--tx)}
.cec-btn-type.on{font-weight:600;color:var(--bg)}
.cec-btn-type.all.on{background:var(--muted);border-color:transparent}
/* 类型色点 */
.cec-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}

/* ════════════════════════════════
   TABLE
   ════════════════════════════════ */
.cec-wrap{width:100%;overflow-x:hidden;background:var(--bg)}
.cec-tbl{border-collapse:collapse;width:100%;table-layout:fixed}
.cec-tbl th,.cec-tbl td{
  border-bottom:1px solid var(--ln);
  border-right:1px solid var(--ln);
  vertical-align:middle;
}
.cec-tbl tr th:last-child,.cec-tbl tr td:last-child{border-right:none}

/* 列标题 */
.cec-chdr{
  background:var(--bg2);padding:10px 12px;
  font-size:11px;font-weight:600;color:var(--tx2);
  text-align:center;white-space:nowrap;letter-spacing:.05em;
  text-transform:uppercase;
  position:sticky;top:0;z-index:2;
  border-bottom:1.5px solid var(--ln2)!important;
}
.cec-corner{
  background:var(--bg2);padding:10px 12px;
  font-size:10px;color:var(--tx3);text-align:center;
  position:sticky;top:0;z-index:3;
  border-bottom:1.5px solid var(--ln2)!important;
  border-right:1.5px solid var(--ln2)!important;
  letter-spacing:.04em;text-transform:uppercase;
}

/* 聚会信息格 */
.cec-info{
  padding:14px 14px;vertical-align:middle;text-align:left;
  border-right:1.5px solid var(--ln2)!important;
  border-left:3px solid transparent;
  min-width:128px;width:128px;background:var(--bg);
}
.cec-wk{
  display:block;font-size:22px;font-weight:900;
  line-height:1;letter-spacing:-.02em;color:var(--tx);
}
.cec-mo{
  display:block;font-size:10px;font-weight:500;
  color:var(--tx2);margin-top:4px;letter-spacing:.02em;
}
.cec-tag{
  display:inline-block;margin-top:8px;
  padding:3px 8px;border-radius:4px;
  font-size:10px;font-weight:700;letter-spacing:.04em;line-height:1.4;
}

/* 内容格 */
.cec-cell{padding:10px 12px;text-align:center;background:var(--bg);transition:background .08s}
.cec-cell:hover{background:var(--bg2)}

/* 读经 */
.cec-ref{display:block;font-size:10px;font-weight:700;color:var(--rd);margin-bottom:3px;letter-spacing:.04em}
/* 证道前缀 */
.cec-npfx{display:block;font-size:10px;font-weight:700;color:var(--nt);margin-bottom:3px}

/* 周次分隔 */
.cec-sep td{height:5px;background:var(--bg2);border-bottom:1px solid var(--ln2)!important;border-right:none!important}

/* 空 */
.cec-empty{color:var(--tx3);font-size:14px}

/* ════════════════════════════════
   BADGE
   ════════════════════════════════ */
.cec-badge{
  display:inline-block;padding:4px 10px;border-radius:20px;
  font-size:12px;font-weight:700;line-height:1.4;
  margin:2px;white-space:nowrap;cursor:pointer;letter-spacing:.02em;
  transition:opacity .1s,transform .1s,box-shadow .1s;
  user-select:none;position:relative;
}
.cec-badge.lit{transform:scale(1.1);box-shadow:0 0 0 2px rgba(255,255,255,.28);z-index:1}
.cec-badge.dim{opacity:.14}
.cec-badge.locked{transform:scale(1.12);box-shadow:0 0 0 2.5px rgba(255,255,255,.55);z-index:1}
.cec-badge.ldim{opacity:.1}
.cec-lt .cec-badge.lit{box-shadow:0 0 0 2px rgba(0,0,0,.2)}
.cec-lt .cec-badge.locked{box-shadow:0 0 0 2.5px rgba(0,0,0,.42)}

/* ════════════════════════════════
   状态
   ════════════════════════════════ */
.cec-state{display:flex;align-items:center;justify-content:center;gap:12px;padding:64px 24px;color:var(--tx2);font-size:14px}
.cec-spin{width:20px;height:20px;border:2px solid var(--ln2);border-top-color:var(--muted);border-radius:50%;animation:cspin .7s linear infinite;flex-shrink:0}
@keyframes cspin{to{transform:rotate(360deg)}}
.cec-err{padding:24px;color:#b04040;font-size:14px;line-height:1.8}

/* ════════════════════════════════
   响应式
   ════════════════════════════════ */
@media(max-width:560px){
  .cec-wk{font-size:17px}
  .cec-info{min-width:94px;width:94px;padding:10px 10px}
  .cec-cell{padding:8px 8px}
  .cec-chdr{padding:8px 8px;font-size:10px}
  .cec-badge{font-size:11px;padding:3px 8px}
  .cec-btn-month{padding:0 10px;font-size:12px}
  .cec-z1,.cec-z2,.cec-z3{padding-left:10px;padding-right:10px}
}
`;
    document.head.appendChild(_st);
  }

  applyTheme();
  EL.innerHTML = '<div class="cec-state"><div class="cec-spin"></div>加载服事安排…</div>';

  /* ── 数据获取 ─────────────────────────────────────────── */
  if (!API || API === 'DEMO') { setTimeout(function () { boot(demo()); }, 200); return; }

  fetch(API + '?action=all')
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (res) { if (!res.ok) throw new Error(res.error||'脚本错误'); boot(res.data); })
    .catch(function (e) {
      EL.innerHTML = '<div class="cec-err">⚠ ' + esc(e.message)
        + '<br><small style="opacity:.5">请确认 Apps Script 已部署，访问权限为「所有人」</small></div>';
    });

  /* ── 高亮状态 ─────────────────────────────────────────── */
  var locked = null;

  /* ── 初始化 ───────────────────────────────────────────── */
  function boot(rows) {
    if (!rows || !rows.length) { EL.innerHTML = '<div class="cec-state">暂无服事安排数据</div>'; return; }

    // 月份分组
    var months = {};
    rows.forEach(function (r) {
      var m = tv(r.month); if (!m) return;
      if (!months[m]) months[m] = [];
      months[m].push(r);
    });
    var mkeys = Object.keys(months).sort(function (a, b) { return mord(a) - mord(b); });
    if (!mkeys.length) return;

    // 当前月
    var nowM = (new Date().getMonth() + 1) + '月';
    var mIdx = mkeys.indexOf(nowM);
    if (mIdx < 0) { for (var i=0;i<mkeys.length;i++){if(mord(mkeys[i])>=mord(nowM)){mIdx=i;break;}} }
    if (mIdx < 0) mIdx = mkeys.length - 1;

    // 类型列表
    var allTypes = [];
    rows.forEach(function (r) { if (r.type && allTypes.indexOf(r.type)<0) allTypes.push(r.type); });
    var tord = {'主日下午':0,'主日晚上':1,'青年团契':2};
    allTypes.sort(function (a,b) { return (tord[a]||9)-(tord[b]||9); });

    // 周次列表（动态）
    var WEEK_LABELS = ['第一周','第二周','第三周','第四周','第五周'];

    var activeType = '全部';
    var activeWeek = '全部';

    render(mIdx);

    function render(i) {
      locked = null;
      var key = mkeys[i];

      // 本月有哪些周次
      var weeksInMonth = [];
      (months[key] || []).forEach(function (r) {
        if (r.week && weeksInMonth.indexOf(r.week) < 0) weeksInMonth.push(r.week);
      });
      weeksInMonth.sort(function (a,b) { return word(a)-word(b); });

      // ── Zone 1: 月份导航 ──
      var z1 = '<div class="cec-month-row">';
      if (i > 0) z1 += '<button class="cec-btn cec-btn-arr" id="cPA">&#8592;</button>';
      if (i > 0) z1 += '<button class="cec-btn cec-btn-month" id="cPM">' + mkeys[i-1] + '</button>';
      z1 += '<button class="cec-btn cec-btn-month on">' + key + '</button>';
      if (i < mkeys.length-1) z1 += '<button class="cec-btn cec-btn-month" id="cNM">' + mkeys[i+1] + '</button>';
      if (i < mkeys.length-1) z1 += '<button class="cec-btn cec-btn-arr" id="cNA">&#8594;</button>';
      z1 += '</div><div class="cec-tools">'
        + '<button class="cec-btn cec-btn-icon" id="cTH" title="切换主题">' + (isDark?'&#9728;':'&#9790;') + '</button>'
        + '<button class="cec-btn cec-btn-tool" id="cEX">' + svgDL() + '导出</button>'
        + '</div>';

      // ── Zone 2: 周次筛选 ──
      var z2 = '<span class="cec-zlbl">周次</span>'
        + '<button class="cec-btn cec-btn-week all' + (activeWeek==='全部'?' on':'') + '" data-w="全部">全部</button>';
      weeksInMonth.forEach(function (w) {
        var on = activeWeek === w;
        z2 += '<button class="cec-btn cec-btn-week' + (on?' on':'') + '" data-w="' + esc(w) + '">' + esc(w) + '</button>';
      });

      // ── Zone 3: 类型筛选 ──
      var z3 = '<span class="cec-zlbl">类型</span>'
        + '<button class="cec-btn cec-btn-type all' + (activeType==='全部'?' on':'') + '" data-t="全部">全部</button>';
      allTypes.forEach(function (tp) {
        var tcv = tc(tp);
        var on = activeType === tp;
        z3 += '<button class="cec-btn cec-btn-type' + (on?' on':'') + '" data-t="' + esc(tp) + '"'
          + (on ? ' style="background:' + tcv.bg + ';border-color:' + tcv.bg + '"' : '') + '>'
          + '<span class="cec-dot" style="background:' + tcv.accent + '"></span>' + esc(tp) + '</button>';
      });

      // ── Table ──
      var hdr = '<th class="cec-corner">聚会</th>'
        + COLS.map(function (c) { return '<th class="cec-chdr">' + c.label + '</th>'; }).join('');
      var cg = '<colgroup><col style="width:128px">'
        + COLS.map(function () { return '<col>'; }).join('') + '</colgroup>';

      var svcs = (months[key] || []).filter(function (s) {
        var okT = activeType === '全部' || s.type === activeType;
        var okW = activeWeek === '全部' || s.week === activeWeek;
        return okT && okW;
      }).sort(function (a,b) {
        var dw = word(a.week)-word(b.week); if(dw) return dw;
        return (tord[a.type]||9)-(tord[b.type]||9);
      });

      var tbody = '', prevW = '';
      svcs.forEach(function (s, idx) {
        var tcv = tc(s.type);
        if (s.week !== prevW) {
          if (idx > 0) tbody += '<tr class="cec-sep"><td colspan="' + (COLS.length+1) + '"></td></tr>';
          prevW = s.week;
        }
        var info = '<td class="cec-info" style="border-left-color:' + tcv.accent + '">'
          + '<span class="cec-wk">' + esc(s.week) + '</span>'
          + '<span class="cec-mo">' + esc(s.month) + '</span>'
          + '<span class="cec-tag" style="background:' + tcv.bg + ';color:' + tcv.tx + '">' + esc(s.type) + '</span>'
          + '</td>';
        tbody += '<tr>' + info + COLS.map(function (c) { return renderTd(c, s[c.key]||''); }).join('') + '</tr>';
      });

      if (!svcs.length) {
        tbody = '<tr><td colspan="' + (COLS.length+1) + '" style="padding:48px;text-align:center;color:var(--tx3);font-size:14px">暂无数据</td></tr>';
      }

      EL.innerHTML =
        '<div class="cec-z1">' + z1 + '</div>'
        + '<div class="cec-z2" id="cZ2">' + z2 + '</div>'
        + '<div class="cec-z3" id="cZ3">' + z3 + '</div>'
        + '<div class="cec-wrap"><table class="cec-tbl" id="cTbl">' + cg
          + '<thead><tr>' + hdr + '</tr></thead>'
          + '<tbody>' + tbody + '</tbody>'
        + '</table></div>';

      // 事件
      bindNav(EL.querySelector('#cPA'), function(){render(i-1)});
      bindNav(EL.querySelector('#cPM'), function(){render(i-1)});
      bindNav(EL.querySelector('#cNA'), function(){render(i+1)});
      bindNav(EL.querySelector('#cNM'), function(){render(i+1)});
      bindNav(EL.querySelector('#cTH'), function(){
        isDark=!isDark;
        try{localStorage.setItem('cecp-theme',isDark?'dark':'light');}catch(e){}
        applyTheme(); render(i);
      });
      bindNav(EL.querySelector('#cEX'), function(){ exportPng(key); });

      var z2el = EL.querySelector('#cZ2');
      if (z2el) z2el.querySelectorAll('.cec-btn-week').forEach(function(b){
        b.addEventListener('click', function(){ activeWeek = this.dataset.w; render(i); });
      });
      var z3el = EL.querySelector('#cZ3');
      if (z3el) z3el.querySelectorAll('.cec-btn-type').forEach(function(b){
        b.addEventListener('click', function(){ activeType = this.dataset.t; render(i); });
      });

      bindHL();
    }
  }

  function bindNav(el, fn) { if (el) el.addEventListener('click', fn); }

  /* ── 渲染 td ──────────────────────────────────────────── */
  function renderTd(col, val) {
    if (col.kind === 'reading') {
      var rd = parseRd(val);
      if (!rd || !rd.name) return '<td class="cec-cell"><span class="cec-empty">—</span></td>';
      return '<td class="cec-cell"><span class="cec-ref">' + esc(rd.ref) + '</span>' + mkB(rd.name) + '</td>';
    }
    if (col.kind === 'note') {
      if (!val) return '<td class="cec-cell"><span class="cec-empty">—</span></td>';
      var m = val.match(/^(证道[：:]\s*)(.+)$/);
      if (m) return '<td class="cec-cell"><span class="cec-npfx">' + esc(m[1]) + '</span>' + mkB(m[2]) + '</td>';
      return '<td class="cec-cell">' + mkB(val) + '</td>';
    }
    if (!val) return '<td class="cec-cell"><span class="cec-empty">—</span></td>';
    return '<td class="cec-cell">' + val.split(/[\/\n]/).map(function(n){return mkB(n.trim());}).filter(Boolean).join('') + '</td>';
  }

  function mkB(name) {
    if (!name) return '';
    var c = badgeColor(name);
    if (!c) return '<span class="cec-badge" style="background:var(--bg3);color:var(--muted)">' + esc(name) + '</span>';
    return '<span class="cec-badge" data-n="' + esc(name) + '" style="background:' + c[0] + ';color:' + c[1] + '">' + esc(name) + '</span>';
  }

  function parseRd(v) {
    if (!v) return null;
    var m = v.match(/^(诗\d+)\s+(.+)$/);
    return m ? {ref:m[1],name:m[2].trim()} : {ref:v,name:''};
  }

  /* ── 高亮 ─────────────────────────────────────────────── */
  function allB() { return EL.querySelectorAll('.cec-badge'); }
  function applyHL(n, lk) {
    allB().forEach(function(b){
      var bn = b.dataset.n||b.textContent;
      b.classList.remove('lit','dim','locked','ldim');
      if(bn===n) b.classList.add(lk?'locked':'lit');
      else b.classList.add(lk?'ldim':'dim');
    });
  }
  function clearHL() { allB().forEach(function(b){b.classList.remove('lit','dim','locked','ldim');}); }
  function bindHL() {
    allB().forEach(function(b){
      var n = b.dataset.n||b.textContent;
      b.addEventListener('mouseenter', function(){if(!locked) applyHL(n,false);});
      b.addEventListener('mouseleave', function(){if(!locked) clearHL();});
      b.addEventListener('click', function(e){
        e.stopPropagation();
        if(locked===n){locked=null;clearHL();}else{locked=n;applyHL(n,true);}
      });
    });
    EL.addEventListener('click', function(){if(locked){locked=null;clearHL();}});
  }

  /* ── 导出 ─────────────────────────────────────────────── */
  function exportPng(key) {
    var btn = EL.querySelector('#cEX');
    var tbl = EL.querySelector('#cTbl');
    if (!btn||!tbl) return;
    btn.disabled=true; btn.textContent='处理中…';
    function run(){
      window.html2canvas(tbl,{backgroundColor:isDark?'#111':'#fff',scale:2,useCORS:true,logging:false})
        .then(function(c){
          var a=document.createElement('a');
          a.download='服事安排_'+key+'.png';a.href=c.toDataURL('image/png');a.click();
          btn.innerHTML=svgDL()+'导出';btn.disabled=false;
        }).catch(function(){btn.textContent='导出失败';btn.disabled=false;});
    }
    if(!window.html2canvas){
      var sc=document.createElement('script');
      sc.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      sc.onload=run;document.head.appendChild(sc);
    } else run();
  }

  /* ── 工具 ─────────────────────────────────────────────── */
  function mord(s){var m=String(s).match(/^(\d{1,2})月$/);return m?parseInt(m[1],10):99;}
  function word(s){return{'第一周':1,'第二周':2,'第三周':3,'第四周':4,'第五周':5}[s]||99;}
  function tv(v){return String(v==null?'':v).trim();}
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function svgDL(){
    return '<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M7 1v8M4 6l3 3 3-3M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1"/></svg>';
  }

  /* ── Demo ─────────────────────────────────────────────── */
  function demo(){
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
