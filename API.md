# Scrapper API

Forex sentiment scraper. Scrapes IG, MyFXBook → stores in `db.json` → serves combined signals.

- **Base URL**: `http://127.0.0.1:4000` (`HOST`/`PORT` from [env.mjs](env.mjs))
- **Format**: JSON unless noted
- **CORS**: `Access-Control-Allow-Origin: *`, methods `GET, POST`, headers `X-Requested-With, content-type`
- **Rate limit**: only `POST /admin/update` — 10 req/min/IP

## Auth

`/admin/*` routes require a header:

```
token: scrap_2022
```

Missing/wrong → `200 OK` body `invalid token` ([routers/index.mjs](app/routers/index.mjs#L21)).
`/other/*` and `/` need no auth.

---

## Root

### `GET /`
Health string.

**Response** (`text/plain`): `welcome /\`

---

## `/other` — read data (no auth)

### `GET /other/ping`
**Response** (`text/plain`): `OK (/other/ping)`

### `GET /other/recent`
Per-currency short ratio for **all** currencies (IG list + MyFXBook list, union). Computed by `calculate()` ([scrap/index.mjs](app/scrap/index.mjs)).

**Response**:
```json
{
  "MYFXBOOK": [
    {
      "currency": "EURUSD",
      "shortPercent": 0.77,
      "status": 1,
      "createdAt": "2026-07-05T00:00:00.000Z"
    }
  ]
}
```
- `shortPercent`: short ratio 0–1 (number, 2 decimals). Source priority: **IG → MyFXBook → 0**.
  - IG derives it: `longShort=='short'` → `percent`; `longShort=='long'` → `1 - percent`.
  - MyFXBook provides it directly.
- `status`: `1` = real data (IG or MyFXBook scraped ok), `0` = default/not found.
- `createdAt`: timestamp from the chosen source row.
- Array covers every currency in `ig_urls` + `myFxBook_urls` (IG order first).

### `GET /other/recent_old`
Legacy variant. Same data as `/recent` but under key `FX`.

### `GET /other/recent/ig`
Raw IG data (normalized to short %).

**Response**:
```json
{
  "IG": [
    { "currency": "EURUSD", "shortPercent": 0.55, "status": 1, "createdAt": "2026-06-28T06:01:00.000Z" }
  ]
}
```
- `shortPercent`: if source was `long`, returned as `1 - percent`.
- `status`: `1` scraped OK, `0` failed/default.

### `GET /other/recent/myfxbook`
Raw MyFXBook data.

**Response**:
```json
{
  "MYFXBOOK": [
    { "currency": "EURUSD", "shortPercent": 0.55, "status": 1, "createdAt": "2026-06-28T06:01:00.000Z" }
  ]
}
```

---

## `/admin` — config & maintenance (auth required)

### `GET /admin/ping`
**Headers**: `token: scrap_2022`
**Response** (`text/plain`): `OK (/admin/ping)`

### `POST /admin/update`
Update scraper config. Rate limited 10/min. Stored as new `CONSTANT[0]` (old kept trimmed). Any omitted field keeps its old value.

**Headers**: `token: scrap_2022`, `Content-Type: application/json`

**Body** (all optional):
```json
{
  "factor": 0.3,
  "interval": 1,
  "repeat_at": ["06:00:00", "14:00:00", "22:00:00"],
  "ig_urls": [["https://www.ig.com/.../eur-usd", "EURUSD"]],
  "myFxBook_urls": [["https://www.myfxbook.com/.../eurusd", "EURUSD"]]
}
```
| Field | Type | Role |
|-------|------|------|
| `factor` | number | Signal threshold (`|long-short| > factor` → not FLAT) |
| `interval` | number | Seconds between each scrape step (delay) |
| `repeat_at` | string[] | Daily start times, exact `HH:MM:SS` (Asia/Bahrain) |
| `ig_urls` | [url, name][] | IG pairs (only replaces if non-empty array) |
| `myFxBook_urls` | [url, name][] | MyFXBook pairs (only replaces if non-empty array) |

**Response**: the saved `CONSTANT[0]` object (JSON).

### `GET /admin/error_logs`
Last error log entries (max ~10).

**Headers**: `token: scrap_2022`

**Response**:
```json
[ { "message": "...", "method": "scrapIG", "createdAt": "6/28/2026, ...", "trace": "..." } ]
```

### `POST /admin/reset/log`
Clear `ERROR` array.

**Headers**: `token: scrap_2022`
**Response** (`text/plain`): `ok`

### `POST /admin/reset/all`
Clear `ERROR`, `RAW_IG`, `RAW_MYFXBOOK`.

**Headers**: `token: scrap_2022`
**Response** (`text/plain`): `ok`

---

## Errors

No HTTP error codes — all responses `200`. Failure signaled in body:
- Read routes (`/other/*`): on error, controller sets internal error then `json`/`send` returns `text/plain` `server error`.
- `/admin` auth fail: body `invalid token`.

## Scheduling (context)

Not an endpoint — runs internally ([index.mjs](index.mjs)):
- Every 1s, if current time ∈ `repeat_at` → start a session.
- Session = 64 steps (driven by `ig_urls.length`), `interval` **seconds** apart.
- **IG**: 1 page scrape per step (64 total).
- **MyFXBook**: whole community outlook fetched **once** per session (step 0), then each step reads its symbol from that cached map — no per-step network.

## Postback (outbound, after each session)

When a session completes (all steps done), the computed signals are POSTed to an external endpoint ([scrap/index.mjs](app/scrap/index.mjs) `postSessionResult`).

- **URL**: `POSTBACK_URL` env (default `http://95.111.231.83/api/forex_ssi/myfxbook`)
- **Method**: `POST`, `Content-Type: application/json`
- **Body**: `{ "MYFXBOOK": [ {currency, shortPercent, status, createdAt}, ... ] }` (same array as GET /other/recent)
- **Retry**: 2 retries w/ backoff; failure is logged (ERROR), never crashes the session.

---

## Upstream data sources (external APIs we call)

### IG
Per-symbol HTML page scrape (cheerio), [scrap/lib/ig.mjs](app/scrap/lib/ig.mjs). One `GET` per `ig_urls` entry. No auth. Not behind Cloudflare.

### MyFXBook — official JSON API
[scrap/lib/myfxbook.mjs](app/scrap/lib/myfxbook.mjs). Free account required. Creds in `.env` (`MYFXBOOK_EMAIL`, `MYFXBOOK_PASSWORD`). Two calls per session.

Base: `https://www.myfxbook.com/api`

#### 1. `GET /login.json`
Auth → session token.

**Query**: `email`, `password` (URL-encoded).

```
GET https://www.myfxbook.com/api/login.json?email=<enc>&password=<enc>
```

**Response**:
```json
{ "error": false, "message": "", "session": "PBefMWhnLBCoF0%2Bwp..." }
```
- `session`: already URL-encoded — pass **raw** to next call, do NOT re-encode (double-encode → `Invalid session`).
- On bad creds: `{ "error": true, "message": "Wrong email/password.", "session": "" }`.

#### 2. `GET /get-community-outlook.json`
All symbols' sentiment in **one** call (~186 symbols).

**Query**: `session` (raw from login).

```
GET https://www.myfxbook.com/api/get-community-outlook.json?session=<session>
```

**Response**:
```json
{
  "error": false,
  "message": "",
  "symbols": [
    {
      "name": "EURUSD",
      "shortPercentage": 35,
      "longPercentage": 65,
      "shortVolume": 5293.13,
      "longVolume": 9895.38,
      "longPositions": 29620,
      "shortPositions": 16112,
      "totalPositions": 45732,
      "avgShortPrice": 1.1195,
      "avgLongPrice": 1.1544
    }
  ]
}
```
- `shortPercentage` / `longPercentage`: integer **0–100**. We store `shortPercent = shortPercentage / 100` (0–1 fraction).
- Only symbols in `myFxBook_urls` are kept; rest ignored.
- On stale/invalid session: `{ "error": true, "message": "Invalid session." }`.

**Why API not scrape**: MyFXBook web pages now sit behind Cloudflare challenge (403). The `/api` host is not challenged. One call replaces 36 page scrapes.
