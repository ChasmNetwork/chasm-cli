import { execSync } from 'child_process';

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
  try {
    execSync(`fuser -k ${port}/tcp`);
    console.log(`Stopped process on port ${port}`);
  } catch (error) {
    console.error(`Error stopping process on port ${port}:`, error);
  }
};
