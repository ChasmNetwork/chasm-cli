import { execa } from 'execa';

export const checkDockerInstallation = async () => {
  try {
    const { stdout } = await execa('docker', ['--version']);
    console.log(`Docker version found: ${stdout}`);
    return true;
  } catch (error) {
    console.error(
      'Docker is not installed or not accessible:',
      error
    );
    return false;
  }
};

export const installDocker = async () => {
  const platform = process.platform;
  try {
    if (platform === 'win32') {
      await execa('choco', ['install', 'docker-desktop'], {
        stdio: 'inherit',
      });
    } else if (platform === 'darwin') {
      await execa('brew', ['install', '--cask', 'docker'], {
        stdio: 'inherit',
      });
    } else if (platform === 'linux') {
      await execa('sudo', ['apt-get', 'update'], {
        stdio: 'inherit',
      });
      await execa(
        'sudo',
        [
          'apt-get',
          'install',
          '-y',
          'apt-transport-https',
          'ca-certificates',
          'curl',
          'software-properties-common',
        ],
        {
          stdio: 'inherit',
        }
      );
      await execa(
        'curl',
        ['-fsSL', 'https://download.docker.com/linux/ubuntu/gpg'],
        { stdio: 'inherit' }
      ).then((result) =>
        execa(
          'sudo',
          [
            'gpg',
            '--dearmor',
            '-o',
            '/usr/share/keyrings/docker-archive-keyring.gpg',
          ],
          { input: result.stdout }
        )
      );
      await execa(
        'bash',
        [
          '-c',
          'echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null',
        ],
        { stdio: 'inherit' }
      );
      await execa('sudo', ['apt-get', 'update'], {
        stdio: 'inherit',
      });
      await execa(
        'sudo',
        [
          'apt-get',
          'install',
          '-y',
          'docker-ce',
          'docker-ce-cli',
          'containerd.io',
        ],
        {
          stdio: 'inherit',
        }
      );
    }
  } catch (error) {
    console.error('Failed to install Docker:', error);
  }
};

export const setupDocker = async (containerName: string) => {
  try {
    await execa('docker', ['pull', 'chasmtech/chasm-scout'], {
      stdio: 'inherit',
    });
    await execa(
      'docker',
      [
        'run',
        '-d',
        '--restart=always',
        '--env-file',
        './.env.scout',
        '-p',
        '3001:3001',
        '--name',
        containerName,
        'chasmtech/chasm-scout',
      ],
      { stdio: 'inherit' }
    );
    console.log('Docker container has been set up successfully.');
  } catch (error) {
    console.error('Failed to set up Docker container:', error);
  }
};

export const isContainerNameInUse = async (
  containerName: string
): Promise<boolean> => {
  try {
    const { stdout } = await execa('docker', [
      'ps',
      '-a',
      '--filter',
      `name=${containerName}`,
      '--format',
      '{{.Names}}',
    ]);
    return stdout.trim() === containerName;
  } catch (error) {
    console.error('Failed to check Docker container name:', error);
    return false;
  }
};

export const removeDockerContainer = async (
  containerName: string
) => {
  try {
    await execa('docker', ['rm', '-f', containerName], {
      stdio: 'inherit',
    });
    console.log(
      `Removed existing Docker container with name ${containerName}`
    );
  } catch (error) {
    console.error(
      `Failed to remove Docker container with name ${containerName}:`,
      error
    );
  }
};
