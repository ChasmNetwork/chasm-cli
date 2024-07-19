import { EthereumProvider } from '@walletconnect/ethereum-provider';
import qrcode from 'qrcode-terminal';
import { Web3 } from 'web3';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { abi as ScoutABI } from '../../abi/ChasmScout.abi.js';
// Function to import JSON file with path resolution
function importJsonFile(filePath) {
    const absolutePath = path.resolve(__dirname, filePath);
    const fileContent = fs.readFileSync(absolutePath, 'utf-8');
    try {
        const jsonData = JSON.parse(fileContent);
        return jsonData;
    }
    catch (error) {
        throw new Error(`Error parsing JSON file: ${error.message}`);
    }
}
// Adjust the path to ChasmScout.json based on the current directory
// const ScoutABI = importJsonFile('../../abi/ChasmScout.json');
dotenv.config();
export const connectWallet = async () => {
    const provider = await EthereumProvider.init({
        projectId: process.env.PROJECT_ID, // Get your project ID at https://cloud.walletconnect.com
        metadata: {
            name: 'Chasm CLI',
            description: 'CLI for Chasm Node',
            url: 'https://scout.chasm.net', // Make sure this matches your actual domain
            icons: ['https://www.chasm.net/logo.png'],
        },
        showQrModal: false,
        optionalChains: [1, 56, 5000],
    });
    return new Promise((resolve, reject) => {
        provider.on('display_uri', (uri) => {
            qrcode.generate(uri, { small: true }, (qrcode) => {
                console.log(`Scan this QR code to connect your wallet:\n${qrcode}`);
            });
        });
        provider.on('connect', (session) => {
            resolve(provider.accounts);
        });
        provider.on('disconnect', (error) => {
            reject(error);
        });
        provider.connect().catch(reject);
    });
};
export const fetchNFTs = async (address) => {
    const web3 = new Web3(`https://mantle-mainnet.infura.io/v3/${process.env.INFURA_KEY}`);
    const contract = new web3.eth.Contract(ScoutABI, process.env.CONTRACT);
    const balance = Number(await contract.methods.balanceOf(address).call()); // Convert balance to number
    const tokens = [];
    const batchSize = 10;
    for (let i = 0; i < balance; i += batchSize) {
        const batchTokens = await contract.methods
            .getAllTokensByOwner(address, i, batchSize)
            .call();
        tokens.push(...batchTokens);
    }
    return tokens.map((tokenId) => ({
        token_id: tokenId.toString(), // Convert BigInt to string
        name: `Token #${tokenId.toString()}`, // Convert BigInt to string
    }));
};
