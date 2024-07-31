#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { confirm, input, select, password } from '@inquirer/prompts';
import kleur from 'kleur';
import { underline } from 'kleur/colors';
import fs from 'fs';
import path from 'path';
import {
  checkDockerInstallation,
  installDocker,
  isContainerNameInUse,
  removeDockerContainer,
  setupDocker,
} from './utils/docker/index.js';
import {
  displayAsciiArt,
  displayHeader,
} from './utils/ascii/index.js';
import { connectWallet, fetchNFTs } from './utils/wallet/index.js';
import { fetchScoutDetails, login } from './utils/scout/index.js';
import ora from 'ora';
import {
  getPublicIPAddress,
  isPortInUse,
  stopProcessOnPort,
  isPortOpenToPublic,
  openFirewallPort,
} from './utils/network.js';
import {
  installLocalTunnel,
  startLocalTunnel,
} from './utils/local.js';
import { version } from '../package.json';

const promptForNFTSelection = async (
  nfts: { token_id: string; name: string }[]
) => {
  const choices = nfts.map((nft) => ({
    name: `${nft.name}`,
    value: nft.token_id,
  }));
  return await select({
    message: 'Select an NFT to use for setting up the scout:',
    choices,
  });
};

const promptForWalletSelection = async (wallets: string[]) => {
  if (wallets.length === 1) return wallets[0];

  const choices = wallets.map((wallet) => ({
    name: wallet,
    value: wallet,
  }));

  const selectedWallet = await select({
    message: 'Select a wallet to use:',
    choices,
  });

  return selectedWallet;
};

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

  return selectedOption;
};

const setupEnvFile = async (
  scoutUID: string,
  webhookApiKey: string
) => {
  const scoutUidLink = underline(
    kleur.blue('https://scout.chasm.net/new-scout')
  );
  const webhookApiKeyLink = underline(
    kleur.blue('https://scout.chasm.net/new-scout')
  );

  let port = await input({
    message: 'Enter the port:',
    default: '3001',
  });

  const isLocal = await confirm({
    message: 'Are you setting this up on a local computer?',
    default: true,
  });

  if (!isLocal) {
    if (isPortInUse(parseInt(port))) {
      const changePort = await confirm({
        message: `Port ${port} is already in use. Would you like to enter a different port?`,
        default: true,
      });

      if (changePort) {
        port = await input({
          message: 'Enter a different port:',
          default: '3002',
        });
      } else {
        console.log(
          'Please make the port available and rerun the script.'
        );
        process.exit(0);
      }
    }

    if (!(await isPortOpenToPublic(parseInt(port)))) {
      const openFirewall = await confirm({
        message: `Port ${port} is not open to the public. Would you like to open it in the firewall?`,
        default: true,
      });

      if (openFirewall) {
        await openFirewallPort(parseInt(port));
      } else {
        console.log(
          `Port ${port} is not open to the public. Exiting.`
        );
        process.exit(0);
      }
    }
  }

  let webhookURL = `http://localhost:${port}`;

  // if (isLocal) {
  //   installLocalTunnel();
  //   const localTunnelURL = await startLocalTunnel(port);
  //   webhookURL = localTunnelURL;
  // } else {
  //   const ipAddress = getPublicIPAddress();
  //   webhookURL = await input({
  //     message: `Enter webhook URL (suggestion: http://${ipAddress}:${port}):`,
  //     default: `http://${ipAddress}:${port}`,
  //   });
  // }

  // const ipAddress = getPublicIPAddress();
  // webhookURL = await input({
  //   message: `Enter webhook URL (suggestion: http://${ipAddress}:${port}):`,
  //   default: `http://${ipAddress}:${port}`,
  // });

  webhookURL = await input({
    message: `Enter webhook URL (suggestion: http://localhost:${port}):`,
    default: `http://localhost:${port}`,
  });

  const answers = {
    PORT: port,
    NODE_ENV: 'production',
    LOGGER_LEVEL: 'debug',
    ORCHESTRATOR_URL: 'https://orchestrator.chasm.net/',
    SCOUT_NAME: await input({
      message: 'Enter scout name:',
      validate: function (input) {
        if (input.trim() === '') {
          return 'Scout name is required.';
        }
        return true;
      },
    }),
    SCOUT_UID: scoutUID,
    WEBHOOK_API_KEY: webhookApiKey,
    WEBHOOK_URL: webhookURL,
    PROVIDERS: await input({
      message: 'Enter providers:',
      default: 'groq',
    }),
    MODEL: await input({
      message: 'Enter model:',
      default: 'gemma2-9b-it',
    }),
    GROQ_API_KEY: await password({
      message: 'Enter Groq API key:',
      mask: '*',
      validate: function (input) {
        if (input.trim() === '') {
          return 'Groq API key is required.';
        }
        return true;
      },
    }),
    OPENROUTER_API_KEY: await password({
      mask: '*',
      message: 'Enter Openrouter API key (optional):',
    }),
    OPENAI_API_KEY: await password({
      mask: '*',
      message: 'Enter OpenAI API key (optional):',
    }),
  };

  const envContent = Object.entries(answers)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  fs.writeFileSync(
    path.join(process.cwd(), '.env.scout'),
    envContent
  );
  console.log('.env file has been created successfully.');
};

const setupScout = async () => {
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
        underline(
          kleur.blue('https://docs.docker.com/engine/install/ubuntu/')
        )
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

const viewScout = async () => {
  console.log('View my scout functionality to be implemented...');
};

yargs(hideBin(process.argv))
  .command(
    'setup',
    'Set up Chasm Scout',
    () => {},
    async () => {
      displayAsciiArt();
      displayHeader();

      const selectedOption = await mainMenu();

      if (selectedOption === 'setup') {
        await setupScout();
      } else if (selectedOption === 'view') {
        await viewScout();
      } else if (selectedOption === 'exit') {
        process.exit(0);
      }
    }
  )
  .demandCommand(1, 'You need to specify a command (e.g., setup) to run the CLI.')
  .help().argv;
