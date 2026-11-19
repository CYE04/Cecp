/**
 * service-schedule.js
 * 年份安全版 + 同名高亮恢复
 */
(function () {
  'use strict';

  var EL = document.getElementById('cecp-schedule');
  if (!EL) return;

  var SHEET_ID = '1o0FkHnVtvKCZwjIhzPEHSEW-3oZeNsJnh68Qs3GU0TQ';
  var NEW_API = 'https://script.google.com/macros/s/AKfycbxJaY7RxxThCIGMeuxnlPW7diAJs0M34b5lK8Qn_CzxbIbCZY3AeuYKJadPF8gsLpvK/exec';
  var OLD_API = 'https://script.google.com/macros/s/AKfycbzGQA4R7AFyCOnWX6E74WpnZkF1z_im2DD3sX_bmTCzhW9FVu_Wl77AmPT6GaWfP2nX/exec';
  var rawApi = (EL.dataset.api || '').trim();
  var API = (!rawApi || rawApi.indexOf('AKfycbzGQA4R7AFyCOnWX6E74WpnZkF1z_im2DD3sX_bmTCzhW9FVu_Wl77AmPT6GaWfP2nX') >= 0)
    ? NEW_API
    : rawApi;
  var LOGO_SRC = (function () {
    try {
      var cur = document.currentScript && document.currentScript.src ? new URL(document.currentScript.src, location.href) : null;
      return cur ? new URL('musiclib/olive-fellowship-logo.png', cur.href).href : 'musiclib/olive-fellowship-logo.png';
    } catch (_) {
      return 'musiclib/olive-fellowship-logo.png';
    }
  })();

  var TYPE_ORDER = ['主日下午', '主日晚上', '青年团契', '祷告会'];
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
  // 导出清晰度：目标 3x，并按 canvas 单边安全上限做 clamp（保守取 8192px）
  // 注意：必须放在 IIFE 顶部（下方有 early return，晚声明的 var 赋值不会执行）
  var EXPORT_MAX_CANVAS_SIDE = 8192;

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

  // 导出用淡彩色板：与 PAL 同索引同色系（浅底 / 同色系深字 / 描边），保证同一个人页面内外颜色对应
  var PAL_SOFT = [
    ['#eaf1f9','#35567c','#d3e1f0'],['#e6f4f1','#23685c','#cfe7e1'],['#f6edec','#7a4a42','#e8d5d2'],['#ecf2f7','#3d5a74','#d7e3ee'],
    ['#f0f5e8','#4f6a2a','#dde9c9'],['#f8f0e5','#7a5626','#ecdcc4'],['#f1edfa','#5b4494','#ded3f2'],['#f9eef6','#85436f','#eed6e6'],
    ['#e9f3fb','#2c587a','#d2e6f5'],['#eaf6ea','#2f6b33','#d2ead3'],['#faeded','#8a4040','#f0d6d6'],['#f8f4e2','#74622a','#eae0bd'],
    ['#eef1f5','#46566a','#dbe2ea'],['#e7f5f9','#22606f','#cfe9f0'],['#f8f1e7','#6f5426','#ecdec9'],['#f0edf9','#55447e','#dfd6f1'],
    ['#ebf6ec','#38663e','#d5ead6'],['#faf1e4','#7d5a23','#f0dfc3'],['#f9eef2','#7d4258','#eed7df'],['#e8f4f2','#2b5f58','#d0e8e4']
  ];

  var lockedName = null;
  var hiddenRoles = readHiddenRoles();

  function readHiddenRoles() {
    try {
      var raw = localStorage.getItem('cecp-schedule-hidden-roles');
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch (_) {
      return [];
    }
  }

  function writeHiddenRoles(list) {
    hiddenRoles = Array.isArray(list) ? list : [];
    try { localStorage.setItem('cecp-schedule-hidden-roles', JSON.stringify(hiddenRoles)); } catch (_) {}
  }

  function isRoleHidden(key) {
    return hiddenRoles.indexOf(key) >= 0;
  }

  function toggleRoleHidden(key) {
    if (!key) return;
    var next = hiddenRoles.slice();
    var idx = next.indexOf(key);
    if (idx >= 0) next.splice(idx, 1);
    else next.push(key);
    writeHiddenRoles(next);
  }

  function eyeIconSvg(off) {
    if (off) {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10.7 10.7 0 0 1 12 5c5 0 9.3 3.1 11 7.5a11.8 11.8 0 0 1-4 5.2M6.6 6.6A11.8 11.8 0 0 0 1 12.5C2.7 16.9 7 20 12 20c1.8 0 3.5-.4 5-1.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
  }

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
html.dark{
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
  position:absolute;right:0;top:calc(100% + 8px);z-index:20;display:flex;flex-direction:column;
  min-width:296px;padding:10px;border:1px solid var(--cec-border);border-radius:14px;
  background:var(--cec-bg2);box-shadow:0 18px 36px rgba(18,24,38,.16);
  opacity:0;visibility:hidden;pointer-events:none;
  transform:translateY(-8px) scale(.96);transform-origin:top right;
  transition:opacity .18s cubic-bezier(.22,1,.36,1),transform .22s cubic-bezier(.16,1,.3,1),visibility 0s linear .22s;
}
.cec-export-wrap.open .cec-menu{
  opacity:1;visibility:visible;pointer-events:auto;
  transform:translateY(0) scale(1);
  transition:opacity .18s cubic-bezier(.22,1,.36,1),transform .24s cubic-bezier(.16,1,.3,1),visibility 0s linear 0s;
}
.cec-menu-title{
  padding:6px 8px 10px;color:var(--cec-ink3);font-size:12px;font-weight:700;letter-spacing:.02em;
}
.cec-menu-divider{
  margin:8px 4px;border-top:1px solid var(--cec-border);
}
.cec-ratio-bar{
  display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:0 4px 4px;
}
.cec-ratio-item{
  min-height:38px;padding:0 12px;border-radius:10px;border:1px solid var(--cec-border);
  background:var(--cec-bg3);color:var(--cec-ink2);font-size:12.5px;font-weight:800;white-space:nowrap;
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
}
.cec-tbl th{vertical-align:middle}
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
  padding:14px 10px 14px 12px;
  vertical-align:middle;
  white-space:nowrap;
}
.cec-rowlbl-inner{
  display:flex;align-items:center;justify-content:space-between;gap:6px;width:100%;
}
.cec-rowlbl-text{min-width:0;overflow:hidden;text-overflow:ellipsis}
.cec-row-hide{
  width:22px;height:22px;padding:0;border-radius:6px;flex:none;
  background:transparent;color:var(--cec-ink3);opacity:.35;
}
.cec-tbl tr:hover .cec-row-hide,.cec-detail:hover .cec-row-hide{opacity:.75}
.cec-row-hide:hover{opacity:1!important;background:var(--cec-hover);color:var(--cec-ink)}
.cec-row-hide svg{width:13px;height:13px;display:block}
.cec-role-wrap{position:relative}
.cec-role-menu{
  position:absolute;right:0;top:calc(100% + 8px);z-index:25;display:flex;flex-direction:column;
  min-width:210px;max-height:340px;overflow-y:auto;padding:8px;border:1px solid var(--cec-border);
  border-radius:14px;background:var(--cec-bg2);box-shadow:0 18px 36px rgba(18,24,38,.16);
  opacity:0;visibility:hidden;pointer-events:none;
  transform:translateY(-8px) scale(.96);transform-origin:top right;
  transition:opacity .18s cubic-bezier(.22,1,.36,1),transform .22s cubic-bezier(.16,1,.3,1),visibility 0s linear .22s;
}
.cec-role-wrap.open .cec-role-menu{
  opacity:1;visibility:visible;pointer-events:auto;
  transform:translateY(0) scale(1);
  transition:opacity .18s cubic-bezier(.22,1,.36,1),transform .24s cubic-bezier(.16,1,.3,1),visibility 0s linear 0s;
}
.cec-role-item{
  width:100%;min-height:36px;padding:0 10px;border-radius:9px;border:1px solid transparent;
  background:transparent;color:var(--cec-ink);justify-content:space-between;font-size:12px;font-weight:700;gap:8px;
}
.cec-role-item:hover{background:var(--cec-hover);border-color:var(--cec-border)}
.cec-role-item.is-hidden{color:var(--cec-ink3);opacity:.65}
.cec-role-item-left{display:inline-flex;align-items:center;gap:7px}
.cec-role-item svg{width:14px;height:14px;flex:none}
.cec-hidden-bar{
  display:flex;align-items:center;gap:6px;flex-wrap:wrap;
  padding:8px 12px;background:var(--cec-bg3);border-bottom:1px solid var(--cec-border);
  font-size:12px;color:var(--cec-ink2);
}
.cec-hidden-lbl{font-weight:700;color:var(--cec-ink3);margin-right:2px}
.cec-hidden-chip{
  height:26px;padding:0 10px;border-radius:999px;border:1px solid var(--cec-border);
  background:var(--cec-bg2);color:var(--cec-ink);font-size:12px;font-weight:700;gap:5px;
}
.cec-hidden-chip:hover{background:var(--cec-hover);border-color:var(--cec-active-border)}
.cec-hidden-chip svg{width:13px;height:13px;color:var(--cec-ink3)}
.cec-hidden-reset{
  height:26px;padding:0 10px;border-radius:999px;border:1px dashed var(--cec-active-border);
  background:transparent;color:var(--cec-ink2);font-size:12px;font-weight:700;
}
.cec-hidden-reset:hover{background:var(--cec-hover);color:var(--cec-ink)}
.cec-cell{
  min-width:140px;height:82px;padding:10px;
  vertical-align:top;text-align:center;background:var(--cec-bg);
}
.cec-cell:hover{background:var(--cec-bg2)}
.cec-cellbox{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:6px;width:100%;height:100%;min-height:56px;
}
.cec-empty{color:var(--cec-ink4);font-size:14px}
.cec-badges{
  display:flex;flex-wrap:wrap;justify-content:center;align-items:center;
  gap:8px;width:100%;
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
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;width:100%;
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
  background:#ffffff;color:#1c2330;
}
.cec-export-frame,
.cec-export-frame *{
  text-shadow:none!important;
}
.cec-export-watermark{
  position:absolute;left:50%;top:52%;width:72%;max-width:960px;
  transform:translate(-50%,-50%);opacity:.03;pointer-events:none;z-index:0;
}
.cec-export-stage{
  position:absolute;inset:20px;padding:16px 24px 16px 16px;border-radius:0;overflow:visible;
  background:transparent;border:0;box-shadow:none;z-index:1;
}
.cec-export-frame.is-r16x9 .cec-export-stage{inset:16px;padding:14px 22px 14px 14px}
.cec-export-viewport{
  position:relative;width:100%;height:100%;overflow:visible;
}
.cec-export-scale{
  position:relative;width:100%;height:100%;
}
.cec-export-card{
  --cec-bg:#f4f6f9;
  --cec-bg2:#ffffff;
  --cec-bg3:#f0f2f6;
  --cec-btn-bg:#eaecf1;
  --cec-border:#e2e8f0;
  --cec-border2:#e2e8f0;
  --cec-ink:#141820;
  --cec-ink2:#4b5568;
  --cec-ink3:#7c879b;
  --cec-ink4:#94a3b8;
  --cec-ref:#2d4f85;
  --cec-npfx:#5b677a;
  width:max-content;max-width:none;min-width:0;padding:0;
  border-radius:16px;border:1px solid #dfe5ef;
  background:#ffffff;
  box-shadow:0 10px 30px rgba(15,23,42,.06);
  overflow:hidden;
  color:var(--cec-ink);
  font-family:"PingFang SC","Noto Sans SC","Microsoft YaHei",system-ui,sans-serif;
  font-variant-numeric:tabular-nums;
}
.cec-export-head{
  display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;
  margin:0;padding:26px 32px 22px;
  background:linear-gradient(180deg,#ffffff 0%,#fafbfd 100%);
  border-bottom:1.5px solid #e6ebf3;
}
.cec-export-head-left{display:flex;flex-direction:column;gap:6px}
.cec-export-eyebrow{
  font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#8894a8;
}
.cec-export-month{font-size:38px;font-weight:800;letter-spacing:.01em;line-height:1.1;color:#111827}
.cec-export-meta{
  display:flex;align-items:center;justify-content:flex-end;gap:10px;
}
.cec-export-chip{
  display:inline-flex;align-items:center;justify-content:center;
  height:30px;padding:0 12px;border-radius:999px;
  border:1px solid #e2e8f0;background:#f8fafc;
  color:#475569;font-size:12px;font-weight:700;letter-spacing:.04em;
}
.cec-export-chip.is-ratio{
  border-color:#d5e0f2;background:#f0f5ff;color:#2d4f85;font-weight:800;
}
.cec-export-sub{
  font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--cec-ink3);
}
.cec-export-body{background:var(--cec-bg2)}
.cec-export-card *{box-sizing:border-box}
.cec-export-grid{
  display:flex;align-items:flex-start;gap:14px;padding:16px;
  background:#f8fafc;
}
.cec-export-col{
  display:flex;flex-direction:column;gap:14px;flex:0 1 auto;min-width:0;
}
.cec-export-panel{
  display:flex;flex-direction:column;overflow:hidden;border:1px solid #dfe5ef;
  border-radius:12px;background:#ffffff;box-shadow:0 2px 8px rgba(15,23,42,.03);
}
.cec-export-section{
  margin:16px;border:1px solid #dfe5ef;border-radius:12px;overflow:hidden;background:#ffffff;
}
.cec-export-label{
  display:flex;align-items:center;gap:10px;padding:12px 18px;
  border-bottom:1px solid #e6ebf3;background:#f8fafc;
  font-size:15px;font-weight:800;color:#1e293b;letter-spacing:.02em;
}
.cec-export-label .cec-dot{width:8px;height:8px;border-radius:50%;background:#3e5c8f!important}
.cec-export-empty{
  padding:20px 18px;color:var(--cec-ink2);font-size:13px;font-weight:700;text-align:center;
}
.cec-export-card .cec-wrap{overflow:visible;background:transparent}
.cec-export-card .cec-tbl{min-width:0;width:max-content;border-collapse:collapse;table-layout:fixed}
.cec-export-badge-img{
  display:block;flex:0 0 auto;overflow:visible;
}
.cec-export-card .cec-corner,
.cec-export-card .cec-h{
  position:static;padding:11px 10px;background:#f8fafc;color:#475569;
  font-size:13px;font-weight:800;text-align:center;vertical-align:middle;
  border-bottom:1.5px solid #e2e8f0;
}
.cec-export-card .cec-corner{
  text-align:left;padding-left:16px;color:#64748b;
}
.cec-export-card .cec-date{
  display:block;margin-top:3px;font-size:11px;font-weight:600;color:#8894a8;
}
.cec-export-card .cec-rowlbl{
  padding:10px 16px;background:#ffffff;font-size:13px;font-weight:800;line-height:1.25;
  color:#1e293b;text-align:left;vertical-align:middle;border-right:1px solid #e9edf3;
}
.cec-export-card .cec-rowlbl-inner{
  justify-content:flex-start;
}
.cec-export-card .cec-cell{
  min-width:138px;height:68px;padding:8px 10px;background:#ffffff;vertical-align:middle;
}
.cec-export-card .cec-cellbox{
  min-height:50px;gap:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;
}
.cec-export-card tbody tr:nth-child(2n) .cec-rowlbl,
.cec-export-card tbody tr:nth-child(2n) .cec-cell{background:#fafbfd}
.cec-export-card .cec-cell:hover{background:#ffffff}
.cec-export-card .cec-cell,
.cec-export-card .cec-empty,
.cec-export-card .cec-note,
.cec-export-card .cec-reading{
  text-align:center;
}
.cec-export-card .cec-badges{
  gap:6px;justify-content:center;align-items:center;align-content:center;
}
.cec-export-card .cec-badge{
  display:inline-flex;box-sizing:border-box;
  min-height:30px;padding:5px 12px;border-radius:8px;
  font-size:12px;font-weight:800;line-height:1.2;letter-spacing:.01em;text-align:center;
  justify-content:center;align-items:center;vertical-align:middle;
  white-space:nowrap;
}
.cec-export-card .cec-badge-txt{
  min-height:auto;line-height:1.2;transform:none;display:inline-flex;align-items:center;justify-content:center;
}
.cec-export-card .cec-note,
.cec-export-card .cec-reading{
  gap:5px;justify-content:center;align-items:center;align-content:center;
}
.cec-export-card .cec-ref,
.cec-export-card .cec-npfx,
.cec-export-card .cec-empty{
  display:block;width:100%;text-align:center;
}
.cec-export-card .cec-ref{font-size:12px;font-weight:700;color:#2d4f85}
.cec-export-card .cec-npfx{font-size:11px;font-weight:600;color:#64748b}
.cec-export-card .cec-empty{font-size:12px;color:#cbd5e1}
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
  display:flex;width:100%;max-width:100%;
}
.cec-export-card .cec-type-pill{
  background:#f4f6fa!important;color:#3e4a5e!important;border:1px solid #e2e7ef;
}
.cec-export-card .cec-tbl-all .cec-typecell{background:#fbfcfd}
.cec-export-frame.is-r16x9 .cec-export-head{
  padding:20px 26px 16px;
}
.cec-export-frame.is-r16x9 .cec-export-month{font-size:32px}
.cec-export-frame.is-r16x9 .cec-export-grid{
  gap:12px;padding:14px;
}
.cec-export-frame.is-r16x9 .cec-export-section{
  margin:14px;
}
.cec-export-frame.is-r16x9 .cec-export-col{gap:12px}
.cec-export-frame.is-r16x9 .cec-export-panel{
  border-radius:12px;
}
.cec-export-frame.is-r16x9 .cec-export-label{
  padding:10px 16px;font-size:13px;
}
.cec-export-frame.is-r16x9 .cec-export-card .cec-corner,
.cec-export-frame.is-r16x9 .cec-export-card .cec-h{
  padding:9px 8px;font-size:12px;
}
.cec-export-frame.is-r16x9 .cec-export-card .cec-corner{
  padding-left:14px;
}
.cec-export-frame.is-r16x9 .cec-export-card .cec-rowlbl{
  padding:8px 14px;font-size:11.5px;
}
.cec-export-frame.is-r16x9 .cec-tbl-all .cec-typecell{
  padding:8px 10px;
}
.cec-export-frame.is-r16x9 .cec-export-card .cec-cell{
  min-width:118px;height:52px;padding:5px 6px;
}
.cec-export-frame.is-r16x9 .cec-export-card .cec-cellbox{
  min-height:40px;gap:4px;
}
.cec-export-frame.is-r16x9 .cec-export-card .cec-badges{
  gap:5px;
}
.cec-export-frame.is-r16x9 .cec-export-card .cec-badge{
  min-height:24px;padding:4px 10px;border-radius:7px;
  font-size:10px;line-height:1.15;
}
.cec-export-frame.is-r16x9 .cec-export-card .cec-badge-txt{
  line-height:1.15;transform:none;
}
.cec-export-frame.is-r16x9 .cec-export-card .cec-note,
.cec-export-frame.is-r16x9 .cec-export-card .cec-reading{
  gap:4px;
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
.cec-zoombar{
  display:none;padding:8px 12px;
  border-bottom:1px solid var(--cec-border2);background:var(--cec-bg3);
}
.cec-btn-zoom{
  width:100%;height:36px;gap:8px;padding:0 14px;border-radius:10px;
  border:1px solid var(--cec-border);background:var(--cec-btn-bg);
  color:var(--cec-ink2);font-size:13px;font-weight:700;
}
.cec-btn-zoom:hover{background:var(--cec-hover);color:var(--cec-ink)}
.cec-btn-zoom-icon{width:16px;height:16px;flex-shrink:0}
.cec-zoom-mask{
  position:fixed;inset:0;z-index:9999;background:rgba(10,13,18,.72);
  -webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);
}
.cec-zoom-panel{
  position:absolute;inset:10px;display:flex;flex-direction:column;overflow:hidden;
  border:1px solid var(--cec-border);border-radius:16px;background:var(--cec-bg);
  font-family:"PingFang SC","Noto Sans SC","Microsoft YaHei",system-ui,sans-serif;
}
.cec-zoom-panel *{box-sizing:border-box}
.cec-zoom-head{
  display:flex;align-items:center;justify-content:space-between;gap:10px;
  padding:10px 12px;border-bottom:1px solid var(--cec-border2);background:var(--cec-bg2);
}
.cec-zoom-title{font-size:14px;font-weight:800;color:var(--cec-ink)}
.cec-zoom-hint{margin-top:2px;font-size:11px;color:var(--cec-ink3)}
.cec-zoom-close{
  width:34px;height:34px;flex:0 0 auto;border-radius:50%;
  border:1px solid var(--cec-border);background:var(--cec-btn-bg);
  color:var(--cec-ink2);font-size:15px;font-weight:800;
}
.cec-zoom-close:hover{background:var(--cec-hover);color:var(--cec-ink)}
.cec-zoom-scroll{
  flex:1;overflow:auto;-webkit-overflow-scrolling:touch;
  touch-action:pan-x pan-y;background:var(--cec-bg);
}
.cec-zoom-spacer{position:relative;margin:0 auto}
.cec-zoom-body{
  position:absolute;left:0;top:0;padding:12px;width:max-content;
  transform-origin:0 0;
}
.cec-zoom-body .cec-tbl{min-width:0;width:max-content}
.cec-zoom-body .cec-corner,
.cec-zoom-body .cec-h{position:static;padding:14px 10px;font-size:13px}
.cec-zoom-body .cec-rowlbl{padding:14px 12px;font-size:14px}
.cec-zoom-body .cec-cell{min-width:150px;height:88px;padding:10px}
.cec-zoom-body .cec-cellbox{min-height:60px}
.cec-zoom-body .cec-badges{gap:8px}
.cec-zoom-body .cec-badge{font-size:13px;padding:7px 13px;min-height:34px}
.cec-zoom-body .cec-ref{font-size:13px}
.cec-zoom-body .cec-npfx{font-size:12px}
.cec-zoom-body .cec-empty{font-size:14px}
@media(max-width:760px){
  .cec-menu{left:auto;right:0;min-width:0;width:min(280px,calc(100vw - 40px))}
  .cec-ratio-bar{grid-template-columns:repeat(2,minmax(0,1fr))}
  .cec-cell{min-width:120px;height:74px;padding:8px}
  .cec-corner,.cec-h,.cec-rowlbl{padding:10px 8px}
  .cec-badges{gap:6px}
  .cec-badge{font-size:10px;padding:5px 10px}
  .cec-zoombar{display:flex}
  }
#cecp-schedule{min-width:0;container-type:inline-size;container-name:cecp-schedule}
#cecp-schedule .cec-btn:focus-visible,#cecp-schedule select:focus-visible,.cec-preview button:focus-visible{outline:2px solid var(--cec-ref);outline-offset:2px}
.cec-controls{display:flex;gap:10px;flex-wrap:wrap;padding:12px;background:var(--cec-bg2);border-bottom:1px solid var(--cec-border)}
.cec-week-controls,.cec-view-controls,.cec-person-controls{display:flex;align-items:center;gap:6px;min-width:0}
.cec-person-controls{margin-left:auto}
.cec-control{min-height:40px;padding:8px 12px;border:1px solid var(--cec-border);border-radius:9px;background:var(--cec-btn-bg);color:var(--cec-ink2);font-size:13px;font-weight:700}
.cec-control.on{background:var(--cec-active);border-color:var(--cec-active-border);color:var(--cec-ink)}
.cec-controls select{min-width:0;max-width:100%;height:40px;padding:0 8px;border:1px solid var(--cec-border);border-radius:9px;background:var(--cec-bg);color:var(--cec-ink);font:inherit;font-size:13px}
.cec-chevron{display:block;width:16px;height:16px;flex:none}
.cec-label-short{display:none}
.cec-week-picker{display:grid;grid-template-columns:36px minmax(0,1fr) 36px;align-items:center;min-width:0;border:1px solid var(--cec-border);border-radius:9px;background:var(--cec-bg);overflow:hidden}
.cec-week-picker #scheduleWeek{border:0;border-radius:0;text-align:center;text-align-last:center;appearance:none;padding:0 3px;width:100%;height:38px}
.cec-week-arrow{width:36px;height:38px;background:transparent;color:var(--cec-ink2)}
.cec-week-arrow:hover{background:var(--cec-hover)}
.cec-btn:disabled{cursor:default}
.cec-date{display:block;margin-top:5px;font-size:11px;font-weight:500;color:var(--cec-ink3)}
.cec-view-caption{padding:12px 16px 0;color:var(--cec-ink2);font-size:13px;line-height:1.5}
.cec-cards{display:grid;gap:14px;padding:14px;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));align-items:start}
.cec-week-card{min-width:0;border:1px solid var(--cec-border);border-radius:12px;overflow:hidden;background:var(--cec-bg2)}
.cec-card-head{padding:14px 16px;background:var(--cec-bg3);border-bottom:1px solid var(--cec-border)}
.cec-card-head h3{margin:0;font-size:16px;line-height:1.5;color:var(--cec-ink);font-weight:800}
.cec-card-head p{margin:4px 0 0;font-size:12px;line-height:1.5;color:var(--cec-ink2)}
.cec-week-card dl{margin:0;padding:0 14px}
.cec-detail{display:grid;grid-template-columns:88px minmax(0,1fr);gap:10px;align-items:center;min-height:52px;padding:10px 0;border-bottom:1px solid var(--cec-border)}
.cec-detail:last-child{border-bottom:0}
.cec-detail-label{font-size:12px;font-weight:700;line-height:1.6;color:var(--cec-ink2);overflow-wrap:anywhere}
.cec-detail-value{min-width:0;margin:0;text-align:left;overflow-wrap:anywhere;color:var(--cec-ink)}
.cec-detail-value .cec-cellbox{min-height:0;align-items:flex-start;height:auto;gap:5px}
.cec-detail-value .cec-badges,.cec-detail-value .cec-note,.cec-detail-value .cec-reading{justify-content:flex-start;align-items:flex-start;gap:5px}
.cec-detail-value .cec-note,.cec-detail-value .cec-reading{flex-direction:row;flex-wrap:wrap;align-items:center}
.cec-detail-value .cec-badge{max-width:100%;min-height:30px;font-size:12px;padding:6px 9px;white-space:normal;overflow-wrap:anywhere}
.cec-detail-value .cec-badge-txt{white-space:normal;overflow-wrap:anywhere;display:block}
.cec-card-empty{padding:26px 12px;text-align:center;color:var(--cec-ink2);font-size:14px;line-height:1.8}
.cec-preview-mask{position:fixed;inset:0;z-index:10000;background:rgba(10,13,18,.72);padding:16px;display:flex;align-items:center;justify-content:center;font-family:"PingFang SC","Noto Sans SC",system-ui,sans-serif}
.cec-preview-mask *{box-sizing:border-box}
.cec-preview{width:720px;max-width:100%;max-height:calc(100dvh - 32px);overflow:auto;border-radius:14px;background:var(--cec-bg);color:var(--cec-ink);outline:none}
.cec-preview-toolbar,.cec-preview-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:12px 16px;background:var(--cec-bg2);position:sticky;z-index:1;top:0}
.cec-preview-actions{top:auto;bottom:0;border-top:1px solid var(--cec-border);font-size:12px;color:var(--cec-ink2)}
.cec-share-sheet{--cec-bg:#f4f6f9;--cec-bg2:#fff;--cec-bg3:#f8fafc;--cec-border:#dfe5ef;--cec-ink:#141820;--cec-ink2:#4b5568;--cec-ref:#1a7a3c;--cec-npfx:#7a5500;background:#fff;color:#141820;padding:24px 26px;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}
.cec-share-sheet h2{font-size:24px;font-weight:800;line-height:1.3;margin:0 0 4px;color:#111827}
.cec-share-sheet>p{font-size:13px;font-weight:600;margin:0;color:#64748b}
.cec-share-sheet .cec-cards{padding:18px 0 14px;grid-template-columns:1fr;gap:14px}
.cec-share-sheet .cec-week-card{border:1px solid #dfe5ef;border-radius:12px;box-shadow:0 2px 8px rgba(15,23,42,.03)}
.cec-share-sheet .cec-card-head{display:flex;align-items:baseline;justify-content:space-between;padding:12px 16px;background:#f8fafc;border-bottom:1px solid #dfe5ef}
.cec-share-sheet .cec-detail{grid-template-columns:104px minmax(0,1fr);gap:12px;min-height:48px;padding:9px 0;border-bottom:1px solid #edf1f7}
.cec-share-sheet .cec-detail-label{font-size:12.5px;font-weight:800;color:#334155}
.cec-share-sheet .cec-share-foot{font-size:11px;font-weight:600;color:#94a3b8;text-align:right;padding-top:4px}
.cec-hy-modal{width:920px;max-width:100%}
.cec-hy-toolbar{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:12px 16px;background:var(--cec-bg2);border-bottom:1px solid var(--cec-border);position:sticky;top:0;z-index:5}
.cec-hy-toolbar-left,.cec-hy-toolbar-right{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.cec-hy-toolbar select{height:34px;padding:0 8px;border:1px solid var(--cec-border);border-radius:8px;background:var(--cec-bg);color:var(--cec-ink);font:inherit;font-size:13px;font-weight:700}
.cec-hy-btn{min-height:34px;padding:0 12px;border-radius:8px;border:1px solid var(--cec-border);background:var(--cec-btn-bg);color:var(--cec-ink2);font-size:12px;font-weight:700;gap:5px}
.cec-hy-btn:hover{background:var(--cec-hover);color:var(--cec-ink)}
.cec-hy-btn.on{background:var(--cec-active);border-color:var(--cec-active-border);color:var(--cec-ink)}
.cec-hy-btn.primary{background:#111827;border-color:#2f3a50;color:#ffffff}
.cec-hy-btn.primary:hover{background:#1f2937}
.cec-hy-stage{padding:18px;background:#e2e8f0;display:flex;flex-direction:column;gap:22px;align-items:center}
.cec-hy-page-wrap{width:100%;max-width:794px;display:flex;flex-direction:column;gap:8px}
.cec-hy-page-bar{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 12px;border-radius:8px;background:#1e293b;color:#f8fafc;font-size:12px;font-weight:700}
.cec-hy-page-dl{min-height:28px;padding:0 10px;border-radius:6px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.1);color:#fff;font-size:11px;font-weight:700}
.cec-hy-page-dl:hover{background:rgba(255,255,255,.2)}
.cec-hy-page-scroll{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:6px;box-shadow:0 10px 28px rgba(15,23,42,.18)}
.cec-hy-sheet{
  width:794px;height:1123px;padding:30px 44px 28px;background:#ffffff;color:#000000;
  font-family:"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif;
  font-variant-numeric:tabular-nums;
  display:flex;flex-direction:column;justify-content:flex-start;overflow:hidden;
}
.cec-hy-sheet *{box-sizing:border-box}
.cec-hy-h1{
  margin:0 0 10px;text-align:center;font-family:"Songti SC","Noto Serif SC","STSong","SimSun",serif;
  font-size:24px;font-weight:800;letter-spacing:.05em;color:#000;line-height:1.22;
}
.cec-hy-sec{
  margin:10px 0 4px;display:flex;align-items:center;gap:4px;
  font-family:"Songti SC","Noto Serif SC","STSong","SimSun",serif;
  font-size:15px;font-weight:800;color:#000;line-height:1.3;letter-spacing:.02em;
}
.cec-hy-subcap{
  margin:10px 0 4px;display:flex;align-items:baseline;flex-wrap:wrap;gap:14px;
  font-family:"Songti SC","Noto Serif SC","STSong","SimSun",serif;
  font-size:13.5px;font-weight:700;color:#000;line-height:1.35;
}
.cec-hy-subcap-meta{
  font-weight:700;color:#111;
}
.cec-hy-tbl{
  width:calc(100% - 4px);margin:0 auto;border-collapse:separate;border-spacing:0;table-layout:fixed;
  border-top:1.5px solid #000;border-left:1.5px solid #000;background:#fff;color:#000;font-size:12.5px;
}
.cec-hy-tbl th,.cec-hy-tbl td{
  border-right:1px solid #111;border-bottom:1px solid #111;padding:4px 4px;height:28px;text-align:center;vertical-align:middle;line-height:1.25;overflow-wrap:anywhere;color:#000;
}
.cec-hy-tbl tr th:last-child,.cec-hy-tbl tr td:last-child{border-right:1.5px solid #000}
.cec-hy-tbl tbody tr:last-child td{border-bottom:1.5px solid #000}
.cec-hy-tbl thead th{height:31px;font-weight:800;background:#fafafa;letter-spacing:.02em}
.cec-hy-tbl-prog td{height:26px;padding:3px 12px;font-size:13.5px;font-weight:700;font-family:"Songti SC","Noto Serif SC","SimSun",serif}
.cec-hy-tbl-bold{font-size:15.5px}
.cec-hy-tbl-bold thead th{font-size:15px;font-weight:800;height:34px}
.cec-hy-tbl-bold tbody td{height:32px;padding:4px 6px;font-weight:700;letter-spacing:.01em}
.cec-hy-tbl-bold tbody td.cec-hy-row-wk{font-size:15px;font-weight:800}
.cec-hy-row-wk{font-weight:800;background:#fcfcfc;letter-spacing:.02em}
.cec-hy-diag{position:relative;height:36px!important;padding:0!important;background:#fafafa}
.cec-hy-diag-svg{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none}
.cec-hy-diag-top{position:absolute;top:4px;right:6px;font-size:11px;font-weight:800;line-height:1;color:#000}
.cec-hy-diag-bot{position:absolute;bottom:4px;left:6px;font-size:11px;font-weight:800;line-height:1;color:#000}
.cec-hy-tbl-rd thead th{font-size:14.5px;font-weight:800}
.cec-hy-tbl-rd tbody td{height:40px;padding:3px 3px}
.cec-hy-tbl-rd tbody td.cec-hy-row-wk{font-size:14.5px}
.cec-hy-rd-ref{display:block;font-weight:800;font-size:12.5px;line-height:1.25;color:#000}
.cec-hy-rd-name{display:block;font-weight:700;font-size:12.5px;line-height:1.25;margin-top:2px;color:#111}
.cec-hy-notes{margin-top:8px;padding:0 2px;font-family:"Songti SC","Noto Serif SC","SimSun",serif;font-size:12.5px;font-weight:700;color:#000;line-height:1.6}
.cec-hy-foot-notes{margin-top:auto;padding:16px 6px 0 2px;font-family:"Songti SC","Noto Serif SC","SimSun",serif;font-size:13.5px;font-weight:700;color:#000;line-height:1.8}
.cec-hy-church-sign{margin-top:14px;padding-right:8px;text-align:right;font-family:"PingFang SC","Microsoft YaHei",sans-serif;font-size:17px;font-weight:800;letter-spacing:.04em;color:#000}
.cec-hy-tbl-left{font-size:14.5px}
.cec-hy-tbl-left td{text-align:left;padding:6px 16px;font-weight:700;height:36px}
.cec-hy-tbl-left thead th{text-align:left;padding:7px 16px;font-size:15px;font-weight:800;background:#fafafa;height:36px}
.cec-hy-tbl-big{font-size:17px}
.cec-hy-tbl-big tbody td{height:32px;font-weight:700;letter-spacing:.02em}
.cec-hy-tbl-big thead th{font-size:15.5px}
.cec-hy-tbl-big tbody td.cec-hy-row-wk{font-size:15px}
.cec-hy-tbl-pray tbody td{height:38px}
@container cecp-schedule (max-width:760px){
  .cec-label-long{display:none}
  .cec-label-short{display:inline}
  .cec-top{display:grid;grid-template-columns:minmax(0,1fr);gap:8px;padding:10px}
  .cec-top .cec-nav{display:grid;width:100%;min-width:0;grid-template-columns:36px minmax(0,1fr) 36px;gap:6px}
  .cec-nav #mPrevText,.cec-nav #mNextText{display:none}
  .cec-nav .cec-btn-month.on{grid-column:2;grid-row:1;min-width:0;width:100%;padding:0 8px;font-size:14px;overflow:hidden;text-overflow:ellipsis}
  .cec-nav #mPrev{grid-column:1;grid-row:1;width:36px}
  .cec-nav #mNext{grid-column:3;grid-row:1;width:36px}
  .cec-top .cec-tools{display:flex!important;align-items:center;gap:8px;width:100%;min-width:0;margin:0}
  .cec-top .cec-role-wrap,.cec-top .cec-export-wrap{flex:1 1 0;min-width:0;width:auto}
  .cec-top #roleMenuToggle,.cec-top .cec-btn-tool{width:100%;height:36px;padding:0 10px;gap:5px;border-radius:10px;font-size:12.5px;justify-content:center}
  .cec-top .cec-btn-tool-icon{width:15px;height:15px}
  .cec-top .cec-menu{left:auto;right:0;width:min(280px,calc(100vw - 40px));min-width:0}
  .cec-typebar{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;padding:8px 10px}
  .cec-typebar .cec-btn-type{min-width:0;min-height:40px;padding:0 4px;font-size:12px;gap:4px;overflow:hidden}
  .cec-controls{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;padding:10px}
  .cec-week-controls{display:grid;grid-template-columns:46px minmax(0,1fr);grid-column:1/-1;min-width:0}
  .cec-view-controls{display:grid;grid-template-columns:repeat(2,40px);gap:4px;grid-column:2;grid-row:2}
  .cec-person-controls{display:grid;grid-template-columns:minmax(0,1fr) 44px;gap:4px;margin:0;grid-column:1;grid-row:2;min-width:0}
  .cec-control{padding:8px 6px}
  .cec-cards{padding:10px;gap:10px;grid-template-columns:minmax(0,1fr)}
  .cec-card-head{padding:12px}
  .cec-week-card dl{padding:0 12px}
  .cec-detail{grid-template-columns:76px minmax(0,1fr);gap:8px}
  .cec-preview-mask{padding:8px}
  .cec-preview{max-height:calc(100dvh - 16px)}
  .cec-share-sheet{padding:14px}
}
@media(max-width:760px){.cec-preview-mask{padding:8px}.cec-preview{max-height:calc(100dvh - 16px)}.cec-share-sheet{padding:14px}}

.cec-is-matrix .cec-week-controls,.cec-is-matrix .cec-view-controls{display:none}
@container cecp-schedule (max-width:760px){
  .cec-is-matrix .cec-person-controls{grid-row:1;grid-column:1/-1;grid-template-columns:minmax(0,1fr) 88px}
  .cec-is-matrix .cec-person-controls .cec-label-long{display:inline}
  .cec-is-matrix .cec-person-controls .cec-label-short{display:none}
  .cec-is-matrix .cec-zoombar{justify-content:flex-end;padding:3px 10px;background:var(--cec-bg2)}
  .cec-is-matrix .cec-btn-zoom{width:auto;height:28px;padding:0 4px;border:0;border-radius:4px;background:transparent;font-size:11px;font-weight:500}
  .cec-month-table{overflow-x:visible}
  .cec-month-table .cec-tbl{width:100%;min-width:0;table-layout:fixed}
  .cec-month-table col:first-child{width:20%!important}
  .cec-month-table col:not(:first-child){width:calc(80% / var(--cec-week-columns))!important}
  .cec-month-table .cec-corner,.cec-month-table .cec-h{padding:10px 2px;font-size:11px;line-height:1.5;overflow-wrap:anywhere}
  .cec-month-table .cec-date{font-size:10px;margin-top:2px;white-space:nowrap}
  .cec-month-table .cec-rowlbl{padding:9px 3px;text-align:center;font-size:10px;line-height:1.6;white-space:normal;overflow-wrap:anywhere}
  .cec-month-table .cec-rowlbl-inner{justify-content:center;gap:2px}
  .cec-month-table .cec-row-hide{width:16px;height:16px}
  .cec-month-table .cec-row-hide svg{width:11px;height:11px}
  .cec-top .cec-role-menu{left:auto;right:0;width:min(240px,calc(100vw - 52px));min-width:0}
  .cec-month-table .cec-cell{min-width:0;height:auto;padding:7px 2px;vertical-align:middle}
  .cec-month-table .cec-cellbox{min-height:38px;gap:4px;justify-content:center}
  .cec-month-table .cec-badges{flex-direction:column;gap:4px}
  .cec-month-table .cec-badge{max-width:100%;min-height:25px;padding:5px 2px;font-size:clamp(10px,3.6cqw,12px);line-height:1.45;white-space:normal;overflow-wrap:anywhere;text-align:center}
  .cec-month-table .cec-badge-txt{display:block;white-space:normal;overflow-wrap:anywhere;line-height:inherit}
  .cec-month-table .cec-note,.cec-month-table .cec-reading{gap:4px;min-width:0;overflow-wrap:anywhere}
  .cec-month-table .cec-ref,.cec-month-table .cec-npfx{font-size:10px;line-height:1.5;max-width:100%;overflow-wrap:anywhere}
}
.cec-zoom-mask .cec-row-hide,.cec-export-shot .cec-row-hide{display:none!important}
@keyframes cecBodyReveal{
  from{opacity:0;transform:translateY(14px) scale(.985)}
  to{opacity:1;transform:translateY(0) scale(1)}
}
@keyframes cecBodyHide{
  from{opacity:1;transform:translateY(0) scale(1)}
  to{opacity:0;transform:translateY(-12px) scale(.98)}
}
@keyframes cecGateReveal{
  from{opacity:0;transform:translateY(8px) scale(.96)}
  to{opacity:1;transform:translateY(0) scale(1)}
}
@keyframes cecGateHide{
  from{opacity:1;transform:translateY(0) scale(1)}
  to{opacity:0;transform:translateY(-10px) scale(.96)}
}
@keyframes cecSwapIn{
  from{opacity:0;transform:translateY(8px) scale(.994)}
  to{opacity:1;transform:translateY(0) scale(1)}
}
@keyframes cecMaskFade{
  from{opacity:0}
  to{opacity:1}
}
@keyframes cecMaskFadeOut{
  from{opacity:1}
  to{opacity:0}
}
@keyframes cecModalPop{
  from{opacity:0;transform:translateY(14px) scale(.95)}
  to{opacity:1;transform:translateY(0) scale(1)}
}
@keyframes cecModalPopOut{
  from{opacity:1;transform:translateY(0) scale(1)}
  to{opacity:0;transform:translateY(10px) scale(.96)}
}
#cecp-schedule{position:relative;transition:background-color .28s ease,border-color .28s ease}
#cecp-schedule.is-collapsed{border-color:rgba(0,0,0,.09)!important;background:#f7f6f2!important}
html.dark #cecp-schedule.is-collapsed{border-color:#262421!important;background:#11100e!important}
#cecp-schedule.is-collapsed:not(.is-morphing-close) .cec-body{display:none!important}
#cecp-schedule.is-expanded:not(.is-morphing-open) .cec-gate{display:none!important}
#cecp-schedule.is-morphing-open .cec-gate{
  display:flex!important;position:absolute!important;inset:0 0 auto 0!important;width:100%!important;z-index:5;pointer-events:none;
  animation:cecGateHide .22s cubic-bezier(.32,.72,0,1) forwards;
}
#cecp-schedule.is-morphing-open .cec-body{
  animation:cecBodyReveal .38s cubic-bezier(.16,1,.3,1) both;
}
#cecp-schedule.is-morphing-close .cec-body{
  display:block!important;position:absolute!important;inset:0 0 auto 0!important;width:100%!important;z-index:4;pointer-events:none;
  animation:cecBodyHide .24s cubic-bezier(.32,.72,0,1) forwards;
}
#cecp-schedule.is-morphing-close .cec-gate{
  position:relative;z-index:5;
  animation:cecGateReveal .34s cubic-bezier(.16,1,.3,1) both;
}
#cecp-schedule.is-switching .cec-wrap,#cecp-schedule.is-switching .cec-cards{animation:cecSwapIn .26s cubic-bezier(.16,1,.3,1) both}
.cec-preview-mask{-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}
.cec-zoom-mask,.cec-preview-mask{animation:cecMaskFade .22s cubic-bezier(.22,1,.36,1) both}
.cec-zoom-panel,.cec-preview{animation:cecModalPop .3s cubic-bezier(.16,1,.3,1) both}
.cec-zoom-mask.is-closing,.cec-preview-mask.is-closing{animation:cecMaskFadeOut .18s cubic-bezier(.32,.72,0,1) forwards;pointer-events:none}
.cec-zoom-mask.is-closing .cec-zoom-panel,.cec-preview-mask.is-closing .cec-preview{animation:cecModalPopOut .18s cubic-bezier(.32,.72,0,1) forwards}
.nt-board.cec-board-host{padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important}
.nt-board.cec-board-host>.nt-kicker,.nt-board.cec-board-host>h2,.nt-board.cec-board-host>p,.nt-board.cec-board-host>.nt-board-actions{display:none!important}
.nt-board.cec-board-host>.nt-board-schedule{margin-top:0!important}
.cec-gate{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;padding:clamp(18px,2.5vw,26px) clamp(14px,2.8vw,28px);
  background:radial-gradient(120% 120% at 50% 0%,#ffffff 0%,#f5f4f0 64%,#eeece6 100%);
  color:#1d1d1f;position:relative;overflow:hidden;
}
html.dark .cec-gate{
  background:radial-gradient(120% 120% at 50% 0%,#24201b 0%,#141210 58%,#0d0c0a 100%);
  color:#f5f2eb;
}
.cec-gate-title{
  margin:0;font-family:"Noto Serif SC","Songti SC","STSong",Georgia,serif;
  font-size:clamp(22px,3vw,30px);font-weight:700;line-height:1.18;letter-spacing:.06em;
}
.cec-gate-title-hi{color:#1d1d1f}
.cec-gate-title-lo{color:#86868b}
html.dark .cec-gate-title-hi{color:#ffffff}
html.dark .cec-gate-title-lo{color:#8a847c}
.cec-gate-sub{
  margin:6px 0 0;font-size:12px;line-height:1.45;color:#6e6e73;
}
html.dark .cec-gate-sub{color:#9c9488}
.cec-gate-actions{
  margin-top:14px;display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;max-width:460px;
}
.cec-gate-primary{
  width:min(100%,184px);min-height:38px;padding:0 18px;border-radius:9px;
  background:#1d1d1f;color:#ffffff;font-size:14px;font-weight:800;letter-spacing:.03em;
  box-shadow:0 4px 12px rgba(0,0,0,.12);
  transition:transform .16s cubic-bezier(.22,1,.36,1),background-color .16s ease,box-shadow .16s ease;
}
.cec-gate-primary:hover{background:#000000;color:#ffffff;transform:translateY(-1px);box-shadow:0 6px 16px rgba(0,0,0,.18)}
html.dark .cec-gate-primary{
  background:#f7f5f0;color:#141311;box-shadow:0 4px 14px rgba(0,0,0,.26);
}
html.dark .cec-gate-primary:hover{background:#ffffff;color:#0a0908;box-shadow:0 6px 18px rgba(0,0,0,.34)}
.cec-gate-primary:active,.cec-gate-pill:active,.cec-btn-collapse:active,.cec-btn-collapse-foot:active{transform:scale(.97)}
.cec-gate-pills{
  display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px;width:100%;
}
.cec-gate-pill{
  min-height:31px;padding:0 11px;border-radius:8px;
  border:1px solid rgba(0,0,0,.09);background:#ffffff;color:#1d1d1f;
  font-size:12px;font-weight:700;gap:6px;
  transition:transform .15s cubic-bezier(.22,1,.36,1),background-color .15s ease,border-color .15s ease;
}
.cec-gate-pill:hover{background:#f0f0f3;border-color:rgba(0,0,0,.18);color:#000000;transform:translateY(-1px)}
.cec-gate-pill--me{border-color:rgba(26,122,60,.28);background:rgba(26,122,60,.08);color:#145c2d}
html.dark .cec-gate-pill{
  border:1px solid rgba(255,255,255,.10);background:#252320;color:#ece8e0;
}
html.dark .cec-gate-pill:hover{background:#302d29;border-color:rgba(255,255,255,.20);color:#ffffff}
html.dark .cec-gate-pill--me{border-color:rgba(151,216,166,.35);background:rgba(40,75,55,.45);color:#cfead6}
.cec-exp-head{
  display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;
  padding:10px 14px;background:var(--cec-bg3);color:var(--cec-ink);border-bottom:1px solid var(--cec-border);
}
html.dark .cec-exp-head{
  background:#161412;color:#f5f2eb;border-bottom:1px solid #2a2723;
}
.cec-exp-title{
  display:inline-flex;align-items:baseline;gap:8px;min-width:0;
  font-family:"Noto Serif SC","Songti SC","STSong",Georgia,serif;font-size:17px;font-weight:700;letter-spacing:.04em;
}
.cec-exp-title-hi{color:#1d1d1f}
.cec-exp-title-lo{color:#6e6e73}
html.dark .cec-exp-title-hi{color:#ffffff}
html.dark .cec-exp-title-lo{color:#8f887f}
.cec-exp-meta{
  font-family:"PingFang SC","Noto Sans SC",system-ui,sans-serif;
  font-size:12px;font-weight:600;color:#6e6e73;letter-spacing:0;
}
html.dark .cec-exp-meta{color:#9c9488}
.cec-btn-collapse{
  min-height:30px;padding:0 11px;border-radius:8px;
  border:1px solid var(--cec-border);background:var(--cec-bg2);color:var(--cec-ink);
  font-size:12px;font-weight:700;gap:5px;
  transition:transform .15s cubic-bezier(.22,1,.36,1),background-color .15s ease;
}
.cec-btn-collapse:hover{background:var(--cec-hover);color:#000000}
html.dark .cec-btn-collapse{
  border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.08);color:#f5f2eb;
}
html.dark .cec-btn-collapse:hover{background:rgba(255,255,255,.15);color:#ffffff}
.cec-btn-collapse svg,.cec-btn-collapse-foot svg{width:14px;height:14px;display:block;flex:none}
.cec-exp-foot{
  display:flex;justify-content:center;padding:10px 12px;
  background:var(--cec-bg2);border-top:1px solid var(--cec-border);
}
.cec-btn-collapse-foot{
  min-height:32px;padding:0 14px;border-radius:999px;
  border:1px solid var(--cec-border);background:var(--cec-btn-bg);color:var(--cec-ink2);
  font-size:12px;font-weight:700;gap:6px;
  transition:transform .15s cubic-bezier(.22,1,.36,1),background-color .15s ease;
}
.cec-btn-collapse-foot:hover{background:var(--cec-hover);color:var(--cec-ink)}
@container cecp-schedule (max-width:420px){
  .cec-gate-pills{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
  .cec-gate-pill{width:100%;padding:0 8px;font-size:12px}
  .cec-gate-pill--me{grid-column:1/-1}
  .cec-exp-head{padding:8px 10px}
  .cec-exp-meta{display:none}
}
@media(prefers-reduced-motion:reduce){
  #cecp-schedule .cec-badge,#cecp-schedule .cec-btn,.cec-menu,.cec-role-menu{transition:none!important}
  #cecp-schedule.is-morphing-open .cec-body,#cecp-schedule.is-morphing-open .cec-gate,#cecp-schedule.is-morphing-close .cec-body,#cecp-schedule.is-morphing-close .cec-gate,#cecp-schedule.is-switching .cec-wrap,#cecp-schedule.is-switching .cec-cards,.cec-zoom-mask,.cec-preview-mask,.cec-zoom-panel,.cec-preview{animation:none!important}
}
`;
    document.head.appendChild(st);
  }

  var isCollapsible = EL.getAttribute('data-collapsible') !== 'false' && EL.getAttribute('data-expanded') !== 'true';
  var isExpanded = !isCollapsible;
  var pendingGateType = '';
  var pendingGatePersonal = false;
  var hostBoard = EL.closest ? EL.closest('.nt-board') : null;
  var animTimer = 0;
  var activeHeightAnim = null;

  function syncExpandState() {
    EL.classList.toggle('is-collapsed', !isExpanded);
    EL.classList.toggle('is-expanded', isExpanded);
    if (hostBoard) {
      hostBoard.classList.add('cec-board-host');
      hostBoard.classList.toggle('cec-board-collapsed', !isExpanded);
      hostBoard.classList.toggle('cec-board-expanded', isExpanded);
    }
  }

  function animateContainerHeight(startH, endH, durationMs) {
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || typeof EL.animate !== 'function' || startH <= 0 || endH <= 0 || Math.abs(endH - startH) <= 2) return;
    if (activeHeightAnim) {
      try { activeHeightAnim.cancel(); } catch (_) {}
      activeHeightAnim = null;
    }
    try {
      activeHeightAnim = EL.animate(
        [{ height: startH + 'px', overflow: 'hidden' }, { height: endH + 'px', overflow: 'hidden' }],
        { duration: durationMs, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
      );
      activeHeightAnim.onfinish = function () { activeHeightAnim = null; };
    } catch (_) {}
  }

  function animateExpandTransition(opening, applyFn) {
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var startH = (!reduceMotion && EL.getBoundingClientRect) ? EL.getBoundingClientRect().height : 0;
    if (animTimer) clearTimeout(animTimer);
    EL.classList.remove('is-morphing-open', 'is-morphing-close', 'is-switching');
    applyFn();
    var endH = (!reduceMotion && EL.getBoundingClientRect) ? EL.getBoundingClientRect().height : 0;
    if (!reduceMotion) {
      EL.classList.add(opening ? 'is-morphing-open' : 'is-morphing-close');
      animateContainerHeight(startH, endH, opening ? 380 : 340);
      animTimer = setTimeout(function () {
        EL.classList.remove('is-morphing-open', 'is-morphing-close');
      }, opening ? 390 : 350);
    }
  }

  function closeModalAnimated(mask, afterClose) {
    if (!mask || mask.classList.contains('is-closing')) return;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      mask.remove();
      if (afterClose) afterClose();
      return;
    }
    mask.classList.add('is-closing');
    setTimeout(function () {
      mask.remove();
      if (afterClose) afterClose();
    }, 185);
  }

  function renderGateHtml(month, savedName) {
    var subText = (month ? month + ' · ' : '') + '主日崇拜 · 青年团契 · 祷告会同工排班';
    var pills = TYPE_ORDER.map(function (tp) {
      var c = TYPE_C[tp];
      return '<button type="button" class="cec-btn cec-gate-pill" data-gate-type="' + esc(tp) + '">' +
        '<span class="cec-dot" style="background:' + c.accent + '"></span>' +
        '<span>' + esc(tp) + '</span></button>';
    }).join('');
    if (savedName) {
      pills += '<button type="button" class="cec-btn cec-gate-pill cec-gate-pill--me" id="cecGatePersonal">' +
        '<span>我的服事 · ' + esc(savedName) + '</span></button>';
    }
    return '<div class="cec-gate">' +
      '<h2 class="cec-gate-title"><span class="cec-gate-title-hi">服事</span><span class="cec-gate-title-lo">安排</span></h2>' +
      '<p class="cec-gate-sub">' + esc(subText) + '</p>' +
      '<div class="cec-gate-actions">' +
      '<button type="button" class="cec-btn cec-gate-primary" id="cecGateOpen">查看服事安排</button>' +
      '<div class="cec-gate-pills">' + pills + '</div>' +
      '</div></div>';
  }

  function bindPreBootGate() {
    if (!isCollapsible) return;
    bind('#cecGateOpen', function () {
      animateExpandTransition(true, function () {
        isExpanded = true;
        syncExpandState();
      });
    });
    EL.querySelectorAll('[data-gate-type]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        pendingGateType = this.getAttribute('data-gate-type') || '';
        if (pendingGateType) writePreference('type', pendingGateType);
        animateExpandTransition(true, function () {
          isExpanded = true;
          syncExpandState();
        });
      });
    });
    bind('#cecGatePersonal', function () {
      pendingGatePersonal = true;
      animateExpandTransition(true, function () {
        isExpanded = true;
        syncExpandState();
      });
    });
  }

  syncExpandState();
  EL.innerHTML = (isCollapsible ? renderGateHtml('', readPreference('name')) : '') +
    '<div class="cec-body"><div class="cec-state"><div class="cec-spin"></div>加载服事安排…</div></div>';
  bindPreBootGate();

  if (!API || API === 'DEMO') {
    setTimeout(function () { boot(demo()); }, 120);
    return;
  }

  loadScheduleWithFogli()
    .then(function (rows) {
      boot(rows);
    })
    .catch(function (e) {
      EL.innerHTML = (isCollapsible ? renderGateHtml('', readPreference('name')) : '') +
        '<div class="cec-body"><div class="cec-err">⚠ ' + esc(e && e.message ? e.message : '加载失败') + '</div></div>';
      bindPreBootGate();
    });

  function fetchTextWithTimeout(url, ms) {
    return new Promise(function (resolve) {
      var done = false;
      var timer = setTimeout(function () {
        if (!done) { done = true; resolve(''); }
      }, ms || 5000);
      fetch(url, { cache: 'no-store', credentials: 'omit' })
        .then(function (r) { return r.ok ? r.text() : ''; })
        .catch(function () { return ''; })
        .then(function (txt) {
          if (!done) {
            done = true;
            clearTimeout(timer);
            resolve(txt || '');
          }
        });
    });
  }

  function fetchApiRows(apiUrl, ms) {
    if (!apiUrl) return Promise.resolve([]);
    var sep = apiUrl.indexOf('?') >= 0 ? '&' : '?';
    return fetchTextWithTimeout(apiUrl + sep + 'action=all&_ts=' + Date.now(), ms || 6000)
      .then(function (txt) {
        if (!txt) return [];
        var res = JSON.parse(txt);
        return (res && res.ok && Array.isArray(res.data)) ? res.data : [];
      })
      .catch(function () { return []; });
  }

  function parseCsvRows(text) {
    var rows = [];
    if (!text || text.trim().charAt(0) === '<') return rows;
    var curRow = [];
    var curCell = '';
    var inQuotes = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if (inQuotes) {
        if (ch === '"') {
          if (text.charAt(i + 1) === '"') {
            curCell += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          curCell += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          curRow.push(tv(curCell));
          curCell = '';
        } else if (ch === '\n' || ch === '\r') {
          if (ch === '\r' && text.charAt(i + 1) === '\n') i++;
          curRow.push(tv(curCell));
          rows.push(curRow);
          curRow = [];
          curCell = '';
        } else {
          curCell += ch;
        }
      }
    }
    if (curCell.length > 0 || curRow.length > 0) {
      curRow.push(tv(curCell));
      rows.push(curRow);
    }
    return rows;
  }

  function normalizeGvizMonth(raw) {
    var s = tv(raw);
    var m = s.match(/(\d{4})\s*[年\/\-]\s*(\d{1,2})/);
    if (m) return parseInt(m[1], 10) + '年' + parseInt(m[2], 10) + '月';
    var md = s.match(/^Date\((\d{4}),\s*(\d{1,2}),/);
    if (md) return parseInt(md[1], 10) + '年' + (parseInt(md[2], 10) + 1) + '月';
    return '';
  }

  function parseCsvMainSchedule(csvText) {
    var result = [];
    var tableRows = parseCsvRows(csvText);
    if (!tableRows.length) return result;
    var blankStreak = 0;
    var hasStarted = false;

    for (var i = 0; i < tableRows.length; i++) {
      var cells = tableRows[i];
      var month = normalizeGvizMonth(cells[0]);
      var week = tv(cells[1]);
      var type = tv(cells[2]);
      var subtype = tv(cells[3]);

      if (!month) {
        if (hasStarted) {
          blankStreak++;
          if (blankStreak >= 5) break;
        }
        continue;
      }
      hasStarted = true;
      blankStreak = 0;
      if (!week || !type) continue;

      var vSound = tv(cells[16]);
      var vPpt = tv(cells[17]);
      var vBroadcast = tv(cells[18]);
      if (vSound === '—' || vSound === '-') vSound = '';
      if (vPpt === '—' || vPpt === '-') vPpt = '';
      if (vBroadcast === '—' || vBroadcast === '-') vBroadcast = '';

      result.push({
        month: month,
        week: week,
        type: type,
        subtype: subtype,
        leader: tv(cells[4]),
        worship: tv(cells[5]),
        prayerLeader: tv(cells[6]),
        praisePrayer: tv(cells[7]),
        memorialPrayer: tv(cells[8]),
        piano: tv(cells[9]),
        drums: tv(cells[10]),
        guitar: tv(cells[11]),
        bass: tv(cells[12]),
        reading: tv(cells[13]),
        note: tv(cells[14]),
        time: tv(cells[15]),
        sound: vSound,
        ppt: vPpt,
        broadcast: vBroadcast
      });
    }

    result.sort(function (a, b) {
      var dm = ymOrd(a.month) - ymOrd(b.month); if (dm) return dm;
      var dw = WEEK_ORDER.indexOf(a.week) - WEEK_ORDER.indexOf(b.week); if (dw) return dw;
      var tord = { '主日下午': 0, '主日晚上': 1, '青年团契': 2, '祷告会': 3 };
      var dt = (tord[a.type] == null ? 9 : tord[a.type]) - (tord[b.type] == null ? 9 : tord[b.type]); if (dt) return dt;
      var sord = { '周三祷告会': 0, '周六祷告会': 1 };
      return (sord[a.subtype] == null ? 9 : sord[a.subtype]) - (sord[b.subtype] == null ? 9 : sord[b.subtype]);
    });

    return result;
  }

  function parseCsvSoundTable(csvText, defaultYear) {
    var map = {};
    var tableRows = parseCsvRows(csvText);
    if (!tableRows.length) return map;
    var curMonth = '';
    var bannerMonth = '';
    var curType = '';

    tableRows.forEach(function (cells) {
      var c0 = tv(cells[0]);
      var c1 = tv(cells[1]);
      var c2 = tv(cells[2]);

      var isBannerRow = (c1 === '聚会时段' || c2 === '服事岗位' || c0.indexOf('📅') >= 0);
      var parsedM = normalizeGvizMonth(c0) || normalizeGvizMonth(c1);
      if (!parsedM) {
        var mShort = c0.match(/(?:^|\D)(\d{1,2})\s*月(?:\s|$|主日)/) || c1.match(/^(\d{1,2})\s*月\s*主日大堂调音/);
        if (mShort) parsedM = (defaultYear || 2026) + '年' + parseInt(mShort[1], 10) + '月';
      }

      if (isBannerRow) {
        if (parsedM) bannerMonth = parsedM;
        curMonth = '';
        curType = '';
        return;
      }

      if (parsedM) {
        curMonth = parsedM;
      } else if (!curMonth && bannerMonth) {
        curMonth = bannerMonth;
      }

      if (c1.indexOf('主日学') >= 0) {
        curType = '';
      } else if (c1.indexOf('青年团契') >= 0 || c1.indexOf('中午12:00') >= 0) {
        curType = '青年团契';
      } else if (c1 === '主日下午' || c1 === '下午') {
        curType = '主日下午';
      } else if (c1 === '主日晚上' || c1 === '晚上') {
        curType = '主日晚上';
      }

      if (!curMonth || !curType) return;

      var roleText = '';
      var weekOffset = 3;
      if (c2 === '调音' || c2 === 'PPT播放' || c2 === '投影' || c2 === '转播和话筒' || c2 === '转播') {
        roleText = c2;
        weekOffset = 3;
      } else if (c1 === '调音' || c1 === 'PPT播放' || c1 === '投影' || c1 === '转播和话筒' || c1 === '转播') {
        roleText = c1;
        weekOffset = 2;
      }
      if (!roleText) return;

      var roleKey = roleText === '调音' ? 'sound'
        : (roleText === 'PPT播放' || roleText === '投影') ? 'ppt'
        : 'broadcast';

      for (var w = 0; w < 5; w++) {
        var val = tv(cells[weekOffset + w]);
        if (!val || val === '—' || val === '-' || val === roleText) continue;
        var k = curMonth + '|' + WEEK_ORDER[w] + '|' + curType;
        if (!map[k]) map[k] = {};
        map[k][roleKey] = val;
      }
    });

    return map;
  }

  var NOV_2026_SOUND_DEFAULT = {
    '2026年11月|第一周|青年团契': { sound: '胡恩典', ppt: '陈煜恩', broadcast: '' },
    '2026年11月|第二周|青年团契': { sound: '倪翰俊', ppt: '林DANIELE', broadcast: '' },
    '2026年11月|第三周|青年团契': { sound: '陈煜恩', ppt: '戴DANTE', broadcast: '' },
    '2026年11月|第四周|青年团契': { sound: '戴DANTE', ppt: '林DANIELE', broadcast: '' },
    '2026年11月|第五周|青年团契': { sound: '林DANIELE', ppt: '戴DANTE', broadcast: '' },
    '2026年11月|第一周|主日下午': { sound: '陈煜恩', ppt: '倪翰耀', broadcast: '何正' },
    '2026年11月|第二周|主日下午': { sound: '林DANIELE', ppt: '倪翰耀', broadcast: '倪翰俊' },
    '2026年11月|第三周|主日下午': { sound: '倪翰俊', ppt: '叶Romano', broadcast: '吴以勒' },
    '2026年11月|第四周|主日下午': { sound: '林DANIELE', ppt: '杨Samuele', broadcast: '吴以勒' },
    '2026年11月|第五周|主日下午': { sound: '吴以勒', ppt: '陈欣豪', broadcast: '黄振宇' },
    '2026年11月|第一周|主日晚上': { sound: '卓毅豪', ppt: 'Alex', broadcast: '黄振宇' },
    '2026年11月|第二周|主日晚上': { sound: '何正', ppt: '苏Alessio', broadcast: '卓毅豪' },
    '2026年11月|第三周|主日晚上': { sound: '黄振宇', ppt: '毛俊龙', broadcast: '卓毅豪' },
    '2026年11月|第四周|主日晚上': { sound: '黄振宇', ppt: 'Vitto', broadcast: '何正' },
    '2026年11月|第五周|主日晚上': { sound: '何正', ppt: 'Alex', broadcast: '卓毅豪' }
  };

  var EVE_PRAYER_DEFAULT = {
    '第一周': '戴献和',
    '第二周': '徐永西',
    '第三周': '金展',
    '第四周': '林文宝、董希昆',
    '第五周': '林文宝'
  };

  function expandYmLabels(startYm, endYm) {
    var m1 = String(startYm || '').match(/(\d{4})\D+(\d{1,2})/);
    var m2 = String(endYm || '').match(/(\d{4})\D+(\d{1,2})/);
    if (!m1 || !m2) return [];
    var sy = parseInt(m1[1], 10), sm = parseInt(m1[2], 10);
    var ey = parseInt(m2[1], 10), em = parseInt(m2[2], 10);
    var out = [];
    var guard = 0;
    while ((sy < ey || (sy === ey && sm <= em)) && guard++ < 48) {
      out.push(sy + '年' + sm + '月');
      sm++;
      if (sm > 12) { sm = 1; sy++; }
    }
    return out;
  }

  function parseCsvZhouQiTable(csvText) {
    var map = {};
    var rows = parseCsvRows(csvText);
    if (!rows.length) return map;
    var activeMonths = ['2026年1月','2026年2月','2026年3月','2026年4月','2026年5月','2026年6月'];
    var curType = '';

    rows.forEach(function (cells) {
      var c0 = tv(cells[0]);
      if (/^【周期】/.test(c0)) {
        var parts = c0.replace(/^【周期】/, '').split(/[~～到至]/);
        var expanded = parts.length >= 2 ? expandYmLabels(parts[0], parts[1]) : [];
        if (expanded.length) activeMonths = expanded;
        curType = '';
        return;
      }
      if (c0 === '【主日下午】') { curType = '主日下午'; return; }
      if (c0 === '【主日晚上】') { curType = '主日晚上'; return; }
      if (!curType || WEEK_ORDER.indexOf(c0) < 0) return;

      var entry = curType === '主日下午'
        ? {
            leader: tv(cells[1]),
            worship: tv(cells[2]),
            piano: tv(cells[3]),
            drums: tv(cells[4]),
            guitar: tv(cells[5]),
            bass: tv(cells[6]),
            praisePrayer: tv(cells[7]),
            memorialPrayer: tv(cells[8])
          }
        : {
            leader: tv(cells[1]),
            prayerLeader: tv(cells[2]),
            worship: tv(cells[3]),
            piano: tv(cells[4]),
            drums: tv(cells[5]),
            guitar: tv(cells[6]),
            bass: tv(cells[7])
          };

      map['default|' + c0 + '|' + curType] = entry;
      activeMonths.forEach(function (mo) {
        map[mo + '|' + c0 + '|' + curType] = entry;
      });
    });

    return map;
  }

  function loadScheduleWithFogli() {
    var ts = Date.now();
    var fogliMainUrl = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent('服事安排') + '&_ts=' + ts;
    var fogliSoundUrl = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent('🎛 调音组安排') + '&_ts=' + ts;
    var fogliZhouQiUrl = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent('⚙️ 事工周期表') + '&_ts=' + ts;

    return Promise.all([
      fetchTextWithTimeout(fogliMainUrl, 5000),
      fetchTextWithTimeout(fogliSoundUrl, 5000),
      fetchTextWithTimeout(fogliZhouQiUrl, 4000)
    ]).then(function (texts) {
      var fogliRows = parseCsvMainSchedule(texts[0]);
      var mapSound = texts[1] ? parseCsvSoundTable(texts[1], 2026) : {};
      var mapZhouQi = texts[2] ? parseCsvZhouQiTable(texts[2]) : {};

      function applySoundMap(rows) {
        var hasNovInSheet = mapSound && Object.keys(mapSound).some(function (k) {
          return k.indexOf('2026年11月|') === 0;
        });
        rows.forEach(function (r) {
          var key = tv(r.month) + '|' + tv(r.week) + '|' + tv(r.type);
          var sm = (mapSound && mapSound[key]) || (!hasNovInSheet ? NOV_2026_SOUND_DEFAULT[key] : null);
          r.sound = tv(r.sound) || (sm && sm.sound) || '';
          r.ppt = tv(r.ppt) || (sm && sm.ppt) || '';
          r.broadcast = tv(r.broadcast) || (sm && sm.broadcast) || '';

          var zq = (mapZhouQi && (mapZhouQi[key] || mapZhouQi['default|' + tv(r.week) + '|' + tv(r.type)])) || null;
          if (zq) {
            r.leader = tv(r.leader) || zq.leader || '';
            r.worship = tv(r.worship) || zq.worship || '';
            r.piano = tv(r.piano) || zq.piano || '';
            r.praisePrayer = tv(r.praisePrayer) || zq.praisePrayer || '';
            r.memorialPrayer = tv(r.memorialPrayer) || zq.memorialPrayer || '';
            r.prayerLeader = tv(r.prayerLeader) || zq.prayerLeader || '';
          }
          if (tv(r.type) === '主日晚上' && !tv(r.prayerLeader)) {
            r.prayerLeader = EVE_PRAYER_DEFAULT[tv(r.week)] || '';
          }
        });
        return rows;
      }

      if (fogliRows.length > 0) {
        return applySoundMap(fogliRows);
      }

      // Fallback to Apps Script API (tries NEW_API first, then OLD_API)
      return fetchApiRows(API, 6000)
        .then(function (apiRows) {
          if (apiRows.length > 0) return apiRows;
          if (API !== OLD_API) return fetchApiRows(OLD_API, 6000);
          return [];
        })
        .then(function (apiRows) {
          if (!apiRows.length) throw new Error('无法从 Google 表格读取服事安排');
          return applySoundMap(apiRows);
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

    // Keep the upcoming Sunday visible even before its month's roster is published.
    var today = new Date();
    var upcomingSunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (7 - today.getDay()) % 7, 12);
    var upcomingMonth = upcomingSunday.getFullYear() + '年' + (upcomingSunday.getMonth() + 1) + '月';
    if (!byMonth[upcomingMonth]) byMonth[upcomingMonth] = [];
    var months = Object.keys(byMonth).sort(function (a, b) { return ymOrd(a) - ymOrd(b); });
    var activeMonthIdx = pickScheduleMonth(months);
    var activeType = pendingGateType || readPreference('type');
    if (TYPE_ORDER.indexOf(activeType) < 0) activeType = '主日下午';
    var selectedName = readPreference('name');
    var names = scheduleNames(rows);
    if (names.indexOf(selectedName) < 0) selectedName = '';
    var personalView = !!(pendingGatePersonal && selectedName);
    var activeView = 'matrix';
    var activeWeek = currentSundayWeek(months[activeMonthIdx]);
    var exportMenuOpen = false;
    var roleMenuOpen = false;
    var exportBusy = false;
    var activeRatio = '4:3';

    function syncMenusDom() {
      var wrap = EL.querySelector('.cec-export-wrap');
      var roleWrap = EL.querySelector('.cec-role-wrap');
      if (wrap) wrap.classList.toggle('open', !!exportMenuOpen);
      if (roleWrap) roleWrap.classList.toggle('open', !!roleMenuOpen);
    }

    function onDocClick(e) {
      if (!exportMenuOpen && !roleMenuOpen) return;
      if (!EL.isConnected) {
        document.removeEventListener('click', onDocClick);
        return;
      }
      var wrap = EL.querySelector('.cec-export-wrap');
      var roleWrap = EL.querySelector('.cec-role-wrap');
      if (wrap && wrap.contains(e.target)) return;
      if (roleWrap && roleWrap.contains(e.target)) return;
      exportMenuOpen = false;
      roleMenuOpen = false;
      syncMenusDom();
    }

    document.addEventListener('click', onDocClick);

    render();

    function render() {
      var month = months[activeMonthIdx];
      var monthRows = byMonth[month] || [];
      var typeFilteredRows = monthRows.filter(function (r) { return tv(r.type) === activeType; });
      var activeRoleDefs = activeType === '祷告会' ? [] : getNonEmptyServiceRows(activeType, typeFilteredRows, { trimEmptyRows: true });
      var hiddenActiveDefs = activeRoleDefs.filter(function (d) { return isRoleHidden(d.key); });

      var nav = '<div class="cec-nav">';
      if (activeMonthIdx > 0) nav += '<button type="button" class="cec-btn cec-btn-arr" id="mPrev" aria-label="上个月">' + scheduleChevron(false) + '</button>';
      if (activeMonthIdx > 0) nav += '<button class="cec-btn cec-btn-month" id="mPrevText">' + esc(months[activeMonthIdx - 1]) + '</button>';
      nav += '<button class="cec-btn cec-btn-month on">' + esc(month) + '</button>';
      if (activeMonthIdx < months.length - 1) nav += '<button class="cec-btn cec-btn-month" id="mNextText">' + esc(months[activeMonthIdx + 1]) + '</button>';
      if (activeMonthIdx < months.length - 1) nav += '<button type="button" class="cec-btn cec-btn-arr" id="mNext" aria-label="下个月">' + scheduleChevron(true) + '</button>';
      nav += '</div>';

      var roleMenuHtml = '';
      if (activeRoleDefs.length) {
        var roleBtnLabel = hiddenActiveDefs.length ? ('岗位 (' + (activeRoleDefs.length - hiddenActiveDefs.length) + '/' + activeRoleDefs.length + ')') : '显示/隐藏';
        roleMenuHtml = '<div class="cec-role-wrap' + (roleMenuOpen ? ' open' : '') + '">' +
          '<button class="cec-btn cec-btn-month' + (hiddenActiveDefs.length ? ' on' : '') + '" id="roleMenuToggle" type="button" style="gap:5px;padding:0 11px" title="选择要显示或隐藏的服事岗位">' +
          '<span style="width:15px;height:15px;display:inline-flex">' + eyeIconSvg(false) + '</span><span>' + esc(roleBtnLabel) + '</span></button>' +
          '<div class="cec-role-menu">' +
          '<div class="cec-menu-title">点击切换显示 / 隐藏</div>' +
          activeRoleDefs.map(function (def) {
            var hidden = isRoleHidden(def.key);
            return '<button class="cec-btn cec-role-item' + (hidden ? ' is-hidden' : '') + '" type="button" data-toggle-role="' + esc(def.key) + '">' +
              '<span class="cec-role-item-left">' + eyeIconSvg(hidden) + '<span>' + esc(def.label) + '</span></span>' +
              '<span style="font-size:11px;color:var(--cec-ink3)">' + (hidden ? '已隐藏' : '显示中') + '</span></button>';
          }).join('') +
          (hiddenActiveDefs.length ? '<div class="cec-menu-divider"></div><button class="cec-btn cec-menu-item" type="button" id="roleShowAll" style="font-size:12px;min-height:34px;justify-content:center">恢复全部显示</button>' : '') +
          '</div></div>';
      }

      var toolBtnText = exportBusy ? '导出中...' : '导出图片';
      var toolBtnIcon = '<svg class="cec-btn-tool-icon" viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M12 3v10.5m0 0 4-4m-4 4-4-4M5 17v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>' +
        '</svg>';
      var toolMenu = '<div class="cec-tools" style="display:flex;align-items:center;gap:8px">' +
        roleMenuHtml +
        '<div class="cec-export-wrap' + (exportMenuOpen ? ' open' : '') + '">' +
        '<button class="cec-btn cec-btn-tool" id="exportToggle" type="button"' + (exportBusy ? ' disabled' : '') + '>' + toolBtnIcon + '<span class="cec-btn-tool-label">' + toolBtnText + '</span></button>' +
        '<div class="cec-menu">' +
        '<div class="cec-menu-title">半年打印事工表（A4 竖版 · 3页）</div>' +
        '<div class="cec-ratio-bar">' +
        '<button class="cec-btn cec-ratio-item" type="button" data-export-half="H1">1–6月 (上半年)</button>' +
        '<button class="cec-btn cec-ratio-item" type="button" data-export-half="H2">7–12月 (下半年)</button>' +
        '</div>' +
        '<div class="cec-menu-divider"></div>' +
        '<div class="cec-menu-title">单月画面比例</div>' +
        '<div class="cec-ratio-bar">' +
        EXPORT_RATIOS.map(function (item) {
          return '<button class="cec-btn cec-ratio-item' + (item.key === activeRatio ? ' on' : '') + '" type="button" data-export-ratio="' + esc(item.key) + '">' + esc(item.label) + '</button>';
        }).join('') +
        '</div>' +
        '<div class="cec-menu-divider"></div>' +
        '<div class="cec-menu-title">选择要下载的单月内容</div>' +
        [{key:'week',label:'当前周 · ' + activeType}, {key:'personal',label:'我的服事' + (selectedName ? ' · ' + selectedName : '（先选择姓名）')}].concat(EXPORT_ITEMS).map(function (item) {
          return '<button class="cec-btn cec-menu-item" type="button" data-export-target="' + esc(item.key) + '">' + esc(item.label) + '</button>';
        }).join('') +
        '</div>' +
        '</div>' +
        '</div>';

      var top = '<div class="cec-top">' + nav + toolMenu + '</div>';

      var typebar = '<div class="cec-typebar">';
      TYPE_ORDER.forEach(function (tp) {
        var c = TYPE_C[tp];
        typebar += '<button class="cec-btn cec-btn-type' + (tp === activeType ? ' on' : '') + '" data-type="' + esc(tp) + '" aria-label="' + esc(tp) + '">' +
          '<span class="cec-dot" style="background:' + c.accent + '"></span><span class="cec-label-long">' + esc(tp) + '</span><span class="cec-label-short">' + esc({'主日下午':'下午','主日晚上':'晚上','青年团契':'青年','祷告会':'祷告会'}[tp]) + '</span>' +
          '</button>';
      });
      typebar += '</div>';

      var hiddenBar = '';
      if (!personalView && hiddenActiveDefs.length) {
        hiddenBar = '<div class="cec-hidden-bar"><span class="cec-hidden-lbl">已隐藏岗位（点击恢复）：</span>' +
          hiddenActiveDefs.map(function (def) {
            return '<button type="button" class="cec-btn cec-hidden-chip" data-toggle-role="' + esc(def.key) + '" title="点击重新显示「' + esc(def.label) + '」">' +
              eyeIconSvg(false) + '<span>' + esc(def.label) + '</span></button>';
          }).join('') +
          '<button type="button" class="cec-btn cec-hidden-reset" id="hiddenBarReset">恢复全部</button></div>';
      }

      var body = personalView || activeView === 'week'
        ? renderScheduleCards(monthRows, { type: activeType, week: activeWeek, name: personalView ? selectedName : '' })
        : activeType === '祷告会' ? renderPrayerMatrix(monthRows, {adaptive:true}) : renderServiceMatrix(monthRows, activeType, {adaptive:true, trimEmptyRows:true, month: activeType === '青年团契' ? '' : month});
      if (!monthRows.length) body = '<div class="cec-card-empty">本月服事安排尚未公布</div>';
      var controls = '<div class="cec-controls">' +
        '<div class="cec-week-controls"><button type="button" class="cec-btn cec-control" id="scheduleToday">本周</button>' +
        '<div class="cec-week-picker"><button type="button" class="cec-btn cec-week-arrow" id="scheduleWeekPrev" aria-label="上一周"' + (activeWeek === WEEK_ORDER[0] && activeMonthIdx === 0 ? ' disabled' : '') + '>' + scheduleChevron(false) + '</button><select id="scheduleWeek" aria-label="选择周次">' + WEEK_ORDER.filter(function (week) { return !!sundayLabel(month, week); }).map(function (week) {
          return '<option value="' + esc(week) + '"' + (week === activeWeek ? ' selected' : '') + '>' + esc(week + ' · ' + sundayLabel(month, week)) + '</option>';
        }).join('') + '</select><button type="button" class="cec-btn cec-week-arrow" id="scheduleWeekNext" aria-label="下一周"' + (!sundayDate(month, WEEK_ORDER[WEEK_ORDER.indexOf(activeWeek) + 1]) && activeMonthIdx === months.length - 1 ? ' disabled' : '') + '>' + scheduleChevron(true) + '</button></div></div>' +
        '<div class="cec-view-controls"><button type="button" class="cec-btn cec-control' + (!personalView && activeView === 'week' ? ' on' : '') + '" id="scheduleWeekly" aria-pressed="' + (!personalView && activeView === 'week') + '"><span class="cec-label-long">按周看</span><span class="cec-label-short">周卡</span></button>' +
        '<button type="button" class="cec-btn cec-control' + (!personalView && activeView === 'matrix' ? ' on' : '') + '" id="scheduleMatrix" aria-pressed="' + (!personalView && activeView === 'matrix') + '"><span class="cec-label-long">月度总表</span><span class="cec-label-short">月表</span></button></div>' +
        '<div class="cec-person-controls"><select id="scheduleName" aria-label="选择服事姓名"><option value="">选择我的姓名</option>' + names.map(function (name) {
          return '<option value="' + esc(name) + '"' + (name === selectedName ? ' selected' : '') + '>' + esc(name) + '</option>';
        }).join('') + '</select><button type="button" id="schedulePersonal" class="cec-btn cec-control' + (personalView ? ' on' : '') + '" aria-pressed="' + personalView + '"' + (!selectedName ? ' disabled' : '') + '><span class="cec-label-long">我的服事</span><span class="cec-label-short">我的</span></button></div></div>' +
        (personalView ? '<div class="cec-view-caption">' + esc(selectedName) + ' · 本月全部聚会的服事</div>' : '');

      var zoombar = '<div class="cec-zoombar">' +
        '<button class="cec-btn cec-btn-zoom" id="zoomOpen" type="button">' +
        '<svg class="cec-btn-zoom-icon" viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm9.5 16-4.4-4.4M10.5 8v5M8 10.5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>' +
        '</svg>点击放大查看</button></div>';

      var gateHtml = isCollapsible ? renderGateHtml(month, selectedName) : '';
      var expHead = isCollapsible ? (
        '<div class="cec-exp-head">' +
          '<div class="cec-exp-title"><span class="cec-exp-title-hi">服事</span><span class="cec-exp-title-lo">安排</span><span class="cec-exp-meta">' + esc(month) + '</span></div>' +
          '<button type="button" class="cec-btn cec-btn-collapse" id="cecCollapseBtn" aria-expanded="true">' +
            '<span>收起服事安排</span>' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m18 15-6-6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '</button>' +
        '</div>'
      ) : '';
      var expFoot = isCollapsible ? (
        '<div class="cec-exp-foot">' +
          '<button type="button" class="cec-btn cec-btn-collapse-foot" id="cecCollapseFoot">' +
            '<span>收起服事安排</span>' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m18 15-6-6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '</button>' +
        '</div>'
      ) : '';

      syncExpandState();
      EL.classList.toggle('cec-is-matrix', !personalView && activeView === 'matrix');
      EL.innerHTML = gateHtml + '<div class="cec-body">' + expHead + top + typebar + controls + hiddenBar + (!personalView && activeView === 'matrix' ? zoombar : '') + body + expFoot + '</div>';

      function renderWithSwap() {
        var startH = EL.getBoundingClientRect ? EL.getBoundingClientRect().height : 0;
        if (animTimer) clearTimeout(animTimer);
        EL.classList.remove('is-morphing-open', 'is-morphing-close');
        EL.classList.add('is-switching');
        render();
        var endH = EL.getBoundingClientRect ? EL.getBoundingClientRect().height : 0;
        animateContainerHeight(startH, endH, 280);
        animTimer = setTimeout(function () {
          EL.classList.remove('is-switching');
        }, 280);
      }

      function collapseSchedule(scrollBack) {
        animateExpandTransition(false, function () {
          isExpanded = false;
          exportMenuOpen = false;
          roleMenuOpen = false;
          syncExpandState();
        });
        if (scrollBack && EL.scrollIntoView) {
          try { EL.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (_) {}
        }
      }

      bind('#cecGateOpen', function () {
        animateExpandTransition(true, function () {
          isExpanded = true;
          syncExpandState();
        });
      });
      EL.querySelectorAll('[data-gate-type]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          activeType = this.getAttribute('data-gate-type') || activeType;
          writePreference('type', activeType);
          personalView = false;
          lockedName = null;
          exportMenuOpen = false;
          animateExpandTransition(true, function () {
            isExpanded = true;
            render();
          });
        });
      });
      bind('#cecGatePersonal', function () {
        if (selectedName) {
          personalView = true;
          animateExpandTransition(true, function () {
            isExpanded = true;
            render();
          });
        }
      });
      bind('#cecCollapseBtn', function () { collapseSchedule(false); });
      bind('#cecCollapseFoot', function () { collapseSchedule(true); });

      bind('#mPrev', function () {
        if (activeMonthIdx > 0) { activeMonthIdx--; activeWeek = currentSundayWeek(months[activeMonthIdx]); renderWithSwap(); }
      });
      bind('#mPrevText', function () {
        if (activeMonthIdx > 0) { activeMonthIdx--; activeWeek = currentSundayWeek(months[activeMonthIdx]); renderWithSwap(); }
      });
      bind('#mNext', function () {
        if (activeMonthIdx < months.length - 1) { activeMonthIdx++; activeWeek = currentSundayWeek(months[activeMonthIdx]); renderWithSwap(); }
      });
      bind('#mNextText', function () {
        if (activeMonthIdx < months.length - 1) { activeMonthIdx++; activeWeek = currentSundayWeek(months[activeMonthIdx]); renderWithSwap(); }
      });
      bind('#exportToggle', function (e) {
        if (exportBusy) return;
        e.stopPropagation();
        roleMenuOpen = false;
        exportMenuOpen = !exportMenuOpen;
        syncMenusDom();
      });
      bind('#roleMenuToggle', function (e) {
        e.stopPropagation();
        exportMenuOpen = false;
        roleMenuOpen = !roleMenuOpen;
        syncMenusDom();
      });
      bind('#roleShowAll', function (e) {
        e.stopPropagation();
        writeHiddenRoles([]);
        roleMenuOpen = false;
        renderWithSwap();
      });
      bind('#hiddenBarReset', function (e) {
        e.stopPropagation();
        writeHiddenRoles([]);
        renderWithSwap();
      });
      bind('#zoomOpen', function (e) {
        e.stopPropagation();
        openZoomModal();
      });

      EL.querySelectorAll('[data-toggle-role]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          toggleRoleHidden(this.getAttribute('data-toggle-role'));
          renderWithSwap();
        });
      });

      EL.querySelectorAll('[data-type]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          activeType = this.getAttribute('data-type');
          writePreference('type', activeType);
          personalView = false;
          lockedName = null;
          exportMenuOpen = false;
          renderWithSwap();
        });
      });

      EL.querySelectorAll('[data-export-half]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          var hk = this.getAttribute('data-export-half') || 'H2';
          var mMatch = String(month || '').match(/^(\d{4})年/);
          var yr = mMatch ? parseInt(mMatch[1], 10) : new Date().getFullYear();
          exportMenuOpen = false;
          syncMenusDom();
          openHalfYearPrintModal(yr, hk, rows, byMonth);
        });
      });

      EL.querySelectorAll('[data-export-ratio]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          activeRatio = this.getAttribute('data-export-ratio') || activeRatio;
          EL.querySelectorAll('[data-export-ratio]').forEach(function (b) {
            b.classList.toggle('on', b.getAttribute('data-export-ratio') === activeRatio);
          });
        });
      });

      EL.querySelectorAll('[data-export-target]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          startExport(this.getAttribute('data-export-target'));
        });
      });

      bind('#scheduleWeekPrev', function () { moveWeek(-1); });
      bind('#scheduleWeekNext', function () { moveWeek(1); });
      bind('#scheduleToday', function () {
        activeMonthIdx = pickScheduleMonth(months);
        activeWeek = currentSundayWeek(months[activeMonthIdx]);
        activeView = 'week'; personalView = false; renderWithSwap();
      });
      bind('#scheduleWeekly', function () { activeView = 'week'; personalView = false; renderWithSwap(); });
      bind('#scheduleMatrix', function () { activeView = 'matrix'; personalView = false; renderWithSwap(); });
      bind('#schedulePersonal', function () { personalView = !personalView; renderWithSwap(); });
      EL.querySelector('#scheduleWeek').addEventListener('change', function () {
        activeWeek = this.value; activeView = 'week'; personalView = false; renderWithSwap();
      });
      EL.querySelector('#scheduleName').addEventListener('change', function () {
        selectedName = this.value; writePreference('name', selectedName);
        personalView = !!selectedName; renderWithSwap();
      });
      bindHighlight();
    }

    function moveWeek(direction) {
      var next = WEEK_ORDER.indexOf(activeWeek) + direction;
      if (next < 0 || !sundayDate(months[activeMonthIdx], WEEK_ORDER[next])) {
        var monthIndex = activeMonthIdx + direction;
        if (monthIndex < 0 || monthIndex >= months.length) return;
        activeMonthIdx = monthIndex;
        var weeks = WEEK_ORDER.filter(function (week) { return sundayDate(months[activeMonthIdx], week); });
        activeWeek = direction > 0 ? weeks[0] : weeks[weeks.length - 1];
      } else activeWeek = WEEK_ORDER[next];
      activeView = 'week'; personalView = false; renderWithSwap();
    }

    function startExport(target) {
      if (exportBusy) return;
      var month = months[activeMonthIdx];
      var monthRows = byMonth[month] || [];
      if (target === 'week' || target === 'personal') {
        if (target === 'personal' && !selectedName) {
          exportMenuOpen = false; render(); EL.querySelector('#scheduleName').focus(); return;
        }
        exportMenuOpen = false; render();
        openSchedulePreview(month, monthRows, {type: activeType, week: activeWeek, name: target === 'personal' ? selectedName : ''});
        return;
      }
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

  function scheduleChevron(next) {
    return '<svg class="cec-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="' + (next ? 'm9 6 6 6-6 6' : 'm15 6-6 6 6 6') + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function readPreference(key) {
    try { return localStorage.getItem('cecp-schedule-' + key) || ''; } catch (_) { return ''; }
  }

  function writePreference(key, value) {
    try { localStorage.setItem('cecp-schedule-' + key, value); } catch (_) {}
  }

  function assignmentNames(kind, value) {
    value = tv(value);
    if (kind === 'reading') value = parseReading(value).name;
    if (kind === 'note') value = /^证道[：:]\s*(.+)$/.test(value) ? value.replace(/^证道[：:]\s*/, '') : '';
    return value.split(/[\/\n]/).map(tv).filter(Boolean);
  }

  function scheduleNames(rows) {
    var names = new Set();
    rows.forEach(function (row) {
      var defs = row.type === '祷告会' ? [{key:'leader', kind:'badges'}] : serviceRowsForType(row.type);
      defs.forEach(function (def) { assignmentNames(def.kind, row[def.key]).forEach(function (name) { names.add(name); }); });
    });
    return Array.from(names).sort(function (a, b) { return a.localeCompare(b, 'zh-CN'); });
  }

  function sundayDate(month, week) {
    var match = tv(month).match(/^(\d{4})年(\d{1,2})月$/);
    var index = WEEK_ORDER.indexOf(week);
    if (!match || index < 0) return null;
    var first = new Date(Number(match[1]), Number(match[2]) - 1, 1, 12);
    var date = new Date(first.getFullYear(), first.getMonth(), 1 + (7 - first.getDay()) % 7 + index * 7, 12);
    return date.getMonth() === first.getMonth() ? date : null;
  }

  function sundayLabel(month, week) {
    var date = sundayDate(month, week);
    return date ? (date.getMonth() + 1) + '月' + date.getDate() + '日 周日' : '';
  }

  function pickScheduleMonth(months) {
    var now = new Date();
    var sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - now.getDay()) % 7, 12);
    var label = sunday.getFullYear() + '年' + (sunday.getMonth() + 1) + '月';
    var index = months.indexOf(label);
    return index >= 0 ? index : pickCurrentMonth(months);
  }

  function currentSundayWeek(month) {
    var now = new Date();
    var sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - now.getDay()) % 7, 12);
    var week = WEEK_ORDER.find(function (value) {
      var date = sundayDate(month, value);
      return date && date.getTime() === sunday.getTime();
    });
    if (week) return week;
    var available = WEEK_ORDER.filter(function (value) { return sundayDate(month, value); });
    if (!available.length) return WEEK_ORDER[0];
    return ymOrd(month) <= now.getFullYear() * 100 + now.getMonth() + 1 ? available[available.length - 1] : available[0];
  }

  function renderScheduleCards(rows, options) {
    var items = options.name ? rows.slice() : rows.filter(function (row) {
      return tv(row.week) === options.week && tv(row.type) === options.type;
    });
    if (!options.name && options.type === '祷告会') {
      var sunday = rows.find(function (row) { return row.type === '主日下午' && row.week === options.week && tv(row.prayerLeader); });
      if (sunday) items.push({month:sunday.month, week:sunday.week, type:'祷告会', subtype:'周日下午祷告会', leader:sunday.prayerLeader, time:sunday.time});
    }
    items.sort(function (a, b) {
      return WEEK_ORDER.indexOf(a.week) - WEEK_ORDER.indexOf(b.week) || TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type);
    });
    var cards = items.map(function (row) {
      var defs = row.type === '祷告会' ? [{key:'leader', label:'祷告会带领', kind:'badges'}, {key:'time', label:'时间', kind:'text'}] : serviceRowsForType(row.type);
      if (options.name && !defs.some(function (def) { return assignmentNames(def.kind, row[def.key]).indexOf(options.name) >= 0; })) return '';
      defs = defs.filter(function (def) {
        if (!options.name && row.type !== '祷告会' && isRoleHidden(def.key)) return false;
        return tv(row[def.key]) && (!options.name || def.kind === 'text' || assignmentNames(def.kind, row[def.key]).indexOf(options.name) >= 0);
      });
      if (options.name && !defs.length) return '';
      var details = defs.map(function (def) {
        var content = def.kind === 'text' ? '<div class="cec-cellbox">' + esc(row[def.key]) + '</div>' : renderMatrixCell(def.kind === 'note' && /^证道[：:]/.test(tv(row[def.key])) ? 'badges' : def.kind, def.kind === 'note' ? tv(row[def.key]).replace(/^证道[：:]\s*/, '') : row[def.key]).replace(/^<td[^>]*>|<\/td>$/g, '');
        var hideBtn = (!options.forExport && !options.name && row.type !== '祷告会')
          ? '<button type="button" class="cec-btn cec-row-hide" data-toggle-role="' + esc(def.key) + '" title="隐藏「' + esc(def.label) + '」" aria-label="隐藏' + esc(def.label) + '">' + eyeIconSvg(true) + '</button>'
          : '';
        return '<div class="cec-detail"><dt class="cec-detail-label"><span class="cec-rowlbl-inner"><span class="cec-rowlbl-text">' + esc(def.label) + '</span>' + hideBtn + '</span></dt><dd class="cec-detail-value">' + content + '</dd></div>';
      }).join('');
      var date = row.type === '主日下午' || row.type === '主日晚上' || row.subtype === '周日下午祷告会' ? sundayLabel(row.month, row.week) : '';
      return '<article class="cec-week-card"><header class="cec-card-head"><div><h3>' + esc(row.subtype || row.type) + '</h3><p>' + esc(row.week + (date ? ' · ' + date : '')) + '</p></div></header><dl>' +
        (details || '<div class="cec-card-empty">本周服事人员尚未填写</div>') + '</dl></article>';
    }).join('');
    return '<div class="cec-cards">' + (cards || '<div class="cec-card-empty">' + (options.name ? '本月暂无你的服事安排' : esc(options.week) + '暂无' + esc(options.type) + '安排，请选择其他周次') + '</div>') + '</div>';
  }

  function openSchedulePreview(month, rows, options) {
    if (document.querySelector('.cec-preview-mask')) return;
    var mask = document.createElement('div');
    mask.className = 'cec-preview-mask';
    var title = options.name ? options.name + ' · 我的服事' : options.week + ' · ' + options.type;
    var previewOpts = Object.assign({}, options, { forExport: true });
    mask.innerHTML = '<section class="cec-preview" role="dialog" aria-modal="true" aria-label="导出预览" tabindex="-1"><div class="cec-preview-toolbar"><strong>导出预览</strong><button class="cec-btn cec-control cec-preview-close" type="button">关闭</button></div><div class="cec-share-sheet"><h2>' + esc(month) + '</h2><p>' + esc(title) + '</p>' + renderScheduleCards(rows, previewOpts) + '<p class="cec-share-foot">生成于 ' + esc(new Date().toLocaleString('zh-CN', {timeZone:'Europe/Rome'})) + '</p></div><div class="cec-preview-actions"><span role="status">确认内容后保存图片</span><button class="cec-btn cec-control cec-preview-save" type="button">保存图片</button></div></section>';
    var previousFocus = document.activeElement;
    var previousOverflow = document.body.style.overflow;
    document.body.appendChild(mask); document.body.style.overflow = 'hidden';
    var dialog = mask.querySelector('.cec-preview');
    dialog.focus();
    function close() {
      if (mask.querySelector('.cec-preview-save').disabled) return;
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      closeModalAnimated(mask, function () {
        if (previousFocus && previousFocus.isConnected) previousFocus.focus();
      });
    }
    function onKey(event) {
      if (event.key === 'Escape') close();
      if (event.key !== 'Tab') return;
      var buttons = Array.from(dialog.querySelectorAll('button:not(:disabled)'));
      if (!buttons.length) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === buttons[0] || document.activeElement === dialog)) { event.preventDefault(); buttons[buttons.length - 1].focus(); }
      else if (!event.shiftKey && (document.activeElement === buttons[buttons.length - 1] || document.activeElement === dialog)) { event.preventDefault(); buttons[0].focus(); }
    }
    document.addEventListener('keydown', onKey);
    mask.querySelector('.cec-preview-close').onclick = close;
    mask.onclick = function (event) { if (event.target === mask) close(); };
    mask.querySelector('.cec-preview-save').onclick = function () {
      var button = this, status = mask.querySelector('[role="status"]');
      button.disabled = true; status.textContent = '正在生成图片…';
      var sheet = mask.querySelector('.cec-share-sheet');
      var host = document.createElement('div'); host.className = 'cec-export-shot';
      var copy = sheet.cloneNode(true); copy.style.width = '680px'; host.appendChild(copy); document.body.appendChild(host);
      var fonts = document.fonts ? document.fonts.ready : Promise.resolve();
      fonts.then(waitPaint2).then(function () { return nodeToPngBlobRobust(copy, '#ffffff'); }).then(function (blob) {
        saveBlobAs(blob, safeFileName(month + '_' + title) + '.png'); status.textContent = '图片已保存';
      }).catch(function () { status.textContent = '生成失败，请重试'; }).finally(function () { host.remove(); button.disabled = false; });
    };
  }

  var CN_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  var CN_MONTHS = ['', '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  var WEEK_SHORT = ['一周', '二周', '三周', '四周', '五周'];
  var WEEK_SPACED = ['一 周', '二 周', '三 周', '四 周', '五 周'];

  function toCnYear(year) {
    return String(year || 2026).split('').map(function (d) {
      return CN_DIGITS[parseInt(d, 10)] || d;
    }).join('');
  }

  function getHalfYearMeta(year, halfKey) {
    var isH1 = halfKey === 'H1';
    var startM = isH1 ? 1 : 7;
    var months = [];
    for (var m = startM; m < startM + 6; m++) {
      months.push({
        num: m,
        key: year + '年' + m + '月',
        cn: CN_MONTHS[m]
      });
    }
    return {
      year: year,
      cnYear: toCnYear(year),
      halfKey: isH1 ? 'H1' : 'H2',
      quarterLabel: isH1 ? '一、二季度' : '三、四季度',
      rangeLabel: isH1 ? '1-6月' : '7-12月',
      months: months
    };
  }

  function diagCornerCell(widthPct) {
    return '<th class="cec-hy-diag" style="width:' + (widthPct || 13) + '%">' +
      '<svg class="cec-hy-diag-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><line x1="0" y1="0" x2="100" y2="100" stroke="#111" stroke-width="1.2"/></svg>' +
      '<span class="cec-hy-diag-top">月份</span>' +
      '<span class="cec-hy-diag-bot">周期</span>' +
      '</th>';
  }

  function sevenColGroup() {
    return '<colgroup><col style="width:13%">' +
      '<col style="width:14.5%"><col style="width:14.5%"><col style="width:14.5%">' +
      '<col style="width:14.5%"><col style="width:14.5%"><col style="width:14.5%"></colgroup>';
  }

  function findHalfRow(byMonth, monthKey, week, type, subtype) {
    var list = byMonth[monthKey] || [];
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      if (tv(r.week) !== week || tv(r.type) !== type) continue;
      if (subtype && tv(r.subtype) !== subtype) continue;
      return r;
    }
    return null;
  }

  function cleanPreacherText(val) {
    var s = tv(val);
    if (!s) return '';
    return s.replace(/^证道[：:]\s*/, '').trim();
  }

  function pickHalfCycleRole(byMonth, meta, week, type, roleKey, joinSep) {
    var sep = joinSep || '、';
    var i, r, val;
    for (i = 0; i < meta.months.length; i++) {
      r = findHalfRow(byMonth, meta.months[i].key, week, type, '');
      val = r ? tv(r[roleKey]) : '';
      if (val) return roleKey === 'piano' ? val : val.replace(/\s*\/\s*/g, sep);
    }
    var allKeys = Object.keys(byMonth);
    for (i = 0; i < allKeys.length; i++) {
      r = findHalfRow(byMonth, allKeys[i], week, type, '');
      val = r ? tv(r[roleKey]) : '';
      if (val) return roleKey === 'piano' ? val : val.replace(/\s*\/\s*/g, sep);
    }
    return '';
  }

  function buildHalfYearPage1Html(meta, byMonth) {
    var progRows = [
      ['祷告会', '14:00—14:50'],
      ['敬拜', '15:00—15:25'],
      ['读经', '15:25—15:30'],
      ['诗班献诗', '15:30—15:35'],
      ['颂赞、纪念', '15:35—16:00'],
      ['证道', '16:00—17:00'],
      ['唱诗、祷告(散会)', '17:00']
    ].map(function (pair) {
      return '<tr><td>' + esc(pair[0]) + '</td><td>' + esc(pair[1]) + '</td></tr>';
    }).join('');

    var monthHeaders = meta.months.map(function (m) {
      return '<th>' + esc(m.cn) + '</th>';
    }).join('');

    var preachRows = WEEK_ORDER.map(function (wk, wIdx) {
      var cells = meta.months.map(function (m) {
        var r = findHalfRow(byMonth, m.key, wk, '主日下午', '');
        var spk = r ? cleanPreacherText(r.note) : '';
        return '<td>' + esc(spk) + '</td>';
      }).join('');
      return '<tr><td class="cec-hy-row-wk">' + esc(WEEK_SHORT[wIdx]) + '</td>' + cells + '</tr>';
    }).join('');

    var pmRoleCols = [
      { key: 'leader', label: '领 会', width: '13%' },
      { key: 'worship', label: '敬 拜', width: '13%' },
      { key: 'piano', label: '司琴', width: '17%' },
      { key: 'praisePrayer', label: '颂赞祷告', width: '22%' },
      { key: 'memorialPrayer', label: '纪念祷告', width: '22%' }
    ];
    var pmRoleCg = '<colgroup><col style="width:13%">' + pmRoleCols.map(function (c) {
      return '<col style="width:' + c.width + '">';
    }).join('') + '</colgroup>';
    var pmRoleHeaders = '<th>周期</th>' + pmRoleCols.map(function (c) {
      return '<th>' + esc(c.label) + '</th>';
    }).join('');
    var pmRoleBody = WEEK_ORDER.map(function (wk, wIdx) {
      var tds = pmRoleCols.map(function (c) {
        var v = pickHalfCycleRole(byMonth, meta, wk, '主日下午', c.key);
        return '<td>' + esc(v) + '</td>';
      }).join('');
      return '<tr><td class="cec-hy-row-wk">' + esc(WEEK_SHORT[wIdx]) + '</td>' + tds + '</tr>';
    }).join('');

    var readingRows = WEEK_ORDER.map(function (wk, wIdx) {
      var cells = meta.months.map(function (m) {
        var r = findHalfRow(byMonth, m.key, wk, '主日下午', '');
        var raw = r ? tv(r.reading) : '';
        if (!raw) return '<td></td>';
        var rd = parseReading(raw);
        return '<td><span class="cec-hy-rd-ref">' + esc(rd.ref) + '</span>' +
          (rd.name ? '<span class="cec-hy-rd-name">' + esc(rd.name) + '</span>' : '') + '</td>';
      }).join('');
      return '<tr><td class="cec-hy-row-wk">' + esc(WEEK_SHORT[wIdx]) + '</td>' + cells + '</tr>';
    }).join('');

    return '<div class="cec-hy-sheet" data-hy-page="1">' +
      '<h2 class="cec-hy-h1">' + esc(meta.cnYear + '年' + meta.quarterLabel + '主日崇拜事工表') + '</h2>' +
      '<div class="cec-hy-sec">※主日崇拜程序</div>' +
      '<table class="cec-hy-tbl cec-hy-tbl-prog"><colgroup><col style="width:50%"><col style="width:50%"></colgroup><tbody>' + progRows + '</tbody></table>' +
      '<div class="cec-hy-sec">※圣工表</div>' +
      '<table class="cec-hy-tbl cec-hy-tbl-big">' + sevenColGroup() + '<thead><tr>' + diagCornerCell(13) + monthHeaders + '</tr></thead><tbody>' + preachRows + '</tbody></table>' +
      '<div class="cec-hy-sec">※主日下午事工表</div>' +
      '<table class="cec-hy-tbl cec-hy-tbl-bold">' + pmRoleCg + '<thead><tr>' + pmRoleHeaders + '</tr></thead><tbody>' + pmRoleBody + '</tbody></table>' +
      '<div class="cec-hy-sec">※主日读经</div>' +
      '<table class="cec-hy-tbl cec-hy-tbl-rd">' + sevenColGroup() + '<thead><tr>' + diagCornerCell(13) + monthHeaders + '</tr></thead><tbody>' + readingRows + '</tbody></table>' +
      '</div>';
  }

  function buildHalfYearPage2Html(meta, byMonth) {
    var monthHeaders = meta.months.map(function (m) {
      return '<th>' + esc(m.cn) + '</th>';
    }).join('');

    function buildPrayerGrid(getter) {
      var body = WEEK_ORDER.map(function (wk, wIdx) {
        var tds = meta.months.map(function (m) {
          return '<td>' + esc(getter(m.key, wk) || '') + '</td>';
        }).join('');
        return '<tr><td class="cec-hy-row-wk">' + esc(WEEK_SHORT[wIdx]) + '</td>' + tds + '</tr>';
      }).join('');
      return '<table class="cec-hy-tbl cec-hy-tbl-big cec-hy-tbl-pray">' + sevenColGroup() + '<thead><tr>' + diagCornerCell(13) + monthHeaders + '</tr></thead><tbody>' + body + '</tbody></table>';
    }

    var sunGrid = buildPrayerGrid(function (mKey, wk) {
      var r = findHalfRow(byMonth, mKey, wk, '主日下午', '');
      return r ? tv(r.prayerLeader) : '';
    });
    var wedGrid = buildPrayerGrid(function (mKey, wk) {
      var r = findHalfRow(byMonth, mKey, wk, '祷告会', '周三祷告会');
      return r ? tv(r.leader) : '';
    });
    var satGrid = buildPrayerGrid(function (mKey, wk) {
      var r = findHalfRow(byMonth, mKey, wk, '祷告会', '周六祷告会');
      return r ? tv(r.leader) : '';
    });

    return '<div class="cec-hy-sheet" data-hy-page="2">' +
      '<div class="cec-hy-sec" style="font-size:18px;margin-top:0">※祷告会</div>' +
      '<div class="cec-hy-subcap"><span>主日祷告会带领</span><span class="cec-hy-subcap-meta">时间：14:00—14:50</span><span class="cec-hy-subcap-meta">祷告内容：为主日事奉的人员和会场祷告</span></div>' +
      sunGrid +
      '<div class="cec-hy-subcap" style="margin-top:18px"><span>周三祷告会带领</span><span class="cec-hy-subcap-meta">时间：21:00—22:00</span></div>' +
      wedGrid +
      '<div class="cec-hy-subcap" style="margin-top:18px"><span>周六祷告会带领</span><span class="cec-hy-subcap-meta">时间：07:30—08:30</span></div>' +
      satGrid +
      '<div class="cec-hy-notes">注：PADOVA 祷告会联络负责：胡蓉</div>' +
      '<div class="cec-hy-foot-notes">' +
        '<div>☆星期六 21:00—22:30 练习唱诗</div>' +
        '<div>☆需要代祷的弟兄姐妹散会后留下来，教会同工乐意为您代祷。</div>' +
        '<div>☆初次参加聚会的弟兄姐妹或慕道友，请留下您的电话号码给接待的弟兄姐妹，以便联络。</div>' +
        '<div class="cec-hy-church-sign">PADOVA 基督教华人教会</div>' +
      '</div>' +
      '</div>';
  }

  function buildHalfYearPage3Html(meta, byMonth) {
    var monthHeaders = meta.months.map(function (m) {
      return '<th>' + esc(m.cn) + '</th>';
    }).join('');

    var evePreachRows = WEEK_ORDER.map(function (wk, wIdx) {
      var rowLbl = wIdx === 0 ? '一周<br><span style="font-size:11px;font-weight:700">（圣餐）</span>' : esc(WEEK_SHORT[wIdx]);
      var tds = meta.months.map(function (m) {
        var r = findHalfRow(byMonth, m.key, wk, '主日晚上', '');
        var spk = r ? cleanPreacherText(r.note) : '';
        return '<td>' + esc(spk) + '</td>';
      }).join('');
      return '<tr><td class="cec-hy-row-wk">' + rowLbl + '</td>' + tds + '</tr>';
    }).join('');

    var eveRoleCols = [
      { key: 'leader', label: '领会', width: '19%' },
      { key: 'prayerLeader', label: '带领祷告', width: '22%' },
      { key: 'worship', label: '诗歌敬拜', width: '23%' },
      { key: 'piano', label: '司琴', width: '23%' }
    ];
    var eveRoleCg = '<colgroup><col style="width:13%">' + eveRoleCols.map(function (c) {
      return '<col style="width:' + c.width + '">';
    }).join('') + '</colgroup>';
    var eveRoleHeaders = '<th>周期</th>' + eveRoleCols.map(function (c) {
      return '<th>' + esc(c.label) + '</th>';
    }).join('');
    var eveRoleBody = WEEK_ORDER.map(function (wk, wIdx) {
      var tds = eveRoleCols.map(function (c) {
        var v = pickHalfCycleRole(byMonth, meta, wk, '主日晚上', c.key, '、');
        if (c.key === 'piano') v = v.replace(/\s*\/\s*/g, '、');
        return '<td>' + esc(v) + '</td>';
      }).join('');
      return '<tr><td class="cec-hy-row-wk">' + esc(WEEK_SPACED[wIdx]) + '</td>' + tds + '</tr>';
    }).join('');

    var timeRows = [
      ['20:00', '19:30', '开始用餐'],
      ['20:30—20:55', '20:00—20:25', '诗歌敬拜'],
      ['20:55—21:00', '20:25—20:30', '祷告'],
      ['21:00—22:00', '20:30—21:30', '证道'],
      ['22:00', '21:30', '祝福祷告散会']
    ].map(function (r) {
      return '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td></tr>';
    }).join('');

    return '<div class="cec-hy-sheet" data-hy-page="3">' +
      '<h2 class="cec-hy-h1">' + esc(meta.cnYear + '年' + meta.quarterLabel + '主日晚上崇拜事工表') + '</h2>' +
      '<div class="cec-hy-sec">※圣工表</div>' +
      '<table class="cec-hy-tbl cec-hy-tbl-big">' + sevenColGroup() + '<thead><tr>' + diagCornerCell(13) + monthHeaders + '</tr></thead><tbody>' + evePreachRows + '</tbody></table>' +
      '<div class="cec-hy-sec" style="margin-top:24px">※事工表：</div>' +
      '<table class="cec-hy-tbl cec-hy-tbl-bold">' + eveRoleCg + '<thead><tr>' + eveRoleHeaders + '</tr></thead><tbody>' + eveRoleBody + '</tbody></table>' +
      '<div class="cec-hy-sec" style="margin-top:28px">※聚会时间表：</div>' +
      '<table class="cec-hy-tbl cec-hy-tbl-left"><colgroup><col style="width:32%"><col style="width:32%"><col style="width:36%"></colgroup><thead><tr><th>夏令时</th><th>冬令时</th><th>聚会程序</th></tr></thead><tbody>' + timeRows + '</tbody></table>' +
      '</div>';
  }

  function openHalfYearPrintModal(initialYear, initialHalf, allRows, byMonth) {
    if (document.querySelector('.cec-preview-mask')) return;

    var yearsSet = {};
    yearsSet[initialYear] = true;
    Object.keys(byMonth).forEach(function (m) {
      var mm = m.match(/^(\d{4})年/);
      if (mm) yearsSet[parseInt(mm[1], 10)] = true;
    });
    var years = Object.keys(yearsSet).map(Number).sort();
    var curYear = initialYear;
    var curHalf = initialHalf === 'H1' ? 'H1' : 'H2';
    var busy = false;

    var mask = document.createElement('div');
    mask.className = 'cec-preview-mask';
    var previousFocus = document.activeElement;
    var previousOverflow = document.body.style.overflow;

    function renderModal() {
      var meta = getHalfYearMeta(curYear, curHalf);
      var yearOpts = years.map(function (y) {
        return '<option value="' + y + '"' + (y === curYear ? ' selected' : '') + '>' + y + '年</option>';
      }).join('');

      mask.innerHTML =
        '<section class="cec-preview cec-hy-modal" role="dialog" aria-modal="true" aria-label="半年打印事工表预览" tabindex="-1">' +
          '<div class="cec-hy-toolbar">' +
            '<div class="cec-hy-toolbar-left">' +
              '<strong style="font-size:14px;margin-right:4px">📄 半年打印表</strong>' +
              '<select id="cecHyYear" aria-label="选择年份">' + yearOpts + '</select>' +
              '<button type="button" class="cec-btn cec-hy-btn' + (curHalf === 'H1' ? ' on' : '') + '" data-hy-half="H1">1–6月 (一、二季度)</button>' +
              '<button type="button" class="cec-btn cec-hy-btn' + (curHalf === 'H2' ? ' on' : '') + '" data-hy-half="H2">7–12月 (三、四季度)</button>' +
            '</div>' +
            '<div class="cec-hy-toolbar-right">' +
              '<button type="button" class="cec-btn cec-hy-btn primary" id="cecHyDlMerged">下载合并长图</button>' +
              '<button type="button" class="cec-btn cec-hy-btn" id="cecHyDlAll3">逐页下载 (3张)</button>' +
              '<button type="button" class="cec-btn cec-hy-btn" id="cecHyPrint">打印 / PDF</button>' +
              '<button type="button" class="cec-btn cec-hy-btn" id="cecHyClose">关闭</button>' +
            '</div>' +
          '</div>' +
          '<div class="cec-hy-stage">' +
            '<div class="cec-hy-page-wrap">' +
              '<div class="cec-hy-page-bar"><span>第 1 页 · 主日崇拜事工表（下午程序 / 圣工 / 事工 / 读经）</span><button type="button" class="cec-btn cec-hy-page-dl" data-hy-dl-page="1">下载第1页 PNG</button></div>' +
              '<div class="cec-hy-page-scroll">' + buildHalfYearPage1Html(meta, byMonth) + '</div>' +
            '</div>' +
            '<div class="cec-hy-page-wrap">' +
              '<div class="cec-hy-page-bar"><span>第 2 页 · 祷告会事工表（主日 / 周三 / 周六）</span><button type="button" class="cec-btn cec-hy-page-dl" data-hy-dl-page="2">下载第2页 PNG</button></div>' +
              '<div class="cec-hy-page-scroll">' + buildHalfYearPage2Html(meta, byMonth) + '</div>' +
            '</div>' +
            '<div class="cec-hy-page-wrap">' +
              '<div class="cec-hy-page-bar"><span>第 3 页 · 主日晚上崇拜事工表（圣工 / 事工 / 聚会时间）</span><button type="button" class="cec-btn cec-hy-page-dl" data-hy-dl-page="3">下载第3页 PNG</button></div>' +
              '<div class="cec-hy-page-scroll">' + buildHalfYearPage3Html(meta, byMonth) + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="cec-preview-actions"><span role="status" id="cecHyStatus">已按 PDF 打印版式生成 ' + esc(curYear + '年' + meta.rangeLabel) + ' 事工表（共 3 页）</span></div>' +
        '</section>';

      var yearSel = mask.querySelector('#cecHyYear');
      if (yearSel) {
        yearSel.onchange = function () {
          curYear = parseInt(this.value, 10) || curYear;
          renderModal();
        };
      }
      mask.querySelectorAll('[data-hy-half]').forEach(function (btn) {
        btn.onclick = function () {
          curHalf = this.getAttribute('data-hy-half') || 'H2';
          renderModal();
        };
      });
      mask.querySelector('#cecHyClose').onclick = close;
      mask.querySelectorAll('[data-hy-dl-page]').forEach(function (btn) {
        btn.onclick = function () {
          var pNo = parseInt(this.getAttribute('data-hy-dl-page'), 10);
          downloadSinglePage(pNo);
        };
      });
      mask.querySelector('#cecHyDlAll3').onclick = downloadAllPagesSeparately;
      mask.querySelector('#cecHyDlMerged').onclick = downloadMergedLongImage;
      mask.querySelector('#cecHyPrint').onclick = printHalfYearSheets;
    }

    function setStatus(txt) {
      var st = mask.querySelector('#cecHyStatus');
      if (st) st.textContent = txt;
    }

    function exportSheetElementToBlob(sheetEl) {
      var host = document.createElement('div');
      host.className = 'cec-export-shot';
      var copy = sheetEl.cloneNode(true);
      copy.style.width = '794px';
      host.appendChild(copy);
      document.body.appendChild(host);
      var fonts = document.fonts ? document.fonts.ready : Promise.resolve();
      return fonts
        .then(waitPaint2)
        .then(function () { return nodeToPngBlobRobust(copy, '#ffffff'); })
        .finally(function () { host.remove(); });
    }

    function downloadSinglePage(pageNo) {
      if (busy) return Promise.resolve();
      var meta = getHalfYearMeta(curYear, curHalf);
      var sheetEl = mask.querySelector('[data-hy-page="' + pageNo + '"]');
      if (!sheetEl) return Promise.resolve();
      var pageNames = { 1: '第1页_主日下午崇拜', 2: '第2页_祷告会', 3: '第3页_主日晚上崇拜' };
      busy = true;
      setStatus('正在生成第 ' + pageNo + ' 页高清图片…');
      return exportSheetElementToBlob(sheetEl)
        .then(function (blob) {
          saveBlobAs(blob, safeFileName(curYear + '年' + meta.rangeLabel + '_事工表_' + (pageNames[pageNo] || ('第' + pageNo + '页'))) + '.png');
          setStatus('第 ' + pageNo + ' 页图片已保存');
        })
        .catch(function () {
          setStatus('生成失败，请重试');
        })
        .finally(function () {
          busy = false;
        });
    }

    function downloadAllPagesSeparately() {
      if (busy) return;
      downloadSinglePage(1)
        .then(function () { return downloadSinglePage(2); })
        .then(function () { return downloadSinglePage(3); })
        .then(function () { setStatus('全部 3 页图片已依次保存'); });
    }

    function downloadMergedLongImage() {
      if (busy) return;
      var meta = getHalfYearMeta(curYear, curHalf);
      var sheets = mask.querySelectorAll('.cec-hy-sheet');
      if (!sheets.length) return;
      busy = true;
      setStatus('正在生成 3 页合并高清长图…');
      var host = document.createElement('div');
      host.className = 'cec-export-shot';
      var wrapper = document.createElement('div');
      wrapper.style.cssText = 'width:794px;background:#ffffff;display:flex;flex-direction:column;gap:0;';
      Array.prototype.forEach.call(sheets, function (sh, idx) {
        var copy = sh.cloneNode(true);
        copy.style.width = '794px';
        if (idx > 0) copy.style.borderTop = '2px dashed #cbd5e1';
        wrapper.appendChild(copy);
      });
      host.appendChild(wrapper);
      document.body.appendChild(host);
      var fonts = document.fonts ? document.fonts.ready : Promise.resolve();
      fonts
        .then(waitPaint2)
        .then(function () { return nodeToPngBlobRobust(wrapper, '#ffffff'); })
        .then(function (blob) {
          saveBlobAs(blob, safeFileName(curYear + '年' + meta.rangeLabel + '_主日崇拜事工表_全3页') + '.png');
          setStatus('合并长图已保存');
        })
        .catch(function () {
          setStatus('生成失败，请重试');
        })
        .finally(function () {
          host.remove();
          busy = false;
        });
    }

    function printHalfYearSheets() {
      var meta = getHalfYearMeta(curYear, curHalf);
      var styleEl = document.getElementById('_cecp_yearsafe_style_v2');
      var cssText = styleEl ? styleEl.textContent : '';
      var pagesHtml = Array.prototype.map.call(mask.querySelectorAll('.cec-hy-sheet'), function (sh) {
        return sh.outerHTML;
      }).join('');
      var w = window.open('', '_blank');
      if (!w) {
        window.print();
        return;
      }
      w.document.open();
      w.document.write(
        '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>' +
        esc(curYear + '年' + meta.rangeLabel + '主日崇拜事工表') +
        '</title><style>' + cssText +
        '@page{size:A4 portrait;margin:0}' +
        'html,body{margin:0;padding:0;background:#fff;color:#000;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
        // 与下载图片完全同一版式：每页就是一张 794×1123 的 A4 画布，四周留白与图片一致
        '.cec-hy-sheet{width:210mm!important;max-width:none!important;height:296mm!important;min-height:0!important;margin:0!important;padding:30px 44px 28px!important;box-sizing:border-box!important;overflow:hidden!important;page-break-after:always;break-after:page;page-break-inside:avoid;break-inside:avoid}' +
        '.cec-hy-sheet:last-child{page-break-after:auto;break-after:auto}' +
        '.cec-hy-tbl{page-break-inside:avoid;break-inside:avoid}' +
        '</style></head><body>' + pagesHtml +
        '<script>window.onload=function(){setTimeout(function(){window.print();},200);};<\/script></body></html>'
      );
      w.document.close();
    }

    function close() {
      if (busy) return;
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      closeModalAnimated(mask, function () {
        if (previousFocus && previousFocus.isConnected) previousFocus.focus();
      });
    }

    function onKey(event) {
      if (event.key === 'Escape') close();
    }

    document.body.appendChild(mask);
    document.body.style.overflow = 'hidden';
    renderModal();
    var dialog = mask.querySelector('.cec-preview');
    if (dialog) dialog.focus();
    document.addEventListener('keydown', onKey);
    mask.onclick = function (event) { if (event.target === mask) close(); };
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
      weeks.map(function (w) { return '<th class="cec-h">' + esc(w) + (opt.month && sundayDate(opt.month, w) ? '<small class="cec-date" title="' + esc(sundayLabel(opt.month, w)) + '">' + (sundayDate(opt.month, w).getMonth() + 1) + '/' + sundayDate(opt.month, w).getDate() + '</small>' : '') + '</th>'; }).join('') +
      '</tr></thead>';

    var tbody = '<tbody>';
    rowDefs.forEach(function (rowDef) {
      var shortLabel = {leader:'主领', worship:'敬拜', prayerLeader:'祷告带领', sound:'调音', ppt:'PPT', broadcast:'转播'}[rowDef.key] || rowDef.label;
      var labelHtml = opt.adaptive
        ? '<span class="cec-label-long">' + esc(rowDef.label) + '</span><span class="cec-label-short">' + esc(shortLabel) + '</span>'
        : esc(rowDef.label);
      var hideBtn = !opt.compact
        ? '<button type="button" class="cec-btn cec-row-hide" data-toggle-role="' + esc(rowDef.key) + '" title="隐藏「' + esc(rowDef.label) + '」" aria-label="隐藏' + esc(rowDef.label) + '">' + eyeIconSvg(true) + '</button>'
        : '';
      tbody += '<tr><td class="cec-rowlbl"><div class="cec-rowlbl-inner"><span class="cec-rowlbl-text">' + labelHtml + '</span>' + hideBtn + '</div></td>';

      weeks.forEach(function (w) {
        var item = filtered.find(function (r) { return tv(r.week) === w; });
        var val = item ? item[rowDef.key] : '';
        tbody += renderMatrixCell(rowDef.kind, val);
      });

      tbody += '</tr>';
    });
    tbody += '</tbody>';

    return '<div class="cec-wrap' + (opt.adaptive ? ' cec-month-table' : '') + '" style="--cec-week-columns:' + weeks.length + '"><table class="cec-tbl">' + cg + thead + tbody + '</table></div>';
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

    return '<div class="cec-wrap' + (opt.adaptive ? ' cec-month-table' : '') + '" style="--cec-week-columns:' + cols.length + '"><table class="cec-tbl">' + cg + thead + tbody + '</table></div>';
  }

  function renderPrayerCell(item, opt) {
    opt = opt || {};
    if (!item) return renderEmptyCell();

    var name = tv(item.leader);
    var time = tv(item.time);
    var note = tv(item.note);

    var html = '<td class="cec-cell"><div class="cec-cellbox"><div class="cec-note">';
    if (name) html += mkBadge(name);
    if (time) html += '<span class="cec-npfx">' + esc(time) + '</span>';
    if (note && !opt.compact) html += '<span style="font-size:11px;color:#aeb6c3;line-height:1.3">' + esc(note) + '</span>';
    html += '</div></div></td>';
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
        { key: 'note',           label: '证道',        kind: 'note' },
        { key: 'sound',          label: '调音',        kind: 'badges' },
        { key: 'ppt',            label: 'PPT播放',     kind: 'badges' },
        { key: 'broadcast',      label: '转播和话筒',  kind: 'badges' }
      ];
    }

    if (type === '主日晚上') {
      return [
        { key: 'leader',    label: '主领 / 带领', kind: 'badges' },
        { key: 'worship',   label: '敬拜带领',    kind: 'badges' },
        { key: 'piano',     label: '司琴',        kind: 'badges' },
        { key: 'drums',     label: '鼓',          kind: 'badges' },
        { key: 'guitar',    label: '吉他',        kind: 'badges' },
        { key: 'bass',      label: '贝斯',        kind: 'badges' },
        { key: 'note',      label: '证道',        kind: 'note' },
        { key: 'sound',     label: '调音',        kind: 'badges' },
        { key: 'ppt',       label: 'PPT播放',     kind: 'badges' },
        { key: 'broadcast', label: '转播和话筒',  kind: 'badges' }
      ];
    }

    return [
      { key: 'worship',   label: '敬拜带领',    kind: 'badges' },
      { key: 'piano',     label: '司琴',        kind: 'badges' },
      { key: 'drums',     label: '鼓',          kind: 'badges' },
      { key: 'guitar',    label: '吉他',        kind: 'badges' },
      { key: 'bass',      label: '贝斯',        kind: 'badges' },
      { key: 'note',      label: '证道 / 主题', kind: 'note' },
      { key: 'sound',     label: '调音',        kind: 'badges' },
      { key: 'ppt',       label: 'PPT播放',     kind: 'badges' },
      { key: 'broadcast', label: '转播和话筒',  kind: 'badges' }
    ];
  }

  function getNonEmptyServiceRows(type, filteredRows, opt) {
    var defs = serviceRowsForType(type);
    if (!opt || !opt.trimEmptyRows) return defs;
    var visible = defs.filter(function (def) {
      return filteredRows.some(function (row) { return tv(row[def.key]); });
    });
    return visible.length ? visible : defs;
  }

  function getVisibleServiceRows(type, filteredRows, opt) {
    var active = getNonEmptyServiceRows(type, filteredRows, opt);
    if (opt && opt.ignoreHidden) return active;
    var shown = active.filter(function (def) {
      return !isRoleHidden(def.key);
    });
    return shown.length ? shown : active;
  }

  function renderEmptyCell() {
    return '<td class="cec-cell"><div class="cec-cellbox"><span class="cec-empty">—</span></div></td>';
  }

  function renderMatrixCell(kind, val) {
    val = tv(val);

    if (kind === 'reading') {
      if (!val) return renderEmptyCell();
      var rd = parseReading(val);
      return '<td class="cec-cell"><div class="cec-cellbox"><div class="cec-reading">' +
        '<span class="cec-ref">' + esc(rd.ref) + '</span>' +
        (rd.name ? mkBadge(rd.name) : '') +
        '</div></div></td>';
    }

    if (kind === 'note') {
      if (!val) return renderEmptyCell();
      var m = val.match(/^(证道[：:]\s*)(.+)$/);
      if (m) {
        return '<td class="cec-cell"><div class="cec-cellbox"><div class="cec-note"><span class="cec-npfx">' + esc(m[1]) + '</span>' + mkBadge(m[2]) + '</div></div></td>';
      }
      return '<td class="cec-cell"><div class="cec-cellbox"><div class="cec-note">' + mkBadge(val) + '</div></div></td>';
    }

    if (!val) return renderEmptyCell();

    var parts = String(val).split(/[\/\n]/).map(function (x) { return x.trim(); }).filter(Boolean);
    return '<td class="cec-cell"><div class="cec-cellbox"><div class="cec-badges">' + parts.map(mkBadge).join('') + '</div></div></td>';
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

  function palIndex(name) {
    var h = 0;
    for (var i = 0; i < name.length; i++) h = (Math.imul(31, h) + name.charCodeAt(i)) | 0;
    return Math.abs(h) % PAL.length;
  }

  function badgeColor(name) {
    return PAL[palIndex(name)];
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

    EL.onclick = function () {
      if (lockedName) {
        lockedName = null;
        clearHighlight();
      }
    };
    if (lockedName) applyHighlight(lockedName, true);
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

  function openZoomModal() {
    var srcTbl = EL.querySelector('.cec-wrap .cec-tbl');
    if (!srcTbl) return;
    if (document.querySelector('.cec-zoom-mask')) return;

    var mask = document.createElement('div');
    mask.className = 'cec-zoom-mask';
    mask.innerHTML =
      '<div class="cec-zoom-panel">' +
      '<div class="cec-zoom-head">' +
      '<div><div class="cec-zoom-title">放大查看</div><div class="cec-zoom-hint">已显示整表 · 双指缩放或双击放大细看</div></div>' +
      '<button class="cec-btn cec-zoom-close" type="button" aria-label="关闭">✕</button>' +
      '</div>' +
      '<div class="cec-zoom-scroll"><div class="cec-zoom-spacer"><div class="cec-zoom-body"></div></div></div>' +
      '</div>';

    var scroll = mask.querySelector('.cec-zoom-scroll');
    var spacer = mask.querySelector('.cec-zoom-spacer');
    var zBody = mask.querySelector('.cec-zoom-body');
    zBody.appendChild(srcTbl.cloneNode(true));

    var prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.appendChild(mask);

    var natW = 1, natH = 1, zoom = 1, fitZoom = 1;
    function measure() {
      zBody.style.transform = 'none';
      var rect = zBody.getBoundingClientRect();
      natW = Math.max(1, Math.ceil(rect.width));
      natH = Math.max(1, Math.ceil(rect.height));
    }
    function applyZoom() {
      zBody.style.transform = 'scale(' + zoom + ')';
      spacer.style.width = Math.ceil(natW * zoom) + 'px';
      spacer.style.height = Math.ceil(natH * zoom) + 'px';
    }
    function fitToScreen() {
      // 打开时先让整张表完整地缩放进屏幕，再由用户放大看细节
      var availW = Math.max(1, scroll.clientWidth);
      var availH = Math.max(1, scroll.clientHeight);
      fitZoom = Math.min(availW / natW, availH / natH);
      if (!isFinite(fitZoom) || fitZoom <= 0) fitZoom = 1;
      zoom = fitZoom;
      applyZoom();
    }
    measure();
    fitToScreen();

    function onKey(e) {
      if (e.key === 'Escape') close();
    }
    function close() {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      closeModalAnimated(mask);
    }
    document.addEventListener('keydown', onKey);

    mask.addEventListener('click', function (e) {
      if (e.target === mask) close();
    });
    mask.querySelector('.cec-zoom-close').addEventListener('click', close);

    function toggleZoom() {
      // 在「整表」和「可读放大」两档之间切换
      zoom = zoom <= fitZoom + 0.01 ? Math.max(fitZoom * 2, 1) : fitZoom;
      applyZoom();
    }
    scroll.addEventListener('dblclick', function (e) {
      e.preventDefault();
      toggleZoom();
    });

    var lastTap = 0;
    scroll.addEventListener('touchend', function (e) {
      if (e.touches.length) return;
      var now = Date.now();
      if (now - lastTap < 300) {
        e.preventDefault();
        toggleZoom();
        lastTap = 0;
      } else {
        lastTap = now;
      }
    });

    var pinchDist = 0, pinchZoom = 1;
    function touchDist(e) {
      var a = e.touches[0], b = e.touches[1];
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    }
    scroll.addEventListener('touchstart', function (e) {
      if (e.touches.length === 2) {
        pinchDist = touchDist(e);
        pinchZoom = zoom;
      }
    }, { passive: true });
    scroll.addEventListener('touchmove', function (e) {
      if (e.touches.length === 2 && pinchDist > 0) {
        e.preventDefault();
        zoom = Math.min(4, Math.max(Math.min(fitZoom, 1), pinchZoom * touchDist(e) / pinchDist));
        applyZoom();
      }
    }, { passive: false });
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
      weeks.map(function (w) { return '<th class="cec-h">' + esc(w) + (opt.month ? '<small class="cec-date">' + esc(sundayLabel(opt.month, w)) + '</small>' : '') + '</th>'; }).join('') +
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
    var sections = [];
    ordered.forEach(function (type, idx) {
      var html = renderExportTypeSection(rows, type, { compact: true, dense: true, trimEmptyRows: true });
      if (!html) return;
      sections.push({ idx: idx, html: html, weight: (html.match(/<tr/g) || []).length });
    });

    // 按行数贪心分配到较矮的一列：面板不再被拉伸，避免框内出现大片空白
    var cols = [{ h: 0, items: [] }, { h: 0, items: [] }];
    sections.slice().sort(function (a, b) { return b.weight - a.weight; }).forEach(function (s) {
      var col = cols[0].h <= cols[1].h ? cols[0] : cols[1];
      col.items.push(s);
      col.h += s.weight;
    });
    cols.forEach(function (col) {
      col.items.sort(function (a, b) { return a.idx - b.idx; });
    });

    return '<div class="cec-export-grid">' +
      cols.filter(function (col) { return col.items.length; }).map(function (col) {
        return '<div class="cec-export-col">' +
          col.items.map(function (s) { return s.html; }).join('') +
          '</div>';
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
    var naturalW = Math.max(1, Math.ceil(card.scrollWidth || card.offsetWidth) + 8);
    var naturalH = Math.max(1, Math.ceil(card.scrollHeight || card.offsetHeight) + 8);
    var viewportW = Math.max(1, Math.floor(viewport.clientWidth) - 8);
    var viewportH = Math.max(1, Math.floor(viewport.clientHeight) - 8);

    // 严格保持画布比例：内容整体等比缩放塞进 viewport 并居中，预留安全边距防止右边与底部边框被裁切
    var scale = Math.min(viewportW / naturalW, viewportH / naturalH);
    if (!isFinite(scale) || scale <= 0) scale = 1;

    var scaledW = Math.max(1, Math.ceil(naturalW * scale));
    var scaledH = Math.max(1, Math.ceil(naturalH * scale));

    scaleWrap.style.width = scaledW + 'px';
    scaleWrap.style.height = scaledH + 'px';
    scaleWrap.style.marginLeft = Math.max(0, Math.floor((viewport.clientWidth - scaledW) / 2)) + 'px';
    scaleWrap.style.marginTop = Math.max(0, Math.floor((viewport.clientHeight - scaledH) / 2)) + 'px';
    card.style.position = 'absolute';
    card.style.left = '0px';
    card.style.top = '0px';
    card.style.transformOrigin = 'left top';
    card.style.transform = 'scale(' + scale + ')';
  }

  function waitForNodeImages(node) {
    if (!node) return Promise.resolve();
    var imgs = Array.prototype.slice.call(node.querySelectorAll('img'));
    // A completed failed image has already fired its error event.
    var pending = imgs.filter(function (img) { return !img.complete; });
    if (!pending.length) return Promise.resolve();

    return Promise.all(pending.map(function (img) {
      return new Promise(function (resolve) {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      });
    }));
  }

  function applyExportBadgeTheme(root) {
    if (!root) return;
    root.querySelectorAll('.cec-badge').forEach(function (badge) {
      var name = tv(badge.getAttribute('data-name') || badge.textContent);
      var c = PAL_SOFT[palIndex(name)];
      badge.style.background = c[0];
      badge.style.color = c[1];
      badge.style.border = '1px solid ' + c[2];
    });
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
      var bw = parseFloat(badgeCs.borderTopWidth) || 0;
      var bc = bw > 0 ? (badgeCs.borderTopColor || '') : '';
      var inset = bw / 2;
      var svg = [
        '<svg xmlns="http://www.w3.org/2000/svg" width="', width, '" height="', height, '" viewBox="0 0 ', width, ' ', height, '">',
        '<rect x="', inset, '" y="', inset, '" width="', Math.max(1, width - bw), '" height="', Math.max(1, height - bw), '" rx="', radius, '" ry="', radius, '" fill="', bg, '"',
        bc ? ' stroke="' + bc + '" stroke-width="' + bw + '"' : '',
        '></rect>',
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

    var watermark = document.createElement('img');
    watermark.className = 'cec-export-watermark';
    watermark.src = LOGO_SRC;
    watermark.alt = '';
    watermark.setAttribute('aria-hidden', 'true');
    frame.appendChild(watermark);

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
      // 严格保持画布比例后，单列长表会被整体缩得过小，两种比例统一用双列面板布局
      bodyWrap.innerHTML = renderLandscapePanels(rows, types);
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

    applyExportBadgeTheme(card);
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
      var settled = false;
      function done() {
        if (settled) return;
        settled = true;
        resolve();
      }
      // 后台/不渲染的标签页里 rAF 不触发，用定时器兜底避免导出卡死
      setTimeout(done, 350);
      requestAnimationFrame(function () {
        requestAnimationFrame(done);
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
      var settled = false;
      function done() {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(window.html2canvas);
      }
      function fail(err) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        _cecH2cPromise = null; // 失败后允许下次导出重试
        reject(err);
      }
      // CDN 请求可能长时间挂起（弱网/断网），超时后交给 svg 兜底，避免导出永远卡住
      var timer = setTimeout(function () { fail(new Error('html2canvas load timeout')); }, 8000);

      function inject(src, next) {
        var s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = function () {
          if (window.html2canvas) done();
          else if (next) inject(next, null);
          else fail(new Error('html2canvas unavailable'));
        };
        s.onerror = function () {
          s.remove();
          if (next) inject(next, null);
          else fail(new Error('html2canvas load failed'));
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

  function getExportScale(width, height) {
    var w = Math.max(1, width);
    var h = Math.max(1, height);
    var scale = Math.min(3, EXPORT_MAX_CANVAS_SIDE / w, EXPORT_MAX_CANVAS_SIDE / h);
    if (!isFinite(scale) || scale <= 0) scale = 1;
    return scale;
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
        var rect = node.getBoundingClientRect();
        return html2canvas(node, {
          backgroundColor: bgColor || '#f4f6f9',
          scale: getExportScale(Math.ceil(rect.width), Math.ceil(rect.height)),
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
        var scale = getExportScale(width, height);

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
    var bg = '#ffffff';
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
