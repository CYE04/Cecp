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
    --ym-capo:#fb923c;--ym-capo-bg:rgba(251,146,60,.1);--ym-capo-ln:rgba(251,146,60,.22);
    --yb:#161616;--yt:rgba(255,255,255,.92);--ym:rgba(255,255,255,.70);--ybr:rgba(255,255,255,.15);--ysh:rgba(0,0,0,.65);--ybk:rgba(0,0,0,.80);
  }
}
*,*::before,*::after{box-sizing:border-box}

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
.ym-hero{max-width:960px;margin:0 auto 2rem;padding:2.2rem 1.6rem 2.4rem;border-radius:28px;text-align:center;background:var(--ym-card);border:1px solid var(--ym-border);box-shadow:var(--ym-sh-lg)}
.ym-hero h1{font-size:clamp(1.6rem,4vw,2.2rem);font-weight:800;color:var(--ym-ink);margin:0 0 .4rem;letter-spacing:-.01em}
.ym-hero .sub{font-size:.95rem;color:var(--ym-ink2);margin:0 0 .5rem}
.ym-hero .tm{font-size:.88rem;color:var(--ym-ink3);margin:0 0 1.8rem}
.ym-nav{display:flex;justify-content:center;gap:10px;flex-wrap:wrap}
.ym-nav-btn{padding:10px 20px;border-radius:999px;border:1px solid var(--ym-border-md);background:var(--ym-soft);font-size:13px;font-weight:500;cursor:pointer;color:var(--ym-ink);box-shadow:var(--ym-sh);transition:all .18s ease}
.ym-nav-btn:hover{background:var(--ym-border);transform:translateY(-2px);box-shadow:var(--ym-sh-lg)}
.ym-nav-btn.active{background:var(--ym-ink);color:var(--ym-bg);border-color:transparent;box-shadow:var(--ym-sh-lg)}

/* ── Schedule ── */
.ym-flow{width:100%;max-width:1100px;margin:1rem auto;font-family:system-ui,-apple-system,"PingFang SC",sans-serif;color:var(--ym-ink)}
.ym-flow .card{border:1px solid var(--ym-border);border-radius:clamp(16px,2.4vw,22px);background:linear-gradient(180deg,var(--ym-soft),transparent);box-shadow:0 16px 50px rgba(0,0,0,.1);overflow:hidden}
.ym-flow .head{padding:clamp(14px,2.2vw,20px);display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.ym-flow .icon{font-size:clamp(38px,6.3vw,70px);line-height:1;filter:drop-shadow(0 10px 18px rgba(0,0,0,.18))}
.ym-flow .title{margin:0;font-weight:900;font-size:clamp(32px,6vw,58px)}
.ym-flow .list{padding:clamp(10px,1.8vw,14px);display:grid;gap:10px}
.ym-flow .item{border:1px solid var(--ym-border);border-radius:16px;background:var(--ym-soft);padding:clamp(12px,2vw,16px);display:grid;grid-template-columns:1fr 1.2fr;gap:12px;align-items:center;transition:transform .16s ease}
.ym-flow .item:hover{transform:translateY(-1px)}
@media(max-width:640px){.ym-flow .item{grid-template-columns:1fr}}
.ym-flow .tm{font-weight:900;font-size:clamp(16px,2.2vw,26px)}
.ym-flow .ev{display:flex;justify-content:flex-end;align-items:center;gap:10px;font-weight:900;font-size:clamp(16px,2.4vw,28px);text-align:right;word-break:break-word}
@media(max-width:640px){.ym-flow .ev{justify-content:flex-start;text-align:left}}

/* ── Roster ── */
.wr-root{width:100%;margin:1rem 0;padding:0 2px;box-sizing:border-box;font-family:system-ui,"PingFang SC","Microsoft YaHei";color:var(--ym-ink);overflow:hidden}
.wr-tabs{display:flex;justify-content:center;gap:6px;flex-wrap:wrap;padding:8px;border-radius:999px;background:var(--ym-soft);border:1px solid var(--ym-border);margin-bottom:12px}
.wr-tab{padding:6px 14px;border-radius:999px;font-size:12px;cursor:pointer;text-decoration:none;user-select:none;background:var(--ym-card);color:var(--ym-ink);border:1px solid var(--ym-border);transition:.2s ease;white-space:nowrap}
.wr-tab:hover{transform:translateY(-1px)}
.wr-tab.active{background:linear-gradient(180deg,var(--ym-accent2),var(--ym-accent));color:#fff;border-color:transparent}
.wr-card{width:100%;padding:12px;border-radius:18px;background:linear-gradient(180deg,var(--ym-card),var(--ym-soft));border:1px solid var(--ym-border);box-sizing:border-box;overflow:hidden}
.wr-head{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:4px}
.wr-title{font-weight:600;font-size:15px;color:var(--ym-ink)}
.wr-actions button{border:none;border-radius:10px;padding:5px 12px;cursor:pointer;font-size:13px;background:var(--ym-soft);color:var(--ym-ink);margin-left:6px}
.wr-group{margin-top:16px}.wr-group h3{margin:0 0 8px;font-size:14px;color:var(--ym-ink2)}
.wr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px}
.wr-section{background:var(--ym-soft);border-radius:12px;padding:10px;border:1px solid var(--ym-border);box-sizing:border-box;min-width:0}
.wr-section-title{font-weight:600;font-size:13px;margin-bottom:5px;color:var(--ym-ink)}
.wr-name{display:flex;gap:5px;margin-bottom:5px}
.wr-name input{flex:1;min-width:0;width:100%;padding:5px 7px;border-radius:7px;border:none;background:var(--ym-card);color:var(--ym-ink);font-size:13px;box-sizing:border-box}
.wr-name input::placeholder{color:var(--ym-ink3)}
.wr-name button{background:#ef4444;border:none;border-radius:6px;color:#fff;cursor:pointer;padding:0 7px;font-size:13px;flex-shrink:0}
.add-btn{margin-top:5px;font-size:11px;cursor:pointer;color:var(--ym-accent2)}

/* ── Song card ── */
.sw-wrap{font-family:'Noto Serif SC','PingFang SC',serif;max-width:100%;margin:0 auto 28px;color:var(--ym-ink)}
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
.sw-panel-inner{border-radius:16px;border:1px solid var(--ym-border);background:var(--ym-card);box-shadow:var(--ym-sh);overflow:hidden;margin-bottom:12px}
.sw-ks{padding:12px 14px 10px;border-bottom:1px solid var(--ym-border)}
.sw-slabel{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--ym-ink3);margin-bottom:8px}
.sw-kg{display:flex;flex-wrap:wrap;gap:5px}
.sw-kb{font-family:'DM Mono',monospace;font-size:11px;padding:4px 9px;border-radius:6px;border:1px solid var(--ym-border);background:transparent;color:var(--ym-ink2);cursor:pointer;transition:all .15s;min-width:32px;text-align:center}
.sw-kb:hover{border-color:var(--ym-border-md);color:var(--ym-ink);background:var(--ym-soft)}
.sw-kb.on{background:var(--ym-ink);color:var(--ym-bg);border-color:transparent;font-weight:600}
.sw-capo{display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--ym-capo-bg);border-bottom:1px solid var(--ym-capo-ln);transition:all .2s}
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
.prev-row{display:flex;flex-wrap:nowrap;align-items:flex-end;margin-bottom:10px;overflow:visible;padding-bottom:2px}
.prev-seg{display:inline-flex;flex-direction:column;align-items:flex-start;margin-right:4px;flex-shrink:0}
.p-chord{font-family:'Space Mono',monospace;font-size:12px;font-weight:700;color:var(--ym-capo);margin-bottom:2px;min-height:13px;white-space:pre}
.p-chord.empty{visibility:hidden}
.p-n{font-family:'Space Mono',monospace;color:var(--ym-ink);margin-bottom:1px;line-height:1.2;display:flex;align-items:flex-end}
.p-lyric{font-family:'Noto Serif SC',serif;font-size:18px;color:var(--ym-ink2);white-space:pre-wrap}
.p-lyric.bold{font-weight:700;color:var(--ym-ink)}
.p-lyric2,.p-lyric3,.p-lyric4{opacity:0.65;margin-top:1px}
.chord-gap,
.lyric-gap{display:inline-block;white-space:pre;visibility:hidden;pointer-events:none;font:inherit;line-height:inherit}
.prev-volta{display:inline-flex;align-items:flex-end;position:relative;padding-top:20px}
.prev-volta::before{content:'';position:absolute;top:3px;left:0;right:0;height:13px;border-top:1.5px solid var(--ym-ink2);border-left:1.5px solid var(--ym-ink2);pointer-events:none;box-sizing:border-box}
.prev-volta.closed::before{border-right:1.5px solid var(--ym-ink2)}
.prev-volta::after{content:attr(data-v);position:absolute;top:4px;left:3px;font-size:8px;line-height:1;color:var(--ym-ink2);pointer-events:none;font-family:'DM Mono',monospace}
.jp-wrap{display:inline-flex;flex-direction:column;align-items:center;vertical-align:bottom;min-width:1em}
.jp-plain{display:inline-flex;flex-direction:column;align-items:center;vertical-align:bottom;min-width:1em}
.jp-plain-top{height:12px}.jp-plain-sym{font-size:15px;line-height:1;text-align:center;display:inline-flex;align-items:center;justify-content:center;width:1em;height:1em}.jp-plain-sym.is-dash{position:relative;top:-0.12em}.jp-plain-bot{height:16px}
.jp-dot-top,.jp-dot-bot{width:1em;font-size:9px;line-height:1;color:var(--ym-ink);text-align:center;display:flex;flex-direction:column;align-items:center}
.jp-dot-top{height:12px;justify-content:flex-end}.jp-dot-bot{height:12px;justify-content:flex-start}
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
.jp-dual-top{margin-bottom:-2px}
.jp-dual-top .jp-dot-bot{height:7px}
.jp-dual-bot .jp-dot-top{height:7px}
.jp-slur{display:inline-flex;align-items:flex-end;position:relative;padding-top:18px}
.jp-slur::before{content:'';position:absolute;top:2px;left:15%;right:15%;height:8px;border-top:1.5px solid var(--ym-ink);border-left:1.5px solid var(--ym-ink);border-right:1.5px solid var(--ym-ink);border-radius:50% 50% 0 0/100% 100% 0 0}
.jp-slur-open{display:inline-flex;align-items:flex-end;position:relative;padding-top:18px}
.jp-slur-open::before{content:'';position:absolute;top:2px;left:15%;right:-4px;height:8px;border-top:1.5px solid var(--ym-ink);border-left:1.5px solid var(--ym-ink);border-radius:50% 0 0 0/100% 0 0 0}
.jp-slur-close{display:inline-flex;align-items:flex-end;position:relative;padding-top:18px}
.jp-slur-close::before{content:'';position:absolute;top:2px;left:-4px;right:15%;height:8px;border-top:1.5px solid var(--ym-ink);border-right:1.5px solid var(--ym-ink);border-radius:0 50% 0 0/0 100% 0 0}
.jp-tuplet{display:inline-flex;align-items:flex-end;position:relative;padding-top:18px;margin-right:1px}
.jp-tuplet-br{position:absolute;top:2px;left:2px;right:2px;height:8px;border-top:1.5px solid var(--ym-ink);border-left:1.5px solid var(--ym-ink);border-right:1.5px solid var(--ym-ink);border-radius:3px 3px 0 0;pointer-events:none}
.jp-tuplet-num{position:absolute;top:-1px;left:50%;transform:translateX(-50%);font-size:8px;line-height:1;padding:0 3px;background:var(--ym-bg);color:var(--ym-ink);pointer-events:none}
.jp-volta{display:inline-flex;align-items:flex-end;position:relative;padding-top:20px}
.jp-volta::before{content:'';position:absolute;top:3px;left:0;right:0;height:13px;border-top:1.5px solid var(--ym-ink2);border-left:1.5px solid var(--ym-ink2);pointer-events:none;box-sizing:border-box}
.jp-volta.v-close::before{border-right:1.5px solid var(--ym-ink2)}
.jp-volta::after{content:attr(data-v);position:absolute;top:4px;left:3px;font-size:8px;line-height:1;color:var(--ym-ink2);pointer-events:none;font-family:'DM Mono',monospace}
.sw-tools{display:flex;justify-content:center;margin:12px 0}
.sw-tools-row{display:inline-flex;align-items:center;gap:12px}
.yt-btn{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:10px;background:#ff0000;text-decoration:none;transition:transform .15s,box-shadow .15s;box-shadow:0 2px 8px rgba(255,0,0,.3)}
.yt-btn:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(255,0,0,.4)}
.yt-btn svg{width:17px;height:17px;fill:#fff}
.sw-metro{position:relative;display:inline-flex;align-items:center;gap:7px;user-select:none;cursor:pointer;filter:drop-shadow(0 2px 4px rgba(0,0,0,.25))}
.sw-metro .mbg{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:0;font-size:40px;font-weight:600;pointer-events:none;color:rgba(130,130,130,.9);text-shadow:0 1px 2px rgba(0,0,0,.55)}
.sw-metro .mleaf{position:relative;z-index:1;font-size:13px;opacity:.45;transition:opacity .15s,transform .15s}
.sw-metro .mleaf.active{opacity:.85;transform:scale(1.1)}
.sw-metro .msettings{position:absolute;top:120%;left:0;z-index:99;background:var(--ym-card);padding:12px;border-radius:16px;box-shadow:0 12px 30px rgba(0,0,0,.25);display:none;min-width:170px;border:1px solid var(--ym-border)}
.sw-metro .mrow{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.sw-metro input.mbpm{width:58px;font-size:15px;text-align:center;border-radius:9px;border:1px solid var(--ym-border);padding:3px 5px;background:var(--ym-soft);color:var(--ym-ink)}
.sw-metro button{font-size:14px;padding:4px 10px;border-radius:9px;border:none;background:var(--ym-soft);cursor:pointer;color:var(--ym-ink)}
.sw-metro .mstop-btn{background:var(--ym-ink);color:var(--ym-bg)}
.sw-score{border-radius:16px;border:1px solid var(--ym-border);background:var(--ym-card);box-shadow:var(--ym-sh);overflow:visible;margin-top:4px}
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
.ym-section-title{font-size:1.3rem;font-weight:700;color:var(--ym-ink);margin:1.5rem 0 .8rem;display:flex;align-items:center;gap:8px}
.ym-block{background:var(--ym-card);border:1px solid var(--ym-border);border-radius:16px;padding:16px;margin-bottom:1rem;box-shadow:var(--ym-sh)}
.ym-meta{font-size:14px;color:var(--ym-ink2);line-height:1.8}
.ym-meta strong{color:var(--ym-ink)}
.ppt-download-link{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:12px;background:var(--ym-ink);color:var(--ym-bg);text-decoration:none;font-size:14px;font-weight:600;transition:opacity .15s}
.ppt-download-link:hover{opacity:.8}
.ppt-empty,.replay-tip{color:var(--ym-ink2);font-size:14px;padding:20px 0}
.ym-iframe-wrap{position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:14px}
.ym-iframe-wrap iframe{position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:14px}
.ym-action{margin:2rem 0;padding:16px;border-left:3px solid var(--ym-accent);background:var(--ym-soft);border-radius:0 12px 12px 0;font-size:14px;line-height:1.8;color:var(--ym-ink)}
.ym-action strong{color:var(--ym-ink)}

/* ── Song selector tabs ── */
.ym-songs-wrap{width:100%}
.ym-song-tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:1rem;padding:12px;border-radius:18px;background:var(--ym-soft);border:1px solid var(--ym-border)}
.ym-song-tab{display:inline-flex;align-items:center;gap:7px;padding:9px 16px;border-radius:12px;border:1px solid var(--ym-border);background:var(--ym-card);color:var(--ym-ink);font-size:14px;cursor:pointer;transition:all .18s ease;text-align:left;max-width:100%}
.ym-song-tab:hover{background:var(--ym-soft);transform:translateY(-1px);box-shadow:var(--ym-sh)}
.ym-song-tab.active{background:linear-gradient(160deg,var(--ym-accent2),var(--ym-accent));color:#fff;border-color:transparent;box-shadow:0 8px 20px rgba(59,91,253,.35)}

.ym-song-tab-num{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,.25);font-size:11px;font-weight:700;flex-shrink:0}
.ym-song-tab:not(.active) .ym-song-tab-num{background:var(--ym-soft)}
.ym-song-tab-title{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px}
@media(max-width:520px){.ym-song-tab-title{max-width:90px}}
.ym-song-tab-copy{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:6px;flex-shrink:0;opacity:.55;transition:opacity .15s,background .15s}
.ym-song-tab-copy:hover{opacity:1;background:rgba(255,255,255,.2)}
.ym-song-tab:not(.active) .ym-song-tab-copy:hover{background:var(--ym-border)}
.ym-song-panel{display:none}
.ym-song-panel.active{display:block}
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

  function nodeToPngBlobByHtml2Canvas(node,bgColor){
    return loadHtml2Canvas().then(function(html2canvas){
      var dpr=Math.max(1,window.devicePixelRatio||1);
      return html2canvas(node,{
        backgroundColor:bgColor||'#ffffff',
        scale:Math.min(2,dpr),
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
            var lyricLine='';
            Array.prototype.forEach.call(row.querySelectorAll('.prev-seg'),function(seg){
              var chord=((seg.querySelector('.p-chord')||{}).textContent||'').replace(/\u00a0/g,' ');
              var lyric=((seg.querySelector('.p-lyric')||{}).textContent||'').replace(/\u00a0/g,' ');
              chordLine+= (chord||' ') + '  ';
              lyricLine+= (lyric||' ') + '  ';
            });
            if(chordLine.trim()) entries.push({type:'chord',text:chordLine.trimEnd()});
            if(lyricLine.trim()) entries.push({type:'lyric',text:lyricLine.trimEnd()});
          });
          entries.push({type:'gap',text:''});
        });
        if(!entries.length) entries=[{type:'sec',text:'[Transpose]'}];

        function fontFor(type){
          if(type==='sec') return '700 18px "Noto Serif SC","PingFang SC",serif';
          if(type==='lyric') return '500 19px "Noto Serif SC","PingFang SC",serif';
          return '700 14px "Space Mono","DM Mono",monospace';
        }
        function lhFor(type){
          if(type==='sec') return 30;
          if(type==='lyric') return 28;
          if(type==='gap') return 14;
          return 24;
        }
        function colorFor(type){
          if(type==='sec') return '#8a5a3b';
          if(type==='lyric') return '#2d2a26';
          return '#c2410c';
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

  function nodeToPngBlobRobust(node,bgColor){
    return nodeToPngBlobByHtml2Canvas(node,bgColor).catch(function(primaryErr){
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
      setStyle(row,'padding-bottom','3px');
      setStyle(row,'border-bottom','none');
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

  function exportTransposePanel(panelInner,opt){
    opt=opt||{};
    if(!panelInner) return Promise.reject(new Error('panel missing'));
    var bg=resolveExportBackground(panelInner,opt.bgColor);
    var waitFonts=(document.fonts&&document.fonts.ready)?document.fonts.ready:Promise.resolve();
    return waitFonts
      .then(function(){
        return withExportJpFix(panelInner,function(){
          return nodeToPngBlobRobust(panelInner,bg);
        });
      })
      .then(function(blob){
        var base=safeFileName(opt.title||'transpose');
        var key=safeFileName(opt.key||'');
        var filename=base+(key?('_'+key):'')+'.png';
        saveBlobAs(blob,filename);
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
    var navItems = [
      {label:'📅 聚会流程', href:'#ym-flow'},
      {label:'🎧 本周诗歌', href:'#ym-songs'},
      {label:'🎼 歌谱',     href:'#ym-score'},
      {label:'📖 信息分享', href:'#ym-message'},
      {label:'📺 直播回放', href:'#ym-replay'},
      {label:'📑 讲员PPT',  href:'#ym-ppt'},
      {label:'🎮 游戏活动', href:'#ym-game'},
    ];
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
    var hero = el('div', {class:'ym-hero'}, [
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
      return el('div',{class:'item'},[
        el('div',{class:'tm', text: s.time}),
        el('div',{class:'ev', html: '<span>' + (s.emoji||'') + '</span> ' + (s.event||'')}),
      ]);
    });
    var list = el('div',{class:'list'}, items);
    return el('div',{class:'ym-flow'},[
      el('div',{class:'card'},[
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
    var card    = div('wr-card');
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
          var sec  = div('wr-section');
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
      s.style.position='relative';
      s.style.top='-0.12em';
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
    var w=document.createElement('span');w.className='jp-wrap';
    var td=document.createElement('span');td.className='jp-dot-top';setDots(td,isHigh>=2?2:isHigh);w.appendChild(td);
    var lw2=document.createElement('span');lw2.className='jp-lines-wrap';
    var numRow=document.createElement('span');numRow.className='jp-num-row';
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
  function renderNStr(nStr){
    var d=document.createElement('div');d.className='p-n';
    if(!nStr||!nStr.trim())return d;
    function isDualAtom(tk){
      if(!tk||tk==='/'||tk==='／')return false;
      if(tk==='('||tk===')'||tk==='(['||tk==='])'||tk==='}'||tk==='[v1'||tk==='[v2'||tk===']v')return false;
      if(tk==='|'||tk==='||'||tk==='||/'||tk==='|]'||tk==='|:'||tk===':|'||tk==='|:|')return false;
      if(/^\{(3|5)$/.test(tk))return false;
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
      if(t==='('){var sl=document.createElement('span');sl.className='jp-slur';i++;while(i<toks.length&&toks[i]!==')')sl.appendChild(parseJpToken(toks[i++]));d.appendChild(sl);i++;continue;}
      if(t==='(['){var so=document.createElement('span');so.className='jp-slur-open';i++;while(i<toks.length&&toks[i]!=='])')so.appendChild(parseJpToken(toks[i++]));if(i<toks.length)i++;d.appendChild(so);continue;}
      if(t==='])'){var sc=document.createElement('span');sc.className='jp-slur-close';i++;if(i<toks.length)sc.appendChild(parseJpToken(toks[i++]));d.appendChild(sc);continue;}
      if(t==='[v1'||t==='[v2'||t===']v'||/^\[v:(.+)\]$/.test(t)){i++;continue;} // volta handled at row level
      var tm2=t.match(/^\{(3|5)$/);if(tm2){var tn=parseInt(tm2[1],10);var tp=makeTuplet(tn);i++;while(i<toks.length&&toks[i]!=='}')tp.appendChild(parseJpToken(toks[i++]));d.appendChild(tp);i++;continue;}
      if(t==='}'){i++;continue;}
      d.appendChild(parseJpToken(t));i++;
    }
    return d;
  }

  /* ══════════════ Transpose ══════════════ */
  var CHR=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  var ENH={Db:'C#',Eb:'D#',Gb:'F#',Ab:'G#',Bb:'A#'};
  var FLT={'C#':'Db','D#':'Eb','F#':'Gb','G#':'Ab','A#':'Bb'};
  var FLAT_KEYS={F:1,Bb:1,Eb:1,Ab:1,Db:1,Gb:1,Cb:1};
  var USE_FLAT_MINOR_ROOTS={D:1,G:1,C:1,F:1,Bb:1,Eb:1};
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
  function trChordToken(token,st,useFlat){
    var m=String(token||'').trim().match(/^([A-G](?:#|b)?)(.*)$/);
    if(!m)return token;
    var rest=m[2]||'';
    rest=rest.replace(/\/\s*([A-G](?:#|b)?)/g,function(_,bass){return '/'+trBass(bass,st,useFlat);});
    return trKeyName(m[1],st,useFlat)+rest;
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
    var st=(nIdx(target.root)-nIdx(orig.root)+12)%12,best=null;
    ['C','D','E','F','G','A','B'].forEach(function(pk){
      var c=(nIdx(target.root)-nIdx(pk)+12)%12;
      if(c<=7&&(!best||c<best.capo))best={playKey:pk+target.suf,capo:c};
    });
    return{st:st,capo:best?best.capo:0,playKey:best?best.playKey:t};
  }

  /* ══════════════ Song card ══════════════ */
  function buildSongCard(song) {
    var wrap = el('div', {class:'sw-wrap', id:'song-'+song.id});
    var curKey = song.origKey;
    var KEYS   = ['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'];

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
    togBtn.addEventListener('click', function(){
      panel.classList.toggle('open');
      togBtn.classList.toggle('on', panel.classList.contains('open'));
    });

    /* transpose panel */
    var kg     = div('sw-kg');
    var capoEl = div('sw-capo plain',[
      el('div',{style:'font-size:15px;flex-shrink:0',text:'🎸'}),
      el('div',{style:'flex:1'},[
        el('div',{class:'sw-capo-t'}),
        el('div',{class:'sw-capo-s'}),
      ]),
      el('div',{class:'sw-capo-n'}),
    ]);
    var lbDiv  = div('sw-lb');
    var panelInner = div('sw-panel-inner',[div('sw-ks',[el('div',{class:'sw-slabel',text:'目标调'}),kg]),capoEl,lbDiv]);
    var panel  = div('sw-panel',[panelInner]);
    wrap.appendChild(panel);

    KEYS.forEach(function(k){
      var b = el('button',{class:'sw-kb'+(k===curKey?' on':''),text:k});
      b.addEventListener('click',function(){
        curKey=k;
        kg.querySelectorAll('.sw-kb').forEach(function(x){x.classList.remove('on')});
        b.classList.add('on'); renderScore();
      });
      kg.appendChild(b);
    });

    /* tools row */
    var exportBtn = el('button',{class:'sw-pill',type:'button',text:'🖼 下载图片'});
    exportBtn.style.cssText='font-size:12px;padding:5px 12px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;border:none;';

    var ytBtn = el('a',{class:'yt-btn',href:song.youtube||'#',target:'_blank',title:'YouTube',
      html:'<svg viewBox="0 0 24 24"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"></path></svg>'
    });

    var metroDiv = buildMetro(song.bpm || 80);
    var toolsRow = div('sw-tools-row',[exportBtn, ytBtn, metroDiv]);
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
      var info = calcCapo(curKey, song.origKey), st = info.st, useFlat = !!FLAT_KEYS[curKey];
      kPill.textContent = '1 = ' + curKey;
      scoreKeyBadge.textContent = '1 = ' + curKey;

      if(curKey === song.origKey){
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
            var s=div('prev-seg');
            var c=div('p-chord'+(seg.chord?'':' empty'));
            setChordContent(c,seg.chord?trChord(seg.chord,st,useFlat):'\u00a0');
            s.appendChild(c);
            if(seg.n && seg.n.trim())s.appendChild(renderNStr(seg.n));
            var l=div('p-lyric'+((!Array.isArray(line)&&line.b)?' bold':''));setLyricContent(l,normLyricText(seg.lyric));s.appendChild(l);
            if(seg.lyric2){var l2=div('p-lyric p-lyric2'+((!Array.isArray(line)&&line.b)?' bold':''));setLyricContent(l2,normLyricText(seg.lyric2));s.appendChild(l2);}
            if(seg.lyric3){var l3=div('p-lyric p-lyric3'+((!Array.isArray(line)&&line.b)?' bold':''));setLyricContent(l3,normLyricText(seg.lyric3));s.appendChild(l3);}
            if(seg.lyric4){var l4=div('p-lyric p-lyric4'+((!Array.isArray(line)&&line.b)?' bold':''));setLyricContent(l4,normLyricText(seg.lyric4));s.appendChild(l4);}
            var _vn=getVoltaStartLabel(seg.n);
            if(_vn){voltaWrap=document.createElement('span');voltaWrap.className='prev-volta';voltaWrap.setAttribute('data-v',_vn+'.');}
            (voltaWrap||row).appendChild(s);
            if(voltaWrap&&hasVoltaEnd(seg.n)){voltaWrap.classList.add('closed');row.appendChild(voltaWrap);voltaWrap=null;}
          });
          if(voltaWrap)row.appendChild(voltaWrap);
          le.appendChild(row); se.appendChild(le);
        });
        lbDiv.appendChild(se);
      });
      fitRows();
    }
    function fitRows(){
      requestAnimationFrame(function(){
        lbDiv.style.transform='';lbDiv.style.transformOrigin='';
        lbDiv.style.width='';lbDiv.style.marginBottom='';
        lbDiv.style.padding='8px 18px 16px 8px';
        lbDiv.style.boxSizing='border-box';
        var avail=lbDiv.parentElement.clientWidth;
        if(!avail)return;
        var maxW=0;
        var gutterX=24;
        var gutterY=18;
        lbDiv.querySelectorAll('.sw-lrow').forEach(function(row){
          row.style.display='inline-flex';
          if(row.scrollWidth>maxW)maxW=row.scrollWidth;
          row.style.display='';
        });
        if(!maxW)return;
        var measureW=maxW+gutterX;
        var scale=avail/measureW;
          lbDiv.style.transform='scale('+scale+')';
          lbDiv.style.transformOrigin='left top';
        lbDiv.style.width=measureW+'px';
          var naturalH=lbDiv.offsetHeight;
        lbDiv.style.marginBottom=(naturalH*(scale-1) + gutterY)+'px';
        lbDiv.parentElement.style.overflow='hidden';
      });
    }

    exportBtn.addEventListener('click',function(){
      if(exportBtn.disabled) return;
      var old=exportBtn.textContent;
      exportBtn.disabled=true;
      exportBtn.style.opacity='.65';
      exportBtn.textContent='生成中...';
      exportTransposePanel(panelInner,{
        title:song.title||'transpose',
        key:'1='+curKey,
        width:Math.max(560,Math.ceil(wrap.getBoundingClientRect().width||0)||900)
      }).then(function(){
        exportBtn.textContent='已下载';
      }).catch(function(err){
        exportBtn.textContent='下载失败';
        try{ console.error('[YouthEngine] export transpose image failed',err); }catch(_){}
      }).finally(function(){
        setTimeout(function(){
          exportBtn.disabled=false;
          exportBtn.style.opacity='';
          exportBtn.textContent=old;
        },1200);
      });
    });

    renderScore();
    fitRows();
    var fitObs=new ResizeObserver(fitRows);
    fitObs.observe(lbDiv);
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
      </div>`;

    var bpm=defBpm,step=0,playing=false,timer=null,audioCtx=null,settingsOpen=false,pressTimer=null;
    var leaves=metro.querySelectorAll('.mleaf');
    var mbg=metro.querySelector('.mbg');
    var msettings=metro.querySelector('.msettings');
    var minput=metro.querySelector('.mbpm');

    function playClick(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();var o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='triangle';o.frequency.value=step===0?900:700;g.gain.value=step===0?.1:.07;o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+0.035);}
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
      ].join('');
      document.head.appendChild(s);
    }

    var wrap = div('ym-pl');

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

    // audio engine
    var audio = document.createElement('audio');
    audio.src = song.mp3;
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
  function buildSongs() {
    var songs = C.songs || [];
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
  function buildReplay() {
    if(C.replayUrl){
      var wrap = div('ym-iframe-wrap');
      var iframe = el('iframe',{src:C.replayUrl,allowfullscreen:'true',allow:'accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture'});
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
  function secTitle(txt){ return el('h2',{class:'ym-section-title',text:txt}); }

  /* ══════════════ Assemble page ══════════════ */
  function buildPage() {
    var frag = document.createDocumentFragment();

    frag.appendChild(buildHero());
    frag.appendChild(hr());

    // Schedule
    frag.appendChild(anchor('ym-flow'));
    frag.appendChild(buildSchedule());
    frag.appendChild(hr());

    // Songs
    frag.appendChild(anchor('ym-songs'));
    frag.appendChild(secTitle('🎵 诗歌敬拜'));

    // Roster
    var roster = buildRoster();
    if(roster) frag.appendChild(roster);

    frag.appendChild(buildSongs());
    frag.appendChild(hr());

    // Score (scroll target just before last song card)
    frag.appendChild(anchor('ym-score'));
    frag.appendChild(hr());

    // Message
    frag.appendChild(anchor('ym-message'));
    frag.appendChild(secTitle('📖 圣经分享'));
    var metaDiv = div('ym-block');
    metaDiv.innerHTML = '<div class="ym-meta"><strong>讲员：</strong>'+(C.speaker||'—')+'<br><strong>主题：</strong>'+(C.topic||'—')+'</div>';
    frag.appendChild(metaDiv);
    frag.appendChild(buildBible());
    frag.appendChild(hr());

    // PPT
    frag.appendChild(anchor('ym-ppt'));
    frag.appendChild(secTitle('📑 讲员 PPT'));
    frag.appendChild(buildPPT());
    frag.appendChild(hr());

    // Replay
    frag.appendChild(anchor('ym-replay'));
    frag.appendChild(secTitle('📺 直播回放'));
    frag.appendChild(buildReplay());
    frag.appendChild(hr());

    // Game
    frag.appendChild(anchor('ym-game'));
    frag.appendChild(secTitle('🎮 游戏活动'));
    frag.appendChild(el('p',{class:'ym-meta',text:C.gameText}));
    frag.appendChild(hr());

    // Action
    var act = div('ym-action');
    act.innerHTML = '<strong>🙋 行动邀请</strong><br>欢迎邀请你身边的青年朋友一起来参加聚会。<br>如果你对敬拜、乐器或其他服事有感动，我们很欢迎你加入，也可以随时联系同工。<br><strong>一起服事，一起成长，我们等你！</strong>';
    frag.appendChild(act);

    // Ring Coach Tour trigger
    frag.appendChild(el('div',{id:'rt5-enable'}));

    ROOT.appendChild(frag);
  }

  /* ══════════════ 核心运行函数 ══════════════ */
  function _run(cfg, root) {
    C = cfg;
    ROOT = root;
    buildModal();
    buildPage();
    initLightbox();
  }

  /* ══════════════ 对外 API（在 IIFE 内注册，可访问内部函数）══════════════ */
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
