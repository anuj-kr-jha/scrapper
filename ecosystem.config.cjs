// pm2 config. .cjs because package.json is "type": "module".
// usage: pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'scrapper',
      script: './index.mjs',
      exec_mode: 'fork', // single instance; app uses setInterval scheduler, do NOT cluster
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      time: true, // prefix logs with timestamp
      env: {
        NODE_ENV: 'dev',
      },
    },
  ],
};
