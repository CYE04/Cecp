(function () {
  'use strict';

  var storageKey = 'cecp-theme-preview-preference';
  var root = document.documentElement;
  var toggle = document.querySelector('[data-theme-toggle]');
  var label = document.querySelector('[data-theme-label]');
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function resolveTheme(preference) {
    if (preference === 'dark') return 'dark';
    if (preference === 'light') return 'light';
    return media && media.matches ? 'dark' : 'light';
  }

  function readPreference() {
    try {
      return localStorage.getItem(storageKey) || 'light';
    } catch (error) {
      return 'light';
    }
  }

  function writePreference(value) {
    try {
      localStorage.setItem(storageKey, value);
    } catch (error) {
      return;
    }
  }

  function labelFor(preference) {
    if (preference === 'light') return '浅色';
    if (preference === 'dark') return '深色';
    return '跟随系统';
  }

  function applyTheme(preference) {
    var theme = resolveTheme(preference);
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-theme-preference', preference);
    if (label) label.textContent = labelFor(preference);
    if (toggle) {
      toggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      toggle.setAttribute('title', '当前模式：' + labelFor(preference) + '，点击切换');
    }
  }

  var currentPreference = readPreference();
  applyTheme(currentPreference);

  if (toggle) {
    toggle.addEventListener('click', function () {
      currentPreference =
        currentPreference === 'light'
          ? 'dark'
          : currentPreference === 'dark'
            ? 'auto'
            : 'light';
      writePreference(currentPreference);
      applyTheme(currentPreference);
    });
  }

  if (media) {
    var handleChange = function () {
      if (currentPreference === 'auto') {
        applyTheme(currentPreference);
      }
    };

    if ('addEventListener' in media) {
      media.addEventListener('change', handleChange);
    } else if ('addListener' in media) {
      media.addListener(handleChange);
    }
  }

  var nodes = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || !nodes.length) {
    Array.prototype.forEach.call(nodes, function (node) {
      node.classList.add('is-visible');
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: '0px 0px -48px 0px'
    }
  );

  Array.prototype.forEach.call(nodes, function (node) {
    observer.observe(node);
  });
})();



@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Serif+SC:wght@500;700&display=swap');

:root {
  --bg: #fbfcff;
  --bg-soft: #f3f7ff;
  --bg-warm: #fff8f0;
  --surface: rgba(255, 255, 255, 0.78);
  --surface-strong: rgba(255, 255, 255, 0.98);
  --surface-muted: #f7f9fd;
  --surface-accent: #edf4ff;
  --line: rgba(24, 49, 82, 0.12);
  --line-strong: rgba(24, 49, 82, 0.18);
  --ink: #183152;
  --muted: #66788f;
  --primary: #2f78ff;
  --primary-soft: rgba(47, 120, 255, 0.12);
  --coral: #ff8f58;
  --coral-soft: rgba(255, 143, 88, 0.12);
  --mint: #24b898;
  --mint-soft: rgba(36, 184, 152, 0.12);
  --gold: #f3d26b;
  --shadow: 0 36px 88px rgba(32, 63, 110, 0.15);
  --shadow-soft: 0 18px 42px rgba(32, 63, 110, 0.11);
  --radius-xxl: 40px;
  --radius-xl: 32px;
  --radius-lg: 24px;
  --radius-md: 18px;
  --radius-sm: 14px;
}

html[data-theme='dark'] {
  --bg: #09131f;
  --bg-soft: #102033;
  --bg-warm: #13263a;
  --surface: rgba(16, 29, 47, 0.82);
  --surface-strong: #13253b;
  --surface-muted: #102133;
  --surface-accent: #142b45;
  --line: rgba(255, 255, 255, 0.08);
  --line-strong: rgba(255, 255, 255, 0.15);
  --ink: #edf5ff;
  --muted: #a9bfd3;
  --primary: #7aa8ff;
  --primary-soft: rgba(122, 168, 255, 0.14);
  --coral: #ffb18d;
  --coral-soft: rgba(255, 177, 141, 0.12);
  --mint: #6addc4;
  --mint-soft: rgba(106, 221, 196, 0.12);
  --gold: #ffd87a;
  --shadow: 0 34px 90px rgba(0, 0, 0, 0.34);
  --shadow-soft: 0 18px 46px rgba(0, 0, 0, 0.26);
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  min-height: 100vh;
  color: var(--ink);
  font-family: 'Plus Jakarta Sans', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background:
    radial-gradient(circle at 12% 18%, rgba(47, 120, 255, 0.11), transparent 24%),
    radial-gradient(circle at 86% 12%, rgba(255, 143, 88, 0.1), transparent 20%),
    linear-gradient(180deg, var(--bg) 0%, var(--bg-soft) 58%, var(--bg-warm) 100%);
}

a {
  color: inherit;
  text-decoration: none;
}

.page-glow {
  position: fixed;
  z-index: 0;
  border-radius: 999px;
  pointer-events: none;
  filter: blur(16px);
  opacity: 0.46;
}

.page-glow-a {
  top: 80px;
  right: -120px;
  width: 360px;
  height: 360px;
  background: radial-gradient(circle, rgba(255, 143, 88, 0.22), transparent 70%);
}

.page-glow-b {
  left: -100px;
  top: 520px;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(36, 184, 152, 0.18), transparent 70%);
}

.theme-shell {
  position: relative;
  z-index: 1;
  width: min(1260px, calc(100% - 36px));
  margin: 0 auto;
  padding: 18px 0 72px;
}

.topbar,
.hero-photo-card,
.footer {
  border: 1px solid var(--line);
  background: var(--surface);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(22px);
}

.stat-card,
.intro-item,
.schedule-panel,
.side-card,
.link-card,
.life-card,
.update-feature,
.update-compact,
.contact-card,
.map-card,
.mini-card {
  border: 1px solid var(--line);
  background: var(--surface-strong);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(22px);
}

.topbar {
  position: sticky;
  top: 16px;
  z-index: 30;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 18px;
  padding: 14px 18px;
  border-radius: 28px;
}

.brand {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.brand-kicker,
.eyebrow,
.link-kicker,
.update-badge,
.mini-label,
.stat-label,
.contact-label,
.schedule-when {
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.brand-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 20px;
  font-weight: 700;
}

.nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.nav a {
  padding: 10px 14px;
  border-radius: 999px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
  transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.nav a:hover {
  background: var(--surface-strong);
  color: var(--ink);
  transform: translateY(-1px);
}

.topbar-tools {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-cta,
.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--surface-strong);
  color: var(--ink);
  font-size: 13px;
  font-weight: 800;
}

.nav-cta {
  background: linear-gradient(135deg, var(--primary-soft), rgba(255, 255, 255, 0.84));
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.nav-cta:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-soft);
}

.theme-toggle {
  cursor: pointer;
  font-family: inherit;
}

.theme-toggle-track {
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--surface-muted), var(--surface-accent));
}

.theme-toggle-dot {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--coral));
  box-shadow: 0 6px 14px rgba(24, 49, 82, 0.2);
  transition: transform 0.25s ease;
}

html[data-theme-preference='auto'] .theme-toggle-dot {
  transform: translateX(10px);
}

html[data-theme-preference='dark'] .theme-toggle-dot {
  transform: translateX(20px);
}

.theme-toggle-text {
  white-space: nowrap;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 0.95fr);
  gap: 30px;
  align-items: center;
  margin-top: 30px;
}

.hero-copy {
  padding: 12px 4px 0;
}

.hero h1 {
  margin: 14px 0 0;
  font-family: 'Noto Serif SC', serif;
  font-size: clamp(48px, 6.6vw, 82px);
  line-height: 0.98;
  letter-spacing: -0.06em;
}

.hero-lead {
  max-width: 620px;
  margin: 20px 0 0;
  color: var(--muted);
  font-size: 18px;
  line-height: 1.9;
}

.hero-actions,
.contact-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 26px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 50px;
  padding: 0 20px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 14px;
  font-weight: 800;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.btn:hover {
  transform: translateY(-2px);
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary), #4f95ff);
  color: #fff;
  box-shadow: 0 14px 28px rgba(47, 120, 255, 0.24);
}

.btn-secondary {
  background: var(--surface-strong);
  border-color: var(--line);
  color: var(--ink);
}

.btn-soft {
  background: linear-gradient(135deg, var(--surface-muted), var(--surface-accent));
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 26px;
}

.stat-card {
  padding: 18px;
  border-radius: 20px;
}

.stat-value {
  margin-top: 8px;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.6;
}

.hero-stage {
  position: relative;
  padding-bottom: 94px;
}

.hero-photo-card {
  overflow: hidden;
  padding: 16px;
  border-radius: var(--radius-xxl);
}

.hero-photo {
  position: relative;
  min-height: 560px;
  border-radius: 28px;
  background:
    linear-gradient(160deg, rgba(18, 40, 70, 0.24), rgba(18, 40, 70, 0.02)),
    url('https://www.cecp.it/upload/7b007e922adadf1680e299b9d06e6fb4.jpeg') center/cover;
}

.photo-badge {
  position: absolute;
  left: 18px;
  top: 18px;
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: #173152;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero-photo-note {
  padding: 18px 6px 6px;
}

.hero-photo-note h2,
.section-head h2,
.panel-top h3,
.side-card h3,
.link-card h3,
.life-card h3,
.update-feature h3,
.update-compact h3 {
  margin: 10px 0 0;
  font-family: 'Noto Serif SC', serif;
  line-height: 1.18;
}

.hero-photo-note h2 {
  font-size: 28px;
}

.hero-photo-note p,
.section-copy,
.side-card p,
.link-card p,
.life-card p,
.update-feature p,
.update-compact p,
.contact-value,
.contact-card p,
.schedule-item p,
.intro-copy p {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.85;
}

.hero-photo-note p {
  margin-top: 12px;
}

.hero-floating {
  position: absolute;
  left: -18px;
  right: 36px;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.mini-card {
  padding: 18px;
  border-radius: 22px;
}

.mini-value {
  margin-top: 8px;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.5;
}

.mini-card p {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.7;
}

.intro-band,
.link-grid,
.life-grid,
.updates-layout,
.visit-layout {
  margin-top: 18px;
}

.intro-band {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.intro-item {
  display: flex;
  gap: 16px;
  padding: 20px;
  border-radius: 24px;
}

.intro-number,
.life-no {
  font-family: 'Noto Serif SC', serif;
  font-size: 38px;
  line-height: 1;
  color: rgba(47, 120, 255, 0.28);
}

html[data-theme='dark'] .intro-number,
html[data-theme='dark'] .life-no {
  color: rgba(122, 168, 255, 0.32);
}

.intro-copy h3 {
  margin: 0;
  font-size: 20px;
  line-height: 1.3;
}

.section {
  margin-top: 28px;
}

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: 0 4px;
}

.section-head h2 {
  font-size: 34px;
}

.section-copy {
  max-width: 470px;
}

.schedule-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(300px, 0.82fr);
  gap: 18px;
}

.schedule-panel,
.side-card,
.link-card,
.life-card,
.update-feature,
.update-compact,
.contact-card,
.map-card,
.footer {
  border-radius: var(--radius-xl);
}

.schedule-panel {
  padding: 28px;
  background:
    linear-gradient(145deg, var(--surface-strong), var(--surface-accent)),
    var(--surface);
}

.schedule-list {
  display: grid;
  gap: 14px;
  margin-top: 20px;
}

.schedule-item {
  padding: 20px 22px;
  border-radius: 22px;
  border: 1px solid var(--line);
  background: var(--surface-strong);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.schedule-item:hover,
.link-card:hover,
.life-card:hover,
.update-feature:hover,
.update-compact:hover,
.contact-card:hover,
.map-card:hover {
  transform: translateY(-4px);
  border-color: var(--line-strong);
  box-shadow: var(--shadow);
}

.schedule-item.is-primary {
  background:
    linear-gradient(145deg, rgba(47, 120, 255, 0.11), rgba(255, 255, 255, 0.96)),
    var(--surface-strong);
}

.schedule-name {
  margin-top: 10px;
  font-size: 24px;
  font-weight: 800;
}

.schedule-time {
  margin-top: 8px;
  color: var(--ink);
  font-size: 16px;
  font-weight: 800;
  line-height: 1.6;
}

.schedule-item p {
  margin-top: 8px;
}

.side-stack {
  display: grid;
  gap: 16px;
}

.side-card {
  padding: 24px;
}

.side-card h3 {
  font-size: 28px;
}

.side-card p {
  margin-top: 12px;
}

.side-card-accent {
  background:
    linear-gradient(150deg, var(--coral-soft), rgba(255, 255, 255, 0.9)),
    var(--surface);
}

.inline-link {
  display: inline-flex;
  margin-top: 12px;
  color: var(--primary);
  font-size: 14px;
  font-weight: 800;
}

.link-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.link-card {
  min-height: 236px;
  padding: 22px;
  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}

.link-card:nth-child(1) {
  background: linear-gradient(150deg, var(--primary-soft), rgba(255, 255, 255, 0.96));
}

.link-card:nth-child(2) {
  background: linear-gradient(150deg, var(--coral-soft), rgba(255, 255, 255, 0.96));
}

.link-card:nth-child(3) {
  background: linear-gradient(150deg, var(--mint-soft), rgba(255, 255, 255, 0.96));
}

.link-card:nth-child(4) {
  background: linear-gradient(150deg, rgba(243, 210, 107, 0.12), rgba(255, 255, 255, 0.96));
}

.link-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.82);
  color: var(--ink);
  font-size: 13px;
  font-weight: 800;
}

.link-card h3 {
  font-size: 25px;
}

.link-card p {
  margin-top: 12px;
}

.life-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr 0.85fr;
  gap: 16px;
}

.life-card {
  min-height: 220px;
  padding: 24px;
  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}

.life-card-feature {
  grid-row: span 2;
  min-height: 456px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background:
    linear-gradient(160deg, rgba(47, 120, 255, 0.12), rgba(255, 255, 255, 0.92)),
    var(--surface);
}

.life-card-feature h3 {
  font-size: 40px;
}

.life-card h3 {
  font-size: 28px;
}

.life-card p {
  margin-top: 12px;
}

.updates-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);
  gap: 18px;
}

.update-feature,
.update-compact {
  overflow: hidden;
  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}

.update-media {
  aspect-ratio: 16 / 10;
  background-position: center;
  background-size: cover;
}

.update-body {
  padding: 24px;
}

.update-feature h3 {
  font-size: 32px;
}

.update-feature p {
  margin-top: 12px;
}

.updates-stack {
  display: grid;
  gap: 18px;
}

.update-compact {
  display: grid;
  grid-template-columns: 168px minmax(0, 1fr);
}

.update-compact-media {
  min-height: 100%;
  background-position: center;
  background-size: cover;
}

.update-compact-body {
  padding: 22px;
}

.update-compact h3 {
  font-size: 24px;
}

.update-compact p {
  margin-top: 10px;
}

.visit-layout {
  display: grid;
  grid-template-columns: minmax(0, 0.94fr) minmax(0, 1.06fr);
  gap: 18px;
}

.contact-card {
  padding: 28px;
  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}

.contact-grid {
  display: grid;
  gap: 14px;
}

.contact-item {
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);
}

.contact-item:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.contact-value {
  margin-top: 8px;
  color: var(--ink);
  font-size: 16px;
  font-weight: 700;
}

.map-card {
  overflow: hidden;
  min-height: 100%;
  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}

.map-card iframe {
  width: 100%;
  height: 100%;
  min-height: 430px;
  border: 0;
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 26px;
  padding: 22px 26px;
}

.footer-brand {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.footer-brand strong {
  font-size: 18px;
}

.footer-brand span,
.footer-links span {
  color: var(--muted);
  font-size: 13px;
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;
}

.reveal {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.75s ease, transform 0.75s ease;
}

.reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}

@media (max-width: 1140px) {
  .topbar {
    grid-template-columns: 1fr;
    justify-items: start;
  }

  .nav {
    justify-content: flex-start;
  }

  .hero,
  .schedule-layout,
  .updates-layout,
  .visit-layout {
    grid-template-columns: 1fr;
  }

  .hero-stage {
    padding-bottom: 0;
  }

  .hero-floating {
    position: static;
    margin-top: 14px;
  }

  .link-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .life-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .life-card-feature {
    grid-column: 1 / -1;
    grid-row: auto;
    min-height: 320px;
  }
}

@media (max-width: 820px) {
  .theme-shell {
    width: min(100%, calc(100% - 20px));
  }

  .hero h1 {
    font-size: clamp(38px, 12vw, 62px);
  }

  .hero-lead {
    font-size: 16px;
  }

  .hero-stats,
  .intro-band,
  .hero-floating,
  .link-grid,
  .life-grid {
    grid-template-columns: 1fr;
  }

  .section-head,
  .footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .section-head h2,
  .panel-top h3,
  .side-card h3,
  .update-feature h3,
  .life-card-feature h3 {
    font-size: 30px;
  }

  .update-compact {
    grid-template-columns: 1fr;
  }

  .update-compact-media {
    min-height: 220px;
  }
}

@media (max-width: 640px) {
  .topbar,
  .hero-photo-card,
  .schedule-panel,
  .side-card,
  .link-card,
  .life-card,
  .contact-card,
  .footer {
    border-radius: 24px;
  }

  .topbar-tools {
    width: 100%;
    flex-wrap: wrap;
  }

  .nav {
    width: 100%;
  }

  .nav a,
  .nav-cta,
  .theme-toggle,
  .btn {
    width: 100%;
    justify-content: center;
  }

  .hero-photo {
    min-height: 420px;
  }

  .photo-badge {
    max-width: calc(100% - 36px);
    text-align: center;
    line-height: 1.4;
    padding-top: 8px;
    padding-bottom: 8px;
  }

  .section-head h2,
  .hero-photo-note h2,
  .panel-top h3,
  .side-card h3,
  .life-card h3,
  .update-feature h3,
  .update-compact h3 {
    font-size: 26px;
  }

  .map-card iframe {
    min-height: 320px;
  }
}
