import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { Low, JSONFile } from 'lowdb';
import lodash from 'lodash';
const __dirname = dirname(fileURLToPath(import.meta.url));

const file = join(__dirname, 'db.json'); // - Use JSON file for storage
const adapter = new JSONFile(file);
const db = new Low(adapter);

export async function init_lowdb() {
    await db.read(); // - Read data from JSON file, this will set db.data content
    db.data ||= { FINAL: [], CONSTANT: [], MYFXBOOK: [], IG: [], DAILYFX: [], ERROR: [] };
    db.chain = lodash.chain(db.data);
    const { CONSTANT: Constant, MYFXBOOK: Myfxbook, IG: Ig, DAILYFX: Dailyfx, FINAL: Final,  ERROR: _Error } = db.data;
    const { constant, myfxbook, ig, dailyfx, final, _error } = { constant: db.chain.get('constant'), myfxbook: db.chain.get('myfxbook'), ig: db.chain.get('ig'), dailyfx: db.chain.get('dailyfx'), final: db.chain.get('final'), error: db.chain.get('error') }; // support lodash functionality
    await db.write();
    console.info('LowDB Initialized ◙');
    // return { db, myfxbook, Myfxbook, ig, Ig, dailyfx, Dailyfx, final, Final, constant, Constant, _error, _Error };
    global.low = { db, myfxbook, Myfxbook, ig, Ig, dailyfx, Dailyfx, final, Final, constant, Constant, _error, _Error };
}

export async function getDb() {
    const { db, myfxbook, Myfxbook, ig, Ig, dailyfx, Dailyfx, final, Final, constant, Constant } = global.db;
    return { db, myfxbook, Myfxbook, ig, Ig, dailyfx, Dailyfx, final, Final, constant, Constant };
}
