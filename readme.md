# Scrapper

Forex sentiment scraper. Pulls crowd positioning from **IG** and **MyFXBook**, computes a
per-currency short ratio, serves it over a REST API, and posts it to an external endpoint
after every run.

- Runtime: **Node.js 18+** (ESM)
- Store: `db.json` (lowdb) — no external DB
- Process manager: [pm2](https://pm2.keymetrics.io/)
- Full endpoint reference: see [API.md](API.md)

---

## How it works

### Data sources

| Source | How | Notes |
|--------|-----|-------|
| **IG** | scrape one HTML page per currency ([app/scrap/lib/ig.mjs](app/scrap/lib/ig.mjs)) | browser UA + retry; behind a WAF |
| **MyFXBook** | official JSON API, **one** call for all symbols ([app/scrap/lib/myfxbook.mjs](app/scrap/lib/myfxbook.mjs)) | auto login + auto re-login on expiry |

Config (currency lists, timing) lives in `db.json` → `CONSTANT[0]`. Secrets live in `.env`.

### Lifecycle ([index.mjs](index.mjs))

```
boot
 ├─ load .env, init db, reset RAW data
 ├─ start HTTP server
 ├─ arm daily scheduler (checks the clock every 1s)   ← non-blocking
 └─ run one scrape session immediately (background)
```

- **Scheduler**: every second, if the current time (Asia/Bahrain) matches a `repeat_at`
  entry (`06:00:00 / 14:00:00 / 22:00:00`) → start a session.
- A re-entrancy guard means the boot session and a scheduled session can never overlap.

### One session ([scrapAndSaveOnce](app/scrap/index.mjs))

```
step 0:  fetch ALL MyFXBook symbols once (cached in memory for the session)
each step (0 → last):
   ├─ scrape 1 IG page
   ├─ read that step's MyFXBook symbol from the cached map (no network)
   ├─ write RAW_IG[i] and RAW_MYFXBOOK[i] to db.json
   └─ wait `interval` seconds, then next step
session end:
   └─ POST computed result to the external endpoint (postback)
```

- Number of steps = `ig_urls.length`.
- `interval` = **seconds** between steps (editable at runtime, see below).
- MyFXBook hits the network only once per session; IG is one request per step.

---

## The calculation ([calculate()](app/scrap/index.mjs))

Produces the final array served by `GET /other/recent` and sent in the postback.

### Currency list & order

```
keys = unique( [ ...MyFXBook names, ...IG names ] )
```

- **MyFXBook order first**, then any **IG-only** names appended.
- A name in both lists appears **once**, in its MyFXBook position.

### Per-currency `shortPercent`

For each currency, resolve the short ratio (0–1) from one source, in priority order:

```
1. IG      (if scraped ok, status = 1)
2. MyFXBook (if scraped ok, status = 1)
3. default  → 0, status = 0
```

**Deriving the IG short ratio** (IG reports a side + a percent):

| IG `longShort` | short ratio |
|----------------|-------------|
| `short`        | `percent` |
| `long`         | `1 - percent` |

**MyFXBook** already gives the short ratio directly (`shortPercentage / 100`).

So for an **overlapping** currency: IG value wins if IG scraped ok; otherwise it falls
back to MyFXBook (no data is dropped just because IG failed that run).

### Output shape

```json
{
  "MYFXBOOK": [
    { "currency": "EURUSD", "shortPercent": 0.77, "status": 1, "createdAt": "2026-07-05T..." }
  ]
}
```

- `shortPercent`: number, 0–1, 2 decimals.
- `status`: `1` = real data, `0` = default / not scraped.
- `createdAt`: timestamp of the source row used.

---

## Postback (after every session)

The result above is POSTed to an external endpoint ([postSessionResult](app/scrap/index.mjs)).

- URL: `POSTBACK_URL` in `.env`
- `POST`, JSON body `{ "MYFXBOOK": [ ... ] }`
- 2 retries with backoff; failures are logged (never crash the session)

---

## Configuration

### `db.json` → `CONSTANT[0]`

| Field | Meaning |
|-------|---------|
| `factor` | (legacy signal threshold; not used by current shape) |
| `interval` | **seconds** between scrape steps |
| `repeat_at` | daily session start times, exact `HH:MM:SS` (Asia/Bahrain) |
| `ig_urls` | `[[url, name], ...]` — IG pages to scrape |
| `myFxBook_urls` | `[[url, name], ...]` — `url` ignored (API fetches all); only `name` used |

Change these live via `POST /admin/update` (see [API.md](API.md)).

### `.env`

```
NODE_ENV, HOST, PORT, TZ           # server
ADMIN_TOKEN                        # header token for /admin/*
MYFXBOOK_EMAIL, MYFXBOOK_PASSWORD  # MyFXBook API (free account)
POSTBACK_URL                       # where results are POSTed
```

Copy `.env.example` → `.env` and fill.

### What takes effect without a restart

| Change | Applies |
|--------|---------|
| `interval` | next step |
| `repeat_at` | next scheduler tick |
| `ig_urls` / `myFxBook_urls` | next session |

---

## API

Base: `http://HOST:PORT` (default `http://127.0.0.1:4000`). Full details in [API.md](API.md).

- `GET /other/recent` — computed short ratios (the array above)
- `GET /other/recent/ig` — raw IG data
- `GET /other/recent/myfxbook` — raw MyFXBook data
- `POST /admin/update` — change config at runtime (needs `token` header)
- `GET /admin/error_logs` — last errors

`requests.http` has ready-to-run requests (VS Code REST Client).

---

## Data stores (`db.json`)

| Key | Holds |
|-----|-------|
| `CONSTANT` | config (`CONSTANT[0]`) |
| `RAW_IG` | last scraped IG rows |
| `RAW_MYFXBOOK` | last scraped MyFXBook rows |
| `MYFX_SESSION` | cached MyFXBook API session token |
| `FINAL` | last computed combined signals |

Errors are **not** in `db.json` — they go to stderr, captured by pm2 in `logs/scrapper-error.log`. `GET /admin/error_logs` returns the last 10 lines of that file.

---

## Setup & running

Install dependencies (also installs pm2 globally via `preinstall`):

```sh
npm i
```

| Command | Action |
|---------|--------|
| `npm start` | run in foreground (local dev) |
| `npm run launch` | start under pm2 |
| `npm run restart` | restart pm2 process |
| `npm run stop` | stop |
| `npm run delete` | remove from pm2 |
| `npm run logs` | tail logs |
| `npm run list` | list pm2 processes |

### Boot persistence (optional)

Make pm2 resurrect the app on server reboot:

```sh
pm2 startup     # run the printed command once
npm run launch
pm2 save
```
