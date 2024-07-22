import { build } from 'esbuild';
import fs from 'fs';
import path from 'path';

const copyFile = (src, dest) => {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
};

const copyAsciiArt = () => {
  const srcPath = 'src/utils/ascii/ascii-art.txt';
  const destPaths = [
    'dist/utils/ascii/ascii-art.txt',
    'dist/ascii-art.txt',
  ];

  destPaths.forEach((dest) => {
    copyFile(srcPath, dest);
  });
};

// Copy ascii-art.txt to both dist/utils/ascii and dist
copyAsciiArt();

// Build with esbuild
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
    'localtunnel',
    'ora',
    'qrcode-terminal',
    'web3',
  ],
}).catch(() => process.exit(1));
