/**
 * service-schedule.js  v6.0
 * CECP 服事安排横向表格
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

  /* ── 岗位行 ─────────────────────────────────────────────────────────────── */
  var ROWS = [
    { key: 'leader',  label: '主领 / 司仪', type: 'badges' },
    { key: 'worship', label: '敬拜带领',    type: 'badges' },
    { key: 'band',    label: '乐手 / 司琴', type: 'badges' },
    { key: 'prayer',  label: '祷告带领',    type: 'badges' },
    { key: 'reading', label: '读　　经',    type: 'reading' },  // 特殊渲染
    { key: 'note',    label: '证道讲员',    type: 'note' },
  ];

  /* ── 聚会类型配色 ────────────────────────────────────────────────────────── */
  var TC = {
    '主日下午': { hdr: '#1a3060', pill: '#1e3a78', txt: '#78b4f0', col: '#0f1e3c' },
    '主日晚上': { hdr: '#38186a', pill: '#42207e', txt: '#b07ae8', col: '#22103e' },
    '青年团契': { hdr: '#194028', pill: '#1e4e30', txt: '#5ec48a', col: '#101e14' },
  };
  var TC_DEF = { hdr: '#252525', pill: '#2a2a2a', txt: '#888', col: '#1a1a1a' };

  /* ── 姓名 badge 颜色 ─────────────────────────────────────────────────────── */
  var PAL = [
    ['#0a2540','#5aaae0'],['#0a3018','#50c07a'],['#280c44','#9c68d8'],
    ['#380a1a','#cc607e'],['#08262e','#48b0be'],['#281a04','#c09030'],
    ['#0a1c38','#5078c0'],['#1c0a38','#8460c0'],['#0a2018','#58b080'],
    ['#2e1208','#b87858'],['#082028','#48a0b0'],['#1a0e3c','#7068c0'],
    ['#2c0c10','#b06060'],['#0c280c','#60b060'],['#0c0c2c','#6060b0'],
    ['#0e2c26','#50a898'],['#2c1c04','#a89050'],['#141030','#7070b0'],
  ];

  function badgeColor(name) {
    if (!name) return null;
    var h = 0;
    for (var i = 0; i < name.length; i++) h = (Math.imul(31, h) + name.charCodeAt(i)) | 0;
    return PAL[Math.abs(h) % PAL.length];
  }

  /* ── 读经格解析："诗9 金Silvia" → {ref:"诗9", name:"金Silvia"} ─────────── */
  function parseReading(val) {
    if (!val) return null;
    // 格式: "诗N 姓名" 或 "诗NN 姓名"
    var m = val.match(/^(诗\d+)\s+(.+)$/);
    if (m) return { ref: m[1], name: m[2].trim() };
    return { ref: val, name: '' };
  }

  /* ── CSS ───────────────────────────────────────────────────────────────── */
  if (!document.getElementById('_cs6css')) {
    var st = document.createElement('style');
    st.id = '_cs6css';
    st.textContent = `
#cecp-schedule {
  font-family: "PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif;
  background: #0d0d0d;
  border-radius: 14px;
  overflow: hidden;
  box-sizing: border-box;
}
#cecp-schedule * { box-sizing: border-box; margin: 0; padding: 0; }

/* 顶部工具栏 */
.cs6-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 18px 12px;
  background: #0d0d0d;
  border-bottom: 1px solid #1c1c1c;
  flex-wrap: wrap;
}
.cs6-tabs {
  display: flex;
  gap: 2px;
  background: #181818;
  border-radius: 10px;
  padding: 3px;
}
.cs6-tab {
  padding: 5px 14px;
  font-size: 13px;
  color: #444;
  cursor: pointer;
  border-radius: 7px;
  border: none;
  background: none;
  font-family: inherit;
  white-space: nowrap;
  transition: all .15s;
  letter-spacing: .02em;
}
.cs6-tab.on { background: #222; color: #e0e0e0; font-weight: 500; }
.cs6-tab:hover:not(.on) { color: #888; }

/* 导出按钮 */
.cs6-export {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  font-size: 12px;
  color: #555;
  border: 1px solid #222;
  border-radius: 8px;
  background: none;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  transition: all .15s;
}
.cs6-export:hover { border-color: #404040; color: #aaa; background: #141414; }
.cs6-export:disabled { opacity: .35; cursor: not-allowed; }

/* 类型筛选 */
.cs6-filters {
  display: flex;
  gap: 6px;
  padding: 9px 18px;
  border-bottom: 1px solid #181818;
  flex-wrap: wrap;
}
.cs6-filter {
  padding: 3px 12px;
  font-size: 11px;
  border-radius: 20px;
  cursor: pointer;
  border: 1px solid #252525;
  background: none;
  font-family: inherit;
  color: #444;
  transition: all .15s;
  letter-spacing: .03em;
}
.cs6-filter.on  { color: #fff; border-color: transparent; }
.cs6-filter:hover:not(.on) { color: #888; border-color: #333; }

/* 滚动容器 */
.cs6-scroll {
  overflow-x: auto;
  overflow-y: visible;
  background: #0d0d0d;
}
.cs6-scroll::-webkit-scrollbar { height: 3px; }
.cs6-scroll::-webkit-scrollbar-track { background: #111; }
.cs6-scroll::-webkit-scrollbar-thumb { background: #252525; border-radius: 2px; }

/* 表格 */
.cs6-table { border-collapse: collapse; }
.cs6-table th, .cs6-table td { border: 1px solid #181818; }

/* 左上角 */
.cs6-corner {
  background: #111;
  position: sticky;
  left: 0;
  z-index: 3;
  padding: 12px 14px;
  font-size: 11px;
  color: #2a2a2a;
  vertical-align: bottom;
  min-width: 82px;
  border-right: 1px solid #1e1e1e;
}

/* 列标题（日期+类型） */
.cs6-col-h {
  text-align: center;
  vertical-align: bottom;
  padding: 0;
  min-width: 96px;
}
.cs6-col-date {
  padding: 12px 12px 6px;
  font-size: 22px;
  font-weight: 700;
  color: #f0f0f0;
  line-height: 1;
  display: block;
}
.cs6-col-pill {
  display: block;
  padding: 3px 0 10px;
  font-size: 10px;
  letter-spacing: .05em;
}

/* 行标题（左固定） */
.cs6-row-h {
  background: #111;
  position: sticky;
  left: 0;
  z-index: 2;
  padding: 9px 14px;
  font-size: 11px;
  color: #444;
  text-align: left;
  white-space: nowrap;
  border-right: 1px solid #1e1e1e;
  letter-spacing: .04em;
  font-weight: 400;
}

/* 内容格 */
.cs6-cell {
  padding: 8px 10px;
  text-align: center;
  background: #0d0d0d;
  vertical-align: middle;
  min-width: 96px;
  transition: background .1s;
}
.cs6-cell:hover { background: #131313; }

/* 读经格 */
.cs6-cell-reading {
  text-align: center;
  padding: 8px 10px;
  background: #0d0d0d;
  vertical-align: middle;
  min-width: 96px;
}
.cs6-cell-reading:hover { background: #131313; }
.cs6-reading-ref {
  display: inline-block;
  font-size: 10px;
  color: #3a5a3a;
  margin-bottom: 2px;
  letter-spacing: .04em;
}

/* 证道格 */
.cs6-cell-note {
  text-align: center;
  padding: 8px 10px;
  background: #0d0d0d;
  vertical-align: middle;
  min-width: 96px;
}
.cs6-cell-note:hover { background: #131313; }
.cs6-note-label {
  display: inline-block;
  font-size: 10px;
  color: #4a3c20;
  margin-bottom: 2px;
  letter-spacing: .03em;
}

/* 姓名 badge */
.cs6-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.5;
  margin: 2px;
  white-space: nowrap;
  cursor: pointer;
  transition: opacity .12s, transform .1s, box-shadow .12s;
  user-select: none;
  position: relative;
}

/* hover：同名亮，其余暗 */
.cs6-badge.lit  { transform: scale(1.1); box-shadow: 0 0 0 2px rgba(255,255,255,0.22); z-index: 1; }
.cs6-badge.dim  { opacity: .15; }

/* click 锁定 */
.cs6-badge.locked { transform: scale(1.12); box-shadow: 0 0 0 2px rgba(255,255,255,0.5); z-index: 1; }
.cs6-badge.ldim   { opacity: .12; }

/* 空值 */
.cs6-empty { color: #1e1e1e; font-size: 14px; }

/* 加载 / 错误 */
.cs6-loading { display: flex; align-items: center; gap: 10px; padding: 48px 20px; color: #333; font-size: 14px; }
.cs6-spinner { width: 16px; height: 16px; border: 2px solid #1e1e1e; border-top-color: #444; border-radius: 50%; animation: cs6spin .7s linear infinite; flex-shrink: 0; }
@keyframes cs6spin { to { transform: rotate(360deg); } }
.cs6-nodata { padding: 48px; text-align: center; color: #282828; font-size: 14px; }
.cs6-err { padding: 20px; color: #8a3838; font-size: 13px; line-height: 1.7; }
`;
    document.head.appendChild(st);
  }

  /* ── 加载状态 ──────────────────────────────────────────────────────────── */
  EL.innerHTML = '<div class="cs6-loading"><div class="cs6-spinner"></div>加载服事安排…</div>';

  /* ── 拉取数据 ───────────────────────────────────────────────────────────── */
  if (!API || API === 'DEMO') { setTimeout(function () { boot(demo()); }, 200); return; }

  fetch(API + '?action=all')
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (res) {
      if (!res.ok) throw new Error(res.error || '脚本错误');
      boot(res.data);
    })
    .catch(function (e) {
      EL.innerHTML = '<div class="cs6-err">⚠ ' + esc(e.message) +
        '<br><small style="color:#444">请确认 Apps Script 已部署、版本为最新</small></div>';
    });

  /* ── 全局高亮状态 ──────────────────────────────────────────────────────── */
  var locked = null;   // 锁定的名字（点击后）

  /* ── 初始化 ────────────────────────────────────────────────────────────── */
  function boot(rows) {
    if (!rows || !rows.length) { EL.innerHTML = '<div class="cs6-nodata">暂无服事安排</div>'; return; }

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

      // 月份导航
      var tabsHtml = '';
      if (i > 0)               tabsHtml += '<button class="cs6-tab" id="csPrev">← ' + mlabel(keys[i-1]) + '</button>';
      tabsHtml +=                           '<button class="cs6-tab on">' + mlabel(key) + '</button>';
      if (i < keys.length - 1) tabsHtml += '<button class="cs6-tab" id="csNext">' + mlabel(keys[i+1]) + ' →</button>';

      // 类型筛选
      var fHtml = allTypes.map(function (tp) {
        var tc = TC[tp] || TC_DEF;
        var on = activeTypes.indexOf(tp) >= 0;
        return '<button class="cs6-filter' + (on?'  on':'') + '" data-type="'+esc(tp)+'"'
          + (on?' style="background:'+tc.pill+';color:'+tc.txt+'"':'') + '>' + esc(tp) + '</button>';
      }).join('');

      // 表头
      var hdr = '<tr><th class="cs6-corner">服事</th>';
      svcs.forEach(function (s) {
        var tc = TC[s.type] || TC_DEF;
        hdr += '<th class="cs6-col-h" style="background:'+tc.hdr+'">'
          + '<span class="cs6-col-date">'+dayStr(s.date)+'</span>'
          + '<span class="cs6-col-pill" style="color:'+tc.txt+'">'+esc(s.type)+'</span>'
          + '</th>';
      });
      hdr += '</tr>';

      // 表体
      var body = ROWS.map(function (row) {
        var tr = '<tr><td class="cs6-row-h">'+row.label+'</td>';
        svcs.forEach(function (s) {
          var val = s[row.key] || '';
          tr += renderTd(row, val);
        });
        return tr + '</tr>';
      }).join('');

      EL.innerHTML =
        '<div class="cs6-bar">'
          + '<div class="cs6-tabs">' + tabsHtml + '</div>'
          + '<button class="cs6-export" id="csExp">' + svgDown() + '导出图片</button>'
        + '</div>'
        + (allTypes.length > 1 ? '<div class="cs6-filters" id="csFilters">'+fHtml+'</div>' : '')
        + '<div class="cs6-scroll" id="csScroll">'
          + '<table class="cs6-table" id="csTable"><thead>'+hdr+'</thead><tbody>'+body+'</tbody></table>'
        + '</div>';

      // 事件
      var prev = EL.querySelector('#csPrev');
      var next = EL.querySelector('#csNext');
      var exp  = EL.querySelector('#csExp');
      var fbox = EL.querySelector('#csFilters');
      if (prev) prev.addEventListener('click', function () { render(i-1); });
      if (next) next.addEventListener('click', function () { render(i+1); });
      if (exp)  exp.addEventListener('click',  function () { exportPng(key); });
      if (fbox) fbox.querySelectorAll('.cs6-filter').forEach(function (b) {
        b.addEventListener('click', function () {
          var tp = this.dataset.type;
          var ix = activeTypes.indexOf(tp);
          if (ix >= 0) { if (activeTypes.length > 1) activeTypes.splice(ix, 1); }
          else activeTypes.push(tp);
          render(i);
        });
      });

      // 高亮绑定
      bindHighlight();
    }
  }

  /* ── 单元格渲染 ─────────────────────────────────────────────────────────── */
  function renderTd(row, val) {
    if (row.type === 'reading') {
      var rd = parseReading(val);
      if (!rd) return '<td class="cs6-cell-reading"><span class="cs6-empty">—</span></td>';
      var inner = '<span class="cs6-reading-ref">'+esc(rd.ref)+'</span>';
      if (rd.name) inner += '<br>' + badge(rd.name);
      else inner = '<span class="cs6-empty">—</span>';
      return '<td class="cs6-cell-reading">'+inner+'</td>';
    }

    if (row.type === 'note') {
      if (!val) return '<td class="cs6-cell-note"><span class="cs6-empty">—</span></td>';
      // 格式 "证道：潘庆峰" → label + badge
      var m = val.match(/^(证道[：:]\s*)(.+)$/);
      if (m) {
        var inner2 = '<span class="cs6-note-label">'+esc(m[1])+'</span>' + badge(m[2]);
        return '<td class="cs6-cell-note">'+inner2+'</td>';
      }
      return '<td class="cs6-cell-note">' + badge(val) + '</td>';
    }

    // 普通 badges
    if (!val) return '<td class="cs6-cell"><span class="cs6-empty">—</span></td>';
    var names = val.split(/[\/\n]/).map(function (n) { return n.trim(); }).filter(Boolean);
    return '<td class="cs6-cell">' + names.map(badge).join('') + '</td>';
  }

  function parseReading(val) {
    if (!val) return null;
    var m = val.match(/^(诗\d+)\s+(.+)$/);
    if (m) return { ref: m[1], name: m[2].trim() };
    return { ref: val, name: '' };
  }

  function badge(name) {
    if (!name) return '';
    var c = badgeColor(name);
    if (!c) return '<span class="cs6-badge" style="background:#1e1e1e;color:#666">'+esc(name)+'</span>';
    return '<span class="cs6-badge" data-n="'+esc(name)+'" style="background:'+c[0]+';color:'+c[1]+'">'+esc(name)+'</span>';
  }

  /* ── 高亮逻辑 ───────────────────────────────────────────────────────────── */
  function allBadges() { return EL.querySelectorAll('.cs6-badge'); }

  function applyHighlight(name) {
    allBadges().forEach(function (b) {
      var n = b.dataset.n || b.textContent;
      b.classList.remove('lit','dim','locked','ldim');
      if (n === name) b.classList.add(locked ? 'locked' : 'lit');
      else            b.classList.add(locked ? 'ldim'   : 'dim');
    });
  }

  function clearHighlight() {
    allBadges().forEach(function (b) {
      b.classList.remove('lit','dim','locked','ldim');
    });
  }

  function bindHighlight() {
    allBadges().forEach(function (b) {
      var name = b.dataset.n || b.textContent;

      b.addEventListener('mouseenter', function () {
        if (locked) return;
        applyHighlight(name);
      });

      b.addEventListener('mouseleave', function () {
        if (locked) return;
        clearHighlight();
      });

      b.addEventListener('click', function (e) {
        e.stopPropagation();
        if (locked === name) {
          locked = null;
          clearHighlight();
        } else {
          locked = name;
          applyHighlight(name);
        }
      });
    });

    // 点空白解锁
    EL.addEventListener('click', function () {
      if (locked) { locked = null; clearHighlight(); }
    });
  }

  /* ── 导出 PNG ────────────────────────────────────────────────────────────── */
  function exportPng(key) {
    var btn   = EL.querySelector('#csExp');
    var wrap  = EL.querySelector('#csScroll');
    var table = EL.querySelector('#csTable');
    if (!btn || !table) return;
    btn.disabled = true;
    btn.textContent = '处理中…';

    function run() {
      var ov = wrap.style.overflow;
      wrap.style.overflow = 'visible';
      window.html2canvas(table, { backgroundColor: '#0d0d0d', scale: 2, useCORS: true, logging: false })
        .then(function (canvas) {
          wrap.style.overflow = ov;
          var a = document.createElement('a');
          a.download = '服事安排_' + key + '.png';
          a.href = canvas.toDataURL('image/png');
          a.click();
          btn.innerHTML = svgDown() + '导出图片';
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

  /* ── 工具函数 ────────────────────────────────────────────────────────────── */
  function dayStr(s) {
    var m = s && s.match(/\d{4}[-\/]\d{1,2}[-\/](\d{1,2})/);
    return m ? +m[1] + '日' : s;
  }
  function mlabel(k) { var p = k.split('-'); return p[0] + '年' + +p[1] + '月'; }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function svgDown() {
    return '<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-right:4px"><path d="M7 1v8M4 6l3 3 3-3M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1"/></svg>';
  }

  /* ── Demo 数据 ───────────────────────────────────────────────────────────── */
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
