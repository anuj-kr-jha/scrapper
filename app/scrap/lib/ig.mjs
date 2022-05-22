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

async function scrapIG(url, log) {
    try {
        const response = await axios.get(url, { timeout: 60e3, maxContentLength: 2e6 });
        const html = await response.data;

        if (response.status == 200) {
            const $ = load(html);
            let currency = $('.ma__title').text();
            const percent = $('.price-ticket__percent').text().slice(0, -1) / 100;
            const longShort = $('strong', '.information-popup').text();

            currency = currency.replace('/', '');
            currency = titleRename(currency);
            currency = currency.replace(new RegExp('/', 'g'), '');
            currency = currency.replace(new RegExp('-', 'g'), '');
            currency = currency.replace(new RegExp(' ', 'g'), '');
            currency = currency.toUpperCase();

            const result = { currency, percent, longShort };

            if (!currency) throw new Error(`currency not found. url : ${url}`);
            if (!percent) throw new Error(`percent not found. url : ${url}`);
            if (!longShort) throw new Error(`longShort not found. url : ${url}`);

            if (log) console.log('scrapping [ig] done :)');
            if (log) console.log(result);

            return result;
        }
        throw new Error()
    } catch (err) {
        console.error(`scrapping[ig] failed :). \n url: ${url} status: ${response.status}`);

        db.get('ERROR').splice(9, 1, { message: err.message, createdAt: new Date().toISOString(), trace: err.stack }).write();
        return {};
    }
}

async function scrapIGs(urls = []) {
    try {
        const limit = pLimit(Number(process.env.CONCURRENCY_LIMIT)); // concurrency limit

        const promises = urls.map((url) => {
            return limit(() => scrapIG(url, false));
        });
        const result = {};

        // for (const url of urls) promises.push(scrapIG(url, false));
        const promiseResult = await Promise.all(promises);

        for (const response of promiseResult) {
            const { currency, percent, longShort } = response;
            if (!currency || !percent || !longShort) {
                console.error(`not found(ig) => currency: ${currency} percent: ${percent} longShort: ${longShort}`);
                continue;
            }
            result[currency] = { currency, percent, longShort };
        }
        return result;
    } catch (err) {
        console.error('scrapping failed :), reason: ', err.message);
    }
}


export { scrapIGs };
