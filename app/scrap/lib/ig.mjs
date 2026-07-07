import axios from 'axios';
import pkg from 'cheerio';
const { load } = pkg;

// look like a real browser to reduce block risk (IG sits behind a WAF)
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

const RETRIES = 2; // total attempts = RETRIES + 1

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function scrapIG(url, name, log) {
  let lastErr;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      if (attempt > 0) await delay(2000 * attempt); // backoff before retry

      const response = await axios.get(url, { timeout: 30e3, maxContentLength: 2e6, headers: HEADERS, family: 4 });

      if (response.status !== 200) throw new Error(`STATUS(${response.status}) !== 200`);

      const $ = load(response.data);
      const currency = name || $('.ma__title').text();
      const percent = $('.price-ticket__percent').text().slice(0, -1) / 100;
      const longShort = $('strong', '.information-popup').text();

      if (!currency) throw new Error(`currency not found. url : ${url}`);
      if (!percent) throw new Error(`percent not found. url : ${url}`);
      if (!longShort) throw new Error(`longShort not found. url : ${url}`);

      const result = { currency, percent, longShort, status: 1 };
      if (log) console.log('scrapping [ig] done :)', result);
      return result;
    } catch (err) {
      lastErr = err;
      // retry only on transient errors: network failures, or recoverable HTTP status.
      // NOT on permanent 4xx (404/400/401) or parse (data-shape) failures.
      // NOTE: network errors (ETIMEDOUT etc.) often have an empty message — check err.code too.
      const status = err.response && err.response.status;
      const netStr = `${err.code || ''} ${err.message || ''}`;
      const transient = status
        ? [403, 408, 429, 500, 502, 503, 504].includes(status)
        : /timeout|ECONN|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|socket|network|aborted/i.test(netStr);
      if (attempt < RETRIES && transient) continue;
      break;
    }
  }

  const detail = (lastErr && (lastErr.message || lastErr.code)) || 'unknown';
  const reason = `scrapIG failed :(, reason: ${detail}, url: ${url}`;
  console.red('❌ ', reason);
  global.logError(reason, 'scrapIG', lastErr && lastErr.stack);
  return { currency: name, percent: 0, longShort: 'NA', status: 0 };
}
