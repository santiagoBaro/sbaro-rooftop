<script lang="ts">
    import { connect, disconnect, getAccount, getBalance } from 'wagmi/actions';
    import { injected } from 'wagmi/connectors'; // metaMask no es necesario si solo usas injected()
  
    import { onMount } from 'svelte';
    import { config } from '$lib/web3';
  
    import { fade } from 'svelte/transition';
  
    import type { Address } from 'viem';
  
    // State variables
    let browser: boolean = true;
    let accountAddress: Address | undefined;
    let usdtBalance: string | undefined;
    let isConnected: boolean = false;
    let isLoadingBalance: boolean = false;
    let error: string | undefined;
  
    // Constants
    const USDT_CONTRACT_ADDRESS: Address = '0x419Fe9f14Ff3aA22e46ff1d03a73EdF3b70A62ED';
    // ERC20_ABI is not used in this implementation, can be removed if not needed elsewhere.
  
    /**
     * Connects the user's wallet using the injected connector.
     */
    async function connectWallet(): Promise<void> {
      try {
        error = undefined; // Clear previous errors
        const { accounts } = await connect(config, { connector: injected() });
        accountAddress = accounts[0];
        isConnected = true;
        await fetchUsdtBalance();
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
        error = undefined; // Clear previous errors
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
     * Fetches the USDT balance for the connected account.
     */
    async function fetchUsdtBalance(): Promise<void> {
      if (!accountAddress) return;
  
      isLoadingBalance = true;
      error = undefined; // Clear previous errors
      usdtBalance = undefined; // Clear previous balance
  
      try {
        const data = await getBalance(config, {
          address: accountAddress,
          token: USDT_CONTRACT_ADDRESS,
        });
        usdtBalance = `${data.formatted} ${data.symbol}`;
      } catch (err: any) {
        if (err.message.includes('token does not exist')) {
          error = 'USDT token not found on the current network for this address.';
        } else if (err.message.includes('network mismatch')) {
          error = 'Please switch your wallet to the Sepolia network.';
        } else {
          error = `Failed to fetch USDT balance: ${err.shortMessage || err.message}`;
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
      const account = getAccount(config);
      if (account.isConnected && account.address) {
        accountAddress = account.address;
        isConnected = true;
        fetchUsdtBalance();
      }
    });
  
    // Reactive declaration: Reruns fetchUsdtBalance whenever accountAddress or isConnected changes,
    // but only if we are in the browser and connected with an address.
    $: if (accountAddress && isConnected) {
      fetchUsdtBalance();
    }
  </script>
     {#if !browser}
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
          <p class="text-bodyMobile font-normal leading-tight text-gray-500 mb-8 lg:mb-0">Lorem ipsum</p>
        </section>
    
        <section class="w-full">
          {#if !isConnected}
            <div
              class="bg-card-background p-8 rounded-lg shadow-lg text-center w-full max-w-card-max-width h-card-max-height mx-auto lg:mx-0
              flex items-center justify-center"
              >
                {#if usdtBalance}
                  <p class="text-balanceMobile font-medium leading-tight">{usdtBalance}</p>
                {:else}
                  <p class="text-balanceMobile font-medium leading-tight">No balance data</p>
                {/if}
              </div>
            <div class="max-w-card-max-width h-button-height"></div>
            <button
              class="w-full max-w-card-max-width h-button-height bg-primary-button text-white py-4 rounded-xl text-buttonMobile font-medium leading-tight hover:bg-indigo-800 transition duration-300 transform hover:scale-105"
              on:click={connectWallet}
            >
              Connect your wallet
            </button>
          {:else}
            <div class="flex flex-col items-center lg:items-start w-full">
              <div class="bg-indigo-50 p-8 rounded-xl w-full mb-6">
                {#if isLoadingBalance}
                  <p class="text-center text-balanceMobile font-semibold text-indigo-700 animate-pulse">
                    Loading...
                  </p>
                {:else if usdtBalance}
                  <p class="text-center text-balanceMobile font-bold text-indigo-800">{usdtBalance}</p>
                {:else}
                  <p class="text-center text-bodyMobile text-gray-500">No balance data</p>
                {/if}
              </div>
    
              <button
                class="w-full max-w-card-max-width h-button-height bg-primary-button text-white py-4 rounded-xl text-buttonMobile font-medium leading-tight hover:bg-indigo-800 transition duration-300 transform hover:scale-105"
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
            class="bg-card-background p-8 rounded-lg shadow-lg text-center w-full max-w-card-max-width h-card-max-height mx-auto lg:mx-0
            flex items-center justify-center"
            >
              {#if usdtBalance}
                <p class="text-balance font-medium leading-tight">{usdtBalance}</p>
              {:else}
                <p class="text-balance font-medium leading-tight">No balance data</p>
              {/if}
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