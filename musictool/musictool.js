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
          <div class="mt-hover-group" id="mt-hg-lyric">
            <button class="mt-side-btn" id="mt-btn-lyric">⬆ 上传歌词</button>
            <input type="file" id="mt-lyric-file" accept=".lrc" style="display:none">
            <div class="mt-sub-btns">
              <button class="mt-side-btn mt-sub-btn" id="mt-btn-txt">📄 上传文本</button>
              <input type="file" id="mt-txt-file" accept=".txt" style="display:none">
              <button class="mt-side-btn mt-sub-btn" id="mt-btn-find">🔍 查找歌词</button>
            </div>
          </div>
          <button class="mt-side-btn" id="mt-btn-create">📄 创建歌词</button>
          <div class="mt-hover-group" id="mt-hg-dl">
            <button class="mt-side-btn" id="mt-btn-dl">⬇ 下载歌词</button>
            <div class="mt-sub-btns">
              <button class="mt-side-btn mt-sub-btn" id="mt-btn-dl-twin">⬇ 下载双语LRC</button>
            </div>
          </div>
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
    <div class="mt-modal-warn">⚠️ 这会删除当前所有歌词，确认继续吗？</div>
    <textarea class="mt-modal-ta" id="mt-create-ta" placeholder="第一行歌词&#10;第二行歌词&#10;第三行歌词"></textarea>
    <div class="mt-modal-footer">
      <button class="mt-modal-ok" id="mt-create-ok">创建</button>
      <button class="mt-modal-cancel" id="mt-create-cancel">取消</button>
    </div>
  </div>
</div>

<div class="mt-modal-overlay" id="mt-modal-txt">
  <div class="mt-modal-box">
    <div class="mt-modal-title">上传文本 · 粘贴歌词</div>
    <textarea class="mt-modal-ta" id="mt-txt-ta" placeholder="粘贴纯文本歌词，每行一句&#10;（不需要时间戳）"></textarea>
    <div class="mt-modal-footer">
      <button class="mt-modal-ok" id="mt-txt-ok">导入</button>
      <button class="mt-modal-cancel" id="mt-txt-cancel">取消</button>
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
  color-scheme:dark;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:
  radial-gradient(circle at top right,rgba(124,106,247,0.12),transparent 28%),
  radial-gradient(circle at bottom left,rgba(240,192,64,0.08),transparent 26%),
  var(--bg);
color:var(--ink);font-family:'Space Mono',monospace;height:100vh;overflow:hidden;display:flex;flex-direction:column;}

.topbar{padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;flex-shrink:0;background:rgba(24,24,28,0.9);backdrop-filter:blur(12px);}
.dot{width:6px;height:6px;border-radius:50%;background:var(--accent);box-shadow:0 0 8px var(--accent);}
.topbar-title{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--ink2);}
.topbar-title span{color:var(--accent2);}
.topbar-tabs{display:flex;gap:6px;margin-left:auto;flex-wrap:wrap;justify-content:flex-end;}
.top-tab{padding:6px 14px;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;border:1px solid var(--border);border-radius:5px;background:transparent;color:var(--ink2);font-family:'Space Mono',monospace;transition:.12s;}
.top-tab.on{background:var(--accent);color:#fff;border-color:var(--accent);}

.top-area{flex:1 1 42%;min-height:280px;overflow:hidden;display:flex;flex-direction:column;padding:14px 16px 10px;}
.top-panel{flex:1;overflow-y:auto;overflow-x:hidden;padding:18px;border:1px solid var(--border);border-radius:16px;background:linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01));display:none;position:relative;box-shadow:0 18px 40px rgba(0,0,0,0.24);}
.top-panel.on{display:block;}

.bottom-area{flex:1 1 58%;min-height:0;display:grid;grid-template-columns:minmax(460px,1.45fr) minmax(360px,1fr);gap:14px;padding:0 16px 16px;align-items:stretch;}

/* ── 左：段落编辑 ── */
.seg-pane{min-width:0;overflow:hidden;display:flex;flex-direction:column;border:1px solid var(--border);border-radius:16px;background:linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015));box-shadow:0 18px 40px rgba(0,0,0,0.2);}
.seg-pane-inner{padding:12px;flex:1;overflow-y:auto;}
.sec-block{border:1px solid var(--border);border-radius:12px;margin-bottom:10px;overflow:hidden;background:rgba(255,255,255,0.02);}
.sec-head{display:flex;align-items:center;gap:6px;padding:9px 12px;background:rgba(34,34,40,0.92);border-bottom:1px solid var(--border);}
.sec-name-input{background:transparent;border:none;color:var(--ink);font-family:'Space Mono',monospace;font-size:13px;font-weight:700;outline:none;flex:1;}
.sec-btn{font-size:10px;padding:2px 7px;border-radius:4px;border:1px solid var(--border2);background:transparent;color:var(--ink2);cursor:pointer;font-family:'Space Mono',monospace;}
.sec-btn:hover{background:var(--border);color:var(--ink);}
.sec-btn.del{color:var(--red);}
.row-block{border-bottom:1px solid var(--border);padding:8px 12px;}
.row-block:last-child{border-bottom:none;}
.row-meta{display:flex;align-items:center;gap:6px;margin-bottom:4px;}
.row-idx{font-size:8px;color:var(--ink3);}
.bold-toggle{display:flex;align-items:center;gap:3px;font-size:9px;color:var(--ink2);cursor:pointer;}
.bold-toggle input{accent-color:var(--accent);}
.row-del{margin-left:auto;background:none;border:none;color:var(--ink3);cursor:pointer;font-size:11px;}
.row-del:hover{color:var(--red);}

.seg-table{width:100%;border-collapse:collapse;}
.seg-table th{font-size:9px;color:var(--ink3);padding:2px 3px;text-align:left;letter-spacing:1px;border-bottom:1px solid var(--border);}
.seg-table td{padding:1px 2px;vertical-align:middle;}
.seg-table input{background:var(--panel2);border:1px solid var(--border);border-radius:3px;color:var(--ink);font-family:'Space Mono',monospace;font-size:12px;padding:3px 5px;outline:none;transition:border-color .12s;width:100%;}
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
.add-sec-btn{width:calc(100% - 24px);padding:9px 10px;border-radius:10px;border:1px dashed var(--border2);background:rgba(255,255,255,0.01);font-family:'Space Mono',monospace;font-size:10px;color:var(--accent2);cursor:pointer;margin:0 12px 10px;display:block;}
.add-sec-btn:hover{border-color:var(--accent);background:rgba(124,106,247,0.08);}

/* ── 中间状态栏 ── */
.mid-bar{display:flex;align-items:center;flex-wrap:wrap;gap:8px;padding:9px 16px;background:rgba(34,34,40,0.92);border-top:1px solid var(--border);border-bottom:1px solid var(--border2);flex-shrink:0;backdrop-filter:blur(12px);}
.mid-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);font-size:10px;color:var(--ink3);line-height:1;}
.mid-pill strong{color:var(--ink);font-size:10px;font-weight:700;}
.mid-pill.accent strong{color:var(--accent2);}
.mid-pill.warn strong{color:var(--sel);}
.mid-pill.active{background:rgba(106,242,168,0.12);border-color:rgba(106,242,168,0.35);color:rgba(255,255,255,0.72);}
.mid-pill.active strong{color:var(--green);}
.mid-pill.featured{background:rgba(124,106,247,0.12);border-color:rgba(124,106,247,0.28);}
.mid-pill.featured strong{color:#d6cdfd;}
.mid-loc{font-size:10px;color:var(--ink2);}
.mid-sel{font-size:10px;color:var(--sel);}
.mid-tip{font-size:9px;color:var(--ink3);}

/* ── 右：键盘 ── */
.kbd-pane{min-width:0;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:10px;border:1px solid var(--border);border-radius:16px;background:linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015));box-shadow:0 18px 40px rgba(0,0,0,0.2);}
.kbd-pane::-webkit-scrollbar,.seg-pane-inner::-webkit-scrollbar,.top-panel::-webkit-scrollbar{width:8px;height:8px;}
.kbd-pane::-webkit-scrollbar-thumb,.seg-pane-inner::-webkit-scrollbar-thumb,.top-panel::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:999px;}
.kbd-toolbar,.kbd-main,.kbd-actions,.kbd-hintline{border:1px solid var(--border);border-radius:12px;background:rgba(255,255,255,0.025);}
.kbd-toolbar{display:grid;grid-template-columns:1.2fr 1.5fr .9fr;gap:10px;padding:10px;}
.kbd-main{display:grid;grid-template-columns:148px 1fr;gap:10px;padding:10px;}
.kbd-note-panel,.kbd-func-panel{min-width:0;}
.kbd-func-panel{display:flex;flex-direction:column;gap:10px;}
.kbd-group{padding-bottom:2px;}
.kbd-actions{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px;padding:10px;}
.kbd-hintline{display:flex;flex-wrap:wrap;gap:8px;padding:8px 10px;font-size:9px;color:var(--ink2);}
.kbd-hintline span{display:inline-flex;align-items:center;gap:5px;padding:4px 8px;border-radius:999px;background:rgba(255,255,255,0.04);}
.kbd-hintline kbd{font-family:'Space Mono',monospace;font-size:9px;color:var(--ink);background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:5px;padding:2px 6px;}
.kbd-label{font-size:8px;letter-spacing:1.6px;text-transform:uppercase;color:var(--ink3);margin-bottom:4px;}
.kbd-row{display:flex;gap:4px;flex-wrap:wrap;}
.kbd-btn{font-family:'Space Mono',monospace;font-size:11px;padding:6px 8px;border-radius:5px;border:1px solid var(--border2);background:var(--panel2);color:var(--ink2);cursor:pointer;transition:all .1s;min-width:28px;text-align:center;line-height:1;}
.shortcut{font-size:7px;opacity:0.42;display:block;margin-top:2px;}
.numpad{display:grid;grid-template-columns:repeat(3,40px);gap:4px;}
.numpad .kbd-btn{font-size:15px;font-weight:700;padding:8px 0;width:40px;color:var(--ink);min-width:0;}
.kbd-btn.zero{font-size:13px;font-weight:700;color:var(--ink);width:100%;margin-top:4px;padding:8px 0;}
.kbd-func-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}
.dual-builder{border:1px solid var(--border);border-radius:12px;background:rgba(255,255,255,0.025);padding:10px;display:flex;flex-direction:column;gap:8px;}
.dual-head{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:9px;letter-spacing:1.3px;text-transform:uppercase;color:var(--ink3);}
.dual-head strong{color:var(--ink2);font-weight:700;font-size:10px;letter-spacing:0;text-transform:none;}
.dual-row{display:flex;flex-direction:column;gap:5px;}
.dual-row-top{display:flex;align-items:center;gap:6px;}
.dual-row-tag{width:30px;font-size:9px;color:var(--ink3);font-family:'Space Mono',monospace;flex-shrink:0;}
.dual-inp{flex:1;background:var(--panel2);border:1px solid var(--border);border-radius:6px;color:var(--ink);font-family:'Space Mono',monospace;font-size:12px;padding:6px 8px;outline:none;}
.dual-inp:focus{border-color:var(--accent);}
.dual-clear{padding:6px 8px;border-radius:6px;border:1px solid var(--border2);background:var(--panel2);color:var(--ink2);cursor:pointer;font-size:10px;font-family:'Space Mono',monospace;}
.dual-clear:hover{color:var(--ink);border-color:var(--accent2);}
.dual-picks{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:4px;}
.dual-pick{padding:5px 0;border-radius:5px;border:1px solid var(--border2);background:var(--panel2);color:var(--ink2);cursor:pointer;font-family:'Space Mono',monospace;font-size:10px;line-height:1;}
.dual-pick:hover{border-color:var(--accent);color:var(--ink);}
.dual-pick.wide{grid-column:span 2;}
.dual-tools{display:flex;align-items:center;flex-wrap:wrap;gap:6px;padding-top:2px;}
.dual-tool{padding:6px 9px;border-radius:6px;border:1px solid var(--border2);background:var(--panel2);color:var(--ink2);cursor:pointer;font-family:'Space Mono',monospace;font-size:10px;line-height:1;}
.dual-tool.on{background:var(--accent);border-color:var(--accent);color:#fff;}
.dual-tool:hover{color:var(--ink);}
.dual-preview{font-size:10px;color:var(--ink2);font-family:'Space Mono',monospace;display:flex;align-items:center;gap:6px;}
.dual-preview code{font-size:12px;color:var(--ink);background:var(--panel2);border:1px solid var(--border);border-radius:6px;padding:3px 6px;}
.dual-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px;}
.dual-action{padding:8px;border-radius:6px;border:1px solid var(--border2);background:var(--panel2);color:var(--ink);font-family:'Space Mono',monospace;font-size:10px;cursor:pointer;letter-spacing:.4px;}
.dual-action.main{background:var(--accent2);border-color:var(--accent2);color:#fff;}
.dual-action:hover{opacity:.9;}

/* ── 跨格子房子线（preview 层） ── */
.prev-volta{display:inline-flex;align-items:flex-end;position:relative;padding-top:20px;}
.prev-volta::before{content:'';position:absolute;top:3px;left:0;right:0;height:13px;border-top:1.5px solid var(--accent2);border-left:1.5px solid var(--accent2);pointer-events:none;box-sizing:border-box;}
.prev-volta.closed::before{border-right:1.5px solid var(--accent2);}
.prev-volta::after{content:attr(data-v);position:absolute;top:4px;left:3px;font-size:8px;color:var(--accent2);pointer-events:none;font-family:'Space Mono',monospace;}

/* 状态栏 */
/* ── 输入状态栏（总音符/八度/时值/附点/段落/房子线） ── */
.kbd-istate{display:flex;align-items:center;flex-wrap:wrap;gap:0;padding:4px 8px;background:var(--bg);border-radius:5px;border:1px solid var(--border);margin-bottom:5px;min-height:24px;font-family:'Space Mono',monospace;}
.kbd-istate-item{font-size:10px;color:var(--ink3);white-space:nowrap;padding:0 7px 0 0;}
.kbd-istate-item span{color:var(--ink2);}
.kbd-istate-item.hi span{color:var(--accent2);}

.kbd-status{display:flex;align-items:center;gap:6px;padding:5px 8px;background:var(--panel2);border-radius:5px;border:1px solid var(--border);margin-bottom:8px;min-height:28px;}
.kbd-status-loc{font-size:9px;color:var(--ink2);white-space:nowrap;}
.kbd-status-sel{font-size:9px;color:var(--sel);margin-left:4px;white-space:nowrap;}
.kbd-status-tip{font-size:8px;color:var(--ink3);margin-left:auto;}

/* ── 房子线（token 式，和连音线一样） ── */
.jp-volta{display:inline-flex;align-items:flex-end;position:relative;padding-top:20px;}
.jp-volta::before{content:'';position:absolute;top:3px;left:0;right:0;height:13px;border-top:1.5px solid var(--accent2);border-left:1.5px solid var(--accent2);pointer-events:none;box-sizing:border-box;}
.jp-volta.v-close::before{border-right:1.5px solid var(--accent2);}
.jp-volta::after{content:attr(data-v);position:absolute;top:4px;left:3px;font-size:10px;line-height:1;color:var(--accent2);pointer-events:none;font-family:'Space Mono',monospace;}

.kbd-label{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--ink3);margin-bottom:4px;}
.kbd-row{display:flex;gap:4px;flex-wrap:wrap;}
.kbd-btn{font-family:'Space Mono',monospace;font-size:12px;padding:7px 10px;border-radius:5px;border:1px solid var(--border2);background:var(--panel2);color:var(--ink2);cursor:pointer;transition:all .1s;min-width:30px;text-align:center;line-height:1;}
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
.tok-dual-inline{display:none;align-items:center;gap:4px;margin-top:3px;}
.tok-dual-inline.on{display:flex;}
.tok-dual-inline .lbl{font-size:8px;color:var(--ink3);font-family:'Space Mono',monospace;white-space:nowrap;}
.tok-dual-inline .slash{font-size:10px;color:var(--ink3);}
.tok-dual-inline .in{width:36px;background:var(--panel2);border:1px solid var(--border);border-radius:4px;color:var(--ink);font-family:'Space Mono',monospace;font-size:10px;padding:3px 4px;outline:none;}
.tok-dual-inline .in:focus{border-color:var(--accent);}
.tok-dual-inline .btn{padding:4px 6px;border-radius:4px;border:1px solid var(--border2);background:var(--panel2);color:var(--ink2);font-family:'Space Mono',monospace;font-size:9px;cursor:pointer;line-height:1;}
.tok-dual-inline .btn:hover{border-color:var(--accent2);color:var(--ink);}

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



/* 编辑器 A4 纸张背景 - 匹配帖子显示宽度 */
/* 帖子 sw-wrap+sw-lb = 各16px padding，共32px per side
   top-panel 已有 16px padding per side
   所以 previewWrap margin = 32-16 = 16px per side */
#top-preview{
  background-image:repeating-linear-gradient(
    to bottom,
    transparent 0px, transparent 35px,
    rgba(255,255,255,0.05) 35px, rgba(255,255,255,0.05) 36px
  );
}
#previewWrap{
  width:694px; /* 平板竖屏(768px)实测 sw-lb 宽度 */
  max-width:calc(100% - 2px);
  padding:12px 0;
  min-height:200px;
  border-left:1px solid rgba(255,255,255,0.15);
  border-right:1px solid rgba(255,255,255,0.15);
  position:relative;
}
#previewWrap::before{
  content:'帖子内容区';
  position:absolute;top:4px;right:4px;
  font-size:8px;letter-spacing:1px;
  color:rgba(255,255,255,0.2);
  pointer-events:none;
  font-family:monospace;
}

/* 预览 */
.prev-sec{margin-bottom:20px;}
.prev-sec-name{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--ink3);margin-bottom:8px;display:flex;align-items:center;gap:8px;}
.prev-sec-name::after{content:'';flex:1;height:1px;background:var(--border);}
.prev-row{display:flex;flex-wrap:nowrap;align-items:flex-end;margin-bottom:10px;overflow-x:auto;padding-bottom:2px;}
.prev-seg{display:inline-flex;flex-direction:column;align-items:flex-start;margin-right:4px;flex-shrink:0;}
.p-chord{font-family:'Space Mono',monospace;font-size:12px;font-weight:700;color:var(--accent2);margin-bottom:2px;min-height:13px;white-space:nowrap;}
.p-chord.empty{visibility:hidden;}
.p-n{font-family:'Space Mono',monospace;color:var(--ink);margin-bottom:1px;line-height:1.2;display:flex;align-items:flex-end;}
.p-lyric{font-family:'Noto Serif SC',serif;font-size:18px;color:var(--ink2);}
.p-lyric.bold{font-weight:700;color:var(--ink);}
.p-lyric2{opacity:0.65;margin-top:1px;}.p-lyric3{opacity:0.65;margin-top:1px;}.p-lyric4{opacity:0.65;margin-top:1px;}

/* 音符结构 */
.jp-wrap{display:inline-flex;flex-direction:column;align-items:center;vertical-align:bottom;min-width:1em;}
.jp-plain{display:inline-flex;flex-direction:column;align-items:center;vertical-align:bottom;min-width:1em;}
.jp-plain-top{height:12px;}.jp-plain-sym{font-size:15px;line-height:1;text-align:center;}.jp-plain-bot{height:16px;}
.jp-dot-top,.jp-dot-bot{width:1em;font-size:9px;line-height:1;color:var(--ink);text-align:center;display:flex;flex-direction:column;align-items:center;}
.jp-dot-top{height:12px;justify-content:flex-end;}.jp-dot-bot{height:12px;justify-content:flex-start;}
.jp-lines-wrap{width:1em;display:inline-flex;flex-direction:column;align-items:stretch;padding-bottom:4px;position:relative;}
.jp-num-row{width:1em;display:inline-flex;align-items:center;justify-content:center;position:relative;}
.jp-num{font-size:19px;line-height:1;display:inline-block;text-align:center;width:1em;}
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

/* ── 小节线 ── */
.jp-bar{display:inline-flex;flex-direction:column;align-items:flex-start;vertical-align:bottom;}
.jp-bar-top{height:12px;}.jp-bar-bot{height:16px;}
.jp-bar-mid{display:inline-flex;align-items:stretch;height:26px;}
.jb-thin{width:1.5px;background:currentColor;flex-shrink:0;}
.jb-thick{width:3.5px;background:currentColor;flex-shrink:0;}
.jb-dots{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;width:6px;flex-shrink:0;}
.jb-dot{width:3px;height:3px;border-radius:50%;background:currentColor;}

/* ── 延长号 ── */
.jp-fermata{display:inline-flex;flex-direction:column;align-items:center;vertical-align:bottom;position:relative;padding-top:26px;}
.jp-fermata::before{content:'';position:absolute;top:2px;left:50%;transform:translateX(-50%);width:20px;height:10px;border-top:2px solid currentColor;border-left:2px solid currentColor;border-right:2px solid currentColor;border-radius:10px 10px 0 0/10px 10px 0 0;pointer-events:none;box-sizing:border-box;}
.jp-fermata::after{content:'';position:absolute;top:13px;left:50%;transform:translateX(-50%);width:5px;height:5px;border-radius:50%;background:currentColor;pointer-events:none;}
.jp-dual{display:inline-flex;flex-direction:column;align-items:center;justify-content:flex-end;vertical-align:bottom;line-height:1;margin:0 .04em;}
.jp-dual-top,.jp-dual-bot{display:inline-flex;align-items:flex-end;}
.jp-dual-top{margin-bottom:-2px;}
.jp-dual-top .jp-dot-bot{height:7px;}
.jp-dual-bot .jp-dot-top{height:7px;}

/* ── 批量填歌词 modal ── */
.lyfill-overlay{display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.75);align-items:center;justify-content:center;}
.lyfill-overlay.open{display:flex;}
.lyfill-box{background:var(--panel);border:1px solid var(--border2);border-radius:14px;padding:18px;width:480px;max-width:95vw;}
.lyfill-label{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--ink3);margin-bottom:6px;}
.lyfill-hint{font-size:9px;color:var(--ink2);margin-bottom:10px;line-height:1.6;}
.lyfill-ta{width:100%;height:110px;background:var(--bg);border:1px solid var(--border2);border-radius:6px;color:var(--ink);font-family:'Space Mono',monospace;font-size:12px;padding:8px;resize:vertical;outline:none;line-height:1.6;}
.lyfill-ta:focus{border-color:var(--accent);}
.lyfill-scope{display:flex;gap:10px;margin:8px 0 6px;}
.lyfill-scope label{display:flex;align-items:center;gap:4px;font-size:9px;color:var(--ink2);cursor:pointer;font-family:'Space Mono',monospace;}
.lyfill-stats{font-size:9px;min-height:14px;margin-top:4px;}
.lyfill-stats.warn{color:#f0c040;}.lyfill-stats.ok{color:var(--green);}
.lyfill-btns{display:flex;gap:8px;margin-top:10px;}
.lyfill-ok{flex:1;padding:8px;border-radius:6px;border:none;background:var(--accent);color:#fff;font-family:'Space Mono',monospace;font-size:10px;cursor:pointer;letter-spacing:1px;}
.lyfill-ok:hover{opacity:.85;}
.lyfill-cancel{padding:8px 16px;border-radius:6px;border:1px solid var(--border2);background:transparent;color:var(--ink2);font-family:'Space Mono',monospace;font-size:10px;cursor:pointer;}

/* ── 检查状态 modal ── */
.check-overlay{display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.75);align-items:center;justify-content:center;}
.check-overlay.open{display:flex;}
.check-box{background:var(--panel);border:1px solid var(--border2);border-radius:14px;padding:18px;width:420px;max-width:95vw;max-height:80vh;overflow-y:auto;}
.check-title{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--ink3);margin-bottom:12px;}
.check-row{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);}
.check-row:last-child{border-bottom:none;}
.check-sec-name{font-size:10px;color:var(--ink2);flex:1;font-family:'Space Mono',monospace;}
.check-nums{font-size:10px;font-family:'Space Mono',monospace;}
.check-ok{color:var(--green);}.check-warn{color:#f0c040;}
.check-total{margin-top:10px;padding-top:10px;border-top:1px solid var(--border2);font-size:10px;font-family:'Space Mono',monospace;color:var(--ink);}

@media (prefers-color-scheme: light){
  :root{
    --bg:#f3f6fc;--panel:#ffffff;--panel2:#ebf0fa;
    --border:rgba(17,24,39,0.10);--border2:rgba(17,24,39,0.18);
    --ink:rgba(17,24,39,0.92);--ink2:rgba(17,24,39,0.64);--ink3:rgba(17,24,39,0.40);
    --accent:#4a6cff;--accent2:#6d7dff;--red:#d95f5f;--green:#1f9f6c;--sel:#c08a10;
    color-scheme:light;
  }
  body{
    background:
      radial-gradient(circle at top right,rgba(74,108,255,0.14),transparent 28%),
      radial-gradient(circle at bottom left,rgba(208,158,50,0.12),transparent 26%),
      var(--bg);
  }
  .topbar{background:rgba(255,255,255,0.9);}
  .top-panel,.seg-pane,.kbd-pane{
    background:linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,248,255,0.94));
    box-shadow:0 18px 36px rgba(15,23,42,0.10);
  }
  .sec-head,.mid-bar{background:rgba(236,242,252,0.92);}
  .mid-pill{background:rgba(17,24,39,0.04);border-color:rgba(17,24,39,0.08);}
  .mid-pill.active{background:rgba(31,159,108,0.14);border-color:rgba(31,159,108,0.35);color:rgba(18,23,36,0.72);}
  .mid-pill.featured{background:rgba(92,109,255,0.14);border-color:rgba(92,109,255,0.28);}
  .mid-pill.featured strong{color:#3a4bdd;}
  .kbd-pane::-webkit-scrollbar-thumb,.seg-pane-inner::-webkit-scrollbar-thumb,.top-panel::-webkit-scrollbar-thumb{background:rgba(17,24,39,0.16);}
  .kbd-toolbar,.kbd-main,.kbd-actions,.kbd-hintline,.dual-builder{background:rgba(255,255,255,0.82);}
  .kbd-hintline span{background:rgba(17,24,39,0.04);}
  .kbd-hintline kbd{background:rgba(17,24,39,0.08);border-color:rgba(17,24,39,0.18);}
  .kbd-btn.on{box-shadow:0 0 8px rgba(74,108,255,0.35);}
  #top-preview{
    background-image:repeating-linear-gradient(
      to bottom,
      transparent 0px, transparent 35px,
      rgba(17,24,39,0.06) 35px, rgba(17,24,39,0.06) 36px
    );
  }
  #previewWrap{
    border-left:1px solid rgba(17,24,39,0.16);
    border-right:1px solid rgba(17,24,39,0.16);
  }
  #previewWrap::before{color:rgba(17,24,39,0.30);}
}

@media (max-width: 1100px){
  .bottom-area{grid-template-columns:1fr;grid-template-rows:minmax(320px,1fr) minmax(320px,1fr);}
  .kbd-toolbar{grid-template-columns:1fr;}
  .kbd-main{grid-template-columns:1fr;}
  .kbd-actions{grid-template-columns:repeat(3,minmax(0,1fr));}
  .kbd-func-grid{grid-template-columns:1fr;}
  .dual-picks{grid-template-columns:repeat(6,minmax(0,1fr));}
}

@media (max-width: 760px){
  .topbar{align-items:flex-start;flex-direction:column;}
  .topbar-tabs{margin-left:0;justify-content:flex-start;}
  .top-area{padding:12px 12px 8px;}
  .bottom-area{padding:0 12px 12px;gap:12px;}
  .top-panel,.seg-pane,.kbd-pane{border-radius:14px;}
  .mid-bar{padding:10px 12px;}
  .kbd-actions{grid-template-columns:repeat(2,minmax(0,1fr));}
  .dual-actions{grid-template-columns:1fr;}
}
</style>
</head>
<body>

<div class="topbar">
  <div class="dot"></div>
  <div class="topbar-title">简谱编辑器 <span>v3.1</span></div>
  <div class="topbar-tabs">
    <button class="top-tab" onclick="openImport()">导入</button>
    <button class="top-tab" onclick="openBulkLyric()" title="批量填歌词">⌨ 填歌词</button>
    <button class="top-tab" onclick="openCheck()" title="检查音符与歌词数量">⚑ 检查</button>
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

<!-- ── 中间状态 + 位置栏 ── -->
<div class="mid-bar">
  <span class="mid-pill accent"><strong id="statusLoc">点击左边格子开始编辑</strong></span>
  <span class="mid-pill">音符 <strong id="is-total">0</strong></span>
  <span class="mid-pill">八度 <strong id="is-oct">中</strong></span>
  <span class="mid-pill">时值 <strong id="is-dur">4分</strong></span>
  <span class="mid-pill" id="is-dot-pill">附点 <strong id="is-dot">关</strong></span>
  <span class="mid-pill" id="is-fermata-pill">延长号 <strong id="is-fermata">关</strong></span>
  <span class="mid-pill accent">房子线 <strong id="is-volta">无</strong></span>
  <span class="mid-pill warn">选区 <strong id="is-select">0</strong></span>
  <span class="mid-pill">剪贴板 <strong id="is-clip">空</strong></span>
  <span class="mid-sel" id="statusSel"></span>
  <span class="mid-tip" id="statusTip"></span>
</div>

<div class="bottom-area">
  <div class="seg-pane">
    <div class="seg-pane-inner" id="sectionsWrap"></div>
    <button class="add-sec-btn" onclick="addSection()">+ 新增段落</button>
    <button class="add-sec-btn" onclick="openBulkLyric()" style="color:var(--accent2);border-color:rgba(124,106,247,0.3);">⌨ 批量填歌词</button>
  </div>

  <div class="kbd-pane">
    <div class="kbd-toolbar">
      <div>
        <div>
          <div class="kbd-label">八度 <span style="color:var(--ink3);font-size:7px;">↑ ↓</span></div>
          <div class="kbd-row">
            <button class="kbd-btn" id="oct-low2" onclick="setOct('low2')" style="padding:7px 8px;min-width:34px;font-size:11px;">低2</button>
            <button class="kbd-btn" id="oct-low1" onclick="setOct('low1')" style="padding:7px 8px;min-width:34px;font-size:11px;">低1</button>
            <button class="kbd-btn on" id="oct-mid"  onclick="setOct('mid')"  style="padding:7px 8px;min-width:34px;font-size:11px;">中</button>
            <button class="kbd-btn" id="oct-high1" onclick="setOct('high1')" style="padding:7px 8px;min-width:34px;font-size:11px;">高1</button>
            <button class="kbd-btn" id="oct-high2" onclick="setOct('high2')" style="padding:7px 8px;min-width:34px;font-size:11px;">高2</button>
          </div>
        </div>
      </div>
      <div>
        <div class="kbd-label">音值 <span style="color:var(--ink3);font-size:7px;">Q W E R T</span></div>
        <div class="kbd-row">
          <button class="kbd-btn" id="dur-whole" onclick="setDur('whole')" style="padding:8px 10px;min-width:42px;font-size:11px;">全<span class="shortcut">Q</span></button>
          <button class="kbd-btn" id="dur-half" onclick="setDur('half')" style="padding:8px 10px;min-width:42px;font-size:11px;">½<span class="shortcut">W</span></button>
          <button class="kbd-btn on" id="dur-quarter" onclick="setDur('quarter')" style="padding:8px 10px;min-width:42px;font-size:11px;">¼<span class="shortcut">E</span></button>
          <button class="kbd-btn" id="dur-eighth" onclick="setDur('eighth')" style="padding:8px 10px;min-width:42px;font-size:11px;">⅛<span class="shortcut">R</span></button>
          <button class="kbd-btn" id="dur-16th" onclick="setDur('16th')" style="padding:8px 10px;min-width:42px;font-size:11px;">¹⁄₁₆<span class="shortcut">T</span></button>
        </div>
      </div>
      <div>
          <div class="kbd-label">输入模式 <span style="color:var(--ink3);font-size:7px;">I / O</span></div>
          <div class="kbd-row">
            <button class="kbd-btn on" id="mode-insert" onclick="setInputMode('insert')" style="padding:7px 10px;font-size:10px;">插入 I</button>
            <button class="kbd-btn" id="mode-overwrite" onclick="setInputMode('overwrite')" style="padding:7px 10px;font-size:10px;">覆盖 O</button>
          </div>
        </div>
    </div>

    <div class="kbd-main">
      <div class="kbd-note-panel">
        <div class="kbd-label">音符</div>
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

      <div class="kbd-func-panel">
        <div class="kbd-func-grid">
          <div class="kbd-group">
            <div class="kbd-label">基础符号</div>
            <div class="kbd-row">
              <button class="kbd-btn" onclick="inputSpecial('-')" style="padding:6px 8px;">— 延音<span class="shortcut">\\</span></button>
              <button class="kbd-btn" id="dot-btn" onclick="toggleDot()" style="padding:6px 8px;">· 附点 关<span class="shortcut">,</span></button>
              <button class="kbd-btn" id="fermata-btn" onclick="toggleFermata()" style="padding:6px 8px;">𝄐 延长号 关<span class="shortcut">F</span></button>
              <button class="kbd-btn" onclick="appendTok(buildSpacerTok())" style="padding:6px 8px;">␣ 空格<span class="shortcut">Space</span></button>
            </div>
          </div>
          <div class="kbd-group">
            <div class="kbd-label">线条与结构</div>
            <div class="kbd-row">
              <button class="kbd-btn" onclick="appendTok('|')" style="padding:6px 8px;">| 小节线<span class="shortcut">B</span></button>
              <button class="kbd-btn" onclick="appendTok('||')" style="padding:6px 8px;">|| 双小节<span class="shortcut">M</span></button>
              <button class="kbd-btn" onclick="appendTok('||/')" style="padding:6px 8px;">||/ 终止线</button>
              <button class="kbd-btn" onclick="appendTok('|:')" style="padding:6px 8px;">|: 反复开</button>
              <button class="kbd-btn" onclick="appendTok(':|')" style="padding:6px 8px;">:| 反复结</button>
              <button class="kbd-btn" onclick="appendTok('|:|')" style="padding:6px 8px;">|:| 反复段</button>
              <button class="kbd-btn slur-btn" id="slur-btn" onclick="toggleSlur()" style="padding:6px 8px;">( ) 连音<span class="shortcut">[ / S</span></button>
              <button class="kbd-btn slur-btn" id="xslur-btn" onclick="toggleXSlur()" style="padding:6px 8px;">跨线开<span class="shortcut">]</span></button>
              <button class="kbd-btn slur-btn" onclick="closeXSlur()" style="padding:6px 8px;">跨线结<span class="shortcut">X</span></button>
              <button class="kbd-btn slur-btn" id="t3-btn" onclick="toggleTuplet(3)" style="padding:6px 8px;">3连</button>
              <button class="kbd-btn slur-btn" id="t5-btn" onclick="toggleTuplet(5)" style="padding:6px 8px;">5连</button>
            </div>
          </div>
        </div>
        <div class="kbd-group">
          <div class="kbd-label">房子线</div>
          <div class="kbd-row">
            <button class="kbd-btn" onclick="appendTok('[v1')" style="padding:6px 8px;color:var(--accent2);border-color:rgba(124,106,247,0.3);" title="插入第1房子线开始">1. 房开</button>
            <button class="kbd-btn" onclick="appendTok('[v2')" style="padding:6px 8px;color:var(--accent2);border-color:rgba(124,106,247,0.3);" title="插入第2房子线开始">2. 房开</button>
            <button class="kbd-btn" onclick="appendCustomVolta()" style="padding:6px 8px;color:var(--accent2);border-color:rgba(124,106,247,0.3);" title="插入自定义房子线开始">自定义房</button>
            <button class="kbd-btn" onclick="appendTok(']v')" style="padding:6px 8px;color:var(--accent2);border-color:rgba(124,106,247,0.3);" title="插入房子线结束">房结</button>
            <button class="kbd-btn" onclick="appendCustomToken()" style="padding:6px 8px;color:var(--green);border-color:rgba(106,242,168,0.25);" title="插入自定义 token（可输入双行 1/5）">自定义Tok</button>
          </div>
        </div>
      </div>
    </div>

    <div class="dual-builder">
      <div class="dual-head">
        <span>双行简谱可视化输入</span>
        <strong id="dual-mode-stat">4分</strong>
      </div>

      <div class="dual-row">
        <div class="dual-row-top">
          <span class="dual-row-tag">上行</span>
          <input id="dual-top" class="dual-inp" placeholder="例如 1 或 1' 或 sp">
          <button class="dual-clear" onclick="clearDualRow('top')">清</button>
        </div>
        <div class="dual-picks">
          <button class="dual-pick" onclick="dualPick('top','1')">1</button>
          <button class="dual-pick" onclick="dualPick('top','2')">2</button>
          <button class="dual-pick" onclick="dualPick('top','3')">3</button>
          <button class="dual-pick" onclick="dualPick('top','4')">4</button>
          <button class="dual-pick" onclick="dualPick('top','5')">5</button>
          <button class="dual-pick" onclick="dualPick('top','6')">6</button>
          <button class="dual-pick" onclick="dualPick('top','7')">7</button>
          <button class="dual-pick" onclick="dualPick('top','0')">0</button>
          <button class="dual-pick wide" onclick="dualPick('top','sp')">sp</button>
          <button class="dual-pick wide" onclick="dualPick('top','-')">-</button>
        </div>
      </div>

      <div class="dual-row">
        <div class="dual-row-top">
          <span class="dual-row-tag">下行</span>
          <input id="dual-bot" class="dual-inp" placeholder="例如 5 或 5, 或 sp">
          <button class="dual-clear" onclick="clearDualRow('bot')">清</button>
        </div>
        <div class="dual-picks">
          <button class="dual-pick" onclick="dualPick('bot','1')">1</button>
          <button class="dual-pick" onclick="dualPick('bot','2')">2</button>
          <button class="dual-pick" onclick="dualPick('bot','3')">3</button>
          <button class="dual-pick" onclick="dualPick('bot','4')">4</button>
          <button class="dual-pick" onclick="dualPick('bot','5')">5</button>
          <button class="dual-pick" onclick="dualPick('bot','6')">6</button>
          <button class="dual-pick" onclick="dualPick('bot','7')">7</button>
          <button class="dual-pick" onclick="dualPick('bot','0')">0</button>
          <button class="dual-pick wide" onclick="dualPick('bot','sp')">sp</button>
          <button class="dual-pick wide" onclick="dualPick('bot','-')">-</button>
        </div>
      </div>

      <div class="dual-tools">
        <button class="dual-tool on" id="dual-dur-quarter" onclick="setDualDur('quarter')">4分</button>
        <button class="dual-tool" id="dual-dur-eighth" onclick="setDualDur('eighth')">8分</button>
        <button class="dual-tool" id="dual-dur-16th" onclick="setDualDur('16th')">16分</button>
        <button class="dual-tool" id="dual-dot-btn" onclick="toggleDualDot()">附点</button>
        <button class="dual-tool" id="dual-fermata-btn" onclick="toggleDualFermata()">延长号</button>
      </div>

      <div class="dual-preview">预览 token: <code id="dual-preview">1/5</code></div>

      <div class="dual-actions">
        <button class="dual-action main" onclick="insertDualToken()">插入双行</button>
        <button class="dual-action" onclick="clearDualBuilder()">重置面板</button>
      </div>
    </div>

    <div class="kbd-actions">
      <button class="kbd-btn action" onclick="deleteSelected()" style="padding:8px 10px;">⌫ 删除<span class="shortcut">Bksp</span></button>
      <button class="kbd-btn action" onclick="undoAction()" style="padding:8px 10px;">↩ 撤销<span class="shortcut">⌘Z</span></button>
      <button class="kbd-btn action" onclick="clearN()" style="padding:8px 10px;">✕ 清空</button>
      <button class="kbd-btn" onclick="copySeg()" style="padding:8px 10px;color:var(--green);border-color:rgba(106,242,168,0.25);" title="复制整格 (Alt+C)">⬡ 复制格<span class="shortcut">Alt+C</span></button>
      <button class="kbd-btn" onclick="pasteSeg()" style="padding:8px 10px;color:var(--green);border-color:rgba(106,242,168,0.25);" title="粘贴到后面 (Alt+V)">⬡ 粘贴格<span class="shortcut">Alt+V</span></button>
      <button class="kbd-btn" onclick="pasteSegReplace()" style="padding:8px 10px;color:var(--green);border-color:rgba(106,242,168,0.25);" title="覆盖当前格 (Alt+R)">⬡ 覆盖格<span class="shortcut">Alt+R</span></button>
    </div>

    <div class="kbd-hintline">
      <span><kbd>\</kbd> 延音</span>
      <span><kbd>,</kbd> 附点</span>
      <span><kbd>F</kbd> 延长号</span>
      <span><kbd>B</kbd> 小节线</span>
      <span><kbd>M</kbd> 双小节</span>
      <span><kbd>/</kbd> 双行面板</span>
      <span><kbd>I / O</kbd> 插入 / 覆盖</span>
      <span><kbd>↑ / ↓</kbd> 八度</span>
      <span><kbd>Alt+C/V/R</kbd> 格子复制 / 粘贴 / 覆盖</span>
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

var oct='mid', dur='quarter', dotOn=false, fermataOn=false, slurOn=false, xslurOn=false, tupletOn=0;
var dualDur='quarter', dualDot=false, dualFermata=false;
var inlineDualTop='1', inlineDualBot='5';
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
function appendCustomVolta(){
  var label=prompt('输入房线标签，例如 1.2、1.3、2.3');
  if(!label)return;
  label=String(label).trim();
  if(!label)return;
  appendTok('[v:'+label+']');
}
function appendCustomToken(){
  if(curSi<0){alert('请先点选一个简谱格子');return;}
  var raw=prompt('输入 token（可一次输入多个，用空格分隔）\\n双行简谱示例：1/5 2/5 3/6');
  if(raw===null)return;
  var toks=String(raw).trim().split(/\\s+/).filter(Boolean);
  if(!toks.length)return;
  insertToks(toks);
}
function dualInput(which){
  return document.getElementById(which==='bot'?'dual-bot':'dual-top');
}
function dualDurLabel(v){
  return v==='eighth'?'8分':(v==='16th'?'16分':'4分');
}
function updateDualToolUI(){
  ['quarter','eighth','16th'].forEach(function(k){
    var btn=document.getElementById('dual-dur-'+k);
    if(btn)btn.classList.toggle('on',dualDur===k);
  });
  var dotBtn=document.getElementById('dual-dot-btn');
  if(dotBtn)dotBtn.classList.toggle('on',dualDot);
  var fmBtn=document.getElementById('dual-fermata-btn');
  if(fmBtn)fmBtn.classList.toggle('on',dualFermata);
  var stat=document.getElementById('dual-mode-stat');
  if(stat){
    var txt=dualDurLabel(dualDur);
    if(dualDot)txt+=' +附点';
    if(dualFermata)txt+=' +延长';
    stat.textContent=txt;
  }
}
function setDualDur(v){
  dualDur=v;
  updateDualToolUI();
  refreshDualPreview();
}
function toggleDualDot(){
  dualDot=!dualDot;
  updateDualToolUI();
  refreshDualPreview();
}
function toggleDualFermata(){
  dualFermata=!dualFermata;
  updateDualToolUI();
  refreshDualPreview();
}
function dualPick(which,val){
  var el=dualInput(which);
  if(!el)return;
  el.value=val;
  refreshDualPreview();
}
function clearDualRow(which){
  var el=dualInput(which);
  if(!el)return;
  el.value='';
  refreshDualPreview();
}
function applyDualStyle(base){
  var tok=String(base||'').trim().replace(/\s+/g,'');
  if(!tok)return '';
  if(tok==='-'||tok.indexOf('|')>=0)return tok;
  var isSpace=/^sp/.test(tok);
  var hasDur=/_{1,2}$/.test(tok);
  var hasDot=tok.indexOf('·')>=0;
  var hasFermata=/\^$/.test(tok);
  var out=tok;
  if(!hasDot && dualDot && !isSpace)out+='·';
  if(!hasDur){
    if(dualDur==='eighth')out+='_';
    else if(dualDur==='16th')out+='__';
  }
  if(!hasFermata && dualFermata && !isSpace && out!=='-')out+='^';
  return out;
}
function buildDualToken(){
  var topEl=dualInput('top');
  var botEl=dualInput('bot');
  var topRaw=topEl?String(topEl.value||'').trim():'';
  var botRaw=botEl?String(botEl.value||'').trim():'';
  if(!topRaw&&!botRaw)return '';
  var topTok=applyDualStyle(topRaw||'sp');
  var botTok=applyDualStyle(botRaw||'sp');
  return topTok+'/'+botTok;
}
function applyInlineDualStyle(base){
  var tok=String(base||'').trim().replace(/\s+/g,'');
  if(!tok)return '';
  if(tok==='-'||tok.indexOf('|')>=0)return tok;
  var isSpace=/^sp/.test(tok);
  var hasDur=/_{1,2}$/.test(tok);
  var hasDot=tok.indexOf('·')>=0;
  var hasFermata=/\^$/.test(tok);
  var out=tok;
  if(!hasDot && dotOn && !isSpace)out+='·';
  if(!hasDur){
    if(dur==='eighth')out+='_';
    else if(dur==='16th')out+='__';
  }
  if(!hasFermata && fermataOn && !isSpace && out!=='-')out+='^';
  return out;
}
function buildInlineDualToken(topRaw,botRaw){
  var top=String(topRaw||'').trim();
  var bot=String(botRaw||'').trim();
  if(!top&&!bot)return '';
  return applyInlineDualStyle(top||'sp')+'/'+applyInlineDualStyle(bot||'sp');
}
function inlineShiftOct(step){
  var os=['low2','low1','mid','high1','high2'];
  var i=os.indexOf(oct);
  var ni=i+step;
  if(ni>=0&&ni<os.length)setOct(os[ni]);
}
function inlineApplyBasicToken(inp,key){
  if(/^[0-7]$/.test(key)){inp.value=buildTok(parseInt(key,10));return true;}
  if(key===' '){inp.value=buildSpacerTok();return true;}
  if(key==='\\\\' || key==='-'){inp.value='-';return true;}
  return false;
}
function insertInlineDualToken(si,li,gi,topRaw,botRaw){
  var tok=buildInlineDualToken(topRaw,botRaw);
  if(!tok){alert('请先输入上行或下行音符');return;}
  inlineDualTop=String(topRaw||'').trim()||inlineDualTop;
  inlineDualBot=String(botRaw||'').trim()||inlineDualBot;
  if(curSi!==si||curLi!==li||curGi!==gi){
    curSi=si;curLi=li;curGi=gi;curTok=-1;clearSel();
  }
  insertToks([tok]);
}
function refreshDualPreview(){
  var pv=document.getElementById('dual-preview');
  if(!pv)return;
  var tok=buildDualToken();
  pv.textContent=tok||'（待输入）';
}
function insertDualToken(){
  if(curSi<0){alert('请先点选一个简谱格子');return;}
  var tok=buildDualToken();
  if(!tok){alert('请先输入上行或下行音符');return;}
  insertToks([tok]);
}
function clearDualBuilder(){
  var topEl=dualInput('top');
  var botEl=dualInput('bot');
  if(topEl)topEl.value='1';
  if(botEl)botEl.value='5';
  dualDur='quarter';
  dualDot=false;
  dualFermata=false;
  updateDualToolUI();
  refreshDualPreview();
}
function initDualBuilder(){
  var topEl=dualInput('top');
  var botEl=dualInput('bot');
  if(topEl&&!topEl.value)topEl.value='1';
  if(botEl&&!botEl.value)botEl.value='5';
  [topEl,botEl].forEach(function(el){
    if(!el)return;
    el.addEventListener('input',refreshDualPreview);
    el.addEventListener('keydown',function(e){
      if(e.key==='Enter'){
        e.preventDefault();
        insertDualToken();
      }
    });
  });
  updateDualToolUI();
  refreshDualPreview();
}

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
  updateInputState();
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
  updateInputState();
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
  updateInputState();
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
  var selectStat=document.getElementById('is-select');
  var clipStat=document.getElementById('is-clip');
  if(curSi<0){
    loc.textContent='点击左边格子开始编辑';
    sel.textContent=''; tip.textContent='';
    if(selectStat)selectStat.textContent='0';
    if(clipStat)clipStat.textContent=segClipboard?'整格':(tokClipboard.length?tokClipboard.length+' 项':'空');
    return;
  }
  loc.textContent=data[curSi].name+' 行'+(curLi+1)+' 格'+(curGi+1);
  var range=getSelRange();
  var toks=getToks();
  if(range){
    var cnt=Math.min(range.hi,toks.length-1)-range.lo+1;
    sel.textContent='已选 '+cnt+' 个';
    tip.textContent='⌘C复制 ⌘X剪切 ⌘V粘贴 | Alt+C/V/R 格子操作';
    if(selectStat)selectStat.textContent=String(cnt);
  } else if(segClipboard){
    sel.textContent='格子已复制';
    tip.textContent='Alt+V插到后面 Alt+R覆盖当前 | 剪贴板: '+(tokClipboard.length?tokClipboard.join(' '):'空');
    if(selectStat)selectStat.textContent='0';
  } else if(tokClipboard.length){
    sel.textContent='';
    tip.textContent='剪贴板: '+tokClipboard.join(' ');
    if(selectStat)selectStat.textContent='0';
  } else {
    sel.textContent=''; tip.textContent='Alt+C 复制格子';
    if(selectStat)selectStat.textContent='0';
  }
  if(clipStat){
    clipStat.textContent=segClipboard?'整格':(tokClipboard.length?tokClipboard.length+' 项':'空');
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
  updateInputState();
}
function setDur(d){
  dur=d;
  ['whole','half','quarter','eighth','16th'].forEach(function(x){document.getElementById('dur-'+x).classList.toggle('on',x===d);});
  updateInputState();
}
function syncToggleUI(){
  var dotBtn=document.getElementById('dot-btn');
  if(dotBtn){
    dotBtn.classList.toggle('on',dotOn);
    dotBtn.innerHTML='· 附点 '+(dotOn?'开':'关')+'<span class="shortcut">,</span>';
  }
  var fermataBtn=document.getElementById('fermata-btn');
  if(fermataBtn){
    fermataBtn.classList.toggle('on',fermataOn);
    fermataBtn.innerHTML='𝄐 延长号 '+(fermataOn?'开':'关')+'<span class="shortcut">F</span>';
  }
  var dotPill=document.getElementById('is-dot-pill');
  if(dotPill){
    dotPill.classList.toggle('active',dotOn);
    dotPill.innerHTML='附点 <strong id="is-dot">'+(dotOn?'开':'关')+'</strong>';
  }
  var fermataPill=document.getElementById('is-fermata-pill');
  if(fermataPill){
    fermataPill.classList.toggle('active',fermataOn);
    fermataPill.innerHTML='延长号 <strong id="is-fermata">'+(fermataOn?'开':'关')+'</strong>';
  }
}
function toggleDot(){dotOn=!dotOn;syncToggleUI();updateInputState();}
function toggleFermata(){fermataOn=!fermataOn;syncToggleUI();updateInputState();}
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
  if(dotOn)s+='·';
  if(dur==='eighth')s+='_';else if(dur==='16th')s+='__';
  if(fermataOn)s+='^';
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
        tdN.appendChild(tf);
        var dq=document.createElement('div');
        dq.className='tok-dual-inline'+(isActive?' on':'');
        var dql=document.createElement('span');dql.className='lbl';dql.textContent='上下';
        dq.appendChild(dql);
        var dinTop=document.createElement('input');dinTop.className='in';dinTop.placeholder='上';dinTop.value=inlineDualTop;
        dinTop.readOnly=true;
        var slash=document.createElement('span');slash.className='slash';slash.textContent='/';
        var dinBot=document.createElement('input');dinBot.className='in';dinBot.placeholder='下';dinBot.value=inlineDualBot;
        dinBot.readOnly=true;
        var dqbtn=document.createElement('button');dqbtn.className='btn';dqbtn.textContent='+双行';
        [dinTop,dinBot].forEach(function(el){
          el.addEventListener('click',function(e){e.stopPropagation();if(!isActive)focusSeg(si,li,gi,true);});
          el.addEventListener('keydown',function(e){
            var k=e.key;
            if(k==='Enter'){
              e.preventDefault();e.stopPropagation();
              insertInlineDualToken(si,li,gi,dinTop.value,dinBot.value);
              return;
            }
            if(k==='Backspace' || k==='Delete'){
              e.preventDefault();e.stopPropagation();
              el.value='';
              inlineDualTop=dinTop.value;inlineDualBot=dinBot.value;
              return;
            }
            if(e.metaKey||e.ctrlKey||e.altKey)return;
            if(inlineApplyBasicToken(el,k)){
              e.preventDefault();e.stopPropagation();
              inlineDualTop=dinTop.value;inlineDualBot=dinBot.value;
              return;
            }
            if(k==='ArrowUp'){e.preventDefault();e.stopPropagation();inlineShiftOct(1);return;}
            if(k==='ArrowDown'){e.preventDefault();e.stopPropagation();inlineShiftOct(-1);return;}
            if(k==='q'||k==='Q'){e.preventDefault();e.stopPropagation();setDur('whole');return;}
            if(k==='w'||k==='W'){e.preventDefault();e.stopPropagation();setDur('half');return;}
            if(k==='e'||k==='E'){e.preventDefault();e.stopPropagation();setDur('quarter');return;}
            if(k==='r'||k==='R'){e.preventDefault();e.stopPropagation();setDur('eighth');return;}
            if(k==='t'||k==='T'){e.preventDefault();e.stopPropagation();setDur('16th');return;}
            if(k===','){e.preventDefault();e.stopPropagation();toggleDot();return;}
            if(k==='f'||k==='F'){e.preventDefault();e.stopPropagation();toggleFermata();return;}
            if(k.length===1){
              e.preventDefault();e.stopPropagation();
              return;
            }
          });
        });
        dqbtn.onclick=(function(si,li,gi){return function(e){
          e.preventDefault();e.stopPropagation();
          insertInlineDualToken(si,li,gi,dinTop.value,dinBot.value);
        };})(si,li,gi);
        dq.appendChild(dinTop);dq.appendChild(slash);dq.appendChild(dinBot);dq.appendChild(dqbtn);
        tdN.appendChild(dq);
        tr.appendChild(tdN);

        // 歌词（上行 + 可选下行）
        var tdL=document.createElement('td');tdL.style.cssText='vertical-align:middle;';
        var inpL=document.createElement('input');inpL.className='inp-lyric';inpL.value=seg.lyric||'';
        inpL.style.display='block';
        inpL.oninput=(function(si,li,gi){return function(){data[si].lines[li].segs[gi].lyric=this.value;renderPreview();};})(si,li,gi);
        tdL.appendChild(inpL);
        var inpL2=document.createElement('input');inpL2.className='inp-lyric';inpL2.value=seg.lyric2||'';
        inpL2.placeholder='下行…';inpL2.style.cssText='display:block;margin-top:2px;font-size:9px;opacity:0.7;';
        inpL2.oninput=(function(si,li,gi){return function(){data[si].lines[li].segs[gi].lyric2=this.value;renderPreview();};})(si,li,gi);
        tdL.appendChild(inpL2);
        var inpL3=document.createElement('input');inpL3.className='inp-lyric';inpL3.value=seg.lyric3||'';
        inpL3.placeholder='第三行…';inpL3.style.cssText='display:block;margin-top:2px;font-size:9px;opacity:0.7;';
        inpL3.oninput=(function(si,li,gi){return function(){data[si].lines[li].segs[gi].lyric3=this.value;renderPreview();};})(si,li,gi);
        tdL.appendChild(inpL3);
        var inpL4=document.createElement('input');inpL4.className='inp-lyric';inpL4.value=seg.lyric4||'';
        inpL4.placeholder='第四行…';inpL4.style.cssText='display:block;margin-top:2px;font-size:9px;opacity:0.7;';
        inpL4.oninput=(function(si,li,gi){return function(){data[si].lines[li].segs[gi].lyric4=this.value;renderPreview();};})(si,li,gi);
        tdL.appendChild(inpL4);tr.appendChild(tdL);

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
function makeBarline(tok){
  var o=document.createElement('span');o.className='jp-bar';
  var top=document.createElement('span');top.className='jp-bar-top';o.appendChild(top);
  var mid=document.createElement('span');mid.className='jp-bar-mid';
  function thin(){var l=document.createElement('span');l.className='jb-thin';return l;}
  function thick(){var l=document.createElement('span');l.className='jb-thick';return l;}
  function gap(px){var g=document.createElement('span');g.style.width=px+'px';g.style.flexShrink='0';return g;}
  function dots(){var d=document.createElement('span');d.className='jb-dots';var d1=document.createElement('span');d1.className='jb-dot';var d2=document.createElement('span');d2.className='jb-dot';d.appendChild(d1);d.appendChild(d2);return d;}
  if(tok==='|'){mid.appendChild(thin());}
  else if(tok==='||'){mid.appendChild(thin());mid.appendChild(gap(2));mid.appendChild(thin());}
  else if(tok==='||/'||tok==='|]'){mid.appendChild(thin());mid.appendChild(gap(2));mid.appendChild(thick());}
  else if(tok==='|:'){mid.appendChild(thin());mid.appendChild(gap(1));mid.appendChild(thick());mid.appendChild(gap(3));mid.appendChild(dots());}
  else if(tok===':|'){mid.appendChild(dots());mid.appendChild(gap(3));mid.appendChild(thick());mid.appendChild(gap(1));mid.appendChild(thin());}
  else if(tok==='|:|'){mid.appendChild(dots());mid.appendChild(gap(3));mid.appendChild(thick());mid.appendChild(gap(1));mid.appendChild(thick());mid.appendChild(gap(3));mid.appendChild(dots());}
  o.appendChild(mid);
  var bot=document.createElement('span');bot.className='jp-bar-bot';o.appendChild(bot);
  return o;
}
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
function getVoltaStartLabel(nStr){
  if(!nStr)return '';
  var m=nStr.match(/\\[v:([^\\]\\s]+)\\]/);
  if(m&&m[1])return m[1];
  if(nStr.indexOf('[v1')>=0)return '1';
  if(nStr.indexOf('[v2')>=0)return '2';
  return '';
}
function hasVoltaEnd(nStr){
  return !!(nStr&&nStr.indexOf(']v')>=0);
}
function parseJpToken(tok,opts){
  opts=opts||{};
  tok=String(tok||'');
  if(tok==='|'||tok==='||'||tok==='||/'||tok==='|]'||tok==='|:'||tok===':|'||tok==='|:|')return makeBarline(tok);
  var dual=!opts.inDual?parseDualJpToken(tok):null;
  if(dual)return makeDualJpToken(dual);
  if(!tok||tok==='-'||tok===' ')return makeJpPlain(tok);
  var hasFermata=false;
  if(tok.slice(-1)==='^'){hasFermata=true;tok=tok.slice(0,-1);}
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
    if(zm[1].indexOf('·')>-1){var ag=document.createElement('span');ag.className='jp-aug';ag.textContent='·';nr.appendChild(ag);}
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
  if(num.indexOf('·')>-1){isDot=true;num=num.replace(/·/g,'');}
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
  if(hasFermata){var fw=document.createElement('span');fw.className='jp-fermata';fw.appendChild(w);return fw;}
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
  function isDualAtom(tk){
    if(!tk||tk==='/'||tk==='／')return false;
    if(tk==='('||tk===')'||tk==='(['||tk==='])'||tk==='}'||tk==='[v1'||tk==='[v2'||tk===']v')return false;
    if(tk==='|'||tk==='||'||tk==='||/'||tk==='|]'||tk==='|:'||tk===':|'||tk==='|:|')return false;
    if(/^\\{(3|5)$/.test(tk))return false;
    if(/^\\[v:(.+)\\]$/.test(tk))return false;
    return true;
  }
  var rawToks=nStr.trim().split(/\\s+/),toks=[],ti=0;
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
    if(t==='('){var sl=document.createElement('span');sl.className='jp-slur';i++;while(i<toks.length&&toks[i]!==')')sl.appendChild(parseJpToken(toks[i++]));div.appendChild(sl);i++;continue;}
    if(t==='(['){var so=document.createElement('span');so.className='jp-slur-open';i++;while(i<toks.length&&toks[i]!=='])') so.appendChild(parseJpToken(toks[i++]));div.appendChild(so);i++;continue;}
    if(t==='])'){var sc=document.createElement('span');sc.className='jp-slur-close';i++;if(i<toks.length)sc.appendChild(parseJpToken(toks[i++]));div.appendChild(sc);continue;}
    if(t==='[v1'||t==='[v2'||t===']v'||/^\\[v:(.+)\\]$/.test(t)){i++;continue;} // 跨格volta由renderPreview层处理
    var tm=t.match(/^\\{(3|5)$/);if(tm){var tn=parseInt(tm[1],10);var tp=makeTuplet(tn);i++;while(i<toks.length&&toks[i]!=='}')tp.appendChild(parseJpToken(toks[i++]));div.appendChild(tp);i++;continue;}
    if(t==='}'){i++;continue;}
    div.appendChild(parseJpToken(t));i++;
  }
  return div;
}
function fitPreview(){
  requestAnimationFrame(function(){
    var wrap=document.getElementById('previewWrap');
    var inner=wrap.querySelector('.prev-inner');
    if(!inner)return;
    inner.style.transform='';inner.style.transformOrigin='';inner.style.width='';inner.style.marginBottom='';
    var avail=wrap.clientWidth;
    if(!avail)return;
    var maxW=0;
    inner.querySelectorAll('.prev-row').forEach(function(row){
      row.style.display='inline-flex';
      if(row.scrollWidth>maxW)maxW=row.scrollWidth;
      row.style.display='';
    });
    if(maxW>avail){
      var scale=avail/maxW;
      inner.style.transform='scale('+scale+')';
      inner.style.transformOrigin='left top';
      inner.style.width=maxW+'px';
      var h=inner.offsetHeight;
      inner.style.marginBottom=(h*(scale-1))+'px';
    }
  });
}
function renderPreview(){
  var wrap=document.getElementById('previewWrap');wrap.innerHTML='';
  var inner=document.createElement('div');inner.className='prev-inner';

  // scoreImg 预览
  var scoreUrl=(document.getElementById('meta-scoreimg')&&document.getElementById('meta-scoreimg').value)||'';
  if(scoreUrl){
    var si=document.createElement('div');si.style.cssText='margin-bottom:12px;';
    var img=document.createElement('img');img.src=scoreUrl;
    img.style.cssText='max-width:100%;border-radius:6px;border:1px solid var(--border);display:block;';
    img.onerror=function(){si.style.display='none';};
    si.appendChild(img);inner.appendChild(si);
  }

  data.forEach(function(sec){
    var ps=document.createElement('div');ps.className='prev-sec';
    var pn=document.createElement('div');pn.className='prev-sec-name';pn.textContent=sec.name;ps.appendChild(pn);
    sec.lines.forEach(function(line){
      var row=document.createElement('div');row.className='prev-row'+(line.bold?' bold':'');
      var voltaWrap=null;
      line.segs.forEach(function(seg){
        var s=document.createElement('div');s.className='prev-seg';
        var c=document.createElement('div');c.className='p-chord'+(seg.chord?'':' empty');c.textContent=seg.chord||'\u00a0';s.appendChild(c);
        if(seg.n&&seg.n.trim())s.appendChild(renderNStr(seg.n));
        var l=document.createElement('div');l.className='p-lyric'+(line.bold?' bold':'');l.textContent=seg.lyric||'';s.appendChild(l);
        if(seg.lyric2){var l2=document.createElement('div');l2.className='p-lyric p-lyric2'+(line.bold?' bold':'');l2.textContent=seg.lyric2;s.appendChild(l2);}
        if(seg.lyric3){var l3=document.createElement('div');l3.className='p-lyric p-lyric3'+(line.bold?' bold':'');l3.textContent=seg.lyric3;s.appendChild(l3);}
        if(seg.lyric4){var l4=document.createElement('div');l4.className='p-lyric p-lyric4'+(line.bold?' bold':'');l4.textContent=seg.lyric4;s.appendChild(l4);}
        // 检测 volta 开始（indexOf 避免反斜杠在 CMS 里丢失）
        var _vn=getVoltaStartLabel(seg.n);
        if(_vn){
          voltaWrap=document.createElement('span');
          voltaWrap.className='prev-volta';
          voltaWrap.setAttribute('data-v',_vn+'.');
        }
        (voltaWrap||row).appendChild(s);
        // 检测 volta 结束
        if(voltaWrap&&hasVoltaEnd(seg.n)){
          voltaWrap.classList.add('closed');
          row.appendChild(voltaWrap);
          voltaWrap=null;
        }
      });
      if(voltaWrap)row.appendChild(voltaWrap); // 未闭合的 volta
      ps.appendChild(row);
    });
    inner.appendChild(ps);
  });
  wrap.appendChild(inner);
  fitPreview();
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
      var isObj=line.bold;
      if(isObj){
        lines.push('      { "b": true, "line": [');
      } else {
        lines.push('      [');
      }
      line.segs.forEach(function(seg,gi){
        var lastSeg=gi===line.segs.length-1;
        var obj={chord:seg.chord||''};
        if(seg.n&&seg.n.trim())obj.n=seg.n;
        obj.lyric=seg.lyric||'';
        if(seg.lyric2)obj.lyric2=seg.lyric2;
        if(seg.lyric3)obj.lyric3=seg.lyric3;
        if(seg.lyric4)obj.lyric4=seg.lyric4;
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
  if(k==='/' || k==='／'){
    e.preventDefault();
    var dualTop=document.getElementById('dual-top');
    if(dualTop){dualTop.focus();dualTop.select();}
    else appendCustomToken();
    return;
  }
  if(curSi<0)return;
  if(/^[0-7]$/.test(k)){e.preventDefault();inputNote(parseInt(k));return;}
  if(k===' '){e.preventDefault();appendTok(buildSpacerTok());return;}
  if(k==='\\\\' || k==='-'){e.preventDefault();inputSpecial('-');return;}
  if(k==='Backspace'){e.preventDefault();deleteSelected();return;}
  if(k==='Escape'){e.preventDefault();clearSel();renderEditor();reactivate();updateStatus();return;}
  if(k==='ArrowLeft'){e.preventDefault();moveCursor('left');return;}
  if(k==='ArrowRight'){e.preventDefault();moveCursor('right');return;}
  if(k==='ArrowUp'){e.preventDefault();var os=['low2','low1','mid','high1','high2'];var i=os.indexOf(oct);if(i<os.length-1)setOct(os[i+1]);return;}
  if(k==='ArrowDown'){e.preventDefault();var os=['low2','low1','mid','high1','high2'];var i=os.indexOf(oct);if(i>0)setOct(os[i-1]);return;}
  if(k===','){e.preventDefault();toggleDot();return;}
  if(k==='[' || k==='s' || k==='S'){e.preventDefault();toggleSlur();return;}
  if(k===']'){e.preventDefault();toggleXSlur();return;}
  if(k==='x' || k==='X'){e.preventDefault();closeXSlur();return;}
  if(k==='f' || k==='F'){e.preventDefault();toggleFermata();return;}
  if(k==='b' || k==='B'){e.preventDefault();appendTok('|');return;}
  if(k==='m' || k==='M'){e.preventDefault();appendTok('||');return;}
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


/* ════════════════════════════════════════
   批量填歌词
════════════════════════════════════════ */
function _getLyricSlots(scopeSi){
  // 返回所有有音符的 seg 引用（n 非空）
  // scopeSi >= 0 时只处理该段落
  var slots=[];
  var secs=(scopeSi>=0)?[{sec:data[scopeSi],si:scopeSi}]:data.map(function(s,i){return{sec:s,si:i};});
  secs.forEach(function(item){
    item.sec.lines.forEach(function(line,li){
      line.segs.forEach(function(seg,gi){
        if(seg.n&&seg.n.trim())slots.push({seg:seg,si:item.si,li:li,gi:gi});
      });
    });
  });
  return slots;
}
function _lyfillScope(){
  var el=document.querySelector('input[name="lyfill-scope"]:checked');
  return el?el.value:'all';
}
function openBulkLyric(){
  document.getElementById('lyfillOverlay').classList.add('open');
  document.getElementById('lyfillTA').value='';
  document.getElementById('lyfillStats').textContent='';
  document.getElementById('lyfillStats').className='lyfill-stats';
  setTimeout(function(){document.getElementById('lyfillTA').focus();},50);
}
function closeBulkLyric(){
  document.getElementById('lyfillOverlay').classList.remove('open');
}
function updateLyfillStats(){
  var text=document.getElementById('lyfillTA').value.replace(/\\s/g,'');
  var scope=_lyfillScope();
  var scopeSi=(scope==='cur'&&curSi>=0)?curSi:-1;
  var slots=_getLyricSlots(scopeSi);
  var el=document.getElementById('lyfillStats');
  if(!text){el.textContent='';el.className='lyfill-stats';return;}
  var msg='歌词字数: '+text.length+'  /  音符格数: '+slots.length;
  if(text.length===slots.length){el.className='lyfill-stats ok';msg+='  ✓ 完全匹配';}
  else if(text.length>slots.length){el.className='lyfill-stats warn';msg+='  ⚠ 歌词多 '+(text.length-slots.length)+' 字（多余部分忽略）';}
  else{el.className='lyfill-stats warn';msg+='  ⚠ 歌词少 '+(slots.length-text.length)+' 字（剩余格子将清空）';}
  el.textContent=msg;
}
function applyBulkLyric(){
  var text=document.getElementById('lyfillTA').value.replace(/\\s/g,'');
  if(!text){closeBulkLyric();return;}
  var scope=_lyfillScope();
  var scopeSi=(scope==='cur'&&curSi>=0)?curSi:-1;
  var slots=_getLyricSlots(scopeSi);
  saveUndo();
  slots.forEach(function(item,i){
    item.seg.lyric=i<text.length?text[i]:'';
  });
  closeBulkLyric();
  renderEditor();
  if(curSi>=0)reactivate();
}
document.getElementById('lyfillOverlay').addEventListener('click',function(e){if(e.target===this)closeBulkLyric();});
document.getElementById('lyfillTA').addEventListener('input',updateLyfillStats);
(function(){
  var radios=document.querySelectorAll('input[name="lyfill-scope"]');
  radios.forEach(function(r){r.addEventListener('change',updateLyfillStats);});
})();

/* ════════════════════════════════════════
   检查状态（音符 / 歌词 对照）
════════════════════════════════════════ */
function openCheck(){
  var content=document.getElementById('checkContent');
  content.innerHTML='';
  var totalN=0,totalL=0;
  data.forEach(function(sec){
    var noteCount=0,lyricCount=0;
    sec.lines.forEach(function(line){
      line.segs.forEach(function(seg){
        if(seg.n&&seg.n.trim()){
          noteCount++;
          if(seg.lyric&&seg.lyric.trim())lyricCount++;
        }
      });
    });
    totalN+=noteCount;totalL+=lyricCount;
    var row=document.createElement('div');row.className='check-row';
    var nm=document.createElement('span');nm.className='check-sec-name';nm.textContent=sec.name||'（无名）';row.appendChild(nm);
    var nums=document.createElement('span');
    nums.className='check-nums '+(lyricCount===noteCount?'check-ok':'check-warn');
    nums.textContent='歌词 '+lyricCount+' / 音符 '+noteCount+(lyricCount===noteCount?' ✓':' ⚠');
    row.appendChild(nums);content.appendChild(row);
  });
  var tot=document.createElement('div');tot.className='check-total';
  var cls=totalL===totalN?'check-ok':'check-warn';
  tot.innerHTML='合计：歌词 <span class="'+cls+'">'+totalL+'</span> / 音符 '+totalN+(totalL===totalN?' &nbsp;<span class="check-ok">✓ 全部匹配</span>':' &nbsp;<span class="check-warn">⚠ 有未填歌词</span>');
  content.appendChild(tot);
  document.getElementById('checkOverlay').classList.add('open');
}
function closeCheck(){
  document.getElementById('checkOverlay').classList.remove('open');
}
document.getElementById('checkOverlay').addEventListener('click',function(e){if(e.target===this)closeCheck();});


/* ════════════════════════════════════════
   输入状态栏更新
════════════════════════════════════════ */
var _durLabel={whole:'全音符',half:'2分',quarter:'4分',eighth:'8分','16th':'16分'};
var _octLabel={low2:'低2',low1:'低1',mid:'中',high1:'高1',high2:'高2'};
function updateInputState(){
  // 总音符：统计全部 data 中有 n 的 seg
  var total=0;
  data.forEach(function(sec){sec.lines.forEach(function(line){line.segs.forEach(function(seg){if(seg.n&&seg.n.trim())total++;});});});
  var _si=document.getElementById('is-total');if(_si)_si.textContent=total;
  var _so=document.getElementById('is-oct');if(_so)_so.textContent=_octLabel[oct]||oct;
  var _sd=document.getElementById('is-dur');if(_sd)_sd.textContent=_durLabel[dur]||dur;
  var _ss=document.getElementById('is-sec');if(_ss)_ss.textContent=(curSi>=0&&data[curSi])?data[curSi].name:'无';
  // 房子线：当前格子的 n 里是否含有 volta token
  var voltaStr='无';
  if(curSi>=0&&curLi>=0&&curGi>=0){
    var curN=(data[curSi]&&data[curSi].lines[curLi]&&data[curSi].lines[curLi].segs[curGi])||{};
    var vl=getVoltaStartLabel(curN.n);
    if(vl)voltaStr=vl+'房';
    else if(hasVoltaEnd(curN.n))voltaStr='房尾';
  }
  var voltaEl=document.getElementById('is-volta');
  if(voltaEl)voltaEl.textContent=voltaStr;
  syncToggleUI();
  var voltaPill=voltaEl&&voltaEl.parentElement;
  if(voltaPill){
    voltaPill.classList.toggle('featured',voltaStr!=='无');
    voltaPill.classList.toggle('accent',voltaStr==='无');
  }
  var clip=document.getElementById('is-clip');
  if(clip)clip.textContent=segClipboard?'整格':(tokClipboard.length?tokClipboard.length+' 项':'空');
}

// scoreImg 变更时刷新预览
(function(){
  var el=document.getElementById('meta-scoreimg');
  if(el)el.addEventListener('input',function(){renderPreview();});
})();

// Expose handlers for inline onclick/oninput hooks rendered in HTML strings.
Object.assign(window, {
  openImport: openImport,
  closeImport: closeImport,
  doImport: doImport,
  openBulkLyric: openBulkLyric,
  closeBulkLyric: closeBulkLyric,
  applyBulkLyric: applyBulkLyric,
  openCheck: openCheck,
  closeCheck: closeCheck,
  switchTop: switchTop,
  copyCode: copyCode,
  copyFullJson: copyFullJson,
  addSection: addSection,
  addLine: addLine,
  delSection: delSection,
  moveLine: moveLine,
  delLine: delLine,
  setOct: setOct,
  setDur: setDur,
  setInputMode: setInputMode,
  inputNote: inputNote,
  inputSpecial: inputSpecial,
  appendTok: appendTok,
  appendCustomVolta: appendCustomVolta,
  appendCustomToken: appendCustomToken,
  setDualDur: setDualDur,
  toggleDualDot: toggleDualDot,
  toggleDualFermata: toggleDualFermata,
  dualPick: dualPick,
  clearDualRow: clearDualRow,
  insertDualToken: insertDualToken,
  clearDualBuilder: clearDualBuilder,
  toggleDot: toggleDot,
  toggleSlur: toggleSlur,
  toggleXSlur: toggleXSlur,
  closeXSlur: closeXSlur,
  toggleTuplet: toggleTuplet,
  deleteSelected: deleteSelected,
  undoAction: undoAction,
  clearN: clearN,
  copySeg: copySeg,
  pasteSeg: pasteSeg,
  pasteSegReplace: pasteSegReplace
});

/* 初始化 */
refreshTupletBtns();
renderEditor();
updateInputState();
initDualBuilder();
</script>
<!-- ── 批量填歌词 modal ── -->
<div class="lyfill-overlay" id="lyfillOverlay">
  <div class="lyfill-box">
    <div class="lyfill-label">批量填歌词</div>
    <div class="lyfill-hint">粘入歌词文字（连续字符），按顺序自动填入有音符的格子。已有歌词会被覆盖。空格与换行会被忽略。</div>
    <textarea class="lyfill-ta" id="lyfillTA" placeholder="请在这里粘入歌词…"></textarea>
    <div class="lyfill-scope">
      <label><input type="radio" name="lyfill-scope" value="all" checked> 全部段落</label>
      <label><input type="radio" name="lyfill-scope" value="cur"> 仅当前段落</label>
    </div>
    <div class="lyfill-stats" id="lyfillStats"></div>
    <div class="lyfill-btns">
      <button class="lyfill-ok" onclick="applyBulkLyric()">填入</button>
      <button class="lyfill-cancel" onclick="closeBulkLyric()">取消</button>
    </div>
  </div>
</div>

<!-- ── 检查状态 modal ── -->
<div class="check-overlay" id="checkOverlay">
  <div class="check-box">
    <div class="check-title">音符 / 歌词 对照检查</div>
    <div id="checkContent"></div>
    <div style="margin-top:12px;text-align:right;">
      <button class="lyfill-cancel" onclick="closeCheck()">关闭</button>
    </div>
  </div>
</div>

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

audio.addEventListener('timeupdate', () => { updateTimeClock(); updateProg(); if(autoScroll) highlightPlaying(); });
audio.addEventListener('play',  updatePlayBtn);
audio.addEventListener('pause', updatePlayBtn);
audio.addEventListener('ended', updatePlayBtn);

function fmt(s){ const m=Math.floor(s/60),sec=s%60; return String(m).padStart(2,'0')+':'+sec.toFixed(2).padStart(5,'0'); }
function fmtLRC(s){ return '['+fmt(s)+']'; }
function updateTimeClock(){ $('mt-time').textContent='['+fmt(audio.currentTime)+']'; }
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
    const timeMap = {}; // 相同时间戳合并为双语（用 | 连接）
    e.target.result.split('\n').forEach(l => {
      const mm = l.match(/^\[(ar|ti|al|by):([^\]]*)\]/i);
      if(mm){ const k=mm[1].toLowerCase(),v=mm[2].trim(); $('mt-meta-'+k) && ($('mt-meta-'+k).value=v); return; }
      const m = l.match(/^\[(\d+):(\d+\.\d+)\](.*)/);
      if(m){
        const t = parseInt(m[1])*60+parseFloat(m[2]);
        const txt = m[3].trim();
        const key = t.toFixed(2);
        if(timeMap[key] !== undefined){
          // 双语LRC：相同时间戳 → 合并用 | 连接
          parsed[timeMap[key]].text += ' | ' + txt;
        } else {
          timeMap[key] = parsed.length;
          parsed.push({time:t, text:txt});
        }
      }
    });
    if(parsed.length){ lrcData=parsed; renderLines(); }
  };
  reader.readAsText(this.files[0]);
};

/* 上传文本 */
$('mt-btn-txt').onclick = () => $('mt-modal-txt').classList.add('open');
$('mt-txt-file').onchange = function(){
  if(!this.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    lrcData = e.target.result.split('\n').map(t => ({time:null, text:t.trim()})).filter(l=>l.text);
    renderLines();
  };
  reader.readAsText(this.files[0]);
};
$('mt-txt-ok').onclick = () => {
  const raw = $('mt-txt-ta').value;
  if(!raw.trim()) return;
  lrcData = raw.split('\n').map(t => ({time:null, text:t.trim()})).filter(l=>l.text);
  $('mt-modal-txt').classList.remove('open');
  $('mt-txt-ta').value = '';
  renderLines();
};
$('mt-txt-cancel').onclick = () => { $('mt-modal-txt').classList.remove('open'); };

/* 查找歌词 */
$('mt-btn-find').onclick = () => window.open('https://music.liuzhijin.cn/', '_blank');

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
function buildLRCmeta(){
  const ar=$('mt-meta-ar').value, ti=$('mt-meta-ti').value,
        al=$('mt-meta-al').value, by=$('mt-meta-by').value;
  const lines=[];
  if(ar) lines.push('[ar:'+ar+']');
  if(ti) lines.push('[ti:'+ti+']');
  if(al) lines.push('[al:'+al+']');
  if(by) lines.push('[by:'+by+']');
  return {lines, ti};
}
function doDownloadLRC(twin){
  const {lines, ti} = buildLRCmeta();
  if(!twin){
    lrcData.forEach(l => { if(l.time!==null) lines.push(fmtLRC(l.time)+l.text); });
  } else {
    // 双语LRC：同一时间戳出现两次，分别为 | 左边和右边
    const left=[], right=[];
    lrcData.forEach(l => {
      if(l.time===null) return;
      const parts = l.text.split(/(?<!\\)\|/); // 按未转义 | 分割
      left.push({time:l.time, text:(parts[0]||'').trim()});
      right.push({time:l.time, text:(parts[1]||'').trim()});
    });
    left.forEach(l => lines.push(fmtLRC(l.time)+l.text));
    right.forEach(l => lines.push(fmtLRC(l.time)+l.text));
  }
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain'}));
  a.download=(ti||'lyrics')+'.lrc';
  a.click();
}
$('mt-btn-dl').onclick = () => doDownloadLRC(false);
$('mt-btn-dl-twin').onclick = () => doDownloadLRC(true);

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

    // 时间戳（双击编辑）
    const tsWrap = document.createElement('div');
    tsWrap.className = 'mt-ly-ts-wrap';
    const ts = document.createElement('span');
    ts.className = 'mt-ly-time' + (l.time===null?' unstamped':'');
    ts.textContent = l.time!==null ? fmtLRC(l.time) : '[--:--.--]';
    if(l.time!==null) ts.onclick = () => { audio.currentTime=l.time; };
    // 双击进入编辑模式
    ts.ondblclick = (e) => {
      e.stopPropagation();
      const inp = document.createElement('input');
      inp.type='text'; inp.className='mt-ly-time-edit';
      inp.value = l.time!==null ? fmtLRC(l.time) : '[00:00.00]';
      inp.select();
      const commit = () => {
        const m = inp.value.match(/\[?(\d+):(\d+\.\d+)\]?/);
        if(m){ lrcData[i].time = parseInt(m[1])*60+parseFloat(m[2]); }
        renderLines();
      };
      inp.onblur = commit;
      inp.onkeydown = e2 => { if(e2.key==='Enter') inp.blur(); if(e2.key==='Escape'){ inp.onblur=null; tsWrap.replaceChild(ts,inp); } };
      tsWrap.replaceChild(inp, ts);
      inp.focus(); inp.select();
    };
    tsWrap.appendChild(ts);
    row.appendChild(tsWrap);

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
      '双行简谱写法：上行/下行，例如 1/5',
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

/* ── 持续隐藏侧边栏（防止动态插入） ── */
(function hideSidebar(){
  const SELECTORS = [
    'aside',
    '[class*="sidebar"]',
    '[class*="side-bar"]',
    '[id*="sidebar"]',
    '[id*="side-bar"]',
    '#header-menu',
    'footer',
    '.mt-10',
  ];
  function hideAll(){
    SELECTORS.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.style.setProperty('display','none','important');
        el.style.setProperty('width','0','important');
        el.style.setProperty('min-width','0','important');
        el.style.setProperty('visibility','hidden','important');
      });
    });
    // 让 section.mx-auto 保持单列
    document.querySelectorAll('section.mx-auto').forEach(el => {
      el.style.setProperty('grid-template-columns','1fr','important');
      el.style.setProperty('max-width','100%','important');
    });
  }
  hideAll();
  const observer = new MutationObserver(hideAll);
  observer.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['style','class'] });
})();

})();
