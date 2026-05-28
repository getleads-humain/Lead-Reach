module.exports = {
  apps: [{
    name: 'lead-reach',
    script: 'node_modules/.bin/next',
    args: 'dev -p 3000',
    cwd: '/home/z/my-project',
    env: {
      NODE_ENV: 'development',
      DATABASE_URL: 'file:/home/z/my-project/db/custom.db',
    }
  }]
};
