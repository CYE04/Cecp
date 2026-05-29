// ===== HBW Bible Worker (R2 local + YouVersion proxy) =====

// In-memory cache for R2 JSON (warm across requests on same isolate)
const MEM = globalThis.__HBW_R2_MEM__ || (globalThis.__HBW_R2_MEM__ = new Map());

const BOOK_USFM = [
  "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA",
  "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST", "JOB", "PSA", "PRO",
  "ECC", "SNG", "ISA", "JER", "LAM", "EZK", "DAN", "HOS", "JOL", "AMO",
  "OBA", "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL", "MAT",
  "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", "PHP",
  "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAS", "1PE",
  "2PE", "1JN", "2JN", "3JN", "JUD", "REV",
];

const YV_TRANSLATIONS = {
  CCB: { bibleId: "36", name: "当代圣经 (简体)" },
  RCUVSS: { bibleId: "140", name: "和合本修订版 (简体)" },
  NR06: { bibleId: "122", name: "Nuova Riveduta 2006 (Italiano)" },
  ESV: { bibleId: "59", name: "English Standard Version" },
};

function corsHeaders(req) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",
    "Access-Control-Allow-Headers": req.headers.get("Access-Control-Request-Headers") || "*",
  };
}

function json(obj, status = 200, headers = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...headers,
    },
  });
}

function text(str, status = 200, headers = {}) {
  return new Response(str, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      ...headers,
    },
  });
}

/** parse "1-2,5,9-11" => [1,2,5,9,10,11] */
function parseVerses(param) {
  if (!param) return [];
  const cleaned = String(param).trim().replace(/\s+/g, "").replace(/，/g, ",");
  if (!cleaned) return [];
  const out = [];
  for (const part of cleaned.split(",").filter(Boolean)) {
    if (part.includes("-")) {
      const [a0, b0] = part.split("-", 2);
      const a = Number(a0), b = Number(b0);
      if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) continue;
      const s = Math.min(a, b), e = Math.max(a, b);
      for (let i = s; i <= e; i++) out.push(i);
    } else {
      const n = Number(part);
      if (Number.isFinite(n) && n > 0) out.push(n);
    }
  }
  return Array.from(new Set(out)).sort((x, y) => x - y);
}

function getR2(env) {
  return env.BIBLES || env.bibles || null;
}

function getYouVersionAppKey(env) {
  return env.YVP_APP_KEY || env.YV_APP_KEY || env.YVP_KEY || env.YV_KEY || null;
}

function getUsfmBook(book) {
  return BOOK_USFM[book - 1] || null;
}

/** Try multiple key patterns so file naming doesn't break */
async function loadTranslation(env, translationRaw) {
  const r2 = getR2(env);
  if (!r2) throw new Error("R2 binding missing (need env.BIBLES or env.bibles)");

  const translation = String(translationRaw || "").trim().toUpperCase();
  if (!translation) throw new Error("Empty translation");

  const memKey = `T:${translation}`;
  if (MEM.has(memKey)) return MEM.get(memKey);

  // Try known names first
  const candidates = [];

  // Prefer your actual object names
  if (translation === "CUNPSS") candidates.push("bible_CUNPSS.json");
  if (translation === "NR06") candidates.push("bible_NR06.json");

  // Then generic
  candidates.push(`bible_${translation}.json`);
  candidates.push(`bible_${translation}.JSON`);
  candidates.push(`bible_${translationRaw}.json`);
  candidates.push(`bible_${translationRaw}.JSON`);

  let obj = null;
  let usedKey = null;
  for (const k of candidates) {
    obj = await r2.get(k);
    if (obj) { usedKey = k; break; }
  }

  if (!obj) {
    const outNF = { ok: false, error: "Translation file not found", translation, tried: candidates };
    MEM.set(memKey, outNF);
    return outNF;
  }

  const data = await obj.json();
  const out = { ok: true, translation, usedKey, data };
  MEM.set(memKey, out);
  return out;
}

/** nested: data[book][chapter] */
function getChapterData(nested, book, chapter) {
  const b = nested?.[book] ?? nested?.[String(book)];
  if (!b) return null;
  const ch = b?.[chapter] ?? b?.[String(chapter)];
  return ch ?? null;
}

/** chapterData may be Array or Object */
function getVerseText(chapterData, verseNum) {
  if (chapterData == null) return null;

  // Array: verse 1 at index 0
  if (Array.isArray(chapterData)) {
    const idx = verseNum - 1;
    if (idx < 0 || idx >= chapterData.length) return null;
    const v = chapterData[idx];
    return v == null ? null : String(v);
  }

  // Object: try 1-based then 0-based
  if (typeof chapterData === "object") {
    if (chapterData[String(verseNum)] != null) return String(chapterData[String(verseNum)]);
    const z = verseNum - 1;
    if (z >= 0 && chapterData[String(z)] != null) return String(chapterData[String(z)]);
  }

  return null;
}

function buildWholeChapter(chapterData, max = 300) {
  const verses = [];

  if (Array.isArray(chapterData)) {
    for (let i = 0; i < chapterData.length && verses.length < max; i++) {
      const tx = chapterData[i];
      if (tx == null) continue;
      verses.push({ verse: i + 1, text: String(tx) });
    }
    return verses;
  }

  if (chapterData && typeof chapterData === "object") {
    const keys = Object.keys(chapterData)
      .map(k => ({ k, n: Number(k) }))
      .filter(x => Number.isFinite(x.n))
      .sort((a, b) => a.n - b.n);

    for (const { k, n } of keys) {
      const tx = chapterData[k];
      if (tx == null) continue;
      const verse = (n === 0) ? 1 : n; // guess
      verses.push({ verse, text: String(tx) });
      if (verses.length >= max) break;
    }
    verses.sort((a, b) => a.verse - b.verse);
    return verses;
  }

  return verses;
}

function decodeEntities(str) {
  return String(str)
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function normalizeYvText(raw, verseNum) {
  return decodeEntities(raw || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[\u0000-\u001f\u007f-\u009f]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(new RegExp(`^\\s*[^\\d]{0,40}\\d+[:：.]${verseNum}\\s*`), "")
    .replace(new RegExp(`^\\s*(?:[^\\d\\s]+\\s+)?${verseNum}\\s*`), "")
    .trim();
}

async function fetchYouVersionJson(env, path) {
  const appKey = getYouVersionAppKey(env);
  if (!appKey) throw new Error("Missing env.YVP_APP_KEY for YouVersion");

  const res = await fetch(`https://api.youversion.com${path}`, {
    method: "GET",
    headers: {
      "X-YVP-App-Key": appKey,
      "accept": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`YouVersion ${res.status}: ${body.slice(0, 200)}`);
  }

  return res.json();
}

function verseNumberFromYvItem(item) {
  const raw =
    item?.verse ||
    item?.verse_id ||
    item?.id ||
    item?.title ||
    item?.passage_id ||
    "";
  const match = String(raw).match(/(?:^|\.)(\d+)$/);
  const n = match ? Number(match[1]) : Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function textFromYvItem(item, verseNum) {
  const raw =
    item?.text ||
    item?.content ||
    item?.body ||
    item?.html ||
    item?.formatted_text ||
    item?.usfm ||
    "";
  const text = normalizeYvText(raw, verseNum);
  return text || null;
}

function parseYvVerseCollection(payload) {
  const list = Array.isArray(payload?.data) ? payload.data : [];
  const verses = [];

  for (const item of list) {
    const verse = verseNumberFromYvItem(item);
    if (!verse) continue;
    const text = textFromYvItem(item, verse);
    if (!text) continue;
    verses.push({ verse, text });
  }

  return verses.sort((a, b) => a.verse - b.verse);
}

async function fetchYvChapterByVerse(env, bibleId, bookUsfm, chapter) {
  const chapterPayload = await fetchYouVersionJson(
    env,
    `/v1/bibles/${bibleId}/books/${bookUsfm}/chapters/${chapter}`
  );
  const chapterData = chapterPayload?.data || chapterPayload;
  const verseRefs = Array.isArray(chapterData?.verses) ? chapterData.verses : [];
  const verseNums = verseRefs
    .map(verseNumberFromYvItem)
    .filter(n => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);

  const uniqueVerseNums = Array.from(new Set(verseNums));
  const out = [];
  for (const verse of uniqueVerseNums) {
    const passage = `${bookUsfm}.${chapter}.${verse}`;
    const payload = await fetchYouVersionJson(
      env,
      `/v1/bibles/${bibleId}/passages/${passage}?format=text&include_headings=false&include_notes=false`
    );
    const text = normalizeYvText(payload?.content || payload?.data?.content || "", verse);
    if (text) out.push({ verse, text });
  }
  return out;
}

async function loadCachedYouVersionChapter(env, translation, book, chapter) {
  const r2 = getR2(env);
  if (!r2) throw new Error("R2 binding missing (need env.BIBLES or env.bibles)");

  const bookUsfm = getUsfmBook(book);
  if (!bookUsfm) throw new Error("Invalid book for YouVersion");

  const config = YV_TRANSLATIONS[translation];
  if (!config) throw new Error(`Unsupported YouVersion cached translation: ${translation}`);

  const bibleId = String(
    env[`${translation}_BIBLE_ID`] ||
    env[`YV_${translation}_BIBLE_ID`] ||
    config.bibleId
  ).trim();
  const key = `cache/${translation}/${book}/${chapter}.json`;
  const memKey = `YV:${translation}:${book}:${chapter}`;

  if (MEM.has(memKey)) {
    return { ok: true, source: "memory", cacheKey: key, data: MEM.get(memKey) };
  }

  const cached = await r2.get(key);
  if (cached) {
    const data = await cached.json();
    MEM.set(memKey, data);
    return { ok: true, source: "r2", cacheKey: key, data };
  }

  const collectionPayload = await fetchYouVersionJson(
    env,
    `/v1/bibles/${bibleId}/books/${bookUsfm}/chapters/${chapter}/verses`
  );
  let data = parseYvVerseCollection(collectionPayload);

  if (!data.length) {
    data = await fetchYvChapterByVerse(env, bibleId, bookUsfm, chapter);
  }

  if (!data.length) {
    throw new Error("YouVersion returned no verse text for this chapter");
  }

  await r2.put(key, JSON.stringify(data), {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
    customMetadata: {
      translation,
      bibleId,
      book: String(book),
      chapter: String(chapter),
      bookUsfm,
    },
  });
  MEM.set(memKey, data);

  return { ok: true, source: "youversion", cacheKey: key, bibleId, bookUsfm, data };
}

// ===== YouVersion proxy =====
// Requires env.YVP_APP_KEY secret (or aliases below)
async function proxyYouVersion(request, env, pathAfterV1) {
  const appKey = getYouVersionAppKey(env);
  if (!appKey) {
    return json(
      { ok: false, error: "Missing env.YVP_APP_KEY for YouVersion proxy" },
      500,
      corsHeaders(request)
    );
  }

  const upstream = new URL("https://api.youversion.com" + pathAfterV1);

  // preserve query string from original request
  const src = new URL(request.url);
  src.searchParams.forEach((v, k) => upstream.searchParams.set(k, v));

  const headers = new Headers();
  headers.set("X-YVP-App-Key", appKey);
  headers.set("accept", "application/json");

  const res = await fetch(upstream.toString(), {
    method: "GET",
    headers,
    cache: "no-store",
  });

  const body = await res.arrayBuffer();
  const outHeaders = new Headers(corsHeaders(request));
  outHeaders.set("content-type", res.headers.get("content-type") || "application/json; charset=utf-8");
  outHeaders.set("cache-control", "no-store");
  return new Response(body, { status: res.status, headers: outHeaders });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // OPTIONS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(request) });
    }

    // ===== Root help (so "/" won't show Invalid book) =====
    if (path === "/" && !url.searchParams.has("book") && !url.searchParams.has("translations") && !url.searchParams.has("translation")) {
      return text(
        "OK.\n\nTry:\n" +
          "/health\n" +
          "/versions\n" +
          "/?translations=CCB,RCUVSS,NR06,ESV&book=1&chapter=1&verses=1-2,5,9-11\n" +
          "/_cache/warm?translation=CCB&book=1&chapter=1\n" +
          "/_r2/list\n" +
          "/_r2/get/bible_CUNPSS.json\n" +
          "/v1/bibles/36/passages/GEN.1.1?format=text\n",
        200,
        { ...corsHeaders(request), "cache-control": "no-store" }
      );
    }

    // ===== YouVersion routes (support both /v1/... and /proxy/v1/...) =====
    if (path.startsWith("/v1/")) {
      return proxyYouVersion(request, env, path);
    }
    if (path.startsWith("/proxy/v1/")) {
      const p = path.replace(/^\/proxy/, "");
      return proxyYouVersion(request, env, p);
    }

    // ===== health =====
    if (path === "/health") {
      return json(
        {
          ok: true,
          hasR2: !!getR2(env),
          now: new Date().toISOString(),
        },
        200,
        { ...corsHeaders(request), "cache-control": "no-store" }
      );
    }

    // ===== versions =====
    if (path === "/versions") {
      return json(
        {
          ok: true,
          default: "CUNPSS",
          versions: [
            { code: "CUNPSS", name: "和合本 (简体)", source: "r2" },
            ...Object.entries(YV_TRANSLATIONS).map(([code, v]) => ({
              code,
              name: v.name,
              source: "youversion-cache",
              bibleId: v.bibleId,
            })),
            { code: "YV:<id>", name: "YouVersion via /v1 proxy", source: "youversion" },
          ],
        },
        200,
        { ...corsHeaders(request), "cache-control": "public, max-age=3600" }
      );
    }

    // ===== debug: list R2 =====
    if (path === "/_r2/list") {
      const r2 = getR2(env);
      if (!r2) return json({ ok: false, error: "R2 binding missing" }, 500, corsHeaders(request));
      const prefix = url.searchParams.get("prefix") || "";
      const limit = Math.min(1000, Math.max(1, Number(url.searchParams.get("limit") || 100)));
      const res = await r2.list({ prefix, limit });
      return json(
        {
          ok: true,
          prefix,
          limit,
          truncated: res.truncated,
          cursor: res.cursor || null,
          objects: res.objects.map(o => ({ key: o.key, size: o.size, uploaded: o.uploaded })),
        },
        200,
        { ...corsHeaders(request), "cache-control": "no-store" }
      );
    }

    // ===== cache warm: fetch one YouVersion chapter and store it in R2 =====
    if (path === "/_cache/warm") {
      const translation = String(url.searchParams.get("translation") || "CCB").trim().toUpperCase();
      const book = Number(url.searchParams.get("book"));
      const chapter = Number(url.searchParams.get("chapter") || 1);

      if (!YV_TRANSLATIONS[translation]) {
        return json(
          { ok: false, error: "Unsupported cached translation", supported: Object.keys(YV_TRANSLATIONS) },
          400,
          corsHeaders(request)
        );
      }
      if (!Number.isFinite(book) || book < 1 || book > 66) {
        return json({ ok: false, error: "Invalid book (1-66)" }, 400, corsHeaders(request));
      }
      if (!Number.isFinite(chapter) || chapter <= 0) {
        return json({ ok: false, error: "Invalid chapter" }, 400, corsHeaders(request));
      }

      try {
        const loaded = await loadCachedYouVersionChapter(env, translation, book, chapter);
        return json(
          {
            ok: true,
            translation,
            book,
            chapter,
            source: loaded.source,
            cacheKey: loaded.cacheKey,
            count: loaded.data.length,
          },
          200,
          { ...corsHeaders(request), "cache-control": "no-store" }
        );
      } catch (err) {
        return json(
          { ok: false, error: err?.message || String(err) },
          502,
          { ...corsHeaders(request), "cache-control": "no-store" }
        );
      }
    }

    // ===== debug: get R2 =====
    if (path.startsWith("/_r2/get/")) {
      const r2 = getR2(env);
      if (!r2) return json({ ok: false, error: "R2 binding missing" }, 500, corsHeaders(request));
      const key = decodeURIComponent(path.slice("/_r2/get/".length));
      const obj = await r2.get(key);
      if (!obj) return json({ ok: false, error: "Not found: " + key }, 404, corsHeaders(request));
      const headers = new Headers(corsHeaders(request));
      headers.set("content-type", obj.httpMetadata?.contentType || "application/octet-stream");
      headers.set("cache-control", "public, max-age=3600");
      return new Response(obj.body, { headers });
    }

    // ===== main bible endpoint =====
    // GET /?translations=CUNPSS,NR06&book=1&chapter=1&verses=1-2,5
    if (request.method !== "GET" && request.method !== "HEAD") {
      return json({ ok: false, error: "Method not allowed" }, 405, corsHeaders(request));
    }

    const book = Number(url.searchParams.get("book"));
    const chapter = Number(url.searchParams.get("chapter") || 1);
    const versesParam = url.searchParams.get("verses");
    const translationsParam =
      url.searchParams.get("translations") ||
      url.searchParams.get("translation") ||
      "CUNPSS";

    if (!Number.isFinite(book) || book < 1 || book > 66) {
      return json({ ok: false, error: "Invalid book (1-66)" }, 400, corsHeaders(request));
    }
    if (!Number.isFinite(chapter) || chapter <= 0) {
      return json({ ok: false, error: "Invalid chapter" }, 400, corsHeaders(request));
    }

    const translations = String(translationsParam)
      .split(",")
      .map(t => t.trim().toUpperCase())
      .filter(Boolean);

    if (!translations.length) {
      return json({ ok: false, error: "Empty translations" }, 400, corsHeaders(request));
    }

    const versesList = parseVerses(versesParam);

    const dataOut = {};
    const debug = {};

    for (const t of translations) {
      if (YV_TRANSLATIONS[t]) {
        try {
          const loaded = await loadCachedYouVersionChapter(env, t, book, chapter);
          const result = versesList.length
            ? loaded.data.filter(v => versesList.includes(v.verse))
            : loaded.data;
          dataOut[t] = result;
          debug[t] = {
            ok: true,
            source: loaded.source,
            cacheKey: loaded.cacheKey,
            bibleId: loaded.bibleId || YV_TRANSLATIONS[t].bibleId,
            count: result.length,
          };
        } catch (err) {
          dataOut[t] = [];
          debug[t] = { ok: false, error: err?.message || String(err) };
        }
        continue;
      }

      // Only CUNPSS is served from a whole local R2 JSON file by default.
      if (!["CUNPSS"].includes(t)) {
        dataOut[t] = [];
        debug[t] = { ok: false, error: "Unsupported translation" };
        continue;
      }

      const loaded = await loadTranslation(env, t);
      if (!loaded.ok) {
        dataOut[t] = [];
        debug[t] = loaded;
        continue;
      }

      const nested = loaded.data;
      const chapterData = getChapterData(nested, book, chapter);
      if (!chapterData) {
        dataOut[t] = [];
        debug[t] = { ok: false, error: "Invalid book or chapter", usedKey: loaded.usedKey };
        continue;
      }

      let result = [];
      if (!versesList.length) {
        result = buildWholeChapter(chapterData);
      } else {
        result = versesList
          .map(v => {
            const tx = getVerseText(chapterData, v);
            return tx == null ? null : { verse: v, text: tx };
          })
          .filter(Boolean);
      }

      dataOut[t] = result;
      debug[t] = { ok: true, usedKey: loaded.usedKey, count: result.length };
    }

    return json(
      {
        ok: true,
        book,
        chapter,
        verses: versesList.length ? versesList : null,
        translations,
        data: dataOut,
        debug,
      },
      200,
      { ...corsHeaders(request), "cache-control": "public, max-age=3600" }
    );
  },
};
