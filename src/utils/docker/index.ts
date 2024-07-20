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

export const setupDocker = (containerName: string) => {
  shell.exec('docker pull chasmtech/chasm-scout');
  shell.exec(
    `docker run -d --restart=always --env-file ./.env.scout -p 3001:3001 --name ${containerName} chasmtech/chasm-scout`
  );
  console.log('Docker container has been set up successfully.');
};

export const isContainerNameInUse = (
  containerName: string
): boolean => {
  const result = shell.exec(
    `docker ps -a --filter "name=${containerName}" --format "{{.Names}}"`,
    { silent: true }
  );
  return result.stdout.trim() === containerName;
};

export const removeDockerContainer = (containerName: string) => {
  shell.exec(`docker rm -f ${containerName}`);
  console.log(
    `Removed existing Docker container with name ${containerName}`
  );
};
