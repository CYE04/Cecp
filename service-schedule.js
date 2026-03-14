/**
 * service-schedule.js  v4.0
 * CECP 服事安排横向表格
 * 托管: https://cye04.github.io/Cecp/service-schedule.js
 *
 * Halo HTML编辑块（两行即可）:
 *   <div id="cecp-schedule" data-api="你的Apps_Script_Web_App_URL"></div>
 *   <script src="https://cye04.github.io/Cecp/service-schedule.js"></script>
 *
 * Sheet 列对应: A日期 B聚会类型 C主领/司仪 D敬拜带领 E乐手/司琴 F祷告带领 G读经
 */
(function () {
  'use strict';

  var EL = document.getElementById('cecp-schedule');
  if (!EL) return;

  var API = EL.dataset.api || '';

  // ── 表格行定义（对应 Sheet 的列） ──────────────────────────────────────────
  var ROWS = [
    { key: 'leader',  label: '主领 / 司仪' },
    { key: 'worship', label: '敬拜带领' },
    { key: 'band',    label: '乐手 / 司琴' },
    { key: 'prayer',  label: '祷告带领' },
    { key: 'reading', label: '读　　经' },
  ];

  // ── 聚会类型颜色 ────────────────────────────────────────────────────────────
  var TYPE_COLOR = {
    '主日下午': { h: '2d4a7a', b: '1e3358', t: '82b8e8' },
    '主日晚上': { h: '4a2d6f', b: '33204e', t: 'c080e0' },
    '青年团契': { h: '2d6f4a', b: '204e33', t: '6dc496' },
  };
  var TYPE_DEFAULT = { h: '3a3a3a', b: '2a2a2a', t: 'cccccc' };

  // ── 姓名徽章色表 ────────────────────────────────────────────────────────────
  var BADGE = [
    ['1b3a5c','82b8e8'],['123d28','6dc496'],['38185a','c080e0'],
    ['4a1528','e07898'],['103842','5cc0cc'],['3c2c08','d4aa40'],
    ['1a2e52','7898d8'],['2c1648','b07cdc'],['123228','78c498'],
    ['3e1e10','d8987a'],['0e2c40','78b4d0'],['281848','9888dc'],
    ['3a1216','d87878'],['123412','78d478'],['12123a','7878d4'],
    ['1e3830','70c8b0'],['3a2808','d4a860'],['1e1e3e','9090d8'],
  ];

  function badgeColor(name) {
    if (!name) return null;
    var h = 0;
    for (var i = 0; i < name.length; i++) h = (Math.imul(31, h) + name.charCodeAt(i)) | 0;
    return BADGE[Math.abs(h) % BADGE.length];
  }

  // ── CSS ────────────────────────────────────────────────────────────────────
  if (!document.getElementById('_cecp_css')) {
    var st = document.createElement('style');
    st.id = '_cecp_css';
    st.textContent = [
      '#cecp-schedule{font-family:"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif;',
        'background:#111;color:#ddd;border-radius:14px;padding:20px 0;',
        'overflow:hidden;box-sizing:border-box}',
      '#cecp-schedule *{box-sizing:border-box;margin:0;padding:0}',

      /* 工具栏 */
      '._cs_bar{display:flex;align-items:center;gap:8px;padding:0 20px 16px;flex-wrap:wrap}',
      '._cs_tabs{display:flex;gap:3px;background:#1c1c1c;border-radius:9px;padding:3px;flex-shrink:0}',
      '._cs_tab{padding:6px 15px;font-size:13px;color:#555;cursor:pointer;border-radius:7px;',
        'border:none;background:none;transition:all .15s;font-family:inherit;white-space:nowrap}',
      '._cs_tab._on{background:#2a2a2a;color:#eee;font-weight:500}',
      '._cs_tab:hover:not(._on){color:#aaa}',
      '._cs_exp{display:flex;align-items:center;gap:5px;padding:6px 13px;font-size:12px;',
        'color:#777;border:1px solid #2a2a2a;border-radius:7px;cursor:pointer;',
        'background:none;font-family:inherit;transition:all .15s;white-space:nowrap;margin-left:auto}',
      '._cs_exp:hover{border-color:#444;color:#ccc;background:#1a1a1a}',
      '._cs_exp:disabled{opacity:.4;cursor:not-allowed}',

      /* 类型筛选 */
      '._cs_filters{display:flex;gap:6px;padding:0 20px 14px;flex-wrap:wrap}',
      '._cs_filter{padding:4px 12px;font-size:12px;border-radius:20px;cursor:pointer;',
        'border:1px solid #2a2a2a;background:none;font-family:inherit;transition:all .15s;',
        'color:#666}',
      '._cs_filter._active{color:#fff;border-color:transparent}',
      '._cs_filter:hover:not(._active){border-color:#444;color:#aaa}',

      /* 滚动容器 */
      '._cs_scroll{overflow-x:auto;overflow-y:visible}',
      '._cs_scroll::-webkit-scrollbar{height:4px}',
      '._cs_scroll::-webkit-scrollbar-track{background:#1a1a1a}',
      '._cs_scroll::-webkit-scrollbar-thumb{background:#2e2e2e;border-radius:2px}',

      /* 表格 */
      '._cs_t{border-collapse:collapse}',
      '._cs_t th,._cs_t td{border:1px solid #1e1e1e}',

      /* 角落 */
      '._cs_corner{background:#141414;position:sticky;left:0;z-index:3;padding:10px 14px;',
        'font-size:11px;color:#444;vertical-align:bottom;min-width:82px;',
        'border-right:1px solid #252525}',

      /* 日期/类型列标题 */
      '._cs_col_hd{padding:10px 14px;text-align:center;min-width:96px;vertical-align:bottom;',
        'border-bottom:2px solid rgba(255,255,255,0.08)}',
      '._cs_col_hd ._day{font-size:17px;font-weight:700;color:#fff;line-height:1.1}',
      '._cs_col_hd ._type{font-size:10px;margin-top:3px;letter-spacing:.04em;padding:2px 6px;',
        'border-radius:10px;display:inline-block}',

      /* 行标题（左固定） */
      '._cs_row_hd{background:#141414;position:sticky;left:0;z-index:2;padding:10px 14px;',
        'font-size:12px;color:#666;text-align:left;white-space:nowrap;',
        'border-right:1px solid #252525;letter-spacing:.04em}',

      /* 内容格 */
      '._cs_td{padding:9px 12px;text-align:center;background:#131313;vertical-align:middle;',
        'min-width:96px;transition:background .1s}',
      '._cs_td:hover{background:#181818}',

      /* 读经格（文字多，左对齐，可换行） */
      '._cs_reading{text-align:left;font-size:11px;color:#7a9a6a;padding:8px 12px;',
        'white-space:normal;max-width:120px;line-height:1.5}',

      /* 姓名徽章 */
      '._cs_badge{display:inline-block;padding:3px 9px;border-radius:20px;font-size:12px;',
        'font-weight:500;line-height:1.5;margin:2px;white-space:nowrap}',

      /* 空值 */
      '._cs_mt{color:#282828;font-size:15px}',

      /* 加载 */
      '._cs_loading{display:flex;align-items:center;gap:10px;padding:40px 20px;',
        'color:#444;font-size:14px}',
      '._cs_spin{width:18px;height:18px;border:2px solid #2a2a2a;border-top-color:#666;',
        'border-radius:50%;animation:_csSpin .8s linear infinite;flex-shrink:0}',
      '@keyframes _csSpin{to{transform:rotate(360deg)}}',
      '._cs_empty{padding:48px;text-align:center;color:#333;font-size:14px}',
      '._cs_err{padding:20px;color:#b05050;font-size:13px;line-height:1.7}',
    ].join('');
    document.head.appendChild(st);
  }

  // ── 加载中 ────────────────────────────────────────────────────────────────
  EL.innerHTML = '<div class="_cs_loading"><div class="_cs_spin"></div>加载服事安排…</div>';

  // ── 拉取数据 ──────────────────────────────────────────────────────────────
  if (!API || API === 'DEMO') {
    setTimeout(function () { init(demo()); }, 250);
    return;
  }

  fetch(API + '?action=all')
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (res) {
      if (!res.ok) throw new Error(res.error || '脚本返回错误');
      init(res.data);
    })
    .catch(function (e) {
      EL.innerHTML = '<div class="_cs_err">⚠️ ' + esc(e.message) +
        '<br><small>请确认 Apps Script 已部署、执行身份为「我」、访问权限为「所有人」</small></div>';
    });

  // ── 初始化 ────────────────────────────────────────────────────────────────
  function init(rows) {
    if (!rows || !rows.length) {
      EL.innerHTML = '<div class="_cs_empty">暂无服事安排数据</div>';
      return;
    }

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

    // 找当前月（或最近的未来月）
    var now = new Date();
    var nowKey = now.getFullYear() + '-' + pad(now.getMonth() + 1);
    var idx = keys.indexOf(nowKey);
    if (idx < 0) {
      for (var i = 0; i < keys.length; i++) {
        if (keys[i] >= nowKey) { idx = i; break; }
      }
      if (idx < 0) idx = keys.length - 1;
    }

    // 所有聚会类型
    var allTypes = [];
    rows.forEach(function (r) {
      if (r.type && allTypes.indexOf(r.type) < 0) allTypes.push(r.type);
    });
    // 排序：下午 < 晚上 < 青年 < 其他
    var typeOrder = {'主日下午':0,'主日晚上':1,'青年团契':2};
    allTypes.sort(function(a,b){
      return (typeOrder[a]!==undefined?typeOrder[a]:9) - (typeOrder[b]!==undefined?typeOrder[b]:9);
    });

    var activeTypes = allTypes.slice(); // 默认全选

    render(idx);

    function render(i) {
      var key  = keys[i];
      var data = months[key];

      // 按类型筛选
      var svcs = data.filter(function(s){ return activeTypes.indexOf(s.type) >= 0; });

      // ── 导航 Tabs ──
      var tabs = '';
      if (i > 0)           tabs += '<button class="_cs_tab" id="_csPrev">← ' + mlabel(keys[i-1]) + '</button>';
      tabs +=                       '<button class="_cs_tab _on">' + mlabel(key) + '</button>';
      if (i < keys.length-1) tabs += '<button class="_cs_tab" id="_csNext">' + mlabel(keys[i+1]) + ' →</button>';

      // ── 类型筛选按钮 ──
      var filters = '';
      allTypes.forEach(function(tp) {
        var tc = TYPE_COLOR[tp] || TYPE_DEFAULT;
        var isOn = activeTypes.indexOf(tp) >= 0;
        filters += '<button class="_cs_filter' + (isOn ? ' _active' : '') + '"' +
          (isOn ? ' style="background:#' + tc.b + ';color:#' + tc.t + ';border-color:#' + tc.h + '"' : '') +
          ' data-type="' + esc(tp) + '">' + esc(tp) + '</button>';
      });

      // ── 表头 ──
      var hdr = '<tr><th class="_cs_corner">服事</th>';
      svcs.forEach(function(s) {
        var tc = TYPE_COLOR[s.type] || TYPE_DEFAULT;
        hdr += '<th class="_cs_col_hd" style="background:#' + tc.b + '">' +
          '<div class="_day">' + dayStr(s.date) + '</div>' +
          '<div class="_type" style="background:#' + tc.h + ';color:#' + tc.t + '">' +
            esc(s.type) +
          '</div></th>';
      });
      hdr += '</tr>';

      // ── 表体 ──
      var body = '';
      ROWS.forEach(function(row) {
        body += '<tr><td class="_cs_row_hd">' + row.label + '</td>';
        svcs.forEach(function(s) {
          var val = s[row.key];
          if (row.key === 'reading') {
            body += '<td class="_cs_td _cs_reading">' +
              (val ? esc(val) : '<span class="_cs_mt">—</span>') + '</td>';
          } else {
            body += '<td class="_cs_td">' + renderCell(val) + '</td>';
          }
        });
        body += '</tr>';
      });

      EL.innerHTML =
        '<div class="_cs_bar">' +
          '<div class="_cs_tabs">' + tabs + '</div>' +
          '<button class="_cs_exp" id="_csExp">' +
            '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M7 1v8M4 6l3 3 3-3M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1"/>' +
            '</svg>导出图片' +
          '</button>' +
        '</div>' +
        (allTypes.length > 1 ?
          '<div class="_cs_filters" id="_csFilters">' + filters + '</div>' : '') +
        '<div class="_cs_scroll" id="_csWrap">' +
          '<table class="_cs_t" id="_csTbl"><thead>' + hdr + '</thead><tbody>' + body + '</tbody></table>' +
        '</div>';

      // 事件绑定
      var prev = document.getElementById('_csPrev');
      var next = document.getElementById('_csNext');
      var exp  = document.getElementById('_csExp');
      var fbox = document.getElementById('_csFilters');

      if (prev) prev.addEventListener('click', function(){ render(i-1); });
      if (next) next.addEventListener('click', function(){ render(i+1); });
      if (exp)  exp.addEventListener('click',  function(){ exportPng(key); });
      if (fbox) fbox.querySelectorAll('._cs_filter').forEach(function(btn){
        btn.addEventListener('click', function(){
          var tp = this.dataset.type;
          var idx2 = activeTypes.indexOf(tp);
          if (idx2 >= 0) {
            if (activeTypes.length > 1) activeTypes.splice(idx2, 1); // 至少保留一个
          } else {
            activeTypes.push(tp);
          }
          render(i);
        });
      });
    }
  }

  // ── 单元格渲染（彩色姓名徽章，支持 / 分隔多人） ──────────────────────────
  function renderCell(val) {
    if (!val) return '<span class="_cs_mt">—</span>';
    var names = val.split(/[\/\n]/).map(function(n){ return n.trim(); }).filter(Boolean);
    return names.map(function(n) {
      var c = badgeColor(n);
      if (!c) return '<span class="_cs_mt">—</span>';
      return '<span class="_cs_badge" style="background:#' + c[0] + ';color:#' + c[1] + '">' +
        esc(n) + '</span>';
    }).join('');
  }

  // ── 导出 PNG ───────────────────────────────────────────────────────────────
  function exportPng(key) {
    var btn  = document.getElementById('_csExp');
    var wrap = document.getElementById('_csWrap');
    var tbl  = document.getElementById('_csTbl');
    if (!btn || !tbl) return;
    btn.disabled = true;
    btn.textContent = '处理中…';

    function run() {
      var ov = wrap.style.overflow;
      wrap.style.overflow = 'visible';
      window.html2canvas(tbl, { backgroundColor:'#111', scale:2, useCORS:true, logging:false })
        .then(function(canvas){
          wrap.style.overflow = ov;
          var a = document.createElement('a');
          a.download = '服事安排_' + key + '.png';
          a.href = canvas.toDataURL('image/png');
          a.click();
          btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 1v8M4 6l3 3 3-3M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1"/></svg>导出图片';
          btn.disabled = false;
        })
        .catch(function(){
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
    } else {
      run();
    }
  }

  // ── 工具 ──────────────────────────────────────────────────────────────────
  function dayStr(s) {
    var m = s && s.match(/\d{4}[-\/]\d{1,2}[-\/](\d{1,2})/);
    return m ? +m[1] + '日' : s;
  }
  function mlabel(k) {
    var p = k.split('-'); return p[0] + '年' + +p[1] + '月';
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Demo 数据（与你真实 Sheet 一致） ──────────────────────────────────────
  function demo() {
    return [
      {date:'2026-03-01',type:'主日下午',leader:'金展',worship:'胡娜',band:'杨亦佳',prayer:'戴献和',reading:'诗9 金Silvia'},
      {date:'2026-03-01',type:'主日晚上',leader:'林文宝',worship:'翁撒该/杨雪克/叶春叶',band:'金紫涵/黄天丽',prayer:'戴献和',reading:''},
      {date:'2026-03-08',type:'主日下午',leader:'林文宝',worship:'吴超凡',band:'青少年',prayer:'王皞阳',reading:'诗10 季轩'},
      {date:'2026-03-08',type:'主日晚上',leader:'吴超凡',worship:'吴超凡及青少年',band:'青少年',prayer:'林文宝/董希昆',reading:''},
      {date:'2026-03-08',type:'青年团契',leader:'',worship:'吴超凡',band:'',prayer:'',reading:''},
      {date:'2026-03-15',type:'主日下午',leader:'彭永剑',worship:'孙琴乐',band:'季轩/吴以勒',prayer:'彭永剑',reading:'诗11 何若诗'},
      {date:'2026-03-15',type:'主日晚上',leader:'金展',worship:'胡娜/林文宝',band:'翁撒该',prayer:'徐永西',reading:''},
      {date:'2026-03-15',type:'青年团契',leader:'',worship:'吴恬恬',band:'',prayer:'',reading:''},
      {date:'2026-03-22',type:'主日下午',leader:'戴献和',worship:'王皞阳',band:'黄天丽/金丽莎',prayer:'彭永剑',reading:'诗12 何心如'},
      {date:'2026-03-22',type:'主日晚上',leader:'彭永剑/王皞阳',worship:'叶春叶/董希昆',band:'徐博杰/黄天丽',prayer:'金展',reading:''},
      {date:'2026-03-22',type:'青年团契',leader:'',worship:'意语',band:'',prayer:'',reading:''},
      {date:'2026-03-29',type:'主日下午',leader:'王皞阳',worship:'吴恬恬',band:'谢安/金Silvia',prayer:'戴献和',reading:'诗13 林颖慧'},
      {date:'2026-03-29',type:'主日晚上',leader:'翁撒该',worship:'金梦熙',band:'胡娜',prayer:'林文宝',reading:''},
      {date:'2026-03-29',type:'青年团契',leader:'',worship:'潘庆峰',band:'',prayer:'',reading:''},
      {date:'2026-04-05',type:'主日下午',leader:'金展',worship:'胡娜',band:'杨亦佳',prayer:'吴恬恬',reading:'诗14 陈福妙'},
      {date:'2026-04-05',type:'主日晚上',leader:'林文宝',worship:'翁撒该/杨雪克',band:'金紫涵/黄天丽',prayer:'戴献和',reading:''},
      {date:'2026-04-12',type:'主日下午',leader:'林文宝',worship:'吴超凡',band:'青少年',prayer:'吴超凡',reading:'诗15 陈恩露'},
      {date:'2026-04-12',type:'主日晚上',leader:'吴超凡',worship:'吴超凡及青少年',band:'青少年',prayer:'林文宝',reading:''},
      {date:'2026-04-12',type:'青年团契',leader:'',worship:'吴超凡',band:'',prayer:'',reading:''},
    ];
  }

})();
