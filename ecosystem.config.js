module.exports = {
  apps: [{
    name: "echopitch-node",
    script: "npm",
    args: "run start:a2a",
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
};
