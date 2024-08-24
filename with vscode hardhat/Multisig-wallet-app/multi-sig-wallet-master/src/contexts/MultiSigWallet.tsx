import Web3 from "web3";
import BN from "bn.js";
import React, {
  useReducer,
  useEffect,
  createContext,
  useContext,
  useMemo,
} from "react";
import { useWeb3Context } from "./Web3";
import { get as getMultiSigWallet, subscribe } from "../api/multi-sig-wallet";

// Define the state interface for managing multi-signature wallet data
interface State {
  address: string;
  balance: string;
  owners: string[];
  numConfirmationsRequired: number;
  transactionCount: number;
  transactions: Transaction[];
}

// Define the transaction interface for handling individual transactions
interface Transaction {
  txIndex: number;
  to: string;
  value: BN;
  data: string;
  executed: boolean;
  numConfirmations: number;
  isConfirmedByCurrentAccount: boolean;
}

// Initial state with default values for the multi-signature wallet
const INITIAL_STATE: State = {
  address: "",
  balance: "0",
  owners: [],
  numConfirmationsRequired: 0,
  transactionCount: 0,
  transactions: [],
};

// Define action types for the reducer
const SET = "SET";
const UPDATE_BALANCE = "UPDATE_BALANCE";
const ADD_TX = "ADD_TX";
const UPDATE_TX = "UPDATE_TX";

// Interfaces for each action type to ensure type safety
interface Set {
  type: "SET";
  data: {
    address: string;
    balance: string;
    owners: string[];
    numConfirmationsRequired: number;
    transactionCount: number;
    transactions: Transaction[];
  };
}

interface UpdateBalance {
  type: "UPDATE_BALANCE";
  data: {
    balance: string;
  };
}

interface AddTx {
  type: "ADD_TX";
  data: {
    txIndex: string;
    to: string;
    value: string;
    data: string;
  };
}

interface UpdateTx {
  type: "UPDATE_TX";
  data: {
    account: string;
    txIndex: string;
    owner: string;
    executed?: boolean;
    confirmed?: boolean;
  };
}

// Union type for all possible actions
type Action = Set | UpdateBalance | AddTx | UpdateTx;

// Reducer function to handle state updates based on dispatched actions
function reducer(state: State = INITIAL_STATE, action: Action) {
  switch (action.type) {
    // Handles the SET action to update the entire state
    case SET: {
      return {
        ...state,
        ...action.data,
      };
    }
    // Handles the UPDATE_BALANCE action to update the wallet balance
    case UPDATE_BALANCE: {
      return {
        ...state,
        balance: action.data.balance,
      };
    }
    // Handles the ADD_TX action to add a new transaction
    case ADD_TX: {
      const {
        data: { txIndex, to, value, data },
      } = action;

      const transactions = [
        {
          txIndex: parseInt(txIndex),
          to,
          value: Web3.utils.toBN(value),
          data,
          executed: false,
          numConfirmations: 0,
          isConfirmedByCurrentAccount: false,
        },
        ...state.transactions,
      ];

      return {
        ...state,
        transactionCount: state.transactionCount + 1,
        transactions,
      };
    }
    // Handles the UPDATE_TX action to update an existing transaction's status
    case UPDATE_TX: {
      const { data } = action;

      const txIndex = parseInt(data.txIndex);

      const transactions = state.transactions.map((tx) => {
        if (tx.txIndex === txIndex) {
          const updatedTx = {
            ...tx,
          };

          if (data.executed) {
            updatedTx.executed = true;
          }
          if (data.confirmed !== undefined) {
            if (data.confirmed) {
              updatedTx.numConfirmations += 1;
              updatedTx.isConfirmedByCurrentAccount =
                data.owner === data.account;
            } else {
              updatedTx.numConfirmations -= 1;
              if (data.owner === data.account) {
                updatedTx.isConfirmedByCurrentAccount = false;
              }
            }
          }

          return updatedTx;
        }
        return tx;
      });

      return {
        ...state,
        transactions,
      };
    }
    default:
      return state;
  }
}

// Input interfaces for the various action functions
interface SetInputs {
  address: string;
  balance: string;
  owners: string[];
  numConfirmationsRequired: number;
  transactionCount: number;
  transactions: Transaction[];
}

interface UpdateBalanceInputs {
  balance: string;
}

interface AddTxInputs {
  txIndex: string;
  to: string;
  value: string;
  data: string;
}

interface UpdateTxInputs {
  account: string;
  txIndex: string;
  owner: string;
  confirmed?: boolean;
  executed?: boolean;
}

// Create a context for the multi-signature wallet
const MultiSigWalletContext = createContext({
  state: INITIAL_STATE,
  set: (_data: SetInputs) => { },
  updateBalance: (_data: UpdateBalanceInputs) => { },
  addTx: (_data: AddTxInputs) => { },
  updateTx: (_data: UpdateTxInputs) => { },
});

// Hook to use the MultiSigWalletContext
export function useMultiSigWalletContext() {
  return useContext(MultiSigWalletContext);
}

interface ProviderProps { }

// Provider component that manages the state and actions for the multi-signature wallet
export const Provider: React.FC<ProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  // Function to set the wallet state
  function set(data: SetInputs) {
    dispatch({
      type: SET,
      data,
    });
  }

  // Function to update the wallet balance
  function updateBalance(data: UpdateBalanceInputs) {
    dispatch({
      type: UPDATE_BALANCE,
      data,
    });
  }

  // Function to add a new transaction
  function addTx(data: AddTxInputs) {
    dispatch({
      type: ADD_TX,
      data,
    });
  }

  // Function to update an existing transaction
  function updateTx(data: UpdateTxInputs) {
    dispatch({
      type: UPDATE_TX,
      data,
    });
  }

  // Providing context with state and action functions
  return (
    <MultiSigWalletContext.Provider
      value={useMemo(
        () => ({
          state,
          set,
          updateBalance,
          addTx,
          updateTx,
        }),
        [state]
      )}
    >
      {children}
    </MultiSigWalletContext.Provider>
  );
};

// Updater component to fetch and subscribe to multi-signature wallet events
export function Updater() {
  const {
    state: { web3, account },
  } = useWeb3Context();
  const {
    state,
    set,
    updateBalance,
    addTx,
    updateTx,
  } = useMultiSigWalletContext();

  // Effect to fetch wallet data when web3 or account changes
  useEffect(() => {
    async function get(web3: Web3, account: string) {
      try {
        const data = await getMultiSigWallet(web3, account);
        set(data);
      } catch (error) {
        console.error(error);
      }
    }

    if (web3) {
      get(web3, account);
    }
  }, [web3]);

  // Effect to subscribe to wallet events and update state accordingly
  useEffect(() => {
    if (web3 && state.address) {
      return subscribe(web3, state.address, (error, log) => {
        if (error) {
          console.error(error);
        } else if (log) {
          switch (log.event) {
            // Handle balance updates
            case "Deposit":
              updateBalance(log.returnValues);
              break;
            // Handle new transaction submissions
            case "SubmitTransaction":
              addTx(log.returnValues);
              break;
            // Handle transaction confirmations
            case "ConfirmTransaction":
              updateTx({
                ...log.returnValues,
                confirmed: true,
                account,
              });
              break;
            // Handle transaction confirmation revocations
            case "RevokeConfirmation":
              updateTx({
                ...log.returnValues,
                confirmed: false,
                account,
              });
              break;
            // Handle transaction executions
            case "ExecuteTransaction":
              updateTx({
                ...log.returnValues,
                executed: true,
                account,
              });
              break;
            default:
              console.log(log);
          }
        }
      });
    }
  }, [web3, state.address]);
  return null;
}
