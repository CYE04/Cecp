/* ✦ Designed & Built by YuEn © 2025–2026 ✦ */

/* musictool.js — 音乐工具箱*/
(function(){
'use strict';

/* ── 注入 HTML ── */
const root = document.getElementById('music-toolbox');
if(!root) return;

root.innerHTML = `
<!-- HUB -->
<div class="mt-hub" id="mt-hub">
  <div class="mt-hub-title">
    <h1>音 乐 工 具 箱</h1>
    <p>MUSIC TOOLS · 赞美诗工作站</p>
  </div>
  <div class="mt-tool-grid">
    <div class="mt-tool-card c1" id="mt-card-lrc">
      <div class="mt-tool-icon">🎵</div>
      <div class="mt-tool-name">歌词编辑器</div>
      <div class="mt-tool-desc">LRC 时间轴打轴<br>导入 / 导出 .lrc 文件</div>
      <div class="mt-tool-arrow">OPEN →</div>
    </div>
    <div class="mt-tool-card c2" id="mt-card-jf">
      <div class="mt-tool-icon">♩</div>
      <div class="mt-tool-name">简谱编辑器</div>
      <div class="mt-tool-desc">音符输入 · 和弦标注<br>导出 JSON 文件</div>
      <div class="mt-tool-arrow">OPEN →</div>
    </div>
  </div>
</div>

<!-- TOOLVIEW -->
<div class="mt-toolview" id="mt-toolview">
  <div class="mt-topbar">
    <button class="mt-back" id="mt-back">← 返回</button>
    <span class="mt-nav-label">工具箱 /</span>
    <span class="mt-nav-name" id="mt-nav-name"></span>
    <button class="mt-help-btn" id="mt-help-btn" title="使用教程">?</button>
  </div>
  <div class="mt-body">

    <!-- LRC -->
    <div class="mt-panel" id="mt-panel-lrc">
      <audio id="mt-audio"></audio>
      <div class="mt-lrc-top">
        <div class="mt-lrc-progbar" id="mt-progbar">
          <div class="mt-lrc-progfill" id="mt-progfill"></div>
        </div>
        <div class="mt-lrc-controls">
          <span class="mt-lrc-time" id="mt-time">[00:00.00]</span>
          <button class="mt-play-btn" id="mt-playbtn">▶</button>
          <div class="mt-vol-wrap">
            <span class="mt-vol-label">音量</span>
            <input type="range" class="mt-vol-range" id="mt-vol" min="0" max="1" step="0.01" value="1">
          </div>
        </div>
      </div>
      <div class="mt-lrc-body">
        <div class="mt-lrc-left">
          <button class="mt-side-btn" id="mt-btn-music">⬆ 上传音乐</button>
          <input type="file" id="mt-music-file" accept="audio/*" style="display:none">
          <button class="mt-side-btn" id="mt-btn-lyric">⬆ 上传歌词</button>
          <input type="file" id="mt-lyric-file" accept=".lrc,.txt" style="display:none">
          <button class="mt-side-btn" id="mt-btn-create">📄 创建歌词</button>
          <button class="mt-side-btn" id="mt-btn-dl">⬇ 下载歌词</button>
        </div>
        <div class="mt-lrc-center" id="mt-lrc-center">
          <div class="mt-info-row">
            <div class="mt-info-dot"></div>
            <button class="mt-info-btn" id="mt-btn-info">add info</button>
          </div>
          <div id="mt-lines"></div>
        </div>
        <div class="mt-lrc-right">
          <div>
            <span class="mt-r-label">偏移</span>
            <div class="mt-offset-row">
              <input type="number" class="mt-offset-inp" id="mt-offset" value="0" step="0.1">
              <span class="mt-offset-unit">s</span>
            </div>
            <button class="mt-apply-btn" id="mt-btn-offset">应用偏移</button>
          </div>
          <div>
            <span class="mt-r-label">同步滚动</span>
            <div class="mt-toggle-row">
              <div class="mt-toggle on" id="mt-toggle"></div>
              <span class="mt-toggle-lbl" id="mt-toggle-lbl">开</span>
            </div>
          </div>
          <button class="mt-add-end-btn" id="mt-btn-addend">+ 新增歌词</button>
        </div>
      </div>
    </div>

    <!-- 简谱 iframe -->
    <div class="mt-panel mt-panel-jf" id="mt-panel-jf">
      <iframe id="mt-jf-iframe" src="" title="简谱编辑器"></iframe>
    </div>
  </div>
</div>

<!-- Modal: info -->
<div class="mt-modal-overlay" id="mt-modal-info">
  <div class="mt-modal-box">
    <div class="mt-modal-title">Add Info · 歌曲信息</div>
    <div class="mt-modal-row"><label>歌手 Artist</label><input class="mt-modal-inp" id="mt-meta-ar" placeholder="赞美之泉"></div>
    <div class="mt-modal-row"><label>歌名 Title</label><input class="mt-modal-inp" id="mt-meta-ti" placeholder="展开清晨的翅膀"></div>
    <div class="mt-modal-row"><label>专辑 Album</label><input class="mt-modal-inp" id="mt-meta-al"></div>
    <div class="mt-modal-row"><label>制作 By</label><input class="mt-modal-inp" id="mt-meta-by"></div>
    <div class="mt-modal-footer">
      <button class="mt-modal-ok" id="mt-info-ok">确定</button>
      <button class="mt-modal-cancel" id="mt-info-cancel">取消</button>
    </div>
  </div>
</div>

<!-- Modal: create -->
<div class="mt-modal-overlay" id="mt-modal-create">
  <div class="mt-modal-box">
    <div class="mt-modal-title">创建歌词 · 每行一句</div>
    <textarea class="mt-modal-ta" id="mt-create-ta" placeholder="第一行歌词&#10;第二行歌词&#10;第三行歌词"></textarea>
    <div class="mt-modal-footer">
      <button class="mt-modal-ok" id="mt-create-ok">创建</button>
      <button class="mt-modal-cancel" id="mt-create-cancel">取消</button>
    </div>
  </div>
</div>

<!-- 教程弹窗 -->
<div class="mt-tut-overlay" id="mt-tut">
  <div class="mt-tut-box">
    <button class="mt-tut-close" id="mt-tut-close">✕</button>
    <div class="mt-tut-icon" id="mt-tut-icon">🎵</div>
    <div class="mt-tut-step-label" id="mt-tut-step-label">步骤 1 / 4</div>
    <div class="mt-tut-title" id="mt-tut-title"></div>
    <div class="mt-tut-desc" id="mt-tut-desc"></div>
    <div class="mt-tut-items" id="mt-tut-items"></div>
    <div class="mt-tut-footer">
      <div class="mt-tut-dots" id="mt-tut-dots"></div>
      <div class="mt-tut-btns">
        <button class="mt-tut-nevershow" id="mt-tut-never">以后不再显示</button>
        <button class="mt-tut-skip" id="mt-tut-skip">跳过</button>
        <button class="mt-tut-next" id="mt-tut-next">下一步 →</button>
      </div>
    </div>
  </div>
</div>
`;

/* ── 路由 ── */
const hub      = $('mt-hub');
const toolview = $('mt-toolview');
const navName  = $('mt-nav-name');
const panels   = { lrc: $('mt-panel-lrc'), jf: $('mt-panel-jf') };

function $(id){ return document.getElementById(id); }

const jianpuHTML = `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>简谱编辑器</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Noto+Serif+SC:wght@400;700&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#0e0e10;--panel:#18181c;--panel2:#222228;
  --border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.14);
  --ink:rgba(255,255,255,0.88);--ink2:rgba(255,255,255,0.44);--ink3:rgba(255,255,255,0.18);
  --accent:#7c6af7;--accent2:#a89af9;--red:#f27c6a;--green:#6af2a8;--sel:#f0c040;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--ink);font-family:'Space Mono',monospace;height:100vh;overflow:hidden;display:flex;flex-direction:column;}

.topbar{padding:10px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;flex-shrink:0;}
.dot{width:6px;height:6px;border-radius:50%;background:var(--accent);box-shadow:0 0 8px var(--accent);}
.topbar-title{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--ink2);}
.topbar-title span{color:var(--accent2);}
.topbar-tabs{display:flex;gap:2px;margin-left:auto;}
.top-tab{padding:5px 12px;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;border:1px solid var(--border);border-radius:5px;background:transparent;color:var(--ink2);font-family:'Space Mono',monospace;transition:.12s;}
.top-tab.on{background:var(--accent);color:#fff;border-color:var(--accent);}

.top-area{flex:1;overflow:hidden;display:flex;flex-direction:column;min-height:0;}
.top-panel{flex:1;overflow-y:auto;padding:14px 16px;display:none;}
.top-panel.on{display:block;}

.bottom-area{height:52vh;display:flex;flex-shrink:0;border-top:1px solid var(--border2);}

/* ── 左：段落编辑 ── */
.seg-pane{width:54%;border-right:1px solid var(--border);overflow-y:auto;display:flex;flex-direction:column;}
.seg-pane-inner{padding:8px;flex:1;}
.sec-block{border:1px solid var(--border);border-radius:8px;margin-bottom:8px;overflow:hidden;}
.sec-head{display:flex;align-items:center;gap:6px;padding:6px 10px;background:var(--panel2);border-bottom:1px solid var(--border);}
.sec-name-input{background:transparent;border:none;color:var(--ink);font-family:'Space Mono',monospace;font-size:11px;font-weight:700;outline:none;flex:1;}
.sec-btn{font-size:9px;padding:2px 7px;border-radius:4px;border:1px solid var(--border2);background:transparent;color:var(--ink2);cursor:pointer;font-family:'Space Mono',monospace;}
.sec-btn:hover{background:var(--border);color:var(--ink);}
.sec-btn.del{color:var(--red);}
.row-block{border-bottom:1px solid var(--border);padding:6px 10px;}
.row-block:last-child{border-bottom:none;}
.row-meta{display:flex;align-items:center;gap:6px;margin-bottom:4px;}
.row-idx{font-size:8px;color:var(--ink3);}
.bold-toggle{display:flex;align-items:center;gap:3px;font-size:9px;color:var(--ink2);cursor:pointer;}
.bold-toggle input{accent-color:var(--accent);}
.row-del{margin-left:auto;background:none;border:none;color:var(--ink3);cursor:pointer;font-size:11px;}
.row-del:hover{color:var(--red);}

.seg-table{width:100%;border-collapse:collapse;}
.seg-table th{font-size:7px;color:var(--ink3);padding:2px 3px;text-align:left;letter-spacing:1px;border-bottom:1px solid var(--border);}
.seg-table td{padding:1px 2px;vertical-align:middle;}
.seg-table input{background:var(--panel2);border:1px solid var(--border);border-radius:3px;color:var(--ink);font-family:'Space Mono',monospace;font-size:10px;padding:2px 4px;outline:none;transition:border-color .12s;width:100%;}
.seg-table input:focus{border-color:var(--accent);}
.inp-chord{max-width:62px;}
.inp-lyric{max-width:80px;}
.btn-del-seg{background:none;border:none;color:var(--ink3);cursor:pointer;font-size:11px;}
.btn-del-seg:hover{color:var(--red);}
.drag-handle{cursor:grab;color:var(--ink3);font-size:11px;padding:0 2px;user-select:none;}
.drag-handle:hover{color:var(--ink2);}
.seg-row{transition:opacity .15s;}
.seg-row.dragging{opacity:0.35;}
.seg-row.drag-over{border-left:2px solid var(--accent);}
.btn-add-seg{font-size:9px;color:var(--accent2);background:none;border:none;cursor:pointer;margin-top:4px;font-family:'Space Mono',monospace;}
.add-row-btn{width:100%;padding:5px;border-radius:5px;border:1px dashed rgba(106,242,168,0.3);background:transparent;font-family:'Space Mono',monospace;font-size:9px;color:var(--green);cursor:pointer;margin-top:5px;}
.add-row-btn:hover{background:rgba(106,242,168,0.06);border-color:var(--green);}
.add-sec-btn{width:calc(100% - 16px);padding:5px;border-radius:5px;border:1px dashed var(--border2);background:transparent;font-family:'Space Mono',monospace;font-size:9px;color:var(--accent2);cursor:pointer;margin:6px 8px;display:block;}

/* ── 右：键盘 ── */
.kbd-pane{width:46%;overflow-y:auto;padding:10px;}

/* 状态栏 */
.kbd-status{display:flex;align-items:center;gap:6px;padding:5px 8px;background:var(--panel2);border-radius:5px;border:1px solid var(--border);margin-bottom:8px;min-height:28px;}
.kbd-status-loc{font-size:9px;color:var(--ink2);white-space:nowrap;}
.kbd-status-sel{font-size:9px;color:var(--sel);margin-left:4px;white-space:nowrap;}
.kbd-status-tip{font-size:8px;color:var(--ink3);margin-left:auto;}

.kbd-label{font-size:7px;letter-spacing:2px;text-transform:uppercase;color:var(--ink3);margin-bottom:4px;}
.kbd-row{display:flex;gap:4px;flex-wrap:wrap;}
.kbd-btn{font-family:'Space Mono',monospace;font-size:10px;padding:5px 8px;border-radius:5px;border:1px solid var(--border2);background:var(--panel2);color:var(--ink2);cursor:pointer;transition:all .1s;min-width:30px;text-align:center;line-height:1;}
.kbd-btn:hover{background:var(--panel);color:var(--ink);border-color:var(--accent);}
.kbd-btn.on{background:var(--accent);color:#fff;border-color:var(--accent);box-shadow:0 0 8px rgba(124,106,247,0.4);}
.kbd-btn.action{color:var(--red);border-color:rgba(242,124,106,0.25);}
.kbd-btn.action:hover{background:rgba(242,124,106,0.1);}
.kbd-btn.slur-btn{color:var(--green);border-color:rgba(106,242,168,0.25);}
.kbd-btn.slur-btn:hover{background:rgba(106,242,168,0.08);}
.kbd-btn.slur-btn.on{background:var(--green);color:#000;border-color:var(--green);}
.shortcut{font-size:7px;opacity:0.4;display:block;margin-top:1px;}

/* 九宫格 */
.numpad{display:grid;grid-template-columns:repeat(3,44px);gap:4px;}
.numpad .kbd-btn{font-size:16px;font-weight:700;padding:9px 0;width:44px;color:var(--ink);min-width:0;}
.numpad .kbd-btn:hover{color:var(--accent2);}
.kbd-btn.zero{font-size:14px;font-weight:700;color:var(--ink);width:100%;margin-top:4px;}

/* ── token 格子 ── */
.tok-field{background:var(--panel2);border:1px solid var(--border);border-radius:3px;color:var(--ink);font-family:'Space Mono',monospace;font-size:10px;padding:2px 4px;min-height:22px;display:flex;flex-wrap:wrap;gap:2px;align-items:center;cursor:pointer;width:100%;box-sizing:border-box;}
.tok-field.n-active{border-color:var(--accent);}
.tok-chip{padding:1px 4px;border-radius:2px;cursor:pointer;white-space:nowrap;user-select:none;}
.tok-chip:hover{background:var(--border2);}
/* 选中 = 黄色高亮 */
.tok-chip.sel{background:var(--sel);color:#000;}
/* 插入游标：在选中起点前显示绿竖线 */
.tok-chip.cursor{border-left:2px solid var(--green);}
.tok-chip.sel.cursor{border-left:2px solid #000;}
/* 末尾游标 */
.tok-end{color:var(--ink3);cursor:pointer;font-size:8px;padding:1px 3px;user-select:none;}
.tok-end.cursor{color:var(--green);}

/* ── 导入弹窗 ── */
.import-overlay{display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.75);align-items:center;justify-content:center;}
.import-overlay.open{display:flex;}
.import-box{background:var(--panel);border:1px solid var(--border2);border-radius:14px;padding:18px;width:520px;max-width:95vw;}
.import-box textarea{width:100%;height:180px;background:var(--bg);border:1px solid var(--border2);border-radius:6px;color:var(--ink);font-family:'Space Mono',monospace;font-size:10px;padding:8px;resize:vertical;outline:none;line-height:1.6;}
.import-box textarea:focus{border-color:var(--accent);}
.import-btns{display:flex;gap:8px;margin-top:10px;}
.import-ok{flex:1;padding:8px;border-radius:6px;border:none;background:var(--accent);color:#fff;font-family:'Space Mono',monospace;font-size:10px;cursor:pointer;letter-spacing:1px;}
.import-ok:hover{opacity:.85;}
.import-cancel{padding:8px 16px;border-radius:6px;border:1px solid var(--border2);background:transparent;color:var(--ink2);font-family:'Space Mono',monospace;font-size:10px;cursor:pointer;}
.import-label{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--ink3);margin-bottom:8px;}
.import-err{font-size:9px;color:var(--red);margin-top:6px;min-height:14px;}

.code-box{background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;font-size:10px;color:var(--ink2);white-space:pre;overflow-x:auto;max-height:100%;line-height:1.8;}
.copy-btn{margin-top:8px;width:100%;padding:8px;border-radius:6px;border:1px solid var(--border2);background:var(--panel2);color:var(--ink);font-family:'Space Mono',monospace;font-size:10px;cursor:pointer;letter-spacing:1px;}
.copy-btn:hover{background:var(--accent);border-color:var(--accent);}

/* 预览 */
.prev-sec{margin-bottom:20px;}
.prev-sec-name{font-size:8px;letter-spacing:2px;text-transform:uppercase;color:var(--ink3);margin-bottom:8px;display:flex;align-items:center;gap:8px;}
.prev-sec-name::after{content:'';flex:1;height:1px;background:var(--border);}
.prev-row{display:flex;flex-wrap:nowrap;align-items:flex-end;margin-bottom:10px;overflow-x:auto;padding-bottom:2px;}
.prev-seg{display:inline-flex;flex-direction:column;align-items:flex-start;margin-right:2px;flex-shrink:0;}
.p-chord{font-family:'Space Mono',monospace;font-size:10px;font-weight:700;color:var(--accent2);margin-bottom:2px;min-height:13px;white-space:nowrap;}
.p-chord.empty{visibility:hidden;}
.p-n{font-family:'Space Mono',monospace;color:var(--ink);margin-bottom:1px;line-height:1.2;display:flex;align-items:flex-end;}
.p-lyric{font-family:'Noto Serif SC',serif;font-size:15px;color:var(--ink2);}
.p-lyric.bold{font-weight:700;color:var(--ink);}

/* 音符结构 */
.jp-wrap{display:inline-flex;flex-direction:column;align-items:center;vertical-align:bottom;min-width:1em;}
.jp-plain{display:inline-flex;flex-direction:column;align-items:center;vertical-align:bottom;min-width:1em;}
.jp-plain-top{height:12px;}.jp-plain-sym{font-size:15px;line-height:1;text-align:center;}.jp-plain-bot{height:16px;}
.jp-dot-top,.jp-dot-bot{width:1em;font-size:7px;line-height:1;color:var(--ink);text-align:center;display:flex;flex-direction:column;align-items:center;}
.jp-dot-top{height:12px;justify-content:flex-end;}.jp-dot-bot{height:12px;justify-content:flex-start;}
.jp-lines-wrap{width:1em;display:inline-flex;flex-direction:column;align-items:stretch;padding-bottom:4px;position:relative;}
.jp-num-row{width:1em;display:inline-flex;align-items:center;justify-content:center;position:relative;}
.jp-num{font-size:15px;line-height:1;display:inline-block;text-align:center;width:1em;}
.jp-aug{position:absolute;right:-0.42em;top:0.1em;font-size:10px;line-height:1;pointer-events:none;}
.jp-u2-line{position:absolute;bottom:0;left:0;right:0;height:1.5px;background:var(--ink);}
.jp-slur{display:inline-flex;align-items:flex-end;position:relative;padding-top:18px;}
.jp-slur::before{content:'';position:absolute;top:2px;left:15%;right:15%;height:8px;border-top:1.5px solid var(--ink);border-left:1.5px solid var(--ink);border-right:1.5px solid var(--ink);border-radius:50% 50% 0 0/100% 100% 0 0;}
.jp-slur-open{display:inline-flex;align-items:flex-end;position:relative;padding-top:18px;}
.jp-slur-open::before{content:'';position:absolute;top:2px;left:15%;right:-4px;height:8px;border-top:1.5px solid var(--ink);border-left:1.5px solid var(--ink);border-radius:50% 0 0 0/100% 0 0 0;}
.jp-slur-close{display:inline-flex;align-items:flex-end;position:relative;padding-top:18px;}
.jp-slur-close::before{content:'';position:absolute;top:2px;left:-4px;right:15%;height:8px;border-top:1.5px solid var(--ink);border-right:1.5px solid var(--ink);border-radius:0 50% 0 0/0 100% 0 0;}
.jp-tuplet{display:inline-flex;align-items:flex-end;position:relative;padding-top:18px;margin-right:1px;}
.jp-tuplet-br{position:absolute;top:2px;left:2px;right:2px;height:8px;border-top:1.5px solid var(--ink);border-left:1.5px solid var(--ink);border-right:1.5px solid var(--ink);border-radius:3px 3px 0 0;pointer-events:none;}
.jp-tuplet-num{position:absolute;top:-1px;left:50%;transform:translateX(-50%);font-size:8px;line-height:1;padding:0 3px;background:var(--bg);color:var(--ink);pointer-events:none;}
</style>
</head>
<body>

<div class="topbar">
  <div class="dot"></div>
  <div class="topbar-title">简谱编辑器 <span>v2.9</span></div>
  <div class="topbar-tabs">
    <button class="top-tab" onclick="openImport()">导入</button>
    <button class="top-tab on" onclick="switchTop('preview',this)">预览</button>
    <button class="top-tab" onclick="switchTop('code',this)">代码</button>
  </div>
</div>

<div class="import-overlay" id="importOverlay">
  <div class="import-box">
    <div class="import-label">粘贴 简谱数组代码（[ ... ] 或 var SECTIONS = [...]）</div>
    <textarea id="importTA" placeholder="sections: [&#10;  { name: '主歌', lines: [ ... ] },&#10;],"></textarea>
    <div class="import-err" id="importErr"></div>
    <div class="import-btns">
      <button class="import-ok" onclick="doImport()">导入</button>
      <button class="import-cancel" onclick="closeImport()">取消</button>
    </div>
  </div>
</div>

<div class="top-area">
  <div class="top-panel on" id="top-preview"><div id="previewWrap"></div></div>
  <div class="top-panel" id="top-code">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;">
      <label style="font-size:9px;color:var(--ink2);font-family:'Space Mono',monospace;letter-spacing:1px;">ID（文件名）
        <input id="meta-id" placeholder="zmzq-shunfu" style="width:100%;margin-top:3px;padding:5px 7px;border-radius:5px;border:1px solid var(--border);background:var(--panel2);color:var(--ink);font-size:11px;font-family:'Space Mono',monospace;">
      </label>
      <label style="font-size:9px;color:var(--ink2);font-family:'Space Mono',monospace;letter-spacing:1px;">歌名
        <input id="meta-title" placeholder="顺服" style="width:100%;margin-top:3px;padding:5px 7px;border-radius:5px;border:1px solid var(--border);background:var(--panel2);color:var(--ink);font-size:11px;font-family:'Space Mono',monospace;">
      </label>
      <label style="font-size:9px;color:var(--ink2);font-family:'Space Mono',monospace;letter-spacing:1px;">艺人
        <input id="meta-artist" placeholder="赞美之泉" style="width:100%;margin-top:3px;padding:5px 7px;border-radius:5px;border:1px solid var(--border);background:var(--panel2);color:var(--ink);font-size:11px;font-family:'Space Mono',monospace;">
      </label>
      <label style="font-size:9px;color:var(--ink2);font-family:'Space Mono',monospace;letter-spacing:1px;">副标题 / 词曲
        <input id="meta-sub" placeholder="余盈盈 词曲" style="width:100%;margin-top:3px;padding:5px 7px;border-radius:5px;border:1px solid var(--border);background:var(--panel2);color:var(--ink);font-size:11px;font-family:'Space Mono',monospace;">
      </label>
      <label style="font-size:9px;color:var(--ink2);font-family:'Space Mono',monospace;letter-spacing:1px;">原调
        <input id="meta-key" placeholder="A" style="width:100%;margin-top:3px;padding:5px 7px;border-radius:5px;border:1px solid var(--border);background:var(--panel2);color:var(--ink);font-size:11px;font-family:'Space Mono',monospace;">
      </label>
      <label style="font-size:9px;color:var(--ink2);font-family:'Space Mono',monospace;letter-spacing:1px;">BPM
        <input id="meta-bpm" placeholder="72" type="number" style="width:100%;margin-top:3px;padding:5px 7px;border-radius:5px;border:1px solid var(--border);background:var(--panel2);color:var(--ink);font-size:11px;font-family:'Space Mono',monospace;">
      </label>
      <label style="grid-column:1/-1;font-size:9px;color:var(--ink2);font-family:'Space Mono',monospace;letter-spacing:1px;">YouTube 链接
        <input id="meta-youtube" placeholder="https://youtu.be/..." style="width:100%;margin-top:3px;padding:5px 7px;border-radius:5px;border:1px solid var(--border);background:var(--panel2);color:var(--ink);font-size:11px;font-family:'Space Mono',monospace;">
      </label>
      <label style="grid-column:1/-1;font-size:9px;color:var(--ink2);font-family:'Space Mono',monospace;letter-spacing:1px;">封面图 cover <span style="color:var(--ink3);font-weight:normal;">（图片 URL）</span>
        <input id="meta-cover" placeholder="https://..." style="width:100%;margin-top:3px;padding:5px 7px;border-radius:5px;border:1px solid var(--border);background:var(--panel2);color:var(--ink);font-size:11px;font-family:'Space Mono',monospace;">
      </label>
      <label style="grid-column:1/-1;font-size:9px;color:var(--ink2);font-family:'Space Mono',monospace;letter-spacing:1px;">歌词文件 lrc <span style="color:var(--ink3);font-weight:normal;">（.lrc 文件 URL）</span>
        <input id="meta-lrc" placeholder="https://..." style="width:100%;margin-top:3px;padding:5px 7px;border-radius:5px;border:1px solid var(--border);background:var(--panel2);color:var(--ink);font-size:11px;font-family:'Space Mono',monospace;">
      </label>
      <label style="grid-column:1/-1;font-size:9px;color:var(--ink2);font-family:'Space Mono',monospace;letter-spacing:1px;">乐谱图 scoreImg <span style="color:var(--ink3);font-weight:normal;">（图片 URL）</span>
        <input id="meta-scoreimg" placeholder="https://..." style="width:100%;margin-top:3px;padding:5px 7px;border-radius:5px;border:1px solid var(--border);background:var(--panel2);color:var(--ink);font-size:11px;font-family:'Space Mono',monospace;">
      </label>
    </div>
    <div class="code-box" id="codeBox"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px;">
      <button class="copy-btn" onclick="copyCode()" style="margin-top:0;">复制 sections 数组</button>
      <button class="copy-btn" onclick="copyFullJson()" style="margin-top:0;background:var(--accent);border-color:var(--accent);color:#fff;">复制完整 JSON 文件</button>
    </div>
  </div>
</div>

<div class="bottom-area">
  <div class="seg-pane">
    <div class="seg-pane-inner" id="sectionsWrap"></div>
    <button class="add-sec-btn" onclick="addSection()">+ 新增段落</button>
  </div>

  <div class="kbd-pane">

    <!-- 状态栏 -->
    <div class="kbd-status">
      <span class="kbd-status-loc" id="statusLoc">点击左边格子开始编辑</span>
      <span class="kbd-status-sel" id="statusSel"></span>
      <span class="kbd-status-tip" id="statusTip"></span>
    </div>

    <!-- 八度 + 音值 + 模式 -->
    <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
      <div>
        <div class="kbd-label">八度 <span style="color:var(--ink3);font-size:7px;">↑↓</span></div>
        <div class="kbd-row">
          <button class="kbd-btn" id="oct-low2" onclick="setOct('low2')" style="padding:5px 5px;min-width:24px;font-size:9px;">低2</button>
          <button class="kbd-btn" id="oct-low1" onclick="setOct('low1')" style="padding:5px 5px;min-width:24px;font-size:9px;">低1</button>
          <button class="kbd-btn on" id="oct-mid"  onclick="setOct('mid')"  style="padding:5px 5px;min-width:24px;font-size:9px;">中</button>
          <button class="kbd-btn" id="oct-high1" onclick="setOct('high1')" style="padding:5px 5px;min-width:24px;font-size:9px;">高1</button>
          <button class="kbd-btn" id="oct-high2" onclick="setOct('high2')" style="padding:5px 5px;min-width:24px;font-size:9px;">高2</button>
        </div>
      </div>
      <div>
        <div class="kbd-label">音值 <span style="color:var(--ink3);font-size:7px;">Q W E R T</span></div>
        <div class="kbd-row">
          <button class="kbd-btn" id="dur-whole"   onclick="setDur('whole')"   style="padding:5px 5px;min-width:26px;font-size:9px;">全<span class="shortcut">Q</span></button>
          <button class="kbd-btn" id="dur-half"    onclick="setDur('half')"    style="padding:5px 5px;min-width:26px;font-size:9px;">½<span class="shortcut">W</span></button>
          <button class="kbd-btn on" id="dur-quarter" onclick="setDur('quarter')" style="padding:5px 5px;min-width:26px;font-size:9px;">¼<span class="shortcut">E</span></button>
          <button class="kbd-btn" id="dur-eighth"  onclick="setDur('eighth')"  style="padding:5px 5px;min-width:26px;font-size:9px;">⅛<span class="shortcut">R</span></button>
          <button class="kbd-btn" id="dur-16th"    onclick="setDur('16th')"    style="padding:5px 5px;min-width:26px;font-size:9px;">¹⁄₁₆<span class="shortcut">T</span></button>
        </div>
      </div>
      <div>
        <div class="kbd-label">输入模式 <span style="color:var(--ink3);font-size:7px;">I / O</span></div>
        <div class="kbd-row">
          <button class="kbd-btn on" id="mode-insert"    onclick="setInputMode('insert')"    style="padding:5px 6px;font-size:9px;">插入 I</button>
          <button class="kbd-btn"    id="mode-overwrite" onclick="setInputMode('overwrite')" style="padding:5px 6px;font-size:9px;">覆盖 O</button>
        </div>
      </div>
    </div>

    <!-- 九宫格 + 功能 -->
    <div style="display:flex;gap:12px;align-items:flex-start;">
      <div>
        <div class="kbd-label">音符 <span style="color:var(--ink3);font-size:7px;">键盘数字</span></div>
        <div class="numpad">
          <button class="kbd-btn" onclick="inputNote(1)">1</button>
          <button class="kbd-btn" onclick="inputNote(2)">2</button>
          <button class="kbd-btn" onclick="inputNote(3)">3</button>
          <button class="kbd-btn" onclick="inputNote(4)">4</button>
          <button class="kbd-btn" onclick="inputNote(5)">5</button>
          <button class="kbd-btn" onclick="inputNote(6)">6</button>
          <button class="kbd-btn" onclick="inputNote(7)" style="grid-column:span 3;max-width:44px;">7</button>
        </div>
        <button class="kbd-btn zero" onclick="inputNote(0)">0 休止</button>
      </div>

      <div style="flex:1;">
        <div class="kbd-label">功能 <span style="color:var(--ink3);font-size:7px;">\\=延 ,=附点 [=连音</span></div>
        <div class="kbd-row">
          <button class="kbd-btn" onclick="inputSpecial('-')" style="padding:5px 6px;">— 延音<span class="shortcut">\\</span></button>
          <button class="kbd-btn" id="dot-btn" onclick="toggleDot()" style="padding:5px 6px;">· 附点<span class="shortcut">,</span></button>
          <button class="kbd-btn" onclick="appendTok(buildSpacerTok())" style="padding:5px 6px;">␣ 空格<span class="shortcut">Space</span></button>
          <button class="kbd-btn slur-btn" id="slur-btn" onclick="toggleSlur()" style="padding:5px 6px;">( ) 连音<span class="shortcut">[</span></button>
          <button class="kbd-btn slur-btn" id="xslur-btn" onclick="toggleXSlur()" style="padding:5px 6px;">跨线开<span class="shortcut">]</span></button>
          <button class="kbd-btn slur-btn" onclick="closeXSlur()" style="padding:5px 6px;">跨线结</button>
          <button class="kbd-btn slur-btn" id="t3-btn" onclick="toggleTuplet(3)" style="padding:5px 6px;">3连</button>
          <button class="kbd-btn slur-btn" id="t5-btn" onclick="toggleTuplet(5)" style="padding:5px 6px;">5连</button>
          <button class="kbd-btn action" onclick="deleteSelected()" style="padding:5px 6px;">⌫ 删除<span class="shortcut">Bksp</span></button>
          <button class="kbd-btn action" onclick="undoAction()" style="padding:5px 6px;">↩ 撤销<span class="shortcut">⌘Z</span></button>
          <button class="kbd-btn action" onclick="clearN()" style="padding:5px 6px;">✕ 清空</button>
          <button class="kbd-btn" onclick="copySeg()" style="padding:5px 6px;color:var(--green);border-color:rgba(106,242,168,0.25);" title="复制整格 (Alt+C)">⬡ 复制格<span class="shortcut">Alt+C</span></button>
          <button class="kbd-btn" onclick="pasteSeg()" style="padding:5px 6px;color:var(--green);border-color:rgba(106,242,168,0.25);" title="粘贴到后面 (Alt+V)">⬡ 粘贴格<span class="shortcut">Alt+V</span></button>
          <button class="kbd-btn" onclick="pasteSegReplace()" style="padding:5px 6px;color:var(--green);border-color:rgba(106,242,168,0.25);" title="覆盖当前格 (Alt+R)">⬡ 覆盖格<span class="shortcut">Alt+R</span></button>
        </div>
      </div>
    </div>

  </div>
</div>

<script>
/* ════════════════════════════════════════
   数据
════════════════════════════════════════ */
var data=[
  {name:'前奏',lines:[
    {bold:false,segs:[
      {chord:'E',    n:"0_ 5_",           lyric:""},
      {chord:"",     n:"1'_ 2'_",         lyric:""},
      {chord:'E/G#', n:"3' 5'",           lyric:""},
      {chord:"",     n:"",                lyric:"｜"},
      {chord:'A',    n:"6 - - -",         lyric:""},
      {chord:"",     n:"",                lyric:"｜"},
      {chord:'E',    n:"0_ 5_",           lyric:""},
      {chord:"",     n:"1'_ 2'_",         lyric:""},
      {chord:"",     n:"3' 5'",           lyric:""},
      {chord:"",     n:"",                lyric:"｜"},
      {chord:'A',    n:"6 - -",           lyric:""},
    ]}
  ]},
  {name:'主歌',lines:[
    {bold:false,segs:[
      {chord:"",     n:"3_ 4_",           lyric:"主你"},
      {chord:"",     n:"",                lyric:"｜"},
      {chord:'E',    n:"5 ( 3_ 2_ )",     lyric:"使卑"},
      {chord:'E/G#', n:"1 ( 7,_ 1_ )",    lyric:"微转"},
      {chord:"",     n:"",                lyric:"｜"},
      {chord:'A',    n:"1 6, 5, 5,_ 5,_", lyric:"为尊贵,是伤"},
      {chord:"",     n:"",                lyric:"|"},
      {chord:'E/G#', n:"1 3 5 ( 3_ 2_ )", lyric:"心流泪转"},
      {chord:"",     n:"",                lyric:"|"},
    ]},
    {bold:false,segs:[
      {chord:'A',    n:"1 3",             lyric:"为笑"},
      {chord:'B',    n:"2 3_ 4_",         lyric:"颜.患难"},
      {chord:"",     n:"",                lyric:"｜"},
    ]},
  ]},
];

/* ════════════════════════════════════════
   编辑器状态
════════════════════════════════════════ */
var curSi=-1, curLi=-1, curGi=-1;
// 游标位置（插入点）：-1 = 末尾，>=0 = 在 curTok 前面插入
var curTok=-1;
// 多选范围（含）：selA 是锚点，selB 是终点
var selA=-1, selB=-1;

var oct='mid', dur='quarter', dotOn=false, slurOn=false, xslurOn=false, tupletOn=0;
var inputMode='insert';
var tokClipboard=[]; // 存 token 数组
var segClipboard=null; // 存整格子

/* ════════════════════════════════════════
   撤销
════════════════════════════════════════ */
var undoStack=[];
function saveUndo(){
  undoStack.push(JSON.stringify({d:data,si:curSi,li:curLi,gi:curGi,ct:curTok,sa:selA,sb:selB}));
  if(undoStack.length>80)undoStack.shift();
}
function undoAction(){
  if(!undoStack.length)return;
  var s=JSON.parse(undoStack.pop());
  data=s.d; curSi=s.si; curLi=s.li; curGi=s.gi; curTok=s.ct; selA=s.sa; selB=s.sb;
  renderEditor();
  if(curSi>=0)reactivate();
}

/* ════════════════════════════════════════
   工具函数
════════════════════════════════════════ */
function getToks(){
  if(curSi<0)return[];
  var n=data[curSi].lines[curLi].segs[curGi].n;
  return(n&&n.trim())?n.trim().split(/\\s+/):[];
}
function setToks(toks){
  data[curSi].lines[curLi].segs[curGi].n=toks.join(' ');
}
function getSelRange(){
  if(selA<0||selB<0)return null;
  return{lo:Math.min(selA,selB),hi:Math.max(selA,selB)};
}
function clearSel(){selA=-1;selB=-1;}
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;');}

/* ════════════════════════════════════════
   选择操作
════════════════════════════════════════ */
function clickToken(ti, shiftKey){
  if(shiftKey && selA>=0){
    // 扩展选区
    selB=ti;
  } else {
    // 新选区，单选
    selA=ti; selB=ti;
  }
  curTok=ti; // 游标跟随
  renderEditor();
  reactivate();
}

function clickEnd(shiftKey){
  if(shiftKey && selA>=0){
    // 扩展到末尾：selB = length（用特殊值表示末尾）
    var toks=getToks();
    selB=toks.length; // 超出 = 末尾游标
  } else {
    clearSel();
  }
  curTok=-1;
  renderEditor();
  reactivate();
}

/* ════════════════════════════════════════
   插入 / 覆盖
════════════════════════════════════════ */
function appendTok(tok){ insertToks([tok]); }
function inputSpecial(tok){ insertToks([tok]); }

function insertToks(tokArr){
  if(curSi<0)return;
  saveUndo();
  var toks=getToks();
  var range=getSelRange();

  if(range){
    // 有选区：替换选区内容
    var hi=Math.min(range.hi, toks.length-1);
    var lo=range.lo;
    toks.splice(lo, hi-lo+1, ...tokArr);
    curTok=lo+tokArr.length; if(curTok>=toks.length)curTok=-1;
    clearSel();
  } else if(inputMode==='overwrite' && curTok>=0 && curTok<toks.length){
    // 覆盖单个
    toks.splice(curTok,1,...tokArr);
    curTok=curTok+tokArr.length; if(curTok>=toks.length)curTok=-1;
  } else if(curTok>=0 && curTok<toks.length){
    // 插入在游标前
    toks.splice(curTok,0,...tokArr);
    curTok=curTok+tokArr.length;
  } else {
    // 追加到末尾
    toks.push(...tokArr);
    curTok=-1;
  }
  setToks(toks);
  renderEditor();
  reactivate();
}

function inputNote(n){
  var tok=buildTok(n);
  var extra=[];
  if(n!==0 && dur==='whole'){extra=['-','-','-'];}
  else if(n!==0 && dur==='half'){extra=['-'];}
  insertToks([tok,...extra]);
}

function deleteSelected(){
  if(curSi<0)return;
  saveUndo();
  var toks=getToks();
  var range=getSelRange();
  if(range){
    var hi=Math.min(range.hi, toks.length-1);
    var lo=range.lo;
    toks.splice(lo, hi-lo+1);
    curTok=toks.length===0?-1:Math.min(lo,toks.length-1);
    clearSel();
  } else if(curTok>=0 && curTok<toks.length){
    toks.splice(curTok,1);
    if(toks.length===0)curTok=-1;
    else curTok=Math.min(curTok,toks.length-1);
  } else {
    toks.pop();
    curTok=-1;
  }
  setToks(toks);
  renderEditor();
  reactivate();
}

function clearN(){
  if(curSi<0)return;
  saveUndo();
  data[curSi].lines[curLi].segs[curGi].n='';
  curTok=-1; clearSel();
  renderEditor(); reactivate();
}

/* ════════════════════════════════════════
   复制 / 剪切 / 粘贴
════════════════════════════════════════ */
function copyToks(){
  if(curSi<0)return;
  var toks=getToks();
  var range=getSelRange();
  if(range){
    var hi=Math.min(range.hi,toks.length-1);
    tokClipboard=toks.slice(range.lo,hi+1);
  } else if(curTok>=0&&curTok<toks.length){
    tokClipboard=[toks[curTok]];
  }
  updateStatus();
}
function cutToks(){copyToks();deleteSelected();}
function pasteToks(){
  if(tokClipboard.length)insertToks(tokClipboard.slice());
}
function copySeg(){
  if(curSi<0)return;
  segClipboard=JSON.parse(JSON.stringify(data[curSi].lines[curLi].segs[curGi]));
  updateStatus();
}
function cutSeg(){
  copySeg();
  if(curSi<0)return;
  saveUndo();
  delSeg(curSi,curLi,curGi);
  curSi=-1;curLi=-1;curGi=-1;
}
function pasteSeg(){
  if(!segClipboard||curSi<0)return;
  saveUndo();
  var copy=JSON.parse(JSON.stringify(segClipboard));
  // 粘贴到当前格子后面
  data[curSi].lines[curLi].segs.splice(curGi+1,0,copy);
  curGi=curGi+1;
  renderEditor();reactivate();
}
function pasteSegReplace(){
  if(!segClipboard||curSi<0)return;
  saveUndo();
  var copy=JSON.parse(JSON.stringify(segClipboard));
  data[curSi].lines[curLi].segs[curGi]=copy;
  renderEditor();reactivate();
}

/* ════════════════════════════════════════
   游标移动
════════════════════════════════════════ */
function moveCursor(dir){
  if(curSi<0)return;
  clearSel();
  var toks=getToks();
  if(dir==='left'){
    if(curTok===-1)curTok=toks.length>0?toks.length-1:-1;
    else if(curTok>0)curTok--;
  } else {
    if(curTok>=0&&curTok<toks.length-1)curTok++;
    else curTok=-1;
  }
  renderEditor(); reactivate();
}

/* ════════════════════════════════════════
   focusSeg + 状态栏
════════════════════════════════════════ */
function focusSeg(si,li,gi,reset){
  if(reset||(si!==curSi||li!==curLi||gi!==curGi)){curTok=-1;clearSel();}
  curSi=si;curLi=li;curGi=gi;
  reactivate();
  updateStatus();
  renderPreview();
}

function reactivate(){
  document.querySelectorAll('.tok-field').forEach(function(el){el.classList.remove('n-active');});
  if(curSi<0)return;
  var f=document.querySelector('.tok-field[data-key="'+curSi+'-'+curLi+'-'+curGi+'"]');
  if(f)f.classList.add('n-active');
  updateStatus();
}

function updateStatus(){
  var loc=document.getElementById('statusLoc');
  var sel=document.getElementById('statusSel');
  var tip=document.getElementById('statusTip');
  if(curSi<0){
    loc.textContent='点击左边格子开始编辑';
    sel.textContent=''; tip.textContent=''; return;
  }
  loc.textContent=data[curSi].name+' 行'+(curLi+1)+' 格'+(curGi+1);
  var range=getSelRange();
  var toks=getToks();
  if(range){
    var cnt=Math.min(range.hi,toks.length-1)-range.lo+1;
    sel.textContent='已选 '+cnt+' 个';
    tip.textContent='⌘C复制 ⌘X剪切 ⌘V粘贴 | Alt+C/V/R 格子操作';
  } else if(segClipboard){
    sel.textContent='格子已复制';
    tip.textContent='Alt+V插到后面 Alt+R覆盖当前 | 剪贴板: '+(tokClipboard.length?tokClipboard.join(' '):'空');
  } else if(tokClipboard.length){
    sel.textContent='';
    tip.textContent='剪贴板: '+tokClipboard.join(' ');
  } else {
    sel.textContent=''; tip.textContent='Alt+C 复制格子';
  }
}

/* ════════════════════════════════════════
   设置函数
════════════════════════════════════════ */
function setInputMode(m){
  inputMode=m;
  document.getElementById('mode-insert').classList.toggle('on',m==='insert');
  document.getElementById('mode-overwrite').classList.toggle('on',m==='overwrite');
}
function setOct(o){
  oct=o;
  ['low2','low1','mid','high1','high2'].forEach(function(x){document.getElementById('oct-'+x).classList.toggle('on',x===o);});
}
function setDur(d){
  dur=d;
  ['whole','half','quarter','eighth','16th'].forEach(function(x){document.getElementById('dur-'+x).classList.toggle('on',x===d);});
}
function toggleDot(){dotOn=!dotOn;document.getElementById('dot-btn').classList.toggle('on',dotOn);}
function toggleXSlur(){
  xslurOn=!xslurOn;
  document.getElementById('xslur-btn').classList.toggle('on',xslurOn);
  if(xslurOn)appendTok('([');
}
function closeXSlur(){xslurOn=false;document.getElementById('xslur-btn').classList.remove('on');appendTok('])'); }
function toggleSlur(){
  slurOn=!slurOn;
  document.getElementById('slur-btn').classList.toggle('on',slurOn);
  appendTok(slurOn?'(':')');
}
function refreshTupletBtns(){
  document.getElementById('t3-btn').classList.toggle('on',tupletOn===3);
  document.getElementById('t5-btn').classList.toggle('on',tupletOn===5);
}
function toggleTuplet(n){
  if(tupletOn===n){tupletOn=0;refreshTupletBtns();appendTok('}');return;}
  if(tupletOn!==0)appendTok('}');
  tupletOn=n;refreshTupletBtns();appendTok('{'+n);
}
function buildTok(n){
  var s=''+n;
  if(n!==0){
    if(oct==='high1')s+="'";else if(oct==='high2')s+="''";
    else if(oct==='low1')s+=',';else if(oct==='low2')s+=',,';
  }
  if(dotOn)s+='\\u00b7';
  if(dur==='eighth')s+='_';else if(dur==='16th')s+='__';
  return s;
}
function buildSpacerTok(){
  var s='sp';if(dur==='eighth')s+='_';else if(dur==='16th')s+='__';return s;
}

/* ════════════════════════════════════════
   渲染编辑器
════════════════════════════════════════ */
// 拖动状态
var dragSrc={si:-1,li:-1,gi:-1};

function renderEditor(){
  var wrap=document.getElementById('sectionsWrap');wrap.innerHTML='';
  data.forEach(function(sec,si){
    var sb=document.createElement('div');sb.className='sec-block';
    var sh=document.createElement('div');sh.className='sec-head';
    sh.innerHTML='<input class="sec-name-input" value="'+esc(sec.name)+'" oninput="data['+si+'].name=this.value;renderPreview()">'+
      '<button class="sec-btn" onclick="addLine('+si+')">+行</button>'+
      '<button class="sec-btn del" onclick="delSection('+si+')">删</button>';
    sb.appendChild(sh);

    sec.lines.forEach(function(line,li){
      var rb=document.createElement('div');rb.className='row-block';
      var rm=document.createElement('div');rm.className='row-meta';
      rm.innerHTML='<span class="row-idx">ROW '+(li+1)+'</span>'+
        '<label class="bold-toggle"><input type="checkbox" '+(line.bold?'checked':'')+' onchange="data['+si+'].lines['+li+'].bold=this.checked;renderPreview()"> 副歌</label>'+
        '<button class="sec-btn" onclick="moveLine('+si+','+li+',-1)" title="上移">↑</button>'+
        '<button class="sec-btn" onclick="moveLine('+si+','+li+',1)" title="下移">↓</button>'+
        '<button class="row-del" onclick="delLine('+si+','+li+')">✕</button>';
      rb.appendChild(rm);

      var tbl=document.createElement('table');tbl.className='seg-table';
      tbl.innerHTML='<tr><th style="width:16px;"></th><th style="width:64px;">和弦</th><th>简谱</th><th style="width:76px;">歌词</th><th style="width:18px;"></th></tr>';

      line.segs.forEach(function(seg,gi){
        var key=si+'-'+li+'-'+gi;
        var isActive=(si===curSi&&li===curLi&&gi===curGi);
        var tr=document.createElement('tr');
        tr.className='seg-row';

        // 拖动
        tr.addEventListener('dragstart',function(e){
          dragSrc={si:si,li:li,gi:gi};
          tr.classList.add('dragging');
          e.dataTransfer.effectAllowed='move';
          e.dataTransfer.setData('text/plain','');
        });
        tr.addEventListener('dragend',function(){
          tr.classList.remove('dragging');
          document.querySelectorAll('.seg-row').forEach(function(r){r.classList.remove('drag-over');});
        });
        tr.addEventListener('dragover',function(e){
          e.preventDefault();e.dataTransfer.dropEffect='move';
          tr.classList.add('drag-over');
        });
        tr.addEventListener('dragleave',function(){tr.classList.remove('drag-over');});
        tr.addEventListener('drop',function(e){
          e.preventDefault();tr.classList.remove('drag-over');
          if(dragSrc.si<0||dragSrc.si!==si||dragSrc.li!==li||dragSrc.gi===gi)return;
          saveUndo();
          var segs=data[si].lines[li].segs;
          var item=segs.splice(dragSrc.gi,1)[0];
          var tgi=gi>dragSrc.gi?gi-1:gi;
          segs.splice(tgi,0,item);
          if(curSi===si&&curLi===li&&curGi===dragSrc.gi){
            for(var i=0;i<segs.length;i++){if(segs[i]===item)curGi=i;}
          }
          dragSrc={si:-1,li:-1,gi:-1};
          renderEditor();if(curSi>=0)reactivate();
        });

        // 手柄
        var tdH=document.createElement('td');
        var h=document.createElement('span');h.className='drag-handle';h.textContent='⠿';h.title='拖动排序';
        tr.draggable=false;
        h.addEventListener('mousedown',function(){tr.draggable=true;});
        h.addEventListener('mouseup',function(){tr.draggable=false;});
        document.addEventListener('dragend',function(){tr.draggable=false;},{once:true});
        tdH.appendChild(h);tr.appendChild(tdH);

        // 和弦
        var tdC=document.createElement('td');
        var inpC=document.createElement('input');inpC.className='inp-chord';inpC.value=seg.chord||'';
        inpC.oninput=(function(si,li,gi){return function(){data[si].lines[li].segs[gi].chord=this.value;renderPreview();};})(si,li,gi);
        tdC.appendChild(inpC);tr.appendChild(tdC);

        // token field
        var tdN=document.createElement('td');
        var tf=document.createElement('div');
        tf.className='tok-field'+(isActive?' n-active':'');
        tf.setAttribute('data-key',key);
        tf.onclick=(function(si,li,gi){return function(e){
          if(e.target===tf){
            if(curSi===si&&curLi===li&&curGi===gi)clickEnd(e.shiftKey);
            else focusSeg(si,li,gi,true);
          }
        };})(si,li,gi);
        if(seg.n&&seg.n.trim()){
          seg.n.trim().split(/\\s+/).forEach(function(tok,ti){
            var chip=document.createElement('span');
            var classes='tok-chip';
            if(isActive){
              var range=getSelRange();
              if(range&&ti>=range.lo&&ti<=Math.min(range.hi,seg.n.trim().split(/\\s+/).length-1))classes+=' sel';
              if(curTok===ti)classes+=' cursor';
            }
            chip.className=classes;chip.textContent=tok;
            chip.onclick=(function(si,li,gi,ti){return function(e){
              e.stopPropagation();
              if(curSi===si&&curLi===li&&curGi===gi)clickToken(ti,e.shiftKey);
              else{curSi=si;curLi=li;curGi=gi;selA=ti;selB=ti;curTok=ti;renderEditor();reactivate();}
            };})(si,li,gi,ti);
            tf.appendChild(chip);
          });
        }
        var endSpan=document.createElement('span');
        endSpan.className='tok-end'+(isActive&&curTok===-1?' cursor':'');
        endSpan.textContent='▏';
        endSpan.onclick=(function(si,li,gi){return function(e){
          e.stopPropagation();
          if(curSi===si&&curLi===li&&curGi===gi)clickEnd(e.shiftKey);
          else focusSeg(si,li,gi,true);
        };})(si,li,gi);
        tf.appendChild(endSpan);
        tdN.appendChild(tf);tr.appendChild(tdN);

        // 歌词
        var tdL=document.createElement('td');
        var inpL=document.createElement('input');inpL.className='inp-lyric';inpL.value=seg.lyric||'';
        inpL.oninput=(function(si,li,gi){return function(){data[si].lines[li].segs[gi].lyric=this.value;renderPreview();};})(si,li,gi);
        tdL.appendChild(inpL);tr.appendChild(tdL);

        // 删除
        var tdD=document.createElement('td');
        var btnD=document.createElement('button');btnD.className='btn-del-seg';btnD.textContent='✕';
        btnD.onclick=(function(si,li,gi){return function(){saveUndo();delSeg(si,li,gi);};})(si,li,gi);
        tdD.appendChild(btnD);tr.appendChild(tdD);
        tbl.appendChild(tr);
      });

      // + 格子
      var trAdd=document.createElement('tr');
      var tdAdd=document.createElement('td');tdAdd.colSpan=5;tdAdd.style.paddingTop='3px';
      var ab=document.createElement('button');ab.className='btn-add-seg';ab.textContent='+ 格子';
      ab.onclick=(function(si,li){return function(){saveUndo();addSeg(si,li);};})(si,li);
      tdAdd.appendChild(ab);trAdd.appendChild(tdAdd);tbl.appendChild(trAdd);

      rb.appendChild(tbl);
      sb.appendChild(rb);
    });

    var arb=document.createElement('button');arb.className='add-row-btn';arb.textContent='+ 新行';
    arb.onclick=(function(si){return function(){saveUndo();addLine(si);};})(si);
    sb.appendChild(arb);
    wrap.appendChild(sb);
  });
  renderPreview();
}

function addSection(){saveUndo();data.push({name:'新段落',lines:[{bold:false,segs:[{chord:'',n:'',lyric:''}]}]});renderEditor();}
function moveSection(si,dir){
  var ni=si+dir;
  if(ni<0||ni>=data.length)return;
  saveUndo();
  var tmp=data[si];data[si]=data[ni];data[ni]=tmp;
  if(curSi===si)curSi=ni;else if(curSi===ni)curSi=si;
  renderEditor();if(curSi>=0)reactivate();
}
function delSection(si){saveUndo();data.splice(si,1);if(curSi===si){curSi=-1;curLi=-1;curGi=-1;}renderEditor();}
function addLine(si){saveUndo();data[si].lines.push({bold:false,segs:[{chord:'',n:'',lyric:''}]});renderEditor();}
function moveLine(si,li,dir){
  var ni=li+dir;
  if(ni<0||ni>=data[si].lines.length)return;
  saveUndo();
  var tmp=data[si].lines[li];data[si].lines[li]=data[si].lines[ni];data[si].lines[ni]=tmp;
  if(curSi===si&&curLi===li)curLi=ni;else if(curSi===si&&curLi===ni)curLi=li;
  renderEditor();if(curSi>=0)reactivate();
}
function delLine(si,li){saveUndo();data[si].lines.splice(li,1);renderEditor();}
function addSeg(si,li){data[si].lines[li].segs.push({chord:'',n:'',lyric:''});renderEditor();}
function delSeg(si,li,gi){data[si].lines[li].segs.splice(gi,1);renderEditor();}

/* ════════════════════════════════════════
   音符渲染
════════════════════════════════════════ */
function makeJpPlain(sym){
  var pl=document.createElement('span');pl.className='jp-plain';
  var t=document.createElement('span');t.className='jp-plain-top';pl.appendChild(t);
  var s=document.createElement('span');s.className='jp-plain-sym';s.textContent=sym;pl.appendChild(s);
  var b=document.createElement('span');b.className='jp-plain-bot';pl.appendChild(b);
  return pl;
}
function setDots(el,cnt){
  el.innerHTML='';
  for(var i=0;i<cnt;i++){var d=document.createElement('span');d.textContent='·';el.appendChild(d);}
}
function parseJpToken(tok){
  if(!tok||tok==='-'||tok==='|'||tok==='||'||tok===' ')return makeJpPlain(tok);
  if(tok==='0')return makeJpPlain('0');
  if(tok==='sp'||tok==='sp_'||tok==='sp__'){
    var fk=tok==='sp__'?'0__':tok==='sp_'?'0_':'0';
    var el=parseJpToken(fk);
    var ns=el.querySelector('.jp-num')||el.querySelector('.jp-plain-sym');
    if(ns)ns.style.visibility='hidden';
    return el;
  }
  var zm=tok.match(/^(0·?)(_*)$/);
  if(zm){
    var w=document.createElement('span');w.className='jp-wrap';
    var td=document.createElement('span');td.className='jp-dot-top';w.appendChild(td);
    var lw=document.createElement('span');lw.className='jp-lines-wrap';
    var nr=document.createElement('span');nr.className='jp-num-row';
    var ns=document.createElement('span');ns.className='jp-num';ns.textContent='0';nr.appendChild(ns);
    if(zm[1].indexOf('\\u00b7')>-1){var ag=document.createElement('span');ag.className='jp-aug';ag.textContent='·';nr.appendChild(ag);}
    var ul=zm[2].length;
    if(ul>=1)nr.style.borderBottom='1.5px solid currentColor';
    lw.appendChild(nr);
    if(ul===2){var ul2=document.createElement('span');ul2.className='jp-u2-line';lw.appendChild(ul2);}
    w.appendChild(lw);
    var bd=document.createElement('span');bd.className='jp-dot-bot';w.appendChild(bd);
    return w;
  }
  var num=tok,isH=0,isL=0,isDot=false,ul=0;
  if(num.slice(-2)==='__'){ul=2;num=num.slice(0,-2);}
  else if(num.slice(-1)==='_'){ul=1;num=num.slice(0,-1);}
  if(num.indexOf('\\u00b7')>-1){isDot=true;num=num.replace(/\\u00b7/g,'');}
  var hm=num.match(/^(.+?)('+)$/);if(hm){isH=hm[2].length;num=hm[1];}
  var lm=num.match(/^(.+?)(,+)$/);if(lm){isL=lm[2].length;num=lm[1];}
  var w=document.createElement('span');w.className='jp-wrap';
  var td=document.createElement('span');td.className='jp-dot-top';setDots(td,isH>=2?2:isH);w.appendChild(td);
  var lw=document.createElement('span');lw.className='jp-lines-wrap';
  var nr=document.createElement('span');nr.className='jp-num-row';
  var ns=document.createElement('span');ns.className='jp-num';ns.textContent=num;nr.appendChild(ns);
  if(isDot){var ag=document.createElement('span');ag.className='jp-aug';ag.textContent='·';nr.appendChild(ag);}
  if(ul>=1)nr.style.borderBottom='1.5px solid currentColor';
  lw.appendChild(nr);
  if(ul===2){var ul2=document.createElement('span');ul2.className='jp-u2-line';lw.appendChild(ul2);}
  w.appendChild(lw);
  var bd=document.createElement('span');bd.className='jp-dot-bot';setDots(bd,isL>=2?2:isL);w.appendChild(bd);
  return w;
}
function makeTuplet(n){
  var w=document.createElement('span');w.className='jp-tuplet';
  var br=document.createElement('span');br.className='jp-tuplet-br';w.appendChild(br);
  var nm=document.createElement('span');nm.className='jp-tuplet-num';nm.textContent=String(n);w.appendChild(nm);
  return w;
}
function renderNStr(nStr){
  var div=document.createElement('div');div.className='p-n';
  if(!nStr||!nStr.trim())return div;
  var toks=nStr.trim().split(/\\s+/),i=0;
  while(i<toks.length){
    var t=toks[i];
    if(t==='('){var sl=document.createElement('span');sl.className='jp-slur';i++;while(i<toks.length&&toks[i]!==')')sl.appendChild(parseJpToken(toks[i++]));div.appendChild(sl);i++;continue;}
    if(t==='(['){var so=document.createElement('span');so.className='jp-slur-open';i++;while(i<toks.length&&toks[i]!=='])') so.appendChild(parseJpToken(toks[i++]));div.appendChild(so);i++;continue;}
    if(t==='])'){var sc=document.createElement('span');sc.className='jp-slur-close';i++;if(i<toks.length)sc.appendChild(parseJpToken(toks[i++]));div.appendChild(sc);continue;}
    var tm=t.match(/^\\{(3|5)$/);if(tm){var tn=parseInt(tm[1],10);var tp=makeTuplet(tn);i++;while(i<toks.length&&toks[i]!=='}')tp.appendChild(parseJpToken(toks[i++]));div.appendChild(tp);i++;continue;}
    if(t==='}'){i++;continue;}
    div.appendChild(parseJpToken(t));i++;
  }
  return div;
}
function renderPreview(){
  var wrap=document.getElementById('previewWrap');wrap.innerHTML='';
  data.forEach(function(sec){
    var ps=document.createElement('div');ps.className='prev-sec';
    var pn=document.createElement('div');pn.className='prev-sec-name';pn.textContent=sec.name;ps.appendChild(pn);
    sec.lines.forEach(function(line){
      var row=document.createElement('div');row.className='prev-row';
      line.segs.forEach(function(seg){
        var s=document.createElement('div');s.className='prev-seg';
        var c=document.createElement('div');c.className='p-chord'+(seg.chord?'':' empty');c.textContent=seg.chord||'\\u00a0';s.appendChild(c);
        if(seg.n&&seg.n.trim())s.appendChild(renderNStr(seg.n));
        var l=document.createElement('div');l.className='p-lyric'+(line.bold?' bold':'');l.textContent=seg.lyric||'';s.appendChild(l);
        row.appendChild(s);
      });
      ps.appendChild(row);
    });
    wrap.appendChild(ps);
  });
  renderCode();
}
function jq(s){ return JSON.stringify(s); }
function renderCode(){
  // 输出合法 JSON，可直接存成 .json 文件
  var lines=['"sections": ['];
  data.forEach(function(sec,si){
    var last=si===data.length-1;
    lines.push('  {');
    lines.push('    "name": '+jq(sec.name)+',');
    lines.push('    "lines": [');
    sec.lines.forEach(function(line,li){
      var lastLine=li===sec.lines.length-1;
      lines.push(line.bold?'      { "b": true, "line": [':'      [');
      line.segs.forEach(function(seg,gi){
        var lastSeg=gi===line.segs.length-1;
        var obj={chord:seg.chord||''};
        if(seg.n&&seg.n.trim())obj.n=seg.n;
        obj.lyric=seg.lyric||'';
        lines.push('        '+JSON.stringify(obj)+(lastSeg?'':','));
      });
      lines.push(line.bold?'      ]}'+(!lastLine?',':''):'      ]'+(!lastLine?',':''));
    });
    lines.push('    ]');
    lines.push('  }'+(last?'':','));
  });
  lines.push(']');
  document.getElementById('codeBox').textContent=lines.join('\\n');
}
function copyCode(){
  navigator.clipboard.writeText(document.getElementById('codeBox').textContent).then(function(){
    var btns=document.querySelectorAll('.copy-btn');btns[0].textContent='已复制 ✓';
    setTimeout(function(){btns[0].textContent='复制 sections 数组';},2000);
  });
}
function copyFullJson(){
  // Build sections array from codeBox (already rendered JSON)
  renderCode();
  var secText=document.getElementById('codeBox').textContent;
  // Extract just the array part (between first [ and last ])
  var firstBracket=secText.indexOf('[');
  var lastBracket=secText.lastIndexOf(']');
  var secArr=secText.slice(firstBracket,lastBracket+1);

  var bpm=parseInt(document.getElementById('meta-bpm').value)||72;
  var now=new Date();
  var pad=function(n){return n<10?'0'+n:n;};
  var ts=now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate())+' '+pad(now.getHours())+':'+pad(now.getMinutes())+':'+pad(now.getSeconds());
  var song={
    version:'1',
    created:'YuEn',
    createdTime:ts,
    id:document.getElementById('meta-id').value||'song-id',
    title:document.getElementById('meta-title').value||'',
    artist:document.getElementById('meta-artist').value||'',
    sub:document.getElementById('meta-sub').value||'',
    origKey:document.getElementById('meta-key').value||'C',
    timeSign:'4/4',
    bpm:bpm,
    mp3:'',
    cover:document.getElementById('meta-cover').value||'',
    lrc:document.getElementById('meta-lrc').value||'',
    youtube:document.getElementById('meta-youtube').value||'',
    scoreImg:document.getElementById('meta-scoreimg').value||''
  };

  // Build JSON string manually to embed sections as raw JSON (already valid)
  var lines=[];
  lines.push('{');
  Object.keys(song).forEach(function(k){
    var v=song[k];
    if(typeof v==='number') lines.push('  "'+k+'": '+v+',');
    else lines.push('  "'+k+'": '+JSON.stringify(v)+',');
  });
  lines.push('  "sections": '+secArr);
  lines.push('}');
  var fullJson=lines.join('\\n');

  // Validate before copying
  try{
    JSON.parse(fullJson);
  }catch(e){
    alert('JSON 格式有误: '+e.message);
    return;
  }

  navigator.clipboard.writeText(fullJson).then(function(){
    var btns=document.querySelectorAll('.copy-btn');
    btns[1].textContent='已复制 ✓';
    setTimeout(function(){btns[1].textContent='复制完整 JSON 文件';},2000);
  });
}
function switchTop(name,btn){
  document.querySelectorAll('.top-tab').forEach(function(t){t.classList.remove('on');});
  document.querySelectorAll('.top-panel').forEach(function(p){p.classList.remove('on');});
  btn.classList.add('on');document.getElementById('top-'+name).classList.add('on');
}

/* ════════════════════════════════════════
   键盘
════════════════════════════════════════ */
document.addEventListener('keydown',function(e){
  var el=document.activeElement;
  if(el.tagName==='INPUT'||el.tagName==='TEXTAREA')return;
  var isMeta=e.metaKey||e.ctrlKey;
  var k=e.key;
  if(isMeta){
    if(k==='z'||k==='Z'){e.preventDefault();undoAction();return;}
    if(k==='c'||k==='C'){e.preventDefault();copyToks();return;}
    if(k==='x'||k==='X'){e.preventDefault();cutToks();return;}
    if(k==='v'||k==='V'){e.preventDefault();pasteToks();return;}
    return;
  }
  // Alt/Option 快捷键：格子级别操作
  // 用 e.code 而不是 e.key，因为 Mac Option+字母 会产生特殊字符
  if(e.altKey){
    var code=e.code||'';
    if(code==='KeyC'){e.preventDefault();copySeg();return;}
    if(code==='KeyV'){e.preventDefault();pasteSeg();return;}
    if(code==='KeyR'){e.preventDefault();pasteSegReplace();return;}
    if(code==='KeyX'){e.preventDefault();cutSeg();return;}
    return;
  }
  if(curSi<0)return;
  if(/^[0-7]$/.test(k)){e.preventDefault();inputNote(parseInt(k));return;}
  if(k===' '){e.preventDefault();appendTok(buildSpacerTok());return;}
  if(k==='\\\\'){e.preventDefault();inputSpecial('-');return;}
  if(k==='Backspace'){e.preventDefault();deleteSelected();return;}
  if(k==='ArrowLeft'){e.preventDefault();moveCursor('left');return;}
  if(k==='ArrowRight'){e.preventDefault();moveCursor('right');return;}
  if(k==='ArrowUp'){e.preventDefault();var os=['low2','low1','mid','high1','high2'];var i=os.indexOf(oct);if(i<os.length-1)setOct(os[i+1]);return;}
  if(k==='ArrowDown'){e.preventDefault();var os=['low2','low1','mid','high1','high2'];var i=os.indexOf(oct);if(i>0)setOct(os[i-1]);return;}
  if(k===','){e.preventDefault();toggleDot();return;}
  if(k==='['){e.preventDefault();toggleSlur();return;}
  if(k==='i'||k==='I'){e.preventDefault();setInputMode('insert');return;}
  if(k==='o'||k==='O'){e.preventDefault();setInputMode('overwrite');return;}
  if(k==='q'||k==='Q'){e.preventDefault();setDur('whole');return;}
  if(k==='w'||k==='W'){e.preventDefault();setDur('half');return;}
  if(k==='e'||k==='E'){e.preventDefault();setDur('quarter');return;}
  if(k==='r'||k==='R'){e.preventDefault();setDur('eighth');return;}
  if(k==='t'||k==='T'){e.preventDefault();setDur('16th');return;}
});

/* ════════════════════════════════════════
   导入
════════════════════════════════════════ */
function openImport(){
  document.getElementById('importOverlay').classList.add('open');
  document.getElementById('importTA').value='';
  document.getElementById('importErr').textContent='';
  setTimeout(function(){document.getElementById('importTA').focus();},50);
}
function closeImport(){document.getElementById('importOverlay').classList.remove('open');}
function doImport(){
  var raw=document.getElementById('importTA').value.trim();
  var err=document.getElementById('importErr');err.textContent='';
  try{
    var arrStr=raw;
    // 找第一个 [ 到最后一个 ]，支持所有格式：
    // sections: [...],  /  var SECTIONS = [...];  / 直接粘贴数组
    var firstBracket=raw.indexOf('[');
    if(firstBracket>=0){
      var lastBracket=raw.lastIndexOf(']');
      if(lastBracket>firstBracket)arrStr=raw.slice(firstBracket,lastBracket+1);
    }
    var parsed=eval('('+arrStr+')');
    if(!Array.isArray(parsed))throw new Error('不是数组');
    saveUndo();
    data=parsed.map(function(sec){
      return{name:sec.name||'',lines:(sec.lines||[]).map(function(line){
        if(Array.isArray(line))return{bold:false,segs:line};
        return{bold:!!line.b,segs:line.line||[]};
      })};
    });
    curSi=-1;curLi=-1;curGi=-1;curTok=-1;clearSel();
    closeImport();renderEditor();
  }catch(e){err.textContent='解析失败：'+e.message;}
}
document.getElementById('importOverlay').addEventListener('click',function(e){if(e.target===this)closeImport();});

/* 初始化 */
refreshTupletBtns();
renderEditor();
</script>
</body>
</html>`;

function openTool(id, name){
  navName.textContent = name;
  hub.style.display = 'none';
  toolview.classList.add('on');
  Object.values(panels).forEach(p => p.classList.remove('on'));
  panels[id].classList.add('on');
  if(id === 'lrc' && !localStorage.getItem(TUT_KEY)) setTimeout(tutOpen, 400);
  if(id === 'jf'  && !localStorage.getItem(TUT_KEY_JF)) setTimeout(tutOpenJF, 400);
  if(id === 'jf'){
    const fr = $('mt-jf-iframe');
    if(!fr.srcdoc && !fr._loaded){
      fr._loaded = true;
      fr.srcdoc = jianpuHTML;
    }
  }
}
function closeTool(){
  toolview.classList.remove('on');
  hub.style.display = '';
  audio.pause();
  updatePlayBtn();
}

$('mt-card-lrc').onclick = () => openTool('lrc','歌词编辑器');
$('mt-card-jf').onclick  = () => openTool('jf','简谱编辑器');
$('mt-back').onclick     = closeTool;
$('mt-help-btn').onclick = () => {
  const isJF = $('mt-panel-jf').classList.contains('on');
  if(isJF){ tutIdxJF=0; tutRenderJF(); $('mt-tut-next').onclick = () => { if(tutIdxJF < tutStepsJF.length-1){ tutIdxJF++; tutRenderJF(); } else tutCloseJF(); }; $('mt-tut-close').onclick=tutCloseJF; $('mt-tut-skip').onclick=tutCloseJF; $('mt-tut-never').onclick=()=>{ localStorage.setItem(TUT_KEY_JF,'1'); tutCloseJF(); }; }
  else { tutIdx=0; tutRender(); $('mt-tut-next').onclick = () => { if(tutIdx < tutSteps.length-1){ tutIdx++; tutRender(); } else tutClose(); }; $('mt-tut-close').onclick=tutClose; $('mt-tut-skip').onclick=tutClose; $('mt-tut-never').onclick=()=>{ localStorage.setItem(TUT_KEY,'1'); tutClose(); }; }
  $('mt-tut').classList.add('open');
};

/* ── LRC 播放器 ── */
const audio = $('mt-audio');
let lrcData = [], autoScroll = true, curIdx = -1;

audio.addEventListener('timeupdate', () => { updateTime(); updateProg(); if(autoScroll) highlightPlaying(); });
audio.addEventListener('play',  updatePlayBtn);
audio.addEventListener('pause', updatePlayBtn);
audio.addEventListener('ended', updatePlayBtn);

function fmt(s){ const m=Math.floor(s/60),sec=s%60; return String(m).padStart(2,'0')+':'+sec.toFixed(2).padStart(5,'0'); }
function fmtLRC(s){ return '['+fmt(s)+']'; }
function updateTime(){ $('mt-time').textContent='['+fmt(audio.currentTime)+']'; }
function updateProg(){ if(audio.duration) $('mt-progfill').style.width=(audio.currentTime/audio.duration*100)+'%'; }
function updatePlayBtn(){ $('mt-playbtn').textContent = audio.paused ? '▶' : '⏸'; }

function highlightPlaying(){
  const t = audio.currentTime;
  let idx = -1;
  lrcData.forEach((l,i) => { if(l.time !== null && l.time <= t) idx = i; });
  if(idx === curIdx) return;
  curIdx = idx;
  document.querySelectorAll('.mt-ly-row').forEach((r,i) => r.classList.toggle('playing', i===idx));
  if(idx >= 0 && autoScroll){
    const rows = document.querySelectorAll('.mt-ly-row');
    if(rows[idx]) rows[idx].scrollIntoView({block:'center',behavior:'smooth'});
  }
}

$('mt-playbtn').onclick = () => { audio.paused ? audio.play() : audio.pause(); };
$('mt-progbar').onclick = e => {
  if(!audio.duration) return;
  const r = e.currentTarget.getBoundingClientRect();
  audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
};
$('mt-vol').oninput = e => { audio.volume = e.target.value; };

/* 上传音乐 */
$('mt-btn-music').onclick = () => $('mt-music-file').click();
$('mt-music-file').onchange = function(){ if(this.files[0]){ audio.src=URL.createObjectURL(this.files[0]); audio.load(); }};

/* 上传歌词 */
$('mt-btn-lyric').onclick = () => $('mt-lyric-file').click();
$('mt-lyric-file').onchange = function(){
  if(!this.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    const parsed = [];
    e.target.result.split('\n').forEach(l => {
      const mm = l.match(/^\[(ar|ti|al|by):([^\]]*)\]/i);
      if(mm){ const k=mm[1].toLowerCase(),v=mm[2].trim(); $('mt-meta-'+k) && ($('mt-meta-'+k).value=v); }
      const m = l.match(/^\[(\d+):(\d+\.\d+)\](.*)/);
      if(m) parsed.push({time:parseInt(m[1])*60+parseFloat(m[2]), text:m[3].trim()});
    });
    if(parsed.length){ lrcData=parsed; renderLines(); }
  };
  reader.readAsText(this.files[0]);
};

/* 创建歌词 */
$('mt-btn-create').onclick  = () => $('mt-modal-create').classList.add('open');
$('mt-create-cancel').onclick = () => $('mt-modal-create').classList.remove('open');
$('mt-create-ok').onclick = () => {
  const raw = $('mt-create-ta').value.trim();
  if(!raw) return;
  lrcData = raw.split('\n').map(t => ({time:null, text:t}));
  $('mt-modal-create').classList.remove('open');
  renderLines();
};

/* 下载歌词 */
$('mt-btn-dl').onclick = () => {
  const ar=$('mt-meta-ar').value, ti=$('mt-meta-ti').value,
        al=$('mt-meta-al').value, by=$('mt-meta-by').value;
  const lines=[];
  if(ar) lines.push('[ar:'+ar+']');
  if(ti) lines.push('[ti:'+ti+']');
  if(al) lines.push('[al:'+al+']');
  if(by) lines.push('[by:'+by+']');
  lrcData.forEach(l => { if(l.time!==null) lines.push(fmtLRC(l.time)+l.text); });
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain'}));
  a.download=(ti||'lyrics')+'.lrc';
  a.click();
};

/* Info modal */
$('mt-btn-info').onclick   = () => $('mt-modal-info').classList.add('open');
$('mt-info-ok').onclick    = () => $('mt-modal-info').classList.remove('open');
$('mt-info-cancel').onclick= () => $('mt-modal-info').classList.remove('open');

/* 偏移 */
$('mt-btn-offset').onclick = () => {
  const offset = parseFloat($('mt-offset').value)||0;
  if(!offset) return;
  lrcData.forEach(l => { if(l.time!==null) l.time=Math.max(0,l.time+offset); });
  $('mt-offset').value='0';
  renderLines();
};

/* 同步滚动 toggle */
$('mt-toggle').onclick = () => {
  autoScroll = !autoScroll;
  $('mt-toggle').classList.toggle('on', autoScroll);
  $('mt-toggle-lbl').textContent = autoScroll ? '开' : '关';
};

/* 新增歌词（末尾） */
$('mt-btn-addend').onclick = () => {
  lrcData.push({time:null, text:''});
  renderLines();
  setTimeout(()=>{ const inp=document.querySelectorAll('.mt-ly-inp'); if(inp.length) inp[inp.length-1].focus(); },50);
};

/* ── 渲染歌词列表 ── */
function renderLines(){
  const wrap = $('mt-lines');
  const st   = $('mt-lrc-center').scrollTop;
  wrap.innerHTML = '';
  lrcData.forEach((l, i) => {
    const row = document.createElement('div');
    row.className = 'mt-ly-row' + (i===curIdx?' playing':'');

    // 时间戳
    const ts = document.createElement('span');
    ts.className = 'mt-ly-time' + (l.time===null?' unstamped':'');
    ts.textContent = l.time!==null ? fmtLRC(l.time) : '[--:--.--]';
    if(l.time!==null) ts.onclick = () => { audio.currentTime=l.time; };
    row.appendChild(ts);

    // 打轴圆圈
    const sb = document.createElement('button');
    sb.className='mt-ly-stamp'; sb.textContent='○';
    sb.onclick = () => stampLine(i);
    row.appendChild(sb);

    // 文字输入
    const inp = document.createElement('input');
    inp.type='text'; inp.className='mt-ly-inp'; inp.value=l.text;
    inp.oninput = () => lrcData[i].text = inp.value;
    inp.onkeydown = e => {
      if(e.key==='Enter'){ e.preventDefault(); addAfter(i); }
      if(e.key==='Tab'){
        e.preventDefault(); stampLine(i);
        const all=document.querySelectorAll('.mt-ly-inp');
        if(all[i+1]) all[i+1].focus();
      }
    };
    row.appendChild(inp);

    // 悬停操作
    const act = document.createElement('div');
    act.className='mt-ly-actions';
    act.innerHTML=`<button class="mt-ly-act update" onclick="mtLRC.updateTime(${i})">更新时间</button>`
                 +`<button class="mt-ly-act add"    onclick="mtLRC.addAfter(${i})">新增歌词</button>`
                 +`<button class="mt-ly-act del"    onclick="mtLRC.delLine(${i})">删除歌词</button>`;
    row.appendChild(act);
    wrap.appendChild(row);
  });
  $('mt-lrc-center').scrollTop = st;
}

function stampLine(i){ lrcData[i].time=audio.currentTime; renderLines(); }
function addAfter(i){
  lrcData.splice(i+1,0,{time:null,text:''});
  renderLines();
  setTimeout(()=>{ const all=document.querySelectorAll('.mt-ly-inp'); if(all[i+1]) all[i+1].focus(); },50);
}
function delLine(i){ lrcData.splice(i,1); renderLines(); }
function updateTime(i){ lrcData[i].time=audio.currentTime; renderLines(); }

/* 暴露给 inline onclick 使用 */
window.mtLRC = { stampLine, addAfter, delLine, updateTime };

/* 键盘快捷键 */
document.addEventListener('keydown', e => {
  if(!$('mt-panel-lrc').classList.contains('on')) return;
  const tag = document.activeElement.tagName;
  if(tag==='INPUT'||tag==='TEXTAREA') return;
  if(e.key===' '){ e.preventDefault(); audio.paused?audio.play():audio.pause(); }
  if(e.key==='ArrowLeft'){ e.preventDefault(); audio.currentTime=Math.max(0,audio.currentTime-3); }
  if(e.key==='ArrowRight'){ e.preventDefault(); audio.currentTime=Math.min(audio.duration||0,audio.currentTime+3); }
});

/* 点击 modal 背景关闭 */
['mt-modal-info','mt-modal-create'].forEach(id => {
  $(id).addEventListener('click', e => { if(e.target===e.currentTarget) e.currentTarget.classList.remove('open'); });
});


/* ── 教程系统 ── */
const TUT_KEY = 'mt_lrc_tut_done';

const tutSteps = [
  {
    icon: '🎵',
    title: '欢迎使用歌词编辑器',
    desc: '几步教你快速上手 LRC 时间轴打轴',
    items: [
      '支持导入 .lrc 歌词文件，或从零创建',
      '上传音频后可边播放边打时间轴',
      '导出标准 LRC 格式，可直接用于播放器'
    ]
  },
  {
    icon: '⬆',
    title: '步骤 1：准备音乐与歌词',
    desc: '从左侧栏开始操作',
    items: [
      '点「上传音乐」选择 MP3/M4A 等音频文件',
      '点「上传歌词」导入已有 .lrc 文件',
      '或点「创建歌词」输入纯文字歌词，每行一句'
    ]
  },
  {
    icon: '○',
    title: '步骤 2：打时间轴',
    desc: '播放音乐，对准每句歌词点击打轴',
    items: [
      '点顶部 ▶ 播放音乐',
      '点每行左边的圆圈 ○ 给该行打上当前时间',
      '快捷键：Tab 打轴并跳下一行，Space 播放/暂停，← → 快退快进 3 秒'
    ]
  },
  {
    icon: '⬇',
    title: '步骤 3：导出歌词',
    desc: '打好时间轴后下载 LRC 文件',
    items: [
      '点「add info」可填写歌手、歌名等信息',
      '右侧「偏移」可整体调整所有时间轴',
      '点左侧「下载歌词」导出 .lrc 文件'
    ]
  }
];

let tutIdx = 0;

function tutRender(){
  const step = tutSteps[tutIdx];
  $('mt-tut-icon').textContent = step.icon;
  $('mt-tut-step-label').textContent = '步骤 ' + (tutIdx+1) + ' / ' + tutSteps.length;
  $('mt-tut-title').textContent = step.title;
  $('mt-tut-desc').textContent = step.desc;

  const itemsEl = $('mt-tut-items');
  itemsEl.innerHTML = step.items.map(t =>
    `<div class="mt-tut-item"><div class="mt-tut-item-dot"></div><span>${t}</span></div>`
  ).join('');

  const dotsEl = $('mt-tut-dots');
  dotsEl.innerHTML = tutSteps.map((_,i) =>
    `<div class="mt-tut-dot${i===tutIdx?' active':''}"></div>`
  ).join('');

  const isLast = tutIdx === tutSteps.length - 1;
  $('mt-tut-next').textContent = isLast ? '开始使用 ✓' : '下一步 →';
}

function tutOpen(){
  tutIdx = 0;
  tutRender();
  $('mt-tut').classList.add('open');
}
function tutClose(){
  $('mt-tut').classList.remove('open');
  localStorage.setItem(TUT_KEY, '1');
}

$('mt-tut-close').onclick = tutClose;
$('mt-tut-skip').onclick  = tutClose;
$('mt-tut-never').onclick = () => { localStorage.setItem(TUT_KEY,'1'); tutClose(); };
$('mt-tut-next').onclick  = () => {
  if(tutIdx < tutSteps.length - 1){ tutIdx++; tutRender(); }
  else tutClose();
};


/* ── 简谱编辑器教程 ── */
const TUT_KEY_JF = 'mt_jf_tut_done';

const tutStepsJF = [
  {
    icon: '♩',
    title: '欢迎使用简谱编辑器',
    desc: '快速了解如何用简谱编辑器编写乐谱',
    items: [
      '支持完整简谱（数字音符 1-7）输入',
      '可标注和弦、升降号、连音线',
      '导出 JSON 格式，方便保存与分享'
    ]
  },
  {
    icon: '🎼',
    title: '步骤 1：输入音符',
    desc: '用数字键盘输入简谱音符',
    items: [
      '数字 1-7 对应 Do-Si 七个音',
      '0 表示休止符，点击音符可加上下点（高低八度）',
      '左边面板选择调号、拍号与速度'
    ]
  },
  {
    icon: '🎵',
    title: '步骤 2：添加歌词与和弦',
    desc: '为每个音符标注文字与和弦',
    items: [
      '点击音符下方输入对应歌词',
      '点击音符上方输入和弦标记（如 C, Am, G7）',
      '支持升号 # 与降号 ♭'
    ]
  },
  {
    icon: '💾',
    title: '步骤 3：保存与导出',
    desc: '完成编辑后保存你的简谱',
    items: [
      '点「导出 JSON」保存为文件',
      '下次可点「导入 JSON」重新载入',
      '也可直接复制简谱字符串分享给他人'
    ]
  }
];

let tutIdxJF = 0;

function tutRenderJF(){
  const step = tutStepsJF[tutIdxJF];
  $('mt-tut-icon').textContent = step.icon;
  $('mt-tut-step-label').textContent = '步骤 ' + (tutIdxJF+1) + ' / ' + tutStepsJF.length;
  $('mt-tut-title').textContent = step.title;
  $('mt-tut-desc').textContent = step.desc;
  $('mt-tut-items').innerHTML = step.items.map(t =>
    `<div class="mt-tut-item"><div class="mt-tut-item-dot"></div><span>${t}</span></div>`
  ).join('');
  $('mt-tut-dots').innerHTML = tutStepsJF.map((_,i) =>
    `<div class="mt-tut-dot${i===tutIdxJF?' active':''}"></div>`
  ).join('');
  $('mt-tut-next').textContent = tutIdxJF === tutStepsJF.length-1 ? '开始使用 ✓' : '下一步 →';
}

function tutOpenJF(){
  tutIdxJF = 0;
  // Rebind next button for JF flow
  $('mt-tut-next').onclick = () => {
    if(tutIdxJF < tutStepsJF.length-1){ tutIdxJF++; tutRenderJF(); }
    else tutCloseJF();
  };
  $('mt-tut-close').onclick = tutCloseJF;
  $('mt-tut-skip').onclick  = tutCloseJF;
  tutRenderJF();
  $('mt-tut').classList.add('open');
}
function tutCloseJF(){
  $('mt-tut').classList.remove('open');
  localStorage.setItem(TUT_KEY_JF, '1');
  // Restore LRC handlers
  $('mt-tut-next').onclick  = () => { if(tutIdx < tutSteps.length-1){ tutIdx++; tutRender(); } else tutClose(); };
  $('mt-tut-close').onclick = tutClose;
  $('mt-tut-skip').onclick  = tutClose;
}

renderLines();
})();
