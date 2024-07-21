import { build } from 'esbuild';
import { sync as globSync } from 'glob';
import path from 'path';
import fs from 'fs';

// Copy non-TypeScript files (e.g., ASCII art)
const copyFiles = () => {
  const files = globSync('src/**/*.txt');
  files.forEach((file) => {
    const dest = file.replace('src', 'dist');
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(file, dest);
  });
};

copyFiles();

build({
  entryPoints: ['src/cli.ts'],
  bundle: true,
  minify: true,
  platform: 'node',
  target: 'node16', // Use node16 to ensure compatibility
  format: 'esm', // Set the output format to ESM
  outfile: 'dist/cli.js',
  external: [
    '@inquirer/prompts',
    '@walletconnect/ethereum-provider',
    'node-fetch',
    'kleur',
    'yargs',
    'dotenv',
    'execa',
    'glob',
    'localtunnel',
    'ora',
    'qrcode-terminal',
    'web3',
  ],
}).catch(() => process.exit(1));
