// ig: (64 +2)
// {symbol, percent, longShort}
// if(longShort=='long') long = percent, short = 1-percent
// if(longShort=='short') short = percent, long = 1-percent

// copy XAUEUR,XAUAUD from myfxbook (after calculating long, short, signal for myfxbook)

// signal_ig = MOD(long - short) > 0.35 ? (long > short ? bearish : bullish) : flat
// final_signal_ig = signal_ig != flat ? signal_ig : (signal_myfxbook && signal_myfxbook != flat) ? signal_myfxbook : flat
// ssi_signal = final_signal_ig
/*
    EURUSD,https://www.ig.com/ae/forex/markets-forex/eur-usd
    GBPUSD,https://www.ig.com/ae/forex/markets-forex/gbp-usd
    USDJPY,https://www.ig.com/ae/forex/markets-forex/usd-jpy
    GBPJPY,https://www.ig.com/ae/forex/markets-forex/gbp-jpy
    USDCAD,https://www.ig.com/ae/forex/markets-forex/usd-cad
    EURAUD,https://www.ig.com/ae/forex/markets-forex/eur-aud
    EURJPY,https://www.ig.com/ae/forex/markets-forex/eur-jpy
    AUDCAD,https://www.ig.com/ae/forex/markets-forex/aud-cad
    AUDJPY,https://www.ig.com/ae/forex/markets-forex/aud-jpy
    AUDNZD,https://www.ig.com/ae/forex/markets-forex/aud-nzd
    AUDUSD,https://www.ig.com/ae/forex/markets-forex/aud-usd
    CADJPY,https://www.ig.com/ae/forex/markets-forex/cad-jpy
    EURCAD,https://www.ig.com/ae/forex/markets-forex/eur-cad
    EURCHF,https://www.ig.com/ae/forex/markets-forex/eur-chf
    EURGBP,https://www.ig.com/ae/forex/markets-forex/eur-gbp
    EURNZD,https://www.ig.com/ae/forex/markets-forex/eur-nzd
    EURZAR,https://www.ig.com/ae/forex/markets-forex/eur-zar
    GBPCAD,https://www.ig.com/ae/forex/markets-forex/gbp-cad
    GBPCHF,https://www.ig.com/ae/forex/markets-forex/gbp-chf
    NZDCAD,https://www.ig.com/ae/forex/markets-forex/spot-fx-nzdcad
    NZDJPY,https://www.ig.com/ae/forex/markets-forex/nzd-jpy
    NZDUSD,https://www.ig.com/ae/forex/markets-forex/nzd-usd
    USDCHF,https://www.ig.com/ae/forex/markets-forex/usd-chf
    CHFJPY,https://www.ig.com/ae/forex/markets-forex/chf-jpy
    AUDCHF,https://www.ig.com/ae/forex/markets-forex/aud-chf
    GBPNZD,https://www.ig.com/ae/forex/markets-forex/gbp-nzd
    NZDCHF,https://www.ig.com/ae/forex/markets-forex/nzd-chf
    CADCHF,https://www.ig.com/ae/forex/markets-forex/cad-chf
    GBPAUD,https://www.ig.com/ae/forex/markets-forex/gbp-aud
    USDZAR,https://www.ig.com/ae/forex/markets-forex/usd-zar
    USDNOK,https://www.ig.com/ae/forex/markets-forex/usd-nok
    USDSEK,https://www.ig.com/ae/forex/markets-forex/usd-sek
    XAUUSD,https://www.ig.com/ae/commodities/markets-commodities/gold
    XAGUSD,https://www.ig.com/ae/commodities/markets-commodities/silver
    USDDKK,https://www.ig.com/ae/forex/markets-forex/usd-dkk
    USDSGD,https://www.ig.com/ae/forex/markets-forex/usd-sgd
    BCOUSD,https://www.ig.com/ae/commodities/markets-commodities/brent-crude
    WTICOUSD,https://www.ig.com/ae/commodities/markets-commodities/us-light-crude
    XCUUSD,https://www.ig.com/ae/forex/markets-forex/cash-copper
    XPTUSD,https://www.ig.com/ae/forex/markets-forex/spot-platinum-mini-lcp-5oz
    NATGASUSD,https://www.ig.com/ae/commodities/markets-commodities/natural-gas
    HEOUSD,https://www.ig.com/ae/commodities/markets-commodities/heating-oil
    GASUSD,https://www.ig.com/ae/commodities/markets-commodities/london-gas-oil
    SUGARUSD,https://www.ig.com/ae/commodities/markets-commodities/london-sugar-no-5
    US30USD,https://www.ig.com/ae/indices/markets-indices/wall-street
    US2000USD,https://www.ig.com/ae/indices/markets-indices/russell-2000
    NAS100USD,https://www.ig.com/ae/indices/markets-indices/us-tech-100
    SPX500USD,https://www.ig.com/ae/indices/markets-indices/us-spx-500
    UK100GBP,https://www.ig.com/ae/indices/markets-indices/ftse-100
    JP225USD,https://www.ig.com/ae/indices/markets-indices/japan-225
    IN50USD,https://www.ig.com/ae/indices/markets-indices/india-50
    DE30EUR,https://www.ig.com/ae/indices/markets-indices/germany-40
    AU200AUD,https://www.ig.com/ae/indices/markets-indices/australia-200
    EUR50EUR,https://www.ig.com/ae/indices/markets-indices/eu-stocks-50
    FR40EUR,https://www.ig.com/ae/indices/markets-indices/france-40
    HK33HKD,https://www.ig.com/ae/indices/markets-indices/hang-seng-tech-cash-hk10
    TWIXUSD,https://www.ig.com/ae/indices/markets-indices/taiwan-index-tw
    NL25EUR,https://www.ig.com/ae/indices/markets-indices/holland-25
    FANG,https://www.ig.com/ae/indices/markets-indices/USFANG
    VIX,https://www.ig.com/ae/indices/markets-indices/volatility-index
    ALU,https://www.ig.com/ae/forex/markets-forex/cash-aluminium-5-mini-contract
    LEAD,https://www.ig.com/ae/forex/markets-forex/cash-lead-5-mini-contract1
    ZINC,https://www.ig.com/ae/forex/markets-forex/cash-zinc1
    GASOLINE,https://www.ig.com/ae/commodities/markets-commodities/no-lead-gasoline

    XAUEUR,https://www.myfxbook.com/community/outlook/XAUEUR
    XAUAUD,https://www.myfxbook.com/community/outlook/XAUAUD
*/

// myfxbook (36)
// {symbol, short } long = 1 - short
// signal_myfxbook = MOD(long - short) > 0.35 ? (long > short ? bearish : bullish) : flat
/*
    EURUSD,https://www.myfxbook.com/community/outlook/EURUSD
    GBPUSD,https://www.myfxbook.com/community/outlook/GBPUSD
    USDJPY,https://www.myfxbook.com/community/outlook/USDJPY
    GBPJPY,https://www.myfxbook.com/community/outlook/GBPJPY
    USDCAD,https://www.myfxbook.com/community/outlook/USDCAD
    EURAUD,https://www.myfxbook.com/community/outlook/EURAUD
    EURJPY,https://www.myfxbook.com/community/outlook/EURJPY
    AUDCAD,https://www.myfxbook.com/community/outlook/AUDCAD
    AUDJPY,https://www.myfxbook.com/community/outlook/AUDJPY
    AUDNZD,https://www.myfxbook.com/community/outlook/AUDNZD
    AUDUSD,https://www.myfxbook.com/community/outlook/AUDUSD
    CADJPY,https://www.myfxbook.com/community/outlook/CADJPY
    EURCAD,https://www.myfxbook.com/community/outlook/EURCAD
    EURCHF,https://www.myfxbook.com/community/outlook/EURCHF
    EURGBP,https://www.myfxbook.com/community/outlook/EURGBP
    EURNZD,https://www.myfxbook.com/community/outlook/EURNZD
    EURZAR,https://www.myfxbook.com/community/outlook/EURZAR
    GBPCAD,https://www.myfxbook.com/community/outlook/GBPCAD
    GBPCHF,https://www.myfxbook.com/community/outlook/GBPCHF
    NZDCAD,https://www.myfxbook.com/community/outlook/NZDCAD
    NZDJPY,https://www.myfxbook.com/community/outlook/NZDJPY
    NZDUSD,https://www.myfxbook.com/community/outlook/NZDUSD
    USDCHF,https://www.myfxbook.com/community/outlook/USDCHF
    CHFJPY,https://www.myfxbook.com/community/outlook/CHFJPY
    AUDCHF,https://www.myfxbook.com/community/outlook/AUDCHF
    GBPNZD,https://www.myfxbook.com/community/outlook/GBPNZD
    NZDCHF,https://www.myfxbook.com/community/outlook/NZDCHF
    CADCHF,https://www.myfxbook.com/community/outlook/CADCHF
    GBPAUD,https://www.myfxbook.com/community/outlook/GBPAUD
    USDZAR,https://www.myfxbook.com/community/outlook/USDZAR
    USDNOK,https://www.myfxbook.com/community/outlook/USDNOK
    USDSEK,https://www.myfxbook.com/community/outlook/USDSEK
    XAGUSD,https://www.myfxbook.com/community/outlook/XAGUSD
    XAUUSD,https://www.myfxbook.com/community/outlook/XAUUSD
    XAUEUR,https://www.myfxbook.com/community/outlook/XAUEUR
    XAUAUD,https://www.myfxbook.com/community/outlook/XAUAUD
*/

// {symbol, trading_bias(oi_signal) } net-long , net-short would be calculated at runtime
/* dailyfx
    https://www.dailyfx.com/sentiment-report
*/
