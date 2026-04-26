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
        ws.serializeAttachment({ name: msg.name, role: msg.role, ts: Date.now() });
        ws.send(JSON.stringify({ type: 'ack', name: msg.name }));
        this._pushMemberList();
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
        }), 'operator');
        break;
      }
      case 'broadcast': {
        // Operator → all Members
        this._broadcast(JSON.stringify({
          type: 'broadcast',
          text: msg.text,
          ts:   Date.now(),
        }), 'client');
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
  _broadcast(payload, targetRole) {
    for (const ws of this.state.getWebSockets()) {
      try {
        const meta = ws.deserializeAttachment();
        if (!targetRole || meta?.role === targetRole) ws.send(payload);
      } catch {}
    }
  }

  _pushMemberList() {
    const members = this.state.getWebSockets()
      .map(ws => ws.deserializeAttachment())
      .filter(a => a?.role === 'client')
      .map(a => ({ name: a.name, ts: a.ts }));

    this._broadcast(JSON.stringify({ type: 'member_list', members }), 'operator');
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
