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
        const regName = String(msg.name || '').trim();
        const regRole = String(msg.role || 'client').trim();

        // 只对 client 做重复占用检查
        if (regRole === 'client') {
          const alreadyTaken = this.state.getWebSockets().some(s => {
            if (s === ws) return false; // 自己重新注册不算
            const m = s.deserializeAttachment();
            return m?.role === 'client' && m?.name === regName;
          });
          if (alreadyTaken) {
            ws.send(JSON.stringify({ type: 'name_taken', name: regName }));
            break;
          }
        }

        ws.serializeAttachment({
          name: regName,
          role: regRole,
          identityType: msg.identityType || 'other',
          ts: Date.now()
        });
        ws.send(JSON.stringify({ type: 'ack', name: regName }));
        this._pushMemberList();
        // 把当前占用列表单独推给新加入的 client
        if (regRole === 'client') {
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
        const senderName = meta.name || msg.from || '?';
        if (meta.role && meta.role !== 'client') break;
        this._broadcast(JSON.stringify({
          type: 'member_chat',
          id:   msg.id || `member:${Date.now()}`,
          from: senderName,
          identityType: meta.identityType || 'other',
          text: msg.text,
          ts:   Date.now(),
        }), ws, null, target => target?.role === 'client' || target?.role === 'operator');
        break;
      }
      case 'broadcast': {
        // Operator → all Members
        const bcMeta = ws.deserializeAttachment() || {};
        if (bcMeta.role !== 'operator') break;
        this._broadcast(JSON.stringify({
          type: 'broadcast',
          text: msg.text,
          ts:   Date.now(),
        }), null, 'client');
        break;
      }
      case 'kick': {
        // Operator kicks a single member by name
        const kickMeta = ws.deserializeAttachment() || {};
        if (kickMeta.role !== 'operator') break;
        const targetName = String(msg.name || '').trim();
        if (!targetName) break;
        for (const s of this.state.getWebSockets()) {
          try {
            const m = s.deserializeAttachment();
            if (m?.name === targetName && m?.role === 'client') {
              s.send(JSON.stringify({ type: 'kicked', reason: 'operator' }));
              s.close(1000, 'kicked');
            }
          } catch {}
        }
        break;
      }
      case 'kick_all': {
        // Operator kicks every member
        const kaMeta = ws.deserializeAttachment() || {};
        if (kaMeta.role !== 'operator') break;
        for (const s of this.state.getWebSockets()) {
          try {
            const m = s.deserializeAttachment();
            if (m?.role === 'client') {
              s.send(JSON.stringify({ type: 'kicked', reason: 'operator' }));
              s.close(1000, 'kicked');
            }
          } catch {}
        }
        break;
      }
      case 'ping': {
        ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
        break;
      }
    }
  }

  async webSocketClose(ws) {
    // Short delay so getWebSockets() reflects the closure
    await new Promise(r => setTimeout(r, 50));
    this._pushMemberList();
  }

  async webSocketError(ws) {
    await new Promise(r => setTimeout(r, 50));
    this._pushMemberList();
  }

  // ── Helpers ────────────────────────────────────────────────
  _broadcast(payload, sender, targetRole, predicate) {
    for (const ws of this.state.getWebSockets()) {
      try {
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

    this._broadcast(JSON.stringify({ type: 'member_list', members }), null, 'operator');
    this._broadcast(JSON.stringify({ type: 'taken_devices', names: takenNames }), null, 'client');
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
