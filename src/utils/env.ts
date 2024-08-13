import { input, confirm, password } from '@inquirer/prompts';
import path from 'path';
import {
  checkNgrokInstallation,
  installNgrok,
  startNgrokTunnel,
} from './local';
import {
  isPortInUse,
  isPortOpenToPublic,
  openFirewallPort,
  getPublicIPAddress,
} from './network';
import fs from 'fs';

export const setupEnvFile = async (
  scoutUID: string,
  webhookApiKey: string
) => {
  let port = await input({
    message: 'Enter the port:',
    default: '3001',
  });

  const isLocal = await confirm({
    message: 'Are you setting this up on a local computer?',
    default: true,
  });

  if (!isLocal) {
    if (isPortInUse(parseInt(port))) {
      const changePort = await confirm({
        message: `Port ${port} is already in use. Would you like to enter a different port?`,
        default: true,
      });

      if (changePort) {
        port = await input({
          message: 'Enter a different port:',
          default: '3002',
        });
      } else {
        console.log(
          'Please make the port available and rerun the script.'
        );
        process.exit(0);
      }
    }

    // if (!(await isPortOpenToPublic(parseInt(port)))) {
    //   const openFirewall = await confirm({
    //     message: `Port ${port} is not open to the public. Would you like to open it in the firewall?`,
    //     default: true,
    //   });

    //   if (openFirewall) {
    //     await openFirewallPort(parseInt(port));
    //   } else {
    //     console.log(
    //       `Port ${port} is not open to the public. Exiting.`
    //     );
    //     process.exit(0);
    //   }
    // }
  }

  let webhookURL = `http://localhost:${port}`;

  if (isLocal) {
    const hasNgrokAccount = await confirm({
      message: 'Do you have an ngrok account and API key?',
      default: true,
    });

    if (!hasNgrokAccount) {
      console.log(
        'Please sign up for an ngrok account at https://ngrok.com/signup and get your API key.'
      );
      process.exit(1);
    }

    const ngrokApiKey = await password({
      message: 'Enter your ngrok API key:',
      mask: '*',
      validate: (value) => {
        if (!value) {
          return 'API key is required.';
        }
        if (value.startsWith('gsk')) {
          return 'Wrong API key format, are you sure this is your ngrok API key?';
        }
        return true;
      },
    });

    // if (!checkNgrokInstallation()) {
    //   installNgrok();
    // }

    installNgrok();

    webhookURL = await startNgrokTunnel(parseInt(port), ngrokApiKey);
  } else {
    const ipAddress = getPublicIPAddress();
    webhookURL = await input({
      message: `Enter webhook URL (suggestion: http://${ipAddress}:${port}):`,
      default: `http://${ipAddress}:${port}`,
    });
  }

  const answers = {
    PORT: port,
    NODE_ENV: 'production',
    LOGGER_LEVEL: 'debug',
    ORCHESTRATOR_URL: 'https://orchestrator.chasm.net/',
    SCOUT_NAME: await input({
      message: 'Enter scout name:',
      validate: function (input) {
        if (input.trim() === '') {
          return 'Scout name is required.';
        }
        return true;
      },
    }),
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
    GROQ_API_KEY: await password({
      message: 'Enter Groq API key:',
      mask: '*',
      validate: function (input) {
        if (input.trim() === '') {
          return 'Groq API key is required.';
        }
        return true;
      },
    }),
    OPENROUTER_API_KEY: await password({
      mask: '*',
      message: 'Enter Openrouter API key (optional):',
    }),
    OPENAI_API_KEY: await password({
      mask: '*',
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
