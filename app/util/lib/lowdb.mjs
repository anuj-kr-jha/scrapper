import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync.js';

const adapter = new FileSync('./db.json');
const db = low(adapter);

export async function init_lowdb() {
    db.defaults({ FINAL: [], CONSTANT: [], MYFXBOOK: [], IG: [], DAILYFX: [], ERROR: [] }).write();
    global.db = db;
    global.getConstant = (idx) => db.get('CONSTANT').value()[idx];
}
