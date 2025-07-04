// src/lib/stores/usdt.ts
import { writable, get } from 'svelte/store';
import { readContract } from 'wagmi/actions';
import { sepolia } from 'wagmi/chains';
import type { Address, Abi } from 'viem';
import { config } from '$lib/web3';
import { USDT_SEPOLIA_ADDRESS, ERC20_ABI } from '$lib/constants';

const typedERC20Abi = ERC20_ABI as Abi;

export type USDTBalanceState = {
  balance: string | undefined;
  isLoading: boolean;
  error: string | undefined;
};

const initialUSDTState: USDTBalanceState = {
  balance: undefined,
  isLoading: false,
  error: undefined,
};

const { subscribe: usdtSubscribe, set: setUsdt, update: updateUsdt } = writable<USDTBalanceState>(initialUSDTState);

export const usdtBalanceStore = {
  subscribe: usdtSubscribe,
  async fetchBalance(accountAddress: Address): Promise<void> {
    if (get(usdtBalanceStore).isLoading || !accountAddress) return;

    updateUsdt(state => ({ ...state, isLoading: true, error: undefined }));
    try {
      const rawBalance = await readContract(config, {
        address: USDT_SEPOLIA_ADDRESS,
        abi: typedERC20Abi,
        functionName: 'balanceOf',
        args: [accountAddress],
        chainId: sepolia.id,
      }) as bigint;

      const decimals = await readContract(config, {
        address: USDT_SEPOLIA_ADDRESS,
        abi: typedERC20Abi,
        functionName: 'decimals',
        chainId: sepolia.id,
      }) as number;

      const symbol = await readContract(config, {
        address: USDT_SEPOLIA_ADDRESS,
        abi: typedERC20Abi,
        functionName: 'symbol',
        chainId: sepolia.id,
      }) as string; 

      const divisor = 10n ** BigInt(decimals);
      const formattedBalance = Math.floor(Number(rawBalance) / Number(divisor)).toString();


      setUsdt({
        balance: `${formattedBalance} ${symbol}`,
        isLoading: false,
        error: undefined,
      });

    } catch (err: any) {
      console.error('USDT Balance fetch error:', err);
      let errorMessage = 'Failed to fetch USDT balance: Unknown error.';

      if (err.cause?.name === 'ContractFunctionExecutionError') {
        if (err.cause.shortMessage.includes('token does not exist')) {
          errorMessage = 'USDT token contract or function not found.';
        } else {
          errorMessage = `Contract error: ${err.cause.shortMessage}`;
        }
      } else if (err.name === 'ChainMismatchError' || err.message.includes('sepolia')) {
        errorMessage = `Please switch your wallet to the ${sepolia.name} network.`;
      } else if (err.shortMessage) {
        errorMessage = `Failed to fetch USDT balance: ${err.shortMessage}`;
      } else if (err.message) {
        errorMessage = `Failed to fetch USDT balance: ${err.message}`;
      }

      updateUsdt(state => ({ ...state, isLoading: false, error: errorMessage }));
    }
  },
  reset: () => {
    setUsdt(initialUSDTState);
  }
};