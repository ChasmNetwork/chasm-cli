#!/usr/bin/env node

'use strict';

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { createHash } from 'crypto';
import { extract } from 'tar';
import zlib from 'zlib';
import binLinks from 'bin-links';

const ARCH_MAPPING = {
  x64: 'x64',
  arm64: 'arm64',
};

const PLATFORM_MAPPING = {
  darwin: 'darwin',
  linux: 'linux',
  win32: 'windows',
};

const arch = ARCH_MAPPING[process.arch];
const platform = PLATFORM_MAPPING[process.platform];

// Read package.json
const readPackageJson = async () => {
  const contents = await fs.promises.readFile('package.json');
  return JSON.parse(contents);
};

// Build the download URL from package.json
const getDownloadUrl = (packageJson) => {
  const pkgName = packageJson.name;
  const version = packageJson.version;
  const repo = packageJson.repository;
  const url = `https://github.com/${repo}/releases/download/v${version}/${pkgName}-${version}-${platform}-${arch}.tar.gz`;
  return url;
};

// Fetch and parse the checksum file
const fetchAndParseCheckSumFile = async (packageJson) => {
  const version = packageJson.version;
  const pkgName = packageJson.name;
  const repo = packageJson.repository;

  const checksumFileUrl = `https://github.com/${repo}/releases/download/v${version}/${pkgName}-${version}-checksums.txt`;

  // Fetch the checksum file
  console.info('Downloading', checksumFileUrl);
  const response = await fetch(checksumFileUrl);
  if (response.ok) {
    const checkSumContent = await response.text();
    const lines = checkSumContent.split('\n');

    const checksums = {};
    for (const line of lines) {
      const [checksum, packageName] = line.split(/\s+/);
      checksums[packageName] = checksum;
    }

    return checksums;
  } else {
    console.error(
      'Could not fetch checksum file',
      response.status,
      response.statusText
    );
  }
};

// Main function
async function main() {
  if (!arch || !platform) {
    throw new Error(
      `Installation is not supported for ${process.platform} ${process.arch}`
    );
  }

  const pkg = await readPackageJson();
  if (platform === 'windows') {
    // Update bin path in package.json
    pkg.bin[pkg.name] += '.exe';
  }

  const binPath = pkg.bin[pkg.name];
  const binDir = path.dirname(binPath);
  await fs.promises.mkdir(binDir, { recursive: true });

  // First we will Un-GZip, then we will untar.
  const ungz = zlib.createGunzip();
  const binName = path.basename(binPath);
  const untar = extract({ cwd: binDir }, [binName]);

  const url = getDownloadUrl(pkg);
  console.info('Downloading', url);
  const resp = await fetch(url);

  const hash = createHash('sha256');
  const pkgNameWithPlatform = `${pkg.name}-${platform}-${arch}.tar.gz`;
  const checksumMap = await fetchAndParseCheckSumFile(pkg);

  resp.body
    .on('data', (chunk) => {
      hash.update(chunk);
    })
    .pipe(ungz);

  ungz
    .on('end', () => {
      const expectedChecksum = checksumMap?.[pkgNameWithPlatform];
      // Skip verification if we can't find the file checksum
      if (!expectedChecksum) {
        console.warn('Skipping checksum verification');
        return;
      }
      const calculatedChecksum = hash.digest('hex');
      if (calculatedChecksum !== expectedChecksum) {
        throw new Error(
          'Checksum mismatch. Downloaded data might be corrupted.'
        );
      }
      console.info('Checksum verified.');
    })
    .pipe(untar);

  await new Promise((resolve, reject) => {
    untar.on('error', reject);
    untar.on('end', () => resolve());
  });

  // Link the binaries in postinstall to support yarn
  await binLinks({
    path: path.resolve('.'),
    pkg: { ...pkg, bin: { [pkg.name]: binPath } },
  });

  console.info('Installed CLI successfully');
}

await main();
