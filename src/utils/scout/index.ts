import { EthereumProvider } from '@walletconnect/ethereum-provider';
import qrcode from 'qrcode-terminal';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { provider } from '../wallet/index.js';
import process from 'process';
import { config } from '../../config.js';

const BACKEND_URL = config.BACKEND_URL;

// Resolve the paths relative to the current working directory
const tokenPath = path.resolve(
  process.cwd(),
  'dist/utils/scout/token.txt'
);

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
  let providerEth = await provider();
  const message = await fetchLoginMessage(address);
  const signature = await providerEth.request({
    method: 'personal_sign',
    params: [message, address],
  });
  const token = await fetchJWT(address, signature as string);
  fs.writeFileSync(tokenPath, token);
};

export const fetchScoutDetails = async (scoutId: string) => {
  try {
    // Read the JWT token from the file
    const token = fs.readFileSync(tokenPath, 'utf8');

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
