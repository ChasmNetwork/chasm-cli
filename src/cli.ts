#!/usr/bin/env node

import yargs, { command } from 'yargs';
import { hideBin } from 'yargs/helpers';
import { select } from '@inquirer/prompts';

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

yargs(hideBin(process.argv))
  .usage('Usage: $0 <command> [options]')
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
  .demandCommand(1, 'You need to specify a command')
  .help()
  .alias('h', 'help')
  .epilogue('For more information, visit https://scout.chasm.net')
  .wrap(null).argv;
