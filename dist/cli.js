#!/usr/bin/env node
import { Command } from 'commander';
import { input, select } from '@inquirer/prompts';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { checkDockerInstallation, installDocker, setupDocker, } from './utils/docker/index.js';
import { displayAsciiArt, displayHeader, } from './utils/ascii/index.js';
import { connectWallet, fetchNFTs } from './utils/wallet/index.js';
dotenv.config();
const program = new Command();
program.version('1.0.0').description('Chasm Node CLI');
const promptForNFTSelection = async (nfts) => {
    const choices = nfts.map((nft) => ({
        name: `${nft.name} (Token ID: ${nft.token_id})`,
        value: nft.token_id,
    }));
    return await select({
        message: 'Select an NFT to use for setting up the scout:',
        choices,
    });
};
const promptForWalletSelection = async (wallets) => {
    if (wallets.length === 1)
        return wallets[0];
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
const setupEnvFile = async () => {
    const scoutUidLink = chalk.blue.underline('https://scout.chasm.net/new-scout');
    const webhookApiKeyLink = chalk.blue.underline('https://scout.chasm.net/new-scout');
    const answers = {
        PORT: await input({
            message: 'Enter the port:',
            default: '3001',
        }),
        LOGGER_LEVEL: 'debug',
        ORCHESTRATOR_URL: await input({
            message: 'Enter orchestrator URL:',
            default: 'https://orchestrator.chasm.net',
        }),
        SCOUT_NAME: await input({ message: 'Enter scout name:' }),
        SCOUT_UID: await input({
            message: `Enter scout UID (Get here: ${scoutUidLink} ):`,
        }),
        WEBHOOK_API_KEY: await input({
            message: `Enter webhook API key (Get here: ${webhookApiKeyLink} ):`,
        }),
        WEBHOOK_URL: await input({
            message: 'Enter webhook URL (e.g. http://your-ip:3001):',
        }),
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
    fs.writeFileSync(path.join(process.cwd(), '.env'), envContent);
    console.log('.env file has been created successfully.');
};
program
    .command('setup')
    .description('Set up Chasm Scout')
    .action(async () => {
    displayAsciiArt();
    displayHeader();
    try {
        const wallets = await connectWallet();
        console.log('session: ', wallets);
        const selectedWallet = await promptForWalletSelection(wallets);
        console.log(`Selected wallet: ${selectedWallet}`);
        const nfts = await fetchNFTs(selectedWallet);
        console.log('NFTs fetched:', nfts);
        const selectedNFT = await promptForNFTSelection(nfts);
        console.log('Selected NFT:', selectedNFT);
        // Fetch scout UID and API key based on selected NFT
        // Implement logic here...
        if (!checkDockerInstallation()) {
            console.log('Docker is not installed. Installing Docker...');
            installDocker();
        }
        else {
            console.log('Docker is already installed.');
        }
        await setupEnvFile();
        setupDocker();
    }
    catch (error) {
        console.error('Error during setup:', error);
    }
});
program.parse(process.argv);
