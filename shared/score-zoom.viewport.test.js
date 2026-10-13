const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

test('嵌入页放大器使用宿主传来的可见区域，不请求浏览器全屏', () => {
  const zoom = readFileSync(resolve(__dirname, 'score-zoom.js'), 'utf8');
  const engine = readFileSync(resolve(__dirname, '..', 'youth-engine.js'), 'utf8');
  assert.match(zoom, /--cecp-embed-visible-top/);
  assert.match(zoom, /--cecp-embed-visible-height/);
  assert.match(zoom, /overlay\.clientHeight/);
  assert.doesNotMatch(zoom, /requestFullscreen/);
  assert.match(engine, /--cecp-embed-visible-top/);
});

test('嵌入页打开和关闭歌谱时通知 Halo 宿主切换 Youth 式窗口遮罩', () => {
  const zoom = readFileSync(resolve(__dirname, 'score-zoom.js'), 'utf8');
  assert.match(zoom, /cecp-pm-score-zoom/);
  assert.match(zoom, /notifyHost\(true\)/);
  assert.match(zoom, /notifyHost\(false\)/);
  assert.doesNotMatch(zoom, /requestFullscreen/);
});
