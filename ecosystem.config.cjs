// pm2 config. .cjs because package.json is "type": "module".
// usage: pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'scrapper',
      script: './index.mjs',
      cwd: __dirname, // anchor relative paths (script + log files) to this folder
      exec_mode: 'fork', // single instance; app uses setInterval scheduler, do NOT cluster
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      time: true, // prefix logs with timestamp
      // keep logs inside the project (default was ~/.pm2/logs)
      out_file: './logs/scrapper-out.log',
      error_file: './logs/scrapper-error.log',
      merge_logs: true,
      env: {
        NODE_ENV: 'dev',
      },
    },
  ],
};
