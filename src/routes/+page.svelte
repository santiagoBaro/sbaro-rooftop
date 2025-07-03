<script lang="ts">
  import { connect, disconnect, getAccount, watchAccount } from 'wagmi/actions';
  import { sepolia } from 'wagmi/chains';
  import { injected } from 'wagmi/connectors';
  import { onMount } from 'svelte';
  import { config } from '$lib/web3';
  import { fade } from 'svelte/transition';
  import type { Address } from 'viem';
  // Import 'Abi' type from viem for strong typing
  import type { Abi } from 'viem';
  import { browser as isClient } from '$app/environment';
  import { USDT_SEPOLIA_ADDRESS, ERC20_ABI } from '$lib/constants';
  import { readContract } from 'wagmi/actions';

  // State variables
  let accountAddress: Address | undefined;
  let usdtBalance: string | undefined;
  let isConnected: boolean = false;
  let isLoadingBalance: boolean = false;
  let error: string | undefined;

  // --- Type Assertion for ABI ---
  // If ERC20_ABI is imported as a plain JS object/array, TypeScript might
  // treat its elements loosely. To ensure correct type inference for
  // contract calls, assert it as 'const' or explicitly type it.
  // Assuming ERC20_ABI from $lib/constants is a standard JSON array,
  // you might re-export it with 'as const' or assert it here.
  // For example, if $lib/constants looks like:
  // export const ERC20_ABI = [ { /* ... */ } ];
  // You might change it to:
  // export const ERC20_ABI = [ { /* ... */ } ] as const;
  // Or assert it here if that's not feasible:
  const typedERC20Abi = ERC20_ABI as Abi; // Using Viem's Abi type for clarity


  /**
   * Connects the user's wallet using the injected connector.
   */
  async function connectWallet(): Promise<void> {
      try {
          error = undefined;
          const { accounts } = await connect(config, { connector: injected(), chainId: sepolia.id});
          accountAddress = accounts[0];
          isConnected = true;
      } catch (err: any) {
          error = `Failed to connect: ${err.shortMessage || err.message}`;
          console.error('Connection error:', err);
      }
  }

  /**
   * Disconnects the user's wallet.
   */
  async function disconnectWallet(): Promise<void> {
      try {
          error = undefined;
          await disconnect(config);
          accountAddress = undefined;
          usdtBalance = undefined;
          isConnected = false;
      } catch (err: any) {
          error = `Failed to disconnect: ${err.shortMessage || err.message}`;
          console.error('Disconnection error:', err);
      }
  }

  /**
   * Fetches the USDT balance for the connected account using the ERC20 ABI.
   */
  async function fetchUsdtBalance(): Promise<void> {
    if (!accountAddress) return;

    isLoadingBalance = true;
    error = undefined;
    usdtBalance = undefined;

    try {
        // Explicitly type the result of readContract for 'balanceOf'
        const rawBalance = await readContract(config, {
            address: USDT_SEPOLIA_ADDRESS,
            abi: typedERC20Abi, // Use the typed ABI here
            functionName: 'balanceOf',
            args: [accountAddress],
            chainId: sepolia.id,
        }) as bigint; // We expect balanceOf to return a bigint

        // Explicitly type the result of readContract for 'decimals'
        const decimals = await readContract(config, {
            address: USDT_SEPOLIA_ADDRESS,
            abi: typedERC20Abi, // Use the typed ABI here
            functionName: 'decimals',
            chainId: sepolia.id,
        }) as number; // We expect decimals to return a number

        // Explicitly type the result of readContract for 'symbol'
        const symbol = await readContract(config, {
            address: USDT_SEPOLIA_ADDRESS,
            abi: typedERC20Abi, // Use the typed ABI here
            functionName: 'symbol',
            chainId: sepolia.id,
        }) as string; // We expect symbol to return a string

        // Formato del balance
        const divisor = 10n ** BigInt(decimals); // Use 'n' for BigInt literal, BigInt(decimals) ensures it's a BigInt
        const formattedBalance = (Number(rawBalance) / Number(divisor)).toFixed(decimals);

        usdtBalance = `${formattedBalance} ${symbol}`;

    } catch (err: any) {
        console.error('Full Balance fetch error object:', err);

        if (err.cause?.name === 'ContractFunctionExecutionError' && err.cause.shortMessage.includes('token does not exist')) {
            error = 'USDT token contract or function not found on the current network for this address.';
        } else if (err.name === 'ChainMismatchError' || err.message.includes('sepolia')) {
            error = `1 Please switch your wallet to the ${sepolia.name} network. ${err.message}`;
        } else {
            error = `Failed to fetch USDT balance: ${err.shortMessage || err.message || 'Unknown error'}`;
        }
        console.error('Balance fetch error:', err);
    } finally {
        isLoadingBalance = false;
    }
  }

  /**
   * Shortens an Ethereum address for display.
   * @param address The full Ethereum address.
   * @returns A shortened string representation of the address.
   */
  function shortenAddress(address: Address | undefined): string {
      if (!address) return '';
      return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  // Svelte lifecycle hook: Runs after the component is first rendered to the DOM.
  onMount(() => {
    const unwatch = watchAccount(config, {
        onChange(account) {
            accountAddress = account.address;
            isConnected = account.isConnected;

            if (account.isConnected && account.address && account.chain?.id === sepolia.id) {
                error = undefined;
                fetchUsdtBalance();
            } else {
                usdtBalance = undefined;
                if (account.isConnected && account.chain?.id !== sepolia.id) {
                    error = `Please switch your wallet to the ${sepolia.name} network.`;
                } else if (!account.isConnected) {
                    error = undefined;
                }
            }
        },
    });

    // Initial check on mount
    const account = getAccount(config);
    accountAddress = account.address;
    isConnected = account.isConnected;

    if (account.isConnected && account.address && account.chain?.id === sepolia.id) {
        fetchUsdtBalance();
    } else if (account.isConnected && account.chain?.id !== sepolia.id) {
        error = `Please switch your wallet to the ${sepolia.name} network.`;
    }

    return () => unwatch();
  });

</script>

{#if !isClient}
  <div class="min-h-screen bg-white text-gray-900 font-poppins p-4 sm:p-8">
      <header class="mb-8">
          <div class="text-xl font-bold">Logo</div>
      </header>

      <main class="flex flex-col lg:flex-col lg:justify-between lg:items-start lg:gap-16">
          <section class="w-full">
              <h1 class="text-titleMobile font-semibold leading-tight mb-4">Check your balance</h1>
              <p class="text-subtitleMobile font-medium leading-tight mb-6">
                  Check your USDT balance for Sepolia network
              </p>
              <p class="text-bodyMobile font-normal leading-tight text-gray-500 mb-8 lg:mb-0">
                  Lorem ipsum
              </p>
          </section>

          <section class="w-full">
              <div
                  class="bg-card-background p-8 rounded-lg shadow-lg text-center w-full max-w-card-max-width h-card-max-height mx-auto lg:mx-0 flex items-center justify-center"
              >
                  <p class="text-balanceMobile font-medium leading-tight">Loading...</p>
              </div>
              <div class="max-w-card-max-width h-button-height"></div>
              <button
                  class="w-full max-w-card-max-width h-button-height bg-primary-button text-white py-4 rounded-xl text-buttonMobile font-medium leading-tight opacity-50 cursor-not-allowed"
                  disabled
              >
                  Please enable JavaScript to connect your wallet.
              </button>
          </section>
      </main>
  </div>
{:else}
  <div class="min-h-screen bg-white text-gray-900 font-poppins p-4 sm:p-8">
      <header class="mb-8">
          <div class="text-xl font-bold">Logo</div>
      </header>

      <main class="flex flex-col lg:flex-row lg:justify-between lg:items-start lg:gap-16">
          <section class="flex-1 lg:max-w-xl mb-8 lg:mb-0 pt-body-top-padding pl-body-left-padding">
              <h1 class="text-title font-semibold leading-tight mb-4">Check your balance</h1>
              <p class="text-subtitle font-medium leading-tight mb-6">
                  Check your USDT balance for Sepolia network
              </p>
              <p class="text-body font-normal leading-tight text-gray-500 mb-8 lg:mb-0">Lorem ipsum</p>
          </section>

          <div class="hidden lg:block mx-auto mt-12 w-image-width h-image-height pt-20">
              <img src="/src/lib/assets/Saly-14.png" alt="Person checking phone" class="w-full h-auto" />
          </div>

          <section class="flex-1 lg:max-w-md w-full">
              {#if !isConnected}
                  <div class="flex flex-col items-center lg:items-start w-full">
                      <p class="text-balanceTitle font-medium leading-tight mb-6">Balance:</p>
                  </div>

                  <div
                      class="bg-card-background p-8 rounded-lg shadow-lg text-center w-full max-w-card-max-width h-card-max-height mx-auto lg:mx-0 flex items-center justify-center"
                  >
                      <p class="text-balance font-medium leading-tight">No balance data</p>
                  </div>
                  <div class="max-w-card-max-width h-button-height"></div>
                  <button
                      class="w-full max-w-card-max-width h-button-height bg-primary-button text-white py-4 rounded-xl text-button font-medium leading-tight hover:bg-indigo-800 transition duration-300 transform hover:scale-105"
                      on:click={connectWallet}
                  >
                      Connect your wallet
                  </button>
              {:else}
                  <div class="flex flex-col items-center lg:items-start w-full">
                      <p class="hidden lg:block text-balanceTitle font-medium leading-tight mb-2">Balance:</p>

                      <div class="bg-indigo-50 p-8 rounded-xl w-full mb-6">
                          {#if isLoadingBalance}
                              <p class="text-center text-balance font-semibold text-indigo-700 animate-pulse">
                                  Loading...
                              </p>
                          {:else if usdtBalance}
                              <p class="text-center text-balance font-bold text-indigo-800">{usdtBalance}</p>
                          {:else}
                              <p class="text-center text-body text-gray-500">No balance data</p>
                          {/if}
                      </div>

                      <button
                          class="w-full max-w-card-max-width h-button-height bg-primary-button text-white py-4 rounded-xl text-button font-medium leading-tight hover:bg-indigo-800 transition duration-300 transform hover:scale-105"
                          on:click={disconnectWallet}
                      >
                          {shortenAddress(accountAddress)}
                      </button>
                  </div>
              {/if}

              {#if error}
                  <div
                      class="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative max-w-card-max-width"
                      role="alert"
                      transition:fade={{ duration: 200 }}
                  >
                      <strong class="font-bold">Error:</strong>
                      <span class="block sm:inline">{error}</span>
                  </div>
              {/if}
          </section>
      </main>
  </div>
{/if}