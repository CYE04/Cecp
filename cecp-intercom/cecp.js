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
    var OPERATOR_QUICK_KEY = 'cecp:intercom:operator-quick:' + WS_URL + ':' + PAGE_KEY;
    var OPERATOR_DRAFT_KEY = 'cecp:intercom:operator-draft:' + WS_URL + ':' + PAGE_KEY;
    var OPERATOR_MSG_META_KEY = 'cecp:intercom:operator-msg-meta:' + WS_URL + ':' + PAGE_KEY;

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
    // Product scope: operator UI keeps the five requested screens only.
    var OPERATOR_VIEWS = ['inbox', 'broadcast', 'quick', 'devices', 'chat'];
    var operatorView = normalizeOperatorView(ROOT.dataset.operatorView || 'broadcast');
    var operatorSelectedMsgIndex = 0;
    var operatorInboxFilter = 'all';
    var operatorInboxSort = 'latest';
    var operatorTargetSelection = ['全体'];
    var operatorDrafts = [];
    var operatorMessageMeta = {};
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
    var operatorResponsiveHandler = null;
    var clientResponsiveHandler = null;
    var operatorClockTimer = null;
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
        ' data-name="', escapeHtml(meta.displayName), '"',
        ' data-device-base="', escapeHtml(deviceBaseName(meta.displayName)), '">',
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

    function stripEmojiPrefix(value) {
      return String(value || '')
        .replace(/^[\s🎤🎹🎸🥁🎛️📢🎧🎵⚠️🔊🔉📣]+/u, '')
        .trim();
    }

    function deviceBaseName(value) {
      var raw = stripEmojiPrefix(value);
      raw = raw.split('·')[0].split('|')[0].split('／')[0].trim();
      raw = raw.replace(/^(我是|设备|身份)[:：]\s*/g, '').trim();
      return raw;
    }

    function identityAliasName(value) {
      var raw = stripEmojiPrefix(value);
      var parts = raw.split('·');
      if (parts.length < 2) return '';
      return parts.slice(1).join('·').trim();
    }

    function formatIdentityName(base, alias) {
      var b = stripEmojiPrefix(base);
      var a = String(alias || '').replace(/[<>]/g, '').trim();
      return a ? (b + ' · ' + a) : b;
    }

    function isHiddenClientDevice(value) {
      return /音控|投影/.test(stripEmojiPrefix(value));
    }

    function deviceOptionTaken(base) {
      var b = deviceBaseName(base);
      if (!b) return false;
      return takenDevices.some(function (name) {
        if (name === whoAmI) return false;
        return deviceBaseName(name) === b;
      });
    }

    function setupPresetGroups() {
      var list = PRESETS.filter(function (item) { return !isHiddenClientDevice(item); });
      var mics = list.filter(function (item) { return detectIdentityType(item) === 'mic'; });
      var instruments = list.filter(function (item) { return detectIdentityType(item) === 'instrument'; });
      var others = list.filter(function (item) {
        var type = detectIdentityType(item);
        return type !== 'mic' && type !== 'instrument';
      });
      return { mics: mics, instruments: instruments, others: others };
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

    function clientSyncResponsiveMode() {
      if (MODE === 'operator') return;
      var doc = document.documentElement || {};
      var vw = window.innerWidth || doc.clientWidth || 0;
      var vh = window.innerHeight || doc.clientHeight || 0;
      var sw = 0;
      var sh = 0;
      try {
        sw = screen.width || 0;
        sh = screen.height || 0;
      } catch (err) {}
      var smallSide = Math.min(vw || 9999, vh || 9999, sw || 9999, sh || 9999);
      var coarse = false;
      try { coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches); } catch (err2) {}
      var mobile = vw <= 720 || smallSide <= 760 || (coarse && smallSide <= 920);
      var tablet = !mobile && (vw <= 1180 || smallSide <= 1024 || (coarse && smallSide <= 1180));
      var nextVariant = mobile ? 'mobile' : (tablet ? 'tablet' : 'desktop');
      var prevVariant = ROOT.__cecpClientLayoutVariant || '';
      ROOT.classList.toggle('cf-client-mobile', !!mobile);
      ROOT.classList.toggle('cf-client-tablet', !!tablet);
      ROOT.__cecpClientLayoutVariant = nextVariant;

      if (prevVariant && prevVariant !== nextVariant && whoAmI && ROOT.querySelector('#cf-client-broadcast-send')) {
        renderClient();
      }
    }

    function clientBindResponsiveMode() {
      if (MODE === 'operator') return;
      if (!clientResponsiveHandler) {
        clientResponsiveHandler = function () { clientSyncResponsiveMode(); };
        window.addEventListener('resize', clientResponsiveHandler, { passive: true });
        window.addEventListener('orientationchange', clientResponsiveHandler, { passive: true });
        if (window.visualViewport) {
          window.visualViewport.addEventListener('resize', clientResponsiveHandler, { passive: true });
        }
      }
      clientSyncResponsiveMode();
    }

    function renderSetup() {
      ensureChrome();

      var remembered = readRememberedName();
      var rememberedBase = deviceBaseName(remembered);
      var rememberedAlias = identityAliasName(remembered);
      var groups = setupPresetGroups();
      var selected = '';
      var allSetupPresets = groups.mics.concat(groups.instruments).concat(groups.others);

      for (var i = 0; i < allSetupPresets.length; i++) {
        if (deviceBaseName(allSetupPresets[i]) === rememberedBase) {
          selected = allSetupPresets[i];
          break;
        }
      }

      ROOT.classList.remove('cf-mode-operator');
      ROOT.classList.add('cf-mode-client');
      ROOT.classList.remove('cf-client-page-mobile', 'cf-client-page-desktop');
      clientBindResponsiveMode();

      function optionSection(title, sub, items, cls) {
        if (!items.length) return '';
        return [
          '<section class="cf-setup-section ', cls || '', '">',
          '  <div class="cf-setup-section-head">',
          '    <h3>', escapeHtml(title), '</h3>',
          sub ? '    <span>' + escapeHtml(sub) + '</span>' : '',
          '  </div>',
          '  <div class="cf-preset-grid">',
          items.map(function (preset) {
            return renderPresetButton(preset, deviceBaseName(preset) === deviceBaseName(selected), deviceOptionTaken(preset));
          }).join(''),
          '  </div>',
          '</section>'
        ].join('');
      }

      setStageHtml([
        '<div class="cf-setup-shell">',
        '  <div class="cf-setup-card cf-setup-card-vocal">',
        '    <div class="cf-setup-hero">',
        '      <div class="cf-setup-hero-icon">🎤</div>',
        '      <div>',
        '        <div class="cf-setup-kicker">Vocal · 敬拜团队沟通</div>',
        '        <h2>选择你的设备</h2>',
        '        <p class="cf-setup-sub">先选择你现在使用的话筒颜色或乐器，再填写你是谁，方便音控和敬拜团快速识别。</p>',
        '      </div>',
        '    </div>',
        optionSection('话筒颜色', '点击颜色后，在右侧填写你的名字', groups.mics, 'cf-setup-mics'),
        optionSection('乐器', '乐手也可以选择自己的通道', groups.instruments.concat(groups.others), 'cf-setup-instruments'),
        '  </div>',
        '  <aside class="cf-setup-side">',
        '    <div class="cf-setup-identity-card">',
        '      <h3>填写你的身份</h3>',
        '      <label class="cf-setup-field-label">已选择</label>',
        '      <div class="cf-selected show" id="cf-selected"></div>',
        '      <label class="cf-setup-field-label" for="cf-identity-name">你是谁</label>',
        '      <input class="cf-setup-name-input" id="cf-identity-name" type="text" placeholder="请输入现场称呼或名字" maxlength="24" value="', escapeHtml(rememberedAlias), '">',
        '      <p class="cf-setup-help">例如：诗琴、Elim、Grace。进入后显示为「绿话筒 · 诗琴」。</p>',
        '      <button class="cf-btn-primary" id="cf-join-btn" type="button">进入广播</button>',
        '    </div>',
        '  </aside>',
        '</div>'
      ].join(''));

      var nameInput = ROOT.querySelector('#cf-identity-name');

      function composedName() {
        return selected ? formatIdentityName(selected, nameInput && nameInput.value) : '';
      }

      function refreshSelected() {
        var selectedEl = ROOT.querySelector('#cf-selected');
        if (!selectedEl) return;
        if (!selected) {
          selectedEl.innerHTML = '<span class="cf-selected-label">请先选择话筒颜色或乐器</span>';
          selectedEl.classList.add('is-empty');
          return;
        }
        selectedEl.classList.remove('is-empty');
        selectedEl.innerHTML = renderIdentityPill(composedName() || selected, 'cf-selected-pill');
      }

      refreshSelected();

      ROOT.querySelectorAll('.cf-preset-btn').forEach(function (button) {
        button.addEventListener('click', function () {
          if (button.disabled || button.classList.contains('taken')) return;
          ROOT.querySelectorAll('.cf-preset-btn').forEach(function (other) {
            other.classList.remove('sel');
          });
          button.classList.add('sel');
          selected = button.dataset.name || '';
          refreshSelected();
        });
      });

      if (nameInput) {
        nameInput.addEventListener('input', refreshSelected);
        nameInput.addEventListener('keydown', function (event) {
          if (event.key === 'Enter') {
            var btn = ROOT.querySelector('#cf-join-btn');
            if (btn) btn.click();
          }
        });
      }

      ROOT.querySelector('#cf-join-btn').addEventListener('click', function () {
        if (!selected) {
          alert('请先选择话筒颜色或乐器');
          return;
        }
        if (deviceOptionTaken(selected)) {
          alert('「' + deviceBaseName(selected) + '」已有人在使用，请选择其他设备。');
          return;
        }
        var alias = nameInput && nameInput.value ? nameInput.value.trim() : '';
        if (!alias) {
          alert('请填写你是谁，方便团队识别。');
          if (nameInput) nameInput.focus();
          return;
        }
        whoAmI = formatIdentityName(selected, alias);
        rememberName(whoAmI);
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

      ROOT.classList.remove('cf-mode-operator', 'cf-op-mobile');
      ROOT.classList.add('cf-mode-client');
      clientBindResponsiveMode();
      var mobileClientPage = ROOT.classList.contains('cf-client-mobile');
      var tabletClientPage = ROOT.classList.contains('cf-client-tablet');
      ROOT.classList.toggle('cf-client-page-mobile', mobileClientPage);
      ROOT.classList.toggle('cf-client-page-desktop', !mobileClientPage);
      ROOT.__cecpClientLayoutVariant = mobileClientPage
        ? 'mobile'
        : (tabletClientPage ? 'tablet' : 'desktop');

      var composeSection = [
        '<section class="cf-vocal-card cf-broadcast-compose" id="cf-broadcast-compose">',
        '  <div class="cf-vocal-card-head">',
        '    <div><span class="cf-card-icon">⌁</span><h2>广播发送</h2></div>',
        '  </div>',
        '  <div class="cf-field-label">发送对象</div>',
        '  <div class="cf-target-row">',
        '    <button class="cf-target-btn is-active" type="button" data-client-target="team">👥 敬拜团区域</button>',
        '    <button class="cf-target-btn" type="button" data-client-target="operator">🎧 音控聊天</button>',
        '    <span class="cf-target-select">全部成员 ▾</span>',
        '  </div>',
        '  <label class="cf-field-label" for="cf-client-broadcast-input">广播内容</label>',
        '  <textarea id="cf-client-broadcast-input" class="cf-broadcast-textarea" placeholder="请输入广播内容…" maxlength="200"></textarea>',
        '  <div class="cf-compose-foot"><span id="cf-client-count">0/200</span></div>',
        '  <div class="cf-field-label">重要程度</div>',
        '  <div class="cf-level-row">',
        '    <button class="cf-level-btn is-active" type="button" data-level="normal">● 普通</button>',
        '    <button class="cf-level-btn" type="button" data-level="notice">🔔 提醒</button>',
        '    <button class="cf-level-btn" type="button" data-level="urgent">⚠ 紧急</button>',
        '  </div>',
        '  <button class="cf-send-broadcast" id="cf-client-broadcast-send" type="button">➤ 发送广播</button>',
        '</section>'
      ].join('');

      var previewSection = [
        '<section class="cf-vocal-card cf-preview-card">',
        '  <div class="cf-vocal-card-head is-compact"><div><span class="cf-card-icon">◎</span><h3>广播预览</h3></div><em>成员将看到的广播效果</em></div>',
        '  <div class="cf-preview-strip">',
        '    <span class="cf-preview-icon">📢</span>',
        '    <div><strong id="cf-preview-text">请全员安静，预备开始</strong><span id="cf-preview-meta">普通提醒 · 刚刚</span></div>',
        '  </div>',
      '</section>'
      ].join('');

      var recentSection = [
        '<section class="cf-vocal-card cf-client-recent" id="cf-recent-broadcasts">',
        '  <div class="cf-vocal-card-head is-compact"><div><span class="cf-card-icon">◷</span><h3>最近广播</h3></div><button class="cf-clear-btn" id="cf-client-view-all" type="button">查看全部</button></div>',
        '  <div class="cf-client-recent-list" id="cf-client-recent-list" data-limit="4"></div>',
        '</section>'
      ].join('');

      var quickPanelTag = mobileClientPage ? 'section' : 'aside';
      var quickSection = [
        '<', quickPanelTag, ' class="cf-vocal-card cf-quick-panel" id="cf-quick-reminders">',
        '  <div class="cf-vocal-card-head">',
        '    <div><span class="cf-card-icon">ϟ</span><h2>快捷提醒</h2></div>',
        mobileClientPage ? '<em>点击后直接发送给音控聊天</em>' : '',
        '  </div>',
        '  <div class="cf-quick-grid">',
        CUES.map(function (cue) {
          return [
            '<button class="cf-quick-card" type="button" data-kind="', escapeHtml(cue.kind), '" data-msg="', escapeHtml(cue.label), '">',
            '  <span class="cf-quick-icon">', escapeHtml(cue.icon), '</span>',
            '  <span class="cf-quick-copy"><strong>', escapeHtml(cue.label), '</strong><em>', escapeHtml(cue.desc), '</em></span>',
            '  <span class="cf-quick-arrow">›</span>',
            '</button>'
          ].join('');
        }).join(''),
        '  </div>',
        '</', quickPanelTag, '>'
      ].join('');

      var chatSection = ENABLE_MEMBER_CHAT ? [
        '<section class="cf-vocal-card cf-client-chat-card" id="cf-member-chat-room">',
        '  <div class="cf-vocal-card-head">',
        '    <div><span class="cf-card-icon">♧</span><h2>成员群聊</h2></div>',
        '    <em>仅敬拜团内部可见</em>',
        '  </div>',
        '  <div class="cf-log cf-log-member-chat cf-client-chat-log" id="cf-member-chat-log"><div class="cf-log-empty">成员群聊会显示在这里</div></div>',
        '  <div class="cf-custom-area cf-member-chat-compose">',
        '    <input id="cf-member-chat-input" type="text" placeholder="跟团内说点什么…Enter 发送" maxlength="180">',
        '    <button id="cf-member-chat-send" type="button">发送</button>',
        '  </div>',
        '</section>'
      ].join('') : '';

      var mobileTabs = [
        '<nav class="cf-vocal-tabs" aria-label="Vocal navigation">',
        '  <a class="is-active" href="#cf-broadcast-compose"><span>◉</span>广播</a>',
        '  <a href="#cf-quick-reminders"><span>◌</span>快捷信息</a>',
        ENABLE_MEMBER_CHAT ? '  <a href="#cf-member-chat-room"><span>♧</span>群聊</a>' : '',
        '  <a href="#cf-recent-broadcasts"><span>◷</span>历史记录</a>',
        '</nav>'
      ].join('');

      var desktopRail = [
        '<aside class="cf-vocal-rail">',
        '  <nav class="cf-vocal-side-nav" aria-label="Vocal navigation">',
        '    <a class="is-active" href="#cf-broadcast-compose"><span>◉</span>广播</a>',
        '    <a href="#cf-quick-reminders"><span>◌</span>快捷信息</a>',
        ENABLE_MEMBER_CHAT ? '    <a href="#cf-member-chat-room"><span>♧</span>成员群聊</a>' : '',
        '    <a href="#cf-recent-broadcasts"><span>◷</span>历史记录</a>',
        '  </nav>',
        '</aside>'
      ].join('');

      var layoutSection = mobileClientPage
        ? [
            mobileTabs,
            '<div class="cf-vocal-mobile-flow">',
            composeSection,
            previewSection,
            quickSection,
            chatSection,
            recentSection,
            '</div>'
          ].join('')
        : [
            '<div class="cf-vocal-desktop-shell">',
            desktopRail,
            '<div class="cf-vocal-page-grid">',
            '  <main class="cf-vocal-main">',
            composeSection,
            previewSection,
            chatSection,
            recentSection,
            '  </main>',
            quickSection,
            '</div>',
            '</div>'
          ].join('');

      setStageHtml([
        '<div class="cf-app cf-client-app cf-vocal-broadcast-app', mobileClientPage ? ' cf-vocal-mobile-page' : '', '">',
        '  <header class="cf-vocal-top">',
        '    <div class="cf-vocal-brand">',
        '      <span class="cf-vocal-logo">▥</span>',
        '      <div><strong>Vocal</strong><span>敬拜团队沟通</span></div>',
        '    </div>',
        '    <div class="cf-vocal-head-actions">',
        '      <button class="cf-vocal-icon-btn" id="cf-client-search" type="button" aria-label="搜索">⌕</button>',
        '      <button class="cf-vocal-icon-btn" id="cf-reset-device" type="button" aria-label="设置">⚙</button>',
        '    </div>',
        '  </header>',
        layoutSection,
        '  <div class="cf-flash" id="cf-flash">发送成功 ✓</div>',
        '</div>'
      ].join(''));

      var selectedTarget = 'team';
      var selectedLevel = 'normal';
      var showAllRecent = false;
      var input = ROOT.querySelector('#cf-client-broadcast-input');
      var count = ROOT.querySelector('#cf-client-count');
      var previewText = ROOT.querySelector('#cf-preview-text');
      var previewMeta = ROOT.querySelector('#cf-preview-meta');

      function levelText(level) {
        return level === 'urgent' ? '紧急提醒' : (level === 'notice' ? '提醒' : '普通提醒');
      }

      function updatePreview() {
        var text = input && input.value ? input.value.trim() : '';
        if (count) count.textContent = String((input && input.value ? input.value.length : 0)) + '/200';
        if (previewText) previewText.textContent = text || '请全员安静，预备开始';
        if (previewMeta) previewMeta.textContent = levelText(selectedLevel) + ' · 刚刚';
      }

      function sendTeamText(text) {
        if (!wsReady()) {
          flashEl('cf-flash', '当前离线，正在重连…', true);
          return false;
        }
        var id = nowId('member');
        ws.send(JSON.stringify({ type: 'member_chat', id: id, text: text }));
        appendMemberChat({ id: id, from: whoAmI, text: text, ts: Date.now() });
        return true;
      }

      function sendClientBroadcast() {
        var text = input && input.value ? input.value.trim() : '';
        if (!text) {
          flashEl('cf-flash', '请先输入广播内容', true);
          return;
        }
        var ok = false;
        if (selectedTarget === 'team') {
          ok = sendTeamText(text);
        } else {
          sendWorshipMsg(selectedLevel === 'urgent' ? 'issue' : 'broadcast', text);
          ok = true;
        }
        if (!ok) return;
        if (input) input.value = '';
        updatePreview();
      }

      ROOT.querySelectorAll('[data-client-target]').forEach(function (button) {
        button.addEventListener('click', function () {
          selectedTarget = button.getAttribute('data-client-target') || 'operator';
          ROOT.querySelectorAll('[data-client-target]').forEach(function (other) { other.classList.remove('is-active'); });
          button.classList.add('is-active');
        });
      });

      ROOT.querySelectorAll('[data-level]').forEach(function (button) {
        button.addEventListener('click', function () {
          selectedLevel = button.getAttribute('data-level') || 'normal';
          ROOT.querySelectorAll('[data-level]').forEach(function (other) { other.classList.remove('is-active'); });
          button.classList.add('is-active');
          updatePreview();
        });
      });

      ROOT.querySelectorAll('.cf-quick-card').forEach(function (button) {
        button.addEventListener('click', function () {
          sendWorshipMsg(button.dataset.kind, button.dataset.msg);
        });
      });

      if (input) {
        input.addEventListener('input', updatePreview);
        input.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) sendClientBroadcast();
        });
      }

      var sendBtn = ROOT.querySelector('#cf-client-broadcast-send');
      if (sendBtn) sendBtn.addEventListener('click', sendClientBroadcast);
      ROOT.querySelector('#cf-reset-device').addEventListener('click', resetDeviceSelection);
      var searchBtn = ROOT.querySelector('#cf-client-search');
      if (searchBtn) {
        searchBtn.addEventListener('click', function () {
          flashEl('cf-flash', '搜索会跟随浏览器内置查找使用', false);
        });
      }

      var viewAllBtn = ROOT.querySelector('#cf-client-view-all');
      if (viewAllBtn) {
        viewAllBtn.addEventListener('click', function () {
          showAllRecent = !showAllRecent;
          var list = ROOT.querySelector('#cf-client-recent-list');
          if (list) list.setAttribute('data-limit', showAllRecent ? '12' : '4');
          viewAllBtn.textContent = showAllRecent ? '收起' : '查看全部';
          renderClientLog();
        });
      }

      var memberChatSendBtn = ROOT.querySelector('#cf-member-chat-send');
      var memberChatInput = ROOT.querySelector('#cf-member-chat-input');
      if (memberChatSendBtn) {
        memberChatSendBtn.addEventListener('click', sendMemberChat);
      }
      if (memberChatInput) {
        memberChatInput.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMemberChat();
          }
        });
      }

      updatePreview();
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

    function opNowTime() {
      return new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }

    function opSyncResponsiveMode() {
      if (MODE !== 'operator') return;
      var doc = document.documentElement || {};
      var vw = window.innerWidth || doc.clientWidth || 0;
      var sw = 0;
      try { sw = Math.min(screen.width || 0, screen.height || 0) || 0; } catch (err) {}
      var coarse = false;
      try { coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches); } catch (err2) {}
      var mobile = vw <= 760 || sw <= 760 || (coarse && sw > 0 && sw <= 920);
      ROOT.classList.toggle('cf-op-mobile', !!mobile);
    }

    function opBindResponsiveMode() {
      if (operatorResponsiveHandler || MODE !== 'operator') return;
      operatorResponsiveHandler = function () { opSyncResponsiveMode(); };
      window.addEventListener('resize', operatorResponsiveHandler, { passive: true });
      window.addEventListener('orientationchange', operatorResponsiveHandler, { passive: true });
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', operatorResponsiveHandler, { passive: true });
      }
      opSyncResponsiveMode();
    }

    function opStartClock() {
      if (operatorClockTimer || MODE !== 'operator') return;
      operatorClockTimer = setInterval(function () {
        if (MODE === 'operator') updateOperatorStats();
      }, 15000);
    }

    function opIsUrgent(item) {
      var text = String((item && item.text) || '');
      return !!item && (item.kind === 'issue' || /故障|紧急|不正常|没声|没有声音|断|爆音|噪音/.test(text));
    }

    function opBroadcasts() {
      return msgLog.filter(function (item) { return item.kind === 'broadcast'; });
    }

    function opRequests() {
      return msgLog.filter(function (item) {
        return item.kind !== 'broadcast' && item.kind !== 'member_chat';
      });
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

    function readJsonObject(key, fallback) {
      try {
        var parsed = JSON.parse(localStorage.getItem(key) || 'null');
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return fallback;
        return parsed;
      } catch (err) {
        return fallback;
      }
    }

    function writeJsonArray(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value || [])); } catch (err) {}
    }

    function writeJsonObject(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value || {})); } catch (err) {}
    }

    function getOperatorCustomQuick() {
      return readJsonArray(OPERATOR_QUICK_KEY, []).slice(0, 40);
    }

    function saveOperatorCustomQuick(items) {
      writeJsonArray(OPERATOR_QUICK_KEY, items.slice(0, 40));
    }

    function loadOperatorDrafts() {
      operatorDrafts = readJsonArray(OPERATOR_DRAFT_KEY, [])
        .filter(function (item) {
          return item && typeof item === 'object' && String(item.text || '').trim();
        })
        .map(function (item) {
          return {
            id: String(item.id || nowId('draft')),
            text: String(item.text || '').trim(),
            targets: Array.isArray(item.targets) && item.targets.length ? item.targets.slice(0, 8) : ['全体'],
            ts: Number(item.ts || Date.now())
          };
        })
        .slice(0, 12);
    }

    function saveOperatorDrafts() {
      writeJsonArray(OPERATOR_DRAFT_KEY, operatorDrafts.slice(0, 12));
    }

    function loadOperatorMessageMeta() {
      operatorMessageMeta = readJsonObject(OPERATOR_MSG_META_KEY, {});
    }

    function saveOperatorMessageMeta() {
      writeJsonObject(OPERATOR_MSG_META_KEY, operatorMessageMeta);
    }

    function normalizeOperatorView(value) {
      value = String(value || 'broadcast').trim() || 'broadcast';
      return OPERATOR_VIEWS.indexOf(value) >= 0 ? value : 'broadcast';
    }

    function opOperatorName() {
      return String(ROOT.dataset.operatorName || ROOT.dataset.operatorAlias || '音控组');
    }

    function opTargetOptions() {
      return ['全体', '敬拜组', '音控组', '讲员', '后台', '诗班', '同工'];
    }

    function opMessageKey(item) {
      if (!item) return '';
      return String(item.id || [item.kind || 'msg', item.from || '', item.text || '', item.ts || '0'].join('||'));
    }

    function opStateMeta(status) {
      if (status === 'urgent') return { label: '紧急', tone: 'red', follow: '需要优先处理' };
      if (status === 'done') return { label: '已读', tone: 'green', follow: '已处理' };
      return { label: '处理中', tone: 'gold', follow: '正在跟进' };
    }

    function opRelativeTime(ts) {
      var delta = Math.max(0, Date.now() - Number(ts || Date.now()));
      if (delta < 60000) return '刚刚';
      if (delta < 3600000) return Math.max(1, Math.round(delta / 60000)) + ' 分钟前';
      if (delta < 86400000) return Math.max(1, Math.round(delta / 3600000)) + ' 小时前';
      return formatTime(ts);
    }

    function opMessageState(item) {
      var key = opMessageKey(item);
      var meta = operatorMessageMeta[key] || {};
      var age = Math.max(0, Date.now() - Number((item && item.ts) || Date.now()));
      var status = meta.status || (opIsUrgent(item) ? 'urgent' : (age < 12 * 60000 ? 'processing' : 'done'));
      var state = opStateMeta(status);
      return {
        key: key,
        status: status,
        label: state.label,
        tone: state.tone,
        follow: state.follow
      };
    }

    function opSetMessageState(item, status, note) {
      if (!item) return;
      var key = opMessageKey(item);
      if (!key) return;
      var prev = operatorMessageMeta[key] || {};
      var actions = Array.isArray(prev.actions) ? prev.actions.slice(0, 6) : [];
      actions.unshift({
        status: String(status || 'processing'),
        note: String(note || ''),
        ts: Date.now()
      });
      operatorMessageMeta[key] = {
        status: String(status || 'processing'),
        actions: actions.slice(0, 6)
      };
      saveOperatorMessageMeta();
    }

    function opMessageTimeline(item) {
      if (!item) return [];
      var meta = operatorMessageMeta[opMessageKey(item)] || {};
      var actions = Array.isArray(meta.actions) ? meta.actions.slice(0, 4) : [];
      var timeline = actions.map(function (action) {
        var state = opStateMeta(action.status);
        return {
          tone: state.tone,
          title: action.note || state.follow,
          subtitle: opOperatorName() + ' · ' + formatTime(action.ts)
        };
      });
      if (!timeline.length) {
        var current = opMessageState(item);
        timeline.push({
          tone: current.tone,
          title: current.follow,
          subtitle: opOperatorName() + ' · ' + formatTime(item.ts)
        });
      }
      timeline.push({
        tone: 'blue',
        title: '已收到消息',
        subtitle: (identityAliasName(item.from) || stripIdentityPrefix(item.from) || item.from || '成员') + ' · ' + formatTime(item.ts)
      });
      if (item.kind === 'issue') {
        timeline.push({
          tone: 'red',
          title: '标记为高优先级',
          subtitle: '系统识别到故障 / 紧急关键词'
        });
      }
      return timeline.slice(0, 4);
    }

    function opMemberAlias(name) {
      return identityAliasName(name) || stripIdentityPrefix(name) || name || '成员';
    }

    function opMemberRole(name) {
      var title = stripIdentityPrefix(name);
      if (/蓝/.test(title)) return '讲员';
      if (/红/.test(title)) return '领唱';
      if (/金|黄/.test(title)) return '和声';
      if (/绿/.test(title)) return '和声';
      if (/钢琴/.test(title)) return '司琴';
      if (/鼓/.test(title)) return '鼓手';
      if (/电吉他/.test(title)) return '吉他手';
      if (/贝斯/.test(title)) return '贝斯手';
      if (/木吉他|吉他/.test(title)) return '节奏';
      return '成员';
    }

    function opMessageDeviceLabel(item) {
      var title = stripIdentityPrefix((item && item.from) || '');
      if (!title) return '未知设备';
      if (/话筒/.test(title)) {
        var hash = opMessageKey(item).split('').reduce(function (sum, ch) {
          return sum + ch.charCodeAt(0);
        }, 0);
        return title + ' - CH ' + ((Math.abs(hash) % 6) + 1);
      }
      return title;
    }

    function opVisibleInboxMessages() {
      var items = opRequests().slice();
      if (operatorInboxFilter === 'unread') {
        items = items.filter(function (item) { return opMessageState(item).status !== 'done'; });
      } else if (operatorInboxFilter === 'processing') {
        items = items.filter(function (item) { return opMessageState(item).status === 'processing'; });
      } else if (operatorInboxFilter === 'done') {
        items = items.filter(function (item) { return opMessageState(item).status === 'done'; });
      } else if (operatorInboxFilter === 'urgent') {
        items = items.filter(opIsUrgent);
      }
      items.sort(function (a, b) {
        if (operatorInboxSort === 'priority') {
          return (opIsUrgent(b) ? 1 : 0) - (opIsUrgent(a) ? 1 : 0) || Number((b && b.ts) || 0) - Number((a && a.ts) || 0);
        }
        if (operatorInboxSort === 'oldest') return Number((a && a.ts) || 0) - Number((b && b.ts) || 0);
        return Number((b && b.ts) || 0) - Number((a && a.ts) || 0);
      });
      return items;
    }

    function opGetSelectedInboxItem() {
      var visible = opVisibleInboxMessages();
      if (!visible.length) return null;
      var selected = msgLog[operatorSelectedMsgIndex] || null;
      if (selected && visible.indexOf(selected) >= 0) return selected;
      operatorSelectedMsgIndex = msgLog.indexOf(visible[0]);
      return visible[0];
    }

    function opNavItems() {
      return [
        { id: 'inbox', icon: '✉', label: '收到的信息', count: opRequests().length || '' },
        { id: 'broadcast', icon: '⌁', label: '广播中心' },
        { id: 'quick', icon: 'ϟ', label: '快捷信息' },
        { id: 'devices', icon: '▣', label: '在线设备', count: operatorMembers.length || '' },
        { id: 'chat', icon: '♧', label: '成员群聊', count: memberChat.length || '' }
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
      var inboxItems = opRequests();
      var issueCount = inboxItems.filter(opIsUrgent).length;
      var bcastCount = opBroadcasts().length;
      var doneCount = inboxItems.filter(function (item) { return opMessageState(item).status === 'done'; }).length;
      var processingCount = inboxItems.filter(function (item) { return opMessageState(item).status === 'processing'; }).length;
      var targetedCount = opBroadcasts().filter(function (item) {
        return Array.isArray(item.targets) && item.targets.length && !(item.targets.length === 1 && item.targets[0] === '全体');
      }).length;
      if (kind === 'inbox') {
        return [
          opStatCard('●', '未读消息', inboxItems.length + ' 条', '需要查看', 'blue', 'cf-stat-messages'),
          opStatCard('◷', '处理中', processingCount + ' 条', '正在跟进', 'gold', 'cf-stat-issues'),
          opStatCard('✓', '已读', doneCount + ' 条', '已处理', 'green'),
          opStatCard('!', '紧急消息', issueCount + ' 条', '需要优先处理', 'red')
        ].join('');
      }
      if (kind === 'broadcast') {
        return [
          opStatCard('⌁', '今日广播', bcastCount + ' 条', '较昨日 ' + (bcastCount ? '+1' : '±0'), 'gold', 'cf-stat-broadcasts'),
          opStatCard('✎', '草稿', operatorDrafts.length + ' 条', operatorDrafts.length ? '待完善' : '当前为空', 'green'),
          opStatCard('➤', '已发送', bcastCount + ' 条', '广播历史', 'blue'),
          opStatCard('◎', '定向广播', targetedCount + ' 条', targetedCount ? '按团队发送' : '今日未使用', 'purple')
        ].join('');
      }
      if (kind === 'quick') {
        return [
          opStatCard('☰', '常用快捷信息', (BCAST_PRESETS.length + CUES.length) + ' 条', '快速发送常用信息', 'gold'),
          opStatCard('☆', '已收藏', Math.min(8, BCAST_PRESETS.length + 2) + ' 条', '个人收藏常用信息', 'gold'),
          opStatCard('▦', '本场景预设', BCAST_PRESETS.length + ' 条', '当前聚会场景预设', 'green'),
          opStatCard('➤', '最近发送', Math.min(12, bcastCount) + ' 条', '近 7 天发送记录', 'blue')
        ].join('');
      }
      if (kind === 'devices') {
        return [
          opStatCard('◔', '已选成员', operatorMembers.length + ' 人', '已连接成员', 'gold', 'cf-stat-members'),
          opStatCard('🎤', '已选话筒', opMicMembers().length + ' 支', '全员在线', 'green', 'cf-stat-mics'),
          opStatCard('🎸', '已选乐器', opInstrumentMembers().length + ' 项', '本场设备分配', 'blue', 'cf-stat-instruments'),
          opStatCard('◴', '当前场次', opServiceTitle(), '主日敬拜', 'gold')
        ].join('');
      }
      if (kind === 'chat') {
        return [
          opStatCard('♧', '在线成员', operatorMembers.length + ' / ' + PRESETS.filter(function (item) { return !isHiddenClientDevice(item); }).length, '当前在线', 'green', 'cf-stat-members'),
          opStatCard('●', '今日消息', memberChat.length + ' 条', '群消息', 'blue', 'cf-stat-chat'),
          opStatCard('⚑', '置顶话题', Math.min(3, Math.max(1, opBroadcasts().length)) + ' 个', '公告主题', 'gold'),
          opStatCard('⌁', '未读对话', Math.max(0, memberChat.length - 3) + ' 个', '待查看', 'purple')
        ].join('');
      }
      return '';
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
        if (filter === 'requests') return item.kind !== 'broadcast' && item.kind !== 'member_chat';
        if (filter === 'broadcast') return item.kind === 'broadcast';
        if (filter === 'urgent') return opIsUrgent(item);
        return true;
      });
      if (typeof limit === 'number' && limit > 0) items = items.slice(0, limit);
      if (!items.length) return '<div class="cf-op-empty">暂时还没有收到消息</div>';
      return items.map(function (item) {
        var idx = msgLog.indexOf(item);
        var state = opMessageState(item);
        return [
          '<button class="cf-op-msg-row', operatorSelectedMsgIndex === idx ? ' is-active' : '', opIsUrgent(item) ? ' is-urgent' : '', '" type="button" data-msg-index="', idx, '">',
          '  <span class="cf-op-msg-icon">', escapeHtml(KIND_ICONS[item.kind] || detectIdentityIcon(item.from) || '💬'), '</span>',
          '  <span class="cf-op-msg-main"><strong>', escapeHtml(opMemberAlias(item.from)), '</strong><em>', escapeHtml(item.text), '</em></span>',
          compact ? '' : '<span class="cf-op-msg-time">' + escapeHtml(formatTime(item.ts)) + '</span>',
          '  <span class="cf-op-msg-chip cf-op-chip-', escapeHtml(state.tone), '">', escapeHtml(state.label), '</span>',
          compact ? '' : '<span class="cf-op-msg-dot' + (state.status === 'done' ? ' is-hidden' : '') + '"></span>',
          '</button>'
        ].join('');
      }).join('');
    }

    function opBuildMessageDetail() {
      var item = opGetSelectedInboxItem();
      if (!item) return '<div class="cf-op-empty">选择一条信息后，这里会显示详情</div>';
      var state = opMessageState(item);
      return [
        '<div class="cf-op-detail-box">',
        '  <div class="cf-op-detail-top">',
        '    <div class="cf-op-detail-person">',
        renderIdentityPill(item.from || '成员', 'cf-op-detail-from'),
        '      <div class="cf-op-detail-person-copy"><strong>', escapeHtml(opMemberAlias(item.from)), '</strong><span>发送于：', escapeHtml(opRelativeTime(item.ts)), '（', escapeHtml(formatTime(item.ts)), '）</span></div>',
        '    </div>',
        '    <span class="cf-op-detail-status cf-op-detail-status-', escapeHtml(state.tone), '">', escapeHtml(state.label), '</span>',
        '  </div>',
        '  <dl class="cf-op-detail-list">',
        '    <dt>请求内容</dt><dd class="cf-op-detail-message">', escapeHtml(item.text), '</dd>',
        '    <dt>来自设备</dt><dd>', escapeHtml(opMessageDeviceLabel(item)), '</dd>',
        '    <dt>优先级</dt><dd>', opIsUrgent(item) ? '<span class="cf-op-inline-tone is-red">● 紧急</span>' : '<span class="cf-op-inline-tone is-gold">● 普通</span>', '</dd>',
        '  </dl>',
        '  <div class="cf-op-detail-section-title">快捷回复</div>',
        '  <div class="cf-op-reply-grid">',
        '    <button type="button" data-op-reply-status="done" data-op-reply-note="已收到消息">✓ 已收到</button>',
        '    <button type="button" data-op-reply-status="processing" data-op-reply-note="正在处理">◷ 正在处理</button>',
        '    <button type="button" data-op-reply-status="processing" data-op-reply-note="马上安排">➤ 马上安排</button>',
        '    <button type="button" data-op-reply-status="urgent" data-op-reply-note="稍等一下，优先处理">⌛ 稍等一下</button>',
        '  </div>',
        '</div>'
      ].join('');
    }

    function opBuildFollowUpTimeline() {
      var item = opGetSelectedInboxItem();
      if (!item) return '<div class="cf-op-empty">跟进记录会显示在这里</div>';
      return '<div class="cf-op-follow-list">' + opMessageTimeline(item).map(function (entry) {
        return [
          '<div class="cf-op-follow-item">',
          '  <span class="cf-op-follow-dot is-', escapeHtml(entry.tone), '"></span>',
          '  <div><strong>', escapeHtml(entry.title), '</strong><span>', escapeHtml(entry.subtitle), '</span></div>',
          '</div>'
        ].join('');
      }).join('') + '</div>';
    }

    function opBuildMemberRows(limit, showKick) {
      var members = operatorMembers.slice(0, limit || operatorMembers.length);
      if (!members.length) return '<div class="cf-op-empty">当前没有设备在线</div>';
      return members.map(function (member) {
        return [
          '<div class="cf-op-device-row">',
          renderIdentityPill(member.name, 'cf-member-pill'),
          showKick === false ? '<span class="cf-op-inline-tone is-green">在线</span>' : '<button class="cf-kick-btn" type="button" data-kick-name="' + escapeHtml(member.name) + '" title="踢出该成员">踢出</button>',
          '</div>'
        ].join('');
      }).join('');
    }

    function opBuildDeviceTable() {
      if (!operatorMembers.length) return '<div class="cf-op-empty">还没有成员选择话筒或乐器，所以设备列表为空。</div>';
      return [
        '<div class="cf-op-table cf-op-device-table">',
        '  <div class="cf-op-table-head"><span>设备</span><span>类型</span><span>当前成员</span><span>服事角色</span></div>',
        operatorMembers.map(function (member) {
          var meta = getIdentityMeta(member.name);
          return [
            '<div class="cf-op-table-row">',
            '  <span>', renderIdentityPill(member.name, 'cf-member-pill'), '</span>',
            '  <span><b class="cf-op-tag">', meta.type === 'mic' ? '话筒' : (meta.type === 'instrument' ? '乐器' : '设备'), '</b></span>',
            '  <span>', escapeHtml(opMemberAlias(member.name)), '</span>',
            '  <span>', escapeHtml(opMemberRole(member.name)), '</span>',
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
        return [
          '<div class="cf-op-mini-line">',
          '  <span class="cf-op-mini-device">', escapeHtml(stripIdentityPrefix(m.name)), '</span>',
          '  <span class="cf-op-mini-member">', escapeHtml(opMemberAlias(m.name)), '</span>',
          '</div>'
        ].join('');
      }).join('');
    }

    function opBuildBroadcastHistoryTable() {
      var items = opBroadcasts().slice(0, 8);
      if (!items.length) return '<div class="cf-op-empty">还没有广播记录</div>';
      return [
        '<div class="cf-op-table cf-op-history-table">',
        '  <div class="cf-op-table-head"><span>内容</span><span>发送者</span><span>接收对象</span><span>发送时间</span><span>状态</span></div>',
        items.map(function (item) {
          var targets = Array.isArray(item.targets) && item.targets.length ? item.targets : ['全体'];
          return [
            '<div class="cf-op-table-row">',
            '  <span class="cf-op-history-content"><i>⌁</i><strong>', escapeHtml(item.text), '</strong></span>',
            '  <span>', escapeHtml(stripIdentityPrefix(item.from) || opOperatorName()), '</span>',
            '  <span class="cf-op-history-targets">', targets.map(function (target) { return '<b>' + escapeHtml(target) + '</b>'; }).join(''), '</span>',
            '  <span>', escapeHtml(formatTime(item.ts)), '</span>',
            '  <span><b class="cf-op-tag cf-op-tag-green">已送达</b></span>',
            '</div>'
          ].join('');
        }).join(''),
        '</div>'
      ].join('');
    }

    function opBuildRuleList() {
      return '<div class="cf-op-rule-list">'
        + '<p><strong>广播即刻送达</strong><span>广播信息即时推送到所有选定成员设备。</span></p>'
        + '<p><strong>定向精准触达</strong><span>按团队、角色或自定义分组发送，避免信息干扰。</span></p>'
        + '<p><strong>简洁明了</strong><span>建议内容简短清晰，便于快速理解和执行。</span></p>'
        + '<p><strong>文明沟通</strong><span>请使用得体语言，尊重每一位团队成员。</span></p>'
        + '<p><strong>记录可追溯</strong><span>所有广播记录自动保存，便于查询与回溯。</span></p>'
        + '</div>';
    }

    function opBuildQuickLibrary() {
      var quickRows = [
        { icon: '♪', title: '排练', items: BCAST_PRESETS.concat(['请预备', '下一首', '请稍等', '请安静']).slice(0, 5) },
        { icon: '♥', title: '敬拜', items: ['下一首', '请安静', '耳返正常吗', '请开讲员麦', '请注意节奏'] },
        { icon: '🎤', title: '讲道', items: ['请开讲员麦', '请安静', '可以开始', '请稍等', '谢谢牧师'] },
        { icon: '▣', title: '现场秩序', items: ['请保持安静', '注意安全', '请勿走动', '请看屏幕', '请遵守秩序'] },
        { icon: '⚑', title: '结束提醒', items: ['结束后集合', '清理场地', '请关设备', '感谢配合'] }
      ];
      return '<div class="cf-op-quick-library">' + quickRows.map(function (row) {
        return '<div class="cf-op-quick-row"><div><span>' + escapeHtml(row.icon) + '</span><strong>' + escapeHtml(row.title) + '</strong><em>' + row.items.length + ' 条</em></div><div>' + row.items.map(function (text) {
          return '<button type="button" data-op-send-text="' + escapeHtml(text) + '">' + escapeHtml(text) + ' ➤</button>';
        }).join('') + '</div></div>';
      }).join('') + '</div>';
    }

    function opBuildFavoriteQuickList() {
      return '<div class="cf-op-fav-list">' + BCAST_PRESETS.concat(['请保持安静', '谢谢配合', '结束后集合']).slice(0, 8).map(function (text) {
        return '<button type="button" data-op-send-text="' + escapeHtml(text) + '">☆ ' + escapeHtml(text) + ' ➤</button>';
      }).join('') + '</div>';
    }

    function opBuildCustomQuickTable() {
      var custom = getOperatorCustomQuick();
      if (!custom.length) custom = ['请稍等设备切换', '讲员预备上台', '请诗班就位', '感谢大家配合'];
      return '<div class="cf-op-custom-table">'
        + '<div class="cf-custom-area"><input id="cf-op-custom-quick-input" type="text" placeholder="新建快捷信息..." maxlength="80"><button id="cf-op-add-quick" type="button">新增快捷信息</button></div>'
        + '<div class="cf-op-custom-table-head"><span>快捷信息内容</span><span>分类</span><span>操作</span></div>'
        + custom.slice(0, 8).map(function (text, index) {
          var tag = index % 3 === 0 ? '现场秩序' : (index % 3 === 1 ? '排练' : '讲道');
          return '<div class="cf-op-custom-table-row"><span><strong>' + escapeHtml(text) + '</strong></span><span><b class="cf-op-tag">' + escapeHtml(tag) + '</b></span><span class="cf-op-custom-actions"><button type="button" data-op-send-text="' + escapeHtml(text) + '">发送</button><button type="button" data-op-duplicate-quick="' + escapeHtml(text) + '">复制</button></span></div>';
        }).join('')
        + '</div>';
    }

    function opBuildRecentUsageList() {
      var items = opBroadcasts().concat(opRequests()).slice(0, 6);
      if (!items.length) return '<div class="cf-op-empty">还没有最近使用记录</div>';
      return '<div class="cf-op-recent-list">' + items.map(function (item) {
        return '<button type="button" data-op-send-text="' + escapeHtml(item.text) + '"><span>' + escapeHtml(item.text) + '</span><em>' + escapeHtml(opRelativeTime(item.ts)) + '</em></button>';
      }).join('') + '</div>';
    }

    function opBuildConversationList() {
      var rooms = [
        { name: '全体', desc: '团队同步', time: memberChat.length ? formatTime(memberChat[memberChat.length - 1].ts) : '09:28', count: 0 },
        { name: '敬拜组', desc: '排练沟通', time: '09:25', count: 2 },
        { name: '音控组', desc: '设备确认', time: '09:20', count: 1 },
        { name: '后台协助', desc: '流程提醒', time: '09:10', count: 1 }
      ];
      return '<div class="cf-op-room-list">' + rooms.map(function (room, index) {
        return '<button' + (index === 0 ? ' class="is-active"' : '') + ' type="button"><strong>' + escapeHtml(room.name) + '</strong><span>' + escapeHtml(room.desc) + '</span><em>' + escapeHtml(room.time) + '</em>' + (room.count ? '<b>' + room.count + '</b>' : '') + '</button>';
      }).join('') + '</div>';
    }

    function opBuildPinnedAnnouncements() {
      var announcements = opBroadcasts().slice(0, 3).map(function (item) {
        return {
          title: item.text,
          subtitle: opOperatorName() + ' · ' + formatTime(item.ts)
        };
      });
      if (!announcements.length) {
        announcements = [
          { title: '主日聚会流程安排', subtitle: '置顶消息 · 09:12' },
          { title: '音控组注意事项', subtitle: '音控组 · 09:10' },
          { title: '下次服事轮值表', subtitle: '团队公告 · 09:08' }
        ];
      }
      return '<div class="cf-op-pin-list">' + announcements.map(function (item) {
        return '<p><strong>' + escapeHtml(item.title) + '</strong><span>' + escapeHtml(item.subtitle) + '</span></p>';
      }).join('') + '</div>';
    }

    function opRenderOverview() {
      operatorView = 'broadcast';
      return opRenderBroadcast();
    }

    function opRenderInbox() {
      var items = opRequests();
      return opShell('收到的信息', 'Message Inbox', 'inbox', [
        '<section class="cf-op-stats">', opTopStats('inbox'), '</section>',
        '<section class="cf-op-grid cf-op-grid-inbox">',
        opCard('消息列表', '✉',
          '<div class="cf-op-list-toolbar"><div class="cf-op-tabs">'
          + '<button type="button" class="' + (operatorInboxFilter === 'all' ? 'is-active' : '') + '" data-op-tab="all">全部 <b>' + items.length + '</b></button>'
          + '<button type="button" class="' + (operatorInboxFilter === 'unread' ? 'is-active' : '') + '" data-op-tab="unread">未读 <b>' + items.filter(function (item) { return opMessageState(item).status !== 'done'; }).length + '</b></button>'
          + '<button type="button" class="' + (operatorInboxFilter === 'processing' ? 'is-active' : '') + '" data-op-tab="processing">处理中 <b>' + items.filter(function (item) { return opMessageState(item).status === 'processing'; }).length + '</b></button>'
          + '<button type="button" class="' + (operatorInboxFilter === 'done' ? 'is-active' : '') + '" data-op-tab="done">已读 <b>' + items.filter(function (item) { return opMessageState(item).status === 'done'; }).length + '</b></button>'
          + '</div><div class="cf-op-inline-actions">'
          + '<button class="cf-op-ghost-btn" type="button" data-op-cycle-filter="1">筛选</button>'
          + '<button class="cf-op-ghost-btn" type="button" data-op-cycle-sort="1">' + escapeHtml(operatorInboxSort === 'priority' ? '优先级' : (operatorInboxSort === 'oldest' ? '最早优先' : '最新优先')) + '</button>'
          + '</div></div>'
          + '<div class="cf-op-list cf-op-list-large" id="cf-op-inbox-list">' + opBuildMessageList(0, 'requests', false) + '</div>'
          + '<div class="cf-op-list-foot"><span>共 ' + items.length + ' 条消息</span><button class="cf-op-link" id="cf-clear-btn" type="button">清空消息记录 ›</button></div>',
          'cf-op-span-7'),
        opCard('消息详情', '▣', '<div id="cf-op-message-detail">' + opBuildMessageDetail() + '</div>', 'cf-op-span-5'),
        opCard('最近跟进', '◷', '<div id="cf-op-follow-up">' + opBuildFollowUpTimeline() + '</div>', 'cf-op-span-5'),
        '</section>'
      ].join(''));
    }

    function opRenderBroadcast() {
      var templates = BCAST_PRESETS.concat(['请预备', '下一首', '请安静', '五分钟后开始', '结束后集合', '请回到位置']).slice(0, 8);
      return opShell('广播中心', 'Broadcast Center', 'broadcast', [
        '<section class="cf-op-stats">', opTopStats('broadcast'), '</section>',
        '<section class="cf-op-grid cf-op-grid-broadcast">',
        opCard('发送广播', '⌁',
          '<textarea id="cf-bcast-input" class="cf-op-textarea cf-op-textarea-lg" placeholder="输入广播内容..." maxlength="200"></textarea>'
          + '<div class="cf-op-text-count"><span id="cf-op-bcast-count">0/200</span></div>'
          + '<div class="cf-op-section-label">选择接收对象</div>'
          + '<div class="cf-op-target-list">' + opTargetOptions().map(function (target) {
            return '<button type="button" class="cf-op-target-chip' + (operatorTargetSelection.indexOf(target) >= 0 ? ' is-active' : '') + '" data-op-target="' + escapeHtml(target) + '">' + escapeHtml(target) + '</button>';
          }).join('') + '</div>'
          + '<div class="cf-op-actions"><button class="cf-op-primary" id="cf-bcast-send" type="button">➤ 发送广播</button><button class="cf-op-secondary" type="button" id="cf-bcast-save">保存草稿</button><button class="cf-op-secondary" type="button" id="cf-bcast-clear">清空</button></div>',
          'cf-op-span-7'),
        opCard('广播模板', '☰',
          '<div class="cf-op-template-grid">' + templates.map(function (text) {
            return '<button type="button" data-op-fill-text="' + escapeHtml(text) + '">' + escapeHtml(text) + '</button>';
          }).join('') + '</div>'
          + (operatorDrafts.length ? '<div class="cf-op-draft-list">' + operatorDrafts.slice(0, 3).map(function (draft) {
            return '<button type="button" class="cf-op-draft-chip" data-op-load-draft="' + escapeHtml(draft.id) + '"><strong>' + escapeHtml(draft.text) + '</strong><span>' + escapeHtml(draft.targets.join(' / ')) + '</span></button>';
          }).join('') + '</div>' : ''),
          'cf-op-span-5',
          '<button class="cf-op-link cf-op-link-inline" type="button">查看全部 ›</button>'),
        opCard('最近广播记录', '☷', '<div id="cf-op-broadcast-history">' + opBuildBroadcastHistoryTable() + '</div>', 'cf-op-span-7'),
        opCard('广播规则', '♢', opBuildRuleList(), 'cf-op-span-5', '<button class="cf-op-link cf-op-link-inline" type="button">了解更多 ›</button>'),
        '</section>'
      ].join(''));
    }

    function opRenderQuick() {
      return opShell('快捷信息', 'Quick Messages', 'quick', [
        '<section class="cf-op-stats">', opTopStats('quick'), '</section>',
        '<section class="cf-op-grid cf-op-grid-quick">',
        opCard('快捷信息库', '☰', opBuildQuickLibrary(), 'cf-op-span-8'),
        opCard('收藏夹', '☆', opBuildFavoriteQuickList(), 'cf-op-span-4', '<button class="cf-op-link cf-op-link-inline" type="button">管理</button>'),
        opCard('自定义快捷信息', '✎', opBuildCustomQuickTable(), 'cf-op-span-8'),
        opCard('最近使用', '◷', opBuildRecentUsageList(), 'cf-op-span-4', '<button class="cf-op-link cf-op-link-inline" type="button">清空</button>'),
        '</section>'
      ].join(''));
    }

    function opRenderDevices() {
      return opShell('在线设备', 'Selected Devices', 'devices', [
        '<section class="cf-op-stats">', opTopStats('devices'), '</section>',
        '<section class="cf-op-grid cf-op-grid-devices">',
        opCard('设备列表', '▣', '<div data-cf-member-table>' + opBuildDeviceTable() + '</div>', 'cf-op-span-8'),
        opCard('话筒颜色', '🎤', '<div class="cf-op-split-list" data-cf-mic-list>' + opBuildSplitDevices('mic') + '</div>', 'cf-op-span-4'),
        opCard('乐器分配', '🎸', '<div class="cf-op-split-list" data-cf-instrument-list>' + opBuildSplitDevices('instrument') + '</div>', 'cf-op-span-4'),
        opCard('成员选择概览', '♧', '<div class="cf-op-member-chips">' + operatorMembers.map(function(m){return renderIdentityPill(m.name, 'cf-member-pill');}).join('') + '</div>', 'cf-op-span-8'),
        opCard('显示规则', 'ⓘ', '<div class="cf-op-rule-list"><p><strong>只有已被选择的设备才会显示</strong><span>未被选择的话筒或乐器不会出现在当前列表中。</span></p><p><strong>在线状态会直接展示为本身体积</strong><span>方便现场快速确认哪些成员已经准备就绪。</span></p><p><strong>角色信息自动跟随设备显示</strong><span>便于音控与后台同步核对服事分工。</span></p></div>', 'cf-op-span-4'),
        '</section>'
      ].join(''));
    }

    function opRenderChat() {
      return opShell('成员群聊', 'Team Chat', 'chat', [
        '<section class="cf-op-stats">', opTopStats('chat'), '</section>',
        '<section class="cf-op-grid cf-op-grid-chat">',
        opCard('对话列表', '♧', opBuildConversationList(), 'cf-op-span-3'),
        opCard('全体', '♧', '<div class="cf-log cf-log-member-chat cf-op-chat-log" id="cf-member-chat-log"><div class="cf-log-empty">成员群聊会显示在这里</div></div><div class="cf-custom-area cf-member-chat-compose"><input id="cf-member-chat-input" type="text" placeholder="输入消息，Enter 发送..." maxlength="180"><button id="cf-member-chat-send" type="button">发送</button></div>', 'cf-op-span-6'),
        opCard('成员列表', '☰', '<div data-cf-member-list data-kick="0">' + opBuildMemberRows(24, false) + '</div>', 'cf-op-span-3'),
        opCard('置顶公告', '⚑', opBuildPinnedAnnouncements(), 'cf-op-span-3', '<button class="cf-op-link cf-op-link-inline" type="button">查看全部公告 ›</button>'),
        '</section>'
      ].join(''));
    }

    function opRenderCurrent() {
      operatorView = normalizeOperatorView(operatorView);
      if (operatorView === 'inbox') return opRenderInbox();
      if (operatorView === 'quick') return opRenderQuick();
      if (operatorView === 'devices') return opRenderDevices();
      if (operatorView === 'chat') return opRenderChat();
      operatorView = 'broadcast';
      return opRenderBroadcast();
    }

    function operatorSendBroadcastText(text, options) {
      text = String(text || '').trim();
      if (!text) return;
      options = options || {};
      var id = nowId('broadcast');
      var targets = Array.isArray(options.targets) && options.targets.length ? options.targets.slice(0, 8) : operatorTargetSelection.slice(0, 8);
      if (!wsReady()) {
        flashEl('cf-flash', '当前离线，无法广播', true);
        return;
      }
      ws.send(JSON.stringify({ type: 'broadcast', id: id, text: text, targets: targets }));
      msgLog.unshift({ id: id, from: opOperatorName(), kind: 'broadcast', text: text, targets: targets, ts: Date.now() });
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
      appendMemberChat({ id: id, from: opOperatorName(), text: text, ts: Date.now() });
      if (input) input.value = '';
      flashEl('cf-flash', '成员群聊已发送 ✓');
    }

    function bindOperatorDashboard() {
      ROOT.querySelectorAll('[data-op-view]').forEach(function (button) {
        button.addEventListener('click', function () {
          var view = normalizeOperatorView(button.getAttribute('data-op-view') || 'broadcast');
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
          var count = ROOT.querySelector('#cf-op-bcast-count');
          if (count && input) count.textContent = String(input.value.length) + '/200';
        });
      });

      ROOT.querySelectorAll('[data-op-target]').forEach(function (button) {
        button.addEventListener('click', function () {
          var target = button.getAttribute('data-op-target') || '';
          if (!target) return;
          var next = operatorTargetSelection.slice();
          var idx = next.indexOf(target);
          if (idx >= 0 && next.length > 1) next.splice(idx, 1);
          else if (idx < 0) next.push(target);
          operatorTargetSelection = next.length ? next : ['全体'];
          renderOperator();
        });
      });

      ROOT.querySelectorAll('[data-op-load-draft]').forEach(function (button) {
        button.addEventListener('click', function () {
          var draftId = button.getAttribute('data-op-load-draft') || '';
          var draft = operatorDrafts.filter(function (item) { return item.id === draftId; })[0];
          var input = ROOT.querySelector('#cf-bcast-input');
          var count = ROOT.querySelector('#cf-op-bcast-count');
          if (!draft || !input) return;
          input.value = draft.text;
          operatorTargetSelection = Array.isArray(draft.targets) && draft.targets.length ? draft.targets.slice(0, 8) : ['全体'];
          if (count) count.textContent = String(input.value.length) + '/200';
          renderOperator();
        });
      });

      var sendBtn = ROOT.querySelector('#cf-bcast-send');
      var input = ROOT.querySelector('#cf-bcast-input');
      if (sendBtn) sendBtn.addEventListener('click', sendBroadcast);
      if (input) {
        var count = ROOT.querySelector('#cf-op-bcast-count');
        if (count) count.textContent = String(input.value.length) + '/200';
        input.addEventListener('input', function () {
          if (count) count.textContent = String(input.value.length) + '/200';
        });
        input.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) sendBroadcast();
        });
      }
      var clearInput = ROOT.querySelector('#cf-bcast-clear');
      if (clearInput) clearInput.addEventListener('click', function () {
        var i = ROOT.querySelector('#cf-bcast-input');
        if (i) i.value = '';
        var count = ROOT.querySelector('#cf-op-bcast-count');
        if (count) count.textContent = '0/200';
      });

      var saveDraftBtn = ROOT.querySelector('#cf-bcast-save');
      if (saveDraftBtn) saveDraftBtn.addEventListener('click', function () {
        var i = ROOT.querySelector('#cf-bcast-input');
        var text = i && i.value ? i.value.trim() : '';
        if (!text) {
          flashEl('cf-flash', '请输入广播内容后再保存草稿', true);
          return;
        }
        operatorDrafts.unshift({
          id: nowId('draft'),
          text: text,
          targets: operatorTargetSelection.slice(0, 8),
          ts: Date.now()
        });
        operatorDrafts = operatorDrafts.slice(0, 12);
        saveOperatorDrafts();
        flashEl('cf-flash', '草稿已保存 ✓');
        renderOperator();
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

      ROOT.querySelectorAll('[data-op-tab]').forEach(function (button) {
        button.addEventListener('click', function () {
          operatorInboxFilter = button.getAttribute('data-op-tab') || 'all';
          renderOperator();
        });
      });

      ROOT.querySelectorAll('[data-op-cycle-filter]').forEach(function (button) {
        button.addEventListener('click', function () {
          operatorInboxFilter = operatorInboxFilter === 'urgent' ? 'all' : 'urgent';
          renderOperator();
        });
      });

      ROOT.querySelectorAll('[data-op-cycle-sort]').forEach(function (button) {
        button.addEventListener('click', function () {
          operatorInboxSort = operatorInboxSort === 'priority' ? 'oldest' : (operatorInboxSort === 'oldest' ? 'latest' : 'priority');
          renderOperator();
        });
      });

      ROOT.querySelectorAll('[data-op-reply-status]').forEach(function (button) {
        button.addEventListener('click', function () {
          var item = opGetSelectedInboxItem();
          if (!item) return;
          opSetMessageState(item, button.getAttribute('data-op-reply-status') || 'processing', button.getAttribute('data-op-reply-note') || button.textContent || '');
          flashEl('cf-flash', '已更新跟进状态 ✓');
          renderOperatorLog();
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

      ROOT.querySelectorAll('[data-op-duplicate-quick]').forEach(function (button) {
        button.addEventListener('click', function () {
          var text = button.getAttribute('data-op-duplicate-quick') || '';
          if (!text) return;
          var items = getOperatorCustomQuick();
          items.unshift(text + '（副本）');
          saveOperatorCustomQuick(items);
          flashEl('cf-flash', '已复制到自定义快捷信息 ✓');
          renderOperator();
        });
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
      ROOT.classList.remove('cf-mode-client', 'cf-client-page-mobile', 'cf-client-page-desktop', 'cf-client-mobile', 'cf-client-tablet');
      ROOT.classList.add('cf-mode-operator');
      loadOperatorDrafts();
      loadOperatorMessageMeta();
      opBindResponsiveMode();
      opSyncResponsiveMode();
      opStartClock();
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
      var recentList = ROOT.querySelector('#cf-client-recent-list');
      if (recentList) {
        var limit = Number(recentList.getAttribute('data-limit') || 4) || 4;
        var recent = clientLog.slice(0, limit);
        recentList.innerHTML = recent.length ? recent.map(function (item) {
          var tone = item.kind === 'issue' ? 'urgent' : (item.kind === 'broadcast' ? 'notice' : 'normal');
          var label = item.direction === 'in' ? '来自音控' : (item.kind === 'member_chat' ? '敬拜团区域' : '已发送');
          return [
            '<div class="cf-recent-chip cf-recent-', tone, '">',
            '  <span></span>',
            '  <div><strong>', escapeHtml(item.text), '</strong><em>', escapeHtml(label), ' · ', escapeHtml(opRelativeTime(item.ts)), '</em></div>',
            '</div>'
          ].join('');
        }).join('') : '<div class="cf-recent-empty">还没有广播记录</div>';
      }

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
      var preview = ROOT.querySelector('#cf-op-chat-preview');
      if (preview) {
        var latest = memberChat.slice(-5).reverse();
        preview.innerHTML = latest.length ? latest.map(function (item) {
          return [
            '<div class="cf-op-msg-row cf-op-preview-row">',
            '  <span class="cf-op-msg-icon">🗨️</span>',
            '  <span class="cf-op-msg-main"><strong>', escapeHtml(stripIdentityPrefix(item.from) || item.from || '成员'), '</strong><em>', escapeHtml(item.text), '</em></span>',
            '  <span class="cf-op-msg-time">', escapeHtml(formatTime(item.ts)), '</span>',
            '</div>'
          ].join('');
        }).join('') : '<div class="cf-op-empty">成员群聊会显示在这里</div>';
      }

      var log = ROOT.querySelector('#cf-member-chat-log');
      if (!log) return;

      if (!memberChat.length) {
        log.innerHTML = '<div class="cf-log-empty">成员群聊会显示在这里</div>';
        return;
      }

      log.innerHTML = memberChat.map(function (item) {
        var mine = item.from === whoAmI || (MODE === 'operator' && item.from === opOperatorName());
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
      var issueCount = opRequests().filter(opIsUrgent).length;
      var broadcastCount = opBroadcasts().length;
      var chatCount = memberChat.length;
      var micCount = opMicMembers().length;
      var instrumentCount = opInstrumentMembers().length;
      var processingCount = opRequests().filter(function (item) { return opMessageState(item).status === 'processing'; }).length;

      var values = {
        'cf-stat-clock': opNowTime(),
        'cf-stat-members': String(memberCount),
        'cf-stat-messages': String(opRequests().length),
        'cf-stat-issues': String(processingCount),
        'cf-stat-broadcasts': String(broadcastCount),
        'cf-stat-chat': String(chatCount),
        'cf-stat-mics': String(micCount),
        'cf-stat-instruments': String(instrumentCount)
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
        list.innerHTML = opBuildMemberRows(
          Number(list.getAttribute('data-limit') || 0) || 0,
          list.getAttribute('data-kick') !== '0'
        );
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

      var inbox = ROOT.querySelector('#cf-op-inbox-list');
      if (inbox) inbox.innerHTML = opBuildMessageList(0, 'requests', false);

      var history = ROOT.querySelector('#cf-op-broadcast-history');
      if (history) history.innerHTML = opBuildBroadcastHistoryTable();

      var detail = ROOT.querySelector('#cf-op-message-detail');
      if (detail) detail.innerHTML = opBuildMessageDetail();

      var follow = ROOT.querySelector('#cf-op-follow-up');
      if (follow) follow.innerHTML = opBuildFollowUpTimeline();

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

      ROOT.querySelectorAll('[data-op-reply-status]').forEach(function (button) {
        if (button.__opReplyBound) return;
        button.__opReplyBound = true;
        button.addEventListener('click', function () {
          var item = opGetSelectedInboxItem();
          if (!item) return;
          opSetMessageState(item, button.getAttribute('data-op-reply-status') || 'processing', button.getAttribute('data-op-reply-note') || button.textContent || '');
          flashEl('cf-flash', '已更新跟进状态 ✓');
          renderOperatorLog();
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
          name: role === 'operator' ? opOperatorName() : whoAmI,
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
          var taken = deviceOptionTaken(name);
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
          from: msg.from || '音控组',
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
          id: msg.id || nowId('worship'),
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
      ws.send(JSON.stringify({ type: 'worship_msg', id: nowId('worship'), kind: kind, text: text }));
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
      operatorSendBroadcastText(text, { targets: operatorTargetSelection.slice(0, 8) });
      if (input) input.value = '';
      var count = ROOT.querySelector('#cf-op-bcast-count');
      if (count) count.textContent = '0/200';
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
      if (clientResponsiveHandler) {
        window.removeEventListener('resize', clientResponsiveHandler);
        window.removeEventListener('orientationchange', clientResponsiveHandler);
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', clientResponsiveHandler);
        }
        clientResponsiveHandler = null;
      }
      if (operatorResponsiveHandler) {
        window.removeEventListener('resize', operatorResponsiveHandler);
        window.removeEventListener('orientationchange', operatorResponsiveHandler);
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', operatorResponsiveHandler);
        }
        operatorResponsiveHandler = null;
      }
      if (operatorClockTimer) {
        clearInterval(operatorClockTimer);
        operatorClockTimer = null;
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
      ROOT.classList.remove('cf-client-mobile', 'cf-client-tablet', 'cf-mode-client', 'cf-mode-operator', 'cf-client-page-mobile', 'cf-client-page-desktop');
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
