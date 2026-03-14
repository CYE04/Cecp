/**
 * service-schedule.js  v9.0
 * CECP 服事安排 — 简洁大字 · 深浅色 · 全部/筛选
 * https://cye04.github.io/Cecp/service-schedule.js
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
    { key:'note',    label:'证道讲员',    type:'note'    },
  ];

  /* ── 类型配色（只用左边框 + 标签背景，不用整行背景色）── */
  var TYPE_COLOR = {
    '主日下午': { bar:'#3a78d4', tag_bg:'#1a3a78', tag_txt:'#7ab8f0' },
    '主日晚上': { bar:'#8a48d8', tag_bg:'#3a1a78', tag_txt:'#b888f0' },
    '青年团契': { bar:'#38c878', tag_bg:'#1a5830', tag_txt:'#5ee898' },
  };
  var TYPE_DEF = { bar:'#555', tag_bg:'#2a2a2a', tag_txt:'#aaa' };

  /* ── Badge 颜色（深色模式） ──────────────────────────────────────────────── */
  var PAL_D = [
    ['#0c2848','#6ab4ec'],['#0c3420','#58c880'],['#2c1050','#a870e0'],
    ['#400c20','#d86888'],['#082830','#50b8c8'],['#2c1c04','#c89838'],
    ['#0c2040','#6080cc'],['#200c40','#9068cc'],['#0c2420','#60b888'],
    ['#321408','#c07860'],['#082430','#50a8bc'],['#1c0e40','#7870cc'],
    ['#300c10','#c06868'],['#0c300c','#68c068'],['#0c0c30','#6868c0'],
    ['#0e3028','#58b0a0'],['#301c04','#b09058'],['#141238','#7878b8'],
  ];
  /* ── Badge 颜色（浅色模式） ──────────────────────────────────────────────── */
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
    var p = isDark ? PAL_D : PAL_L;
    return p[Math.abs(h) % p.length];
  }

  /* ── 主题 ────────────────────────────────────────────────────────────────── */
  var isDark = true;
  try {
    var s = localStorage.getItem('cecp-theme');
    if (s) isDark = s === 'dark';
    else isDark = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  } catch(e) {}

  /* ── CSS ─────────────────────────────────────────────────────────────────── */
  if (!document.getElementById('_cs9')) {
    var el = document.createElement('style');
    el.id = '_cs9';
    el.textContent = `
#cecp-schedule {
  font-family: "PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif;
  border-radius: 16px; overflow: hidden;
  box-sizing: border-box; width: 100%;
}
#cecp-schedule * { box-sizing: border-box; margin: 0; padding: 0; }

/* ── 深色 ── */
#cecp-schedule.s9d {
  background:#0e0e0e; color:#d8d8d8;
  --bg:#0e0e0e; --bg2:#161616; --bg3:#1e1e1e;
  --line:#222; --line2:#2c2c2c;
  --txt:#d8d8d8; --txt2:#5a5a5a; --txt3:#2c2c2c;
  --lbl:#505050;
  --bar-bg:#111; --tab-bg:#1a1a1a; --tab-on:#252525;
  --rd:#3a6a3a; --note:#7a6838;
}
/* ── 浅色 ── */
#cecp-schedule.s9l {
  background:#fff; color:#1a1a1a;
  --bg:#fff; --bg2:#f7f7f7; --bg3:#efefef;
  --line:#e8e8e8; --line2:#d0d0d0;
  --txt:#1a1a1a; --txt2:#aaa; --txt3:#ccc;
  --lbl:#999;
  --bar-bg:#f5f5f5; --tab-bg:#ebebeb; --tab-on:#fff;
  --rd:#2a6a3a; --note:#7a6030;
}

/* ── 顶栏 ── */
.s9-bar {
  display:flex; align-items:center; gap:8px;
  padding:14px 20px 12px; background:var(--bar-bg);
  border-bottom:1px solid var(--line); flex-wrap:wrap;
}
.s9-nav {
  display:flex; align-items:center; gap:4px;
  background:var(--tab-bg); border-radius:10px; padding:3px;
}
.s9-nav-btn {
  padding:7px 16px; font-size:14px; font-weight:500;
  color:var(--txt2); cursor:pointer; border-radius:8px;
  border:none; background:none; font-family:inherit;
  white-space:nowrap; transition:all .15s;
}
.s9-nav-btn.on { background:var(--tab-on); color:var(--txt); }
.s9-nav-btn:hover:not(.on) { color:var(--txt); }

.s9-right { margin-left:auto; display:flex; gap:8px; align-items:center; }

.s9-theme {
  width:36px; height:36px; border-radius:50%;
  border:1px solid var(--line2); background:var(--bg2);
  cursor:pointer; display:flex; align-items:center;
  justify-content:center; font-size:16px;
  transition:transform .2s, background .15s;
}
.s9-theme:hover { background:var(--bg3); transform:scale(1.1) rotate(20deg); }

.s9-dl {
  display:flex; align-items:center; gap:5px;
  padding:7px 14px; font-size:13px; color:var(--txt2);
  border:1px solid var(--line2); border-radius:9px;
  background:none; cursor:pointer; font-family:inherit; transition:all .15s;
}
.s9-dl:hover { color:var(--txt); border-color:var(--lbl); background:var(--bg2); }
.s9-dl:disabled { opacity:.35; cursor:not-allowed; }

/* ── 筛选栏 ── */
.s9-filters {
  display:flex; align-items:center; gap:6px;
  padding:9px 20px; border-bottom:1px solid var(--line);
  background:var(--bar-bg); flex-wrap:wrap;
}
.s9-filter {
  padding:5px 16px; font-size:13px; border-radius:20px;
  cursor:pointer; border:1px solid var(--line2);
  background:none; font-family:inherit; color:var(--lbl);
  transition:all .15s; font-weight:500;
}
.s9-filter.on { color:#fff; border-color:transparent; }
.s9-filter.all.on { background:#444; }
.s9-filter:hover:not(.on) { color:var(--txt); border-color:var(--lbl); }

/* ── 表格 ── */
.s9-wrap { width:100%; overflow-x:hidden; }
.s9-table {
  border-collapse:collapse; width:100%; table-layout:fixed;
}
.s9-table th, .s9-table td {
  border-bottom:1px solid var(--line);
  border-right:1px solid var(--line);
  vertical-align:middle;
}
.s9-table tr th:last-child,
.s9-table tr td:last-child { border-right:none; }

/* 列标题 */
.s9-col-hdr {
  background:var(--bar-bg);
  padding:13px 16px;
  font-size:13px; font-weight:700; color:var(--lbl);
  text-align:center; letter-spacing:.04em;
  white-space:nowrap;
  position:sticky; top:0; z-index:2;
  border-bottom:2px solid var(--line2) !important;
}
.s9-corner {
  background:var(--bar-bg); padding:13px 16px;
  font-size:12px; color:var(--txt3); text-align:center;
  position:sticky; top:0; z-index:3;
  border-bottom:2px solid var(--line2) !important;
  border-right:2px solid var(--line2) !important;
}

/* 日期行信息格 */
.s9-row-info {
  padding:14px 16px; vertical-align:middle;
  text-align:left;
  border-right:2px solid var(--line2) !important;
  border-left:4px solid transparent; /* 左侧彩色条 */
  min-width:140px; width:140px;
  background:var(--bg);
}
.s9-date {
  font-size:20px; font-weight:800; line-height:1;
  letter-spacing:-.01em; display:block; color:var(--txt);
}
.s9-week {
  font-size:11px; color:var(--txt2); margin-top:2px; display:block;
}
.s9-type-tag {
  display:inline-block; margin-top:7px;
  padding:4px 11px; border-radius:14px;
  font-size:12px; font-weight:700;
  letter-spacing:.04em;
}

/* 内容格 */
.s9-cell {
  padding:12px 14px; text-align:center;
  background:var(--bg); transition:background .1s;
}
.s9-cell:hover { background:var(--bg2); }

/* 读经 */
.s9-rd-ref { display:block; font-size:11px; color:var(--rd); margin-bottom:3px; font-weight:700; letter-spacing:.04em; }
/* 证道前缀 */
.s9-note-pfx { display:block; font-size:11px; color:var(--note); margin-bottom:3px; font-weight:700; }

/* Badge */
.s9-badge {
  display:inline-block; padding:5px 12px;
  border-radius:20px; font-size:13px; font-weight:700;
  line-height:1.4; margin:2px; white-space:nowrap;
  cursor:pointer; letter-spacing:.02em;
  transition:opacity .12s, transform .1s, box-shadow .12s;
  user-select:none; position:relative;
}
.s9-badge.lit    { transform:scale(1.1);  box-shadow:0 0 0 2px rgba(255,255,255,.3);  z-index:1; }
.s9-badge.dim    { opacity:.15; }
.s9-badge.locked { transform:scale(1.13); box-shadow:0 0 0 2.5px rgba(255,255,255,.55); z-index:1; }
.s9-badge.ldim   { opacity:.1; }
.s9l .s9-badge.lit    { box-shadow:0 0 0 2px rgba(0,0,0,.2); }
.s9l .s9-badge.locked { box-shadow:0 0 0 2.5px rgba(0,0,0,.4); }

/* 分组分隔线 */
.s9-group-sep td {
  padding:4px 16px;
  font-size:11px; font-weight:700; letter-spacing:.1em;
  color:var(--txt3); text-transform:uppercase;
  border-bottom:2px solid var(--line2) !important;
  border-right:none !important;
  background:var(--bar-bg);
}

/* 空值 */
.s9-empty { color:var(--txt3); font-size:16px; }

/* 加载 */
.s9-loading { display:flex; align-items:center; gap:12px; padding:60px 24px; color:var(--txt2); font-size:16px; }
.s9-spinner { width:22px; height:22px; border:2px solid var(--line2); border-top-color:var(--lbl); border-radius:50%; animation:s9spin .7s linear infinite; flex-shrink:0; }
@keyframes s9spin { to{transform:rotate(360deg)} }
.s9-nodata { padding:60px; text-align:center; color:var(--txt3); font-size:16px; }
.s9-err { padding:24px; color:#a04040; font-size:14px; line-height:1.8; }

@media(max-width:600px){
  .s9-row-info { min-width:100px; width:100px; padding:10px 12px; }
  .s9-date { font-size:16px; }
  .s9-badge { font-size:12px; padding:4px 9px; }
  .s9-cell { padding:9px 9px; }
  .s9-col-hdr { padding:10px 10px; font-size:12px; }
  .s9-nav-btn { padding:5px 11px; font-size:13px; }
}
`;
    document.head.appendChild(el);
  }

  function applyTheme() {
    EL.classList.toggle('s9d', isDark);
    EL.classList.toggle('s9l', !isDark);
  }
  applyTheme();

  EL.innerHTML = '<div class="s9-loading"><div class="s9-spinner"></div>加载服事安排…</div>';

  if (!API || API === 'DEMO') { setTimeout(function(){ boot(demo()); }, 200); return; }

  fetch(API + '?action=all')
    .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
    .then(function(res){ if(!res.ok) throw new Error(res.error||'脚本错误'); boot(res.data); })
    .catch(function(e){
      EL.innerHTML = '<div class="s9-err">⚠ '+esc(e.message)
        +'<br><small style="opacity:.5">请确认 Apps Script 已部署最新版本</small></div>';
    });

  /* ── 高亮 ─────────────────────────────────────────────────────────────────── */
  var locked = null;

  /* ── 初始化 ───────────────────────────────────────────────────────────────── */
  function boot(rows) {
    if(!rows||!rows.length){ EL.innerHTML='<div class="s9-nodata">暂无服事安排</div>'; return; }

    // 按月分组
    var months={};
    rows.forEach(function(r){
      var mk=r.date?r.date.slice(0,7):'';
      if(!mk) return;
      if(!months[mk]) months[mk]=[];
      months[mk].push(r);
    });
    var keys=Object.keys(months).sort();
    if(!keys.length) return;

    // 当前月
    var now=new Date();
    var nowKey=now.getFullYear()+'-'+pad(now.getMonth()+1);
    var curIdx=keys.indexOf(nowKey);
    if(curIdx<0){ for(var i=0;i<keys.length;i++){if(keys[i]>=nowKey){curIdx=i;break;}} }
    if(curIdx<0) curIdx=keys.length-1;

    // 类型列表
    var allTypes=[];
    rows.forEach(function(r){ if(r.type&&allTypes.indexOf(r.type)<0) allTypes.push(r.type); });
    var tOrd={'主日下午':0,'主日晚上':1,'青年团契':2};
    allTypes.sort(function(a,b){ return (tOrd[a]||9)-(tOrd[b]||9); });

    // 当前筛选（'全部' 或某个类型）
    var activeFilter = '全部';

    render(curIdx);

    function render(i) {
      locked = null;
      var key = keys[i];

      // 月份导航
      var navHtml='';
      if(i>0) navHtml+='<button class="s9-nav-btn" id="csPrev">← '+mlabel(keys[i-1])+'</button>';
      navHtml+='<button class="s9-nav-btn on">'+mlabel(key)+'</button>';
      if(i<keys.length-1) navHtml+='<button class="s9-nav-btn" id="csNext">'+mlabel(keys[i+1])+' →</button>';

      // 筛选按钮
      var fHtml = '<button class="s9-filter all'+(activeFilter==='全部'?' on':'')+'" data-f="全部">全部</button>';
      allTypes.forEach(function(tp){
        var tc=getTc(tp);
        var on=(activeFilter===tp);
        fHtml+='<button class="s9-filter'+(on?' on':'')+'" data-f="'+esc(tp)+'"'
          +(on?' style="background:'+tc.tag_bg+';color:'+tc.tag_txt+'"':'')+'>'+esc(tp)+'</button>';
      });

      // 过滤服务列表
      var svcs=months[key].filter(function(s){
        return activeFilter==='全部' || s.type===activeFilter;
      });
      var tOrd2={'主日下午':0,'主日晚上':1,'青年团契':2};
      svcs.sort(function(a,b){
        if(a.date<b.date) return -1; if(a.date>b.date) return 1;
        return (tOrd2[a.type]||9)-(tOrd2[b.type]||9);
      });

      // 列标题
      var colHdr='<th class="s9-corner">聚会</th>'
        +COLS.map(function(c){ return '<th class="s9-col-hdr">'+c.label+'</th>'; }).join('');

      // colgroup：日期列 140px，其余均分
      var cg='<colgroup><col style="width:140px">'
        +COLS.map(function(){ return '<col>'; }).join('')+'</colgroup>';

      // 行
      var tbody='';
      var prevDate='';
      svcs.forEach(function(s,idx){
        var tc=getTc(s.type);
        var isNewDate=(s.date!==prevDate);
        prevDate=s.date;

        // 新日期加分隔线
        if(isNewDate && idx>0){
          tbody+='<tr class="s9-group-sep"><td colspan="'+(COLS.length+1)+'"></td></tr>';
        }

        // 日期信息格
        var infoCell='<td class="s9-row-info" style="border-left-color:'+tc.bar+';">'
          +'<span class="s9-date">'+dateShort(s.date)+'</span>'
          +'<span class="s9-week">'+weekday(s.date)+'</span>'
          +'<span class="s9-type-tag" style="background:'+tc.tag_bg+';color:'+tc.tag_txt+'">'+esc(s.type)+'</span>'
          +'</td>';

        var dataCells=COLS.map(function(col){
          return renderTd(col, s[col.key]||'');
        }).join('');

        tbody+='<tr>'+infoCell+dataCells+'</tr>';
      });

      if(!svcs.length){
        tbody='<tr><td colspan="'+(COLS.length+1)+'" style="padding:48px;text-align:center;color:var(--txt3);font-size:15px">暂无数据</td></tr>';
      }

      EL.innerHTML=
        '<div class="s9-bar">'
          +'<div class="s9-nav">'+navHtml+'</div>'
          +'<div class="s9-right">'
            +'<button class="s9-theme" id="csTheme">'+(isDark?'☀️':'🌙')+'</button>'
            +'<button class="s9-dl" id="csExp">'+svgDL()+'导出图片</button>'
          +'</div>'
        +'</div>'
        +'<div class="s9-filters" id="csFilters">'+fHtml+'</div>'
        +'<div class="s9-wrap">'
          +'<table class="s9-table" id="csTable">'+cg
            +'<thead><tr>'+colHdr+'</tr></thead>'
            +'<tbody>'+tbody+'</tbody>'
          +'</table>'
        +'</div>';

      // 事件
      var prev   = EL.querySelector('#csPrev');
      var next   = EL.querySelector('#csNext');
      var exp    = EL.querySelector('#csExp');
      var thBtn  = EL.querySelector('#csTheme');
      var fbox   = EL.querySelector('#csFilters');

      if(prev)  prev.addEventListener('click', function(){ render(i-1); });
      if(next)  next.addEventListener('click', function(){ render(i+1); });
      if(exp)   exp.addEventListener('click',  function(){ exportPng(key); });
      if(thBtn) thBtn.addEventListener('click', function(){
        isDark=!isDark;
        try{ localStorage.setItem('cecp-theme', isDark?'dark':'light'); }catch(e){}
        applyTheme(); render(i);
      });
      if(fbox) fbox.querySelectorAll('.s9-filter').forEach(function(b){
        b.addEventListener('click', function(){
          activeFilter = this.dataset.f;
          render(i);
        });
      });

      bindHL();
    }
  }

  /* ── 渲染单元格 ───────────────────────────────────────────────────────────── */
  function renderTd(col, val) {
    if(col.type==='reading'){
      var rd=parseReading(val);
      if(!rd||!rd.name) return '<td class="s9-cell"><span class="s9-empty">—</span></td>';
      return '<td class="s9-cell">'
        +'<span class="s9-rd-ref">'+esc(rd.ref)+'</span>'
        +mkBadge(rd.name)+'</td>';
    }
    if(col.type==='note'){
      if(!val) return '<td class="s9-cell"><span class="s9-empty">—</span></td>';
      var m=val.match(/^(证道[：:]\s*)(.+)$/);
      if(m) return '<td class="s9-cell"><span class="s9-note-pfx">'+esc(m[1])+'</span>'+mkBadge(m[2])+'</td>';
      return '<td class="s9-cell">'+mkBadge(val)+'</td>';
    }
    if(!val) return '<td class="s9-cell"><span class="s9-empty">—</span></td>';
    var ns=val.split(/[\/\n]/).map(function(n){ return n.trim(); }).filter(Boolean);
    return '<td class="s9-cell">'+ns.map(mkBadge).join('')+'</td>';
  }

  function mkBadge(name){
    if(!name) return '';
    var c=badgeColor(name);
    if(!c) return '<span class="s9-badge" style="background:var(--bg2);color:var(--lbl)">'+esc(name)+'</span>';
    return '<span class="s9-badge" data-n="'+esc(name)+'" style="background:'+c[0]+';color:'+c[1]+'">'+esc(name)+'</span>';
  }

  /* ── 高亮 ─────────────────────────────────────────────────────────────────── */
  function all$() { return EL.querySelectorAll('.s9-badge'); }
  function applyHL(name, lock){
    all$().forEach(function(b){
      var n=b.dataset.n||b.textContent;
      b.classList.remove('lit','dim','locked','ldim');
      if(n===name) b.classList.add(lock?'locked':'lit');
      else b.classList.add(lock?'ldim':'dim');
    });
  }
  function clearHL(){ all$().forEach(function(b){ b.classList.remove('lit','dim','locked','ldim'); }); }
  function bindHL(){
    all$().forEach(function(b){
      var name=b.dataset.n||b.textContent;
      b.addEventListener('mouseenter', function(){ if(!locked) applyHL(name,false); });
      b.addEventListener('mouseleave', function(){ if(!locked) clearHL(); });
      b.addEventListener('click', function(e){
        e.stopPropagation();
        if(locked===name){ locked=null; clearHL(); }
        else{ locked=name; applyHL(name,true); }
      });
    });
    EL.addEventListener('click', function(){ if(locked){ locked=null; clearHL(); } });
  }

  /* ── 导出 ─────────────────────────────────────────────────────────────────── */
  function exportPng(key){
    var btn=EL.querySelector('#csExp');
    var tbl=EL.querySelector('#csTable');
    if(!btn||!tbl) return;
    btn.disabled=true; btn.textContent='处理中…';
    function run(){
      window.html2canvas(tbl,{backgroundColor:isDark?'#0e0e0e':'#fff',scale:2,useCORS:true,logging:false})
        .then(function(c){
          var a=document.createElement('a');
          a.download='服事安排_'+key+'.png'; a.href=c.toDataURL('image/png'); a.click();
          btn.innerHTML=svgDL()+'导出图片'; btn.disabled=false;
        })
        .catch(function(){ btn.textContent='导出失败'; btn.disabled=false; });
    }
    if(!window.html2canvas){
      var sc=document.createElement('script');
      sc.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      sc.onload=run; document.head.appendChild(sc);
    } else { run(); }
  }

  /* ── 工具 ─────────────────────────────────────────────────────────────────── */
  var WD=['日','一','二','三','四','五','六'];
  function getTc(t){ return TYPE_COLOR[t]||TYPE_DEF; }
  function parseReading(v){
    if(!v) return null;
    var m=v.match(/^(诗\d+)\s+(.+)$/);
    return m?{ref:m[1],name:m[2].trim()}:{ref:v,name:''};
  }
  function dateShort(s){
    var m=s&&s.match(/\d{4}[-\/](\d{1,2})[-\/](\d{1,2})/);
    return m?parseInt(m[1],10)+'月'+parseInt(m[2],10)+'日':s;
  }
  function weekday(s){
    try{ return '周'+WD[new Date(s).getDay()]; }catch(e){ return ''; }
  }
  function mlabel(k){ var p=k.split('-'); return p[0]+'年'+parseInt(p[1],10)+'月'; }
  function pad(n){ return n<10?'0'+n:''+n; }
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function svgDL(){
    return '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M7 1v8M4 6l3 3 3-3M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1"/></svg>';
  }

  /* ── Demo ─────────────────────────────────────────────────────────────────── */
  function demo(){
    return [
      {date:'2026-03-01',type:'主日下午',leader:'金展',worship:'胡娜',band:'杨亦佳',prayer:'林文宝',reading:'诗9 金Silvia',note:'证道：金美德'},
      {date:'2026-03-01',type:'主日晚上',leader:'林文宝',worship:'翁撒该/杨雪克/叶春叶',band:'金紫涵/黄天丽',prayer:'戴献和',reading:'',note:'证道：金美德'},
      {date:'2026-03-01',type:'青年团契',leader:'',worship:'',band:'',prayer:'',reading:'',note:'证道：吴超凡'},
      {date:'2026-03-08',type:'主日下午',leader:'林文宝',worship:'吴超凡',band:'青少年',prayer:'翁撒该',reading:'诗10 季轩',note:'证道：吴恬恬'},
      {date:'2026-03-08',type:'主日晚上',leader:'吴超凡',worship:'吴超凡及青少年',band:'青少年',prayer:'林文宝/董希昆',reading:'',note:'证道：彭永剑'},
      {date:'2026-03-08',type:'青年团契',leader:'',worship:'',band:'',prayer:'',reading:'',note:'证道：吴超凡'},
      {date:'2026-03-15',type:'主日下午',leader:'彭永剑',worship:'孙琴乐',band:'季轩/吴以勒',prayer:'徐永西',reading:'诗11 何若诗',note:'证道：陈金东'},
      {date:'2026-03-15',type:'主日晚上',leader:'金展',worship:'胡娜/林文宝',band:'翁撒该',prayer:'徐永西',reading:'',note:'证道：戴先和'},
      {date:'2026-03-15',type:'青年团契',leader:'',worship:'',band:'',prayer:'',reading:'',note:'证道：吴恬恬'},
      {date:'2026-03-22',type:'主日下午',leader:'戴献和',worship:'王皞阳',band:'黄天丽/金丽莎',prayer:'胡蓉',reading:'诗12 何心如',note:'证道：潘隆正'},
      {date:'2026-03-22',type:'主日晚上',leader:'彭永剑/王皞阳',worship:'叶春叶/董希昆',band:'徐博杰/黄天丽',prayer:'金展',reading:'',note:'证道：潘隆正'},
      {date:'2026-03-22',type:'青年团契',leader:'',worship:'',band:'',prayer:'',reading:'',note:'证道：意语敬拜'},
      {date:'2026-03-29',type:'主日下午',leader:'王皞阳',worship:'吴恬恬',band:'谢安/金Silvia',prayer:'戴献和',reading:'诗13 林颖慧',note:'证道：潘庆峰'},
      {date:'2026-03-29',type:'主日晚上',leader:'翁撒该',worship:'金梦熙',band:'胡娜',prayer:'林文宝',reading:'',note:'证道：潘庆峰'},
      {date:'2026-03-29',type:'青年团契',leader:'',worship:'',band:'',prayer:'',reading:'',note:'证道：潘庆峰'},
    ];
  }

})();
