// Import chai and chai-as-promised for assertions and promise support
const chai = require("chai");
chai.use(require("chai-as-promised"));

const expect = chai.expect;

// Import the MultiSigWallet smart contract
const MultiSigWallet = artifacts.require("MultiSigWallet");

contract("MultiSigWallet", (accounts) => {
  // Define the owners of the multisig wallet and the number of confirmations required
  const owners = [accounts[0], accounts[1], accounts[2]];
  const NUM_CONFIRMATIONS_REQUIRED = 2;

  let wallet;
  beforeEach(async () => {
    // Deploy a new instance of the MultiSigWallet contract before each test
    wallet = await MultiSigWallet.new(owners, NUM_CONFIRMATIONS_REQUIRED);
  });

  // Test the constructor functionality
  describe("constructor", () => {
    it("should deploy", async () => {
      // Deploy a new wallet and verify that owners and required confirmations are set correctly
      const wallet = await MultiSigWallet.new(
        owners,
        NUM_CONFIRMATIONS_REQUIRED
      );

      for (let i = 0; i < owners.length; i++) {
        assert.equal(await wallet.owners(i), owners[i]);
      }

      assert.equal(
        await wallet.numConfirmationsRequired(),
        NUM_CONFIRMATIONS_REQUIRED
      );
    });

    it("should reject if no owners", async () => {
      // Expect an error when deploying a wallet with no owners
      await expect(MultiSigWallet.new([], NUM_CONFIRMATIONS_REQUIRED)).to.be
        .rejected;
    });

    it("should reject if num conf required > owners", async () => {
      // Expect an error when required confirmations exceed the number of owners
      await expect(MultiSigWallet.new(owners, owners.length + 1)).to.be
        .rejected;
    });

    it("should reject if owners not unique", async () => {
      // Expect an error when duplicate owners are provided
      await expect(
        MultiSigWallet.new([owners[0], owners[0]], NUM_CONFIRMATIONS_REQUIRED)
      ).to.be.rejected;
    });
  });

  // Test the fallback function for receiving ether
  describe("fallback", async () => {
    it("should receive ether", async () => {
      // Send a transaction to the wallet and verify that the Deposit event is emitted
      const { logs } = await wallet.sendTransaction({
        from: accounts[0],
        value: 1,
      });

      assert.equal(logs[0].event, "Deposit");
      assert.equal(logs[0].args.sender, accounts[0]);
      assert.equal(logs[0].args.amount, 1);
      assert.equal(logs[0].args.balance, 1);
    });
  });

  // Test submitting a transaction
  describe("submitTransaction", () => {
    const to = accounts[3];
    const value = 0;
    const data = "0x0123";

    it("should submit transaction", async () => {
      // Submit a transaction and verify the event and transaction details
      const { logs } = await wallet.submitTransaction(to, value, data, {
        from: owners[0],
      });

      assert.equal(logs[0].event, "SubmitTransaction");
      assert.equal(logs[0].args.owner, owners[0]);
      assert.equal(logs[0].args.txIndex, 0);
      assert.equal(logs[0].args.to, to);
      assert.equal(logs[0].args.value, value);
      assert.equal(logs[0].args.data, data);

      assert.equal(await wallet.getTransactionCount(), 1);

      const tx = await wallet.getTransaction(0);
      assert.equal(tx.to, to);
      assert.equal(tx.value, value);
      assert.equal(tx.data, data);
      assert.equal(tx.numConfirmations, 0);
      assert.equal(tx.executed, false);
    });

    it("should reject if not owner", async () => {
      // Expect an error when a non-owner tries to submit a transaction
      await expect(
        wallet.submitTransaction(to, value, data, {
          from: accounts[3],
        })
      ).to.be.rejected;
    });
  });

  // Test confirming a transaction
  describe("confirmTransaction", () => {
    beforeEach(async () => {
      // Submit a transaction before each test
      const to = accounts[3];
      const value = 0;
      const data = "0x0123";

      await wallet.submitTransaction(to, value, data);
    });

    it("should confirm", async () => {
      // Confirm the transaction and verify the event and transaction details
      const { logs } = await wallet.confirmTransaction(0, {
        from: owners[0],
      });

      assert.equal(logs[0].event, "ConfirmTransaction");
      assert.equal(logs[0].args.owner, owners[0]);
      assert.equal(logs[0].args.txIndex, 0);

      const tx = await wallet.getTransaction(0);
      assert.equal(tx.numConfirmations, 1);
    });

    it("should reject if not owner", async () => {
      // Expect an error when a non-owner tries to confirm a transaction
      await expect(
        wallet.confirmTransaction(0, {
          from: accounts[3],
        })
      ).to.be.rejected;
    });

    it("should reject if tx does not exist", async () => {
      // Expect an error when confirming a non-existent transaction
      await expect(
        wallet.confirmTransaction(1, {
          from: owners[0],
        })
      ).to.be.rejected;
    });

    it("should reject if already confirmed", async () => {
      // Expect an error when trying to confirm an already confirmed transaction
      await wallet.confirmTransaction(0, {
        from: owners[0],
      });

      await expect(
        wallet.confirmTransaction(0, {
          from: owners[0],
        })
      ).to.be.rejected;
    });
  });

  // Test executing a transaction
  describe("executeTransaction", () => {
    const to = accounts[3];
    const value = 0;
    const data = "0x0";

    beforeEach(async () => {
      // Submit and confirm the transaction before each test
      await wallet.submitTransaction(to, value, data);
      await wallet.confirmTransaction(0, { from: owners[0] });
      await wallet.confirmTransaction(0, { from: owners[1] });
    });

    it("should execute", async () => {
      // Execute the transaction and verify the event and transaction details
      const { logs } = await wallet.executeTransaction(0);

      assert.equal(logs[0].event, "ExecuteTransaction");
      assert.equal(logs[0].args.owner, owners[0]);
      assert.equal(logs[0].args.txIndex, 0);

      const tx = await wallet.getTransaction(0);
      assert.equal(tx.executed, true);
    });

    it("should reject if already executed", async () => {
      // Expect an error when trying to execute an already executed transaction
      await wallet.executeTransaction(0, {
        from: owners[0],
      });

      await expect(
        wallet.executeTransaction(0, {
          from: owners[0],
        })
      ).to.be.rejected;
    });

    it("should reject if not owner", async () => {
      // Expect an error when a non-owner tries to execute a transaction
      await expect(
        wallet.executeTransaction(0, {
          from: accounts[3],
        })
      ).to.be.rejected;
    });

    it("should reject if tx does not exist", async () => {
      // Expect an error when executing a non-existent transaction
      await expect(
        wallet.executeTransaction(1, {
          from: owners[0],
        })
      ).to.be.rejected;
    });
  });

  // Test revoking a confirmation
  describe("revokeConfirmation", async () => {
    beforeEach(async () => {
      // Submit and confirm the transaction before each test
      const to = accounts[3];
      const value = 0;
      const data = "0x0";

      await wallet.submitTransaction(to, value, data);
      await wallet.confirmTransaction(0, { from: owners[0] });
    });

    it("should revoke confirmation", async () => {
      // Revoke confirmation and verify the event and transaction details
      const { logs } = await wallet.revokeConfirmation(0, {
        from: owners[0],
      });

      assert.equal(logs[0].event, "RevokeConfirmation");
      assert.equal(logs[0].args.owner, owners[0]);
      assert.equal(logs[0].args.txIndex, 0);

      assert.equal(await wallet.isConfirmed(0, owners[0]), false);

      const tx = await wallet.getTransaction(0);
      assert.equal(tx.numConfirmations, 0);
    });

    it("should reject if not owner", async () => {
      // Expect an error when a non-owner tries to revoke a confirmation
      await expect(
        wallet.revokeConfirmation(0, {
          from: accounts[3],
        })
      ).to.be.rejected;
    });

    it("should reject if tx does not exist", async () => {
      // Expect an error when revoking a non-existent transaction
      await expect(
        wallet.revokeConfirmation(1, {
          from: owners[0],
        })
      ).to.be.rejected;
    });
  });

  // Test retrieving owners
  describe("getOwners", () => {
    it("should return owners", async () => {
      // Verify that the owners returned match the expected owners
      assert.deepEqual(await wallet.getOwners(), owners);
    });
  });

  // Test retrieving transaction count
  describe("getTransactionCount", () => {
    it("should return transaction count", async () => {
      // Verify that the transaction count matches the number of submitted transactions
      assert.equal(await wallet.getTransactionCount(), 0);

      await wallet.submitTransaction(accounts[3], 0, "0x0123", {
        from: owners[0],
      });

      assert.equal(await wallet.getTransactionCount(), 1);
    });
  });

  // Test retrieving transactions
  describe("getTransaction", () => {
    it("should return transaction", async () => {
      // Submit a transaction and verify that it matches the expected transaction details
      await wallet.submitTransaction(accounts[3], 0, "0x0123", {
        from: owners[0],
      });

      const tx = await wallet.getTransaction(0);
      assert.equal(tx.to, accounts[3]);
      assert.equal(tx.value, 0);
      assert.equal(tx.data, "0x0123");
    });
  });
});
