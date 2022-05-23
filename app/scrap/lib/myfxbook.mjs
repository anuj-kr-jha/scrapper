import axios from 'axios';
import pLimit from 'p-limit';
import pkg from 'cheerio';
const { load } = pkg;

function titleRename(title) {
    const titles = {
        'Oil - Brent Crude': 'BCOUSD',
        'Oil - US Crude': 'WTICOUSD',
        'Spot Gold': 'XAUUSD',
        'Spot Silver (5000oz)': 'XAGUSD',
        'Spot Platinum Mini LCP (5oz)': 'XPTUSD',
        'Natural Gas': 'NATGASUSD',
        'Heating Oil': 'HEOUSD',
        'London Gas Oil': 'GASUSD',
        'London Sugar No. 5': 'SUGARUSD',
        'Wall Street': 'US30USD',
        'US Russell 2000': 'US2000USD',
        'US Tech 100': 'NAS100USD',
        'US 500': 'SPX500USD',
        'FTSE 100': 'UK100GBP',
        'Japan 225': 'JP225USD',
        'India 50': 'IN50USD',
        'Germany 40': 'DE30EUR',
        'Australia 200': 'AU200AUD',
        'EU Stocks 50': 'EUR50EUR',
        'France 40': 'FR40EUR',
        'Hong Kong Tech': 'HK33HKD',
        'Taiwan Index': 'TWIXUSD',
        'Netherlands 25': 'NL25EUR',
        USFANG: 'FANG',
        'Volatility Index': 'VIX',
        'Aluminium ($5 Mini Contract)': 'ALU',
        'Lead ($5 Mini Contract)': 'LEAD',
        Zinc: 'ZINC',
        Copper: 'XCUUSD',
        'No Lead Gasoline': 'GASOLINE',
    };

    return Object.keys(titles).includes(title) ? titles[title] : title;
}

async function scrapMyFx(url, log) {
    try {
        const response = await axios.get(url, { timeout: 30e3 });
        const html = await response.data;

        if (response.status == 200) {
            const $ = load(html);


            const symbolSelector = '#currentMetricsTable > tr:nth-child(2)';
            const shortPercentSelector = '#currentMetricsTable > tr:nth-child(3) > td:nth-child(2)';

            let currency = $(symbolSelector).text();
            let shortPercent = $(shortPercentSelector).text();

            shortPercent = parseFloat(shortPercent.replace('%', '')) / 100;

            currency = currency.replace(new RegExp('/', 'g'), '');
            currency = titleRename(currency);
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
