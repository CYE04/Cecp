/* ============================================================
   CECP 敬拜团内通系统 — Frontend Script
   Usage:
     <div id="cecp-root"
          data-ws-url="wss://cecp-ws.YOUR_SUBDOMAIN.workers.dev"
          data-mode="client"></div>      <!-- or "operator" -->
     <script src="cecp.js"></script>

   Optional:
     data-layout="floating"             <!-- page | floating -->
     data-presets='["🎤 橘色话筒","🎤 蓝色话筒"]'
     data-cues='[{"kind":"self_up","icon":"🔊","label":"多点自己","desc":"自己声音太小听不清"}]'
     data-broadcast-presets='["排练开始","下一首"]'
   ============================================================ */

(function () {
  'use strict';

  function resolveRoot(root) {
    if (!root) {
      return document.getElementById('cecp-root')
        || document.querySelector('[data-cecp-root]');
    }
    if (typeof root === 'string') return document.querySelector(root);
    return root.nodeType === 1 ? root : null;
  }

  function mount(root) {
    var ROOT = resolveRoot(root);
    if (!ROOT) return null;
    if (ROOT.__cecpApi) return ROOT.__cecpApi;

    var WS_URL = String(ROOT.dataset.wsUrl || '').trim();
    if (!WS_URL) {
      ROOT.innerHTML = '<p style="color:#E05A5A;padding:1rem">缺少 data-ws-url 属性</p>';
      return null;
    }

    var MODE = ROOT.dataset.mode
      || new URLSearchParams(location.search).get('mode')
      || 'client';
    var LAYOUT = String(ROOT.dataset.layout || 'page').trim().toLowerCase();
    var IS_FLOATING = LAYOUT === 'floating' || LAYOUT === 'widget';
    var SHOW_CLIENT_LOG = ROOT.dataset.clientLog !== '0';
    var SHOW_BCAST_POPUP = ROOT.dataset.broadcastModal !== '0';
    var ENABLE_MEMBER_CHAT = ROOT.dataset.memberChat !== '0';
    var LAUNCHER_ICON = String(ROOT.dataset.launcherIcon || '🎧');
    var LAUNCHER_LABEL = String(ROOT.dataset.launcherLabel || '调音助手');
    var WIDGET_TITLE = String(ROOT.dataset.widgetTitle || 'CECP 敬拜团内通');
    var DEFAULT_PRESET = String(ROOT.dataset.defaultPreset || '').trim();
    var PAGE_KEY = String(ROOT.dataset.pageKey || location.pathname || 'global').trim();
    var FLOAT_RIGHT = String(ROOT.dataset.floatRight || '').trim();
    var FLOAT_BOTTOM = String(ROOT.dataset.floatBottom || '').trim();
    var ANCHOR_EL = ROOT.__cecpAnchorEl || null;

    var DEFAULT_PRESETS = [
      '🎤 橘色话筒',
      '🎤 绿色话筒',
      '🎤 紫色话筒',
      '🎤 黄色话筒',
      '🎤 红色话筒',
      '🎤 蓝色话筒',
      '🎤 白色话筒',
      '🎤 黑色话筒',
      '🎤 棕色话筒',
      '🎹 钢琴',
      '🎹 键盘',
      '🎸 吉他',
      '🎸 电吉他',
      '🎸 贝斯',
      '🥁 鼓'
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
      custom: '💬',
      broadcast: '📢',
      member_chat: '🗨️'
    };

    var STORAGE_KEY = 'cecp:intercom:last-role:' + WS_URL + ':' + PAGE_KEY;
    var CLIENT_LOG_PREFIX = 'cecp:intercom:client-log:' + WS_URL + ':' + PAGE_KEY + ':';
    var MEMBER_CHAT_KEY = 'cecp:intercom:member-chat:' + WS_URL + ':' + PAGE_KEY;

    var ws = null;
    var whoAmI = '';
    var reconnectTimer = null;
    var pingTimer = null;
    var msgLog = [];
    var clientLog = [];
    var memberChat = [];
    var flashTimers = {};
    var memberCount = 0;
    var takenDevices = [];   // 已被占用的设备名列表（来自服务端 taken_devices 消息）
    var widgetOpen = !IS_FLOATING;
    var operatorUnreadCount = 0;
    var isOnline = false;
    var selectionSource = 'manual';
    var geomBound = false;
    var geomRaf = 0;
    var geomObserver = null;
    var geometryHandler = null;
    var viewportGeometryHandler = null;
    var docKeyHandler = null;
    var fullscreenChangeHandler = null;
    var destroyed = false;
    var pageShellApplied = false;
    var _originalParent = null;
    var _originalNextSibling = null;
    var _hiddenBodyChildren = [];

    ROOT.__cecpMounted = true;
    if (FLOAT_RIGHT) ROOT.style.setProperty('--cf-float-right', FLOAT_RIGHT);
    if (FLOAT_BOTTOM) ROOT.style.setProperty('--cf-float-bottom', FLOAT_BOTTOM);

    function syncPageShell(active) {
      if (IS_FLOATING) return;
      pageShellApplied = !!active;
      var rootEl = document.documentElement;
      var bodyEl = document.body;
      if (rootEl) rootEl.classList.toggle('cf-page-shell', !!active);
      if (bodyEl) bodyEl.classList.toggle('cf-page-shell', !!active);

      if (active && bodyEl) {
        /* 把 ROOT 提升到 body 直属子节点：
           逃出任何有 transform/overflow 的 CMS 容器，
           让 position:fixed; inset:0 真正覆盖整个视口。 */
        _originalParent = ROOT.parentElement;
        _originalNextSibling = ROOT.nextSibling;
        if (ROOT.parentElement !== bodyEl) {
          bodyEl.appendChild(ROOT);
        }
        /* 隐藏 body 里所有其他子元素（header、sidebar、main 等） */
        _hiddenBodyChildren = [];
        var kids = Array.prototype.slice.call(bodyEl.children);
        for (var i = 0; i < kids.length; i++) {
          var kid = kids[i];
          if (kid !== ROOT) {
            _hiddenBodyChildren.push({ el: kid, prev: kid.style.display });
            kid.style.setProperty('display', 'none', 'important');
          }
        }
      }
    }

    syncPageShell(true);

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

    function forgetRememberedName() {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (err) {}
    }

    function readRememberedName() {
      try {
        return localStorage.getItem(STORAGE_KEY) || '';
      } catch (err) {
        return '';
      }
    }

    function stripIdentityPrefix(value) {
      return String(value || '')
        .replace(/^[🎤🎹🎸🥁🎛️📢]\s*/u, '')
        .trim();
    }

    function detectIdentityType(name) {
      var text = stripIdentityPrefix(name);
      if (/音控/.test(text)) return 'operator';
      if (/话筒/.test(text)) return 'mic';
      if (/钢琴|键盘|吉他|电吉他|贝斯|鼓/.test(text)) return 'instrument';
      return 'other';
    }

    function detectIdentityTone(name) {
      var text = stripIdentityPrefix(name);
      if (/音控/.test(text)) return 'gold';
      if (/橘/.test(text)) return 'orange';
      if (/绿/.test(text)) return 'green';
      if (/紫/.test(text)) return 'purple';
      if (/黄/.test(text)) return 'yellow';
      if (/红/.test(text)) return 'red';
      if (/蓝/.test(text)) return 'blue';
      if (/白/.test(text)) return 'white';
      if (/黑/.test(text)) return 'black';
      if (/棕|褐|咖/.test(text)) return 'brown';
      if (/钢琴/.test(text)) return 'gold';
      if (/键盘/.test(text)) return 'blue';
      if (/吉他/.test(text) && !/电吉他/.test(text)) return 'green';
      if (/电吉他/.test(text)) return 'purple';
      if (/贝斯/.test(text)) return 'brown';
      if (/鼓/.test(text)) return 'red';
      return 'default';
    }

    function detectIdentityIcon(name) {
      var text = stripIdentityPrefix(name);
      if (/音控/.test(text)) return '🎛️';
      if (/话筒/.test(text)) return '🎤';
      if (/钢琴|键盘/.test(text)) return '🎹';
      if (/吉他|电吉他|贝斯/.test(text)) return '🎸';
      if (/鼓/.test(text)) return '🥁';
      if (/广播/.test(text)) return '📢';
      return '🎵';
    }

    function detectIdentitySubtitle(name) {
      var type = detectIdentityType(name);
      if (type === 'operator') return '调音台';
      return type === 'mic' ? '无线话筒' : '乐器通道';
    }

    function getIdentityMeta(name) {
      var displayName = String(name || '').trim();
      var title = stripIdentityPrefix(displayName) || displayName;
      return {
        displayName: displayName,
        title: title,
        tone: detectIdentityTone(displayName),
        type: detectIdentityType(displayName),
        icon: detectIdentityIcon(displayName),
        subtitle: detectIdentitySubtitle(displayName)
      };
    }

    function renderIdentityPill(name, extraClass) {
      var meta = getIdentityMeta(name);
      return [
        '<span class="cf-identity-pill cf-tone-', meta.tone, extraClass ? ' ' + extraClass : '', '">',
        '  <span class="cf-identity-icon">', escapeHtml(meta.icon), '</span>',
        '  <span class="cf-identity-swatch"></span>',
        '  <span class="cf-identity-text">', escapeHtml(meta.title), '</span>',
        '</span>'
      ].join('');
    }

    function renderPresetButton(preset, isSelected, isTaken) {
      var meta = getIdentityMeta(preset);
      var cls = 'cf-preset-btn cf-tone-' + meta.tone;
      if (isSelected) cls += ' sel';
      if (isTaken)    cls += ' taken';
      return [
        '<button class="', cls, '"',
        isTaken ? ' disabled aria-disabled="true"' : '',
        ' data-name="', escapeHtml(meta.displayName), '">',
        '  <span class="cf-preset-led"></span>',
        '  <span class="cf-preset-mic">', escapeHtml(meta.icon), '</span>',
        '  <span class="cf-preset-copy">',
        '    <span class="cf-preset-name">', escapeHtml(meta.title), '</span>',
        '    <span class="cf-preset-sub">', isTaken ? '已有人使用' : escapeHtml(meta.subtitle), '</span>',
        '  </span>',
        isTaken ? '  <span class="cf-preset-taken-badge">占用中</span>' : '',
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

    function nowId(prefix) {
      return [prefix || 'msg', Date.now(), Math.random().toString(36).slice(2, 8)].join(':');
    }

    function formatTime(ts) {
      return new Date(ts || Date.now()).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    }

    function clientLogKey() {
      return whoAmI ? CLIENT_LOG_PREFIX + whoAmI : '';
    }

    function memberChatKey() {
      return MEMBER_CHAT_KEY;
    }

    function normalizeClientLogItem(item) {
      if (!item || typeof item !== 'object') return null;
      var text = String(item.text || '').trim();
      if (!text) return null;
      return {
        id: String(item.id || nowId('cl')),
        from: String(item.from || ''),
        kind: String(item.kind || 'custom'),
        text: text,
        ts: Number(item.ts || Date.now()),
        direction: item.direction === 'in' ? 'in' : 'out',
        read: item.direction === 'in' ? !!item.read : true
      };
    }

    function normalizeMemberChatItem(item) {
      if (!item || typeof item !== 'object') return null;
      var text = String(item.text || '').trim();
      var from = String(item.from || '').trim();
      if (!text || !from) return null;
      return {
        id: String(item.id || nowId('member')),
        from: from,
        text: text,
        ts: Number(item.ts || Date.now())
      };
    }

    function loadClientLog() {
      clientLog = [];
      var key = clientLogKey();
      if (!key) return;
      try {
        var parsed = JSON.parse(localStorage.getItem(key) || '[]');
        if (!Array.isArray(parsed)) return;
        clientLog = parsed
          .map(normalizeClientLogItem)
          .filter(Boolean)
          .slice(0, 80);
      } catch (err) {}
    }

    function saveClientLog() {
      var key = clientLogKey();
      if (!key) return;
      try {
        localStorage.setItem(key, JSON.stringify(clientLog.slice(0, 80)));
      } catch (err) {}
    }

    function appendClientLog(entry) {
      var normalized = normalizeClientLogItem(entry);
      if (!normalized) return;
      clientLog.unshift(normalized);
      if (clientLog.length > 80) clientLog = clientLog.slice(0, 80);
      saveClientLog();
      renderClientLog();
      syncBroadcastPopup();
      syncLauncherBadge();
    }

    function loadMemberChat() {
      memberChat = [];
      var key = memberChatKey();
      if (!key) return;
      try {
        var parsed = JSON.parse(localStorage.getItem(key) || '[]');
        if (!Array.isArray(parsed)) return;
        memberChat = parsed
          .map(normalizeMemberChatItem)
          .filter(Boolean)
          .slice(-160);
      } catch (err) {}
    }

    function saveMemberChat() {
      var key = memberChatKey();
      if (!key) return;
      try {
        localStorage.setItem(key, JSON.stringify(memberChat.slice(-160)));
      } catch (err) {}
    }

    function appendMemberChat(entry) {
      var normalized = normalizeMemberChatItem(entry);
      if (!normalized) return;
      if (memberChat.some(function (item) { return item.id === normalized.id; })) return;
      memberChat.push(normalized);
      if (memberChat.length > 160) memberChat = memberChat.slice(-160);
      saveMemberChat();
      renderMemberChat();
    }

    function unreadClientCount() {
      return clientLog.filter(function (item) {
        return item.direction === 'in' && !item.read;
      }).length;
    }

    function getUnreadBroadcastEntry() {
      for (var i = 0; i < clientLog.length; i++) {
        var item = clientLog[i];
        if (item.direction === 'in' && item.kind === 'broadcast' && !item.read) return item;
      }
      return null;
    }

    function markClientEntryRead(id) {
      if (!id) return;
      var changed = false;
      clientLog = clientLog.map(function (item) {
        if (item.id !== id) return item;
        if (item.read) return item;
        changed = true;
        return {
          id: item.id,
          from: item.from,
          kind: item.kind,
          text: item.text,
          ts: item.ts,
          direction: item.direction,
          read: true
        };
      });
      if (!changed) return;
      saveClientLog();
      renderClientLog();
      syncBroadcastPopup();
      syncLauncherBadge();
    }

    function ensureChrome() {
      if (ROOT.__cecpChromeReady) return;

      ROOT.classList.add(IS_FLOATING ? 'cf-layout-floating' : 'cf-layout-page');
      ROOT.classList.remove(IS_FLOATING ? 'cf-layout-page' : 'cf-layout-floating');

      var shell = IS_FLOATING ? [
        '<div class="cf-widget-shell">',
        '  <button class="cf-launcher" id="cf-launcher" type="button" aria-label="', escapeHtml(LAUNCHER_LABEL), '" aria-expanded="false">',
        '    <span class="cf-launcher-icon">', escapeHtml(LAUNCHER_ICON), '</span>',
        '    <span class="cf-launcher-badge" id="cf-launcher-badge" hidden>0</span>',
        '  </button>',
        '  <div class="cf-widget-mask" id="cf-widget-mask"></div>',
        '  <section class="cf-widget-panel" id="cf-widget-panel" role="dialog" aria-modal="false" aria-label="', escapeHtml(WIDGET_TITLE), '">',
        '    <div class="cf-widget-bar">',
        '      <div class="cf-widget-copy">',
        '        <span class="cf-widget-kicker">Youth</span>',
        '        <strong>', escapeHtml(WIDGET_TITLE), '</strong>',
        '      </div>',
        '      <button class="cf-widget-close" id="cf-widget-close" type="button" aria-label="关闭">×</button>',
        '    </div>',
        '    <div class="cf-stage" id="cf-stage"></div>',
        '  </section>',
        '  <div class="cf-bcast-popup" id="cf-bcast-popup" hidden>',
        '    <div class="cf-bcast-popup-head">📢 音控组消息</div>',
        '    <div class="cf-bcast-popup-text" id="cf-bcast-popup-text"></div>',
        '    <div class="cf-bcast-popup-actions">',
        '      <span class="cf-bcast-popup-time" id="cf-bcast-popup-time"></span>',
        '      <button class="cf-bcast-popup-read" id="cf-bcast-popup-read" type="button">已读</button>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('') : [
        '<div class="cf-stage" id="cf-stage"></div>',
        '<div class="cf-bcast-popup" id="cf-bcast-popup" hidden>',
        '  <div class="cf-bcast-popup-head">📢 音控组消息</div>',
        '  <div class="cf-bcast-popup-text" id="cf-bcast-popup-text"></div>',
        '  <div class="cf-bcast-popup-actions">',
        '    <span class="cf-bcast-popup-time" id="cf-bcast-popup-time"></span>',
        '    <button class="cf-bcast-popup-read" id="cf-bcast-popup-read" type="button">已读</button>',
        '  </div>',
        '</div>'
      ].join('');

      ROOT.innerHTML = shell;
      ROOT.__cecpChromeReady = true;

      if (IS_FLOATING) {
        var launcher = ROOT.querySelector('#cf-launcher');
        var mask = ROOT.querySelector('#cf-widget-mask');
        var closeBtn = ROOT.querySelector('#cf-widget-close');

        launcher.addEventListener('click', function () {
          if (widgetOpen) closeWidget();
          else openWidget();
        });
        if (mask) mask.addEventListener('click', closeWidget);
        if (closeBtn) closeBtn.addEventListener('click', closeWidget);
      }

      var popupReadBtn = ROOT.querySelector('#cf-bcast-popup-read');
      if (popupReadBtn) {
        popupReadBtn.addEventListener('click', function () {
          markClientEntryRead(popupReadBtn.getAttribute('data-entry-id') || '');
        });
      }

      if (!docKeyHandler) {
        docKeyHandler = function (event) {
          if (event.key !== 'Escape') return;
          if (IS_FLOATING && widgetOpen) {
            closeWidget();
          }
        };
        document.addEventListener('keydown', docKeyHandler);
      }

      syncWidgetState();
      syncLauncherBadge();
      syncBroadcastPopup();
      bindGeometry();
      scheduleFloatingGeometry();
    }

    function parsePx(value, fallback) {
      var n = parseFloat(String(value || '').replace('px', '').trim());
      return isFinite(n) ? n : fallback;
    }

    function clamp(min, value, max) {
      return Math.max(min, Math.min(max, value));
    }

    function scheduleFloatingGeometry() {
      if (!IS_FLOATING || destroyed || geomRaf) return;
      var defer = window.requestAnimationFrame || function (cb) {
        return window.setTimeout(cb, 16);
      };
      geomRaf = defer(function () {
        geomRaf = 0;
        updateFloatingGeometry();
      });
    }

    function bindGeometry() {
      if (!IS_FLOATING || geomBound) return;
      geomBound = true;
      geometryHandler = scheduleFloatingGeometry;
      window.addEventListener('resize', geometryHandler, { passive: true });
      window.addEventListener('orientationchange', geometryHandler, { passive: true });
      if (window.visualViewport) {
        viewportGeometryHandler = scheduleFloatingGeometry;
        window.visualViewport.addEventListener('resize', viewportGeometryHandler, { passive: true });
      }
      if (window.ResizeObserver && ANCHOR_EL && ANCHOR_EL.nodeType === 1) {
        geomObserver = new ResizeObserver(function () {
          scheduleFloatingGeometry();
        });
        geomObserver.observe(ANCHOR_EL);
      }
    }

    function updateFloatingGeometry() {
      if (!IS_FLOATING || destroyed) return;
      var vv = window.visualViewport;
      var vw = Math.round(vv && vv.width ? vv.width : window.innerWidth);
      var vh = Math.round(vv && vv.height ? vv.height : window.innerHeight);
      var isTiny = vw <= 390;
      var isCompact = vw <= 560 || vh <= 720;
      var baseRight = parsePx(FLOAT_RIGHT, isTiny ? 16 : (vw <= 720 ? 20 : 34));
      var baseBottom = parsePx(FLOAT_BOTTOM, isTiny ? 76 : (vw <= 560 ? 84 : 90));
      var extraRight = 0;

      if (vw <= 560) {
        baseRight = Math.max(isTiny ? 14 : 18, baseRight - 4);
        baseBottom = Math.max(isTiny ? 70 : 78, baseBottom - 8);
      }

      if (ANCHOR_EL && ANCHOR_EL.getBoundingClientRect) {
        var rect = ANCHOR_EL.getBoundingClientRect();
        if (rect && rect.width > 0 && isFinite(rect.right)) {
          extraRight = Math.max(0, vw - rect.right);
        }
      }

      var rightInset = vw >= 1200 ? 10 : (vw >= 900 ? 6 : 0);
      var right = Math.round(baseRight + extraRight + rightInset);
      var bottom = Math.round(baseBottom);
      var launcher = isTiny ? 48 : (vw <= 560 ? 52 : (vw <= 900 ? 54 : 58));
      var availableWidth = Math.max(240, vw - right - 14);
      var desiredWidth = isTiny ? (vw - 10) : (vw <= 560 ? vw - 16 : 372);
      var minWidth = isTiny ? 240 : 272;
      var panelWidth = Math.round(Math.min(desiredWidth, availableWidth));
      panelWidth = Math.max(Math.min(minWidth, availableWidth), panelWidth);
      var desiredHeight = vw <= 560 ? vh - (isTiny ? 20 : 24) : vh - 42;
      var maxHeight = Math.round(Math.max(300, Math.min(vw <= 560 ? 560 : 720, desiredHeight)));

      ROOT.style.setProperty('--cf-float-right-auto', right + 'px');
      ROOT.style.setProperty('--cf-float-bottom-auto', bottom + 'px');
      ROOT.style.setProperty('--cf-launcher-size', launcher + 'px');
      ROOT.style.setProperty('--cf-panel-width', panelWidth + 'px');
      ROOT.style.setProperty('--cf-panel-max-height', maxHeight + 'px');
      ROOT.classList.toggle('cf-compact', isCompact);
    }

    function getStageEl() {
      ensureChrome();
      return ROOT.querySelector('#cf-stage');
    }

    function setStageHtml(html) {
      var stage = getStageEl();
      if (!stage) return;
      stage.innerHTML = html;
    }

    function syncInteractionLock() {
      if (!IS_FLOATING) return;
      var rootEl = document.documentElement;
      var bodyEl = document.body;
      var shouldLock = !!widgetOpen;
      if (rootEl) rootEl.classList.toggle('cf-intercom-open', shouldLock);
      if (bodyEl) bodyEl.classList.toggle('cf-intercom-open', shouldLock);
    }

    function syncWidgetState() {
      if (!IS_FLOATING) return;
      ROOT.classList.toggle('cf-widget-open', widgetOpen);
      syncInteractionLock();
      var launcher = ROOT.querySelector('#cf-launcher');
      if (launcher) launcher.setAttribute('aria-expanded', widgetOpen ? 'true' : 'false');
    }

    function openWidget() {
      if (!IS_FLOATING) return;
      ensureStageReadyForOpen();
      scheduleFloatingGeometry();
      widgetOpen = true;
      operatorUnreadCount = 0;
      syncWidgetState();
      syncLauncherBadge();
    }

    function closeWidget() {
      if (!IS_FLOATING) return;
      widgetOpen = false;
      syncWidgetState();
      syncLauncherBadge();
    }

    function ensureStageReadyForOpen() {
      if (!IS_FLOATING) return;
      if (MODE === 'operator') {
        if (!ROOT.querySelector('#cf-log')) renderOperator();
        return;
      }
      if (whoAmI) {
        if (!ROOT.querySelector('#cf-custom-send')) renderClient();
        return;
      }
      if (!ROOT.querySelector('#cf-join-btn')) renderSetup();
    }

    function syncLauncherBadge() {
      var badge = ROOT.querySelector('#cf-launcher-badge');
      if (!badge) return;

      var count = MODE === 'operator' ? (widgetOpen ? 0 : operatorUnreadCount) : unreadClientCount();
      badge.hidden = !count;
      badge.textContent = count > 99 ? '99+' : String(count || 0);
    }

    function syncBroadcastPopup() {
      var popup = ROOT.querySelector('#cf-bcast-popup');
      var popupText = ROOT.querySelector('#cf-bcast-popup-text');
      var popupTime = ROOT.querySelector('#cf-bcast-popup-time');
      var popupReadBtn = ROOT.querySelector('#cf-bcast-popup-read');
      if (!popup || !popupText || !popupTime || !popupReadBtn) return;

      if (!SHOW_BCAST_POPUP) {
        popup.hidden = true;
        popup.classList.remove('show');
        return;
      }

      var entry = getUnreadBroadcastEntry();
      if (!entry) {
        popup.hidden = true;
        popup.classList.remove('show');
        popupReadBtn.removeAttribute('data-entry-id');
        return;
      }

      popupText.textContent = entry.text;
      popupTime.textContent = formatTime(entry.ts);
      popupReadBtn.setAttribute('data-entry-id', entry.id);
      popup.hidden = false;
      requestAnimationFrame(function () {
        popup.classList.add('show');
      });
    }

    function renderSetup() {
      ensureChrome();

      var remembered = readRememberedName();
      var selected = PRESETS.indexOf(remembered) >= 0 ? remembered : '';

      ROOT.classList.remove('cf-mode-operator');

      setStageHtml([
        '<div class="cf-setup-card">',
        '  <div class="cf-setup-kicker">内通系统</div>',
        '  <h2>选择你的设备</h2>',
        '  <p class="cf-setup-sub">话筒和乐器都会同步显示到音控台，方便现场快速识别。</p>',
        '  <div class="cf-preset-grid">',
        PRESETS.map(function (preset) {
          var taken = takenDevices.indexOf(preset) >= 0 && preset !== whoAmI;
          return renderPresetButton(preset, preset === selected, taken);
        }).join(''),
        '  </div>',
        '  <div class="cf-selected" id="cf-selected"></div>',
        '  <button class="cf-btn-primary" id="cf-join-btn">进入成员端</button>',
        '</div>'
      ].join(''));

      updateSelectedPreview(selected);

      ROOT.querySelectorAll('.cf-preset-btn').forEach(function (button) {
        button.addEventListener('click', function () {
          if (button.disabled || button.classList.contains('taken')) return;
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
        /* 二次防护：如果这个设备已被人占用就拒绝 */
        if (takenDevices.indexOf(selected) >= 0) {
          alert('「' + selected + '」已有人在使用，请选择其他设备。');
          return;
        }
        whoAmI = selected;
        rememberName(selected);
        loadClientLog();
        loadMemberChat();
        renderClient();
        connect('client');
        if (IS_FLOATING) openWidget();
      });

      scheduleFloatingGeometry();
    }

    function renderClient() {
      ensureChrome();

      ROOT.classList.remove('cf-mode-operator');
      var showMemberChat = ENABLE_MEMBER_CHAT;

      var defaultNotice = selectionSource === 'default'
        ? [
            '  <div class="cf-device-note">',
            '    <div class="cf-device-note-copy">当前先用默认设备 ',
            renderIdentityPill(whoAmI, 'cf-device-note-pill'),
            ' ，如果不是你，请重新选择设备。</div>',
            '    <button class="cf-device-reset-btn" id="cf-reset-device" type="button">重新选设备</button>',
            '  </div>'
          ].join('')
        : [
            '  <div class="cf-device-note is-subtle">',
            '    <div class="cf-device-note-copy">如果这次不是这个设备，可以随时重新选择。</div>',
            '    <button class="cf-device-reset-btn" id="cf-reset-device" type="button">更换设备</button>',
            '  </div>'
          ].join('');

      setStageHtml([
        '<div class="cf-app cf-client-app">',
        '  <div class="cf-header">',
        '    <div class="cf-header-copy">',
        '      <span class="cf-title">CECP 敬拜团成员通道</span>',
        '      <span class="cf-header-sub">舞台请求、成员沟通、广播提醒都集中在这里</span>',
        '    </div>',
        '    <span class="cf-status">',
        '      <span class="cf-dot" id="cf-dot"></span>',
        '      <span id="cf-status-label">连接中…</span>',
        '    </span>',
        '  </div>',
        '  <div class="cf-client-hero">',
        '    <div class="cf-badge-wrap">',
        '      <div class="cf-badge-label">当前设备</div>',
        renderIdentityPill(whoAmI, 'cf-badge'),
        '    </div>',
        '    <div class="cf-client-note">左边给音控组发舞台请求，右边保留成员沟通和广播记录，现场会更清楚也更顺手。</div>',
        defaultNotice,
        '  </div>',
        '  <div class="cf-client-grid">',
        '    <div class="cf-client-main">',
        '      <div class="cf-section-label">快捷消息</div>',
        '      <div class="cf-cue-grid">',
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
        '      </div>',
        '      <div class="cf-section-label">💬 发给音控组</div>',
        '      <div class="cf-custom-area">',
        '        <input id="cf-custom-input" type="text" placeholder="例如：主歌前帮我多一点钢琴…" maxlength="120">',
        '        <button id="cf-custom-send" type="button">发送</button>',
        '      </div>',
        '    </div>',
        '    <div class="cf-client-side">',
        showMemberChat ? [
          '      <div class="cf-panel cf-panel-member-chat">',
          '        <div class="cf-panel-title-row">',
          '          <span class="cf-panel-title">成员群聊</span>',
          '          <button class="cf-clear-btn" id="cf-member-chat-clear-btn" type="button">清空</button>',
          '        </div>',
          '        <div class="cf-member-chat-note">成员之间可以直接沟通段落、预备和现场提醒，不会盖掉舞台请求。</div>',
          '        <div class="cf-log cf-log-member-chat" id="cf-member-chat-log">',
          '          <div class="cf-log-empty">成员群聊会显示在这里</div>',
          '        </div>',
          '        <div class="cf-custom-area cf-member-chat-compose">',
          '          <input id="cf-member-chat-input" type="text" placeholder="给成员说一句…" maxlength="180">',
          '          <button id="cf-member-chat-send" type="button">发送</button>',
          '        </div>',
          '      </div>'
        ].join('') : '',
        SHOW_CLIENT_LOG ? [
          '      <div class="cf-panel cf-panel-client-log">',
          '        <div class="cf-panel-title-row">',
          '          <span class="cf-panel-title">音控记录</span>',
          '          <button class="cf-clear-btn" id="cf-client-clear-btn" type="button">清空</button>',
          '        </div>',
          '        <div class="cf-log cf-log-client" id="cf-client-log">',
          '          <div class="cf-log-empty">你发出的请求和收到的广播会显示在这里</div>',
          '        </div>',
          '      </div>'
        ].join('') : '',
        '    </div>',
        '  </div>',
        '  <div class="cf-flash" id="cf-flash">发送成功 ✓</div>',
        '</div>'
      ].join(''));

      ROOT.querySelectorAll('.cf-cue-btn').forEach(function (button) {
        button.addEventListener('click', function () {
          sendWorshipMsg(button.dataset.kind, button.dataset.msg);
        });
      });

      ROOT.querySelector('#cf-custom-send').addEventListener('click', sendCustom);
      ROOT.querySelector('#cf-custom-input').addEventListener('keydown', function (event) {
        if (event.key === 'Enter') sendCustom();
      });
      ROOT.querySelector('#cf-reset-device').addEventListener('click', resetDeviceSelection);

      var memberSendBtn = ROOT.querySelector('#cf-member-chat-send');
      var memberInput = ROOT.querySelector('#cf-member-chat-input');
      if (memberSendBtn && memberInput) {
        memberSendBtn.addEventListener('click', sendMemberChat);
        memberInput.addEventListener('keydown', function (event) {
          if (event.key === 'Enter') sendMemberChat();
        });
      }

      var clearBtn = ROOT.querySelector('#cf-client-clear-btn');
      if (clearBtn) {
        clearBtn.addEventListener('click', function () {
          clientLog = [];
          saveClientLog();
          renderClientLog();
          syncBroadcastPopup();
          syncLauncherBadge();
        });
      }

      var memberClearBtn = ROOT.querySelector('#cf-member-chat-clear-btn');
      if (memberClearBtn) {
        memberClearBtn.addEventListener('click', function () {
          memberChat = [];
          saveMemberChat();
          renderMemberChat();
        });
      }

      renderMemberChat();
      renderClientLog();
      syncBroadcastPopup();
      syncLauncherBadge();
      setStatus(isOnline);
      scheduleFloatingGeometry();
    }

    function renderOperator() {
      ensureChrome();

      ROOT.classList.add('cf-mode-operator');

      setStageHtml([
        '<div class="cf-app cf-op">',
        '  <div class="cf-header">',
        '    <div class="cf-header-copy">',
        '      <span class="cf-title">CECP 音控台</span>',
        '      <span class="cf-header-sub">成员消息、设备状态、广播控制</span>',
        '    </div>',
        '    <div class="cf-header-tools">',
        IS_FLOATING ? '' : '      <button class="cf-screen-btn" id="cf-fullscreen-btn" type="button">进入全屏</button>',
        '      <span class="cf-status">',
        '        <span class="cf-dot" id="cf-dot"></span>',
        '        <span id="cf-status-label">连接中…</span>',
        '      </span>',
        '    </div>',
        '  </div>',
        '  <div class="cf-op-summary">',
        '    <div class="cf-stat-card">',
        '      <div class="cf-stat-label">在线设备</div>',
        '      <div class="cf-stat-value" id="cf-stat-members">0</div>',
        '    </div>',
        '    <div class="cf-stat-card">',
        '      <div class="cf-stat-label">消息总数</div>',
        '      <div class="cf-stat-value" id="cf-stat-messages">0</div>',
        '    </div>',
        '    <div class="cf-stat-card cf-stat-alert">',
        '      <div class="cf-stat-label">故障提醒</div>',
        '      <div class="cf-stat-value" id="cf-stat-issues">0</div>',
        '    </div>',
        '  </div>',
        '  <div class="cf-op-row">',
        '    <div class="cf-panel cf-panel-members">',
        '      <div class="cf-panel-title-row">',
        '        <span class="cf-panel-title" id="cf-member-title">在线设备</span>',
        '        <button class="cf-clear-btn cf-kick-all-btn" id="cf-kick-all-btn" type="button">踢出全员</button>',
        '      </div>',
        '      <ul class="cf-member-list" id="cf-member-list">',
        '        <li class="cf-member-empty">当前没有设备在线</li>',
        '      </ul>',
        '    </div>',
        '    <div class="cf-panel cf-panel-log">',
        '      <div class="cf-panel-title-row">',
        '        <span class="cf-panel-title">收到的消息</span>',
        '        <button class="cf-clear-btn" id="cf-clear-btn" type="button">清空</button>',
        '      </div>',
        '      <div class="cf-log" id="cf-log">',
        '        <div class="cf-log-empty">暂时还没有收到消息</div>',
        '      </div>',
        '    </div>',
        '  </div>',
        '  <div class="cf-panel cf-panel-bcast">',
        '    <div class="cf-panel-title">广播给所有成员</div>',
        '    <div class="cf-custom-area">',
        '      <input id="cf-bcast-input" type="text" placeholder="输入广播消息…" maxlength="120">',
        '      <button id="cf-bcast-send" type="button">发送</button>',
        '    </div>',
        '    <div class="cf-bcast-presets">',
        BCAST_PRESETS.map(function (text) {
          var safeText = escapeHtml(text);
          return '<button class="cf-bcast-preset" type="button" data-text="' + safeText + '">' + safeText + '</button>';
        }).join(''),
        '    </div>',
        '  </div>',
        '  <div class="cf-flash" id="cf-flash">已广播 ✓</div>',
        '</div>'
      ].join(''));

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
        renderOperatorLog();
      });

      var kickAllBtn = ROOT.querySelector('#cf-kick-all-btn');
      if (kickAllBtn) {
        kickAllBtn.addEventListener('click', function () {
          sendKickAll();
        });
      }

      var fullscreenBtn = ROOT.querySelector('#cf-fullscreen-btn');
      if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
        if (!fullscreenChangeHandler) {
          fullscreenChangeHandler = syncFullscreenButton;
          document.addEventListener('fullscreenchange', fullscreenChangeHandler);
        }
        syncFullscreenButton();
      }

      renderOperatorLog();
      updateOperatorStats();
      setStatus(isOnline);
      scheduleFloatingGeometry();
    }

    function renderClientLog() {
      var log = ROOT.querySelector('#cf-client-log');
      if (!log) return;

      if (!clientLog.length) {
        log.innerHTML = '<div class="cf-log-empty">你发出的请求和收到的广播会显示在这里</div>';
        return;
      }

      log.innerHTML = clientLog.map(function (item) {
        var icon = KIND_ICONS[item.kind] || '💬';
        var dirChip = item.direction === 'out'
          ? '<span class="cf-log-chip">发给音控组</span>'
          : '<span class="cf-log-chip cf-log-chip-in">来自音控组</span>';
        var readChip = item.direction === 'in'
          ? (item.read
              ? '<span class="cf-log-chip">已读</span>'
              : '<button class="cf-log-read-btn" type="button" data-read-id="' + escapeHtml(item.id) + '">已读</button>')
          : '<span class="cf-log-chip">已发送</span>';
        return [
          '<div class="cf-log-item', item.direction === 'out' ? ' is-outgoing' : ' is-incoming', '">',
          '  <span class="cf-log-icon">', escapeHtml(icon), '</span>',
          '  <div class="cf-log-body">',
          '    <div class="cf-log-meta-row">',
          renderIdentityPill(item.from, 'cf-log-from'),
          dirChip,
          readChip,
          '    </div>',
          '    <span class="cf-log-text">', escapeHtml(item.text), '</span>',
          '  </div>',
          '  <span class="cf-log-time">', escapeHtml(formatTime(item.ts)), '</span>',
          '</div>'
        ].join('');
      }).join('');

      log.querySelectorAll('[data-read-id]').forEach(function (button) {
        button.addEventListener('click', function () {
          markClientEntryRead(button.getAttribute('data-read-id') || '');
        });
      });
    }

    function renderMemberChat() {
      var log = ROOT.querySelector('#cf-member-chat-log');
      if (!log) return;

      if (!memberChat.length) {
        log.innerHTML = '<div class="cf-log-empty">成员群聊会显示在这里</div>';
        return;
      }

      log.innerHTML = memberChat.map(function (item) {
        var mine = item.from === whoAmI;
        return [
          '<div class="cf-room-msg', mine ? ' is-mine' : '', '">',
          '  <div class="cf-room-msg-head">',
          renderIdentityPill(item.from, 'cf-room-from'),
          '    <span class="cf-room-time">', escapeHtml(formatTime(item.ts)), '</span>',
          '  </div>',
          '  <div class="cf-room-bubble">',
          '    <span class="cf-room-text">', escapeHtml(item.text), '</span>',
          '  </div>',
          '</div>'
        ].join('');
      }).join('');

      requestAnimationFrame(function () {
        log.scrollTop = log.scrollHeight;
      });
    }

    function updateOperatorStats() {
      var membersEl = ROOT.querySelector('#cf-stat-members');
      var messagesEl = ROOT.querySelector('#cf-stat-messages');
      var issuesEl = ROOT.querySelector('#cf-stat-issues');
      var issueCount = msgLog.filter(function (item) { return item.kind === 'issue'; }).length;

      if (membersEl) membersEl.textContent = String(memberCount);
      if (messagesEl) messagesEl.textContent = String(msgLog.length);
      if (issuesEl) issuesEl.textContent = String(issueCount);
    }

    function renderMembers(members) {
      var list = ROOT.querySelector('#cf-member-list');
      var title = ROOT.querySelector('#cf-member-title');
      if (!list) return;

      memberCount = members.length;
      if (title) title.textContent = '在线设备（' + members.length + '）';

      list.innerHTML = members.length
        ? members.map(function (member) {
            return [
              '<li class="cf-member-item">',
              renderIdentityPill(member.name, 'cf-member-pill'),
              '<button class="cf-kick-btn" type="button" data-kick-name="', escapeHtml(member.name), '" title="踢出该成员">踢出</button>',
              '</li>'
            ].join('');
          }).join('')
        : '<li class="cf-member-empty">当前没有设备在线</li>';

      list.querySelectorAll('.cf-kick-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var name = btn.getAttribute('data-kick-name') || '';
          if (name) sendKick(name);
        });
      });

      updateOperatorStats();
    }

    function renderOperatorLog() {
      var log = ROOT.querySelector('#cf-log');
      if (!log) return;

      if (!msgLog.length) {
        log.innerHTML = '<div class="cf-log-empty">暂时还没有收到消息</div>';
        updateOperatorStats();
        return;
      }

      log.innerHTML = msgLog.map(function (item) {
        var icon = KIND_ICONS[item.kind] || '💬';
        var extraClass = item.kind === 'issue'
          ? ' cf-log-issue'
          : (item.kind === 'member_chat' ? ' cf-log-chat'
          : (item.kind === 'broadcast' ? ' cf-log-broadcast' : ''));
        var routeChip = item.kind === 'member_chat'
          ? '<span class="cf-log-chip cf-log-chip-chat">成员群聊</span>'
          : (item.kind === 'broadcast'
          ? '<span class="cf-log-chip cf-log-chip-bcast">已广播</span>'
          : '<span class="cf-log-chip">发给音控组</span>');
        return [
          '<div class="cf-log-item', extraClass, '">',
          '  <span class="cf-log-icon">', escapeHtml(icon), '</span>',
          '  <div class="cf-log-body">',
          '    <div class="cf-log-meta-row">',
          renderIdentityPill(item.from, 'cf-log-from'),
          routeChip,
          '    </div>',
          '    <span class="cf-log-text">', escapeHtml(item.text), '</span>',
          '  </div>',
          '  <span class="cf-log-time">', escapeHtml(formatTime(item.ts)), '</span>',
          '</div>'
        ].join('');
      }).join('');

      updateOperatorStats();
    }

    function isFullscreenActive() {
      return !!document.fullscreenElement;
    }

    function syncFullscreenButton() {
      var button = ROOT.querySelector('#cf-fullscreen-btn');
      if (!button) return;
      button.textContent = isFullscreenActive() ? '退出全屏' : '进入全屏';
    }

    function toggleFullscreen() {
      if (isFullscreenActive()) {
        if (document.exitFullscreen) document.exitFullscreen();
        return;
      }
      if (ROOT.requestFullscreen) ROOT.requestFullscreen();
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
      if (destroyed) return;
      clearTimeout(reconnectTimer);
      if (ws) {
        try { ws.close(); } catch (err) {}
      }

      ws = new WebSocket(WS_URL);

      ws.addEventListener('open', function () {
        if (destroyed) return;
        setStatus(true);
        startPing();
        ws.send(JSON.stringify({
          type: 'register',
          name: role === 'operator' ? '音控组' : whoAmI,
          role: role,
          identityType: role === 'operator' ? 'operator' : detectIdentityType(whoAmI)
        }));
      });

      ws.addEventListener('close', function () {
        if (destroyed) return;
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
        if (destroyed) return;
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

      /* ── 被踢出 ── */
      if (msg.type === 'kicked') {
        /* 停止重连，清除身份，回到选择界面 */
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
        if (ws) {
          try { ws.close(); } catch (err) {}
          ws = null;
        }
        forgetRememberedName();
        whoAmI = '';
        selectionSource = 'manual';
        clientLog = [];
        memberChat = [];
        if (IS_FLOATING) {
          renderSetup();
          openWidget();
        } else {
          renderSetup();
        }
        /* 用 alert 给成员明确提示 */
        setTimeout(function () {
          alert('你已被音控组踢出，请重新选择设备后再加入。');
        }, 100);
        return;
      }

      /* ── 设备占用状态（客户端和调音台都处理）── */
      if (msg.type === 'taken_devices') {
        takenDevices = Array.isArray(msg.names) ? msg.names : [];
        /* 如果当前在选择界面，刷新按钮状态 */
        var grid = ROOT.querySelector('.cf-preset-grid');
        if (grid) {
          grid.innerHTML = PRESETS.map(function (preset) {
            var isSelected = preset === (ROOT.querySelector('.cf-preset-btn.sel') && ROOT.querySelector('.cf-preset-btn.sel').dataset.name);
            var taken = takenDevices.indexOf(preset) >= 0 && preset !== whoAmI;
            return renderPresetButton(preset, isSelected, taken);
          }).join('');
          ROOT.querySelectorAll('.cf-preset-btn').forEach(function (button) {
            button.addEventListener('click', function () {
              if (button.disabled || button.classList.contains('taken')) return;
              ROOT.querySelectorAll('.cf-preset-btn').forEach(function (other) { other.classList.remove('sel'); });
              button.classList.add('sel');
              var selPreview = button.dataset.name || '';
              updateSelectedPreview(selPreview);
            });
          });
        }
        /* 同时更新调音台的成员列表（如果已有数据）*/
        if (role === 'operator' && msg.members) renderMembers(msg.members);
        return;
      }

      /* 调音台的 member_list 也顺带更新 takenDevices */
      if (msg.type === 'member_list') {
        var members = msg.members || [];
        takenDevices = members.map(function (m) { return m.name; });
        renderMembers(members);
        return;
      }

      if (role === 'client' && msg.type === 'broadcast') {
        appendClientLog({
          id: msg.id || nowId('broadcast'),
          from: '音控组',
          kind: 'broadcast',
          text: msg.text,
          ts: msg.ts || Date.now(),
          direction: 'in',
          read: false
        });
        return;
      }

      if (msg.type === 'member_chat') {
        appendMemberChat({
          id: msg.id || nowId('member'),
          from: msg.from,
          text: msg.text,
          ts: msg.ts || Date.now()
        });
        if (role === 'operator') {
          msgLog.unshift({
            from: msg.from,
            kind: 'member_chat',
            text: msg.text,
            ts: msg.ts || Date.now()
          });
          if (msgLog.length > 80) msgLog.pop();
          renderOperatorLog();
        }
        return;
      }

      if (role === 'operator' && msg.type === 'worship_msg') {
        msgLog.unshift({
          from: msg.from,
          kind: msg.kind,
          text: msg.text,
          ts: msg.ts || Date.now()
        });
        if (msgLog.length > 80) msgLog.pop();
        if (IS_FLOATING && !widgetOpen) operatorUnreadCount += 1;
        renderOperatorLog();
        syncLauncherBadge();
        return;
      }

      /* member_list is now handled above for all roles */
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
      appendClientLog({
        id: nowId('out'),
        from: whoAmI,
        kind: kind,
        text: text,
        ts: Date.now(),
        direction: 'out',
        read: true
      });
      flashEl('cf-flash', '发送成功 ✓');
    }

    function sendCustom() {
      var input = ROOT.querySelector('#cf-custom-input');
      var text = input && input.value ? input.value.trim() : '';
      if (!text) return;
      sendWorshipMsg('custom', text);
      if (input) input.value = '';
    }

    function sendMemberChat() {
      var input = ROOT.querySelector('#cf-member-chat-input');
      var text = input && input.value ? input.value.trim() : '';
      if (!text) return;
      if (!wsReady()) {
        flashEl('cf-flash', '当前离线，暂时无法发送群聊', true);
        return;
      }
      var id = nowId('member');
      ws.send(JSON.stringify({ type: 'member_chat', id: id, text: text }));
      appendMemberChat({
        id: id,
        from: whoAmI,
        text: text,
        ts: Date.now()
      });
      if (input) input.value = '';
      flashEl('cf-flash', '成员群聊已发送 ✓');
    }

    function sendBroadcast() {
      var input = ROOT.querySelector('#cf-bcast-input');
      var text = input && input.value ? input.value.trim() : '';
      if (!text) return;
      if (!wsReady()) {
        flashEl('cf-flash', '当前离线，无法广播', true);
        return;
      }
      ws.send(JSON.stringify({ type: 'broadcast', id: nowId('broadcast'), text: text }));
      /* 记录到音控消息日志，方便回看自己发了什么 */
      msgLog.unshift({
        from: '音控组',
        kind: 'broadcast',
        text: text,
        ts: Date.now()
      });
      if (msgLog.length > 80) msgLog.pop();
      renderOperatorLog();
      if (input) input.value = '';
      flashEl('cf-flash', '已广播 ✓');
    }

    function sendKick(name) {
      if (!wsReady()) {
        flashEl('cf-flash', '当前离线，无法踢出', true);
        return;
      }
      ws.send(JSON.stringify({ type: 'kick', name: name }));
      flashEl('cf-flash', '已踢出 ' + name + ' ✓');
    }

    function sendKickAll() {
      if (!wsReady()) {
        flashEl('cf-flash', '当前离线，无法踢出', true);
        return;
      }
      ws.send(JSON.stringify({ type: 'kick_all' }));
      flashEl('cf-flash', '已踢出全员 ✓');
    }

    function setStatus(online) {
      isOnline = !!online;
      var dot = ROOT.querySelector('#cf-dot');
      if (dot) dot.classList.toggle('online', online);
      var label = ROOT.querySelector('#cf-status-label');
      if (label) label.textContent = online ? '在线' : '离线';
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

    function resetDeviceSelection() {
      forgetRememberedName();
      whoAmI = '';
      selectionSource = 'manual';
      clientLog = [];
      stopPing();
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
      if (ws) {
        try { ws.close(); } catch (err) {}
        ws = null;
      }
      renderSetup();
      if (IS_FLOATING) openWidget();
    }

    function destroy() {
      destroyed = true;
      stopPing();
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
      if (geomRaf) {
        if (window.cancelAnimationFrame) window.cancelAnimationFrame(geomRaf);
        else clearTimeout(geomRaf);
        geomRaf = 0;
      }
      if (geometryHandler) {
        window.removeEventListener('resize', geometryHandler);
        window.removeEventListener('orientationchange', geometryHandler);
        geometryHandler = null;
      }
      if (viewportGeometryHandler && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', viewportGeometryHandler);
        viewportGeometryHandler = null;
      }
      if (geomObserver) {
        try { geomObserver.disconnect(); } catch (err) {}
        geomObserver = null;
      }
      if (docKeyHandler) {
        document.removeEventListener('keydown', docKeyHandler);
        docKeyHandler = null;
      }
      if (fullscreenChangeHandler) {
        document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
        fullscreenChangeHandler = null;
      }
      var rootEl = document.documentElement;
      var bodyEl = document.body;
      if (pageShellApplied) {
        if (rootEl) rootEl.classList.remove('cf-page-shell');
        if (bodyEl) bodyEl.classList.remove('cf-page-shell');
        pageShellApplied = false;
        /* 还原被隐藏的 CMS 元素 */
        for (var _i = 0; _i < _hiddenBodyChildren.length; _i++) {
          var _item = _hiddenBodyChildren[_i];
          _item.el.style.display = _item.prev;
        }
        _hiddenBodyChildren = [];
        /* 把 ROOT 放回原位 */
        if (_originalParent && _originalParent !== document.body) {
          if (_originalNextSibling && _originalNextSibling.parentElement === _originalParent) {
            _originalParent.insertBefore(ROOT, _originalNextSibling);
          } else {
            _originalParent.appendChild(ROOT);
          }
        }
        _originalParent = null;
        _originalNextSibling = null;
      }
      if (rootEl) rootEl.classList.remove('cf-intercom-open');
      if (bodyEl) bodyEl.classList.remove('cf-intercom-open');
      if (ws) {
        try { ws.close(); } catch (err) {}
        ws = null;
      }
      ROOT.__cecpChromeReady = false;
      ROOT.__cecpMounted = false;
      ROOT.__cecpApi = null;
    }

    if (MODE === 'operator') {
      renderOperator();
      connect('operator');
    } else {
      whoAmI = readRememberedName();
      if (!whoAmI && DEFAULT_PRESET && PRESETS.indexOf(DEFAULT_PRESET) >= 0) {
        whoAmI = DEFAULT_PRESET;
        rememberName(DEFAULT_PRESET);
        selectionSource = 'default';
      } else if (whoAmI) {
        selectionSource = 'remembered';
      }
      if (whoAmI) {
        loadClientLog();
        loadMemberChat();
        if (IS_FLOATING) ensureChrome();
        else renderClient();
        connect('client');
      } else {
        if (IS_FLOATING) ensureChrome();
        else renderSetup();
      }
    }

    ROOT.__cecpApi = {
      mount: mount,
      open: openWidget,
      close: closeWidget,
      refreshLayout: scheduleFloatingGeometry,
      destroy: destroy
    };

    return ROOT.__cecpApi;
  }

  window.CECPIntercom = window.CECPIntercom || {};
  window.CECPIntercom.mount = mount;

  if (resolveRoot()) mount(resolveRoot());
})();
