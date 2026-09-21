import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const previewUrl = 'http://127.0.0.1:4174/digital-business-card/';
const viteCli = join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const playwrightCli = join(
  projectRoot,
  'node_modules',
  '@playwright',
  'test',
  'cli.js',
);

const wait = (milliseconds) =>
  new Promise((resolveWait) => setTimeout(resolveWait, milliseconds));

async function isPortAvailable(port) {
  return new Promise((resolveAvailable) => {
    const probe = createServer();
    probe.once('error', () => resolveAvailable(false));
    probe.listen(port, '127.0.0.1', () => {
      probe.close(() => resolveAvailable(true));
    });
  });
}

async function waitForPreview() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(previewUrl, {
        signal: AbortSignal.timeout(500),
      });
      if (response.ok) return;
    } catch {
      // Vite is still starting.
    }
    await wait(250);
  }
  throw new Error(`Preview server did not start: ${previewUrl}`);
}

function run(command, args) {
  return new Promise((resolveExit, rejectExit) => {
    const child = spawn(command, args, { cwd: projectRoot, stdio: 'inherit' });
    child.once('error', rejectExit);
    child.once('exit', (code) => resolveExit(code ?? 1));
  });
}

if (!(await isPortAvailable(4174))) {
  throw new Error(
    'Port 4174 is already in use. Stop the existing Preview server before running E2E tests.',
  );
}

const preview = spawn(
  process.execPath,
  [viteCli, 'preview', '--host', '127.0.0.1', '--port', '4174', '--strictPort'],
  { cwd: projectRoot, stdio: 'inherit' },
);

let previewExited = false;
preview.once('exit', () => {
  previewExited = true;
});

try {
  await waitForPreview();
  const testExitCode = await run(process.execPath, [playwrightCli, 'test']);
  if (testExitCode !== 0) process.exitCode = testExitCode;
} finally {
  if (!preview.killed && !previewExited) preview.kill();
  for (let attempt = 0; attempt < 20 && !previewExited; attempt += 1)
    await wait(100);
  if (!previewExited) {
    console.error('The test Preview server did not stop cleanly.');
    process.exitCode = process.exitCode ?? 1;
  }
}
