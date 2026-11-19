#!/usr/bin/env node
/**
 * Run a firebase-tools command with this machine's local JRE and with every
 * temp/cache directory kept on the drive that has free space.
 *
 * Why this exists: the Firestore emulator needs a JRE that is not on PATH
 * here, and the system temp/home directories live on a full drive, so the
 * emulator binaries cannot be downloaded into ~/.cache. This wrapper points
 * both at the portable toolchain in `../.tools` (relative to the project) so
 * the emulator suite and the rules tests run with no shell exports.
 *
 * Nothing is hard-coded to a single machine: each path is discovered and only
 * applied when it exists. Any variable already set in the environment wins.
 *
 *   npm run emulators:local                     # emulators:start auth + firestore
 *   npm run test:rules                          # emulators:exec around vitest
 *   node scripts/dev/local-firebase.mjs emulators:start --only auth
 */
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..', '..');
const toolsDir = resolve(
  process.env.ISCHOOLIE_TOOLS_DIR ?? join(projectRoot, '..', '.tools'),
);

/** First directory under `jre21/` that actually contains a java executable. */
function findJavaHome() {
  const candidates = [process.env.ISCHOOLIE_JAVA_HOME, process.env.JAVA_HOME].filter(Boolean);

  const jreRoot = join(toolsDir, 'jre21');
  if (existsSync(jreRoot)) {
    for (const entry of readdirSync(jreRoot)) {
      candidates.push(join(jreRoot, entry));
    }
  }

  const exe = process.platform === 'win32' ? 'java.exe' : 'java';
  for (const candidate of candidates) {
    if (candidate && existsSync(join(candidate, 'bin', exe))) return candidate;
  }
  return null;
}

const applied = [];

function setIfUnset(name, value) {
  if (process.env[name] || !value || !existsSync(value)) return;
  process.env[name] = value;
  applied.push(`${name}=${value}`);
}

const javaHome = findJavaHome();
if (javaHome) {
  // JAVA_HOME is honoured by the Firebase CLI; PATH makes a bare `java` work too.
  if (!process.env.JAVA_HOME) {
    process.env.JAVA_HOME = javaHome;
    applied.push(`JAVA_HOME=${javaHome}`);
  }
  const separator = process.platform === 'win32' ? ';' : ':';
  const binDir = join(javaHome, 'bin');
  if (!(process.env.PATH ?? '').split(separator).includes(binDir)) {
    process.env.PATH = `${binDir}${separator}${process.env.PATH ?? ''}`;
    applied.push(`PATH+=${binDir}`);
  }
  // The Firestore emulator is a JVM. On a loaded laptop its default heap
  // (a quarter of system RAM) can be the difference between starting and
  // dying with "insufficient memory". Cap it; override with ISCHOOLIE_JAVA_OPTS.
  if (!process.env.JAVA_TOOL_OPTIONS) {
    process.env.JAVA_TOOL_OPTIONS =
      process.env.ISCHOOLIE_JAVA_OPTS ?? '-Xms64m -Xmx512m -XX:MaxMetaspaceSize=256m';
    applied.push(`JAVA_TOOL_OPTIONS=${process.env.JAVA_TOOL_OPTIONS}`);
  }
}

// Temp and cache locations: the emulator downloads its jars into the home
// cache and unpacks archives into temp, so both must be on a writable drive.
const tmpDir = join(toolsDir, 'tmp');
const homeDir = join(toolsDir, 'home');
for (const name of ['TMP', 'TEMP', 'TMPDIR']) setIfUnset(name, tmpDir);
for (const name of ['HOME', 'USERPROFILE']) setIfUnset(name, homeDir);

if (!javaHome) {
  console.warn(
    '[local-firebase] No local JRE found — falling back to `java` on PATH.\n' +
      `                 Expected one under ${join(toolsDir, 'jre21')} or JAVA_HOME.`,
  );
}
if (applied.length > 0) {
  console.log('[local-firebase] applied:');
  for (const line of applied) console.log(`  ${line}`);
} else {
  console.log('[local-firebase] environment already configured; nothing to change.');
}

const cli = join(projectRoot, 'node_modules', 'firebase-tools', 'lib', 'bin', 'firebase.js');
if (!statSync(cli, { throwIfNoEntry: false })) {
  console.error('[local-firebase] firebase-tools is not installed. Run `npm install` first.');
  process.exit(1);
}

const DEFAULT_ARGS = ['emulators:start', '--only', 'auth,firestore', '--project', 'demo-ischoolie'];
const forwarded = process.argv.slice(2);

const child = spawn(process.execPath, [cli, ...(forwarded.length > 0 ? forwarded : DEFAULT_ARGS)], {
  cwd: projectRoot,
  stdio: 'inherit',
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}

child.on('exit', (code, signal) => {
  process.exit(signal ? 1 : (code ?? 0));
});
