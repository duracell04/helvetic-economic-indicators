import { spawn } from 'node:child_process';
import path from 'node:path';
import { createDemo } from './lib/atlas-data.ts';
const command = process.argv[2];
if (!['dev', 'build', 'preview'].includes(command)) throw new Error('Use dev, build or preview');
await createDemo(process.cwd());
const child = spawn(process.execPath, [path.resolve('node_modules/astro/bin/astro.mjs'), command, ...process.argv.slice(3)], {
  stdio: 'inherit', env: { ...process.env, HEI_DEMO: '1', ASTRO_TELEMETRY_DISABLED: '1' },
});
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => child.kill(signal));
child.on('exit', code => { process.exitCode = code ?? 1; });
