// Import necessary React hooks and Web3.js
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import Web3 from "web3"; // Import Web3 library for blockchain interaction
import { subscribeToAccount, subscribeToNetId } from "../api/web3"; // Import helper functions for subscribing to account and network ID changes

// Define the shape of the state
interface State {
  account: string; // Current Ethereum account address
  web3: Web3 | null; // Instance of Web3 or null
  netId: number; // Network ID of the connected blockchain
}

// Initial state for the context
const INITIAL_STATE: State = {
  account: "",
  web3: null,
  netId: 0,
};

// Action types for updating the state
const UPDATE_ACCOUNT = "UPDATE_ACCOUNT";
const UPDATE_NET_ID = "UPDATE_NET_ID";

// Action interfaces for dispatching updates
interface UpdateAccount {
  type: "UPDATE_ACCOUNT";
  account: string;
  web3?: Web3;
}

interface UpdateNetId {
  type: "UPDATE_NET_ID";
  netId: number;
}

type Action = UpdateAccount | UpdateNetId;

// Reducer function to handle state updates based on actions
function reducer(state: State = INITIAL_STATE, action: Action) {
  switch (action.type) {
    case UPDATE_ACCOUNT: {
      const web3 = action.web3 || state.web3; // Use provided Web3 instance or existing state
      const { account } = action;

      return {
        ...state, // Spread current state
        web3,
        account,
      };
    }
    case UPDATE_NET_ID: {
      const { netId } = action;

      return {
        ...state, // Spread current state
        netId,
      };
    }
    default:
      return state;
  }
}

// Create a React context for Web3 state and actions
const Web3Context = createContext({
  state: INITIAL_STATE,
  updateAccount: (_data: { account: string; web3?: Web3 }) => {}, // Function to update account
  updateNetId: (_data: { netId: number }) => {}, // Function to update network ID
});

// Custom hook to use the Web3Context
export function useWeb3Context() {
  return useContext(Web3Context);
}

// Provider component to wrap the application and provide Web3 context
interface ProviderProps {}

export const Provider: React.FC<ProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  // Function to dispatch action to update account
  function updateAccount(data: { account: string; web3?: Web3 }) {
    dispatch({
      type: UPDATE_ACCOUNT,
      ...data,
    });
  }

  // Function to dispatch action to update network ID
  function updateNetId(data: { netId: number }) {
    dispatch({
      type: UPDATE_NET_ID,
      ...data,
    });
  }

  return (
    // Provide state and update functions to the context consumers
    <Web3Context.Provider
      value={useMemo(
        () => ({
          state,
          updateAccount,
          updateNetId,
        }),
        [state] // Memoize the context value to avoid unnecessary re-renders
      )}
    >
      {children}
    </Web3Context.Provider>
  );
};

// Updater component to handle side effects related to account and network changes
export function Updater() {
  const { state, updateNetId } = useWeb3Context();

  useEffect(() => {
    if (state.web3) {
      // Subscribe to account changes using the web3 instance
      const unsubscribe = subscribeToAccount(state.web3, (error, account) => {
        if (error) {
          console.error(error);
        }
        // Reload page if the account changes
        if (account !== undefined && account !== state.account) {
          window.location.reload();
        }
      });

      return unsubscribe; // Clean up subscription on unmount
    }
  }, [state.web3, state.account]);

  useEffect(() => {
    if (state.web3) {
      // Subscribe to network ID changes using the web3 instance
      const unsubscribe = subscribeToNetId(state.web3, (error, netId) => {
        if (error) {
          console.error(error);
        }
        if (netId) {
          if (state.netId === 0) {
            updateNetId({ netId }); // Update network ID if it was initially 0
          } else if (netId !== state.netId) {
            window.location.reload(); // Reload page if the network ID changes
          }
        }
      });

      return unsubscribe; // Clean up subscription on unmount
    }
  }, [state.web3, state.netId, updateNetId]);

  return null; // This component doesn't render anything
}
