import { execSync, spawn, spawnSync } from 'child_process';
import { input } from '@inquirer/prompts';
import ngrok from 'ngrok';
import os from 'os';

export const checkNgrokInstallation = (): boolean => {
  try {
    execSync('ngrok version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
};

export const installNgrok = () => {
  const platform = os.platform();
  console.log('Installing ngrok...');

  try {
    if (platform === 'linux') {
      execSync(
        'curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list && sudo apt update && sudo apt install ngrok',
        { stdio: 'inherit' }
      );
    } else if (platform === 'darwin') {
      execSync('brew install ngrok/ngrok/ngrok', {
        stdio: 'inherit',
      });
    } else if (platform === 'win32') {
      execSync('choco install ngrok', { stdio: 'inherit' });
    } else {
      console.error(
        'Unsupported platform. Please install ngrok manually.'
      );
      process.exit(1);
    }
    console.log('ngrok installed successfully.');
  } catch (error) {
    console.error(
      'Failed to install ngrok. Please install it manually.'
    );
    process.exit(1);
  }
};

export const configureNgrok = (apiKey: string): void => {
  try {
    console.log('Configuring ngrok...');
    execSync(`ngrok config add-authtoken ${apiKey}`, {
      stdio: 'inherit',
    });
    console.log('ngrok configured successfully.');
  } catch (error) {
    console.error('Failed to configure ngrok:', error);
    throw error;
  }
};

const runCommandPipe = (command: string, args: any) => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args);
    let output = '';
    let errorOutput = '';

    process.stdout.on('data', (data) => {
      output += data.toString();

      // Check if the URL is in the output
      const urlMatch = output.match(
        /https:\/\/[a-z0-9]+(-[a-z0-9]+)*\.ngrok[^ ]*/
      );

      if (urlMatch && urlMatch[0]) {
        const url = urlMatch[0];
        resolve(url);
        process.kill(); // Terminate the ngrok process
      }
    });

    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    process.on('error', (error) => {
      reject(error);
    });

    process.on('close', (code) => {
      if (code !== 0 && !output.includes('https://')) {
        reject(
          new Error(
            `Process exited with code ${code}: ${errorOutput}`
          )
        );
      }
    });
  });
};

const runCommand = (command: string, args: any) => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args);
    let output = '';
    let errorOutput = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    process.on('error', (error) => {
      reject(error);
    });

    process.on('close', (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `Process exited with code ${code}: ${errorOutput}`
          )
        );
      } else {
        resolve(output.trim());
      }
    });
  });
};

export const startNgrokTunnel = async (
  port: number,
  apiKey: string
) => {
  try {
    console.log('Authenticating with ngrok...');
    const authOutput = await runCommand('ngrok', [
      'authtoken',
      apiKey,
    ]);
    console.log(`ngrok auth output: ${authOutput}`);

    console.log('Starting ngrok tunnel...');
    const url = await runCommandPipe('ngrok', [
      'http',
      port.toString(),
      '--log=stdout',
    ]);
    console.log(`ngrok tunnel started at ${url}`);
    return url as string;
  } catch (error) {
    console.error('Failed to start ngrok tunnel:', error);
    process.exit(1);
  }
};
