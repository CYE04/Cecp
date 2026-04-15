/*!
 * CECP Theme Preview — theme-preview.js
 * 自注入样式 + 明暗切换 + 滚动显现
 * https://github.com/CYE04/Cecp
 */
(function () {
  'use strict';

  /* ─── 1. 注入 CSS ─────────────────────────────────────────────────── */
  var CSS = '@import url(\'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Serif+SC:wght@500;700&display=swap\');\n\n:root {\n  --bg: #fbfcff;\n  --bg-soft: #f3f7ff;\n  --bg-warm: #fff8f0;\n  --surface: rgba(255, 255, 255, 0.78);\n  --surface-strong: rgba(255, 255, 255, 0.98);\n  --surface-muted: #f7f9fd;\n  --surface-accent: #edf4ff;\n  --line: rgba(24, 49, 82, 0.12);\n  --line-strong: rgba(24, 49, 82, 0.18);\n  --ink: #183152;\n  --muted: #66788f;\n  --primary: #2f78ff;\n  --primary-soft: rgba(47, 120, 255, 0.12);\n  --coral: #ff8f58;\n  --coral-soft: rgba(255, 143, 88, 0.12);\n  --mint: #24b898;\n  --mint-soft: rgba(36, 184, 152, 0.12);\n  --gold: #f3d26b;\n  --shadow: 0 36px 88px rgba(32, 63, 110, 0.15);\n  --shadow-soft: 0 18px 42px rgba(32, 63, 110, 0.11);\n  --radius-xxl: 40px;\n  --radius-xl: 32px;\n  --radius-lg: 24px;\n  --radius-md: 18px;\n  --radius-sm: 14px;\n}\n\nhtml[data-theme=\'dark\'] {\n  --bg: #09131f;\n  --bg-soft: #102033;\n  --bg-warm: #13263a;\n  --surface: rgba(16, 29, 47, 0.82);\n  --surface-strong: #13253b;\n  --surface-muted: #102133;\n  --surface-accent: #142b45;\n  --line: rgba(255, 255, 255, 0.08);\n  --line-strong: rgba(255, 255, 255, 0.15);\n  --ink: #edf5ff;\n  --muted: #a9bfd3;\n  --primary: #7aa8ff;\n  --primary-soft: rgba(122, 168, 255, 0.14);\n  --coral: #ffb18d;\n  --coral-soft: rgba(255, 177, 141, 0.12);\n  --mint: #6addc4;\n  --mint-soft: rgba(106, 221, 196, 0.12);\n  --gold: #ffd87a;\n  --shadow: 0 34px 90px rgba(0, 0, 0, 0.34);\n  --shadow-soft: 0 18px 46px rgba(0, 0, 0, 0.26);\n}\n\n* { box-sizing: border-box; }\n\nhtml { scroll-behavior: smooth; }\n\nbody {\n  margin: 0;\n  min-height: 100vh;\n  color: var(--ink);\n  font-family: \'Plus Jakarta Sans\', \'PingFang SC\', \'Microsoft YaHei\', sans-serif;\n  background:\n    radial-gradient(circle at 12% 18%, rgba(47, 120, 255, 0.11), transparent 24%),\n    radial-gradient(circle at 86% 12%, rgba(255, 143, 88, 0.1), transparent 20%),\n    linear-gradient(180deg, var(--bg) 0%, var(--bg-soft) 58%, var(--bg-warm) 100%);\n}\n\na { color: inherit; text-decoration: none; }\n\n.page-glow {\n  position: fixed;\n  z-index: 0;\n  border-radius: 999px;\n  pointer-events: none;\n  filter: blur(16px);\n  opacity: 0.46;\n}\n\n.page-glow-a {\n  top: 80px;\n  right: -120px;\n  width: 360px;\n  height: 360px;\n  background: radial-gradient(circle, rgba(255, 143, 88, 0.22), transparent 70%);\n}\n\n.page-glow-b {\n  left: -100px;\n  top: 520px;\n  width: 300px;\n  height: 300px;\n  background: radial-gradient(circle, rgba(36, 184, 152, 0.18), transparent 70%);\n}\n\n.theme-shell {\n  position: relative;\n  z-index: 1;\n  width: min(1260px, calc(100% - 36px));\n  margin: 0 auto;\n  padding: 18px 0 72px;\n}\n\n.topbar,\n.hero-photo-card,\n.footer {\n  border: 1px solid var(--line);\n  background: var(--surface);\n  box-shadow: var(--shadow-soft);\n  backdrop-filter: blur(22px);\n}\n\n.stat-card,\n.intro-item,\n.schedule-panel,\n.side-card,\n.link-card,\n.life-card,\n.update-feature,\n.update-compact,\n.contact-card,\n.map-card,\n.mini-card {\n  border: 1px solid var(--line);\n  background: var(--surface-strong);\n  box-shadow: var(--shadow-soft);\n  backdrop-filter: blur(22px);\n}\n\n.topbar {\n  position: sticky;\n  top: 16px;\n  z-index: 30;\n  display: grid;\n  grid-template-columns: auto 1fr auto;\n  align-items: center;\n  gap: 18px;\n  padding: 14px 18px;\n  border-radius: 28px;\n}\n\n.brand { display: flex; flex-direction: column; gap: 4px; }\n\n.brand-kicker,\n.eyebrow,\n.link-kicker,\n.update-badge,\n.mini-label,\n.stat-label,\n.contact-label,\n.schedule-when {\n  color: var(--muted);\n  font-size: 11px;\n  font-weight: 800;\n  letter-spacing: 0.18em;\n  text-transform: uppercase;\n}\n\n.brand-title { font-family: \'Noto Serif SC\', serif; font-size: 20px; font-weight: 700; }\n\n.nav { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }\n\n.nav a {\n  padding: 10px 14px;\n  border-radius: 999px;\n  color: var(--muted);\n  font-size: 13px;\n  font-weight: 700;\n  transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;\n}\n\n.nav a:hover {\n  background: var(--surface-strong);\n  color: var(--ink);\n  transform: translateY(-1px);\n}\n\n.topbar-tools { display: flex; align-items: center; gap: 10px; }\n\n.nav-cta,\n.theme-toggle {\n  display: inline-flex;\n  align-items: center;\n  gap: 10px;\n  min-height: 44px;\n  padding: 0 14px;\n  border-radius: 999px;\n  border: 1px solid var(--line);\n  background: var(--surface-strong);\n  color: var(--ink);\n  font-size: 13px;\n  font-weight: 800;\n}\n\n.nav-cta {\n  background: linear-gradient(135deg, var(--primary-soft), rgba(255, 255, 255, 0.84));\n  transition: transform 0.18s ease, box-shadow 0.18s ease;\n}\n\n.nav-cta:hover { transform: translateY(-1px); box-shadow: var(--shadow-soft); }\n\n.theme-toggle { cursor: pointer; font-family: inherit; }\n\n.theme-toggle-track {\n  position: relative;\n  width: 44px;\n  height: 24px;\n  border-radius: 999px;\n  background: linear-gradient(135deg, var(--surface-muted), var(--surface-accent));\n}\n\n.theme-toggle-dot {\n  position: absolute;\n  top: 3px;\n  left: 3px;\n  width: 18px;\n  height: 18px;\n  border-radius: 50%;\n  background: linear-gradient(135deg, var(--primary), var(--coral));\n  box-shadow: 0 6px 14px rgba(24, 49, 82, 0.2);\n  transition: transform 0.25s ease;\n}\n\nhtml[data-theme-preference=\'auto\'] .theme-toggle-dot  { transform: translateX(10px); }\nhtml[data-theme-preference=\'dark\'] .theme-toggle-dot  { transform: translateX(20px); }\n\n.theme-toggle-text { white-space: nowrap; }\n\n.hero {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) minmax(360px, 0.95fr);\n  gap: 30px;\n  align-items: center;\n  margin-top: 30px;\n}\n\n.hero-copy { padding: 12px 4px 0; }\n\n.hero h1 {\n  margin: 14px 0 0;\n  font-family: \'Noto Serif SC\', serif;\n  font-size: clamp(48px, 6.6vw, 82px);\n  line-height: 0.98;\n  letter-spacing: -0.06em;\n}\n\n.hero-lead { max-width: 620px; margin: 20px 0 0; color: var(--muted); font-size: 18px; line-height: 1.9; }\n\n.hero-actions,\n.contact-actions {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n  margin-top: 26px;\n}\n\n.btn {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  min-height: 50px;\n  padding: 0 20px;\n  border-radius: 999px;\n  border: 1px solid transparent;\n  font-size: 14px;\n  font-weight: 800;\n  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;\n}\n\n.btn:hover { transform: translateY(-2px); }\n\n.btn-primary {\n  background: linear-gradient(135deg, var(--primary), #4f95ff);\n  color: #fff;\n  box-shadow: 0 14px 28px rgba(47, 120, 255, 0.24);\n}\n\n.btn-secondary { background: var(--surface-strong); border-color: var(--line); color: var(--ink); }\n\n.btn-soft { background: linear-gradient(135deg, var(--surface-muted), var(--surface-accent)); }\n\n.hero-stats {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 14px;\n  margin-top: 26px;\n}\n\n.stat-card { padding: 18px; border-radius: 20px; }\n\n.stat-value { margin-top: 8px; font-size: 15px; font-weight: 800; line-height: 1.6; }\n\n.hero-stage { position: relative; padding-bottom: 94px; }\n\n.hero-photo-card { overflow: hidden; padding: 16px; border-radius: var(--radius-xxl); }\n\n.hero-photo {\n  position: relative;\n  min-height: 560px;\n  border-radius: 28px;\n  background:\n    linear-gradient(160deg, rgba(18, 40, 70, 0.24), rgba(18, 40, 70, 0.02)),\n    url(\'https://www.cecp.it/upload/7b007e922adadf1680e299b9d06e6fb4.jpeg\') center/cover;\n}\n\n.photo-badge {\n  position: absolute;\n  left: 18px;\n  top: 18px;\n  display: inline-flex;\n  align-items: center;\n  min-height: 34px;\n  padding: 0 14px;\n  border-radius: 999px;\n  background: rgba(255, 255, 255, 0.82);\n  color: #173152;\n  font-size: 12px;\n  font-weight: 800;\n  letter-spacing: 0.12em;\n  text-transform: uppercase;\n}\n\n.hero-photo-note { padding: 18px 6px 6px; }\n\n.hero-photo-note h2,\n.section-head h2,\n.panel-top h3,\n.side-card h3,\n.link-card h3,\n.life-card h3,\n.update-feature h3,\n.update-compact h3 {\n  margin: 10px 0 0;\n  font-family: \'Noto Serif SC\', serif;\n  line-height: 1.18;\n}\n\n.hero-photo-note h2 { font-size: 28px; }\n\n.hero-photo-note p,\n.section-copy,\n.side-card p,\n.link-card p,\n.life-card p,\n.update-feature p,\n.update-compact p,\n.contact-value,\n.contact-card p,\n.schedule-item p,\n.intro-copy p {\n  margin: 0;\n  color: var(--muted);\n  font-size: 14px;\n  line-height: 1.85;\n}\n\n.hero-photo-note p { margin-top: 12px; }\n\n.hero-floating {\n  position: absolute;\n  left: -18px;\n  right: 36px;\n  bottom: 0;\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: 14px;\n}\n\n.mini-card { padding: 18px; border-radius: 22px; }\n\n.mini-value { margin-top: 8px; font-size: 16px; font-weight: 800; line-height: 1.5; }\n\n.mini-card p { margin: 8px 0 0; color: var(--muted); font-size: 13px; line-height: 1.7; }\n\n.intro-band,\n.link-grid,\n.life-grid,\n.updates-layout,\n.visit-layout { margin-top: 18px; }\n\n.intro-band {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 16px;\n}\n\n.intro-item { display: flex; gap: 16px; padding: 20px; border-radius: 24px; }\n\n.intro-number,\n.life-no {\n  font-family: \'Noto Serif SC\', serif;\n  font-size: 38px;\n  line-height: 1;\n  color: rgba(47, 120, 255, 0.28);\n}\n\nhtml[data-theme=\'dark\'] .intro-number,\nhtml[data-theme=\'dark\'] .life-no { color: rgba(122, 168, 255, 0.32); }\n\n.intro-copy h3 { margin: 0; font-size: 20px; line-height: 1.3; }\n\n.section { margin-top: 28px; }\n\n.section-head {\n  display: flex;\n  align-items: flex-end;\n  justify-content: space-between;\n  gap: 24px;\n  padding: 0 4px;\n}\n\n.section-head h2 { font-size: 34px; }\n\n.section-copy { max-width: 470px; }\n\n.schedule-layout {\n  display: grid;\n  grid-template-columns: minmax(0, 1.1fr) minmax(300px, 0.82fr);\n  gap: 18px;\n}\n\n.schedule-panel,\n.side-card,\n.link-card,\n.life-card,\n.update-feature,\n.update-compact,\n.contact-card,\n.map-card,\n.footer { border-radius: var(--radius-xl); }\n\n.schedule-panel {\n  padding: 28px;\n  background:\n    linear-gradient(145deg, var(--surface-strong), var(--surface-accent)),\n    var(--surface);\n}\n\n.schedule-list { display: grid; gap: 14px; margin-top: 20px; }\n\n.schedule-item {\n  padding: 20px 22px;\n  border-radius: 22px;\n  border: 1px solid var(--line);\n  background: var(--surface-strong);\n  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;\n}\n\n.schedule-item:hover,\n.link-card:hover,\n.life-card:hover,\n.update-feature:hover,\n.update-compact:hover,\n.contact-card:hover,\n.map-card:hover {\n  transform: translateY(-4px);\n  border-color: var(--line-strong);\n  box-shadow: var(--shadow);\n}\n\n.schedule-item.is-primary {\n  background:\n    linear-gradient(145deg, rgba(47, 120, 255, 0.11), rgba(255, 255, 255, 0.96)),\n    var(--surface-strong);\n}\n\n.schedule-name { margin-top: 10px; font-size: 24px; font-weight: 800; }\n\n.schedule-time { margin-top: 8px; color: var(--ink); font-size: 16px; font-weight: 800; line-height: 1.6; }\n\n.schedule-item p { margin-top: 8px; }\n\n.side-stack { display: grid; gap: 16px; }\n\n.side-card { padding: 24px; }\n\n.side-card h3 { font-size: 28px; }\n\n.side-card p { margin-top: 12px; }\n\n.side-card-accent {\n  background:\n    linear-gradient(150deg, var(--coral-soft), rgba(255, 255, 255, 0.9)),\n    var(--surface);\n}\n\n.inline-link { display: inline-flex; margin-top: 12px; color: var(--primary); font-size: 14px; font-weight: 800; }\n\n.link-grid {\n  display: grid;\n  grid-template-columns: repeat(4, minmax(0, 1fr));\n  gap: 16px;\n}\n\n.link-card {\n  min-height: 236px;\n  padding: 22px;\n  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;\n}\n\n.link-card:nth-child(1) { background: linear-gradient(150deg, var(--primary-soft), rgba(255, 255, 255, 0.96)); }\n.link-card:nth-child(2) { background: linear-gradient(150deg, var(--coral-soft), rgba(255, 255, 255, 0.96)); }\n.link-card:nth-child(3) { background: linear-gradient(150deg, var(--mint-soft), rgba(255, 255, 255, 0.96)); }\n.link-card:nth-child(4) { background: linear-gradient(150deg, rgba(243, 210, 107, 0.12), rgba(255, 255, 255, 0.96)); }\n\n.link-icon {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 42px;\n  height: 42px;\n  border-radius: 50%;\n  background: rgba(255, 255, 255, 0.82);\n  color: var(--ink);\n  font-size: 13px;\n  font-weight: 800;\n}\n\n.link-card h3 { font-size: 25px; }\n\n.link-card p { margin-top: 12px; }\n\n.life-grid {\n  display: grid;\n  grid-template-columns: 1.15fr 0.85fr 0.85fr;\n  gap: 16px;\n}\n\n.life-card {\n  min-height: 220px;\n  padding: 24px;\n  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;\n}\n\n.life-card-feature {\n  grid-row: span 2;\n  min-height: 456px;\n  display: flex;\n  flex-direction: column;\n  justify-content: flex-end;\n  background:\n    linear-gradient(160deg, rgba(47, 120, 255, 0.12), rgba(255, 255, 255, 0.92)),\n    var(--surface);\n}\n\n.life-card-feature h3 { font-size: 40px; }\n\n.life-card h3 { font-size: 28px; }\n\n.life-card p { margin-top: 12px; }\n\n.updates-layout {\n  display: grid;\n  grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);\n  gap: 18px;\n}\n\n.update-feature,\n.update-compact {\n  overflow: hidden;\n  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;\n}\n\n.update-media { aspect-ratio: 16 / 10; background-position: center; background-size: cover; }\n\n.update-body { padding: 24px; }\n\n.update-feature h3 { font-size: 32px; }\n\n.update-feature p { margin-top: 12px; }\n\n.updates-stack { display: grid; gap: 18px; }\n\n.update-compact {\n  display: grid;\n  grid-template-columns: 168px minmax(0, 1fr);\n}\n\n.update-compact-media { min-height: 100%; background-position: center; background-size: cover; }\n\n.update-compact-body { padding: 22px; }\n\n.update-compact h3 { font-size: 24px; }\n\n.update-compact p { margin-top: 10px; }\n\n.visit-layout {\n  display: grid;\n  grid-template-columns: minmax(0, 0.94fr) minmax(0, 1.06fr);\n  gap: 18px;\n}\n\n.contact-card {\n  padding: 28px;\n  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;\n}\n\n.contact-grid { display: grid; gap: 14px; }\n\n.contact-item { padding-bottom: 14px; border-bottom: 1px solid var(--line); }\n\n.contact-item:last-child { padding-bottom: 0; border-bottom: 0; }\n\n.contact-value { margin-top: 8px; color: var(--ink); font-size: 16px; font-weight: 700; }\n\n.map-card {\n  overflow: hidden;\n  min-height: 100%;\n  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;\n}\n\n.map-card iframe { width: 100%; height: 100%; min-height: 430px; border: 0; }\n\n.footer {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 20px;\n  margin-top: 26px;\n  padding: 22px 26px;\n}\n\n.footer-brand { display: flex; flex-direction: column; gap: 6px; }\n\n.footer-brand strong { font-size: 18px; }\n\n.footer-brand span,\n.footer-links span { color: var(--muted); font-size: 13px; }\n\n.footer-links { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 12px; }\n\n.reveal {\n  opacity: 0;\n  transform: translateY(28px);\n  transition: opacity 0.75s ease, transform 0.75s ease;\n}\n\n.reveal.is-visible { opacity: 1; transform: translateY(0); }\n\n@media (max-width: 1140px) {\n  .topbar { grid-template-columns: 1fr; justify-items: start; }\n  .nav { justify-content: flex-start; }\n  .hero,\n  .schedule-layout,\n  .updates-layout,\n  .visit-layout { grid-template-columns: 1fr; }\n  .hero-stage { padding-bottom: 0; }\n  .hero-floating { position: static; margin-top: 14px; }\n  .link-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n  .life-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n  .life-card-feature { grid-column: 1 / -1; grid-row: auto; min-height: 320px; }\n}\n\n@media (max-width: 820px) {\n  .theme-shell { width: min(100%, calc(100% - 20px)); }\n  .hero h1 { font-size: clamp(38px, 12vw, 62px); }\n  .hero-lead { font-size: 16px; }\n  .hero-stats,\n  .intro-band,\n  .hero-floating,\n  .link-grid,\n  .life-grid { grid-template-columns: 1fr; }\n  .section-head,\n  .footer { flex-direction: column; align-items: flex-start; }\n  .section-head h2,\n  .panel-top h3,\n  .side-card h3,\n  .update-feature h3,\n  .life-card-feature h3 { font-size: 30px; }\n  .update-compact { grid-template-columns: 1fr; }\n  .update-compact-media { min-height: 220px; }\n}\n\n@media (max-width: 640px) {\n  .topbar,\n  .hero-photo-card,\n  .schedule-panel,\n  .side-card,\n  .link-card,\n  .life-card,\n  .contact-card,\n  .footer { border-radius: 24px; }\n  .topbar-tools { width: 100%; flex-wrap: wrap; }\n  .nav { width: 100%; }\n  .nav a,\n  .nav-cta,\n  .theme-toggle,\n  .btn { width: 100%; justify-content: center; }\n  .hero-photo { min-height: 420px; }\n  .photo-badge {\n    max-width: calc(100% - 36px);\n    text-align: center;\n    line-height: 1.4;\n    padding-top: 8px;\n    padding-bottom: 8px;\n  }\n  .section-head h2,\n  .hero-photo-note h2,\n  .panel-top h3,\n  .side-card h3,\n  .life-card h3,\n  .update-feature h3,\n  .update-compact h3 { font-size: 26px; }\n  .map-card iframe { min-height: 320px; }\n}';

  (function injectStyles() {
    // 避免重复注入
    if (document.getElementById('cecp-theme-preview-style')) return;
    var el = document.createElement('style');
    el.id = 'cecp-theme-preview-style';
    el.textContent = CSS;
    document.head.appendChild(el);
  })();

  /* ─── 2. 明暗切换 ─────────────────────────────────────────────────── */
  var STORAGE_KEY = 'cecp-theme-preference';
  var root   = document.documentElement;
  var toggle = document.querySelector('[data-theme-toggle]');
  var label  = document.querySelector('[data-theme-label]');
  var media  = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function resolveTheme(pref) {
    if (pref === 'dark')  return 'dark';
    if (pref === 'light') return 'light';
    return media && media.matches ? 'dark' : 'light'; // 'auto'
  }

  function readPreference() {
    try { return localStorage.getItem(STORAGE_KEY) || 'auto'; } catch (e) { return 'auto'; }
  }

  function writePreference(val) {
    try { localStorage.setItem(STORAGE_KEY, val); } catch (e) { /* 忽略 */ }
  }

  function labelFor(pref) {
    if (pref === 'light') return '浅色';
    if (pref === 'dark')  return '深色';
    return '跟随系统';
  }

  function applyTheme(pref) {
    var theme = resolveTheme(pref);
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-theme-preference', pref);
    if (label)  label.textContent = labelFor(pref);
    if (toggle) {
      toggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      toggle.setAttribute('title', '当前模式：' + labelFor(pref) + '，点击切换');
    }
  }

  var currentPref = readPreference();
  applyTheme(currentPref);

  if (toggle) {
    toggle.addEventListener('click', function () {
      // 循环顺序：light → dark → auto → light
      currentPref = currentPref === 'light' ? 'dark'
                  : currentPref === 'dark'  ? 'auto'
                  : 'light';
      writePreference(currentPref);
      applyTheme(currentPref);
    });
  }

  if (media) {
    var onSystemChange = function () {
      if (currentPref === 'auto') applyTheme('auto');
    };
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', onSystemChange);
    } else if (typeof media.addListener === 'function') {
      media.addListener(onSystemChange); // Safari < 14 fallback
    }
  }

  /* ─── 3. 滚动显现（.reveal） ──────────────────────────────────────── */
  var nodes = document.querySelectorAll('.reveal');

  if (!nodes.length) return; // 页面无 .reveal 元素则结束

  if (!('IntersectionObserver' in window)) {
    // 不支持时直接显示
    Array.prototype.forEach.call(nodes, function (n) { n.classList.add('is-visible'); });
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
    { threshold: 0.16, rootMargin: '0px 0px -48px 0px' }
  );

  Array.prototype.forEach.call(nodes, function (n) { observer.observe(n); });

})();
