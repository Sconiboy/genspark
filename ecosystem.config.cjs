// PM2 ecosystem configuration for NetworkConnect app
// Development environment with local D1 database

module.exports = {
  apps: [
    {
      name: 'webapp',
      script: 'npx',
      args: 'wrangler pages dev dist --d1=webapp-production --local --ip 0.0.0.0 --port 3000',
      cwd: '/home/user/webapp',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false, // Disable PM2 file monitoring (wrangler handles hot reload)
      instances: 1, // Development mode uses only one instance
      exec_mode: 'fork',
      restart_delay: 2000, // Wait 2 seconds before restart
      max_restarts: 5, // Maximum restarts in a row
      min_uptime: '10s', // Minimum uptime before restart
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true, // Prefix logs with timestamp
      merge_logs: true, // Merge cluster logs
      kill_timeout: 5000 // Time to wait for graceful shutdown
    }
  ]
}