pragma solidity ^0.5.16;

// The MultiSigWallet contract allows multiple owners to manage funds jointly.
contract MultiSigWallet {
    // Events for logging activities within the contract
    event Deposit(address indexed sender, uint amount, uint balance);
    event SubmitTransaction(
        address indexed owner,
        uint indexed txIndex,
        address indexed to,
        uint value,
        bytes data
    );
    event ConfirmTransaction(address indexed owner, uint indexed txIndex);
    event RevokeConfirmation(address indexed owner, uint indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint indexed txIndex);

    // State variables
    address[] public owners; // List of wallet owners
    mapping(address => bool) public isOwner; // Mapping to check if an address is an owner
    uint public numConfirmationsRequired; // Number of confirmations required for a transaction

    // Struct to represent a transaction
    struct Transaction {
        address to; // Transaction recipient
        uint value; // Amount of Ether to send
        bytes data; // Data to be sent with the transaction
        bool executed; // Whether the transaction has been executed
        mapping(address => bool) isConfirmed; // Mapping of confirmations by owners
        uint numConfirmations; // Number of confirmations received
    }

    // Array to store transactions
    Transaction[] public transactions;

    // Modifiers to restrict access and ensure certain conditions
    modifier onlyOwner() {
        require(isOwner[msg.sender], "not owner");
        _;
    }

    modifier txExists(uint _txIndex) {
        require(_txIndex < transactions.length, "tx does not exist");
        _;
    }

    modifier notExecuted(uint _txIndex) {
        require(!transactions[_txIndex].executed, "tx already executed");
        _;
    }

    modifier notConfirmed(uint _txIndex) {
        require(!transactions[_txIndex].isConfirmed[msg.sender], "tx already confirmed");
        _;
    }

    /*
    Constructor to initialize the wallet
    - Validates input parameters
    - Sets owners and the required number of confirmations
    */
    constructor(address[] memory _owners, uint _numConfirmationsRequired) public {
        require(_owners.length > 0, "owners required");
        require(
            _numConfirmationsRequired > 0 && _numConfirmationsRequired <= _owners.length,
            "invalid number of required confirmations"
        );

        // Iterate over the owners array to set state variables
        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];

            require(owner != address(0), "invalid owner");
            require(!isOwner[owner], "owner not unique");

            isOwner[owner] = true;
            owners.push(owner);
        }

        numConfirmationsRequired = _numConfirmationsRequired;
    }

    /*
    Fallback function to receive Ether
    - Emits a Deposit event whenever Ether is received
    */
    function () payable external {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    /*
    Function to submit a transaction
    - Creates a new Transaction struct and appends it to the transactions array
    - Emits a SubmitTransaction event
    */
    function submitTransaction(address _to, uint _value, bytes memory _data)
        public
        onlyOwner
    {
        uint txIndex = transactions.length;

        transactions.push(Transaction({
            to: _to,
            value: _value,
            data: _data,
            executed: false,
            numConfirmations: 0
        }));

        emit SubmitTransaction(msg.sender, txIndex, _to, _value, _data);
    }

    /*
    Function to confirm a transaction
    - Requires that the transaction exists, is not executed, and is not already confirmed by the caller
    - Updates the confirmation status and emits a ConfirmTransaction event
    */
    function confirmTransaction(uint _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
        notConfirmed(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];

        transaction.isConfirmed[msg.sender] = true;
        transaction.numConfirmations += 1;

        emit ConfirmTransaction(msg.sender, _txIndex);
    }

    /*
    Function to execute a transaction
    - Requires the number of confirmations to be greater than or equal to numConfirmationsRequired
    - Executes the transaction using a low-level call and requires success
    - Emits an ExecuteTransaction event
    */
    function executeTransaction(uint _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];

        require(
            transaction.numConfirmations >= numConfirmationsRequired,
            "cannot execute tx"
        );

        transaction.executed = true;

        (bool success, ) = transaction.to.call.value(transaction.value)(transaction.data);
        require(success, "tx failed");

        emit ExecuteTransaction(msg.sender, _txIndex);
    }

    /*
    Function to revoke a confirmation
    - Requires that the transaction exists and is not executed
    - Requires that the caller has confirmed the transaction
    - Updates the confirmation status and emits a RevokeConfirmation event
    */
    function revokeConfirmation(uint _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];

        require(transaction.isConfirmed[msg.sender], "tx not confirmed");

        transaction.isConfirmed[msg.sender] = false;
        transaction.numConfirmations -= 1;

        emit RevokeConfirmation(msg.sender, _txIndex);
    }

    // Getter function to retrieve the list of owners
    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    // Getter function to retrieve the total number of transactions
    function getTransactionCount() public view returns (uint) {
        return transactions.length;
    }

    // Getter function to retrieve details of a specific transaction
    function getTransaction(uint _txIndex)
        public
        view
        returns (address to, uint value, bytes memory data, bool executed, uint numConfirmations)
    {
        Transaction storage transaction = transactions[_txIndex];

        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.numConfirmations
        );
    }

    // Function to check if a transaction is confirmed by a specific owner
    function isConfirmed(uint _txIndex, address _owner)
        public
        view
        returns (bool)
    {
        Transaction storage transaction = transactions[_txIndex];

        return transaction.isConfirmed[_owner];
    }
}
