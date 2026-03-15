/**
 * service-schedule.js
 * 年份安全版 + 同名高亮恢复 + 强制聚焦页面（隐藏侧边栏等）
 */
(function () {
  'use strict';

  var EL = document.getElementById('cecp-schedule');
  if (!EL) return;

  var API = (EL.dataset.api || '').trim();

  var TYPE_ORDER = ['青年团契', '主日下午', '主日晚上', '祷告会'];
  var WEEK_ORDER = ['第一周', '第二周', '第三周', '第四周', '第五周'];

  var TYPE_C = {
    '主日下午': { accent:'#fbff00', bg:'#b9a50d', tx:'#fffa9f' },
    '主日晚上': { accent:'#8d49df', bg:'#3f226c', tx:'#c9a0ff' },
    '青年团契': { accent:'#33b46d', bg:'#1b5633', tx:'#8be3ad' },
    '祷告会':   { accent:'#bb7dff', bg:'#4d2d6d', tx:'#e3c8ff' }
  };

  var PAL = [
    ['#324862','#91b9ea'],['#284b45','#77d2c1'],['#54474a','#c7938b'],['#43515b','#98b9d7'],
    ['#4f5a42','#a8c874'],['#5a4738','#d2a86d'],['#534469','#b197f1'],['#61435a','#de92cb'],
    ['#35556b','#73c4ff'],['#39543b','#7ad87e'],['#674848','#f08d8d'],['#5f5333','#d9c04f'],
    ['#4d5865','#b7c3d3'],['#2c6171','#7fd8f2'],['#66553f','#dbb07f'],['#4f4761','#b6a0ef'],
    ['#416746','#9be28e'],['#6b5038','#efad59'],['#5f4450','#e7a4bb'],['#355a56','#75d1c2']
  ];

  var lockedName = null;

  applyFocusPageMode();

  if (!document.getElementById('_cecp_yearsafe_style_v4')) {
    var st = document.createElement('style');
    st.id = '_cecp_yearsafe_style_v4';
    st.textContent = `
#cecp-schedule{
  font-family:"PingFang SC","Noto Sans SC","Microsoft YaHei",system-ui,sans-serif;
  width:100%;
  background:#111214;
  color:#e8ebf0;
  border:1px solid #343943;
  border-radius:16px;
  overflow:hidden;
}
#cecp-schedule *{box-sizing:border-box}

.cec-top,.cec-sub,.cec-typebar{
  display:flex;
  align-items:center;
  gap:8px;
  flex-wrap:wrap;
  padding:10px 12px;
  border-bottom:1px solid #262a31;
  background:#17191d;
}
.cec-sub,.cec-typebar{background:#14171d}

.cec-btn{
  appearance:none;
  border:none;
  cursor:pointer;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  font:inherit;
  white-space:nowrap;
  transition:.12s ease;
}

.cec-btn-month,.cec-btn-arr,.cec-btn-tool,.cec-btn-type{
  height:34px;
  border-radius:10px;
  border:1px solid #343943;
  background:#1d2026;
  color:#aeb6c3;
}
.cec-btn-month{padding:0 14px;font-weight:700}
.cec-btn-arr{width:34px}
.cec-btn-tool{padding:0 14px;font-weight:700}
.cec-btn-month:hover,.cec-btn-arr:hover,.cec-btn-tool:hover,.cec-btn-type:hover{
  background:#242932;
  color:#fff;
}
.cec-btn-month.on,.cec-btn-type.on{
  background:#2a3040;
  color:#fff;
  border-color:#48526a;
}
.cec-typebar .cec-btn-type{
  padding:0 12px;
  gap:6px;
  font-size:13px;
  font-weight:700;
}
.cec-dot{
  width:8px;
  height:8px;
  border-radius:50%;
}

.cec-wrap{
  width:100%;
  overflow-x:auto;
  background:#111214;
}
.cec-tbl{
  border-collapse:separate;
  border-spacing:0;
  width:max-content;
  min-width:100%;
  table-layout:fixed;
}
.cec-tbl th,.cec-tbl td{
  border-right:1px solid #343943;
  border-bottom:1px solid #343943;
  vertical-align:middle;
}
.cec-tbl tr th:last-child,.cec-tbl tr td:last-child{
  border-right:none;
}

.cec-corner,.cec-h{
  position:sticky;
  top:0;
  z-index:2;
  background:#17191d;
  color:#aeb6c3;
  font-size:12px;
  font-weight:800;
  text-align:center;
  padding:14px 10px;
}
.cec-corner{
  z-index:3;
  color:#7f8a9a;
}

.cec-rowlbl{
  background:#14171d;
  color:#e8ebf0;
  font-size:13px;
  font-weight:800;
  padding:14px 12px;
  white-space:nowrap;
}

.cec-cell{
  min-width:140px;
  height:82px;
  padding:10px;
  text-align:center;
  background:#111214;
}
.cec-cell:hover{background:#17191d}

.cec-empty{
  color:#6e7887;
  font-size:14px;
}

.cec-badges{
  display:flex;
  flex-wrap:wrap;
  justify-content:center;
  align-items:center;
  gap:8px;
  min-height:56px;
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
  white-space:nowrap;
  transition:.12s ease;
  user-select:none;
}
.cec-badge.lit{
  transform:translateY(-1px);
  filter:brightness(1.08);
  box-shadow:0 0 0 1px rgba(255,255,255,.18);
}
.cec-badge.dim{opacity:.18}
.cec-badge.locked{
  transform:translateY(-1px);
  filter:brightness(1.12);
  box-shadow:0 0 0 1.5px rgba(255,255,255,.30);
}
.cec-badge.ldim{opacity:.10}

.cec-note,.cec-reading{
  min-height:56px;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:6px;
}
.cec-ref{
  font-size:12px;
  font-weight:800;
  color:#97d8a6;
}
.cec-npfx{
  font-size:11px;
  font-weight:800;
  color:#f0cb78;
}

.cec-state{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:12px;
  padding:56px 20px;
  color:#aeb6c3;
}
.cec-spin{
  width:18px;
  height:18px;
  border:2px solid #48526a;
  border-top-color:#cfd6df;
  border-radius:50%;
  animation:cecspin .7s linear infinite;
}
@keyframes cecspin{to{transform:rotate(360deg)}}

.cec-err{
  padding:24px;
  color:#cf6b6b;
  line-height:1.8;
}

@media(max-width:760px){
  .cec-cell{
    min-width:120px;
    height:74px;
    padding:8px;
  }
  .cec-corner,.cec-h,.cec-rowlbl{
    padding:10px 8px;
  }
  .cec-badges{gap:6px}
  .cec-badge{
    font-size:10px;
    padding:5px 10px;
  }
}
`;
    document.head.appendChild(st);
  }

  EL.innerHTML = '<div class="cec-state"><div class="cec-spin"></div>加载服事安排…</div>';

  if (!API || API === 'DEMO') {
    setTimeout(function () { boot(demo()); }, 120);
    return;
  }

  fetch(API + '?action=all')
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (res) {
      if (!res.ok) throw new Error(res.error || '脚本错误');
      boot(res.data || []);
    })
    .catch(function (e) {
      EL.innerHTML = '<div class="cec-err">⚠ ' + esc(e.message) + '</div>';
    });

  function applyFocusPageMode() {
    document.body.classList.add('cecp-focus-page');

    if (!document.getElementById('_cecp_focus_page_style_v2')) {
      var fs = document.createElement('style');
      fs.id = '_cecp_focus_page_style_v2';
      fs.textContent = `
/* 强制隐藏所有常见侧边栏 / 目录 / 推荐 / 评论 */
body.cecp-focus-page .toc-container,
body.cecp-focus-page .toc,
body.cecp-focus-page .post-aside,
body.cecp-focus-page aside,
body.cecp-focus-page .aside,
body.cecp-focus-page .sidebar,
body.cecp-focus-page .right-sidebar,
body.cecp-focus-page .left-sidebar,
body.cecp-focus-page .halo-aside,
body.cecp-focus-page .halo-sidebar,
body.cecp-focus-page .widget,
body.cecp-focus-page .widgets,
body.cecp-focus-page .related-posts,
body.cecp-focus-page .post-related,
body.cecp-focus-page .recommended-posts,
body.cecp-focus-page .comment-area,
body.cecp-focus-page .comments,
body.cecp-focus-page .post-comments,
body.cecp-focus-page .post-navigation,
body.cecp-focus-page .prev-next,
body.cecp-focus-page .share-bar,
body.cecp-focus-page .ad-wrap {
  display:none !important;
  visibility:hidden !important;
  width:0 !important;
  min-width:0 !important;
  max-width:0 !important;
  height:0 !important;
  min-height:0 !important;
  max-height:0 !important;
  overflow:hidden !important;
  margin:0 !important;
  padding:0 !important;
  border:0 !important;
}

/* 页面布局强制单栏 */
body.cecp-focus-page .container,
body.cecp-focus-page .main,
body.cecp-focus-page .content,
body.cecp-focus-page .content-wrapper,
body.cecp-focus-page .post-content-wrapper,
body.cecp-focus-page .post-container,
body.cecp-focus-page .article-container,
body.cecp-focus-page .site-content,
body.cecp-focus-page .row,
body.cecp-focus-page .halo-main,
body.cecp-focus-page .post,
body.cecp-focus-page .post-detail,
body.cecp-focus-page .post-content,
body.cecp-focus-page .entry-content,
body.cecp-focus-page .article-content {
  max-width:100% !important;
  width:100% !important;
}

/* Bootstrap / grid / theme column 强制占满 */
body.cecp-focus-page [class*="col-"],
body.cecp-focus-page .col,
body.cecp-focus-page .col-lg-8,
body.cecp-focus-page .col-lg-9,
body.cecp-focus-page .col-lg-10,
body.cecp-focus-page .col-md-8,
body.cecp-focus-page .col-md-9,
body.cecp-focus-page .content-col,
body.cecp-focus-page .main-col,
body.cecp-focus-page .post-main,
body.cecp-focus-page .article-main {
  flex:0 0 100% !important;
  max-width:100% !important;
  width:100% !important;
  margin-left:0 !important;
  margin-right:0 !important;
}

/* 额外兜底：如果主题是两栏 grid */
body.cecp-focus-page .content-wrapper,
body.cecp-focus-page .site-content,
body.cecp-focus-page .main-content,
body.cecp-focus-page .post-content-wrapper,
body.cecp-focus-page .halo-main {
  display:block !important;
  grid-template-columns:1fr !important;
  gap:0 !important;
}

/* 当前正文内容更聚焦 */
body.cecp-focus-page .post-content,
body.cecp-focus-page .entry-content,
body.cecp-focus-page .article-content {
  margin:0 auto !important;
  padding-left:0 !important;
  padding-right:0 !important;
}

/* 如果主题把正文包在 card 或 wrapper 里，也拉满 */
body.cecp-focus-page article,
body.cecp-focus-page .post-detail,
body.cecp-focus-page .post,
body.cecp-focus-page .article,
body.cecp-focus-page .article-container {
  max-width:100% !important;
  width:100% !important;
}
`;
      document.head.appendChild(fs);
    }

    // 再做一次运行时隐藏，防止某些主题后来又把侧边栏插回来
    setTimeout(forceHideSideStuff, 0);
    setTimeout(forceHideSideStuff, 300);
    setTimeout(forceHideSideStuff, 1000);
  }

  function forceHideSideStuff() {
    var selectors = [
      '.toc-container','.toc','.post-aside','aside','.aside','.sidebar','.right-sidebar','.left-sidebar',
      '.halo-aside','.halo-sidebar','.widget','.widgets','.related-posts','.post-related',
      '.recommended-posts','.comment-area','.comments','.post-comments','.post-navigation',
      '.prev-next','.share-bar','.ad-wrap'
    ];

    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
        el.style.setProperty('width', '0', 'important');
        el.style.setProperty('max-width', '0', 'important');
        el.style.setProperty('min-width', '0', 'important');
        el.style.setProperty('height', '0', 'important');
        el.style.setProperty('max-height', '0', 'important');
        el.style.setProperty('min-height', '0', 'important');
        el.style.setProperty('overflow', 'hidden', 'important');
        el.style.setProperty('margin', '0', 'important');
        el.style.setProperty('padding', '0', 'important');
        el.style.setProperty('border', '0', 'important');
      });
    });
  }

  function boot(rows) {
    if (!rows.length) {
      EL.innerHTML = '<div class="cec-state">暂无数据</div>';
      return;
    }

    var byMonth = {};
    rows.forEach(function (r) {
      var m = tv(r.month);
      if (!m) return;
      if (!byMonth[m]) byMonth[m] = [];
      byMonth[m].push(r);
    });

    var months = Object.keys(byMonth).sort(function (a, b) { return ymOrd(a) - ymOrd(b); });
    var activeMonthIdx = pickCurrentMonth(months);
    var activeType = '青年团契';

    render();

    function render() {
      var month = months[activeMonthIdx];
      var monthRows = byMonth[month] || [];

      var top = '<div class="cec-top">';
      if (activeMonthIdx > 0) top += '<button class="cec-btn cec-btn-arr" id="mPrev">←</button>';
      if (activeMonthIdx > 0) top += '<button class="cec-btn cec-btn-month" id="mPrevText">' + esc(months[activeMonthIdx - 1]) + '</button>';
      top += '<button class="cec-btn cec-btn-month on">' + esc(month) + '</button>';
      if (activeMonthIdx < months.length - 1) top += '<button class="cec-btn cec-btn-month" id="mNextText">' + esc(months[activeMonthIdx + 1]) + '</button>';
      if (activeMonthIdx < months.length - 1) top += '<button class="cec-btn cec-btn-arr" id="mNext">→</button>';
      top += '</div>';

      var typebar = '<div class="cec-typebar">';
      TYPE_ORDER.forEach(function (tp) {
        var c = TYPE_C[tp];
        typebar += '<button class="cec-btn cec-btn-type' + (tp === activeType ? ' on' : '') + '" data-type="' + esc(tp) + '">' +
          '<span class="cec-dot" style="background:' + c.accent + '"></span>' + esc(tp) +
          '</button>';
      });
      typebar += '</div>';

      var body = activeType === '祷告会'
        ? renderPrayerMatrix(monthRows)
        : renderServiceMatrix(monthRows, activeType);

      EL.innerHTML = top + typebar + body;

      bind('#mPrev', function () {
        if (activeMonthIdx > 0) { activeMonthIdx--; lockedName = null; render(); }
      });
      bind('#mPrevText', function () {
        if (activeMonthIdx > 0) { activeMonthIdx--; lockedName = null; render(); }
      });
      bind('#mNext', function () {
        if (activeMonthIdx < months.length - 1) { activeMonthIdx++; lockedName = null; render(); }
      });
      bind('#mNextText', function () {
        if (activeMonthIdx < months.length - 1) { activeMonthIdx++; lockedName = null; render(); }
      });

      EL.querySelectorAll('[data-type]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          activeType = this.getAttribute('data-type');
          lockedName = null;
          render();
        });
      });

      bindHighlight();
      if (lockedName) applyHighlight(lockedName, true);
      forceHideSideStuff();
    }
  }

  function renderServiceMatrix(rows, type) {
    var filtered = rows.filter(function (r) { return tv(r.type) === type; });
    var weekMap = {};
    filtered.forEach(function (r) { weekMap[tv(r.week)] = true; });

    var weeks = WEEK_ORDER.filter(function (w) { return weekMap[w]; });
    if (!weeks.length) weeks = WEEK_ORDER.slice();

    var rowDefs = serviceRowsForType(type);

    var cg = '<colgroup><col style="width:132px">' +
      weeks.map(function () { return '<col style="width:150px">'; }).join('') +
      '</colgroup>';

    var thead = '<thead><tr><th class="cec-corner">服事安排</th>' +
      weeks.map(function (w) { return '<th class="cec-h">' + esc(w) + '</th>'; }).join('') +
      '</tr></thead>';

    var tbody = '<tbody>';
    rowDefs.forEach(function (rowDef) {
      tbody += '<tr><td class="cec-rowlbl">' + esc(rowDef.label) + '</td>';

      weeks.forEach(function (w) {
        var item = filtered.find(function (r) { return tv(r.week) === w; });
        var val = item ? item[rowDef.key] : '';
        tbody += renderMatrixCell(rowDef.kind, val);
      });

      tbody += '</tr>';
    });
    tbody += '</tbody>';

    return '<div class="cec-wrap"><table class="cec-tbl">' + cg + thead + tbody + '</table></div>';
  }

  function renderPrayerMatrix(rows) {
    var filtered = rows.filter(function (r) { return tv(r.type) === '祷告会'; });
    var weeks = WEEK_ORDER.slice();
    var cols = [
      { subtype: '周三祷告会', label: '周三祷告会' },
      { subtype: '周六祷告会', label: '周六祷告会' }
    ];

    var cg = '<colgroup><col style="width:132px"><col style="width:190px"><col style="width:190px"></colgroup>';
    var thead = '<thead><tr><th class="cec-corner">第几周</th>' +
      cols.map(function (c) { return '<th class="cec-h">' + esc(c.label) + '</th>'; }).join('') +
      '</tr></thead>';

    var tbody = '<tbody>';
    weeks.forEach(function (w) {
      tbody += '<tr><td class="cec-rowlbl">' + esc(w) + '</td>';
      cols.forEach(function (c) {
        var item = filtered.find(function (r) {
          return tv(r.week) === w && tv(r.subtype) === c.subtype;
        });
        tbody += renderPrayerCell(item);
      });
      tbody += '</tr>';
    });
    tbody += '</tbody>';

    return '<div class="cec-wrap"><table class="cec-tbl">' + cg + thead + tbody + '</table></div>';
  }

  function renderPrayerCell(item) {
    if (!item) return '<td class="cec-cell"><span class="cec-empty">—</span></td>';

    var name = tv(item.leader);
    var time = tv(item.time);
    var note = tv(item.note);

    var html = '<td class="cec-cell"><div class="cec-note">';
    if (name) html += mkBadge(name);
    if (time) html += '<span class="cec-npfx">' + esc(time) + '</span>';
    if (note) html += '<span style="font-size:11px;color:#aeb6c3;line-height:1.3">' + esc(note) + '</span>';
    html += '</div></td>';
    return html;
  }

  function serviceRowsForType(type) {
    if (type === '主日下午') {
      return [
        { key: 'leader',         label: '主领 / 带领', kind: 'badges' },
        { key: 'worship',        label: '敬拜带领',    kind: 'badges' },
        { key: 'prayerLeader',   label: '祷告会带领',  kind: 'badges' },
        { key: 'praisePrayer',   label: '颂赞祷告',    kind: 'badges' },
        { key: 'memorialPrayer', label: '纪念祷告',    kind: 'badges' },
        { key: 'piano',          label: '司琴',        kind: 'badges' },
        { key: 'drums',          label: '鼓',          kind: 'badges' },
        { key: 'guitar',         label: '吉他',        kind: 'badges' },
        { key: 'bass',           label: '贝斯',        kind: 'badges' },
        { key: 'reading',        label: '读经',        kind: 'reading' },
        { key: 'note',           label: '证道',        kind: 'note' }
      ];
    }

    if (type === '主日晚上') {
      return [
        { key: 'leader',  label: '主领 / 带领', kind: 'badges' },
        { key: 'worship', label: '敬拜带领',    kind: 'badges' },
        { key: 'piano',   label: '司琴',        kind: 'badges' },
        { key: 'drums',   label: '鼓',          kind: 'badges' },
        { key: 'guitar',  label: '吉他',        kind: 'badges' },
        { key: 'bass',    label: '贝斯',        kind: 'badges' },
        { key: 'note',    label: '证道',        kind: 'note' }
      ];
    }

    return [
      { key: 'worship', label: '敬拜带领', kind: 'badges' },
      { key: 'piano',   label: '司琴',     kind: 'badges' },
      { key: 'drums',   label: '鼓',       kind: 'badges' },
      { key: 'guitar',  label: '吉他',     kind: 'badges' },
      { key: 'bass',    label: '贝斯',     kind: 'badges' },
      { key: 'note',    label: '证道 / 主题', kind: 'note' }
    ];
  }

  function renderMatrixCell(kind, val) {
    val = tv(val);

    if (kind === 'reading') {
      if (!val) return '<td class="cec-cell"><span class="cec-empty">—</span></td>';
      var rd = parseReading(val);
      return '<td class="cec-cell"><div class="cec-reading">' +
        '<span class="cec-ref">' + esc(rd.ref) + '</span>' +
        (rd.name ? mkBadge(rd.name) : '') +
        '</div></td>';
    }

    if (kind === 'note') {
      if (!val) return '<td class="cec-cell"><span class="cec-empty">—</span></td>';
      var m = val.match(/^(证道[：:]\s*)(.+)$/);
      if (m) {
        return '<td class="cec-cell"><div class="cec-note"><span class="cec-npfx">' + esc(m[1]) + '</span>' + mkBadge(m[2]) + '</div></td>';
      }
      return '<td class="cec-cell"><div class="cec-note">' + mkBadge(val) + '</div></td>';
    }

    if (!val) return '<td class="cec-cell"><span class="cec-empty">—</span></td>';

    var parts = String(val).split(/[\/\n]/).map(function (x) { return x.trim(); }).filter(Boolean);
    return '<td class="cec-cell"><div class="cec-badges">' + parts.map(mkBadge).join('') + '</div></td>';
  }

  function parseReading(v) {
    var s = tv(v);
    var m = s.match(/^(.+?)\s+(.+)$/);
    if (m) return { ref: m[1], name: m[2] };
    return { ref: s, name: '' };
  }

  function mkBadge(name) {
    var c = badgeColor(name);
    return '<span class="cec-badge" data-name="' + esc(name) + '" style="background:' + c[0] + ';color:' + c[1] + '">' + esc(name) + '</span>';
  }

  function badgeColor(name) {
    var h = 0;
    for (var i = 0; i < name.length; i++) h = (Math.imul(31, h) + name.charCodeAt(i)) | 0;
    return PAL[Math.abs(h) % PAL.length];
  }

  function bindHighlight() {
    var badges = EL.querySelectorAll('.cec-badge');

    badges.forEach(function (b) {
      var name = b.getAttribute('data-name') || b.textContent;

      b.addEventListener('mouseenter', function () {
        if (!lockedName) applyHighlight(name, false);
      });

      b.addEventListener('mouseleave', function () {
        if (!lockedName) clearHighlight();
      });

      b.addEventListener('click', function (e) {
        e.stopPropagation();
        if (lockedName === name) {
          lockedName = null;
          clearHighlight();
        } else {
          lockedName = name;
          applyHighlight(name, true);
        }
      });
    });

    EL.addEventListener('click', function () {
      if (lockedName) {
        lockedName = null;
        clearHighlight();
      }
    });
  }

  function applyHighlight(name, locked) {
    var badges = EL.querySelectorAll('.cec-badge');
    badges.forEach(function (b) {
      var n = b.getAttribute('data-name') || b.textContent;
      b.classList.remove('lit', 'dim', 'locked', 'ldim');
      if (n === name) {
        b.classList.add(locked ? 'locked' : 'lit');
      } else {
        b.classList.add(locked ? 'ldim' : 'dim');
      }
    });
  }

  function clearHighlight() {
    var badges = EL.querySelectorAll('.cec-badge');
    badges.forEach(function (b) {
      b.classList.remove('lit', 'dim', 'locked', 'ldim');
    });
  }

  function pickCurrentMonth(months) {
    var now = new Date();
    var label = now.getFullYear() + '年' + (now.getMonth() + 1) + '月';
    var idx = months.indexOf(label);
    if (idx >= 0) return idx;

    for (var i = 0; i < months.length; i++) {
      if (ymOrd(months[i]) >= ymOrd(label)) return i;
    }
    return months.length - 1;
  }

  function ymOrd(s) {
    var m = String(s).match(/^(\d{4})年(\d{1,2})月$/);
    if (m) return parseInt(m[1], 10) * 100 + parseInt(m[2], 10);

    var m2 = String(s).match(/^(\d{1,2})月$/);
    if (m2) return 999900 + parseInt(m2[1], 10);

    return 999999;
  }

  function bind(sel, fn) {
    var el = EL.querySelector(sel);
    if (el) el.addEventListener('click', fn);
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

  function demo() {
    return [
      {month:'2026年3月',week:'第一周',type:'青年团契',subtype:'',leader:'',worship:'敬拜A',prayerLeader:'',praisePrayer:'',memorialPrayer:'',piano:'司琴A',drums:'鼓A',guitar:'吉他A',bass:'贝斯A',reading:'',note:'证道：活动游戏',time:''},
      {month:'2026年3月',week:'第二周',type:'青年团契',subtype:'',leader:'',worship:'敬拜B',prayerLeader:'',praisePrayer:'',memorialPrayer:'',piano:'司琴B',drums:'',guitar:'',bass:'',reading:'',note:'证道：吴超凡',time:''},

      {month:'2026年3月',week:'第一周',type:'主日下午',subtype:'',leader:'金展',worship:'胡娜',prayerLeader:'戴献和',praisePrayer:'林文宝',memorialPrayer:'邱展伟',piano:'杨亦佳/翁撒该',drums:'',guitar:'',bass:'',reading:'诗9 金Silvia',note:'证道：金美德',time:''},
      {month:'2026年3月',week:'第二周',type:'主日下午',subtype:'',leader:'林文宝',worship:'吴超凡',prayerLeader:'王皞阳',praisePrayer:'金展',memorialPrayer:'季连芬',piano:'青少年',drums:'',guitar:'',bass:'',reading:'诗10 季轩',note:'证道：吴恬恬',time:''},

      {month:'2026年3月',week:'第一周',type:'主日晚上',subtype:'',leader:'林文宝',worship:'翁撒该/叶春叶',prayerLeader:'',praisePrayer:'',memorialPrayer:'',piano:'金紫涵/黄天丽',drums:'',guitar:'',bass:'',reading:'',note:'证道：金美德',time:''},
      {month:'2026年3月',week:'第二周',type:'主日晚上',subtype:'',leader:'吴超凡',worship:'吴超凡及青少年',prayerLeader:'',praisePrayer:'',memorialPrayer:'',piano:'青少年',drums:'',guitar:'',bass:'',reading:'',note:'证道：彭永剑',time:''},

      {month:'2026年3月',week:'第一周',type:'祷告会',subtype:'周三祷告会',leader:'王皞阳',worship:'',prayerLeader:'',praisePrayer:'',memorialPrayer:'',piano:'',drums:'',guitar:'',bass:'',reading:'',note:'周三祷告会 · 21:00-22:00',time:'21:00-22:00'},
      {month:'2026年3月',week:'第一周',type:'祷告会',subtype:'周六祷告会',leader:'翁撒该',worship:'',prayerLeader:'',praisePrayer:'',memorialPrayer:'',piano:'',drums:'',guitar:'',bass:'',reading:'',note:'周六祷告会 · 7:30-8:30',time:'7:30-8:30'}
    ];
  }
})();
