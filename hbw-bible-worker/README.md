# HBW Bible Worker

Cloudflare Worker for serving local Bible JSON files from R2 and proxying YouVersion API requests.

## Files

- `src/index.js` - Worker code.
- `wrangler.toml` - Cloudflare Worker configuration.
- `package.json` - Local scripts and Wrangler dependency.

## Cloudflare setup

Before connecting this repository to your existing Worker, update `wrangler.toml`:

- `name` must match the existing Cloudflare Worker name exactly.
- `bucket_name` must match the existing R2 bucket that stores the Bible JSON files.
- The R2 binding name must stay `BIBLES`, because the code reads `env.BIBLES`.

If YouVersion proxy routes are used, add a Cloudflare secret named `YVP_APP_KEY`.

## YouVersion chapter cache

The Worker can cache these YouVersion-backed translations by chapter:

- `CCB` - YouVersion Bible ID `36`
- `RCUVSS` - YouVersion Bible ID `140`
- `NR06` - YouVersion Bible ID `122`
- `ESV` - YouVersion Bible ID `59`

The Worker fetches the requested chapter from YouVersion only when it is missing, then stores the normalized verse JSON in R2 under:

```txt
cache/{translation}/{book}/{chapter}.json
```

You can warm one chapter before a service:

```txt
/_cache/warm?translation=CCB&book=1&chapter=1
/_cache/warm?translation=RCUVSS&book=1&chapter=1
/_cache/warm?translation=NR06&book=1&chapter=1
/_cache/warm?translation=ESV&book=1&chapter=1
```

## Scripts

```sh
npm run check
npm run dev
npm run deploy
```
