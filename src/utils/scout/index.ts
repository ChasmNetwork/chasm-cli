import { EthereumProvider } from '@walletconnect/ethereum-provider';
import qrcode from 'qrcode-terminal';
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { provider } from '../wallet/index.js';
import { fileURLToPath } from 'url';
import process from 'process';

dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL;
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
  const response = await axios.get(
    `${BACKEND_URL}/login/message?address=${address}`
  );
  return response.data.message;
};

const fetchJWT = async (address: string, signature: string) => {
  const response = await axios.post(`${BACKEND_URL}/login`, {
    address,
    signature,
  });
  return response.data.token;
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
    const response = await axios.get(
      `${BACKEND_URL}/api/nodes/${scoutId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Return the scout details
    console.log('Scout details:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching scout details:', error.message);
    throw new Error('Could not fetch scout details.');
  }
};
