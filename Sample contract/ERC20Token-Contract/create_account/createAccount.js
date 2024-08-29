//create_account//createAccount.js
// Web3 docs https://web3js.readthedocs.io/en/v1.8.1/index.html
const { Web3 } = require('web3');  // Corrected import
const web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");

async function main() {
    const account = web3.eth.accounts.create(web3.utils.randomHex(32));
    console.log(account);
}

main();
//write this command and get this private key output
// PS C: \Code\solidity - contract - examples\Sample contract\ERC20Token - Contract > node create_account / createAccount.js
