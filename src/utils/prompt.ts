import { select } from '@inquirer/prompts';

export const promptForNFTSelection = async (
  nfts: { token_id: string; name: string }[]
) => {
  const choices = nfts.map((nft) => ({
    name: `${nft.name}`,
    value: nft.token_id,
  }));
  return await select({
    message: 'Select an NFT to use for setting up the scout:',
    choices,
  });
};

export const promptForWalletSelection = async (wallets: string[]) => {
  if (wallets.length === 1) return wallets[0];

  const choices = wallets.map((wallet) => ({
    name: wallet,
    value: wallet,
  }));

  const selectedWallet = await select({
    message: 'Select a wallet to use:',
    choices,
  });

  return selectedWallet;
};
