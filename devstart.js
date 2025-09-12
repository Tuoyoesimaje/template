// devstart.js — simple cross-platform launcher to run server.js + Vite in one terminal
// Usage: node devstart.js
const { spawn } = require('child_process');

const procs = [];
function start(name, cmd, args) {
  const p = spawn(cmd, args, { stdio: 'inherit' });
  p.on('exit', (code, signal) => {
    console.log(`${name} exited with code=${code} signal=${signal}`);
    // Kill others and exit with same code
    killAll();
    process.exit(typeof code === 'number' ? code : 0);
  });
  p.on('error', (err) => {
    console.error(`${name} spawn error:`, err);
  });
  procs.push(p);
  return p;
}

function killAll() {
  for (const p of procs) {
    try { p.kill(); } catch (e) {}
  }
}

process.on('SIGINT', () => { console.log('SIGINT received — shutting down'); killAll(); process.exit(0); });
process.on('SIGTERM', () => { console.log('SIGTERM received — shutting down'); killAll(); process.exit(0); });
process.on('exit', () => killAll());

// Start backend
start('server', process.execPath, ['server.js']);

// Start vite by resolving its local bin so we don't rely on npx/cmd.exe
let viteBin;
// Try several ways to find the local vite binary so this script works across environments
try {
  viteBin = require.resolve('vite/bin/vite.js');
} catch (e1) {
  const path = require('path');
  const possible = [
    path.join(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js'),
    path.join(process.cwd(), 'node_modules', '.bin', 'vite'),
  ];
  for (const p of possible) {
    try { require('fs').accessSync(p); viteBin = p; break; } catch (e) {}
  }
}
if (!viteBin) {
  console.error('vite not installed locally. Run: npm install --save-dev vite');
  process.exit(1);
}

// If viteBin points to the .bin shim (on Windows it's a .cmd), execute via process.execPath with the resolved js file if possible
const useExec = viteBin.endsWith('.js');
if (useExec) start('vite', process.execPath, [viteBin]);
else start('vite', viteBin, []);

console.log('Launched server.js and vite — open http://localhost:5173 for the frontend and http://localhost:3000 for the API.');
