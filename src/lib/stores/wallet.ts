// src/lib/stores/wallet.ts
import { writable, get } from 'svelte/store';
import { connect as wagmiConnect, disconnect as wagmiDisconnect, getAccount, watchAccount } from 'wagmi/actions';
import { sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import type { Address } from 'viem';
import { config } from '$lib/web3'; // Your wagmi config

export type WalletState = {
  address: Address | undefined;
  isConnected: boolean;
  chainId: number | undefined;
  isConnecting: boolean; // For tracking pending connection requests
  error: string | undefined; // For wallet connection/disconnection errors
};

const initialWalletState: WalletState = {
  address: undefined,
  isConnected: false,
  chainId: undefined,
  isConnecting: false,
  error: undefined,
};

const { subscribe, set, update } = writable<WalletState>(initialWalletState);

// Wallet Store object
export const walletStore = {
  subscribe,
  // Pass the wagmi config here to avoid circular dependencies if config also needs stores later
  init: () => {
    // Initial check on load
    const account = getAccount(config);
    set({
      address: account.address,
      isConnected: account.isConnected,
      chainId: account.chain?.id,
      isConnecting: account.isReconnecting || account.isConnecting,
      error: undefined, // Clear any previous errors on init
    });

    // Watch for account changes
    const unwatch = watchAccount(config, {
      onChange(account) {
        update(state => ({
          ...state,
          address: account.address,
          isConnected: account.isConnected,
          chainId: account.chain?.id,
          isConnecting: account.isReconnecting || account.isConnecting,
          error: undefined, // Clear error on change, new errors will be set by specific actions
        }));
      },
    });

    // Return the unwatch function for cleanup
    return unwatch;
  },
  async connect(): Promise<void> {
    // Only attempt connection if not already connecting
    if (get(walletStore).isConnecting) return;

    update(state => ({ ...state, isConnecting: true, error: undefined }));
    try {
      // Pass the config to wagmiConnect action
      const { accounts, chainId } = await wagmiConnect(config, { connector: injected(), chainId: sepolia.id });
      set({
        address: accounts[0],
        isConnected: true,
        chainId: chainId,
        isConnecting: false,
        error: undefined,
      });
    } catch (err: any) {
      const errorMessage = `Failed to connect: ${err.shortMessage || err.message}`;
      console.error('Wallet connection error:', err);
      update(state => ({ ...state, isConnecting: false, error: errorMessage }));
    }
  },
  async disconnect(): Promise<void> {
    update(state => ({ ...state, error: undefined }));
    try {
      // Pass the config to wagmiDisconnect action
      await wagmiDisconnect(config);
      set(initialWalletState); // Reset to initial state on disconnect
    } catch (err: any) {
      const errorMessage = `Failed to disconnect: ${err.shortMessage || err.message}`;
      console.error('Wallet disconnection error:', err);
      update(state => ({ ...state, error: errorMessage }));
    }
  },
  // Expose the Wagmi config if other stores or components need it
  config: config
};