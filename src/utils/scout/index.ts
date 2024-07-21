import { EthereumProvider } from '@walletconnect/ethereum-provider';
import qrcode from 'qrcode-terminal';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { provider } from '../wallet/index.js';
import { fileURLToPath } from 'url';
import process from 'process';
import { config } from '../../config.js';

const BACKEND_URL = config.BACKEND_URL;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const connectWallet = async () => {
  return new Promise<string>((resolve, reject) => {
    provider.on('display_uri', (uri) => {
      qrcode.generate(uri, { small: true }, (qrcode) => {
        console.log(
          `Scan this QR code to connect your wallet:\n${qrcode}`
        );
      });
    });

    provider.on('connect', (session) => {
      resolve(provider.accounts[0]);
    });

    provider.on('disconnect', (error) => {
      reject(error);
    });

    provider.connect().catch(reject);
  });
};

const fetchLoginMessage = async (address: string) => {
  const response = await fetch(
    `${BACKEND_URL}/login/message?address=${address}`
  );
  const { message } = (await response.json()) as any;
  return message;
};

const fetchJWT = async (address: string, signature: string) => {
  const response = await fetch(`${BACKEND_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      address,
      signature,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch JWT: ${response.statusText}`);
  }

  const data = (await response.json()) as any;
  return data.token;
};

export const login = async (address: string) => {
  const message = await fetchLoginMessage(address);
  const signature = await provider.request({
    method: 'personal_sign',
    params: [message, address],
  });
  const token = await fetchJWT(address, signature as string);
  fs.writeFileSync(path.join(__dirname, 'token.txt'), token);
};

export const fetchScoutDetails = async (scoutId: string) => {
  try {
    // Read the JWT token from the file
    const token = fs.readFileSync(
      path.join(__dirname, 'token.txt'),
      'utf8'
    );

    // Make the GET request to the backend API
    const response = await fetch(
      `${BACKEND_URL}/api/nodes/${scoutId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Return the scout details
    return (await response.json()) as any;
  } catch (error: any) {
    console.error('Error fetching scout details:', error.message);
    throw new Error('Could not fetch scout details.');
  }
};
