module.exports = {
  apps: [
    {
      name: 'echopitch-node',
      script: 'scripts/start-a2a.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 3000,
      exp_backoff_restart_delay: 100,
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS Z',
      merge_logs: true,
      env: {
        NODE_ENV: 'production',
        PORT: 10000,
        NEXT_PUBLIC_OKX_AGENT_ID: '9230',
        NEXT_PUBLIC_OKX_A2A_SERVICE_ID: '36961',
        NEXT_PUBLIC_OKX_CONTRACT_ADDRESS: '0x779ded0c9e1022225f8e0630b35a9b54be713736',
        NEXT_PUBLIC_OKX_NETWORK: 'OKX X Layer Mainnet',
        NEXT_PUBLIC_OKX_CHAIN_ID: '196',
        NEXT_PUBLIC_OKX_COMMUNICATION_ADDRESS: '0x78507f00f3BA4665a505e616ead3211e405fC11e',
        OKX_AGENT_TASK_HOME: '/app/data',
        OKX_A2A_AI_PERMISSION_PRESET: 'auto',
        XMTP_ENV: 'production'
      }
    }
  ]
};
