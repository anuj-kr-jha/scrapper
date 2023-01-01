import axios from 'axios';
import pkg from 'cheerio';
const { load } = pkg;

export async function scrapMyFx(url, name, log) {
  try {
    const response = await axios.get(url, { timeout: 30e3 });
    const html = await response.data;

    if (response.status == 200) {
      const $ = load(html);

      const symbolSelector = '#currentMetricsTable > tr:nth-child(2)';
      const shortPercentSelector = '#currentMetricsTable > tr:nth-child(3) > td:nth-child(2)';

      let currency = name || $(symbolSelector).text();
      let shortPercent = $(shortPercentSelector).text();

      if (!currency) throw new Error(`currency not found. url : ${url}`);
      if (!shortPercent) throw new Error(`shortPercent not found. url : ${url}`);

      shortPercent = parseFloat(shortPercent.replace('%', '')) / 100;

      if (log) console.log({ currency, shortPercent, status: 1 });
      return { currency, shortPercent, status: 1 };
    }
    throw new Error(`STATUS(response.status) !== 200`);
  } catch (err) {
    const reason = `scrapMyFx failed :(, reason: ${err.message}, url: ${url}`;
    console.error(reason);
    db.get('ERROR').shift().write();
    db.get('ERROR').push({ message: reason, method: 'scrapMyFx', createdAt: new Date().toLocaleString(), trace: err.stack }).write();
    if (db.get('ERROR').value().length > 10) {
      db.get('ERROR')
        .splice(0, db.get('ERROR').value().length - 10)
        .write();
    }
    db.get('ERROR').push({ message: reason, method: 'scrapMyFx', createdAt: new Date().toLocaleString(), trace: err.stack }).write();

    return { currency: name, shortPercent: 0, status: 0 };
  }
}
