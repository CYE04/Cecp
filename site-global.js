/*
 * CECP site-global.js
 *
 * Halo footer usage:
 * <script>
 *   window.__CECP_SITE_GLOBAL_OPTIONS__ = { mode: 'live' };
 * </script>
 * <script src="https://cye04.github.io/Cecp/site-global.js"></script>
 *
 * Optional preview usage:
 * <div id="cecp-theme-preview"></div>
 * <script>
 *   window.__CECP_SITE_GLOBAL_OPTIONS__ = { mode: 'preview', target: '#cecp-theme-preview' };
 * </script>
 * <script src="./site-global.js"></script>
 */

(function () {
  'use strict';

  if (window.__CECP_SITE_GLOBAL_LOADED__) return;
  window.__CECP_SITE_GLOBAL_LOADED__ = true;

  var OPTIONS = window.__CECP_SITE_GLOBAL_OPTIONS__ || {};
  var STYLE_ID = 'cecp-site-global-style';
  var PREVIEW_ROOT_ID = OPTIONS.previewRootId || 'cecp-theme-preview';
  var HOME_LINKS_ID = 'cecp-live-home-links';
  var HOME_FEED_HEAD_ID = 'cecp-live-feed-head';
  var revealObserver = null;
  var domObserver = null;
  var domObserverTimer = null;
  var scrollBound = false;
  var applying = false;
  var factsPromise = null;

  var PREVIEW_DATA = {
    churchName: '意大利帕多瓦华人教会',
    churchNameEn: 'Chinese Evangelical Church of Padova',
    kicker: 'CECP / Halo Home Sample',
    welcome: '欢迎来到 CECP',
    tagline: '在这里敬拜、团契、成长、同行',
    summary:
      '把最重要的信息先放到第一眼：这是哪一个教会、什么时候聚会、新朋友从哪里开始。',
    buttons: [
      { label: '聚会时间', href: '#schedule', tone: 'primary' },
      { label: '初次来访', href: '#new-here', tone: 'secondary' },
      { label: '联系我们', href: '#contact', tone: 'ghost' }
    ],
    quickLinks: [
      {
        eyebrow: '主入口',
        title: '聚会时间',
        body: '先看主日、青年团契和祷告会，第一次来的人不用翻文章也能找到。'
      },
      {
        eyebrow: '新朋友',
        title: '第一次来',
        body: '把地址、时间、停车和联系方法放清楚，降低第一次来访的不确定感。'
      },
      {
        eyebrow: '资源',
        title: '音乐诗歌',
        body: '把敬拜、诗歌、录音整理成独立入口，不再埋在文章列表里。'
      },
      {
        eyebrow: '联系',
        title: '照片与联系',
        body: '活动相册、视频、地图与联系方式分开放，首页只保留最常用入口。'
      }
    ],
    weekFocus: [
      {
        date: '周日 12:00 - 14:00',
        title: '青少年团契',
        body: '根据当前聚会时间页，青年团契安排在礼拜日中午。'
      },
      {
        date: '周日 14:40 - 17:00 / 20:30 - 22:00',
        title: '主日崇拜',
        body: '当前主页对应的聚会时间页同时列出了下午场和晚间场主日崇拜。'
      },
      {
        date: '周三 21:00 - 22:00',
        title: '周间祷告会',
        body: '礼拜三晚间祷告会保留在首页第一屏，避免第一次访问还要再找。'
      }
    ],
    ministries: [
      {
        title: '青年团契',
        body: '为青年、留学生与刚工作的弟兄姊妹预备同行空间。'
      },
      {
        title: '敬拜团',
        body: '音乐与服事并重，让聚会更有参与感与带领感。'
      },
      {
        title: '诗班',
        body: '适合节日献诗、主日配搭与特别聚会服事。'
      },
      {
        title: '中文学校',
        body: '让家庭和孩子也能看见自己在教会里的位置。'
      }
    ],
    updates: [
      {
        tag: '通知',
        title: '教会通知',
        body: '对应当前首页置顶内容，适合继续保留在动态区而不是抢首屏。'
      },
      {
        tag: '青年',
        title: '2026年4月 第三周 青年聚会',
        body: '按当前首页最近更新内容来写，样本不会故意放不存在的条目。'
      },
      {
        tag: '青年',
        title: '2026年4月 第二周 青年聚会',
        body: '后面如果直接接现站 DOM，这块会继续跟着首页已有文章自动更新。'
      }
    ],
    contact: {
      address: 'Via Ugo Foscolo, 6, 35131 Padova PD',
      email: 'cecinese.padova@gmail.com',
      phone: '320 011 7828 / 377 882 0796'
    }
  };

  var LIVE_SCHEDULE = [
    {
      date: '周日 12:00 - 14:00',
      title: '青少年团契',
      body: '青年与学生聚会'
    },
    {
      date: '周日 14:40 - 17:00 / 20:30 - 22:00',
      title: '主日崇拜',
      body: '下午场与晚间场'
    },
    {
      date: '周三 21:00 - 22:00',
      title: '周间祷告会',
      body: '礼拜三晚间祷告'
    }
  ];

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function mergePreviewData(overrides) {
    if (!overrides) return PREVIEW_DATA;
    return {
      churchName: overrides.churchName || PREVIEW_DATA.churchName,
      churchNameEn: overrides.churchNameEn || PREVIEW_DATA.churchNameEn,
      kicker: overrides.kicker || PREVIEW_DATA.kicker,
      welcome: overrides.welcome || PREVIEW_DATA.welcome,
      tagline: overrides.tagline || PREVIEW_DATA.tagline,
      summary: overrides.summary || PREVIEW_DATA.summary,
      buttons: overrides.buttons || PREVIEW_DATA.buttons,
      quickLinks: overrides.quickLinks || PREVIEW_DATA.quickLinks,
      weekFocus: overrides.weekFocus || PREVIEW_DATA.weekFocus,
      ministries: overrides.ministries || PREVIEW_DATA.ministries,
      updates: overrides.updates || PREVIEW_DATA.updates,
      contact: {
        address:
          (overrides.contact && overrides.contact.address) || PREVIEW_DATA.contact.address,
        email: (overrides.contact && overrides.contact.email) || PREVIEW_DATA.contact.email,
        phone: (overrides.contact && overrides.contact.phone) || PREVIEW_DATA.contact.phone
      }
    };
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      "@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&family=Noto+Serif+SC:wght@500;700&display=swap');",
      ':root{',
      '  --cecp-bg:#f4f9ff;',
      '  --cecp-bg-deep:#eaf3ff;',
      '  --cecp-surface:#ffffff;',
      '  --cecp-surface-2:#eef6ff;',
      '  --cecp-surface-3:#fff9ef;',
      '  --cecp-ink:#16324d;',
      '  --cecp-muted:#637a93;',
      '  --cecp-muted-2:#7d92aa;',
      '  --cecp-line:rgba(35,76,126,.12);',
      '  --cecp-line-strong:rgba(35,76,126,.18);',
      '  --cecp-accent:#ff8a5b;',
      '  --cecp-accent-deep:#4f84ff;',
      '  --cecp-sage:#42c4a6;',
      '  --cecp-shadow:0 24px 68px rgba(41,83,134,.12);',
      '  --cecp-shadow-soft:0 14px 36px rgba(41,83,134,.10);',
      '  --cecp-radius-lg:30px;',
      '  --cecp-radius-md:24px;',
      '  --cecp-radius-sm:18px;',
      '}',
      '@media (prefers-color-scheme: dark){',
      '  :root{',
      '    --cecp-bg:#0d1728;',
      '    --cecp-bg-deep:#12203a;',
      '    --cecp-surface:#13213a;',
      '    --cecp-surface-2:#1b2c49;',
      '    --cecp-surface-3:#15253f;',
      '    --cecp-ink:#edf5ff;',
      '    --cecp-muted:#b9cce2;',
      '    --cecp-muted-2:#8ea8c5;',
      '    --cecp-line:rgba(255,255,255,.08);',
      '    --cecp-line-strong:rgba(255,255,255,.14);',
      '    --cecp-accent:#ffab7f;',
      '    --cecp-accent-deep:#7cadff;',
      '    --cecp-sage:#67d7bf;',
      '    --cecp-shadow:0 30px 76px rgba(0,0,0,.30);',
      '    --cecp-shadow-soft:0 16px 38px rgba(0,0,0,.20);',
      '  }',
      '}',
      'html.cecp-ui-ready{scroll-behavior:smooth;}',
      'html.cecp-ui-ready body{',
      "  font-family:'Manrope','PingFang SC','Microsoft YaHei',sans-serif;",
      '  color:var(--cecp-ink);',
      '  background:',
      '    radial-gradient(circle at top left, rgba(255,255,255,.76), transparent 30%),',
      '    radial-gradient(circle at 86% 8%, rgba(79,132,255,.16), transparent 18%),',
      '    radial-gradient(circle at 18% 22%, rgba(255,138,91,.10), transparent 20%),',
      '    linear-gradient(180deg, var(--cecp-bg) 0%, var(--cecp-bg-deep) 100%) !important;',
      '}',
      'html.cecp-ui-ready body::before{',
      "  content:'';",
      '  position:fixed;',
      '  inset:0;',
      '  pointer-events:none;',
      '  background:',
      '    linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px) 0 0/36px 36px,',
      '    linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px) 0 0/36px 36px;',
      '  mask-image:linear-gradient(180deg, rgba(0,0,0,.18), transparent 84%);',
      '  opacity:.35;',
      '  z-index:0;',
      '}',
      'html.cecp-ui-ready a{transition:color .18s ease, transform .18s ease, opacity .18s ease;}',
      'html.cecp-ui-ready .cecp-site-header{',
      '  position:sticky !important;',
      '  top:0;',
      '  z-index:30;',
      '  height:auto !important;',
      '  padding:12px 0 !important;',
      '  background:rgba(255,255,255,.76) !important;',
      '  backdrop-filter:blur(18px);',
      '  border-bottom:1px solid var(--cecp-line);',
      '  box-shadow:0 12px 28px rgba(18,24,38,.05);',
      '}',
      '@media (prefers-color-scheme: dark){html.cecp-ui-ready .cecp-site-header{background:rgba(19,33,58,.84) !important;}}',
      'html.cecp-ui-scrolled .cecp-site-header{padding:9px 0 !important;box-shadow:0 18px 34px rgba(18,24,38,.08);}',
      'html.cecp-ui-ready .cecp-site-header > div{width:min(1240px,calc(100% - 28px)) !important;max-width:none !important;padding:0 !important;}',
      'html.cecp-ui-ready .cecp-site-header .menu-dropdown{',
      '  border:1px solid var(--cecp-line);',
      '  border-radius:20px !important;',
      '  background:rgba(255,255,255,.96) !important;',
      '  box-shadow:var(--cecp-shadow-soft);',
      '}',
      '@media (prefers-color-scheme: dark){html.cecp-ui-ready .cecp-site-header .menu-dropdown{background:rgba(19,33,58,.98) !important;}}',
      'html.cecp-ui-ready .cecp-site-footer{',
      '  background:rgba(255,255,255,.72) !important;',
      '  border-top:1px solid var(--cecp-line);',
      '  backdrop-filter:blur(18px);',
      '}',
      '@media (prefers-color-scheme: dark){html.cecp-ui-ready .cecp-site-footer{background:rgba(19,33,58,.78) !important;}}',
      'html.cecp-ui-ready .cecp-banner{position:relative;padding:16px 14px 0;z-index:1;}',
      'html.cecp-ui-ready .cecp-banner > .cecp-banner-frame{',
      '  width:min(1240px,100%);',
      '  margin:0 auto;',
      '  border-radius:34px;',
      '  overflow:hidden;',
      '  box-shadow:var(--cecp-shadow);',
      '  position:relative;',
      '}',
      'html.cecp-ui-ready .cecp-banner > .cecp-banner-frame::after{',
      "  content:'';",
      '  position:absolute;',
      '  inset:0;',
      '  background:linear-gradient(135deg, rgba(19,34,62,.22) 0%, rgba(19,34,62,.08) 55%, rgba(19,34,62,.30) 100%);',
      '  pointer-events:none;',
      '}',
      'html.cecp-ui-home .cecp-banner > .cecp-banner-frame{min-height:440px !important;height:auto !important;}',
      'html.cecp-ui-page .cecp-banner > .cecp-banner-frame{min-height:260px !important;height:320px !important;}',
      'html.cecp-ui-ready .cecp-main-grid{',
      '  width:min(1240px,calc(100% - 28px)) !important;',
      '  max-width:none !important;',
      '  gap:22px !important;',
      '  position:relative;',
      '  z-index:1;',
      '}',
      'html.cecp-ui-home .cecp-main-grid{grid-template-columns:1fr !important;margin-top:22px !important;}',
      'html.cecp-ui-ready .cecp-filter-bar{',
      '  display:flex;',
      '  flex-wrap:wrap;',
      '  gap:10px;',
      '  padding:14px;',
      '  border:1px solid var(--cecp-line);',
      '  border-radius:24px;',
      '  background:rgba(255,255,255,.72);',
      '  box-shadow:var(--cecp-shadow-soft);',
      '  backdrop-filter:blur(16px);',
      '}',
      '@media (prefers-color-scheme: dark){html.cecp-ui-ready .cecp-filter-bar{background:rgba(19,33,58,.78);}}',
      'html.cecp-ui-ready .cecp-filter-bar a{',
      '  min-height:42px;',
      '  padding:0 16px !important;',
      '  border-radius:999px;',
      '  border:1px solid transparent;',
      '  font-size:14px !important;',
      '  font-weight:800;',
      '}',
      'html.cecp-ui-ready .cecp-feed-head{',
      '  display:flex;',
      '  flex-wrap:wrap;',
      '  align-items:flex-end;',
      '  justify-content:space-between;',
      '  gap:14px;',
      '  margin:20px 0 14px;',
      '  padding:0 4px;',
      '}',
      'html.cecp-ui-ready .cecp-feed-head-kicker{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--cecp-muted-2);margin-bottom:6px;}',
      "html.cecp-ui-ready .cecp-feed-head h2{margin:0;font-family:'Noto Serif SC',serif;font-size:34px;line-height:1.1;}",
      'html.cecp-ui-ready .cecp-feed-head p{margin:0;max-width:420px;font-size:14px;line-height:1.75;color:var(--cecp-muted);}',
      'html.cecp-ui-ready .cecp-post-grid{gap:18px !important;}',
      'html.cecp-ui-ready .cecp-post-card{',
      '  border:1px solid var(--cecp-line);',
      '  border-radius:28px !important;',
      '  overflow:hidden;',
      '  background:linear-gradient(180deg, rgba(255,255,255,.90), rgba(243,248,255,.98)) !important;',
      '  box-shadow:var(--cecp-shadow-soft) !important;',
      '  transition:transform .22s ease, box-shadow .22s ease, border-color .22s ease !important;',
      '}',
      '@media (prefers-color-scheme: dark){html.cecp-ui-ready .cecp-post-card{background:linear-gradient(180deg, rgba(22,37,64,.92), rgba(16,27,47,.98)) !important;}}',
      'html.cecp-ui-ready .cecp-post-card:hover{transform:translateY(-5px);box-shadow:var(--cecp-shadow) !important;border-color:var(--cecp-line-strong);}',
      'html.cecp-ui-ready .cecp-post-card h1{font-family:\'Noto Serif SC\',serif;font-size:29px !important;line-height:1.25 !important;letter-spacing:-.02em;}',
      'html.cecp-ui-ready .cecp-post-card p{line-height:1.8;color:var(--cecp-muted);}',
      'html.cecp-ui-ready .cecp-post-card img{transition:transform .6s ease !important;}',
      'html.cecp-ui-ready .cecp-post-card:hover img{transform:scale(1.04);}',
      'html.cecp-ui-ready .cecp-side-rail{gap:16px !important;}',
      'html.cecp-ui-ready .cecp-side-card{',
      '  border:1px solid var(--cecp-line);',
      '  border-radius:24px !important;',
      '  background:rgba(255,255,255,.72) !important;',
      '  box-shadow:var(--cecp-shadow-soft);',
      '  backdrop-filter:blur(16px);',
      '}',
      '@media (prefers-color-scheme: dark){html.cecp-ui-ready .cecp-side-card{background:rgba(19,33,58,.78) !important;}}',
      'html.cecp-ui-ready .cecp-side-card .toc{padding-right:4px;}',
      'html.cecp-ui-ready .cecp-content-shell{',
      '  border:1px solid var(--cecp-line);',
      '  border-radius:30px !important;',
      '  background:rgba(255,255,255,.74) !important;',
      '  box-shadow:var(--cecp-shadow);',
      '  backdrop-filter:blur(18px);',
      '  padding:22px 24px !important;',
      '}',
      '@media (prefers-color-scheme: dark){html.cecp-ui-ready .cecp-content-shell{background:rgba(19,33,58,.80) !important;}}',
      'html.cecp-ui-ready .cecp-content-shell > h1{font-family:\'Noto Serif SC\',serif;font-size:clamp(34px,5vw,54px) !important;line-height:1.12;letter-spacing:-.03em;}',
      'html.cecp-ui-ready #content{font-size:16px;line-height:1.88;color:var(--cecp-ink);}',
      'html.cecp-ui-ready #content > * + *{margin-top:1.2rem;}',
      'html.cecp-ui-ready #content p{line-height:1.9;color:var(--cecp-ink);}',
      'html.cecp-ui-ready #content a{color:var(--cecp-accent-deep);text-decoration:none;border-bottom:1px solid rgba(79,132,255,.24);}',
      'html.cecp-ui-ready #content img,html.cecp-ui-ready #content iframe{border-radius:20px;box-shadow:var(--cecp-shadow-soft);overflow:hidden;}',
      'html.cecp-ui-ready #content table{width:100% !important;border-collapse:separate !important;border-spacing:0;border:1px solid var(--cecp-line);border-radius:22px;overflow:hidden;background:rgba(255,255,255,.56);box-shadow:var(--cecp-shadow-soft);}',
      '@media (prefers-color-scheme: dark){html.cecp-ui-ready #content table{background:rgba(255,255,255,.04);}}',
      'html.cecp-ui-ready #content th,html.cecp-ui-ready #content td{padding:14px 16px;border-bottom:1px solid var(--cecp-line);vertical-align:top;}',
      'html.cecp-ui-ready #content tr:last-child td{border-bottom:none;}',
      'html.cecp-ui-ready #content th{background:rgba(79,132,255,.10);font-weight:800;color:var(--cecp-accent-deep);}',
      'html.cecp-ui-ready #content .columns{display:grid !important;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px !important;width:100% !important;}',
      'html.cecp-ui-ready #content .column{min-width:0 !important;}',
      'html.cecp-ui-ready .cecp-home-links{',
      '  width:min(1240px,calc(100% - 28px));',
      '  margin:22px auto 0;',
      '  position:relative;',
      '  z-index:1;',
      '}',
      'html.cecp-ui-ready .cecp-home-links-head{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:14px;margin-bottom:14px;padding:0 4px;}',
      'html.cecp-ui-ready .cecp-home-links-head h2{margin:0;font-family:\'Noto Serif SC\',serif;font-size:32px;line-height:1.1;}',
      'html.cecp-ui-ready .cecp-home-links-head p{margin:0;max-width:420px;font-size:14px;line-height:1.75;color:var(--cecp-muted);}',
      'html.cecp-ui-ready .cecp-home-links-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;}',
      'html.cecp-ui-ready .cecp-home-link-card{',
      '  display:flex;',
      '  flex-direction:column;',
      '  gap:12px;',
      '  min-height:216px;',
      '  padding:22px;',
      '  border:1px solid var(--cecp-line);',
      '  border-radius:28px;',
      '  background:linear-gradient(180deg, rgba(255,255,255,.88), rgba(243,248,255,.96));',
      '  box-shadow:var(--cecp-shadow-soft);',
      '  transition:transform .22s ease, box-shadow .22s ease, border-color .22s ease;',
      '}',
      '@media (prefers-color-scheme: dark){html.cecp-ui-ready .cecp-home-link-card{background:linear-gradient(180deg, rgba(22,37,64,.92), rgba(16,27,47,.98));}}',
      'html.cecp-ui-ready .cecp-home-link-card:hover{transform:translateY(-4px);box-shadow:var(--cecp-shadow);border-color:var(--cecp-line-strong);}',
      'html.cecp-ui-ready .cecp-home-link-kicker{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--cecp-muted-2);}',
      'html.cecp-ui-ready .cecp-home-link-title{font-size:23px;font-weight:800;line-height:1.2;}',
      'html.cecp-ui-ready .cecp-home-link-copy{font-size:14px;line-height:1.78;color:var(--cecp-muted);}',
      'html.cecp-ui-ready .cecp-home-link-arrow{margin-top:auto;font-size:13px;font-weight:800;color:var(--cecp-accent-deep);}',
      'html.cecp-ui-ready .cecp-home-hero-panel{',
      '  position:relative;',
      '  z-index:2;',
      '  display:grid;',
      '  grid-template-columns:minmax(0,1.26fr) minmax(300px,.88fr);',
      '  gap:18px;',
      '  width:100%;',
      '  min-height:440px;',
      '  padding:30px;',
      '}',
      'html.cecp-ui-ready .cecp-home-hero-main,html.cecp-ui-ready .cecp-home-hero-side{',
      '  border:1px solid rgba(255,255,255,.16);',
      '  border-radius:30px;',
      '  backdrop-filter:blur(18px);',
      '}',
      'html.cecp-ui-ready .cecp-home-hero-main{padding:30px;background:linear-gradient(180deg, rgba(35,74,138,.72), rgba(27,51,98,.42));color:#fff;}',
      'html.cecp-ui-ready .cecp-home-hero-side{padding:24px;background:linear-gradient(180deg, rgba(255,255,255,.90), rgba(240,247,255,.82));color:var(--cecp-ink);box-shadow:var(--cecp-shadow-soft);}',
      '@media (prefers-color-scheme: dark){html.cecp-ui-ready .cecp-home-hero-side{background:linear-gradient(180deg, rgba(22,37,64,.92), rgba(16,27,47,.86));color:var(--cecp-ink);}}',
      'html.cecp-ui-ready .cecp-home-pill{display:inline-flex;align-items:center;min-height:30px;padding:0 12px;border-radius:999px;background:rgba(255,255,255,.12);font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;}',
      'html.cecp-ui-ready .cecp-home-hero-main h1{margin:16px 0 10px;font-family:\'Noto Serif SC\',serif;font-size:clamp(42px,6vw,66px);line-height:1.06;letter-spacing:-.04em;}',
      'html.cecp-ui-ready .cecp-home-hero-main p{margin:0;max-width:620px;font-size:15px;line-height:1.85;color:rgba(255,255,255,.84);}',
      'html.cecp-ui-ready .cecp-home-hero-main .cecp-home-subtitle{font-size:clamp(18px,2vw,24px);font-weight:700;color:rgba(255,255,255,.92);margin-bottom:12px;}',
      'html.cecp-ui-ready .cecp-home-hero-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:24px;}',
      'html.cecp-ui-ready .cecp-home-hero-actions a{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 20px;border-radius:999px;font-size:14px;font-weight:800;border:1px solid rgba(255,255,255,.18);}',
      'html.cecp-ui-ready .cecp-home-hero-actions a.is-primary{background:#fff;color:#162233;border-color:transparent;}',
      'html.cecp-ui-ready .cecp-home-hero-actions a.is-secondary{background:rgba(255,255,255,.14);color:#fff;}',
      'html.cecp-ui-ready .cecp-home-info-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:16px;}',
      'html.cecp-ui-ready .cecp-home-side-kicker{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--cecp-muted-2);margin-bottom:6px;}',
      'html.cecp-ui-ready .cecp-home-hero-side h2{margin:0 0 6px;font-family:\'Noto Serif SC\',serif;font-size:28px;line-height:1.15;}',
      'html.cecp-ui-ready .cecp-home-hero-side p{margin:0;font-size:13px;line-height:1.7;color:var(--cecp-muted);}',
      'html.cecp-ui-ready .cecp-home-focus-list{display:grid;gap:12px;margin-top:16px;}',
      'html.cecp-ui-ready .cecp-home-focus-item{padding:15px 16px;border-radius:20px;border:1px solid var(--cecp-line);background:rgba(255,255,255,.62);box-shadow:var(--cecp-shadow-soft);}',
      '@media (prefers-color-scheme: dark){html.cecp-ui-ready .cecp-home-focus-item{background:rgba(255,255,255,.05);}}',
      'html.cecp-ui-ready .cecp-home-focus-date{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--cecp-accent);margin-bottom:8px;}',
      'html.cecp-ui-ready .cecp-home-focus-title{font-size:18px;font-weight:800;line-height:1.35;}',
      'html.cecp-ui-ready .cecp-home-focus-meta{margin-top:5px;font-size:13px;color:var(--cecp-muted);}',
      'html.cecp-ui-ready .cecp-home-focus-item:hover{transform:translateY(-2px);}',
      'html.cecp-ui-ready .cecp-reveal{opacity:0;transform:translateY(20px) scale(.985);transition:opacity .65s ease,transform .65s ease;}',
      'html.cecp-ui-ready .cecp-reveal.is-visible{opacity:1;transform:translateY(0) scale(1);}',
      '@media (max-width: 1100px){',
      '  html.cecp-ui-ready .cecp-home-hero-panel,html.cecp-ui-ready .cecp-home-links-grid{grid-template-columns:1fr 1fr;}',
      '  html.cecp-ui-ready .cecp-home-info-grid{grid-template-columns:1fr;}',
      '}',
      '@media (max-width: 820px){',
      '  html.cecp-ui-ready .cecp-main-grid,html.cecp-ui-ready .cecp-home-hero-panel,html.cecp-ui-ready .cecp-home-links-grid{grid-template-columns:1fr !important;}',
      '  html.cecp-ui-ready .cecp-site-header > div,html.cecp-ui-ready .cecp-home-links,html.cecp-ui-ready .cecp-main-grid{width:min(100% - 18px,1240px) !important;}',
      '  html.cecp-ui-ready .cecp-banner{padding:10px 9px 0;}',
      '  html.cecp-ui-ready .cecp-banner > .cecp-banner-frame{border-radius:28px;}',
      '  html.cecp-ui-ready .cecp-home-hero-panel{padding:18px;}',
      '  html.cecp-ui-ready .cecp-home-hero-main,html.cecp-ui-ready .cecp-home-hero-side,html.cecp-ui-ready .cecp-content-shell,html.cecp-ui-ready .cecp-home-link-card{padding:18px;}',
      '  html.cecp-ui-ready .cecp-home-hero-main h1{font-size:clamp(34px,11vw,50px);}',
      '  html.cecp-ui-ready .cecp-feed-head h2,html.cecp-ui-ready .cecp-home-links-head h2{font-size:28px;}',
      '  html.cecp-ui-ready .cecp-side-rail{display:none !important;}',
      '  html.cecp-ui-ready #content .columns{grid-template-columns:1fr !important;}',
      '}',
      '.cecp-preview-shell{position:relative;overflow:hidden;min-height:100vh;color:var(--cecp-ink);background:radial-gradient(circle at top left, rgba(255,255,255,.76), transparent 32%),radial-gradient(circle at 86% 14%, rgba(79,132,255,.16), transparent 18%),radial-gradient(circle at 20% 22%, rgba(255,138,91,.12), transparent 20%),linear-gradient(180deg, var(--cecp-bg) 0%, var(--cecp-bg-deep) 100%);}',
      '@media (prefers-color-scheme: dark){.cecp-preview-shell{background:radial-gradient(circle at top left, rgba(255,255,255,.05), transparent 24%),radial-gradient(circle at 82% 10%, rgba(124,173,255,.18), transparent 16%),linear-gradient(180deg, #0d1728 0%, #12203a 100%);}}',
      '.cecp-preview-shell::before{content:\'\';position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px) 0 0/36px 36px,linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px) 0 0/36px 36px;mask-image:linear-gradient(180deg, rgba(0,0,0,.2), transparent 84%);opacity:.45;}',
      '.cecp-preview-stage{position:relative;z-index:1;width:min(1180px,calc(100% - 28px));margin:0 auto;padding:28px 0 52px;}',
      '.cecp-preview-topbar{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:10px 18px;border:1px solid var(--cecp-line);border-radius:999px;background:rgba(255,255,255,.72);backdrop-filter:blur(18px);box-shadow:var(--cecp-shadow-soft);}',
      '@media (prefers-color-scheme: dark){.cecp-preview-topbar{background:rgba(19,33,58,.80);}}',
      '.cecp-preview-brand{display:flex;flex-direction:column;gap:4px;}',
      '.cecp-preview-brand-kicker{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--cecp-muted-2);}',
      ".cecp-preview-brand-title{font-family:'Noto Serif SC',serif;font-size:20px;font-weight:700;}",
      '.cecp-preview-nav{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:10px;}',
      '.cecp-preview-nav a{padding:10px 14px;border-radius:999px;font-size:13px;font-weight:700;color:var(--cecp-muted);background:rgba(255,255,255,.42);border:1px solid transparent;}',
      '.cecp-preview-hero{display:grid;grid-template-columns:minmax(0,1.28fr) minmax(320px,.86fr);gap:22px;margin-top:24px;}',
      '.cecp-preview-panel{border:1px solid var(--cecp-line);border-radius:30px;background:rgba(255,255,255,.74);backdrop-filter:blur(22px);box-shadow:var(--cecp-shadow);}',
      '@media (prefers-color-scheme: dark){.cecp-preview-panel{background:rgba(19,33,58,.80);}}',
      '.cecp-preview-main{padding:34px 34px 30px;}',
      '.cecp-preview-pill{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border-radius:999px;background:rgba(79,132,255,.10);font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--cecp-accent-deep);}',
      ".cecp-preview-title{margin:18px 0 10px;font-family:'Noto Serif SC',serif;font-size:clamp(38px,6vw,66px);line-height:1.06;letter-spacing:-.04em;}",
      '.cecp-preview-subtitle{font-size:clamp(18px,2vw,24px);line-height:1.55;color:var(--cecp-muted);max-width:660px;}',
      '.cecp-preview-summary{margin:18px 0 0;max-width:600px;font-size:15px;line-height:1.8;color:var(--cecp-muted);}',
      '.cecp-preview-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:26px;}',
      '.cecp-preview-actions a{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 20px;border-radius:999px;font-size:14px;font-weight:800;border:1px solid var(--cecp-line-strong);}',
      '.cecp-preview-actions .is-primary{background:var(--cecp-accent-deep);border-color:transparent;color:#fff;}',
      '.cecp-preview-actions .is-secondary{background:var(--cecp-accent);border-color:transparent;color:#fff;}',
      '.cecp-preview-actions .is-ghost{background:rgba(255,255,255,.54);}',
      '.cecp-preview-meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:30px;}',
      '.cecp-preview-meta-card{padding:14px;border-radius:18px;background:rgba(255,255,255,.52);border:1px solid var(--cecp-line);}',
      '@media (prefers-color-scheme: dark){.cecp-preview-meta-card{background:rgba(255,255,255,.06);}}',
      '.cecp-preview-meta-label{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--cecp-muted-2);margin-bottom:6px;}',
      '.cecp-preview-meta-value{font-size:14px;font-weight:800;}',
      '.cecp-preview-side{padding:24px;display:flex;flex-direction:column;gap:14px;}',
      '.cecp-preview-side h2{margin:0;font-family:\'Noto Serif SC\',serif;font-size:26px;}',
      '.cecp-preview-focus-list{display:grid;gap:12px;margin-top:6px;}',
      '.cecp-preview-focus-item{padding:16px;border-radius:22px;background:rgba(255,255,255,.64);border:1px solid var(--cecp-line);box-shadow:var(--cecp-shadow-soft);}',
      '@media (prefers-color-scheme: dark){.cecp-preview-focus-item{background:rgba(255,255,255,.06);}}',
      '.cecp-preview-focus-date{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--cecp-accent);margin-bottom:8px;}',
      '.cecp-preview-focus-title{font-size:18px;font-weight:800;margin-bottom:4px;}',
      '.cecp-preview-focus-body{font-size:14px;line-height:1.65;color:var(--cecp-muted);}',
      '.cecp-preview-section{margin-top:22px;}',
      '.cecp-preview-section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:14px;padding:0 6px;}',
      '.cecp-preview-section-head h2{margin:0;font-family:\'Noto Serif SC\',serif;font-size:32px;}',
      '.cecp-preview-section-kicker{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--cecp-muted-2);margin-bottom:6px;}',
      '.cecp-preview-section-copy{max-width:360px;font-size:14px;line-height:1.75;color:var(--cecp-muted);}',
      '.cecp-preview-grid{display:grid;gap:16px;}',
      '.cecp-preview-grid.is-4{grid-template-columns:repeat(4,minmax(0,1fr));}',
      '.cecp-preview-grid.is-3{grid-template-columns:repeat(3,minmax(0,1fr));}',
      '.cecp-preview-card{padding:22px;border-radius:26px;border:1px solid var(--cecp-line);background:linear-gradient(180deg, rgba(255,255,255,.88), rgba(243,248,255,.96));box-shadow:var(--cecp-shadow-soft);}',
      '@media (prefers-color-scheme: dark){.cecp-preview-card{background:linear-gradient(180deg, rgba(22,37,64,.92), rgba(16,27,47,.98));}}',
      '.cecp-preview-card-kicker{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--cecp-muted-2);margin-bottom:14px;}',
      '.cecp-preview-card-title{font-size:22px;font-weight:800;line-height:1.2;margin-bottom:10px;}',
      '.cecp-preview-card-body{font-size:14px;line-height:1.78;color:var(--cecp-muted);}',
      '.cecp-preview-card-line{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:20px;padding-top:16px;border-top:1px solid var(--cecp-line);font-size:13px;font-weight:800;color:var(--cecp-accent-deep);}',
      '.cecp-preview-footer{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin-top:18px;padding:18px 6px 0;color:var(--cecp-muted);font-size:13px;}',
      '@media (max-width: 1024px){.cecp-preview-hero,.cecp-preview-grid.is-4,.cecp-preview-grid.is-3,.cecp-preview-meta{grid-template-columns:1fr 1fr;}}',
      '@media (max-width: 760px){.cecp-preview-stage{width:min(100% - 18px,1180px);padding-top:18px;}.cecp-preview-topbar,.cecp-preview-hero,.cecp-preview-grid.is-4,.cecp-preview-grid.is-3,.cecp-preview-meta{grid-template-columns:1fr;}.cecp-preview-main,.cecp-preview-side,.cecp-preview-card{padding:20px;}.cecp-preview-title{font-size:clamp(34px,11vw,50px);}.cecp-preview-section-head h2{font-size:26px;}}'
    ].join('');

    document.head.appendChild(style);
  }

  function renderPreviewButtons(buttons) {
    return buttons
      .map(function (button) {
        return (
          '<a class="is-' +
          escapeHtml(button.tone || 'ghost') +
          '" href="' +
          escapeHtml(button.href || '#') +
          '">' +
          escapeHtml(button.label) +
          '</a>'
        );
      })
      .join('');
  }

  function renderPreviewCards(items) {
    return items
      .map(function (item) {
        return (
          '<article class="cecp-preview-card">' +
          '<div class="cecp-preview-card-kicker">' +
          escapeHtml(item.eyebrow || item.tag || 'CECP') +
          '</div>' +
          '<h3 class="cecp-preview-card-title">' +
          escapeHtml(item.title) +
          '</h3>' +
          '<p class="cecp-preview-card-body">' +
          escapeHtml(item.body) +
          '</p>' +
          '<div class="cecp-preview-card-line"><span>查看详情</span><span>01</span></div>' +
          '</article>'
        );
      })
      .join('');
  }

  function renderPreviewFocus(items) {
    return items
      .map(function (item) {
        return (
          '<article class="cecp-preview-focus-item">' +
          '<div class="cecp-preview-focus-date">' +
          escapeHtml(item.date) +
          '</div>' +
          '<h3 class="cecp-preview-focus-title">' +
          escapeHtml(item.title) +
          '</h3>' +
          '<p class="cecp-preview-focus-body">' +
          escapeHtml(item.body) +
          '</p>' +
          '</article>'
        );
      })
      .join('');
  }

  function renderPreview(data) {
    return [
      '<div class="cecp-preview-shell">',
      '  <div class="cecp-preview-stage">',
      '    <header class="cecp-preview-topbar">',
      '      <div class="cecp-preview-brand">',
      '        <div class="cecp-preview-brand-kicker">' + escapeHtml(data.kicker) + '</div>',
      '        <div class="cecp-preview-brand-title">' + escapeHtml(data.churchName) + '</div>',
      '      </div>',
      '      <nav class="cecp-preview-nav">',
      '        <a href="#hero">首页</a>',
      '        <a href="#schedule">聚会时间</a>',
      '        <a href="#ministries">事工团契</a>',
      '        <a href="#updates">最新动态</a>',
      '        <a href="#contact">联系我们</a>',
      '      </nav>',
      '    </header>',
      '    <section class="cecp-preview-hero" id="hero">',
      '      <article class="cecp-preview-panel cecp-preview-main">',
      '        <div class="cecp-preview-pill">' + escapeHtml(data.welcome) + '</div>',
      '        <h1 class="cecp-preview-title">' + escapeHtml(data.churchName) + '</h1>',
      '        <div class="cecp-preview-subtitle">' + escapeHtml(data.tagline) + '</div>',
      '        <p class="cecp-preview-summary">' + escapeHtml(data.summary) + '</p>',
      '        <div class="cecp-preview-actions">' + renderPreviewButtons(data.buttons) + '</div>',
      '        <div class="cecp-preview-meta">',
      '          <div class="cecp-preview-meta-card"><div class="cecp-preview-meta-label">定位</div><div class="cecp-preview-meta-value">教会门户首页</div></div>',
      '          <div class="cecp-preview-meta-card"><div class="cecp-preview-meta-label">气质</div><div class="cecp-preview-meta-value">清爽、温暖、轻高级</div></div>',
      '          <div class="cecp-preview-meta-card"><div class="cecp-preview-meta-label">语言</div><div class="cecp-preview-meta-value">' + escapeHtml(data.churchNameEn) + '</div></div>',
      '        </div>',
      '      </article>',
      '      <aside class="cecp-preview-panel cecp-preview-side" id="schedule">',
      '        <div class="cecp-preview-section-kicker">Current Schedule</div>',
      '        <h2>聚会时间</h2>',
      '        <p>样本页里先把当前公开的聚会时间放到右侧，不再用模糊占位内容。</p>',
      '        <div class="cecp-preview-focus-list">' + renderPreviewFocus(data.weekFocus) + '</div>',
      '      </aside>',
      '    </section>',
      '    <section class="cecp-preview-section">',
      '      <div class="cecp-preview-section-head">',
      '        <div><div class="cecp-preview-section-kicker">Quick Links</div><h2>入口先清楚</h2></div>',
      '        <p class="cecp-preview-section-copy">把高频入口单独做成卡片，首页就不需要先靠分类和标签解释自己。</p>',
      '      </div>',
      '      <div class="cecp-preview-grid is-4">' + renderPreviewCards(data.quickLinks) + '</div>',
      '    </section>',
      '    <section class="cecp-preview-section" id="ministries">',
      '      <div class="cecp-preview-section-head">',
      '        <div><div class="cecp-preview-section-kicker">Ministries</div><h2>事工与团契</h2></div>',
      '        <p class="cecp-preview-section-copy">分类可以继续保留，但前台入口应该更像精心设计的门户分区。</p>',
      '      </div>',
      '      <div class="cecp-preview-grid is-4">' + renderPreviewCards(data.ministries) + '</div>',
      '    </section>',
      '    <section class="cecp-preview-section" id="updates">',
      '      <div class="cecp-preview-section-head">',
      '        <div><div class="cecp-preview-section-kicker">Latest</div><h2>最新动态放后面</h2></div>',
      '        <p class="cecp-preview-section-copy">动态仍然保留，但不会像现在这样一上来就主导首页视线。</p>',
      '      </div>',
      '      <div class="cecp-preview-grid is-3">' + renderPreviewCards(data.updates) + '</div>',
      '    </section>',
      '    <footer class="cecp-preview-footer" id="contact">',
      '      <div>CECP Halo 样本 / 下一步可以直接改成挂到全站页脚的脚本</div>',
      '      <div>' +
      escapeHtml(data.contact.address) +
      ' / ' +
      escapeHtml(data.contact.email) +
      '</div>',
      '    </footer>',
      '  </div>',
      '</div>'
    ].join('');
  }

  function resolveTarget(target) {
    if (!target) return null;
    if (typeof target === 'string') return document.querySelector(target);
    if (target.nodeType === 1) return target;
    return null;
  }

  function mountPreview(target, overrides) {
    var el = resolveTarget(target);
    if (!el) return null;

    injectStyles();
    el.innerHTML = renderPreview(mergePreviewData(overrides));
    return el;
  }

  function isPreviewMode() {
    if (OPTIONS.mode === 'live') return false;
    if (OPTIONS.mode === 'preview') return true;
    return !!document.getElementById(PREVIEW_ROOT_ID) && !document.getElementById('header-menu');
  }

  function isHomePage() {
    return !!document.getElementById('post-list') && !!document.getElementById('filters');
  }

  function isContentPage() {
    return !!document.getElementById('content');
  }

  function firstText(selector, root) {
    var el = (root || document).querySelector(selector);
    return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
  }

  function resolveLink(selector, fallbackHref, fallbackLabel) {
    var link = document.querySelector(selector);
    return {
      href: link ? link.getAttribute('href') || fallbackHref : fallbackHref,
      label: link ? link.textContent.replace(/\s+/g, ' ').trim() : fallbackLabel
    };
  }

  function getBannerSection() {
    var header = document.getElementById('header-menu');
    if (!header) return null;

    var cursor = header.nextElementSibling;
    while (cursor) {
      if (cursor.tagName === 'SECTION') return cursor;
      cursor = cursor.nextElementSibling;
    }
    return null;
  }

  function getHomeMainGrid() {
    var list = document.getElementById('post-list');
    return list ? list.closest('section') : null;
  }

  function getContentMainGrid() {
    var content = document.getElementById('content');
    return content ? content.closest('section') : null;
  }

  function normalizeTimeRange(value) {
    return String(value || '')
      .replace(/~/g, ' - ')
      .replace(/\s*-\s*/g, ' - ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function formatPhone(value) {
    var digits = String(value || '').replace(/\D/g, '');
    if (digits.length === 10) {
      return digits.slice(0, 3) + ' ' + digits.slice(3, 6) + ' ' + digits.slice(6);
    }
    return String(value || '').trim();
  }

  function collectLatestPosts() {
    return Array.prototype.slice
      .call(document.querySelectorAll('#post-list > div'), 0, 3)
      .map(function (card) {
        var titleLink = card.querySelector('h1 a');
        var dateText = '';
        var metaSpans = card.querySelectorAll('span');
        for (var i = 0; i < metaSpans.length; i += 1) {
          if (/发布于/.test(metaSpans[i].textContent)) {
            dateText = metaSpans[i].textContent.replace('发布于', '').trim();
            break;
          }
        }
        return {
          href: titleLink ? titleLink.getAttribute('href') : '#',
          title: titleLink ? titleLink.textContent.replace(/\s+/g, ' ').trim() : '最新动态',
          date: dateText || '最近更新'
        };
      });
  }

  function buildHomeHeroMarkup() {
    var schedule = resolveLink('a[href="/schedule"]', '/schedule', '聚会时间');
    var contact = resolveLink('a[href="/contacts"]', '/contacts', '联系我们');
    var media = resolveLink('a[href="/media"]', '/media', '照片视频');

    return [
      '<div class="cecp-home-hero-panel">',
      '  <div class="cecp-home-hero-main cecp-reveal">',
      '    <div class="cecp-home-pill">Welcome To CECP</div>',
      '    <h1>意大利帕多瓦华人教会</h1>',
      '    <div class="cecp-home-subtitle">主页先清楚，再漂亮。第一次来到的人一眼就能知道这里是什么、该从哪里开始。</div>',
      '    <p>这版不是摆样子用的假首页。我已经按你现站的聚会时间页和联系我们页，把首页第一眼最该露出来的内容改成当前公开信息。</p>',
      '    <div class="cecp-home-hero-actions">',
      '      <a class="is-primary" href="' + escapeHtml(schedule.href) + '">' + escapeHtml(schedule.label) + '</a>',
      '      <a class="is-secondary" href="' + escapeHtml(contact.href) + '">' + escapeHtml(contact.label) + '</a>',
      '      <a class="is-secondary" href="' + escapeHtml(media.href) + '">' + escapeHtml(media.label) + '</a>',
      '    </div>',
      '    <div class="cecp-home-info-grid">',
      '      <div class="cecp-home-focus-item"><div class="cecp-home-focus-date">地址</div><div class="cecp-home-focus-title" style="font-size:16px;" data-cecp-address>Via Ugo Foscolo, 6, 35131 Padova PD</div><div class="cecp-home-focus-meta">当前联系我们页公开地址</div></div>',
      '      <div class="cecp-home-focus-item"><div class="cecp-home-focus-date">联系</div><div class="cecp-home-focus-title" style="font-size:16px;" data-cecp-phone>320 011 7828 / 377 882 0796</div><div class="cecp-home-focus-meta">陈王平长老 / 胡蓉姊妹</div></div>',
      '    </div>',
      '  </div>',
      '  <aside class="cecp-home-hero-side cecp-reveal">',
      '    <div class="cecp-home-side-kicker">Current Schedule</div>',
      '    <h2>聚会时间</h2>',
      '    <p>这里先放当前公开的固定时间，让首页本身就能把最关键的信息说对。</p>',
      '    <div class="cecp-home-focus-list">',
      LIVE_SCHEDULE
        .map(function (item) {
          return [
            '<a class="cecp-home-focus-item" href="' + escapeHtml(schedule.href) + '">',
            '  <div class="cecp-home-focus-date" data-cecp-schedule-date="' + escapeHtml(item.title) + '">' + escapeHtml(item.date) + '</div>',
            '  <div class="cecp-home-focus-title" data-cecp-schedule-title="' + escapeHtml(item.title) + '">' + escapeHtml(item.title) + '</div>',
            '  <div class="cecp-home-focus-meta" data-cecp-schedule-meta="' + escapeHtml(item.title) + '">' + escapeHtml(item.body) + '</div>',
            '</a>'
          ].join('');
        })
        .join(''),
      '    </div>',
      '  </aside>',
      '</div>'
    ].join('');
  }

  function buildQuickLinksMarkup() {
    var links = [
      {
        kicker: 'Schedule',
        title: '聚会时间',
        href: resolveLink('a[href="/schedule"]', '/schedule', '聚会时间').href,
        copy: '当前公开时间包括青年团契、主日崇拜和周间祷告会，首页入口会直接对准它。'
      },
      {
        kicker: 'Media',
        title: '照片视频',
        href: resolveLink('a[href="/media"]', '/media', '照片视频').href,
        copy: '相册、视频和外链资源继续保留，但入口会更像首页功能卡片。'
      },
      {
        kicker: 'Music',
        title: '音乐诗歌',
        href: 'https://music.cecp.it/',
        copy: '和你现在的音乐站、诗歌库体系连起来，不再埋在下拉菜单深处。'
      },
      {
        kicker: 'Contact',
        title: '联系我们',
        href: resolveLink('a[href="/contacts"]', '/contacts', '联系我们').href,
        copy: '地址是 Via Ugo Foscolo, 6，电话公开为 320 011 7828 和 377 882 0796。'
      }
    ];

    return [
      '<section id="' + HOME_LINKS_ID + '" class="cecp-home-links cecp-reveal">',
      '  <div class="cecp-home-links-head">',
      '    <div>',
      '      <div class="cecp-feed-head-kicker">Quick Links</div>',
      '      <h2>主页保持清爽，但核心入口都还在</h2>',
      '    </div>',
      '    <p>不去硬删你现有内容，而是把真正高频的入口提到前面，文章和分类退到后面。</p>',
      '  </div>',
      '  <div class="cecp-home-links-grid">',
      links
        .map(function (item) {
          return [
            '<a class="cecp-home-link-card" href="' + escapeHtml(item.href) + '">',
            '  <div class="cecp-home-link-kicker">' + escapeHtml(item.kicker) + '</div>',
            '  <div class="cecp-home-link-title">' + escapeHtml(item.title) + '</div>',
            '  <div class="cecp-home-link-copy">' + escapeHtml(item.copy) + '</div>',
            '  <div class="cecp-home-link-arrow">进入页面</div>',
            '</a>'
          ].join('');
        })
        .join(''),
      '  </div>',
      '</section>'
    ].join('');
  }

  function ensureRevealObserver() {
    if (revealObserver || !('IntersectionObserver' in window)) return;

    revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.14,
        rootMargin: '0px 0px -40px 0px'
      }
    );
  }

  function reveal(nodes) {
    ensureRevealObserver();

    Array.prototype.forEach.call(nodes, function (node) {
      if (!node || node.classList.contains('is-visible')) return;
      node.classList.add('cecp-reveal');
      if (revealObserver) revealObserver.observe(node);
    });
  }

  function bindScrollState() {
    if (scrollBound) return;
    scrollBound = true;

    function update() {
      document.documentElement.classList.toggle('cecp-ui-scrolled', window.scrollY > 12);
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  function markCommonLayout() {
    var header = document.getElementById('header-menu');
    var footer = document.querySelector('footer');
    var banner = getBannerSection();

    if (header) header.classList.add('cecp-site-header');
    if (footer) footer.classList.add('cecp-site-footer');
    if (banner) {
      banner.classList.add('cecp-banner');
      if (banner.firstElementChild) banner.firstElementChild.classList.add('cecp-banner-frame');
    }
  }

  function ensureHomePageLayout() {
    var banner = getBannerSection();
    var mainGrid = getHomeMainGrid();
    var filters = document.getElementById('filters');
    var postList = document.getElementById('post-list');
    var aside = mainGrid ? mainGrid.querySelector('aside') : null;

    if (!banner || !mainGrid || !filters || !postList) return;

    document.documentElement.classList.add('cecp-ui-ready', 'cecp-ui-home');
    document.documentElement.classList.remove('cecp-ui-page');

    mainGrid.classList.add('cecp-main-grid');
    filters.classList.add('cecp-filter-bar');
    postList.classList.add('cecp-post-grid');

    if (banner.firstElementChild && !banner.firstElementChild.dataset.cecpHeroReady) {
      banner.firstElementChild.dataset.cecpHeroReady = 'true';
      banner.firstElementChild.innerHTML = buildHomeHeroMarkup();
    }

    if (!document.getElementById(HOME_LINKS_ID)) {
      mainGrid.insertAdjacentHTML('beforebegin', buildQuickLinksMarkup());
    }

    if (!document.getElementById(HOME_FEED_HEAD_ID)) {
      filters.insertAdjacentHTML(
        'beforebegin',
        [
          '<div id="' + HOME_FEED_HEAD_ID + '" class="cecp-feed-head">',
          '  <div>',
          '    <div class="cecp-feed-head-kicker">Latest Updates</div>',
          '    <h2>最新动态</h2>',
          '  </div>',
          '  <p>动态继续保留，但现在它会出现在欢迎和入口之后，不会再像博客首页一样压住主视觉。</p>',
          '</div>'
        ].join('')
      );
    }

    Array.prototype.forEach.call(postList.children, function (card) {
      card.classList.add('cecp-post-card');
    });

    if (aside) {
      aside.classList.add('cecp-side-rail');
      Array.prototype.forEach.call(aside.children, function (card) {
        card.classList.add('cecp-side-card');
      });
    }

    reveal(
      document.querySelectorAll(
        '.cecp-home-hero-main, .cecp-home-hero-side, #' +
          HOME_LINKS_ID +
          ', #' +
          HOME_FEED_HEAD_ID +
          ', #post-list > .cecp-post-card'
      )
    );

    refreshHomeFacts();
  }

  function decorateRichContent(content) {
    if (!content) return;

    Array.prototype.forEach.call(content.querySelectorAll('table'), function (table) {
      table.classList.add('cecp-rich-table');
    });

    Array.prototype.forEach.call(content.querySelectorAll('img, iframe'), function (node) {
      node.classList.add('cecp-rich-media');
    });

    Array.prototype.forEach.call(content.querySelectorAll('.columns'), function (cols) {
      cols.classList.add('cecp-rich-columns');
    });
  }

  function fetchPageHtml(url) {
    return fetch(url, { credentials: 'same-origin' }).then(function (response) {
      if (!response.ok) throw new Error('Failed to load ' + url);
      return response.text();
    });
  }

  function parseScheduleFacts(html) {
    var normalized = String(html || '').replace(/<br\s*\/?>/gi, ' / ');
    var youthMatch = normalized.match(/青少年团契[\s\S]{0,220}?(\d{1,2}:\d{2}\s*[~\-]\s*\d{1,2}:\d{2})/);
    var worshipMatch = normalized.match(
      /主日崇拜[\s\S]{0,120}?(\d{1,2}:\d{2}\s*[~\-]\s*\d{1,2}:\d{2})[\s\S]{0,40}?(\d{1,2}:\d{2}\s*[~\-]\s*\d{1,2}:\d{2})/
    );
    var prayerMatch = normalized.match(/周间祷告会[\s\S]{0,220}?(\d{1,2}:\d{2}\s*[~\-]\s*\d{1,2}:\d{2})/);

    return [
      {
        title: '青少年团契',
        date: youthMatch ? '周日 ' + normalizeTimeRange(youthMatch[1]) : LIVE_SCHEDULE[0].date,
        body: '青年与学生聚会'
      },
      {
        title: '主日崇拜',
        date: worshipMatch
          ? '周日 ' +
            normalizeTimeRange(worshipMatch[1]) +
            ' / ' +
            normalizeTimeRange(worshipMatch[2])
          : LIVE_SCHEDULE[1].date,
        body: '下午场与晚间场'
      },
      {
        title: '周间祷告会',
        date: prayerMatch ? '周三 ' + normalizeTimeRange(prayerMatch[1]) : LIVE_SCHEDULE[2].date,
        body: '礼拜三晚间祷告'
      }
    ];
  }

  function parseContactFacts(html) {
    var addressMatch = html.match(/Via Ugo Foscolo,\s*6,\s*35131 Padova PD/i);
    var spacedPhones = html.match(/\b3\d{2}\s?\d{3}\s?\d{4}\b/g) || [];
    var telPhones = html.match(/tel:(\d{10})/g) || [];
    var phones = spacedPhones.slice();

    telPhones.forEach(function (item) {
      phones.push(item.replace('tel:', ''));
    });

    phones = phones
      .map(formatPhone)
      .filter(Boolean)
      .filter(function (value, index, list) {
        return list.indexOf(value) === index;
      });

    return {
      address: addressMatch ? addressMatch[0] : PREVIEW_DATA.contact.address,
      phone: phones.length ? phones.slice(0, 2).join(' / ') : PREVIEW_DATA.contact.phone
    };
  }

  function hydrateHomeFacts(data) {
    if (!data) return;

    var addressNode = document.querySelector('[data-cecp-address]');
    var phoneNode = document.querySelector('[data-cecp-phone]');

    if (addressNode && data.contact && data.contact.address) {
      addressNode.textContent = data.contact.address;
    }

    if (phoneNode && data.contact && data.contact.phone) {
      phoneNode.textContent = data.contact.phone;
    }

    if (data.schedule && data.schedule.length) {
      data.schedule.forEach(function (item) {
        var dateNode = document.querySelector('[data-cecp-schedule-date="' + item.title + '"]');
        var metaNode = document.querySelector('[data-cecp-schedule-meta="' + item.title + '"]');

        if (dateNode) dateNode.textContent = item.date;
        if (metaNode) metaNode.textContent = item.body;
      });
    }
  }

  function refreshHomeFacts() {
    if (factsPromise) return factsPromise;

    factsPromise = Promise.all([fetchPageHtml('/schedule'), fetchPageHtml('/contacts')])
      .then(function (pages) {
        var data = {
          schedule: parseScheduleFacts(pages[0]),
          contact: parseContactFacts(pages[1])
        };

        hydrateHomeFacts(data);
        return data;
      })
      .catch(function () {
        return null;
      });

    return factsPromise;
  }

  function ensureContentPageLayout() {
    var mainGrid = getContentMainGrid();
    var content = document.getElementById('content');
    var aside = mainGrid ? mainGrid.querySelector('aside') : null;
    var shell = content ? content.closest('div.rounded-xl') || content.parentElement : null;

    if (!mainGrid || !content || !shell) return;

    document.documentElement.classList.add('cecp-ui-ready', 'cecp-ui-page');
    document.documentElement.classList.remove('cecp-ui-home');

    mainGrid.classList.add('cecp-main-grid');
    shell.classList.add('cecp-content-shell');
    decorateRichContent(content);

    if (aside) {
      aside.classList.add('cecp-side-rail');
      Array.prototype.forEach.call(aside.children, function (card) {
        card.classList.add('cecp-side-card');
      });
    }

    reveal(
      document.querySelectorAll('.cecp-content-shell, .cecp-side-rail > .cecp-side-card')
    );
  }

  function bindDomObserver() {
    if (domObserver || !document.body || !('MutationObserver' in window)) return;

    domObserver = new MutationObserver(function () {
      clearTimeout(domObserverTimer);
      domObserverTimer = window.setTimeout(run, 180);
    });

    domObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function run() {
    if (applying) return;
    applying = true;

    try {
      injectStyles();

      if (isPreviewMode()) {
        mountPreview(OPTIONS.target || '#' + PREVIEW_ROOT_ID, OPTIONS.previewData);
        return;
      }

      markCommonLayout();
      bindScrollState();
      bindDomObserver();

      if (isHomePage()) ensureHomePageLayout();
      if (isContentPage()) ensureContentPageLayout();
    } finally {
      applying = false;
    }
  }

  window.CecpSiteGlobal = {
    mount: mountPreview,
    enhance: run,
    options: OPTIONS
  };
  window.CecpHaloHomeSample = window.CecpSiteGlobal;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
})();
