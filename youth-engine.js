/**
 * youth-engine.js v3.0
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
.sw-seg{display:inline-flex;flex-direction:column;align-items:flex-start;margin-right:1px;margin-bottom:5px}
.sw-chord{font-family:'DM Mono',monospace;font-size:14px;font-weight:700;color:var(--ym-capo);margin-bottom:3px;min-height:15px;white-space:nowrap}
.sw-chord.empty{visibility:hidden}
.sw-jianpu{font-family:'DM Mono',monospace;color:var(--ym-ink);margin-bottom:2px;display:flex;align-items:flex-end;line-height:1}
.sw-lyric{font-size:22px;color:var(--ym-ink2);white-space:pre;letter-spacing:.5px}
.sw-lyric2{display:block;font-size:22px;opacity:0.6;margin-top:1px}
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
  function parseJpToken(tok) {
    if(!tok||tok==='|'||tok==='||'||tok===' '){
      var pl=document.createElement('span');
      pl.style.cssText='display:inline-flex;flex-direction:column;align-items:center;vertical-align:bottom;min-width:1em;';
      var _t=document.createElement('span');_t.style.height='12px';pl.appendChild(_t);
      var _s=document.createElement('span');_s.style.cssText='font-size:15px;line-height:1;text-align:center;';_s.textContent=tok||'';pl.appendChild(_s);
      var _b=document.createElement('span');_b.style.height='16px';pl.appendChild(_b);
      return pl;
    }
    if(tok==='sp'||tok==='sp_'||tok==='sp__'){
      var fake=tok==='sp__'?'0__':tok==='sp_'?'0_':'0';
      var el2=parseJpToken(fake);
      var lw=el2.children[1]; if(lw){var nr=lw.children[0];if(nr){var ns=nr.children[0];if(ns)ns.style.visibility='hidden';}}
      return el2;
    }
    var num=tok,isHigh=0,isLow=0,isDot=false,uline=0;
    if(num.slice(-2)==='__'){uline=2;num=num.slice(0,-2);}
    else if(num.slice(-1)==='_'){uline=1;num=num.slice(0,-1);}
    if(num.indexOf('\u00b7')>-1){isDot=true;num=num.replace(/\u00b7/g,'');}
    var hm=num.match(/^(.+?)('+)$/);if(hm){isHigh=hm[2].length;num=hm[1];}
    var lm=num.match(/^(.+?)(,+)$/);if(lm){isLow=lm[2].length;num=lm[1];}
    var w=document.createElement('span');w.style.cssText='display:inline-flex;flex-direction:column;align-items:center;vertical-align:bottom;';
    var topDot=document.createElement('span');topDot.style.cssText='font-size:7px;line-height:1;height:12px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;';
    if(isHigh>=2)topDot.innerHTML='\u00b7<br>\u00b7';else if(isHigh===1)topDot.textContent='\u00b7';
    w.appendChild(topDot);
    var lw2=document.createElement('span');lw2.style.cssText='display:inline-flex;flex-direction:column;align-items:stretch;padding-bottom:4px;position:relative;';
    var numRow=document.createElement('span');numRow.style.cssText='display:inline-flex;align-items:center;justify-content:center;position:relative;'+(uline>=1?'border-bottom:1.5px solid currentColor;':'');
    var ns2=document.createElement('span');ns2.style.cssText='font-size:22px;line-height:1;display:inline-block;text-align:center;min-width:1em;';ns2.textContent=num;numRow.appendChild(ns2);
    if(isDot){var dt=document.createElement('span');dt.style.cssText='font-size:10px;position:absolute;right:-0.42em;top:0.1em;line-height:1;';dt.textContent='\u00b7';numRow.appendChild(dt);}
    lw2.appendChild(numRow);
    if(uline===2){var u2=document.createElement('span');u2.style.cssText='position:absolute;bottom:0;left:0;right:0;height:1.5px;background:currentColor;';lw2.appendChild(u2);}
    w.appendChild(lw2);
    var botDot=document.createElement('span');botDot.style.cssText='font-size:7px;line-height:1;height:16px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;';
    if(isLow>=2)botDot.innerHTML='\u00b7<br>\u00b7';else if(isLow===1)botDot.textContent='\u00b7';
    w.appendChild(botDot);
    return w;
  }
  function makeTuplet(n){var w=document.createElement('span');w.className='jp-tuplet';var br=document.createElement('span');br.className='jp-tuplet-br';w.appendChild(br);var nm=document.createElement('span');nm.className='jp-tuplet-num';nm.textContent=String(n);w.appendChild(nm);return w;}
  function renderNStr(nStr){
    var d=document.createElement('div');d.className='sw-jianpu';
    if(!nStr||!nStr.trim())return d;
    var toks=nStr.trim().split(/\s+/),i=0;
    while(i<toks.length){
      var t=toks[i];
      if(t==='('){var sl=document.createElement('span');sl.className='jp-slur';i++;while(i<toks.length&&toks[i]!==')')sl.appendChild(parseJpToken(toks[i++]));d.appendChild(sl);i++;continue;}
      if(t==='(['){var so=document.createElement('span');so.className='jp-slur-open';i++;while(i<toks.length&&toks[i]!=='])')so.appendChild(parseJpToken(toks[i++]));if(i<toks.length)i++;d.appendChild(so);continue;}
      if(t==='])'){var sc=document.createElement('span');sc.className='jp-slur-close';i++;if(i<toks.length)sc.appendChild(parseJpToken(toks[i++]));d.appendChild(sc);continue;}
      if(t==='[v1'||t==='[v2'){var vn=(t==='[v1')?'1':'2';var vw=document.createElement('span');vw.className='jp-volta'+((t==='[v2')?' v-close':'');vw.setAttribute('data-v',vn+'.');i++;while(i<toks.length&&toks[i]!==']v')vw.appendChild(parseJpToken(toks[i++]));if(i<toks.length)i++;d.appendChild(vw);continue;}
      if(t===']v'){i++;continue;}
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
  function nIdx(n){return CHR.indexOf(ENH[n]||n);}
  function trNote(n,st){var i=nIdx(n);if(i<0)return n;var r=CHR[(i+st+12)%12];return FLT[r]||r;}
  function trS(c,st){var m=c.match(/^([A-G][b#]?)(.*)$/);if(!m)return c;return trNote(m[1],st)+m[2];}
  function trChord(c,st){if(!st)return c;var s=c.indexOf('/');if(s>-1)return trS(c.slice(0,s),st)+'/'+trS(c.slice(s+1),st);return trS(c,st);}
  function calcCapo(t,o){
    var st=(nIdx(t)-nIdx(o)+12)%12,best=null;
    ['C','D','E','F','G','A','B'].forEach(function(pk){var c=(nIdx(t)-nIdx(pk)+12)%12;if(c<=7&&(!best||c<best.capo))best={playKey:pk,capo:c};});
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
    var ytBtn = el('a',{class:'yt-btn',href:song.youtube||'#',target:'_blank',title:'YouTube',
      html:'<svg viewBox="0 0 24 24"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"></path></svg>'
    });

    var metroDiv = buildMetro(song.bpm || 80);
    var toolsRow = div('sw-tools-row',[ytBtn, metroDiv]);
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
      var info = calcCapo(curKey, song.origKey), st = info.st;
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
          var row=div('sw-lrow'+((!Array.isArray(line)&&line.b)?' bold':''));
          var segs=Array.isArray(line)?line:(line.line||[]);
          var voltaWrap=null;
          segs.forEach(function(seg){
            var s=div('sw-seg');
            var c=div('sw-chord'+(seg.chord?'':' empty'));
            if(seg.chord) c.textContent=trChord(seg.chord,st);
            s.appendChild(c);
            if(seg.n && seg.n.trim()) s.appendChild(renderNStr(seg.n));
            var l=div('sw-lyric'); l.textContent=seg.lyric||''; s.appendChild(l);
            if(seg.lyric2){var l2=div('sw-lyric sw-lyric2');l2.textContent=seg.lyric2;s.appendChild(l2);}
            var _vn=seg.n?(seg.n.indexOf('[v1')>=0?'1':seg.n.indexOf('[v2')>=0?'2':null):null;
            if(_vn){voltaWrap=document.createElement('span');voltaWrap.className='sw-volta';voltaWrap.setAttribute('data-v',_vn+'.');}
            (voltaWrap||row).appendChild(s);
            if(voltaWrap&&seg.n&&seg.n.indexOf(']v')>=0){voltaWrap.classList.add('closed');row.appendChild(voltaWrap);voltaWrap=null;}
          });
          if(voltaWrap)row.appendChild(voltaWrap);
          le.appendChild(row); se.appendChild(le);
        });
        lbDiv.appendChild(se);
      });
    }
    function fitRows(){
      requestAnimationFrame(function(){
        lbDiv.style.transform='';lbDiv.style.transformOrigin='';
        lbDiv.style.width='';lbDiv.style.marginBottom='';
        var avail=lbDiv.parentElement.clientWidth;
        if(!avail)return;
        var maxW=0;
        lbDiv.querySelectorAll('.sw-lrow').forEach(function(row){
          row.style.display='inline-flex';
          if(row.scrollWidth>maxW)maxW=row.scrollWidth;
          row.style.display='';
        });
        if(maxW>avail){
          var scale=avail/maxW;
          lbDiv.style.transform='scale('+scale+')';
          lbDiv.style.transformOrigin='left top';
          lbDiv.style.width=maxW+'px';
          var naturalH=lbDiv.offsetHeight;
          lbDiv.style.marginBottom=(naturalH*(scale-1))+'px';
          lbDiv.parentElement.style.overflow='hidden';
        } else {
          lbDiv.parentElement.style.overflow='';
        }
      });
    }
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

  /* ══════════════ APlayer ══════════════ */
  function buildAPlayer(song) {
    var d = div('');

    /* 核心初始化函数：直接调用 new APlayer()
       Halo 的插件只扫描 DOMContentLoaded 时已存在的元素，
       动态插入的元素必须我们自己 new APlayer() 来初始化。
       用 retry 机制等待 APlayer 库加载完成（Halo 用 defer 加载）。 */
    function initAPlayer(retries) {
      if (d._aplayer) return;                      // 已初始化，跳过

      if (window.APlayer) {
        try {
          d._aplayer = new APlayer({
            container : d,
            autoplay  : false,
            lrcType   : 3,
            audio     : [{
              name   : song.title,
              artist : song.artist  || '',
              url    : song.mp3     || '',
              cover  : song.cover   || '',
              lrc    : song.lrc     || '',
            }],
          });
        } catch(e) {
          console.warn('[YM] APlayer init error:', e);
        }
        return;
      }

      // APlayer 库还没加载好，最多重试 20 次（共等 2 秒）
      if ((retries || 0) < 20) {
        setTimeout(function(){ initAPlayer((retries||0)+1); }, 100);
      } else {
        console.warn('[YM] APlayer not found after retries, song:', song.title);
      }
    }

    // 插入 DOM 后再初始化（requestAnimationFrame 保证已挂载）
    setTimeout(function(){ initAPlayer(0); }, 0);

    return d;
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
