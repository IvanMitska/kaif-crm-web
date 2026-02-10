#!/usr/bin/env node
const { spawn } = require('child_process');

// Запускаем NestJS с отключенной проверкой типов
const nest = spawn('npx', ['nest', 'start', '--watch', '--preserveWatchOutput'], {
  env: {
    ...process.env,
    TS_NODE_TRANSPILE_ONLY: 'true',
    NODE_ENV: 'development'
  },
  stdio: 'inherit',
  shell: true
});

nest.on('error', (error) => {
  console.error('Failed to start server:', error);
});

nest.on('exit', (code) => {
  console.log(`Server process exited with code ${code}`);
});

console.log('🚀 Starting KAIF CRM Backend (ignoring TypeScript errors)...');