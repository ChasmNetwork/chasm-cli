import shell from 'shelljs';

export const checkDockerInstallation = () => {
  const result = shell.exec('docker --version', { silent: true });
  return result.code === 0;
};

export const installDocker = () => {
  const platform = process.platform;
  if (platform === 'win32') {
    shell.exec('choco install docker-desktop');
  } else if (platform === 'darwin') {
    shell.exec('brew install --cask docker');
  } else if (platform === 'linux') {
    shell.exec(
      'sudo apt-get update && sudo apt-get install -y docker.io'
    );
  }
};

export const setupDocker = () => {
  shell.exec('docker pull johnsonchasm/chasm-scout');
  shell.exec(
    'docker run -d --restart=always --env-file ./.env -p 3001:3001 --name scout johnsonchasm/chasm-scout'
  );
  console.log('Docker container has been set up successfully.');
};
