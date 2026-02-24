import {
  existsSync,
  mkdirSync,
  readdirSync,
  copyFileSync,
  readFileSync,
  writeFileSync,
} from 'fs';
import { join } from 'path';
import { homedir, platform } from 'os';
import { execSync } from 'child_process';
import { createInterface } from 'readline';

const PROJECT_ROOT = join(import.meta.dirname, '..');
const ICONS_DIR = join(PROJECT_ROOT, 'public', 'icons');
const CONFIG_FILE = join(PROJECT_ROOT, '.factorio-path');
const ICON_CATEGORIES = ['item', 'recipe', 'fluid', 'technology'];

const force = process.argv.includes('--force');

// ── 1. Check if icons already exist ─────────────────────────────────────────

if (!force) {
  const hasIcons =
    existsSync(ICONS_DIR) &&
    ICON_CATEGORIES.some((cat) => {
      const dir = join(ICONS_DIR, cat);
      return (
        existsSync(dir) &&
        readdirSync(dir).some((f) => f.endsWith('.png'))
      );
    });

  if (hasIcons) {
    console.log('Icons already exist. Use --force to re-dump.');
    process.exit(0);
  }
}

// ── 2. Resolve Factorio install path ────────────────────────────────────────

function getExeRelPath(): string {
  switch (platform()) {
    case 'win32':
      return join('bin', 'x64', 'factorio.exe');
    case 'darwin':
      return join('Contents', 'MacOS', 'factorio');
    default:
      return join('bin', 'x64', 'factorio');
  }
}

function getDefaultSearchPaths(): string[] {
  const home = homedir();
  switch (platform()) {
    case 'win32':
      return [
        'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Factorio',
        'C:\\Program Files\\Factorio',
      ];
    case 'darwin':
      return [
        join(home, 'Library', 'Application Support', 'Steam', 'steamapps', 'common', 'Factorio', 'factorio.app'),
        '/Applications/factorio.app',
      ];
    default:
      return [
        join(home, '.steam', 'steam', 'steamapps', 'common', 'Factorio'),
        join(home, '.local', 'share', 'Steam', 'steamapps', 'common', 'Factorio'),
      ];
  }
}

function getScriptOutputDir(): string {
  const home = homedir();
  switch (platform()) {
    case 'win32':
      return join(process.env.APPDATA ?? join(home, 'AppData', 'Roaming'), 'Factorio', 'script-output');
    case 'darwin':
      return join(home, 'Library', 'Application Support', 'factorio', 'script-output');
    default:
      return join(home, '.factorio', 'script-output');
  }
}

function getPlatformExamples(): string[] {
  switch (platform()) {
    case 'win32':
      return [
        'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Factorio',
        'C:\\Program Files\\Factorio',
      ];
    case 'darwin':
      return [
        '~/Library/Application Support/Steam/steamapps/common/Factorio/factorio.app',
        '/Applications/factorio.app',
      ];
    default:
      return [
        '~/.steam/steam/steamapps/common/Factorio',
        '~/.local/share/Steam/steamapps/common/Factorio',
      ];
  }
}

function verifyInstallDir(installDir: string): string | null {
  const exePath = join(installDir, getExeRelPath());
  return existsSync(exePath) ? exePath : null;
}

function readConfigFile(): string | null {
  if (!existsSync(CONFIG_FILE)) return null;
  const saved = readFileSync(CONFIG_FILE, 'utf-8').trim();
  if (!saved) return null;
  const exe = verifyInstallDir(saved);
  if (!exe) {
    console.warn(`Warning: Saved path in .factorio-path is invalid (${saved}), ignoring.`);
    return null;
  }
  return saved;
}

function autoDetect(): string | null {
  for (const candidate of getDefaultSearchPaths()) {
    if (verifyInstallDir(candidate)) {
      console.log(`Auto-detected Factorio at: ${candidate}`);
      return candidate;
    }
  }
  return null;
}

async function promptUser(): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string): Promise<string> =>
    new Promise((resolve) => rl.question(q, resolve));

  const examples = getPlatformExamples();
  console.log('\nCould not auto-detect Factorio installation.');
  console.log('Please enter the path to your Factorio install directory.\n');
  console.log('Examples:');
  for (const ex of examples) {
    console.log(`  ${ex}`);
  }
  console.log();

  while (true) {
    const input = (await ask('Factorio install path: ')).trim();
    if (!input) continue;

    const exe = verifyInstallDir(input);
    if (exe) {
      rl.close();
      return input;
    }

    const expected = join(input, getExeRelPath());
    console.log(`\nCould not find executable at: ${expected}`);
    console.log('Please check the path and try again.\n');
  }
}

async function resolveInstallPath(): Promise<string> {
  return readConfigFile() ?? autoDetect() ?? (await promptUser());
}

// ── 3. Run dump and copy icons ──────────────────────────────────────────────

async function main() {
  const installDir = await resolveInstallPath();
  const exePath = join(installDir, getExeRelPath());

  // Run --dump-icon-sprites
  console.log(`\nRunning: "${exePath}" --dump-icon-sprites`);
  console.log('This may take a moment...\n');

  try {
    execSync(`"${exePath}" --dump-icon-sprites`, {
      timeout: 120_000,
      stdio: 'inherit',
    });
  } catch (err) {
    // Factorio sometimes crashes/exits non-zero after completing the dump.
    // Check if icons actually landed before giving up.
    console.warn('Warning: Factorio exited with an error (this can be normal after icon dump).');
  }

  // Locate script-output
  const scriptOutput = getScriptOutputDir();
  if (!existsSync(scriptOutput)) {
    console.error(
      `\nError: script-output directory not found at: ${scriptOutput}\n` +
      'The icon dump may have failed. Ensure you are running Factorio 1.1.77+\n' +
      'and that the game has write access to its user data directory.',
    );
    process.exit(1);
  }

  // Copy icons
  mkdirSync(ICONS_DIR, { recursive: true });
  let totalCopied = 0;

  for (const category of ICON_CATEGORIES) {
    const srcDir = join(scriptOutput, category);
    if (!existsSync(srcDir)) {
      console.warn(`Warning: No ${category}/ directory in script-output, skipping.`);
      continue;
    }

    const destDir = join(ICONS_DIR, category);
    mkdirSync(destDir, { recursive: true });

    const pngs = readdirSync(srcDir).filter((f) => f.endsWith('.png'));
    for (const png of pngs) {
      copyFileSync(join(srcDir, png), join(destDir, png));
    }

    console.log(`  ${category}/: ${pngs.length} icons`);
    totalCopied += pngs.length;
  }

  // Save install path for next time
  writeFileSync(CONFIG_FILE, installDir + '\n');

  console.log(`\nDone! ${totalCopied} icons copied to public/icons/`);
}

main();
