module.exports = {
  apps : [{
    name: 'game_server',
    script: 'app.js',
    instances: 1,
    autorestart: true,
    watch: true,
    log_file: "logs/combined.outerr.log",
    ignore_watch : ["logs/*", "public/chartdata/*"],
    env: {
      NODE_ENV: 'development',
      PORT: 13578
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 13578
    }
  }],
};