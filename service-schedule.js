/**
 * service-schedule.js  v10.0
 * CECP 服事安排 — 月份+周次版 · 深浅色 · 全部/筛选
 */
(function () {
  'use strict';

  var EL = document.getElementById('cecp-schedule');
  if (!EL) return;
  var API = EL.dataset.api || '';

  /* ── 岗位列 ─────────────────────────────────────────────────────────────── */
  var COLS = [
    { key:'leader',  label:'主领 / 司仪', type:'badges'  },
    { key:'worship', label:'敬拜带领',    type:'badges'  },
    { key:'band',    label:'乐手 / 司琴', type:'badges'  },
    { key:'prayer',  label:'祷告带领',    type:'badges'  },
    { key:'reading', label:'读　　经',    type:'reading' },
    { key:'note',    label:'证道讲员',    type:'note'    }
  ];

  /* ── 类型配色 ───────────────────────────────────────────────────────────── */
  var TYPE_COLOR = {
    '主日下午': { bar:'#3a78d4', tag_bg:'#1a3a78', tag_txt:'#7ab8f0' },
    '主日晚上': { bar:'#8a48d8', tag_bg:'#3a1a78', tag_txt:'#b888f0' },
    '青年团契': { bar:'#38c878', tag_bg:'#1a5830', tag_txt:'#5ee898' }
  };
  var TYPE_DEF = { bar:'#555', tag_bg:'#2a2a2a', tag_txt:'#aaa' };

  /* ── Badge 颜色（深色模式） ─────────────────────────────────────────────── */
  var PAL_D = [
    ['#0c2848','#6ab4ec'],['#0c3420','#58c880'],['#2c1050','#a870e0'],
    ['#400c20','#d86888'],['#082830','#50b8c8'],['#2c1c04','#c89838'],
    ['#0c2040','#6080cc'],['#200c40','#9068cc'],['#0c2420','#60b888'],
    ['#321408','#c07860'],['#082430','#50a8bc'],['#1c0e40','#7870cc'],
    ['#300c10','#c06868'],['#0c300c','#68c068'],['#0c0c30','#6868c0'],
    ['#0e3028','#58b0a0'],['#301c04','#b09058'],['#141238','#7878b8']
  ];
  /* ── Badge 颜色（浅色模式） ─────────────────────────────────────────────── */
  var PAL_L = [
    ['#1a5890','#ddeef8'],['#1a5e38','#d8f0e4'],['#5a2890','#ede0f8'],
    ['#882040','#f8dde6'],['#1a5868','#d8eef0'],['#785010','#f8f0d8'],
    ['#1a3878','#dde4f8'],['#502080','#e8d8f8'],['#1a5848','#d8eee8'],
    ['#784830','#f8e8de'],['#1a4860','#d8e8f0'],['#402878','#e4ddf8'],
    ['#783040','#f8dede'],['#207830','#ddf8de'],['#282078','#deddf8'],
    ['#185858','#d8f0ec'],['#604828','#f0e8d8'],['#303078','#e0def8']
  ];

  /* ── 主题 ───────────────────────────────────────────────────────────────── */
  var isDark = true;
  try {
    var s = localStorage.getItem('cecp-theme');
    if (s) isDark = s === 'dark';
    else isDark = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  } catch(e) {}

  function badgeColor(name) {
    if (!name) return null;
    var h = 0;
    for (var i = 0; i < name.length; i++) h = (Math.imul(31, h) + name.charCodeAt(i)) | 0;
    var p = isDark ? PAL_D : PAL_L;
    return p[Math.abs(h) % p.length];
  }

  /* ── CSS ────────────────────────────────────────────────────────────────── */
  if (!document.getElementById('_cs10')) {
    var el = document.createElement('style');
    el.id = '_cs10';
    el.textContent = `
#cecp-schedule {
  font-family: "PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif;
  border-radius: 16px; overflow: hidden;
  box-sizing: border-box; width: 100%;
}
#cecp-schedule * { box-sizing: border-box; margin: 0; padding: 0; }

#cecp-schedule.s10d {
  background:#0e0e0e; color:#d8d8d8;
  --bg:#0e0e0e; --bg2:#161616; --bg3:#1e1e1e;
  --line:#222; --line2:#2c2c2c;
  --txt:#d8d8d8; --txt2:#5a5a5a; --txt3:#2c2c2c;
  --lbl:#505050;
  --bar-bg:#111; --tab-bg:#1a1a1a; --tab-on:#252525;
  --rd:#3a6a3a; --note:#7a6838;
}
#cecp-schedule.s10l {
  background:#fff; color:#1a1a1a;
  --bg:#fff; --bg2:#f7f7f7; --bg3:#efefef;
  --line:#e8e8e8; --line2:#d0d0d0;
  --txt:#1a1a1a; --txt2:#aaa; --txt3:#ccc;
  --lbl:#999;
  --bar-bg:#f5f5f5; --tab-bg:#ebebeb; --tab-on:#fff;
  --rd:#2a6a3a; --note:#7a6030;
}

.s10-bar {
  display:flex; align-items:center; gap:8px;
  padding:14px 20px 12px; background:var(--bar-bg);
  border-bottom:1px solid var(--line); flex-wrap:wrap;
}
.s10-nav {
  display:flex; align-items:center; gap:4px;
  background:var(--tab-bg); border-radius:10px; padding:3px;
}
.s10-nav-btn {
  padding:7px 16px; font-size:14px; font-weight:500;
  color:var(--txt2); cursor:pointer; border-radius:8px;
  border:none; background:none; font-family:inherit;
  white-space:nowrap; transition:all .15s;
}
.s10-nav-btn.on { background:var(--tab-on); color:var(--txt); }
.s10-nav-btn:hover:not(.on) { color:var(--txt); }

.s10-right { margin-left:auto; display:flex; gap:8px; align-items:center; }

.s10-theme {
  width:36px; height:36px; border-radius:50%;
  border:1px solid var(--line2); background:var(--bg2);
  cursor:pointer; display:flex; align-items:center;
  justify-content:center; font-size:16px;
  transition:transform .2s, background .15s;
}
.s10-theme:hover { background:var(--bg3); transform:scale(1.1) rotate(20deg); }

.s10-dl {
  display:flex; align-items:center; gap:5px;
  padding:7px 14px; font-size:13px; color:var(--txt2);
  border:1px solid var(--line2); border-radius:9px;
  background:none; cursor:pointer; font-family:inherit; transition:all .15s;
}
.s10-dl:hover { color:var(--txt); border-color:var(--lbl); background:var(--bg2); }
.s10-dl:disabled { opacity:.35; cursor:not-allowed; }

.s10-filters {
  display:flex; align-items:center; gap:6px;
  padding:9px 20px; border-bottom:1px solid var(--line);
  background:var(--bar-bg); flex-wrap:wrap;
}
.s10-filter {
  padding:5px 16px; font-size:13px; border-radius:20px;
  cursor:pointer; border:1px solid var(--line2);
  background:none; font-family:inherit; color:var(--lbl);
  transition:all .15s; font-weight:500;
}
.s10-filter.on { color:#fff; border-color:transparent; }
.s10-filter.all.on { background:#444; }
.s10-filter:hover:not(.on) { color:var(--txt); border-color:var(--lbl); }

.s10-wrap { width:100%; overflow-x:hidden; }
.s10-table {
  border-collapse:collapse; width:100%; table-layout:fixed;
}
.s10-table th, .s10-table td {
  border-bottom:1px solid var(--line);
  border-right:1px solid var(--line);
  vertical-align:middle;
}
.s10-table tr th:last-child,
.s10-table tr td:last-child { border-right:none; }

.s10-col-hdr {
  background:var(--bar-bg);
  padding:13px 16px;
  font-size:13px; font-weight:700; color:var(--lbl);
  text-align:center; letter-spacing:.04em;
  white-space:nowrap;
  position:sticky; top:0; z-index:2;
  border-bottom:2px solid var(--line2) !important;
}
.s10-corner {
  background:var(--bar-bg); padding:13px 16px;
  font-size:12px; color:var(--txt3); text-align:center;
  position:sticky; top:0; z-index:3;
  border-bottom:2px solid var(--line2) !important;
  border-right:2px solid var(--line2) !important;
}

.s10-row-info {
  padding:14px 16px; vertical-align:middle;
  text-align:left;
  border-right:2px solid var(--line2) !important;
  border-left:4px solid transparent;
  min-width:120px; width:120px;
  background:var(--bg);
}
.s10-date {
  font-size:26px; font-weight:900; line-height:1;
  letter-spacing:-.02em; display:block; color:var(--txt);
}
.s10-week {
  font-size:14px; font-weight:700; color:var(--txt2); margin-top:4px; display:block;
}
.s10-type-tag {
  display:inline-block; margin-top:7px;
  padding:4px 11px; border-radius:14px;
  font-size:12px; font-weight:700;
  letter-spacing:.04em;
}

.s10-cell {
  padding:12px 14px; text-align:center;
  background:var(--bg); transition:background .1s;
}
.s10-cell:hover { background:var(--bg2); }

.s10-rd-ref { display:block; font-size:11px; color:var(--rd); margin-bottom:3px; font-weight:700; letter-spacing:.04em; }
.s10-note-pfx { display:block; font-size:11px; color:var(--note); margin-bottom:3px; font-weight:700; }
.s10-plain { display:inline-block; font-size:13px; color:var(--txt2); line-height:1.5; white-space:pre-wrap; }

.s10-badge {
  display:inline-block; padding:5px 12px;
  border-radius:20px; font-size:13px; font-weight:700;
  line-height:1.4; margin:2px; white-space:nowrap;
  cursor:pointer; letter-spacing:.02em;
  transition:opacity .12s, transform .1s, box-shadow .12s;
  user-select:none; position:relative;
}
.s10-badge.lit    { transform:scale(1.1);  box-shadow:0 0 0 2px rgba(255,255,255,.3);  z-index:1; }
.s10-badge.dim    { opacity:.15; }
.s10-badge.locked { transform:scale(1.13); box-shadow:0 0 0 2.5px rgba(255,255,255,.55); z-index:1; }
.s10-badge.ldim   { opacity:.1; }
.s10l .s10-badge.lit    { box-shadow:0 0 0 2px rgba(0,0,0,.2); }
.s10l .s10-badge.locked { box-shadow:0 0 0 2.5px rgba(0,0,0,.4); }

.s10-group-sep td {
  padding:4px 16px;
  font-size:11px; font-weight:700; letter-spacing:.1em;
  color:var(--txt3); text-transform:uppercase;
  border-bottom:2px solid var(--line2) !important;
  border-right:none !important;
  background:var(--bar-bg);
}

.s10-empty { color:var(--txt3); font-size:16px; }

.s10-loading { display:flex; align-items:center; gap:12px; padding:60px 24px; color:var(--txt2); font-size:16px; }
.s10-spinner { width:22px; height:22px; border:2px solid var(--line2); border-top-color:var(--lbl); border-radius:50%; animation:s10spin .7s linear infinite; flex-shrink:0; }
@keyframes s10spin { to{transform:rotate(360deg)} }
.s10-nodata { padding:60px; text-align:center; color:var(--txt3); font-size:16px; }
.s10-err { padding:24px; color:#a04040; font-size:14px; line-height:1.8; }

@media(max-width:600px){
  .s10-row-info { min-width:100px; width:100px; padding:10px 12px; }
  .s10-date { font-size:16px; }
  .s10-badge { font-size:12px; padding:4px 9px; }
  .s10-cell { padding:9px 9px; }
  .s10-col-hdr { padding:10px 10px; font-size:12px; }
  .s10-nav-btn { padding:5px 11px; font-size:13px; }
}
`;
    document.head.appendChild(el);
  }

  function applyTheme() {
    EL.classList.toggle('s10d', isDark);
    EL.classList.toggle('s10l', !isDark);
  }
  applyTheme();

  EL.innerHTML = '<div class="s10-loading"><div class="s10-spinner"></div>加载服事安排…</div>';

  if (!API || API === 'DEMO') { setTimeout(function(){ boot(demo()); }, 200); return; }

  fetch(API + '?action=all')
    .then(function(r){ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function(res){ if(!res.ok) throw new Error(res.error || '脚本错误'); boot(res.data); })
    .catch(function(e){
      EL.innerHTML = '<div class="s10-err">⚠ ' + esc(e.message)
        + '<br><small style="opacity:.5">请确认 Apps Script 已部署最新版本</small></div>';
    });

  var locked = null;

  function boot(rows) {
    if(!rows || !rows.length){
      EL.innerHTML = '<div class="s10-nodata">暂无服事安排</div>';
      return;
    }

    rows = rows
      .filter(function(r){ return r && r.month && r.week; })
      .map(normalizeRow);

    if(!rows.length){
      EL.innerHTML = '<div class="s10-nodata">暂无服事安排</div>';
      return;
    }

    var months = {};
    rows.forEach(function(r){
      if(!months[r.month]) months[r.month] = [];
      months[r.month].push(r);
    });

    var keys = Object.keys(months).sort(function(a,b){
      return monthNum(a) - monthNum(b);
    });
    if(!keys.length) return;

    var curIdx = 0;
    var nowMonth = (new Date().getMonth() + 1) + '月';
    var idx = keys.indexOf(nowMonth);
    if (idx >= 0) curIdx = idx;

    var allTypes = [];
    rows.forEach(function(r){
      if(r.type && allTypes.indexOf(r.type) < 0) allTypes.push(r.type);
    });
    var tOrd = {'主日下午':0,'主日晚上':1,'青年团契':2};
    allTypes.sort(function(a,b){ return (tOrd[a]||9) - (tOrd[b]||9); });

    var activeFilter = '全部';

    render(curIdx);

    function render(i) {
      locked = null;
      var key = keys[i];

      var navHtml = '';
      if(i > 0) navHtml += '<button class="s10-nav-btn" id="csPrev">← ' + esc(keys[i-1]) + '</button>';
      navHtml += '<button class="s10-nav-btn on">' + esc(key) + '</button>';
      if(i < keys.length - 1) navHtml += '<button class="s10-nav-btn" id="csNext">' + esc(keys[i+1]) + ' →</button>';

      var fHtml = '<button class="s10-filter all' + (activeFilter==='全部'?' on':'') + '" data-f="全部">全部</button>';
      allTypes.forEach(function(tp){
        var tc = getTc(tp);
        var on = (activeFilter === tp);
        fHtml += '<button class="s10-filter' + (on?' on':'') + '" data-f="' + esc(tp) + '"'
          + (on ? ' style="background:' + tc.tag_bg + ';color:' + tc.tag_txt + '"' : '')
          + '>' + esc(tp) + '</button>';
      });

      var svcs = months[key].filter(function(s){
        return activeFilter === '全部' || s.type === activeFilter;
      });

      svcs.sort(function(a,b){
        var aw = weekNum(a.week), bw = weekNum(b.week);
        if (aw !== bw) return aw - bw;
        return (tOrd[a.type]||9) - (tOrd[b.type]||9);
      });

      var colHdr = '<th class="s10-corner">聚会</th>'
        + COLS.map(function(c){ return '<th class="s10-col-hdr">' + c.label + '</th>'; }).join('');

      var cg = '<colgroup><col style="width:140px">' + COLS.map(function(){ return '<col>'; }).join('') + '</colgroup>';

      var tbody = '';
      var prevWeek = '';
      svcs.forEach(function(s, idx){
        var tc = getTc(s.type);
        var isNewWeek = (s.week !== prevWeek);
        prevWeek = s.week;

        if(isNewWeek && idx > 0){
          tbody += '<tr class="s10-group-sep"><td colspan="' + (COLS.length+1) + '"></td></tr>';
        }

        var infoCell = '<td class="s10-row-info" style="border-left-color:' + tc.bar + ';">'
          + '<span class="s10-date">' + esc(s.month) + '</span>'
          + '<span class="s10-week">' + esc(s.week) + '</span>'
          + '<span class="s10-type-tag" style="background:' + tc.tag_bg + ';color:' + tc.tag_txt + '">' + esc(s.type) + '</span>'
          + '</td>';

        var dataCells = COLS.map(function(col){
          return renderTd(col, s[col.key] || '');
        }).join('');

        tbody += '<tr>' + infoCell + dataCells + '</tr>';
      });

      if(!svcs.length){
        tbody = '<tr><td colspan="' + (COLS.length+1) + '" style="padding:48px;text-align:center;color:var(--txt3);font-size:15px">暂无数据</td></tr>';
      }

      EL.innerHTML =
        '<div class="s10-bar">'
          + '<div class="s10-nav">' + navHtml + '</div>'
          + '<div class="s10-right">'
            + '<button class="s10-theme" id="csTheme">' + (isDark?'☀️':'🌙') + '</button>'
            + '<button class="s10-dl" id="csExp">' + svgDL() + '导出图片</button>'
          + '</div>'
        + '</div>'
        + '<div class="s10-filters" id="csFilters">' + fHtml + '</div>'
        + '<div class="s10-wrap">'
          + '<table class="s10-table" id="csTable">' + cg
            + '<thead><tr>' + colHdr + '</tr></thead>'
            + '<tbody>' + tbody + '</tbody>'
          + '</table>'
        + '</div>';

      var prev = EL.querySelector('#csPrev');
      var next = EL.querySelector('#csNext');
      var exp  = EL.querySelector('#csExp');
      var thBtn= EL.querySelector('#csTheme');
      var fbox = EL.querySelector('#csFilters');

      if(prev)  prev.addEventListener('click', function(){ render(i-1); });
      if(next)  next.addEventListener('click', function(){ render(i+1); });
      if(exp)   exp.addEventListener('click', function(){ exportPng(key); });
      if(thBtn) thBtn.addEventListener('click', function(){
        isDark = !isDark;
        try { localStorage.setItem('cecp-theme', isDark ? 'dark' : 'light'); } catch(e){}
        applyTheme();
        render(i);
      });
      if(fbox) fbox.querySelectorAll('.s10-filter').forEach(function(b){
        b.addEventListener('click', function(){
          activeFilter = this.dataset.f;
          render(i);
        });
      });

      bindHL();
    }
  }

  function normalizeRow(r){
    return {
      month: normalizeMonth(r.month || ''),
      week: normalizeWeek(r.week || ''),
      type: r.type || '',
      leader: r.leader || '',
      worship: r.worship || '',
      band: r.band || '',
      prayer: r.prayer || '',
      reading: r.reading || '',
      note: r.note || ''
    };
  }

  function renderTd(col, val) {
    if(col.type === 'reading'){
      var rd = parseReading(val);
      if(!rd || !rd.name) return '<td class="s10-cell"><span class="s10-empty">—</span></td>';
      return '<td class="s10-cell">'
        + '<span class="s10-rd-ref">' + esc(rd.ref) + '</span>'
        + mkBadge(rd.name) + '</td>';
    }

    if(col.type === 'note'){
      if(!val) return '<td class="s10-cell"><span class="s10-empty">—</span></td>';
      var m = val.match(/^(证道[：:]\s*)(.+)$/);
      if(m) return '<td class="s10-cell"><span class="s10-note-pfx">' + esc(m[1]) + '</span>' + mkBadge(m[2]) + '</td>';
      return '<td class="s10-cell">' + mkBadge(val) + '</td>';
    }

    if(!val) return '<td class="s10-cell"><span class="s10-empty">—</span></td>';

    if(col.key === 'prayer' && /见圣工表|圣工表|待定|安排中|未定/.test(val)){
      return '<td class="s10-cell"><span class="s10-plain">' + esc(val) + '</span></td>';
    }

    var ns = val.split(/[\/\n]/).map(function(n){ return n.trim(); }).filter(Boolean);
    return '<td class="s10-cell">' + ns.map(mkBadge).join('') + '</td>';
  }

  function mkBadge(name){
    if(!name) return '';
    var c = badgeColor(name);
    if(!c) return '<span class="s10-badge" style="background:var(--bg2);color:var(--lbl)">' + esc(name) + '</span>';
    return '<span class="s10-badge" data-n="' + esc(name) + '" style="background:' + c[0] + ';color:' + c[1] + '">' + esc(name) + '</span>';
  }

  function all$() { return EL.querySelectorAll('.s10-badge'); }
  function applyHL(name, lock){
    all$().forEach(function(b){
      var n = b.dataset.n || b.textContent;
      b.classList.remove('lit','dim','locked','ldim');
      if(n === name) b.classList.add(lock?'locked':'lit');
      else b.classList.add(lock?'ldim':'dim');
    });
  }
  function clearHL(){ all$().forEach(function(b){ b.classList.remove('lit','dim','locked','ldim'); }); }
  function bindHL(){
    all$().forEach(function(b){
      var name = b.dataset.n || b.textContent;
      b.addEventListener('mouseenter', function(){ if(!locked) applyHL(name,false); });
      b.addEventListener('mouseleave', function(){ if(!locked) clearHL(); });
      b.addEventListener('click', function(e){
        e.stopPropagation();
        if(locked === name){ locked = null; clearHL(); }
        else{ locked = name; applyHL(name,true); }
      });
    });
    EL.addEventListener('click', function(){ if(locked){ locked = null; clearHL(); } });
  }

  function exportPng(key){
    var btn = EL.querySelector('#csExp');
    var tbl = EL.querySelector('#csTable');
    if(!btn || !tbl) return;
    btn.disabled = true; btn.textContent = '处理中…';
    function run(){
      window.html2canvas(tbl,{backgroundColor:isDark?'#0e0e0e':'#fff',scale:2,useCORS:true,logging:false})
        .then(function(c){
          var a = document.createElement('a');
          a.download = '服事安排_' + key + '.png';
          a.href = c.toDataURL('image/png');
          a.click();
          btn.innerHTML = svgDL() + '导出图片'; btn.disabled = false;
        })
        .catch(function(){ btn.textContent = '导出失败'; btn.disabled = false; });
    }
    if(!window.html2canvas){
      var sc = document.createElement('script');
      sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      sc.onload = run; document.head.appendChild(sc);
    } else { run(); }
  }

  function getTc(t){ return TYPE_COLOR[t] || TYPE_DEF; }
  function parseReading(v){
    if(!v) return null;
    var m = v.match(/^(诗\d+)\s+(.+)$/);
    return m ? {ref:m[1], name:m[2].trim()} : {ref:v, name:''};
  }
  function normalizeMonth(s){
    s = String(s || '').trim();
    if(!s) return '';
    var m = s.match(/(\d{1,2})/);
    return m ? (parseInt(m[1],10) + '月') : s;
  }
  function normalizeWeek(s){
    s = String(s || '').replace(/\s/g,'').trim();
    var map = { '1':'第一周','2':'第二周','3':'第三周','4':'第四周','5':'第五周' };
    return map[s] || s;
  }
  function monthNum(s){
    var m = String(s).match(/(\d{1,2})/);
    return m ? parseInt(m[1],10) : 99;
  }
  function weekNum(s){
    var map = { '第一周':1,'第二周':2,'第三周':3,'第四周':4,'第五周':5 };
    return map[String(s)] || 99;
  }
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function svgDL(){
    return '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M7 1v8M4 6l3 3 3-3M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1"/></svg>';
  }

  function demo(){
    return [
      {month:'3月',week:'第一周',type:'主日下午',leader:'胡娜',worship:'翁撒该',band:'林文宝',prayer:'戴献和',reading:'诗9 金Silvia',note:'证道：金美德'},
      {month:'3月',week:'第一周',type:'主日晚上',leader:'',worship:'翁撒该/叶春叶',band:'金紫涵/黄天丽',prayer:'林文宝/董希昆',reading:'',note:'证道：戴忠献'},
      {month:'3月',week:'第一周',type:'青年团契',leader:'',worship:'',band:'',prayer:'',reading:'',note:'活动游戏'},
      {month:'3月',week:'第二周',type:'主日下午',leader:'吴超凡',worship:'青少年',band:'翁撒该',prayer:'→ 见圣工表',reading:'诗10 季轩',note:'证道：吴恬恬'},
      {month:'3月',week:'第二周',type:'主日晚上',leader:'',worship:'吴超凡及青少年',band:'青少年',prayer:'林文宝/董希昆',reading:'',note:'证道：彭永剑'},
      {month:'3月',week:'第二周',type:'青年团契',leader:'',worship:'',band:'',prayer:'',reading:'',note:'吴超凡'}
    ];
  }

})();
