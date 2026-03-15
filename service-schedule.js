/**
 * service-schedule.js v17.0 — transposed matrix view
 * - 无“全部”
 * - 类型顺序：青年团契 / 主日下午 / 主日晚上 / 祷告会
 * - 普通类型：纵向=服事项目，横向=周次（当前月份）
 * - 祷告会：纵向=周次，横向=周三 / 周六（当前月份）
 */
(function(){
  'use strict';
  var EL = document.getElementById('cecp-schedule');
  if(!EL) return;
  var API = (EL.dataset.api || '').trim();

  var TYPE_ORDER = ['青年团契','主日下午','主日晚上','祷告会'];
  var REGULAR_ROWS = {
    '青年团契': [
      { key:'worship', label:'敬拜带领', kind:'badges' },
      { key:'piano', label:'司琴', kind:'badges' },
      { key:'drums', label:'鼓', kind:'badges' },
      { key:'guitar', label:'吉他', kind:'badges' },
      { key:'bass', label:'贝斯', kind:'badges' },
      { key:'note', label:'证道 / 备注', kind:'note' }
    ],
    '主日下午': [
      { key:'leader', label:'主领 / 司仪', kind:'badges' },
      { key:'worship', label:'敬拜带领', kind:'badges' },
      { key:'prayerLeader', label:'祷告会带领', kind:'badges' },
      { key:'praisePrayer', label:'颂赞祷告', kind:'badges' },
      { key:'memorialPrayer', label:'纪念祷告', kind:'badges' },
      { key:'piano', label:'司琴', kind:'badges' },
      { key:'drums', label:'鼓', kind:'badges' },
      { key:'guitar', label:'吉他', kind:'badges' },
      { key:'bass', label:'贝斯', kind:'badges' },
      { key:'reading', label:'读经', kind:'reading' },
      { key:'note', label:'证道 / 备注', kind:'note' }
    ],
    '主日晚上': [
      { key:'leader', label:'主领 / 带领', kind:'badges' },
      { key:'worship', label:'敬拜带领', kind:'badges' },
      { key:'prayerLeader', label:'带领祷告', kind:'badges' },
      { key:'piano', label:'司琴', kind:'badges' },
      { key:'drums', label:'鼓', kind:'badges' },
      { key:'guitar', label:'吉他', kind:'badges' },
      { key:'bass', label:'贝斯', kind:'badges' },
      { key:'note', label:'证道 / 备注', kind:'note' }
    ]
  };

  var TYPE_C = {
    '主日下午': { accent:'#4a8df0', dark:{ bg:'#1b3b73', tx:'#9fc4ff' }, light:{ bg:'#2c63c8', tx:'#ffffff' } },
    '主日晚上': { accent:'#8d49df', dark:{ bg:'#3f226c', tx:'#c9a0ff' }, light:{ bg:'#6c3fc3', tx:'#ffffff' } },
    '青年团契': { accent:'#33b46d', dark:{ bg:'#1b5633', tx:'#8be3ad' }, light:{ bg:'#22884f', tx:'#ffffff' } },
    '祷告会':   { accent:'#c27bf4', dark:{ bg:'#553168', tx:'#e0b8ff' }, light:{ bg:'#9b59d9', tx:'#ffffff' } }
  };
  var TYPE_DEF = { accent:'#7b7f87', dark:{ bg:'#31343a', tx:'#c7ccd4' }, light:{ bg:'#7f8792', tx:'#ffffff' } };

  var PAL_D = [
    ['#324862','#91b9ea'],['#284b45','#77d2c1'],['#54474a','#c7938b'],['#43515b','#98b9d7'],['#4f5a42','#a8c874'],['#5a4738','#d2a86d'],['#534469','#b197f1'],['#61435a','#de92cb'],['#35556b','#73c4ff'],['#39543b','#7ad87e'],['#674848','#f08d8d'],['#5f5333','#d9c04f'],['#4d5865','#b7c3d3'],['#2c6171','#7fd8f2'],['#66553f','#dbb07f'],['#4f4761','#b6a0ef'],['#416746','#9be28e'],['#6b5038','#efad59'],['#5f4450','#e7a4bb'],['#355a56','#75d1c2']
  ];
  var PAL_L = [
    ['#486c95','#ebf2fb'],['#3f776f','#ebf8f5'],['#8b666d','#f9eff2'],['#587488','#edf4f8'],['#6f7f4f','#f2f7ea'],['#937149','#fbf3e8'],['#78619f','#f3eefb'],['#9b668d','#faf0f7'],['#4f85ae','#edf6fd'],['#4f8452','#eef8ef'],['#a16d6d','#fceeee'],['#9a873b','#faf6e5'],['#677789','#eef3f7'],['#447f95','#ebf8fb'],['#8f7558','#faf3eb'],['#7d709c','#f3f0fa'],['#55865a','#eef8ef'],['#a46f38','#fbf1e5'],['#9a6b7f','#faf0f4'],['#4f817d','#ecf8f6']
  ];

  var isDark = true;
  try {
    var saved = localStorage.getItem('cecp-theme');
    if (saved) isDark = saved === 'dark';
    else isDark = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  } catch (e) {}

  function tc(type){
    var t = TYPE_C[type] || TYPE_DEF;
    return { accent:t.accent, bg:isDark?t.dark.bg:t.light.bg, tx:isDark?t.dark.tx:t.light.tx };
  }
  function badgeColor(name){
    if(!name) return null;
    var h = 0;
    for(var i=0;i<name.length;i++) h = (Math.imul(31,h) + name.charCodeAt(i)) | 0;
    return (isDark ? PAL_D : PAL_L)[Math.abs(h) % PAL_D.length];
  }
  function applyTheme(){ EL.classList.toggle('cec-dk', isDark); EL.classList.toggle('cec-lt', !isDark); }

  if(!document.getElementById('_cecp_v17')){
    var st = document.createElement('style');
    st.id = '_cecp_v17';
    st.textContent = `
#cecp-schedule{font-family:"PingFang SC","Noto Sans SC","Microsoft YaHei",system-ui,sans-serif;width:100%;box-sizing:border-box;border-radius:16px;overflow:hidden;border:1px solid var(--ln2)}
#cecp-schedule *{box-sizing:border-box}
#cecp-schedule.cec-dk{background:#111214;color:#e8ebf0;--bg:#111214;--bg2:#17191d;--bg3:#1d2026;--bg4:#242932;--ln:#262a31;--ln2:#343943;--ln3:#404754;--tx:#e8ebf0;--tx2:#aeb6c3;--tx3:#6e7887;--soft:#16181c;--soft2:#1b1e24;--rd:#97d8a6;--nt:#f0cb78}
#cecp-schedule.cec-lt{background:#f7f8fa;color:#1f2937;--bg:#f7f8fa;--bg2:#f1f3f6;--bg3:#e8edf3;--bg4:#dde5ef;--ln:#dbe2eb;--ln2:#cfd8e4;--ln3:#bec9d6;--tx:#1f2937;--tx2:#64748b;--tx3:#9ba7b6;--soft:#f5f6f8;--soft2:#eef2f6;--rd:#296942;--nt:#8f6920}
.cec-btn{border:none;background:none;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;transition:background .12s ease,color .12s ease,border-color .12s ease,transform .12s ease,opacity .12s ease;letter-spacing:.01em;flex-shrink:0;appearance:none;-webkit-appearance:none}
.cec-z1{display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--soft);border-bottom:1px solid var(--ln)}
.cec-month-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.cec-tools{margin-left:auto;display:flex;align-items:center;gap:8px}
.cec-btn-month{height:34px;padding:0 14px;border-radius:10px;border:1px solid transparent;color:var(--tx2);font-size:13px;font-weight:700;background:transparent}
.cec-btn-month:hover:not(.on){background:var(--bg3);color:var(--tx);border-color:var(--ln2)}
.cec-btn-month.on{background:var(--bg4);color:var(--tx);border-color:var(--ln2)}
.cec-btn-arr,.cec-btn-icon{width:34px;height:34px;border-radius:10px;border:1px solid var(--ln2);color:var(--tx2);background:var(--bg2);font-size:13px}
.cec-btn-arr:hover,.cec-btn-icon:hover{background:var(--bg3);color:var(--tx);border-color:var(--ln3)}
.cec-btn-tool{height:34px;padding:0 14px;gap:6px;border-radius:10px;border:1px solid var(--ln2);color:var(--tx2);background:var(--bg2);font-size:12px;font-weight:700}
.cec-btn-tool:hover{background:var(--bg3);color:var(--tx);border-color:var(--ln3)}.cec-btn-tool:disabled{opacity:.45;cursor:not-allowed}
.cec-z2{display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--soft2);border-bottom:1px solid var(--ln);flex-wrap:wrap}
.cec-btn-type{height:30px;padding:0 12px;gap:6px;border-radius:999px;border:1px solid transparent;color:var(--tx2);background:transparent;font-size:12px;font-weight:800}
.cec-btn-type:hover:not(.on){background:var(--bg3);color:var(--tx)}
.cec-btn-type.on{color:var(--bg)}
.cec-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.cec-wrap{width:100%;overflow-x:auto;background:var(--bg)}
.cec-tbl{border-collapse:separate;border-spacing:0;width:max-content;min-width:100%;table-layout:fixed}
.cec-tbl th,.cec-tbl td{border-right:1px solid var(--ln2);border-bottom:1px solid var(--ln2);vertical-align:middle}
.cec-tbl tr th:last-child,.cec-tbl tr td:last-child{border-right:none}
.cec-corner{background:rgba(255,255,255,.02);padding:14px 10px;text-align:left;color:var(--tx3);font-size:11px;font-weight:700;letter-spacing:.05em;position:sticky;left:0;z-index:3}
.cec-chdr{background:rgba(255,255,255,.02);padding:14px 10px;text-align:center;color:var(--tx2);font-size:12px;font-weight:800;letter-spacing:.02em;white-space:nowrap;position:sticky;top:0;z-index:2}
.cec-rhdr{background:rgba(255,255,255,.01);padding:12px 10px;text-align:left;color:var(--tx);font-size:12px;font-weight:800;position:sticky;left:0;z-index:1;min-width:130px;width:130px}
.cec-rhdr .sub{display:block;margin-top:4px;font-size:10px;font-weight:700;color:var(--tx3)}
.cec-cell{min-width:140px;min-height:76px;padding:12px 10px;text-align:center;background:transparent}
.cec-cell:hover{background:rgba(255,255,255,.02)}
.cec-badges{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:8px;min-height:40px}
.cec-badge{display:inline-flex;align-items:center;justify-content:center;min-height:32px;padding:6px 12px;border-radius:7px;font-size:11px;font-weight:800;line-height:1.2;white-space:nowrap;cursor:pointer;letter-spacing:.01em;transition:opacity .12s ease,transform .12s ease,box-shadow .12s ease,filter .12s ease;user-select:none;position:relative}
.cec-badge.lit{transform:translateY(-1px);filter:brightness(1.08);box-shadow:0 0 0 1px rgba(255,255,255,.16)}.cec-badge.dim{opacity:.18}.cec-badge.locked{transform:translateY(-1px);filter:brightness(1.12);box-shadow:0 0 0 1.5px rgba(255,255,255,.26)}.cec-badge.ldim{opacity:.10}.cec-lt .cec-badge.lit{box-shadow:0 0 0 1px rgba(0,0,0,.14)}.cec-lt .cec-badge.locked{box-shadow:0 0 0 1.5px rgba(0,0,0,.22)}
.cec-reading,.cec-note,.cec-prayer{display:flex;min-height:40px;flex-direction:column;align-items:center;justify-content:center;gap:6px}
.cec-ref{display:block;font-size:12px;font-weight:800;color:var(--rd);line-height:1.15}.cec-npfx{display:block;font-size:11px;font-weight:800;color:var(--nt);line-height:1.1}
.cec-time{font-size:11px;color:var(--tx3);font-weight:700}
.cec-empty{color:var(--tx3);font-size:15px;line-height:1}
.cec-state{display:flex;align-items:center;justify-content:center;gap:12px;padding:60px 24px;color:var(--tx2);font-size:14px}.cec-spin{width:18px;height:18px;border:2px solid var(--ln3);border-top-color:var(--tx2);border-radius:50%;animation:cecspin .7s linear infinite}@keyframes cecspin{to{transform:rotate(360deg)}}
.cec-err{padding:24px;color:#cf5e5e;font-size:14px;line-height:1.8}
@media(max-width:760px){.cec-rhdr{min-width:112px;width:112px;padding:10px 8px}.cec-cell{min-width:120px;padding:10px 8px}.cec-chdr,.cec-corner{padding:12px 8px;font-size:11px}.cec-badge{min-height:28px;padding:5px 10px;font-size:10px;border-radius:6px}}
@media(max-width:560px){.cec-btn-month,.cec-btn-tool,.cec-btn-arr,.cec-btn-icon{height:32px}.cec-btn-arr,.cec-btn-icon{width:32px}.cec-btn-month{padding:0 11px;font-size:12px}.cec-btn-tool{padding:0 11px;font-size:12px}.cec-btn-type{height:28px;padding:0 10px;font-size:11px}}
`;
    document.head.appendChild(st);
  }

  applyTheme();
  EL.innerHTML = '<div class="cec-state"><div class="cec-spin"></div>加载服事安排…</div>';

  if(!API || API === 'DEMO'){
    setTimeout(function(){ boot(demo()); }, 150);
    return;
  }

  fetch(API + '?action=all').then(function(r){ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(function(res){ if(!res.ok) throw new Error(res.error || '脚本错误'); boot(res.data); }).catch(function(e){
    EL.innerHTML = '<div class="cec-err">⚠ ' + esc(e.message) + '<br><small style="opacity:.6">请确认 Apps Script 已重新部署，并且 Web App 权限为「所有人」</small></div>';
  });

  var locked = null;

  function boot(rows){
    if(!rows || !rows.length){ EL.innerHTML = '<div class="cec-state">暂无服事安排数据</div>'; return; }

    var months = {};
    rows.forEach(function(r){ var m = tv(r.month); if(!m) return; (months[m] || (months[m] = [])).push(r); });
    var mkeys = Object.keys(months).sort(function(a,b){ return mord(a)-mord(b); });
    if(!mkeys.length) return;

    var nowM = (new Date().getMonth()+1) + '月';
    var mIdx = mkeys.indexOf(nowM);
    if(mIdx < 0){ for(var i=0;i<mkeys.length;i++){ if(mord(mkeys[i]) >= mord(nowM)){ mIdx=i; break; } } }
    if(mIdx < 0) mIdx = mkeys.length - 1;

    var activeType = TYPE_ORDER.filter(function(t){ return rows.some(function(r){ return r.type===t; }); })[0] || '主日下午';

    render(mIdx);

    function render(i){
      locked = null;
      var key = mkeys[i];
      var currentRows = months[key] || [];
      var typesAvailable = TYPE_ORDER.filter(function(t){ return rows.some(function(r){ return r.type===t; }); });

      var z1 = '<div class="cec-month-row">';
      if(i>0) z1 += '<button class="cec-btn cec-btn-arr" id="cPA">&#8592;</button>';
      if(i>0) z1 += '<button class="cec-btn cec-btn-month" id="cPM">' + esc(mkeys[i-1]) + '</button>';
      z1 += '<button class="cec-btn cec-btn-month on">' + esc(key) + '</button>';
      if(i<mkeys.length-1) z1 += '<button class="cec-btn cec-btn-month" id="cNM">' + esc(mkeys[i+1]) + '</button>';
      if(i<mkeys.length-1) z1 += '<button class="cec-btn cec-btn-arr" id="cNA">&#8594;</button>';
      z1 += '</div><div class="cec-tools">' +
        '<button class="cec-btn cec-btn-icon" id="cTH" title="切换主题">' + (isDark ? '&#9728;' : '&#9790;') + '</button>' +
        '<button class="cec-btn cec-btn-tool" id="cEX">' + svgDL() + '导出</button>' +
      '</div>';

      var z2 = '';
      typesAvailable.forEach(function(tp){
        var c = tc(tp), on = activeType === tp;
        z2 += '<button class="cec-btn cec-btn-type' + (on ? ' on' : '') + '" data-t="' + esc(tp) + '"' +
          (on ? ' style="background:' + c.bg + ';border-color:' + c.bg + '"' : '') + '>' +
          '<span class="cec-dot" style="background:' + c.accent + '"></span>' + esc(tp) + '</button>';
      });

      var bodyHtml = activeType === '祷告会'
        ? renderPrayerMatrix(currentRows, key)
        : renderRegularMatrix(currentRows, activeType, key);

      EL.innerHTML = '<div class="cec-z1">' + z1 + '</div>' + '<div class="cec-z2" id="cZ2">' + z2 + '</div>' + bodyHtml;

      bindNav(EL.querySelector('#cPA'), function(){ render(i-1); });
      bindNav(EL.querySelector('#cPM'), function(){ render(i-1); });
      bindNav(EL.querySelector('#cNA'), function(){ render(i+1); });
      bindNav(EL.querySelector('#cNM'), function(){ render(i+1); });
      bindNav(EL.querySelector('#cTH'), function(){ isDark = !isDark; try{ localStorage.setItem('cecp-theme', isDark?'dark':'light'); }catch(e){} applyTheme(); render(i); });
      bindNav(EL.querySelector('#cEX'), function(){ exportPng(key + '_' + activeType); });

      var z2el = EL.querySelector('#cZ2');
      if(z2el){
        z2el.querySelectorAll('.cec-btn-type').forEach(function(b){
          b.addEventListener('click', function(){ activeType = this.dataset.t; render(i); });
        });
      }

      bindHL();
    }
  }

  function renderRegularMatrix(rows, activeType, monthLabel){
    var items = rows.filter(function(r){ return r.type === activeType; }).sort(function(a,b){ return word(a.week)-word(b.week); });
    var weeks = unique(items.map(function(r){ return r.week; })).sort(function(a,b){ return word(a)-word(b); });
    var rowDefs = REGULAR_ROWS[activeType] || [];
    var map = {};
    items.forEach(function(r){ map[r.week] = r; });

    var cg = '<colgroup><col style="width:130px">' + weeks.map(function(){ return '<col style="width:138px">'; }).join('') + '</colgroup>';
    var thead = '<thead><tr><th class="cec-corner">服事安排</th>' + weeks.map(function(w){ return '<th class="cec-chdr">' + esc(monthLabel) + '<br>' + esc(w) + '</th>'; }).join('') + '</tr></thead>';
    var tbody = '<tbody>' + rowDefs.map(function(def){
      return '<tr><th class="cec-rhdr">' + esc(def.label) + '</th>' + weeks.map(function(w){
        var row = map[w] || {};
        return renderCell(def.kind, row[def.key] || '');
      }).join('') + '</tr>';
    }).join('') + '</tbody>';
    return '<div class="cec-wrap"><table class="cec-tbl" id="cTbl">' + cg + thead + tbody + '</table></div>';
  }

  function renderPrayerMatrix(rows, monthLabel){
    var items = rows.filter(function(r){ return r.type === '祷告会'; }).sort(function(a,b){
      var dw = word(a.week)-word(b.week); if(dw) return dw;
      var so = {'周三祷告会':0,'周六祷告会':1}; return (so[a.subtype]||9)-(so[b.subtype]||9);
    });
    var weeks = unique(items.map(function(r){ return r.week; })).sort(function(a,b){ return word(a)-word(b); });
    var subtypes = ['周三祷告会','周六祷告会'];
    var map = {};
    items.forEach(function(r){ map[r.week + '|' + r.subtype] = r; });

    var cg = '<colgroup><col style="width:116px"><col style="width:170px"><col style="width:170px"></colgroup>';
    var thead = '<thead><tr><th class="cec-corner">' + esc(monthLabel) + '</th>' + subtypes.map(function(s){ return '<th class="cec-chdr">' + esc(s.replace('祷告会','')) + '</th>'; }).join('') + '</tr></thead>';
    var tbody = '<tbody>' + weeks.map(function(w){
      return '<tr><th class="cec-rhdr">' + esc(w) + '</th>' + subtypes.map(function(st){
        var row = map[w + '|' + st] || {};
        return '<td class="cec-cell"><div class="cec-prayer">' +
          (row.leader ? mkB(row.leader) : '<span class="cec-empty">-</span>') +
          (row.time ? '<span class="cec-time">' + esc(row.time) + '</span>' : '') +
        '</div></td>';
      }).join('') + '</tr>';
    }).join('') + '</tbody>';
    return '<div class="cec-wrap"><table class="cec-tbl" id="cTbl">' + cg + thead + tbody + '</table></div>';
  }

  function renderCell(kind, val){
    if(kind === 'reading'){
      var rd = parseRd(val);
      if(!rd || (!rd.ref && !rd.name)) return '<td class="cec-cell"><span class="cec-empty">-</span></td>';
      return '<td class="cec-cell"><div class="cec-reading"><span class="cec-ref">' + esc(rd.ref) + '</span>' + (rd.name ? mkB(rd.name) : '') + '</div></td>';
    }
    if(kind === 'note'){
      if(!val) return '<td class="cec-cell"><span class="cec-empty">-</span></td>';
      var m = String(val).match(/^(证道[：:]\s*)(.+)$/);
      if(m) return '<td class="cec-cell"><div class="cec-note"><span class="cec-npfx">' + esc(m[1]) + '</span>' + mkB(m[2]) + '</div></td>';
      return '<td class="cec-cell"><div class="cec-note">' + mkB(val) + '</div></td>';
    }
    if(!val) return '<td class="cec-cell"><span class="cec-empty">-</span></td>';
    return '<td class="cec-cell"><div class="cec-badges">' + String(val).split(/[\/\n]/).map(function(n){ n=n.trim(); return n ? mkB(n) : ''; }).filter(Boolean).join('') + '</div></td>';
  }

  function mkB(name){
    if(!name) return '';
    var c = badgeColor(name);
    if(!c) return '<span class="cec-badge" style="background:var(--bg3);color:var(--tx2)">' + esc(name) + '</span>';
    return '<span class="cec-badge" data-n="' + esc(name) + '" style="background:' + c[0] + ';color:' + c[1] + '">' + esc(name) + '</span>';
  }
  function parseRd(v){ if(!v) return null; var s=String(v).trim(), m=s.match(/^(.+?)\s+(.+)$/); return m ? {ref:m[1], name:m[2].trim()} : {ref:s, name:''}; }

  function allB(){ return EL.querySelectorAll('.cec-badge'); }
  function applyHL(n, lk){ allB().forEach(function(b){ var bn=b.dataset.n||b.textContent; b.classList.remove('lit','dim','locked','ldim'); if(bn===n) b.classList.add(lk?'locked':'lit'); else b.classList.add(lk?'ldim':'dim'); }); }
  function clearHL(){ allB().forEach(function(b){ b.classList.remove('lit','dim','locked','ldim'); }); }
  function bindHL(){ allB().forEach(function(b){ var n=b.dataset.n||b.textContent; b.addEventListener('mouseenter', function(){ if(!locked) applyHL(n,false); }); b.addEventListener('mouseleave', function(){ if(!locked) clearHL(); }); b.addEventListener('click', function(e){ e.stopPropagation(); if(locked===n){ locked=null; clearHL(); } else { locked=n; applyHL(n,true); } }); }); EL.addEventListener('click', function(){ if(locked){ locked=null; clearHL(); } }); }

  function exportPng(name){
    var btn = EL.querySelector('#cEX'), tbl = EL.querySelector('#cTbl'); if(!btn||!tbl) return;
    btn.disabled = true; btn.innerHTML = '处理中…';
    function run(){ window.html2canvas(tbl,{backgroundColor:isDark?'#111214':'#f7f8fa',scale:2,useCORS:true,logging:false}).then(function(canvas){ var a=document.createElement('a'); a.download='服事安排_' + name + '.png'; a.href=canvas.toDataURL('image/png'); a.click(); btn.innerHTML = svgDL() + '导出'; btn.disabled=false; }).catch(function(){ btn.innerHTML='导出失败'; btn.disabled=false; }); }
    if(!window.html2canvas){ var sc=document.createElement('script'); sc.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'; sc.onload=run; document.head.appendChild(sc); } else run();
  }

  function bindNav(el, fn){ if(el) el.addEventListener('click', fn); }
  function unique(arr){ var out=[]; arr.forEach(function(v){ if(v && out.indexOf(v)<0) out.push(v); }); return out; }
  function mord(s){ var m=String(s).match(/^(\d{1,2})月$/); return m ? parseInt(m[1],10) : 99; }
  function word(s){ return {'第一周':1,'第二周':2,'第三周':3,'第四周':4,'第五周':5}[String(s)] || 99; }
  function tv(v){ return String(v==null?'':v).trim(); }
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function svgDL(){ return '<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M7 1v8M4 6l3 3 3-3M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1"/></svg>'; }

  function demo(){
    return [
      {month:'3月',week:'第一周',type:'主日下午',subtype:'',leader:'金展',worship:'胡娜',prayerLeader:'林文宝',praisePrayer:'林文宝',memorialPrayer:'邱展伟',piano:'杨亦佳',drums:'',guitar:'',bass:'',reading:'诗9 金Silvia',note:'证道：金美德',time:''},
      {month:'3月',week:'第二周',type:'主日下午',subtype:'',leader:'林文宝',worship:'吴超凡',prayerLeader:'翁撒该',praisePrayer:'金展',memorialPrayer:'季连芬',piano:'青少年',drums:'',guitar:'',bass:'',reading:'诗10 季轩',note:'证道：吴恬恬',time:''},
      {month:'3月',week:'第三周',type:'主日下午',subtype:'',leader:'彭永剑',worship:'孙琴乐',prayerLeader:'徐永西',praisePrayer:'徐永西',memorialPrayer:'谷小英',piano:'季轩',drums:'',guitar:'吴以勒',bass:'',reading:'诗11 何若诗',note:'证道：陈金东',time:''},
      {month:'3月',week:'第四周',type:'主日下午',subtype:'',leader:'戴献和',worship:'王皞阳',prayerLeader:'胡蓉',praisePrayer:'彭永剑',memorialPrayer:'胡蓉',piano:'黄天丽',drums:'',guitar:'金丽莎',bass:'',reading:'诗12 何心如',note:'证道：潘隆正',time:''},
      {month:'3月',week:'第五周',type:'主日下午',subtype:'',leader:'王皞阳',worship:'吴恬恬',prayerLeader:'金展',praisePrayer:'戴献和',memorialPrayer:'吴恬恬',piano:'谢安',drums:'',guitar:'金Silvia',bass:'',reading:'诗13 林颖慧',note:'证道：潘庆峰',time:''},

      {month:'3月',week:'第一周',type:'主日晚上',subtype:'',leader:'林文宝',worship:'翁撒该/杨雪克/叶春叶',prayerLeader:'戴献和',piano:'金紫涵',drums:'',guitar:'黄天丽',bass:'',reading:'',note:'证道：金美德',time:''},
      {month:'3月',week:'第二周',type:'主日晚上',subtype:'',leader:'吴超凡',worship:'吴超凡及青少年',prayerLeader:'林文宝/董希昆',piano:'青少年',drums:'',guitar:'',bass:'',reading:'',note:'证道：彭永剑',time:''},
      {month:'3月',week:'第三周',type:'主日晚上',subtype:'',leader:'金展',worship:'胡娜/林文宝',prayerLeader:'徐永西',piano:'翁撒该',drums:'',guitar:'',bass:'',reading:'',note:'证道：戴献和',time:''},
      {month:'3月',week:'第四周',type:'主日晚上',subtype:'',leader:'彭永剑/王皞阳',worship:'叶春叶/董希昆',prayerLeader:'金展',piano:'徐博杰',drums:'',guitar:'黄天丽',bass:'',reading:'',note:'证道：潘隆正',time:''},
      {month:'3月',week:'第五周',type:'主日晚上',subtype:'',leader:'翁撒该',worship:'金梦熙',prayerLeader:'林文宝',piano:'胡娜',drums:'',guitar:'',bass:'',reading:'',note:'证道：潘庆峰',time:''},

      {month:'3月',week:'第一周',type:'青年团契',subtype:'',leader:'',worship:'陈灵雅',prayerLeader:'',praisePrayer:'',memorialPrayer:'',piano:'叶群荣',drums:'王雅博',guitar:'张尚贤',bass:'刘仁利',reading:'',note:'活动游戏',time:''},
      {month:'3月',week:'第二周',type:'青年团契',subtype:'',leader:'',worship:'吴超凡',prayerLeader:'',praisePrayer:'',memorialPrayer:'',piano:'叶群荣',drums:'',guitar:'',bass:'',reading:'',note:'证道：吴超凡',time:''},
      {month:'3月',week:'第三周',type:'青年团契',subtype:'',leader:'',worship:'吴恬恬',prayerLeader:'',praisePrayer:'',memorialPrayer:'',piano:'',drums:'',guitar:'',bass:'',reading:'',note:'证道：陈王平',time:''},
      {month:'3月',week:'第四周',type:'青年团契',subtype:'',leader:'',worship:'意语敬拜',prayerLeader:'',praisePrayer:'',memorialPrayer:'',piano:'',drums:'',guitar:'',bass:'',reading:'',note:'意语敬拜',time:''},
      {month:'3月',week:'第五周',type:'青年团契',subtype:'',leader:'',worship:'',prayerLeader:'',praisePrayer:'',memorialPrayer:'',piano:'',drums:'',guitar:'',bass:'',reading:'',note:'证道：潘庆峰',time:''},

      {month:'3月',week:'第一周',type:'祷告会',subtype:'周三祷告会',leader:'王皞阳',time:'21:00-22:00'},
      {month:'3月',week:'第一周',type:'祷告会',subtype:'周六祷告会',leader:'彭永剑',time:'7:30-8:30'},
      {month:'3月',week:'第二周',type:'祷告会',subtype:'周三祷告会',leader:'林文宝',time:'21:00-22:00'},
      {month:'3月',week:'第二周',type:'祷告会',subtype:'周六祷告会',leader:'翁撒该',time:'7:30-8:30'},
      {month:'3月',week:'第三周',type:'祷告会',subtype:'周三祷告会',leader:'彭永剑',time:'21:00-22:00'},
      {month:'3月',week:'第三周',type:'祷告会',subtype:'周六祷告会',leader:'吴超凡',time:'7:30-8:30'},
      {month:'3月',week:'第四周',type:'祷告会',subtype:'周三祷告会',leader:'卢丽丽',time:'21:00-22:00'},
      {month:'3月',week:'第四周',type:'祷告会',subtype:'周六祷告会',leader:'金展',time:'7:30-8:30'},
      {month:'3月',week:'第五周',type:'祷告会',subtype:'周三祷告会',leader:'祷告交通/自洁/陈王平',time:'21:00-22:00'},
      {month:'3月',week:'第五周',type:'祷告会',subtype:'周六祷告会',leader:'林文宝',time:'7:30-8:30'}
    ];
  }
})();
