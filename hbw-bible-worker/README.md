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

## Scripts

```sh
npm run check
npm run dev
npm run deploy
```
