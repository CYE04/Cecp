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
  var EXPORT_ITEMS = [
    { key: 'all', label: '全部合并' },
    { key: '青年团契', label: '青年' },
    { key: '主日下午', label: '下午' },
    { key: '主日晚上', label: '晚上' },
    { key: '祷告会', label: '祷告会' }
  ];
  var EXPORT_RATIOS = [
    { key: '4:3', label: '4:3' },
    { key: '16:9', label: '16:9' }
  ];
  var EXPORT_RATIO_PRESETS = {
    '4:3': { width: 1350, height: 1800, fileTag: '4x3', frameClass: 'is-r4x3' },
    '16:9': { width: 1920, height: 1080, fileTag: '16x9', frameClass: 'is-r16x9' }
  };

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
.cec-top{justify-content:space-between}
.cec-sub,.cec-typebar{background:var(--cec-bg3)}
.cec-nav{display:flex;align-items:center;gap:8px;flex-wrap:wrap;min-width:0}
.cec-tools{position:relative;margin-left:auto}
.cec-btn{
  appearance:none;border:none;cursor:pointer;
  display:inline-flex;align-items:center;justify-content:center;
  font:inherit;white-space:nowrap;transition:.12s ease;
}
.cec-btn:disabled{cursor:wait;opacity:.72}
.cec-btn-month,.cec-btn-arr,.cec-btn-tool,.cec-btn-type{
  height:34px;border-radius:10px;border:1px solid var(--cec-border);
  background:var(--cec-btn-bg);color:var(--cec-ink2);
}
.cec-btn-month{padding:0 14px;font-weight:700}
.cec-btn-arr{width:34px}
.cec-btn-tool{
  height:40px;padding:0 18px;border-radius:14px;border:1px solid #2b313d;
  background:#0c0e12;color:#f6f8fb;font-weight:800;gap:10px;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.04);
}
.cec-btn-tool-icon{width:20px;height:20px;display:block;flex-shrink:0}
.cec-btn-tool-label{line-height:1}
.cec-btn-month:hover,.cec-btn-arr:hover,.cec-btn-type:hover{background:var(--cec-hover);color:var(--cec-ink)}
.cec-btn-tool:hover{background:#141820;color:#ffffff;border-color:#3a4354}
.cec-btn-month.on,.cec-btn-type.on{background:var(--cec-active);color:var(--cec-ink);border-color:var(--cec-active-border)}
.cec-typebar .cec-btn-type{padding:0 12px;gap:6px;font-size:13px;font-weight:700}
.cec-export-wrap{position:relative}
.cec-export-wrap.open .cec-btn-tool{background:#161b24;color:#ffffff;border-color:#465165}
.cec-menu{
  position:absolute;right:0;top:calc(100% + 8px);z-index:20;display:none;flex-direction:column;
  min-width:220px;padding:8px;border:1px solid var(--cec-border);border-radius:14px;
  background:var(--cec-bg2);box-shadow:0 18px 36px rgba(18,24,38,.16);
}
.cec-export-wrap.open .cec-menu{display:flex}
.cec-menu-title{
  padding:6px 8px 10px;color:var(--cec-ink3);font-size:12px;font-weight:700;letter-spacing:.02em;
}
.cec-menu-divider{
  margin:8px 4px;border-top:1px solid var(--cec-border);
}
.cec-ratio-bar{
  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:0 4px 4px;
}
.cec-ratio-item{
  min-height:36px;border-radius:10px;border:1px solid var(--cec-border);
  background:var(--cec-bg3);color:var(--cec-ink2);font-weight:800;
}
.cec-ratio-item:hover{background:var(--cec-hover);color:var(--cec-ink)}
.cec-ratio-item.on{
  background:#111827;color:#f8fbff;border-color:#2f3a50;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.04);
}
.cec-menu-item{
  width:100%;min-height:40px;padding:0 12px;border-radius:10px;border:1px solid transparent;
  background:transparent;color:var(--cec-ink);justify-content:flex-start;font-weight:700;
}
.cec-menu-item:hover{background:var(--cec-hover);border-color:var(--cec-border)}
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
.cec-badge-txt{
  display:flex;align-items:center;justify-content:center;
  line-height:inherit;white-space:nowrap;
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
.cec-export-shot{
  position:fixed;left:-20000px;top:0;z-index:-1;pointer-events:none;padding:0;
}
.cec-export-frame{
  position:relative;overflow:hidden;
  background:
    radial-gradient(circle at top left, rgba(83,130,255,.16), transparent 28%),
    radial-gradient(circle at top right, rgba(51,180,109,.12), transparent 24%),
    linear-gradient(180deg,#eef4ff 0%,#f6f8fc 100%);
}
.cec-export-stage{
  position:absolute;inset:22px;padding:18px;border-radius:28px;overflow:hidden;
  background:transparent;border:1px solid rgba(217,226,240,.45);
  box-shadow:0 18px 48px rgba(32,45,70,.10);
}
.cec-export-frame.is-r16x9 .cec-export-stage{inset:18px;padding:14px}
.cec-export-viewport{
  position:relative;width:100%;height:100%;overflow:hidden;
}
.cec-export-scale{
  position:relative;width:100%;height:100%;
}
.cec-export-card{
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
  --cec-ref:#1a7a3c;
  --cec-npfx:#7a5500;
  width:max-content;max-width:none;min-width:0;padding:0;
  border-radius:22px;border:1px solid #d8e1ee;
  background:#ffffff;
  box-shadow:0 10px 28px rgba(29,41,57,.08);
  color:var(--cec-ink);
  font-family:"PingFang SC","Noto Sans SC","Microsoft YaHei",system-ui,sans-serif;
}
.cec-export-head{
  display:flex;align-items:flex-end;justify-content:space-between;gap:18px;flex-wrap:wrap;
  margin:0;padding:18px 22px 16px;
  background:linear-gradient(135deg,#fbfdff 0%,#f2f6ff 100%);
  border-bottom:1px solid #dde5f2;
}
.cec-export-head-left{display:flex;flex-direction:column;gap:8px}
.cec-export-eyebrow{
  font-size:11px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:#7b879c;
}
.cec-export-month{font-size:38px;font-weight:900;letter-spacing:.02em;line-height:1.04;color:#1b2433}
.cec-export-meta{
  display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);
  align-items:center;justify-content:flex-end;gap:8px;width:max-content;
}
.cec-export-chip{
  display:inline-flex;align-items:center;justify-content:center;min-height:30px;
  box-sizing:border-box;min-width:96px;width:calc(var(--cec-export-chip-cols,8) * 1em + 34px);
  padding:0 12px;border-radius:999px;border:1px solid #d8e1ee;
  background:#ffffff;color:#4b5a73;font-size:11px;font-weight:900;letter-spacing:.06em;
  text-align:center;
}
.cec-export-chip.is-ratio{
  border-color:#c8d4ea;background:#eef4ff;color:#2c4f96;
}
.cec-export-sub{
  font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--cec-ink3);
}
.cec-export-body{background:var(--cec-bg2)}
.cec-export-grid{
  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;padding:14px;
  background:transparent;
}
.cec-export-panel{
  display:flex;flex-direction:column;overflow:hidden;border:1px solid #e2e8f3;
  border-radius:18px;background:#ffffff;box-shadow:0 8px 22px rgba(32,45,70,.06);
}
.cec-export-section{
  margin-top:0;border:none;border-radius:0;overflow:hidden;background:var(--cec-bg2);
}
.cec-export-label{
  display:flex;align-items:center;gap:10px;padding:11px 14px 10px;
  border-bottom:1px solid #e2e8f3;background:#fcfdff;
  font-size:15px;font-weight:900;color:var(--cec-ink);
}
.cec-export-empty{
  padding:18px 16px;color:var(--cec-ink2);font-size:13px;font-weight:700;
}
.cec-export-card .cec-wrap{overflow:visible}
.cec-export-card .cec-tbl{min-width:0;width:max-content}
.cec-export-badge-img{
  display:block;flex:0 0 auto;overflow:visible;
}
.cec-export-card .cec-corner,
.cec-export-card .cec-h{
  position:static;padding:10px 10px;background:#f6f8fc;color:#6a778e;
  font-size:14px;font-weight:900;
}
.cec-export-card .cec-rowlbl{
  padding:10px 12px;background:#fbfcfe;font-size:13px;font-weight:900;line-height:1.14;
}
.cec-export-card .cec-cell{
  min-width:132px;height:auto;padding:8px 8px;background:#ffffff;
}
.cec-export-card tbody tr:nth-child(2n) .cec-rowlbl,
.cec-export-card tbody tr:nth-child(2n) .cec-cell{background:#fcfdff}
.cec-export-card .cec-cell:hover{background:#ffffff}
.cec-export-card .cec-cell,
.cec-export-card .cec-empty,
.cec-export-card .cec-note,
.cec-export-card .cec-reading{
  text-align:center;
}
.cec-export-card .cec-badges{
  min-height:56px;gap:8px;justify-content:center;align-items:center;align-content:center;
}
.cec-export-card .cec-badge{
  display:inline-flex;box-sizing:border-box;
  min-height:32px;padding:6px 12px;border-radius:7px;
  font-size:11px;font-weight:800;line-height:1.2;letter-spacing:0;text-align:center;
  justify-content:center;align-items:center;vertical-align:middle;
  white-space:nowrap;
}
.cec-export-card .cec-badge-txt{
  min-height:auto;line-height:inherit;transform:translateY(-0.1em);
}
.cec-export-card .cec-note,
.cec-export-card .cec-reading{
  min-height:56px;gap:6px;justify-content:center;align-items:center;align-content:center;
}
.cec-export-card .cec-ref,
.cec-export-card .cec-npfx,
.cec-export-card .cec-empty{
  display:block;width:100%;text-align:center;
}
.cec-export-card .cec-ref{font-size:12px}
.cec-export-card .cec-npfx{font-size:11px}
.cec-export-card .cec-empty{font-size:12px}
.cec-tbl-all .cec-corner,
.cec-tbl-all .cec-typecell{
  width:var(--cec-type-col,112px);min-width:var(--cec-type-col,112px);
}
.cec-tbl-all .cec-h:nth-child(2),
.cec-tbl-all .cec-rowlbl:not(.cec-typecell){
  width:var(--cec-label-col,138px);min-width:var(--cec-label-col,138px);
}
.cec-tbl-all .cec-typecell{
  background:#f8fafc;padding:10px 12px;vertical-align:top;text-align:center;
}
.cec-type-pill{
  display:inline-flex;align-items:center;justify-content:center;min-height:30px;padding:6px 12px;
  border-radius:999px;font-size:11px;font-weight:900;line-height:1.2;text-align:center;
}
.cec-tbl-all .cec-typecell .cec-type-pill{
  display:flex;width:100%;
}
.cec-export-frame.is-r16x9 .cec-export-head{
  padding:14px 18px 13px;
}
.cec-export-frame.is-r16x9 .cec-export-month{font-size:32px}
.cec-export-frame.is-r16x9 .cec-export-grid{
  gap:12px;padding:12px;
}
.cec-export-frame.is-r16x9 .cec-export-panel{
  border-radius:16px;
}
.cec-export-frame.is-r16x9 .cec-export-label{
  padding:9px 12px 8px;font-size:13px;
}
.cec-export-frame.is-r16x9 .cec-export-card .cec-corner,
.cec-export-frame.is-r16x9 .cec-export-card .cec-h{
  padding:8px 8px;font-size:12px;
}
.cec-export-frame.is-r16x9 .cec-export-card .cec-rowlbl{
  padding:7px 9px;font-size:11px;
}
.cec-export-frame.is-r16x9 .cec-tbl-all .cec-typecell{
  padding:7px 9px;
}
.cec-export-frame.is-r16x9 .cec-export-card .cec-cell{
  min-width:114px;padding:5px 5px;
}
.cec-export-frame.is-r16x9 .cec-export-card .cec-badges{
  min-height:42px;gap:5px;
}
.cec-export-frame.is-r16x9 .cec-export-card .cec-badge{
  min-height:24px;padding:4px 9px;border-radius:7px;
  font-size:9px;line-height:1.15;
}
.cec-export-frame.is-r16x9 .cec-export-card .cec-badge-txt{
  line-height:inherit;transform:translateY(-0.1em);
}
.cec-export-frame.is-r16x9 .cec-export-card .cec-note,
.cec-export-frame.is-r16x9 .cec-export-card .cec-reading{
  min-height:42px;gap:4px;
}
.cec-export-frame.is-r16x9 .cec-type-pill{
  min-height:26px;padding:5px 10px;font-size:10px;
}
.cec-export-frame.is-r16x9 .cec-export-card .cec-ref{font-size:10px}
.cec-export-frame.is-r16x9 .cec-export-card .cec-npfx,
.cec-export-frame.is-r16x9 .cec-export-card .cec-empty{font-size:9px}
.cec-spin{
  width:18px;height:18px;border:2px solid var(--cec-spin1);border-top-color:var(--cec-spin2);border-radius:50%;
  animation:cecspin .7s linear infinite;
}
@keyframes cecspin{to{transform:rotate(360deg)}}
.cec-err{padding:24px;color:var(--cec-err);line-height:1.8}
@media(max-width:760px){
  .cec-top{align-items:flex-start}
  .cec-nav,.cec-tools{width:100%}
  .cec-tools{margin-left:0}
  .cec-export-wrap,.cec-btn-tool{width:100%}
  .cec-menu{left:0;right:auto;min-width:min(100%,280px)}
  .cec-btn-tool{justify-content:flex-start}
  .cec-ratio-bar{grid-template-columns:repeat(2,minmax(0,1fr))}
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
    var exportMenuOpen = false;
    var exportBusy = false;
    var activeRatio = '4:3';

    function onDocClick(e) {
      if (!exportMenuOpen) return;
      if (!EL.isConnected) {
        document.removeEventListener('click', onDocClick);
        return;
      }
      var wrap = EL.querySelector('.cec-export-wrap');
      if (wrap && wrap.contains(e.target)) return;
      exportMenuOpen = false;
      render();
    }

    document.addEventListener('click', onDocClick);

    render();

    function render() {
      var month = months[activeMonthIdx];
      var monthRows = byMonth[month] || [];

      var nav = '<div class="cec-nav">';
      if (activeMonthIdx > 0) nav += '<button class="cec-btn cec-btn-arr" id="mPrev">←</button>';
      if (activeMonthIdx > 0) nav += '<button class="cec-btn cec-btn-month" id="mPrevText">' + esc(months[activeMonthIdx - 1]) + '</button>';
      nav += '<button class="cec-btn cec-btn-month on">' + esc(month) + '</button>';
      if (activeMonthIdx < months.length - 1) nav += '<button class="cec-btn cec-btn-month" id="mNextText">' + esc(months[activeMonthIdx + 1]) + '</button>';
      if (activeMonthIdx < months.length - 1) nav += '<button class="cec-btn cec-btn-arr" id="mNext">→</button>';
      nav += '</div>';

      var toolBtnText = exportBusy ? '导出中...' : '导出图片';
      var toolBtnIcon = '<svg class="cec-btn-tool-icon" viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M12 3v10.5m0 0 4-4m-4 4-4-4M5 17v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>' +
        '</svg>';
      var toolMenu = '<div class="cec-tools">' +
        '<div class="cec-export-wrap' + (exportMenuOpen ? ' open' : '') + '">' +
        '<button class="cec-btn cec-btn-tool" id="exportToggle" type="button"' + (exportBusy ? ' disabled' : '') + '>' + toolBtnIcon + '<span class="cec-btn-tool-label">' + toolBtnText + '</span></button>' +
        '<div class="cec-menu">' +
        '<div class="cec-menu-title">画面比例</div>' +
        '<div class="cec-ratio-bar">' +
        EXPORT_RATIOS.map(function (item) {
          return '<button class="cec-btn cec-ratio-item' + (item.key === activeRatio ? ' on' : '') + '" type="button" data-export-ratio="' + esc(item.key) + '">' + esc(item.label) + '</button>';
        }).join('') +
        '</div>' +
        '<div class="cec-menu-divider"></div>' +
        '<div class="cec-menu-title">选择要下载的内容</div>' +
        EXPORT_ITEMS.map(function (item) {
          return '<button class="cec-btn cec-menu-item" type="button" data-export-target="' + esc(item.key) + '">' + esc(item.label) + '</button>';
        }).join('') +
        '</div>' +
        '</div>' +
        '</div>';

      var top = '<div class="cec-top">' + nav + toolMenu + '</div>';

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
      bind('#exportToggle', function (e) {
        if (exportBusy) return;
        e.stopPropagation();
        exportMenuOpen = !exportMenuOpen;
        render();
      });

      EL.querySelectorAll('[data-type]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          activeType = this.getAttribute('data-type');
          lockedName = null;
          exportMenuOpen = false;
          render();
        });
      });

      EL.querySelectorAll('[data-export-ratio]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          activeRatio = this.getAttribute('data-export-ratio') || activeRatio;
          render();
        });
      });

      EL.querySelectorAll('[data-export-target]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          startExport(this.getAttribute('data-export-target'));
        });
      });

      bindHighlight();
    }

    function startExport(target) {
      if (exportBusy) return;
      var month = months[activeMonthIdx];
      var monthRows = byMonth[month] || [];
      var types = target === 'all'
        ? TYPE_ORDER.filter(function (tp) { return hasTypeRows(monthRows, tp); })
        : [target];

      if (!types.length) {
        exportMenuOpen = false;
        render();
        window.alert('当前月份暂无可下载的服事安排');
        return;
      }

      exportBusy = true;
      exportMenuOpen = false;
      render();

      exportScheduleAsImage(month, monthRows, types, activeRatio)
        .catch(function (err) {
          try { console.error('[service-schedule] export image failed', err); } catch (_) {}
          window.alert('下载失败，请稍后再试');
        })
        .finally(function () {
          exportBusy = false;
          render();
        });
    }
  }

  function renderServiceMatrix(rows, type, opt) {
    opt = opt || {};
    var filtered = rows.filter(function (r) { return tv(r.type) === type; });
    var weekMap = {};
    filtered.forEach(function (r) { weekMap[tv(r.week)] = true; });

    var weeks = WEEK_ORDER.filter(function (w) { return weekMap[w]; });
    if (!weeks.length) weeks = WEEK_ORDER.slice();

    var rowDefs = getVisibleServiceRows(type, filtered, opt);
    var labelCol = opt.compact ? (opt.dense ? 92 : 118) : 132;
    var weekCol = opt.compact ? (opt.dense ? 104 : 126) : 150;

    var cg = '<colgroup><col style="width:' + labelCol + 'px">' +
      weeks.map(function () { return '<col style="width:' + weekCol + 'px">'; }).join('') +
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

  function renderPrayerMatrix(rows, opt) {
    opt = opt || {};
    var filtered = rows.filter(function (r) {
      return tv(r.type) === '祷告会' || tv(r.type) === '主日下午';
    });
    var weekMap = {};
    filtered.forEach(function (r) {
      var week = tv(r.week);
      if (!week) return;
      if (tv(r.type) === '祷告会') {
        weekMap[week] = true;
        return;
      }
      if (tv(r.type) === '主日下午' && tv(r.prayerLeader)) {
        weekMap[week] = true;
      }
    });
    var weeks = opt.compact
      ? WEEK_ORDER.filter(function (w) { return weekMap[w]; })
      : WEEK_ORDER.slice();
    if (!weeks.length) weeks = WEEK_ORDER.slice(0, opt.compact ? 1 : WEEK_ORDER.length);
    var cols = getPrayerColumnDefs();
    var rowCol = opt.compact ? (opt.dense ? 92 : 118) : 132;
    var prayerCol = opt.compact ? (opt.dense ? 118 : 152) : 190;

    var cg = '<colgroup><col style="width:' + rowCol + 'px">' +
      cols.map(function () { return '<col style="width:' + prayerCol + 'px">'; }).join('') +
      '</colgroup>';
    var thead = '<thead><tr><th class="cec-corner">第几周</th>' +
      cols.map(function (c) { return '<th class="cec-h">' + esc(c.label) + '</th>'; }).join('') +
      '</tr></thead>';

    var tbody = '<tbody>';
    weeks.forEach(function (w) {
      tbody += '<tr><td class="cec-rowlbl">' + esc(w) + '</td>';
      cols.forEach(function (c) {
        var item = getPrayerCellItem(rows, w, c);
        tbody += renderPrayerCell(item, opt);
      });
      tbody += '</tr>';
    });
    tbody += '</tbody>';

    return '<div class="cec-wrap"><table class="cec-tbl">' + cg + thead + tbody + '</table></div>';
  }

  function renderPrayerCell(item, opt) {
    opt = opt || {};
    if (!item) return '<td class="cec-cell"><span class="cec-empty">—</span></td>';

    var name = tv(item.leader);
    var time = tv(item.time);
    var note = tv(item.note);

    var html = '<td class="cec-cell"><div class="cec-note">';
    if (name) html += mkBadge(name);
    if (time) html += '<span class="cec-npfx">' + esc(time) + '</span>';
    if (note && !opt.compact) html += '<span style="font-size:11px;color:#aeb6c3;line-height:1.3">' + esc(note) + '</span>';
    html += '</div></td>';
    return html;
  }

  function getPrayerColumnDefs() {
    return [
      { subtype: '周三祷告会', label: '周三祷告会', source: 'prayer' },
      { subtype: '周六祷告会', label: '周六祷告会', source: 'prayer' },
      { subtype: '周日下午祷告会', label: '周日下午祷告会', source: 'sunday-afternoon' }
    ];
  }

  function getPrayerCellItem(rows, week, colDef) {
    if (!colDef || !week) return null;

    if (colDef.source === 'sunday-afternoon') {
      var sundayItem = rows.find(function (r) {
        return tv(r.type) === '主日下午' && tv(r.week) === week && tv(r.prayerLeader);
      });
      if (!sundayItem) return null;
      return {
        leader: sundayItem.prayerLeader,
        time: tv(sundayItem.time),
        note: ''
      };
    }

    return rows.find(function (r) {
      return tv(r.type) === '祷告会' && tv(r.week) === week && tv(r.subtype) === colDef.subtype;
    }) || null;
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

  function getVisibleServiceRows(type, filteredRows, opt) {
    var defs = serviceRowsForType(type);
    if (!opt || !opt.trimEmptyRows) return defs;
    var visible = defs.filter(function (def) {
      return filteredRows.some(function (row) { return tv(row[def.key]); });
    });
    return visible.length ? visible : defs;
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
    return '<span class="cec-badge" data-name="' + esc(name) + '" style="background:' + c[0] + ';color:' + c[1] + '"><span class="cec-badge-txt">' + esc(name) + '</span></span>';
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

  function hasTypeRows(rows, type) {
    return rows.some(function (r) { return tv(r.type) === type; });
  }

  function renderTypePill(type) {
    var c = TYPE_C[type] || { bg: '#374151', tx: '#f8fafc' };
    return '<span class="cec-type-pill" style="background:' + esc(c.bg) + ';color:' + esc(c.tx) + '">' + esc(type) + '</span>';
  }

  function renderAllMatrix(rows, types, opt) {
    opt = opt || {};
    types = (types || TYPE_ORDER).filter(function (type) { return hasTypeRows(rows, type); });

    var weekMap = {};
    rows.forEach(function (r) {
      if (types.indexOf(tv(r.type)) >= 0) weekMap[tv(r.week)] = true;
    });
    var weeks = WEEK_ORDER.filter(function (w) { return weekMap[w]; });
    if (!weeks.length) weeks = WEEK_ORDER.slice(0, 1);

    var typeCol = opt.dense ? 94 : 112;
    var labelCol = opt.dense ? 116 : 138;
    var weekCol = opt.dense ? 112 : 132;
    var cg = '<colgroup><col style="width:' + typeCol + 'px"><col style="width:' + labelCol + 'px">' +
      weeks.map(function () { return '<col style="width:' + weekCol + 'px">'; }).join('') +
      '</colgroup>';

    var thead = '<thead><tr><th class="cec-corner">聚会</th><th class="cec-h">项目</th>' +
      weeks.map(function (w) { return '<th class="cec-h">' + esc(w) + '</th>'; }).join('') +
      '</tr></thead>';

    var tbody = '<tbody>';
    types.forEach(function (type) {
      var rowDefs = type === '祷告会'
        ? getPrayerColumnDefs()
        : getVisibleServiceRows(type, rows.filter(function (r) { return tv(r.type) === type; }), opt);

      rowDefs.forEach(function (rowDef, idx) {
        tbody += '<tr>';
        if (idx === 0) {
          tbody += '<td class="cec-rowlbl cec-typecell" rowspan="' + rowDefs.length + '">' + renderTypePill(type) + '</td>';
        }
        tbody += '<td class="cec-rowlbl">' + esc(rowDef.label) + '</td>';

        weeks.forEach(function (w) {
          if (type === '祷告会') {
            var prayerItem = getPrayerCellItem(rows, w, rowDef);
            tbody += renderPrayerCell(prayerItem, { compact: true });
            return;
          }

          var item = rows.find(function (r) {
            return tv(r.type) === type && tv(r.week) === w;
          });
          var val = item ? item[rowDef.key] : '';
          tbody += renderMatrixCell(rowDef.kind, val);
        });

        tbody += '</tr>';
      });
    });
    tbody += '</tbody>';

    return '<div class="cec-wrap"><table class="cec-tbl cec-tbl-all" style="--cec-type-col:' + typeCol + 'px;--cec-label-col:' + labelCol + 'px">' + cg + thead + tbody + '</table></div>';
  }

  function renderExportTypeSection(rows, type, opt) {
    opt = opt || {};
    if (!hasTypeRows(rows, type)) return '';
    var content = type === '祷告会'
      ? renderPrayerMatrix(rows, opt)
      : renderServiceMatrix(rows, type, opt);
    return '<section class="cec-export-panel">' +
      '<div class="cec-export-label"><span class="cec-dot" style="background:' + esc(TYPE_C[type].accent) + '"></span>' + esc(type) + '</div>' +
      content +
      '</section>';
  }

  function renderLandscapePanels(rows, types) {
    var ordered = (types || TYPE_ORDER).filter(function (type) { return hasTypeRows(rows, type); });
    return '<div class="cec-export-grid">' +
      ordered.map(function (type) {
        return renderExportTypeSection(rows, type, { compact: true, dense: true, trimEmptyRows: true });
      }).join('') +
      '</div>';
  }

  function getExportLabel(types) {
    return types.length > 1 ? '全部服事安排' : types[0] + '服事安排';
  }

  function getExportChipCols(exportLabel, ratioKey) {
    return [exportLabel, ratioKey].reduce(function (max, label) {
      return Math.max(max, tv(label).length);
    }, 6);
  }

  function getExportRatioPreset(ratioKey) {
    return EXPORT_RATIO_PRESETS[ratioKey] || EXPORT_RATIO_PRESETS['4:3'];
  }

  function fitExportFrame(card, scaleWrap, viewport, frame) {
    var naturalW = Math.max(1, Math.ceil(card.scrollWidth));
    var naturalH = Math.max(1, Math.ceil(card.scrollHeight));
    var viewportW = Math.max(1, Math.ceil(viewport.clientWidth));

    // Fill width exactly, then grow frame height to show all content — no white borders, no clipping
    var scale = viewportW / naturalW;
    if (!isFinite(scale) || scale <= 0) scale = 1;

    var scaledH = Math.max(1, Math.ceil(naturalH * scale));

    // overhead = stage insets + padding (stays constant, derived from initial frame/viewport sizes)
    if (frame) {
      var overhead = Math.max(0, frame.offsetHeight - viewport.offsetHeight);
      frame.style.height = (scaledH + overhead) + 'px';
    }

    viewport.style.height = scaledH + 'px';
    scaleWrap.style.width = viewportW + 'px';
    scaleWrap.style.height = scaledH + 'px';
    card.style.position = 'absolute';
    card.style.left = '0px';
    card.style.top = '0px';
    card.style.transformOrigin = 'left top';
    card.style.transform = 'scale(' + scale + ')';
  }

  function waitForNodeImages(node) {
    if (!node) return Promise.resolve();
    var imgs = Array.prototype.slice.call(node.querySelectorAll('img'));
    var pending = imgs.filter(function (img) { return !img.complete || !img.naturalWidth; });
    if (!pending.length) return Promise.resolve();

    return Promise.all(pending.map(function (img) {
      return new Promise(function (resolve) {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      });
    }));
  }

  function replaceExportBadgesWithSvg(root) {
    if (!root) return;

    root.querySelectorAll('.cec-badge').forEach(function (badge) {
      var labelEl = badge.querySelector('.cec-badge-txt');
      var label = tv(labelEl ? labelEl.textContent : badge.textContent);
      if (!label) return;

      var badgeCs = getComputedStyle(badge);
      var textCs = getComputedStyle(labelEl || badge);
      var rect = badge.getBoundingClientRect();
      var width = Math.max(1, Math.ceil(rect.width));
      var height = Math.max(1, Math.ceil(rect.height));
      var radius = parseFloat(badgeCs.borderTopLeftRadius) || parseFloat(badgeCs.borderRadius) || 0;
      var fontSize = parseFloat(textCs.fontSize) || parseFloat(badgeCs.fontSize) || 11;
      var fontWeight = textCs.fontWeight || badgeCs.fontWeight || '800';
      var fontFamily = textCs.fontFamily || badgeCs.fontFamily || 'system-ui,sans-serif';
      var bg = badgeCs.backgroundColor || '#4b5563';
      var fg = badgeCs.color || '#f8fafc';
      var svg = [
        '<svg xmlns="http://www.w3.org/2000/svg" width="', width, '" height="', height, '" viewBox="0 0 ', width, ' ', height, '">',
        '<rect x="0" y="0" width="', width, '" height="', height, '" rx="', radius, '" ry="', radius, '" fill="', bg, '"></rect>',
        '<text x="', width / 2, '" y="', height / 2, '" fill="', fg, '" font-size="', fontSize, '" font-weight="', esc(fontWeight), '" font-family="', esc(fontFamily), '" text-anchor="middle" dominant-baseline="central" text-rendering="geometricPrecision">',
        esc(label),
        '</text></svg>'
      ].join('');

      var img = document.createElement('img');
      img.className = 'cec-export-badge-img';
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      img.width = width;
      img.height = height;
      img.style.width = width + 'px';
      img.style.height = height + 'px';
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

      badge.replaceWith(img);
    });
  }

  function buildScheduleExportNode(month, rows, types, ratioKey) {
    var preset = getExportRatioPreset(ratioKey);
    var host = document.createElement('div');
    host.className = 'cec-export-shot';

    var frame = document.createElement('div');
    frame.className = 'cec-export-frame ' + preset.frameClass;
    frame.style.width = preset.width + 'px';
    frame.style.height = preset.height + 'px';

    var stage = document.createElement('div');
    stage.className = 'cec-export-stage';

    var viewport = document.createElement('div');
    viewport.className = 'cec-export-viewport';

    var scaleWrap = document.createElement('div');
    scaleWrap.className = 'cec-export-scale';

    var card = document.createElement('div');
    card.className = 'cec-export-card';
    if (types.length > 1) card.classList.add('is-all-export');

    var head = document.createElement('div');
    head.className = 'cec-export-head';
    var exportLabel = getExportLabel(types);
    var chipCols = getExportChipCols(exportLabel, ratioKey);
    head.innerHTML =
      '<div class="cec-export-head-left">' +
      '<div class="cec-export-eyebrow">主日事工表 · Service Schedule</div>' +
      '<div class="cec-export-month">' + esc(month) + '</div>' +
      '</div>' +
      '<div class="cec-export-meta" style="--cec-export-chip-cols:' + chipCols + '">' +
      '<span class="cec-export-chip">' + esc(exportLabel) + '</span>' +
      '<span class="cec-export-chip is-ratio">' + esc(ratioKey) + '</span>' +
      '</div>';
    card.appendChild(head);

    var bodyWrap = document.createElement('div');
    bodyWrap.className = 'cec-export-body';

    if (types.length > 1) {
      if (ratioKey === '16:9') {
        bodyWrap.innerHTML = renderLandscapePanels(rows, types);
      } else {
        bodyWrap.innerHTML = renderAllMatrix(rows, types, { trimEmptyRows: true });
      }
    } else {
      var type = types[0];
      var section = document.createElement('section');
      section.className = ratioKey === '16:9' ? 'cec-export-panel' : 'cec-export-section';

      var sectionLabel = document.createElement('div');
      sectionLabel.className = 'cec-export-label';
      sectionLabel.innerHTML = '<span class="cec-dot" style="background:' + esc(TYPE_C[type].accent) + '"></span>' + esc(type);
      section.appendChild(sectionLabel);

      if (!hasTypeRows(rows, type)) {
        var empty = document.createElement('div');
        empty.className = 'cec-export-empty';
        empty.textContent = '本月暂无安排';
        section.appendChild(empty);
      } else {
        var body = document.createElement('div');
        body.innerHTML = type === '祷告会'
          ? renderPrayerMatrix(rows, { compact: true, dense: ratioKey === '16:9' })
          : renderServiceMatrix(rows, type, { compact: true, dense: ratioKey === '16:9', trimEmptyRows: true });
        while (body.firstChild) section.appendChild(body.firstChild);
      }

      bodyWrap.appendChild(section);
    }

    card.appendChild(bodyWrap);
    scaleWrap.appendChild(card);
    viewport.appendChild(scaleWrap);
    stage.appendChild(viewport);
    frame.appendChild(stage);
    host.appendChild(frame);
    document.body.appendChild(host);

    replaceExportBadgesWithSvg(card);
    fitExportFrame(card, scaleWrap, viewport, frame);

    return {
      node: frame,
      fit: function () { fitExportFrame(card, scaleWrap, viewport, frame); },
      cleanup: function () { host.remove(); }
    };
  }

  function waitPaint2() {
    return new Promise(function (resolve) {
      requestAnimationFrame(function () {
        requestAnimationFrame(resolve);
      });
    });
  }

  function safeFileName(name) {
    return String(name || 'service-schedule')
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, '_')
      .replace(/\.+$/g, '')
      .slice(0, 100) || 'service-schedule';
  }

  var _cecH2cPromise = null;
  function loadHtml2Canvas() {
    if (window.html2canvas) return Promise.resolve(window.html2canvas);
    if (_cecH2cPromise) return _cecH2cPromise;

    _cecH2cPromise = new Promise(function (resolve, reject) {
      function inject(src, next) {
        var s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = function () {
          if (window.html2canvas) resolve(window.html2canvas);
          else if (next) inject(next, null);
          else reject(new Error('html2canvas unavailable'));
        };
        s.onerror = function () {
          s.remove();
          if (next) inject(next, null);
          else reject(new Error('html2canvas load failed'));
        };
        document.head.appendChild(s);
      }

      inject(
        'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
        'https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js'
      );
    });

    return _cecH2cPromise;
  }

  function canvasToPngBlob(canvas) {
    return new Promise(function (resolve, reject) {
      if (canvas.toBlob) {
        canvas.toBlob(function (blob) {
          if (blob) resolve(blob);
          else reject(new Error('png conversion failed'));
        }, 'image/png');
      } else {
        try {
          var dataUrl = canvas.toDataURL('image/png');
          var bin = atob(dataUrl.split(',')[1] || '');
          var arr = new Uint8Array(bin.length);
          for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
          resolve(new Blob([arr], { type: 'image/png' }));
        } catch (err) {
          reject(err);
        }
      }
    });
  }

  function nodeToPngBlobByHtml2Canvas(node, bgColor) {
    return loadHtml2Canvas()
      .then(function (html2canvas) {
        var dpr = Math.max(1, window.devicePixelRatio || 1);
        return html2canvas(node, {
          backgroundColor: bgColor || '#f4f6f9',
          scale: Math.min(2, dpr),
          foreignObjectRendering: false,
          useCORS: true,
          logging: false
        });
      })
      .then(canvasToPngBlob);
  }

  function cloneWithComputedStyle(node) {
    var cloned = node.cloneNode(true);

    function sync(src, dst) {
      if (!src || !dst) return;
      if (src.nodeType === 1 && dst.nodeType === 1) {
        var cs = getComputedStyle(src);
        for (var i = 0; i < cs.length; i++) {
          var prop = cs[i];
          dst.style.setProperty(prop, cs.getPropertyValue(prop), cs.getPropertyPriority(prop));
        }
      }
      var sKids = src.childNodes || [];
      var dKids = dst.childNodes || [];
      for (var k = 0; k < sKids.length; k++) {
        if (dKids[k]) sync(sKids[k], dKids[k]);
      }
    }

    sync(node, cloned);
    return cloned;
  }

  function nodeToPngBlob(node, bgColor) {
    return new Promise(function (resolve, reject) {
      if (!node) {
        reject(new Error('empty node'));
        return;
      }

      var rect = node.getBoundingClientRect();
      var width = Math.max(1, Math.ceil(rect.width));
      var height = Math.max(1, Math.ceil(rect.height));
      var snap = cloneWithComputedStyle(node);
      snap.style.width = width + 'px';
      snap.style.maxWidth = 'none';

      var html = new XMLSerializer().serializeToString(snap);
      var bg = bgColor || '#f4f6f9';
      var foreign = [
        '<div xmlns="http://www.w3.org/1999/xhtml" style="width:' + width + 'px;height:' + height + 'px;background:' + bg + ';">',
        html,
        '</div>'
      ].join('');
      var svg = [
        '<svg xmlns="http://www.w3.org/2000/svg" width="', width, '" height="', height, '" viewBox="0 0 ', width, ' ', height, '">',
        '<foreignObject width="100%" height="100%">', foreign, '</foreignObject>',
        '</svg>'
      ].join('');

      var svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      var svgUrl = URL.createObjectURL(svgBlob);
      var img = new Image();

      img.onload = function () {
        URL.revokeObjectURL(svgUrl);
        var maxSide = 4096;
        var scale = Math.min(2, maxSide / width, maxSide / height);
        if (!isFinite(scale) || scale <= 0) scale = 1;

        var canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));

        var ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('canvas unavailable'));
          return;
        }

        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.drawImage(img, 0, 0, width, height);
        canvasToPngBlob(canvas).then(resolve).catch(reject);
      };
      img.onerror = function () {
        URL.revokeObjectURL(svgUrl);
        reject(new Error('svg render failed'));
      };
      img.src = svgUrl;
    });
  }

  function nodeToPngBlobRobust(node, bgColor) {
    return nodeToPngBlobByHtml2Canvas(node, bgColor).catch(function (html2canvasErr) {
      try { console.warn('[service-schedule] html2canvas export failed, fallback to svg', html2canvasErr); } catch (_) {}
      return nodeToPngBlob(node, bgColor);
    });
  }

  function saveBlobAs(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 800);
  }

  function exportScheduleAsImage(month, rows, types, ratioKey) {
    if (!types || !types.length) return Promise.reject(new Error('no export types'));

    var preset = getExportRatioPreset(ratioKey);
    var bg = '#eef4ff';
    var waitFonts = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();

    return waitFonts.then(function () {
      var snap = buildScheduleExportNode(month, rows, types, ratioKey);
      return waitPaint2()
        .then(function () { return waitForNodeImages(snap.node); })
        .then(function () {
          snap.fit();
          return waitPaint2();
        })
        .then(function () { return nodeToPngBlobRobust(snap.node, bg); })
        .then(function (blob) {
          var suffix = types.length > 1 ? '全部服事安排' : types[0] + '_服事安排';
          saveBlobAs(blob, safeFileName(month + '_' + suffix + '_' + preset.fileTag) + '.png');
        })
        .finally(function () {
          snap.cleanup();
        });
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
