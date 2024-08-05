import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export const help = () => {
  yargs(hideBin(process.argv)).showHelp();
};
