module.exports = {
  apps: [
    {
      name: "server1",
      script: "app.js",
      instances: 1,
      autorestart: true,
      watch: true,
      log_file: "logs/combined.outerr.log",
      ignore_watch: ["logs/*", "public/chartdata/*"],
      //max_memory_restart: '1G',
      env: {
        NODE_ENV: "development",
        PORT: 29188,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 29188,
      },
    },
  ],
};
