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
      // Uninstall old versions
      await execa(
        'sudo',
        [
          'apt-get',
          'remove',
          'docker.io',
          'docker-doc',
          'docker-compose',
          'docker-compose-v2',
          'podman-docker',
          'containerd',
          'runc',
        ],
        { stdio: 'inherit' }
      );

      // Step 1: Update existing list of packages
      await execa('sudo', ['apt', 'update'], { stdio: 'inherit' });

      // Step 2: Install prerequisite packages
      await execa(
        'sudo',
        [
          'apt',
          'install',
          '-y',
          'ca-certificates',
          'curl',
          'software-properties-common',
        ],
        { stdio: 'inherit' }
      );

      // Step 3: Add Docker’s official GPG key
      await execa(
        'sudo',
        ['install', '-m', '0755', '-d', '/etc/apt/keyrings'],
        { stdio: 'inherit' }
      );
      await execa(
        'sudo',
        [
          'curl',
          '-fsSL',
          'https://download.docker.com/linux/ubuntu/gpg',
          '-o',
          '/etc/apt/keyrings/docker.asc',
        ],
        { stdio: 'inherit' }
      );
      await execa(
        'sudo',
        ['chmod', 'a+r', '/etc/apt/keyrings/docker.asc'],
        { stdio: 'inherit' }
      );

      // Step 4: Add the Docker repository to APT sources
      await execa(
        'sudo',
        [
          'sh',
          '-c',
          'echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" > /etc/apt/sources.list.d/docker.list',
        ],
        { stdio: 'inherit' }
      );

      // Step 5: Update the package database with the Docker packages from the newly added repo
      await execa('sudo', ['apt', 'update'], { stdio: 'inherit' });

      // Step 6: Install Docker
      await execa(
        'sudo',
        [
          'apt',
          'install',
          '-y',
          'docker-ce',
          'docker-ce-cli',
          'containerd.io',
          'docker-buildx-plugin',
          'docker-compose-plugin',
        ],
        { stdio: 'inherit' }
      );

      // Step 7: Verify Docker installation
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
