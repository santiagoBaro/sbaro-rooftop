# SBaro Rooftop - USDT Sepolia Balance Checker

This project is a SvelteKit application designed to check your USDT balance on the Sepolia testnet. It integrates with your browser-based wallet (like MetaMask) to connect to the blockchain and display your token holdings.

---

## Getting Started

Follow these steps to get the project up and running on your local machine.

### 1. Install SvelteKit & Project Dependencies

First, you'll need **Node.js** and **npm** (or pnpm/yarn) installed on your system.

1.  **Clone the repository:**
    ```bash
    git clone [your-repository-url]
    cd sbaro-rooftop # or whatever your project directory is called
    ```
2.  **Install project dependencies:**
    ```bash
    npm install
    # or pnpm install
    # or yarn install
    ```

### 2. Set Up MetaMask

This application requires a browser-based Ethereum wallet to interact with the Sepolia testnet.

1.  **Download MetaMask:** If you don't have it already, install the [**MetaMask browser extension**](https://metamask.io/download/) for your preferred browser (Chrome, Firefox, Brave, Edge).
2.  **Configure for Sepolia:**
    * Once installed, open MetaMask and connect to the **Sepolia Test Network**. You might need to enable "Show test networks" in MetaMask settings (Settings -> Advanced -> Show test networks).
    * **Get Sepolia ETH:** To perform any transactions or queries on Sepolia, you'll need some test ETH. You can get this for free from a [Sepolia Faucet](https://sepoliafaucet.com/) (you'll often need to log in with an Alchemy/Infura account).
3.  **Fund your wallet with USDT (Optional, for testing balance):** If you wish to see a non-zero USDT balance, you'll need to obtain some USDT on Sepolia. This usually involves:
    * Finding a test USDT contract address on Sepolia (for example, WETH on Sepolia is often `0x1C7D4B196Cb0C7B01d743Fbc6116a902f6AAFBe4`; verify the official USDT test token address).
    * Sending some test ETH to a faucet that might issue test ERC-20 tokens, or interacting with a test DEX if one is available on Sepolia.

---

### 3. Run the Development Server

Once you've installed dependencies and configured MetaMask:

```bash
npm run dev

# Or, to start the server and automatically open the app in a new browser tab:
npm run dev -- --open
```

The application will typically be accessible at **`http://localhost:5173`**. Open your browser to this address, connect your MetaMask wallet (ensuring it's on the Sepolia network), and you should see your USDT balance.

---

## Project Structure & Key Files

The core logic for interacting with the blockchain and managing application state is organized into the `src/lib` directory:

* **`src/lib/web3.ts`**:
    * This file configures the [Wagmi](https://wagmi.sh/) client, which is the primary interface for your SvelteKit application to connect to the Ethereum blockchain. It defines the network (Sepolia) and the RPC provider (e.g., Infura/Alchemy) used for blockchain communication.
    * **Note:** If you removed the explicit API key setup, it means Wagmi is likely relying on MetaMask's injected provider for RPC calls, or you're using a public RPC endpoint.

* **`src/lib/constants.ts`**:
    * This file stores essential blockchain-related constants, such as the Sepolia contract address for USDT and its Application Binary Interface (ABI). The ABI acts as a contract's public interface, telling your application how to interact with its functions (like checking a balance).

* **`src/lib/stores/wallet.ts`**:
    * This is a [Svelte store](https://svelte.dev/docs/svelte-store) that manages the global state related to the user's wallet connection. It tracks whether a wallet is connected, the connected account's address, the current blockchain network (chainId), and any connection errors. It also provides methods to initiate and disconnect wallet connections.

* **`src/lib/stores/usdt.ts`**:
    * Another [Svelte store](https://svelte.dev/docs/svelte-store) specifically for managing the USDT balance. It handles fetching the USDT balance for the connected account by interacting with the USDT smart contract using its ABI, and it manages the loading and error states related to this process.

---

## Building for Production

To create a production-ready version of your app:

```bash
npm run build
```

You can preview the production build locally with npm run preview.

To deploy your app to a hosting service, you may need to install an adapter for your target environment.
