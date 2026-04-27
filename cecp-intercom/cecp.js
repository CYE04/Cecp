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
    var OPERATOR_NOTES_KEY = 'cecp:intercom:operator-notes:' + WS_URL + ':' + PAGE_KEY;
    var OPERATOR_TASKS_KEY = 'cecp:intercom:operator-tasks:' + WS_URL + ':' + PAGE_KEY;
    var OPERATOR_QUICK_KEY = 'cecp:intercom:operator-quick:' + WS_URL + ':' + PAGE_KEY;

    var ws = null;
    var whoAmI = '';
    var reconnectTimer = null;
    var pingTimer = null;
    var msgLog = [];
    var clientLog = [];
    var memberChat = [];
    var flashTimers = {};
    var memberCount = 0;
    var operatorMembers = [];
    var operatorView = String(ROOT.dataset.operatorView || 'overview').trim() || 'overview';
    var operatorSelectedMsgIndex = 0;
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

    /* ============================================================
       Operator dashboard helpers — only affects data-mode="operator"
       ============================================================ */

    function opServiceLabel() {
      return String(ROOT.dataset.serviceLabel || ROOT.dataset.eventLabel || '2026 / 主日聚会');
    }

    function opServiceTitle() {
      return String(ROOT.dataset.serviceTitle || '主日敬拜');
    }

    function opScheduleTime() {
      return String(ROOT.dataset.scheduleTime || '09:30');
    }

    function opIsUrgent(item) {
      var text = String((item && item.text) || '');
      return !!item && (item.kind === 'issue' || /故障|紧急|不正常|没声|没有声音|断|爆音|噪音/.test(text));
    }

    function opBroadcasts() {
      return msgLog.filter(function (item) { return item.kind === 'broadcast'; });
    }

    function opRequests() {
      return msgLog.filter(function (item) { return item.kind !== 'broadcast'; });
    }

    function opMicMembers() {
      return operatorMembers.filter(function (m) { return detectIdentityType(m.name) === 'mic'; });
    }

    function opInstrumentMembers() {
      return operatorMembers.filter(function (m) { return detectIdentityType(m.name) === 'instrument'; });
    }

    function readJsonArray(key, fallback) {
      try {
        var parsed = JSON.parse(localStorage.getItem(key) || 'null');
        return Array.isArray(parsed) ? parsed : fallback.slice();
      } catch (err) {
        return fallback.slice();
      }
    }

    function writeJsonArray(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value || [])); } catch (err) {}
    }

    function defaultOperatorNotes() {
      return [
        { id: 'flow', title: '主日敬拜流程', body: '09:30 会前祷告\n09:45 团队预备与设备检查\n10:00 会众入场与暖场\n10:15 敬拜赞美\n10:30 信息分享\n11:15 回应与祷告\n11:30 结束与会后交通', tag: '流程', pinned: true, ts: Date.now() },
        { id: 'handheld', title: '讲员手持麦提醒', body: '讲员需要手持麦，敬拜结束后请协助切换。', tag: '提醒', pinned: false, ts: Date.now() - 3600000 },
        { id: 'newcomer', title: '下周新人加入', body: '下周有新人加入敬拜团队，需要提前安排同工协助。', tag: '人员', pinned: false, ts: Date.now() - 7200000 }
      ];
    }

    function getOperatorNotes() {
      return readJsonArray(OPERATOR_NOTES_KEY, defaultOperatorNotes()).slice(0, 24);
    }

    function saveOperatorNotes(notes) {
      writeJsonArray(OPERATOR_NOTES_KEY, notes.slice(0, 24));
    }

    function defaultOperatorTasks() {
      return [
        { id: 'speaker-mic', text: '检查讲员麦克风电量', done: true, due: '今天' },
        { id: 'song-order', text: '确认敬拜曲目顺序', done: true, due: '今天' },
        { id: 'stage-cables', text: '舞台设备线材检查', done: false, due: '今天' },
        { id: 'after-service', text: '服务结束后设备收纳', done: false, due: '会后' }
      ];
    }

    function getOperatorTasks() {
      return readJsonArray(OPERATOR_TASKS_KEY, defaultOperatorTasks()).slice(0, 30);
    }

    function saveOperatorTasks(tasks) {
      writeJsonArray(OPERATOR_TASKS_KEY, tasks.slice(0, 30));
    }

    function getOperatorCustomQuick() {
      return readJsonArray(OPERATOR_QUICK_KEY, []).slice(0, 40);
    }

    function saveOperatorCustomQuick(items) {
      writeJsonArray(OPERATOR_QUICK_KEY, items.slice(0, 40));
    }

    function opNavItems() {
      return [
        { id: 'overview', icon: '⌂', label: '总览' },
        { id: 'inbox', icon: '✉', label: '收到的信息', count: opRequests().length || '' },
        { id: 'broadcast', icon: '⌁', label: '广播中心' },
        { id: 'quick', icon: 'ϟ', label: '快捷信息' },
        { id: 'devices', icon: '▣', label: '在线设备', count: operatorMembers.length || '' },
        { id: 'chat', icon: '♧', label: '成员群聊', count: memberChat.length || '' },
        { id: 'notes', icon: '☷', label: '团队备注' }
      ];
    }

    function opStatCard(icon, label, value, sub, tone, id) {
      return [
        '<div class="cf-op-stat cf-op-tone-', escapeHtml(tone || 'gold'), '">',
        '  <div class="cf-op-stat-icon">', escapeHtml(icon), '</div>',
        '  <div class="cf-op-stat-copy">',
        '    <div class="cf-op-stat-label">', escapeHtml(label), '</div>',
        '    <div class="cf-op-stat-value"', id ? ' id="' + escapeHtml(id) + '"' : '', '>', escapeHtml(value), '</div>',
        '    <div class="cf-op-stat-sub">', escapeHtml(sub || ''), '</div>',
        '  </div>',
        '</div>'
      ].join('');
    }

    function opTopStats(kind) {
      var issueCount = msgLog.filter(opIsUrgent).length;
      var bcastCount = opBroadcasts().length;
      var notesCount = getOperatorNotes().length;
      if (kind === 'inbox') {
        return [
          opStatCard('●', '未读消息', opRequests().length + ' 条', '需要查看', 'blue', 'cf-stat-messages'),
          opStatCard('◷', '处理中', issueCount + ' 条', '正在跟进', 'gold', 'cf-stat-issues'),
          opStatCard('✓', '已读', Math.max(0, msgLog.length - issueCount) + ' 条', '已处理', 'green'),
          opStatCard('!', '紧急消息', issueCount + ' 条', '需要优先处理', 'red')
        ].join('');
      }
      if (kind === 'broadcast') {
        return [
          opStatCard('⌁', '今日广播', bcastCount + ' 条', '已发送记录', 'gold', 'cf-stat-broadcasts'),
          opStatCard('✎', '草稿', '0 条', '当前未保存', 'green'),
          opStatCard('➤', '已发送', bcastCount + ' 条', '广播历史', 'blue'),
          opStatCard('◎', '定向广播', '0 条', '当前未使用', 'purple')
        ].join('');
      }
      if (kind === 'quick') {
        return [
          opStatCard('☰', '常用快捷信息', (BCAST_PRESETS.length + CUES.length) + ' 条', '点击即可发送', 'gold'),
          opStatCard('☆', '已收藏', Math.min(8, BCAST_PRESETS.length) + ' 条', '常用广播', 'gold'),
          opStatCard('▦', '本场预设', BCAST_PRESETS.length + ' 条', '当前聚会预设', 'green'),
          opStatCard('➤', '最近发送', bcastCount + ' 条', '近7天发送记录', 'blue')
        ].join('');
      }
      if (kind === 'devices') {
        return [
          opStatCard('▣', '已选成员', operatorMembers.length + ' 人', '已选择设备', 'gold', 'cf-stat-members'),
          opStatCard('🎤', '已选话筒', opMicMembers().length + ' 支', '当前被选择', 'green', 'cf-stat-mics'),
          opStatCard('🎸', '已选乐器', opInstrumentMembers().length + ' 项', '当前被选择', 'blue', 'cf-stat-instruments'),
          opStatCard('◴', '当前场次', opServiceTitle(), '本次聚会', 'gold')
        ].join('');
      }
      if (kind === 'chat') {
        return [
          opStatCard('♧', '在线成员', operatorMembers.length + ' / ' + Math.max(operatorMembers.length, 1), '当前在线', 'green'),
          opStatCard('●', '今日消息', memberChat.length, '条消息', 'blue'),
          opStatCard('📌', '置顶话题', '3', '个话题', 'gold'),
          opStatCard('…', '未读对话', '0', '个对话', 'purple')
        ].join('');
      }
      if (kind === 'notes') {
        return [
          opStatCard('📌', '置顶备注', getOperatorNotes().filter(function(n){return n.pinned;}).length + ' 条', '重要备注', 'gold'),
          opStatCard('+', '今日新增', '0 条', '本地记录', 'blue'),
          opStatCard('◷', '待跟进', getOperatorTasks().filter(function(t){return !t.done;}).length + ' 条', '需要处理', 'gold'),
          opStatCard('▤', '已归档', notesCount + ' 条', '历史备注', 'green')
        ].join('');
      }
      return [
        opStatCard('□', '今日流程', opScheduleTime(), opServiceTitle(), 'gold'),
        opStatCard('⌁', '设备在线', operatorMembers.length + ' / ' + Math.max(operatorMembers.length, PRESETS.length), '已选择设备', 'green', 'cf-stat-members'),
        opStatCard('●', '未读信息', opRequests().length + ' 条', '需要查看', 'blue', 'cf-stat-messages'),
        opStatCard('✓', '待处理事项', getOperatorTasks().filter(function(t){return !t.done;}).length + ' 项', '需要跟进', 'gold')
      ].join('');
    }

    function opShell(title, subtitle, page, contentHtml) {
      var nav = opNavItems().map(function (item) {
        return [
          '<button class="cf-op-nav-item', item.id === page ? ' is-active' : '', '" type="button" data-op-view="', escapeHtml(item.id), '">',
          '  <span class="cf-op-nav-icon">', escapeHtml(item.icon), '</span>',
          '  <span class="cf-op-nav-label">', escapeHtml(item.label), '</span>',
          item.count ? '<span class="cf-op-nav-count">' + escapeHtml(item.count) + '</span>' : '',
          '</button>'
        ].join('');
      }).join('');

      return [
        '<div class="cf-op-shell">',
        '  <aside class="cf-op-sidebar">',
        '    <div class="cf-op-brand"><span class="cf-op-cross">✝</span><span class="cf-op-brand-text">CECP</span></div>',
        '    <nav class="cf-op-nav">', nav, '</nav>',
        '    <div class="cf-op-system-card"><span class="cf-op-system-dot"></span><div><strong>系统运行正常</strong><span>所有设备在线</span></div><span>›</span></div>',
        '  </aside>',
        '  <main class="cf-op-main">',
        '    <header class="cf-op-topbar">',
        '      <div class="cf-op-heading"><h1>', escapeHtml(title), '</h1><p>', escapeHtml(subtitle), '</p></div>',
        '      <div class="cf-op-toolbar">',
        '        <button class="cf-op-select" type="button">□ ', escapeHtml(opServiceLabel()), '⌄</button>',
        '        <div class="cf-op-search">⌕ <input type="search" placeholder="搜索成员或信息..." aria-label="搜索"></div>',
        IS_FLOATING ? '' : '<button class="cf-op-icon-btn" id="cf-fullscreen-btn" type="button" aria-label="全屏">⛶</button>',
        '        <button class="cf-op-bell" type="button" aria-label="通知">♢<span>', escapeHtml(String(opRequests().length || 0)), '</span></button>',
        '        <div class="cf-op-avatar">C</div>',
        '        <span class="cf-status cf-op-status"><span class="cf-dot" id="cf-dot"></span><span id="cf-status-label">连接中…</span></span>',
        '      </div>',
        '    </header>',
        contentHtml,
        '  </main>',
        '  <div class="cf-flash" id="cf-flash">操作完成 ✓</div>',
        '</div>'
      ].join('');
    }

    function opCard(title, icon, body, extraClass, action) {
      return [
        '<section class="cf-op-card ', escapeHtml(extraClass || ''), '">',
        '  <div class="cf-op-card-head"><h2><span>', escapeHtml(icon || ''), '</span>', escapeHtml(title), '</h2>', action || '', '</div>',
        body,
        '</section>'
      ].join('');
    }

    function opBuildMessageList(limit, filter, compact) {
      var items = msgLog.filter(function (item) {
        if (filter === 'requests') return item.kind !== 'broadcast';
        if (filter === 'broadcast') return item.kind === 'broadcast';
        if (filter === 'urgent') return opIsUrgent(item);
        return true;
      });
      if (typeof limit === 'number' && limit > 0) items = items.slice(0, limit);
      if (!items.length) return '<div class="cf-op-empty">暂时还没有收到消息</div>';
      return items.map(function (item) {
        var idx = msgLog.indexOf(item);
        var icon = KIND_ICONS[item.kind] || detectIdentityIcon(item.from) || '💬';
        var urgent = opIsUrgent(item);
        var meta = item.kind === 'broadcast' ? '已广播' : (item.kind === 'member_chat' ? '成员群聊' : '处理中');
        return [
          '<button class="cf-op-msg-row', operatorSelectedMsgIndex === idx ? ' is-active' : '', urgent ? ' is-urgent' : '', '" type="button" data-msg-index="', idx, '">',
          '  <span class="cf-op-msg-icon">', escapeHtml(icon), '</span>',
          '  <span class="cf-op-msg-main"><strong>', escapeHtml(stripIdentityPrefix(item.from) || item.from || '音控组'), '</strong><em>', escapeHtml(item.text), '</em></span>',
          compact ? '' : '<span class="cf-op-msg-time">' + escapeHtml(formatTime(item.ts)) + '</span>',
          '  <span class="cf-op-msg-chip">', urgent ? '紧急' : escapeHtml(meta), '</span>',
          '</button>'
        ].join('');
      }).join('');
    }

    function opBuildMessageDetail() {
      if (!msgLog.length) return '<div class="cf-op-empty">选择一条信息后，这里会显示详情</div>';
      if (operatorSelectedMsgIndex < 0 || operatorSelectedMsgIndex >= msgLog.length) operatorSelectedMsgIndex = 0;
      var item = msgLog[operatorSelectedMsgIndex] || msgLog[0];
      var urgent = opIsUrgent(item);
      return [
        '<div class="cf-op-detail-box">',
        '  <div class="cf-op-detail-top">', renderIdentityPill(item.from || '音控组', 'cf-op-detail-from'), '<span class="cf-op-detail-status">', urgent ? '紧急' : '普通', '</span></div>',
        '  <dl class="cf-op-detail-list">',
        '    <dt>发送时间</dt><dd>', escapeHtml(formatTime(item.ts)), '</dd>',
        '    <dt>消息内容</dt><dd class="cf-op-detail-message">', escapeHtml(item.text), '</dd>',
        '    <dt>消息类型</dt><dd>', escapeHtml(item.kind === 'broadcast' ? '广播记录' : (item.kind === 'member_chat' ? '成员群聊' : '发给音控组')), '</dd>',
        '  </dl>',
        '  <div class="cf-op-reply-grid">',
        '    <button type="button" data-op-send-text="已收到">✓ 已收到</button>',
        '    <button type="button" data-op-send-text="正在处理">◷ 正在处理</button>',
        '    <button type="button" data-op-send-text="马上安排">➤ 马上安排</button>',
        '    <button type="button" data-op-send-text="稍等一下">⌛ 稍等一下</button>',
        '  </div>',
        '</div>'
      ].join('');
    }

    function opBuildMemberRows(limit) {
      var members = operatorMembers.slice(0, limit || operatorMembers.length);
      if (!members.length) return '<div class="cf-op-empty">当前没有设备在线</div>';
      return members.map(function (member) {
        return [
          '<div class="cf-op-device-row">',
          renderIdentityPill(member.name, 'cf-member-pill'),
          '<button class="cf-kick-btn" type="button" data-kick-name="', escapeHtml(member.name), '" title="踢出该成员">踢出</button>',
          '</div>'
        ].join('');
      }).join('');
    }

    function opBuildDeviceTable() {
      if (!operatorMembers.length) return '<div class="cf-op-empty">还没有成员选择话筒或乐器，所以设备列表为空。</div>';
      return [
        '<div class="cf-op-table">',
        '  <div class="cf-op-table-head"><span>设备</span><span>类型</span><span>状态</span><span>操作</span></div>',
        operatorMembers.map(function (member) {
          var meta = getIdentityMeta(member.name);
          return [
            '<div class="cf-op-table-row">',
            '  <span>', renderIdentityPill(member.name, 'cf-member-pill'), '</span>',
            '  <span><b class="cf-op-tag">', meta.type === 'mic' ? '话筒' : (meta.type === 'instrument' ? '乐器' : '设备'), '</b></span>',
            '  <span><i class="cf-op-online-dot"></i> 已选择</span>',
            '  <span><button class="cf-kick-btn" type="button" data-kick-name="', escapeHtml(member.name), '">踢出</button></span>',
            '</div>'
          ].join('');
        }).join(''),
        '</div>'
      ].join('');
    }

    function opBuildSplitDevices(kind) {
      var members = kind === 'mic' ? opMicMembers() : opInstrumentMembers();
      if (!members.length) return '<div class="cf-op-empty">暂无' + (kind === 'mic' ? '话筒' : '乐器') + '被选择</div>';
      return members.map(function (m) {
        return '<div class="cf-op-mini-line">' + renderIdentityPill(m.name, 'cf-member-pill') + '</div>';
      }).join('');
    }

    function opBuildTasks(limit) {
      var tasks = getOperatorTasks();
      if (typeof limit === 'number') tasks = tasks.slice(0, limit);
      return tasks.map(function (task) {
        return [
          '<label class="cf-op-task-row">',
          '  <input type="checkbox" data-op-task="', escapeHtml(task.id), '"', task.done ? ' checked' : '', '>',
          '  <span>', escapeHtml(task.text), '</span>',
          '  <em>', escapeHtml(task.due || ''), '</em>',
          '</label>'
        ].join('');
      }).join('') || '<div class="cf-op-empty">暂无待办事项</div>';
    }

    function opBuildNotesList(limit) {
      var notes = getOperatorNotes().sort(function (a, b) { return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0); });
      if (typeof limit === 'number') notes = notes.slice(0, limit);
      if (!notes.length) return '<div class="cf-op-empty">暂无团队备注</div>';
      return notes.map(function (note, idx) {
        return [
          '<button class="cf-op-note-row', idx === 0 ? ' is-active' : '', '" type="button" data-op-note-id="', escapeHtml(note.id), '">',
          '  <strong>', escapeHtml(note.title), note.pinned ? ' 📌' : '', '</strong>',
          '  <span>', escapeHtml(note.tag || '备注'), '</span>',
          '</button>'
        ].join('');
      }).join('');
    }

    function opBuildNoteDetail() {
      var notes = getOperatorNotes();
      var note = notes[0];
      if (!note) return '<div class="cf-op-empty">选择一条备注后，这里会显示内容</div>';
      return [
        '<div class="cf-op-note-detail">',
        '  <div class="cf-op-note-detail-head"><h2>', escapeHtml(note.title), note.pinned ? ' 📌' : '', '</h2><span>', escapeHtml(note.tag || '备注'), '</span></div>',
        '  <pre>', escapeHtml(note.body || ''), '</pre>',
        '</div>'
      ].join('');
    }

    function opRenderOverview() {
      return opShell('音控区', 'Intercom Control Center', 'overview', [
        '<section class="cf-op-stats">', opTopStats('overview'), '</section>',
        '<section class="cf-op-grid cf-op-grid-overview">',
        opCard('收到的信息', '▣', '<div class="cf-op-list" data-cf-op-log data-filter="requests" data-limit="5">' + opBuildMessageList(5, 'requests', true) + '</div><button class="cf-op-link" data-op-view="inbox" type="button">查看全部信息 ›</button>', 'cf-op-span-4'),
        opCard('广播所有成员', '⌁', '<textarea id="cf-bcast-input" class="cf-op-textarea" placeholder="请输入广播内容..." maxlength="200"></textarea><div class="cf-op-chips"><span>全体 ×</span><span>敬拜组 ×</span><span>音控组 ×</span><button type="button">+ 添加</button></div><div class="cf-op-actions"><button class="cf-op-primary" id="cf-bcast-send" type="button">➤ 发送广播</button><button class="cf-op-secondary" id="cf-bcast-clear" type="button">清空</button></div>', 'cf-op-span-4'),
        opCard('快捷信息', 'ϟ', '<div class="cf-op-quick-grid">' + BCAST_PRESETS.slice(0, 6).map(function(t){return '<button type="button" data-op-send-text="' + escapeHtml(t) + '">' + escapeHtml(t) + '</button>';}).join('') + '</div><button class="cf-op-link" data-op-view="quick" type="button">管理快捷信息 ›</button>', 'cf-op-span-4'),
        opCard('在线设备', '▣', '<div data-cf-member-list>' + opBuildMemberRows(6) + '</div><button class="cf-op-link" data-op-view="devices" type="button">查看全部设备 ›</button>', 'cf-op-span-4'),
        opCard('团队备注', '☷', '<ul class="cf-op-note-mini"><li>注意舞台区电源使用，避免超载。</li><li>讲员需要手持麦，提前测试。</li><li>下周有新人加入，安排同工协助。</li></ul><button class="cf-op-link" data-op-view="notes" type="button">查看全部备注 ›</button>', 'cf-op-span-4'),
        opCard('待办事项', '✓', '<div class="cf-op-tasks">' + opBuildTasks(4) + '</div><button class="cf-op-link" data-op-view="notes" type="button">查看全部待办 ›</button>', 'cf-op-span-4'),
        '</section>'
      ].join(''));
    }

    function opRenderInbox() {
      return opShell('收到的信息', 'Message Inbox', 'inbox', [
        '<section class="cf-op-stats">', opTopStats('inbox'), '</section>',
        '<section class="cf-op-grid cf-op-grid-inbox">',
        opCard('消息列表', '✉', '<div class="cf-op-tabs"><span class="is-active">全部 <b>' + msgLog.length + '</b></span><span>未读 <b>' + opRequests().length + '</b></span><span>处理中 <b>' + msgLog.filter(opIsUrgent).length + '</b></span><span>已读 <b>' + Math.max(0, msgLog.length - opRequests().length) + '</b></span></div><div class="cf-op-list cf-op-list-large" data-cf-op-log data-filter="all">' + opBuildMessageList(0, 'all', false) + '</div><button class="cf-op-link" id="cf-clear-btn" type="button">清空消息记录 ›</button>', 'cf-op-span-7'),
        opCard('消息详情', '▣', '<div id="cf-op-message-detail">' + opBuildMessageDetail() + '</div>', 'cf-op-span-5'),
        '</section>'
      ].join(''));
    }

    function opRenderBroadcast() {
      return opShell('广播中心', 'Broadcast Center', 'broadcast', [
        '<section class="cf-op-stats">', opTopStats('broadcast'), '</section>',
        '<section class="cf-op-grid cf-op-grid-broadcast">',
        opCard('发送广播', '⌁', '<textarea id="cf-bcast-input" class="cf-op-textarea cf-op-textarea-lg" placeholder="输入广播内容..." maxlength="200"></textarea><div class="cf-op-chips"><span>全体</span><span>敬拜组</span><span>音控组</span><span>讲员</span><span>后台</span><button type="button">+ 更多</button></div><div class="cf-op-actions"><button class="cf-op-primary" id="cf-bcast-send" type="button">➤ 发送广播</button><button class="cf-op-secondary" type="button" id="cf-bcast-save">保存草稿</button><button class="cf-op-secondary" type="button" id="cf-bcast-clear">清空</button></div>', 'cf-op-span-7'),
        opCard('广播模板', '☰', '<div class="cf-op-template-grid">' + BCAST_PRESETS.concat(['请预备','请安静','五分钟后开始','结束后集合','请回到位置']).slice(0, 8).map(function(t){return '<button type="button" data-op-fill-text="' + escapeHtml(t) + '">' + escapeHtml(t) + '</button>';}).join('') + '</div>', 'cf-op-span-5'),
        opCard('最近广播记录', '☷', '<div class="cf-op-list" data-cf-op-log data-filter="broadcast">' + opBuildMessageList(8, 'broadcast', true) + '</div>', 'cf-op-span-7'),
        opCard('广播规则', '♢', '<div class="cf-op-rule-list"><p><strong>广播即刻送达</strong><span>广播信息会即时推送到所有选定成员设备。</span></p><p><strong>定向清楚</strong><span>按团队或角色发送，避免信息干扰。</span></p><p><strong>记录可追溯</strong><span>所有广播会自动保存，方便查询与回溯。</span></p></div>', 'cf-op-span-5'),
        '</section>'
      ].join(''));
    }

    function opRenderQuick() {
      var custom = getOperatorCustomQuick();
      var quickRows = [
        { icon: '♪', title: '排练', items: BCAST_PRESETS.concat(['请预备', '下一首', '请稍等', '请安静']).slice(0, 5) },
        { icon: '♥', title: '敬拜', items: ['下一首', '请安静', '耳返正常吗', '请开讲员麦', '请注意节奏'] },
        { icon: '🎤', title: '讲道', items: ['请开讲员麦', '请安静', '可以开始', '请稍等', '谢谢牧师'] },
        { icon: '▣', title: '现场秩序', items: ['请保持安静', '注意安全', '请勿走动', '请看屏幕', '请遵守秩序'] },
        { icon: '⚑', title: '结束提醒', items: ['结束后集合', '清理场地', '请关设备', '感谢配合'] }
      ];
      return opShell('快捷信息', 'Quick Messages', 'quick', [
        '<section class="cf-op-stats">', opTopStats('quick'), '</section>',
        '<section class="cf-op-grid cf-op-grid-quick">',
        opCard('快捷信息库', '☰', '<div class="cf-op-quick-library">' + quickRows.map(function(row){return '<div class="cf-op-quick-row"><div><span>' + escapeHtml(row.icon) + '</span><strong>' + escapeHtml(row.title) + '</strong><em>' + row.items.length + ' 条</em></div><div>' + row.items.map(function(t){return '<button type="button" data-op-send-text="' + escapeHtml(t) + '">' + escapeHtml(t) + ' ➤</button>';}).join('') + '</div></div>';}).join('') + '</div>', 'cf-op-span-8'),
        opCard('收藏夹', '☆', '<div class="cf-op-fav-list">' + BCAST_PRESETS.concat(['请保持安静','谢谢配合']).slice(0, 8).map(function(t){return '<button type="button" data-op-send-text="' + escapeHtml(t) + '">☆ ' + escapeHtml(t) + ' ➤</button>';}).join('') + '</div>', 'cf-op-span-4'),
        opCard('自定义快捷信息', '✎', '<div class="cf-op-custom-quick"><div class="cf-custom-area"><input id="cf-op-custom-quick-input" type="text" placeholder="新建快捷信息..." maxlength="80"><button id="cf-op-add-quick" type="button">添加</button></div>' + (custom.length ? custom.map(function(t){return '<button type="button" data-op-send-text="' + escapeHtml(t) + '">' + escapeHtml(t) + '</button>';}).join('') : '<div class="cf-op-empty">还没有自定义快捷信息</div>') + '</div>', 'cf-op-span-8'),
        opCard('最近使用', '◷', '<div class="cf-op-recent-list">' + opBroadcasts().slice(0, 6).map(function(item){return '<button type="button" data-op-send-text="' + escapeHtml(item.text) + '"><span>' + escapeHtml(item.text) + '</span><em>' + escapeHtml(formatTime(item.ts)) + '</em></button>';}).join('') + '</div>', 'cf-op-span-4'),
        '</section>'
      ].join(''));
    }

    function opRenderDevices() {
      return opShell('在线设备', 'Selected Devices', 'devices', [
        '<section class="cf-op-stats">', opTopStats('devices'), '</section>',
        '<section class="cf-op-grid cf-op-grid-devices">',
        opCard('设备列表', '▣', '<div data-cf-member-table>' + opBuildDeviceTable() + '</div>', 'cf-op-span-7'),
        opCard('话筒颜色', '🎤', '<div class="cf-op-split-list" data-cf-mic-list>' + opBuildSplitDevices('mic') + '</div>', 'cf-op-span-5'),
        opCard('乐器分配', '🎸', '<div class="cf-op-split-list" data-cf-instrument-list>' + opBuildSplitDevices('instrument') + '</div>', 'cf-op-span-5'),
        opCard('成员选择概览', '♧', '<div class="cf-op-member-chips">' + operatorMembers.map(function(m){return renderIdentityPill(m.name, 'cf-member-pill');}).join('') + '</div>', 'cf-op-span-7'),
        '</section>'
      ].join(''));
    }

    function opRenderChat() {
      return opShell('成员群聊', 'Team Chat', 'chat', [
        '<section class="cf-op-stats">', opTopStats('chat'), '</section>',
        '<section class="cf-op-grid cf-op-grid-chat">',
        opCard('对话列表', '♧', '<div class="cf-op-room-list"><button class="is-active" type="button"><strong>全体</strong><span>团队同步</span></button><button type="button"><strong>敬拜组</strong><span>排练沟通</span></button><button type="button"><strong>音控组</strong><span>技术确认</span></button><button type="button"><strong>后台协助</strong><span>流程提醒</span></button></div>', 'cf-op-span-3'),
        opCard('全体', '♧', '<div class="cf-log cf-log-member-chat cf-op-chat-log" id="cf-member-chat-log"><div class="cf-log-empty">成员群聊会显示在这里</div></div><div class="cf-custom-area cf-member-chat-compose"><input id="cf-member-chat-input" type="text" placeholder="输入消息，Enter 发送..." maxlength="180"><button id="cf-member-chat-send" type="button">发送</button></div>', 'cf-op-span-6'),
        opCard('成员列表', '☰', '<div data-cf-member-list>' + opBuildMemberRows(10) + '</div>', 'cf-op-span-3'),
        opCard('置顶公告', '📌', '<div class="cf-op-pin-list"><p>主日聚会流程安排</p><p>音控组注意事项</p><p>下次服事轮值表</p></div>', 'cf-op-span-3'),
        '</section>'
      ].join(''));
    }

    function opRenderNotes() {
      return opShell('团队备注', 'Team Notes', 'notes', [
        '<section class="cf-op-stats">', opTopStats('notes'), '</section>',
        '<section class="cf-op-grid cf-op-grid-notes">',
        opCard('备注列表', '☷', '<div class="cf-op-note-search"><input type="search" placeholder="搜索备注标题或内容..."></div><div class="cf-op-note-list">' + opBuildNotesList() + '</div><div class="cf-custom-area"><input id="cf-op-note-title" type="text" placeholder="新建备注标题..." maxlength="50"><button id="cf-op-add-note" type="button">新建备注</button></div>', 'cf-op-span-4'),
        opCard('备注内容', '📌', opBuildNoteDetail() + '<textarea id="cf-op-note-body" class="cf-op-textarea" placeholder="添加备注或更新记录..."></textarea>', 'cf-op-span-5'),
        opCard('置顶备注', '📌', '<div class="cf-op-note-list is-small">' + opBuildNotesList(4) + '</div>', 'cf-op-span-3'),
        opCard('待办提醒', '✓', '<div class="cf-op-tasks">' + opBuildTasks() + '</div>', 'cf-op-span-3'),
        '</section>'
      ].join(''));
    }

    function opRenderCurrent() {
      if (operatorView === 'inbox') return opRenderInbox();
      if (operatorView === 'broadcast') return opRenderBroadcast();
      if (operatorView === 'quick') return opRenderQuick();
      if (operatorView === 'devices') return opRenderDevices();
      if (operatorView === 'chat') return opRenderChat();
      if (operatorView === 'notes') return opRenderNotes();
      operatorView = 'overview';
      return opRenderOverview();
    }

    function operatorSendBroadcastText(text) {
      text = String(text || '').trim();
      if (!text) return;
      if (!wsReady()) {
        flashEl('cf-flash', '当前离线，无法广播', true);
        return;
      }
      ws.send(JSON.stringify({ type: 'broadcast', id: nowId('broadcast'), text: text }));
      msgLog.unshift({ from: '音控组', kind: 'broadcast', text: text, ts: Date.now() });
      if (msgLog.length > 80) msgLog.pop();
      operatorSelectedMsgIndex = 0;
      renderOperatorLog();
      flashEl('cf-flash', '已广播 ✓');
    }

    function operatorSendMemberChat() {
      var input = ROOT.querySelector('#cf-member-chat-input');
      var text = input && input.value ? input.value.trim() : '';
      if (!text) return;
      if (!wsReady()) {
        flashEl('cf-flash', '当前离线，暂时无法发送群聊', true);
        return;
      }
      var id = nowId('member');
      ws.send(JSON.stringify({ type: 'member_chat', id: id, text: text }));
      appendMemberChat({ id: id, from: '音控组', text: text, ts: Date.now() });
      if (input) input.value = '';
      flashEl('cf-flash', '成员群聊已发送 ✓');
    }

    function bindOperatorDashboard() {
      ROOT.querySelectorAll('[data-op-view]').forEach(function (button) {
        button.addEventListener('click', function () {
          var view = button.getAttribute('data-op-view') || 'overview';
          operatorView = view;
          renderOperator();
        });
      });

      ROOT.querySelectorAll('[data-op-send-text]').forEach(function (button) {
        if (button.__opBound) return;
        button.__opBound = true;
        button.addEventListener('click', function () {
          operatorSendBroadcastText(button.getAttribute('data-op-send-text') || button.textContent || '');
        });
      });

      ROOT.querySelectorAll('[data-op-fill-text]').forEach(function (button) {
        button.addEventListener('click', function () {
          var input = ROOT.querySelector('#cf-bcast-input');
          if (input) input.value = button.getAttribute('data-op-fill-text') || '';
        });
      });

      var sendBtn = ROOT.querySelector('#cf-bcast-send');
      var input = ROOT.querySelector('#cf-bcast-input');
      if (sendBtn) sendBtn.addEventListener('click', sendBroadcast);
      if (input) {
        input.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) sendBroadcast();
        });
      }
      var clearInput = ROOT.querySelector('#cf-bcast-clear');
      if (clearInput) clearInput.addEventListener('click', function () {
        var i = ROOT.querySelector('#cf-bcast-input');
        if (i) i.value = '';
      });

      var clearBtn = ROOT.querySelector('#cf-clear-btn');
      if (clearBtn) clearBtn.addEventListener('click', function () {
        msgLog = [];
        operatorSelectedMsgIndex = 0;
        renderOperator();
      });

      var kickAllBtn = ROOT.querySelector('#cf-kick-all-btn');
      if (kickAllBtn) kickAllBtn.addEventListener('click', sendKickAll);

      ROOT.querySelectorAll('[data-msg-index]').forEach(function (row) {
        if (row.__opMsgBound) return;
        row.__opMsgBound = true;
        row.addEventListener('click', function () {
          operatorSelectedMsgIndex = Number(row.getAttribute('data-msg-index') || 0) || 0;
          renderOperatorLog();
        });
      });

      ROOT.querySelectorAll('[data-op-task]').forEach(function (input) {
        input.addEventListener('change', function () {
          var id = input.getAttribute('data-op-task') || '';
          var tasks = getOperatorTasks().map(function (task) {
            if (task.id === id) task.done = input.checked;
            return task;
          });
          saveOperatorTasks(tasks);
          updateOperatorStats();
        });
      });

      var addQuick = ROOT.querySelector('#cf-op-add-quick');
      if (addQuick) addQuick.addEventListener('click', function () {
        var quickInput = ROOT.querySelector('#cf-op-custom-quick-input');
        var text = quickInput && quickInput.value ? quickInput.value.trim() : '';
        if (!text) return;
        var items = getOperatorCustomQuick();
        items.unshift(text);
        saveOperatorCustomQuick(items);
        renderOperator();
      });

      var addNote = ROOT.querySelector('#cf-op-add-note');
      if (addNote) addNote.addEventListener('click', function () {
        var titleInput = ROOT.querySelector('#cf-op-note-title');
        var bodyInput = ROOT.querySelector('#cf-op-note-body');
        var title = titleInput && titleInput.value ? titleInput.value.trim() : '';
        var body = bodyInput && bodyInput.value ? bodyInput.value.trim() : '';
        if (!title) return;
        var notes = getOperatorNotes();
        notes.unshift({ id: nowId('note'), title: title, body: body || '暂无内容', tag: '备注', pinned: false, ts: Date.now() });
        saveOperatorNotes(notes);
        renderOperator();
      });

      var memberSendBtn = ROOT.querySelector('#cf-member-chat-send');
      var memberInput = ROOT.querySelector('#cf-member-chat-input');
      if (memberSendBtn) memberSendBtn.addEventListener('click', operatorSendMemberChat);
      if (memberInput) memberInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') operatorSendMemberChat();
      });

      var fullscreenBtn = ROOT.querySelector('#cf-fullscreen-btn');
      if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
        if (!fullscreenChangeHandler) {
          fullscreenChangeHandler = syncFullscreenButton;
          document.addEventListener('fullscreenchange', fullscreenChangeHandler);
        }
        syncFullscreenButton();
      }
    }

    function renderOperator() {
      ensureChrome();
      ROOT.classList.add('cf-mode-operator');
      setStageHtml(opRenderCurrent());
      bindOperatorDashboard();
      renderMembers(operatorMembers);
      renderOperatorLog();
      renderMemberChat();
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
        var mine = item.from === whoAmI || (MODE === 'operator' && item.from === '音控组');
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
      var issueCount = msgLog.filter(opIsUrgent).length;
      var broadcastCount = opBroadcasts().length;
      var chatCount = memberChat.length;
      var micCount = opMicMembers().length;
      var instrumentCount = opInstrumentMembers().length;
      var pendingTasks = getOperatorTasks().filter(function (task) { return !task.done; }).length;

      var values = {
        'cf-stat-members': String(memberCount),
        'cf-stat-messages': String(msgLog.length),
        'cf-stat-issues': String(issueCount),
        'cf-stat-broadcasts': String(broadcastCount),
        'cf-stat-chat': String(chatCount),
        'cf-stat-mics': String(micCount),
        'cf-stat-instruments': String(instrumentCount),
        'cf-stat-tasks': String(pendingTasks)
      };

      Object.keys(values).forEach(function (id) {
        ROOT.querySelectorAll('#' + id).forEach(function (el) {
          el.textContent = values[id];
        });
      });

      ROOT.querySelectorAll('.cf-op-bell span').forEach(function (el) {
        el.textContent = String(opRequests().length || 0);
      });
    }

    function renderMembers(members) {
      operatorMembers = Array.isArray(members) ? members.slice() : [];
      memberCount = operatorMembers.length;

      var title = ROOT.querySelector('#cf-member-title');
      if (title) title.textContent = '在线设备（' + operatorMembers.length + '）';

      ROOT.querySelectorAll('[data-cf-member-list]').forEach(function (list) {
        list.innerHTML = opBuildMemberRows(Number(list.getAttribute('data-limit') || 0) || 0);
      });

      ROOT.querySelectorAll('[data-cf-member-table]').forEach(function (box) {
        box.innerHTML = opBuildDeviceTable();
      });

      ROOT.querySelectorAll('[data-cf-mic-list]').forEach(function (box) {
        box.innerHTML = opBuildSplitDevices('mic');
      });

      ROOT.querySelectorAll('[data-cf-instrument-list]').forEach(function (box) {
        box.innerHTML = opBuildSplitDevices('instrument');
      });

      ROOT.querySelectorAll('.cf-kick-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var name = btn.getAttribute('data-kick-name') || '';
          if (name) sendKick(name);
        });
      });

      updateOperatorStats();
    }

    function renderOperatorLog() {
      ROOT.querySelectorAll('[data-cf-op-log]').forEach(function (log) {
        var limit = Number(log.getAttribute('data-limit') || 0) || 0;
        var filter = log.getAttribute('data-filter') || 'all';
        log.innerHTML = opBuildMessageList(limit, filter, log.classList.contains('cf-op-list-compact'));
      });

      var detail = ROOT.querySelector('#cf-op-message-detail');
      if (detail) detail.innerHTML = opBuildMessageDetail();

      ROOT.querySelectorAll('[data-msg-index]').forEach(function (row) {
        if (row.__opMsgBound) return;
        row.__opMsgBound = true;
        row.addEventListener('click', function () {
          operatorSelectedMsgIndex = Number(row.getAttribute('data-msg-index') || 0) || 0;
          renderOperatorLog();
        });
      });

      ROOT.querySelectorAll('[data-op-send-text]').forEach(function (button) {
        if (button.__opBound) return;
        button.__opBound = true;
        button.addEventListener('click', function () {
          operatorSendBroadcastText(button.getAttribute('data-op-send-text') || button.textContent || '');
        });
      });

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

      /* ── 设备已被占用（注册被服务端拒绝）── */
      if (msg.type === 'name_taken') {
        /* 停止重连，清除身份，回到选择界面让用户换一个 */
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
        if (ws) {
          try { ws.close(); } catch (err) {}
          ws = null;
        }
        var takenName = msg.name || whoAmI;
        forgetRememberedName();
        whoAmI = '';
        selectionSource = 'manual';
        if (IS_FLOATING) {
          renderSetup();
          openWidget();
        } else {
          renderSetup();
        }
        setTimeout(function () {
          alert('「' + takenName + '」已有人在使用，请选择其他设备。');
        }, 100);
        return;
      }

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
        /* 如果当前在选择界面，只更新各按钮的占用状态，不重建 DOM
           （重建会丢失 renderSetup 闭包里的 selected 变量，导致点"进入"时
           误报"请先选择你的身份"） */
        ROOT.querySelectorAll('.cf-preset-btn').forEach(function (button) {
          var name = button.dataset.name || '';
          var taken = takenDevices.indexOf(name) >= 0 && name !== whoAmI;
          if (taken) {
            button.disabled = true;
            button.setAttribute('aria-disabled', 'true');
            button.classList.add('taken');
            var sub = button.querySelector('.cf-preset-sub');
            if (sub) sub.textContent = '已有人使用';
            var badge = button.querySelector('.cf-preset-taken-badge');
            if (!badge) {
              badge = document.createElement('span');
              badge.className = 'cf-preset-taken-badge';
              badge.textContent = '占用中';
              button.appendChild(badge);
            }
          } else {
            button.disabled = false;
            button.removeAttribute('aria-disabled');
            button.classList.remove('taken');
            var sub = button.querySelector('.cf-preset-sub');
            var meta = getIdentityMeta(name);
            if (sub) sub.textContent = escapeHtml(meta.subtitle);
            var badge = button.querySelector('.cf-preset-taken-badge');
            if (badge) badge.parentElement.removeChild(badge);
          }
        });
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
      operatorSendBroadcastText(text);
      if (input) input.value = '';
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
