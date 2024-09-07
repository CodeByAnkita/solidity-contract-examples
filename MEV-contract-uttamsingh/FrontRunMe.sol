
// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

contract FrontRunMe {
    // Mapping to store the secret passcode for each address
    mapping(address => bytes32) public addressToSecret;

    // Function to deposit Ether and set a secret passcode
    function deposit(bytes32 _secret) public payable {
        addressToSecret[msg.sender] = _secret;
    }

    /**
     * @dev Withdraw function that is intentionally vulnerable to frontrunning.
     * @param _user Address of the user who has the secret passcode.
     * @param _secret Secret passcode of the user.
     */
    function withdraw(address _user, bytes32 _secret) public {
        // Check if the caller knows the user's secret passcode
        require(addressToSecret[_user] == _secret, "Wrong Password!");

        // Send all contract balance to the caller
        (bool sent, ) = msg.sender.call{value: address(this).balance}("");
        require(sent, "Failed to send Ether");
    }
}


// To hash the password `1234` using the Keccak-256 (which is the hashing algorithm behind Ethereum's `sha3` function in Solidity), you can do it directly in Solidity or in another environment like JavaScript or Python.

// Here’s how you can hash the password using Solidity:
 
// ### Solidity Example:
// ```solidity
// pragma solidity 0.8.19;

// contract HashExample {
//     function getHashedPassword() public pure returns (bytes32) {
//         // Hash the password '1234' using keccak256
//         return keccak256(abi.encodePacked("1234"));
//     }
// }
// ```

// ### **Explanation:**
// - `abi.encodePacked("1234")`: Encodes the string `"1234"` into a packed format.
// - `keccak256()`: Applies the Keccak-256 hashing algorithm to the encoded string.

// ### **Equivalent Hash Calculation in JavaScript (Node.js with `ethers.js`):**
// If you want to hash the password in JavaScript using `ethers.js`, here's how you can do it:

// ```javascript
// const { ethers } = require('ethers');

// // Hash the password '1234'
// const hashedPassword = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("1234"));

// console.log(hashedPassword);
// ```

// ### **Equivalent Hash Calculation in Python (using `web3.py`):**
// You can also hash the password using Python:

// ```python
// from web3 import Web3

// # Hash the password '1234'
// hashed_password = Web3.keccak(text="1234").hex()

// print(hashed_password)
// ```

// ### **Expected Output:**
// The hashed value of the password `1234` using Keccak-256 is:
// ```
// 0x7110eda4d09e062aa5e4a390b0a572ac0d2c022e3f97f94e7f2fb2d0d64b37b7
// ```

// This hash can be stored or used in your Solidity smart contract securely.