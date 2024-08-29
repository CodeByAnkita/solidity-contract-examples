//contracts/MacVentureToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// @author Ankita Virani
contract MacVentureToken is ERC20, AccessControl {

   bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

   constructor(uint256 initialSupply) ERC20("Mac Venture Token", "MAC") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);   
        _mint(msg.sender, initialSupply * 10 ** decimals());
   }

   function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
   }
}
