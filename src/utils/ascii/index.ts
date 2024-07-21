import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { version } from '../../../package.json';
import kleur from 'kleur';
import { bold } from 'kleur/colors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const displayAsciiArt = () => {
  const artPath = path.join(__dirname, 'ascii-art.txt');
  const asciiArt = fs.readFileSync(artPath, 'utf8');
  console.log(kleur.cyan(asciiArt));
};

export const displayHeader = () => {
  console.log(bold(kleur.cyan(`Welcome to Chasm CLI`)));
  console.log(kleur.yellow(`Version: ${version}`));
};
