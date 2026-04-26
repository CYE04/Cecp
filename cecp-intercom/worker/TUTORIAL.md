# CECP 敬拜团内通系统 — 当前仓库部署说明

这套功能已经接入到当前仓库的 `cecp-intercom/` 目录里，结构如下：

```text
cecp-intercom/
├── cecp.css
├── cecp.js
├── TUTORIAL.md
└── worker/
    ├── src/
    │   └── index.js
    └── wrangler.toml
```

## 1. 前端文件地址

如果你继续用这个仓库的 GitHub Pages 来托管静态文件，发布后的地址通常会是：

- `https://YOUR_USERNAME.github.io/REPO_NAME/cecp-intercom/cecp.css`
- `https://YOUR_USERNAME.github.io/REPO_NAME/cecp-intercom/cecp.js`

如果你现在推送的是当前这个仓库 `Cecp`，那对应路径就是：

- `https://cye04.github.io/Cecp/cecp-intercom/cecp.css`
- `https://cye04.github.io/Cecp/cecp-intercom/cecp.js`

## 2. Cloudflare Worker 部署

Worker 代码已经在：

`cecp-intercom/worker/`

部署步骤：

```bash
cd cecp-intercom/worker
wrangler login
wrangler deploy
```

第一次部署时如果 Wrangler 提示创建 Durable Object，确认即可。

如果你的 Cloudflare 账号使用的是 Workers Free 计划，新建 Durable Object class 必须使用 SQLite-backed migration，也就是 `new_sqlite_classes`。当前仓库里的 Worker 配置已经按这个要求设置好了。

部署成功后会得到一个类似下面的地址：

```text
https://cecp-ws.YOUR_SUBDOMAIN.workers.dev
```

前端页面里要把它写成 WebSocket 地址：

```text
wss://cecp-ws.YOUR_SUBDOMAIN.workers.dev
```

## 3. 在网页里嵌入

### 成员端

```html
<link rel="stylesheet" href="https://YOUR_USERNAME.github.io/REPO_NAME/cecp-intercom/cecp.css">

<div id="cecp-root"
     data-ws-url="wss://cecp-ws.YOUR_SUBDOMAIN.workers.dev"
     data-mode="client">
</div>

<script src="https://YOUR_USERNAME.github.io/REPO_NAME/cecp-intercom/cecp.js"></script>
```

### 音控端

```html
<link rel="stylesheet" href="https://YOUR_USERNAME.github.io/REPO_NAME/cecp-intercom/cecp.css">

<div id="cecp-root"
     data-ws-url="wss://cecp-ws.YOUR_SUBDOMAIN.workers.dev"
     data-mode="operator">
</div>

<script src="https://YOUR_USERNAME.github.io/REPO_NAME/cecp-intercom/cecp.js"></script>
```

## 4. 可选自定义

现在这个版本支持直接在 HTML 上覆写成员预设、快捷消息和广播快捷词，不用再改 JS 文件。

```html
<div id="cecp-root"
     data-ws-url="wss://cecp-ws.YOUR_SUBDOMAIN.workers.dev"
     data-mode="client"
     data-presets='["🎤 主领","🎹 琴","🥁 鼓","🎸 贝斯"]'
     data-cues='[
       {"kind":"more_monitor","icon":"🎧","label":"耳返多点","desc":"耳返整体太小"},
       {"kind":"self_up","icon":"🔊","label":"多点自己","desc":"自己声音太小"},
       {"kind":"issue","icon":"⚠️","label":"设备故障","desc":"需要帮忙处理"}
     ]'
     data-broadcast-presets='["开始","下一首","暂停一下"]'>
</div>
```

### 右下角浮动入口

如果你想把成员端做成网页右下角的小入口，而不是整页铺开，可以再加：

```html
<div data-cecp-root
     data-ws-url="wss://cecp-ws.YOUR_SUBDOMAIN.workers.dev"
     data-mode="client"
     data-layout="floating"
     data-launcher-icon="🎧"
     data-launcher-label="调音助手">
</div>
```

这个模式下：

- 右下角会先显示一个小图标
- 点击后才展开成员端窗口
- 音控广播会用网页弹窗显示，并带“已读”按钮
- 成员端自己也会看到聊天记录，不再只有音控端有记录

## 5. YouthEngine 内嵌

如果你是通过 `YouthEngine.render(...)` 来渲染周刊，可以在对应周刊 JSON 里加一个 `intercom` 字段：

```json
{
  "intercom": {
    "wsUrl": "wss://cecp-ws.YOUR_SUBDOMAIN.workers.dev",
    "mode": "client",
    "layout": "floating",
    "launcherIcon": "🎧",
    "launcherLabel": "调音助手",
    "widgetTitle": "CECP 敬拜团内通"
  }
}
```

只要有这段配置，`youth-engine.js` 就会自动加载 `cecp-intercom/cecp.css` 和 `cecp-intercom/cecp.js`，并把入口挂在 `youth` 页面里。

## 6. 当前实现里顺手补上的点

- 断线会自动重连
- 前端增加了心跳 `ping / pong`
- 离线发送会给出提示，不会静默失败
- 成员身份会按 `ws-url` 记住上次选择
- 音控端会显示在线人数

## 7. 验证方法

1. 打开一个成员端页面
2. 打开一个音控端页面
3. 成员端点一条快捷消息
4. 音控端应该立刻收到
5. 音控端发广播，成员端顶部会出现横幅提示
