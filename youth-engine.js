/**
 * youth-engine.js v3.1
 * 橄榄树团契 · 青年聚会渲染引擎
 * 托管于 GitHub Pages，所有帖子共用
 *
 * 使用方式A（新，推荐）：
 *   YouthEngine.render('2026-03', document.getElementById('ym-root'));
 *
 * 使用方式B（旧，向后兼容）：
 *   window.YouthMeeting = { ... }; // 帖子里定义
 *   <script src="youth-engine.js"></script>  // 自动读取并渲染
 */

/* ══════════ GitHub Pages 基础路径 ══════════ */
var YM_BASE = 'https://cye04.github.io/Cecp';
var YM_LOGO_SRC = (function () {
  try {
    var cur = document.currentScript && document.currentScript.src ? new URL(document.currentScript.src, location.href) : null;
    return cur ? new URL('musiclib/olive-fellowship-logo.png', cur.href).href : 'musiclib/olive-fellowship-logo.png';
  } catch (_) {
    return 'musiclib/olive-fellowship-logo.png';
  }
})();

window.YouthEngine = {};

(function () {
  'use strict';

  // 模块级变量，由 _run() 赋值
  var C, ROOT;

  function _applyDefaults(C) {
    C.time       = C.time       || '每周日 12:00 – 13:30';
    C.gameText   = C.gameText   || '本周没有游戏活动哦👀';
    C.schedule   = C.schedule   || [
      { time:'12:00 – 12:30', event:'诗歌敬拜',   emoji:'🎶' },
      { time:'12:30 – 13:30', event:'圣经分享',   emoji:'📖' },
      { time:'13:30',          event:'祷告 & 结束', emoji:'🙏' },
    ];
    C.songs  = C.songs  || [];
    C.apiBase = C.apiBase || 'https://script.google.com/macros/s/AKfycbxihf7j08Pkus9rWBqectkmJ7PbJNVdhPTrbNL8v3wm1vTbJ76xE6ksNKytTe4SUii3_Q/exec';
  }

  /* ══════════════ CSS 只注入一次 ══════════════ */
  var _cssInjected = false;
  function _injectCSS() {
    if (_cssInjected) return;
    _cssInjected = true;

    var fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&family=DM+Mono:wght@400;500&family=Space+Mono:wght@400;700&display=swap';
    document.head.appendChild(fontLink);

    var style = document.createElement('style');
    style.textContent = `
/* ── theme vars ── */
:root{
  --ym-bg:#f8fafc;--ym-card:#fff;--ym-ink:#1a1815;--ym-ink2:#7c746c;--ym-ink3:#b8b0a8;
  --ym-border:rgba(0,0,0,.08);--ym-border-md:rgba(0,0,0,.14);--ym-soft:rgba(26,24,21,.06);
  --ym-sh:0 2px 8px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04);
  --ym-sh-lg:0 8px 32px rgba(0,0,0,.10),0 2px 6px rgba(0,0,0,.05);
  --ym-glow:rgba(59,91,253,.14);--ym-warm:rgba(245,158,11,.16);--ym-mint:rgba(16,185,129,.13);
  --ym-page:#f6f8fb;--ym-panel:#ffffff;--ym-panel-2:#f4f7fb;--ym-glass:rgba(255,255,255,.78);
  --ym-elev:0 24px 80px rgba(15,23,42,.12),0 1px 0 rgba(255,255,255,.85) inset;
  --ym-chip:rgba(255,255,255,.70);--ym-chip-hover:#ffffff;--ym-line:rgba(15,23,42,.10);
  --ym-brand:#3157f6;--ym-brand2:#10a7a5;--ym-brand3:#f59e0b;
  --ym-on-brand:#ffffff;
  --ym-capo:#c2410c;--ym-capo-bg:rgba(194,65,12,.08);--ym-capo-ln:rgba(194,65,12,.2);
  --ym-accent:#3b5bfd;--ym-accent2:#5b7cfa;
  --yb:#fff;--yt:#111;--ym:rgba(0,0,0,.62);--ybr:rgba(0,0,0,.12);--ysh:rgba(0,0,0,.30);--ybk:rgba(0,0,0,.55);
}
@media(prefers-color-scheme:dark){
  :root{
    --ym-bg:#0f172a;--ym-card:rgba(255,255,255,.05);--ym-ink:rgba(255,255,255,.88);--ym-ink2:rgba(255,255,255,.44);--ym-ink3:rgba(255,255,255,.2);
    --ym-border:rgba(255,255,255,.09);--ym-border-md:rgba(255,255,255,.16);--ym-soft:rgba(255,255,255,.07);
    --ym-sh:0 2px 8px rgba(0,0,0,.4),0 1px 3px rgba(0,0,0,.3);
    --ym-sh-lg:0 8px 40px rgba(0,0,0,.5),0 2px 8px rgba(0,0,0,.3);
    --ym-glow:rgba(91,124,250,.22);--ym-warm:rgba(251,146,60,.14);--ym-mint:rgba(52,211,153,.13);
    --ym-page:#0f172a;--ym-panel:#111827;--ym-panel-2:#172033;--ym-glass:rgba(17,24,39,.76);
    --ym-elev:0 28px 90px rgba(0,0,0,.42),0 1px 0 rgba(255,255,255,.08) inset;
    --ym-chip:rgba(255,255,255,.09);--ym-chip-hover:rgba(255,255,255,.14);--ym-line:rgba(255,255,255,.12);
    --ym-brand:#7c9cff;--ym-brand2:#34d3c9;--ym-brand3:#fbbf24;
    --ym-on-brand:#07101f;
    --ym-capo:#fb923c;--ym-capo-bg:rgba(251,146,60,.1);--ym-capo-ln:rgba(251,146,60,.22);
    --yb:#161616;--yt:rgba(255,255,255,.92);--ym:rgba(255,255,255,.70);--ybr:rgba(255,255,255,.15);--ysh:rgba(0,0,0,.65);--ybk:rgba(0,0,0,.80);
  }
}
*,*::before,*::after{box-sizing:border-box}
.ym-tilt{position:relative;max-width:100%;transform-style:preserve-3d;transition:box-shadow .18s ease,border-color .18s ease}
.ym-tilt::after{content:'';position:absolute;inset:0;border-radius:inherit;background:radial-gradient(circle at var(--ym-spot-x,50%) var(--ym-spot-y,0%),rgba(255,255,255,.32),transparent 34%);opacity:0;pointer-events:none;transition:opacity .22s ease;mix-blend-mode:soft-light}
.ym-tilt:hover{box-shadow:0 22px 70px rgba(15,23,42,.16),var(--ym-sh-lg);border-color:var(--ym-border-md)}
.ym-tilt:hover::after{opacity:1}
.ym-reveal{opacity:1;transform:none}
.ym-reveal.in{opacity:1;transform:none}
@media(hover:none),(pointer:coarse){.ym-tilt:hover{box-shadow:var(--ym-sh-lg);transform:none!important}.ym-tilt::after{display:none}}
@media(prefers-reduced-motion:reduce){.ym-tilt,.ym-tilt::after,.ym-reveal{transition:none!important;transform:none!important}.ym-reveal{opacity:1!important}}

/* ── Welcome Modal ── */
html.ym-open,html.ym-open body{overflow:hidden!important}
#ymOverlay{position:fixed;inset:0;background:var(--ybk);backdrop-filter:blur(6px);z-index:2147483646;display:none}
#ymModal{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(900px,calc(100vw - 32px));max-height:min(85vh,760px);background:var(--yb);color:var(--yt);border:1px solid var(--ybr);border-radius:22px;box-shadow:0 40px 120px var(--ysh);overflow:hidden;z-index:2147483647;font-family:system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;font-size:clamp(14px,.35vw + 12px,17px)}
#ymModal .yLayout{display:flex;flex-direction:column;height:100%;max-height:inherit}
#ymModal .yBody{flex:1;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:16px}
#ymModal .yGrid{display:grid;grid-template-columns:1.2fr .9fr;gap:12px}
@media(max-width:640px){#ymModal .yGrid{grid-template-columns:1fr}}
#ymModal .yCard{border:1px solid var(--ybr);border-radius:16px;padding:14px}
#ymModal .yTitle{font-size:1.4em;font-weight:800;margin:0 0 .5em}
#ymModal .ySub{color:var(--ym);margin:0 0 .8em;line-height:1.7}
#ymModal .yText{margin:0;line-height:1.9;white-space:pre-line;word-break:break-word}
#ymModal .yPanelTitle{font-weight:700;color:var(--ym);margin:0 0 .8em;font-size:.85em}
#ymModal .yChipList{display:flex;flex-direction:column;gap:10px}
#ymModal .yChip{border:1px solid var(--ybr);border-radius:14px;padding:10px 12px}
#ymModal .yChip .k{font-size:.8em;color:var(--ym);margin:0 0 3px}
#ymModal .yChip .v{font-weight:750;margin:0}
#ymModal .yFooter{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 14px;border-top:1px solid var(--ybr);background:var(--yb)}
#ymModal .yCheck{display:flex;gap:8px;align-items:center;color:var(--ym);font-size:.88em;user-select:none;cursor:pointer}
#ymModal .yBtns{display:flex;gap:8px}
#ymModal button{border-radius:999px;padding:8px 16px;font-size:.92em;cursor:pointer;border:1px solid var(--ybr);background:transparent;color:var(--ym)}
#ymModal button.primary{background:var(--yt);color:var(--yb);border-color:transparent}

/* ── Hero ── */
.ym-hero{position:relative;isolation:isolate;overflow:hidden;max-width:960px;width:100%;min-width:0;margin:0 auto 2rem;padding:2.35rem 1.7rem 2.45rem;border-radius:28px;text-align:center;background:linear-gradient(180deg,var(--ym-glass),var(--ym-panel-2));border:1px solid var(--ym-line);box-shadow:var(--ym-elev);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
.ym-hero::before{content:'';position:absolute;inset:0;z-index:-1;border-radius:inherit;background:radial-gradient(ellipse at 50% -18%,color-mix(in srgb,var(--ym-brand) 14%,transparent),transparent 48%),radial-gradient(ellipse at 50% 112%,color-mix(in srgb,var(--ym-brand2) 10%,transparent),transparent 50%),linear-gradient(180deg,rgba(255,255,255,.18),transparent 48%,rgba(255,255,255,.10))}
.ym-hero::after{content:'';position:absolute;inset:0;z-index:-1;border-radius:inherit;background:linear-gradient(180deg,rgba(255,255,255,.22),transparent 42%);pointer-events:none}
@keyframes ym-ambient{from{transform:translate3d(-1.5%,0,0) rotate(-2deg)}to{transform:translate3d(1.5%,1%,0) rotate(2deg)}}
@keyframes ym-sheen{0%,38%{transform:translateX(-120%)}56%,100%{transform:translateX(120%)}}
.ym-hero h1{font-size:clamp(1.6rem,4vw,2.2rem);font-weight:800;color:var(--ym-ink);margin:0 0 .4rem;letter-spacing:-.01em;line-height:1.24;overflow-wrap:anywhere}
.ym-hero .sub{font-size:.95rem;color:var(--ym-ink2);margin:0 0 .5rem}
.ym-hero .tm{font-size:.88rem;color:var(--ym-ink3);margin:0 0 1.8rem}
.ym-nav{display:flex;justify-content:center;gap:10px;flex-wrap:wrap}
.ym-nav-btn{min-width:0;padding:10px 20px;border-radius:999px;border:1px solid var(--ym-line);background:var(--ym-chip);font-size:13px;font-weight:700;cursor:pointer;color:var(--ym-ink);box-shadow:0 10px 26px rgba(15,23,42,.08),0 1px 0 rgba(255,255,255,.38) inset;transition:all .18s ease;white-space:nowrap;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
.ym-nav-btn:hover{background:var(--ym-chip-hover);transform:translateY(-2px);box-shadow:0 16px 36px rgba(15,23,42,.14)}
.ym-nav-btn.active{background:linear-gradient(135deg,var(--ym-brand),var(--ym-brand2));color:var(--ym-on-brand);border-color:transparent;box-shadow:0 16px 42px color-mix(in srgb,var(--ym-brand) 30%,transparent)}

/* ── Schedule ── */
.ym-flow{width:100%;max-width:1100px;min-width:0;margin:1rem auto;font-family:system-ui,-apple-system,"PingFang SC",sans-serif;color:var(--ym-ink)}
.ym-flow .card{position:relative;overflow:hidden;max-width:100%;min-width:0;border:1px solid var(--ym-line);border-radius:clamp(16px,2.4vw,22px);background:linear-gradient(180deg,var(--ym-panel),var(--ym-panel-2));box-shadow:var(--ym-elev)}
.ym-flow .card::before{content:'';position:absolute;inset:0;border-radius:inherit;background:radial-gradient(ellipse at 50% -14%,color-mix(in srgb,var(--ym-brand) 13%,transparent),transparent 46%),linear-gradient(180deg,rgba(255,255,255,.12),transparent 50%);pointer-events:none}
.ym-flow .head{padding:clamp(14px,2.2vw,20px);display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.ym-flow .icon{font-size:clamp(38px,6.3vw,70px);line-height:1;filter:drop-shadow(0 10px 18px rgba(0,0,0,.18))}
.ym-flow .title{min-width:0;margin:0;font-weight:900;font-size:clamp(32px,6vw,58px);line-height:1.12;overflow-wrap:anywhere}
.ym-flow .list{padding:clamp(10px,1.8vw,14px);display:grid;gap:10px}
.ym-flow .item{min-width:0;position:relative;border:1px solid var(--ym-line);border-radius:16px;background:var(--ym-chip);padding:clamp(12px,2vw,16px);display:grid;grid-template-columns:1fr 1.2fr;gap:12px;align-items:center;box-shadow:0 1px 0 rgba(255,255,255,.18) inset;transition:transform .18s ease,background .18s ease,border-color .18s ease,box-shadow .18s ease}
.ym-flow .item:hover{transform:translateY(-2px);background:var(--ym-chip-hover);border-color:var(--ym-border-md);box-shadow:0 16px 34px rgba(15,23,42,.12)}
@media(max-width:640px){.ym-flow .item{grid-template-columns:1fr}}
.ym-flow .tm{font-weight:900;font-size:clamp(16px,2.2vw,26px)}
.ym-flow .ev{min-width:0;display:flex;justify-content:flex-end;align-items:center;gap:10px;font-weight:900;font-size:clamp(16px,2.4vw,28px);text-align:right;word-break:break-word}
@media(max-width:640px){.ym-flow .ev{justify-content:flex-start;text-align:left}}

/* ── Roster ── */
.wr-root{width:100%;min-width:0;margin:1rem 0;padding:0 2px;box-sizing:border-box;font-family:system-ui,"PingFang SC","Microsoft YaHei";color:var(--ym-ink)}
.wr-tabs{display:flex;justify-content:center;gap:6px;flex-wrap:wrap;padding:8px;border-radius:999px;background:var(--ym-soft);border:1px solid var(--ym-border);margin-bottom:12px}
.wr-tab{padding:6px 14px;border-radius:999px;font-size:12px;cursor:pointer;text-decoration:none;user-select:none;background:var(--ym-card);color:var(--ym-ink);border:1px solid var(--ym-border);transition:.2s ease;white-space:nowrap}
.wr-tab:hover{transform:translateY(-1px)}
.wr-tab.active{background:linear-gradient(180deg,var(--ym-accent2),var(--ym-accent));color:#fff;border-color:transparent}
.wr-card{width:100%;min-width:0;padding:12px;border-radius:18px;background:linear-gradient(180deg,var(--ym-panel),var(--ym-panel-2));border:1px solid var(--ym-line);box-sizing:border-box;box-shadow:var(--ym-sh)}
.wr-head{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:4px}
.wr-title{font-weight:600;font-size:15px;color:var(--ym-ink)}
.wr-actions button{border:none;border-radius:10px;padding:5px 12px;cursor:pointer;font-size:13px;background:var(--ym-soft);color:var(--ym-ink);margin-left:6px}
.wr-group{margin-top:16px}.wr-group h3{margin:0 0 8px;font-size:14px;color:var(--ym-ink2)}
.wr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px}
.wr-section{background:var(--ym-chip);border-radius:12px;padding:10px;border:1px solid var(--ym-line);box-sizing:border-box;min-width:0;transition:transform .18s ease,background .18s ease,box-shadow .18s ease}
.wr-section:hover{transform:translateY(-2px);background:var(--ym-chip-hover);box-shadow:var(--ym-sh)}
.wr-section-title{font-weight:600;font-size:13px;margin-bottom:5px;color:var(--ym-ink)}
.wr-name{display:flex;gap:5px;margin-bottom:5px}
.wr-name input{flex:1;min-width:0;width:100%;padding:5px 7px;border-radius:7px;border:none;background:var(--ym-card);color:var(--ym-ink);font-size:13px;box-sizing:border-box}
.wr-name input::placeholder{color:var(--ym-ink3)}
.wr-name button{background:#ef4444;border:none;border-radius:6px;color:#fff;cursor:pointer;padding:0 7px;font-size:13px;flex-shrink:0}
.add-btn{margin-top:5px;font-size:11px;cursor:pointer;color:var(--ym-accent2)}

/* ── Song card ── */
.sw-wrap{font-family:'Noto Serif SC','PingFang SC',serif;width:100%;max-width:100%;min-width:0;margin:0 auto 28px;color:var(--ym-ink)}
.sw-hd{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}
.sw-eyebrow{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--ym-ink3);margin-bottom:4px}
.sw-title{font-size:19px;font-weight:700;color:var(--ym-ink);margin-bottom:2px}
.sw-sub{font-size:11px;color:var(--ym-ink2)}
.sw-pills{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}
.sw-pill{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.5px;padding:3px 9px;border-radius:5px;border:1px solid var(--ym-border);background:var(--ym-soft);color:var(--ym-ink2)}
.sw-tog{flex-shrink:0;display:inline-flex;align-items:center;gap:6px;padding:8px 13px;border-radius:11px;border:1px solid var(--ym-border-md);background:var(--ym-card);font-size:13px;font-weight:600;color:var(--ym-ink);cursor:pointer;box-shadow:var(--ym-sh);transition:all .2s;white-space:nowrap;margin-top:2px}
.sw-tog:hover{background:var(--ym-soft);transform:translateY(-1px);box-shadow:var(--ym-sh-lg)}
.sw-tog.on{background:var(--ym-ink);color:var(--ym-bg);border-color:transparent}
.sw-tog svg{width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transition:transform .3s cubic-bezier(.4,0,.2,1)}
.sw-tog.on svg{transform:rotate(180deg)}
.sw-panel{max-height:0;overflow:hidden;transition:max-height .5s cubic-bezier(.4,0,.2,1)}
.sw-panel.open{max-height:9999px}
.sw-panel-inner{border-radius:18px;border:1px solid var(--ym-line);background:linear-gradient(180deg,var(--ym-panel),var(--ym-panel-2));box-shadow:0 18px 46px rgba(0,0,0,.18),0 1px 0 rgba(255,255,255,.04) inset;overflow:hidden;margin-bottom:14px}
.sw-ks{padding:16px 16px 14px;border-bottom:1px solid var(--ym-border)}
.sw-slabel{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--ym-ink3);margin-bottom:12px}
.sw-kg{display:flex;flex-wrap:wrap;gap:9px 11px;align-items:center}
.sw-key-actions{margin-bottom:13px;gap:9px}
.sw-kb{font-family:'DM Mono',monospace;font-size:12px;padding:0 13px;border-radius:10px;border:1px solid var(--ym-border);background:transparent;color:var(--ym-ink2);cursor:pointer;transition:transform .15s,box-shadow .15s,border-color .15s,background .15s,color .15s;min-width:42px;min-height:40px;text-align:center}
.sw-kb:hover{border-color:var(--ym-border-md);color:var(--ym-ink);background:var(--ym-soft);transform:translateY(-1px);box-shadow:0 10px 22px rgba(0,0,0,.14)}
.sw-kb.on{background:var(--ym-ink);color:var(--ym-bg);border-color:transparent;font-weight:600;box-shadow:0 12px 24px rgba(0,0,0,.16)}
.sw-capo{display:flex;align-items:center;gap:12px;padding:13px 16px;background:var(--ym-capo-bg);border-bottom:1px solid var(--ym-capo-ln);transition:all .2s}
.sw-capo.plain{background:var(--ym-soft);border-bottom-color:var(--ym-border)}
.sw-capo-t{font-size:13px;font-weight:600;color:var(--ym-capo);transition:color .2s}
.sw-capo.plain .sw-capo-t{color:var(--ym-ink)}
.sw-capo-s{font-size:11px;color:var(--ym-ink2);margin-top:1px}
.sw-capo-n{font-family:'DM Mono',monospace;font-size:21px;font-weight:500;color:var(--ym-capo);margin-left:auto;flex-shrink:0}
.sw-capo.plain .sw-capo-n{color:var(--ym-ink2);font-size:11px}
.sw-lb{padding:14px 16px 18px}
.sw-lsec{margin-bottom:20px}.sw-lsec:last-child{margin-bottom:0}
.sw-lsec-name{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1.8px;text-transform:uppercase;color:var(--ym-ink3);margin-bottom:10px;display:flex;align-items:center;gap:8px}
.sw-lsec-name::after{content:'';flex:1;height:1px;background:var(--ym-border)}
.sw-lline{margin-bottom:12px}.sw-lline:last-child{margin-bottom:0}
.sw-lrow{display:flex;flex-wrap:nowrap;align-items:flex-end;overflow:visible}
.sw-seg{display:inline-flex;flex-direction:column;align-items:flex-start;margin-right:4px;margin-bottom:5px}
.sw-chord{font-family:'DM Mono',monospace;font-size:14px;font-weight:700;color:var(--ym-capo);margin-bottom:3px;min-height:15px;white-space:pre}
.sw-chord.empty{visibility:hidden}
.sw-jianpu{font-family:'DM Mono',monospace;color:var(--ym-ink);margin-bottom:2px;display:flex;align-items:flex-end;line-height:1}
.sw-lyric{font-size:22px;color:var(--ym-ink2);white-space:pre;letter-spacing:.5px}
.sw-lyric2{display:block;font-size:22px;opacity:0.6;margin-top:1px}.sw-lyric3{display:block;font-size:22px;opacity:0.6;margin-top:1px}.sw-lyric4{display:block;font-size:22px;opacity:0.6;margin-top:1px}
.prev-row{--volta-rail:0px;--volta-top:2px;--row-note-height:0px;display:flex;flex-wrap:nowrap;align-items:flex-end;margin-bottom:10px;overflow:visible;padding-top:var(--volta-rail);padding-bottom:2px}
.prev-row.has-volta{--volta-rail:18px}
.prev-seg{display:inline-flex;flex-direction:column;align-items:flex-start;margin-right:4px;flex-shrink:0}
.p-chord{font-family:'Space Mono',monospace;font-size:12px;font-weight:700;color:var(--ym-capo);margin-bottom:2px;min-height:13px;white-space:pre}
.p-chord.empty{visibility:hidden}
.p-n{font-family:'Space Mono',monospace;color:var(--ym-ink);margin-bottom:1px;line-height:1.2;display:flex;align-items:flex-end;min-height:var(--row-note-height)}
.p-lyric{font-family:'Noto Serif SC',serif;font-size:18px;color:var(--ym-ink2);white-space:pre-wrap}
.p-lyric.bold{font-weight:700;color:var(--ym-ink)}
.p-lyric2,.p-lyric3,.p-lyric4{opacity:0.65;margin-top:1px}
.chord-gap,
.lyric-gap{display:inline-block;white-space:pre;visibility:hidden;pointer-events:none;font:inherit;line-height:inherit}
.prev-volta{display:inline-flex;align-items:flex-end;position:relative}
.prev-volta::before{content:'';position:absolute;top:calc(var(--volta-top,2px) - var(--volta-rail,0px));left:0;right:0;height:13px;border-top:1.5px solid var(--ym-ink2);border-left:1.5px solid var(--ym-ink2);pointer-events:none;box-sizing:border-box}
.prev-volta.closed::before{border-right:1.5px solid var(--ym-ink2)}
.prev-volta::after{content:attr(data-v);position:absolute;top:calc(var(--volta-top,2px) + 1px - var(--volta-rail,0px));left:3px;font-size:8px;line-height:1;color:var(--ym-ink2);pointer-events:none;font-family:'DM Mono',monospace}
.jp-wrap{display:inline-flex;flex-direction:column;align-items:center;vertical-align:bottom;min-width:1em}
.jp-plain{display:inline-flex;flex-direction:column;align-items:center;vertical-align:bottom;min-width:1em}
.jp-plain-top{height:12px}.jp-plain-sym{font-size:15px;line-height:1;text-align:center;display:inline-flex;align-items:center;justify-content:center;width:1em;height:1em}.jp-plain-sym.is-dash{position:relative;top:-0.12em}.jp-plain-bot{height:16px}
.jp-dot-top,.jp-dot-bot{width:1em;font-size:9px;line-height:1;color:var(--ym-ink);text-align:center;display:flex;flex-direction:column;align-items:center}
.jp-dot-top{height:8px;justify-content:flex-end}.jp-dot-bot{height:8px;justify-content:flex-start}
.jp-lines-wrap{width:1em;display:inline-flex;flex-direction:column;align-items:stretch;padding-bottom:4px;position:relative}
.jp-num-row{width:1em;display:inline-flex;align-items:center;justify-content:center;position:relative;padding-bottom:3px}
.jp-num{font-size:19px;line-height:1;display:inline-flex;align-items:center;justify-content:center;text-align:center;width:1em;height:1em;position:relative;top:-0.12em}
.jp-aug{position:absolute;right:-0.42em;top:-0.17em;font-size:10px;line-height:1;pointer-events:none}
.jp-u1-line{display:block;position:absolute;left:0;right:0;bottom:3px;height:1.5px;background:var(--ym-ink);pointer-events:none;z-index:1}
.jp-u2-line{display:block;position:absolute;left:0;right:0;bottom:0;height:1.5px;background:var(--ym-ink);pointer-events:none;z-index:1}
.jp-fermata{display:inline-flex;flex-direction:column;align-items:center;vertical-align:bottom;position:relative;padding-top:26px}
.jp-fermata::before{content:'';position:absolute;top:2px;left:50%;transform:translateX(-50%);width:20px;height:10px;border-top:2px solid currentColor;border-left:2px solid currentColor;border-right:2px solid currentColor;border-radius:10px 10px 0 0/10px 10px 0 0;pointer-events:none;box-sizing:border-box}
.jp-fermata::after{content:'';position:absolute;top:13px;left:50%;transform:translateX(-50%);width:5px;height:5px;border-radius:50%;background:currentColor;pointer-events:none}
.jp-dual{display:inline-flex;flex-direction:column;align-items:center;justify-content:flex-end;vertical-align:bottom;line-height:1;margin:0 .04em}
.jp-dual-top,.jp-dual-bot{display:inline-flex;align-items:flex-end}
.jp-dual-top{margin-bottom:-5px}
.jp-dual-top .jp-dot-bot{height:2px}
.jp-dual-bot .jp-dot-top{height:2px}
.jp-slur{display:inline-flex;align-items:flex-end;position:relative;padding-top:12px}
.jp-slur::before{content:'';position:absolute;top:2px;left:15%;right:15%;height:8px;border-top:1.5px solid var(--ym-ink);border-left:1.5px solid var(--ym-ink);border-right:1.5px solid var(--ym-ink);border-radius:50% 50% 0 0/100% 100% 0 0}
.jp-slur-open{display:inline-flex;align-items:flex-end;position:relative;padding-top:12px}
.jp-slur-open::before{content:'';position:absolute;top:2px;left:15%;right:-4px;height:8px;border-top:1.5px solid var(--ym-ink);border-left:1.5px solid var(--ym-ink);border-radius:50% 0 0 0/100% 0 0 0}
.jp-slur-close{display:inline-flex;align-items:flex-end;position:relative;padding-top:12px}
.jp-slur-close::before{content:'';position:absolute;top:2px;left:-4px;right:15%;height:8px;border-top:1.5px solid var(--ym-ink);border-right:1.5px solid var(--ym-ink);border-radius:0 50% 0 0/0 100% 0 0}
.jp-tuplet{display:inline-flex;align-items:flex-end;position:relative;padding-top:12px;margin-right:1px}
.jp-tuplet-br{position:absolute;top:2px;left:2px;right:2px;height:8px;border-top:1.5px solid var(--ym-ink);border-left:1.5px solid var(--ym-ink);border-right:1.5px solid var(--ym-ink);border-radius:3px 3px 0 0;pointer-events:none}
.jp-tuplet-num{position:absolute;top:-1px;left:50%;transform:translateX(-50%);font-size:8px;line-height:1;padding:0 3px;background:var(--ym-bg);color:var(--ym-ink);pointer-events:none}
.jp-timesig{display:inline-flex;flex-direction:column;align-items:center;justify-content:flex-end;vertical-align:bottom;flex-shrink:0;min-width:1.42em;margin:0 5px 0 2px;position:relative;top:-1px;line-height:1}
.jp-timesig-pad{display:block;width:100%;flex-shrink:0}
.jp-timesig-pad-top{height:2px}
.jp-timesig-pad-bot{height:3px}
.jp-timesig-stack{display:inline-flex;flex-direction:column;align-items:stretch;justify-content:center;min-width:1.42em;line-height:1}
.jp-timesig-top,.jp-timesig-bot{display:flex;align-items:center;justify-content:center;min-width:1.42em;text-align:center;font-size:18px;font-weight:700;line-height:1}
.jp-timesig-top{padding:0 1px 2px;border-bottom:1.6px solid currentColor;margin-bottom:1px}
.jp-timesig-bot{padding-top:0}
.jp-volta{display:inline-flex;align-items:flex-end;position:relative;padding-top:20px}
.jp-volta::before{content:'';position:absolute;top:3px;left:0;right:0;height:13px;border-top:1.5px solid var(--ym-ink2);border-left:1.5px solid var(--ym-ink2);pointer-events:none;box-sizing:border-box}
.jp-volta.v-close::before{border-right:1.5px solid var(--ym-ink2)}
.jp-volta::after{content:attr(data-v);position:absolute;top:4px;left:3px;font-size:8px;line-height:1;color:var(--ym-ink2);pointer-events:none;font-family:'DM Mono',monospace}
.sw-tools{display:flex;justify-content:center;margin:14px 0}
.sw-tools-row{display:inline-flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center;padding:6px;border-radius:14px;background:var(--ym-chip);border:1px solid var(--ym-line);box-shadow:var(--ym-sh)}
.sw-export-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:36px;padding:8px 13px;border-radius:10px;border:1px solid var(--ym-line);background:linear-gradient(180deg,var(--ym-chip-hover),var(--ym-chip));color:var(--ym-ink);font-family:'DM Mono',monospace;font-size:11px;font-weight:700;letter-spacing:.02em;line-height:1;cursor:pointer;text-decoration:none;box-shadow:var(--ym-sh);transition:transform .15s,box-shadow .15s,background .15s,opacity .15s}
.sw-export-btn:hover{transform:translateY(-1px);box-shadow:var(--ym-sh-lg);background:var(--ym-chip-hover)}
.sw-export-btn:disabled{cursor:default;transform:none}
.sw-export-btn svg{width:15px;height:15px;flex:0 0 auto;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.yt-btn{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:10px;background:#ff0033;color:#fff;text-decoration:none;transition:transform .15s,box-shadow .15s,background .15s;box-shadow:0 3px 10px rgba(255,0,51,.28)}
.yt-btn:hover{transform:translateY(-1px);box-shadow:0 7px 18px rgba(255,0,51,.36);background:#e6002e}
.yt-btn svg{width:22px;height:22px;display:block;overflow:visible}
.yt-btn svg .yt-screen{fill:#fff!important}
.yt-btn svg .yt-play{fill:#ff0033!important}
.sw-metro{position:relative;display:inline-flex;align-items:center;gap:7px;user-select:none;cursor:pointer;filter:drop-shadow(0 2px 4px rgba(0,0,0,.25))}
.sw-metro .mbg{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:0;font-size:40px;font-weight:600;pointer-events:none;color:rgba(130,130,130,.9);text-shadow:0 1px 2px rgba(0,0,0,.55)}
.sw-metro .mleaf{position:relative;z-index:1;font-size:13px;opacity:.45;transition:opacity .15s,transform .15s}
.sw-metro .mleaf.active{opacity:.85;transform:scale(1.1)}
.sw-metro .msettings{position:absolute;top:120%;left:0;z-index:99;background:var(--ym-card);padding:12px;border-radius:16px;box-shadow:0 12px 30px rgba(0,0,0,.25);display:none;min-width:170px;border:1px solid var(--ym-border)}
.sw-metro .mrow{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.sw-metro input.mbpm{width:58px;font-size:15px;text-align:center;border-radius:9px;border:1px solid var(--ym-border);padding:3px 5px;background:var(--ym-soft);color:var(--ym-ink)}
.sw-metro button{font-size:14px;padding:4px 10px;border-radius:9px;border:none;background:var(--ym-soft);cursor:pointer;color:var(--ym-ink)}
.sw-metro .mstop-btn{background:var(--ym-ink);color:var(--ym-bg)}
.sw-score{border-radius:16px;border:1px solid var(--ym-line);background:linear-gradient(180deg,var(--ym-panel),var(--ym-panel-2));box-shadow:var(--ym-sh);overflow:visible;margin-top:4px;transition:transform .18s ease,box-shadow .18s ease}
.sw-score:hover{transform:translateY(-2px);box-shadow:var(--ym-sh-lg)}
.sw-score-top{padding:10px 14px;border-bottom:1px solid var(--ym-border);display:flex;align-items:center;justify-content:space-between}
.sw-score-lbl{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--ym-ink3)}
.sw-score-key{font-family:'DM Mono',monospace;font-size:10px;color:var(--ym-ink2);background:var(--ym-soft);border:1px solid var(--ym-border);padding:2px 7px;border-radius:5px}
.sw-score img{width:100%;display:block;cursor:zoom-in}
.sw-score-ph{padding:40px 20px;text-align:center;font-family:'DM Mono',monospace;font-size:10px;color:var(--ym-ink3);letter-spacing:1px;line-height:2.2}

/* ── Copy pill ── */
.ym-copy-pill{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:12px;background:var(--ym-card);border:1px solid var(--ym-border);cursor:pointer;user-select:none;transition:background .15s;box-shadow:var(--ym-sh)}
.ym-copy-pill:hover{background:var(--ym-soft)}
.ym-copy-pill .st{font-size:14px;color:var(--ym-ink);white-space:nowrap}
.ym-copy-pill svg{color:var(--ym-ink2)}
.ym-song-list{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-bottom:1rem}

/* ── Lightbox ── */
.sw-lb-overlay{position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.8);backdrop-filter:blur(10px);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .25s,visibility .25s;padding:18px}
.sw-lb-overlay.open{opacity:1;visibility:visible;pointer-events:auto}
.sw-lb-box{position:relative;max-width:95vw;max-height:95vh;transform:scale(.92);transition:transform .28s cubic-bezier(.22,1,.36,1)}
.sw-lb-overlay.open .sw-lb-box{transform:scale(1)}
.sw-lb-img{max-width:95vw;max-height:95vh;border-radius:12px;display:block;box-shadow:0 12px 40px rgba(0,0,0,.4)}
.sw-lb-close{position:absolute;top:-44px;right:0;border:0;background:rgba(0,0,0,.4);color:#fff;width:34px;height:34px;border-radius:999px;cursor:pointer;display:grid;place-items:center;font-size:16px}
.sw-lb-close:hover{background:rgba(0,0,0,.6)}
.sw-lb-nav{position:absolute;top:50%;transform:translateY(-50%);width:40px;height:40px;border-radius:999px;border:0;background:rgba(0,0,0,.45);color:#fff;display:grid;place-items:center;font-size:24px;cursor:pointer}
.sw-lb-nav:hover{background:rgba(0,0,0,.65)}
.sw-lb-nav.prev{left:-52px}.sw-lb-nav.next{right:-52px}
@media(max-width:520px){.sw-lb-nav.prev{left:8px}.sw-lb-nav.next{right:8px}.sw-lb-close{top:8px;right:8px}}

/* ── Section dividers & misc ── */
hr.ym-hr{border:none;border-top:1px solid var(--ym-border);margin:2rem 0}
.ym-section-title{position:relative;font-size:1.3rem;font-weight:800;color:var(--ym-ink);margin:1.5rem 0 .8rem;display:flex;align-items:center;gap:10px;line-height:1.25}
.ym-section-title::after{content:'';height:1px;flex:1;min-width:32px;background:linear-gradient(90deg,var(--ym-line),transparent)}
.ym-section-title.is-featured{font-size:1.52rem;font-weight:800;letter-spacing:.01em}
.ym-block{max-width:100%;min-width:0;background:linear-gradient(180deg,var(--ym-panel),var(--ym-panel-2));border:1px solid var(--ym-line);border-radius:16px;padding:16px;margin-bottom:1rem;box-shadow:var(--ym-sh)}
.ym-block.is-featured{border-color:var(--ym-border-md);box-shadow:var(--ym-elev);padding:18px 20px;background:radial-gradient(ellipse at 50% -12%,color-mix(in srgb,var(--ym-brand3) 12%,transparent),transparent 46%),linear-gradient(180deg,var(--ym-panel),var(--ym-panel-2))}
.ym-meta{font-size:14px;color:var(--ym-ink2);line-height:1.8}
.ym-meta.is-featured{font-size:15.5px;line-height:1.95;color:var(--ym-ink);font-weight:500}
.ym-meta strong{color:var(--ym-ink)}
.ym-feature-copy{font-size:16px;line-height:2;color:var(--ym-ink);font-weight:500}
.ym-meta-row{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px;margin:0 0 8px}
.ym-meta-row:last-child{margin-bottom:0}
.ym-meta-label{font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ym-ink2)}
.ym-meta-value{font-size:18px;font-weight:700;color:var(--ym-ink)}
.ppt-download-link{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:12px;background:var(--ym-ink);color:var(--ym-bg);text-decoration:none;font-size:14px;font-weight:600;transition:opacity .15s}
.ppt-download-link:hover{opacity:.8}
.ppt-empty,.replay-tip{color:var(--ym-ink2);font-size:14px;padding:20px 0}
.ym-iframe-wrap{position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:14px}
.ym-iframe-wrap iframe{position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:14px}
.ym-action{margin:2rem 0;padding:16px;border-left:3px solid var(--ym-accent);background:var(--ym-soft);border-radius:0 12px 12px 0;font-size:14px;line-height:1.8;color:var(--ym-ink)}
.ym-action strong{color:var(--ym-ink)}

/* ── Song selector tabs ── */
.ym-songs-wrap{width:100%}
.ym-song-tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:1rem;padding:12px;border-radius:18px;background:linear-gradient(180deg,var(--ym-panel),var(--ym-panel-2));border:1px solid var(--ym-line);box-shadow:var(--ym-sh)}
.ym-song-tab{display:inline-flex;align-items:center;gap:7px;padding:9px 16px;border-radius:12px;border:1px solid var(--ym-line);background:var(--ym-chip);color:var(--ym-ink);font-size:14px;cursor:pointer;transition:all .18s ease;text-align:left;max-width:100%;box-shadow:0 1px 0 rgba(255,255,255,.16) inset}
.ym-song-tab:hover{background:var(--ym-chip-hover);transform:translateY(-1px);box-shadow:var(--ym-sh)}
.ym-song-tab.active{background:linear-gradient(135deg,var(--ym-brand),var(--ym-brand2));color:var(--ym-on-brand);border-color:transparent;box-shadow:0 12px 28px color-mix(in srgb,var(--ym-brand) 32%,transparent)}

.ym-song-tab-num{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,.25);font-size:11px;font-weight:700;flex-shrink:0}
.ym-song-tab:not(.active) .ym-song-tab-num{background:var(--ym-soft)}
.ym-song-tab-title{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px}
@media(max-width:520px){.ym-song-tab-title{max-width:90px}}
.ym-song-tab-copy{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:6px;flex-shrink:0;opacity:.55;transition:opacity .15s,background .15s}
.ym-song-tab-copy:hover{opacity:1;background:rgba(255,255,255,.2)}
.ym-song-tab:not(.active) .ym-song-tab-copy:hover{background:var(--ym-border)}
.ym-song-panel{display:none}
.ym-song-panel.active{display:block;min-width:0}
@media(prefers-color-scheme:dark){
  .ym-hero::before,
  .ym-flow .card::before,
  .ym-block.is-featured::before{
    background:linear-gradient(135deg,rgba(244,114,182,.14),transparent 30%),
      linear-gradient(225deg,rgba(96,165,250,.14),transparent 32%),
      radial-gradient(ellipse at 50% 110%,rgba(52,211,153,.12),transparent 48%),
      linear-gradient(180deg,rgba(251,191,36,.06),transparent 54%);
  }
  .ym-song-tab.active,.ym-nav-btn.active{
    background:var(--ym-chip-hover);
    color:var(--ym-ink);
    border-color:var(--ym-border-md);
    box-shadow:var(--ym-sh);
  }
}
@media(max-width:640px){
  .ym-hero{padding:1.75rem 1rem 1.9rem;border-radius:24px}
  .ym-hero h1{max-width:100%;font-size:clamp(1.18rem,6.4vw,1.52rem);white-space:normal;word-break:break-all}
  .ym-hero .sub{font-size:.86rem;line-height:1.55}
  .ym-nav{gap:8px}
  .ym-nav-btn{flex:1 1 calc(50% - 8px);max-width:170px;padding:9px 10px;font-size:12px}
  .ym-flow .head{gap:10px}
  .ym-flow .icon{font-size:40px}
  .ym-flow .title{font-size:clamp(30px,12vw,46px)}
  .ym-flow .item{grid-template-columns:1fr;gap:7px}
  .ym-flow .ev{justify-content:flex-start;text-align:left;font-size:18px}
  .ym-song-tabs{padding:10px;border-radius:16px}
  .ym-song-tab{max-width:100%;padding:8px 12px}
  .sw-hd{flex-direction:column;align-items:stretch;gap:10px}
  .sw-tog{align-self:flex-start;max-width:100%}
  .sw-tools-row{max-width:100%}
  .sw-score-top{gap:10px;flex-wrap:wrap}
  .ym-section-title{font-size:1.16rem;line-height:1.3}
  .ym-section-title::after{min-width:20px}
  .ym-section-title.is-featured{font-size:1.3rem}
  .ym-block.is-featured{padding:16px}
}
@media(max-width:380px){
  .ym-nav-btn{flex-basis:100%;max-width:none}
  .ym-flow .title{font-size:32px}
}
`;
    document.head.appendChild(style);
  } // end _injectCSS

  /* ══════════════ Utility ══════════════ */
  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function(k){
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    if (children) children.forEach(function(c){ if(c) e.appendChild(c); });
    return e;
  }
  function div(cls, children){ return el('div',{class:cls},children); }

  function safeFileName(name){
    return String(name||'song')
      .trim()
      .replace(/[\\/:*?"<>|]+/g,'-')
      .replace(/\s+/g,'_')
      .replace(/\.+$/,'')
      .slice(0,80) || 'song';
  }

  function escapeHtml(s){
    return String(s==null?'':s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  var _h2cPromise=null;
  function loadHtml2Canvas(){
    if(window.html2canvas) return Promise.resolve(window.html2canvas);
    if(_h2cPromise) return _h2cPromise;
    _h2cPromise=new Promise(function(resolve,reject){
      function inject(src,next){
        var s=document.createElement('script');
        s.src=src;
        s.async=true;
        s.onload=function(){
          if(window.html2canvas) resolve(window.html2canvas);
          else if(next) inject(next,null);
          else reject(new Error('html2canvas unavailable'));
        };
        s.onerror=function(){
          s.remove();
          if(next) inject(next,null);
          else reject(new Error('html2canvas load failed'));
        };
        document.head.appendChild(s);
      }
      inject(
        'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
        'https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js'
      );
    });
    return _h2cPromise;
  }

  function canvasToPngBlob(canvas){
    return new Promise(function(resolve,reject){
      if(canvas.toBlob){
        canvas.toBlob(function(blob){
          if(blob) resolve(blob);
          else reject(new Error('png conversion failed'));
        },'image/png');
      }else{
        try{
          var dataUrl=canvas.toDataURL('image/png');
          var bin=atob(dataUrl.split(',')[1]||'');
          var arr=new Uint8Array(bin.length);
          for(var i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i);
          resolve(new Blob([arr],{type:'image/png'}));
        }catch(err){ reject(err); }
      }
    });
  }

  function parseRgba(str){
    var m=String(str||'').match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i);
    if(!m) return null;
    return {r:+m[1],g:+m[2],b:+m[3],a:(m[4]===undefined?1:+m[4])};
  }

  function resolveExportBackground(node,preferred){
    if(preferred) return preferred;
    var cur=node;
    while(cur&&cur.nodeType===1){
      var c=getComputedStyle(cur).backgroundColor;
      var p=parseRgba(c);
      if(p&&p.a>0.98) return c;
      cur=cur.parentElement;
    }
    var bodyBg=getComputedStyle(document.body||document.documentElement).backgroundColor;
    var bp=parseRgba(bodyBg);
    if(bp&&bp.a>0.2) return bodyBg;
    return '#ffffff';
  }

  function nodeToPngBlobByHtml2Canvas(node,bgColor,opts){
    return loadHtml2Canvas().then(function(html2canvas){
      var dpr=Math.max(1,window.devicePixelRatio||1);
      var scale=(opts&&isFinite(opts.scale)&&opts.scale>0)?opts.scale:Math.min(2,dpr);
      return html2canvas(node,{
        backgroundColor:bgColor||'#ffffff',
        scale:scale,
        foreignObjectRendering:false,
        useCORS:true,
        logging:false
      });
    }).then(canvasToPngBlob);
  }

  function cloneWithComputedStyle(node){
    var cloned=node.cloneNode(true);
    function sync(src,dst){
      if(!src||!dst) return;
      if(src.nodeType===1&&dst.nodeType===1){
        var cs=getComputedStyle(src);
        for(var i=0;i<cs.length;i++){
          var prop=cs[i];
          dst.style.setProperty(prop,cs.getPropertyValue(prop),cs.getPropertyPriority(prop));
        }
      }
      var sKids=src.childNodes||[];
      var dKids=dst.childNodes||[];
      for(var k=0;k<sKids.length;k++){
        if(dKids[k]) sync(sKids[k],dKids[k]);
      }
    }
    sync(node,cloned);
    return cloned;
  }

  function nodeToPngBlob(node,bgColor){
    return new Promise(function(resolve,reject){
      if(!node){ reject(new Error('empty node')); return; }
      var rect=node.getBoundingClientRect();
      var width=Math.max(1,Math.ceil(rect.width));
      var height=Math.max(1,Math.ceil(rect.height));
      var snap=cloneWithComputedStyle(node);
      snap.style.width=width+'px';
      snap.style.maxWidth='none';
      var html=new XMLSerializer().serializeToString(snap);
      var bg=bgColor||'transparent';
      var foreign=[
        '<div xmlns="http://www.w3.org/1999/xhtml" style="width:'+width+'px;height:'+height+'px;background:'+bg+';">',
        html,
        '</div>'
      ].join('');
      var svg=[
        '<svg xmlns="http://www.w3.org/2000/svg" width="',width,'" height="',height,'" viewBox="0 0 ',width,' ',height,'">',
        '<foreignObject width="100%" height="100%">',foreign,'</foreignObject>',
        '</svg>'
      ].join('');

      var svgBlob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'});
      var svgUrl=URL.createObjectURL(svgBlob);
      var img=new Image();

      img.onload=function(){
        URL.revokeObjectURL(svgUrl);
        var maxSide=4096;
        var scale=Math.min(2,maxSide/width,maxSide/height);
        if(!isFinite(scale)||scale<=0) scale=1;
        var canvas=document.createElement('canvas');
        canvas.width=Math.max(1,Math.round(width*scale));
        canvas.height=Math.max(1,Math.round(height*scale));
        var ctx=canvas.getContext('2d');
        if(!ctx){ reject(new Error('canvas unavailable')); return; }
        if(bg!=='transparent'){ ctx.fillStyle=bg; ctx.fillRect(0,0,canvas.width,canvas.height); }
        ctx.setTransform(scale,0,0,scale,0,0);
        ctx.drawImage(img,0,0,width,height);
        canvasToPngBlob(canvas).then(resolve).catch(reject);
      };
      img.onerror=function(){
        URL.revokeObjectURL(svgUrl);
        reject(new Error('svg render failed'));
      };
      img.src=svgUrl;
    });
  }

  function nodeToPngBlobByTextFallback(node,bgColor){
    return new Promise(function(resolve,reject){
      try{
        var entries=[];
        var secs=node.querySelectorAll('.sw-lsec');
        Array.prototype.forEach.call(secs,function(sec){
          var secName=(sec.querySelector('.sw-lsec-name')||{}).textContent||'';
          secName=secName.replace(/\s+/g,' ').trim();
          if(secName) entries.push({type:'sec',text:'['+secName+']'});
          Array.prototype.forEach.call(sec.querySelectorAll('.sw-lrow'),function(row){
            var chordLine='';
            var jianpuLine='';
            var lyricLine='';
            Array.prototype.forEach.call(row.querySelectorAll('.prev-seg'),function(seg){
              var chord=((seg.querySelector('.p-chord')||{}).textContent||'').replace(/\u00a0/g,' ');
              var jianpu=((seg.querySelector('.p-n')||{}).textContent||'').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
              var lyric=((seg.querySelector('.p-lyric')||{}).textContent||'').replace(/\u00a0/g,' ');
              chordLine+= (chord||' ') + '  ';
              jianpuLine+= (jianpu||' ') + '  ';
              lyricLine+= (lyric||' ') + '  ';
            });
            if(chordLine.trim()) entries.push({type:'chord',text:chordLine.trimEnd()});
            if(jianpuLine.trim()) entries.push({type:'jianpu',text:jianpuLine.trimEnd()});
            if(lyricLine.trim()) entries.push({type:'lyric',text:lyricLine.trimEnd()});
          });
          entries.push({type:'gap',text:''});
        });
        if(!entries.length) entries=[{type:'sec',text:'[Transpose]'}];

        function toLuma(color){
          var c=String(color||'').trim().toLowerCase();
          var r=255,g=255,b=255,m=null;
          m=c.match(/^#([0-9a-f]{3})$/i);
          if(m){
            r=parseInt(m[1].charAt(0)+m[1].charAt(0),16);
            g=parseInt(m[1].charAt(1)+m[1].charAt(1),16);
            b=parseInt(m[1].charAt(2)+m[1].charAt(2),16);
            return 0.2126*r+0.7152*g+0.0722*b;
          }
          m=c.match(/^#([0-9a-f]{6})$/i);
          if(m){
            r=parseInt(m[1].slice(0,2),16);
            g=parseInt(m[1].slice(2,4),16);
            b=parseInt(m[1].slice(4,6),16);
            return 0.2126*r+0.7152*g+0.0722*b;
          }
          m=c.match(/^rgba?\(([^)]+)\)$/i);
          if(m){
            var parts=m[1].split(',');
            if(parts.length>=3){
              r=parseFloat(parts[0])||0;
              g=parseFloat(parts[1])||0;
              b=parseFloat(parts[2])||0;
            }
          }
          return 0.2126*r+0.7152*g+0.0722*b;
        }
        var isDarkBg=toLuma(bgColor||'#ffffff')<140;

        function fontFor(type){
          if(type==='sec') return '700 18px "Noto Serif SC","PingFang SC",serif';
          if(type==='jianpu') return '700 18px "Space Mono","DM Mono",monospace';
          if(type==='lyric') return '500 19px "Noto Serif SC","PingFang SC",serif';
          return '700 14px "Space Mono","DM Mono",monospace';
        }
        function lhFor(type){
          if(type==='sec') return 30;
          if(type==='jianpu') return 26;
          if(type==='lyric') return 28;
          if(type==='gap') return 14;
          return 24;
        }
        function colorFor(type){
          if(type==='sec') return isDarkBg ? '#a6b3cf' : '#8a5a3b';
          if(type==='lyric'||type==='jianpu') return isDarkBg ? '#e5e7eb' : '#2d2a26';
          return isDarkBg ? '#f59e0b' : '#c2410c';
        }

        var pad=26;
        var measure=document.createElement('canvas').getContext('2d');
        var maxW=0,totalH=pad*2;
        entries.forEach(function(e){
          measure.font=fontFor(e.type);
          var w=measure.measureText(e.text||' ').width;
          if(w>maxW) maxW=w;
          totalH+=lhFor(e.type);
        });

        var canvas=document.createElement('canvas');
        canvas.width=Math.max(720,Math.ceil(maxW+pad*2));
        canvas.height=Math.max(480,Math.ceil(totalH));
        var ctx=canvas.getContext('2d');
        if(!ctx){ reject(new Error('canvas unavailable')); return; }
        ctx.fillStyle=bgColor||'#ffffff';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        var y=pad;
        entries.forEach(function(e){
          ctx.font=fontFor(e.type);
          ctx.fillStyle=colorFor(e.type);
          ctx.textBaseline='top';
          ctx.fillText(e.text||'',pad,y);
          y+=lhFor(e.type);
        });
        canvasToPngBlob(canvas).then(resolve).catch(reject);
      }catch(err){ reject(err); }
    });
  }

  function nodeToPngBlobRobust(node,bgColor,opts){
    return nodeToPngBlobByHtml2Canvas(node,bgColor,opts).catch(function(primaryErr){
      try{ console.warn('[YouthEngine] html2canvas export failed, fallback to svg',primaryErr); }catch(_){}
      return nodeToPngBlob(node,bgColor).catch(function(secondErr){
        try{ console.warn('[YouthEngine] svg export failed, fallback to text canvas',secondErr); }catch(_){}
        return nodeToPngBlobByTextFallback(node,bgColor);
      });
    });
  }

  function saveBlobAs(blob,filename){
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url;
    a.download=filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); },800);
  }

  function withExportJpFix(scope,work){
    var touched=[];
    function setStyle(el,prop,val,pri){
      touched.push([el,prop,el.style.getPropertyValue(prop),el.style.getPropertyPriority(prop)]);
      el.style.setProperty(prop,val,pri||'');
    }
    function styleUnderlineLine(line,isU2){
      setStyle(line,'display','block');
      setStyle(line,'position','absolute');
      setStyle(line,'left','0');
      setStyle(line,'right','0');
      setStyle(line,'bottom',isU2?'0':'3px');
      setStyle(line,'height','1.5px');
      setStyle(line,'background','currentColor');
      setStyle(line,'margin-top','0');
      setStyle(line,'align-self','auto');
      setStyle(line,'pointer-events','none');
      setStyle(line,'z-index','1');
    }
    function addTempLine(wrap,isU2,beforeNode){
      var ln=document.createElement('span');
      ln.className=isU2?'jp-u2-line':'jp-u1-line';
      ln.setAttribute('data-export-temp-line','1');
      wrap.insertBefore(ln,beforeNode||null);
      return ln;
    }
    function nextPaint(){
      return new Promise(function(resolve){
        requestAnimationFrame(function(){requestAnimationFrame(resolve);});
      });
    }

    // If legacy renderer left border-bottom on number row, convert it to underline element for export.
    var wraps=scope.querySelectorAll('.jp-lines-wrap');
    Array.prototype.forEach.call(wraps,function(wrap){
      var row=wrap.querySelector('.jp-num-row');
      if(!row) return;
      var cs=getComputedStyle(row);
      var hadBorder=(parseFloat(cs.borderBottomWidth||'0')>0)&&(cs.borderBottomStyle!=='none');
      var hasU1=!!wrap.querySelector('.jp-u1-line');
      if(hadBorder && !hasU1){
        var beforeU2=wrap.querySelector('.jp-u2-line');
        addTempLine(wrap,false,beforeU2||null);
      }
    });

    var rows=scope.querySelectorAll('.jp-num-row');
    Array.prototype.forEach.call(rows,function(row){
      setStyle(row,'padding-bottom','8px');
      setStyle(row,'border-bottom','none');
      setStyle(row,'min-height','1.15em');
      setStyle(row,'display','inline-flex');
      setStyle(row,'align-items','center');
      setStyle(row,'justify-content','center');
    });

    var nums=scope.querySelectorAll('.jp-num');
    Array.prototype.forEach.call(nums,function(num){
      setStyle(num,'line-height','1');
      setStyle(num,'display','inline-block');
      setStyle(num,'vertical-align','baseline');
    });
    var dashes=scope.querySelectorAll('.jp-plain-sym.is-dash');
    Array.prototype.forEach.call(dashes,function(d){
      setStyle(d,'top','-0.08em');
      setStyle(d,'height','1em');
      setStyle(d,'display','inline-flex');
      setStyle(d,'align-items','center');
      setStyle(d,'justify-content','center');
      setStyle(d,'line-height','1');
      setStyle(d,'font-size','19px');
      setStyle(d,'transform','none');
    });
    var augs=scope.querySelectorAll('.jp-aug');
    Array.prototype.forEach.call(augs,function(a){
      setStyle(a,'top','-0.16em');
      setStyle(a,'transform','none');
      setStyle(a,'right','-0.35em');
      setStyle(a,'line-height','1');
      setStyle(a,'display','inline-block');
    });
    var accs=scope.querySelectorAll('.jp-acc');
    Array.prototype.forEach.call(accs,function(a){
      styleJpAccEl(a);
      setStyle(a,'display','inline-block');
    });

    var lines=scope.querySelectorAll('.jp-u1-line,.jp-u2-line');
    Array.prototype.forEach.call(lines,function(line){
      styleUnderlineLine(line,line.classList.contains('jp-u2-line'));
    });

    return nextPaint()
      .then(work)
      .finally(function(){
        for(var i=touched.length-1;i>=0;i--){
          var t=touched[i],el=t[0],prop=t[1],old=t[2],pri=t[3];
          if(old) el.style.setProperty(prop,old,pri||'');
          else el.style.removeProperty(prop);
        }
        var temps=scope.querySelectorAll('[data-export-temp-line="1"]');
        Array.prototype.forEach.call(temps,function(n){n.remove();});
      });
  }

  function buildExportClone(panelInner,opt){
    opt=opt||{};
    var rect=panelInner.getBoundingClientRect();
    var mount=(panelInner&&panelInner.closest&&panelInner.closest('#music-library')) || document.body;
    var host=document.createElement('div');
    host.style.cssText='position:fixed;left:-20000px;top:0;z-index:-1;pointer-events:none;';
    var clone=panelInner.cloneNode(true);
    if(opt.tight){
      clone.style.display='inline-block';
      clone.style.width='max-content';
      clone.style.minWidth='0';
    }else{
      clone.style.width=Math.max(1,Math.ceil(rect.width))+'px';
    }
    clone.style.maxWidth='none';
    clone.style.margin='0';
    clone.style.transform='none';
    host.appendChild(clone);
    mount.appendChild(host);
    if(opt.tight){
      var tightW=Math.max(1,Math.ceil(clone.scrollWidth||rect.width||0));
      clone.style.width=tightW+'px';
    }
    return {
      node:clone,
      cleanup:function(){ host.remove(); }
    };
  }

  function loadImageForExport(src){
    return new Promise(function(resolve){
      if(!src){ resolve(null); return; }
      var img=new Image();
      img.crossOrigin='anonymous';
      img.onload=function(){ resolve(img); };
      img.onerror=function(){
        var fallback=new Image();
        fallback.onload=function(){ resolve(fallback); };
        fallback.onerror=function(){ resolve(null); };
        fallback.src=src;
      };
      img.src=src;
    });
  }

  function blobToImage(blob){
    return new Promise(function(resolve,reject){
      var url=URL.createObjectURL(blob);
      var img=new Image();
      img.onload=function(){ URL.revokeObjectURL(url); resolve(img); };
      img.onerror=function(err){ URL.revokeObjectURL(url); reject(err); };
      img.src=url;
    });
  }

  function makeExportTextBlack(scope){
    if(!scope||!scope.querySelectorAll) return;
    if(!scope.querySelector('[data-export-symbol-fix="1"]')){
      var style=document.createElement('style');
      style.setAttribute('data-export-symbol-fix','1');
      style.textContent=[
        '.jp-slur,.jp-slur-open,.jp-slur-close,.jp-tuplet{padding-top:22px!important;overflow:visible!important;}',
        '.jp-slur::before{top:3px!important;left:12%!important;right:12%!important;height:11px!important;border-top:2.4px solid #111!important;border-left:2.4px solid #111!important;border-right:2.4px solid #111!important;background:transparent!important;z-index:2!important;}',
        '.jp-slur-open::before{top:3px!important;left:12%!important;right:-4px!important;height:11px!important;border-top:2.4px solid #111!important;border-left:2.4px solid #111!important;background:transparent!important;z-index:2!important;}',
        '.jp-slur-close::before{top:3px!important;left:-4px!important;right:12%!important;height:11px!important;border-top:2.4px solid #111!important;border-right:2.4px solid #111!important;background:transparent!important;z-index:2!important;}',
        '.jp-tuplet-br{top:3px!important;left:2px!important;right:2px!important;height:11px!important;border-top:2.4px solid #111!important;border-left:2.4px solid #111!important;border-right:2.4px solid #111!important;background:transparent!important;z-index:1!important;}',
        '.jp-tuplet-num{top:-4px!important;font-size:10px!important;line-height:1!important;padding:0 5px!important;background:#fff!important;color:#111!important;-webkit-text-fill-color:#111!important;z-index:4!important;}'
      ].join('\n');
      scope.insertBefore(style,scope.firstChild);
    }
    var nodes=[scope].concat(Array.prototype.slice.call(scope.querySelectorAll('*')));
    nodes.forEach(function(n){
      if(!n.style) return;
      n.style.setProperty('color','#111','important');
      n.style.setProperty('-webkit-text-fill-color','#111','important');
      n.style.setProperty('border-color','#111','important');
      n.style.setProperty('text-shadow','none','important');
    });
    Array.prototype.forEach.call(scope.querySelectorAll('.jp-u1-line,.jp-u2-line,.jp-dash-line'),function(n){
      n.style.setProperty('background','#111','important');
    });
  }

  function composeA4SongImage(scoreBlob,opt){
    opt=opt||{};
    return Promise.all([blobToImage(scoreBlob),loadImageForExport(YM_LOGO_SRC)]).then(function(items){
      var scoreImg=items[0], logoImg=items[1];
      var W=2000,H=2828;
      var canvas=document.createElement('canvas');
      canvas.width=W; canvas.height=H;
      var ctx=canvas.getContext('2d');
      if(!ctx) throw new Error('canvas unavailable');
      ctx.fillStyle='#fff';
      ctx.fillRect(0,0,W,H);

      var song=opt.song||{};
      var title=song.title||opt.title||'';
      var subtitle=[song.artist,song.sub].filter(Boolean).join('  ');
      var leftLines=[song.bpm?'♪ = '+song.bpm:'','1= '+(opt.key||song.origKey||'C')+'  '+(song.timeSign||'4/4')].filter(Boolean);

      ctx.fillStyle='#111';
      ctx.textBaseline='top';
      ctx.font='600 24px "DM Mono","Space Mono",monospace';
      leftLines.forEach(function(line,i){ ctx.fillText(line,260,130+i*34); });
      ctx.textAlign='center';
      ctx.font='900 38px "Noto Serif SC","Songti SC","PingFang SC",serif';
      ctx.fillText(title,W/2,128);
      if(subtitle){
        ctx.font='500 22px "Noto Serif SC","Songti SC","PingFang SC",serif';
        ctx.fillText(subtitle,W/2,182);
      }
      ctx.textAlign='left';

      var area={x:150,y:250,w:1700,h:2460};
      var scale=Math.min(area.w/scoreImg.width,area.h/scoreImg.height);
      var drawW=scoreImg.width*scale;
      var drawH=scoreImg.height*scale;
      var drawX=area.x+(area.w-drawW)/2;
      var drawY=area.y;
      ctx.drawImage(scoreImg,drawX,drawY,drawW,drawH);

      if(logoImg){
        var logoW=1180;
        var logoH=logoW*(logoImg.naturalHeight||logoImg.height)/(logoImg.naturalWidth||logoImg.width);
        ctx.save();
        ctx.globalAlpha=0.07;
        ctx.drawImage(logoImg,(W-logoW)/2,(H-logoH)/2,logoW,logoH);
        ctx.restore();
      }
      return canvasToPngBlob(canvas);
    });
  }

  function normalizeExportNotation(scope){
    if(!scope||!scope.querySelectorAll) return;
    var wraps=scope.querySelectorAll('.jp-lines-wrap');
    Array.prototype.forEach.call(wraps,function(wrap){
      wrap.style.position='relative';
      wrap.style.paddingBottom='12px';
      wrap.style.overflow='visible';

      var row=wrap.querySelector('.jp-num-row');
      if(!row) return;
      var cs=getComputedStyle(row);
      var hadBorder=(parseFloat(cs.borderBottomWidth||'0')>0)&&(cs.borderBottomStyle!=='none');
      row.style.borderBottom='none';
      row.style.paddingBottom='0';
      row.style.minHeight='1.15em';
      row.style.display='inline-flex';
      row.style.alignItems='center';
      row.style.justifyContent='center';

      if(hadBorder && !wrap.querySelector('.jp-u1-line')){
        var ul=document.createElement('span');
        ul.className='jp-u1-line';
        wrap.appendChild(ul);
      }

      var lines=wrap.querySelectorAll('.jp-u1-line,.jp-u2-line');
      Array.prototype.forEach.call(lines,function(line){
        line.style.display='block';
        line.style.position='absolute';
        line.style.left='0';
        line.style.right='0';
        line.style.bottom=line.classList.contains('jp-u2-line')?'0':'4px';
        line.style.height='1.5px';
        line.style.background='currentColor';
        line.style.margin='0';
        line.style.pointerEvents='none';
      });
    });

    var nums=scope.querySelectorAll('.jp-num');
    Array.prototype.forEach.call(nums,function(num){
      num.style.lineHeight='1';
      num.style.display='inline-block';
      num.style.verticalAlign='baseline';
      num.style.height='1em';
      num.style.position='relative';
      num.style.top='-0.12em';
    });
    var dashes=scope.querySelectorAll('.jp-plain-sym.is-dash');
    Array.prototype.forEach.call(dashes,function(d){
      d.style.position='relative';
      d.style.top='-0.12em';
      d.style.height='1em';
      d.style.display='inline-flex';
      d.style.alignItems='center';
      d.style.justifyContent='center';
      d.style.lineHeight='1';
      d.style.fontSize='19px';
      d.style.transform='none';
      d.style.overflow='visible';
      var dashLine=d.querySelector('.jp-dash-line');
      if(!dashLine){
        dashLine=document.createElement('span');
        dashLine.className='jp-dash-line';
        d.textContent='';
        d.appendChild(dashLine);
      }
      styleJpDashLineEl(dashLine);
    });
    var augs=scope.querySelectorAll('.jp-aug');
    Array.prototype.forEach.call(augs,function(a){
      a.style.position='absolute';
      a.style.top='50%';
      a.style.right='-0.42em';
      a.style.transform='translateY(-50%)';
      a.style.lineHeight='1';
      a.style.display='inline-block';
    });
    var accs=scope.querySelectorAll('.jp-acc');
    Array.prototype.forEach.call(accs,function(a){
      styleJpAccEl(a);
      a.style.display='inline-block';
    });
  }

  function waitPaint2(){
    return new Promise(function(resolve){
      requestAnimationFrame(function(){requestAnimationFrame(resolve);});
    });
  }

  function exportTransposePanel(panelInner,opt){
    opt=opt||{};
    if(!panelInner) return Promise.reject(new Error('panel missing'));
    var bg=resolveExportBackground(panelInner,opt.bgColor);
    var waitFonts=(document.fonts&&document.fonts.ready)?document.fonts.ready:Promise.resolve();
    return waitFonts
      .then(function(){
        var snap=buildExportClone(panelInner,{tight:!!opt.tight});
        if(opt.hideTransposeOptions){
          var keyZone=snap.node.querySelector('.sw-ks');
          if(keyZone) keyZone.remove();
        }
        normalizeExportNotation(snap.node);
        if(opt.a4) makeExportTextBlack(snap.node);
        lyricHlPrepareExport(snap.node);
        if(opt.a4) snap.node.style.setProperty('background','#ffffff','important');
        return waitPaint2()
          .then(function(){ return nodeToPngBlobRobust(snap.node,bg); })
          .then(function(blob){ return opt.a4 ? composeA4SongImage(blob,opt) : blob; })
          .finally(function(){ snap.cleanup(); });
      })
      .then(function(blob){
        var base=safeFileName(opt.title||'transpose');
        var key=safeFileName(opt.key||'');
        var filename=base+(key?('_'+key):'')+'.png';
        saveBlobAs(blob,filename);
      });
  }


  /* ══════════ 单图导出：整首缩放进一张固定尺寸 PNG（纯白底） ══════════
     取代此前的「A4 分页多页 PDF」方案，核心规则：
     - 只输出一张 PNG，默认 A4 竖版基准（2000x2828，1:1.414）；
     - 不做「先截原尺寸长图再缩小贴上」（位图降采样会发虚），而是把
       目标缩放比例直接交给 html2canvas 的 scale 渲染参数，文字按
       最终尺寸矢量光栅化，缩小后依然清晰；
     - 最小可读字号下限：歌词在成图里的字高不低于 minLyricPx
       （24px，约合 A4 打印 9pt）。竖版压到下限仍放不下时，不再继续
       压小，而改用 A4 横版（2828x2000）+ 歌词区双栏排版，用宽度换
       高度；双栏断点由 CSS break-inside 控制，只落在整行之间；
       宽度上限即横版双栏，不再进一步拉宽；
     - 背景永远纯白 #ffffff，不跟随深浅主题；导出前把荧光笔标记
       内联为白底可辨的实色（lyricHlPrepareExport）。
     resolveExportBackground 不再参与本路径，仅保留给旧版
     exportTransposePanel 兜底（该路径调用方也固定传白底）。 */
  var EXPORT_FIT={
    portrait:{W:2000,H:2828},
    landscape:{W:2828,H:2000},
    headerH:250,bottomH:118,sideM:150,
    minLyricPx:24,maxScale:2.6
  };
  function exportMeasureLyricFont(scope){
    var el=scope.querySelector('.p-lyric');
    if(!el)return 19;
    var fs=parseFloat(getComputedStyle(el).fontSize);
    return isFinite(fs)&&fs>0?fs:19;
  }
  function exportApplyTwoColumns(clone,baseW){
    var st=document.createElement('style');
    st.setAttribute('data-export-columns','1');
    st.textContent='.sw-lline{break-inside:avoid;-webkit-column-break-inside:avoid;page-break-inside:avoid;}.sw-lsec{break-inside:auto;}';
    clone.insertBefore(st,clone.firstChild);
    clone.style.columnCount='2';
    clone.style.columnGap='64px';
    clone.style.columnFill='balance';
    clone.style.width=Math.ceil(baseW*2+64)+'px';
  }
  function composeFittedSongImage(scoreBlob,opt,page){
    return Promise.all([blobToImage(scoreBlob),loadImageForExport(YM_LOGO_SRC)]).then(function(items){
      var scoreImg=items[0],logoImg=items[1];
      var W=page.W,H=page.H;
      var canvas=document.createElement('canvas');
      canvas.width=W;canvas.height=H;
      var ctx=canvas.getContext('2d');
      if(!ctx)throw new Error('canvas unavailable');
      ctx.fillStyle='#ffffff';
      ctx.fillRect(0,0,W,H);
      var song=opt.song||{};
      var title=song.title||opt.title||'';
      var subtitle=[song.artist,song.sub].filter(Boolean).join('  ');
      var leftLines=[song.bpm?'♪ = '+song.bpm:'','1= '+(opt.key||song.origKey||'C')+'  '+(song.timeSign||'4/4')].filter(Boolean);
      ctx.fillStyle='#111';
      ctx.textBaseline='top';
      ctx.font='600 24px "DM Mono","Space Mono",monospace';
      leftLines.forEach(function(line,i){ ctx.fillText(line,260,130+i*34); });
      ctx.textAlign='center';
      ctx.font='900 38px "Noto Serif SC","Songti SC","PingFang SC",serif';
      ctx.fillText(title,W/2,128);
      if(subtitle){
        ctx.font='500 22px "Noto Serif SC","Songti SC","PingFang SC",serif';
        ctx.fillText(subtitle,W/2,182);
      }
      ctx.textAlign='left';
      var area={x:EXPORT_FIT.sideM,y:EXPORT_FIT.headerH,w:W-EXPORT_FIT.sideM*2,h:H-EXPORT_FIT.headerH-EXPORT_FIT.bottomH};
      var s=Math.min(area.w/scoreImg.width,area.h/scoreImg.height,1.001);
      var drawW=scoreImg.width*s,drawH=scoreImg.height*s;
      ctx.drawImage(scoreImg,area.x+(area.w-drawW)/2,area.y,drawW,drawH);
      if(logoImg){
        var logoW=1180;
        var logoH=logoW*(logoImg.naturalHeight||logoImg.height)/(logoImg.naturalWidth||logoImg.width);
        ctx.save();
        ctx.globalAlpha=0.07;
        ctx.drawImage(logoImg,(W-logoW)/2,(H-logoH)/2,logoW,logoH);
        ctx.restore();
      }
      return canvasToPngBlob(canvas);
    });
  }
  function exportSongAsFittedPng(panelInner,opt){
    opt=opt||{};
    if(!panelInner)return Promise.reject(new Error('panel missing'));
    var waitFonts=(document.fonts&&document.fonts.ready)?document.fonts.ready:Promise.resolve();
    var keyPart=safeFileName(opt.key||'');
    var stem=safeFileName(opt.title||'transpose')+(keyPart?('_'+keyPart):'');
    return waitFonts.then(function(){
      var snap=buildExportClone(panelInner,{tight:!!opt.tight});
      if(opt.hideTransposeOptions){
        var keyZone=snap.node.querySelector('.sw-ks');
        if(keyZone) keyZone.remove();
      }
      normalizeExportNotation(snap.node);
      makeExportTextBlack(snap.node);
      lyricHlPrepareExport(snap.node);
      snap.node.style.setProperty('background','#ffffff','important');
      return waitPaint2()
        .then(function(){
          var r1=snap.node.getBoundingClientRect();
          var cw=Math.max(1,r1.width),ch=Math.max(1,r1.height);
          var lyricPx=exportMeasureLyricFont(snap.node);
          var P=EXPORT_FIT.portrait;
          var sPort=Math.min(
            (P.W-EXPORT_FIT.sideM*2)/cw,
            (P.H-EXPORT_FIT.headerH-EXPORT_FIT.bottomH)/ch,
            EXPORT_FIT.maxScale
          );
          if(sPort*lyricPx>=EXPORT_FIT.minLyricPx){
            return nodeToPngBlobRobust(snap.node,'#ffffff',{scale:sPort}).then(function(blob){return {blob:blob,page:P};});
          }
          exportApplyTwoColumns(snap.node,cw);
          return waitPaint2().then(function(){
            var r2=snap.node.getBoundingClientRect();
            var cw2=Math.max(1,r2.width),ch2=Math.max(1,r2.height);
            var L=EXPORT_FIT.landscape;
            var sLand=Math.min(
              (L.W-EXPORT_FIT.sideM*2)/cw2,
              (L.H-EXPORT_FIT.headerH-EXPORT_FIT.bottomH)/ch2,
              EXPORT_FIT.maxScale
            );
            return nodeToPngBlobRobust(snap.node,'#ffffff',{scale:sLand}).then(function(blob){return {blob:blob,page:L};});
          });
        })
        .finally(function(){ snap.cleanup(); });
    }).then(function(res){
      return composeFittedSongImage(res.blob,opt,res.page);
    }).then(function(png){
      saveBlobAs(png,stem+'.png');
    });
  }

  /* ══════════════ Welcome Modal ══════════════ */
  function buildModal() {
    var key = 'ym_hide__' + (location.pathname || '');
    try { if (localStorage.getItem(key) === '1') return; } catch(e){}

    var overlay = el('div', {id:'ymOverlay'});
    var modal   = el('div', {id:'ymModal'});

    modal.innerHTML = `
      <div class="yLayout">
        <div class="yBody">
          <div class="yGrid">
            <div class="yCard">
              <h3 class="yTitle">欢迎来到青年聚会页面 👋</h3>
              <p class="ySub">这里是本周聚会安排与预备工具。</p>
              <p class="yText">🕛 时间：${C.time}
🎵 内容：敬拜 · 分享 · 活动 · 祷告

🎶 页面功能：
• ▶️ 诗歌可以直接播放
• ⏱ 可使用节拍器练习节奏
• 📋 歌单与流程已整理好
• 🎸 移调计算器

欢迎邀请朋友一起来参加 ✨
有建议或发现问题，也欢迎联系 YuEn 🙌</p>
            </div>
            <div class="yCard">
              <div class="yPanelTitle">本页快速信息</div>
              <div class="yChipList">
                <div class="yChip"><div class="k">时间</div><div class="v">${C.time}</div></div>
                <div class="yChip"><div class="k">本周</div><div class="v">${C.week || ''}</div></div>
                <div class="yChip"><div class="k">内容</div><div class="v">敬拜 · 分享 · 活动 · 祷告</div></div>
                <div class="yChip"><div class="k">任何问题联系</div><div class="v">YuEn</div></div>
              </div>
            </div>
          </div>
        </div>
        <div class="yFooter">
          <label class="yCheck"><input type="checkbox" id="ymDontShow"> 以后不再显示</label>
          <div class="yBtns">
            <button id="ymClose">关闭</button>
            <button class="primary" id="ymOk">确定</button>
          </div>
        </div>
      </div>`;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    overlay.style.display = 'block';
    document.documentElement.classList.add('ym-open');

    function close() {
      try { if (document.getElementById('ymDontShow').checked) localStorage.setItem(key,'1'); } catch(e){}
      overlay.style.display = 'none';
      document.documentElement.classList.remove('ym-open');
    }
    document.getElementById('ymClose').onclick = close;
    document.getElementById('ymOk').onclick    = close;
    overlay.addEventListener('click', function(e){ if(e.target===overlay) close(); });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape' && overlay.style.display==='block') close(); });
  }

  /* ══════════════ Hero ══════════════ */
  function buildHero() {
    var navGroups = {
      flow: [
        {label:'📅 聚会流程', href:'#ym-flow'},
      ],
      songs: [
        {label:'🎧 本周诗歌', href:'#ym-songs'},
        {label:'🎼 歌谱', href:'#ym-score'},
      ],
      message: [
        {label:'📖 信息分享', href:'#ym-message'},
      ],
      ppt: [
        {label:'📑 讲员PPT', href:'#ym-ppt'},
      ],
      replay: [
        {label:'📺 直播回放', href:'#ym-replay'},
      ],
      tutorial: [
        {label:'🎬 视频教程', href:'#ym-tutorial'},
      ],
      game: [
        {label:'🎮 游戏活动', href:'#ym-game'},
      ],
    };
    var navItems = [];
    getSectionOrder().forEach(function(section){
      (navGroups[section] || []).forEach(function(item){
        navItems.push(item);
      });
    });
    var navDiv = el('div', {class:'ym-nav'});
    navItems.forEach(function(item){
      var btn = el('button', {class:'ym-nav-btn', text:item.label});
      btn.addEventListener('click', function(){
        navDiv.querySelectorAll('.ym-nav-btn').forEach(function(b){b.classList.remove('active')});
        btn.classList.add('active');
        var t = document.querySelector(item.href);
        if(t) t.scrollIntoView({behavior:'smooth', block:'start'});
      });
      navDiv.appendChild(btn);
    });
    var hero = el('div', {class:'ym-hero ym-tilt ym-reveal'}, [
      el('h1', {text: '青年聚会 · 本周敬拜 & 信息分享'}),
      el('p',  {class:'sub', text:'欢迎一起敬拜、分享，也欢迎敬拜团在这里练习 🎵'}),
      el('div',{class:'tm',  text:'⏰ ' + C.time}),
      navDiv,
    ]);
    return hero;
  }

  /* ══════════════ Schedule ══════════════ */
  function buildSchedule() {
    var items = (C.schedule || []).map(function(s){
      return el('div',{class:'item ym-reveal'},[
        el('div',{class:'tm', text: s.time}),
        el('div',{class:'ev', html: '<span>' + (s.emoji||'') + '</span> ' + (s.event||'')}),
      ]);
    });
    var list = el('div',{class:'list'}, items);
    return el('div',{class:'ym-flow'},[
      el('div',{class:'card ym-tilt ym-reveal'},[
        el('div',{class:'head'},[
          el('div',{class:'icon',text:'🕒'}),
          el('div',{class:'title',text:'聚会流程'}),
        ]),
        list,
      ]),
    ]);
  }

  /* ══════════════ Roster ══════════════ */
  function buildRoster() {
    if (!C.sheetName) return null;
    var API_URL = C.apiBase + '?sheet=' + encodeURIComponent(C.sheetName);
    var data = {}, isAdmin = false, curView = '所有';

    var root    = div('wr-root');
    var tabs    = div('wr-tabs');
    var card    = div('wr-card ym-tilt ym-reveal');
    var head    = div('wr-head');
    var titleEl = el('div',{class:'wr-title',text:'所有服侍分工'});
    var acts    = div('wr-actions');
    var content = div('');
    var saveBtn = el('button',{text:'💾 保存',style:'display:none'});

    var lockBtn = el('button',{text:'🔒 管理员'});
    acts.appendChild(lockBtn);
    acts.appendChild(saveBtn);
    head.appendChild(titleEl);
    head.appendChild(acts);
    card.appendChild(head);
    card.appendChild(content);

    var tabDefs = [
      {label:'📋 所有', view:'所有'},
      {label:'🎤 人声', view:'🎤'},
      {label:'🎹 乐器', view:'🎹'},
      {label:'🎛️ 音控', view:'🎛️'},
    ];
    tabDefs.forEach(function(td){
      var t = el('a',{class:'wr-tab'+(td.view==='所有'?' active':''), text:td.label});
      t.addEventListener('click', function(){
        tabs.querySelectorAll('.wr-tab').forEach(function(x){x.classList.remove('active')});
        t.classList.add('active');
        curView = td.view;
        render();
      });
      tabs.appendChild(t);
    });

    root.appendChild(tabs);
    root.appendChild(card);

    function render(){
      content.innerHTML = '';
      titleEl.textContent = curView === '所有' ? '所有服侍分工' : '服侍分工';
      var groups = Object.keys(data).filter(function(k){ return curView==='所有'||k.includes(curView); });
      groups.forEach(function(g){
        var grp = el('div',{class:'wr-group'});
        grp.appendChild(el('h3',{text:g}));
        var grid = div('wr-grid');
        Object.entries(data[g]).forEach(function(entry){
          var role = entry[0], arr = entry[1];
          var sec  = div('wr-section ym-reveal');
          // Color accent based on group
          var groupColors = {'🎤':'#3b5bfd','🎹':'#7c3aed','🎛️':'#059669','其他':'#d97706'};
          var gc = Object.keys(groupColors).find(function(k){return g.includes(k)}) || '其他';
          sec.style.borderLeft = '3px solid ' + groupColors[gc];
          sec.appendChild(el('div',{class:'wr-section-title',text:role}));
          arr.forEach(function(name,i){
            var row = div('wr-name');
            var inp = el('input',{placeholder:'填写名字'}); inp.value=name; inp.disabled=!isAdmin;
            inp.addEventListener('input',function(e){arr[i]=e.target.value});
            row.appendChild(inp);
            if(isAdmin){ var del=el('button',{text:'×'}); del.onclick=function(){arr.splice(i,1);render();}; row.appendChild(del); }
            sec.appendChild(row);
          });
          if(isAdmin){ var add=el('div',{class:'add-btn',text:'+ 新增'}); add.onclick=function(){arr.push('');render();}; sec.appendChild(add); }
          grid.appendChild(sec);
        });
        grp.appendChild(grid);
        content.appendChild(grp);
      });
    }

    lockBtn.onclick = function(){
      var pwd = prompt('管理员密码'); if(!pwd) return;
      isAdmin = true; saveBtn.style.display='inline-block'; render();
    };
    saveBtn.onclick = function(){
      var pwd = prompt('再次输入管理员密码'); if(!pwd) return;
      var url = C.apiBase+'?save=1&sheet='+encodeURIComponent(C.sheetName)+'&password='+encodeURIComponent(pwd)+'&data='+encodeURIComponent(JSON.stringify(data));
      fetch(url).then(function(r){return r.text()}).then(function(t){
        if(t==='ok') alert('已保存'); else if(t==='denied') alert('密码错误'); else alert('保存失败');
      });
    };

    fetch(API_URL).then(function(r){return r.json()}).then(function(d){ data=d||{}; render(); });
    return root;
  }

  /* ══════════════ Jianpu helpers ══════════════ */
  function getVoltaStartLabel(nStr){
    if(!nStr)return '';
    var m=nStr.match(/\[v:([^\]\s]+)\]/);
    if(m&&m[1])return m[1];
    if(nStr.indexOf('[v1')>=0)return '1';
    if(nStr.indexOf('[v2')>=0)return '2';
    return '';
  }
  function hasVoltaEnd(nStr){
    return !!(nStr&&nStr.indexOf(']v')>=0);
  }
  function normalizeTimeSignValue(sig){
    var m=String(sig||'').trim().replace(/\s+/g,'').replace(/\uFF0F/g,'/').match(/^(\d{1,2})\/(\d{1,2})$/);
    return m?(m[1]+'/'+m[2]):'';
  }
  function extractInlineTimeSignToken(tok){
    var m=String(tok||'').trim().match(/^\[(?:ts|timesign|meter):([^\]]+)\]$/i);
    return m?normalizeTimeSignValue(m[1]):'';
  }
  function getSegInlineTimeSign(seg){
    if(!seg)return'';
    return normalizeTimeSignValue(seg.timeSign||seg.ts||seg.meter||'');
  }
  function makeBarline(tok){
    var o=document.createElement('span');
    o.style.cssText='display:inline-flex;flex-direction:column;align-items:flex-start;vertical-align:bottom;';
    var top=document.createElement('span');top.style.height='12px';o.appendChild(top);
    var mid=document.createElement('span');mid.style.cssText='display:inline-flex;align-items:stretch;height:26px;';
    function thin(){var l=document.createElement('span');l.style.cssText='width:1.5px;background:currentColor;flex-shrink:0;';return l;}
    function thick(){var l=document.createElement('span');l.style.cssText='width:3.5px;background:currentColor;flex-shrink:0;';return l;}
    function gap(px){var g=document.createElement('span');g.style.cssText='width:'+px+'px;flex-shrink:0;';return g;}
    function dots(){var d=document.createElement('span');d.style.cssText='display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;width:6px;flex-shrink:0;';var d1=document.createElement('span');d1.style.cssText='width:3px;height:3px;border-radius:50%;background:currentColor;';var d2=document.createElement('span');d2.style.cssText='width:3px;height:3px;border-radius:50%;background:currentColor;';d.appendChild(d1);d.appendChild(d2);return d;}
    if(tok==='|'){mid.appendChild(thin());}
    else if(tok==='||'){mid.appendChild(thin());mid.appendChild(gap(2));mid.appendChild(thin());}
    else if(tok==='||/'||tok==='|]'){mid.appendChild(thin());mid.appendChild(gap(2));mid.appendChild(thick());}
    else if(tok==='|:'){mid.appendChild(thin());mid.appendChild(gap(1));mid.appendChild(thick());mid.appendChild(gap(3));mid.appendChild(dots());}
    else if(tok===':|'){mid.appendChild(dots());mid.appendChild(gap(3));mid.appendChild(thick());mid.appendChild(gap(1));mid.appendChild(thin());}
    else if(tok==='|:|'){mid.appendChild(dots());mid.appendChild(gap(3));mid.appendChild(thick());mid.appendChild(gap(1));mid.appendChild(thick());mid.appendChild(gap(3));mid.appendChild(dots());}
    o.appendChild(mid);
    var bot=document.createElement('span');bot.style.height='16px';o.appendChild(bot);
    return o;
  }
  function makeTimeSignature(sig){
    var norm=normalizeTimeSignValue(sig);
    if(!norm)return document.createDocumentFragment();
    var parts=norm.split('/');
    var o=document.createElement('span');o.className='jp-timesig';o.setAttribute('data-ts',norm);
    var topPad=document.createElement('span');topPad.className='jp-timesig-pad jp-timesig-pad-top';o.appendChild(topPad);
    var stack=document.createElement('span');stack.className='jp-timesig-stack';
    var top=document.createElement('span');top.className='jp-timesig-top';top.textContent=parts[0];
    var bot=document.createElement('span');bot.className='jp-timesig-bot';bot.textContent=parts[1];
    stack.appendChild(top);stack.appendChild(bot);o.appendChild(stack);
    var botPad=document.createElement('span');botPad.className='jp-timesig-pad jp-timesig-pad-bot';o.appendChild(botPad);
    return o;
  }
  function makeJpPlain(sym){
    var pl=document.createElement('span');pl.className='jp-plain';
    var t=document.createElement('span');t.className='jp-plain-top';pl.appendChild(t);
    var s=document.createElement('span');s.className='jp-plain-sym'+(sym==='-'?' is-dash':'');s.textContent=sym;pl.appendChild(s);
    s.style.display='inline-flex';
    s.style.alignItems='center';
    s.style.justifyContent='center';
    s.style.width='1em';
    s.style.height='1em';
    if(sym==='-'){
      s.style.fontSize='19px';
      s.style.position='relative';
      s.style.top='-0.12em';
      s.style.lineHeight='1';
      s.style.overflow='visible';
      s.textContent='';
      var dashLine=document.createElement('span');
      dashLine.className='jp-dash-line';
      styleJpDashLineEl(dashLine);
      s.appendChild(dashLine);
    }
    var b=document.createElement('span');b.className='jp-plain-bot';pl.appendChild(b);
    return pl;
  }
  function setDots(el,cnt){
    el.innerHTML='';
    for(var i=0;i<cnt;i++){var d=document.createElement('span');d.textContent='·';el.appendChild(d);}
  }
  function styleJpNumEl(el){
    if(!el)return;
    el.style.display='inline-flex';
    el.style.alignItems='center';
    el.style.justifyContent='center';
    el.style.textAlign='center';
    el.style.width='1em';
    el.style.height='1em';
    el.style.position='relative';
    el.style.top='-0.12em';
  }
  function styleJpAugEl(el){
    if(!el)return;
    el.style.position='absolute';
    el.style.right='-0.42em';
    el.style.top='50%';
    el.style.transform='translateY(-50%)';
    el.style.pointerEvents='none';
  }
  function styleJpAccEl(el){
    if(!el)return;
    el.style.position='absolute';
    el.style.left='-0.32em';
    el.style.top='-0.08em';
    el.style.transform='none';
    el.style.fontSize='12px';
    el.style.fontWeight='700';
    el.style.lineHeight='1';
    el.style.pointerEvents='none';
  }
  function styleJpDashLineEl(el){
    if(!el)return;
    el.style.position='absolute';
    el.style.left='0.08em';
    el.style.right='0.08em';
    el.style.top='50%';
    el.style.height='2px';
    el.style.transform='translateY(-50%)';
    el.style.background='currentColor';
    el.style.borderRadius='2px';
    el.style.pointerEvents='none';
  }
  function makeJpUnderlineLine(level){
    var ln=document.createElement('span');
    ln.className=level===2?'jp-u2-line':'jp-u1-line';
    ln.style.display='block';
    ln.style.position='absolute';
    ln.style.left='0';
    ln.style.right='0';
    ln.style.bottom=level===2?'0':'3px';
    ln.style.height='1.5px';
    ln.style.background='currentColor';
    ln.style.marginTop='0';
    ln.style.alignSelf='auto';
    ln.style.pointerEvents='none';
    ln.style.zIndex='1';
    return ln;
  }
  function parseDualJpToken(tok){
    var raw=String(tok||'').replace(/\uFF0F/g,'/');
    var idx=raw.indexOf('/');
    if(idx<0||idx!==raw.lastIndexOf('/'))return null;
    var top=raw.slice(0,idx).trim();
    var bot=raw.slice(idx+1).trim();
    if(!top&&!bot)return null;
    return {top:top||'sp',bot:bot||'sp'};
  }
  function makeDualJpToken(pair){
    var w=document.createElement('span');w.className='jp-dual';
    var t=document.createElement('span');t.className='jp-dual-top';t.appendChild(parseJpToken(pair.top,{inDual:true}));w.appendChild(t);
    var b=document.createElement('span');b.className='jp-dual-bot';b.appendChild(parseJpToken(pair.bot,{inDual:true}));w.appendChild(b);
    return w;
  }
  function parseJpToken(tok,opts) {
    opts=opts||{};
    tok=String(tok||'');
    if(tok==='|'||tok==='||'||tok==='||/'||tok==='|]'||tok==='|:'||tok===':|'||tok==='|:|')return makeBarline(tok);
    var dual=!opts.inDual?parseDualJpToken(tok):null;
    if(dual)return makeDualJpToken(dual);
    if(!tok||tok==='-'||tok===' ')return makeJpPlain(tok);
    var hasFermata=false;
    if(tok.slice(-1)==='^'){hasFermata=true;tok=tok.slice(0,-1);}
    if(tok==='sp'||tok==='sp_'||tok==='sp__'){
      var fake=tok==='sp__'?'0__':tok==='sp_'?'0_':'0';
      var el2=parseJpToken(fake);
      var ns=el2.querySelector('.jp-num')||el2.querySelector('.jp-plain-sym');
      if(ns)ns.style.visibility='hidden';
      return el2;
    }
    var zm=tok.match(/^(0·?)(_*)$/);
    if(zm){
      var wz=document.createElement('span');wz.className='jp-wrap';
      var tdz=document.createElement('span');tdz.className='jp-dot-top';wz.appendChild(tdz);
      var lwz=document.createElement('span');lwz.className='jp-lines-wrap';
      var nrz=document.createElement('span');nrz.className='jp-num-row';
      var nsz=document.createElement('span');nsz.className='jp-num';nsz.textContent='0';styleJpNumEl(nsz);nrz.appendChild(nsz);
      if(zm[1].indexOf('\u00b7')>-1){var agz=document.createElement('span');agz.className='jp-aug';agz.textContent='·';styleJpAugEl(agz);nsz.appendChild(agz);}
      var ulz=zm[2].length;
      lwz.appendChild(nrz);
      if(ulz>=1)lwz.appendChild(makeJpUnderlineLine(1));
      if(ulz===2)lwz.appendChild(makeJpUnderlineLine(2));
      wz.appendChild(lwz);
      var bdz=document.createElement('span');bdz.className='jp-dot-bot';wz.appendChild(bdz);
      return wz;
    }
    var num=tok,isHigh=0,isLow=0,isDot=false,uline=0;
    if(num.slice(-2)==='__'){uline=2;num=num.slice(0,-2);}
    else if(num.slice(-1)==='_'){uline=1;num=num.slice(0,-1);}
    if(num.indexOf('\u00b7')>-1){isDot=true;num=num.replace(/\u00b7/g,'');}
    var hm=num.match(/^(.+?)('+)$/);if(hm){isHigh=hm[2].length;num=hm[1];}
    var lm=num.match(/^(.+?)(,+)$/);if(lm){isLow=lm[2].length;num=lm[1];}
    var acc='';
    var am=num.match(/^([#b\u266f\u266d\u266e=])([0-7])$/);
    if(am){acc=am[1]==='#'?'\u266f':am[1]==='b'?'\u266d':am[1]==='='?'\u266e':am[1];num=am[2];}
    var w=document.createElement('span');w.className='jp-wrap'+(acc?' has-acc':'');
    if(acc)w.style.minWidth='1.35em';
    var td=document.createElement('span');td.className='jp-dot-top';setDots(td,isHigh>=2?2:isHigh);w.appendChild(td);
    var lw2=document.createElement('span');lw2.className='jp-lines-wrap';
    var numRow=document.createElement('span');numRow.className='jp-num-row';
    if(acc){var ac=document.createElement('span');ac.className='jp-acc';ac.textContent=acc;styleJpAccEl(ac);numRow.appendChild(ac);}
    var ns2=document.createElement('span');ns2.className='jp-num';ns2.textContent=num;styleJpNumEl(ns2);numRow.appendChild(ns2);
    if(isDot){var dt=document.createElement('span');dt.className='jp-aug';dt.textContent='·';styleJpAugEl(dt);ns2.appendChild(dt);}
    lw2.appendChild(numRow);
    if(uline>=1)lw2.appendChild(makeJpUnderlineLine(1));
    if(uline===2)lw2.appendChild(makeJpUnderlineLine(2));
    w.appendChild(lw2);
    var botDot=document.createElement('span');botDot.className='jp-dot-bot';setDots(botDot,isLow>=2?2:isLow);w.appendChild(botDot);
    if(hasFermata){var fw=document.createElement('span');fw.className='jp-fermata';fw.appendChild(w);return fw;}
    return w;
  }
  function makeTuplet(n){var w=document.createElement('span');w.className='jp-tuplet';var br=document.createElement('span');br.className='jp-tuplet-br';w.appendChild(br);var nm=document.createElement('span');nm.className='jp-tuplet-num';nm.textContent=String(n);w.appendChild(nm);return w;}
  function renderNStr(nStr,opts){
    opts=opts||{};
    var d=document.createElement('div');d.className='p-n';
    var headTimeSign=normalizeTimeSignValue(opts.inlineTimeSign||'');
    if(headTimeSign)d.appendChild(makeTimeSignature(headTimeSign));
    if(!nStr||!nStr.trim())return d;
    function appendRenderedTok(parent,tk){
      var inlineTs=extractInlineTimeSignToken(tk);
      parent.appendChild(inlineTs?makeTimeSignature(inlineTs):parseJpToken(tk));
    }
    function isDualAtom(tk){
      if(!tk||tk==='/'||tk==='／')return false;
      if(tk==='('||tk===')'||tk==='(['||tk==='])'||tk==='}'||tk==='[v1'||tk==='[v2'||tk===']v')return false;
      if(tk==='|'||tk==='||'||tk==='||/'||tk==='|]'||tk==='|:'||tk===':|'||tk==='|:|')return false;
      if(/^\{(3|5)$/.test(tk))return false;
      if(extractInlineTimeSignToken(tk))return false;
      if(/^\[v:(.+)\]$/.test(tk))return false;
      return true;
    }
    var rawToks=nStr.trim().split(/\s+/),toks=[],ti=0;
    while(ti<rawToks.length){
      if(ti+2<rawToks.length && (rawToks[ti+1]==='/'||rawToks[ti+1]==='／') && isDualAtom(rawToks[ti]) && isDualAtom(rawToks[ti+2])){
        toks.push(rawToks[ti]+'/'+rawToks[ti+2]);
        ti+=3;
        continue;
      }
      toks.push(rawToks[ti]);
      ti++;
    }
    var i=0;
    while(i<toks.length){
      var t=toks[i];
      var inlineTs=extractInlineTimeSignToken(t);
      if(inlineTs){d.appendChild(makeTimeSignature(inlineTs));i++;continue;}
      if(t==='('){var sl=document.createElement('span');sl.className='jp-slur';i++;while(i<toks.length&&toks[i]!==')')appendRenderedTok(sl,toks[i++]);d.appendChild(sl);i++;continue;}
      if(t==='(['){var so=document.createElement('span');so.className='jp-slur-open';i++;while(i<toks.length&&toks[i]!=='])')appendRenderedTok(so,toks[i++]);if(i<toks.length)i++;d.appendChild(so);continue;}
      if(t==='])'){var sc=document.createElement('span');sc.className='jp-slur-close';i++;if(i<toks.length)appendRenderedTok(sc,toks[i++]);d.appendChild(sc);continue;}
      if(t==='[v1'||t==='[v2'||t===']v'||/^\[v:(.+)\]$/.test(t)){i++;continue;} // volta handled at row level
      var tm2=t.match(/^\{(3|5)$/);if(tm2){var tn=parseInt(tm2[1],10);var tp=makeTuplet(tn);i++;while(i<toks.length&&toks[i]!=='}')appendRenderedTok(tp,toks[i++]);d.appendChild(tp);i++;continue;}
      if(t==='}'){i++;continue;}
      appendRenderedTok(d,t);i++;
    }
    return d;
  }

  /* ══════════════ Transpose ══════════════ */
  var CHR=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  var ENH={Db:'C#',Eb:'D#',Gb:'F#',Ab:'G#',Bb:'A#'};
  var FLT={'C#':'Db','D#':'Eb','F#':'Gb','G#':'Ab','A#':'Bb'};
  var FLAT_KEYS={F:1,Bb:1,Eb:1,Ab:1,Db:1,Gb:1,Cb:1};
  var USE_FLAT_MINOR_ROOTS={D:1,G:1,C:1,F:1,Bb:1,Eb:1};
  var KEY_SET_FLAT=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
  var KEY_SET_SHARP=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  var ENHARMONIC_FLAT={'C#':'Db','D#':'Eb','F#':'Gb','G#':'Ab','A#':'Bb'};
  var ENHARMONIC_SHARP={Db:'C#',Eb:'D#',Gb:'F#',Ab:'G#',Bb:'A#'};
  function nIdx(n){return CHR.indexOf(ENH[n]||n);}
  function parseKeyName(key){
    var k=(key||'').trim();
    if(!k)return{root:'C',suf:''};
    var m=k.match(/^([A-G](?:#|b)?)(.*)$/);
    if(!m)return{root:k,suf:''};
    return{root:m[1],suf:m[2]||''};
  }
  function needFlat(root,suf){
    var minor=/m(?!aj)/i.test(suf||'');
    if(minor)return !!USE_FLAT_MINOR_ROOTS[root];
    return !!FLAT_KEYS[root];
  }
  function trKeyName(key,st,useFlat){
    var parsed=parseKeyName(key),i=nIdx(parsed.root);
    if(i<0)return key;
    var r=CHR[(i+st+12)%12];
    var flat=(useFlat!==undefined)?useFlat:needFlat(parsed.root,parsed.suf);
    return (flat?(FLT[r]||r):r)+parsed.suf;
  }
  function trBass(bass,st,useFlat){return trKeyName(bass,st,useFlat);}
  function normLyricText(text){return String(text||'');}
  var IS_APPLE_DEVICE=/Mac|iPad|iPhone|iPod/.test(navigator.platform||'')||/iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent||'');
  var GAP_CANDIDATES=['\u3164','\u3000','\u2003','\u00a0'];
  var GAP_CHAR_CACHE=new Map();
  var GAP_WIDTH_CACHE=new Map();
  function pickRenderableGapChar(el){
    if(!el||!document.body)return '\u3000';
    var cs=getComputedStyle(el);
    var key=[cs.font,cs.letterSpacing,cs.wordSpacing,cs.lineHeight].join('|');
    if(GAP_CHAR_CACHE.has(key))return GAP_CHAR_CACHE.get(key);
    var probe=document.createElement('span');
    probe.style.cssText='position:absolute;left:-9999px;top:-9999px;visibility:hidden;white-space:pre;pointer-events:none;';
    probe.style.font=cs.font;
    probe.style.letterSpacing=cs.letterSpacing;
    probe.style.wordSpacing=cs.wordSpacing;
    probe.style.lineHeight=cs.lineHeight;
    document.body.appendChild(probe);
    var pick='\u3000';
    GAP_CANDIDATES.forEach(function(ch){
      if(pick!=='\u3000')return;
      probe.textContent=ch;
      if(probe.getBoundingClientRect().width>0.2)pick=ch;
    });
    probe.remove();
    GAP_CHAR_CACHE.set(key,pick);
    return pick;
  }
  function measureGapWidth(el,sample){
    if(!el||!document.body)return 0;
    var cs=getComputedStyle(el);
    var key=[sample,cs.font,cs.letterSpacing,cs.wordSpacing,cs.lineHeight].join('|');
    if(GAP_WIDTH_CACHE.has(key))return GAP_WIDTH_CACHE.get(key);
    var probe=document.createElement('span');
    probe.style.cssText='position:absolute;left:-9999px;top:-9999px;visibility:hidden;white-space:pre;pointer-events:none;';
    probe.style.font=cs.font;
    probe.style.letterSpacing=cs.letterSpacing;
    probe.style.wordSpacing=cs.wordSpacing;
    probe.style.lineHeight=cs.lineHeight;
    probe.textContent=sample;
    document.body.appendChild(probe);
    var w=probe.getBoundingClientRect().width;
    probe.remove();
    GAP_WIDTH_CACHE.set(key,w);
    return w;
  }
  function appendGapNode(el,cls,width,ch){
    var gap=document.createElement('span');
    gap.className=cls;
    gap.setAttribute('aria-hidden','true');
    if(width>0){
      gap.style.display='inline-block';
      gap.style.width=width+'px';
      gap.textContent=' ';
    }else{
      gap.textContent=ch;
    }
    el.appendChild(gap);
  }
  function normalizeRenderableGapText(el,text){
    return String(text||'').replace(/\u3164/g,pickRenderableGapChar(el));
  }
  function setChordContent(el,text){
    var raw=String(text||'');
    if(!IS_APPLE_DEVICE){el.textContent=normalizeRenderableGapText(el,raw);return;}
    var gapWidth=measureGapWidth(el,'0');
    el.textContent='';
    for(var i=0;i<raw.length;i++){
      var ch=raw[i];
      if(ch==='\u3164')appendGapNode(el,'chord-gap',gapWidth,ch);
      else el.appendChild(document.createTextNode(ch));
    }
  }
  function setLyricContent(el,text){
    var raw=String(text||'');
    var gapChar=pickRenderableGapChar(el);
    var gapWidth=IS_APPLE_DEVICE?measureGapWidth(el,'我'):0;
    el.textContent='';
    for(var i=0;i<raw.length;i++){
      var ch=raw[i];
      if(ch==='\u3164'){
        appendGapNode(el,'lyric-gap',gapWidth,gapChar);
      }else{
        el.appendChild(document.createTextNode(ch));
      }
    }
  }
/* ═══════════ CECP-SONG-EXT v1 BEGIN ═══════════
   共享模块：{sp} 专属空格渲染 + 移调占位补偿。
   本块在以下三个文件中逐字节相同（权威版本 = shared/song-ext.js）：
     musiclib/musiclib.js / youth-engine.js / musictool/musictool.js
   修改流程：先改 shared/song-ext.js，再同步三处，diff 校验一致。
   注意：本块内禁止出现反斜杠字符
   （musictool.js 经 CMS 部署会丢失一层反斜杠），
   转义字符一律用 String.fromCharCode 构造。 */
var SP_TOKEN='{sp}';
var SP_TAB=String.fromCharCode(9);
var SP_HANGUL_FILLER=String.fromCharCode(0x3164);
var SP_IDEO_SPACE=String.fromCharCode(0x3000);
var SP_WIDTH_CACHE={};
function spHasToken(text){
  return String(text||'').indexOf(SP_TOKEN)>=0;
}
function spStripTokens(text){
  return String(text||'').split(SP_TOKEN).join('');
}
function spMeasureWidth(el,sample){
  if(!el||!document.body)return 0;
  var cs=getComputedStyle(el);
  var key=sample+'|'+cs.font+'|'+cs.letterSpacing+'|'+cs.wordSpacing+'|'+cs.lineHeight;
  if(Object.prototype.hasOwnProperty.call(SP_WIDTH_CACHE,key))return SP_WIDTH_CACHE[key];
  var probe=document.createElement('span');
  probe.style.cssText='position:absolute;left:-9999px;top:-9999px;visibility:hidden;white-space:pre;pointer-events:none;';
  probe.style.font=cs.font;
  probe.style.letterSpacing=cs.letterSpacing;
  probe.style.wordSpacing=cs.wordSpacing;
  probe.style.lineHeight=cs.lineHeight;
  probe.textContent=sample;
  document.body.appendChild(probe);
  var w=probe.getBoundingClientRect().width;
  probe.remove();
  SP_WIDTH_CACHE[key]=w;
  return w;
}
function spAppendGap(el,cls,width){
  var gap=document.createElement('span');
  gap.className=cls;
  gap.setAttribute('aria-hidden','true');
  gap.style.display='inline-block';
  gap.style.width=width+'px';
  gap.textContent=' ';
  el.appendChild(gap);
}
function spSetContent(el,text,kind,fallback){
  var raw=String(text||'');
  if(raw.indexOf(SP_TOKEN)<0){fallback(el,raw);return;}
  var sample=kind==='chord'?'0':'我';
  var cls=kind==='chord'?'chord-gap sp-gap':'lyric-gap sp-gap';
  var width=spMeasureWidth(el,sample);
  el.textContent='';
  var parts=raw.split(SP_TOKEN);
  for(var i=0;i<parts.length;i++){
    if(i>0)spAppendGap(el,cls,width);
    if(parts[i]){
      var sub=document.createElement('span');
      el.appendChild(sub);
      fallback(sub,parts[i]);
    }
  }
}
function setChordContentEx(el,text,fallback){
  spSetContent(el,text,'chord',fallback);
}
function setLyricContentEx(el,text,fallback){
  spSetContent(el,text,'lyric',fallback);
}
function spIsGapChar(ch){
  return ch===' '||ch===SP_TAB||ch===SP_HANGUL_FILLER;
}
function spTokenizeChord(text){
  var raw=String(text||''),out=[],i=0,cur='';
  function flushText(){
    if(cur){out.push({gap:false,text:cur});cur='';}
  }
  while(i<raw.length){
    var isSp=raw.substr(i,SP_TOKEN.length)===SP_TOKEN;
    var ch=raw.charAt(i);
    if(isSp||spIsGapChar(ch)){
      flushText();
      var units=[];
      while(i<raw.length){
        if(raw.substr(i,SP_TOKEN.length)===SP_TOKEN){
          units.push(SP_TOKEN);i+=SP_TOKEN.length;continue;
        }
        var gc=raw.charAt(i);
        if(spIsGapChar(gc)){units.push(gc);i++;continue;}
        break;
      }
      out.push({gap:true,units:units});
      continue;
    }
    cur+=ch;i++;
  }
  flushText();
  return out;
}
function spResizeGapRun(units,len){
  var mapped=[];
  for(var i=0;i<units.length;i++){
    var u=units[i];
    mapped.push(u===SP_HANGUL_FILLER?SP_IDEO_SPACE:u);
  }
  if(!mapped.length||len<=0)return '';
  var out='';
  for(var j=0;j<len;j++)out+=mapped[j%mapped.length];
  return out;
}
function trChordEx(text,st,useFlat,trChordFn){
  var raw=String(text||'');
  if(raw.indexOf(SP_TOKEN)<0)return trChordFn(raw,st,useFlat);
  var parts=spTokenizeChord(raw),out='',i=0;
  while(i<parts.length){
    var part=parts[i];
    if(part.gap){out+=part.units.join('');i++;continue;}
    var tr=trChordFn(part.text,st,useFlat);
    out+=tr;
    if(i+1<parts.length&&parts[i+1].gap){
      var units=parts[i+1].units;
      var nextLen=units.length+(Array.from(part.text).length-Array.from(tr).length);
      if(nextLen<0)nextLen=0;
      if(nextLen===0&&i+2<parts.length&&!parts[i+2].gap)nextLen=1;
      out+=spResizeGapRun(units,nextLen);
      i+=2;continue;
    }
    i++;
  }
  return out;
}
function segIsLabelBlock(seg){
  return !!seg&&typeof seg==='object'&&typeof seg.label==='string';
}
function segIsRenderableBlock(seg){
  if(!seg||typeof seg!=='object')return false;
  if(segIsLabelBlock(seg))return true;
  return typeof seg.chord!=='undefined'||typeof seg.n!=='undefined'||typeof seg.lyric!=='undefined'||typeof seg.lyric2!=='undefined'||typeof seg.lyric3!=='undefined'||typeof seg.lyric4!=='undefined';
}
var SEC_LABEL_COLORS=[
  ['pre-chorus','prechorus','pre chorus','前副歌','导歌','#0d9488'],
  ['chorus','副歌','#e8590c'],
  ['verse','主歌','#2f6fdb'],
  ['bridge','桥段','桥','#7c3aed'],
  ['intro','前奏','#6b7280'],
  ['outro','ending','尾奏','尾声','#b45309']
];
var SEC_LABEL_FALLBACK=['#db2777','#0891b2','#4f46e5','#65a30d','#9333ea','#0284c7'];
function secLabelColor(text){
  var t=String(text||'').toLowerCase();
  for(var i=0;i<SEC_LABEL_COLORS.length;i++){
    var grp=SEC_LABEL_COLORS[i];
    for(var j=0;j<grp.length-1;j++){
      if(grp[j]&&t.indexOf(grp[j])>=0)return grp[grp.length-1];
    }
  }
  var h=0;
  for(var k=0;k<t.length;k++)h=(h*31+t.charCodeAt(k))%997;
  return SEC_LABEL_FALLBACK[h%SEC_LABEL_FALLBACK.length];
}
var SEC_LABEL_TOP_GAP_PX=3;
function segRenderLabelBlock(seg,row){
  var holder=document.createElement('span');
  holder.className='sec-label-holder';
  holder.style.cssText='display:inline-block;width:0;overflow:visible;vertical-align:top;position:relative;align-self:stretch;';
  holder.setAttribute('aria-hidden','true');
  var tag=document.createElement('span');
  var jump=seg.style==='jump';
  tag.className='sec-label'+(jump?' sec-label-jump':'');
  var color=secLabelColor(seg.label);
  var base='display:inline-block;position:absolute;left:0;top:16px;white-space:nowrap;line-height:1.4;font-size:0.58em;padding:0 7px;border-radius:999px;box-sizing:border-box;letter-spacing:0.4px;z-index:2;';
  if(jump){
    tag.style.cssText=base+'font-style:italic;font-weight:600;color:'+color+';border:1px solid '+color+';background:transparent;opacity:0.92;';
  }else{
    tag.style.cssText=base+'font-weight:700;color:#ffffff;border:1px solid '+color+';background:'+color+';';
  }
  tag.textContent=String(seg.label||'');
  holder.appendChild(tag);
  if(typeof requestAnimationFrame==='function'){
    requestAnimationFrame(function(){
      if(!holder.isConnected)return;
      var scope=holder.closest?holder.closest('.prev-row'):null;
      if(!scope)return;
      var pillH=tag.offsetHeight||13;
      var band=pillH+SEC_LABEL_TOP_GAP_PX*2;
      var chords=scope.querySelectorAll('.p-chord');
      for(var i=0;i<chords.length;i++){
        chords[i].style.marginBottom=(2+band)+'px';
      }
      var ref=holder.nextElementSibling;
      while(ref&&!(ref.querySelector&&ref.querySelector('.p-chord')))ref=ref.nextElementSibling;
      if(!ref){
        ref=holder.previousElementSibling;
        while(ref&&!(ref.querySelector&&ref.querySelector('.p-chord')))ref=ref.previousElementSibling;
      }
      var ch=ref?ref.querySelector('.p-chord'):scope.querySelector('.p-chord');
      if(ch){
        var hr=holder.getBoundingClientRect();
        var cr=ch.getBoundingClientRect();
        var scale=(holder.offsetHeight&&hr.height)?(hr.height/holder.offsetHeight):1;
        if(!scale)scale=1;
        tag.style.top=((cr.bottom-hr.top)/scale+SEC_LABEL_TOP_GAP_PX)+'px';
      }
    });
  }
  return holder;
}
/* ═══════════ CECP-SONG-EXT v1 END ═══════════ */

/* ═══════════ CECP-CHORD-STYLE v1 BEGIN ═══════════
   共享模块：和弦文字视觉样式（按根音固定配色的填充 + 描边小片）。
   本块在以下三个文件中逐字节相同（权威版本 = shared/chord-style.js）：
     musiclib/musiclib.js / youth-engine.js / musictool/musictool.js
   修改流程：先改 shared/chord-style.js，再同步三处，diff 校验一致。
   注意：本块内禁止出现反斜杠字符
   （musictool.js 经 CMS 部署会丢失一层反斜杠），
   转义字符一律用 String.fromCharCode 构造。
   硬性约束：只做视觉，不改布局——和弦按等宽字体与歌词逐字对齐，
   因此不用 padding/border/margin，描边用 outline（不占布局空间），
   字号、行高、margin、min-height 全部继承宿主 .p-chord 原样。
   配色规则：同根音共用一色（G/G7/Gsus4/Gm 同色），12 音名 12 色，
   色相按半音序直接展开（pc*30°）：常见进行（I-IV-V、关系小调）
   的根音相距纯四/五度或小三度，映射后色差足够大，
   同一首歌里的常用和弦颜色能明显区分；
   填充色醒目但文字对比度优先：浅色主题浅底深字、深色主题深底浅字
   （同色相配对，保证和弦文字一眼可辨）；
   深浅主题分别取色：优先 html[data-resolved-theme]，
   无该属性的宿主回退 prefers-color-scheme。 */
var CHORD_STYLE_PC={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
var CHORD_STYLE_SHARP=String.fromCharCode(0x266F);
var CHORD_STYLE_FLAT=String.fromCharCode(0x266D);
var CHORD_STYLE_GAPS=' '+String.fromCharCode(9)+String.fromCharCode(160)+String.fromCharCode(0x3164)+String.fromCharCode(0x3000);
function chordStyleIsGapChar(ch){
  return CHORD_STYLE_GAPS.indexOf(ch)>=0;
}
/* 根音 -> 半音音级（0..11）；找不到可识别根音时返回 -1（不上色）。
   规则：根音必须在 token 开头（允许若干前置左括号，兼容 "(C/G)"），
   根音（含变音记号）之后若紧跟小写字母，必须是合法和弦后缀首字母
   （m/s/a/d，如 m7、sus4、add9、dim），否则视为普通单词不上色——
   这样可排除写在 chord 字段里的 "Fine"、"Chorus"、"Coda"、
   "To Chorus" 这类段落标记文本。 */
function chordStylePitchClass(token){
  var s=String(token||'');
  var i=0;
  while(i<s.length&&s.charAt(i)==='(')i++;
  var ch=s.charAt(i);
  if(!Object.prototype.hasOwnProperty.call(CHORD_STYLE_PC,ch))return -1;
  var pc=CHORD_STYLE_PC[ch];
  var j=i+1;
  var nx=s.charAt(j);
  if(nx==='#'||nx===CHORD_STYLE_SHARP){pc=(pc+1)%12;j++;}
  else if(nx==='b'||nx===CHORD_STYLE_FLAT){pc=(pc+11)%12;j++;}
  var after=s.charAt(j);
  if(after>='a'&&after<='z'&&'msad'.indexOf(after)<0)return -1;
  return pc;
}
/* 音级 -> 色相：半音序直接展开再整体旋转，C=210°（蓝），确定性映射。 */
function chordStyleHue(pc){
  return (pc*30+210)%360;
}
function chordStyleEnsureCss(){
  if(typeof document==='undefined'||!document.head)return;
  if(document.getElementById('cecp-chord-style'))return;
  var st=document.createElement('style');
  st.id='cecp-chord-style';
  var light='',dark='',i,h;
  for(i=0;i<12;i++){
    h=chordStyleHue(i);
    light+='.chord-chip.chord-pc'+i+'{background:hsl('+h+',65%,86%);outline-color:hsl('+h+',48%,60%);color:hsl('+h+',90%,20%);}';
    dark+='.chord-chip.chord-pc'+i+'{background:hsl('+h+',42%,26%);outline-color:hsl('+h+',45%,48%);color:hsl('+h+',72%,84%);}';
  }
  var darkAttr=dark.split('.chord-chip.').join('html[data-resolved-theme="dark"] .chord-chip.');
  var darkAuto=dark.split('.chord-chip.').join('html:not([data-resolved-theme="light"]) .chord-chip.');
  st.textContent=
    '.chord-chip{border-radius:4px;outline:1px solid transparent;outline-offset:0;}'+
    light+darkAttr+
    '@media (prefers-color-scheme: dark){'+darkAuto+'}';
  document.head.appendChild(st);
}
/* 把一个文本节点按 gap 字符切成若干节点，返回 [{gap,node}...]；
   只有内容/gap 混排时才真正拆分 DOM。 */
function chordStyleSplitText(node){
  var s=node.nodeValue||'',pieces=[],cur='',curGap=null,out=[],i;
  for(i=0;i<s.length;i++){
    var g=chordStyleIsGapChar(s.charAt(i));
    if(curGap===null)curGap=g;
    if(g!==curGap){pieces.push({gap:curGap,text:cur});cur='';curGap=g;}
    cur+=s.charAt(i);
  }
  if(cur)pieces.push({gap:curGap,text:cur});
  if(pieces.length<=1){
    out.push({gap:pieces.length?pieces[0].gap:true,node:node});
    return out;
  }
  var parent=node.parentNode;
  for(i=0;i<pieces.length;i++){
    var tn=document.createTextNode(pieces[i].text);
    parent.insertBefore(tn,node);
    out.push({gap:pieces[i].gap,node:tn});
  }
  parent.removeChild(node);
  return out;
}
function chordChipWalk(parent){
  var nodes=[],n,i;
  for(n=parent.firstChild;n;n=n.nextSibling)nodes.push(n);
  var run=[];
  function flush(){
    if(!run.length)return;
    var text='',k;
    for(k=0;k<run.length;k++)text+=run[k].nodeValue;
    var pc=chordStylePitchClass(text);
    if(pc>=0){
      var chip=document.createElement('span');
      chip.className='chord-chip chord-pc'+pc;
      parent.insertBefore(chip,run[0]);
      for(k=0;k<run.length;k++)chip.appendChild(run[k]);
    }
    run=[];
  }
  for(i=0;i<nodes.length;i++){
    n=nodes[i];
    if(n.nodeType===3){
      var pieces=chordStyleSplitText(n);
      for(var j=0;j<pieces.length;j++){
        if(pieces[j].gap)flush();
        else run.push(pieces[j].node);
      }
    }else if(n.nodeType===1){
      flush();
      var c=' '+String(n.className||'')+' ';
      if(c.indexOf('gap')<0)chordChipWalk(n);
    }else{
      flush();
    }
  }
  flush();
}
/* 对一个 .p-chord 元素做视觉装饰：内容设置完成后调用。
   同一元素内多个和弦（以空白/占位分隔）各自成片、各自取色。 */
function chordChipDecorate(root){
  if(!root||root.nodeType!==1)return;
  var cls=' '+String(root.className||'')+' ';
  if(cls.indexOf(' empty ')>=0)return;
  if(root.querySelector&&root.querySelector('.chord-chip'))return;
  chordStyleEnsureCss();
  chordChipWalk(root);
}
/* ═══════════ CECP-CHORD-STYLE v1 END ═══════════ */

/* ═══════════ CECP-LYRIC-HL v1 BEGIN ═══════════
   共享模块：歌词荧光笔标记（本地持久化，仅歌词行可标记）。
   本块在以下两个文件中逐字节相同（权威版本 = shared/lyric-hl.js）：
     musiclib/musiclib.js / youth-engine.js
   （本期不含 musictool.js，但仍遵守共享块「禁止反斜杠」约定，
   转义一律用 String.fromCharCode，便于未来同步。）
   修改流程：先改 shared/lyric-hl.js，再同步两处，diff 校验一致。
   设计要点：
   - 只有 .p-lyric（含 lyric2/3/4，均带 .p-lyric 类）可被标记；
     .p-chord / .p-n 不参与。最小单位 = 一个 .prev-seg 里的一个歌词元素。
   - 标记直接写在元素上（data-hl 属性 + 注入 CSS 背景色），是真实
     DOM 样式，html2canvas 导出自动带上；导出前另有
     lyricHlPrepareExport 把颜色内联成白底可辨的实色。
   - 存储用 localStorage，键 cecp-lyric-hl:<songId>，值为内容坐标
     [[行号,分段号,歌词行号,颜色号],...]，与 DOM 实例无关；每次
     renderScore 重建 DOM 后由宿主调用 lyricHlApply 重放，坐标越界
     的标记静默忽略。
   - 手势冲突：默认关闭标记模式，歌词区滚动不受影响；开启后在根节点
     上 pointer capture + touch-action:none，滑动只画不滚。 */
var LYRIC_HL_COLORS=[
  {name:'yellow',solid:'#FFE45E',dark:'rgba(255,228,94,0.34)'},
  {name:'green',solid:'#A9E886',dark:'rgba(169,232,134,0.32)'},
  {name:'pink',solid:'#FFAFC9',dark:'rgba(255,175,201,0.34)'},
  {name:'blue',solid:'#9FD3FF',dark:'rgba(159,211,255,0.34)'},
  {name:'orange',solid:'#FFC98A',dark:'rgba(255,201,138,0.34)'}
];
var LYRIC_HL_PREFIX='cecp-lyric-hl:';
var LYRIC_HL_PEN_KEY='cecp-lyric-hl-pen';
function lyricHlLoad(songId){
  try{
    var raw=localStorage.getItem(LYRIC_HL_PREFIX+String(songId||''));
    if(!raw)return [];
    var data=JSON.parse(raw);
    return (data&&Object.prototype.toString.call(data.marks)==='[object Array]')?data.marks:[];
  }catch(_){return [];}
}
function lyricHlSave(songId,marks){
  try{
    var key=LYRIC_HL_PREFIX+String(songId||'');
    if(marks&&marks.length)localStorage.setItem(key,JSON.stringify({v:1,marks:marks}));
    else localStorage.removeItem(key);
  }catch(_){}
}
function lyricHlEnsureCss(){
  if(typeof document==='undefined'||!document.head)return;
  if(document.getElementById('cecp-lyric-hl-style'))return;
  var st=document.createElement('style');
  st.id='cecp-lyric-hl-style';
  var base='.p-lyric[data-hl]{border-radius:3px;box-decoration-break:clone;}',i;
  var light='',dark='';
  for(i=0;i<LYRIC_HL_COLORS.length;i++){
    light+='.p-lyric[data-hl="'+i+'"]{background-color:'+LYRIC_HL_COLORS[i].solid+';}';
    dark+='.p-lyric[data-hl="'+i+'"]{background-color:'+LYRIC_HL_COLORS[i].dark+';}';
  }
  var darkAttr=dark.split('.p-lyric[').join('html[data-resolved-theme="dark"] .p-lyric[');
  var darkAuto=dark.split('.p-lyric[').join('html:not([data-resolved-theme="light"]) .p-lyric[');
  st.textContent=
    base+light+darkAttr+
    '@media (prefers-color-scheme: dark){'+darkAuto+'}'+
    '.lyric-hl-marking{touch-action:none;-webkit-user-select:none;user-select:none;}'+
    '.lyric-hl-marking .p-lyric{cursor:crosshair;}';
  document.head.appendChild(st);
}
/* 元素 -> 内容坐标 {row,seg,line}；不属于歌词区时返回 null */
function lyricHlCoordOf(root,el){
  if(!el||!el.closest)return null;
  var lyric=el.closest('.p-lyric');
  if(!lyric||!root.contains(lyric))return null;
  var row=lyric.closest('.sw-lrow');
  var seg=lyric.closest('.prev-seg');
  if(!row||!seg)return null;
  var r=Array.prototype.indexOf.call(root.querySelectorAll('.sw-lrow'),row);
  var sIdx=Array.prototype.indexOf.call(row.querySelectorAll('.prev-seg'),seg);
  var lIdx=Array.prototype.indexOf.call(seg.querySelectorAll('.p-lyric'),lyric);
  if(r<0||sIdx<0||lIdx<0)return null;
  return {row:r,seg:sIdx,line:lIdx,el:lyric};
}
/* 内容坐标 -> 当前 DOM 节点；越界返回 null（内容被编辑过的兜底） */
function lyricHlNodeAt(root,row,seg,line){
  var rows=root.querySelectorAll('.sw-lrow');
  if(row<0||row>=rows.length)return null;
  var segs=rows[row].querySelectorAll('.prev-seg');
  if(seg<0||seg>=segs.length)return null;
  var lyrics=segs[seg].querySelectorAll('.p-lyric');
  if(line<0||line>=lyrics.length)return null;
  return lyrics[line];
}
/* 渲染完成后重放：清掉旧标记属性，再按存储坐标重新打上 */
function lyricHlApply(root,songId){
  if(!root||!root.querySelectorAll)return;
  lyricHlEnsureCss();
  Array.prototype.forEach.call(root.querySelectorAll('.p-lyric[data-hl]'),function(el){
    el.removeAttribute('data-hl');
  });
  var marks=lyricHlLoad(songId);
  for(var i=0;i<marks.length;i++){
    var m=marks[i];
    if(!m||m.length<4)continue;
    var c=m[3];
    if(!(c>=0&&c<LYRIC_HL_COLORS.length))continue;
    var el=lyricHlNodeAt(root,m[0],m[1],m[2]);
    if(el)el.setAttribute('data-hl',String(c));
  }
}
/* 更新一处标记：colorIdx 为 null 时表示擦除 */
function lyricHlSet(root,songId,coord,colorIdx){
  var marks=lyricHlLoad(songId),out=[],found=false,i;
  for(i=0;i<marks.length;i++){
    var m=marks[i];
    if(m&&m[0]===coord.row&&m[1]===coord.seg&&m[2]===coord.line){
      found=true;
      if(colorIdx!=null)out.push([coord.row,coord.seg,coord.line,colorIdx]);
    }else out.push(m);
  }
  if(!found&&colorIdx!=null)out.push([coord.row,coord.seg,coord.line,colorIdx]);
  lyricHlSave(songId,out);
  if(coord.el){
    if(colorIdx!=null)coord.el.setAttribute('data-hl',String(colorIdx));
    else coord.el.removeAttribute('data-hl');
  }
}
/* 导出前调用：把标记颜色内联成白底实色（live 深色模式的半透明变体
   在纯白导出底上会太淡），并保证优先级高于导出置黑逻辑 */
function lyricHlPrepareExport(scope){
  if(!scope||!scope.querySelectorAll)return;
  Array.prototype.forEach.call(scope.querySelectorAll('.p-lyric[data-hl]'),function(el){
    var idx=parseInt(el.getAttribute('data-hl'),10);
    if(idx>=0&&idx<LYRIC_HL_COLORS.length){
      el.style.setProperty('background-color',LYRIC_HL_COLORS[idx].solid,'important');
      el.style.setProperty('border-radius','3px');
    }
  });
}
/* 荧光笔控制条：笔开关 + 5 色 + 清空。宿主把返回的元素插进工具行，
   并在每次 renderScore 末尾调用 lyricHlApply。root = 歌词区根节点
   （innerHTML 会被重建但节点本身持久），getSongId 惰性取歌曲 id。 */
function lyricHlCreateController(root,getSongId){
  lyricHlEnsureCss();
  var active=false;
  var colorIdx=0;
  try{
    var savedPen=parseInt(localStorage.getItem(LYRIC_HL_PEN_KEY),10);
    if(savedPen>=0&&savedPen<LYRIC_HL_COLORS.length)colorIdx=savedPen;
  }catch(_){}
  var wrap=document.createElement('span');
  wrap.className='lyric-hl-ctrl';
  wrap.style.cssText='display:inline-flex;align-items:center;gap:6px;vertical-align:middle;';
  var pen=document.createElement('button');
  pen.type='button';
  pen.setAttribute('aria-label','歌词荧光笔');
  pen.textContent=String.fromCharCode(0xD83D,0xDD8D);
  pen.style.cssText='cursor:pointer;font-size:15px;line-height:1;min-height:36px;padding:0 12px;border-radius:11px;border:1px solid rgba(128,128,128,0.35);background:transparent;display:inline-flex;align-items:center;transition:background .15s,border-color .15s;';
  var palette=document.createElement('span');
  palette.style.cssText='display:none;align-items:center;gap:5px;';
  var dots=[];
  function refreshDots(){
    for(var i=0;i<dots.length;i++){
      dots[i].style.boxShadow=(i===colorIdx)?'0 0 0 2px rgba(128,128,128,0.9)':'none';
      dots[i].style.transform=(i===colorIdx)?'scale(1.15)':'none';
    }
  }
  LYRIC_HL_COLORS.forEach(function(c,i){
    var d=document.createElement('button');
    d.type='button';
    d.setAttribute('aria-label','荧光笔颜色 '+c.name);
    d.style.cssText='cursor:pointer;width:16px;height:16px;border-radius:50%;border:1px solid rgba(0,0,0,0.18);padding:0;background:'+c.solid+';transition:transform .12s ease;';
    d.addEventListener('click',function(ev){
      ev.stopPropagation();
      colorIdx=i;
      try{localStorage.setItem(LYRIC_HL_PEN_KEY,String(i));}catch(_){}
      refreshDots();
    });
    dots.push(d);
    palette.appendChild(d);
  });
  var clearBtn=document.createElement('button');
  clearBtn.type='button';
  clearBtn.textContent='清空';
  clearBtn.setAttribute('aria-label','清空本歌全部标记');
  clearBtn.style.cssText='cursor:pointer;font-size:11px;font-weight:700;line-height:1;min-height:30px;padding:0 10px;border-radius:9px;border:1px solid rgba(128,128,128,0.35);background:transparent;color:inherit;display:inline-flex;align-items:center;';
  clearBtn.addEventListener('click',function(ev){
    ev.stopPropagation();
    lyricHlSave(getSongId(),[]);
    lyricHlApply(root,getSongId());
  });
  palette.appendChild(clearBtn);
  wrap.appendChild(pen);
  wrap.appendChild(palette);
  function setActive(on){
    active=!!on;
    pen.style.background=active?'rgba(128,128,128,0.22)':'transparent';
    pen.style.borderColor=active?'rgba(128,128,128,0.7)':'rgba(128,128,128,0.35)';
    palette.style.display=active?'inline-flex':'none';
    if(root&&root.classList){
      if(active)root.classList.add('lyric-hl-marking');
      else root.classList.remove('lyric-hl-marking');
    }
    refreshDots();
  }
  pen.addEventListener('click',function(ev){
    ev.stopPropagation();
    setActive(!active);
  });
  /* 笔迹手势：开启时 pointer capture，滑过的歌词逐段上色；
     起笔落在「已是当前色」的分段 => 本次笔画为擦除模式（toggle） */
  var stroke=null;
  function strokeApply(target){
    var coord=lyricHlCoordOf(root,target);
    if(!coord)return;
    var k=coord.row+'_'+coord.seg+'_'+coord.line;
    if(stroke.seen[k])return;
    stroke.seen[k]=true;
    lyricHlSet(root,getSongId(),coord,stroke.erase?null:colorIdx);
  }
  root.addEventListener('pointerdown',function(e){
    if(!active)return;
    var coord=lyricHlCoordOf(root,e.target);
    if(!coord)return;
    e.preventDefault();
    try{root.setPointerCapture(e.pointerId);}catch(_){}
    stroke={erase:coord.el.getAttribute('data-hl')===String(colorIdx),seen:{}};
    strokeApply(e.target);
  });
  root.addEventListener('pointermove',function(e){
    if(!active||!stroke)return;
    e.preventDefault();
    var t=document.elementFromPoint(e.clientX,e.clientY);
    if(t)strokeApply(t);
  });
  function endStroke(e){
    if(!stroke)return;
    stroke=null;
    try{root.releasePointerCapture(e.pointerId);}catch(_){}
  }
  root.addEventListener('pointerup',endStroke);
  root.addEventListener('pointercancel',endStroke);
  refreshDots();
  return wrap;
}
/* ═══════════ CECP-LYRIC-HL v1 END ═══════════ */

/* ═══════════ CECP-CHORD-ENGINE v1 BEGIN ═══════════
   共享模块：和弦浏览器引擎（Chord Explorer）。
   点击歌词区 .p-chord 弹出底部面板：组成音 / 钢琴键盘 / 吉他把位 / 试听。

   本块在以下两个文件中逐字节相同（权威版本 = shared/chord-engine.js）：
     musiclib/musiclib.js / youth-engine.js
   修改流程：先改 shared/chord-engine.js，再同步两处，diff 校验一致。
   （本块不同步进 musictool.js，因此不受「块内禁止反斜杠」限制。）

   宿主依赖（两个宿主文件在本块之前的同一作用域内均已定义，逐字节同名）：
     parseKeyName(key)            -> {root,suf}
     needFlat(root,suf)           -> boolean（根据根音/大小调决定升降号拼写）
     trKeyName(key,st,useFlat)    -> 移调后的音名（宿主移调功能同款拼写规则）
     KEY_SET_SHARP                -> 12 个升号拼写音名表
   本引擎不自带任何升降号拼写规则，全部委托给以上宿主函数，
   保证弹出面板里的音名与移调功能显示的拼写完全一致。

   对外暴露：
     window.ChordEngine.open('G#m')     编程式打开面板
     window.ChordEngine.parseChord(sym) 解析和弦 -> ChordDefinition
     window.ChordEngine.getChord(sym)   解析 + 吉他把位（带缓存）
     <chord-explorer> / <chord-piano> / <chord-guitar-diagram> 自定义元素
   纯逻辑层（解析/乐理/把位/Store）不依赖 DOM，可在 Node 中单测。 */
var ChordEngine=(function(){
  'use strict';

  var VERSION='1.0.0';

  /* ───────────────────────── 常量 ─────────────────────────
     颜色不写死在绘图代码里：先读宿主 CSS 变量，读不到时用下面的回退色。
     语义色三档：root（根音，复用宿主 --accent）/ third（三音）/ ext（五音与延伸音）。 */
  var FALLBACK_LIGHT={
    bg:'#FFFDF9',bg2:'#F8F1E8',bg3:'#F3E8DC',
    text:'#241C17',text2:'#6F655D',text3:'#9A8F85',
    border:'#E9E0D8',borderMd:'rgba(87,63,45,.18)',
    accent:'#C76524',accentSoft:'#F8E7D8',
    third:'#3E6E9E',ext:'#5E8A55',
    keyWhite:'#FFFEFB',keyWhiteEdge:'#DCD2C6',keyBlack:'#2A2118'
  };
  var FALLBACK_DARK={
    bg:'#18201C',bg2:'#202A25',bg3:'#25312B',
    text:'#F5F1EA',text2:'#BCC4BF',text3:'#89948E',
    border:'rgba(255,255,255,.10)',borderMd:'rgba(255,255,255,.16)',
    accent:'#D77A38',accentSoft:'rgba(215,122,56,.20)',
    third:'#82AFD6',ext:'#96BE8C',
    keyWhite:'#EDE8DE',keyWhiteEdge:'#4A453C',keyBlack:'#12100C'
  };
  /* 吉他标准调弦（低音弦 -> 高音弦）的音级与 MIDI 音高 */
  var GUITAR_STRING_PC=[4,9,2,7,11,4];
  var GUITAR_STRING_MIDI=[40,45,50,55,59,64];
  /* 试听参数 */
  var STRUM_STAGGER_MS=48;      /* 吉他扫弦相邻弦触发间隔 */
  var PIANO_NOTE_SECONDS=1.9;   /* 钢琴音衰减时长 */
  var GUITAR_NOTE_SECONDS=1.5;  /* 吉他音衰减时长 */
  var FLASH_MS=420;             /* 按键/指法点按下反馈时长 */

  /* ───────────────────────── 极简 Store ─────────────────────────
     零依赖发布-订阅状态容器，供 <chord-explorer> 内部使用。 */

  /**
   * 创建一个极简 Store。
   * @param {Object} initialState 初始状态
   * @returns {{getState:function():Object, setState:function(Object):void, subscribe:function(Function):Function}}
   *   setState 做浅合并并通知订阅者；subscribe 返回取消订阅函数。
   */
  function createStore(initialState){
    var state=Object.assign({},initialState||{});
    var listeners=[];
    return {
      getState:function(){return state;},
      setState:function(partial){
        state=Object.assign({},state,partial||{});
        for(var i=0;i<listeners.length;i++){try{listeners[i](state);}catch(e){}}
      },
      subscribe:function(fn){
        listeners.push(fn);
        return function(){
          var i=listeners.indexOf(fn);
          if(i>=0)listeners.splice(i,1);
        };
      }
    };
  }

  /* ───────────────────────── 乐理层 ─────────────────────────
     宿主已有 trKeyName 等函数只处理「根音本身」的移调拼写；
     本层在其之上补充「由音程算出完整组成音列表」。 */

  /**
   * 求音名的音级（pitch class，0=C ... 11=B）。
   * 拼写委托宿主：先用 trKeyName 归一成升号拼写，再查 KEY_SET_SHARP。
   * @param {string} note 音名（如 'Ab'、'F#'）
   * @returns {number} 0~11；无法识别返回 -1
   */
  function pcOf(note){
    var parsed=parseKeyName(String(note||'').trim());
    var sharp=parseKeyName(trKeyName(parsed.root,0,false)).root;
    return KEY_SET_SHARP.indexOf(sharp);
  }

  /**
   * 根音整体的升降号偏好：
   * 写明升/降号的根音以用户看到的为准；自然音级根音沿用宿主 needFlat 规则。
   * @param {string} root 根音
   * @param {string} qualityId 性质 id（needFlat 靠它判断大小调）
   * @returns {boolean} true=偏好降号拼写
   */
  function rootPrefersFlat(root,qualityId){
    if(root.indexOf('b')>0)return true;
    if(root.indexOf('#')>0)return false;
    return needFlat(root,qualityId);
  }

  /**
   * 拼写某个组成音。
   * 降变度数（b3/b5/b7/b9…）强制降号、升变度数（#5/#9…）强制升号，
   * 自然度数跟随根音偏好——这样 C7 得到 Bb 而不是 A#，E 大三和弦得到 G#。
   * @param {string} root 根音
   * @param {number} interval 距根音的半音数
   * @param {string} degree 度数标签（'R'/'3'/'b7'/'#9'…）
   * @param {boolean} rootFlat 根音整体偏好
   * @returns {string} 音名
   */
  function spellChordTone(root,interval,degree,rootFlat){
    var flat=rootFlat;
    if(degree.indexOf('b')>=0)flat=true;
    else if(degree.indexOf('#')>=0)flat=false;
    return parseKeyName(trKeyName(root,interval,flat)).root;
  }

  /* 度数 -> 语义角色：root=根音 / third=三音（含挂留替代音）/ ext=五音与延伸音 */
  function degreeRole(degree){
    if(degree==='R')return 'root';
    if(degree==='3'||degree==='b3'||degree==='2'||degree==='4')return 'third';
    return 'ext';
  }

  /* ───────────────────────── 和弦性质表 ─────────────────────────
     [id, 英文名, 中文名, 音程(半音), 度数标签]。
     音程与度数一一对应；新增性质只需加一行，解析器无需改动。 */
  var QUALITY_ROWS=[
    ['','Major','大三和弦',[0,4,7],['R','3','5']],
    ['m','Minor','小三和弦',[0,3,7],['R','b3','5']],
    ['5','Power Chord','五度和弦',[0,7],['R','5']],
    ['6','Major 6th','大六和弦',[0,4,7,9],['R','3','5','6']],
    ['m6','Minor 6th','小六和弦',[0,3,7,9],['R','b3','5','6']],
    ['69','6/9','六九和弦',[0,4,7,9,14],['R','3','5','6','9']],
    ['7','Dominant 7th','属七和弦',[0,4,7,10],['R','3','5','b7']],
    ['maj7','Major 7th','大七和弦',[0,4,7,11],['R','3','5','7']],
    ['m7','Minor 7th','小七和弦',[0,3,7,10],['R','b3','5','b7']],
    ['mMaj7','Minor-Major 7th','小大七和弦',[0,3,7,11],['R','b3','5','7']],
    ['9','Dominant 9th','属九和弦',[0,4,7,10,14],['R','3','5','b7','9']],
    ['11','Dominant 11th','属十一和弦',[0,4,7,10,14,17],['R','3','5','b7','9','11']],
    ['13','Dominant 13th','属十三和弦',[0,4,7,10,14,21],['R','3','5','b7','9','13']],
    ['sus2','Suspended 2nd','挂二和弦',[0,2,7],['R','2','5']],
    ['sus4','Suspended 4th','挂四和弦',[0,5,7],['R','4','5']],
    ['7sus4','7th Suspended 4th','属七挂四和弦',[0,5,7,10],['R','4','5','b7']],
    ['add9','Added 9th','加九和弦',[0,4,7,14],['R','3','5','9']],
    ['madd9','Minor Added 9th','小加九和弦',[0,3,7,14],['R','b3','5','9']],
    ['dim','Diminished','减三和弦',[0,3,6],['R','b3','b5']],
    ['dim7','Diminished 7th','减七和弦',[0,3,6,9],['R','b3','b5','bb7']],
    ['aug','Augmented','增三和弦',[0,4,8],['R','3','#5']],
    ['aug7','Augmented 7th','增属七和弦',[0,4,8,10],['R','3','#5','b7']],
    ['m7b5','Half-Diminished','半减七和弦',[0,3,6,10],['R','b3','b5','b7']],
    ['7b5','Dominant 7th flat 5','属七降五和弦',[0,4,6,10],['R','3','b5','b7']],
    ['7#9','Dominant 7th sharp 9','属七升九和弦',[0,4,7,10,15],['R','3','5','b7','#9']],
    ['7b9','Dominant 7th flat 9','属七降九和弦',[0,4,7,10,13],['R','3','5','b7','b9']],
    ['maj9','Major 9th','大九和弦',[0,4,7,11,14],['R','3','5','7','9']],
    ['m9','Minor 9th','小九和弦',[0,3,7,10,14],['R','b3','5','b7','9']],
    ['maj13','Major 13th','大十三和弦',[0,4,7,11,14,21],['R','3','5','7','9','13']],
    ['m11','Minor 11th','小十一和弦',[0,3,7,10,14,17],['R','b3','5','b7','9','11']]
  ];
  var QUALITIES={};
  (function(){
    for(var i=0;i<QUALITY_ROWS.length;i++){
      var r=QUALITY_ROWS[i];
      QUALITIES[r[0]]={id:r[0],name:r[1],zh:r[2],intervals:r[3],degrees:r[4]};
    }
  })();

  /* 后缀别名 -> 性质 id。大小写敏感（'M'=大，'m'=小）。 */
  var SUFFIX_ALIASES={
    '':'','maj':'','M':'','major':'',
    'm':'m','min':'m','-':'m','minor':'m',
    '5':'5',
    '6':'6','maj6':'6','M6':'6',
    'm6':'m6','min6':'m6','-6':'m6',
    '69':'69','6/9':'69','6add9':'69',
    '7':'7','dom7':'7',
    'maj7':'maj7','M7':'maj7','Maj7':'maj7','ma7':'maj7','MA7':'maj7',
    'm7':'m7','min7':'m7','-7':'m7',
    'mMaj7':'mMaj7','mmaj7':'mMaj7','mM7':'mMaj7','minmaj7':'mMaj7','mMAJ7':'mMaj7','-maj7':'mMaj7',
    '9':'9','maj9':'maj9','M9':'maj9','m9':'m9','min9':'m9',
    '11':'11','m11':'m11','min11':'m11',
    '13':'13','maj13':'maj13','M13':'maj13',
    'sus':'sus4','sus4':'sus4','sus2':'sus2',
    '7sus4':'7sus4','7sus':'7sus4',
    '2':'add9','add2':'add9','add9':'add9',
    'madd9':'madd9','madd2':'madd9',
    'dim':'dim','o':'dim','°':'dim',
    'dim7':'dim7','o7':'dim7','°7':'dim7',
    'aug':'aug','+':'aug',
    'aug7':'aug7','7#5':'aug7','7+5':'aug7','+7':'aug7',
    'm7b5':'m7b5','ø':'m7b5','ø7':'m7b5','m7-5':'m7b5','min7b5':'m7b5',
    '7b5':'7b5','7-5':'7b5',
    '7#9':'7#9','7+9':'7#9',
    '7b9':'7b9','7-9':'7b9'
  };

  /* ───────────────────────── 解析器 ─────────────────────────
     思路：符号拆成「根音 + 性质后缀 + 斜杠低音」三段；
     后缀经别名表归一到性质 id，性质映射到一组音程；
     再由根音 + 音程 + 宿主拼写函数得到组成音。 */

  var NOTE_ONLY_RE=/^[A-G](?:#|b)?$/;
  var ROOT_SPLIT_RE=/^([A-G](?:#|b)?)(.*)$/;

  /** 清洗和弦文本：统一 ♯/♭ 全角字符、去掉排版占位空白（NBSP/全角空格/谚文填充符）。 */
  function cleanChordText(text){
    return String(text||'')
      .replace(/[♯＃]/g,'#')
      .replace(/♭/g,'b')
      .replace(/[ 　ㅤ]/g,' ')
      .trim();
  }

  /**
   * 解析和弦符号。
   * @param {string} symbol 和弦符号（如 'G#m'、'D/F#'、'Bb13'、'Cmaj7'）
   * @returns {?ChordDefinition} 解析失败返回 null（不抛异常，便于点击时静默忽略非和弦文本）
   *
   * ChordDefinition 结构：
   *   input        原始输入
   *   symbol       归一化符号（根音+性质id[+/低音]）
   *   root/bass    根音 / 斜杠低音（无低音为 null）
   *   rootPc/bassPc 音级
   *   quality      {id,name,zh,intervals,degrees}
   *   notes        [{name,degree,role,pc,midi}] 组成音（不含低音）
   *   bassNote     低音 {name,pc,midi} 或 null
   *   pianoMidis   钢琴试听/高亮用 MIDI 列表（低音在最前）
   */
  function parseChord(symbol){
    var raw=cleanChordText(symbol);
    if(!raw)return null;
    /* 取第一个空白前的记号（歌谱里可能带尾随占位空格） */
    raw=raw.split(/\s+/)[0];
    var m=raw.match(ROOT_SPLIT_RE);
    if(!m)return null;
    var root=m[1],rest=m[2]||'';
    /* 斜杠低音：只有 '/' 后是纯音名才算（避免把 6/9 当低音） */
    var bass=null;
    var slash=rest.lastIndexOf('/');
    if(slash>=0){
      var after=rest.slice(slash+1);
      if(NOTE_ONLY_RE.test(after)){bass=after;rest=rest.slice(0,slash);}
    }
    /* 后缀归一：去掉括号（如 7(#9) -> 7#9），查别名表 */
    var suffix=rest.replace(/[()]/g,'').trim();
    var qid=Object.prototype.hasOwnProperty.call(SUFFIX_ALIASES,suffix)?SUFFIX_ALIASES[suffix]:null;
    if(qid===null)return null;
    var quality=QUALITIES[qid];
    var rootPc=pcOf(root);
    if(rootPc<0)return null;
    var bassPc=bass!==null?pcOf(bass):-1;
    if(bass!==null&&bassPc<0)bass=null;
    var rootFlat=rootPrefersFlat(root,qid);
    /* 根音落在 C3~B4 之间：高根音降一个八度，避免延伸和弦爬得太高 */
    var rootMidi=(rootPc>=8?48:60)+rootPc;
    var notes=[];
    for(var i=0;i<quality.intervals.length;i++){
      var iv=quality.intervals[i],deg=quality.degrees[i];
      /* 根音永远保持用户看到的拼写，其余组成音按度数规则拼写 */
      var name=i===0?parseKeyName(root).root:spellChordTone(root,iv,deg,rootFlat);
      notes.push({name:name,degree:deg,role:degreeRole(deg),pc:(rootPc+iv)%12,midi:rootMidi+iv});
    }
    var bassNote=null;
    if(bass!==null&&bassPc!==rootPc){
      /* 低音放在根音下方一个八度以内 */
      bassNote={name:parseKeyName(bass).root,pc:bassPc,midi:rootMidi+((bassPc-rootPc+12)%12)-12};
    }
    var pianoMidis=(bassNote?[bassNote.midi]:[]).concat(notes.map(function(n){return n.midi;}));
    return {
      input:String(symbol||''),
      symbol:parseKeyName(root).root+qid+(bassNote?'/'+bassNote.name:''),
      root:parseKeyName(root).root,rootPc:rootPc,
      bass:bassNote?bassNote.name:null,bassPc:bassNote?bassPc:-1,
      quality:quality,useFlat:rootFlat,
      notes:notes,bassNote:bassNote,pianoMidis:pianoMidis
    };
  }

  /* ───────────────────────── 吉他把位数据 ─────────────────────────
     数据以 JS 字面量内嵌（而非独立 JSON 请求）：
     本块会同步进两个部署路径不同的宿主，内嵌可避免跨宿主的 fetch 路径
     问题，并随宿主 JS 一起被 Service Worker 预缓存，天然离线可用。
     指法为常见标准按法（参考通行吉他和弦手册整理，非复制任何单一数据库）。

     两类数据：
     1. OPEN_VOICINGS：开放把位（含空弦，不可平移），key = `${pc}|${qualityId}`。
     2. MOVABLE_SHAPES：可平移把位（CAGED 型/横按型），按性质分组；
        rel 为相对品位（0 = 基准品），rootString 为根音所在弦（0=低音E弦），
        rootRel 为根音在型内的相对品位；实际品位 = rel + baseFret。
     frets/fingers 均为低音弦->高音弦；fret -1=闷音(x)，0=空弦(o)；finger 0=空弦/不按。 */

  var OPEN_VOICINGS={
    '0|':[{frets:[-1,3,2,0,1,0],fingers:[0,3,2,0,1,0],caged:'C'}],
    '9|':[{frets:[-1,0,2,2,2,0],fingers:[0,0,1,2,3,0],caged:'A'}],
    '7|':[{frets:[3,2,0,0,0,3],fingers:[2,1,0,0,0,3],caged:'G'}],
    '4|':[{frets:[0,2,2,1,0,0],fingers:[0,2,3,1,0,0],caged:'E'}],
    '2|':[{frets:[-1,-1,0,2,3,2],fingers:[0,0,0,1,3,2],caged:'D'}],
    '9|m':[{frets:[-1,0,2,2,1,0],fingers:[0,0,2,3,1,0],caged:'Am'}],
    '4|m':[{frets:[0,2,2,0,0,0],fingers:[0,2,3,0,0,0],caged:'Em'}],
    '2|m':[{frets:[-1,-1,0,2,3,1],fingers:[0,0,0,2,3,1],caged:'Dm'}],
    '9|7':[{frets:[-1,0,2,0,2,0],fingers:[0,0,2,0,3,0]}],
    '11|7':[{frets:[-1,2,1,2,0,2],fingers:[0,2,1,3,0,4]}],
    '0|7':[{frets:[-1,3,2,3,1,0],fingers:[0,3,2,4,1,0]}],
    '2|7':[{frets:[-1,-1,0,2,1,2],fingers:[0,0,0,2,1,3]}],
    '4|7':[{frets:[0,2,0,1,0,0],fingers:[0,2,0,1,0,0]}],
    '7|7':[{frets:[3,2,0,0,0,1],fingers:[3,2,0,0,0,1]}],
    '9|m7':[{frets:[-1,0,2,0,1,0],fingers:[0,0,2,0,1,0]}],
    '4|m7':[{frets:[0,2,0,0,0,0],fingers:[0,2,0,0,0,0]}],
    '2|m7':[{frets:[-1,-1,0,2,1,1],fingers:[0,0,0,2,1,1],barre:{fret:1,from:4,to:5}}],
    '0|maj7':[{frets:[-1,3,2,0,0,0],fingers:[0,3,2,0,0,0]}],
    '9|maj7':[{frets:[-1,0,2,1,2,0],fingers:[0,0,2,1,3,0]}],
    '2|maj7':[{frets:[-1,-1,0,2,2,2],fingers:[0,0,0,1,2,3]}],
    '5|maj7':[{frets:[-1,-1,3,2,1,0],fingers:[0,0,3,2,1,0]}],
    '7|maj7':[{frets:[3,2,0,0,0,2],fingers:[2,1,0,0,0,3]}],
    '9|sus2':[{frets:[-1,0,2,2,0,0],fingers:[0,0,1,2,0,0]}],
    '2|sus2':[{frets:[-1,-1,0,2,3,0],fingers:[0,0,0,1,3,0]}],
    '9|sus4':[{frets:[-1,0,2,2,3,0],fingers:[0,0,1,2,3,0]}],
    '2|sus4':[{frets:[-1,-1,0,2,3,3],fingers:[0,0,0,1,3,4]}],
    '4|sus4':[{frets:[0,2,2,2,0,0],fingers:[0,2,3,4,0,0]}],
    '0|add9':[{frets:[-1,3,2,0,3,0],fingers:[0,2,1,0,3,0]}]
  };

  /* 常见斜杠和弦的专用开放把位，key = `${rootPc}|${qualityId}|${bassPc}` */
  var SLASH_OPEN_VOICINGS={
    '2||6':[{frets:[2,-1,0,2,3,2],fingers:[1,0,0,2,4,3]}],   /* D/F# */
    '7||11':[{frets:[-1,2,0,0,3,3],fingers:[0,1,0,0,3,4]}],  /* G/B  */
    '0||7':[{frets:[3,3,2,0,1,0],fingers:[3,4,2,0,1,0]}],    /* C/G  */
    '0||4':[{frets:[0,3,2,0,1,0],fingers:[0,3,2,0,1,0]}],    /* C/E  */
    '2||9':[{frets:[-1,0,0,2,3,2],fingers:[0,0,0,1,3,2]}],   /* D/A  */
    '9|m|7':[{frets:[3,0,2,2,1,0],fingers:[4,0,2,3,1,0]}]    /* Am/G */
  };

  var MOVABLE_SHAPES={
    '':[
      {caged:'E',rootString:0,rootRel:0,rel:[0,2,2,1,0,0],fingers:[1,3,4,2,1,1],barre:{rel:0,from:0,to:5}},
      {caged:'A',rootString:1,rootRel:0,rel:[-1,0,2,2,2,0],fingers:[0,1,2,3,4,1],barre:{rel:0,from:1,to:5}},
      {caged:'D',rootString:2,rootRel:0,rel:[-1,-1,0,2,3,2],fingers:[0,0,1,2,4,3]}
    ],
    'm':[
      {caged:'Em',rootString:0,rootRel:0,rel:[0,2,2,0,0,0],fingers:[1,3,4,1,1,1],barre:{rel:0,from:0,to:5}},
      {caged:'Am',rootString:1,rootRel:0,rel:[-1,0,2,2,1,0],fingers:[0,1,3,4,2,1],barre:{rel:0,from:1,to:5}},
      {caged:'Dm',rootString:2,rootRel:0,rel:[-1,-1,0,2,3,1],fingers:[0,0,1,3,4,2]}
    ],
    '7':[
      {caged:'E',rootString:0,rootRel:0,rel:[0,2,0,1,0,0],fingers:[1,3,1,2,1,1],barre:{rel:0,from:0,to:5}},
      {caged:'A',rootString:1,rootRel:0,rel:[-1,0,2,0,2,0],fingers:[0,1,3,1,4,1],barre:{rel:0,from:1,to:5}}
    ],
    'm7':[
      {caged:'Em',rootString:0,rootRel:0,rel:[0,2,0,0,0,0],fingers:[1,3,1,1,1,1],barre:{rel:0,from:0,to:5}},
      {caged:'Am',rootString:1,rootRel:0,rel:[-1,0,2,0,1,0],fingers:[0,1,3,1,2,1],barre:{rel:0,from:1,to:5}}
    ],
    'maj7':[
      {caged:'E',rootString:0,rootRel:0,rel:[0,-1,1,1,0,-1],fingers:[2,0,3,4,1,0]},
      {caged:'A',rootString:1,rootRel:0,rel:[-1,0,2,1,2,0],fingers:[0,1,3,2,4,1],barre:{rel:0,from:1,to:5}}
    ],
    'mMaj7':[
      {caged:'Am',rootString:1,rootRel:0,rel:[-1,0,2,1,1,0],fingers:[0,1,4,2,3,1],barre:{rel:0,from:1,to:5}}
    ],
    '6':[
      {caged:'A',rootString:1,rootRel:0,rel:[-1,0,2,2,2,2],fingers:[0,1,3,3,3,3],barre:{rel:2,from:2,to:5}}
    ],
    'm6':[
      {caged:'Em',rootString:0,rootRel:0,rel:[0,2,2,0,2,0],fingers:[1,3,4,1,2,1],barre:{rel:0,from:0,to:5}}
    ],
    '69':[
      {rootString:1,rootRel:1,rel:[-1,1,0,0,1,1],fingers:[0,2,1,1,3,4],barre:{rel:0,from:2,to:3}}
    ],
    '9':[
      {rootString:1,rootRel:1,rel:[-1,1,0,1,1,1],fingers:[0,2,1,3,3,3],barre:{rel:1,from:3,to:5}}
    ],
    'm9':[
      {rootString:1,rootRel:2,rel:[-1,2,0,2,2,-1],fingers:[0,2,1,3,4,0]}
    ],
    'maj9':[
      {rootString:1,rootRel:1,rel:[-1,1,0,2,1,-1],fingers:[0,2,1,4,3,0]}
    ],
    'add9':[
      {rootString:1,rootRel:1,rel:[-1,1,0,-1,1,1],fingers:[0,2,1,0,3,4]}
    ],
    'sus2':[
      {caged:'A',rootString:1,rootRel:0,rel:[-1,0,2,2,0,0],fingers:[0,1,3,4,1,1],barre:{rel:0,from:1,to:5}}
    ],
    'sus4':[
      {caged:'E',rootString:0,rootRel:0,rel:[0,2,2,2,0,0],fingers:[1,2,3,4,1,1],barre:{rel:0,from:0,to:5}},
      {caged:'A',rootString:1,rootRel:0,rel:[-1,0,2,2,3,0],fingers:[0,1,2,3,4,1],barre:{rel:0,from:1,to:5}}
    ],
    '7sus4':[
      {caged:'E',rootString:0,rootRel:0,rel:[0,2,0,2,0,0],fingers:[1,3,1,4,1,1],barre:{rel:0,from:0,to:5}},
      {caged:'A',rootString:1,rootRel:0,rel:[-1,0,2,0,3,0],fingers:[0,1,3,1,4,1],barre:{rel:0,from:1,to:5}}
    ],
    'dim':[
      {rootString:1,rootRel:0,rel:[-1,0,1,2,1,-1],fingers:[0,1,2,4,3,0]}
    ],
    'dim7':[
      {rootString:2,rootRel:0,rel:[-1,-1,0,1,0,1],fingers:[0,0,1,3,2,4]}
    ],
    'aug':[
      {rootString:1,rootRel:2,rel:[-1,2,1,0,0,-1],fingers:[0,4,3,1,1,0],barre:{rel:0,from:3,to:4}}
    ],
    'aug7':[
      {rootString:0,rootRel:0,rel:[0,-1,0,1,1,-1],fingers:[1,0,2,3,4,0]}
    ],
    'm7b5':[
      {rootString:1,rootRel:0,rel:[-1,0,1,0,1,-1],fingers:[0,1,2,1,3,0],barre:{rel:0,from:1,to:3}},
      {rootString:0,rootRel:1,rel:[1,-1,1,1,0,-1],fingers:[2,0,3,4,1,0]}
    ],
    '7b5':[
      {rootString:0,rootRel:0,rel:[0,1,0,1,-1,-1],fingers:[1,2,1,3,0,0],barre:{rel:0,from:0,to:2}}
    ],
    '7#9':[
      {rootString:1,rootRel:1,rel:[-1,1,0,1,2,-1],fingers:[0,2,1,3,4,0]}
    ],
    '7b9':[
      {rootString:1,rootRel:1,rel:[-1,1,0,1,0,-1],fingers:[0,2,1,3,1,0],barre:{rel:0,from:2,to:4}}
    ],
    '13':[
      {rootString:0,rootRel:0,rel:[0,-1,0,1,2,2],fingers:[1,0,1,2,3,4],barre:{rel:0,from:0,to:2}}
    ],
    'm11':[
      {rootString:0,rootRel:0,rel:[0,0,0,0,0,0],fingers:[1,1,1,1,1,1],barre:{rel:0,from:0,to:5}}
    ],
    '5':[
      {rootString:0,rootRel:0,rel:[0,2,2,-1,-1,-1],fingers:[1,3,4,0,0,0]},
      {rootString:1,rootRel:0,rel:[-1,0,2,2,-1,-1],fingers:[0,1,3,4,0,0]}
    ]
  };

  /** 把位的展示起始品：低把位从 1 品画起（带琴枕），高把位从最低按品画起。 */
  function displayBaseFret(frets){
    var maxF=0,minPos=99;
    for(var i=0;i<6;i++){
      if(frets[i]>0){if(frets[i]>maxF)maxF=frets[i];if(frets[i]<minPos)minPos=frets[i];}
    }
    if(maxF<=4)return 1;
    return minPos===99?1:minPos;
  }

  /** 把位对象收尾：补 baseFret/label/root 标记，供绘图与试听使用。 */
  function finishPosition(pos,rootPc){
    pos.baseFret=displayBaseFret(pos.frets);
    pos.rootPc=rootPc;
    /* 试听用 MIDI（低音弦 -> 高音弦，跳过闷音） */
    pos.midis=[];
    for(var i=0;i<6;i++){
      if(pos.frets[i]>=0)pos.midis.push(GUITAR_STRING_MIDI[i]+pos.frets[i]);
    }
    if(!pos.label){
      /* 开放把位 / CAGED 型名；两者都没有时留空，由 UI 只显示品位号 */
      pos.label=pos.open?'开放把位':(pos.caged?pos.caged+' 型':'');
    }
    return pos;
  }

  /**
   * 计算某根音+性质的吉他把位列表。
   * 开放把位优先，其余按基准品从低到高排列，最多返回 4 个。
   * @param {number} rootPc 根音音级
   * @param {string} qualityId 性质 id
   * @param {number} [bassPc] 斜杠低音音级（命中专用开放把位时优先返回）
   * @returns {Array<Object>} 把位数组（可能为空：该性质暂未收录吉他按法）
   */
  function guitarPositionsFor(rootPc,qualityId,bassPc){
    var out=[],seen={};
    function push(p){
      var sig=p.frets.join(',');
      if(seen[sig])return;
      seen[sig]=1;
      out.push(finishPosition(p,rootPc));
    }
    /* 1. 斜杠和弦专用开放把位 */
    if(bassPc!==undefined&&bassPc>=0){
      var sk=rootPc+'|'+qualityId+'|'+bassPc;
      var sv=SLASH_OPEN_VOICINGS[sk]||[];
      for(var s=0;s<sv.length;s++){
        push({frets:sv[s].frets.slice(),fingers:sv[s].fingers.slice(),barre:sv[s].barre||null,caged:sv[s].caged||'',open:true});
      }
    }
    /* 2. 开放把位 */
    var ov=OPEN_VOICINGS[rootPc+'|'+qualityId]||[];
    for(var o=0;o<ov.length;o++){
      push({frets:ov[o].frets.slice(),fingers:ov[o].fingers.slice(),barre:ov[o].barre||null,caged:ov[o].caged||'',open:true});
    }
    /* 3. 可平移把位：基准品 = 根音品位 - 型内根音相对品位（不足则升八度） */
    var shapes=MOVABLE_SHAPES[qualityId]||[];
    for(var i=0;i<shapes.length;i++){
      var sh=shapes[i];
      var f=(rootPc-GUITAR_STRING_PC[sh.rootString]+12)%12;
      var base=f-sh.rootRel;
      if(base<0)base+=12;
      var frets=[],fingers=[];
      for(var j=0;j<6;j++){
        if(sh.rel[j]<0){frets.push(-1);fingers.push(0);}
        else{
          var fr=sh.rel[j]+base;
          frets.push(fr);
          fingers.push(fr===0?0:sh.fingers[j]);
        }
      }
      var barre=null;
      if(sh.barre){
        var bf=sh.barre.rel+base;
        if(bf>0)barre={fret:bf,from:sh.barre.from,to:sh.barre.to};
      }
      push({frets:frets,fingers:fingers,barre:barre,caged:sh.caged||'',open:base===0});
    }
    out.sort(function(a,b){
      if(a.open!==b.open)return a.open?-1:1;
      return a.baseFret-b.baseFret;
    });
    return out.slice(0,4);
  }

  /* ───────────────────────── Repository ─────────────────────────
     统一入口：符号 -> {def, guitar}，Map 缓存避免重复解析/计算。 */
  var repoCache=new Map();

  /**
   * 读取和弦完整数据（解析结果 + 吉他把位），带缓存。
   * @param {string} symbol 和弦符号
   * @returns {?{def:Object, guitar:Array}} 解析失败返回 null
   */
  function getChord(symbol){
    var key=cleanChordText(symbol);
    if(!key)return null;
    if(repoCache.has(key))return repoCache.get(key);
    var def=parseChord(key);
    var entry=def?{def:def,guitar:guitarPositionsFor(def.rootPc,def.quality.id,def.bassPc)}:null;
    repoCache.set(key,entry);
    return entry;
  }

  /* ───────────────────────── 音频引擎（Web Audio 合成） ─────────────────────────
     MVP 用振荡器合成，零音频文件、天然离线、低延迟。
     接口化设计：将来可用同接口换成真实采样音色。 */
  var AudioEngine={
    _ctx:null,_master:null,
    /** 懒初始化 AudioContext（必须由用户手势触发的调用链进入）。 */
    _ensure:function(){
      if(typeof window==='undefined')return null;
      var AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)return null;
      if(!this._ctx){
        this._ctx=new AC();
        /* 压限器兜底，多音齐奏不削波 */
        this._master=this._ctx.createDynamicsCompressor();
        this._master.threshold.value=-16;
        this._master.connect(this._ctx.destination);
      }
      if(this._ctx.state==='suspended'){try{this._ctx.resume();}catch(e){}}
      return this._ctx;
    },
    _midiFreq:function(m){return 440*Math.pow(2,(m-69)/12);},
    /** 单音合成：双振荡器 + 低通 + 指数衰减包络。timbre: 'piano'|'guitar' */
    _voice:function(midi,when,timbre){
      var ctx=this._ctx,freq=this._midiFreq(midi);
      var isG=timbre==='guitar';
      var dur=isG?GUITAR_NOTE_SECONDS:PIANO_NOTE_SECONDS;
      var lp=ctx.createBiquadFilter();
      lp.type='lowpass';
      lp.frequency.value=isG?2300:3800;
      lp.Q.value=0.6;
      var gain=ctx.createGain();
      gain.gain.setValueAtTime(0.0001,when);
      gain.gain.linearRampToValueAtTime(isG?0.30:0.26,when+0.006);
      gain.gain.exponentialRampToValueAtTime(0.0008,when+dur);
      var o1=ctx.createOscillator();
      o1.type=isG?'sawtooth':'triangle';
      o1.frequency.value=freq;
      var o2=ctx.createOscillator();
      o2.type=isG?'triangle':'sine';
      o2.frequency.value=freq*(isG?1:2);
      o2.detune.value=isG?4:2;
      var g2=ctx.createGain();
      g2.gain.value=isG?0.5:0.35;
      o1.connect(lp);o2.connect(g2);g2.connect(lp);
      lp.connect(gain);gain.connect(this._master);
      o1.start(when);o2.start(when);
      o1.stop(when+dur+0.05);o2.stop(when+dur+0.05);
    },
    /**
     * 钢琴式播放：组成音同时触发。
     * @param {number[]} midis MIDI 音高列表
     * @returns {boolean} 环境不支持 Web Audio 时返回 false
     */
    playChord:function(midis){
      var ctx=this._ensure();
      if(!ctx||!midis||!midis.length)return false;
      var t=ctx.currentTime+0.02;
      for(var i=0;i<midis.length;i++)this._voice(midis[i],t,'piano');
      return true;
    },
    /**
     * 吉他扫弦：各弦按 STRUM_STAGGER_MS 间隔依次触发。
     * @param {number[]} midis 低音弦->高音弦的 MIDI 列表
     * @returns {number[]} 各音相对触发延时（ms），供 UI 同步动画；不支持时返回 []
     */
    strumGuitar:function(midis){
      var ctx=this._ensure();
      if(!ctx||!midis||!midis.length)return [];
      var t=ctx.currentTime+0.02,delays=[];
      for(var i=0;i<midis.length;i++){
        this._voice(midis[i],t+i*STRUM_STAGGER_MS/1000,'guitar');
        delays.push(i*STRUM_STAGGER_MS);
      }
      return delays;
    }
  };

  /* 对外 API（DOM 相关的 open/close 在下方 DOM 段里再挂上） */
  var API={
    version:VERSION,
    parseChord:parseChord,
    getChord:getChord,
    guitarPositionsFor:guitarPositionsFor,
    cleanChordText:cleanChordText,
    createStore:createStore,
    audio:AudioEngine,
    qualities:QUALITIES,
    open:function(){},
    close:function(){}
  };

  /* ═════════════════ 以下为 DOM/UI 段，Node 单测环境自动跳过 ═════════════════ */
  if(typeof window!=='undefined'&&typeof document!=='undefined'&&typeof customElements!=='undefined'){

    /* ── 主题工具：宿主 CSS 变量 -> 引擎内部 --ce-* 变量 ──
       宿主的主题变量定义在 #music-library 上（不在 :root），
       而面板挂在 body 下，无法靠继承拿到，因此在打开时把
       计算值复制到组件宿主元素上；读不到时按明暗回退。 */
    function isDarkTheme(){
      var attr=document.documentElement.getAttribute('data-resolved-theme');
      if(attr==='dark')return true;
      if(attr==='light')return false;
      return !!(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    /* [引擎变量名, 宿主候选变量, 回退键] */
    var THEME_VAR_MAP=[
      ['--ce-bg',['--surface','--bg2'],'bg'],
      ['--ce-bg2',['--surface-secondary','--bg3'],'bg2'],
      ['--ce-bg3',['--surface-hover'],'bg3'],
      ['--ce-text',['--text-primary','--text'],'text'],
      ['--ce-text2',['--text-secondary','--text2'],'text2'],
      ['--ce-text3',['--text-muted','--text3'],'text3'],
      ['--ce-border',['--divider','--border'],'border'],
      ['--ce-border-md',['--border-md'],'borderMd'],
      ['--ce-accent',['--accent'],'accent'],
      ['--ce-accent-soft',['--accent-soft','--accent-light'],'accentSoft'],
      ['--ce-third',['--chord-third'],'third'],
      ['--ce-ext',['--chord-tension'],'ext']
    ];
    /**
     * 把宿主主题变量同步到元素（内联 --ce-*），主题切换/打开面板时调用。
     * @param {HTMLElement} host 目标元素（通常是 <chord-explorer>）
     */
    function syncThemeVars(host){
      var src=document.getElementById('music-library')||document.body;
      var cs=src?getComputedStyle(src):null;
      var fb=isDarkTheme()?FALLBACK_DARK:FALLBACK_LIGHT;
      for(var i=0;i<THEME_VAR_MAP.length;i++){
        var row=THEME_VAR_MAP[i],val='';
        for(var j=0;j<row[1].length&&!val;j++){
          if(cs)val=cs.getPropertyValue(row[1][j]).trim();
        }
        host.style.setProperty(row[0],val||fb[row[2]]);
      }
    }
    /** 组件内读取绘图色：优先 --ce-* 变量（含继承），否则按明暗回退。 */
    function paintColors(el){
      var cs=getComputedStyle(el);
      var fb=isDarkTheme()?FALLBACK_DARK:FALLBACK_LIGHT;
      function v(name,fbKey){var x=cs.getPropertyValue(name).trim();return x||fb[fbKey];}
      return {
        bg:v('--ce-bg','bg'),bg2:v('--ce-bg2','bg2'),
        text:v('--ce-text','text'),text2:v('--ce-text2','text2'),text3:v('--ce-text3','text3'),
        border:v('--ce-border','border'),borderMd:v('--ce-border-md','borderMd'),
        root:v('--ce-accent','accent'),third:v('--ce-third','third'),ext:v('--ce-ext','ext'),
        keyWhite:fb.keyWhite,keyWhiteEdge:fb.keyWhiteEdge,keyBlack:fb.keyBlack
      };
    }
    function roleColor(colors,role){
      return role==='root'?colors.root:(role==='third'?colors.third:colors.ext);
    }
    /** Canvas 通用：按容器宽度与 DPR 设定物理尺寸，返回 2D 上下文。 */
    function setupCanvas(canvas,cssW,cssH){
      var dpr=window.devicePixelRatio||1;
      canvas.width=Math.max(1,Math.round(cssW*dpr));
      canvas.height=Math.max(1,Math.round(cssH*dpr));
      canvas.style.width=cssW+'px';
      canvas.style.height=cssH+'px';
      var ctx=canvas.getContext('2d');
      ctx.setTransform(dpr,0,0,dpr,0,0);
      return ctx;
    }
    function roundRect(ctx,x,y,w,h,r){
      var rr=Math.min(r,w/2,h/2);
      ctx.beginPath();
      ctx.moveTo(x+rr,y);
      ctx.arcTo(x+w,y,x+w,y+h,rr);
      ctx.arcTo(x+w,y+h,x,y+h,rr);
      ctx.arcTo(x,y+h,x,y,rr);
      ctx.arcTo(x,y,x+w,y,rr);
      ctx.closePath();
    }
    /** 宿主主题切换（html[data-resolved-theme] 变化）时重绘：组件独立使用时也能跟随主题。 */
    function observeTheme(el,redraw){
      if(typeof MutationObserver==='undefined')return null;
      var mo=new MutationObserver(redraw);
      mo.observe(document.documentElement,{attributes:true,attributeFilter:['data-resolved-theme','data-theme']});
      return mo;
    }

    var WHITE_PCS=[0,2,4,5,7,9,11];

    /* ────────────── <chord-piano>：Canvas 手绘钢琴键盘 ────────────── */
    /**
     * 钢琴键盘组件。用法：
     *   el.definition = ChordEngine.parseChord('G#m')   （或 setAttribute('chord','G#m')）
     *   el.flash(midis) 播放时按下反馈
     * 自动定位到覆盖和弦音的音区（含低音，至少两个完整八度）。
     */
    class ChordPianoEl extends HTMLElement{
      static get observedAttributes(){return ['chord'];}
      constructor(){
        super();
        this._def=null;
        this._pressed={};
        this._shadow=this.attachShadow({mode:'open'});
        this._shadow.innerHTML='<style>:host{display:block}canvas{display:block;width:100%}</style><canvas aria-hidden="true"></canvas>';
        this._canvas=this._shadow.querySelector('canvas');
        this._onResize=this._draw.bind(this);
      }
      connectedCallback(){
        if(typeof ResizeObserver!=='undefined'){
          this._ro=new ResizeObserver(this._onResize);
          this._ro.observe(this);
        }else{
          window.addEventListener('resize',this._onResize);
        }
        this._mo=observeTheme(this,this._onResize);
        this._draw();
      }
      disconnectedCallback(){
        if(this._ro){this._ro.disconnect();this._ro=null;}
        if(this._mo){this._mo.disconnect();this._mo=null;}
        window.removeEventListener('resize',this._onResize);
      }
      attributeChangedCallback(name,ov,nv){
        if(name==='chord')this.definition=parseChord(nv);
      }
      set definition(def){this._def=def;this._draw();}
      get definition(){return this._def;}
      /** 播放反馈：这批琴键短暂点亮。@param {number[]} midis */
      flash(midis){
        var self=this;
        for(var i=0;i<midis.length;i++)this._pressed[midis[i]]=1;
        this._draw();
        setTimeout(function(){self._pressed={};self._draw();},FLASH_MS);
      }
      /** 键盘音区窗口：整八度对齐，覆盖所有和弦音，至少两个八度。 */
      _window(){
        var midis=this._def?this._def.pianoMidis:[60,64,67];
        var lo=Math.min.apply(null,midis),hi=Math.max.apply(null,midis);
        var start=Math.floor(lo/12)*12;
        var end=Math.ceil((hi+1)/12)*12-1;
        while(end-start<23)end+=12;
        return {start:start,end:end};
      }
      _draw(){
        if(!this.isConnected)return;
        var w=this.clientWidth;
        if(w<40)return;
        var def=this._def,win=this._window();
        var colors=paintColors(this);
        /* 音名标注：pc -> {name,role} */
        var pcInfo={};
        if(def){
          for(var n=def.notes.length-1;n>=0;n--)pcInfo[def.notes[n].pc]={name:def.notes[n].name,role:def.notes[n].role};
          if(def.bassNote&&!pcInfo[def.bassNote.pc])pcInfo[def.bassNote.pc]={name:def.bassNote.name,role:'root'};
        }
        var inChord={};
        if(def)for(var q=0;q<def.pianoMidis.length;q++)inChord[def.pianoMidis[q]]=1;
        var whites=[];
        for(var m=win.start;m<=win.end;m++){
          if(WHITE_PCS.indexOf(m%12)>=0)whites.push(m);
        }
        var keyW=w/whites.length;
        var h=Math.max(96,Math.min(190,keyW*6.2));
        var ctx=setupCanvas(this._canvas,w,h);
        ctx.clearRect(0,0,w,h);
        /* 白键 */
        var xOf={};
        for(var i=0;i<whites.length;i++){
          var mw=whites[i],x=i*keyW;
          xOf[mw]=x;
          ctx.fillStyle=colors.keyWhite;
          roundRect(ctx,x+0.75,0,keyW-1.5,h,3);
          ctx.fill();
          ctx.strokeStyle=colors.keyWhiteEdge;
          ctx.lineWidth=1;
          ctx.stroke();
          if(inChord[mw]){
            var info=pcInfo[mw%12]||{};
            var c=roleColor(colors,this._pressed[mw]?'root':info.role||'ext');
            ctx.globalAlpha=this._pressed[mw]?0.34:0.16;
            ctx.fillStyle=roleColor(colors,info.role||'ext');
            roundRect(ctx,x+0.75,0,keyW-1.5,h,3);
            ctx.fill();
            ctx.globalAlpha=1;
            /* 键底音名药丸 */
            var r=Math.min(keyW*0.36,12);
            ctx.fillStyle=roleColor(colors,info.role||'ext');
            ctx.beginPath();
            ctx.arc(x+keyW/2,h-r-7,r,0,Math.PI*2);
            ctx.fill();
            ctx.fillStyle='#FFFFFF';
            ctx.font='600 '+Math.max(8,Math.min(11,r))+'px system-ui,sans-serif';
            ctx.textAlign='center';ctx.textBaseline='middle';
            ctx.fillText((pcInfo[mw%12]||{}).name||'',x+keyW/2,h-r-6.5);
          }
        }
        /* 黑键 */
        var bw=keyW*0.62,bh=h*0.62;
        for(var mb=win.start;mb<=win.end;mb++){
          if(WHITE_PCS.indexOf(mb%12)>=0)continue;
          var prevWhite=mb-1;
          if(xOf[prevWhite]===undefined)continue;
          var bx=xOf[prevWhite]+keyW-bw/2;
          ctx.fillStyle=colors.keyBlack;
          roundRect(ctx,bx,0,bw,bh,2.5);
          ctx.fill();
          if(inChord[mb]){
            var infoB=pcInfo[mb%12]||{};
            ctx.globalAlpha=this._pressed[mb]?0.55:0.35;
            ctx.fillStyle=roleColor(colors,infoB.role||'ext');
            roundRect(ctx,bx,0,bw,bh,2.5);
            ctx.fill();
            ctx.globalAlpha=1;
            var rb=Math.min(bw*0.44,10);
            ctx.fillStyle=roleColor(colors,infoB.role||'ext');
            ctx.beginPath();
            ctx.arc(bx+bw/2,bh-rb-5,rb,0,Math.PI*2);
            ctx.fill();
            ctx.fillStyle='#FFFFFF';
            ctx.font='600 '+Math.max(7,Math.min(10,rb))+'px system-ui,sans-serif';
            ctx.textAlign='center';ctx.textBaseline='middle';
            ctx.fillText(infoB.name||'',bx+bw/2,bh-rb-4.5);
          }
        }
      }
    }
    if(!customElements.get('chord-piano'))customElements.define('chord-piano',ChordPianoEl);

    /* ────────────── <chord-guitar-diagram>：Canvas 手绘吉他指法图 ────────────── */
    /**
     * 吉他指法图组件。用法：
     *   el.setPosition(position)  （position 来自 getChord(...).guitar[i]）
     *   el.flashStrings(delays)   扫弦时逐弦点亮
     * 支持：按弦圆点(内含指法编号)、闷音 x、空弦 o、横按整条、根音标记、起始品位号。
     */
    class ChordGuitarEl extends HTMLElement{
      constructor(){
        super();
        this._pos=null;
        this._lit={};
        this._shadow=this.attachShadow({mode:'open'});
        this._shadow.innerHTML='<style>:host{display:block}canvas{display:block;width:100%}</style><canvas aria-hidden="true"></canvas>';
        this._canvas=this._shadow.querySelector('canvas');
        this._onResize=this._draw.bind(this);
      }
      connectedCallback(){
        if(typeof ResizeObserver!=='undefined'){
          this._ro=new ResizeObserver(this._onResize);
          this._ro.observe(this);
        }else{
          window.addEventListener('resize',this._onResize);
        }
        this._mo=observeTheme(this,this._onResize);
        this._draw();
      }
      disconnectedCallback(){
        if(this._ro){this._ro.disconnect();this._ro=null;}
        if(this._mo){this._mo.disconnect();this._mo=null;}
        window.removeEventListener('resize',this._onResize);
      }
      /** @param {Object} pos guitarPositionsFor 产出的把位对象 */
      setPosition(pos){this._pos=pos;this._draw();}
      /** 扫弦反馈：delays[i] 为第 i 根发声弦的延时（ms）。 */
      flashStrings(delays){
        var self=this,order=[];
        if(!this._pos)return;
        for(var i=0;i<6;i++)if(this._pos.frets[i]>=0)order.push(i);
        for(var k=0;k<order.length;k++){
          (function(stringIdx,delay){
            setTimeout(function(){
              self._lit[stringIdx]=1;self._draw();
              setTimeout(function(){delete self._lit[stringIdx];self._draw();},FLASH_MS);
            },delay);
          })(order[k],delays[k]||0);
        }
      }
      _draw(){
        if(!this.isConnected||!this._pos)return;
        var w=this.clientWidth;
        if(w<40)return;
        var pos=this._pos,colors=paintColors(this);
        var base=pos.baseFret;
        var maxRel=0;
        for(var i=0;i<6;i++)if(pos.frets[i]>0)maxRel=Math.max(maxRel,pos.frets[i]-base+1);
        var nFrets=Math.max(4,maxRel);
        /* 起始品位号需要的左侧留白：两位数品号（10 品以上）更宽，避免被画布裁切 */
        var padL=base>1?(base>=10?36:26):14,padR=10,padT=26,padB=12;
        var gridW=w-padL-padR;
        var fretH=Math.min(34,Math.max(22,gridW/4));
        var h=padT+fretH*nFrets+padB;
        var ctx=setupCanvas(this._canvas,w,h);
        ctx.clearRect(0,0,w,h);
        var sx=function(s){return padL+gridW*s/5;};
        var fy=function(f){return padT+fretH*f;};
        /* 品丝与弦 */
        ctx.strokeStyle=colors.border;
        ctx.lineWidth=1;
        for(var f=1;f<=nFrets;f++){
          ctx.beginPath();ctx.moveTo(sx(0),fy(f));ctx.lineTo(sx(5),fy(f));ctx.stroke();
        }
        for(var s=0;s<6;s++){
          ctx.strokeStyle=this._lit[s]?colors.root:colors.borderMd;
          ctx.lineWidth=this._lit[s]?2:1;
          ctx.beginPath();ctx.moveTo(sx(s),fy(0));ctx.lineTo(sx(s),fy(nFrets));ctx.stroke();
        }
        /* 琴枕（1 把位）或起始品位号 */
        if(base<=1){
          ctx.strokeStyle=colors.text;
          ctx.lineWidth=3;
          ctx.beginPath();ctx.moveTo(sx(0)-1,fy(0));ctx.lineTo(sx(5)+1,fy(0));ctx.stroke();
        }else{
          ctx.strokeStyle=colors.text2;
          ctx.lineWidth=1.5;
          ctx.beginPath();ctx.moveTo(sx(0),fy(0));ctx.lineTo(sx(5),fy(0));ctx.stroke();
          ctx.fillStyle=colors.text2;
          ctx.font='600 11px system-ui,sans-serif';
          ctx.textAlign='right';ctx.textBaseline='middle';
          ctx.fillText(base+'品',padL-7,fy(0)+fretH/2);
        }
        /* 横按 */
        if(pos.barre){
          var bf=pos.barre.fret-base;
          if(bf>=0&&bf<nFrets){
            var by=fy(bf)+fretH/2;
            ctx.fillStyle=colors.text;
            ctx.globalAlpha=0.9;
            roundRect(ctx,sx(pos.barre.from)-7,by-6.5,sx(pos.barre.to)-sx(pos.barre.from)+14,13,6.5);
            ctx.fill();
            ctx.globalAlpha=1;
          }
        }
        /* 按弦点 / 空弦 / 闷音 */
        var dotR=Math.min(fretH*0.34,gridW/5*0.42);
        for(var st=0;st<6;st++){
          var fr=pos.frets[st];
          var topY=fy(0)-11;
          if(fr<0){
            /* 闷音 x */
            ctx.strokeStyle=colors.text3;
            ctx.lineWidth=1.6;
            ctx.beginPath();
            ctx.moveTo(sx(st)-4,topY-4);ctx.lineTo(sx(st)+4,topY+4);
            ctx.moveTo(sx(st)+4,topY-4);ctx.lineTo(sx(st)-4,topY+4);
            ctx.stroke();
            continue;
          }
          var isRoot=((GUITAR_STRING_PC[st]+fr)%12)===pos.rootPc;
          if(fr===0){
            /* 空弦 o；根音空弦用强调色 */
            ctx.strokeStyle=isRoot?colors.root:colors.text2;
            ctx.lineWidth=isRoot?2:1.6;
            ctx.beginPath();ctx.arc(sx(st),topY,4.5,0,Math.PI*2);ctx.stroke();
            continue;
          }
          var relF=fr-base;
          if(relF<0||relF>=nFrets)continue;
          var cy=fy(relF)+fretH/2;
          /* 横按覆盖到的音若与横按同品且无更高指编号，仅靠横按条表达，不再叠点 */
          var onBarre=pos.barre&&pos.barre.fret===fr&&st>=pos.barre.from&&st<=pos.barre.to&&pos.fingers[st]<=1;
          if(onBarre&&!isRoot)continue;
          ctx.fillStyle=isRoot?colors.root:colors.text;
          ctx.beginPath();ctx.arc(sx(st),cy,dotR,0,Math.PI*2);ctx.fill();
          if(this._lit[st]){
            ctx.strokeStyle=colors.root;
            ctx.lineWidth=2;
            ctx.beginPath();ctx.arc(sx(st),cy,dotR+2.5,0,Math.PI*2);ctx.stroke();
          }
          if(pos.fingers[st]>0){
            /* 指法数字与圆点填充色反色：根音点(强调色)配白字；
               普通点填充为 text 色，深色模式下是浅色，数字用 bg 色才可读 */
            ctx.fillStyle=isRoot?'#FFFFFF':colors.bg;
            ctx.font='600 '+Math.max(8,dotR)+'px system-ui,sans-serif';
            ctx.textAlign='center';ctx.textBaseline='middle';
            ctx.fillText(String(pos.fingers[st]),sx(st),cy+0.5);
          }
        }
      }
    }
    if(!customElements.get('chord-guitar-diagram'))customElements.define('chord-guitar-diagram',ChordGuitarEl);

    /* ────────────── <chord-explorer>：底部弹出主面板 ────────────── */
    var EXPLORER_CSS=
      ':host{position:fixed;inset:0;z-index:2147482000;display:block;pointer-events:none;'+
        'font-family:Inter,"Noto Sans SC",-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",system-ui,sans-serif}'+
      '.backdrop{position:absolute;inset:0;background:rgba(18,13,9,.42);opacity:0;transition:opacity .22s ease;pointer-events:none}'+
      '.sheet{position:absolute;left:50%;bottom:0;transform:translate(-50%,103%);width:min(720px,100%);'+
        'max-height:min(86dvh,860px);box-sizing:border-box;overflow-y:auto;overscroll-behavior:contain;'+
        'background:var(--ce-bg);color:var(--ce-text);border:1px solid var(--ce-border-md);border-bottom:none;'+
        'border-radius:18px 18px 0 0;box-shadow:0 -18px 60px rgba(0,0,0,.22);'+
        'padding:10px 20px calc(22px + env(safe-area-inset-bottom,0px));'+
        'transition:transform .24s cubic-bezier(.32,.72,.28,1);pointer-events:none}'+
      ':host(.open) .backdrop{opacity:1;pointer-events:auto}'+
      ':host(.open) .sheet{transform:translate(-50%,0);pointer-events:auto}'+
      '.grab{width:38px;height:4px;border-radius:2px;background:var(--ce-border-md);margin:2px auto 12px}'+
      '.head{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;padding-right:38px}'+
      '.name{font-size:30px;font-weight:700;line-height:1.1}'+
      '.qual{font-size:13px;color:var(--ce-text2)}'+
      '.close{position:absolute;top:14px;right:14px;width:30px;height:30px;border-radius:50%;'+
        'border:1px solid var(--ce-border);background:var(--ce-bg2);color:var(--ce-text2);'+
        'font-size:15px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center}'+
      '.close:hover{background:var(--ce-bg3)}'+
      '.tones{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 4px}'+
      '.tone{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:44px;padding:7px 10px;'+
        'border-radius:10px;border:1px solid var(--ce-border);background:var(--ce-bg2)}'+
      '.tone b{font-size:16px;font-weight:700}'+
      '.tone i{font-style:normal;font-size:10.5px;color:var(--ce-text3)}'+
      '.tone.root b{color:var(--ce-accent)}.tone.third b{color:var(--ce-third)}.tone.ext b{color:var(--ce-ext)}'+
      '.bassnote{font-size:12px;color:var(--ce-text2);margin:6px 0 0}'+
      '.sec{margin-top:20px}'+
      '.sec-h{display:flex;align-items:center;gap:10px;margin-bottom:10px}'+
      '.sec-t{font-size:12px;font-weight:600;letter-spacing:.08em;color:var(--ce-text3)}'+
      '.play{width:30px;height:30px;border-radius:50%;border:1px solid var(--ce-border-md);cursor:pointer;'+
        'background:var(--ce-accent-soft);color:var(--ce-accent);display:flex;align-items:center;justify-content:center;'+
        'transition:transform .12s ease}'+
      '.play:active{transform:scale(.9)}'+
      '.play svg{width:12px;height:12px;fill:currentColor}'+
      '.piano-card,.gcard{border:1px solid var(--ce-border);border-radius:14px;background:var(--ce-bg2);padding:12px}'+
      '.gwrap{display:flex;gap:12px;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch}'+
      '.gcard{flex:0 0 150px;display:flex;flex-direction:column;gap:6px}'+
      '.gmeta{display:flex;align-items:center;justify-content:space-between;gap:6px}'+
      '.glabel{font-size:11.5px;color:var(--ce-text2);font-weight:600}'+
      '.gempty{font-size:12.5px;color:var(--ce-text3);padding:6px 2px}'+
      '@media (max-width:480px){.name{font-size:26px}.gcard{flex-basis:138px}}';
    var PLAY_SVG='<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 1.6c0-.5.55-.8.98-.55l7.02 4.4c.4.25.4.85 0 1.1l-7.02 4.4a.65.65 0 0 1-.98-.55z"/></svg>';

    /**
     * 和弦浏览器主组件（Bottom Sheet）。
     * 对外：el.open('G#m') / el.close() / setAttribute('chord','G#m')；
     * 打开/关闭时派发 'chord-open' / 'chord-close' CustomEvent（detail 为符号）。
     * 内部用极简 Store 管理当前 ChordDefinition，子组件订阅式刷新。
     */
    class ChordExplorerEl extends HTMLElement{
      static get observedAttributes(){return ['chord'];}
      constructor(){
        super();
        var self=this;
        this._store=createStore({entry:null,visible:false});
        this._shadow=this.attachShadow({mode:'open'});
        this._shadow.innerHTML=
          '<style>'+EXPLORER_CSS+'</style>'+
          '<div class="backdrop" part="backdrop"></div>'+
          '<div class="sheet" role="dialog" aria-modal="true" aria-label="和弦浏览器">'+
            '<div class="grab"></div>'+
            '<button class="close" aria-label="关闭">✕</button>'+
            '<div class="head"><span class="name"></span><span class="qual"></span></div>'+
            '<div class="tones"></div>'+
            '<div class="bassnote" hidden></div>'+
            '<div class="sec"><div class="sec-h"><span class="sec-t">钢琴</span>'+
              '<button class="play piano-play" aria-label="钢琴试听">'+PLAY_SVG+'</button></div>'+
              '<div class="piano-card"><chord-piano></chord-piano></div></div>'+
            '<div class="sec"><div class="sec-h"><span class="sec-t">吉他把位</span></div>'+
              '<div class="gwrap"></div><div class="gempty" hidden>该和弦性质的吉他把位暂未收录，可参考上方钢琴组成音。</div></div>'+
          '</div>';
        this._els={
          backdrop:this._shadow.querySelector('.backdrop'),
          sheet:this._shadow.querySelector('.sheet'),
          name:this._shadow.querySelector('.name'),
          qual:this._shadow.querySelector('.qual'),
          tones:this._shadow.querySelector('.tones'),
          bass:this._shadow.querySelector('.bassnote'),
          piano:this._shadow.querySelector('chord-piano'),
          pianoPlay:this._shadow.querySelector('.piano-play'),
          gwrap:this._shadow.querySelector('.gwrap'),
          gempty:this._shadow.querySelector('.gempty'),
          close:this._shadow.querySelector('.close')
        };
        this._els.backdrop.addEventListener('click',function(){self.close();});
        this._els.close.addEventListener('click',function(){self.close();});
        this._onKey=function(e){if(e.key==='Escape')self.close();};
        this._els.pianoPlay.addEventListener('click',function(){
          var st=self._store.getState();
          if(!st.entry)return;
          if(AudioEngine.playChord(st.entry.def.pianoMidis))self._els.piano.flash(st.entry.def.pianoMidis);
        });
        this._unsub=this._store.subscribe(this._render.bind(this));
        /* 宿主主题切换时同步变量并重绘 */
        if(typeof MutationObserver!=='undefined'){
          this._themeMo=new MutationObserver(function(){
            syncThemeVars(self);
            if(self._store.getState().visible)self._render(self._store.getState());
          });
          this._themeMo.observe(document.documentElement,{attributes:true,attributeFilter:['data-resolved-theme','data-theme']});
        }
      }
      attributeChangedCallback(name,ov,nv){
        if(name==='chord'&&nv)this.open(nv);
      }
      /**
       * 打开面板展示某和弦。
       * @param {string} symbol 和弦符号（可以带排版占位字符，内部会清洗）
       * @returns {boolean} 解析失败返回 false 且不打开
       */
      open(symbol){
        var entry=getChord(symbol);
        if(!entry)return false;
        syncThemeVars(this);
        this._store.setState({entry:entry,visible:true});
        document.addEventListener('keydown',this._onKey);
        this.dispatchEvent(new CustomEvent('chord-open',{detail:entry.def.symbol}));
        return true;
      }
      /** 关闭面板。 */
      close(){
        if(!this._store.getState().visible)return;
        this._store.setState({visible:false});
        document.removeEventListener('keydown',this._onKey);
        this.dispatchEvent(new CustomEvent('chord-close',{detail:null}));
      }
      _render(state){
        var els=this._els,self=this;
        this.classList.toggle('open',!!state.visible);
        if(!state.entry)return;
        var def=state.entry.def,positions=state.entry.guitar;
        els.name.textContent=def.root+def.quality.id+(def.bass?'/'+def.bass:'');
        els.qual.textContent=def.quality.zh+' · '+def.quality.name;
        /* 组成音 */
        els.tones.innerHTML='';
        for(var i=0;i<def.notes.length;i++){
          var n=def.notes[i];
          var chip=document.createElement('span');
          chip.className='tone '+n.role;
          chip.innerHTML='<b></b><i></i>';
          chip.querySelector('b').textContent=n.name;
          chip.querySelector('i').textContent=n.degree==='R'?'根音':n.degree;
          els.tones.appendChild(chip);
        }
        if(def.bassNote){
          els.bass.hidden=false;
          els.bass.textContent='斜杠和弦：低音 '+def.bassNote.name+' 由左手 / 贝斯演奏，右手按上方组成音。';
        }else{
          els.bass.hidden=true;
        }
        /* 钢琴 */
        els.piano.definition=def;
        /* 吉他把位 */
        els.gwrap.innerHTML='';
        els.gempty.hidden=positions.length>0;
        for(var p=0;p<positions.length;p++){
          (function(pos){
            var card=document.createElement('div');
            card.className='gcard';
            var diagram=document.createElement('chord-guitar-diagram');
            var meta=document.createElement('div');
            meta.className='gmeta';
            var label=document.createElement('span');
            label.className='glabel';
            var labelParts=[pos.label,pos.baseFret>1?pos.baseFret+'品':''].filter(Boolean);
            label.textContent=labelParts.join(' · ')||'开放把位';
            var btn=document.createElement('button');
            btn.className='play';
            btn.setAttribute('aria-label','吉他试听 '+pos.label);
            btn.innerHTML=PLAY_SVG;
            btn.addEventListener('click',function(){
              var delays=AudioEngine.strumGuitar(pos.midis);
              if(delays.length)diagram.flashStrings(delays);
            });
            meta.appendChild(label);
            meta.appendChild(btn);
            card.appendChild(diagram);
            card.appendChild(meta);
            els.gwrap.appendChild(card);
            diagram.setPosition(pos);
          })(positions[p]);
        }
      }
    }
    if(!customElements.get('chord-explorer'))customElements.define('chord-explorer',ChordExplorerEl);

    /* ────────────── 宿主歌词页集成 ──────────────
       约束（见阶段 7）：不改动 .p-chord 的创建/渲染逻辑；
       在稳定祖先上用事件委托（切调重渲染后监听依然有效）；
       读取节点当前 textContent（已移调文本），保证与用户所见一致。 */
    var explorerInstance=null;
    /** 懒创建全局唯一 <chord-explorer> 实例。 */
    function ensureExplorer(){
      if(explorerInstance&&explorerInstance.isConnected)return explorerInstance;
      explorerInstance=document.createElement('chord-explorer');
      (document.body||document.documentElement).appendChild(explorerInstance);
      return explorerInstance;
    }
    API.open=function(symbol){return ensureExplorer().open(symbol);};
    API.close=function(){if(explorerInstance)explorerInstance.close();};

    function setupHostIntegration(){
      if(window.__CECP_CHORD_ENGINE_WIRED__)return;
      window.__CECP_CHORD_ENGINE_WIRED__=true;
      /* 可点击视觉反馈：不改变布局尺寸 */
      var style=document.createElement('style');
      style.id='cecp-chord-engine-style';
      style.textContent=
        '.p-chord:not(.empty){cursor:pointer;-webkit-tap-highlight-color:transparent;transition:opacity .12s ease}'+
        '.p-chord:not(.empty):hover{opacity:.72}'+
        '.p-chord:not(.empty):active{opacity:.5}';
      (document.head||document.documentElement).appendChild(style);
      /* 事件委托挂在 document 上（#music-library 在两个宿主中都存在，
         但挂 document 同样稳定且不依赖挂载时序），命中后按当前文本打开。 */
      document.addEventListener('click',function(e){
        var target=e.target;
        if(!target||!target.closest)return;
        var el=target.closest('.p-chord');
        if(!el||el.classList.contains('empty'))return;
        /* 用户正在选择文本时不打断 */
        var sel=window.getSelection&&window.getSelection();
        if(sel&&String(sel).length)return;
        var text=cleanChordText(el.textContent);
        if(!text)return;
        var entry=getChord(text);
        if(!entry)return; /* 非和弦文本静默忽略 */
        ensureExplorer().open(text);
      });
    }
    if(document.readyState==='loading'){
      document.addEventListener('DOMContentLoaded',setupHostIntegration);
    }else{
      setupHostIntegration();
    }
  }

  return API;
})();
if(typeof window!=='undefined'){window.ChordEngine=ChordEngine;}
/* ═══════════ CECP-CHORD-ENGINE v1 END ═══════════ */
  /* 合法和弦 token 判定（同 CECP-CHORD-STYLE chordStylePitchClass 的思路）：
     根音 A-G 须在 token 开头（允许前置括号），可跟 #/b，
     其后若为小写字母则首字母限 m/s/a/d ——
     排除写在 chord 字段里的 "Fine"/"To Chorus" 等段落标记。 */
  function isChordLikeToken(token){
    var s=String(token||'').trim();
    var i=0;
    while(i<s.length&&s.charAt(i)==='(')i++;
    var ch=s.charAt(i);
    if(ch<'A'||ch>'G')return false;
    var j=i+1;
    var nx=s.charAt(j);
    if(nx==='#'||nx==='b')j++;
    var after=s.charAt(j);
    if(after>='a'&&after<='z'&&'msad'.indexOf(after)<0)return false;
    return true;
  }
  function trChordToken(token,st,useFlat){
    var raw=String(token||'');
    if(!isChordLikeToken(raw))return raw;
    var m=raw.match(/^([A-G](?:#|b)?)([^A-G]*)(.*)$/);
    if(m&&m[1]&&!m[3]){
      var rest=m[2]||'';
      rest=rest.replace(/\/\s*([A-G](?:#|b)?)/g,function(_,bass){return '/'+trBass(bass,st,useFlat);});
      return trKeyName(m[1],st,useFlat)+rest;
    }
    return raw.replace(/(^|[^A-Za-z#b])([A-G](?:#|b)?)(maj|min|dim|aug|sus|add|m(?!aj)|[0-9+\-#b°øº⁰¹²³⁴⁵⁶⁷⁸⁹]*)(\/\s*([A-G](?:#|b)?))?(?=$|[^A-Za-z#b])/g,function(_,lead,root,suf,bassPart,bassRoot){
      var out=trKeyName(root,st,useFlat)+(suf||'');
      if(bassPart)out+='/'+trBass(bassRoot,st,useFlat);
      return lead+out;
    });
  }
  function resizeChordGap(gap,len){
    var chars=[...String(gap||'')].map(function(ch){return ch==='\u3164'?'\u3000':ch;});
    if(!chars.length||len<=0)return '';
    var out='';
    for(var i=0;i<len;i++)out+=chars[i%chars.length];
    return out;
  }
  function trChord(c,st,useFlat){
    if(!c)return c;
    var parts=String(c).split(/([ \t\u3164]+)/),out='';
    for(var i=0;i<parts.length;i++){
      var part=parts[i];
      if(!/[^\s\u3164]/.test(part)){out+=part;continue;}
      var tr=trChordToken(part,st,useFlat);
      out+=tr;
      if(i+1<parts.length&&/[ \t\u3164]+/.test(parts[i+1])){
        var gap=parts[i+1];
        var nextLen=Math.max(0,[...gap].length + ([...part].length - [...tr].length));
        if(nextLen===0 && i+2<parts.length && /[^\s\u3164]/.test(parts[i+2]))nextLen=1;
        out+=resizeChordGap(gap,nextLen);
        i++;
      }
    }
    return out;
  }
  function calcCapo(t,o){
    var target=parseKeyName(t),orig=parseKeyName(o);
    var ti=nIdx(target.root),oi=nIdx(orig.root);
    if(ti<0||oi<0)return{st:0,capo:0,playKey:t};
    var st=(ti-oi+12)%12,best=null;
    ['C','D','E','F','G','A','B'].forEach(function(pk){
      var c=(nIdx(target.root)-nIdx(pk)+12)%12;
      if(c<=7&&(!best||c<best.capo))best={playKey:pk+target.suf,capo:c};
    });
    return{st:st,capo:best?best.capo:0,playKey:best?best.playKey:t};
  }
  function stepKeyName(key,delta,useFlat){
    var parsed=parseKeyName(key),i=nIdx(parsed.root);
    if(i<0)return key;
    var roots=useFlat?['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']:CHR;
    return roots[(i+delta+120)%12]+parsed.suf;
  }
  function enharmonicKeyName(key,useFlat){
    var parsed=parseKeyName(key);
    var root=useFlat?(ENHARMONIC_FLAT[parsed.root]||parsed.root):(ENHARMONIC_SHARP[parsed.root]||parsed.root);
    return root+parsed.suf;
  }

  /* ══════════════ Song card ══════════════ */
  function buildSongCard(song) {
    var wrap = el('div', {class:'sw-wrap ym-reveal', id:'song-'+song.id});
    var curKey = song.origKey||'C';
    var preferFlat = !!FLAT_KEYS[parseKeyName(curKey).root];

    /* header */
    var kPill = el('span',{class:'sw-pill sw-kpill',text:'1 = '+curKey});
    wrap.innerHTML = '';
    var hd = div('sw-hd',[
      el('div',{},[
        el('div',{class:'sw-eyebrow',text:'Worship Song'}),
        el('div',{class:'sw-title',text:song.title}),
        el('div',{class:'sw-sub',text:song.sub||''}),
        el('div',{class:'sw-pills'},[
          kPill,
          el('span',{class:'sw-pill',text:song.timeSign||'4/4'}),
          el('span',{class:'sw-pill',text:'♩ = '+(song.bpm||80)}),
        ]),
      ]),
      el('button',{class:'sw-tog'},[
        el('svg',{viewBox:'0 0 24 24',html:'<polyline points="6 9 12 15 18 9"></polyline>'}),
        document.createTextNode(' 移调'),
      ]),
    ]);
    wrap.appendChild(hd);

    /* toggle button */
    var togBtn = hd.querySelector('.sw-tog');
    var fitRaf=0;
    function getViewportBox(){
      var vv=window.visualViewport;
      return vv ? {
        width:vv.width||window.innerWidth||document.documentElement.clientWidth||0,
        height:vv.height||window.innerHeight||document.documentElement.clientHeight||0,
        offsetTop:vv.offsetTop||0
      } : {
        width:window.innerWidth||document.documentElement.clientWidth||0,
        height:window.innerHeight||document.documentElement.clientHeight||0,
        offsetTop:0
      };
    }
    function shouldUseScreenHeightFit(){
      var coarse=window.matchMedia?window.matchMedia('(pointer: coarse)').matches:false;
      var noHover=window.matchMedia?window.matchMedia('(hover: none)').matches:false;
      var touchPoints=navigator.maxTouchPoints||0;
      return coarse||(noHover&&touchPoints>0);
    }
    function getAvailableScoreHeight(){
      var viewport=getViewportBox();
      var chromeHeight=Math.max(0,panelInner.scrollHeight-lbDiv.scrollHeight);
      return Math.max(0,viewport.height-chromeHeight);
    }
    function resetScoreFit(){
      lbDiv.style.transform='';
      lbDiv.style.transformOrigin='';
      lbDiv.style.width='';
      lbDiv.style.marginBottom='';
      lbDiv.style.padding='8px 18px 16px 8px';
      lbDiv.style.boxSizing='border-box';
      if(lbDiv.parentElement)lbDiv.parentElement.style.overflow='hidden';
    }
    function normalizePreviewRowHeights(){
      lbDiv.querySelectorAll('.prev-row').forEach(function(row){
        row.style.setProperty('--row-note-height','0px');
        var maxH=0;
        row.querySelectorAll('.p-n').forEach(function(noteLane){
          maxH=Math.max(maxH,Math.ceil(noteLane.getBoundingClientRect().height||0));
        });
        if(maxH)row.style.setProperty('--row-note-height',maxH+'px');
      });
    }
    function measureNaturalScore(){
      var maxW=0;
      lbDiv.querySelectorAll('.sw-lrow').forEach(function(row){
        var prevDisplay=row.style.display;
        row.style.display='inline-flex';
        if(row.scrollWidth>maxW)maxW=row.scrollWidth;
        row.style.display=prevDisplay;
      });
      if(!maxW)return null;
      var naturalWidth=maxW+24;
      lbDiv.style.width=naturalWidth+'px';
      var naturalHeight=lbDiv.scrollHeight;
      if(!naturalHeight)return null;
      return { width:naturalWidth,height:naturalHeight };
    }
    function scheduleFitRows(){
      cancelAnimationFrame(fitRaf);
      fitRaf=requestAnimationFrame(function(){
        fitRaf=0;
        fitRows();
      });
    }

    togBtn.addEventListener('click', function(){
      panel.classList.toggle('open');
      togBtn.classList.toggle('on', panel.classList.contains('open'));
      scheduleFitRows();
    });

    /* transpose panel */
    var kg     = div('sw-kg');
    var quickKeys = div('sw-kg sw-key-actions');
    var capoEl = div('sw-capo plain',[
      el('div',{style:'font-size:15px;flex-shrink:0',text:'🎸'}),
      el('div',{style:'flex:1'},[
        el('div',{class:'sw-capo-t'}),
        el('div',{class:'sw-capo-s'}),
      ]),
      el('div',{class:'sw-capo-n'}),
    ]);
    var lbDiv  = div('sw-lb');
    var panelInner = div('sw-panel-inner',[div('sw-ks',[el('div',{class:'sw-slabel',text:'目标调'}),quickKeys,kg]),capoEl,lbDiv]);
    var panel  = div('sw-panel',[panelInner]);
    wrap.appendChild(panel);

    function setCurrentKey(nextKey,flatMode){
      if(flatMode!==undefined)preferFlat=flatMode;
      curKey=nextKey;
      renderKeyButtons();
      renderScore();
    }
    function addQuickKey(label,handler){
      var b=el('button',{class:'sw-kb',type:'button',text:label});
      b.addEventListener('click',handler);
      quickKeys.appendChild(b);
      return b;
    }
    addQuickKey('-1',function(){setCurrentKey(stepKeyName(curKey,-1,preferFlat));});
    addQuickKey('原调',function(){setCurrentKey(song.origKey||'C',!!FLAT_KEYS[parseKeyName(song.origKey||'C').root]);});
    addQuickKey('+1',function(){setCurrentKey(stepKeyName(curKey,1,preferFlat));});
    var enharmBtn=addQuickKey(preferFlat?'♭':'#',function(){
      preferFlat=!preferFlat;
      curKey=enharmonicKeyName(curKey,preferFlat);
      enharmBtn.textContent=preferFlat?'♭':'#';
      setCurrentKey(curKey,preferFlat);
    });
    function renderKeyButtons(){
      kg.innerHTML='';
      var keys=preferFlat?KEY_SET_FLAT:KEY_SET_SHARP;
      keys.forEach(function(k){
        var b = el('button',{class:'sw-kb'+(k===curKey?' on':''),type:'button',text:k});
        b.addEventListener('click',function(){setCurrentKey(k,preferFlat);});
        kg.appendChild(b);
      });
      enharmBtn.textContent=preferFlat?'♭':'#';
    }
    renderKeyButtons();

    /* tools row */
    var exportBtn = el('button',{class:'sw-export-btn',type:'button','aria-label':'下载图片'});
    function setExportButtonState(label){
      exportBtn.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11"></path><path d="m7 10 5 5 5-5"></path><path d="M5 20h14"></path></svg>' +
        '<span>' + label + '</span>';
    }
    setExportButtonState('下载图片');

    var ytBtn = el('a',{class:'yt-btn',href:song.youtube||'#',target:'_blank',title:'YouTube',
      rel:'noopener noreferrer',
      'aria-label':'打开 YouTube',
      html:'<svg viewBox="0 0 24 24" aria-hidden="true"><path class="yt-screen" d="M21.6 7.2a2.8 2.8 0 0 0-2-2C17.9 4.8 12 4.8 12 4.8s-5.9 0-7.6.4a2.8 2.8 0 0 0-2 2A22 22 0 0 0 2 12a22 22 0 0 0 .4 4.8 2.8 2.8 0 0 0 2 2c1.7.4 7.6.4 7.6.4s5.9 0 7.6-.4a2.8 2.8 0 0 0 2-2A22 22 0 0 0 22 12a22 22 0 0 0-.4-4.8z"></path><path class="yt-play" d="M10.2 8.8v6.4l5.4-3.2-5.4-3.2z"></path></svg>'
    });

    var metroDiv = buildMetro(song.bpm || 80);
    var toolsRow = div('sw-tools-row',[exportBtn, ytBtn, metroDiv]);
    toolsRow.appendChild(lyricHlCreateController(lbDiv,function(){return song.id;}));
    wrap.appendChild(div('sw-tools',[toolsRow]));

    /* score image */
    var scoreKeyBadge = el('span',{class:'sw-score-key sw-score-key-badge',text:'1 = '+curKey});
    var img = el('img',{src:song.scoreImg||'', alt:'简谱'});
    img.addEventListener('error', function(){ img.style.display='none'; placeholder.style.display='block'; });
    var placeholder = el('div',{class:'sw-score-ph',text:'📄 歌谱上传后自动显示',style:'display:none'});
    var scoreDiv = div('sw-score',[
      div('sw-score-top',[el('div',{class:'sw-score-lbl',text:'简谱原稿'}), scoreKeyBadge]),
      img, placeholder,
    ]);
    wrap.appendChild(scoreDiv);

    /* jianpu render */
    function renderScore(){
      var info = calcCapo(curKey, song.origKey||'C'), st = info.st, useFlat = preferFlat;
      kPill.textContent = '1 = ' + curKey;
      scoreKeyBadge.textContent = '1 = ' + curKey;

      if(curKey === (song.origKey||'C')){
        capoEl.className='sw-capo plain';
        capoEl.querySelector('.sw-capo-t').textContent='原调演奏';
        capoEl.querySelector('.sw-capo-s').textContent='不需要变调夹';
        capoEl.querySelector('.sw-capo-n').textContent='—';
      } else if(info.capo===0){
        capoEl.className='sw-capo plain';
        capoEl.querySelector('.sw-capo-t').textContent='不需要变调夹';
        capoEl.querySelector('.sw-capo-s').textContent='按 '+info.playKey+' 调指法演奏';
        capoEl.querySelector('.sw-capo-n').textContent='开放';
      } else {
        capoEl.className='sw-capo';
        capoEl.querySelector('.sw-capo-t').textContent='变调夹夹第 '+info.capo+' 格';
        capoEl.querySelector('.sw-capo-s').textContent='按 '+info.playKey+' 调指法 → 实际 '+curKey;
        capoEl.querySelector('.sw-capo-n').textContent=info.capo;
      }

      lbDiv.innerHTML = '';
      (song.sections||[]).forEach(function(sec){
        var se=div('sw-lsec');
        var sn=div('sw-lsec-name');sn.textContent=sec.name;se.appendChild(sn);
        (sec.lines||[]).forEach(function(line){
          var le=div('sw-lline');
          var row=div('sw-lrow prev-row'+((!Array.isArray(line)&&line.b)?' bold':''));
          var segs=Array.isArray(line)?line:(line.line||[]);
          var voltaWrap=null;
          segs.forEach(function(seg){
            if(!segIsRenderableBlock(seg))return;
            if(segIsLabelBlock(seg)){(voltaWrap||row).appendChild(segRenderLabelBlock(seg,row));return;}
            var s=div('prev-seg');
            var c=div('p-chord'+(seg.chord?'':' empty'));
            setChordContentEx(c,seg.chord?trChordEx(seg.chord,st,useFlat,trChord):'\u00a0',setChordContent);
            chordChipDecorate(c);
            s.appendChild(c);
            s.appendChild(renderNStr(seg.n||'',{inlineTimeSign:getSegInlineTimeSign(seg)}));
            var l=div('p-lyric'+((!Array.isArray(line)&&line.b)?' bold':''));setLyricContentEx(l,normLyricText(seg.lyric),setLyricContent);s.appendChild(l);
            if(seg.lyric2){var l2=div('p-lyric p-lyric2'+((!Array.isArray(line)&&line.b)?' bold':''));setLyricContentEx(l2,normLyricText(seg.lyric2),setLyricContent);s.appendChild(l2);}
            if(seg.lyric3){var l3=div('p-lyric p-lyric3'+((!Array.isArray(line)&&line.b)?' bold':''));setLyricContentEx(l3,normLyricText(seg.lyric3),setLyricContent);s.appendChild(l3);}
            if(seg.lyric4){var l4=div('p-lyric p-lyric4'+((!Array.isArray(line)&&line.b)?' bold':''));setLyricContentEx(l4,normLyricText(seg.lyric4),setLyricContent);s.appendChild(l4);}
            var _vn=getVoltaStartLabel(seg.n);
            if(_vn){
              row.classList.add('has-volta');
              voltaWrap=document.createElement('span');
              voltaWrap.className='prev-volta';
              voltaWrap.setAttribute('data-v',_vn+'.');
            }
            (voltaWrap||row).appendChild(s);
            if(voltaWrap&&hasVoltaEnd(seg.n)){voltaWrap.classList.add('closed');row.appendChild(voltaWrap);voltaWrap=null;}
          });
          if(voltaWrap)row.appendChild(voltaWrap);
          le.appendChild(row); se.appendChild(le);
        });
        lbDiv.appendChild(se);
      });
      lyricHlApply(lbDiv,song.id);
      scheduleFitRows();
    }
    function fitRows(){
      resetScoreFit();
      normalizePreviewRowHeights();
      var parent=lbDiv.parentElement;
      if(!parent||!lbDiv.isConnected)return;

      var natural=measureNaturalScore();
      if(!natural)return;

      var availableWidth=parent.clientWidth||natural.width;
      if(!availableWidth)return;

      var scaleX=availableWidth/natural.width;
      if(!isFinite(scaleX)||scaleX<=0)scaleX=1;
      var scaleY=scaleX;
      if(shouldUseScreenHeightFit()){
        var availableHeight=getAvailableScoreHeight();
        if(availableHeight>0){
          var fittedHeight=natural.height*scaleX;
          if(fittedHeight>availableHeight){
            scaleY=scaleX*(availableHeight/fittedHeight);
          }
        }
      }
      if(!isFinite(scaleY)||scaleY<=0)scaleY=scaleX;

      lbDiv.style.transform='scale('+scaleX+','+scaleY+')';
      lbDiv.style.transformOrigin='left top';
      lbDiv.style.width=natural.width+'px';
      lbDiv.style.marginBottom=(natural.height*(scaleY-1)+18)+'px';
    }

    exportBtn.addEventListener('click',function(){
      if(exportBtn.disabled) return;
      exportBtn.disabled=true;
      exportBtn.style.opacity='.65';
      setExportButtonState('生成中...');
      var exportOpts={
        title:song.title||'transpose',
        key:curKey,
        song:song,
        a4:true,
        bgColor:'#ffffff',
        tight:true,
        width:Math.max(560,Math.ceil(wrap.getBoundingClientRect().width||0)||900)
      };
      exportSongAsFittedPng(lbDiv,exportOpts).catch(function(err){
        try{ console.warn('[YouthEngine] fitted export failed, fallback to legacy single image',err); }catch(_){}
        return exportTransposePanel(lbDiv,exportOpts);
      }).then(function(){
        setExportButtonState('已下载');
      }).catch(function(err){
        setExportButtonState('下载失败');
        try{ console.error('[YouthEngine] export transpose image failed',err); }catch(_){}
      }).finally(function(){
        setTimeout(function(){
          exportBtn.disabled=false;
          exportBtn.style.opacity='';
          setExportButtonState('下载图片');
        },1200);
      });
    });

    renderScore();
    scheduleFitRows();
    var onViewportChange=function(){ scheduleFitRows(); };
    var onPanelTransitionEnd=function(e){
      if(e.target===panel&&e.propertyName==='max-height')scheduleFitRows();
    };
    var vv=window.visualViewport;
    var fitObs=new ResizeObserver(scheduleFitRows);
    fitObs.observe(panelInner);
    panel.addEventListener('transitionend',onPanelTransitionEnd);
    window.addEventListener('resize',onViewportChange,{passive:true});
    window.addEventListener('orientationchange',onViewportChange,{passive:true});
    if(vv){
      vv.addEventListener('resize',onViewportChange,{passive:true});
      vv.addEventListener('scroll',onViewportChange,{passive:true});
    }
    if(document.fonts&&document.fonts.ready){
      document.fonts.ready.then(function(){
        if(lbDiv.isConnected)scheduleFitRows();
      }).catch(function(){});
    }
    return wrap;
  }

  /* ══════════════ Metronome ══════════════ */
  function buildMetro(defBpm) {
    var metro = div('sw-metro');
    metro.innerHTML = `
      <span class="mleaf">🌿</span><span class="mleaf">🌿</span>
      <div class="mbg">${defBpm}</div>
      <span class="mleaf">🌿</span><span class="mleaf">🌿</span>
      <div class="msettings">
        <div class="mrow">
          <button class="mminus">−</button>
          <input class="mbpm" type="number" min="30" max="300" value="${defBpm}">
          <button class="mplus">＋</button>
        </div>
        <div class="mrow">
          <button class="mreset">重置</button>
          <button class="mstop-btn">停止</button>
        </div>
        <div class="mrow mrow-vol">
          <span class="mvol-icon">\u{1F50A}</span>
          <input class="mvol" type="range" min="0" max="200" step="5">
          <span class="mvol-val"></span>
        </div>
      </div>`;

    var bpm=defBpm,step=0,playing=false,timer=null,audioCtx=null,settingsOpen=false,pressTimer=null;
    var leaves=metro.querySelectorAll('.mleaf');
    var mbg=metro.querySelector('.mbg');
    var msettings=metro.querySelector('.msettings');
    var minput=metro.querySelector('.mbpm');

    function metroVolPct(){try{var v=parseInt(localStorage.getItem('cecp-metro-vol'),10);if(isFinite(v)&&v>=0&&v<=200)return v;}catch(_){}return 100;}
    function playClick(){var vol=metroVolPct();if(vol<=0)return;if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();var o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='triangle';o.frequency.value=step===0?900:700;g.gain.value=(step===0?.2:.14)*(vol/100);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+0.035);}
    function tick(){leaves.forEach(function(l){l.classList.remove('active')});leaves[step].classList.add('active');playClick();step=(step+1)%4;}
    function mstart(){mstop();step=0;tick();timer=setInterval(tick,60000/bpm);playing=true;}
    function mstop(){if(timer)clearInterval(timer);timer=null;playing=false;leaves.forEach(function(l){l.classList.remove('active')});}
    function setBpm(v){bpm=Math.min(300,Math.max(30,v||defBpm));mbg.textContent=bpm;minput.value=bpm;if(playing)mstart();}

    metro.addEventListener('click',function(e){if(e.target.closest('.msettings')||settingsOpen)return;playing?mstop():mstart();});
    function openS(){msettings.style.display='block';settingsOpen=true;}
    function cancelP(){clearTimeout(pressTimer);}
    metro.addEventListener('touchstart',function(){pressTimer=setTimeout(openS,500);},{passive:true});
    metro.addEventListener('touchend',cancelP,{passive:true});
    metro.addEventListener('touchmove',cancelP,{passive:true});
    metro.addEventListener('mousedown',function(){pressTimer=setTimeout(openS,500);});
    metro.addEventListener('mouseup',cancelP);
    metro.addEventListener('mouseleave',cancelP);
    var mvol=metro.querySelector('.mvol');
    var mvolVal=metro.querySelector('.mvol-val');
    var mvolIcon=metro.querySelector('.mvol-icon');
    function refreshVolUi(){var v=metroVolPct();mvol.value=v;mvolVal.textContent=v+'%';mvolIcon.textContent=v===0?'\u{1F507}':'\u{1F50A}';}
    mvol.addEventListener('input',function(e){e.stopPropagation();try{localStorage.setItem('cecp-metro-vol',String(Math.max(0,Math.min(200,parseInt(mvol.value,10)||0))));}catch(_){}refreshVolUi();});
    mvol.addEventListener('click',function(e){e.stopPropagation();});
    refreshVolUi();
    metro.querySelector('.mminus').onclick=function(e){e.stopPropagation();setBpm(bpm-1);};
    metro.querySelector('.mplus').onclick=function(e){e.stopPropagation();setBpm(bpm+1);};
    metro.querySelector('.mreset').onclick=function(e){e.stopPropagation();setBpm(defBpm);};
    metro.querySelector('.mstop-btn').onclick=function(e){e.stopPropagation();mstop();};
    minput.addEventListener('change',function(e){e.stopPropagation();setBpm(parseInt(minput.value,10));});
    minput.addEventListener('click',function(e){e.stopPropagation();});
    document.addEventListener('click',function(e){if(!metro.contains(e.target)){msettings.style.display='none';settingsOpen=false;}});
    return metro;
  }

  /* ══════════════ Lightbox ══════════════ */
  function initLightbox() {
    if (document.getElementById('ym-lb-overlay')) return;
    var ov = div('sw-lb-overlay');
    ov.id = 'ym-lb-overlay';
    ov.innerHTML = '<div class="sw-lb-box" role="dialog" aria-modal="true"><button class="sw-lb-close">✕</button><button class="sw-lb-nav prev">‹</button><img class="sw-lb-img" alt="score"><button class="sw-lb-nav next">›</button></div>';
    document.body.appendChild(ov);

    var lbImg=ov.querySelector('.sw-lb-img');
    var btnClose=ov.querySelector('.sw-lb-close');
    var btnPrev=ov.querySelector('.sw-lb-nav.prev');
    var btnNext=ov.querySelector('.sw-lb-nav.next');
    var list=[],idx=0,isOpen=false;

    function getImgs(){return Array.from(document.querySelectorAll('.sw-score img')).filter(function(i){return i&&i.src&&i.style.display!=='none';});}
    function syncNav(){var s=list.length>1;btnPrev.style.display=s?'':'none';btnNext.style.display=s?'':'none';}
    function showImg(i){if(!list.length)return;idx=(i+list.length)%list.length;lbImg.src=list[idx].src;}
    function lbOpen(img){list=getImgs();idx=Math.max(0,list.indexOf(img));showImg(idx);syncNav();ov.classList.add('open');document.body.style.overflow='hidden';isOpen=true;}
    function lbClose(){ov.classList.remove('open');document.body.style.overflow='';isOpen=false;}

    btnClose.onclick=function(e){e.stopPropagation();lbClose();};
    btnPrev.onclick=function(e){e.stopPropagation();if(list.length>1)showImg(idx-1);};
    btnNext.onclick=function(e){e.stopPropagation();if(list.length>1)showImg(idx+1);};
    ov.addEventListener('click',function(e){if(e.target===ov)lbClose();});
    document.addEventListener('keydown',function(e){if(!isOpen)return;if(e.key==='Escape')lbClose();if(e.key==='ArrowLeft'&&list.length>1)showImg(idx-1);if(e.key==='ArrowRight'&&list.length>1)showImg(idx+1);});
    document.addEventListener('click',function(e){var img=e.target.closest('.sw-score img');if(img)lbOpen(img);});
    var sx=0,sy=0,moved=false;
    ov.addEventListener('touchstart',function(e){if(!isOpen)return;sx=e.touches[0].clientX;sy=e.touches[0].clientY;moved=false;},{passive:true});
    ov.addEventListener('touchmove',function(){moved=true;},{passive:true});
    ov.addEventListener('touchend',function(e){if(!isOpen||!moved)return;var t=e.changedTouches[0];if(!t)return;var dx=t.clientX-sx;if(Math.abs(dx)<40||Math.abs(dx)<Math.abs(t.clientY-sy))return;if(dx<0&&list.length>1)showImg(idx+1);else if(list.length>1)showImg(idx-1);},{passive:true});
  }

  /* ══════════════ Built-in Player (musiclib style) ══════════════ */
  function buildAPlayer(song) {
    if (!song.mp3) return div('');

    // inject CSS once
    if (!buildAPlayer._cssInjected) {
      buildAPlayer._cssInjected = true;
      var s = document.createElement('style');
      s.textContent = [
        ':root{--ym-pl-bg:rgba(210,210,218,0.88);--ym-pl-border:rgba(0,0,0,0.10);--ym-pl-text:#1d1d1f;--ym-pl-text2:rgba(0,0,0,0.48);--ym-pl-text3:rgba(0,0,0,0.28);--ym-pl-fill:#1d1d1f;--ym-pl-track:rgba(0,0,0,0.12);--ym-pl-btn:rgba(0,0,0,0.55);--ym-pl-btn-hover:rgba(0,0,0,0.08);--ym-pl-pp-bg:rgba(0,0,0,0.14);--ym-pl-pp-hover:rgba(0,0,0,0.22);--ym-pl-lrc-dim:rgba(0,0,0,0.22);}',
        '@media(prefers-color-scheme:dark){:root{--ym-pl-bg:rgba(20,20,24,0.92);--ym-pl-border:rgba(255,255,255,0.08);--ym-pl-text:#fff;--ym-pl-text2:rgba(255,255,255,0.48);--ym-pl-text3:rgba(255,255,255,0.28);--ym-pl-fill:#fff;--ym-pl-track:rgba(255,255,255,0.15);--ym-pl-btn:rgba(255,255,255,0.55);--ym-pl-btn-hover:rgba(255,255,255,0.09);--ym-pl-pp-bg:rgba(255,255,255,0.15);--ym-pl-pp-hover:rgba(255,255,255,0.24);--ym-pl-lrc-dim:rgba(255,255,255,0.25);}}',
        '.ym-pl{display:flex;flex-direction:column;align-items:stretch;gap:10px;background:var(--ym-pl-bg);backdrop-filter:blur(28px) saturate(180%);-webkit-backdrop-filter:blur(28px) saturate(180%);border-radius:18px;border:1px solid var(--ym-pl-border);margin:12px 0 8px;padding:14px 16px 12px;color:var(--ym-pl-text);overflow:hidden;}',
        '.ym-pl-stage{position:relative;display:flex;align-items:center;height:200px;overflow:hidden;}',
        '.ym-pl-cover-wrap{flex-shrink:0;width:130px;height:130px;position:absolute;left:50%;transform:translateX(-50%);transition:left .5s cubic-bezier(.4,0,.2,1),transform .5s cubic-bezier(.4,0,.2,1);z-index:2;}',
        '.ym-pl-stage.playing .ym-pl-cover-wrap{left:0;transform:translateX(0);}',
        '.ym-pl-cover{width:100%;height:100%;border-radius:14px;background:var(--ym-pl-track);display:flex;align-items:center;justify-content:center;font-size:32px;color:var(--ym-pl-text3);overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.4);}',
        '.ym-pl-cover img{width:100%;height:100%;object-fit:cover;border-radius:14px;display:block;}',
        '.ym-pl-lrc-panel{position:absolute;left:144px;right:0;top:0;bottom:0;height:100%;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;scroll-behavior:smooth;opacity:0;transform:translateX(16px);transition:opacity .5s ease .2s,transform .5s ease .2s;mask-image:linear-gradient(to bottom,transparent 0%,black 18%,black 82%,transparent 100%);-webkit-mask-image:linear-gradient(to bottom,transparent 0%,black 18%,black 82%,transparent 100%);scrollbar-width:none;}',
        '.ym-pl-lrc-panel::-webkit-scrollbar{display:none;}',
        '.ym-pl-stage.playing .ym-pl-lrc-panel{opacity:1;transform:translateX(0);}',
        '.ym-pl-lrc-inner{display:flex;flex-direction:column;align-items:center;gap:0;padding:50% 0;}',
        '.ym-pl-lrc-line{width:100%;text-align:center;font-size:clamp(13px,3.5vw,18px);line-height:1.8;padding:3px 4px;color:var(--ym-pl-lrc-dim);cursor:pointer;border-radius:6px;transition:color .3s ease,font-weight .3s ease;user-select:none;white-space:normal;word-break:break-word;}',
        '.ym-pl-lrc-line:hover{color:var(--ym-pl-text2);}',
        '.ym-pl-lrc-line.active{color:var(--ym-pl-text);font-size:clamp(15px,4vw,20px);font-weight:700;}',
        '.ym-pl-info{flex:1;min-width:0;}',
        '.ym-pl-title{font-size:14px;font-weight:600;color:var(--ym-pl-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
        '.ym-pl-artist{font-size:12px;color:var(--ym-pl-text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;}',
        '.ym-pl-prog-wrap{padding:10px 2px;cursor:pointer;margin:0 -2px;}',
        '.ym-pl-prog-bar{height:5px;border-radius:99px;background:var(--ym-pl-track);cursor:pointer;}',
        '.ym-pl-prog-fill{height:100%;background:var(--ym-pl-fill);border-radius:99px;width:0%;transition:width .4s linear;}',
        '.ym-pl-times{display:flex;justify-content:space-between;margin-top:4px;font-size:11px;color:var(--ym-pl-text3);font-variant-numeric:tabular-nums;}',
        '.ym-pl-controls{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;}',
        '.ym-pl-btn{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;border:none;background:transparent;color:var(--ym-pl-btn);cursor:pointer;transition:color .15s,background .15s,transform .1s;}',
        '.ym-pl-btn:hover{color:var(--ym-pl-text);background:var(--ym-pl-btn-hover);}',
        '.ym-pl-btn:active{transform:scale(.88);}',
        '.ym-pl-pp{color:var(--ym-pl-text)!important;background:var(--ym-pl-pp-bg)!important;width:42px!important;height:42px!important;}',
        '.ym-pl-pp:hover{background:var(--ym-pl-pp-hover)!important;}',
        '.ym-pl-vol-wrap{display:flex;align-items:center;gap:8px;padding:0 2px;}',
        '.ym-pl-vol{flex:1;-webkit-appearance:none;appearance:none;height:4px;border-radius:99px;background:var(--ym-pl-track);outline:none;cursor:pointer;}',
        '.ym-pl-vol::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:var(--ym-pl-fill);cursor:pointer;}',
        '.ym-pl{--ym-song-accent:#d8bd63;--ym-song-accent-soft:rgba(216,189,99,.24);--ym-song-accent-deep:rgba(15,18,27,.74);position:relative;isolation:isolate;gap:12px;padding:16px;border-radius:28px;background:linear-gradient(180deg,rgba(255,255,255,.72),rgba(255,255,255,.42));box-shadow:0 28px 88px rgba(15,23,42,.18),0 1px 0 rgba(255,255,255,.18) inset;}',
        '.ym-pl::before{content:"";position:absolute;inset:-24px;z-index:-2;background-image:var(--ym-cover-img);background-size:cover;background-position:center;filter:blur(38px) saturate(1.18);opacity:.18;transform:scale(1.04);}',
        '.ym-pl::after{content:"";position:absolute;inset:0;z-index:-1;border-radius:inherit;background:radial-gradient(circle at 18% 8%,var(--ym-song-accent-soft),transparent 34%),linear-gradient(145deg,rgba(255,255,255,.10),transparent 55%);pointer-events:none;}',
        '.ym-pl-stage{height:auto;min-height:390px;display:flex;flex-direction:column;justify-content:center;gap:18px;overflow:visible;}',
        '.ym-pl-cover-wrap,.ym-pl-stage.playing .ym-pl-cover-wrap{position:relative;left:auto;width:min(78vw,310px);height:auto;aspect-ratio:1/1;transform:none;margin:0 auto;transition:transform .35s ease;}',
        '.ym-pl-cover{border-radius:28px;box-shadow:0 34px 92px rgba(0,0,0,.34),0 0 0 1px rgba(255,255,255,.16) inset;animation:ym-cover-in .62s cubic-bezier(.2,.8,.2,1) both;}',
        '.ym-pl-cover img{border-radius:28px;}',
        '.ym-pl-stage.playing .ym-pl-cover{animation:ym-cover-in .62s cubic-bezier(.2,.8,.2,1) both;}',
        '@keyframes ym-cover-in{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:none}}',
        '@keyframes ym-cover-drift{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}',
        '.ym-pl-lrc-panel,.ym-pl-stage.playing .ym-pl-lrc-panel{position:relative;left:auto;right:auto;top:auto;bottom:auto;width:100%;height:210px;opacity:1;transform:none;}',
        '.ym-pl-lrc-inner{padding:92px 0 108px;}',
        '.ym-pl-lrc-line{font-size:clamp(17px,5.6vw,27px);line-height:1.38;padding:7px 10px;color:color-mix(in srgb,var(--ym-pl-text) 35%,transparent);opacity:.58;transition:color .34s ease,transform .34s cubic-bezier(.2,.8,.2,1),opacity .34s ease,filter .34s ease;}',
        '.ym-pl-lrc-line:hover{color:color-mix(in srgb,var(--ym-pl-text) 72%,transparent);opacity:.9;}',
        '.ym-pl-lrc-line.active{font-size:clamp(21px,6.5vw,34px);color:var(--ym-pl-text);opacity:1;transform:scale(1.045);filter:drop-shadow(0 12px 28px var(--ym-song-accent-soft));}',
        '.ym-pl-spectrum{height:28px;display:flex;align-items:flex-end;justify-content:center;gap:5px;color:var(--ym-song-accent);}',
        '.ym-pl-spectrum i{width:4px;height:8px;border-radius:99px;background:currentColor;opacity:.34;}',
        '.ym-pl-stage.playing .ym-pl-spectrum i{animation:ym-spectrum 1s ease-in-out infinite;opacity:.86;}',
        '.ym-pl-spectrum i:nth-child(2){animation-delay:.12s}.ym-pl-spectrum i:nth-child(3){animation-delay:.24s}.ym-pl-spectrum i:nth-child(4){animation-delay:.08s}.ym-pl-spectrum i:nth-child(5){animation-delay:.18s}',
        '@keyframes ym-spectrum{0%,100%{height:7px}45%{height:25px}70%{height:13px}}',
        '.ym-pl-info,.ym-pl-prog-wrap,.ym-pl-controls,.ym-pl-vol-wrap{border-radius:22px;background:rgba(255,255,255,.44);border:1px solid rgba(255,255,255,.26);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);}',
        '.ym-pl-info{padding:12px 14px;text-align:center;}',
        '.ym-pl-title{font-size:16px}.ym-pl-artist{font-size:12px;}',
        '.ym-pl-prog-wrap{padding:13px 12px;margin:0;}',
        '.ym-pl-controls{padding:8px;}',
        '.ym-pl-vol-wrap{padding:11px 12px;}',
        '.ym-pl-pp{background:linear-gradient(135deg,#fff,var(--ym-song-accent))!important;color:#101114!important;box-shadow:0 14px 34px var(--ym-song-accent-soft);}',
        '.ym-pl-btn{transition:transform .16s ease,background .16s ease,color .16s ease,box-shadow .16s ease;}',
        '.ym-pl-btn:hover{transform:translateY(-1px);}.ym-pl-btn:active{transform:scale(.92);}',
        '@media(prefers-color-scheme:dark){.ym-pl{background:linear-gradient(180deg,rgba(18,20,28,.82),rgba(12,14,20,.72));box-shadow:0 32px 96px rgba(0,0,0,.42),0 1px 0 rgba(255,255,255,.10) inset;}.ym-pl::before{opacity:.24}.ym-pl-info,.ym-pl-prog-wrap,.ym-pl-controls,.ym-pl-vol-wrap{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.10);}}',
        '@media(max-width:640px){.ym-pl{border-radius:24px;padding:14px;}.ym-pl-stage{min-height:72vh;}.ym-pl-cover-wrap,.ym-pl-stage.playing .ym-pl-cover-wrap{width:min(76vw,300px);}.ym-pl-lrc-panel,.ym-pl-stage.playing .ym-pl-lrc-panel{height:32vh;}.ym-pl-lrc-line{font-size:clamp(19px,6.2vw,28px);}.ym-pl-lrc-line.active{font-size:clamp(24px,7.8vw,36px);}.ym-pl-vol-wrap{display:none;}}',
        '@media(prefers-reduced-motion:reduce){.ym-pl-stage.playing .ym-pl-cover,.ym-pl-stage.playing .ym-pl-spectrum i{animation:none!important;}}',
        '.ym-pl{border-radius:22px;padding:14px;gap:10px;}',
        '.ym-pl-stage{min-height:0;height:auto;display:grid;grid-template-columns:132px minmax(0,1fr);align-items:center;gap:14px;}',
        '.ym-pl-cover-wrap,.ym-pl-stage.playing .ym-pl-cover-wrap{width:132px;margin:0;}',
        '.ym-pl-cover,.ym-pl-cover img{border-radius:18px;}',
        '.ym-pl-lrc-panel,.ym-pl-stage.playing .ym-pl-lrc-panel{height:168px;}',
        '.ym-pl-lrc-inner{padding:72px 0 84px;}',
        '.ym-pl-lrc-line{font-size:clamp(14px,2.6vw,18px);line-height:1.52;padding:4px 6px;text-align:left;}',
        '.ym-pl-lrc-line.active{font-size:clamp(16px,3vw,21px);transform:translateX(4px) scale(1.02);}',
        '.ym-pl-spectrum{grid-column:1/-1;height:18px;margin-top:-3px;}',
        '.ym-pl-stage.playing .ym-pl-spectrum i{animation-duration:1.15s;}',
        '@media(max-width:640px){.ym-pl{border-radius:20px;padding:12px;gap:9px;}.ym-pl-stage{min-height:0;grid-template-columns:88px minmax(0,1fr);gap:11px;}.ym-pl-cover-wrap,.ym-pl-stage.playing .ym-pl-cover-wrap{width:88px;}.ym-pl-cover,.ym-pl-cover img{border-radius:16px;}.ym-pl-lrc-panel,.ym-pl-stage.playing .ym-pl-lrc-panel{height:138px;}.ym-pl-lrc-inner{padding:58px 0 72px;}.ym-pl-lrc-line{font-size:14px;line-height:1.45;padding:3px 4px;text-align:left;}.ym-pl-lrc-line.active{font-size:17px;transform:translateX(3px) scale(1.015);}.ym-pl-spectrum{height:14px;}.ym-pl-info{padding:10px 12px;}.ym-pl-prog-wrap{padding:10px 8px;}.ym-pl-controls{padding:5px;}.ym-pl-btn{width:34px;height:34px;}.ym-pl-pp{width:40px!important;height:40px!important;}}',
      ].join('');
      document.head.appendChild(s);
    }

    var wrap = div('ym-pl');
    function applyAtmosphere(src){
      if(!src) return;
      wrap.style.setProperty('--ym-cover-img', 'url("'+String(src).replace(/"/g,'%22')+'")');
      var img=new Image();
      img.crossOrigin='anonymous';
      img.onload=function(){
        try{
          var c=document.createElement('canvas'), size=34;
          c.width=size;c.height=size;
          var ctx=c.getContext('2d',{willReadFrequently:true});
          ctx.drawImage(img,0,0,size,size);
          var data=ctx.getImageData(0,0,size,size).data;
          var r=0,g=0,b=0,n=0;
          for(var i=0;i<data.length;i+=16){
            var a=data[i+3], rr=data[i], gg=data[i+1], bb=data[i+2];
            var mx=Math.max(rr,gg,bb), mn=Math.min(rr,gg,bb);
            if(a<80 || mx<28 || mx-mn<12) continue;
            r+=rr;g+=gg;b+=bb;n++;
          }
          if(!n) return;
          r=Math.round(r/n);g=Math.round(g/n);b=Math.round(b/n);
          wrap.style.setProperty('--ym-song-accent','rgb('+r+','+g+','+b+')');
          wrap.style.setProperty('--ym-song-accent-soft','rgba('+r+','+g+','+b+',.28)');
        }catch(_){}
      };
      img.src=src;
    }
    applyAtmosphere(song.cover||'');

    // stage: cover + lyrics
    var stage = div('ym-pl-stage');
    var coverWrap = div('ym-pl-cover-wrap');
    var coverEl = div('ym-pl-cover');
    if (song.cover) {
      var img = document.createElement('img'); img.src = song.cover; img.alt = '';
      coverEl.appendChild(img);
    } else { coverEl.textContent = '♪'; }
    coverWrap.appendChild(coverEl);
    var lrcPanel = div('ym-pl-lrc-panel');
    var lrcInner = div('ym-pl-lrc-inner');
    lrcPanel.appendChild(lrcInner);
    stage.appendChild(coverWrap); stage.appendChild(lrcPanel);
    var spectrum = div('ym-pl-spectrum');
    spectrum.setAttribute('aria-hidden','true');
    spectrum.innerHTML='<i></i><i></i><i></i><i></i><i></i>';
    stage.appendChild(spectrum);
    wrap.appendChild(stage);

    // song info row
    var infoRow = div('');
    infoRow.style.cssText = 'display:flex;align-items:center;gap:12px;';
    var info = div('ym-pl-info');
    var titleEl = div('ym-pl-title'); titleEl.textContent = song.title || '';
    var artistEl = div('ym-pl-artist'); artistEl.textContent = song.artist || '';
    info.appendChild(titleEl); info.appendChild(artistEl);
    infoRow.appendChild(info);
    wrap.appendChild(infoRow);

    // progress
    var progWrap = div('ym-pl-prog-wrap');
    var progBar = div('ym-pl-prog-bar');
    var progFill = div('ym-pl-prog-fill');
    progBar.appendChild(progFill);
    var times = div('ym-pl-times');
    var curEl = document.createElement('span'); curEl.textContent = '0:00';
    var durEl = document.createElement('span'); durEl.textContent = '0:00';
    times.appendChild(curEl); times.appendChild(durEl);
    progWrap.appendChild(progBar); progWrap.appendChild(times);
    wrap.appendChild(progWrap);

    // controls
    function mkBtn(svgPath, w, h, label) {
      var b = div('ym-pl-btn'); b.setAttribute('aria-label', label);
      b.innerHTML = '<svg width="'+w+'" height="'+h+'" viewBox="0 0 24 24" fill="currentColor">'+svgPath+'</svg>';
      return b;
    }
    var btnBack = mkBtn('<path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/><text x="12" y="15.5" text-anchor="middle" font-size="5.5" fill="currentColor" font-family="system-ui,sans-serif" font-weight="600">15</text>',17,17,'后退15秒');
    var btnPlay = div('ym-pl-btn ym-pl-pp'); btnPlay.setAttribute('aria-label','播放');
    btnPlay.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v14l11-7-11-7z"/></svg>';
    var btnFwd = mkBtn('<path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/><text x="12" y="15.5" text-anchor="middle" font-size="5.5" fill="currentColor" font-family="system-ui,sans-serif" font-weight="600">15</text>',17,17,'前进15秒');
    var controls = div('ym-pl-controls');
    controls.appendChild(btnBack); controls.appendChild(btnPlay); controls.appendChild(btnFwd);
    wrap.appendChild(controls);

    // volume (hidden on touch devices — system volume keys handle it)
    var volWrap = div('ym-pl-vol-wrap');
    var isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (!isTouchDevice) {
      var volIconLo = document.createElement('span');
      volIconLo.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>';
      var volSlider = document.createElement('input');
      volSlider.className = 'ym-pl-vol'; volSlider.type = 'range'; volSlider.min = '0'; volSlider.max = '1'; volSlider.step = '0.02'; volSlider.value = '1';
      var volIconHi = document.createElement('span');
      volIconHi.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM18.5 12c0-2.77-1.5-5.15-3.75-6.45v12.9C16.99 17.14 18.5 14.77 18.5 12z"/></svg>';
      volWrap.appendChild(volIconLo); volWrap.appendChild(volSlider); volWrap.appendChild(volIconHi);
      volSlider.oninput = function(){ audio.volume = parseFloat(volSlider.value); };
      wrap.appendChild(volWrap);
    }

    // audio engine（挂进 wrap：不可见，但让宿主页面能 querySelector 到以便暂停）
    var audio = document.createElement('audio');
    audio.src = song.mp3;
    audio.style.display = 'none';   // display:none 不影响播放，避免成为可见 flex item
    wrap.appendChild(audio);
    var lrcData = [], lrcIdx = -1;

    function fmt(s) { var m=Math.floor(s/60),ss=Math.floor(s%60); return m+':'+(ss<10?'0':'')+ss; }
    function parseLrc(text) {
      var lines = [];
      text.split('\n').forEach(function(l){ var m=l.match(/^\[(\d+):(\d+\.\d+)\](.*)/); if(m) lines.push({time:parseInt(m[1])*60+parseFloat(m[2]),text:m[3].trim()}); });
      return lines.sort(function(a,b){return a.time-b.time;});
    }
    function renderLrc() {
      lrcInner.innerHTML = '';
      lrcPanel.scrollTop = 0;
      lrcData.forEach(function(l,i){
        var d = document.createElement('div'); d.className = 'ym-pl-lrc-line' + (i===0 ? ' active' : ''); d.textContent = l.text;
        d.onclick = function(){ audio.currentTime = l.time; };
        lrcInner.appendChild(d);
      });
      lrcIdx = lrcData.length ? 0 : -1;
    }
    function highlightLrc() {
      if (!lrcData.length) return;
      var t = audio.currentTime, idx = -1;
      lrcData.forEach(function(l,i){ if(l.time<=t) idx=i; });
      if (idx === lrcIdx) return;
      lrcIdx = idx;
      lrcInner.querySelectorAll('.ym-pl-lrc-line').forEach(function(r,i){ r.classList.toggle('active', i===idx); });
      if (idx >= 0) {
        var lines = lrcInner.querySelectorAll('.ym-pl-lrc-line');
        if (lines[idx]) lrcPanel.scrollTo({top: lines[idx].offsetTop - lrcPanel.offsetHeight/2 + lines[idx].offsetHeight/2, behavior:'smooth'});
      }
    }
    function updateBtn() {
      btnPlay.innerHTML = audio.paused
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v14l11-7-11-7z"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h3v14H6V5zm9 0h3v14h-3V5z"/></svg>';
    }
    function updateProgress() {
      var dur = audio.duration||0, cur = audio.currentTime||0;
      curEl.textContent = fmt(cur); durEl.textContent = fmt(dur);
      progFill.style.width = (dur ? cur/dur*100 : 0) + '%';
      highlightLrc();
    }

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('play', function(){ stage.classList.add('playing'); updateBtn(); });
    audio.addEventListener('pause', updateBtn);

    btnPlay.onclick = function(){ audio.paused ? audio.play().catch(function(){}) : audio.pause(); };
    btnBack.onclick = function(){ audio.currentTime = Math.max(0, audio.currentTime-15); };
    btnFwd.onclick = function(){ audio.currentTime = Math.min(audio.duration||0, audio.currentTime+15); };
    // seek on click
    progWrap.addEventListener('click', function(e){
      if (!audio.duration) return;
      var r = progBar.getBoundingClientRect();
      audio.currentTime = Math.max(0, Math.min(1, (e.clientX-r.left)/r.width)) * audio.duration;
    });

    // load lrc
    if (song.lrc) {
      fetch(song.lrc).then(function(r){return r.text();}).then(function(text){
        lrcData = parseLrc(text); renderLrc();
      }).catch(function(){});
    }

    return wrap;
  }

  /* ══════════════ Build all sections ══════════════ */
  function buildSongs(songsArg) {
    var songs = songsArg || (C && C.songs) || [];
    if (!songs.length) return el('p',{class:'ym-meta',text:'本周暂无诗歌安排'});

    var wrap   = div('ym-songs-wrap');
    var tabBar = div('ym-song-tabs');
    var panels = [];

    songs.forEach(function(song, i){

      /* 复制图标（点击只复制，不切换 tab）*/
      var copyIcon = el('span',{class:'ym-song-tab-copy',title:'复制歌名',
        html:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>'
      });
      copyIcon.addEventListener('click', function(e){
        e.stopPropagation();
        navigator.clipboard.writeText(song.title).then(function(){
          var old = copyIcon.innerHTML;
          copyIcon.innerHTML = '&#10003;'; copyIcon.style.color = '#16a34a';
          setTimeout(function(){ copyIcon.innerHTML = old; copyIcon.style.color = ''; }, 1200);
        });
      });

      /* Tab 按钮：序号 + 歌名 + 复制 */
      var tab = el('button',{class:'ym-song-tab'+(i===0?' active':'')});
      tab.appendChild(el('span',{class:'ym-song-tab-num',text:String(i+1)}));
      tab.appendChild(el('span',{class:'ym-song-tab-title',text:song.title}));
      tab.appendChild(copyIcon);
      tabBar.appendChild(tab);

      /* 内容面板：播放器 + 移调卡 */
      var panel = div('ym-song-panel'+(i===0?' active':''));
      panel.appendChild(buildAPlayer(song));
      panel.appendChild(buildSongCard(song));
      wrap.appendChild(panel);

      panels.push({tab:tab, panel:panel});

      /* 切换逻辑 */
      tab.addEventListener('click', function(){
        panels.forEach(function(p){
          p.tab.classList.remove('active');
          p.panel.classList.remove('active');
        });
        tab.classList.add('active');
        panel.classList.add('active');
      });
    });

    wrap.insertBefore(tabBar, wrap.firstChild);
    return wrap;
  }

  /* ══════════════ Bible widget ══════════════ */
  function buildBible() {
    var w = div('');
    var bw = el('div',{class:'hb-bible'});
    bw.setAttribute('data-id','ym-bible-widget');
    bw.setAttribute('data-default', C.bibleRef||'？');
    bw.setAttribute('data-t2','NR06');
    bw.setAttribute('data-dual','1');
    w.appendChild(bw);
    return w;
  }

  /* ══════════════ PPT ══════════════ */
  function buildPPT() {
    if(C.pptUrl){
      return el('a',{class:'ppt-download-link',href:C.pptUrl,target:'_blank',rel:'noopener noreferrer',
        text:(C.pptLabel||'讲员PPT') + ' > 📥 查看 / 下载'});
    }
    return el('p',{class:'ppt-empty',text:'本周暂未提供讲员 PPT 🙏'});
  }

  /* ══════════════ Replay ══════════════ */
  function normalizeVideoUrl(url) {
    if(!url) return url;
    try {
      var parsed = new URL(url, window.location.href);
      parsed.searchParams.delete('autoplay');
      return parsed.href;
    } catch (_) {
      return String(url).replace(/([?&])autoplay=1(&?)/, function(_, lead, tail){
        return tail ? lead : '';
      });
    }
  }

  function buildReplay() {
    if(C.replayUrl){
      var wrap = div('ym-iframe-wrap');
      var iframe = el('iframe',{src:normalizeVideoUrl(C.replayUrl),allowfullscreen:'true',allow:'accelerometer;clipboard-write;encrypted-media;gyroscope;picture-in-picture'});
      wrap.appendChild(iframe);
      return wrap;
    }
    return el('p',{class:'replay-tip',text:'本周暂未提供直播回放 🙏🏻'});
  }

  /* ══════════════ Anchor helper ══════════════ */
  function anchor(id){ var a=el('div',{id:id,style:'scroll-margin-top:80px'}); return a; }

  /* ══════════════ HR ══════════════ */
  function hr(){ return el('hr',{class:'ym-hr'}); }

  /* ══════════════ Section title ══════════════ */
  function secTitle(txt, cls){ return el('h2',{class:'ym-section-title'+(cls?' '+cls:''),text:txt}); }

  function getSectionOrder() {
    var defaults = ['flow', 'songs', 'message', 'ppt', 'replay', 'game', 'action'];
    var valid = defaults.concat(['tutorial']);
    var raw = Array.isArray(C.sectionOrder) ? C.sectionOrder : [];
    var seen = {};
    var order = [];

    raw.forEach(function(name){
      var key = String(name || '').toLowerCase();
      if (key === 'schedule') key = 'flow';
      if (!valid.includes(key) || seen[key]) return;
      seen[key] = true;
      order.push(key);
    });

    if (C.tutorialUrl && !seen.tutorial) {
      seen.tutorial = true;
      order.push('tutorial');
    }

    defaults.forEach(function(key){
      if (!seen[key]) order.push(key);
    });

    return order;
  }

  function buildFlowSection() {
    var frag = document.createDocumentFragment();
    frag.appendChild(anchor('ym-flow'));
    frag.appendChild(buildSchedule());
    return frag;
  }

  function buildSongsSection() {
    var frag = document.createDocumentFragment();
    frag.appendChild(anchor('ym-songs'));
    frag.appendChild(secTitle('🎵 诗歌敬拜'));
    var roster = buildRoster();
    if (roster) frag.appendChild(roster);
    frag.appendChild(buildSongs());
    frag.appendChild(anchor('ym-score'));
    return frag;
  }

  function buildMessageSection() {
    var frag = document.createDocumentFragment();
    frag.appendChild(anchor('ym-message'));
    frag.appendChild(secTitle('📖 圣经分享', 'is-featured'));
    var metaDiv = div('ym-block is-featured ym-tilt ym-reveal');
    metaDiv.innerHTML =
      '<div class="ym-meta is-featured">' +
        '<div class="ym-meta-row"><span class="ym-meta-label">讲员</span><span class="ym-meta-value">' + (C.speaker||'—') + '</span></div>' +
        '<div class="ym-meta-row"><span class="ym-meta-label">主题</span><span class="ym-meta-value">' + (C.topic||'—') + '</span></div>' +
      '</div>';
    frag.appendChild(metaDiv);
    frag.appendChild(buildBible());
    return frag;
  }

  function buildPptSection() {
    var frag = document.createDocumentFragment();
    frag.appendChild(anchor('ym-ppt'));
    frag.appendChild(secTitle('📑 讲员 PPT'));
    frag.appendChild(buildPPT());
    return frag;
  }

  function buildReplaySection() {
    var frag = document.createDocumentFragment();
    frag.appendChild(anchor('ym-replay'));
    frag.appendChild(secTitle('📺 直播回放'));
    frag.appendChild(buildReplay());
    return frag;
  }

  function buildTutorialSection() {
    var frag = document.createDocumentFragment();
    frag.appendChild(anchor('ym-tutorial'));
    frag.appendChild(secTitle(C.tutorialTitle || '🎬 视频教程'));
    if(C.tutorialUrl){
      var wrap = div('ym-iframe-wrap');
      var iframe = el('iframe',{src:normalizeVideoUrl(C.tutorialUrl),allowfullscreen:'true',allow:'accelerometer;clipboard-write;encrypted-media;gyroscope;picture-in-picture'});
      wrap.appendChild(iframe);
      frag.appendChild(wrap);
    } else {
      frag.appendChild(el('p',{class:'replay-tip',text:'本周暂未提供视频教程 🙏🏻'}));
    }
    return frag;
  }

  function buildGameSection() {
    var frag = document.createDocumentFragment();
    frag.appendChild(anchor('ym-game'));
    frag.appendChild(secTitle('🎮 游戏活动', 'is-featured'));
    var gameDiv = div('ym-block is-featured ym-tilt ym-reveal');
    gameDiv.appendChild(el('p',{class:'ym-feature-copy',text:C.gameText}));
    frag.appendChild(gameDiv);
    return frag;
  }

  function buildActionSection() {
    var act = div('ym-action ym-reveal');
    act.innerHTML = '<strong>🙋 行动邀请</strong><br>欢迎邀请你身边的青年朋友一起来参加聚会。<br>如果你对敬拜、乐器或其他服事有感动，我们很欢迎你加入，也可以随时联系同工。<br><strong>一起服事，一起成长，我们等你！</strong>';
    return act;
  }

  /* ══════════════ Assemble page ══════════════ */
  function buildPage() {
    var frag = document.createDocumentFragment();
    var sectionBuilders = {
      flow: buildFlowSection,
      songs: buildSongsSection,
      message: buildMessageSection,
      ppt: buildPptSection,
      replay: buildReplaySection,
      tutorial: buildTutorialSection,
      game: buildGameSection,
      action: buildActionSection,
    };
    var sectionOrder = getSectionOrder();

    frag.appendChild(buildHero());
    frag.appendChild(hr());

    sectionOrder.forEach(function(section, index){
      var builder = sectionBuilders[section];
      if (!builder) return;
      frag.appendChild(builder());
      if (index < sectionOrder.length - 1) frag.appendChild(hr());
    });

    // Ring Coach Tour trigger
    frag.appendChild(el('div',{id:'rt5-enable'}));

    ROOT.appendChild(frag);
  }

  function setupYouthMotion(root) {
    if (!root || root.__ymMotionReady) return;
    root.__ymMotionReady = true;

    var reduceMotion = true;

    function eachNode(selector, fn) {
      Array.prototype.forEach.call(root.querySelectorAll(selector), fn);
    }

    function primeReveal(node) {
      if (!node || node.__ymRevealReady) return;
      node.__ymRevealReady = true;
      if (reduceMotion) {
        node.classList.add('in');
        return;
      }
      if (setupYouthMotion._revealObserver) setupYouthMotion._revealObserver.observe(node);
      else node.classList.add('in');
    }

    function primeTilt(node) {
      if (!node || node.__ymTiltReady || reduceMotion) return;
      node.__ymTiltReady = true;
      node.addEventListener('mousemove', function(e){
        var r = node.getBoundingClientRect();
        if (!r.width || !r.height) return;
        var x = (e.clientX - r.left) / r.width;
        var y = (e.clientY - r.top) / r.height;
        var rx = (0.5 - y) * 5.5;
        var ry = (x - 0.5) * 6.5;
        node.style.setProperty('--ym-spot-x', (x * 100).toFixed(1) + '%');
        node.style.setProperty('--ym-spot-y', (y * 100).toFixed(1) + '%');
        node.style.transform = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(-2px)';
      });
      node.addEventListener('mouseleave', function(){
        node.style.transform = '';
        node.style.removeProperty('--ym-spot-x');
        node.style.removeProperty('--ym-spot-y');
      });
    }

    if (!setupYouthMotion._revealObserver && 'IntersectionObserver' in window && !reduceMotion) {
      setupYouthMotion._revealObserver = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if (!entry.isIntersecting) return;
          entry.target.classList.add('in');
          setupYouthMotion._revealObserver.unobserve(entry.target);
        });
      }, {threshold:0.12, rootMargin:'0px 0px -6% 0px'});
    }

    function scan(scope) {
      scope = scope || root;
      if (scope.nodeType !== 1 && scope.nodeType !== 9 && scope.nodeType !== 11) return;
      if (scope.classList) {
        if (scope.classList.contains('ym-reveal')) primeReveal(scope);
        if (scope.classList.contains('ym-tilt')) primeTilt(scope);
      }
      Array.prototype.forEach.call(scope.querySelectorAll ? scope.querySelectorAll('.ym-reveal') : [], primeReveal);
      Array.prototype.forEach.call(scope.querySelectorAll ? scope.querySelectorAll('.ym-tilt') : [], primeTilt);
    }

    scan(root);

    if ('MutationObserver' in window) {
      var mo = new MutationObserver(function(muts){
        muts.forEach(function(m){
          Array.prototype.forEach.call(m.addedNodes || [], scan);
        });
      });
      mo.observe(root, {childList:true, subtree:true});
    } else {
      eachNode('.ym-reveal', function(n){ n.classList.add('in'); });
    }
  }

  /* ══════════════ 核心运行函数 ══════════════ */
  function _run(cfg, root) {
    C = cfg;
    ROOT = root;
    buildModal();
    buildPage();
    setupYouthMotion(ROOT);
    initLightbox();
  }

  /* ══════════════ 对外 API（在 IIFE 内注册，可访问内部函数）══════════════ */

  /* 供其他引擎（如 camp-engine.js）复用诗歌渲染：
     传入 song id 数组（songs/<id>.json 的 id），内部逐个 fetch，
     复用 buildSongs/buildSongCard/buildAPlayer，
     返回 Promise<HTMLElement>（诗歌 tab + 播放器 + 和弦谱，观感与 weekly 一致）。 */
  window.YouthEngine.buildSongSet = function(songIds) {
    _injectCSS();
    initLightbox();
    var ids = Array.isArray(songIds) ? songIds : [];
    var songPromises = ids.map(function(id) {
      return fetch(YM_BASE + '/songs/' + id + '.json')
        .then(function(r) {
          if (!r.ok) throw new Error('歌曲不存在: ' + id);
          return r.json();
        });
    });
    return Promise.all(songPromises).then(function(songs) {
      return buildSongs(songs);
    });
  };

  window.YouthEngine.render = function(weekId, root) {
    if (!root) root = document.getElementById('ym-root');
    if (!root) { console.error('[YM] root element not found'); return; }

    root.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--ym-ink2,#888);font-family:system-ui;"><div style="font-size:32px;margin-bottom:12px;">⏳</div><div>正在加载周刊...</div></div>';
    _injectCSS();

    fetch(YM_BASE + '/weekly/' + weekId + '.json')
      .then(function(r) {
        if (!r.ok) throw new Error('周刊不存在: ' + weekId);
        return r.json();
      })
      .then(function(weekly) {
        var songIds = weekly.songs || [];
        var songPromises = songIds.map(function(id) {
          return fetch(YM_BASE + '/songs/' + id + '.json')
            .then(function(r) {
              if (!r.ok) throw new Error('歌曲不存在: ' + id);
              return r.json();
            });
        });
        return Promise.all(songPromises).then(function(songs) {
          weekly.songs = songs;
          return weekly;
        });
      })
      .then(function(cfg) {
        root.innerHTML = '';
        _applyDefaults(cfg);
        _run(cfg, root);
      })
      .catch(function(err) {
        root.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#ef4444;font-family:system-ui;"><div style="font-size:32px;margin-bottom:12px;">❌</div><div>' + err.message + '</div></div>';
        console.error('[YM]', err);
      });
  };

  /* ══════════════ 向后兼容：自动运行模式 ══════════════ */
  if (window.YouthMeeting) {
    var C0 = window.YouthMeeting;
    var ROOT0 = document.getElementById('ym-root');
    if (C0 && ROOT0) {
      _applyDefaults(C0);
      _injectCSS();
      _run(C0, ROOT0);
    }
  }

})();
