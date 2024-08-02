import path from 'path';
import fs from 'fs';
import kleur from 'kleur';
import { bold } from 'kleur/colors';

// Resolve the paths relative to the current working directory
const artPath = path.resolve(
  process.cwd(),
  'dist/utils/ascii/ascii-art.txt'
);
const packageJsonPath = path.resolve(process.cwd(), 'package.json');

// Read the version from package.json
const { version } = JSON.parse(
  fs.readFileSync(packageJsonPath, 'utf8')
);

export const displayAsciiArt = () => {
  const asciiArt = fs.readFileSync(artPath, 'utf8');
  console.log(kleur.cyan(asciiArt));
};

export const displayHeader = () => {
  console.log(bold(kleur.cyan(`Welcome to Chasm CLI`)));
  console.log(kleur.yellow(`Version: ${version}`));
};
