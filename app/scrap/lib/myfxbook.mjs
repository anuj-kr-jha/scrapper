import axios from 'axios';

const API = 'https://www.myfxbook.com/api';

// session cache: in-memory + persisted to db.json (survives restart). auto-updated on login.
let cachedSession = null;

function loadSession() {
  if (cachedSession) return cachedSession;
  const s = db.get('MYFX_SESSION').value();
  cachedSession = s || null;
  return cachedSession;
}

function saveSession(session) {
  cachedSession = session;
  db.set('MYFX_SESSION', session).write();
}

function clearSession() {
  cachedSession = null;
  db.set('MYFX_SESSION', '').write();
}

// login -> session string (already url-encoded by api). persists + throws on failure.
async function login() {
  const email = encodeURIComponent(process.env.MYFXBOOK_EMAIL || '');
  const password = encodeURIComponent(process.env.MYFXBOOK_PASSWORD || '');
  if (!email || !password) throw new Error('MYFXBOOK_EMAIL / MYFXBOOK_PASSWORD not set in env');

  const { data } = await axios.get(`${API}/login.json?email=${email}&password=${password}`, { timeout: 30e3 });
  if (data.error || !data.session) throw new Error(`myfxbook login failed: ${data.message || 'no session'}`);
  saveSession(data.session);
  return data.session;
}

// GET community outlook with a given session. returns raw api payload.
async function getOutlook(session) {
  const { data } = await axios.get(`${API}/get-community-outlook.json?session=${session}`, { timeout: 30e3 });
  return data;
}

function isInvalidSession(data) {
  return data && data.error && /invalid session/i.test(data.message || '');
}

// fetch community outlook for all symbols in ONE call.
// auto-handles: no session -> login; expired session -> re-login once + retry.
// returns map { UPPERCASE_NAME: { currency, shortPercent(0-1), status:1 } }. {} on failure.
export async function fetchMyFxOutlook(log) {
  try {
    let session = loadSession() || (await login());
    let data = await getOutlook(session);

    // session expired -> re-login once and retry
    if (isInvalidSession(data)) {
      if (log) console.yellow('myfxbook session expired, re-login...');
      clearSession();
      session = await login();
      data = await getOutlook(session);
    }

    if (data.error) throw new Error(`get-community-outlook failed: ${data.message}`);

    const map = {};
    for (const s of data.symbols || []) {
      const currency = String(s.name).toUpperCase();
      map[currency] = { currency, shortPercent: s.shortPercentage / 100, status: 1 };
    }

    if (log) console.log('myfxbook outlook done :)', Object.keys(map).length, 'symbols');
    return map;
  } catch (err) {
    console.red('❌ ', `fetchMyFxOutlook failed :(, reason: ${err.message}`);
    global.logError(`fetchMyFxOutlook failed :(, reason: ${err.message}`, 'myfxbook', err.stack);
    return {};
  }
}
