import Web3 from "web3";

// https://github.com/MetaMask/faq/blob/master/DEVELOPERS.md
// This function unlocks a user's Ethereum account using MetaMask or a similar provider.
// It returns an object containing the web3 instance and the user's first account address.
export async function unlockAccount() {
  // Access the Ethereum object injected by MetaMask into the browser's window object.
  // @ts-ignore is used to suppress TypeScript errors for window.ethereum.
  const { ethereum } = window;

  // Check if the Ethereum object is available. If not, throw an error.
  if (!ethereum) {
    throw new Error("Web3 not found");
  }

  // Create a new Web3 instance using the Ethereum provider.
  const web3 = new Web3(ethereum);
  
  // Request account access if needed (prompts user to connect their wallet).
  await ethereum.enable();

  // Retrieve the list of accounts connected to the wallet.
  const accounts = await web3.eth.getAccounts();

  // Return the Web3 instance and the first account (or an empty string if no accounts are found).
  return { web3, account: accounts[0] || "" };
}

// This function subscribes to changes in the user's Ethereum account.
// It calls the provided callback function with the new account address whenever it changes.
export function subscribeToAccount(
  web3: Web3,
  callback: (error: Error | null, account: string | null) => any
) {
  // Set up an interval that checks for account changes every 1000 milliseconds (1 second).
  const id = setInterval(async () => {
    try {
      // Get the current list of accounts.
      const accounts = await web3.eth.getAccounts();
      // Call the callback with the first account.
      callback(null, accounts[0]);
    } catch (error) {
      // If there's an error, call the callback with the error.
      callback(error, null);
    }
  }, 1000);

  // Return a function to clear the interval, stopping the account subscription.
  return () => {
    clearInterval(id);
  };
}

// This function subscribes to changes in the Ethereum network ID.
// It calls the provided callback function with the new network ID whenever it changes.
export function subscribeToNetId(
  web3: Web3,
  callback: (error: Error | null, netId: number | null) => any
) {
  // Set up an interval that checks for network ID changes every 1000 milliseconds (1 second).
  const id = setInterval(async () => {
    try {
      // Get the current network ID.
      const netId = await web3.eth.net.getId();
      // Call the callback with the network ID.
      callback(null, netId);
    } catch (error) {
      // If there's an error, call the callback with the error.
      callback(error, null);
    }
  }, 1000);

  // Return a function to clear the interval, stopping the network ID subscription.
  return () => {
    clearInterval(id);
  };
}