import chalk from 'chalk';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { version } from '../../../package.json';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const displayAsciiArt = () => {
  const artPath = path.join(__dirname, 'ascii-art.txt');
  const asciiArt = fs.readFileSync(artPath, 'utf8');
  console.log(chalk.green(asciiArt));
};

export const displayHeader = () => {
  console.log(chalk.blueBright.bold(`Welcome to Chasm CLI`));
  console.log(chalk.yellow(`Version: ${version}`));
};
