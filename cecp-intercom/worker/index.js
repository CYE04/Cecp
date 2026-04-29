// ============================================================
//  CECP Worship Team Intercom — Cloudflare Worker
//  Durable Object: WorshipRoom
//  Final deploy version
//
//  Frontend:
//    data-ws-url="wss://你的-worker域名"
//    data-mode="client" | "operator"
//
//  Routes:
//    GET /         -> health check page
//    GET /health   -> json health check
//    WebSocket     -> Durable Object room
// ============================================================

const DAILY_RESET_STAMP_KEY = 'daily_reset_stamp';
const DEFAULT_DAILY_RESET_TZ = 'Europe/Rome';

export class WorshipRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.resetTimeZone = String((env && env.DAILY_RESET_TZ) || DEFAULT_DAILY_RESET_TZ).trim() || DEFAULT_DAILY_RESET_TZ;
  }

  async fetch(request) {
    await this._ensureDailyResetAlarm();

    const upgrade = request.headers.get('Upgrade');

    if (upgrade !== 'websocket') {
      return json({
        ok: true,
        service: 'CECP Worship Team Intercom Room',
        websocket: false,
        message: 'Expected WebSocket upgrade request.',
        time: new Date().toISOString(),
      }, 426);
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.state.acceptWebSocket(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
      headers: corsHeaders(),
    });
  }

  // ── Incoming messages ──────────────────────────────────────
  async webSocketMessage(ws, raw) {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      safeSend(ws, {
        type: 'error',
        code: 'bad_json',
        message: '消息格式错误',
        ts: Date.now(),
      });
      return;
    }

    const type = String(msg.type || '').trim();

    switch (type) {
      case 'register': {
        const regName = cleanName(msg.name);
        const regRole = cleanRole(msg.role);

        if (!regName) {
          safeSend(ws, {
            type: 'error',
            code: 'empty_name',
            message: '请选择设备或身份',
            ts: Date.now(),
          });
          break;
        }

        // 只对 client 做重复占用检查；operator 可以重复进入。
        if (regRole === 'client') {
          const alreadyTaken = this.state.getWebSockets().some((s) => {
            if (s === ws) return false;
            const m = safeMeta(s);
            return m?.role === 'client' && m?.name === regName;
          });

          if (alreadyTaken) {
            safeSend(ws, {
              type: 'name_taken',
              name: regName,
              ts: Date.now(),
            });
            break;
          }
        }

        ws.serializeAttachment({
          name: regName,
          role: regRole,
          identityType: cleanIdentityType(msg.identityType),
          ts: Date.now(),
        });

        safeSend(ws, {
          type: 'ack',
          name: regName,
          role: regRole,
          ts: Date.now(),
        });

        this._pushMemberList();

        // 给新加入的 client 单独补发当前占用列表，避免 UI 状态慢半拍。
        if (regRole === 'client') {
          safeSend(ws, {
            type: 'taken_devices',
            names: this._takenNames(),
            ts: Date.now(),
          });
        }

        break;
      }

      case 'worship_msg': {
        // Member → Operator(s)
        const meta = safeMeta(ws);
        if (meta?.role !== 'client') break;

        const text = cleanText(msg.text, 500);
        if (!text) break;

        this._broadcast({
          type: 'worship_msg',
          id: cleanId(msg.id, 'worship'),
          from: meta.name || '?',
          identityType: meta.identityType || 'other',
          kind: String(msg.kind || 'custom').trim() || 'custom',
          text,
          ts: Date.now(),
        }, ws, 'operator');

        break;
      }

      case 'member_chat': {
        // Member chat: client/operator 都可以收到；发送方主要是 client。
        const meta = safeMeta(ws);
        if (meta?.role && meta.role !== 'client') break;

        const senderName = meta?.name || cleanName(msg.from) || '?';
        const text = cleanText(msg.text, 500);
        if (!text) break;

        this._broadcast({
          type: 'member_chat',
          id: cleanId(msg.id, 'member'),
          from: senderName,
          identityType: meta?.identityType || 'other',
          text,
          ts: Date.now(),
        }, ws, null, (target) => target?.role === 'client' || target?.role === 'operator');

        break;
      }

      case 'broadcast': {
        // Operator → all Members
        const meta = safeMeta(ws);
        if (meta?.role !== 'operator') break;

        const text = cleanText(msg.text, 800);
        if (!text) break;

        this._broadcast({
          type: 'broadcast',
          id: cleanId(msg.id, 'broadcast'),
          text,
          ts: Date.now(),
        }, null, 'client');

        break;
      }

      case 'kick': {
        // Operator kicks a single member by name
        const meta = safeMeta(ws);
        if (meta?.role !== 'operator') break;

        const targetName = cleanName(msg.name);
        if (!targetName) break;

        for (const s of this.state.getWebSockets()) {
          const m = safeMeta(s);
          if (m?.name === targetName && m?.role === 'client') {
            safeSend(s, {
              type: 'kicked',
              reason: 'operator',
              ts: Date.now(),
            });
            try {
              s.close(1000, 'kicked');
            } catch {}
          }
        }

        await delay(30);
        this._pushMemberList();
        break;
      }

      case 'kick_all': {
        // Operator kicks every member
        const meta = safeMeta(ws);
        if (meta?.role !== 'operator') break;

        for (const s of this.state.getWebSockets()) {
          const m = safeMeta(s);
          if (m?.role === 'client') {
            safeSend(s, {
              type: 'kicked',
              reason: 'operator',
              ts: Date.now(),
            });
            try {
              s.close(1000, 'kicked');
            } catch {}
          }
        }

        await delay(30);
        this._pushMemberList();
        break;
      }

      case 'ping': {
        safeSend(ws, {
          type: 'pong',
          ts: Date.now(),
        });
        break;
      }

      default: {
        safeSend(ws, {
          type: 'error',
          code: 'unknown_type',
          message: '未知消息类型',
          ts: Date.now(),
        });
      }
    }
  }

  async webSocketClose(ws) {
    await delay(50);
    this._pushMemberList();
  }

  async webSocketError(ws) {
    await delay(50);
    this._pushMemberList();
  }

  async alarm() {
    await this._runDailyReset();
    await this._ensureDailyResetAlarm(true);
  }

  // ── Helpers ────────────────────────────────────────────────
  _broadcast(payload, sender, targetRole, predicate) {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);

    for (const ws of this.state.getWebSockets()) {
      try {
        if (sender && ws === sender) continue;

        const meta = safeMeta(ws);
        if (targetRole && meta?.role !== targetRole) continue;
        if (predicate && !predicate(meta)) continue;

        ws.send(data);
      } catch {}
    }
  }

  _members() {
    return this.state.getWebSockets()
      .map((ws) => safeMeta(ws))
      .filter((a) => a?.role === 'client' && a?.name)
      .map((a) => ({
        name: a.name,
        ts: a.ts,
        identityType: a.identityType || 'other',
      }));
  }

  _takenNames() {
    return this._members().map((m) => m.name);
  }

  _pushMemberList() {
    const members = this._members();
    const takenNames = members.map((m) => m.name);

    this._broadcast({
      type: 'member_list',
      members,
      ts: Date.now(),
    }, null, 'operator');

    this._broadcast({
      type: 'taken_devices',
      names: takenNames,
      ts: Date.now(),
    }, null, 'client');
  }

  async _ensureDailyResetAlarm(force) {
    const currentAlarm = await this.state.storage.getAlarm();
    if (!force && currentAlarm != null && currentAlarm > Date.now() + 1000) return;
    await this.state.storage.setAlarm(nextMidnightInTimeZone(this.resetTimeZone, Date.now()));
  }

  async _runDailyReset() {
    const stamp = zonedDateStamp(this.resetTimeZone, new Date());
    const lastStamp = await this.state.storage.get(DAILY_RESET_STAMP_KEY);
    if (lastStamp === stamp) return;

    await this.state.storage.put(DAILY_RESET_STAMP_KEY, stamp);

    this._broadcast({
      type: 'daily_reset',
      reason: 'daily_reset',
      ts: Date.now(),
    });

    await delay(60);

    for (const ws of this.state.getWebSockets()) {
      const meta = safeMeta(ws);
      if (meta?.role === 'client') {
        safeSend(ws, {
          type: 'kicked',
          reason: 'daily_reset',
          ts: Date.now(),
        });
        try {
          ws.close(1000, 'daily_reset');
        } catch {}
      }
    }

    await delay(80);
    this._pushMemberList();
  }
}

// ── Main Worker ──────────────────────────────────────────────
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const upgrade = request.headers.get('Upgrade');

    // 普通浏览器打开 Worker 地址时显示健康检查，不再只看到 Expected WebSocket。
    if (upgrade !== 'websocket') {
      if (url.pathname === '/health' || url.pathname === '/healthz') {
        return json({
          ok: true,
          service: 'CECP Worship Team Intercom',
          websocket: false,
          path: url.pathname,
          time: new Date().toISOString(),
        });
      }

      return htmlHealthPage(request);
    }

    if (!env.ROOM) {
      return json({
        ok: false,
        error: 'Missing Durable Object binding: ROOM',
      }, 500);
    }

    const id = env.ROOM.idFromName('cecp-main');
    const room = env.ROOM.get(id);
    return room.fetch(request);
  },
};

// ── Utils ────────────────────────────────────────────────────
function corsHeaders(extra = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Upgrade, Connection',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    ...extra,
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: corsHeaders({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    }),
  });
}

function htmlHealthPage(request) {
  const url = new URL(request.url);
  const wsUrl = `wss://${url.host}${url.pathname === '/' ? '' : url.pathname}`;

  return new Response(`<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>CECP Intercom Worker</title>
<style>
:root{
  color-scheme: light dark;
  --bg:#f5f3ef;
  --card:#fff;
  --text:#1a1916;
  --muted:#6b6660;
  --border:#e4e0d8;
  --gold:#c9922a;
  --green:#3a7d5e;
}
@media (prefers-color-scheme:dark){
  :root{
    --bg:#090b12;
    --card:#111724;
    --text:#edf1ff;
    --muted:#9aa4bd;
    --border:rgba(157,172,209,.18);
    --gold:#f3d283;
    --green:#59d68c;
  }
}
*{box-sizing:border-box}
body{
  margin:0;
  min-height:100vh;
  display:grid;
  place-items:center;
  padding:24px;
  background:
    radial-gradient(circle at top left, rgba(201,146,42,.18), transparent 32%),
    radial-gradient(circle at bottom right, rgba(58,125,94,.16), transparent 30%),
    var(--bg);
  color:var(--text);
  font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Noto Sans SC",sans-serif;
}
.card{
  width:min(720px,100%);
  padding:28px;
  border:1px solid var(--border);
  border-radius:24px;
  background:color-mix(in srgb, var(--card) 92%, transparent);
  box-shadow:0 18px 42px rgba(0,0,0,.12);
}
.kicker{
  display:inline-flex;
  align-items:center;
  gap:8px;
  padding:7px 12px;
  border-radius:999px;
  background:rgba(58,125,94,.12);
  color:var(--green);
  font-size:12px;
  font-weight:700;
  letter-spacing:.08em;
}
h1{margin:18px 0 8px;font-size:clamp(28px,5vw,42px);line-height:1.05}
p{margin:0 0 18px;color:var(--muted);line-height:1.7}
.code{
  display:block;
  overflow:auto;
  padding:14px 16px;
  border:1px solid var(--border);
  border-radius:14px;
  background:rgba(0,0,0,.04);
  color:var(--text);
  font-size:13px;
}
.row{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  margin-top:18px;
}
.badge{
  padding:8px 12px;
  border:1px solid var(--border);
  border-radius:999px;
  color:var(--muted);
  font-size:13px;
}
strong{color:var(--gold)}
</style>
</head>
<body>
  <main class="card">
    <span class="kicker">● WORKER ONLINE</span>
    <h1>CECP Intercom Worker</h1>
    <p>后端已经运行。前端请使用下面这个 WebSocket 地址填到 <strong>data-ws-url</strong>。</p>
    <code class="code">${escapeHtml(wsUrl)}</code>
    <div class="row">
      <span class="badge">Durable Object: ROOM</span>
      <span class="badge">Room: cecp-main</span>
      <span class="badge">Health: /health</span>
    </div>
  </main>
</body>
</html>`, {
    status: 200,
    headers: corsHeaders({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    }),
  });
}

function safeSend(ws, data) {
  try {
    ws.send(typeof data === 'string' ? data : JSON.stringify(data));
  } catch {}
}

function safeMeta(ws) {
  try {
    return ws.deserializeAttachment() || {};
  } catch {
    return {};
  }
}

function cleanName(value) {
  return String(value || '').trim().slice(0, 80);
}

function cleanRole(value) {
  const role = String(value || 'client').trim();
  return role === 'operator' ? 'operator' : 'client';
}

function cleanIdentityType(value) {
  const type = String(value || 'other').trim();
  return ['operator', 'mic', 'instrument', 'other'].includes(type) ? type : 'other';
}

function cleanText(value, maxLen = 500) {
  return String(value || '').trim().slice(0, maxLen);
}

function cleanId(value, prefix) {
  const raw = String(value || '').trim();
  if (raw) return raw.slice(0, 120);
  return `${prefix || 'msg'}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

function pad2(value) {
  return String(value || 0).padStart(2, '0');
}

function getZonedParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const map = {};
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }

  return {
    year: Number(map.year || 0),
    month: Number(map.month || 0),
    day: Number(map.day || 0),
    hour: Number(map.hour || 0),
    minute: Number(map.minute || 0),
    second: Number(map.second || 0),
  };
}

function addDaysYmd(year, month, day, deltaDays) {
  const date = new Date(Date.UTC(year, month - 1, day + (deltaDays || 0)));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function compareDateTimeParts(a, b) {
  const keys = ['year', 'month', 'day', 'hour', 'minute', 'second'];
  for (const key of keys) {
    const diff = Number(a[key] || 0) - Number(b[key] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function zonedDateStamp(timeZone, date) {
  const parts = getZonedParts(date || new Date(), timeZone);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

function nextMidnightInTimeZone(timeZone, nowMs) {
  const now = Number(nowMs || Date.now());
  const nowParts = getZonedParts(new Date(now), timeZone);
  const nextDate = addDaysYmd(nowParts.year, nowParts.month, nowParts.day, 1);
  const target = {
    year: nextDate.year,
    month: nextDate.month,
    day: nextDate.day,
    hour: 0,
    minute: 0,
    second: 0,
  };

  let low = now + 1000;
  let high = now + 48 * 60 * 60 * 1000;

  while (compareDateTimeParts(getZonedParts(new Date(high), timeZone), target) < 0) {
    high += 12 * 60 * 60 * 1000;
  }

  while (high - low > 1000) {
    const mid = Math.floor((low + high) / 2);
    const parts = getZonedParts(new Date(mid), timeZone);
    if (compareDateTimeParts(parts, target) >= 0) high = mid;
    else low = mid + 1;
  }

  return high;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
