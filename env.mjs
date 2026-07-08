import 'dotenv/config';

process.env.TZ = process.env.TZ || 'Asia/Bahrain';
process.env.NODE_ENV = process.env.NODE_ENV || 'dev';
process.env.PORT = process.env.PORT || '4000';
process.env.HOST = process.env.HOST || '127.0.0.1';
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || 1;

process.env.CONCURRENCY_LIMIT = process.env.CONCURRENCY_LIMIT || 10;

// run exactly one scrape on boot? 'true' (default) -> yes; 'false'/'0' -> only run at scheduled repeat_at times.
process.env.SCRAP_ON_START = process.env.SCRAP_ON_START || 'true';

const oEnv = {
  dev: {
    BASE_URL: `http://${process.env.HOST}:${process.env.PORT}`,
  },
  prod: {
    BASE_URL: `http://${process.env.HOST}:${process.env.PORT}`,
  },
};

process.env.BASE_URL = oEnv[process.env.NODE_ENV].BASE_URL;

console.info(`${process.env.HOST} configured as ${process.env.NODE_ENV}  < / >`);
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// red/yellow -> stderr so pm2 writes them to error_file; rest -> stdout
const errColors = new Set(['red', 'yellow']);
Object.keys(colors).forEach((color) => {
  Object.defineProperty(global.console, color, {
    get:
      () =>
      (...args) => {
        const toErr = errColors.has(color);
        const sink = toErr ? console.error : console.log;
        // only emit ANSI when the target stream is an interactive terminal.
        // pm2/redirected output isn't a TTY -> write plain text (no color codes in log files).
        const isTTY = toErr ? process.stderr.isTTY : process.stdout.isTTY;
        if (isTTY) {
          sink(args.map(() => `${colors[color]}%s${colors.reset}`).join(' '), ...args);
        } else {
          sink(args.map(() => '%s').join(' '), ...args);
        }
      },
  });
});

export {};
