#!/usr/bin/env node

import yargs, { command } from 'yargs';
import { hideBin } from 'yargs/helpers';
import { select } from '@inquirer/prompts';
import { version } from './utils/ascii/index.js';

import {
  displayAsciiArt,
  displayHeader,
} from './utils/ascii/index.js';
import { setup } from './commands/setup.js';
import { view } from './commands/view.js';

const mainMenu = async () => {
  const choices = [
    { name: 'Setup new scout', value: 'setup' },
    { name: 'View my scout', value: 'view' },
    { name: 'Exit', value: 'exit' },
  ];

  const selectedOption = await select({
    message: 'Choose an option:',
    choices,
  });

  switch (selectedOption) {
    case 'setup':
      await setup();
      break;
    case 'view':
      await view();
      break;
    case 'exit':
      process.exit(0);
    default:
      console.log('Invalid option selected.');
      break;
  }
};

const helpMessage = `
Usage:
chasm [command]
chasm [options]

Commands:
  setup    Set up Chasm Scout
  view     View my scout

Options:
  -v, --version  Show version number
  -h, --help     Show help message

For more information, visit https://scout.chasm.net
`;

yargs(hideBin(process.argv))
  .usage(helpMessage)
  .command(
    'setup',
    'Set up Chasm Scout',
    () => {},
    async () => {
      console.clear();
      displayAsciiArt();
      displayHeader();
      await setup();
    }
  )
  .command(
    'view',
    'View my scout',
    () => {},
    async () => {
      await view();
    }
  )
  .command(
    '*',
    'default command',
    () => {},
    async () => {
      displayAsciiArt();
      displayHeader();
      await mainMenu();
    }
  )
  .help(false) // Disable built-in help
  .alias('h', 'help')
  .version(version)
  .alias('v', 'version')
  .demandCommand(1, 'You need to specify a command')
  .epilogue('For more information, visit https://scout.chasm.net')
  .wrap(null).argv;

if (process.argv.includes('-h') || process.argv.includes('--help')) {
  console.clear();
  console.log(helpMessage);
  process.exit(0);
}
