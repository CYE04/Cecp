// ============================================================
//  CECP Worship Team Intercom — Cloudflare Worker
//  Durable Object: WorshipRoom
// ============================================================

export class WorshipRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const upgrade = request.headers.get('Upgrade');
    if (upgrade !== 'websocket') {
      return new Response('Expected WebSocket', {
        status: 426,
        headers: corsHeaders()
      });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.state.acceptWebSocket(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
      headers: corsHeaders()
    });
  }

  async webSocketMessage(ws, raw) {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch (err) {
      return;
    }

    switch (msg.type) {
      case 'register':
        ws.serializeAttachment({
          name: msg.name,
          role: msg.role,
          ts: Date.now()
        });
        ws.send(JSON.stringify({ type: 'ack', name: msg.name }));
        this.pushMemberList();
        break;

      case 'worship_msg': {
        const meta = ws.deserializeAttachment() || {};
        this.broadcast(JSON.stringify({
          type: 'worship_msg',
          from: meta.name || '?',
          kind: msg.kind,
          text: msg.text,
          ts: Date.now()
        }), 'operator');
        break;
      }

      case 'broadcast':
        this.broadcast(JSON.stringify({
          type: 'broadcast',
          text: msg.text,
          ts: Date.now()
        }), 'client');
        break;

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
        break;
    }
  }

  async webSocketClose() {
    await new Promise((resolve) => setTimeout(resolve, 50));
    this.pushMemberList();
  }

  async webSocketError() {
    await new Promise((resolve) => setTimeout(resolve, 50));
    this.pushMemberList();
  }

  broadcast(payload, targetRole) {
    for (const ws of this.state.getWebSockets()) {
      try {
        const meta = ws.deserializeAttachment();
        if (!targetRole || meta?.role === targetRole) {
          ws.send(payload);
        }
      } catch (err) {}
    }
  }

  pushMemberList() {
    const members = this.state.getWebSockets()
      .map((socket) => socket.deserializeAttachment())
      .filter((meta) => meta?.role === 'client')
      .map((meta) => ({ name: meta.name, ts: meta.ts }));

    this.broadcast(JSON.stringify({ type: 'member_list', members }), 'operator');
  }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    const id = env.ROOM.idFromName('cecp-main');
    const room = env.ROOM.get(id);
    return room.fetch(request);
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Upgrade, Connection',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };
}
