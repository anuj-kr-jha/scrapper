import axios from 'axios';
import pLimit from 'p-limit';
import { load } from 'cheerio';

async function scrapMyFx(url, log) {
    try {
        const response = await axios.get(url, { timeout: 30e3 });
        const html = await response.data;

        if (response.status == 200) {
            const $ = load(html);

            const symbolSelector = '#currentMetricsTable > tbody > tr:nth-child(1) > td';
            const shortPercentSelector = '#currentMetricsTable > tbody > tr:nth-child(2) > td:nth-child(2)';
            // const longPercentSelector = '#currentMetricsTable > tbody > tr:nth-child(3) > td:nth-child(2)';

            let currency = $(symbolSelector).text();
            let shortPercent = $(shortPercentSelector).text();
            // let longPercent = $(longPercentSelector).text()

            shortPercent = parseFloat(shortPercent.replace('%', '')) / 100;
            // longPercent = parseFloat(longPercent.replace('%', '')) / 100;

            currency = currency.replace(new RegExp('/', 'g'), '');
            currency = currency.replace(new RegExp('-', 'g'), '');
            currency = currency.replace(new RegExp(' ', 'g'), '');
            currency = currency.replace(new RegExp('\\n', 'g'), '');
            currency = currency.toUpperCase();

            if (log) console.log({ currency, shortPercent });
            return { currency, shortPercent };
        }
        console.error(`scrap failed. url: ${url} status: ${response.status}`);
        return {};
    } catch (err) {
        console.error(err.message);
        console.error('scrapping failed :)');
        return {};
    }
}

async function scrapMyFxs(urls) {
    try {
        const limit = pLimit(Number(process.env.CONCURRENCY_LIMIT)); // concurrency limit

        const promises = urls.map((url) => {
            return limit(() => scrapMyFx(url, false));
        });
        const result = {};

        // for (const url of urls) promises.push(scrapMyFx(url, false));
        const promiseResult = await Promise.all(promises);

        for (const response of promiseResult) {
            const { currency, shortPercent: percent } = response;
            if (!currency || !percent) {
                continue;
            }
            result[currency] = { currency, percent };
        }
        return result;
    } catch (err) {
        console.error(err.message);
        console.error('scrapping failed :)');
    }
}

export { scrapMyFxs };
