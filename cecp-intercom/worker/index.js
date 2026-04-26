// ============================================================
//  CECP Worship Team Intercom — Cloudflare Worker
//  Durable Object: WorshipRoom
// ============================================================

export class WorshipRoom {
  constructor(state, env) {
    this.state = state;
    this.env   = env;
  }

  async fetch(request) {
    const upgrade = request.headers.get('Upgrade');
    if (upgrade !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426, headers: corsHeaders() });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.state.acceptWebSocket(server);

    return new Response(null, { status: 101, webSocket: client, headers: corsHeaders() });
  }

  // ── Incoming messages ──────────────────────────────────────
  async webSocketMessage(ws, raw) {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
      case 'register': {
        ws.serializeAttachment({
          name: msg.name,
          role: msg.role,
          identityType: msg.identityType || 'other',
          ts: Date.now()
        });
        ws.send(JSON.stringify({ type: 'ack', name: msg.name }));
        this._pushMemberList();
        // 让新加入的 client 也能看到当前被占用的设备列表
        if (msg.role === 'client') {
          const takenNames = this.state.getWebSockets()
            .map(s => s.deserializeAttachment())
            .filter(a => a?.role === 'client')
            .map(a => a.name);
          ws.send(JSON.stringify({ type: 'taken_devices', names: takenNames }));
        }
        break;
      }

      case 'worship_msg': {
        // Member → Operator(s)
        const meta = ws.deserializeAttachment() || {};
        this._broadcast(JSON.stringify({
          type: 'worship_msg',
          from: meta.name || '?',
          kind: msg.kind,
          text: msg.text,
          ts:   Date.now(),
        }), ws, 'operator');
        break;
      }

      case 'member_chat': {
        const meta = ws.deserializeAttachment() || {};
        // FIX: 原来用 break 跳出会静默丢消息；改为安全检查并提供回退
        const senderName = meta.name || msg.from || '?';
        const senderRole = meta.role;

        // 只有已注册为 client 的连接才能发群聊
        // 用 senderRole 而不是直接 break，方便调试
        if (senderRole && senderRole !== 'client') break;

        const payload = JSON.stringify({
          type: 'member_chat',
          id:   msg.id || `member:${Date.now()}`,
          from: senderName,
          identityType: meta.identityType || 'other',
          text: msg.text,
          ts:   Date.now(),
        });

        // FIX: 广播给所有 client 和 operator，但跳过发送者自身（前端已本地追加）
        this._broadcast(payload, ws, null, target =>
          target?.role === 'client' || target?.role === 'operator'
        );
        break;
      }

      case 'broadcast': {
        // Operator → all Members
        const meta = ws.deserializeAttachment() || {};
        if (meta.role !== 'operator') break; // 只有 operator 可以广播
        this._broadcast(JSON.stringify({
          type: 'broadcast',
          text: msg.text,
          ts:   Date.now(),
        }), ws, 'client');
        break;
      }

      case 'ping': {
        ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
        break;
      }
    }
  }

  async webSocketClose(ws) {
    await new Promise(r => setTimeout(r, 50));
    this._pushMemberList();
  }

  async webSocketError(ws) {
    await new Promise(r => setTimeout(r, 50));
    this._pushMemberList();
  }

  // ── Helpers ────────────────────────────────────────────────

  /**
   * @param {string}   payload     - JSON string to send
   * @param {WebSocket|null} sender - 发送者 ws，跳过不转发（传 null 则不跳过任何人）
   * @param {string|null}   targetRole - 限定目标 role（null 表示不限）
   * @param {Function|null} predicate  - 额外过滤函数(meta) => bool
   */
  _broadcast(payload, sender, targetRole, predicate) {
    for (const ws of this.state.getWebSockets()) {
      try {
        // FIX: 跳过发送者自身，避免前端出现重复消息（前端虽有去重，但更干净）
        if (sender && ws === sender) continue;
        const meta = ws.deserializeAttachment();
        if (targetRole && meta?.role !== targetRole) continue;
        if (predicate && !predicate(meta)) continue;
        ws.send(payload);
      } catch {}
    }
  }

  _pushMemberList() {
    const sockets = this.state.getWebSockets();
    const members = sockets
      .map(ws => ws.deserializeAttachment())
      .filter(a => a?.role === 'client')
      .map(a => ({ name: a.name, ts: a.ts, identityType: a.identityType || 'other' }));

    const takenNames = members.map(m => m.name);

    // 发给 operator：完整成员列表
    this._broadcast(
      JSON.stringify({ type: 'member_list', members }),
      null, 'operator'
    );

    // FIX: 同时发给所有 client：设备占用列表，让选择界面实时更新
    this._broadcast(
      JSON.stringify({ type: 'taken_devices', names: takenNames }),
      null, 'client'
    );
  }
}

// ── Main Worker ──────────────────────────────────────────────
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }
    const id   = env.ROOM.idFromName('cecp-main');
    const room = env.ROOM.get(id);
    return room.fetch(request);
  },
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type, Upgrade, Connection',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };
}
