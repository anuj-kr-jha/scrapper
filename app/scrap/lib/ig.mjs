import axios from 'axios';
import pLimit from 'p-limit';
import pkg from 'cheerio';
const { load } = pkg;

export async function scrapIG(url, name, log) {
  try {
    const response = await axios.get(url, { timeout: 60e3, maxContentLength: 2e6 });
    const html = await response.data;

    if (response.status == 200) {
      const $ = load(html);
      let currency = name || $('.ma__title').text();
      const percent = $('.price-ticket__percent').text().slice(0, -1) / 100;
      const longShort = $('strong', '.information-popup').text();

      if (!currency) throw new Error(`currency not found. url : ${url}`);
      if (!percent) throw new Error(`percent not found. url : ${url}`);
      if (!longShort) throw new Error(`longShort not found. url : ${url}`);

      const result = { currency, percent, longShort, status: 1 };

      if (log) console.log('scrapping [ig] done :)');
      if (log) console.log(result);

      return result;
    }
    throw new Error(`STATUS(response.status) !== 200`);
  } catch (err) {
    const reason = `scrapIG failed :(, reason: ${err.message}, url: ${url}`;
    console.error(reason);
    if (db.get('ERROR').value().length > 10) {
      db.get('ERROR')
        .splice(0, db.get('ERROR').value().length - 10)
        .write();
    }
    db.get('ERROR').push({ message: reason, method: 'scrapIG', createdAt: new Date().toLocaleString(), trace: err.stack }).write();
    return { currency: name, percent: 0, longShort: 'NA', status: 0 };
  }
}
