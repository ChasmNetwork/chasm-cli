import { EthereumProvider } from '@walletconnect/ethereum-provider';
import qrcode from 'qrcode-terminal';
import fetch from 'node-fetch';
import { provider } from '../wallet/index.js';
import { config } from '../../config.js';

const BACKEND_URL = config.BACKEND_URL;

// In-memory storage for the token
let token: string | null = null;

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
  token = await fetchJWT(address, signature as string);
  console.log('Logged in successfully, token stored in memory.');
};

export const fetchScoutDetails = async (scoutId: string) => {
  try {
    // Check if the token is available
    if (!token) {
      throw new Error('Token not found. Please log in first.');
    }

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
