/* ✦ Designed & Built by YuEn © 2025–2026 ✦ */

/* shared/ir-to-musicxml.js — IR（shared/jp-ir.js）→ MusicXML 4.0 (score-partwise)
 *
 * 用途：把曲库导出成 MuseScore / Sibelius / Finale 能直接打开的标准格式。
 * 纯函数、无 DOM。规格见 musiclib-react-migration/STAFF_MODE_PLAN.md §3（Phase 4）。
 *
 * divisions 取 120（每四分音符）：
 *   IR 的时值单位是 1/32 音符，所以 1 IR 单位 = 15 divisions，四分 = 120。
 *   选 120 而不是 8 是为了让**连音符**的折算保持整数：
 *   三连音 ×2/3 → 八分 60→40、四分 120→80 都是整数；
 *   五连音 ×4/5 → 十六分 30→24 也是整数。取 8 的话三连音会除不尽。
 */
(function (root, factory) {
  var mod = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = mod;
  if (root) root.CecpIrToMusicXml = mod;
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this), function () {
  'use strict';

  var DIV_PER_QUARTER = 120;
  var DIV_PER_UNIT = DIV_PER_QUARTER / 8;        // IR 单位(1/32) → divisions

  var KEY_FIFTHS = {
    'C': 0, 'G': 1, 'D': 2, 'A': 3, 'E': 4, 'B': 5, 'F#': 6, 'C#': 7,
    'F': -1, 'Bb': -2, 'Eb': -3, 'Ab': -4, 'Db': -5, 'Gb': -6, 'Cb': -7
  };
  var SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
  var FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];
  var TYPE_BY_UNITS = { 64: 'breve', 32: 'whole', 16: 'half', 8: 'quarter', 4: 'eighth', 2: '16th', 1: '32nd' };
  var ACC_NAME = { 1: 'sharp', 2: 'double-sharp', '-1': 'flat', '-2': 'flat-flat', 0: 'natural' };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  /** 调号给某个字母音的固有升降（G 大调里 F 是 +1）。 */
  function keySigAlter(key, letter) {
    var n = KEY_FIFTHS[key]; if (n == null) n = 0;
    if (n > 0) return SHARP_ORDER.slice(0, n).indexOf(letter) >= 0 ? 1 : 0;
    if (n < 0) return FLAT_ORDER.slice(0, -n).indexOf(letter) >= 0 ? -1 : 0;
    return 0;
  }

  /* ── 和弦符号 → <harmony> ──────────────────────────────────────────────
     曲库里的和弦是自由文本（Cmaj7 / G/D / F#m7 / Gsus4 / 甚至 "To Chorus"）。
     认得出的映射到 MusicXML 的标准 kind，认不出的用 kind="other" 保留原文，
     宁可让打谱软件显示原样，也不要猜错。 */
  var KIND_MAP = [
    [/^maj7$|^M7$|^Δ7?$/i, 'major-seventh'], [/^maj9$/i, 'major-ninth'],
    [/^m7b5$|^ø7?$/i, 'half-diminished'], [/^dim7?$|^°7?$/i, 'diminished-seventh'],
    [/^m7$|^min7$/i, 'minor-seventh'], [/^m9$/i, 'minor-ninth'],
    [/^m6$/i, 'minor-sixth'], [/^m$|^min$|^-$/i, 'minor'],
    [/^7$/, 'dominant'], [/^9$/, 'dominant-ninth'], [/^11$/, 'dominant-11th'], [/^13$/, 'dominant-13th'],
    [/^6$/, 'major-sixth'], [/^69$|^6\/9$/i, 'major-sixth'],
    [/^sus4?$/i, 'suspended-fourth'], [/^sus2$/i, 'suspended-second'],
    [/^7sus4?$/i, 'suspended-fourth'], [/^aug$|^\+$/i, 'augmented'],
    [/^add9$/i, 'major'], [/^$/, 'major']
  ];
  /* 是不是「像和弦」——与 musiclib 的 isChordLikeToken 同一套判定（notation-spec §10）：
     根音 A–G，可带 #/b，其后第一个**小写字母**必须是 m/s/a/d 之一（maj/min/sus/add/dim）。
     不加这条的话 "To Chorus" 会被拆成 To / Chorus，而 Chorus 以 C 开头就被当成和弦了。 */
  function isChordLike(sym) {
    var t = String(sym || '').trim().replace(/^\(/, '');
    if (!/^[A-G]/.test(t)) return false;
    var rest = t.slice(1).replace(/^[#b]/, '');
    var lower = rest.match(/[a-z]/);
    return !lower || 'msad'.indexOf(lower[0]) >= 0;
  }

  function harmonyXml(sym, pad) {
    if (!isChordLike(sym)) return '';                    // 段落标记等自由文本，不产出和弦
    var m = String(sym || '').trim().match(/^([A-G])([#b]?)(.*?)(?:\/([A-G])([#b]?))?$/);
    if (!m) return '';
    var suffix = m[3] || '', kind = null, kindText = suffix;
    for (var i = 0; i < KIND_MAP.length; i++) if (KIND_MAP[i][0].test(suffix)) { kind = KIND_MAP[i][1]; break; }
    var out = [];
    out.push(pad + '<harmony>');
    out.push(pad + '  <root><root-step>' + m[1] + '</root-step>' +
      (m[2] ? '<root-alter>' + (m[2] === '#' ? 1 : -1) + '</root-alter>' : '') + '</root>');
    out.push(pad + '  <kind' + (kind ? '' : ' text="' + esc(kindText) + '"') + '>' + (kind || 'other') + '</kind>');
    if (m[4]) out.push(pad + '  <bass><bass-step>' + m[4] + '</bass-step>' +
      (m[5] ? '<bass-alter>' + (m[5] === '#' ? 1 : -1) + '</bass-alter>' : '') + '</bass>');
    out.push(pad + '</harmony>');
    return out.join('\n');
  }

  /**
   * @param {object} ir   jp-ir 产出的 IR
   * @param {object} [opts] { octaveShift, lyrics }
   */
  function irToMusicXml(ir, opts) {
    opts = opts || {};
    var key = ir.meta.key;
    var shift = (opts.octaveShift == null) ? (ir.meta.octaveShift || 0) : opts.octaveShift;
    var wantLyrics = (opts.lyrics !== false) && ir.meta.lyricsAvailable !== 'none';

    var L = [];
    L.push('<?xml version="1.0" encoding="UTF-8"?>');
    L.push('<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">');
    L.push('<score-partwise version="4.0">');
    L.push('  <work><work-title>' + esc(ir.meta.title) + '</work-title></work>');
    L.push('  <identification>');
    if (ir.meta.artist) L.push('    <creator type="composer">' + esc(ir.meta.artist) + '</creator>');
    L.push('    <encoding><software>CECP jp-ir</software><encoding-date>' +
      new Date().toISOString().slice(0, 10) + '</encoding-date></encoding>');
    L.push('  </identification>');
    L.push('  <part-list><score-part id="P1"><part-name>' + esc(ir.meta.title || 'Voice') + '</part-name></score-part></part-list>');
    L.push('  <part id="P1">');

    var measureNo = 0, curTs = null, wroteAttrs = false, slurSeq = 0, openSlurs = {};
    var lastSection = null;

    ir.sections.forEach(function (sec) {
      sec.measures.forEach(function (m) {
        if (!m.events.length && m.openBarline === 'none' && !m.volta) return;
        measureNo++;
        L.push('    <measure number="' + measureNo + '">');

        /* 段落名作为文字标记，打谱软件里会显示在小节上方 */
        if (sec.name && sec.name !== lastSection) {
          L.push('      <direction placement="above"><direction-type><words>' +
            esc(sec.name) + '</words></direction-type></direction>');
          lastSection = sec.name;
        }

        /* attributes：只在开头与拍号变化时写 */
        var tsChanged = m.timeSign !== curTs;
        if (!wroteAttrs || tsChanged) {
          var p = String(m.timeSign || '4/4').split('/');
          L.push('      <attributes>');
          if (!wroteAttrs) L.push('        <divisions>' + DIV_PER_QUARTER + '</divisions>');
          if (!wroteAttrs) L.push('        <key><fifths>' + (KEY_FIFTHS[key] || 0) + '</fifths><mode>major</mode></key>');
          L.push('        <time><beats>' + p[0] + '</beats><beat-type>' + p[1] + '</beat-type></time>');
          if (!wroteAttrs) L.push('        <clef><sign>G</sign><line>2</line></clef>');
          L.push('      </attributes>');
          curTs = m.timeSign; wroteAttrs = true;
        }

        /* 左侧小节线：反复开始 / 跳房子开始 */
        if (m.openBarline === 'repeat-start' || m.volta) {
          L.push('      <barline location="left">');
          if (m.openBarline === 'repeat-start') {
            L.push('        <bar-style>heavy-light</bar-style>');
            L.push('        <repeat direction="forward"/>');
          }
          if (m.volta) {
            var num = /^[0-9]+$/.test(String(m.volta)) ? String(m.volta) : '1';
            L.push('        <ending number="' + num + '" type="start">' + esc(m.volta) + '</ending>');
          }
          L.push('      </barline>');
        }

        m.events.forEach(function (e) {
          if (e.chordSymbol) {
            var h = harmonyXml(e.chordSymbol, '      ');
            if (h) L.push(h);
          }
          var tm = e.tuplet ? (e.tuplet.num === 3 ? [3, 2] : [5, 4]) : null;
          var pieces = e.pieces && e.pieces.length ? e.pieces : [{ units: e.units, dots: 0 }];

          pieces.forEach(function (piece, pi) {
            var dur = piece.units * DIV_PER_UNIT;
            if (tm) dur = dur * tm[1] / tm[0];
            /* MusicXML 的 <type> 写的是**基础时值**，附点另用 <dot/> 表示。
               splitDurable 给的 units 是含附点的总时值（附点二分 = 24），
               所以要先除掉附点系数再查表：24 / 1.5 = 16 → half。
               不除的话会写成 <type>quarter</type> + <dot/>，与 duration 对不上。 */
            var baseUnits = piece.units / (piece.dots ? 1.5 : 1);
            var type = TYPE_BY_UNITS[baseUnits] || 'quarter';
            var heads = (e.kind === 'rest' || !e.pitches.length) ? [null] : e.pitches;

            heads.forEach(function (pt, hi) {
              L.push('      <note>');
              if (hi > 0) L.push('        <chord/>');
              if (!pt) L.push('        <rest/>');
              else {
                var oct = pt.octave + shift;
                L.push('        <pitch><step>' + pt.step + '</step>' +
                  (pt.alter ? '<alter>' + pt.alter + '</alter>' : '') +
                  '<octave>' + oct + '</octave></pitch>');
              }
              L.push('        <duration>' + Math.round(dur) + '</duration>');
              /* tie 是**发声**层面的连接，tied 是记谱层面的弧线，两个都要写 */
              if (e.tieStart && pi === pieces.length - 1) L.push('        <tie type="start"/>');
              if (e.tieStop && pi === 0) L.push('        <tie type="stop"/>');
              if (pi > 0) L.push('        <tie type="stop"/>');
              if (pi < pieces.length - 1) L.push('        <tie type="start"/>');
              L.push('        <voice>1</voice>');
              L.push('        <type>' + type + '</type>');
              for (var d = 0; d < (piece.dots || 0); d++) L.push('        <dot/>');
              if (pt) {
                var want = pt.alter, have = keySigAlter(key, pt.step);
                if (want !== have && ACC_NAME[want] != null)
                  L.push('        <accidental>' + ACC_NAME[want] + '</accidental>');
              }
              if (tm) L.push('        <time-modification><actual-notes>' + tm[0] +
                '</actual-notes><normal-notes>' + tm[1] + '</normal-notes></time-modification>');

              /* notations：弧线 / 连音符 / 延长记号 —— 只挂在和弦的第一个音上 */
              var nots = [];
              if (hi === 0) {
                if (e.tieStop && pi === 0) nots.push('<tied type="stop"/>');
                if (pi > 0) nots.push('<tied type="stop"/>');
                if (e.tieStart && pi === pieces.length - 1) nots.push('<tied type="start"/>');
                if (pi < pieces.length - 1) nots.push('<tied type="start"/>');
                (e.slurStops || []).forEach(function (id) {
                  var n = openSlurs[id]; if (n) { nots.push('<slur type="stop" number="' + n + '"/>'); delete openSlurs[id]; }
                });
                (e.slurStarts || []).forEach(function (id) {
                  var n = (slurSeq++ % 6) + 1; openSlurs[id] = n;
                  nots.push('<slur type="start" number="' + n + '"/>');
                });
                if (e.tuplet && e.tuplet.pos === 'start') nots.push('<tuplet type="start" bracket="yes"/>');
                if (e.tuplet && e.tuplet.pos === 'stop') nots.push('<tuplet type="stop"/>');
                if (e.fermata) nots.push('<fermata/>');
              }
              if (nots.length) L.push('        <notations>' + nots.join('') + '</notations>');

              /* 歌词：只挂第一个音头、第一个片段；melisma 与续音不给词 */
              if (wantLyrics && hi === 0 && pi === 0 && pt && e.lyrics) {
                e.lyrics.forEach(function (syl, vi) {
                  if (!syl) return;
                  L.push('        <lyric number="' + (vi + 1) + '"><syllabic>single</syllabic><text>' +
                    esc(syl) + '</text></lyric>');
                });
              }
              L.push('      </note>');
            });
          });
        });

        /* 右侧小节线 */
        var close = m.closeBarline;
        if (close && close !== 'normal') {
          L.push('      <barline location="right">');
          L.push('        <bar-style>' + (close === 'final' ? 'light-heavy' :
            close === 'double' ? 'light-light' : 'light-heavy') + '</bar-style>');
          if (m.volta) {
            var num2 = /^[0-9]+$/.test(String(m.volta)) ? String(m.volta) : '1';
            L.push('        <ending number="' + num2 + '" type="stop"/>');
          }
          if (close === 'repeat-end') L.push('        <repeat direction="backward"/>');
          L.push('      </barline>');
        }
        L.push('    </measure>');
      });
    });

    L.push('  </part>');
    L.push('</score-partwise>');
    return L.join('\n') + '\n';
  }

  return { irToMusicXml: irToMusicXml, keySigAlter: keySigAlter, isChordLike: isChordLike, DIV_PER_QUARTER: DIV_PER_QUARTER };
});
