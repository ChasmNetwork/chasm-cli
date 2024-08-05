import { setupEnvFile } from '../utils/env.js';
import { connectWallet, fetchNFTs } from '../utils/wallet/index.js';
import { fetchScoutDetails, login } from '../utils/scout/index.js';
import kleur from 'kleur';
import {
  checkDockerInstallation,
  installDocker,
  isContainerNameInUse,
  removeDockerContainer,
  setupDocker,
} from '../utils/docker/index.js';
import { confirm, input } from '@inquirer/prompts';
import {
  promptForWalletSelection,
  promptForNFTSelection,
} from '../utils/prompt.js';

import ora from 'ora';
export const setup = async () => {
  try {
    const wallets: any = await connectWallet();
    const spinner = ora('Connecting wallet...').start();
    const selectedWallet = await promptForWalletSelection(wallets);

    console.log(`Selected wallet: ${selectedWallet}`);
    spinner.succeed(
      kleur.green('Wallet connected: ') + kleur.blue(selectedWallet)
    );
    spinner.start(
      'Logging in...Please sign login message on your wallet..'
    );

    await login(selectedWallet);
    spinner.succeed(kleur.green('Logged in successfully.'));

    spinner.start('Fetching NFTs...');
    const nfts = await fetchNFTs(selectedWallet);
    spinner.succeed(kleur.green('NFTs fetched.'));

    const selectedNFT = await promptForNFTSelection(nfts);
    console.log(kleur.green('Selected NFT:') + ` ${selectedNFT}`);

    const { UID, api_key } = await fetchScoutDetails(selectedNFT);

    if (!(await checkDockerInstallation())) {
      console.log(
        'Docker is not installed. Please install docker first using this guide: ',
        kleur
          .blue()
          .bold()
          .underline('https://docs.docker.com/engine/install/ubuntu/')
      );
      process.exit();
      // await installDocker(); // Make sure installDocker is also async
    } else {
      console.log('Docker is already installed.');
    }

    await setupEnvFile(UID, api_key);

    let containerName = `scout-${UID}`;
    if (await isContainerNameInUse(containerName)) {
      const removeContainer = await confirm({
        message: `Container with name "${containerName}" already exists. Would you like to remove it?`,
        default: true,
      });

      if (removeContainer) {
        await removeDockerContainer(containerName);
      } else {
        containerName = await input({
          message: 'Enter a different container name:',
          default: 'scout-new',
        });
      }
    }
    await setupDocker(containerName);
  } catch (error) {
    console.error('Error during setup:', error);
  } finally {
    process.exit(0);
  }
};
