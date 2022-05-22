import { scrapIGs } from './lib/ig.mjs';
import { scrapDailyFxTable } from './lib/dailyFx.mjs';
import { scrapMyFxs } from './lib/myfxbook.mjs';

async function calculateFinal(igs, dailyFxs, myFxBooks) {
    let factor = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0.3;

    try {
        const final_igs = {};
        const final_data = {};
        const final_myFxBooks = {};
        const final_dailyFxs = {}; // this contain data not available in ig

        for (const [myFxBooksKey, myFxBooksVal] of Object.entries(myFxBooks)) {
            const short = myFxBooksVal.percent;
            const long = 1 - short;
            const signal = Math.abs(long - short) > factor ? (long > short ? 'BULLISH' : 'BEARISH') : 'FLAT';
            final_myFxBooks[myFxBooksKey] = {
                currency: myFxBooksVal.currency,
                percent: myFxBooksVal.percent.toFixed(2),
                // calculated
                long: long.toFixed(2),
                short: short.toFixed(2),
                ssi_signal: signal,
            };
        }

        for (const [igKey, igVal] of Object.entries(igs)) {
            var _final_myFxBooks$igKe, _final_myFxBooks$igKe2;

            const long = igVal.longShort == 'long' ? igVal.percent : 1 - igVal.percent;
            const short = 1 - long;
            const signal = Math.abs(long - short) > factor ? (long > short ? 'BULLISH' : 'BEARISH') : 'FLAT';
            // console.log(igKey)

            const ssi_signal =
                signal == 'FLAT' ? ((_final_myFxBooks$igKe = (_final_myFxBooks$igKe2 = final_myFxBooks[igKey]) === null || _final_myFxBooks$igKe2 === void 0 ? void 0 : _final_myFxBooks$igKe2.ssi_signal) !== null && _final_myFxBooks$igKe !== void 0 ? _final_myFxBooks$igKe : signal) : signal;
            final_igs[igKey] = {
                currency: igVal.currency,
                percent: igVal.percent.toFixed(2),
                longShort: igVal.longShort,
                // calculated
                long: long.toFixed(2),
                short: short.toFixed(2),
                signal: signal,
                ssi_signal: ssi_signal,
            };
        }

        for (const [dailyFxKey, dailyFxVal] of Object.entries(dailyFxs)) {
            final_dailyFxs[dailyFxKey] = {
                currency: dailyFxVal.currency,
                oi_signal: dailyFxVal.trading_bias,
                // oi_signal <- trading_bias
                net_long_percent: dailyFxVal.net_long_percent,
                net_short_percent: dailyFxVal.net_short_percent,
                change_in_longs: dailyFxVal.change_in_longs,
                change_in_shorts: dailyFxVal.change_in_shorts,
                change_in_io: dailyFxVal.change_in_io,
            };
        }

        for (const [igKey, igVal] of Object.entries(final_igs)) {
            var _final_dailyFxs$igKey, _final_dailyFxs$igKey2;

            const oi_signal = (_final_dailyFxs$igKey = (_final_dailyFxs$igKey2 = final_dailyFxs[igKey]) === null || _final_dailyFxs$igKey2 === void 0 ? void 0 : _final_dailyFxs$igKey2.oi_signal) !== null && _final_dailyFxs$igKey !== void 0 ? _final_dailyFxs$igKey : 'NA';
            final_data[igKey] = {
                currency: igVal.currency,
                long: parseFloat(igVal.long).toFixed(2),
                short: parseFloat(igVal.short).toFixed(2),
                ssi_signal: igVal.ssi_signal,
                oi_signal: oi_signal,
            };
        } // add missing_data(from ig) to  final_data (from myFxBook)

        for (const [key, val] of Object.entries(final_myFxBooks)) {
            var _final_dailyFxs$key$o, _final_dailyFxs$key;

            if (Object.keys(final_igs).includes(key)) continue;
            const short = val.percent;
            const long = 1 - short;
            const signal = Math.abs(long - short) > factor ? (long > short ? 'BULLISH' : 'BEARISH') : 'FLAT';
            const oi_signal = (_final_dailyFxs$key$o = (_final_dailyFxs$key = final_dailyFxs[key]) === null || _final_dailyFxs$key === void 0 ? void 0 : _final_dailyFxs$key.oi_signal) !== null && _final_dailyFxs$key$o !== void 0 ? _final_dailyFxs$key$o : 'NA';
            final_data[key] = {
                currency: val.currency,
                long: val.long,
                short: val.short,
                ssi_signal: signal,
                oi_signal: oi_signal,
            };
        }

        return {
            final_igs,
            final_dailyFxs,
            final_myFxBooks,
            final_data,
        };
    } catch (err) {
        console.error('Error in calculateFinal '.concat(err.messge));

        db.get('ERROR')
            .splice.splice(9, 1, {
                message: err.message,
                method: 'calculateFinal',
                createdAt: new Date().toISOString(),
                trace: err.stack,
            })
            .write();

        return {};
    }
}

export async function scrapAndSave() {
    try {
        const t0 = Date.now();

        const { factor, ig_urls, myFxBook_urls, dailyFx_url } = getConstant(0);

        if (!factor) throw new Error('Factor is not defined');
        if (!ig_urls) throw new Error('IG_URLs is not defined');
        if (!myFxBook_urls) throw new Error('MYFXBOOK_URLs is not defined');
        if (!dailyFx_url) throw new Error('DAILYFX_URL is not defined');

        const [igs, dailyFxs, myFxBooks] = await Promise.all([
            scrapIGs(ig_urls),
            scrapDailyFxTable(dailyFx_url),
            scrapMyFxs(myFxBook_urls),
            //
        ]);

        if (!igs) throw new Error('Scrapping IGs failed');
        if (!dailyFxs) throw new Error('Scrapping DailyFxs failed');
        if (!myFxBooks) throw new Error('Scrapping MyFxBooks failed');

        const t1 = Date.now();
        console.info('ms(scrap): ', t1 - t0);

        const { final_igs, final_dailyFxs, final_myFxBooks, final_data } = await calculateFinal(igs, dailyFxs, myFxBooks, factor !== null && factor !== void 0 ? factor : 0.3);

        if (!final_igs) throw new Error('Calculating final_igs failed');
        if (!final_dailyFxs) throw new Error('Calculating final_dailyFxs failed');
        if (!final_myFxBooks) throw new Error('Calculating final_myFxBooks failed');
        if (!final_data) throw new Error('Calculating final_data failed');

        const _igs = Object.values(final_igs);
        const _dailyFxs = Object.values(final_dailyFxs);
        const _myFxBooks = Object.values(final_myFxBooks);
        const _finalData = Object.values(final_data);

        db.get('IG').unshift({ FX: _igs, createdAt: new Date().toISOString() }).write();
        db.get('DAILYFX').unshift({ FX: _dailyFxs, createdAt: new Date().toISOString() }).write();
        db.get('MYFXBOOK').unshift({ FX: _myFxBooks, createdAt: new Date().toISOString() }).write();
        db.get('FINAL').unshift({ FX: _finalData, createdAt: new Date().toISOString() }).write();

        db.get('IG').splice(1).write();
        db.get('DAILYFX').splice(1).write();
        db.get('MYFXBOOK').splice(1).write();
        db.get('FINAL').splice(1).write();

        const t2 = Date.now();
        console.info('ms(save): ', t2 - t1);
    } catch (err) {
        console.error(`Error in scrapAndSave ${err.message}`);

        db.get('ERROR').splice(9, 1, { message: err.message, method: 'scrapAndSave', createdAt: new Date().toISOString(), trace: err.stack });
        await db.write();
    }
}
