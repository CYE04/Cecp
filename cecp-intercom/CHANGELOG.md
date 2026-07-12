# cecp-intercom CHANGELOG

## v2.0.0（2026-07）

前端从 0 重写为单文件零依赖 Web Component（`<cecp-intercom>` + Shadow DOM，兼容旧 `#cecp-root` 嵌入）；worker 协议扩展。**所有 v1 消息类型原样保留，旧前端 + 新 worker 可正常混跑。**

### Worker 协议新增（worker/index.js）

| 项 | 方向 | 字段 | 说明 |
|---|---|---|---|
| 房间路由 | 连接时 | `?room=xxx`（URL 查询参数） | `[\w-]{1,64}`，缺省 `cecp-main`；每个房间一个 Durable Object 实例 |
| listener 角色 | C→S | `register.role = 'listener'` | 只收 `broadcast`（全体）与 `taken_devices`；不占设备名、不进 `member_list`、无重名检查；同一连接可重新 `register` 升级为 client |
| 请求优先级 | C→S | `worship_msg.priority: 'normal'\|'high'` | 服务端校验后原样转发给 operator |
| 请求状态机 | C→S / S→C | `msg_status {id, status:'pending'\|'doing'\|'done'}` | 仅 operator 可发；服务端广播给全部 operator + 全部 client，前端按 `id` 匹配自己的请求（无服务端存储，天然兼容 DO 休眠） |
| 定向回复 | C→S / S→C | `operator_reply {to, id, text}` | 仅 operator 可发；只投递给 `name === to` 的 client |
| 定向广播 | C→S | `broadcast.target: 'all'\|{names:[…]}` | 缺省 `all`（client + listener）；`{names}` 只投递给命中的 client（listener 无名字，不参与定向） |
| taken_devices 扩发 | S→C | — | 原只发 client，现也发给 listener（升级前的选设备界面需要置灰已占设备） |

### 向后兼容说明

- 旧前端收到新增类型（`msg_status`/`operator_reply`）会进入其 `default` 分支报 `unknown_type`，不影响运行。
- 旧前端的 `register`/`worship_msg`/`member_chat`/`broadcast`/`kick`/`kick_all`/`ping` 行为与响应完全不变。
- 旧前端连接不带 `?room=` → 仍进 `cecp-main`。

### 前端 v2（cecp.js）

- 单文件 Web Component，全部样式在 Shadow DOM 内，与宿主页面（含 youth-engine 的全局样式）双向零污染；同页多实例安全（需不同 `data-page-key`）。
- 新增 `data-mode="auto"`（youth：被动 listener + toast，点开升级 client）、`data-room`、`data-theme`。
- 敬拜端：四组快捷信息（含 high 优先级）、快捷/聊天双 Tab、请求状态回填、震动反馈、换设备确认+名字保留。
- 音控台：声部分组看板、请求状态机、定向回复、高优警报（WebAudio+震动+边框闪烁+可静音）、定向广播 chips。
- 断线自动重连（指数退避）+ 顶部断线提示条；每日午夜本地清理保留。
- 不再需要 `cecp.css`（文件保留仅防旧页面 404）。
- v2 不再有 v1 page 模式的「接管整页、隐藏宿主其它元素」行为，改为填满自身容器。
