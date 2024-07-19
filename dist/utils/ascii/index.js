import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
export const displayAsciiArt = () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const artPath = path.join(__dirname, 'ascii-art.txt');
    const asciiArt = fs.readFileSync(artPath, 'utf8');
    console.log(chalk.green(asciiArt));
};
export const displayHeader = () => {
    console.log(chalk.blueBright.bold(`Welcome to Chasm CLI`));
    console.log(chalk.yellow(`Version: ${'1.0.0'}`));
};