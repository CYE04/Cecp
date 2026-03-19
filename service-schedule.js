/**
 * service-schedule.js
 * 年份安全版 + 同名高亮恢复
 */
(function () {
  'use strict';

  var EL = document.getElementById('cecp-schedule');
  if (!EL) return;

  var API = (EL.dataset.api || '').trim();

  var TYPE_ORDER = ['青年团契', '主日下午', '主日晚上', '祷告会'];
  var WEEK_ORDER = ['第一周', '第二周', '第三周', '第四周', '第五周'];

  var TYPE_C = {
    '主日下午': { accent:'#fbff00', bg:'#b9a50d', tx:'#fffa9f'},
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

  if (!document.getElementById('_cecp_yearsafe_style_v2')) {
    var st = document.createElement('style');
    st.id = '_cecp_yearsafe_style_v2';
    st.textContent = `
:root{
  --cec-bg:#f4f6f9;
  --cec-bg2:#ffffff;
  --cec-bg3:#f0f2f6;
  --cec-btn-bg:#eaecf1;
  --cec-border:#d0d5df;
  --cec-border2:#bcc3d1;
  --cec-ink:#1a1d24;
  --cec-ink2:#5a6275;
  --cec-ink3:#8a94a6;
  --cec-ink4:#9aa0ad;
  --cec-hover:#e4e8f0;
  --cec-active:#dce3f0;
  --cec-active-border:#8fa3cc;
  --cec-ref:#1a7a3c;
  --cec-npfx:#7a5500;
  --cec-err:#b83232;
  --cec-spin1:#c0c8d8;
  --cec-spin2:#3a4a6a;
}
@media(prefers-color-scheme:dark){
  :root{
    --cec-bg:#111214;
    --cec-bg2:#17191d;
    --cec-bg3:#14171d;
    --cec-btn-bg:#1d2026;
    --cec-border:#343943;
    --cec-border2:#262a31;
    --cec-ink:#e8ebf0;
    --cec-ink2:#aeb6c3;
    --cec-ink3:#7f8a9a;
    --cec-ink4:#6e7887;
    --cec-hover:#242932;
    --cec-active:#2a3040;
    --cec-active-border:#48526a;
    --cec-ref:#97d8a6;
    --cec-npfx:#f0cb78;
    --cec-err:#cf6b6b;
    --cec-spin1:#48526a;
    --cec-spin2:#cfd6df;
  }
}
#cecp-schedule{
  font-family:"PingFang SC","Noto Sans SC","Microsoft YaHei",system-ui,sans-serif;
  width:100%;
  background:var(--cec-bg);
  color:var(--cec-ink);
  border:1px solid var(--cec-border);
  border-radius:16px;
  overflow:hidden;
}
#cecp-schedule *{box-sizing:border-box}
.cec-top,.cec-sub,.cec-typebar{
  display:flex;align-items:center;gap:8px;flex-wrap:wrap;
  padding:10px 12px;border-bottom:1px solid var(--cec-border2);background:var(--cec-bg2);
}
.cec-sub,.cec-typebar{background:var(--cec-bg3)}
.cec-btn{
  appearance:none;border:none;cursor:pointer;
  display:inline-flex;align-items:center;justify-content:center;
  font:inherit;white-space:nowrap;transition:.12s ease;
}
.cec-btn-month,.cec-btn-arr,.cec-btn-tool,.cec-btn-type{
  height:34px;border-radius:10px;border:1px solid var(--cec-border);
  background:var(--cec-btn-bg);color:var(--cec-ink2);
}
.cec-btn-month{padding:0 14px;font-weight:700}
.cec-btn-arr{width:34px}
.cec-btn-tool{padding:0 14px;font-weight:700}
.cec-btn-month:hover,.cec-btn-arr:hover,.cec-btn-tool:hover,.cec-btn-type:hover{background:var(--cec-hover);color:var(--cec-ink)}
.cec-btn-month.on,.cec-btn-type.on{background:var(--cec-active);color:var(--cec-ink);border-color:var(--cec-active-border)}
.cec-typebar .cec-btn-type{padding:0 12px;gap:6px;font-size:13px;font-weight:700}
.cec-dot{width:8px;height:8px;border-radius:50%}
.cec-wrap{width:100%;overflow-x:auto;background:var(--cec-bg)}
.cec-tbl{
  border-collapse:separate;border-spacing:0;
  width:max-content;min-width:100%;table-layout:fixed;
}
.cec-tbl th,.cec-tbl td{
  border-right:1px solid var(--cec-border);border-bottom:1px solid var(--cec-border);
  vertical-align:middle;
}
.cec-tbl tr th:last-child,.cec-tbl tr td:last-child{border-right:none}
.cec-corner,.cec-h{
  position:sticky;top:0;z-index:2;
  background:var(--cec-bg2);
  color:var(--cec-ink2);
  font-size:12px;font-weight:800;
  text-align:center;padding:14px 10px;
}
.cec-corner{z-index:3;color:var(--cec-ink3)}
.cec-rowlbl{
  background:var(--cec-bg3);
  color:var(--cec-ink);
  font-size:13px;font-weight:800;
  padding:14px 12px;
  white-space:nowrap;
}
.cec-cell{
  min-width:140px;height:82px;padding:10px;
  text-align:center;background:var(--cec-bg);
}
.cec-cell:hover{background:var(--cec-bg2)}
.cec-empty{color:var(--cec-ink4);font-size:14px}
.cec-badges{
  display:flex;flex-wrap:wrap;justify-content:center;align-items:center;
  gap:8px;min-height:56px;
}
.cec-badge{
  display:inline-flex;align-items:center;justify-content:center;
  min-height:32px;padding:6px 12px;border-radius:7px;
  font-size:11px;font-weight:800;line-height:1.2;white-space:nowrap;
  transition:.12s ease;user-select:none;
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
  min-height:56px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;
}
.cec-ref{font-size:12px;font-weight:800;color:var(--cec-ref)}
.cec-npfx{font-size:11px;font-weight:800;color:var(--cec-npfx)}
.cec-state{
  display:flex;align-items:center;justify-content:center;gap:12px;
  padding:56px 20px;color:var(--cec-ink2);
}
.cec-spin{
  width:18px;height:18px;border:2px solid var(--cec-spin1);border-top-color:var(--cec-spin2);border-radius:50%;
  animation:cecspin .7s linear infinite;
}
@keyframes cecspin{to{transform:rotate(360deg)}}
.cec-err{padding:24px;color:var(--cec-err);line-height:1.8}
@media(max-width:760px){
  .cec-cell{min-width:120px;height:74px;padding:8px}
  .cec-corner,.cec-h,.cec-rowlbl{padding:10px 8px}
  .cec-badges{gap:6px}
  .cec-badge{font-size:10px;padding:5px 10px}
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
        if (activeMonthIdx > 0) { activeMonthIdx--; render(); }
      });
      bind('#mPrevText', function () {
        if (activeMonthIdx > 0) { activeMonthIdx--; render(); }
      });
      bind('#mNext', function () {
        if (activeMonthIdx < months.length - 1) { activeMonthIdx++; render(); }
      });
      bind('#mNextText', function () {
        if (activeMonthIdx < months.length - 1) { activeMonthIdx++; render(); }
      });

      EL.querySelectorAll('[data-type]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          activeType = this.getAttribute('data-type');
          lockedName = null;
          render();
        });
      });

      bindHighlight();
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
