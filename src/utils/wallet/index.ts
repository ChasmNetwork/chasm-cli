import { EthereumProvider } from '@walletconnect/ethereum-provider';
import qrcode from 'qrcode-terminal';
import { Web3, ContractAbi } from 'web3';
import fs from 'fs';
import path from 'path';
import { abi as ScoutABI } from '../../abi/ChasmScout.abi.js';
import { config } from '../../config.js';

export const provider = async () =>
  await EthereumProvider.init({
    projectId: config.PROJECT_ID!,
    metadata: {
      name: 'Chasm CLI',
      description: 'CLI for Chasm Node',
      url: 'https://scout.chasm.net',
      icons: ['https://www.chasm.net/logo.png'],
    },
    showQrModal: false,
    optionalChains: [1, 56, 5000],
  });

function importJsonFile(filePath: string): object {
  const absolutePath = path.resolve(__dirname, filePath);
  const fileContent = fs.readFileSync(absolutePath, 'utf-8');
  try {
    const jsonData = JSON.parse(fileContent);
    return jsonData;
  } catch (error: any) {
    throw new Error(`Error parsing JSON file: ${error.message}`);
  }
}

export const connectWallet = async () => {
  let providerEth = await provider();
  return new Promise((resolve, reject) => {
    providerEth.on('display_uri', (uri) => {
      qrcode.generate(uri, { small: true }, (qrcode) => {
        console.log(
          `Scan this QR code to connect your wallet:\n${qrcode}`
        );
      });
    });

    providerEth.on('connect', (session) => {
      resolve(providerEth.accounts);
    });

    providerEth.on('disconnect', (error) => {
      reject(error);
    });

    providerEth.connect().catch(reject);
  });
};

export const fetchNFTs = async (address: string) => {
  const web3 = new Web3(
    `https://mantle-mainnet.infura.io/v3/${config.INFURA_KEY}`
  );
  const contract = new web3.eth.Contract(
    ScoutABI as ContractAbi,
    config.CONTRACT
  );

  const balance = Number(
    await contract.methods.balanceOf(address).call()
  ); // Convert balance to number
  const tokens: string[] = [];
  const batchSize = 10;

  for (let i = 0; i < balance; i += batchSize) {
    const batchTokens = await contract.methods
      .getAllTokensByOwner(address, i, batchSize)
      .call();
    tokens.push(...(batchTokens as string[]));
  }

  return tokens.map((tokenId) => ({
    token_id: tokenId.toString(), // Convert BigInt to string
    name: `Token #${tokenId.toString()}`, // Convert BigInt to string
  }));
};
