import { execa } from 'execa';

export const checkDockerInstallation = async () => {
  try {
    const { stdout } = await execa('docker', ['--version']);
    if (stdout.includes('Docker version')) {
      return true;
    } else {
      console.log(
        'Docker command executed, but no version information found.'
      );
      return false;
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.error('Docker is not installed.');
    } else if (error.code === 'EACCES' || error.code === 'EPERM') {
      console.error(
        'Permission denied. Try running with elevated privileges.'
      );
    } else {
      console.error('Error executing Docker command:', error);
    }
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
      // Step 1: Update the apt package index and install packages to allow apt to use a repository over HTTPS:
      await execa('sudo', ['apt-get', 'update'], {
        stdio: 'inherit',
      });
      await execa(
        'sudo',
        [
          'apt-get',
          'install',
          '-y',
          'ca-certificates',
          'curl',
          'gnupg',
          'lsb-release',
        ],
        { stdio: 'inherit' }
      );

      // Step 2: Add Docker’s official GPG key:
      await execa('sudo', ['mkdir', '-p', '/etc/apt/keyrings']);
      await execa('curl', [
        '-fsSL',
        'https://download.docker.com/linux/ubuntu/gpg',
        '-o',
        '/usr/share/keyrings/docker-archive-keyring.gpg',
      ]);

      // Step 3: Use the following command to set up the stable repository:
      const architecture = await execa('dpkg', [
        '--print-architecture',
      ]);
      const codename = await execa('lsb_release', ['-cs']);
      await execa(
        'sudo',
        [
          'sh',
          '-c',
          `echo "deb [arch=${architecture.stdout} signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu ${codename.stdout} stable" > /etc/apt/sources.list.d/docker.list`,
        ],
        { stdio: 'inherit' }
      );

      // Step 4: Update the apt package index, and install the latest version of Docker Engine, containerd, and Docker Compose:
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
          'docker-compose-plugin',
        ],
        { stdio: 'inherit' }
      );

      // Step 5: Verify that Docker Engine is installed correctly by running the hello-world image:
      await execa('sudo', ['docker', 'run', 'hello-world'], {
        stdio: 'inherit',
      });
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
