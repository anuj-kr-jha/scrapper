import axios from 'axios';
import { load } from 'cheerio';

export async function scrapDailyFxTable(url = 'https://www.dailyfx.com/sentiment-report', log = false) {
    try {
        const result = [];
        const response = await axios.get(url, { timeout: 30e3 });
        const html = await response.data;

        if (response.status == 200) {
            const $ = load(html);

            const tableSelector = 'body > div.dfx-slidableContent > div > main > article > section > div:nth-child(2) > div.col-12.col-lg-10.offset-lg-1.offset-xl-0.col-xl-8.dfx-border.dfx-border--r-xl-1 > div.dfx-articleBody > div > article > table';
            const tableHeadSelector = `${tableSelector} > thead > tr > th`;
            const tableBodySelector = `${tableSelector} > tbody > tr`;

            const thead_tr_ths = $(`${tableHeadSelector}`);
            const tbody_trs = $(`${tableBodySelector}`);

            const doc = {};
            const mapper = {};

            thead_tr_ths.each((_idx_th, _th) => {
                mapper[_idx_th] = $(_th).text();
                doc[$(_th).text()] = {};
            });

            tbody_trs.each((_idx_tr, _tr) => {
                const tds = $(_tr).find('td');
                tds.each((_idx_td, _td) => {
                    let td = $(_td).text();
                    if (['NET-LONG%', 'NET-SHORT%'].includes(mapper[_idx_td])) {
                        doc[mapper[_idx_td]] = parseFloat(td.replace('%', '')) / 100;
                    } else if (['CHANGE IN LONGS', 'CHANGE IN SHORTS', 'CHANGE IN OI'].includes(mapper[_idx_td])) {
                        const ps = $(_td).find('p');
                        ps.each((_idx_p, _p) => {
                            const p = $(_p).text();
                            const [value, key] = p.split('  ');
                            doc[mapper[_idx_td]][key] = parseFloat(value.replace('%', '')) / 100;
                        });
                    } else doc[mapper[_idx_td]] = td == 'MIXED' ? 'FLAT' : td;
                });
                result.push(JSON.parse(JSON.stringify(doc)));
            });
        } else console.error('fetch failed for url: ', url);

        if (log) console.log('\nscrapping [dailyFx] done :)');
        if (log) console.log(result, result.length);

        // FORMATTING
        const renameKeys = {
            SYMBOL: 'currency',
            'TRADING BIAS': 'trading_bias',
            'NET-LONG%': 'net_long_percent',
            'NET-SHORT%': 'net_short_percent',
            'CHANGE IN LONGS': 'change_in_longs',
            'CHANGE IN SHORTS': 'change_in_shorts',
            'CHANGE IN OI': 'change_in_io',
        };
        const dailyFx = {};
        for (const item of result) {
            const renamedItem = {};
            for (const [k, v] of Object.entries(item)) {
                const newKey = Object.keys(renameKeys).includes(k) ? renameKeys[k] : k;
                renamedItem[newKey] = v;
            }

            let currency = renamedItem.currency;
            currency = currency.replace(new RegExp('/', 'g'), '');
            currency = currency.replace(new RegExp('-', 'g'), '');
            currency = currency.replace(new RegExp(' ', 'g'), '');
            currency = currency.replace(new RegExp('\\n', 'g'), '');
            currency = currency.toUpperCase();

            dailyFx[currency] = { ...renamedItem, currency };
        }

        return dailyFx;
    } catch (err) {
        console.log(err.message);
        console.log('scrapping [dailyFx] failed :)');
    }
}
