<script lang="ts">
  import { onMount } from 'svelte';
  import { sepolia } from 'wagmi/chains';
  import type { Address } from 'viem';
  import { fade } from 'svelte/transition';
  import { browser as isClient } from '$app/environment';
  import { walletStore } from '$lib/stores/wallet';
  import { usdtBalanceStore } from '$lib/stores/usdt';

  $: ({ address: accountAddress, isConnected, chainId, error: walletError, isConnecting } = $walletStore);
  $: ({ balance: usdtBalance, isLoading: isLoadingBalance, error: usdtFetchError } = $usdtBalanceStore);
  $: overallError = walletError || usdtFetchError;

  /**
   * Shortens an Ethereum address for display.
   * @param address The full Ethereum address.
   * @returns A shortened string representation of the address.
   */
  function shortenAddress(address: Address | undefined): string {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  $: {
    if (isConnected && accountAddress && chainId === sepolia.id) {
      usdtBalanceStore.fetchBalance(accountAddress);
    } else {
      usdtBalanceStore.reset();
    }
  }

  onMount(() => {
    walletStore.init();
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
                      on:click={walletStore.connect}
                      disabled={isConnecting}
                  >
                      {#if isConnecting}Connecting...{:else}Connect your wallet{/if}
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
                          on:click={walletStore.disconnect}
                      >
                          {shortenAddress(accountAddress)}
                      </button>
                  </div>
              {/if}

              {#if overallError}
                  <div
                      class="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative max-w-card-max-width"
                      role="alert"
                      transition:fade={{ duration: 200 }}
                  >
                      <strong class="font-bold">Error:</strong>
                      <span class="block sm:inline">{overallError}</span>
                  </div>
              {/if}
          </section>
      </main>
  </div>
{/if}