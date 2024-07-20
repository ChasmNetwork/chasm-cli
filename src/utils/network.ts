import { execSync } from 'child_process';
import os from 'os';

const checkCurlInstallation = (): boolean => {
  try {
    execSync('curl --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
};

export const getPublicIPAddress = (): string => {
  if (!checkCurlInstallation()) {
    console.error(
      'Error: curl is not installed. Please install curl to fetch the public IP address.'
    );
    return 'localhost';
  }

  try {
    const ipAddress = execSync('curl -s -4 ifconfig.me')
      .toString()
      .trim();
    return ipAddress || 'localhost';
  } catch (error) {
    console.error('Error fetching public IP address:', error);
    return 'localhost';
  }
};

export const isPortInUse = (port: number): boolean => {
  try {
    const result = execSync(`lsof -i:${port}`, {
      stdio: 'pipe',
    }).toString();
    return result.length > 0;
  } catch (error) {
    return false;
  }
};

export const stopProcessOnPort = (port: number): void => {
  const platform = os.platform();

  try {
    if (platform === 'linux' || platform === 'darwin') {
      const pid = execSync(`lsof -t -i:${port}`).toString().trim();
      if (pid) {
        execSync(`kill -9 ${pid}`);
        console.log(`Stopped process on port ${port}`);
      }
    } else {
      console.error(
        `Stopping process on port ${port} is not supported on this platform.`
      );
    }
  } catch (error) {
    console.error(`Error stopping process on port ${port}:`, error);
  }
};
