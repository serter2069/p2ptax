module.exports = {
  apps: [
    {
      name: "p2ptax-api",
      script: "dist/main.js",
      cwd: "./api",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
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
