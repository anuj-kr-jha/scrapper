import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync.js';

const adapter = new FileSync('./db.json');
const db = low(adapter);

export async function init_lowdb() {
  db.defaults({ CONSTANT: [], RAW_IG: [], RAW_MYFXBOOK: [], ERROR: [], MYFX_SESSION: '' }).write();
  global.db = db;
  global.getConstant = (idx) => db.get('CONSTANT').value()[idx];

  // single error logger. appends + keeps only the last 10 entries.
  global.logError = (message, method = 'unknown', trace = '') => {
    try {
      db.get('ERROR').push({ message, method, createdAt: new Date().toISOString(), trace }).write();
      const len = db.get('ERROR').value().length;
      if (len > 10) db.get('ERROR').splice(0, len - 10).write();
    } catch (e) {
      console.error('logError failed:', e.message);
    }
  };
}
