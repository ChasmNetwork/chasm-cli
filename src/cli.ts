#!/usr/bin/env node

import { Command } from 'commander';
import { confirm, input, select } from '@inquirer/prompts';
import chalk from 'chalk';
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
} from './utils/network.js';
import {
  installLocalTunnel,
  startLocalTunnel,
} from './utils/local.js';
import { version } from '../package.json';

const program = new Command();

program.version(version).description('Chasm Node CLI');

const promptForNFTSelection = async (
  nfts: { token_id: string; name: string }[]
) => {
  const choices = nfts.map((nft) => ({
    name: `${nft.name} (Token ID: ${nft.token_id})`,
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
  const scoutUidLink = chalk.blue.underline(
    'https://scout.chasm.net/new-scout'
  );
  const webhookApiKeyLink = chalk.blue.underline(
    'https://scout.chasm.net/new-scout'
  );

  let port = await input({
    message: 'Enter the port:',
    default: '3001',
  });

  if (isPortInUse(parseInt(port))) {
    const stopProcess = await confirm({
      message: `Port ${port} is already in use. Would you like to stop the process using this port?`,
      default: true,
    });

    if (stopProcess) {
      stopProcessOnPort(parseInt(port));
    } else {
      port = await input({
        message: 'Enter a different port:',
        default: '3002',
      });
    }
  }

  let webhookURL = `http://localhost:${port}`;
  const ipAddress = getPublicIPAddress();

  const isLocal = await confirm({
    message: 'Are you setting this up on a local computer?',
    default: true,
  });

  if (isLocal) {
    installLocalTunnel();
    const localTunnelURL = await startLocalTunnel(port);
    webhookURL = localTunnelURL;
  } else {
    const ipAddress = getPublicIPAddress();
    webhookURL = await input({
      message: `Enter webhook URL (e.g. http://${ipAddress}:${port}):`,
      default: `http://${ipAddress}:${port}`,
    });
  }

  const answers = {
    PORT: port,
    NODE_ENV: isLocal ? 'local' : 'production',
    LOGGER_LEVEL: 'debug',
    ORCHESTRATOR_URL: 'https://orchestrator.chasm.net/',
    SCOUT_NAME: await input({ message: 'Enter scout name:' }),
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
    GROQ_API_KEY: await input({ message: 'Enter Groq API key:' }),
    OPENROUTER_API_KEY: await input({
      message: 'Enter Openrouter API key (optional):',
    }),
    OPENAI_API_KEY: await input({
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
      chalk.green('Wallet connected: ') + chalk.blue(selectedWallet)
    );
    spinner.start(
      'Logging in...Please sign login message on your wallet..'
    );
    // console.log(
    //   chalk.yellow(`Please sign login message on your wallet...`)
    // );

    await login(selectedWallet);
    spinner.succeed(chalk.green('Logged in successfully.'));

    spinner.start('Fetching NFTs...');
    const nfts = await fetchNFTs(selectedWallet);
    spinner.succeed(chalk.green('NFTs fetched.'));

    const selectedNFT = await promptForNFTSelection(nfts);
    console.log(chalk.green('Selected NFT:') + ` ${selectedNFT}`);

    const { UID, api_key } = await fetchScoutDetails(selectedNFT);

    console.log('UID: ', UID);
    console.log('api_key: ', api_key);

    if (!checkDockerInstallation()) {
      console.log('Docker is not installed. Installing Docker...');
      installDocker();
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
        removeDockerContainer(containerName);
      } else {
        containerName = await input({
          message: 'Enter a different container name:',
          default: 'scout-new',
        });
      }
    }
    setupDocker(containerName);
  } catch (error) {
    console.error('Error during setup:', error);
  } finally {
    process.exit(0);
  }
};

const viewScout = async () => {
  console.log('View my scout functionality to be implemented...');
};

program
  .command('setup')
  .description('Set up Chasm Scout')
  .action(async () => {
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
  });

program.parse(process.argv);
