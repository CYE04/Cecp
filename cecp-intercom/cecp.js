/* ============================================================
   CECP 敬拜团内通系统 — Frontend Script
   Usage:
     <div id="cecp-root"
          data-ws-url="wss://cecp-ws.YOUR_SUBDOMAIN.workers.dev"
          data-mode="client">          <!-- or "operator" -->
     </div>
     <script src="cecp.js"></script>
   Optional:
     data-presets='["🎤 橘色话筒","🎤 蓝色话筒"]'
     data-cues='[{"kind":"self_up","icon":"🔊","label":"多点自己","desc":"自己声音太小听不清"}]'
     data-broadcast-presets='["排练开始","下一首"]'
   ============================================================ */

(function () {
  'use strict';

  var ROOT = document.getElementById('cecp-root');
  if (!ROOT) return;

  var WS_URL = (ROOT.dataset.wsUrl || '').trim();
  if (!WS_URL) {
    ROOT.innerHTML = '<p style="color:#E05A5A;padding:1rem">缺少 data-ws-url 属性</p>';
    return;
  }

  var MODE = ROOT.dataset.mode
    || new URLSearchParams(location.search).get('mode')
    || 'client';

  var DEFAULT_PRESETS = [
    '🎤 橘色话筒',
    '🎤 绿色话筒',
    '🎤 紫色话筒',
    '🎤 黄色话筒',
    '🎤 红色话筒',
    '🎤 蓝色话筒',
    '🎤 白色话筒',
    '🎤 黑色话筒',
    '🎤 棕色话筒'
  ];

  var DEFAULT_CUES = [
    { kind: 'more_monitor', icon: '🎧', label: '耳返多点', desc: '耳返整体声音太小' },
    { kind: 'self_up',      icon: '🔊', label: '多点自己', desc: '自己声音太小听不清' },
    { kind: 'self_down',    icon: '🔉', label: '少点自己', desc: '自己声音太大了' },
    { kind: 'piano_up',     icon: '🎹', label: '琴声多点', desc: '琴声太小听不清' },
    { kind: 'piano_down',   icon: '🎹', label: '琴声少点', desc: '琴声太大了' },
    { kind: 'issue',        icon: '⚠️', label: '设备故障', desc: '需要帮忙处理' }
  ];

  var DEFAULT_BCAST_PRESETS = ['排练开始', '排练结束', '下一首', '重来', '稍等一下'];

  var PRESETS = readPresetList(ROOT.dataset.presets, DEFAULT_PRESETS);
  var CUES = readCueList(ROOT.dataset.cues, DEFAULT_CUES);
  var BCAST_PRESETS = readPresetList(ROOT.dataset.broadcastPresets, DEFAULT_BCAST_PRESETS);

  var KIND_ICONS = {
    more_monitor: '🎧',
    self_up: '🔊',
    self_down: '🔉',
    piano_up: '🎹',
    piano_down: '🎹',
    issue: '⚠️',
    custom: '💬'
  };

  var STORAGE_KEY = 'cecp:intercom:last-role:' + WS_URL;

  var ws = null;
  var whoAmI = '';
  var reconnectTimer = null;
  var pingTimer = null;
  var msgLog = [];
  var flashTimers = {};

  function stripMicPrefix(value) {
    return String(value || '')
      .replace(/^🎤\s*/u, '')
      .trim();
  }

  function detectIdentityTone(name) {
    var text = stripMicPrefix(name);
    if (/橘/.test(text)) return 'orange';
    if (/绿/.test(text)) return 'green';
    if (/紫/.test(text)) return 'purple';
    if (/黄/.test(text)) return 'yellow';
    if (/红/.test(text)) return 'red';
    if (/蓝/.test(text)) return 'blue';
    if (/白/.test(text)) return 'white';
    if (/黑/.test(text)) return 'black';
    if (/棕|褐|咖/.test(text)) return 'brown';
    return 'default';
  }

  function getIdentityMeta(name) {
    var displayName = String(name || '').trim();
    var title = stripMicPrefix(displayName) || displayName;
    return {
      displayName: displayName,
      title: title,
      tone: detectIdentityTone(displayName)
    };
  }

  function renderIdentityPill(name, extraClass) {
    var meta = getIdentityMeta(name);
    return [
      '<span class="cf-identity-pill cf-tone-', meta.tone, extraClass ? ' ' + extraClass : '', '">',
      '  <span class="cf-identity-swatch"></span>',
      '  <span class="cf-identity-text">', escapeHtml(meta.title), '</span>',
      '</span>'
    ].join('');
  }

  function renderPresetButton(preset, isSelected) {
    var meta = getIdentityMeta(preset);
    return [
      '<button class="cf-preset-btn cf-tone-', meta.tone, isSelected ? ' sel' : '', '" data-name="', escapeHtml(meta.displayName), '">',
      '  <span class="cf-preset-led"></span>',
      '  <span class="cf-preset-mic">🎤</span>',
      '  <span class="cf-preset-copy">',
      '    <span class="cf-preset-name">', escapeHtml(meta.title), '</span>',
      '    <span class="cf-preset-sub">现场无线话筒</span>',
      '  </span>',
      '</button>'
    ].join('');
  }

  function updateSelectedPreview(name) {
    var selectedEl = ROOT.querySelector('#cf-selected');
    if (!selectedEl) return;

    if (!name) {
      selectedEl.classList.remove('show');
      selectedEl.innerHTML = '';
      return;
    }

    selectedEl.classList.add('show');
    selectedEl.innerHTML = [
      '<span class="cf-selected-label">当前选择</span>',
      renderIdentityPill(name, 'cf-selected-pill')
    ].join('');
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function parseJsonMaybe(raw) {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (err) {
      console.warn('[cecp-intercom] JSON parse failed:', err);
      return null;
    }
  }

  function readPresetList(raw, fallback) {
    var parsed = parseJsonMaybe(raw);
    if (!Array.isArray(parsed)) return fallback.slice();

    return parsed
      .map(function (item) { return String(item == null ? '' : item).trim(); })
      .filter(Boolean);
  }

  function readCueList(raw, fallback) {
    var parsed = parseJsonMaybe(raw);
    if (!Array.isArray(parsed)) return fallback.slice();

    var normalized = parsed
      .map(function (item) {
        if (!item || typeof item !== 'object') return null;
        var kind = String(item.kind || '').trim();
        var label = String(item.label || '').trim();
        if (!kind || !label) return null;
        return {
          kind: kind,
          icon: String(item.icon || '💬'),
          label: label,
          desc: String(item.desc || '')
        };
      })
      .filter(Boolean);

    return normalized.length ? normalized : fallback.slice();
  }

  function rememberName(name) {
    try {
      localStorage.setItem(STORAGE_KEY, name);
    } catch (err) {}
  }

  function readRememberedName() {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch (err) {
      return '';
    }
  }

  function renderSetup() {
    var remembered = readRememberedName();
    var selected = PRESETS.indexOf(remembered) >= 0 ? remembered : '';

    ROOT.innerHTML = [
      '<div class="cf-setup-card">',
      '  <div class="cf-setup-kicker">WORSHIP COMMS</div>',
      '  <h2>选择你手上的话筒</h2>',
      '  <p class="cf-setup-sub">音控台会按颜色快速识别你，现场沟通更直观。</p>',
      '  <div class="cf-preset-grid">',
      PRESETS.map(function (preset) {
        return renderPresetButton(preset, preset === selected);
      }).join(''),
      '  </div>',
      '  <div class="cf-selected" id="cf-selected"></div>',
      '  <button class="cf-btn-primary" id="cf-join-btn">进入成员端</button>',
      '</div>'
    ].join('');

    updateSelectedPreview(selected);

    ROOT.querySelectorAll('.cf-preset-btn').forEach(function (button) {
      button.addEventListener('click', function () {
        ROOT.querySelectorAll('.cf-preset-btn').forEach(function (other) {
          other.classList.remove('sel');
        });
        button.classList.add('sel');
        selected = button.dataset.name || '';
        updateSelectedPreview(selected);
      });
    });

    ROOT.querySelector('#cf-join-btn').addEventListener('click', function () {
      if (!selected) {
        alert('请先选择你的身份');
        return;
      }
      whoAmI = selected;
      rememberName(selected);
      renderClient();
      connect('client');
    });
  }

  function renderClient() {
    ROOT.innerHTML = [
      '<div class="cf-app">',
      '  <div class="cf-header">',
      '    <span class="cf-title">CECP 敬拜团内通</span>',
      '    <span class="cf-status">',
      '      <span class="cf-dot" id="cf-dot"></span>',
      '      <span id="cf-status-label">连接中…</span>',
      '    </span>',
      '  </div>',
      '  <div id="cf-bcast" class="cf-bcast" style="display:none" aria-live="polite">',
      '    <div class="cf-bcast-from">📢 音控组</div>',
      '    <div class="cf-bcast-text" id="cf-bcast-text"></div>',
      '  </div>',
      '  <div class="cf-client-hero">',
      '    <div class="cf-badge-wrap">',
      '      <div class="cf-badge-label">当前话筒</div>',
      renderIdentityPill(whoAmI, 'cf-badge'),
      '    </div>',
      '    <div class="cf-client-note">点击下方快捷消息，音控台会立刻看到你的颜色和需求。</div>',
      '  </div>',
      '  <div class="cf-section-label">快捷消息</div>',
      '  <div class="cf-cue-grid">',
      CUES.map(function (cue) {
        return [
          '<button class="cf-cue-btn" data-kind="', escapeHtml(cue.kind), '" data-msg="', escapeHtml(cue.label), '">',
          '  <span class="cf-icon">', escapeHtml(cue.icon), '</span>',
          '  <div>',
          '    <div class="cf-cue-label">', escapeHtml(cue.label), '</div>',
          '    <div class="cf-cue-desc">', escapeHtml(cue.desc), '</div>',
          '  </div>',
          '</button>'
        ].join('');
      }).join(''),
      '  </div>',
      '  <div class="cf-section-label">💬 自定义消息</div>',
      '  <div class="cf-custom-area">',
      '    <input id="cf-custom-input" type="text" placeholder="自定义消息…" maxlength="120">',
      '    <button id="cf-custom-send">➤</button>',
      '  </div>',
      '  <div class="cf-flash" id="cf-flash">发送成功 ✓</div>',
      '</div>'
    ].join('');

    ROOT.querySelectorAll('.cf-cue-btn').forEach(function (button) {
      button.addEventListener('click', function () {
        sendWorshipMsg(button.dataset.kind, button.dataset.msg);
      });
    });

    ROOT.querySelector('#cf-custom-send').addEventListener('click', sendCustom);
    ROOT.querySelector('#cf-custom-input').addEventListener('keydown', function (event) {
      if (event.key === 'Enter') sendCustom();
    });
  }

  function renderOperator() {
    ROOT.innerHTML = [
      '<div class="cf-app cf-op">',
      '  <div class="cf-header">',
      '    <span class="cf-title">CECP 音控台</span>',
      '    <span class="cf-status">',
      '      <span class="cf-dot" id="cf-dot"></span>',
      '      <span id="cf-status-label">连接中…</span>',
      '    </span>',
      '  </div>',
      '  <div class="cf-op-row">',
      '    <div class="cf-panel cf-panel-members">',
      '      <div class="cf-panel-title" id="cf-member-title">🎵 在线成员</div>',
      '      <ul class="cf-member-list" id="cf-member-list">',
      '        <li class="cf-member-empty">暂无成员在线</li>',
      '      </ul>',
      '    </div>',
      '    <div class="cf-panel cf-panel-log">',
      '      <div class="cf-panel-title-row">',
      '        <span class="cf-panel-title">📨 收到的消息</span>',
      '        <button class="cf-clear-btn" id="cf-clear-btn">清空</button>',
      '      </div>',
      '      <div class="cf-log" id="cf-log">',
      '        <div class="cf-log-empty">暂无消息</div>',
      '      </div>',
      '    </div>',
      '  </div>',
      '  <div class="cf-panel cf-panel-bcast">',
      '    <div class="cf-panel-title">📢 广播给所有敬拜团成员</div>',
      '    <div class="cf-custom-area">',
      '      <input id="cf-bcast-input" type="text" placeholder="输入广播消息…" maxlength="120">',
      '      <button id="cf-bcast-send">发送</button>',
      '    </div>',
      '    <div class="cf-bcast-presets">',
      BCAST_PRESETS.map(function (text) {
        var safeText = escapeHtml(text);
        return '<button class="cf-bcast-preset" data-text="' + safeText + '">' + safeText + '</button>';
      }).join(''),
      '    </div>',
      '  </div>',
      '  <div class="cf-flash" id="cf-flash">已广播 ✓</div>',
      '</div>'
    ].join('');

    ROOT.querySelector('#cf-bcast-send').addEventListener('click', sendBroadcast);
    ROOT.querySelector('#cf-bcast-input').addEventListener('keydown', function (event) {
      if (event.key === 'Enter') sendBroadcast();
    });
    ROOT.querySelectorAll('.cf-bcast-preset').forEach(function (button) {
      button.addEventListener('click', function () {
        ROOT.querySelector('#cf-bcast-input').value = button.dataset.text || '';
        sendBroadcast();
      });
    });
    ROOT.querySelector('#cf-clear-btn').addEventListener('click', function () {
      msgLog = [];
      renderLog();
    });
  }

  function startPing() {
    stopPing();
    pingTimer = setInterval(function () {
      if (wsReady()) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);
  }

  function stopPing() {
    if (!pingTimer) return;
    clearInterval(pingTimer);
    pingTimer = null;
  }

  function connect(role) {
    clearTimeout(reconnectTimer);
    if (ws) {
      try { ws.close(); } catch (err) {}
    }

    ws = new WebSocket(WS_URL);

    ws.addEventListener('open', function () {
      setStatus(true);
      startPing();
      ws.send(JSON.stringify({
        type: 'register',
        name: role === 'operator' ? '音控组' : whoAmI,
        role: role
      }));
    });

    ws.addEventListener('close', function () {
      setStatus(false);
      stopPing();
      reconnectTimer = setTimeout(function () {
        connect(role);
      }, 3000);
    });

    ws.addEventListener('error', function () {
      try { ws.close(); } catch (err) {}
    });

    ws.addEventListener('message', function (event) {
      var msg;
      try {
        msg = JSON.parse(event.data);
      } catch (err) {
        return;
      }
      handleIncoming(msg, role);
    });
  }

  function handleIncoming(msg, role) {
    if (msg.type === 'pong' || msg.type === 'ack') return;

    if (role === 'client' && msg.type === 'broadcast') {
      showBroadcastBanner(msg.text);
      return;
    }

    if (role === 'operator' && msg.type === 'worship_msg') {
      msgLog.unshift({ from: msg.from, kind: msg.kind, text: msg.text, ts: msg.ts });
      if (msgLog.length > 80) msgLog.pop();
      renderLog();
      return;
    }

    if (role === 'operator' && msg.type === 'member_list') {
      renderMembers(msg.members || []);
    }
  }

  function wsReady() {
    return !!ws && ws.readyState === WebSocket.OPEN;
  }

  function sendWorshipMsg(kind, text) {
    if (!wsReady()) {
      flashEl('cf-flash', '当前离线，正在重连…', true);
      return;
    }
    ws.send(JSON.stringify({ type: 'worship_msg', kind: kind, text: text }));
    flashEl('cf-flash', '发送成功 ✓');
  }

  function sendCustom() {
    var input = ROOT.querySelector('#cf-custom-input');
    var text = input && input.value ? input.value.trim() : '';
    if (!text) return;
    sendWorshipMsg('custom', text);
    if (input) input.value = '';
  }

  function sendBroadcast() {
    var input = ROOT.querySelector('#cf-bcast-input');
    var text = input && input.value ? input.value.trim() : '';
    if (!text) return;
    if (!wsReady()) {
      flashEl('cf-flash', '当前离线，无法广播', true);
      return;
    }
    ws.send(JSON.stringify({ type: 'broadcast', text: text }));
    if (input) input.value = '';
    flashEl('cf-flash', '已广播 ✓');
  }

  function setStatus(online) {
    var dot = ROOT.querySelector('#cf-dot');
    if (dot) dot.classList.toggle('online', online);
    var label = ROOT.querySelector('#cf-status-label');
    if (label) label.textContent = online ? '在线' : '离线';
  }

  function showBroadcastBanner(text) {
    var banner = ROOT.querySelector('#cf-bcast');
    var bannerText = ROOT.querySelector('#cf-bcast-text');
    if (!banner || !bannerText) return;

    bannerText.textContent = text;
    banner.style.display = 'block';

    clearTimeout(banner._timer);
    banner._timer = setTimeout(function () {
      banner.style.display = 'none';
    }, 7000);
  }

  function renderMembers(members) {
    var list = ROOT.querySelector('#cf-member-list');
    var title = ROOT.querySelector('#cf-member-title');
    if (!list) return;

    if (title) {
      title.textContent = '🎵 在线成员（' + members.length + '）';
    }

    list.innerHTML = members.length
      ? members.map(function (member) {
          return '<li class="cf-member-item">' + renderIdentityPill(member.name, 'cf-member-pill') + '</li>';
        }).join('')
      : '<li class="cf-member-empty">暂无成员在线</li>';
  }

  function renderLog() {
    var log = ROOT.querySelector('#cf-log');
    if (!log) return;

    if (!msgLog.length) {
      log.innerHTML = '<div class="cf-log-empty">暂无消息</div>';
      return;
    }

    log.innerHTML = msgLog.map(function (item) {
      var time = new Date(item.ts).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      var icon = KIND_ICONS[item.kind] || '💬';
      var extraClass = item.kind === 'issue' ? ' cf-log-issue' : '';
      return [
        '<div class="cf-log-item', extraClass, '">',
        '  <span class="cf-log-icon">', escapeHtml(icon), '</span>',
        '  <div class="cf-log-body">',
        renderIdentityPill(item.from, 'cf-log-from'),
        '    <span class="cf-log-text">', escapeHtml(item.text), '</span>',
        '  </div>',
        '  <span class="cf-log-time">', escapeHtml(time), '</span>',
      '</div>'
      ].join('');
    }).join('');
  }

  function flashEl(id, text, isError) {
    var el = ROOT.querySelector('#' + id);
    if (!el) return;

    el.textContent = text;
    el.classList.toggle('is-error', !!isError);
    el.classList.add('show');
    clearTimeout(flashTimers[id]);
    flashTimers[id] = setTimeout(function () {
      el.classList.remove('show');
      el.classList.remove('is-error');
    }, 1800);
  }

  if (MODE === 'operator') {
    renderOperator();
    connect('operator');
  } else {
    renderSetup();
  }
})();
