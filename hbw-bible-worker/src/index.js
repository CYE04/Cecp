// ===== HBW Bible Worker (R2 local + YouVersion proxy) =====

// In-memory cache for R2 JSON (warm across requests on same isolate)
const MEM = globalThis.__HBW_R2_MEM__ || (globalThis.__HBW_R2_MEM__ = new Map());

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

// ===== YouVersion proxy =====
// Requires env.YVP_APP_KEY secret (or aliases below)
async function proxyYouVersion(request, env, pathAfterV1) {
  const appKey = env.YVP_APP_KEY || env.YV_APP_KEY || env.YVP_KEY || env.YV_KEY;
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
          "/?translations=CUNPSS,NR06&book=1&chapter=1&verses=1-2,5,9-11\n" +
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
            { code: "NR06", name: "Nuova Riveduta 2006", source: "r2" },
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
      // Only R2 translations served here (CUNPSS/NR06).
      if (!["CUNPSS", "NR06"].includes(t)) {
        dataOut[t] = [];
        debug[t] = { ok: false, error: "Unsupported here (use YouVersion via /v1 proxy if YV:...)" };
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
