/**
 * service-schedule.js  v5.0
 * CECP 服事安排 — 横向表格
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

  // ── 行定义 ─────────────────────────────────────────────────────────────────
  var ROWS = [
    { key:'leader',  label:'主领 / 司仪' },
    { key:'worship', label:'敬拜带领' },
    { key:'band',    label:'乐手 / 司琴' },
    { key:'prayer',  label:'祷告带领' },
    { key:'reading', label:'读　　经' },
    { key:'note',    label:'证道讲员' },
  ];

  // ── 聚会类型配色 ────────────────────────────────────────────────────────────
  var TC = {
    '主日下午': { pill:'#1e3a5f', text:'#6eafdf', col:'#152b47' },
    '主日晚上': { pill:'#3a1e5f', text:'#a06ee0', col:'#2a1547' },
    '青年团契': { pill:'#1e4a30', text:'#5ec48a', col:'#152e1f' },
  };
  var TC_DEF = { pill:'#2a2a2a', text:'#999', col:'#1c1c1c' };

  // ── 姓名彩色 badge ─────────────────────────────────────────────────────────
  var COLORS = [
    ['#0d2a45','#5ba3d4'],['#0d3520','#52b87a'],['#2d1045','#a06acc'],
    ['#3d1020','#c96888'],['#092830','#4db0b8'],['#2d1e04','#c09030'],
    ['#0d1e38','#5878b8'],['#200d38','#8860b8'],['#0d2418','#58a878'],
    ['#301408','#b87860'],['#08202e','#4888a8'],['#1c1040','#7868b8'],
    ['#2c0e10','#b86060'],['#0e2c0e','#60b860'],['#0e0e2c','#6060b8'],
    ['#103028','#50a898'],['#2c1e08','#a89050'],['#141030','#7070b0'],
  ];

  function badgeColor(name) {
    if (!name) return null;
    var h = 0;
    for (var i = 0; i < name.length; i++) h = (Math.imul(31, h) + name.charCodeAt(i)) | 0;
    return COLORS[Math.abs(h) % COLORS.length];
  }

  // ── 注入样式 ───────────────────────────────────────────────────────────────
  if (!document.getElementById('_cs5_style')) {
    var st = document.createElement('style');
    st.id = '_cs5_style';
    st.textContent = `
#cecp-schedule {
  font-family: "PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif;
  background: #111;
  border-radius: 16px;
  overflow: hidden;
  box-sizing: border-box;
  padding: 0;
  color: #ccc;
}
#cecp-schedule * { box-sizing: border-box; margin: 0; padding: 0; }

/* ── 工具栏 ── */
._cs_top {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px 14px;
  border-bottom: 1px solid #1e1e1e;
  flex-wrap: wrap;
}
._cs_month_tabs {
  display: flex;
  gap: 3px;
  background: #1a1a1a;
  border-radius: 10px;
  padding: 3px;
}
._cs_mt {
  padding: 5px 14px;
  font-size: 13px;
  color: #555;
  cursor: pointer;
  border-radius: 8px;
  border: none;
  background: none;
  font-family: inherit;
  white-space: nowrap;
  transition: all .15s;
  letter-spacing: .02em;
}
._cs_mt.on { background: #252525; color: #e8e8e8; font-weight: 500; }
._cs_mt:hover:not(.on) { color: #aaa; }

._cs_export {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  font-size: 12px;
  color: #666;
  border: 1px solid #222;
  border-radius: 8px;
  background: none;
  cursor: pointer;
  font-family: inherit;
  transition: all .15s;
  white-space: nowrap;
}
._cs_export:hover { border-color:#444; color:#bbb; background:#161616; }
._cs_export:disabled { opacity: .4; cursor: not-allowed; }

/* ── 类型筛选 ── */
._cs_filters {
  display: flex;
  gap: 6px;
  padding: 10px 20px;
  border-bottom: 1px solid #1a1a1a;
  flex-wrap: wrap;
}
._cs_filter {
  padding: 3px 12px;
  font-size: 12px;
  border-radius: 20px;
  cursor: pointer;
  border: 1px solid #252525;
  background: none;
  font-family: inherit;
  color: #555;
  transition: all .15s;
}
._cs_filter.on { color: #fff; border-color: transparent; }
._cs_filter:hover:not(.on) { color: #999; border-color: #333; }

/* ── 表格容器 ── */
._cs_scroll {
  overflow-x: auto;
  overflow-y: visible;
}
._cs_scroll::-webkit-scrollbar { height: 3px; }
._cs_scroll::-webkit-scrollbar-track { background: #161616; }
._cs_scroll::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }

/* ── 表格 ── */
._cs_table {
  border-collapse: collapse;
  width: 100%;
}
._cs_table th, ._cs_table td {
  border: 1px solid #1a1a1a;
}

/* 左上角 */
._cs_corner {
  background: #131313;
  position: sticky;
  left: 0;
  z-index: 3;
  padding: 14px 16px;
  font-size: 11px;
  color: #333;
  vertical-align: bottom;
  min-width: 86px;
  border-right: 1px solid #1e1e1e;
}

/* 日期/类型 列标题 */
._cs_col_h {
  padding: 12px 14px;
  text-align: center;
  min-width: 100px;
  vertical-align: bottom;
}
._cs_col_h .date {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}
._cs_col_h .type_pill {
  display: inline-block;
  margin-top: 5px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  letter-spacing: .04em;
}

/* 岗位行标题 */
._cs_row_h {
  background: #131313;
  position: sticky;
  left: 0;
  z-index: 2;
  padding: 10px 16px;
  font-size: 12px;
  color: #555;
  text-align: left;
  white-space: nowrap;
  border-right: 1px solid #1e1e1e;
  letter-spacing: .04em;
}

/* 内容格 */
._cs_cell {
  padding: 9px 12px;
  text-align: center;
  background: #111;
  vertical-align: middle;
  min-width: 100px;
  transition: background .1s;
}
._cs_cell:hover { background: #161616; }

/* 读经格 */
._cs_reading_cell {
  text-align: left;
  font-size: 11px;
  line-height: 1.5;
  color: #5a8a5a;
  padding: 8px 12px;
  white-space: normal;
  max-width: 120px;
}

/* 证道格 */
._cs_note_cell {
  text-align: left;
  font-size: 11px;
  line-height: 1.5;
  color: #8a7a50;
  padding: 8px 12px;
  white-space: normal;
  max-width: 120px;
}

/* 姓名 badge */
._cs_badge {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
  margin: 2px;
  white-space: nowrap;
  cursor: pointer;
  transition: opacity .15s, transform .1s, box-shadow .15s;
  user-select: none;
}

/* 高亮状态 */
._cs_badge.lit {
  transform: scale(1.08);
  box-shadow: 0 0 0 2px rgba(255,255,255,0.25);
  z-index: 1;
  position: relative;
}
._cs_badge.dim { opacity: 0.2; }

/* 点击锁定 */
._cs_badge.locked {
  transform: scale(1.1);
  box-shadow: 0 0 0 2px rgba(255,255,255,0.5);
  position: relative;
  z-index: 1;
}
._cs_badge.locked_dim { opacity: 0.15; }

/* 空值 */
._cs_empty_val { color: #1e1e1e; font-size: 14px; }

/* 加载 */
._cs_loading {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 48px 24px;
  color: #444;
  font-size: 14px;
}
._cs_spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #222;
  border-top-color: #555;
  border-radius: 50%;
  animation: _csSpin .8s linear infinite;
  flex-shrink: 0;
}
@keyframes _csSpin { to { transform: rotate(360deg); } }
._cs_no_data { padding: 48px; text-align: center; color: #333; font-size: 14px; }
._cs_error { padding: 20px; color: #a04040; font-size: 13px; line-height: 1.7; }
`;
    document.head.appendChild(st);
  }

  // ── 加载中 ────────────────────────────────────────────────────────────────
  EL.innerHTML = '<div class="_cs_loading"><div class="_cs_spinner"></div>加载服事安排…</div>';

  // ── 拉取数据 ──────────────────────────────────────────────────────────────
  if (!API || API === 'DEMO') { setTimeout(function () { boot(demo()); }, 200); return; }

  fetch(API + '?action=all')
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (res) {
      if (!res.ok) throw new Error(res.error || '脚本错误');
      boot(res.data);
    })
    .catch(function (e) {
      EL.innerHTML = '<div class="_cs_error">⚠ ' + esc(e.message) +
        '<br><small style="color:#555">Apps Script 需要重新部署（管理部署 → 编辑 → 新建版本）</small></div>';
    });

  // ── 初始化 ────────────────────────────────────────────────────────────────
  var _lockedName = null;

  function boot(rows) {
    if (!rows || !rows.length) { EL.innerHTML = '<div class="_cs_no_data">暂无服事安排</div>'; return; }

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

    // 定位当前月
    var now = new Date();
    var nowKey = now.getFullYear() + '-' + pad(now.getMonth() + 1);
    var idx = keys.indexOf(nowKey);
    if (idx < 0) {
      for (var i = 0; i < keys.length; i++) { if (keys[i] >= nowKey) { idx = i; break; } }
      if (idx < 0) idx = keys.length - 1;
    }

    // 所有类型
    var allTypes = [];
    rows.forEach(function (r) {
      if (r.type && allTypes.indexOf(r.type) < 0) allTypes.push(r.type);
    });
    var tOrd = {'主日下午':0,'主日晚上':1,'青年团契':2};
    allTypes.sort(function (a, b) { return (tOrd[a]||9) - (tOrd[b]||9); });

    var activeTypes = allTypes.slice();

    render(idx);

    function render(i) {
      _lockedName = null;
      var key  = keys[i];
      var data = months[key];

      var svcs = data.filter(function (s) { return activeTypes.indexOf(s.type) >= 0; });

      // ── 月份切换 Tabs ──
      var tabsHtml = '';
      if (i > 0)               tabsHtml += '<button class="_cs_mt" id="_csPrev">← ' + mlabel(keys[i-1]) + '</button>';
      tabsHtml +=                           '<button class="_cs_mt on">' + mlabel(key) + '</button>';
      if (i < keys.length - 1) tabsHtml += '<button class="_cs_mt" id="_csNext">' + mlabel(keys[i+1]) + ' →</button>';

      // ── 类型筛选 ──
      var filtersHtml = allTypes.map(function (tp) {
        var tc = TC[tp] || TC_DEF;
        var on = activeTypes.indexOf(tp) >= 0;
        return '<button class="_cs_filter' + (on ? ' on' : '') + '" data-type="' + esc(tp) + '"' +
          (on ? ' style="background:' + tc.pill + ';color:' + tc.text + '"' : '') + '>' + esc(tp) + '</button>';
      }).join('');

      // ── 表头 ──
      var hdr = '<tr><th class="_cs_corner">服事</th>';
      svcs.forEach(function (s) {
        var tc = TC[s.type] || TC_DEF;
        hdr += '<th class="_cs_col_h" style="background:' + tc.col + '">' +
          '<div class="date">' + dayStr(s.date) + '</div>' +
          '<div class="type_pill" style="background:' + tc.pill + ';color:' + tc.text + '">' + esc(s.type) + '</div>' +
          '</th>';
      });
      hdr += '</tr>';

      // ── 表体 ──
      var body = ROWS.map(function (row) {
        var tr = '<tr><td class="_cs_row_h">' + row.label + '</td>';
        svcs.forEach(function (s) {
          var val = s[row.key] || '';
          if (row.key === 'reading') {
            tr += '<td class="_cs_cell _cs_reading_cell">' + (val ? esc(val) : '<span class="_cs_empty_val">—</span>') + '</td>';
          } else if (row.key === 'note') {
            tr += '<td class="_cs_cell _cs_note_cell">' + (val ? esc(val) : '<span class="_cs_empty_val">—</span>') + '</td>';
          } else {
            tr += '<td class="_cs_cell">' + renderCell(val) + '</td>';
          }
        });
        return tr + '</tr>';
      }).join('');

      EL.innerHTML =
        '<div class="_cs_top">' +
          '<div class="_cs_month_tabs">' + tabsHtml + '</div>' +
          '<button class="_cs_export" id="_csExp">' +
            svg_download() + '导出图片' +
          '</button>' +
        '</div>' +
        (allTypes.length > 1 ? '<div class="_cs_filters" id="_csFilters">' + filtersHtml + '</div>' : '') +
        '<div class="_cs_scroll" id="_csScroll">' +
          '<table class="_cs_table" id="_csTable"><thead>' + hdr + '</thead><tbody>' + body + '</tbody></table>' +
        '</div>';

      // 事件绑定
      var prev = EL.querySelector('#_csPrev');
      var next = EL.querySelector('#_csNext');
      var exp  = EL.querySelector('#_csExp');
      var fbox = EL.querySelector('#_csFilters');

      if (prev) prev.addEventListener('click', function () { render(i - 1); });
      if (next) next.addEventListener('click', function () { render(i + 1); });
      if (exp)  exp.addEventListener('click',  function () { exportPng(key); });
      if (fbox) fbox.querySelectorAll('._cs_filter').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var tp = this.dataset.type;
          var ix = activeTypes.indexOf(tp);
          if (ix >= 0) { if (activeTypes.length > 1) activeTypes.splice(ix, 1); }
          else activeTypes.push(tp);
          render(i);
        });
      });

      // ── 姓名高亮 ──
      bindHighlight();
    }
  }

  // ── 姓名高亮（hover + click） ─────────────────────────────────────────────
  function bindHighlight() {
    var badges = EL.querySelectorAll('._cs_badge');

    badges.forEach(function (b) {
      // Hover
      b.addEventListener('mouseenter', function () {
        if (_lockedName) return; // 有锁定时不响应 hover
        var name = this.textContent;
        badges.forEach(function (x) {
          if (x.textContent === name) x.classList.add('lit');
          else x.classList.add('dim');
        });
      });

      b.addEventListener('mouseleave', function () {
        if (_lockedName) return;
        badges.forEach(function (x) { x.classList.remove('lit', 'dim'); });
      });

      // Click（锁定/解锁）
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var name = this.textContent;

        if (_lockedName === name) {
          // 解锁
          _lockedName = null;
          badges.forEach(function (x) { x.classList.remove('locked', 'locked_dim', 'lit', 'dim'); });
        } else {
          // 锁定这个名字
          _lockedName = name;
          badges.forEach(function (x) {
            x.classList.remove('lit', 'dim');
            if (x.textContent === name) { x.classList.add('locked'); x.classList.remove('locked_dim'); }
            else { x.classList.add('locked_dim'); x.classList.remove('locked'); }
          });
        }
      });
    });

    // 点空白解锁
    EL.addEventListener('click', function () {
      if (_lockedName) {
        _lockedName = null;
        EL.querySelectorAll('._cs_badge').forEach(function (x) {
          x.classList.remove('locked', 'locked_dim', 'lit', 'dim');
        });
      }
    });
  }

  // ── 单元格渲染 ─────────────────────────────────────────────────────────────
  function renderCell(val) {
    if (!val) return '<span class="_cs_empty_val">—</span>';
    // 支持 / 或 \n 分隔多人
    var names = val.split(/[\/\n]/).map(function (n) { return n.trim(); }).filter(Boolean);
    return names.map(function (n) {
      var c = badgeColor(n);
      if (!c) return '<span class="_cs_empty_val">—</span>';
      return '<span class="_cs_badge" style="background:' + c[0] + ';color:' + c[1] + '">' + esc(n) + '</span>';
    }).join('');
  }

  // ── 导出 PNG ───────────────────────────────────────────────────────────────
  function exportPng(key) {
    var btn   = EL.querySelector('#_csExp');
    var wrap  = EL.querySelector('#_csScroll');
    var table = EL.querySelector('#_csTable');
    if (!btn || !table) return;
    btn.disabled = true;
    btn.textContent = '处理中…';

    function run() {
      var ov = wrap.style.overflow;
      wrap.style.overflow = 'visible';
      window.html2canvas(table, { backgroundColor: '#111', scale: 2, useCORS: true, logging: false })
        .then(function (canvas) {
          wrap.style.overflow = ov;
          var a = document.createElement('a');
          a.download = '服事安排_' + key + '.png';
          a.href = canvas.toDataURL('image/png');
          a.click();
          btn.innerHTML = svg_download() + '导出图片';
          btn.disabled = false;
        })
        .catch(function () {
          wrap.style.overflow = ov;
          btn.textContent = '导出失败';
          btn.disabled = false;
        });
    }

    if (!window.html2canvas) {
      var sc = document.createElement('script');
      sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      sc.onload = run;
      document.head.appendChild(sc);
    } else { run(); }
  }

  // ── 工具 ──────────────────────────────────────────────────────────────────
  function dayStr(s) {
    var m = s && s.match(/\d{4}[-\/]\d{1,2}[-\/](\d{1,2})/);
    return m ? +m[1] + '日' : s;
  }
  function mlabel(k) { var p = k.split('-'); return p[0] + '年' + +p[1] + '月'; }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function svg_download() {
    return '<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M7 1v8M4 6l3 3 3-3M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1"/></svg>';
  }

  // ── Demo 数据 ──────────────────────────────────────────────────────────────
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
