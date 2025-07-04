// src/lib/stores/wallet.ts
import { writable, get } from 'svelte/store';
import { connect as wagmiConnect, disconnect as wagmiDisconnect, getAccount, watchAccount } from 'wagmi/actions';
import { sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import type { Address } from 'viem';
import { config } from '$lib/web3'; 

export type WalletState = {
  address: Address | undefined;
  isConnected: boolean;
  chainId: number | undefined;
  isConnecting: boolean; 
  error: string | undefined; 
};

const initialWalletState: WalletState = {
  address: undefined,
  isConnected: false,
  chainId: undefined,
  isConnecting: false,
  error: undefined,
};

const { subscribe, set, update } = writable<WalletState>(initialWalletState);

export const walletStore = {
  subscribe,
  init: () => {
    const account = getAccount(config);
    set({
      address: account.address,
      isConnected: account.isConnected,
      chainId: account.chain?.id,
      isConnecting: account.isReconnecting || account.isConnecting,
      error: undefined,
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
          error: undefined,
        }));
      },
    });

    return unwatch;
  },
  async connect(): Promise<void> {
    if (get(walletStore).isConnecting) return;

    update(state => ({ ...state, isConnecting: true, error: undefined }));
    try {
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
      await wagmiDisconnect(config);
      set(initialWalletState);
    } catch (err: any) {
      const errorMessage = `Failed to disconnect: ${err.shortMessage || err.message}`;
      console.error('Wallet disconnection error:', err);
      update(state => ({ ...state, error: errorMessage }));
    }
  },
  config: config
};