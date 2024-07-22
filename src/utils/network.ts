import { execSync } from 'child_process';
import os from 'os';
import net from 'net';
import { execa } from 'execa';

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

export const isPortOpenToPublic = async (
  port: number
): Promise<boolean> => {
  try {
    const ipAddress = getPublicIPAddress();
    const socket = net.createConnection({ host: ipAddress, port });
    return new Promise((resolve, reject) => {
      socket.on('connect', () => {
        socket.end();
        resolve(true);
      });
      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });
    });
  } catch (error) {
    return false;
  }
};

export const openFirewallPort = async (
  port: number
): Promise<void> => {
  try {
    const platform = os.platform();
    if (platform === 'linux') {
      await execa('sudo', ['ufw', 'allow', `${port}`], {
        stdio: 'inherit',
      });
    } else if (platform === 'darwin') {
      await execa('sudo', ['pfctl', '-f', '/etc/pf.conf'], {
        stdio: 'inherit',
      });
      await execa('sudo', ['pfctl', '-e'], { stdio: 'inherit' });
      await execa(
        'sudo',
        [
          'echo',
          `rdr pass on lo0 inet proto tcp from any to any port ${port} -> 127.0.0.1 port ${port}`,
        ],
        { stdio: 'inherit' }
      );
    } else {
      console.error(
        'Opening firewall ports is not supported on this platform.'
      );
    }
    console.log(`Firewall rules updated to allow port ${port}`);
  } catch (error) {
    console.error(`Error opening firewall port ${port}:`, error);
  }
};
