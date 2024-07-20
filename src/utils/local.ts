import { execSync, spawn } from 'child_process';
import { input } from '@inquirer/prompts';
import localtunnel from 'localtunnel';

export const installLocalTunnel = () => {
  console.log('Installing LocalTunnel...');
  try {
    execSync('npm install -g localtunnel', { stdio: 'inherit' });
    console.log('LocalTunnel installed successfully.');
  } catch (error) {
    console.error(
      'Failed to install LocalTunnel. Please install it manually.'
    );
    process.exit(1);
  }
};

export const startLocalTunnel = async (
  port: string
): Promise<string> => {
  try {
    const tunnel = await localtunnel({ port: parseInt(port) });
    console.log(`LocalTunnel created at: ${tunnel.url}`);
    return tunnel.url;
  } catch (error) {
    console.error('Failed to start LocalTunnel:', error);
    process.exit(1);
  }
};
