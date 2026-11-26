const { test } = require('node:test');
const assert = require('node:assert/strict');
const roster = require('../roster.js');
const features = require('../features.js');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

test('按年份、月份和主日序号选择下午岗位，排除青年及晚上', () => {
  const row = { month:'2026年9月', week:'第三周', type:'主日下午', leader:'主领甲', note:'证道：讲员乙', piano:'司琴甲/司琴乙', bass:'', sound:'陈然', ppt:'季轩', broadcast:'董浩峰' };
  const result = roster.select({ ok:true, data:[{...row,type:'青年团契',leader:'青年'}, {...row,month:'2025年9月'}, row, {...row,type:'主日晚上'}] }, '2026-09-20');
  assert.equal(result.label, '2026年9月 · 第三周');
  assert.equal(result.duties.find(d => d.key === 'leader').value, '主领甲');
  assert.equal(result.duties.find(d => d.key === 'leader').label, '司会');
  assert.equal(result.duties.find(d => d.key === 'note').value, '讲员乙');
  assert.equal(result.duties.find(d => d.key === 'sound').value, '陈然');
  assert.equal(result.duties.find(d => d.key === 'ppt').value, '季轩');
  assert.equal(result.duties.find(d => d.key === 'broadcast').value, '董浩峰');
  assert.equal(result.duties.some(d => d.key === 'bass'), false);
});
test('五个主日的月份、闰年及无效日期处理', () => {
  assert.equal(roster.dateKey('2026-03-29').week, '第五周');
  assert.equal(roster.dateKey('2026-11-01').week, '第一周');
  assert.equal(roster.dateKey('2026-09-21'), null);
  assert.equal(roster.dateKey('2026-02-29'), null);
  assert.equal(roster.select({ok:true,data:[]}, '2026-09-20'), null);
  assert.throws(() => roster.select({ok:false,data:[]}, '2026-09-20'));
});
test('重复的下午安排不随意选取其中一份', () => {
  const row = {month:'2026年9月',week:'第三周',type:'主日下午'};
  assert.throws(() => roster.select({ok:true,data:[row,row]}, '2026-09-20'));
});
test('当天进行提示使用意大利时间；休息间隔、结束及旧帖子不点亮', () => {
  const schedule = [{start:'14:00',end:'14:50'}, {start:'15:00',end:'15:40'}, {start:'17:00'}];
  assert.equal(features.activeSchedule('2026-09-20', schedule, new Date('2026-09-20T12:15:00Z')), 0);
  assert.equal(features.activeSchedule('2026-09-20', schedule, new Date('2026-09-20T12:55:00Z')), -1);
  assert.equal(features.activeSchedule('2026-09-20', schedule, new Date('2026-09-20T15:00:00Z')), -1);
  assert.equal(features.activeSchedule('2026-09-20', schedule, new Date('2026-09-27T12:15:00Z')), -1);
  assert.equal(features.activeSchedule('2026-12-20', schedule, new Date('2026-12-20T13:15:00Z')), 0);
});
test('回放链接生成安全的无自动播放嵌入；本地资料可使用', () => {
  assert.equal(features.videoEmbed('https://youtu.be/TRi2wuIxYrk?autoplay=1'), 'https://www.youtube-nocookie.com/embed/TRi2wuIxYrk');
  assert.equal(features.videoEmbed('https://www.youtube.com/watch?v=TRi2wuIxYrk'), 'https://www.youtube-nocookie.com/embed/TRi2wuIxYrk');
  assert.equal(features.videoEmbed('https://youtube.com.evil.example/embed/TRi2wuIxYrk'), '');
  assert.equal(features.safeUrl('javascript:alert(1)', 'https://example.com/'), '');
  assert.equal(features.safeUrl('./assets/song.png', 'http://127.0.0.1:8765/cecp-pm/'), 'http://127.0.0.1:8765/cecp-pm/assets/song.png');
});

test('空白诗歌与通知不会生成空卡片，通知可直接写文字', () => {
  assert.deepEqual(features.filledSongs([{title:''}, '  ', {id:'nengbuneng'}, 'endianzhilu']), [{id:'nengbuneng'}, 'endianzhilu']);
  assert.deepEqual(features.announcementTexts([{title:'',detail:''}, ' 聚会后开会 ', {detail:'请为病人代祷'}, {title:'只有一行通知'}]), [
    '聚会后开会', '请为病人代祷', '只有一行通知'
  ]);
});

test('按歌名读取现有曲库，重名版本不自动猜测', () => {
  const sandbox = { window: { PMFeatures: {} } };
  vm.runInNewContext(readFileSync(require.resolve('../songs.js'), 'utf8'), sandbox);
  const match = sandbox.window.PMSongs.matchCatalog;
  assert.equal(match('新的异象，新的方向', [{ id:'vision', title:'新的异象 新的方向' }]), 'vision');
  assert.equal(match('你永远如此深爱着我', [{ id:'love', title:'祢永远如此深爱着我' }]), 'love');
  assert.equal(match('安静', [{ id:'one', title:'安静' }, { id:'two', title:'安静' }]), '');
  assert.equal(match('向主欢呼', [{ id:'different', title:'向主歌唱' }]), '');
  const lookup = sandbox.window.PMSongs.songLookup;
  assert.equal(lookup({ title:'nengbuneng' }, []).id, 'nengbuneng');
  assert.equal(lookup({ title:'nengbuneng' }, []).source, 'title-id');
  assert.equal(lookup({ title:'能不能' }, [{ id:'nengbuneng', title:'能不能' }]).id, 'nengbuneng');
  assert.equal(lookup({ title:'新歌' }, []).id, '');
  assert.equal(lookup({ id:'new-song', title:'新歌' }, []).id, 'new-song');
  assert.equal(lookup('nengbuneng', []).id, 'nengbuneng');
  assert.equal(lookup('nengbuneng', []).source, 'direct');
  assert.equal(lookup('能不能', [{ id:'nengbuneng', title:'能不能' }]).id, 'nengbuneng');
  assert.equal(lookup('能不能', [{ id:'nengbuneng', title:'能不能' }]).source, 'catalog');
  assert.equal(lookup('新歌', []).id, '');
  assert.equal(lookup('新歌', []).source, 'plain-title');
});

test('本地预览加载本地共用引擎，线上继续加载正式引擎', () => {
  const sandbox = { window: { PMFeatures: {} } };
  vm.runInNewContext(readFileSync(require.resolve('../songs.js'), 'utf8'), sandbox);
  const engineSource = sandbox.window.PMSongs.engineSource;
  const config = { songEngine:'https://example.test/youth-engine.js', songEngineLocal:'../youth-engine.js' };
  assert.equal(engineSource(config, { protocol:'http:', hostname:'127.0.0.1' }), '../youth-engine.js');
  assert.equal(engineSource(config, { protocol:'https:', hostname:'cye04.github.io' }), 'https://example.test/youth-engine.js');
});

test('歌名复制优先使用剪贴板，不可用时用页面内复制', async () => {
  let value = '';
  await features.copyText('向主欢呼', { writeText: async text => { value = text; } });
  assert.equal(value, '向主欢呼');
  let removed = false;
  const field = {
    style: {}, setAttribute() {}, select() {}, setSelectionRange() {},
    remove() { removed = true; }
  };
  const doc = {
    body: { appendChild() {} }, createElement: () => field,
    execCommand: command => command === 'copy'
  };
  await features.copyText('唱出耶稣的伟大', { writeText: async () => { throw new Error('不可用'); } }, doc);
  assert.equal(field.value, '唱出耶稣的伟大');
  assert.equal(removed, true);
});

test('嵌入页剪贴板被拒绝时，显示已全选的手动复制内容', async () => {
  let shown = '';
  const field = {
    style: {}, setAttribute() {}, select() {}, setSelectionRange() {}, remove() {}
  };
  const copied = await features.copyOrSelect('诗篇 38 篇\n1 耶和华啊', {
    clipboard: { writeText: async () => { throw new Error('嵌入页禁止剪贴板'); } },
    doc: {
      body: { appendChild() {} }, createElement: () => field,
      execCommand: () => false
    },
    showManual: value => { shown = value; }
  });
  assert.equal(copied, false);
  assert.equal(shown, '诗篇 38 篇\n1 耶和华啊');
});

test('Halo 嵌入像 Youth 一样直接在页面宿主中原生挂载，不使用 iframe', () => {
  const embed = readFileSync(require.resolve('../embed.js'), 'utf8');
  const css = readFileSync(require.resolve('../style.css'), 'utf8');
  const songs = readFileSync(require.resolve('../songs.js'), 'utf8');
  const app = readFileSync(require.resolve('../app.js'), 'utf8');
  assert.doesNotMatch(embed, /createElement\(['"]iframe['"]\)/);
  assert.match(embed, /document\.getElementById\(['"]cecp-pm['"]\)/);
  assert.match(embed, /window\.PMEngine/);
  assert.match(app, /window\.PMEngine/);
  assert.doesNotMatch(songs, /createElement\(['"]dialog['"]\)|el\(['"]dialog['"]/);
  assert.match(songs, /pm-lyrics-inline/);
  assert.match(css, /\.pm-lyrics-inline-lines\s*\{[^}]*max-height:\s*min\(/s);
});

test('页面环节直达与歌谱放大支持原生平滑滚动与全屏遮罩', () => {
  const embed = readFileSync(require.resolve('../embed.js'), 'utf8');
  const app = readFileSync(require.resolve('../app.js'), 'utf8');
  assert.match(app, /scrollToSection/);
  assert.match(embed, /style\.css/);
});

test('经文抽拉在减少动态效果时立即同步状态', () => {
  const sandbox = { window: { PMFeatures: {} } };
  vm.runInNewContext(readFileSync(require.resolve('../bible.js'), 'utf8'), sandbox);
  const label = { textContent: '' };
  const toggle = {
    attrs: {},
    setAttribute(name, value) { this.attrs[name] = value; },
    querySelector(selector) { return selector === '.bible-reader-label' ? label : null; }
  };
  const details = {
    open: false, dataset: {},
    querySelector(selector) { return selector === '.bible-reader-toggle' ? toggle : null; }
  };
  const panel = { hidden: true, style: {} };
  sandbox.window.PMBible.setDrawerState(details, panel, true, { reduceMotion:true });
  assert.equal(details.open, true);
  assert.equal(details.dataset.open, 'true');
  assert.equal(toggle.attrs['aria-expanded'], 'true');
  assert.equal(label.textContent, '收起经文');
  assert.equal(panel.hidden, false);
  sandbox.window.PMBible.setDrawerState(details, panel, false, { reduceMotion:true });
  assert.equal(details.open, false);
  assert.equal(details.dataset.open, 'false');
  assert.equal(toggle.attrs['aria-expanded'], 'false');
  assert.equal(label.textContent, '展开经文');
  assert.equal(panel.hidden, true);
});

test('诗篇使用篇，其他经卷继续使用章', () => {
  const sandbox = { window: { PMFeatures: {} } };
  vm.runInNewContext(readFileSync(require.resolve('../bible.js'), 'utf8'), sandbox);
  const bible = sandbox.window.PMBible;
  assert.equal(bible.chapterUnit(19), '篇');
  assert.equal(bible.chapterUnit(46), '章');
  assert.equal(bible.parseRef('诗 37').reference, '诗篇 37 篇');
  assert.equal(bible.passageReference({book:19, chapter:37, reference:'诗篇 37 章'}), '诗篇 37 篇');
  assert.equal(bible.parseRef('林前 3:1-23').reference, '哥林多前书 3 章 1–23 节');
});

test('歌词阅读入口只在存在非空歌词时启用', () => {
  const sandbox = { window: { PMFeatures: {} } };
  vm.runInNewContext(readFileSync(require.resolve('../songs.js'), 'utf8'), sandbox);
  const hasLyrics = sandbox.window.PMSongs.hasLyrics;
  assert.equal(hasLyrics([]), false);
  assert.equal(hasLyrics([{ textContent:'  ' }]), false);
  assert.equal(hasLyrics([{ textContent:'主啊我来到你面前' }]), true);
});

test('歌词定位只滚动歌词抽屉，不带动整张网页', () => {
  const sandbox = { window: { PMFeatures: {} } };
  vm.runInNewContext(readFileSync(require.resolve('../songs.js'), 'utf8'), sandbox);
  let received;
  const container = { clientHeight:400, scrollTo(options) { received = options; } };
  const line = { offsetTop:700, offsetHeight:40 };
  sandbox.window.PMSongs.centerLyric(container, line, 'auto');
  assert.equal(received.top, 520);
  assert.equal(received.behavior, 'auto');
});

test('歌词在原位置展开和收起，不操作整张网页滚动', () => {
  const sandbox = { window: { PMFeatures: {} } };
  vm.runInNewContext(readFileSync(require.resolve('../songs.js'), 'utf8'), sandbox);
  const states = new Set();
  const panel = {
    dataset:{}, inert:true,
    classList:{ toggle(name, on) { on ? states.add(name) : states.delete(name); } },
    setAttribute(name, value) { this[name] = value; }
  };
  const button = { textContent:'', setAttribute(name, value) { this[name] = value; } };
  sandbox.window.PMSongs.setLyricsPanelState(panel, button, true);
  assert.equal(states.has('is-open'), true);
  assert.equal(panel.inert, false);
  assert.equal(panel['aria-hidden'], 'false');
  assert.equal(button.textContent, '收起歌词');
  assert.equal(button['aria-expanded'], 'true');
  sandbox.window.PMSongs.setLyricsPanelState(panel, button, false);
  assert.equal(states.has('is-open'), false);
  assert.equal(panel.inert, true);
  assert.equal(button.textContent, '查看歌词');
});

test('通知链接卡片保留标题与说明，危险链接退回文字，旧通知仍可显示', () => {
  const items = features.announcementCards([
    ' 原有通知 ',
    { title:'菜品认领', detail:'欢迎参与', url:'https://thanksgiving.cecp.it/', linkText:'点击认领菜品' },
    { title:'安全提示', url:'javascript:alert(1)' },
    { title:'', detail:'' }
  ]);
  assert.equal(items.length, 3);
  assert.equal(items[0].detail, '原有通知');
  assert.equal(items[1].url, 'https://thanksgiving.cecp.it/');
  assert.equal(items[2].url, '');
  const previousDocument = global.document;
  global.document = { createElement(tag) {
    return { tag, children:[], appendChild(child) { this.children.push(child); } };
  } };
  try {
    const card = features.announcementCard(items[1]);
    assert.equal(card.tag, 'a');
    assert.equal(card.href, 'https://thanksgiving.cecp.it/');
    assert.equal(card.target, '_blank');
    assert.equal(card.rel, 'noopener noreferrer');
    assert.deepEqual(card.children.map(child => child.textContent), ['菜品认领', '欢迎参与', '点击认领菜品 ↗']);
    assert.equal(features.announcementCard(items[2]).tag, 'div');
    assert.equal(features.announcementCard(items[0]).children[0].textContent, '原有通知');
  } finally { global.document = previousDocument; }
});

test('一条通知支持多张时间表，空行空表忽略，时间表可单独存在', () => {
  const items = features.announcementCards([
    { schedules: [null, { title: '空表', items: [] }] },
    { schedules: [
      { title: ' 下午时间表 ', items: [null, { title: ' ' }, { start: '13:20', end: '14:00', title: '祷告会' }] },
      { title: '晚上时间表', items: [{ time: ' 待公布 ', title: '晚间安排' }, { title: '另行通知' }] }
    ] }
  ]);
  assert.equal(items.length, 1);
  assert.deepEqual(items[0].schedules, [
    { title: '下午时间表', items: [{ time: '13:20–14:00', title: '祷告会' }] },
    { title: '晚上时间表', items: [{ time: '待公布', title: '晚间安排' }, { time: '', title: '另行通知' }] }
  ]);
});

test('多张时间表分别显示标题和行，链接置于表后，通知内容只作文字显示', () => {
  const item = features.announcementCards([{
    title: '感恩节', url: 'https://example.com/', linkText: '报名', schedules: [
      { title: '下午时间表', items: [{ start: '13:20', end: '14:00', title: '<b>祷告会</b>' }] },
      { title: '晚上时间表', items: [{ title: '晚间安排' }] }
    ]
  }])[0];
  const previousDocument = global.document;
  global.document = { createElement(tag) {
    return { tag, children: [], appendChild(child) { this.children.push(child); } };
  } };
  try {
    const card = features.announcementCard(item);
    assert.equal(card.tag, 'div');
    const tables = card.children.filter(child => child.className === 'notice-timetable');
    assert.deepEqual(tables.map(table => table.children[0].textContent), ['下午时间表', '晚上时间表']);
    assert.equal(tables[0].tag, 'section');
    assert.equal(tables[0].children[1].tag, 'dl');
    const firstRow = tables[0].children[1].children[0];
    assert.equal(firstRow.children[0].textContent, '13:20–14:00');
    assert.equal(firstRow.children[0].tag, 'dt');
    assert.equal(firstRow.children[1].tag, 'dd');
    assert.equal(firstRow.children[1].textContent, '<b>祷告会</b>');
    assert.equal(tables[1].children[1].children[0].children[0].textContent, '待定');
    const link = card.children.at(-1);
    assert.equal(link.tag, 'a');
    assert.equal(link.href, 'https://example.com/');
    assert.equal(link.textContent, '报名 ↗');
    assert.equal(link.rel, 'noopener noreferrer');
  } finally { global.document = previousDocument; }
});

test('无 section 的流程行按序号自动循环配色，无独立 reading 环节时读经与献诗归入敬拜卡片', () => {
  const css = readFileSync(require.resolve('../style.css'), 'utf8');
  for (let i = 1; i <= 5; i++) {
    assert.match(css, new RegExp(`\\.schedule-row:nth-child\\(5n\\s*\\+\\s*${i}\\)`));
  }
  const app = readFileSync(require.resolve('../app.js'), 'utf8');
  assert.match(app, /hasReadingSection/);
  assert.match(app, /appendReadingAndOffering\(box,\s*true\)/);
});

test('岗位筛选菜单在手机与窄屏下向左对齐并按视口边界自动定位，缓存版本同步更新', () => {
  const css = readFileSync(require.resolve('../style.css'), 'utf8');
  const app = readFileSync(require.resolve('../app.js'), 'utf8');
  const embed = readFileSync(require.resolve('../embed.js'), 'utf8');
  const indexHtml = readFileSync(require.resolve('../index.html'), 'utf8');
  const previewHtml = readFileSync(require.resolve('../preview.html'), 'utf8');

  assert.match(css, /:is\(#cecp-pm,\s*#app\)\s*\.roster-filter-menu\s*\{[^}]*width:\s*min\(230px,\s*calc\(100vw - 24px\)\)/s);
  assert.match(css, /@media\s*\(max-width:\s*620px\)\s*\{[\s\S]*?:is\(#cecp-pm,\s*#app\)\s*\.roster-filter-menu\s*\{\s*left:\s*0;\s*right:\s*auto;/);
  assert.match(css, /:is\(#cecp-pm,\s*#app\)\s*\.roster-filter-menu\.is-align-left\s*\{\s*left:\s*0;\s*right:\s*auto;\s*\}/);
  assert.match(css, /:is\(#cecp-pm,\s*#app\)\s*\.roster-filter-menu\.is-align-right\s*\{\s*left:\s*auto;\s*right:\s*0;\s*\}/);

  assert.match(app, /function positionRosterFilterMenu\(/);
  assert.match(app, /filterDetails\.addEventListener\('toggle'/);
  assert.match(app, /window\.addEventListener\('resize'/);

  for (const [name, src] of [['embed.js', embed], ['index.html', indexHtml], ['preview.html', previewHtml]]) {
    assert.match(src, /style\.css\?v=20261122-filter-pos-v1/, name + ' style.css version');
    assert.match(src, /app\.js\?v=20261122-filter-pos-v1/, name + ' app.js version');
  }
});
