// HISTORICAL: this file used to be the prod-style ecosystem (compiled
// dist/main.js, NODE_ENV=production). The legacy CI deploy script still
// references it (`pm2 restart ecosystem.config.js`), and every time it
// fires it respawns p2ptax-api in production mode — which breaks the
// OTP dev-bypass `000000`, the real source of "Invalid or expired code"
// at login. Until the deploy trigger on Сергей's Mac is removed, this
// file MUST mirror ecosystem.dev.config.js (NODE_ENV=development,
// ts-node-dev) so the zombie respawn doesn't sabotage staging.
module.exports = {
  apps: [
    {
      name: "p2ptax-api",
      script: "node_modules/.bin/ts-node-dev",
      args: "--respawn --transpile-only src/main.ts",
      cwd: "./api",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "development",
      },
    },
    {
      name: "p2ptax-web",
      script: "serve",
      args: "-s dist -l 19006",
      cwd: ".",
      instances: 1,
      autorestart: true,
      watch: false,
    },
  ],
};
